---
name: Deploy env scope (shared vs production)
description: Env vars set in the "shared" scope did NOT reach the published Replit deployment; admin allowlist read as empty in prod
---

# Shared-scope env vars may not reach the published app

`ADMIN_EMAILS` was set in the **"shared"** environment scope. Dev read it fine, but the
**published (production) deployment saw it as empty** — `isAdminEmail()` returned false for
a correctly-allowlisted login, so the Admin menu never appeared on the live site.

**Fix:** delete the var from `shared`, then set it explicitly in BOTH `development` and
`production` scopes. After republish, the live `/api/admin-debug` count went 0 → 2.

**Why:** Empirically, the "shared" slot did not propagate to the deployed runtime here,
despite docs implying it should. Per-environment (explicit `production`) values do reach it.

**How to apply:** When a setting works in dev but is missing/empty on the published app,
suspect env scope first. Set it explicitly in the `production` scope (and `development`),
not just `shared`. A counts-only unauthenticated debug endpoint (no PII) is a fast way to
confirm what the live runtime actually loaded — remove it once verified.
