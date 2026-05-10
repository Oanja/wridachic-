'use client';

import Image from 'next/image';
import { Placeholder } from '@/components/ui/Placeholder';
import { pick } from '@/lib/i18n';
import { useApp } from '@/store/AppContext';

export function AboutPage() {
  const { lang } = useApp();
  return (
    <div className="page2" style={{ padding: '60px 0 40px' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <Image src="/assets/wridachicNlogo.svg" alt="wridachic" width={240} height={60} style={{ height: 60, width: 'auto', margin: '0 auto 24px' }} />
          <span className="chip"><span className="chip-dot" /> {pick(lang, 'Notre histoire', 'Our story', 'قصتنا')}</span>
          <h1 className="display" style={{ fontSize: 'clamp(52px, 8vw, 110px)', lineHeight: 0.92, letterSpacing: '-0.04em', marginTop: 20 }}>
            {lang === 'ar'
              ? <>وردة،<br /><em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>علامة</em>.</>
              : lang === 'en'
                ? <>One <em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>rose</em>,<br />one brand.</>
                : <>une <em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>rose</em>,<br />une marque.</>}
          </h1>
          <p style={{ fontSize: 17, maxWidth: 600, margin: '24px auto 0', opacity: 0.7, lineHeight: 1.7 }}>
            {pick(lang,
              "wridachic (de وريدة — la petite rose — et chic) est une marque marocaine qui réinterprète le vestiaire féminin traditionnel pour les femmes d'aujourd'hui, entre modernité et modestie.",
              'wridachic (from وريدة — the little rose — and chic) is a Moroccan brand that reinterprets the traditional women\'s wardrobe for today\'s women, blending modernity and modesty.',
              'wridachic (من "وريدة" بمعنى الوردة الصغيرة، و"شيك") علامة مغربية تعيد تفسير الأزياء النسائية التقليدية للمرأة العصرية، بين الحداثة والحشمة.')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 64 }}>
          <div style={{ aspectRatio: '4/5', borderRadius: 24, overflow: 'hidden' }}>
            <Placeholder tint="rose" rose />
          </div>
          <div style={{ alignSelf: 'center' }}>
            <h2 className="display" style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.0, marginBottom: 20 }}>
              {pick(lang, 'Made in 🇲🇦, pour la femme marocaine.', 'Made in 🇲🇦, for the Moroccan woman.', 'صنع في 🇲🇦، للمرأة المغربية.')}
            </h2>
            <p style={{ fontSize: 15, opacity: 0.7, lineHeight: 1.75 }}>
              {pick(lang,
                'On collabore avec des ateliers artisanaux à Casablanca, Fès et Marrakech. Chaque pièce est pensée pour allier qualité, modestie et style — des caftans de cérémonie aux tenues de prière.',
                'We work with artisan ateliers in Casablanca, Fès and Marrakech. Every piece is designed to combine quality, modesty and style — from ceremonial caftans to prayer outfits.',
                'نتعاون مع ورشات حرفية في الدار البيضاء وفاس ومراكش. كل قطعة مصممة لتجمع بين الجودة والحشمة والأناقة — من قفطان المناسبات إلى ملابس الصلاة.')}
            </p>
          </div>
        </div>

        <div className="g3">
          {[
            {
              n: '01',
              t: pick(lang, 'Accessible', 'Affordable', 'في المتناول'),
              d: pick(lang, 'Dès 149 MAD. La qualité sans compromis.', 'From 149 MAD. Quality without compromise.', 'من 149 درهم. جودة بلا تنازل.'),
              tint: 'rose',
            },
            {
              n: '02',
              t: pick(lang, 'Artisanale', 'Artisan', 'حرفية'),
              d: pick(lang, 'Ateliers locaux, finitions soignées, fibres naturelles.', 'Local ateliers, careful finishes, natural fibres.', 'ورشات محلية، تشطيب محكم، خامات طبيعية.'),
              tint: 'lime',
            },
            {
              n: '03',
              t: pick(lang, 'Modeste & chic', 'Modest & chic', 'محتشمة وأنيقة'),
              d: pick(lang, 'Mode, prière, cérémonie — une marque pour toutes les occasions.', 'Fashion, prayer, ceremony — a brand for every occasion.', 'موضة، صلاة، مناسبات — علامة لكل الأوقات.'),
              tint: 'sky',
            },
          ].map((v) => (
            <div key={v.n} style={{ padding: 32, borderRadius: 20, background: 'var(--paper-2)', position: 'relative', overflow: 'hidden' }}>
              <div className={`ph2 ph2-tint-${v.tint}`} style={{ position: 'absolute', inset: 0, opacity: 0.25 }} />
              <div style={{ position: 'relative' }}>
                <div className="display" style={{ fontSize: 72, lineHeight: 1, color: 'var(--clay)' }}>{v.n}</div>
                <h3 className="display" style={{ fontSize: 26, marginTop: 10 }}>{v.t}</h3>
                <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.65, marginTop: 8 }}>{v.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
