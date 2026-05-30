import { Router } from "express";
import { db } from "@workspace/db";
import { errandsTable, helpersTable, notificationsTable, reviewsTable } from "@workspace/db";
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
} from "@workspace/api-zod";
import { isHelperChargesEnabled } from "../lib/stripeStatus";
import { getUncachableStripeClient } from "../stripeClient";
import { refundAndReopenErrand } from "../lib/refunds";

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
  // Address + phone are private contact details: only the requester who posted
  // the errand and the helper assigned to it may see them. Everyone else (and
  // anyone viewing an open errand) gets null.
  const canSeeContact = !isOpen && (isRequester || isAssignedHelper);
  return {
    ...e,
    requesterAddress: canSeeContact ? e.requesterAddress : null,
    requesterPhone: canSeeContact ? e.requesterPhone : null,
    budgetAmount: e.budgetAmount ? Number(e.budgetAmount) : null,
    paidAmount: e.paidAmount ? Number(e.paidAmount) : null,
    platformFee: e.platformFee ? Number(e.platformFee) : null,
    paidAt: e.paidAt ? e.paidAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
    isRequester,
  };
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
  const parsed = CreateErrandBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error });
  }
  const { budgetAmount, requesterAddress, requesterPhone, tripFrom, tripTo, tripWhen, ...rest } = parsed.data;
  const cleanText = (v: string | undefined) => (v?.trim() ? v.trim() : null);
  const [row] = await db
    .insert(errandsTable)
    .values({
      ...rest,
      requesterUserId: req.user?.id ?? null,
      requesterAddress: cleanText(requesterAddress),
      requesterPhone: cleanText(requesterPhone),
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
  const paramParsed = UpdateErrandParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = UpdateErrandBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const { budgetAmount, ...rest } = bodyParsed.data;
  const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (budgetAmount !== undefined) updates.budgetAmount = budgetAmount != null ? String(budgetAmount) : null;

  const [row] = await db
    .update(errandsTable)
    .set(updates)
    .where(eq(errandsTable.id, paramParsed.data.id))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(formatErrand(row, req.user?.id));
});

router.delete("/errands/:id", async (req, res) => {
  const parsed = DeleteErrandParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(errandsTable).where(eq(errandsTable.id, parsed.data.id));
  return res.status(204).send();
});

router.post("/errands/:id/accept", async (req, res) => {
  const paramParsed = AcceptErrandParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = AcceptErrandBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const [helper] = await db.select().from(helpersTable).where(eq(helpersTable.id, bodyParsed.data.helperId));
  if (!helper) return res.status(404).json({ error: "Helper not found" });

  const [errand] = await db.select().from(errandsTable).where(eq(errandsTable.id, paramParsed.data.id));
  if (!errand) return res.status(404).json({ error: "Errand not found" });

  // For paid errands, the helper must have a working Stripe payout account
  // before accepting — otherwise the requester's payment cannot be routed to
  // them and the 10% platform fee cannot be split correctly.
  if (errand.budgetAmount && Number(errand.budgetAmount) > 0) {
    const ready = await isHelperChargesEnabled(helper);
    if (!ready) {
      return res.status(400).json({
        error:
          "Please connect your payout account before accepting a paid errand. Go to your helper profile and set up payouts so you get paid and the platform fee is handled correctly.",
      });
    }
  }

  const [row] = await db
    .update(errandsTable)
    .set({ status: "accepted", helperId: bodyParsed.data.helperId, helperName: helper.name, updatedAt: new Date() })
    .where(eq(errandsTable.id, paramParsed.data.id))
    .returning();

  if (!row) return res.status(404).json({ error: "Errand not found" });

  // Let the requester know a helper picked up their errand. Only possible when
  // the errand has a logged-in owner (anonymous/legacy errands have no userId).
  if (row.requesterUserId) {
    await db.insert(notificationsTable).values({
      userId: row.requesterUserId,
      helperId: helper.id,
      errandId: row.id,
      message: `${helper.name} accepted your errand "${row.title}". Add your contact details so they can reach you.`,
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

  const [row] = await db
    .update(errandsTable)
    .set({
      requesterAddress: bodyParsed.data.requesterAddress.trim(),
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
  const isPaid = requiresPayment && errand.paymentStatus === "paid";

  // Only the requester may confirm completion — confirming releases the held
  // payment to the helper, so the helper must not be able to mark their own work
  // done. The "any logged-in user" fallback is ONLY for unpaid/volunteer errands
  // with no bound requester (legacy seed data); a paid errand must always be
  // confirmed by its real requester so money is never released by a stranger.
  if (errand.requesterUserId) {
    if (errand.requesterUserId !== req.user.id) {
      return res.status(403).json({ error: "Only the person who requested this errand can mark it completed." });
    }
  } else if (requiresPayment) {
    return res.status(403).json({ error: "This errand's requester can't be verified, so payment can't be released." });
  }

  // Block completion of paid errands until payment is confirmed
  if (requiresPayment && errand.paymentStatus !== "paid") {
    return res.status(400).json({
      error: "Payment not yet received. The requester must pay before this errand can be marked completed.",
    });
  }

  // A paid errand must have a helper to receive the held funds.
  if (isPaid && !errand.helperId) {
    return res.status(400).json({ error: "This paid errand has no helper assigned to pay." });
  }

  // Release the held payment (90%) to the helper and flip the status, all under
  // a row lock so this is mutually exclusive with a concurrent abort / auto-
  // refund. Whichever transaction grabs the lock first wins; the other re-reads
  // the new state and bails. This guarantees a payment is EITHER paid out to the
  // helper OR refunded to the requester, never both. The transfer happens before
  // the status flip, so if it fails the errand stays accepted and can be retried.
  let outcome:
    | { ok: true; row: typeof errand }
    | { ok: false; status: number; error: string };

  try {
    outcome = await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(errandsTable)
        .where(eq(errandsTable.id, parsed.data.id))
        .for("update");

      // Re-validate against the freshly-locked row, never the stale snapshot.
      // A concurrent abort/auto-refund may have reopened (or someone completed)
      // this errand between our first read and acquiring the lock.
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

        // Split-brain safety net: our DB says still payable, but the held payment
        // may already have been refunded to the requester (e.g. a refund that
        // succeeded in Stripe while its DB write was lost). Never also pay the
        // helper — confirm against Stripe before releasing funds.
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
            // Deterministic group so a refund can detect an existing payout in
            // Stripe even if our DB write of transferId was lost.
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
        .set({ status: "completed", transferId, helperPaidAt, updatedAt: new Date() })
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
    req.log.error({ err, errandId: parsed.data.id }, "Failed to release helper payment");
    return res.status(502).json({ error: "Couldn't release the payment to the helper. Please try again." });
  }

  if (!outcome.ok) {
    return res.status(outcome.status).json({ error: outcome.error });
  }

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
