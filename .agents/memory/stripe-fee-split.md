---
name: Stripe payment & escrow model
description: How errand payments are held and released (escrow), and the 10% fee
---

# Payment / escrow model

AnyErrands uses **escrow via separate charges + transfers** (NOT destination charges):

1. **Pay (checkout):** requires login. The payer is stamped as `errands.requesterUserId`. Funds are charged into the PLATFORM account only — no `transfer_data`/`application_fee`. Duplicate checkout is blocked when `paymentStatus==='paid'`.
2. **Webhook** marks paid and computes the **10% platform fee itself** (`Math.round(amountCents*10/100)`) since there's no `application_fee_amount` anymore. Stores `paidAmount`, `platformFee`, `paymentIntentId`.
3. **Confirm completion (`POST /errands/:id/complete`)** releases the held money. Only the requester can do this; it transfers `paidAmount - platformFee` (90%) to the helper's connected account via `stripe.transfers.create({ source_transaction: latest_charge, idempotencyKey: 'errand-<id>-payout' })`. Stored in `errands.transferId` + `helperPaidAt`.

**Why:** old flow paid the helper instantly at payment time (destination charge), so a helper could be paid before doing the work — a fraud loophole the user asked to close.

## Invariants that prevent money loss (don't weaken these)
- Completion requires `status==='accepted'` → prevents re-completion/double-payout re-entry.
- Transfer runs BEFORE flipping status to completed; on transfer failure return 502 and stay accepted (retryable; idempotency key reuses the same transfer).
- Paid errands: NO null-requester fallback — must be `requesterUserId===req.user.id`; must have `helperId`. (Unpaid/volunteer errands allow any logged-in user since no money is at stake.)
- `transferId` guard + stable idempotency key prevent double-pay.

**Residual known risk:** transfer succeeds but DB write fails → `transferId` stays null; within Stripe's idempotency-key retention a retry reuses the same transfer (safe), beyond it could double-pay. Acceptable given retries happen in the same request flow.

## Refunds / abort (the OTHER side of escrow)
Requesters have **NO self-cancel** of a payment by design. A held payment is refunded in full and the errand reopens only when: (1) the **assigned helper aborts** (`POST /errands/:id/abort`, gated to the helper whose `helpers.userId===req.user.id`, status must be `accepted`), or (2) an **auto-refund sweep** finds it not completed within **7 working days** (Mon–Fri) of `paidAt`. Sweep runs hourly via `setInterval` in `api-server/src/index.ts` (+30s after boot). Both call `refundAndReopenErrand()` in `api-server/src/lib/refunds.ts`, which Stripe-refunds the PI (idempotency key `refund-<paymentIntentId>`) and resets the row to clean unpaid/open. Never refunds if `transferId` set (already paid out).

**CRITICAL money-safety invariant (do not weaken):** payout (`/complete`) and refund (`/abort` + sweep) MUST be mutually exclusive so a payment is EITHER paid out OR refunded, never both. Two layers enforce this:
1. **Row lock** (concurrent decisions): both paths run inside `db.transaction` + `SELECT … .for("update")` on the errand row and **re-validate the locked row** (`status==='accepted'`, `transferId IS NULL`) before any Stripe call — never act on a stale pre-lock snapshot (that was a real bug architect caught). `/complete` returns 409 if it loses the race.
2. **Stripe-as-source-of-truth** (split-brain: Stripe op succeeds but our DB commit is lost, leaving DB out of sync). Payouts set `transfer_group: 'errand-<id>'`. Before refunding, refund checks `stripe.transfers.list({transfer_group})` — if a payout exists it skips the refund and does NOT reopen (leaves errand for `/complete` to reconcile via the idempotent transfer). Before paying out, `/complete` retrieves the charge and refuses (409) if `charge.refunded`/`amount_refunded>0`.

**Why this over a full pending-state ledger:** a two-phase ledger + reconciliation worker is the textbook fix but disproportionate for this small community app and beyond the user's request. The row lock + Stripe-truth guards + idempotency keys close both double-spend directions. Residual (accepted): a Stripe op may succeed while its DB write is lost, leaving "owed-but-not-executed" (e.g. refund not issued though errand reopened) — money is never double-spent, but may need manual reconciliation. If volume grows, revisit with durable pending states + webhook reconciliation.

## Pay button IS now gated on isRequester (only the requester sees "Pay €X")
The frontend "Pay €X" button (errands/[id].tsx) now renders ONLY when `errand.isRequester` (plus `status==='accepted' && budgetAmount>0 && paymentStatus!=='paid'`). Non-requester viewers of an accepted unpaid errand see a "waiting for the requester to pay" note instead. The checkout route still independently blocks non-owners server-side.

**Deliberate consequence — do NOT "fix" this:** errands with `requesterUserId = null` (old anonymous posts / demo placeholders) now show NO pay button to anyone, because `isRequester` is false for everyone. This is the INTENDED lockdown the user asked for (close the "anyone can pay a null-owner errand" hole), NOT a regression. The Errand API does not expose `requesterUserId`, so the frontend can't (and shouldn't) re-enable first-payer binding for null-owner errands. New errands posted while logged in always get `requesterUserId`, so the normal flow is unaffected. Seed/demo errands should still have NO budget.
