import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";
import { asc } from "drizzle-orm";

const router = Router();

router.get("/categories", async (req, res) => {
  const rows = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.name));
  return res.json(rows);
});

export default router;
