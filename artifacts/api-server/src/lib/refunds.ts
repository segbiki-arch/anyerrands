import { db, errandsTable } from "@workspace/db";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "./logger";

type Errand = typeof errandsTable.$inferSelect;

/**
 * Refund the requester's held payment (if any) and reopen the errand so it can
 * be given to someone else. Funds are held in the platform account (escrow), so
 * a full refund of the PaymentIntent returns the money to the requester.
 *
 * Safe to call more than once: the Stripe refund uses an idempotency key scoped
 * to the PaymentIntent, and once the errand is reopened it becomes "unpaid" so a
 * second call won't refund again. An errand whose payment has already been
 * released to the helper (transferId set) is never refunded.
 */
export async function refundAndReopenErrand(
  errand: Errand,
  reason: string,
): Promise<{ refunded: boolean }> {
  // The whole transition runs under a row lock so it is mutually exclusive with
  // /complete (which pays the helper out). Whichever transaction acquires the
  // lock first wins; the other re-reads the new state and bails. This guarantees
  // a payment is EITHER paid out to the helper OR refunded to the requester,
  // never both.
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(errandsTable)
      .where(eq(errandsTable.id, errand.id))
      .for("update");

    // Re-validate against the freshly-locked row, never the stale snapshot.
    if (!row) return { refunded: false };
    // Helper already paid out — money is gone, cannot refund.
    if (row.transferId) return { refunded: false };
    // Only an accepted errand can be aborted/timed-out. If it's already been
    // reopened (e.g. a concurrent refund) or completed, there's nothing to do.
    if (row.status !== "accepted") return { refunded: false };

    const isPaid = row.paymentStatus === "paid" && !!row.paymentIntentId;

    if (isPaid && row.paymentIntentId) {
      const stripe = await getUncachableStripeClient();

      // Split-brain safety net: our DB says no payout (transferId null), but a
      // payout may have succeeded in Stripe while its DB write was lost. Confirm
      // against Stripe via the deterministic transfer_group before refunding —
      // if the helper was already paid, never also refund the requester. Leave
      // the errand as-is (don't reopen) so /complete can reconcile it later.
      const existingTransfers = await stripe.transfers.list({
        transfer_group: `errand-${row.id}`,
        limit: 1,
      });
      if (existingTransfers.data.length > 0) {
        logger.warn(
          { errandId: row.id },
          "Skipping refund: helper already paid (transfer exists in Stripe, not in DB)",
        );
        return { refunded: false };
      }

      await stripe.refunds.create(
        {
          payment_intent: row.paymentIntentId,
          metadata: { errandId: String(row.id), reason },
        },
        // Scoped to the PaymentIntent so repeated calls (retry / sweep + manual)
        // never create a second refund, but a brand-new payment later can still
        // be refunded under its own key.
        { idempotencyKey: `refund-${row.paymentIntentId}` },
      );
    }

    // Reopen to a clean, unpaid state so a different helper can take it and the
    // requester can pay again if they wish.
    await tx
      .update(errandsTable)
      .set({
        status: "open",
        helperId: null,
        helperName: null,
        paymentStatus: "unpaid",
        paidAmount: null,
        platformFee: null,
        paymentIntentId: null,
        checkoutSessionId: null,
        paidAt: null,
        updatedAt: new Date(),
      })
      .where(eq(errandsTable.id, row.id));

    return { refunded: isPaid };
  });
}

/** Add N working days (Mon–Fri) to a date. Public holidays are not considered. */
export function addWorkingDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

const AUTO_REFUND_WORKING_DAYS = 7;

/**
 * Auto-refund sweep: any errand that was paid but not completed within
 * 7 working days is refunded to the requester and reopened. This protects
 * requesters whose helper accepted, took payment, but never finished.
 *
 * Idempotent and safe to run repeatedly (and on multiple instances): the
 * refund is keyed to the PaymentIntent, and each refunded errand is flipped to
 * unpaid/open so it won't be picked up again.
 */
export async function runAutoRefundSweep(): Promise<void> {
  const candidates = await db
    .select()
    .from(errandsTable)
    .where(
      and(
        eq(errandsTable.status, "accepted"),
        eq(errandsTable.paymentStatus, "paid"),
        isNotNull(errandsTable.paidAt),
        isNull(errandsTable.transferId),
      ),
    );

  const now = new Date();
  for (const errand of candidates) {
    if (!errand.paidAt) continue;
    const deadline = addWorkingDays(new Date(errand.paidAt), AUTO_REFUND_WORKING_DAYS);
    if (now < deadline) continue;
    try {
      await refundAndReopenErrand(errand, "auto_timeout_7_working_days");
      logger.info({ errandId: errand.id }, "Auto-refunded errand not completed within 7 working days");
    } catch (err) {
      logger.error({ err, errandId: errand.id }, "Auto-refund sweep failed for errand");
    }
  }
}
