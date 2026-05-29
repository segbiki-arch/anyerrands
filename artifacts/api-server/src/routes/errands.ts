import { Router } from "express";
import { db } from "@workspace/db";
import { errandsTable, helpersTable, notificationsTable, reviewsTable } from "@workspace/db";
import { eq, desc, and, sql, ilike, avg, count } from "drizzle-orm";
import {
  ListErrandsQueryParams,
  CreateErrandBody,
  GetErrandParams,
  UpdateErrandParams,
  UpdateErrandBody,
  DeleteErrandParams,
  AcceptErrandParams,
  AcceptErrandBody,
  CompleteErrandParams,
  GetRecentErrandsQueryParams,
  CreateReviewParams,
  CreateReviewBody,
} from "@workspace/api-zod";
import { isHelperChargesEnabled } from "../lib/stripeStatus";

const router = Router();

function formatErrand(e: typeof errandsTable.$inferSelect, currentUserId?: string) {
  const isOpen = e.status === "open";
  return {
    ...e,
    requesterAddress: isOpen ? null : e.requesterAddress,
    requesterPhone: isOpen ? null : e.requesterPhone,
    budgetAmount: e.budgetAmount ? Number(e.budgetAmount) : null,
    paidAmount: e.paidAmount ? Number(e.paidAmount) : null,
    platformFee: e.platformFee ? Number(e.platformFee) : null,
    paidAt: e.paidAt ? e.paidAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
    isRequester: !!currentUserId && e.requesterUserId === currentUserId,
  };
}

router.get("/errands", async (req, res) => {
  const parsed = ListErrandsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { status, category, limit = 20, offset = 0 } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(errandsTable.status, status as "open" | "accepted" | "completed"));
  if (category) conditions.push(eq(errandsTable.category, category));

  const rows = await db
    .select()
    .from(errandsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(errandsTable.createdAt))
    .limit(limit)
    .offset(offset);

  return res.json(rows.map((r) => formatErrand(r, req.user?.id)));
});

router.post("/errands", async (req, res) => {
  const parsed = CreateErrandBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error });
  }
  const { budgetAmount, requesterAddress, requesterPhone, tripFrom, tripTo, tripWhen, ...rest } = parsed.data;
  const cleanText = (v: string | undefined) => (v?.trim() ? v.trim() : null);
  const [row] = await db
    .insert(errandsTable)
    .values({
      ...rest,
      requesterUserId: req.user?.id ?? null,
      requesterAddress: cleanText(requesterAddress),
      requesterPhone: cleanText(requesterPhone),
      budgetAmount: budgetAmount != null ? String(budgetAmount) : null,
      tripFrom: cleanText(tripFrom),
      tripTo: cleanText(tripTo),
      tripWhen: cleanText(tripWhen),
    })
    .returning();

  // Fire notifications to available helpers in the same area
  const locationKeyword = rest.requesterLocation.split(",")[0].trim();
  const nearbyHelpers = await db
    .select({ id: helpersTable.id })
    .from(helpersTable)
    .where(and(eq(helpersTable.available, true), ilike(helpersTable.location, `%${locationKeyword}%`)));

  if (nearbyHelpers.length > 0) {
    await db.insert(notificationsTable).values(
      nearbyHelpers.map((h) => ({
        helperId: h.id,
        errandId: row.id,
        message: `New errand in ${locationKeyword}: "${row.title}"`,
      }))
    );
  }

  return res.status(201).json(formatErrand(row, req.user?.id));
});

router.get("/errands/stats/summary", async (req, res) => {
  const rows = await db
    .select({ status: errandsTable.status, count: sql<number>`count(*)::int` })
    .from(errandsTable)
    .groupBy(errandsTable.status);

  const stats = { totalOpen: 0, totalAccepted: 0, totalCompleted: 0, totalErrands: 0, topCategory: null as string | null };
  for (const r of rows) {
    if (r.status === "open") stats.totalOpen = r.count;
    else if (r.status === "accepted") stats.totalAccepted = r.count;
    else if (r.status === "completed") stats.totalCompleted = r.count;
    stats.totalErrands += r.count;
  }

  const catRow = await db
    .select({ category: errandsTable.category, count: sql<number>`count(*)::int` })
    .from(errandsTable)
    .groupBy(errandsTable.category)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  stats.topCategory = catRow[0]?.category ?? null;
  return res.json(stats);
});

router.get("/errands/recent", async (req, res) => {
  const parsed = GetRecentErrandsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 5) : 5;
  const rows = await db
    .select()
    .from(errandsTable)
    .orderBy(desc(errandsTable.createdAt))
    .limit(limit);
  return res.json(rows.map((r) => formatErrand(r, req.user?.id)));
});

