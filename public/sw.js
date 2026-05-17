/**
 * WridaChic — Service Worker
 * ─────────────────────────────────────────────────────────────────────
 * Goals (intentionally narrow — we are NOT building a full offline-first
 * app, just speeding up repeat visits and surviving flaky Maghreb 3G):
 *
 *   1. Pre-cache the brand shell (homepage, favicon, manifest, key fonts)
 *      so the second visit paints instantly.
 *   2. Cache-first for fonts and images (very stable, big payloads).
 *   3. Network-first with a stale-fallback for HTML pages so users see
 *      SOMETHING when offline, even if it's a few minutes old.
 *   4. Never cache API responses or /admin (these MUST be fresh).
 *
 * Cache bumped on every Next.js deploy via the version constant — old
 * caches are wiped in the `activate` event so we don't ship stale JS.
 */

const VERSION = 'v1';
const SHELL_CACHE = `wridachic-shell-${VERSION}`;
const ASSETS_CACHE = `wridachic-assets-${VERSION}`;
const PAGES_CACHE = `wridachic-pages-${VERSION}`;

const SHELL_URLS = [
  '/',
  '/manifest.json',
  '/wa-logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Heuristics for what to cache and how.
function isFontOrImage(url) {
  return /\.(woff2?|ttf|otf|eot|jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url.pathname);
}
function isHtmlNav(req) {
  return req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
}
function isExcluded(url) {
  // Anything dynamic or sensitive — let it hit the network every time.
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/account') ||
    url.pathname.startsWith('/_next/data/')
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only handle same-origin (skip third-party scripts: GA, Pixel, etc.)
  if (url.origin !== self.location.origin) return;
  if (isExcluded(url)) return;

  // 1) Fonts + images → cache-first, fall back to network.
  if (isFontOrImage(url)) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // 2) HTML navigation → network-first with stale-while-fallback so the
  //    user sees SOMETHING when offline.
  if (isHtmlNav(req)) {
    event.respondWith(
      caches.open(PAGES_CACHE).then(async (cache) => {
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          const hit = await cache.match(req) || await cache.match('/');
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // 3) Everything else (JS chunks, CSS): stale-while-revalidate.
  event.respondWith(
    caches.open(ASSETS_CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      const networkPromise = fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || networkPromise;
    })
  );
});
