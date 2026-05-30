import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable, errandsTable, insertReportSchema } from "@workspace/db";
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

export default router;
