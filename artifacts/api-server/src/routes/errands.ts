import { Router } from "express";
import { db } from "@workspace/db";
import { errandsTable, helpersTable, notificationsTable } from "@workspace/db";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
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
} from "@workspace/api-zod";

const router = Router();

function formatErrand(e: typeof errandsTable.$inferSelect) {
  return {
    ...e,
    budgetAmount: e.budgetAmount ? Number(e.budgetAmount) : null,
    paidAmount: e.paidAmount ? Number(e.paidAmount) : null,
    platformFee: e.platformFee ? Number(e.platformFee) : null,
    paidAt: e.paidAt ? e.paidAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
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

  return res.json(rows.map(formatErrand));
});

router.post("/errands", async (req, res) => {
  const parsed = CreateErrandBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error });
  }
  const { budgetAmount, ...rest } = parsed.data;
  const [row] = await db
    .insert(errandsTable)
    .values({ ...rest, budgetAmount: budgetAmount != null ? String(budgetAmount) : null })
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

  return res.status(201).json(formatErrand(row));
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
  return res.json(rows.map(formatErrand));
});

router.get("/errands/:id", async (req, res) => {
  const parsed = GetErrandParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [row] = await db.select().from(errandsTable).where(eq(errandsTable.id, parsed.data.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(formatErrand(row));
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
  return res.json(formatErrand(row));
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

  const [row] = await db
    .update(errandsTable)
    .set({ status: "accepted", helperId: bodyParsed.data.helperId, helperName: helper.name, updatedAt: new Date() })
    .where(eq(errandsTable.id, paramParsed.data.id))
    .returning();

  if (!row) return res.status(404).json({ error: "Errand not found" });
  return res.json(formatErrand(row));
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

  return res.json(formatErrand(row));
});

export default router;
