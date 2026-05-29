---
name: Errand deletion FK constraints
description: Why DELETE /api/errands/:id can 500, and how to clean test errands
---

Deleting an errand row fails if child rows reference it. `notifications.errand_id` has a FK to `errands.id` with no ON DELETE CASCADE, so deleting an errand that has notifications (or other children like payments) raises a foreign-key violation.

**Why:** The DELETE route does a plain `delete from errands` with no cascade and no child cleanup, so it returns 500 instead of a clean delete whenever children exist.

**How to apply:**
- To remove a test errand from the dev DB, delete child rows first: `DELETE FROM notifications WHERE errand_id = <id>;` then `DELETE FROM errands WHERE id = <id>;`.
- A freshly-created errand may already have notifications, so the API DELETE endpoint will 500 on it — don't rely on it for cleanup.
- If errand deletion ever needs to work end-to-end, either add ON DELETE CASCADE to child FKs or delete children in the route within a transaction.
