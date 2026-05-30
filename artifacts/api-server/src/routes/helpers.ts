import { Router } from "express";
import { db } from "@workspace/db";
import { helpersTable, errandsTable, reviewsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateHelperBody,
  GetHelperParams,
  UpdateHelperParams,
  UpdateHelperBody,
  GetHelperErrandsParams,
  GetHelperEarningsParams,
  GetHelperReviewsParams,
} from "@workspace/api-zod";

const router = Router();

function formatHelper(h: typeof helpersTable.$inferSelect, currentUserId?: string) {
  const { userId, ...rest } = h;
  return {
    ...rest,
    rating: h.rating ? Number(h.rating) : null,
    isOwner: !!currentUserId && userId === currentUserId,
    createdAt: h.createdAt.toISOString(),
  };
}

function formatErrand(e: typeof errandsTable.$inferSelect) {
  return {
    ...e,
    budgetAmount: e.budgetAmount ? Number(e.budgetAmount) : null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
  };
}

router.get("/helpers", async (req, res) => {
  const rows = await db.select().from(helpersTable).orderBy(desc(helpersTable.errandsCompleted));
  return res.json(rows.map((h) => formatHelper(h, req.user?.id)));
});

router.post("/helpers", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "You must be logged in to become a helper" });

  const parsed = CreateHelperBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error });

  // One helper profile per user — if they already have one, return it instead
  // of creating a duplicate (duplicates fragment earnings/Stripe across rows).
  const [existing] = await db.select().from(helpersTable).where(eq(helpersTable.userId, req.user.id));
  if (existing) return res.status(200).json(formatHelper(existing, req.user.id));

  const { name } = parsed.data;
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const [row] = await db
    .insert(helpersTable)
    .values({ ...parsed.data, userId: req.user.id, avatarInitials: initials })
    .returning();

  return res.status(201).json(formatHelper(row, req.user.id));
});

router.get("/helpers/:id", async (req, res) => {
  const parsed = GetHelperParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [row] = await db.select().from(helpersTable).where(eq(helpersTable.id, parsed.data.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(formatHelper(row, req.user?.id));
});

router.get("/helpers/:id/reviews", async (req, res) => {
  const parsed = GetHelperReviewsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const rows = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.helperId, parsed.data.id))
    .orderBy(desc(reviewsTable.createdAt));

  const reviews = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
      : null;

  return res.json({ averageRating, reviewCount, reviews });
});

router.patch("/helpers/:id", async (req, res) => {
  const paramParsed = UpdateHelperParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = UpdateHelperBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  if (!req.user) return res.status(401).json({ error: "You must be logged in to edit a profile." });

  // Only the profile owner may edit it — a profile is tied to its creator's
  // login, so neighbours can't change someone else's About Me, location, etc.
  const [existing] = await db.select().from(helpersTable).where(eq(helpersTable.id, paramParsed.data.id));
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (existing.userId !== req.user.id) {
    return res.status(403).json({ error: "You can only edit your own profile." });
  }

  // Only bio/location/skills/available are editable. Rating is computed from
  // community reviews and is intentionally not part of this contract.
  const updates: Record<string, unknown> = { ...bodyParsed.data };

  const [row] = await db
    .update(helpersTable)
    .set(updates)
    .where(eq(helpersTable.id, paramParsed.data.id))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(formatHelper(row, req.user.id));
});

router.get("/helpers/:id/errands", async (req, res) => {
  const parsed = GetHelperErrandsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const rows = await db
    .select()
    .from(errandsTable)
    .where(eq(errandsTable.helperId, parsed.data.id))
    .orderBy(desc(errandsTable.createdAt));
  return res.json(rows.map(formatErrand));
});

router.get("/helpers/:id/earnings", async (req, res) => {
  const parsed = GetHelperEarningsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  // Earnings are private — only the profile owner may view them.
  const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, parsed.data.id));
  if (!helper) return res.status(404).json({ error: "Not found" });
  if (!req.user || helper.userId !== req.user.id) {
    return res.status(403).json({ error: "You do not have access to these earnings" });
  }

  const rows = await db
    .select()
    .from(errandsTable)
    .where(and(eq(errandsTable.helperId, parsed.data.id), eq(errandsTable.paymentStatus, "paid")))
    .orderBy(desc(errandsTable.updatedAt));

  const jobs = rows.map((e) => {
    const paidAmount = e.paidAmount ? Number(e.paidAmount) : 0;
    const platformFee = e.platformFee ? Number(e.platformFee) : 0;
    return {
      errandId: e.id,
      title: e.title,
      paidAmount,
      platformFee,
      earned: Math.max(0, paidAmount - platformFee),
      completedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
    };
  });

  const totalPaidOut = jobs.reduce((s, j) => s + j.paidAmount, 0);
  const platformFeesPaid = jobs.reduce((s, j) => s + j.platformFee, 0);
  const totalEarned = jobs.reduce((s, j) => s + j.earned, 0);

  return res.json({
    totalEarned,
    totalPaidOut,
    platformFeesPaid,
    jobsCount: jobs.length,
    jobs,
  });
});

export default router;
