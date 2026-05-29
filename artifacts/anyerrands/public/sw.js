/* AnyErrands service worker — network-first for navigations, cache-first for assets. */
const VERSION = "v1";
const STATIC_CACHE = `anyerrands-static-${VERSION}`;
const RUNTIME_CACHE = `anyerrands-runtime-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first so the app always updates, fall back to cache/offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(async () => {
          const runtime = await caches.open(RUNTIME_CACHE);
          const staticCache = await caches.open(STATIC_CACHE);
          return (
            (await runtime.match("/")) ||
            (await staticCache.match("/")) ||
            (await staticCache.match(OFFLINE_URL))
          );
        })
    );
    return;
  }

  // Static assets: cache-first, then network, and populate runtime cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