router.get("/errands/:id", async (req, res) => {
  const parsed = GetErrandParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [row] = await db.select().from(errandsTable).where(eq(errandsTable.id, parsed.data.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(formatErrand(row, req.user?.id));
});

router.patch("/errands/:id", async (req, res) => {
  const paramParsed = UpdateErrandParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = UpdateErrandBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const { budgetAmount, ...rest } = bodyParsed.data;
  const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (budgetAmount !== undefined) updates.budgetAmount = budgetAmount != null ? String(budgetAmount) : null;

  const [row] = await db
    .update(errandsTable)
    .set(updates)
    .where(eq(errandsTable.id, paramParsed.data.id))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(formatErrand(row, req.user?.id));
});

router.delete("/errands/:id", async (req, res) => {
  const parsed = DeleteErrandParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(errandsTable).where(eq(errandsTable.id, parsed.data.id));
  return res.status(204).send();
});

router.post("/errands/:id/accept", async (req, res) => {
  const paramParsed = AcceptErrandParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = AcceptErrandBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, bodyParsed.data.helperId));
  if (!helper) return res.status(404).json({ error: "Helper not found" });

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, paramParsed.data.id));
  if (!errand) return res.status(404).json({ error: "Errand not found" });

  // For paid errands, the helper must have a working Stripe payout account
  // before accepting — otherwise the requester's payment cannot be routed to
  // them and the 10% platform fee cannot be split correctly.
  if (errand.budgetAmount && Number(errand.budgetAmount) > 0) {
    const ready = await isHelperChargesEnabled(helper);
    if (!ready) {
      return res.status(400).json({
        error:
          "Please connect your payout account before accepting a paid errand. Go to your helper profile and set up payouts so you get paid and the platform fee is handled correctly.",
      });
    }
  }

  const [row] = await db
    .update(errandsTable)
    .set({ status: "accepted", helperId: bodyParsed.data.helperId, helperName: helper.name, updatedAt: new Date() })
    .where(eq(errandsTable.id, paramParsed.data.id))
    .returning();

  if (!row) return res.status(404).json({ error: "Errand not found" });
  return res.json(formatErrand(row, req.user?.id));
});

router.post("/errands/:id/complete", async (req, res) => {
  const parsed = CompleteErrandParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, parsed.data.id));
  if (!errand) return res.status(404).json({ error: "Not found" });

  // Block completion of paid errands until payment is confirmed
  if (errand.budgetAmount && Number(errand.budgetAmount) > 0 && errand.paymentStatus !== "paid") {
    return res.status(400).json({
      error: "Payment not yet received. The requester must pay before this errand can be marked completed.",
    });
  }

  const [row] = await db
    .update(errandsTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(errandsTable.id, parsed.data.id))
    .returning();

  if (errand.helperId) {
    await db
      .update(helpersTable)
      .set({ errandsCompleted: sql`${helpersTable.errandsCompleted} + 1` })
      .where(eq(helpersTable.id, errand.helperId));
  }

  return res.json(formatErrand(row, req.user?.id));
});

router.post("/errands/:id/review", async (req, res) => {
  const paramParsed = CreateReviewParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = CreateReviewBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body", details: bodyParsed.error });

  if (!req.user) {
    return res.status(401).json({ error: "You must be logged in to leave a review." });
  }

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, paramParsed.data.id));
  if (!errand) return res.status(404).json({ error: "Errand not found" });

  if (errand.requesterUserId !== req.user.id) {
    return res.status(403).json({ error: "Only the person who posted this errand can review it." });
  }
  if (errand.status !== "completed") {
    return res.status(400).json({ error: "You can only review an errand once it's completed." });
  }
  if (!errand.helperId) {
    return res.status(400).json({ error: "This errand has no helper to review." });
  }

  const [existing] = await db.select().from(reviewsTable).where(eq(reviewsTable.errandId, errand.id));
  if (existing) {
    return res.status(400).json({ error: "This errand has already been reviewed." });
  }

  let review;
  try {
    [review] = await db
      .insert(reviewsTable)
      .values({
        errandId: errand.id,
        helperId: errand.helperId,
        reviewerName: bodyParsed.data.reviewerName,
        rating: bodyParsed.data.rating,
        comment: bodyParsed.data.comment ?? null,
      })
      .returning();
  } catch (err) {
    // Unique constraint on errand_id — another review landed first (race).
    if ((err as { code?: string }).code === "23505") {
      return res.status(400).json({ error: "This errand has already been reviewed." });
    }
    throw err;
  }

  if (!review) {
    return res.status(400).json({ error: "This errand has already been reviewed." });
  }

  // Recompute the helper's average rating from all their reviews.
  const [agg] = await db
    .select({ avgRating: avg(reviewsTable.rating) })
    .from(reviewsTable)
    .where(eq(reviewsTable.helperId, errand.helperId));

  if (agg?.avgRating != null) {
    await db
      .update(helpersTable)
      .set({ rating: String(Number(agg.avgRating).toFixed(1)) })
      .where(eq(helpersTable.id, errand.helperId));
  }

  return res.status(201).json({
    ...review,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
