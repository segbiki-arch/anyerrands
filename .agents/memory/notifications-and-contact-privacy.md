---
name: Per-user notifications & contact-detail privacy
description: How notifications are targeted/secured per logged-in user, and the server-side gate on requester address/phone
---

# Per-user notifications

`notifications` has BOTH `userId` (nullable text → users) and `helperId` (nullable int). The notification bell is keyed to the **logged-in user** (`useAuth().user.id`), not a helper id (it used to be hardcoded `DEMO_HELPER_ID=1`). Every notification that should reach a person sets `userId`:
- New-errand alerts to helpers set `userId: helper.userId` (as well as `helperId`).
- "Helper accepted your errand" alerts to the requester set `userId: errand.requesterUserId` (only possible when the errand has a logged-in owner).

**Security rule (do not weaken):** all `/notifications` routes scope strictly to `req.user.id` and require login — they IGNORE any client-supplied `userId`/`helperId`. `GET` lists only your rows; `mark-all-read` and `:id/read` only touch rows where `userId === req.user.id`. (The OpenAPI spec still lists `userId`/`helperId` params for back-compat, but the server derives identity from auth — never trust the param.)
**Why:** the earlier version trusted caller-supplied ids → trivial IDOR (read/alter anyone's notifications by guessing an id).

# Contact-detail privacy (PHONE ONLY — pay-first)

Contact is **phone only**. There is no typed address: the requester's general `requesterLocation` is always visible; the exact meeting point/directions are arranged by WhatsApp/call. The helper UI builds WhatsApp + Call buttons from the phone (Irish `0…`→`353…`, `00…`→strip, via a `toWhatsAppLink` helper).

`requesterPhone` is private and gated **server-side in `formatErrand`**, not just in the UI. Returned only when viewer is the requester (`requesterUserId === currentUserId`) OR the assigned helper (viewer's owned `helpers.id === errand.helperId`); everyone else and any open errand gets `null`. Read routes pass `viewerHelperId` from `getViewerHelperId(req.user?.id)`.

**Legacy `requesterAddress`:** the DB column still exists but is NEVER returned — `formatErrand` strips it out, and it's gone from the OpenAPI `Errand`/`ErrandContactInput`/`ErrandInput` schemas. Create forces it to `null`. Do not re-expose it.

**Pay-first gate (sharing the number):** `POST /errands/:id/contact` is requester-only AND requires `status === "accepted"` AND, when the errand requires payment (`budgetAmount > 0`), requires `paymentStatus === "paid"` — otherwise 400 "Please pay first…". Free errands (no budget) skip the payment check. Frontend mirrors this: the share-number form only renders once `contactUnlocked` (`paid || !requiresPayment`); before that the requester sees a "pay first" note and the Pay button.
**Why:** escrow model — the requester pays into platform hold before any contact is exchanged, so the helper isn't contacted for paid work that was never funded.
**How to apply:** any new route that serializes an errand must pass `viewerHelperId` to `formatErrand`. Never collect/return an address. Keep the frontend `contactUnlocked` condition in lockstep with the server pay-gate.
