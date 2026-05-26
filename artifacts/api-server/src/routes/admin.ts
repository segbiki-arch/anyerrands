import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable, errandsTable, helpersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
const VALID_STATUSES = ["pending", "reviewed", "resolved"] as const;
type ReportStatus = (typeof VALID_STATUSES)[number];

const router = Router();

router.get("/admin/reports", async (req, res) => {
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

router.patch("/admin/reports/:id", async (req, res) => {
  const reportId = parseInt(req.params.id, 10);
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

export default router;
