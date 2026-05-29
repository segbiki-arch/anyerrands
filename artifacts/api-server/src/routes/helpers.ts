import { Router } from "express";
import { db } from "@workspace/db";
import { helpersTable, errandsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateHelperBody,
  GetHelperParams,
  UpdateHelperParams,
  UpdateHelperBody,
  GetHelperErrandsParams,
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

router.patch("/helpers/:id", async (req, res) => {
  const paramParsed = UpdateHelperParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = UpdateHelperBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const { rating, ...rest } = bodyParsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (rating !== undefined) updates.rating = String(rating);

  const [row] = await db
    .update(helpersTable)
    .set(updates)
    .where(eq(helpersTable.id, paramParsed.data.id))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(formatHelper(row));
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

export default router;
