'use client';

import { Placeholder } from '@/components/ui/Placeholder';
import { PCard } from '@/components/ui/PCard';
import { TINTS } from '@/lib/data';
import { pick } from '@/lib/i18n';
import { useApp } from '@/store/AppContext';
import type { Product } from '@/lib/types';

export function PrayerPage({ products }: { products: Product[] }) {
  const { lang, wishlist, toggleWish } = useApp();
  const items = products.filter((p) => p.cat === 'prayer');

  return (
    <div className="page2">
      <section style={{ position: 'relative', height: 460, overflow: 'hidden', margin: '20px 28px 0', borderRadius: 24 }}>
        <Placeholder tint="mint" rose />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,14,13,0.1), rgba(15,14,13,0.60))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 48, color: 'var(--paper)' }}>
          <span className="sticker sticker-sky" style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
            {pick(lang, 'Modestie & élégance ✦', 'Modesty & elegance ✦', 'حشمة وأناقة ✦')}
          </span>
          <h1 className="display" style={{ fontSize: 'clamp(52px, 9vw, 100px)', lineHeight: 0.92, letterSpacing: '-0.04em' }}>
            {lang === 'ar'
              ? <>ملابس<br /><em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>الصلاة</em></>
              : lang === 'en'
                ? <>Prayer<br /><em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>space</em></>
                : <>Espace<br /><em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>prière</em></>}
          </h1>
          <p style={{ fontSize: 15, maxWidth: 460, opacity: 0.85, marginTop: 16 }}>
            {pick(lang,
              'Jilbabs, khimars & ensembles conçus pour être confortables, couvrants et élégants. Dès 299 MAD.',
              'Jilbabs, khimars & sets designed to be comfortable, modest and elegant. From 299 MAD.',
              'جلابيب، خمارات وأطقم مصممة لتكون مريحة، محتشمة وجميلة. من 299 درهم.')}
          </p>
        </div>
      </section>
      <section style={{ padding: '64px 28px 80px' }}>
        <div className="wrap">
          <div className="sh2">
            <span className="sh2-num mono">/ {pick(lang, 'espace prière', 'prayer space', 'ملابس الصلاة')}</span>
            <h2 className="sh2-title">{pick(lang, 'Tous les articles', 'All items', 'كل القطع')}</h2>
          </div>
          <div className="g4">
            {items.map((p, i) => (
              <PCard key={p.id} product={p} lang={lang} onWish={toggleWish} wished={wishlist.includes(p.id)} tint={TINTS[i % TINTS.length]} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
