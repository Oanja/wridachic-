'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Watches the DOM for `.reveal`, `.reveal-stagger`, `.reveal-img` elements and
 * adds `.is-visible` when they enter the viewport. Re-scans on route changes.
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
    const id = window.setInterval(observe, 600);
    return () => { io.disconnect(); window.clearInterval(id); };
  }, [pathname]);

  return null;
}
