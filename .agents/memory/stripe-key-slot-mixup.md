---
name: Stripe key slot mix-up
description: User pasting pk/sk keys into the wrong secret slots when given multiple at once
---

When walking a non-technical user through pasting Stripe keys into Replit Secrets, they may paste values into the wrong-named secret (e.g. `pk_live_...` ended up in `SLACK_TEST_API_KEY` and `sk_live_...` in `STRIPE_PUBLISHABLE_KEY`).

**Why:** Copy/paste sequence + visually similar key strings + multiple secrets on screen at once = easy to drop into the wrong row.

**How to apply:**
- Always give one paste instruction per message when multiple keys are involved, not a list of three.
- Include the prefix mnemonic each time: `pk_` = publishable, `sk_` = secret, `whsec_` = webhook signing.
- After they say "done", verify by asking them to reveal each secret and confirm the prefix matches the slot name — don't rely on server logs alone, because the server only shows the value of `STRIPE_PUBLISHABLE_KEY` (it can't see what's in unrelated slots).
- If the dev server reports `mode: "TEST"` after a "done", suspect a slot mix-up before suspecting save issues or activation problems.
