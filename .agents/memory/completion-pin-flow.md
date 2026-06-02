---
name: Completion PIN flow
description: How paid errands are completed + paid out via a 4-digit code, and the concurrency invariants that must hold
---

# Completion code (PIN) flow

PAID errands are completed ONLY by the helper entering the requester's secret
4-digit completion code. The code is the single act of completion + satisfaction +
payout authorisation: a correct code completes the errand AND releases the 90%
payout. Volunteer/unpaid errands keep the requester "Mark as Completed" button.

**Why two paths:** the customer (not the helper) must control when money moves, but
the helper is the one who knows the job is finished. Handing the customer a private
code they share only when satisfied makes "I'm happy → you get paid" one action.

## Invariants (do not regress)
- The code is minted in the Stripe webhook when payment first succeeds, under a row
  lock, idempotently via `completionPin ?? generate` so redelivered/concurrent
  webhooks never rotate it.
- The code is returned ONLY to the requester. BOTH `formatErrand` functions
  (errands.ts and helpers.ts) must gate it — helpers.ts force-nulls it. Never leak
  to the helper through any API path.
- `/complete` must REJECT paid errands (400 → use PIN flow). It is volunteer-only.
- `/verify-pin` is assigned-helper-only. The attempts-limit check + code comparison
  + failed-attempt increment, AND all payout invariants (status accepted,
  budgetAmount>0, paymentStatus paid, helperId === viewer) must be re-checked on the
  **row-locked** record inside ONE transaction — never on the pre-lock snapshot.
  Otherwise a former helper who knows an old code, or an unpaid/refunded errand, can
  slip through (TOCTOU).
- Failed attempts are capped (MAX_PIN_ATTEMPTS=5) then locked.
- The actual transfer goes through the shared `completeErrandWithPayout()` (re-locks,
  re-validates accepted status, transferId guards double-pay) used by BOTH /complete
  and /verify-pin.

**How to apply:** any change to completion/payout must keep all state + authz checks
under the same row lock as the mutation, and keep the code requester-only in both
formatters.
