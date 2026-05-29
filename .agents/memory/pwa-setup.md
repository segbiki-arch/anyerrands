---
name: PWA on Vite static-serve artifact
description: Installable PWA for the anyerrands web artifact — service worker, manifest, install prompt; Replit static-serve gotchas
---

# PWA for the anyerrands web artifact

AnyErrands is an installable PWA. Manifest, service worker, icons, and offline page
live in `artifacts/anyerrands/public/` (copied verbatim into `dist/public` by Vite).
The install UX is `src/components/install-prompt.tsx` (mounted in `App.tsx`).

**Service worker is registered PROD-only** (`import.meta.env.PROD` in `main.tsx`).
**Why:** a service worker in the Vite dev server intercepts/caches and breaks HMR and
the proxied dev preview. Installability only matters on the live HTTPS site anyway.

**Navigation caching is network-first; the offline fallback shell must be read from the
SAME cache the latest navigation was written to.** Originally navigations were written to
the runtime cache but the offline fallback read the shell from the static (precache) cache,
so offline users got a stale `index.html`. Keep the write target and the fallback read
target consistent.

**Static-serve + SPA rewrite gotcha:** the artifact uses `serve = "static"` with a
catch-all rewrite `/* -> /index.html`. This relies on the static server serving real
files (`/sw.js`, `/manifest.webmanifest`, `/offline.html`, `/icons/*`) BEFORE applying the
SPA fallback. After publishing, verify with curl that those exact paths return the real
file (correct MIME), not rewritten HTML — if they return HTML, installability breaks and
explicit rewrite exceptions are needed.

**Icons:** generated from the brand logo SVG (`anyerrands-logo.tsx`) via ImageMagick
(`magick`, the only rasterizer available — no sharp/rsvg/inkscape). Sources are
`public/icons/icon.svg` (full-bleed, "any") and `maskable.svg` (safe-zone padded, "maskable").
