import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable, errandsTable, helpersTable, insertReportSchema, insertRequesterReportSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/errands/:id/report", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "You must be logged in to report a helper." });
  }
  const errandId = parseInt(req.params.id, 10);
  if (isNaN(errandId)) return res.status(400).json({ error: "Invalid errand id" });

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, errandId));
  if (!errand) return res.status(404).json({ error: "Errand not found" });

  if (!errand.helperId) {
    return res.status(400).json({ error: "This errand has no assigned helper to report" });
  }

  // Only the person who posted the errand (and hired the helper) may report
  // that helper. This prevents anyone from filing reports on errands they have
  // nothing to do with.
  if (errand.requesterUserId !== req.user.id) {
    return res.status(403).json({ error: "You can only report a helper on your own errand." });
  }

  const parsed = insertReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }

  const [report] = await db.insert(reportsTable).values({
    errandId,
    reportType: "helper",
    helperId: errand.helperId,
    reporterName: parsed.data.reporterName,
    reason: parsed.data.reason,
    description: parsed.data.description,
  }).returning();

  return res.status(201).json({
    ...report,
    createdAt: report.createdAt.toISOString(),
  });
});

// The mirror of the route above: the assigned helper reports the requester
// (customer) — e.g. they were a no-show, refused to share the completion code,
// or behaved unsafely. Only the helper assigned to the errand may file this, and
// only when the errand has a real (logged-in) requester to report.
router.post("/errands/:id/report-requester", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "You must be logged in to report a customer." });
  }
  const errandId = parseInt(req.params.id, 10);
  if (isNaN(errandId)) return res.status(400).json({ error: "Invalid errand id" });

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, errandId));
  if (!errand) return res.status(404).json({ error: "Errand not found" });

  if (!errand.requesterUserId) {
    return res.status(400).json({ error: "This errand has no registered customer to report." });
  }

  // Only the helper assigned to this errand may report its customer. We map the
  // logged-in user to their helper profile and require it to match the errand's
  // assigned helper — so no one can file reports on jobs they aren't doing.
  const [viewerHelper] = await db
    .select({ id: helpersTable.id })
    .from(helpersTable)
    .where(eq(helpersTable.userId, req.user.id));
  if (!errand.helperId || !viewerHelper || viewerHelper.id !== errand.helperId) {
    return res.status(403).json({ error: "Only the helper assigned to this errand can report its customer." });
  }

  const parsed = insertRequesterReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }

  const [report] = await db.insert(reportsTable).values({
    errandId,
    reportType: "requester",
    helperId: errand.helperId,
    reportedUserId: errand.requesterUserId,
    reporterName: parsed.data.reporterName,
    reason: parsed.data.reason,
    description: parsed.data.description,
  }).returning();

  return res.status(201).json({
    ...report,
    createdAt: report.createdAt.toISOString(),
  });
});

export default router;
