import { Router } from "express";
import { db } from "@workspace/db";
import { errandsTable, helpersTable, notificationsTable, reviewsTable, reportsTable } from "@workspace/db";
import { eq, desc, and, sql, avg, count } from "drizzle-orm";
import {
  ListErrandsQueryParams,
  CreateErrandBody,
  GetErrandParams,
  UpdateErrandParams,
  UpdateErrandBody,
  DeleteErrandParams,
  AcceptErrandParams,
  AcceptErrandBody,
  SetErrandContactParams,
  SetErrandContactBody,
  CompleteErrandParams,
  AbortErrandParams,
  GetRecentErrandsQueryParams,
  CreateReviewParams,
  CreateReviewBody,
  VerifyPinParams,
  VerifyPinBody,
} from "@workspace/api-zod";
import { isHelperChargesEnabled } from "../lib/stripeStatus";
import { getUncachableStripeClient } from "../stripeClient";
import { refundAndReopenErrand } from "../lib/refunds";
import { logger } from "../lib/logger";

const MAX_PIN_ATTEMPTS = 5;

const router = Router();

// Look up the helper profile id (if any) owned by the given user, so we can
// tell whether the viewer is the assigned helper on an errand.
async function getViewerHelperId(userId?: string): Promise<number | null> {
  if (!userId) return null;
  const [h] = await db
    .select({ id: helpersTable.id })
    .from(helpersTable)
    .where(eq(helpersTable.userId, userId));
  return h?.id ?? null;
}

function formatErrand(
  e: typeof errandsTable.$inferSelect,
  currentUserId?: string,
  viewerHelperId?: number | null,
) {
  const isOpen = e.status === "open";
  const isRequester = !!currentUserId && e.requesterUserId === currentUserId;
  const isAssignedHelper = viewerHelperId != null && e.helperId === viewerHelperId;
  // The phone number is a private contact detail: only the requester who posted
  // the errand and the helper assigned to it may see it. Everyone else (and
  // anyone viewing an open errand) gets null. The legacy requesterAddress column
  // is never returned (phone-only contact model).
  const canSeeContact = !isOpen && (isRequester || isAssignedHelper);
  // The completion code is the requester's private secret — it is shown ONLY to
  // the person who posted the errand, never to the helper or the public. The raw
  // attempt counter is internal and never surfaced.
  const {
    requesterAddress: _legacyAddress,
    completionPinAttempts: _attempts,
    completionPin: rawPin,
    completedAt: rawCompletedAt,
    payoutInitiatedAt: rawPayoutAt,
    ...rest
  } = e;
  void _legacyAddress;
  void _attempts;
  return {
    ...rest,
    requesterPhone: canSeeContact ? e.requesterPhone : null,
    completionPin: isRequester ? rawPin : null,
    completedAt: rawCompletedAt ? rawCompletedAt.toISOString() : null,
    payoutInitiatedAt: rawPayoutAt ? rawPayoutAt.toISOString() : null,
    budgetAmount: e.budgetAmount ? Number(e.budgetAmount) : null,
    paidAmount: e.paidAmount ? Number(e.paidAmount) : null,
    platformFee: e.platformFee ? Number(e.platformFee) : null,
    paidAt: e.paidAt ? e.paidAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
    isRequester,
  };
}

// Single source of truth for releasing a held payout and flipping an accepted
// errand to completed. Used by both the requester's direct completion (volunteer
// errands) and the helper's PIN verification (paid errands). All work happens
// under a row lock so it is mutually exclusive with a concurrent abort / auto-
// refund: a payment is EITHER paid out to the helper OR refunded, never both.
type CompleteOutcome =
  | { ok: true; row: typeof errandsTable.$inferSelect }
  | { ok: false; status: number; error: string };

