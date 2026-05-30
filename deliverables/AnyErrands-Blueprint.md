# AnyErrands — Project Blueprint

**Live site:** https://anyerrands.live
**Owner:** Chus (founder, owner, and administrator)
**Document prepared:** 30 May 2026
**Status:** Live / in production

> This document is a complete description of the AnyErrands web application — what it
> does, how it is built, and how it fits together — plus a practical set of measures
> for protecting it as your property. Keep a copy somewhere safe and dated; it is
> useful evidence of authorship and a reference for any developer you work with.

---

## 1. What AnyErrands Is

AnyErrands is a community errands and lifts marketplace for **Nenagh, Co. Tipperary,
Ireland**. It connects neighbours who need small jobs done (shopping, lifts, garden
help, etc.) with local "helpers" who are willing to do them for an agreed amount.

The platform handles the full journey: posting a request, a helper accepting it,
secure payment held in escrow, completion, payout to the helper, ratings, and
moderation — all in one place, with a yellow-and-black brand identity.

**The core idea:** a trusted, local-first way to get everyday tasks done and to earn
money helping neighbours, with money handled safely so nobody is left out of pocket.

---

## 2. How It Works (User Journeys)

**For someone who needs help (the "requester"):**
1. Signs in and posts an errand (title, description, category, location, budget).
2. A local helper accepts the errand.
3. The requester pays — the money is held securely (escrow), not released yet.
4. When the job is done, the requester confirms completion.
5. The payment is released to the helper (minus the platform fee), and the requester
   can leave a review.

**For someone who wants to earn (the "helper"):**
1. Creates a helper profile (bio, skills, location).
2. Completes secure payment onboarding so they can receive payouts.
3. Accepts errands, completes them, and gets paid automatically on completion.
4. Builds up a rating and a track record of completed errands.

**For you (the owner/administrator):**
- See community numbers at a glance (registered users, helpers, errands, reports).
- Review and resolve reports about helper conduct.
- Manage helper profiles and remove duplicates.

---

## 3. Feature Inventory (Pages)

| Page | What it does |
|------|--------------|
| Home (`/`) | Landing page: hero, live errand metrics, popular categories, latest requests |
| Browse Errands (`/errands`) | Browse and filter errands by status and category |
| Post an Errand (`/errands/new`) | Create a new errand with budget and location |
| My Errands (`/my-errands`) | History of errands the logged-in user posted |
| Request a Lift (`/lifts/new`) | Specialised form for requesting rides/lifts |
| Errand Detail (`/errands/:id`) | Full view of one errand: status, requester, assigned helper |
| Find Helpers (`/helpers`) | Directory of helpers with ratings and completed counts |
| Become a Helper (`/helpers/new`) | Onboarding to create a helper profile |
| Helper Profile (`/helpers/:id`) | A helper's bio, skills, reviews, and activity |
| Errands Map (`/map`) | Interactive map of errand locations in the Tipperary area |
| Profile (`/profile`) | Manage personal account details |
| **Admin Overview (`/admin`)** | Owner dashboard: registered users, helpers, errands, reports |
| Admin Reports (`/admin/reports`) | Queue for reviewing reports on helper conduct |
| Admin Helpers (`/admin/helpers`) | Manage and clean up helper profiles |
| Terms (`/terms`) | Terms and conditions |
| Help Centre (`/help`) | Guidance on how to use the site |

Admin pages are only visible and usable by you and any approved administrator.

---

## 4. System Architecture (Plain Language)

AnyErrands is made of four cooperating parts:

1. **The website (what people see)** — a fast, app-like interface that works on phones
   and computers, and can be installed to a phone's home screen like a real app.
2. **The server (the brain)** — handles requests, enforces the rules (who can do what),
   talks to the payment provider, and keeps everything secure.
3. **The database (the memory)** — securely stores users, errands, helpers, payments,
   reviews, and reports.
4. **The payment system (the money)** — handled by Stripe, so card details and payouts
   are managed by a trusted, regulated provider rather than by your site directly.

These are kept as separate, well-organised pieces so the app is reliable, secure, and
straightforward to extend.

---

## 5. Technical Architecture (For a Developer)

