---
name: New-user welcome experience
description: How the one-time welcome popup/notification/email works and why email is env-key based, not a connector
---

# Welcome experience (customer + helper)

Every new user gets three channels on first signup (customer) or first helper-profile creation (helper): an animated popup, an in-app notification (the bell — this is the "push"), and a welcome email. Content + CTA differ by variant, personalized with first name. Customer CTA → /errands/new ("Post Your First Errand"); helper CTA → /profile ("Start Earning").

## Show-once gating
Popup visibility is server-tracked via `welcomeSeenAt` (nullable timestamp) on BOTH `users` and `helpers`. Frontend `WelcomeManager` queries GET /api/welcome and shows helper popup first, then customer; marking seen POSTs to the seen endpoints and persists across devices. Do not move this gate to localStorage — cross-device persistence is the point.

## Sends are fire-and-forget
`sendWelcome` swallows all errors internally (notification insert and email are independently try/caught) and is called with `void` (NOT awaited) in auth.ts and helpers.ts. **Why:** a slow/hung outbound email must never delay or break signup/helper creation. Because it never throws, `void` is safe (no unhandled rejection).

## Email is env-key based, NOT a connector
**Why:** the Resend integration/connector was proposed to the owner (Chus) and dismissed. Email goes through Resend's HTTP API via `fetch`, reading `RESEND_API_KEY` and `EMAIL_FROM` from env. `sendEmail` is a logged no-op when `RESEND_API_KEY` is missing — so emails are inactive until Chus supplies the key AND verifies a sending domain in Resend. The popup + in-app notification work without any email config.