async function completeErrandWithPayout(
  errandId: number,
  opts: { pinVerified?: boolean } = {},
): Promise<CompleteOutcome> {
  try {
    return await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(errandsTable)
        .where(eq(errandsTable.id, errandId))
        .for("update");

      // Re-validate against the freshly-locked row, never a stale snapshot.
      if (!locked) return { ok: false as const, status: 404, error: "Not found" };
      if (locked.status !== "accepted") {
        return {
          ok: false as const,
          status: 409,
          error: "This errand can no longer be completed — it may have been reopened or already finished.",
        };
      }

      const lockedIsPaid = !!locked.budgetAmount && Number(locked.budgetAmount) > 0 && locked.paymentStatus === "paid";

      let transferId = locked.transferId;
      let helperPaidAt = locked.helperPaidAt;
      if (lockedIsPaid && locked.helperId && !locked.transferId) {
        const [helper] = await tx.select().from(helpersTable).where(eq(helpersTable.id, locked.helperId));
        if (!helper?.stripeAccountId) {
          return {
            ok: false as const,
            status: 400,
            error: "The helper hasn't connected a payout account, so their payment can't be released yet.",
          };
        }
        if (!locked.paymentIntentId) {
          return { ok: false as const, status: 400, error: "Missing payment reference; cannot release payment." };
        }

        const paidCents = Math.round(Number(locked.paidAmount ?? locked.budgetAmount) * 100);
        const feeCents = Math.round(Number(locked.platformFee ?? 0) * 100);
        const payoutCents = paidCents - feeCents;

        const stripe = await getUncachableStripeClient();
        const pi = await stripe.paymentIntents.retrieve(locked.paymentIntentId);
        const chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id;

        // Split-brain safety net: never pay the helper if the held payment was
        // already refunded to the requester — confirm against Stripe first.
        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId);
          if (charge.refunded || (charge.amount_refunded ?? 0) > 0) {
            return {
              ok: false as const,
              status: 409,
              error: "This payment has been refunded to the requester and can no longer be released to the helper.",
            };
          }
        }

        const transfer = await stripe.transfers.create(
          {
            amount: payoutCents,
            currency: "eur",
            destination: helper.stripeAccountId,
            transfer_group: `errand-${locked.id}`,
            ...(chargeId ? { source_transaction: chargeId } : {}),
            metadata: { errandId: String(locked.id) },
          },
          { idempotencyKey: `errand-${locked.id}-payout` },
        );
        transferId = transfer.id;
        helperPaidAt = new Date();
      }

      const [updated] = await tx
        .update(errandsTable)
        .set({
          status: "completed",
          transferId,
          helperPaidAt,
          completedAt: new Date(),
          // Set only when a transfer was (or had already been) made.
          payoutInitiatedAt: helperPaidAt,
          ...(opts.pinVerified ? { completionPinVerified: true } : {}),
          updatedAt: new Date(),
        })
        .where(eq(errandsTable.id, locked.id))
        .returning();

      if (locked.helperId) {
        await tx
          .update(helpersTable)
          .set({ errandsCompleted: sql`${helpersTable.errandsCompleted} + 1` })
          .where(eq(helpersTable.id, locked.helperId));
      }

      return { ok: true as const, row: updated };
    });
  } catch (err) {
    logger.error({ err, errandId }, "Failed to release helper payment");
    return { ok: false as const, status: 502, error: "Couldn't release the payment to the helper. Please try again." };
  }
}

// Best-effort notification that an errand was completed and any held payment
// released — never fail the request if this insert fails (payment is already
// settled at this point), just log it.
async function notifyErrandCompleted(row: typeof errandsTable.$inferSelect): Promise<void> {
  const wasPaid = !!row.transferId;
  // Tell the helper their work is confirmed (and money is on the way, if paid).
  if (row.helperId) {
    try {
      const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, row.helperId));
      if (helper?.userId) {
        await db.insert(notificationsTable).values({
          userId: helper.userId,
          helperId: helper.id,
          errandId: row.id,
          message: wasPaid
            ? `Your errand "${row.title}" is complete and your payment has been released — it's on its way to your payout account.`
            : `Your errand "${row.title}" has been marked complete. Thanks for helping out!`,
        });
      }
    } catch (err) {
      logger.error({ err, errandId: row.id }, "Failed to create helper completion notification");
    }
  }
  // Tell the requester the errand is done (and money released, if paid).
  if (row.requesterUserId) {
    try {
      await db.insert(notificationsTable).values({
        userId: row.requesterUserId,
        errandId: row.id,
        message: wasPaid
          ? `Your errand "${row.title}" is complete — the payment has been released to ${row.helperName ?? "your helper"}.`
          : `Your errand "${row.title}" is marked complete. Thanks for using AnyErrands!`,
      });
    } catch (err) {
      logger.error({ err, errandId: row.id }, "Failed to create requester completion notification");
    }
  }
}

