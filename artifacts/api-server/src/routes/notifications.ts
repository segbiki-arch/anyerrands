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

// A user's notifications are private. We always scope to the logged-in user
// (req.user.id) and ignore any client-supplied id, so nobody can read or alter
// someone else's notifications by guessing an id.
router.get("/notifications", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "You must be logged in." });
  const unreadOnly = req.query.unreadOnly === "true";

  const conditions = [eq(notificationsTable.userId, req.user.id)];
  if (unreadOnly) conditions.push(eq(notificationsTable.read, false));

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(and(...conditions))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  return res.json(rows.map(formatNotification));
});

router.patch("/notifications/mark-all-read", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "You must be logged in." });

  const rows = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.userId, req.user.id), eq(notificationsTable.read, false)))
    .returning();

  return res.json({ updated: rows.length });
});

router.patch("/notifications/:id/read", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "You must be logged in." });
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [row] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user.id)))
    .returning();

  if (!row) return res.status(404).json({ error: "Notification not found" });
  return res.json(formatNotification(row));
});

export default router;
