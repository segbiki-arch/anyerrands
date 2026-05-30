---
name: Helper profile ownership
description: How helper payout/Stripe access is gated to the profile owner
---

# Helper profile ownership

`helpersTable.userId` FK to users ties a helper profile to the login that created it.

- Stripe onboard/manage/status routes gate through `requireOwnedHelper()` in `api-server/src/routes/stripe.ts`: 401 if not logged in, 404 if missing, 403 unless `helper.userId === req.user.id`.
- **No auto-claim of legacy unowned profiles.** Profiles created before ownership (`userId == null`) can never manage payouts. We deliberately removed a name-match auto-claim fallback.
  - **Why:** matching a display name is not proof of identity — anyone with the same/spoofed name could claim a legacy helper and pull its Stripe login link (IDOR). The only legacy connected profiles were throwaway test accounts, so denying them is safe.
  - **How to apply:** if a real legacy profile ever needs an owner, backfill `helpers.userId` via a deliberate data migration, never a runtime heuristic.
- Helper API responses strip `userId` and expose computed `isOwner`; frontend only shows the payout section when `isOwner`. Connected state uses `detailsSubmitted` (not `chargesEnabled`).
- New-helper form requires login and locks the name to the account name.
- **Accepting an errand is gated to helper ownership.** `POST /errands/:id/accept` requires login AND `helper.userId === req.user.id`, plus an `errand.status === "open"` guard.
  - **Why:** the route originally had no auth and the accept dialog listed ALL helpers, so anyone could assign someone else's profile to an errand and fire bogus acceptance notifications (broken access control).
  - **How to apply:** the accept dialog must filter helper options to `isOwner` ones; keep backend ownership + open-status checks in lockstep with any UI change.