router.get("/errands", async (req, res) => {
  const parsed = ListErrandsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { status, category, limit = 20, offset = 0 } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(errandsTable.status, status as "open" | "accepted" | "completed"));
  if (category) conditions.push(eq(errandsTable.category, category));

  // "mine" returns only the logged-in user's own posts, for their errand history.
  if (req.query.mine === "true") {
    if (!req.user) return res.status(401).json({ error: "You must be logged in to view your errands." });
    conditions.push(eq(errandsTable.requesterUserId, req.user.id));
  }

  const rows = await db
    .select()
    .from(errandsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(errandsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const viewerHelperId = await getViewerHelperId(req.user?.id);
  return res.json(rows.map((r) => formatErrand(r, req.user?.id, viewerHelperId)));
});

router.post("/errands", async (req, res) => {
  // Posting requires login so the errand has an owner — this is what lets us
  // reliably notify the requester when a helper accepts, and power their
  // errand history.
  if (!req.user) {
    return res.status(401).json({ error: "Please log in to post an errand so we can notify you when a helper accepts." });
  }
  const parsed = CreateErrandBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error });
  }
  const { budgetAmount, tripFrom, tripTo, tripWhen, ...rest } = parsed.data;
  const cleanText = (v: string | undefined) => (v?.trim() ? v.trim() : null);
  const [row] = await db
    .insert(errandsTable)
    .values({
      ...rest,
      requesterUserId: req.user.id,
      requesterAddress: null,
      requesterPhone: null,
      budgetAmount: budgetAmount != null ? String(budgetAmount) : null,
      tripFrom: cleanText(tripFrom),
      tripTo: cleanText(tripTo),
      tripWhen: cleanText(tripWhen),
    })
    .returning();

  // Notify every available helper whenever a new errand is posted.
  const locationKeyword = rest.requesterLocation.split(",")[0].trim();
  const availableHelpers = await db
    .select({ id: helpersTable.id, userId: helpersTable.userId })
    .from(helpersTable)
    .where(eq(helpersTable.available, true));

  // Don't notify the poster about their own errand.
  const recipients = req.user?.id
    ? availableHelpers.filter((h) => h.userId !== req.user!.id)
    : availableHelpers;

  if (recipients.length > 0) {
    await db.insert(notificationsTable).values(
      recipients.map((h) => ({
        helperId: h.id,
        // Target the helper's login too so it shows in their notification bell,
        // which is keyed by the logged-in user.
        userId: h.userId ?? null,
        errandId: row.id,
        message: `New errand in ${locationKeyword}: "${row.title}"`,
      }))
    );
  }

  return res.status(201).json(formatErrand(row, req.user?.id));
});

router.get("/errands/stats/summary", async (req, res) => {
  const rows = await db
    .select({ status: errandsTable.status, count: sql<number>`count(*)::int` })
    .from(errandsTable)
    .groupBy(errandsTable.status);

  const stats = { totalOpen: 0, totalAccepted: 0, totalCompleted: 0, totalErrands: 0, topCategory: null as string | null };
  for (const r of rows) {
    if (r.status === "open") stats.totalOpen = r.count;
    else if (r.status === "accepted") stats.totalAccepted = r.count;
    else if (r.status === "completed") stats.totalCompleted = r.count;
    stats.totalErrands += r.count;
  }

  const catRow = await db
    .select({ category: errandsTable.category, count: sql<number>`count(*)::int` })
    .from(errandsTable)
    .groupBy(errandsTable.category)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  stats.topCategory = catRow[0]?.category ?? null;
  return res.json(stats);
});

router.get("/errands/recent", async (req, res) => {
  const parsed = GetRecentErrandsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 5) : 5;
  const rows = await db
    .select()
    .from(errandsTable)
    .orderBy(desc(errandsTable.createdAt))
    .limit(limit);
  const viewerHelperId = await getViewerHelperId(req.user?.id);
  return res.json(rows.map((r) => formatErrand(r, req.user?.id, viewerHelperId)));
});

