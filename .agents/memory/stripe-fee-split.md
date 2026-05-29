---
name: stripe fee split requires connected helper account
description: Why the 10% platform fee is sometimes 0 and where errand money lands
---

# Stripe fee split depends on helper's connected Stripe account

The 10% platform fee (`PLATFORM_FEE_PERCENT` in `artifacts/api-server/src/routes/stripe.ts`) is only split out via Stripe `application_fee_amount` + `transfer_data.destination` when the assigned helper has a connected Stripe Express account (`helpers.stripe_account_id` is set and charges enabled).

If the helper used has **no** connected Stripe account, the whole payment lands in the **platform** Stripe account with `platform_fee = 0` — there is no transfer to the helper and no visible 10% split. (Confirmed in prod: errand paid €1, helper profile had null `stripe_account_id`, recorded `platform_fee = 0.00`.)

Other gotchas observed:
- A user can end up with **multiple duplicate helper profiles**; only the one tied to the accepted errand matters, and it may not be the one where they later connected Stripe.
- The app records completions via `helpers.errands_completed` counter only — there is no per-helper list/history of completed errands in the UI, and the profile shows no earnings figure (money lives in Stripe, not the app).

**Why:** owner expected to "see the money" and a 10% deduction; neither appears when the helper isn't Stripe-connected and because no earnings UI exists.
