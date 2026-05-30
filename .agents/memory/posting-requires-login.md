---
name: Posting errands/lifts requires login
description: Why creating an errand requires an authenticated owner, and how mine/history is scoped
---

# Posting requires login

`POST /errands` requires `req.user` (401 otherwise) and always sets `requesterUserId = req.user.id`. The post-an-errand and request-a-lift forms gate behind login (show a LoginRequired prompt when not authenticated).

**Why:** an errand needs a stable owner identity so the requester can be *reliably* notified the moment a helper accepts, and so the "Your Errands" history page can list/delete only their own posts. Anonymous posts (legacy `requesterUserId == null`) get no acceptance notification.

**How to apply:**
- The "Your Errands" history page uses `listErrands` with `?mine=true`. The server reads `req.query.mine === "true"` directly (NOT the zod-coerced value) because `zod.coerce.boolean()` treats any non-empty string — even `"false"` — as true. `mine=true` also requires login (401).
- Deleting is owner-only and blocked while `paymentStatus === "paid"` (held funds must be released/refunded first); see errand-fk-cascade for the child-row cleanup.