- **Monorepo:** pnpm workspace with shared libraries and deployable "artifacts".
- **Frontend:** React 19 + Vite, Tailwind CSS v4, Radix-based UI components, Wouter
  for routing, TanStack Query for data fetching/caching. Delivered as a PWA
  (manifest + service worker, install prompt, offline support).
- **Backend:** Node.js + Express, organised by route modules (auth, errands, helpers,
  stripe, admin) with dedicated middleware for authentication and admin authorisation.
- **Database:** PostgreSQL, accessed via Drizzle ORM for type-safe queries and schema
  management.
- **Contract-first API:** an OpenAPI spec is the single source of truth; Orval
  generates TanStack Query hooks and Zod validation schemas so the frontend and backend
  stay in sync.
- **Shared libraries:** database schema, generated types/validation, and auth helpers
  are shared across the workspace.

---

## 6. Data Model (Database Tables)

| Table | Purpose | Key fields |
|-------|---------|-----------|
| `users` | Signed-in users | id, email, first/last name, profile image, timestamps |
| `sessions` | Login session storage | sid, session data, expiry |
| `helpers` | Helper profiles | id, user_id, name, location, bio, skills, rating, errands_completed, stripe_account_id |
| `errands` | Core request records | id, title, description, category, status, requester, budget, helper_id, payment status & IDs, paid timestamps |
| `categories` | Errand types | id, name, icon, description |
| `notifications` | Activity alerts | id, user_id, helper_id, errand_id, message, read |
| `reports` | Moderation requests | id, errand_id, helper_id, reporter, reason, description, status |
| `reviews` | Helper feedback | id, errand_id, helper_id, reviewer, rating, comment |

**Errand status:** open → accepted → completed.
**Payment status:** unpaid → paid → (refunded if needed).

---

## 7. API Endpoints (Server Capabilities)

**Authentication** — sign in/out via Replit Auth (secure OpenID Connect), and check
the current user and admin status.

**Errands** — list/filter, create, view, edit (owner only, while still open), delete
(only if no payment is held), accept (helper), confirm completion (triggers payout),
and report a helper.

**Helpers** — list, register, view, edit profile, and view private earnings (owner of
the profile only).

**Payments (Stripe)** — provide the publishable key, onboard helpers for payouts,
create a secure escrow checkout for requesters, and handle payment events via webhook.

**Admin** — platform statistics, list and update reports, and remove problematic or
duplicate helper profiles. All admin endpoints are protected server-side.

---

## 8. Third-Party Services Used

- **Stripe** — payments, escrow, and helper payouts via Stripe Connect (Express). The
  platform takes a 10% fee; the helper receives the remainder on completion. Card data
  is handled by Stripe, not stored on your site.
- **Replit Auth** — secure sign-in and user identity.
- **Leaflet / OpenStreetMap** — the interactive errands map.
- **PWA** — installable app experience with offline support.
- **Hosting** — deployed and served on Replit at anyerrands.live over HTTPS.

---

## 9. Security Measures Already in Place

- Sign-in required for sensitive actions; ownership checks so people can only edit or
  act on their own errands and profiles.
- Admin areas protected on the server (not just hidden in the interface) via an admin
  email allowlist.
- Payments held in escrow and only released by the requester on completion, with
  safeguards against double payouts.
- Private data (contact details, earnings) restricted to the people entitled to see it.
- Secrets (payment keys, session secret) stored securely as environment secrets, never
  in the code.
- HTTPS everywhere on the live site.

---

## 10. Protecting AnyErrands (Your Property)

You created AnyErrands, so the **expression** of it — the source code, the design, the
brand, the written content — is yours. A few important points, then concrete measures.

