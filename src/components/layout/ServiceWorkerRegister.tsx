'use client';

import { useEffect } from 'react';

/**
 * Registers the public/sw.js service worker on first paint.
 *
 * Kept as a separate client component so the root layout can stay a
 * server component (better TTFB) — registration is non-critical and
 * runs entirely on the client after hydration.
 *
 * Why no fancy options:
 *   - scope defaults to '/' which is what we want
 *   - we don't care about update-on-reload here; the SW's `activate`
 *     event already wipes old version caches based on the VERSION
 *     constant inside sw.js
 *   - we silently swallow errors because service workers are a
 *     progressive enhancement — a failed registration must NEVER break
 *     the page itself
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Use requestIdleCallback so registration doesn't compete with
    // hydration on slow devices. Falls back to a 1 s timeout where the
    // API isn't available (older Safari).
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* swallow — never let SW failures break the site */
      });
    };
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(register);
    } else {
      setTimeout(register, 1000);
    }
  }, []);
  return null;
}
