'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { pick, pickField } from '@/lib/i18n';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Icon } from './Icon';
import type { Product } from '@/lib/types';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Lightweight client-side search — fetches the products catalogue lazily the
 * first time the modal opens (avoids loading rows on every page paint), then
 * filters by name in all 3 languages. Esc closes.
 */
export function SearchModal({ open, onClose }: SearchModalProps) {
  const { lang } = useApp();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Lazy-load products the first time the modal opens.
  useEffect(() => {
    if (!open || products.length > 0) return;
    setLoading(true);
    const sb = getSupabaseBrowser();
    sb.from('products')
      .select('id, slug, name, name_ar, name_en, price, img_files')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setProducts(data.map((r) => ({
            id: r.id,
            slug: r.slug,
            name: r.name,
            nameAr: r.name_ar ?? r.name,
            nameEn: r.name_en ?? undefined,
            cat: '',
            price: Number(r.price),
            colors: [],
            img: '',
            imgFiles: r.img_files ?? [],
          })));
        }
        setLoading(false);
      });
  }, [open, products.length]);

  useEffect(() => {
    if (!open) { setQuery(''); return; }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const results = q
    ? products.filter((p) => {
        const hay = [p.name, p.nameEn, p.nameAr, p.slug].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      }).slice(0, 8)
    : [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,14,13,0.5)',
        zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '60px 16px', overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, background: 'var(--paper)',
          borderRadius: 20, padding: 20, boxShadow: '0 30px 80px rgba(15,14,13,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1.5px solid var(--ink)', paddingBottom: 10, marginBottom: 14 }}>
          <Icon n="search" s={18} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick(lang, 'Recherche un article…', 'Search for a product…', 'ابحثي عن قطعة…')}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 16, fontFamily: 'inherit', color: 'var(--ink)',
            }}
          />
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6 }}
          >
            <Icon n="close" s={16} />
          </button>
        </div>

        {q && results.length === 0 && (
          <div style={{ padding: '24px 12px', textAlign: 'center', opacity: 0.6 }}>
            <p>{pick(lang, 'Aucun résultat.', 'No results.', 'لا توجد نتائج.')}</p>
          </div>
        )}

        {!q && (
          <div style={{ padding: '12px 4px', fontSize: 13, opacity: 0.55, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
            {loading
              ? pick(lang, 'Chargement…', 'Loading…', 'جار التحميل…')
              : pick(lang, 'Tape au moins un caractère pour chercher…', 'Type a character to search…', 'اكتبي حرفًا للبحث…')}
          </div>
        )}

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((p) => {
              const name = pickField(lang, p.name, p.nameEn, p.nameAr);
              const thumb = p.imgFiles[0];
              return (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  onClick={onClose}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: 10, borderRadius: 12, transition: 'background 0.15s',
                  }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--paper-2)', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    {thumb && <Image src={thumb} alt="" fill sizes="56px" style={{ objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{name}</div>
                    <div className="mono" style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>{p.price} MAD</div>
                  </div>
                  <Icon n="arr" s={14} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
