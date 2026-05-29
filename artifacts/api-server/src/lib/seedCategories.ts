import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const DEFAULT_CATEGORIES = [
  {
    name: "Lifts & Transport",
    icon: "car-front",
    description:
      "Offer or request a lift — airport drop-off/pick-up, trips to Limerick, Thurles, Borrisokane and other neighbouring towns.",
  },
  {
    name: "Elderly Assistance",
    icon: "heart-handshake",
    description:
      "Help for older neighbours — companionship, collecting prescriptions, light tasks, getting to appointments and a friendly check-in.",
  },
];

/**
 * Ensures essential category rows exist. Categories are data (not schema), so a
 * schema migration alone won't create them in production — this idempotent seed
 * runs at startup and inserts any missing category by name.
 */
export async function ensureDefaultCategories(): Promise<void> {
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(eq(categoriesTable.name, cat.name));
    if (existing.length === 0) {
      await db.insert(categoriesTable).values(cat);
      logger.info({ category: cat.name }, "Seeded missing category");
    }
  }
}
