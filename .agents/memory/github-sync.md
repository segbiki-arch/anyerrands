---
name: GitHub mirror / sync
description: How the project is mirrored to GitHub and how to push new changes
---

# GitHub mirror

The project is mirrored to a **public** GitHub repo: `segbiki-arch/anyerrands` (owner login `segbiki-arch`), default branch `main`. Connected via the Replit **GitHub connection** (connector id `conn_github_...`).

- **What is allowed on the public repo:** code + full git history + `database/schema.sql` (schema-only `pg_dump`, NO rows). NEVER push real user data (names/emails/phones/addresses) or secrets to it — owner Chus explicitly chose code + structure only after being warned about GDPR/PII exposure. If a full data backup is ever wanted, use a SEPARATE PRIVATE repo.
- **Token:** get it fresh at push time — `(await listConnections("github"))[0].settings.access_token` (a `gho_` OAuth token). Never write it to a file or print it; pass via env to a git credential helper.

**How to push (run inside code_execution, async `spawn`, NOT `spawnSync` — sync blocks the event loop and fails):**
```js
const token = (await listConnections("github"))[0].settings.access_token;
const helper = '!f() { echo "username=x-access-token"; echo "password=${GH_PUSH_TOKEN}"; }; f';
// git add -A; git -c user.name=... -c user.email=... commit -m "..."; then:
// git -c credential.helper=<helper> push https://github.com/segbiki-arch/anyerrands.git main:main  (env GH_PUSH_TOKEN=token)
```
**Why:** Chus asked that "everything we do" be transferred to GitHub. There is no hands-off auto-sync wired up — the agent must commit + push at the end of any change set. Platform auto-commit happens AFTER the turn ends, so to get the current turn's edits onto GitHub you must commit them yourself first, then push.