router.get("/errands/:id", async (req, res) => {
  const parsed = GetErrandParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [row] = await db.select().from(errandsTable).where(eq(errandsTable.id, parsed.data.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  const viewerHelperId = await getViewerHelperId(req.user?.id);
  return res.json(formatErrand(row, req.user?.id, viewerHelperId));
});

router.patch("/errands/:id", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "You must be logged in to edit an errand." });
  const paramParsed = UpdateErrandParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = UpdateErrandBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const [existing] = await db.select().from(errandsTable).where(eq(errandsTable.id, paramParsed.data.id));
  if (!existing) return res.status(404).json({ error: "Not found" });

  // Only the owner can edit their own errand.
  if (existing.requesterUserId !== req.user.id) {
    return res.status(403).json({ error: "You can only edit your own errands." });
  }

  // Once an errand has been accepted, its details (especially the budget) are
  // locked so the agreed terms can't be changed under the helper.
  if (existing.status !== "open") {
    return res.status(400).json({
      error: "This errand can no longer be edited because it has already been accepted.",
    });
  }

  const { budgetAmount, ...rest } = bodyParsed.data;
  const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (budgetAmount !== undefined) updates.budgetAmount = budgetAmount != null ? String(budgetAmount) : null;

  // Atomic guard: only update if this is still the owner's OPEN errand. This
  // closes the race window between the checks above and the write (e.g. a helper
  // accepting in between), so an accepted errand's budget can't be changed.
  const [row] = await db
    .update(errandsTable)
    .set(updates)
    .where(
      and(
        eq(errandsTable.id, paramParsed.data.id),
        eq(errandsTable.requesterUserId, req.user.id),
        eq(errandsTable.status, "open"),
      ),
    )
    .returning();

  if (!row) {
    return res.status(409).json({
      error: "This errand can no longer be edited because it has already been accepted.",
    });
  }
  return res.json(formatErrand(row, req.user?.id));
});

router.delete("/errands/:id", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "You must be logged in." });
  const parsed = DeleteErrandParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const id = parsed.data.id;

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, id));
  if (!errand) return res.status(404).json({ error: "Errand not found" });

  // Only the owner can delete their own errand.
  if (errand.requesterUserId !== req.user.id) {
    return res.status(403).json({ error: "You can only delete your own errands." });
  }

  // Don't allow deleting an errand whose payment is still being held — the funds
  // need to be released to the helper (complete) or refunded first.
  if (errand.paymentStatus === "paid") {
    return res.status(400).json({
      error:
        "This errand has a payment being held. Mark it complete to pay your helper, or wait for a refund, before deleting it.",
    });
  }

  // There are no ON DELETE CASCADE rules, so clear child rows that reference the
  // errand before removing it, all in one transaction.
  await db.transaction(async (tx) => {
    await tx.delete(notificationsTable).where(eq(notificationsTable.errandId, id));
    await tx.delete(reportsTable).where(eq(reportsTable.errandId, id));
    await tx.delete(reviewsTable).where(eq(reviewsTable.errandId, id));
    await tx.delete(errandsTable).where(eq(errandsTable.id, id));
  });

  return res.status(204).send();
});

router.post("/errands/:id/accept", async (req, res) => {
  const paramParsed = AcceptErrandParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = AcceptErrandBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  if (!req.user) return res.status(401).json({ error: "You must be logged in to accept an errand." });

  const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, bodyParsed.data.helperId));
  if (!helper) return res.status(404).json({ error: "Helper not found" });

  // Only the owner of a helper profile can accept errands as that helper —
  // otherwise anyone could assign someone else's profile to an errand and
  // fire off bogus acceptance notifications.
  if (helper.userId !== req.user.id) {
    return res.status(403).json({ error: "You can only accept errands with your own helper profile." });
  }

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, paramParsed.data.id));
  if (!errand) return res.status(404).json({ error: "Errand not found" });

  // Can't accept an errand that's already been picked up or completed.
  if (errand.status !== "open") {
    return res.status(400).json({ error: "This errand has already been accepted." });
  }

  // Every helper must have a working Stripe payout account connected before they
  // can accept ANY errand — paid or volunteer. This guarantees that if money is
  // involved it can always be routed correctly with the platform fee split, and
  // keeps every helper who takes on work verified through Stripe.
  const ready = await isHelperChargesEnabled(helper);
  if (!ready) {
    return res.status(400).json({
      error:
        "Please set up your payout account before accepting errands. Go to your helper profile and connect payouts so you can be paid and verified.",
    });
  }

  // Accept atomically: the update only succeeds while the errand is still open,
  // so two helpers can never both win the same errand, and once it's taken it can
  // never be accepted by anyone else.
  const [row] = await db
    .update(errandsTable)
    .set({ status: "accepted", helperId: bodyParsed.data.helperId, helperName: helper.name, updatedAt: new Date() })
    .where(and(eq(errandsTable.id, paramParsed.data.id), eq(errandsTable.status, "open")))
    .returning();

  if (!row) return res.status(409).json({ error: "This errand has already been accepted by someone else." });

  // Let the requester know a helper picked up their errand. Only possible when
  // the errand has a logged-in owner (anonymous/legacy errands have no userId).
  if (row.requesterUserId) {
    await db.insert(notificationsTable).values({
      userId: row.requesterUserId,
      helperId: helper.id,
      errandId: row.id,
      message: `${helper.name} accepted your errand "${row.title}". Tap to pay and share your number so they can WhatsApp or call you.`,
    });
  }

  return res.json(formatErrand(row, req.user?.id));
});

