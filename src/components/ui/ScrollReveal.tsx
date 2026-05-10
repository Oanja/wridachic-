'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SELECTOR = '.reveal:not(.is-visible), .reveal-stagger:not(.is-visible), .reveal-img:not(.is-visible)';

/**
 * Watches the DOM for `.reveal`, `.reveal-stagger`, `.reveal-img` elements and
 * adds `.is-visible` when they enter the viewport. Re-scans on route changes
 * and whenever the DOM changes (instead of polling on a setInterval).
 *
 * Above-the-fold elements are revealed synchronously on mount via
 * getBoundingClientRect, so the user never sees them blank — the
 * IntersectionObserver only handles below-the-fold content.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;

    // 1) Reveal everything already in viewport synchronously. The IntersectionObserver
    // would catch them too, but with a 1-2 frame delay that produces a flicker on
    // hero elements (text shows, images lag).
    const vh = window.innerHeight;
    const flushInitial = () => {
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) el.classList.add('is-visible');
      });
    };
    flushInitial();

    // 2) IntersectionObserver for whatever scrolls into view afterwards.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    const observe = () => {
      document.querySelectorAll(SELECTOR).forEach((el) => io.observe(el));
    };
    observe();

    // Catch elements added later (e.g. after data fetch / filter change) without
    // polling. MutationObserver fires only when the DOM actually changes.
    const mo = new MutationObserver(() => {
      flushInitial();
      observe();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, [pathname]);

  return null;
}
