import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    ...n,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", async (req, res) => {
  const helperId = req.query.helperId ? Number(req.query.helperId) : undefined;
  const unreadOnly = req.query.unreadOnly === "true";

  const conditions = [];
  if (helperId != null) conditions.push(eq(notificationsTable.helperId, helperId));
  if (unreadOnly) conditions.push(eq(notificationsTable.read, false));

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  return res.json(rows.map(formatNotification));
});

router.patch("/notifications/mark-all-read", async (req, res) => {
  const { helperId } = req.body as { helperId?: number };
  if (!helperId) return res.status(400).json({ error: "helperId required" });

  const rows = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.helperId, helperId), eq(notificationsTable.read, false)))
    .returning();

  return res.json({ updated: rows.length });
});

router.patch("/notifications/:id/read", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [row] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, id))
    .returning();

  if (!row) return res.status(404).json({ error: "Notification not found" });
  return res.json(formatNotification(row));
});

export default router;