// The requester shares their address + phone with the assigned helper after
// acceptance. Gated to the errand's owner so nobody else can change the contact
// details that get shown to the helper.
router.post("/errands/:id/contact", async (req, res) => {
  const paramParsed = SetErrandContactParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = SetErrandContactBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body", details: bodyParsed.error });

  if (!req.user) {
    return res.status(401).json({ error: "You must be logged in to update contact details." });
  }

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, paramParsed.data.id));
  if (!errand) return res.status(404).json({ error: "Not found" });

  if (errand.requesterUserId !== req.user.id) {
    return res.status(403).json({ error: "Only the person who posted this errand can set its contact details." });
  }

  if (errand.status !== "accepted") {
    return res.status(400).json({ error: "You can only share contact details once a helper has accepted your errand." });
  }

  const requiresPayment = errand.budgetAmount != null && Number(errand.budgetAmount) > 0;
  if (requiresPayment && errand.paymentStatus !== "paid") {
    return res.status(400).json({ error: "Please pay first. Your payment is held safely and only released to the helper when you confirm the job is done — once it's paid you can share your number." });
  }

  const [row] = await db
    .update(errandsTable)
    .set({
      requesterPhone: bodyParsed.data.requesterPhone.trim(),
      updatedAt: new Date(),
    })
    .where(eq(errandsTable.id, paramParsed.data.id))
    .returning();

  return res.json(formatErrand(row!, req.user?.id));
});

router.post("/errands/:id/complete", async (req, res) => {
  const parsed = CompleteErrandParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, parsed.data.id));
  if (!errand) return res.status(404).json({ error: "Not found" });

  if (!req.user) {
    return res.status(401).json({ error: "You must be logged in to confirm completion." });
  }

  // Only an accepted errand can be confirmed. This also prevents re-completing
  // an already-completed errand (which would be a double-payout re-entry).
  if (errand.status !== "accepted") {
    return res.status(400).json({ error: "Only an accepted errand can be marked completed." });
  }

  const requiresPayment = !!errand.budgetAmount && Number(errand.budgetAmount) > 0;

  // PAID errands are completed ONLY through the helper entering the requester's
  // secret completion code (/verify-pin). That single act is the requester's
  // completion + satisfaction + payout authorisation, so this direct-confirm
  // route is reserved for volunteer/unpaid errands and must reject paid ones.
  if (requiresPayment) {
    return res.status(400).json({
      error: "Paid errands are completed when your helper enters your 4-digit completion code. Share it with them once you're happy with the job.",
    });
  }

  // Only the requester may confirm completion. The "any logged-in user" fallback
  // is ONLY for unpaid/volunteer errands with no bound requester (legacy seed
  // data) — paid errands never reach here.
  if (errand.requesterUserId && errand.requesterUserId !== req.user.id) {
    return res.status(403).json({ error: "Only the person who requested this errand can mark it completed." });
  }

  // Volunteer errand → just flip to completed (no money moves). The shared helper
  // runs under a row lock so it stays mutually exclusive with a concurrent abort.
  const outcome = await completeErrandWithPayout(parsed.data.id);
  if (!outcome.ok) {
    return res.status(outcome.status).json({ error: outcome.error });
  }

  await notifyErrandCompleted(outcome.row);

  return res.json(formatErrand(outcome.row, req.user?.id));
});

