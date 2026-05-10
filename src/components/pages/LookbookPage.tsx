'use client';

import Image from 'next/image';
import { useApp } from '@/store/AppContext';

const TILES = [
  { c: 'span 3', r: 'span 2', img: '/assets/3.jpg' },
  { c: 'span 3', r: 'span 2', img: '/assets/1.jpg' },
  { c: 'span 2', r: 'span 2', img: '/assets/00.jpg' },
  { c: 'span 2', r: 'span 3', img: '/assets/4.jpg' },
  { c: 'span 2', r: 'span 2', img: '/assets/11.jpg' },
  { c: 'span 4', r: 'span 2', img: '/assets/33.jpg' },
  { c: 'span 2', r: 'span 2', img: '/assets/2.jpg' },
];

export function LookbookPage() {
  const { lang } = useApp();
  return (
    <div className="page2" style={{ padding: '40px 0 80px' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="chip"><span className="chip-dot" /> SS26</span>
          <h1 className="display" style={{ fontSize: 'clamp(64px, 10vw, 96px)', lineHeight: 0.9, letterSpacing: '-0.04em', marginTop: 16 }}>
            {lang !== 'ar' ? <>the <em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>book</em>.</> : 'اللوكبوك'}
          </h1>
          <p style={{ opacity: 0.6, marginTop: 10 }}>
            {lang !== 'ar' ? 'Printemps / Été 26 — médina, rooftop, souk' : 'ربيع / صيف 26 — مدينة، أسطح، سوق'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridAutoRows: '180px', gap: 12 }}>
          {TILES.map((l, i) => (
            <div key={i} style={{ gridColumn: l.c, gridRow: l.r, borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
              <Image src={l.img} alt="" fill sizes="(max-width: 768px) 50vw, 33vw" style={{ objectFit: 'cover' }} />
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }} className="mono">
          <span style={{ fontSize: 11, opacity: 0.45 }}>ph: studio wridachic · casa + marrakech · ss26</span>
        </div>
      </div>
    </div>
  );
}
