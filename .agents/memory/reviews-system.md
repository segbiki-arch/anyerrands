---
name: Reviews system
description: How reviews work and the requester-only authz model
---

# Reviews

One review per completed errand that has a helper. Enforced by a UNIQUE constraint on `reviews.errandId` PLUS an explicit pre-check, and a 23505 catch on insert (race → friendly 400, not 500). On each new review, `helpers.rating` is recomputed as the avg of all that helper's review ratings (numeric stored as string, `.toFixed(1)`).

## Requester-only authz (locked down)
`POST /errands/:id/review` requires the caller to be logged in AND to be the person who posted the errand: `errand.requesterUserId === req.user.id`. Returns 401 if not logged in, 403 if logged in but not the poster.

- `errands.requesterUserId` (nullable text → users.id) is captured at errand creation from `req.user?.id`.
- `formatErrand(e, currentUserId?)` returns computed `isRequester` (in OpenAPI Errand schema). Frontend errand-detail only shows the "Leave a review" button when `errand.isRequester` (and completed + has helper).

**Consequence / known tradeoff:** errands posted by anonymous (not-logged-in) users have `requesterUserId = null`, so they can NEVER be reviewed — nobody satisfies the ownership check. Same for legacy errands created before this column existed. This is intentional: locking down beats allowing fake/hijacked reviews. The rest of the app (accept/complete/report) is still open-write & name-based; reviews are the one flow deliberately made stricter at the user's request.
