'use client';

import Link from 'next/link';
import { useApp } from '@/store/AppContext';

export default function NotFound() {
  const { lang } = useApp();
  return (
    <div className="page2" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div className="display" style={{ fontSize: 'clamp(80px, 18vw, 140px)', lineHeight: 1, color: 'var(--clay)', letterSpacing: '-0.05em' }}>404</div>
        <div className="mono" style={{ fontSize: 11, opacity: 0.5, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 8 }}>
          {lang === 'fr' ? 'Page introuvable' : 'الصفحة غير موجودة'}
        </div>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 5vw, 42px)', lineHeight: 1.1, marginTop: 18, letterSpacing: '-0.02em' }}>
          {lang === 'fr'
            ? <>Cette page n&apos;existe <em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>pas</em>.</>
            : <>هاد الصفحة <em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>ما كاينة</em>.</>}
        </h1>
        <p style={{ fontSize: 15, opacity: 0.65, marginTop: 14, lineHeight: 1.6 }}>
          {lang === 'fr'
            ? "Le lien que tu as suivi est peut-être cassé, ou la page a été déplacée."
            : "الرابط ممكن يكون مكسور، أو الصفحة تنقلات."}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          <Link href="/" className="btn2 btn2-dark">
            {lang === 'fr' ? "↗ Retour à l'accueil" : '↗ الرئيسية'}
          </Link>
          <Link href="/shop" className="btn2 btn2-outline">
            {lang === 'fr' ? 'Voir la boutique' : 'المتجر'}
          </Link>
        </div>
      </div>
    </div>
  );
}
