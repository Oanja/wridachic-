'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PCard } from '@/components/ui/PCard';
import { TINTS, CATEGORIES } from '@/lib/data';
import { pick, pickField } from '@/lib/i18n';
import { useApp } from '@/store/AppContext';
import type { Product } from '@/lib/types';

// First N products painted on initial load — everything else is hidden
// behind a sentinel that fires only when the user scrolls near it.
// 12 fits roughly 2-3 screen heights on mobile, so most users never even
// trigger the second page.
const INITIAL_VISIBLE = 12;
const LOAD_MORE_BATCH = 12;

interface ShopPageProps {
  products: Product[];
  initialCat?: string;
  title?: { fr: string; en: string; ar: string };
  filterNew?: boolean;
}

export function ShopPage({ products, initialCat = 'all', title, filterNew = false }: ShopPageProps) {
  const { lang, wishlist, toggleWish } = useApp();
  const [cat, setCat] = useState<string>(initialCat);
  const [sort, setSort] = useState<'featured' | 'new' | 'price-asc' | 'price-desc'>('featured');
  const [visible, setVisible] = useState<number>(INITIAL_VISIBLE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // `cat` is either:
  //   "all"            → no filter
  //   "tag:new" / etc. → filter by Product.tag
  //   anything else    → filter by Product.cat
  const filtered = useMemo(() => {
    let l = products;
    if (cat !== 'all') {
      if (cat.startsWith('tag:')) {
        const tag = cat.slice(4);
        l = l.filter((p) => p.tag === tag);
      } else {
        l = l.filter((p) => p.cat === cat);
      }
    }
    if (filterNew) l = l.filter((p) => p.tag === 'new');
    if (sort === 'price-asc') l = [...l].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') l = [...l].sort((a, b) => b.price - a.price);
    if (sort === 'new') l = [...l].sort((a, b) => (b.tag === 'new' ? 1 : 0) - (a.tag === 'new' ? 1 : 0));
    return l;
  }, [products, cat, sort, filterNew]);

  // Reset pagination whenever the filter changes so the user always
  // sees the top of the new category, not page 4 of the old one.
  useEffect(() => { setVisible(INITIAL_VISIBLE); }, [cat, sort, filterNew]);

  // IntersectionObserver-driven infinite scroll. We attach to a tiny
  // sentinel below the grid; when it enters the viewport (root margin
  // adds a 600 px head-start so the next batch is ready before the user
  // hits the bottom) we bump `visible` and the grid re-renders.
  useEffect(() => {
    if (visible >= filtered.length) return; // nothing left to reveal
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + LOAD_MORE_BATCH, filtered.length));
        }
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, filtered.length]);

  const cats = [
    { id: 'all',      name: pick(lang, 'Tout',         'All',          'الكل'),         nameEn: '', nameAr: '' },
    ...CATEGORIES,
    { id: 'tag:new',  name: pick(lang, 'Nouveautés',   'New arrivals', 'الجديد'),       nameEn: '', nameAr: '' },
    { id: 'tag:best', name: pick(lang, 'Best-sellers', 'Best-sellers', 'الأكثر طلباً'), nameEn: '', nameAr: '' },
  ];

  const heading = title
    ? title[lang]
    : pick(lang, 'La boutique.', 'The shop.', 'المتجر.');

  return (
    <div className="page2" style={{ padding: '40px 0 80px' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid var(--ink)', paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ minWidth: 0 }}>
            <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>/ {pick(lang, 'boutique', 'shop', 'المتجر')} /</span>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 7vw, 72px)', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {heading}
            </h1>
            <span className="mono" style={{ fontSize: 12, opacity: 0.5, display: 'inline-block', marginTop: 10 }}>
              {filtered.length} {pick(lang, 'articles', 'items', 'قطعة')}
            </span>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            style={{ padding: '8px 14px', border: '1.5px solid var(--ink)', borderRadius: 999, background: 'var(--paper)', fontFamily: 'inherit', fontSize: 13 }}
          >
            <option value="featured">{pick(lang, 'Sélection', 'Featured', 'مميز')}</option>
            <option value="new">{pick(lang, 'Nouveautés', 'New arrivals', 'الجديد')}</option>
            <option value="price-asc">{pick(lang, 'Prix croissant', 'Price low to high', 'السعر ↗')}</option>
            <option value="price-desc">{pick(lang, 'Prix décroissant', 'Price high to low', 'السعر ↘')}</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              style={{
                padding: '9px 18px', borderRadius: 999, border: '1.5px solid var(--ink)',
                background: cat === c.id ? 'var(--ink)' : 'transparent',
                color: cat === c.id ? 'var(--paper)' : 'var(--ink)',
                fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {c.nameEn ? pickField(lang, c.name, c.nameEn, c.nameAr) : c.name}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
            <p className="mono" style={{ fontSize: 13, marginBottom: 6 }}>○</p>
            <p>{pick(lang, 'Aucun article ne correspond à ces filtres.', 'No items match these filters.', 'لا توجد قطع تطابق الفلاتر.')}</p>
          </div>
        ) : (
          <>
            <div className="g3 reveal-stagger">
              {filtered.slice(0, visible).map((p, i) => (
                <PCard key={p.id} product={p} lang={lang} onWish={toggleWish} wished={wishlist.includes(p.id)} tint={TINTS[i % TINTS.length]} />
              ))}
            </div>
            {/* Invisible 1 px sentinel — the IntersectionObserver above
                watches it and bumps `visible` when it scrolls into view. */}
            {visible < filtered.length && (
              <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
