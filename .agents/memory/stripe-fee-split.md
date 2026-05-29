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
