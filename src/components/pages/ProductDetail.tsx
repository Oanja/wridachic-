'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Placeholder } from '@/components/ui/Placeholder';
import { PCard } from '@/components/ui/PCard';
import { TINTS, CATEGORIES } from '@/lib/data';
import { TR, pick, pickField } from '@/lib/i18n';
import { useApp } from '@/store/AppContext';
import { useRouter } from 'next/navigation';
import { productPayload, trackMetaEvent } from '@/lib/metaPixel';
import type { Product } from '@/lib/types';

interface ProductDetailProps {
  product: Product;
  related: Product[];
}

// Minimum horizontal travel (in px) to count as a swipe vs a tap/scroll.
const SWIPE_THRESHOLD = 40;

export function ProductDetail({ product, related }: ProductDetailProps) {
  const { lang, addToCart, buyNow, wishlist, toggleWish } = useApp();
  const router = useRouter();
  const t = TR[lang];

  const [size, setSize] = useState('M');
  const [color, setColor] = useState(product.colors[0]);
  const [qty, setQty] = useState(1);
  const [main, setMain] = useState(0);
  const [added, setAdded] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('composition');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Touch swipe state — only used on the main image, mostly for mobile.
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const imgCount = product.imgFiles.length;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Ignore if vertical scroll dominated, or if movement was too small.
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dy) > Math.abs(dx)) return;
    if (imgCount <= 1) return;
    // Right swipe → previous (in LTR); flip for RTL so the gesture matches reading direction.
    const next = lang === 'ar'
      ? (dx < 0 ? main - 1 : main + 1)
      : (dx < 0 ? main + 1 : main - 1);
    setMain((next + imgCount) % imgCount);
  };

  const name = pickField(lang, product.name, product.nameEn, product.nameAr);
  const cat = CATEGORIES.find((c) => c.id === product.cat);
  const catName = cat ? pickField(lang, cat.name, cat.nameEn, cat.nameAr) : '';
  const soldOut = product.stock === 0;

  useEffect(() => {
    trackMetaEvent('ViewContent', productPayload(product));
  }, [product]);

  const handleAdd = () => {
    addToCart({ ...product, size, color, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const handleBuyNow = () => {
    buyNow({ ...product, size, color, qty });
    router.push('/checkout');
  };

  return (
    <div className="page2" style={{ padding: '32px 0 80px' }}>
      <div className="wrap">
        <div className="mono" style={{ fontSize: 11, opacity: 0.5, marginBottom: 24 }}>
          <Link href="/shop" style={{ cursor: 'pointer' }}>/ {pick(lang, 'boutique', 'shop', 'المتجر')}</Link>
          {' / '}{catName}
          {' / '}{name}
        </div>

        <div className="pdetail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div className="pdetail-img reveal" style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 10 }}>
            {product.imgFiles.length > 0 ? (
              <>
                <div className="pdetail-thumbs" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {product.imgFiles.map((src, i) => (
                    <button
                      key={i} onClick={() => setMain(i)}
                      style={{ padding: 0, border: main === i ? '2px solid var(--ink)' : '1.5px solid var(--line)', borderRadius: 10, aspectRatio: '3/4', overflow: 'hidden', position: 'relative' }}
                    >
                      <Image src={src} alt="" fill sizes="72px" style={{ objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
                <div
                  className="pdetail-main-img"
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                  style={{ aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', position: 'relative', touchAction: 'pan-y' }}
                >
                  <Image src={product.imgFiles[main] ?? product.imgFiles[0]} alt={name} fill priority sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
                  {imgCount > 1 && (
                    <div className="pdetail-dots" aria-hidden="true">
                      {product.imgFiles.map((_, i) => (
                        <span key={i} className={i === main ? 'on' : ''} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="pdetail-thumbs" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <button key={i} onClick={() => setMain(i)} style={{ padding: 0, border: main === i ? '2px solid var(--ink)' : '1.5px solid var(--line)', borderRadius: 10, aspectRatio: '3/4', overflow: 'hidden' }}>
                      <Placeholder tint={TINTS[i % TINTS.length]} />
                    </button>
                  ))}
                </div>
                <div style={{ aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden' }}>
                  <Placeholder tint={TINTS[main % TINTS.length]} rose />
                </div>
              </>
            )}
          </div>

          <div className="reveal" style={{ transitionDelay: '0.15s' }}>
            {product.tag === 'new' && <span className="sticker">{pick(lang, 'NOUVEAU ✦', 'NEW ✦', 'جديد ✦')}</span>}
            {product.tag === 'best' && (
              <span className="sticker" style={{ background: 'var(--lime)' }}>
                {pick(lang, 'BEST-SELLER ✦', 'BEST-SELLER ✦', 'الأكثر مبيعاً ✦')}
              </span>
            )}
            {product.tag === 'sale' && (
              <span className="sticker sticker-clay">
                {product.oldPrice
                  ? `${pick(lang, 'SOLDE', 'SALE', 'تخفيض')} −${Math.round((1 - product.price / product.oldPrice) * 100)}%`
                  : pick(lang, 'PROMO ✦', 'SALE ✦', 'تخفيض ✦')}
              </span>
            )}
            <h1 className="display" style={{ fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1, marginTop: 12, marginBottom: 12, letterSpacing: '-0.02em' }}>{name}</h1>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.55 }}>
              <span>✦ {pick(lang, 'Made in Maroc', 'Made in Morocco', 'صنع في المغرب')}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{pick(lang, 'Production limitée', 'Limited production', 'إنتاج محدود')}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 24, fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ fontSize: 28, fontWeight: 600 }}>{product.price} MAD</span>
              {product.oldPrice && <span style={{ fontSize: 16, opacity: 0.4, textDecoration: 'line-through' }}>{product.oldPrice} MAD</span>}
            </div>
            <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.7, marginBottom: 28 }}>
              {pick(lang,
                'Coupe soigneuse, tissu de qualité, finitions artisanales. Une pièce qui traverse les saisons.',
                'Careful cut, quality fabric, artisan finishes. A piece that lasts through the seasons.',
                'قصّة محكمة، قماش عالي الجودة، تشطيب يدوي. قطعة تدوم عبر المواسم.')}
            </p>

            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 10, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>{t.product.color}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {product.colors.map((c) => (
                  <button
                    key={c} onClick={() => setColor(c)}
                    style={{ width: 34, height: 34, borderRadius: '50%', background: c, border: color === c ? '2.5px solid var(--ink)' : '1px solid var(--line)', outline: color === c ? '2px solid var(--paper)' : 'none', outlineOffset: -3 }}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{t.product.size}</span>
                <a onClick={() => setSizeGuideOpen(true)} style={{ fontSize: 12, borderBottom: '1px solid var(--ink)', cursor: 'pointer' }}>{t.product.sizeGuide}</a>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['XS','S','M','L','XL','XXL'].map((s) => (
                  <button
                    key={s} onClick={() => setSize(s)}
                    style={{ padding: '9px 14px', border: '1.5px solid var(--ink)', borderRadius: 999, background: size === s ? 'var(--ink)' : 'transparent', color: size === s ? 'var(--paper)' : 'var(--ink)', fontSize: 12, minWidth: 42 }}
                  >{s}</button>
                ))}
              </div>
            </div>

            {soldOut && (
              <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '14px 18px', borderRadius: 14, marginBottom: 14, fontSize: 14, textAlign: 'center', fontWeight: 500 }}>
                ✕ {pick(lang,
                  'Épuisé — contacte-nous pour être prévenue du retour',
                  'Sold out — contact us to be notified when it\'s back',
                  'نفد — تواصلي معنا ليتم إعلامك عند توفرها')}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--ink)', borderRadius: 999, opacity: soldOut ? 0.4 : 1 }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={soldOut} style={{ padding: '0 14px', height: 48 }}><Icon n="minus" s={12} /></button>
                <span style={{ minWidth: 28, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>{qty}</span>
                <button onClick={() => setQty(qty + 1)} disabled={soldOut} style={{ padding: '0 14px', height: 48 }}><Icon n="plus" s={12} /></button>
              </div>
              <button className="btn2 btn2-dark" style={{ flex: 1, opacity: soldOut ? 0.4 : 1, cursor: soldOut ? 'not-allowed' : 'pointer' }} disabled={soldOut} onClick={handleAdd}>
                {added ? <><Icon n="check" s={14} /> {pick(lang, 'Ajouté !', 'Added!', 'تمت!')}</> : `+ ${t.product.add}`}
              </button>
              <button className="btn2 btn2-outline" onClick={() => toggleWish(product.id)}><Icon n="heart" s={16} /></button>
            </div>
            <button className="btn2 btn2-clay" style={{ width: '100%', marginBottom: 12, opacity: soldOut ? 0.4 : 1, cursor: soldOut ? 'not-allowed' : 'pointer' }} disabled={soldOut} onClick={handleBuyNow}>
              {pick(lang, 'Commander maintenant →', 'Order now →', 'اطلبي دابا ←')}
            </button>
            {(() => {
              const total = product.price * qty;
              const msg = lang === 'ar'
                ? `السلام، بغيت نطلب:\n• ${name}\n• القياس: ${size} · اللون: ${color}\n• الكمية: ${qty}\n• الثمن: ${total} درهم`
                : lang === 'en'
                  ? `Hi wridachic 👋\n\nI'd like to order:\n• ${name}\n• Size: ${size} · Colour: ${color}\n• Qty: ${qty}\n• Price: ${total} MAD`
                  : `Bonjour wridachic 👋\n\nJe voudrais commander :\n• ${name}\n• Taille : ${size} · Couleur : ${color}\n• Quantité : ${qty}\n• Prix : ${total} MAD`;
              const href = `https://wa.me/212772086545?text=${encodeURIComponent(msg)}`;
              return (
                <div style={{ textAlign: 'center', marginBottom: 24, fontSize: 13 }}>
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{ opacity: 0.7, borderBottom: '1px solid currentColor', paddingBottom: 1, cursor: 'pointer' }}>
                    {pick(lang, 'Préfères WhatsApp ? Cliquer ici', 'Prefer WhatsApp? Click here', 'تفضلين واتساب؟ اضغطي هنا')}
                  </a>
                </div>
              );
            })()}

            <div className="pdetail-badges" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 32 }}>
              {[
                { ic: 'truck',   l: t.product.delivery },
                { ic: 'shield',  l: t.product.cod },
                { ic: 'refresh', l: t.product.return },
              ].map((it, i) => (
                <div key={i} style={{ padding: 14, background: 'var(--paper-2)', borderRadius: 12, textAlign: 'center', fontSize: 11 }}>
                  <Icon n={it.ic} s={18} />
                  <div style={{ marginTop: 6, lineHeight: 1.4 }}>{it.l}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--line)' }}>
              {[
                { id: 'composition', fr: 'Composition & matière', en: 'Composition & material', ar: 'التركيبة والقماش',
                  content: product.composition || pick(lang,
                    "Tissu noble travaillé avec soin. Composition détaillée bientôt — contactez-nous via WhatsApp pour plus d'infos.",
                    'Premium fabric crafted with care. Detailed composition coming soon — contact us on WhatsApp for more info.',
                    'قماش راقي مشغول بعناية. التركيبة المفصلة قريباً — تواصلي معنا عبر واتساب للمزيد.') },
                { id: 'entretien', fr: 'Entretien & lavage', en: 'Care & washing', ar: 'العناية والغسيل',
                  content: product.entretien || pick(lang,
                    "Lavage à la main à l'eau froide recommandé. Pas de sèche-linge, séchage à plat à l'ombre. Repassage à basse température si nécessaire.",
                    'Hand wash in cold water recommended. No tumble dryer, dry flat in the shade. Iron at low temperature if needed.',
                    'يُنصح بالغسيل اليدوي بالماء البارد. تجنبي مجفف الملابس، النشر مسطحاً في الظل. الكي على درجة منخفضة عند الحاجة.') },
                { id: 'details', fr: 'Détails & coupe', en: 'Details & fit', ar: 'التفاصيل والقصة',
                  content: product.details || pick(lang,
                    'Coupe pensée pour la femme marocaine, longueur ample, finitions soignées. Mannequin : 1m70, porte taille M.',
                    'Cut designed for the Moroccan woman, generous length, careful finishes. Model: 1m70, wears size M.',
                    'قصّة مصممة للمرأة المغربية، طول فضفاض، تشطيب متقن. الموديل: 1.70م، تلبس مقاس M.') },
                { id: 'livraison', fr: 'Livraison & retours', en: 'Delivery & returns', ar: 'التوصيل والإرجاع',
                  content: pick(lang,
                    'Livraison partout au Maroc en environ 1 semaine après confirmation. Paiement à la livraison disponible. Retours acceptés sous 14 jours, articles intacts avec étiquette.',
                    'Delivered anywhere in Morocco in about 1 week after confirmation. Cash on delivery available. Returns accepted within 14 days, items intact with tag.',
                    'التوصيل في كل المغرب في حوالي أسبوع بعد التأكيد. الدفع عند التوصيل متاح. الإرجاع مقبول خلال 14 يوماً، القطع سليمة مع البطاقة.') },
              ].map((sec) => {
                const isOpen = openSection === sec.id;
                return (
                  <div key={sec.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <button
                      onClick={() => setOpenSection(isOpen ? null : sec.id)}
                      style={{
                        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px 0', background: 'transparent', border: 'none',
                        fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)',
                        textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
                      }}
                    >
                      <span>{pick(lang, sec.fr, sec.en, sec.ar)}</span>
                      <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                    </button>
                    {isOpen && (
                      <p style={{ fontSize: 13, lineHeight: 1.7, opacity: 0.75, paddingBottom: 16, paddingRight: 28, whiteSpace: 'pre-line' }}>
                        {sec.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section style={{ marginTop: 80 }}>
            <div className="sh2 reveal">
              <span className="sh2-num mono">/ {pick(lang, 'vous aimerez aussi', 'you might also like', 'قد يعجبك')}</span>
              <h2 className="sh2-title">{pick(lang, 'Dans le même style', 'In the same style', 'في نفس الأسلوب')}</h2>
            </div>
            <div className="g4 reveal-stagger">
              {related.map((p, i) => (
                <PCard key={p.id} product={p} lang={lang} onWish={toggleWish} wished={wishlist.includes(p.id)} tint={TINTS[i % TINTS.length]} />
              ))}
            </div>
          </section>
        )}
      </div>

      {sizeGuideOpen && (
        <div onClick={() => setSizeGuideOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,13,0.6)', zIndex: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fIn 0.25s ease' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--paper)', padding: 32, borderRadius: 22, width: '100%', maxWidth: 540, position: 'relative', boxShadow: '0 30px 80px rgba(15,14,13,0.35)', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setSizeGuideOpen(false)} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'var(--paper-2)', border: 'none', cursor: 'pointer', fontSize: 14 }}>✕</button>
            <div className="mono" style={{ fontSize: 11, opacity: 0.55, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
              ✦ {pick(lang, 'Mensurations', 'Measurements', 'القياسات')} ✦
            </div>
            <h2 className="display" style={{ fontSize: 28, marginBottom: 18, letterSpacing: '-0.02em' }}>
              {pick(lang, 'Guide des tailles', 'Size guide', 'دليل المقاسات')}
            </h2>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 18, lineHeight: 1.6 }}>
              {pick(lang,
                'Mesures en centimètres. En cas de doute entre deux tailles, choisis la plus grande pour un confort optimal.',
                'Measurements in centimeters. If unsure between two sizes, pick the larger one for the best fit.',
                'المقاسات بالسنتيمتر. في حال التردد بين مقاسين، اختاري الأكبر لراحة أفضل.')}
            </p>
            <div style={{ overflowX: 'auto', marginBottom: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
                <thead>
                  <tr style={{ background: 'var(--paper-2)' }}>
                    <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>{pick(lang, 'Taille', 'Size', 'المقاس')}</th>
                    <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>{pick(lang, 'Poitrine', 'Bust', 'الصدر')}</th>
                    <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>{pick(lang, 'Taille', 'Waist', 'الخصر')}</th>
                    <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>{pick(lang, 'Hanches', 'Hips', 'الأرداف')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[['XS','80–84','60–64','86–90'],['S','84–88','64–68','90–94'],['M','88–92','68–72','94–98'],['L','92–98','72–78','98–104'],['XL','98–104','78–84','104–110'],['XXL','104–110','84–90','110–116']].map((row) => (
                    <tr key={row[0]} style={{ borderTop: '1px solid var(--line)' }}>
                      {row.map((v, i) => <td key={i} style={{ padding: 10, fontWeight: i === 0 ? 600 : 400 }}>{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {pick(lang, '✦ Toutes les coupes sont amples & confortables', '✦ All cuts are loose & comfortable', '✦ جميع القصّات فضفاضة ومريحة')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
