'use client';

import { useApp } from '@/store/AppContext';
import type { Lang } from '@/lib/types';

export interface LegalSection {
  /** Optional small label above the heading (e.g. "01"). */
  num?: string;
  title: { fr: string; en: string; ar: string };
  body: { fr: string; en: string; ar: string };
}

interface Props {
  eyebrow: { fr: string; en: string; ar: string };
  title: { fr: string; en: string; ar: string };
  updated: string; // ISO date, e.g. "2026-05-10"
  sections: LegalSection[];
}

const pickFromObj = (lang: Lang, obj: { fr: string; en: string; ar: string }) =>
  lang === 'ar' ? obj.ar : lang === 'en' ? obj.en : obj.fr;

/**
 * Shared layout for Privacy / Terms / Returns / Contact pages — keeps each
 * page file tiny (just the content) while the visual chrome lives in one
 * place.
 */
export function LegalPage({ eyebrow, title, updated, sections }: Props) {
  const { lang } = useApp();
  return (
    <div className="page2" style={{ padding: '60px 0 80px' }}>
      <div className="wrap" style={{ maxWidth: 820 }}>
        <header style={{ marginBottom: 48 }}>
          <span className="chip"><span className="chip-dot" /> {pickFromObj(lang, eyebrow)}</span>
          <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.0, letterSpacing: '-0.03em', marginTop: 20 }}>
            {pickFromObj(lang, title)}
          </h1>
          <p className="mono" style={{ fontSize: 11, opacity: 0.5, marginTop: 16, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {lang === 'ar' ? 'آخر تحديث' : lang === 'en' ? 'Last updated' : 'Dernière mise à jour'} · {updated}
          </p>
        </header>

        <article style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {sections.map((s, i) => (
            <section key={i}>
              {s.num && (
                <span className="mono" style={{ fontSize: 11, opacity: 0.55, letterSpacing: '0.1em', color: 'var(--clay)' }}>
                  {s.num}
                </span>
              )}
              <h2 className="display" style={{ fontSize: 24, marginTop: 6, marginBottom: 12, letterSpacing: '-0.01em' }}>
                {pickFromObj(lang, s.title)}
              </h2>
              <div style={{ fontSize: 15, lineHeight: 1.75, opacity: 0.78, whiteSpace: 'pre-line' }}>
                {pickFromObj(lang, s.body)}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
