'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Watches the DOM for `.reveal`, `.reveal-stagger`, `.reveal-img` elements and
 * adds `.is-visible` when they enter the viewport. Re-scans on route changes
 * and whenever the DOM changes (instead of polling on a setInterval).
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    const observe = () => {
      document.querySelectorAll('.reveal:not(.is-visible), .reveal-stagger:not(.is-visible), .reveal-img:not(.is-visible)')
        .forEach((el) => io.observe(el));
    };
    observe();

    // Catch elements added later (e.g. after data fetch / filter change) without
    // polling. MutationObserver fires only when the DOM actually changes.
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, [pathname]);

  return null;
}
