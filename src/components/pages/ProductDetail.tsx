'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Placeholder } from '@/components/ui/Placeholder';
import { PCard } from '@/components/ui/PCard';
import { TINTS, CATEGORIES } from '@/lib/data';
import { TR } from '@/lib/i18n';
import { useApp } from '@/store/AppContext';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';

interface ProductDetailProps {
  product: Product;
  related: Product[];
}

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

  const name = lang === 'fr' ? product.name : product.nameAr;
  const cat = CATEGORIES.find((c) => c.id === product.cat);

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
          <Link href="/shop" style={{ cursor: 'pointer' }}>/ {lang === 'fr' ? 'boutique' : 'المتجر'}</Link>
          {' / '}{cat ? (lang === 'fr' ? cat.name : cat.nameAr) : ''}
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
                <div style={{ aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
                  <Image src={product.imgFiles[main] ?? product.imgFiles[0]} alt={name} fill priority sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
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
            {product.tag === 'new' && <span className="sticker">NOUVEAU ✦</span>}
            {product.tag === 'sale' && product.oldPrice && (
              <span className="sticker sticker-clay">SOLDE −{Math.round((1 - product.price / product.oldPrice) * 100)}%</span>
            )}
            <h1 className="display" style={{ fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1, marginTop: 12, marginBottom: 12, letterSpacing: '-0.02em' }}>{name}</h1>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.55 }}>
              <span>✦ {lang === 'fr' ? 'Made in Maroc' : 'صنع في المغرب'}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{lang === 'fr' ? 'Production limitée' : 'إنتاج محدود'}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 24, fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ fontSize: 28, fontWeight: 600 }}>{product.price} MAD</span>
              {product.oldPrice && <span style={{ fontSize: 16, opacity: 0.4, textDecoration: 'line-through' }}>{product.oldPrice} MAD</span>}
            </div>
            <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.7, marginBottom: 28 }}>
              {lang === 'fr'
                ? 'Coupe soigneuse, tissu de qualité, finitions artisanales. Une pièce qui traverse les saisons.'
                : 'قصّة محكمة، قماش عالي الجودة، تشطيب يدوي. قطعة تدوم عبر المواسم.'}
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

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--ink)', borderRadius: 999 }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '0 14px', height: 48 }}><Icon n="minus" s={12} /></button>
                <span style={{ minWidth: 28, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>{qty}</span>
                <button onClick={() => setQty(qty + 1)} style={{ padding: '0 14px', height: 48 }}><Icon n="plus" s={12} /></button>
              </div>
              <button className="btn2 btn2-dark" style={{ flex: 1 }} onClick={handleAdd}>
                {added ? <><Icon n="check" s={14} /> {lang === 'fr' ? 'Ajouté !' : 'تمت!'}</> : `+ ${t.product.add}`}
              </button>
              <button className="btn2 btn2-outline" onClick={() => toggleWish(product.id)}><Icon n="heart" s={16} /></button>
            </div>
            <button className="btn2 btn2-clay" style={{ width: '100%', marginBottom: 12 }} onClick={handleBuyNow}>
              {lang === 'fr' ? 'Commander maintenant →' : 'اطلبي دابا ←'}
            </button>
            {(() => {
              const total = product.price * qty;
              const msg = lang === 'fr'
                ? `Bonjour wridachic 👋\n\nJe voudrais commander :\n• ${product.name}\n• Taille : ${size} · Couleur : ${color}\n• Quantité : ${qty}\n• Prix : ${total} MAD`
                : `السلام، بغيت نطلب:\n• ${product.nameAr || product.name}\n• القياس: ${size} · اللون: ${color}\n• الكمية: ${qty}\n• الثمن: ${total} درهم`;
              const href = `https://wa.me/212772086545?text=${encodeURIComponent(msg)}`;
              return (
                <div style={{ textAlign: 'center', marginBottom: 24, fontSize: 13 }}>
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{ opacity: 0.7, borderBottom: '1px solid currentColor', paddingBottom: 1, cursor: 'pointer' }}>
                    {lang === 'fr' ? 'Préfères WhatsApp ? Cliquer ici' : 'تفضلين واتساب؟ اضغطي هنا'}
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
                { id: 'composition', fr: 'Composition & matière', ar: 'التركيبة والقماش',
                  content: product.composition || (lang === 'fr'
                    ? "Tissu noble travaillé avec soin. Composition détaillée bientôt — contactez-nous via WhatsApp pour plus d'infos."
                    : 'قماش راقي مشغول بعناية. التركيبة المفصلة قريباً — تواصلي معنا عبر واتساب للمزيد.') },
                { id: 'entretien', fr: 'Entretien & lavage', ar: 'العناية والغسيل',
                  content: product.entretien || (lang === 'fr'
                    ? "Lavage à la main à l'eau froide recommandé. Pas de sèche-linge, séchage à plat à l'ombre. Repassage à basse température si nécessaire."
                    : 'يُنصح بالغسيل اليدوي بالماء البارد. تجنبي مجفف الملابس، النشر مسطحاً في الظل. الكي على درجة منخفضة عند الحاجة.') },
                { id: 'details', fr: 'Détails & coupe', ar: 'التفاصيل والقصة',
                  content: product.details || (lang === 'fr'
                    ? 'Coupe pensée pour la femme marocaine, longueur ample, finitions soignées. Mannequin : 1m70, porte taille M.'
                    : 'قصّة مصممة للمرأة المغربية، طول فضفاض، تشطيب متقن. الموديل: 1.70م، تلبس مقاس M.') },
                { id: 'livraison', fr: 'Livraison & retours', ar: 'التوصيل والإرجاع',
                  content: lang === 'fr'
                    ? 'Livraison partout au Maroc en environ 1 semaine après confirmation. Paiement à la livraison disponible. Retours acceptés sous 14 jours, articles intacts avec étiquette.'
                    : 'التوصيل في كل المغرب في حوالي أسبوع بعد التأكيد. الدفع عند التوصيل متاح. الإرجاع مقبول خلال 14 يوماً، القطع سليمة مع البطاقة.' },
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
                      <span>{lang === 'fr' ? sec.fr : sec.ar}</span>
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
              <span className="sh2-num mono">/ {lang === 'fr' ? 'vous aimerez aussi' : 'قد يعجبك'}</span>
              <h2 className="sh2-title">{lang === 'fr' ? 'Dans le même style' : 'في نفس الأسلوب'}</h2>
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
              ✦ {lang === 'fr' ? 'Mensurations' : 'القياسات'} ✦
            </div>
            <h2 className="display" style={{ fontSize: 28, marginBottom: 18, letterSpacing: '-0.02em' }}>
              {lang === 'fr' ? 'Guide des tailles' : 'دليل المقاسات'}
            </h2>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 18, lineHeight: 1.6 }}>
              {lang === 'fr'
                ? 'Mesures en centimètres. En cas de doute entre deux tailles, choisis la plus grande pour un confort optimal.'
                : 'المقاسات بالسنتيمتر. في حال التردد بين مقاسين، اختاري الأكبر لراحة أفضل.'}
            </p>
            <div style={{ overflowX: 'auto', marginBottom: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
                <thead>
                  <tr style={{ background: 'var(--paper-2)' }}>
                    <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>{lang === 'fr' ? 'Taille' : 'المقاس'}</th>
                    <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>{lang === 'fr' ? 'Poitrine' : 'الصدر'}</th>
                    <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>{lang === 'fr' ? 'Taille' : 'الخصر'}</th>
                    <th style={{ padding: 10, textAlign: 'left', fontWeight: 500 }}>{lang === 'fr' ? 'Hanches' : 'الأرداف'}</th>
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
              {lang === 'fr' ? '✦ Toutes les coupes sont amples & confortables' : '✦ جميع القصّات فضفاضة ومريحة'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
