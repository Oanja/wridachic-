'use client';

import { useMemo, useState } from 'react';
import { PCard } from '@/components/ui/PCard';
import { TINTS, CATEGORIES } from '@/lib/data';
import { useApp } from '@/store/AppContext';
import type { Product } from '@/lib/types';

interface ShopPageProps {
  products: Product[];
  initialCat?: string;
  title?: { fr: string; ar: string };
  filterNew?: boolean;
}

export function ShopPage({ products, initialCat = 'all', title, filterNew = false }: ShopPageProps) {
  const { lang, wishlist, toggleWish } = useApp();
  const [cat, setCat] = useState<string>(initialCat);
  const [sort, setSort] = useState<'featured' | 'new' | 'price-asc' | 'price-desc'>('featured');

  const filtered = useMemo(() => {
    let l = products.filter((p) => cat === 'all' || p.cat === cat);
    if (filterNew) l = l.filter((p) => p.tag === 'new');
    if (sort === 'price-asc') l = [...l].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') l = [...l].sort((a, b) => b.price - a.price);
    if (sort === 'new') l = [...l].sort((a, b) => (b.tag === 'new' ? 1 : 0) - (a.tag === 'new' ? 1 : 0));
    return l;
  }, [products, cat, sort, filterNew]);

  const cats = [
    { id: 'all', name: lang === 'fr' ? 'Tout' : 'الكل', nameAr: 'الكل' },
    ...CATEGORIES,
  ];

  const heading = title
    ? title[lang]
    : lang === 'fr' ? 'La boutique.' : 'المتجر.';

  return (
    <div className="page2" style={{ padding: '40px 0 80px' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid var(--ink)', paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ minWidth: 0 }}>
            <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>/ {lang === 'fr' ? 'boutique' : 'المتجر'} /</span>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 7vw, 72px)', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {heading}
            </h1>
            <span className="mono" style={{ fontSize: 12, opacity: 0.5, display: 'inline-block', marginTop: 10 }}>
              {filtered.length} {lang === 'fr' ? 'articles' : 'قطعة'}
            </span>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            style={{ padding: '8px 14px', border: '1.5px solid var(--ink)', borderRadius: 999, background: 'var(--paper)', fontFamily: 'inherit', fontSize: 13 }}
          >
            <option value="featured">{lang === 'fr' ? 'Sélection' : 'مميز'}</option>
            <option value="new">{lang === 'fr' ? 'Nouveautés' : 'الجديد'}</option>
            <option value="price-asc">{lang === 'fr' ? 'Prix croissant' : 'السعر ↗'}</option>
            <option value="price-desc">{lang === 'fr' ? 'Prix décroissant' : 'السعر ↘'}</option>
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
              {lang === 'fr' ? c.name : c.nameAr}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
            <p className="mono" style={{ fontSize: 13, marginBottom: 6 }}>○</p>
            <p>{lang === 'fr' ? 'Aucun article ne correspond à ces filtres.' : 'لا توجد قطع تطابق الفلاتر.'}</p>
          </div>
        ) : (
          <div className="g3 reveal-stagger">
            {filtered.map((p, i) => (
              <PCard key={p.id} product={p} lang={lang} onWish={toggleWish} wished={wishlist.includes(p.id)} tint={TINTS[i % TINTS.length]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