// The helper finishes a PAID errand by entering the requester's secret 4-digit
// completion code. The code is the requester's act of completion + satisfaction
// + payout authorisation: entering it correctly releases the 90% payout and flips
// the errand to completed. Only the assigned helper may submit, and failed
// attempts are limited so the code can't be brute-forced.
router.post("/errands/:id/verify-pin", async (req, res) => {
  const parsed = VerifyPinParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = VerifyPinBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Please enter the 4-digit completion code." });

  if (!req.user) {
    return res.status(401).json({ error: "You must be logged in to enter the completion code." });
  }

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, parsed.data.id));
  if (!errand) return res.status(404).json({ error: "Not found" });

  // Only the assigned helper can enter the code — it both authorises the payout
  // and identifies who is being paid.
  const viewerHelperId = await getViewerHelperId(req.user.id);
  if (!errand.helperId || viewerHelperId !== errand.helperId) {
    return res.status(403).json({ error: "Only the assigned helper can enter the completion code." });
  }

  if (errand.status === "completed") {
    return res.status(400).json({ error: "This errand is already complete." });
  }
  if (errand.status !== "accepted") {
    return res.status(400).json({ error: "This errand can't be completed yet." });
  }

  const requiresPayment = !!errand.budgetAmount && Number(errand.budgetAmount) > 0;
  if (!requiresPayment || errand.paymentStatus !== "paid") {
    return res.status(400).json({ error: "There's no held payment on this errand yet." });
  }
  if (!errand.completionPin) {
    return res.status(400).json({
      error: "No completion code has been generated yet. Ask the customer to refresh after paying.",
    });
  }

  // Brute-force guard: the attempts check, the code comparison and the failed-
  // attempt increment all run under a row lock in one transaction, so concurrent
  // wrong guesses can never slip past the limit. We never mutate the errand's
  // lifecycle here — a correct code hands off to completeErrandWithPayout (which
  // re-locks and re-validates) so this stays mutually exclusive with abort/refund.
  const submitted = bodyParsed.data.pin.trim();
  const check = await db.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(errandsTable)
      .where(eq(errandsTable.id, errand.id))
      .for("update");

    // Re-validate every payout invariant against the freshly-locked row, not the
    // earlier snapshot. A concurrent abort/refund + reopen/reaccept could have
    // changed the assigned helper or cleared the held payment between our first
    // read and acquiring the lock — without these checks an unassigned (former)
    // helper who knows an old code could complete the errand or be paid on an
    // unpaid/refunded one.
    const lockedRequiresPayment = !!locked && !!locked.budgetAmount && Number(locked.budgetAmount) > 0;
    if (
      !locked ||
      !locked.completionPin ||
      locked.status !== "accepted" ||
      !lockedRequiresPayment ||
      locked.paymentStatus !== "paid"
    ) {
      return { result: "stale" as const };
    }
    if (locked.helperId !== viewerHelperId) {
      return { result: "forbidden" as const };
    }
    if (locked.completionPinAttempts >= MAX_PIN_ATTEMPTS) {
      return { result: "locked" as const };
    }
    if (submitted !== locked.completionPin) {
      const [bumped] = await tx
        .update(errandsTable)
        .set({ completionPinAttempts: sql`${errandsTable.completionPinAttempts} + 1`, updatedAt: new Date() })
        .where(eq(errandsTable.id, locked.id))
        .returning();
      const remaining = Math.max(0, MAX_PIN_ATTEMPTS - (bumped?.completionPinAttempts ?? MAX_PIN_ATTEMPTS));
      return { result: "wrong" as const, remaining };
    }
    return { result: "correct" as const };
  });

  if (check.result === "stale") {
    return res.status(400).json({ error: "This errand can't be completed right now. Please refresh and try again." });
  }
  if (check.result === "forbidden") {
    return res.status(403).json({ error: "Only the assigned helper can enter the completion code." });
  }
  if (check.result === "locked") {
    return res.status(429).json({
      error: "Too many incorrect attempts. Please ask the customer to double-check the code with you.",
    });
  }
  if (check.result === "wrong") {
    return res.status(400).json({
      error:
        check.remaining > 0
          ? `That code isn't right. ${check.remaining} ${check.remaining === 1 ? "try" : "tries"} left before it locks.`
          : "That code isn't right, and you've run out of tries. Ask the customer to double-check the code.",
    });
  }

  // Correct code → release the payout and complete the errand.
  const outcome = await completeErrandWithPayout(errand.id, { pinVerified: true });
  if (!outcome.ok) {
    return res.status(outcome.status).json({ error: outcome.error });
  }

  await notifyErrandCompleted(outcome.row);

  return res.json(formatErrand(outcome.row, req.user?.id));
});

