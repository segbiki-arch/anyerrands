---
name: Replit Auth setup
description: How auth is wired in this project — gotchas and decisions.
---

# Replit Auth

## Key decisions

- `openid-client` v6 functional API — no `new Issuer()` patterns
- Sessions stored in PostgreSQL `sessions` table; users in `users` table
- `lib/replit-auth-web` is the browser hook package (`useAuth()`) — DO NOT use generated API client hooks for auth
- `replit-auth-web` needs `vite/client` types: added `lib/replit-auth-web/src/vite-env.d.ts` with `/// <reference types="vite/client" />` and `vite: catalog:` devDep in its package.json

**Why:** codegen runs `typecheck:libs` which checks replit-auth-web as a composite lib; without vite types, `import.meta.env` causes TS2339.

## app.ts middleware order

1. Stripe webhook (raw body, BEFORE express.json)
2. pinoHttp logging
3. cors({ credentials: true, origin: true })
4. cookieParser()
5. express.json()
6. express.urlencoded()
7. authMiddleware
8. /api router

**Why:** cookieParser must be before authMiddleware; cors credentials:true required for cookie-based auth through Replit proxy.
