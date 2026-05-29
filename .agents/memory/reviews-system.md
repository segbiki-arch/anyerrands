---
name: Reviews system
description: How reviews work and the deliberate open-write authz tradeoff
---

# Reviews

One review per completed errand that has a helper. Enforced by a UNIQUE constraint on `reviews.errandId` PLUS an explicit pre-check, and a 23505 catch on insert (race → friendly 400, not 500). On each new review, `helpers.rating` is recomputed as the avg of all that helper's review ratings (numeric stored as string, `.toFixed(1)`).

## Open-write authz tradeoff
`POST /errands/:id/review` has NO reviewer-identity / ownership check. This is **consistent with the rest of the app**: accept, complete, and report errand endpoints are all unauthenticated and name-based; errands have no requester-identity column to authorize against.

**Why:** AnyErrands is a small-town trust-based community app with a name-based model, not account-bound ownership. Making reviews uniquely strict would be inconsistent and incomplete without a broader requester-identity refactor.

**How to apply:** If the user later wants to stop fake reviews / rating manipulation / "review-slot hijacking" (attacker reviews first, locks out the real requester via the unique constraint), that requires adding requester identity to errands and gating writes — a real feature, flagged to the user, not silently added.