**A note on what can and cannot be protected:** an *idea* on its own (a "marketplace
for errands") cannot be owned by anyone. What you *can* protect is the specific way
you've built and presented it: the code, the brand name and logo, the database, the
designs, and your customer relationships. The measures below focus on those.

This is general guidance, not legal advice. For anything formal — trademarks,
contracts, company structure — confirm with an Irish solicitor or the relevant office.

### A. Legal protection

1. **Copyright (automatic, but document it).**
   In Ireland and the EU, copyright in your code, text, and designs exists
   automatically the moment you create it — no registration needed. To make it
   *provable*, keep dated evidence of authorship: this blueprint, your version history
   (the project already keeps a full dated history of every change), and saved exports.
   Add a copyright line to your site footer and code, e.g.
   `© 2026 [Your full legal name / company]. All rights reserved.`

2. **Trademark the name and logo.**
   "AnyErrands" and your yellow/black logo are brand assets. Registering them as
   trademarks stops others trading under the same name. Options:
   - **Ireland only:** the Intellectual Property Office of Ireland (IPOI).
   - **Whole EU:** the EU Intellectual Property Office (EUIPO) — broader, costs more.
   Do a name search first to check it's available.

3. **Own the domain and accounts.**
   Make sure **anyerrands.live** (and ideally `.ie`/`.com` variants) is registered in
   *your* name, with auto-renew on. Keep the login to the domain, hosting, Stripe, and
   email under your control — not a contractor's personal account.

4. **Put the business in a legal entity.**
   Operating through a registered business (sole trader or limited company via the CRO,
   the Companies Registration Office) separates you from the business, makes ownership
   clear, and is expected by banks and Stripe. A limited company also lets the *company*
   own the IP cleanly.

5. **Get IP assignment from anyone who works on it.**
   This is the big one. If a developer, designer, or freelancer (or even an AI tool
   under a contract) contributes, get a **written agreement assigning all IP to you/your
   company**. Without it, a contractor can retain rights to what they made. Anyone you
   pay to build features should sign this *before* starting.

6. **Use NDAs for sensitive discussions.**
   Before showing the inner workings to a potential partner, investor, or contractor,
   have them sign a Non-Disclosure Agreement.

7. **Keep Terms of Service and a Privacy Policy current.**
   You already have a Terms page. Make sure it (a) states you own the platform and its
   content, (b) sets the rules users agree to, and (c) is paired with a GDPR-compliant
   privacy policy, since you handle personal data of Irish/EU users. A solicitor can
   tailor these.

### B. Technical protection

8. **Keep the source code private and backed up.**
   The code should live in a private repository under your account, with regular
   backups you control (download a copy periodically). Never make the code public.

9. **Lock down access and secrets.**
   - Use strong, unique passwords and two-factor authentication on every account
     (domain, hosting, Stripe, email, repository).
   - Keep payment keys and the session secret as environment secrets (already done) —
     never paste them into code, chats, or screenshots.
   - Only give collaborators the minimum access they need, and remove it when they're
     done.

10. **Keep dated backups of the database.**
    Your customer and errand data is valuable. Take regular database backups and store
    them securely so you can recover from mistakes or outages.

11. **Maintain the audit trail.**
    The project keeps a full, dated history of every change. Don't delete it — it's both
    a recovery tool and evidence of when and by whom things were created.

### C. Business / operational protection

12. **Don't rely on a single person.**
    Make sure you (the owner) always hold the master logins. If you work with a
    developer, you should still be able to access and move everything without them.

13. **Document key decisions and credentials safely.**
    Keep a secure record (a password manager) of where everything lives: domain
    registrar, hosting, Stripe, email, repository. This blueprint covers the "what";
    that record covers the "where".

14. **Protect the brand in public.**
    Secure matching social media handles for AnyErrands so others can't impersonate the
    brand, even if you don't use them heavily yet.

---

## 11. Recommended Next Steps (Checklist)

- [ ] Add a `© 2026 [your name/company]` line to the site footer.
- [ ] Confirm the domain anyerrands.live is registered in your name with auto-renew on.
- [ ] Turn on two-factor authentication for domain, hosting, Stripe, and email.
- [ ] Save a copy of this blueprint and a code/database backup somewhere safe and dated.
- [ ] Decide on a business structure (sole trader vs limited company) — talk to an accountant.
- [ ] Do a trademark name search for "AnyErrands" and decide IPOI (Ireland) vs EUIPO (EU).
- [ ] Have a solicitor review your Terms of Service and add a GDPR privacy policy.
- [ ] Prepare a standard IP-assignment + NDA to use with any future contractor.
- [ ] Set up a password manager and record all master credentials.

---

*Prepared as a record of the AnyErrands platform and its protection. Keep this document
dated and stored securely.*
