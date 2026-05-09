'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { useApp } from '@/store/AppContext';
import { TR } from '@/lib/i18n';

export function Footer() {
  const { lang, openAuth } = useApp();
  const t = TR[lang];
  const [emailInput, setEmailInput] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    openAuth({ email: emailInput.trim(), mode: 'signup' });
  };

  return (
    <footer className="f2">
      <div className="wrap">
        <div className="f2-hero">
          <div>
            <h2>
              {lang === 'fr' ? <>Rejoins l&apos;<em>univers</em>.</> : <>انضمي إلى <em>عالمنا</em>.</>}
            </h2>
            <p style={{ fontSize: 15, opacity: 0.75, marginTop: 16, maxWidth: '100%' }}>
              {lang === 'fr'
                ? "Reçois nos nouveautés, lookbooks & coups de cœur chaque semaine — l'élégance marocaine dans ta boîte mail."
                : 'استقبلي جديدنا، اللوكبوك ومختاراتنا كل أسبوع — أناقة مغربية مباشرة في بريدك.'}
            </p>
            <form className="f2-newsletter" onSubmit={submit}>
              <input
                type="email" value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={lang === 'fr' ? 'Ton e-mail…' : 'بريدك الإلكتروني…'}
              />
              <button type="submit">{lang === 'fr' ? "Je m'inscris →" : 'اشتركي →'}</button>
            </form>
          </div>
          <div className="f2-stickers">
            <span className="sticker">100% Maroc 🇲🇦</span>
            <span className="sticker sticker-rose" style={{ transform: 'rotate(3deg)' }}>
              {lang === 'fr' ? 'Livraison gratuite 500+ MAD' : 'توصيل مجاني 500+ درهم'}
            </span>
            <span className="sticker sticker-sky" style={{ transform: 'rotate(-1deg)' }}>
              {lang === 'fr' ? 'COD disponible ✓' : 'دفع عند الاستلام ✓'}
            </span>
          </div>
        </div>

        <div className="f2-cols">
          <div>
            <Logo size={150} invert />
            <p style={{ fontSize: 14, opacity: 0.65, marginTop: 16, maxWidth: 280, lineHeight: 1.7 }}>
              {t.footer.tagline}
            </p>
          </div>
          <div>
            <h4>{t.footer.shop}</h4>
            <ul>
              <li><Link href="/shop">{t.nav.shop}</Link></li>
              <li><Link href="/prayer">{t.nav.prayer}</Link></li>
              <li><Link href="/new">{t.nav.new}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t.footer.help}</h4>
            <ul>
              <li><a>{t.footer.contact}</a></li>
              <li><a>{t.footer.faq}</a></li>
              <li><a>{t.footer.delivery}</a></li>
              <li><a>{t.footer.returns}</a></li>
              <li><a>{t.footer.sizes}</a></li>
            </ul>
          </div>
          <div>
            <h4>Follow</h4>
            <ul>
              <li><a href="https://www.instagram.com/wrida_chic/" target="_blank" rel="noopener noreferrer">↗ Instagram</a></li>
              <li><a>↗ TikTok</a></li>
              <li><a>↗ Pinterest</a></li>
              <li><a href="https://wa.me/212772086545" target="_blank" rel="noopener noreferrer">↗ WhatsApp</a></li>
            </ul>
          </div>
        </div>

        <div className="f2-bottom">
          <div>{t.footer.rights}</div>
          <div>MAD · Casablanca — partout au Maroc</div>
        </div>
      </div>
    </footer>
  );
}
