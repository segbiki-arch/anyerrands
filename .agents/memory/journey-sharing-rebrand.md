---
name: Journey Sharing rebrand
description: The "lift" feature is presented as "Journey Sharing" in the UI — what is display-only vs the detection key, and the cost-share/compliance framing.
---

The user-facing "lift" feature is branded **"Journey Sharing"**. The rebrand is **display/wording/pricing-copy only** — no backend logic changes.

**Detection key — do NOT rename:** the DB `errands.category` value `"Lifts & Transport"` is the source of truth. The frontend derives `isLift = errand.category === "Lifts & Transport"` and the `/lifts/new` route is kept. Renaming the category value would break detection everywhere. Only change *display* text.

**Compliance framing (cost-sharing, not transport-for-hire):**
- Frame as neighbours sharing a drive and splitting travel costs. Explicitly say "not a taxi or hire service".
- Avoid taxi / fare / hire / earn-from-driving language.
- The 10% platform fee is labelled **"Service fee"** in journey contexts (NOT "commission" or "platform fee").
- Show a pre-payment breakdown for lifts: Your contribution / Service fee (10%) / Total to pay / Driver receives.

**Why:** the owner needs the feature to read as community cost-sharing for regulatory/insurance reasons, while the backend remains the generic errand+escrow flow (requester posts → driver accepts → pay → confirm releases 90%).

**How to apply:** when any payout figure is shown for a lift, mirror the server's cent-based math exactly (`amountCents = round(budget*100)`, `feeCents = round(amountCents*10/100)`, driver = `amountCents - feeCents`) — do not compute from euros directly, or the display drifts by a cent.