// A helper backs out of a job they accepted. This refunds the requester's held
// payment (if paid) and reopens the errand so it can be given to someone else.
// Requesters cannot cancel a payment themselves — only the assigned helper can
// abort, or the automatic 7-working-day timeout (see lib/refunds) refunds.
router.post("/errands/:id/abort", async (req, res) => {
  const parsed = AbortErrandParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  if (!req.user) {
    return res.status(401).json({ error: "You must be logged in to back out of a job." });
  }

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, parsed.data.id));
  if (!errand) return res.status(404).json({ error: "Not found" });

  if (errand.status !== "accepted") {
    return res.status(400).json({ error: "Only an accepted job can be backed out of." });
  }

  // Only the assigned helper may abort. Confirm the logged-in user owns the
  // helper profile that accepted this errand.
  if (!errand.helperId) {
    return res.status(400).json({ error: "This errand has no assigned helper." });
  }
  const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, errand.helperId));
  if (!helper || helper.userId !== req.user.id) {
    return res.status(403).json({ error: "Only the helper assigned to this job can back out of it." });
  }

  try {
    await refundAndReopenErrand(errand, "helper_aborted");
  } catch (err) {
    req.log.error({ err, errandId: errand.id }, "Failed to refund/reopen on abort");
    return res.status(502).json({ error: "Couldn't back out of the job right now. Please try again." });
  }

  const [row] = await db.select().from(errandsTable).where(eq(errandsTable.id, errand.id));
  return res.json(formatErrand(row!, req.user?.id));
});

router.post("/errands/:id/review", async (req, res) => {
  const paramParsed = CreateReviewParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = CreateReviewBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body", details: bodyParsed.error });

  if (!req.user) {
    return res.status(401).json({ error: "You must be logged in to leave a review." });
  }

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, paramParsed.data.id));
  if (!errand) return res.status(404).json({ error: "Errand not found" });

  if (errand.requesterUserId !== req.user.id) {
    return res.status(403).json({ error: "Only the person who posted this errand can review it." });
  }
  if (errand.status !== "completed") {
    return res.status(400).json({ error: "You can only review an errand once it's completed." });
  }
  if (!errand.helperId) {
    return res.status(400).json({ error: "This errand has no helper to review." });
  }

  const [existing] = await db.select().from(reviewsTable).where(eq(reviewsTable.errandId, errand.id));
  if (existing) {
    return res.status(400).json({ error: "This errand has already been reviewed." });
  }

  let review;
  try {
    [review] = await db
      .insert(reviewsTable)
      .values({
        errandId: errand.id,
        helperId: errand.helperId,
        reviewerName: bodyParsed.data.reviewerName,
        rating: bodyParsed.data.rating,
        comment: bodyParsed.data.comment ?? null,
      })
      .returning();
  } catch (err) {
    // Unique constraint on errand_id — another review landed first (race).
    if ((err as { code?: string }).code === "23505") {
      return res.status(400).json({ error: "This errand has already been reviewed." });
    }
    throw err;
  }

  if (!review) {
    return res.status(400).json({ error: "This errand has already been reviewed." });
  }

  // Recompute the helper's average rating from all their reviews.
  const [agg] = await db
    .select({ avgRating: avg(reviewsTable.rating) })
    .from(reviewsTable)
    .where(eq(reviewsTable.helperId, errand.helperId));

  if (agg?.avgRating != null) {
    await db
      .update(helpersTable)
      .set({ rating: String(Number(agg.avgRating).toFixed(1)) })
      .where(eq(helpersTable.id, errand.helperId));
  }

  return res.status(201).json({
    ...review,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
