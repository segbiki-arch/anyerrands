---
name: Signup admin notifications
description: Admins get a notification-bell alert on each new user signup; relies on errandId being nullable and atomic new-user detection.
---

# Signup admin notifications

Every brand-new user signup inserts a notification (one per admin in the
`ADMIN_EMAILS` allowlist, excluding the new user themselves) so Chus sees it in
the bell. These notifications have **no errandId**.

## Key constraints

- `notifications.errandId` is **nullable** (DB schema, OpenAPI `Notification`
  schema, and the frontend bell's nav guard all depend on this). Any
  non-errand notification type must keep errandId null and the client must
  guard navigation with `if (errandId != null)`.
- New-user detection must be **atomic**. Use `INSERT ... ON CONFLICT DO NOTHING
  RETURNING` (a returned row == new user), then a separate UPDATE on conflict.
  **Why:** a pre-read existence check before upsert is race-prone — concurrent
  first-logins (web `/callback` + mobile token-exchange) can both see "no row"
  and each fire a duplicate signup alert.
- Signup notification insert is wrapped in try/catch so it can never block
  login.

## Prod note

Making errandId nullable in prod is applied automatically by the Replit Publish
flow (schema diff). Do NOT write migration scripts for production.
