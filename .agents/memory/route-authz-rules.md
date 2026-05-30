---
name: Route authorization rules
description: Non-obvious authz/ownership rules every mutating errand/report route must follow
---

# Mutating-route authorization rules

Every route that mutates data or returns private data must, in order:
1. Require login (`if (!req.user) return 401`).
2. Verify the logged-in user OWNS the resource (e.g. `errand.requesterUserId === req.user.id`, or helper.userId for helper-scoped routes). Never trust an id/name from the request body for ownership.
3. For state-sensitive edits, enforce the state guard ATOMICALLY in the `UPDATE ... WHERE` clause, not just a pre-check.

**Why:** Pre-launch audit found `PATCH /errands/:id` had NO auth and NO ownership check (anyone could edit any errand's budget), and `POST /errands/:id/report` accepted reports from anyone with a body-supplied reporter name. A separate-query status check is also a TOCTOU race — a helper could accept between the read and the write, letting the budget change after acceptance.

**How to apply:**
- PATCH errands: `WHERE id = ? AND requesterUserId = ? AND status = 'open'`, return 409 if no row matched. Budget/details are locked once an errand leaves `open`.
- Lifecycle status transitions (`open`→`accepted`→`completed`) belong ONLY in the dedicated endpoints (accept/complete/abort). Do NOT expose `status` in the `ErrandUpdate` OpenAPI schema — it was removed so PATCH can't corrupt lifecycle state.
- Report a helper: only the errand's requester (owner) may report, and only when accepted/completed with an assigned helper. Frontend `canReport` must also include `errand.isRequester` so the button is owner-only.
- `formatErrand` exposes `isRequester` (and gates `requesterPhone` to requester + assigned helper only) — reuse it for frontend ownership UX.

**Verified-safe routes (do not regress):** delete, accept, contact, complete, abort, review all check login + ownership. Admin routes gated by `requireAdmin` (email allowlist). Stripe escrow: complete/release is requester-only, abort/refund is assigned-helper-only, checkout blocks double-pay, webhooks idempotent.

**Map popup XSS:** `map.tsx` Leaflet popup HTML is safe — every interpolated field uses a custom `escapeHtml()` and the id uses `encodeURIComponent()`. Semgrep flags it as html-in-template-string but it's a false positive (doesn't recognize the custom helper).
