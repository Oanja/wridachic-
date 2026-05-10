'use client';

import { useApp } from '@/store/AppContext';
import { pick } from '@/lib/i18n';
import { Icon } from '@/components/ui/Icon';

const CHANNELS = [
  {
    icon: 'wa' as const,
    label: { fr: 'WhatsApp', en: 'WhatsApp', ar: 'واتساب' },
    sub: { fr: 'Réponse en quelques heures', en: 'Reply within hours', ar: 'الرد خلال ساعات' },
    href: 'https://wa.me/212772086545',
    value: '+212 7 72 08 65 45',
  },
  {
    icon: 'check' as const,
    label: { fr: 'E-mail', en: 'E-mail', ar: 'البريد الإلكتروني' },
    sub: { fr: 'Réponse sous 24h', en: 'Reply within 24h', ar: 'الرد خلال 24 ساعة' },
    href: 'mailto:hello@wridachic.com',
    value: 'hello@wridachic.com',
  },
  {
    icon: 'arr' as const,
    label: { fr: 'Instagram', en: 'Instagram', ar: 'انستغرام' },
    sub: { fr: '@wrida_chic', en: '@wrida_chic', ar: '@wrida_chic' },
    href: 'https://www.instagram.com/wrida_chic/',
    value: '@wrida_chic',
  },
];

export function ContactPage() {
  const { lang } = useApp();

  return (
    <div className="page2" style={{ padding: '60px 0 80px' }}>
      <div className="wrap" style={{ maxWidth: 820 }}>
        <header style={{ marginBottom: 48, textAlign: 'center' }}>
          <span className="chip"><span className="chip-dot" /> {pick(lang, 'Nous contacter', 'Contact us', 'تواصلي معنا')}</span>
          <h1 className="display" style={{ fontSize: 'clamp(40px, 7vw, 84px)', lineHeight: 1.0, letterSpacing: '-0.03em', marginTop: 20 }}>
            {pick(lang, 'On t\'écoute.', 'We\'re listening.', 'نسمعك.')}
          </h1>
          <p style={{ fontSize: 16, opacity: 0.7, maxWidth: 520, margin: '20px auto 0', lineHeight: 1.7 }}>
            {pick(lang,
              'Question sur une commande, conseil taille, ou simple bonjour — choisis ton canal préféré.',
              'Question about an order, sizing advice, or just to say hi — pick your favourite channel.',
              'سؤال حول طلب، نصيحة حول المقاس، أو فقط سلام — اختاري قناتك المفضلة.')}
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {CHANNELS.map((c, i) => (
            <a
              key={i}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{
                background: 'var(--paper-2)',
                borderRadius: 18, padding: 24,
                display: 'flex', flexDirection: 'column', gap: 10,
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '1px solid var(--line)',
              }}
              className="contact-card"
            >
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: '50%', background: 'var(--ink)', color: 'var(--paper)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon n={c.icon} s={18} />
              </span>
              <div className="display" style={{ fontSize: 22, marginTop: 8 }}>{pick(lang, c.label.fr, c.label.en, c.label.ar)}</div>
              <div style={{ fontSize: 13, opacity: 0.65 }}>{pick(lang, c.sub.fr, c.sub.en, c.sub.ar)}</div>
              <div className="mono" style={{ fontSize: 12, marginTop: 8, color: 'var(--clay)', wordBreak: 'break-word' }}>{c.value}</div>
            </a>
          ))}
        </div>

        <div style={{ marginTop: 56, padding: 28, background: 'var(--paper-2)', borderRadius: 18, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 11, opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            {pick(lang, 'Adresse', 'Address', 'العنوان')}
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.7 }}>
            <strong>wridachic</strong><br />
            {pick(lang, 'Casablanca, Maroc', 'Casablanca, Morocco', 'الدار البيضاء، المغرب')}
          </div>
        </div>
      </div>

      <style>{`
        .contact-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(15,14,13,0.08); }
      `}</style>
    </div>
  );
}
