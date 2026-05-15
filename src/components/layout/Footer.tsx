'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { useApp } from '@/store/AppContext';
import { TR, pick } from '@/lib/i18n';

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
              {lang === 'ar'
                ? <>انضمي إلى <em>عالمنا</em>.</>
                : lang === 'en'
                  ? <>Join the <em>universe</em>.</>
                  : <>Rejoins l&apos;<em>univers</em>.</>}
            </h2>
            <p style={{ fontSize: 15, opacity: 0.75, marginTop: 16, maxWidth: '100%' }}>
              {pick(lang,
                "Reçois nos nouveautés, lookbooks & coups de cœur chaque semaine — l'élégance marocaine dans ta boîte mail.",
                'Receive our new arrivals, lookbooks & favourites every week — Moroccan elegance in your inbox.',
                'استقبلي جديدنا، اللوكبوك ومختاراتنا كل أسبوع — أناقة مغربية مباشرة في بريدك.')}
            </p>
            <form className="f2-newsletter" onSubmit={submit}>
              <input
                type="email" value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={pick(lang, 'Ton e-mail…', 'Your e-mail…', 'بريدك الإلكتروني…')}
              />
              <button type="submit">{pick(lang, "Je m'inscris →", 'Sign up →', 'اشتركي →')}</button>
            </form>
          </div>
          <div className="f2-stickers">
            <span className="sticker">{pick(lang, '100% Maroc 🇲🇦', '100% Morocco 🇲🇦', '100% المغرب 🇲🇦')}</span>
            <span className="sticker sticker-rose" style={{ transform: 'rotate(3deg)' }}>
              {pick(lang, 'Livraison gratuite 500+ MAD', 'Free shipping over 500 MAD', 'توصيل مجاني 500+ درهم')}
            </span>
            <span className="sticker sticker-sky" style={{ transform: 'rotate(-1deg)' }}>
              {pick(lang, 'COD disponible ✓', 'COD available ✓', 'دفع عند الاستلام ✓')}
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
              <li><Link href="/new">{t.nav.new}</Link></li>
              <li><Link href="/about">{t.nav.about}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t.footer.help}</h4>
            <ul>
              <li><Link href="/contact">{t.footer.contact}</Link></li>
              <li><Link href="/returns">{t.footer.returns}</Link></li>
              <li><Link href="/terms">{pick(lang, 'CGV', 'Terms', 'الشروط')}</Link></li>
              <li><Link href="/privacy">{pick(lang, 'Confidentialité', 'Privacy', 'الخصوصية')}</Link></li>
            </ul>
          </div>
          <div>
            <h4>Follow</h4>
            <ul>
              <li><a href="https://www.instagram.com/wrida_chic/" target="_blank" rel="noopener noreferrer">↗ Instagram</a></li>
              <li><a>↗ TikTok</a></li>
              <li><a>↗ Pinterest</a></li>
              <li><a href="https://wa.me/212773847986" target="_blank" rel="noopener noreferrer">↗ WhatsApp</a></li>
            </ul>
          </div>
        </div>

        <div className="f2-bottom">
          <div>{t.footer.rights}</div>
          <div>{pick(lang, 'MAD · Casablanca — partout au Maroc', 'MAD · Casablanca — all over Morocco', 'درهم · الدار البيضاء — في كل المغرب')}</div>
        </div>
      </div>
    </footer>
  );
}
