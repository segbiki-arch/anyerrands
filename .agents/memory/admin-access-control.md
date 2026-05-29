---
name: admin access control
description: How admin-only access is enforced in AnyErrands (allowlist + middleware + UI gating)
---

# Admin access control

Admin access is an **email allowlist** in the `ADMIN_EMAILS` env var (comma-separated, case-insensitive), read by `isAdminEmail()` in `artifacts/api-server/src/lib/admin.ts`.

- Backend is the real security boundary: `requireAdmin` middleware (401 if not logged in, 403 if email not allowlisted) gates every admin route in `artifacts/api-server/src/routes/admin.ts`.
- `isAdmin` is computed server-side and surfaced on `/api/auth/user` (added to `AuthUserEnvelope` in the OpenAPI spec; regenerate codegen after spec edits).
- Frontend gating is UX-only: app-local `useIsAdmin()` hook hides the sidebar Admin section and guards the `/admin/reports` route. The shared `lib/replit-auth-web` `useAuth` hook intentionally was NOT changed — admin is app-specific.

**Why:** admin endpoints previously had zero auth. Allowlist lets the non-technical owner add/remove admins via env var without code changes.

**How to apply:** when adding new admin endpoints, attach `requireAdmin`. To change who is admin, edit `ADMIN_EMAILS` (shared env) — must redeploy for prod to pick it up.

**Account-confusion gotcha:** login is via Replit Auth, so `isAdmin` matches the email of whatever Replit account the owner is *actually* signed into — not an email they think they typed. The owner (Chus) has two accounts: anyerrandslive@hotmail.com and the everyday chudyspassion@hotmail.com. Symptom "logged in as admin but no Admin menu" was really them using the everyday account. Fix: put the everyday account email in `ADMIN_EMAILS` too. Both are now allowlisted.
