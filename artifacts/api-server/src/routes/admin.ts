import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable, errandsTable, helpersTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";
const VALID_STATUSES = ["pending", "reviewed", "resolved"] as const;
type ReportStatus = (typeof VALID_STATUSES)[number];

const router = Router();

router.get("/admin/reports", requireAdmin, async (req, res) => {
  const { status } = req.query as { status?: string };

  const rows = await db
    .select({
      id: reportsTable.id,
      errandId: reportsTable.errandId,
      helperId: reportsTable.helperId,
      reporterName: reportsTable.reporterName,
      reason: reportsTable.reason,
      description: reportsTable.description,
      status: reportsTable.status,
      createdAt: reportsTable.createdAt,
      errandTitle: errandsTable.title,
      helperName: helpersTable.name,
    })
    .from(reportsTable)
    .leftJoin(errandsTable, eq(reportsTable.errandId, errandsTable.id))
    .leftJoin(helpersTable, eq(reportsTable.helperId, helpersTable.id))
    .orderBy(reportsTable.createdAt);

  const filtered = status
    ? rows.filter((r) => r.status === status)
    : rows;

  return res.json(
    filtered.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
  );
});

router.patch("/admin/reports/:id", requireAdmin, async (req, res) => {
  const reportId = parseInt(String(req.params.id), 10);
  if (isNaN(reportId)) return res.status(400).json({ error: "Invalid report id" });

  const { status } = req.body as { status?: string };
  if (!status || !VALID_STATUSES.includes(status as ReportStatus)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const [updated] = await db
    .update(reportsTable)
    .set({ status: status as ReportStatus })
    .where(eq(reportsTable.id, reportId))
    .returning();

  if (!updated) return res.status(404).json({ error: "Report not found" });

  const [row] = await db
    .select({
      id: reportsTable.id,
      errandId: reportsTable.errandId,
      helperId: reportsTable.helperId,
      reporterName: reportsTable.reporterName,
      reason: reportsTable.reason,
      description: reportsTable.description,
      status: reportsTable.status,
      createdAt: reportsTable.createdAt,
      errandTitle: errandsTable.title,
      helperName: helpersTable.name,
    })
    .from(reportsTable)
    .leftJoin(errandsTable, eq(reportsTable.errandId, errandsTable.id))
    .leftJoin(helpersTable, eq(reportsTable.helperId, helpersTable.id))
    .where(eq(reportsTable.id, reportId));

  return res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

// List every helper profile with enough context to spot duplicates: how many
// errands reference it, whether it's tied to a login, and the owner's email.
router.get("/admin/helpers", requireAdmin, async (_req, res) => {
  const helpers = await db.select().from(helpersTable).orderBy(desc(helpersTable.createdAt));

  const errandCounts = await db
    .select({ helperId: errandsTable.helperId, errandCount: count() })
    .from(errandsTable)
    .groupBy(errandsTable.helperId);
  const countByHelper = new Map<number, number>();
  for (const c of errandCounts) {
    if (c.helperId != null) countByHelper.set(c.helperId, Number(c.errandCount));
  }

  const userIds = [...new Set(helpers.map((h) => h.userId).filter((v): v is string => !!v))];
  const emailByUser = new Map<string, string | null>();
  for (const uid of userIds) {
    const [u] = await db.select({ id: usersTable.id, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, uid));
    if (u) emailByUser.set(u.id, u.email);
  }

  return res.json(
    helpers.map((h) => ({
      id: h.id,
      name: h.name,
      location: h.location,
      errandsCompleted: h.errandsCompleted,
      errandCount: countByHelper.get(h.id) ?? 0,
      stripeConnected: !!h.stripeAccountId,
      ownerEmail: h.userId ? emailByUser.get(h.userId) ?? null : null,
      claimed: !!h.userId,
      createdAt: h.createdAt.toISOString(),
    })),
  );
});

// Delete a helper profile (used to clean up duplicates). Any errands that
// reference it are detached first so the foreign key does not block the delete.
router.delete("/admin/helpers/:id", requireAdmin, async (req, res) => {
  const helperId = parseInt(String(req.params.id), 10);
  if (isNaN(helperId)) return res.status(400).json({ error: "Invalid helper id" });

  const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, helperId));
  if (!helper) return res.status(404).json({ error: "Helper not found" });

  // notifications.helper_id and reports.helper_id are NOT NULL FKs, so they must
  // be removed before the helper can be deleted. errands.helper_id is nullable,
  // so those rows are detached (the errand itself is preserved). All wrapped in a
  // transaction so a failure can't leave a half-deleted state.
  await db.transaction(async (tx) => {
    await tx.delete(notificationsTable).where(eq(notificationsTable.helperId, helperId));
    await tx.delete(reportsTable).where(eq(reportsTable.helperId, helperId));
    await tx.update(errandsTable).set({ helperId: null }).where(eq(errandsTable.helperId, helperId));
    await tx.delete(helpersTable).where(eq(helpersTable.id, helperId));
  });

  return res.status(204).send();
});

// Headline numbers for the owner/admin overview: how many people have signed up,
// how many helper profiles exist, how many errands (split by status) and how many
// open reports need attention.
router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const [[users], [helpers], [reports], errandRows] = await Promise.all([
    db.select({ value: count() }).from(usersTable),
    db.select({ value: count() }).from(helpersTable),
    db.select({ value: count() }).from(reportsTable),
    db
      .select({ status: errandsTable.status, value: count() })
      .from(errandsTable)
      .groupBy(errandsTable.status),
  ]);

  const errandsByStatus = { open: 0, accepted: 0, completed: 0 };
  let totalErrands = 0;
  for (const row of errandRows) {
    const c = Number(row.value);
    totalErrands += c;
    if (row.status === "open") errandsByStatus.open = c;
    else if (row.status === "accepted") errandsByStatus.accepted = c;
    else if (row.status === "completed") errandsByStatus.completed = c;
  }

  return res.json({
    totalUsers: Number(users?.value ?? 0),
    totalHelpers: Number(helpers?.value ?? 0),
    totalReports: Number(reports?.value ?? 0),
    totalErrands,
    errandsByStatus,
  });
});

export default router;
