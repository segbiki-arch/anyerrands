---
name: Helper/errand deletion FK constraints
description: Why deleting an errand or helper row can 500, and how to delete safely
---

No child FKs in this DB use ON DELETE CASCADE, so deleting any parent row fails with a foreign-key violation whenever children reference it. You must clean children first (inside a transaction in route code).

**errands.id** children: `notifications.errand_id`, `reports.errand_id` (both NOT NULL). Deleting an errand with notifications raises a FK violation.

**helpers.id** children: `notifications.helper_id` (NOT NULL), `reports.helper_id` (NOT NULL), `errands.helper_id` (NULLABLE). To delete a helper: delete its notifications + reports, then NULL out `errands.helper_id` (preserve the errand), then delete the helper — all in one `db.transaction`.

**Why:** plain `delete from <parent>` with no cascade and no child cleanup returns 500 whenever children exist; a non-transactional multi-step delete can also leave a half-deleted state.

**How to apply:**
- Admin helper delete (DELETE /admin/helpers/:id) already does the transactional cleanup above — use it as the pattern for any parent delete.
- For ad-hoc dev cleanup, delete child rows first then the parent.
- A freshly-created errand may already have notifications, so a naive errand DELETE will 500 on it.
