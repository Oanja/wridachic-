'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Placeholder } from '@/components/ui/Placeholder';
import { PCard } from '@/components/ui/PCard';
import { TINTS } from '@/lib/data';
import { useApp } from '@/store/AppContext';
import type { Product } from '@/lib/types';

export function HomePage({ products }: { products: Product[] }) {
  const { lang, wishlist, toggleWish } = useApp();
  const year = 2026;

  return (
    <div className="page2">
      {/* HERO */}
      <section className="hero-section" style={{ padding: '56px 28px 72px', position: 'relative', overflow: 'hidden' }}>
        <div className="wrap" style={{ maxWidth: 1280 }}>
          <div className="hero-grid">
            <div className="hero-text">
              <div className="hero-eyebrow reveal" style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="chip"><span className="chip-dot" /> {lang === 'fr' ? `Printemps ${year}` : `ربيع ${year}`}</span>
                <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>/ {lang === 'fr' ? 'Nouveau chaque semaine' : 'جديد كل أسبوع'}</span>
              </div>

              <h1 className="display hero-title reveal" style={{ fontSize: 'clamp(40px, 6vw, 92px)', lineHeight: 0.98, letterSpacing: '-0.045em', marginBottom: 24, transitionDelay: '0.1s' }}>
                {lang === 'fr' ? (
                  <>Le style <em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>marocain</em><br />au naturel.</>
                ) : (
                  <>أناقة <em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>مغربية</em><br />أصيلة.</>
                )}
              </h1>

              <p className="hero-sub reveal" style={{ fontSize: 17, maxWidth: 460, lineHeight: 1.6, opacity: 0.72, marginBottom: 36, transitionDelay: '0.2s' }}>
                {lang === 'fr'
                  ? 'Tenues de prière, robes & essentiels — dès 149 MAD, livrés partout au Maroc en environ 1 semaine.'
                  : 'ملابس صلاة، فساتين وأساسيات — ابتداءً من 149 درهم، توصيل في كل المغرب.'}
              </p>

              <div className="reveal" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 44, transitionDelay: '0.3s' }}>
                <Link href="/shop" className="btn2 btn2-dark btn2-lg">
                  {lang === 'fr' ? 'Découvrir la boutique' : 'اكتشفي المتجر'} <Icon n="arr" s={14} />
                </Link>
                <Link href="/prayer" className="btn2 btn2-outline btn2-lg">
                  {lang === 'fr' ? 'Espace Prière' : 'ملابس الصلاة'}
                </Link>
              </div>

              <div className="hero-stats reveal-stagger" style={{ display: 'flex', gap: 0, alignItems: 'stretch', flexWrap: 'wrap', borderTop: '1px solid rgba(15,14,13,0.12)', paddingTop: 24 }}>
                {[
                  { n: '🇲🇦', l: lang === 'fr' ? 'Made in Maroc' : 'صنع في المغرب' },
                  { n: 'COD',  l: lang === 'fr' ? 'Paiement livraison' : 'الدفع عند التوصيل' },
                  { n: '7j',   l: lang === 'fr' ? 'Livraison' : 'توصيل' },
                ].map((s, i) => (
                  <div key={i} className="hero-stat" style={{ flex: 1, paddingRight: i < 2 ? 24 : 0, paddingLeft: i > 0 ? 24 : 0, borderLeft: i > 0 ? '1px solid rgba(15,14,13,0.12)' : 'none' }}>
                    <span className="display stat-num" style={{ fontSize: 30, display: 'block', color: 'var(--clay)', lineHeight: 1, marginBottom: 6 }}>{s.n}</span>
                    <span className="mono stat-label" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.55 }}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-collage reveal" style={{ position: 'relative', minHeight: 680, transitionDelay: '0.15s' }}>
              <div aria-hidden="true" style={{ position: 'absolute', top: 40, right: 40, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,116,107,0.08), transparent 70%)', zIndex: 0 }} />

              <div className="blob hero-big" style={{ position: 'absolute', top: 0, right: 0, width: '88%', aspectRatio: '3/4', borderRadius: 28, overflow: 'hidden', boxShadow: '0 24px 60px -20px rgba(15,14,13,0.25)', zIndex: 1 }}>
                <Image src="/assets/3.jpg" alt="" fill priority sizes="(max-width: 768px) 100vw, 45vw" style={{ objectFit: 'cover' }} />
              </div>

              <div className="blob hero-small" style={{ position: 'absolute', top: '54%', left: -30, width: '50%', aspectRatio: '4/5', borderRadius: 22, overflow: 'hidden', animationDelay: '-2s', boxShadow: '0 18px 40px -10px rgba(15,14,13,0.28)', border: '6px solid var(--paper)', zIndex: 2 }}>
                <Image src="/assets/1.jpg" alt="" fill sizes="25vw" style={{ objectFit: 'cover' }} />
              </div>

              <div className="blob hero-sticker" style={{ position: 'absolute', bottom: 40, right: -8, animationDelay: '-6s', zIndex: 3 }}>
                <span className="sticker sticker-clay" style={{ fontSize: 13, padding: '10px 18px', boxShadow: '0 8px 20px rgba(196,116,107,0.3)' }}>
                  {lang === 'fr' ? 'COD partout ✓' : 'دفع عند الاستلام ✓'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROMISE TICKER */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '13px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'slide 50s linear infinite', whiteSpace: 'nowrap', fontSize: 16, fontFamily: 'ThmanyahSerifDisplay, Fraunces, serif' }}>
          {[0, 1].map((k) => (
            <div key={k} style={{ display: 'flex', gap: 56, paddingRight: 56, flexShrink: 0 }}>
              <span>✦ {lang === 'fr' ? 'Tissus naturels & mousseline' : 'أقمشة طبيعية وشيفون'}</span>
              <span style={{ color: 'var(--clay)' }}>✦ {lang === 'fr' ? 'Production limitée' : 'إنتاج محدود'}</span>
              <span>✦ {lang === 'fr' ? 'Mode pudique & raffinée' : 'موضة محتشمة وراقية'}</span>
              <span style={{ color: 'var(--clay)' }}>✦ {lang === 'fr' ? 'Finitions artisanales' : 'تشطيب يدوي'}</span>
              <span>✦ {lang === 'fr' ? 'Pensé au Maroc, pour la femme marocaine' : 'مصمم في المغرب، للمرأة المغربية'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SHOP BY MOOD */}
      <section style={{ padding: '80px 28px' }}>
        <div className="wrap">
          <div className="sh2 reveal">
            <span className="sh2-num mono">01 / {lang === 'fr' ? 'catégories' : 'أقسام'}</span>
            <h2 className="sh2-title">{lang === 'fr' ? 'Shop by mood' : 'تسوقي حسب المود'}</h2>
            <Link href="/shop" className="sh2-link">{lang === 'ar' ? '← كل المتجر' : '→ Voir tout'}</Link>
          </div>

          <div className="cat-grid reveal-stagger">
            <Link href="/shop" className="cat-main">
              <Image src="/assets/3.jpg" alt="" fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(15,14,13,0.72))', zIndex: 2 }} />
              <div style={{ position: 'absolute', bottom: 24, [lang === 'ar' ? 'right' : 'left']: 24, color: 'var(--paper)', zIndex: 3, textAlign: lang === 'ar' ? 'right' : 'left' }}>
                <div className="mono" style={{ fontSize: 11, opacity: 0.75, letterSpacing: '0.1em' }}>ROBES / 01</div>
                <div className="display cat-title-lg" style={{ fontSize: 'clamp(28px, 4.4vw, 56px)', lineHeight: 1.05, marginTop: 6 }}>
                  {lang === 'fr' ? 'Robes & Ensembles' : 'فساتين وأطقم'}
                </div>
                <div style={{ fontSize: 13, marginTop: 6, opacity: 0.8 }}>
                  {lang === 'fr' ? 'Wrap · Mousseline · Lin' : 'راب · شيفون · كتان'}
                </div>
              </div>
            </Link>

            <div className="cat-side">
              <Link href="/shop" className="cat-small">
                <Image src="/assets/4.jpg" alt="" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(15,14,13,0.55))', zIndex: 2 }} />
                <div style={{ position: 'absolute', bottom: 18, [lang === 'ar' ? 'right' : 'left']: 18, zIndex: 3, color: 'var(--paper)', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', opacity: 0.85 }}>DENIM / 02</div>
                  <div className="display cat-title-sm" style={{ fontSize: 'clamp(24px, 2.6vw, 34px)', lineHeight: 1.05 }}>
                    {lang === 'fr' ? 'Denim' : 'جينز'}
                  </div>
                </div>
              </Link>
              <Link href="/prayer" className="cat-small">
                <Image src="/assets/00.jpg" alt="" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(15,14,13,0.55))', zIndex: 2 }} />
                <div style={{ position: 'absolute', bottom: 18, [lang === 'ar' ? 'right' : 'left']: 18, zIndex: 3, color: 'var(--paper)', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', opacity: 0.85 }}>PRIÈRE / 03</div>
                  <div className="display cat-title-sm" style={{ fontSize: 'clamp(24px, 2.6vw, 34px)', lineHeight: 1.05 }}>
                    {lang === 'fr' ? 'Prière' : 'الصلاة'}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section style={{ padding: '20px 28px 80px' }}>
        <div className="wrap">
          <div className="sh2 reveal">
            <span className="sh2-num mono">02 / {lang === 'fr' ? 'tendance' : 'الأكثر طلباً'}</span>
            <h2 className="sh2-title">{lang === 'fr' ? 'Coups de cœur' : 'الأكثر طلباً'}</h2>
            <Link href="/shop" className="sh2-link">{lang === 'ar' ? '← ' : '→ '}{lang === 'fr' ? 'Voir tout' : 'كل المتجر'}</Link>
          </div>
          <div className="g3 reveal-stagger">
            {products.slice(0, 6).map((p, i) => (
              <PCard key={p.id} product={p} lang={lang} onWish={toggleWish} wished={wishlist.includes(p.id)} tint={TINTS[i % TINTS.length]} />
            ))}
          </div>
        </div>
      </section>

      {/* BIG TICKER */}
      <section className="big-ticker-section" style={{ padding: '40px 0', overflow: 'hidden', borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)' }}>
        <div className="big-ticker-text" style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'slide 55s linear infinite', fontFamily: 'ThmanyahSerifDisplay, Fraunces, serif', fontSize: 'clamp(48px, 7vw, 96px)', lineHeight: 1, letterSpacing: '-0.04em' }}>
          {[0, 1].map((k) => (
            <span key={k} style={{ paddingRight: 56 }}>
              wrida<em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>chic</em>
              {' '}✦{' '}{lang === 'fr' ? 'marocaine & fière' : 'مغربية وفخورة'}
              {' '}✦{' '}
            </span>
          ))}
        </div>
      </section>

      {/* PRAYER FEATURE */}
      <section style={{ padding: '80px 28px' }}>
        <div className="wrap">
          <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 40, alignItems: 'center' }}>
            <div style={{ position: 'relative' }} className="reveal">
              <div style={{ aspectRatio: '4/5', borderRadius: 24, overflow: 'hidden', position: 'relative' }}>
                <Image src="/assets/00.jpg" alt="" fill sizes="(max-width: 768px) 100vw, 40vw" style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ position: 'absolute', bottom: 28, right: -16 }}>
                <span className="sticker sticker-sky" style={{ transform: 'rotate(-4deg)' }}>
                  {lang === 'fr' ? 'Élégance & beauté ✦' : 'أناقة وجمال ✦'}
                </span>
              </div>
            </div>
            <div className="reveal">
              <span className="chip"><span className="chip-dot" /> {lang === 'fr' ? 'Espace prière' : 'ملابس الصلاة'}</span>
              <h2 className="display" style={{ fontSize: 'clamp(40px, 5vw, 68px)', lineHeight: 0.95, letterSpacing: '-0.03em', margin: '20px 0' }}>
                {lang === 'fr'
                  ? <>La prière<br />mérite la<br /><em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>beauté.</em></>
                  : <>الصلاة تستحق<br /><em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>الأجمل.</em></>}
              </h2>
              <p style={{ fontSize: 15, maxWidth: 420, lineHeight: 1.7, opacity: 0.75, marginBottom: 28 }}>
                {lang === 'fr'
                  ? 'Jilbabs, khimars & ensembles de prière pensés pour être confortables, couvrants et élégants. Dès 149 MAD.'
                  : 'جلابيب، خمارات وطقم صلاة مصممة لتكون مريحة، محتشمة وجميلة. ابتداءً من 149 درهم.'}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/prayer" className="btn2 btn2-clay btn2-lg">
                  {lang === 'fr' ? 'Voir la collection' : 'عرض المجموعة'} <Icon n="arr" s={14} />
                </Link>
                <Link href="/shop" className="btn2 btn2-outline btn2-lg">
                  {lang === 'fr' ? 'Voir la boutique' : 'تصفحي المتجر'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section style={{ padding: '20px 28px 80px' }}>
        <div className="wrap">
          <div className="sh2 reveal">
            <span className="sh2-num mono">03 / community</span>
            <h2 className="sh2-title" dir="ltr">#wridachic</h2>
            <span className="sh2-link" dir="ltr">→ @wridachic</span>
          </div>
          <div className="g6 reveal-stagger">
            {TINTS.map((tint, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}>
                <Placeholder tint={tint} aspect="1/1" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
