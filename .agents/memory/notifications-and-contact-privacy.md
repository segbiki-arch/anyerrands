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

# Contact-detail privacy (requesterAddress / requesterPhone)

These are private and gated **server-side in `formatErrand`**, not just hidden in the UI. They are returned only when the viewer is the requester (`requesterUserId === currentUserId`) OR the assigned helper (viewer's owned `helpers.id === errand.helperId`); everyone else and any open errand gets `null`. Read routes pass `viewerHelperId` from `getViewerHelperId(req.user?.id)` (one lookup per request).
**Why:** previously contact details were returned to ANY viewer of a non-open errand — a PII leak. The requester sets them post-acceptance via `POST /errands/:id/contact` (requester-only).
**How to apply:** any new route that serializes an errand must pass `viewerHelperId` to `formatErrand`, or it will leak/over-hide contact info.
