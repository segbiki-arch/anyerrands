import { Router } from "express";
import { db, usersTable, helpersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetWelcomeStatusResponse,
  MarkCustomerWelcomeSeenResponse,
  MarkHelperWelcomeSeenResponse,
} from "@workspace/api-zod";

const router = Router();

// Computes whether the logged-in user should still see either welcome popup.
// A popup shows until its `welcomeSeenAt` is set (one-time, persisted in DB so
// it never reappears across devices).
async function getStatus(userId: string) {
  const [user] = await db
    .select({
      firstName: usersTable.firstName,
      welcomeSeenAt: usersTable.welcomeSeenAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  const [helper] = await db
    .select({ welcomeSeenAt: helpersTable.welcomeSeenAt })
    .from(helpersTable)
    .where(eq(helpersTable.userId, userId));

  return {
    showCustomerWelcome: !!user && user.welcomeSeenAt === null,
    showHelperWelcome: !!helper && helper.welcomeSeenAt === null,
    firstName: user?.firstName ?? null,
  };
}

router.get("/welcome", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "You must be logged in." });
  const status = await getStatus(req.user.id);
  return res.json(GetWelcomeStatusResponse.parse(status));
});

router.post("/welcome/customer/seen", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "You must be logged in." });
  await db
    .update(usersTable)
    .set({ welcomeSeenAt: new Date() })
    .where(eq(usersTable.id, req.user.id));
  const status = await getStatus(req.user.id);
  return res.json(MarkCustomerWelcomeSeenResponse.parse(status));
});

router.post("/welcome/helper/seen", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "You must be logged in." });
  await db
    .update(helpersTable)
    .set({ welcomeSeenAt: new Date() })
    .where(eq(helpersTable.userId, req.user.id));
  const status = await getStatus(req.user.id);
  return res.json(MarkHelperWelcomeSeenResponse.parse(status));
});

export default router;
