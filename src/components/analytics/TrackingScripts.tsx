'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { pick } from '@/lib/i18n';

/**
 * Loads Google Analytics + Facebook Pixel *only* after the visitor accepts
 * cookies (GDPR-compliant). Also renders the cookie banner itself.
 *
 * Env vars to enable each tracker (add in Vercel → Settings → Environment Variables):
 *   NEXT_PUBLIC_GA_ID    e.g. G-XXXXXXXXXX  (Google Analytics 4)
 *   NEXT_PUBLIC_FB_PIXEL e.g. 1234567890    (Facebook Pixel ID)
 *
 * If an env var is missing, that tracker is silently skipped.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const FB_PIXEL = process.env.NEXT_PUBLIC_FB_PIXEL;

type Consent = 'pending' | 'accepted' | 'rejected';
const CONSENT_KEY = 'wc2-cookie-consent';

export function TrackingScripts() {
  const { lang } = useApp();
  const [consent, setConsent] = useState<Consent>('pending');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(CONSENT_KEY) as Consent | null;
    if (saved === 'accepted' || saved === 'rejected') setConsent(saved);
  }, []);

  const decide = (choice: 'accepted' | 'rejected') => {
    localStorage.setItem(CONSENT_KEY, choice);
    setConsent(choice);
  };

  const accepted = consent === 'accepted';

  return (
    <>
      {/* Google Analytics — only when ID is set AND user accepted. */}
      {accepted && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { anonymize_ip: true });
          `}</Script>
        </>
      )}

      {/* Facebook Pixel — only when ID is set AND user accepted. */}
      {accepted && FB_PIXEL && (
        <>
          <Script id="fb-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL}');
            fbq('track', 'PageView');
          `}</Script>
        </>
      )}

      {/* Cookie banner — only shown on first visit. */}
      {mounted && consent === 'pending' && (GA_ID || FB_PIXEL) && (
        <div
          role="dialog"
          aria-label="Cookies"
          style={{
            position: 'fixed',
            left: 16, right: 16, bottom: 16,
            maxWidth: 720, margin: '0 auto',
            background: 'var(--paper)',
            border: '1px solid var(--ink)',
            borderRadius: 16,
            padding: 18,
            zIndex: 300,
            boxShadow: '0 20px 60px rgba(15,14,13,0.25)',
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            flexWrap: 'wrap',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>🍪</span>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <strong style={{ display: 'block', marginBottom: 4 }}>
              {pick(lang,
                'On utilise des cookies',
                'We use cookies',
                'نستعمل ملفات تعريف الارتباط')}
            </strong>
            <span style={{ opacity: 0.75 }}>
              {pick(lang,
                'Pour mesurer l\'audience et améliorer ton expérience. Tu peux refuser sans perdre les fonctions essentielles.',
                'To measure traffic and improve your experience. You can decline without losing essential features.',
                'لقياس الزوار وتحسين تجربتك. يمكنك الرفض دون فقدان الميزات الأساسية.')}
            </span>{' '}
            <a href="/privacy" style={{ borderBottom: '1px solid currentColor', opacity: 0.7 }}>
              {pick(lang, 'En savoir plus', 'Learn more', 'اعرفي المزيد')}
            </a>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => decide('rejected')}
              style={{
                padding: '10px 18px', borderRadius: 999,
                background: 'transparent', border: '1.5px solid var(--ink)',
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {pick(lang, 'Refuser', 'Decline', 'رفض')}
            </button>
            <button
              onClick={() => decide('accepted')}
              style={{
                padding: '10px 18px', borderRadius: 999,
                background: 'var(--ink)', color: 'var(--paper)', border: 'none',
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
              }}
            >
              {pick(lang, 'Accepter', 'Accept', 'موافقة')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
