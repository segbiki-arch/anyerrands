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
