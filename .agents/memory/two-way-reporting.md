---
name: Two-way reporting
description: Reports table serves both customer→helper and helper→customer reports; how they are distinguished and authorized.
---

The single `reports` table holds BOTH directions of abuse reports, distinguished
by `reportType` ("helper" | "requester", default "helper"):
- helper reports (customer files against helper): name a `helperId`.
- requester reports (assigned helper files against customer): name a
  `reportedUserId` (the requester's user id); `helperId` still set as reporter context.
`helperId` is nullable because requester-side rows may not be helper-centric.

**Routes:** `POST /errands/:id/report` (requester-only) and the mirror
`POST /errands/:id/report-requester` (assigned-helper-only). The helper route
maps `req.user.id` → helper profile and requires it to equal `errand.helperId`,
and requires `errand.requesterUserId` to exist (else 400 — no registered customer).

**Why:** there was originally only customer→helper reporting; helpers needed a
symmetric way to report no-shows / payment issues / unsafe customers.

**How to apply:** the admin dashboard branches on `reportType` to label the
reported party (Helper vs Customer) — when adding report fields, surface them in
BOTH admin select queries (list + patch) and keep OpenAPI Report/ReportWithContext
enums in sync. Frontend gates the helper's "Report Customer" button on
`errand.hasRegisteredRequester` (added to formatErrand output).
