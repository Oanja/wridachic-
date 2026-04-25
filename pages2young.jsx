// Pages for wridachic young
const { useState: u2S, useEffect: u2E, useMemo: u2M } = React;

// ======== HOME ========
const HomeYoung = ({ lang, onNav, onProduct, wishlist, toggleWish }) => {
  const t = WC_TR[lang];
  const year = 2026;
  return (
    <div className="page2">

      {/* ── HERO ── */}
      <section className="hero-section" style={{ padding: '48px 28px 64px', position: 'relative', overflow: 'hidden' }}>
        <div className="wrap">
          <div className="hero-grid">

            {/* Text side */}
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="chip"><span className="chip-dot" /> {lang === 'fr' ? `Printemps ${year}` : `ربيع ${year}`}</span>
                <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>/ {lang === 'fr' ? 'Nouveau chaque semaine' : 'جديد كل أسبوع'}</span>
              </div>

              <h1 className="display" style={{ fontSize: 'clamp(52px, 9vw, 136px)', lineHeight: 0.9, letterSpacing: '-0.04em', marginBottom: 28 }}>
                {lang === 'fr' ? (
                  <>Le style<br /><em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>marocain</em><br />au naturel.</>
                ) : (
                  <>أناقة<br /><em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>مغربية</em><br />أصيلة.</>
                )}
              </h1>

              <p style={{ fontSize: 16, maxWidth: 440, lineHeight: 1.65, opacity: 0.75, marginBottom: 32 }}>
                {lang === 'fr'
                  ? 'Tenues de prière, robes & essentiels — dès 149 MAD, livrés partout au Maroc en 2–5 jours.'
                  : 'ملابس صلاة، فساتين وأساسيات — ابتداءً من 149 درهم، توصيل في كل المغرب.'}
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn2 btn2-dark btn2-lg" onClick={() => onNav('shop')}>
                  {lang === 'fr' ? 'Découvrir la boutique' : 'اكتشفي المتجر'} <Ic n="arr" s={14} />
                </button>
                <button className="btn2 btn2-outline btn2-lg" onClick={() => onNav('prayer')}>
                  {lang === 'fr' ? 'Espace Prière' : 'ملابس الصلاة'}
                </button>
              </div>

              {/* Stats */}
              <div className="hero-stats" style={{ display: 'flex', gap: 32, marginTop: 52, flexWrap: 'wrap' }}>
                {[
                  { n: '150+', l: lang === 'fr' ? 'Styles disponibles' : 'ستايل متاح' },
                  { n: '48h',  l: lang === 'fr' ? 'Livraison express' : 'توصيل سريع' },
                  { n: '★ 4.9', l: lang === 'fr' ? 'Avis clientes' : 'تقييم الزبونات' },
                ].map((s, i) => (
                  <div key={i} className="hero-stat">
                    <span className="display stat-num" style={{ fontSize: 34, display: 'block', color: 'var(--clay)', lineHeight: 1 }}>{s.n}</span>
                    <span className="mono stat-label" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.55 }}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Collage side */}
            <div className="hero-collage" style={{ position: 'relative', minHeight: 580 }}>
              <div className="blob" style={{ position: 'absolute', top: 0, right: 0, width: '82%', aspectRatio: '3/4', borderRadius: 24, overflow: 'hidden' }}>
                <Ph2 tint="clay" rose />
              </div>
              <div className="blob" style={{ position: 'absolute', top: '52%', left: 0, width: '52%', aspectRatio: '4/5', borderRadius: 20, overflow: 'hidden', animationDelay: '-2s', boxShadow: '0 12px 32px rgba(15,14,13,0.14)' }}>
                <Ph2 tint="lime" />
              </div>
              <div className="blob" style={{ position: 'absolute', top: 20, left: -8, animationDelay: '-4s' }}>
                <span className="sticker">{lang === 'fr' ? '✦ dès 149 MAD' : '✦ من 149 درهم'}</span>
              </div>
              <div className="blob" style={{ position: 'absolute', bottom: 24, right: 16, animationDelay: '-6s' }}>
                <span className="sticker sticker-clay">{lang === 'fr' ? 'COD partout ✓' : 'دفع عند الاستلام ✓'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROMISE TICKER ── */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '13px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 56, animation: 'slide 50s linear infinite', whiteSpace: 'nowrap', fontSize: 16, fontFamily: 'ThmanyahSerifDisplay, Fraunces, serif' }}>
          {[...Array(4)].map((_, k) => (
            <React.Fragment key={k}>
              <span>✦ {lang === 'fr' ? 'Livraison partout au Maroc' : 'توصيل في كل المغرب'}</span>
              <span style={{ color: 'var(--clay)' }}>✦ {lang === 'fr' ? 'Paiement à la livraison' : 'الدفع عند التسليم'}</span>
              <span>✦ {lang === 'fr' ? 'Tenues de prière' : 'ملابس الصلاة'}</span>
              <span style={{ color: 'var(--lime)' }}>✦ {lang === 'fr' ? 'Retours 14 jours' : 'إرجاع 14 يوماً'}</span>
              <span>✦ Made in 🇲🇦</span>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── SHOP BY MOOD ── */}
      <section style={{ padding: '80px 28px' }}>
        <div className="wrap">
          <div className="sh2">
            <span className="sh2-num mono">01 / {lang === 'fr' ? 'catégories' : 'أقسام'}</span>
            <h2 className="sh2-title">{lang === 'fr' ? 'Shop by mood' : 'تسوقي حسب المود'}</h2>
            <span className="sh2-link" onClick={() => onNav('shop')}>{lang === 'ar' ? '← كل المتجر' : '→ Voir tout'}</span>
          </div>

          <div className="cat-grid">
            {/* Main — Espace Prière */}
            <div className="cat-main" onClick={() => onNav('prayer')}>
              <Ph2 tint="mint" rose aspect="none" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(15,14,13,0.72))', zIndex: 2 }} />
              <div style={{ position: 'absolute', bottom: 24, left: 24, color: 'var(--paper)', zIndex: 3 }}>
                <div className="mono" style={{ fontSize: 11, opacity: 0.75, letterSpacing: '0.1em' }}>PRIÈRE / 01</div>
                <div className="display cat-title-lg" style={{ fontSize: 56, lineHeight: 1.0, marginTop: 6 }}>
                  {lang === 'fr' ? 'Prière' : 'الصلاة'}
                </div>
                <div style={{ fontSize: 13, marginTop: 6, opacity: 0.8 }}>
                  {lang === 'fr' ? 'Jilbab · Khimar · Ensemble' : 'جلباب · خمار · طقم صلاة'}
                </div>
              </div>
              <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 3 }}>
                <span className="sticker sticker-sky" style={{ transform: 'rotate(2deg)' }}>
                  {lang === 'fr' ? 'Dès 149 MAD ✦' : 'من 149 درهم ✦'}
                </span>
              </div>
            </div>

            {/* Side — Mode Quotidienne + Essentiels */}
            <div className="cat-side">
              <div className="cat-small" onClick={() => onNav('shop')}>
                <Ph2 tint="clay" aspect="none" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(15,14,13,0.55))', zIndex: 2 }} />
                <div style={{ position: 'absolute', bottom: 18, left: 18, zIndex: 3 }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', opacity: 0.85 }}>MODE / 02</div>
                  <div className="display cat-title-sm" style={{ fontSize: 34, lineHeight: 1.0 }}>
                    {lang === 'fr' ? 'Robes' : 'فساتين'}
                  </div>
                </div>
              </div>
              <div className="cat-small" onClick={() => onNav('shop')}>
                <Ph2 tint="sky" aspect="none" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(15,14,13,0.55))', zIndex: 2 }} />
                <div style={{ position: 'absolute', bottom: 18, left: 18, zIndex: 3 }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', opacity: 0.85 }}>BASICS / 03</div>
                  <div className="display cat-title-sm" style={{ fontSize: 34, lineHeight: 1.0 }}>
                    {lang === 'fr' ? 'Essentiels' : 'أساسيات'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      <section style={{ padding: '20px 28px 80px' }}>
        <div className="wrap">
          <div className="sh2">
            <span className="sh2-num mono">02 / {lang === 'fr' ? 'tendance' : 'الأكثر طلباً'}</span>
            <h2 className="sh2-title">{lang === 'fr' ? 'Coups de cœur' : 'الأكثر طلباً'}</h2>
            <span className="sh2-link" onClick={() => onNav('shop')}>{lang === 'ar' ? '← ' : '→ '}{lang === 'fr' ? 'Voir tout' : 'كل المتجر'}</span>
          </div>
          <div className="g4">
            {WC_PRODUCTS.slice(0, 8).map((p, i) => (
              <PCard key={p.id} product={p} lang={lang} onClick={onProduct} onWish={toggleWish} wished={wishlist.includes(p.id)} tint={TINTS[i % TINTS.length]} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BIG TICKER ── */}
      <section className="big-ticker-section" style={{ padding: '40px 0', overflow: 'hidden', borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)' }}>
        <div className="big-ticker-text" style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'slide 55s linear infinite', fontFamily: 'ThmanyahSerifDisplay, Fraunces, serif', fontSize: 'clamp(72px, 11vw, 160px)', lineHeight: 1, letterSpacing: '-0.04em' }}>
          {[...Array(3)].map((_, k) => (
            <span key={k} style={{ paddingRight: 56 }}>
              wrida<em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>chic</em>
              {' '}✦{' '}{lang === 'fr' ? 'marocaine & fière' : 'مغربية وفخورة'}
              {' '}✦{' '}
            </span>
          ))}
        </div>
      </section>

      {/* ── ESPACE PRIÈRE FEATURE ── */}
      <section style={{ padding: '80px 28px' }}>
        <div className="wrap">
          <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 40, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ aspectRatio: '4/5', borderRadius: 24, overflow: 'hidden' }}>
                <Ph2 tint="mint" rose />
              </div>
              <div style={{ position: 'absolute', bottom: 28, right: -16 }}>
                <span className="sticker sticker-sky" style={{ transform: 'rotate(-4deg)' }}>
                  {lang === 'fr' ? 'Élégance & beauté ✦' : 'أناقة وجمال ✦'}
                </span>
              </div>
            </div>
            <div>
              <span className="chip"><span className="chip-dot" /> {lang === 'fr' ? 'Espace prière' : 'ملابس الصلاة'}</span>
              <h2 className="display" style={{ fontSize: 'clamp(40px, 5vw, 68px)', lineHeight: 0.95, letterSpacing: '-0.03em', margin: '20px 0' }}>
                {lang === 'fr'
                  ? <>La prière<br />mérite la<br /><em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>beauté.</em></>
                  : <>الصلاة تستحق<br /><em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>الأجمل.</em></>}
              </h2>
              <p style={{ fontSize: 15, maxWidth: 420, lineHeight: 1.7, opacity: 0.75, marginBottom: 28 }}>
                {lang === 'fr'
                  ? 'Jilbabs, khimars & ensembles de prière pensés pour être confortables, couvrants et élégants. Dès 149 MAD.'
                  : 'جلابيب، خمارات وطقم صلاة مصممة لتكون مريحة، محتشمة وجميلة. ابتداءً من 149 درهم.'}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn2 btn2-clay btn2-lg" onClick={() => onNav('prayer')}>
                  {lang === 'fr' ? 'Voir la collection' : 'عرض المجموعة'} <Ic n="arr" s={14} />
                </button>
                <button className="btn2 btn2-outline btn2-lg" onClick={() => onNav('shop')}>
                  {lang === 'fr' ? 'Voir la boutique' : 'تصفحي المتجر'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY ── */}
      <section style={{ padding: '20px 28px 80px' }}>
        <div className="wrap">
          <div className="sh2">
            <span className="sh2-num mono">03 / community</span>
            <h2 className="sh2-title" dir="ltr">#wridachic</h2>
            <span className="sh2-link" dir="ltr">→ @wridachic</span>
          </div>
          <div className="g6">
            {['rose', 'clay', 'mint', 'lime', 'sky', 'ink'].map((tint, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}>
                <Ph2 tint={tint} aspect="1/1" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// ======== SHOP ========
const ShopYoung = ({ lang, onProduct, wishlist, toggleWish, initialCat }) => {
  const t = WC_TR[lang];
  const [cat, setCat] = u2S(initialCat || 'all');
  const [sort, setSort] = u2S('featured');

  const filtered = u2M(() => {
    let l = WC_PRODUCTS.filter(p => cat === 'all' || p.cat === cat);
    if (sort === 'price-asc')  l = [...l].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [cat, sort]);

  const cats = [
    { id: 'all', name: lang === 'fr' ? 'Tout' : 'الكل', nameAr: 'الكل' },
    ...WC_CATEGORIES,
  ];

  return (
    <div className="page2" style={{ padding: '40px 0 80px' }}>
      <div className="wrap">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid var(--ink)', paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ minWidth: 0 }}>
            <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>/ {lang === 'fr' ? 'boutique' : 'المتجر'} /</span>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 7vw, 72px)', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {lang === 'fr' ? 'La boutique.' : 'المتجر.'}
            </h1>
            <span className="mono" style={{ fontSize: 12, opacity: 0.5, display: 'inline-block', marginTop: 10 }}>
              {filtered.length} {lang === 'fr' ? 'articles' : 'قطعة'}
            </span>
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '8px 14px', border: '1.5px solid var(--ink)', borderRadius: 999, background: 'var(--paper)', fontFamily: 'inherit', fontSize: 13 }}>
            <option value="featured">{lang === 'fr' ? 'Sélection' : 'مميز'}</option>
            <option value="price-asc">{lang === 'fr' ? 'Prix croissant' : 'السعر ↗'}</option>
            <option value="price-desc">{lang === 'fr' ? 'Prix décroissant' : 'السعر ↘'}</option>
          </select>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          {cats.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              padding: '9px 18px', borderRadius: 999,
              border: '1.5px solid var(--ink)',
              background: cat === c.id ? 'var(--ink)' : 'transparent',
              color: cat === c.id ? 'var(--paper)' : 'var(--ink)',
              fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {lang === 'fr' ? c.name : c.nameAr}
            </button>
          ))}
        </div>

        <div className="g4">
          {filtered.map((p, i) => (
            <PCard key={p.id} product={p} lang={lang} onClick={onProduct} onWish={toggleWish} wished={wishlist.includes(p.id)} tint={TINTS[i % TINTS.length]} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ======== PRODUCT DETAIL ========
const PDetailYoung = ({ lang, product, onBack, onAddToCart, onBuyNow, onProduct, wishlist, toggleWish }) => {
  const t = WC_TR[lang];
  const [size, setSize] = u2S('M');
  const [color, setColor] = u2S(product.colors[0]);
  const [qty, setQty] = u2S(1);
  const [main, setMain] = u2S(0);
  const [added, setAdded] = u2S(false);
  const name = lang === 'fr' ? product.name : product.nameAr;
  const related = WC_PRODUCTS.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 4);

  return (
    <div className="page2" style={{ padding: '32px 0 80px' }}>
      <div className="wrap">
        {/* Breadcrumb */}
        <div className="mono" style={{ fontSize: 11, opacity: 0.5, marginBottom: 24 }}>
          <a onClick={onBack} style={{ cursor: 'pointer' }}>/ {lang === 'fr' ? 'boutique' : 'المتجر'}</a>
          {' / '}{WC_CATEGORIES.find(c => c.id === product.cat)?.[lang === 'fr' ? 'name' : 'nameAr']}
          {' / '}{name}
        </div>

        <div className="pdetail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          {/* Images */}
          <div className="pdetail-img" style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 10 }}>
            <div className="pdetail-thumbs" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2, 3].map(i => (
                <button key={i} onClick={() => setMain(i)} style={{ padding: 0, border: main === i ? '2px solid var(--ink)' : '1.5px solid var(--line)', borderRadius: 10, aspectRatio: '3/4', overflow: 'hidden' }}>
                  <Ph2 tint={TINTS[i % TINTS.length]} />
                </button>
              ))}
            </div>
            <div style={{ aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden' }}>
              <Ph2 tint={TINTS[main % TINTS.length]} rose />
            </div>
          </div>

          {/* Info */}
          <div>
            {product.tag === 'new'  && <span className="sticker">NOUVEAU ✦</span>}
            {product.tag === 'sale' && <span className="sticker sticker-clay">SOLDE −{Math.round((1 - product.price / product.oldPrice) * 100)}%</span>}
            <h1 className="display" style={{ fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1, marginTop: 12, marginBottom: 10, letterSpacing: '-0.02em' }}>{name}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: 13 }}>
              <span style={{ color: 'var(--clay)' }}>★★★★★</span>
              <span style={{ opacity: 0.5 }}>4.9 · 124 {lang === 'fr' ? 'avis' : 'تقييم'}</span>
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

            {/* Color */}
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 10, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>{t.product.color}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {product.colors.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{ width: 34, height: 34, borderRadius: '50%', background: c, border: color === c ? '2.5px solid var(--ink)' : '1px solid var(--line)', outline: color === c ? '2px solid var(--paper)' : 'none', outlineOffset: -3 }} />
                ))}
              </div>
            </div>

            {/* Size */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{t.product.size}</span>
                <a style={{ fontSize: 12, borderBottom: '1px solid var(--ink)', cursor: 'pointer' }}>{t.product.sizeGuide}</a>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['XS','S','M','L','XL','XXL'].map(s => (
                  <button key={s} onClick={() => setSize(s)} style={{ padding: '9px 14px', border: `1.5px solid var(--ink)`, borderRadius: 999, background: size === s ? 'var(--ink)' : 'transparent', color: size === s ? 'var(--paper)' : 'var(--ink)', fontSize: 12, minWidth: 42 }}>{s}</button>
                ))}
              </div>
            </div>

            {/* Qty + Add */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--ink)', borderRadius: 999 }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '0 14px', height: 48 }}><Ic n="minus" s={12} /></button>
                <span style={{ minWidth: 28, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>{qty}</span>
                <button onClick={() => setQty(qty + 1)} style={{ padding: '0 14px', height: 48 }}><Ic n="plus" s={12} /></button>
              </div>
              <button className="btn2 btn2-dark" style={{ flex: 1 }} onClick={() => { onAddToCart({ ...product, size, color, qty }); setAdded(true); setTimeout(() => setAdded(false), 1600); }}>
                {added ? <><Ic n="check" s={14} /> {lang === 'fr' ? 'Ajouté !' : 'تمت!'}</> : `+ ${t.product.add}`}
              </button>
              <button className="btn2 btn2-outline" onClick={() => toggleWish(product.id)}><Ic n="heart" s={16} /></button>
            </div>
            <button className="btn2 btn2-clay" style={{ width: '100%', marginBottom: 12 }} onClick={() => onBuyNow({ ...product, size, color, qty })}>
              {lang === 'fr' ? 'Commander maintenant →' : 'اطلبي دابا ←'}
            </button>

            {/* Badges */}
            <div className="pdetail-badges" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { ic: 'truck',   l: t.product.delivery },
                { ic: 'shield',  l: t.product.cod },
                { ic: 'refresh', l: t.product.return },
              ].map((it, i) => (
                <div key={i} style={{ padding: 14, background: 'var(--paper-2)', borderRadius: 12, textAlign: 'center', fontSize: 11 }}>
                  <Ic n={it.ic} s={18} />
                  <div style={{ marginTop: 6, lineHeight: 1.4 }}>{it.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section style={{ marginTop: 80 }}>
            <div className="sh2">
              <span className="sh2-num mono">/ {lang === 'fr' ? 'vous aimerez aussi' : 'قد يعجبك'}</span>
              <h2 className="sh2-title">{lang === 'fr' ? 'Dans le même style' : 'في نفس الأسلوب'}</h2>
            </div>
            <div className="g4">
              {related.map((p, i) => (
                <PCard key={p.id} product={p} lang={lang} onClick={onProduct} onWish={toggleWish} wished={wishlist.includes(p.id)} tint={TINTS[i % TINTS.length]} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// ======== CART ========
const CartYoung = ({ lang, cart, updateQty, removeItem, onCheckout, onContinue }) => {
  const t = WC_TR[lang];
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery  = subtotal > 500 ? 0 : 35;
  const total     = subtotal + delivery;

  if (cart.length === 0) return (
    <div className="page2" style={{ padding: '100px 28px', textAlign: 'center' }}>
      <div style={{ fontSize: 72 }}>🛍️</div>
      <h1 className="display" style={{ fontSize: 56, marginTop: 20 }}>{t.cart.empty}</h1>
      <p style={{ opacity: 0.55, margin: '12px 0 28px' }}>{lang === 'fr' ? 'Découvre nos collections ↓' : 'اكتشفي مجموعاتنا ↓'}</p>
      <button className="btn2 btn2-dark btn2-lg" onClick={onContinue}>{t.cart.continue} <Ic n="arr" s={14} /></button>
    </div>
  );

  return (
    <div className="page2" style={{ padding: '40px 0 80px' }}>
      <div className="wrap">
        <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 64px)', marginBottom: 32, letterSpacing: '-0.03em' }}>
          {t.cart.title} <span className="mono" style={{ fontSize: 16, opacity: 0.4 }}>({cart.length})</span>
        </h1>
        <div className="cart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40 }}>
          <div>
            {cart.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 16, padding: '20px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden' }}>
                  <Ph2 tint={TINTS[i % TINTS.length]} />
                </div>
                <div>
                  <div className="display" style={{ fontSize: 20 }}>{lang === 'fr' ? item.name : item.nameAr}</div>
                  <div className="mono" style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                    {item.size} · <span style={{ display: 'inline-block', width: 10, height: 10, background: item.color, borderRadius: '50%', verticalAlign: 'middle' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--ink)', borderRadius: 999 }}>
                      <button onClick={() => updateQty(i, Math.max(1, item.qty - 1))} style={{ padding: '5px 10px' }}><Ic n="minus" s={10} /></button>
                      <span style={{ minWidth: 22, textAlign: 'center', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{item.qty}</span>
                      <button onClick={() => updateQty(i, item.qty + 1)} style={{ padding: '5px 10px' }}><Ic n="plus" s={10} /></button>
                    </div>
                    <button onClick={() => removeItem(i)} style={{ fontSize: 11, opacity: 0.5, borderBottom: '1px solid currentColor' }}>{t.cart.remove}</button>
                  </div>
                </div>
                <div className="mono" style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{item.price * item.qty}</span> <span style={{ fontSize: 10, opacity: 0.4 }}>MAD</span>
                </div>
              </div>
            ))}
            <button className="btn2 btn2-outline" style={{ marginTop: 20 }} onClick={onContinue}>← {t.cart.continue}</button>
          </div>

          <aside style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 28, borderRadius: 20, height: 'fit-content' }}>
            <div className="display" style={{ fontSize: 26, marginBottom: 20 }}>{lang === 'fr' ? 'Récapitulatif' : 'ملخص الطلب'}</div>
            {[
              [t.cart.subtotal, `${subtotal} MAD`],
              [t.cart.delivery, delivery === 0 ? (lang === 'fr' ? 'Offerte ✦' : 'مجاني ✦') : `${delivery} MAD`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 14 }}>
                <span style={{ opacity: 0.65 }}>{k}</span><span className="mono">{v}</span>
              </div>
            ))}
            {subtotal < 500 && (
              <div className="mono" style={{ fontSize: 11, color: 'var(--lime)', paddingTop: 4 }}>
                + {500 - subtotal} MAD → {lang === 'fr' ? 'livraison offerte' : 'توصيل مجاني'}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', borderTop: '1px solid rgba(250,246,241,0.18)', marginTop: 12 }}>
              <span className="display" style={{ fontSize: 22 }}>{t.cart.total}</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{total} MAD</span>
            </div>
            <button className="btn2 btn2-clay" style={{ width: '100%', marginTop: 20 }} onClick={onCheckout}>{t.cart.checkout} →</button>
            <a className="btn2 btn2-wa" href="https://wa.me/212600000000" target="_blank" style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ic n="wa" s={14} /> WhatsApp
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
};

// ======== CHECKOUT ========
const CheckoutYoung = ({ lang, cart, onSuccess, user }) => {
  const t = WC_TR[lang];
  const [step, setStep] = u2S(1);
  const [payment, setPayment] = u2S('cod');
  const [form, setForm] = u2S({ fullName: '', phone: '', email: '', address: '', city: 'Casablanca' });
  const [saving, setSaving] = u2S(false);
  const [orderNum, setOrderNum] = u2S('');
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery  = subtotal > 500 ? 0 : 35;
  const total     = subtotal + delivery;

  const placeOrder = async () => {
    setSaving(true);
    const num = 'WC-' + (Math.floor(Math.random() * 900000) + 100000);
    setOrderNum(num);
    const itemsData = cart.map(it => ({
      name: lang === 'ar' ? (it.nameAr || it.name) : it.name,
      qty: it.qty, size: it.size, color: it.color, price: it.price,
    }));
    try {
      const payload = {
        order_number: num, status: 'nouveau',
        full_name: form.fullName, phone: form.phone, email: form.email,
        address: form.address, city: form.city, payment,
        subtotal, delivery, total, items: itemsData, lang,
      };
      if (user) payload.user_id = user.id;
      await window._sb.from('orders').insert(payload);
    } catch(e) { console.error('Supabase:', e); }
    setSaving(false);
    setStep(4);
  };

  if (step === 4) return (
    <div className="page2" style={{ padding: '100px 28px', textAlign: 'center' }}>
      <div style={{ fontSize: 72 }}>✨</div>
      <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 72px)', marginTop: 20, letterSpacing: '-0.03em' }}>{t.checkout.success}</h1>
      <p style={{ opacity: 0.65, marginTop: 12, maxWidth: 480, margin: '12px auto 28px' }}>{t.checkout.successDesc}</p>
      <div style={{ background: 'var(--paper-2)', padding: 24, borderRadius: 16, maxWidth: 380, margin: '0 auto 28px', textAlign: lang === 'ar' ? 'right' : 'left' }}>
        <div className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{lang === 'fr' ? 'Numéro de commande' : 'رقم الطلب'}</div>
        <div className="display" style={{ fontSize: 26, marginTop: 4 }}>{orderNum}</div>
        <div className="mono" style={{ fontSize: 13, marginTop: 8, opacity: 0.7 }}>{total} MAD · {payment === 'cod' ? t.checkout.cod : t.checkout.cib}</div>
      </div>
      <button className="btn2 btn2-dark btn2-lg" onClick={onSuccess}>← {lang === 'fr' ? 'Retour boutique' : 'العودة للمتجر'}</button>
    </div>
  );

  return (
    <div className="page2" style={{ padding: '40px 0 80px' }}>
      <div className="wrap" style={{ maxWidth: 1100 }}>
        <h1 className="display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', textAlign: 'center', marginBottom: 20, letterSpacing: '-0.03em' }}>{t.checkout.title}</h1>

        {/* Steps — only 2 now (shipping + review, payment forcé COD) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, flexWrap: 'wrap' }}>
          {[t.checkout.shipping, t.checkout.review].map((s, i) => {
            const stepIdx = i === 0 ? 1 : 3;
            const passed = step > stepIdx;
            const active = step === stepIdx;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: passed ? 'var(--ink)' : active ? 'var(--clay)' : 'var(--muted)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', background: passed ? 'var(--ink)' : 'transparent', color: passed ? 'var(--paper)' : 'inherit' }}>
                  {passed ? <Ic n="check" s={10} /> : `0${i + 1}`}
                </div>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s}</span>
                {i < 1 && <span style={{ width: 20, height: 1, background: 'currentColor', opacity: 0.25 }} />}
              </div>
            );
          })}
        </div>

        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40 }}>
          <div>
            {step === 1 && (
              <div>
                <h2 className="display" style={{ fontSize: 30, marginBottom: 20 }}>{t.checkout.shipping}</h2>
                <div style={{ display: 'grid', gap: 12 }}>
                  {['fullName','phone','email','address'].map(f => {
                    const required = f !== 'email';
                    return (
                      <div key={f}>
                        <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>
                          {t.checkout[f]} {required && <span style={{ color: 'var(--clay)' }}>*</span>}
                        </label>
                        <input className="input2" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} style={{ marginTop: 4 }} type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'} required={required} />
                      </div>
                    );
                  })}
                  <div>
                    <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>
                      {t.checkout.city} <span style={{ color: 'var(--clay)' }}>*</span>
                    </label>
                    <select className="input2" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ marginTop: 4 }}>
                      {['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir','Meknès','Oujda'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {(() => {
                  const valid = form.fullName.trim() && /^[0-9]{9,10}$/.test(form.phone.trim()) && form.address.trim() && form.city.trim();
                  return (
                    <>
                      {!valid && (form.fullName || form.phone || form.address) && (
                        <p className="mono" style={{ fontSize: 11, color: 'var(--clay)', marginTop: 12 }}>
                          {lang === 'fr' ? '⚠ Remplis tous les champs obligatoires (téléphone valide).' : '⚠ كملي جميع الحقول الإجبارية (رقم هاتف صحيح).'}
                        </p>
                      )}
                      <button
                        className="btn2 btn2-dark btn2-lg"
                        style={{ marginTop: 16, opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'not-allowed' }}
                        disabled={!valid}
                        onClick={() => valid && setStep(3)}
                      >{lang === 'fr' ? 'Continuer' : 'متابعة'} →</button>
                    </>
                  );
                })()}
              </div>
            )}
            {step === 3 && (
              <div>
                <h2 className="display" style={{ fontSize: 30, marginBottom: 20 }}>{t.checkout.review}</h2>
                <div style={{ background: 'var(--paper-2)', padding: 18, borderRadius: 14, marginBottom: 10 }}>
                  <div className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{t.checkout.shipping}</div>
                  <div>{form.fullName || '—'}</div>
                  <div style={{ opacity: 0.6, fontSize: 13 }}>{form.address || '—'}, {form.city} · {form.phone || '—'}</div>
                </div>
                <div style={{ background: 'var(--paper-2)', padding: 18, borderRadius: 14, marginBottom: 10 }}>
                  <div className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{lang === 'fr' ? 'Paiement' : 'الدفع'}</div>
                  <div>{t.checkout.cod}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn2 btn2-outline" onClick={() => setStep(1)}>← {lang === 'fr' ? 'Retour' : 'رجوع'}</button>
                  <button className="btn2 btn2-clay btn2-lg" style={{ flex: 1 }} onClick={placeOrder} disabled={saving}>{saving ? '...' : t.checkout.place + ' ✨'}</button>
                </div>
              </div>
            )}
          </div>

          <aside style={{ background: 'var(--paper-2)', padding: 24, borderRadius: 16, height: 'fit-content' }}>
            <div className="display" style={{ fontSize: 20, marginBottom: 14 }}>{cart.length} {lang === 'fr' ? 'articles' : 'قطعة'}</div>
            {cart.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 13 }}>
                <div style={{ width: 44, aspectRatio: '3/4', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}><Ph2 tint={TINTS[i % TINTS.length]} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{lang === 'fr' ? item.name : item.nameAr}</div>
                  <div className="mono" style={{ fontSize: 10, opacity: 0.5 }}>{item.size} · x{item.qty}</div>
                </div>
                <div className="mono" style={{ fontWeight: 600 }}>{item.price * item.qty}</div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 8 }}>
              {[['subtotal', subtotal], ['delivery', delivery]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }} className="mono">
                  <span style={{ opacity: 0.5 }}>{k}</span>
                  <span>{k === 'delivery' && v === 0 ? 'free' : `${v} MAD`}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', borderTop: '1px solid var(--line)', marginTop: 8 }}>
                <span className="display" style={{ fontSize: 20 }}>total</span>
                <span className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{total} MAD</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// ======== CAFTANS ========
const CaftanYoung = ({ lang, onProduct, wishlist, toggleWish }) => {
  const items = WC_PRODUCTS.filter(p => p.cat === 'caftans');
  return (
    <div className="page2">
      <section style={{ position: 'relative', height: 520, overflow: 'hidden', margin: '20px 28px 0', borderRadius: 24 }}>
        <Ph2 tint="clay" rose />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,14,13,0.15), rgba(15,14,13,0.65))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 48, color: 'var(--paper)' }}>
          <span className="sticker sticker-rose" style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
            {lang === 'fr' ? 'Mariage & cérémonies ✦' : 'أعراس ومناسبات ✦'}
          </span>
          <h1 className="display" style={{ fontSize: 'clamp(64px, 10vw, 120px)', lineHeight: 0.9, letterSpacing: '-0.04em', maxWidth: 700 }}>
            {lang === 'fr'
              ? <>caftans<br /><em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>& co.</em></>
              : <>قفاطين<br /><em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>للعرس</em></>}
          </h1>
          <p style={{ fontSize: 15, maxWidth: 480, opacity: 0.85, marginTop: 16 }}>
            {lang === 'fr'
              ? 'Takchitas, djellabas & abayas pour la femme qui veut briller avec élégance.'
              : 'تكشيطات، جلابيب وعبايات لبنت تتميز بأناقة وجمال.'}
          </p>
        </div>
      </section>
      <section style={{ padding: '64px 28px 80px' }}>
        <div className="wrap">
          <div className="sh2">
            <span className="sh2-num mono">01 / {lang === 'fr' ? 'collection' : 'مجموعة'}</span>
            <h2 className="sh2-title">{lang === 'fr' ? 'Toute la collection' : 'كل المجموعة'}</h2>
          </div>
          <div className="g4">
            {items.map((p, i) => (
              <PCard key={p.id} product={p} lang={lang} onClick={onProduct} onWish={toggleWish} wished={wishlist.includes(p.id)} tint={TINTS[i % TINTS.length]} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// ======== ESPACE PRIÈRE ========
const PrayerYoung = ({ lang, onProduct, wishlist, toggleWish }) => {
  const items = WC_PRODUCTS.filter(p => p.cat === 'prayer');
  return (
    <div className="page2">
      <section style={{ position: 'relative', height: 460, overflow: 'hidden', margin: '20px 28px 0', borderRadius: 24 }}>
        <Ph2 tint="mint" rose />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,14,13,0.1), rgba(15,14,13,0.60))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 48, color: 'var(--paper)' }}>
          <span className="sticker sticker-sky" style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
            {lang === 'fr' ? 'Modestie & élégance ✦' : 'حشمة وأناقة ✦'}
          </span>
          <h1 className="display" style={{ fontSize: 'clamp(52px, 9vw, 100px)', lineHeight: 0.92, letterSpacing: '-0.04em' }}>
            {lang === 'fr'
              ? <>Espace<br /><em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>prière</em></>
              : <>ملابس<br /><em style={{ fontStyle: 'italic', color: 'var(--rose)' }}>الصلاة</em></>}
          </h1>
          <p style={{ fontSize: 15, maxWidth: 460, opacity: 0.85, marginTop: 16 }}>
            {lang === 'fr'
              ? 'Jilbabs, khimars & ensembles conçus pour être confortables, couvrants et élégants. Dès 149 MAD.'
              : 'جلابيب، خمارات وأطقم مصممة لتكون مريحة، محتشمة وجميلة. من 149 درهم.'}
          </p>
        </div>
      </section>
      <section style={{ padding: '64px 28px 80px' }}>
        <div className="wrap">
          <div className="sh2">
            <span className="sh2-num mono">/ {lang === 'fr' ? 'espace prière' : 'ملابس الصلاة'}</span>
            <h2 className="sh2-title">{lang === 'fr' ? 'Tous les articles' : 'كل القطع'}</h2>
          </div>
          <div className="g4">
            {items.map((p, i) => (
              <PCard key={p.id} product={p} lang={lang} onClick={onProduct} onWish={toggleWish} wished={wishlist.includes(p.id)} tint={TINTS[i % TINTS.length]} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// ======== ABOUT ========
const AboutYoung = ({ lang }) => (
  <div className="page2" style={{ padding: '60px 0 40px' }}>
    <div className="wrap">
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <img src="assets/wridachic-logo-new.png" style={{ height: 60, margin: '0 auto 24px' }} alt="wridachic" />
        <span className="chip"><span className="chip-dot" /> {lang === 'fr' ? 'Notre histoire' : 'قصتنا'}</span>
        <h1 className="display" style={{ fontSize: 'clamp(52px, 8vw, 110px)', lineHeight: 0.92, letterSpacing: '-0.04em', marginTop: 20 }}>
          {lang === 'fr'
            ? <>une <em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>rose</em>,<br />une marque.</>
            : <>وردة،<br /><em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>علامة</em>.</>}
        </h1>
        <p style={{ fontSize: 17, maxWidth: 600, margin: '24px auto 0', opacity: 0.7, lineHeight: 1.7 }}>
          {lang === 'fr'
            ? 'wridachic (de وريدة — la petite rose — et chic) est une marque marocaine qui réinterprète le vestiaire féminin traditionnel pour les femmes d\'aujourd\'hui, entre modernité et modestie.'
            : 'wridachic (من "وريدة" بمعنى الوردة الصغيرة، و"شيك") علامة مغربية تعيد تفسير الأزياء النسائية التقليدية للمرأة العصرية، بين الحداثة والحشمة.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 64 }}>
        <div style={{ aspectRatio: '4/5', borderRadius: 24, overflow: 'hidden' }}>
          <Ph2 tint="rose" rose />
        </div>
        <div style={{ alignSelf: 'center' }}>
          <h2 className="display" style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.0, marginBottom: 20 }}>
            {lang === 'fr' ? 'Made in 🇲🇦, pour la femme marocaine.' : 'صنع في 🇲🇦، للمرأة المغربية.'}
          </h2>
          <p style={{ fontSize: 15, opacity: 0.7, lineHeight: 1.75 }}>
            {lang === 'fr'
              ? 'On collabore avec des ateliers artisanaux à Casablanca, Fès et Marrakech. Chaque pièce est pensée pour allier qualité, modestie et style — des caftans de cérémonie aux tenues de prière.'
              : 'نتعاون مع ورشات حرفية في الدار البيضاء وفاس ومراكش. كل قطعة مصممة لتجمع بين الجودة والحشمة والأناقة — من قفطان المناسبات إلى ملابس الصلاة.'}
          </p>
        </div>
      </div>

      <div className="g3">
        {[
          { n: '01', t: lang === 'fr' ? 'Accessible' : 'في المتناول', d: lang === 'fr' ? 'Dès 149 MAD. La qualité sans compromis.' : 'من 149 درهم. جودة بلا تنازل.', tint: 'rose' },
          { n: '02', t: lang === 'fr' ? 'Artisanale' : 'حرفية', d: lang === 'fr' ? 'Ateliers locaux, finitions soignées, fibres naturelles.' : 'ورشات محلية، تشطيب محكم، خامات طبيعية.', tint: 'lime' },
          { n: '03', t: lang === 'fr' ? 'Modeste & chic' : 'محتشمة وأنيقة', d: lang === 'fr' ? 'Mode, prière, cérémonie — une marque pour toutes les occasions.' : 'موضة، صلاة، مناسبات — علامة لكل الأوقات.', tint: 'sky' },
        ].map(v => (
          <div key={v.n} style={{ padding: 32, borderRadius: 20, background: `var(--paper-2)`, position: 'relative', overflow: 'hidden' }}>
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

// ======== LOOKBOOK ========
const LookbookYoung = ({ lang }) => (
  <div className="page2" style={{ padding: '40px 0 80px' }}>
    <div className="wrap">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span className="chip"><span className="chip-dot" /> SS26</span>
        <h1 className="display" style={{ fontSize: 'clamp(64px, 10vw, 96px)', lineHeight: 0.9, letterSpacing: '-0.04em', marginTop: 16 }}>
          {lang === 'fr' ? <>the <em style={{ fontStyle: 'italic', color: 'var(--clay)' }}>book</em>.</> : 'اللوكبوك'}
        </h1>
        <p style={{ opacity: 0.6, marginTop: 10 }}>
          {lang === 'fr' ? 'Printemps / Été 26 — médina, rooftop, souk' : 'ربيع / صيف 26 — مدينة، أسطح، سوق'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridAutoRows: '180px', gap: 12 }}>
        {[
          { c: 'span 3', r: 'span 2', t: 'clay'  },
          { c: 'span 3', r: 'span 2', t: 'lime'  },
          { c: 'span 2', r: 'span 2', t: 'rose'  },
          { c: 'span 2', r: 'span 3', t: 'ink'   },
          { c: 'span 2', r: 'span 2', t: 'sky'   },
          { c: 'span 4', r: 'span 2', t: 'mint'  },
          { c: 'span 2', r: 'span 2', t: 'clay'  },
        ].map((l, i) => (
          <div key={i} style={{ gridColumn: l.c, gridRow: l.r, borderRadius: 16, overflow: 'hidden' }}>
            <Ph2 tint={l.t} rose={i % 3 === 0} aspect="none" />
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 48 }} className="mono">
        <span style={{ fontSize: 11, opacity: 0.45 }}>ph: studio wridachic · casa + marrakech · ss26</span>
      </div>
    </div>
  </div>
);

// ======== ADMIN ========
const ADMIN_PASS = 'wridachic2026';
const STATUS_COLORS = { nouveau: '#C85C3F', confirmé: '#4A90D9', expédié: '#7B68EE', livré: '#4CAF50' };
const STATUS_LABELS = ['nouveau', 'confirmé', 'expédié', 'livré'];

const AdminYoung = () => {
  const [pwd, setPwd] = u2S('');
  const [authed, setAuthed] = u2S(false);
  const [orders, setOrders] = u2S([]);
  const [users, setUsers] = u2S([]);
  const [loading, setLoading] = u2S(false);
  const [error, setError] = u2S('');
  const [tab, setTab] = u2S('orders');

  const login = () => {
    if (pwd === ADMIN_PASS) { setAuthed(true); fetchOrders(); fetchUsers(); }
    else setError('Mot de passe incorrect');
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await window._sb.from('orders').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setOrders(data || []);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await window._sb.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error) setUsers(data || []);
  };

  const updateStatus = async (id, status) => {
    await window._sb.from('orders').update({ status }).eq('id', id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const deleteOrder = async (id) => {
    if (!confirm('Supprimer cette commande définitivement ?')) return;
    await window._sb.from('orders').delete().eq('id', id);
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const fmt = (iso) => new Date(iso).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const userStats = (uid) => {
    const userOrders = orders.filter(o => o.user_id === uid);
    return {
      count: userOrders.length,
      total: userOrders.reduce((s, o) => s + (o.total || 0), 0),
    };
  };

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)', padding: 16 }}>
      <div style={{ background: 'var(--paper)', padding: 40, borderRadius: 20, width: '100%', maxWidth: 320, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <Logo2 size={48} />
        </div>
        <h2 className="display" style={{ fontSize: 24, marginTop: 20, marginBottom: 6 }}>Admin</h2>
        <p className="mono" style={{ fontSize: 11, opacity: 0.5, marginBottom: 24 }}>TABLEAU DE BORD</p>
        <input
          type="password" placeholder="Mot de passe"
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          className="input2" style={{ marginBottom: 12 }}
        />
        {error && <p style={{ color: 'var(--clay)', fontSize: 12, marginBottom: 10 }}>{error}</p>}
        <button className="btn2 btn2-dark" style={{ width: '100%' }} onClick={login}>Connexion →</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0F0E0D', color: '#FAF6F1', padding: '24px 16px' }}>
      <style>{`
        .adm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .adm-order { display: grid; grid-template-columns: 120px 1fr 1fr auto; gap: 16px; align-items: start; }
        .adm-status { display: flex; flex-direction: column; gap: 6px; }
        @media (max-width: 640px) {
          .adm-stats { grid-template-columns: repeat(2, 1fr); }
          .adm-order { grid-template-columns: 1fr 1fr; }
          .adm-order-num { grid-column: 1; }
          .adm-order-customer { grid-column: 2; }
          .adm-order-items { grid-column: 1 / -1; border-top: 1px solid rgba(250,246,241,0.08); padding-top: 10px; }
          .adm-status { grid-column: 1 / -1; flex-direction: row; flex-wrap: wrap; border-top: 1px solid rgba(250,246,241,0.08); padding-top: 10px; }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo2 size={32} invert />
            <div>
              <div className="display" style={{ fontSize: 20 }}>Tableau de bord</div>
              <div className="mono" style={{ fontSize: 10, opacity: 0.4 }}>{orders.length} COMMANDES</div>
            </div>
          </div>
          <button onClick={() => { fetchOrders(); fetchUsers(); }} className="btn2 btn2-outline" style={{ fontSize: 12, color: '#FAF6F1', borderColor: 'rgba(250,246,241,0.3)', padding: '10px 16px' }}>
            ↻ Actualiser
          </button>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: '1px solid rgba(250,246,241,0.1)', flexWrap: 'wrap' }}>
          {[
            { id: 'orders', label: `Commandes (${orders.length})` },
            { id: 'users',  label: `Utilisateurs (${users.length})` },
          ].map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className="mono" style={{
              padding: '12px 20px', fontSize: 12, marginBottom: -1, cursor: 'pointer',
              borderBottom: tab === tb.id ? '2px solid var(--clay)' : '2px solid transparent',
              color: tab === tb.id ? '#FAF6F1' : 'rgba(250,246,241,0.4)',
              fontWeight: tab === tb.id ? 600 : 400,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>{tb.label}</button>
          ))}
        </div>

        {tab === 'orders' && (<>
          {/* Stats */}
          <div className="adm-stats">
            {STATUS_LABELS.map(s => {
              const count = orders.filter(o => o.status === s).length;
              const total = orders.filter(o => o.status === s).reduce((acc, o) => acc + (o.total || 0), 0);
              return (
                <div key={s} style={{ background: 'rgba(250,246,241,0.05)', borderRadius: 14, padding: 16, borderLeft: `3px solid ${STATUS_COLORS[s]}` }}>
                  <div className="mono" style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s}</div>
                  <div className="display" style={{ fontSize: 28, marginTop: 4 }}>{count}</div>
                  <div className="mono" style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>{total} MAD</div>
                </div>
              );
            })}
          </div>

          {/* Orders */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }} className="mono">Chargement...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }} className="mono">Aucune commande pour l'instant.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orders.map(o => (
                <div key={o.id} style={{ background: 'rgba(250,246,241,0.04)', border: '1px solid rgba(250,246,241,0.1)', borderRadius: 14, padding: '16px' }}>
                  <div className="adm-order">
                    <div className="adm-order-num">
                      <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--clay)' }}>{o.order_number}</div>
                      <div className="mono" style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>{fmt(o.created_at)}</div>
                    </div>
                    <div className="adm-order-customer">
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{o.full_name}</div>
                      <div className="mono" style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>{o.phone}</div>
                      <div className="mono" style={{ fontSize: 11, opacity: 0.4 }}>{o.email}</div>
                      <div className="mono" style={{ fontSize: 11, opacity: 0.4 }}>{o.address}, {o.city}</div>
                    </div>
                    <div className="adm-order-items">
                      {(o.items || []).map((it, i) => (
                        <div key={i} className="mono" style={{ fontSize: 11, opacity: 0.7, marginBottom: 3 }}>
                          {it.name} × {it.qty} — {it.size}
                          <span style={{ display: 'inline-block', width: 10, height: 10, background: it.color, borderRadius: '50%', verticalAlign: 'middle', marginLeft: 6, border: '1px solid rgba(250,246,241,0.3)' }} />
                        </div>
                      ))}
                      <div style={{ marginTop: 6, fontWeight: 700 }}>{o.total} MAD
                        <span className="mono" style={{ fontSize: 10, opacity: 0.45, marginLeft: 8 }}>COD</span>
                      </div>
                    </div>
                    <div className="adm-status">
                      {STATUS_LABELS.map(s => (
                        <button key={s} onClick={() => updateStatus(o.id, s)} className="mono" style={{
                          padding: '5px 12px', borderRadius: 999, fontSize: 10, cursor: 'pointer',
                          background: o.status === s ? STATUS_COLORS[s] : 'transparent',
                          color: o.status === s ? '#fff' : 'rgba(250,246,241,0.4)',
                          border: `1px solid ${o.status === s ? STATUS_COLORS[s] : 'rgba(250,246,241,0.15)'}`,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>{s}</button>
                      ))}
                      <button onClick={() => deleteOrder(o.id)} className="mono" style={{
                        padding: '5px 12px', borderRadius: 999, fontSize: 10, cursor: 'pointer',
                        background: 'transparent', color: 'rgba(255,90,90,0.7)',
                        border: '1px solid rgba(255,90,90,0.35)',
                        textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4,
                      }}>✕ Supprimer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        {tab === 'users' && (
          users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }} className="mono">
              Aucun utilisateur. Crée la table `profiles` dans Supabase (voir instructions).
            </div>
          ) : (
            <>
              <div style={{ background: 'rgba(250,246,241,0.05)', border: '1px solid rgba(250,246,241,0.1)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <span className="mono" style={{ fontSize: 11, opacity: 0.7 }}>
                  ℹ Liste en lecture seule. Pour modifier ou supprimer → Supabase Dashboard
                </span>
                <a href="https://supabase.com/dashboard/project/guoapqclmskyoubyivuv/auth/users" target="_blank" rel="noopener" className="mono" style={{ fontSize: 10, color: 'var(--clay)', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  → Ouvrir Supabase Auth ↗
                </a>
              </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {users.map(u => {
                const stats = userStats(u.id);
                return (
                  <div key={u.id} style={{ background: 'rgba(250,246,241,0.04)', border: '1px solid rgba(250,246,241,0.1)', borderRadius: 14, padding: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name || '—'}</div>
                    <div className="mono" style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>{u.email}</div>
                    <div className="mono" style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>
                      Inscrit le {fmtDate(u.created_at)}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontSize: 11 }}>
                        <span style={{ opacity: 0.5 }}>Commandes :</span> <strong>{stats.count}</strong>
                      </span>
                      <span className="mono" style={{ fontSize: 11 }}>
                        <span style={{ opacity: 0.5 }}>Total :</span> <strong style={{ color: 'var(--clay)' }}>{stats.total} MAD</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )
        )}

      </div>
    </div>
  );
};

// ======== AUTH MODAL ========
const AuthYoung = ({ lang, onClose, onSuccess }) => {
  const [mode, setMode] = u2S('login'); // login | signup | otp | reset
  const [email, setEmail] = u2S('');
  const [pwd, setPwd] = u2S('');
  const [name, setName] = u2S('');
  const [otp, setOtp] = u2S('');
  const [busy, setBusy] = u2S(false);
  const [err, setErr] = u2S('');
  const [info, setInfo] = u2S('');

  const submit = async () => {
    setErr(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'signup') {
        if (pwd.length < 6) throw new Error(lang === 'fr' ? '6 caractères minimum' : '6 أحرف على الأقل');
        const { data, error } = await window._sb.auth.signUp({
          email, password: pwd,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        // Si email confirmation activée → passer à l'étape OTP
        if (data.user && !data.session) {
          setMode('otp');
          setInfo(lang === 'fr' ? '✉ Code à 8 chiffres envoyé par email' : '✉ تم إرسال رمز من 8 أرقام للإيميل');
        } else if (data.user && data.session) {
          // Pas de confirmation requise → connecté direct
          onSuccess(data.user);
        }
      } else if (mode === 'login') {
        const { data, error } = await window._sb.auth.signInWithPassword({ email, password: pwd });
        if (error) {
          if (error.message.toLowerCase().includes('not confirmed') || error.message.toLowerCase().includes('email')) {
            await window._sb.auth.resend({ type: 'signup', email });
            setMode('otp');
            setInfo(lang === 'fr' ? '⚠ Compte non confirmé. Code renvoyé par email.' : '⚠ الحساب غير مؤكد. تم إرسال رمز جديد.');
          } else throw error;
        } else if (data.user) {
          onSuccess(data.user);
        }
      } else if (mode === 'otp') {
        const { data, error } = await window._sb.auth.verifyOtp({ email, token: otp.trim(), type: 'signup' });
        if (error) throw error;
        if (data.user) onSuccess(data.user);
      } else if (mode === 'reset') {
        const { error } = await window._sb.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setInfo(lang === 'fr' ? '✓ Lien de réinitialisation envoyé.' : '✓ تم إرسال رابط إعادة التعيين.');
      }
    } catch (e) { setErr(e.message || 'Erreur'); }
    setBusy(false);
  };

  const resendCode = async () => {
    setErr(''); setBusy(true);
    const { error } = await window._sb.auth.resend({ type: 'signup', email });
    if (error) setErr(error.message);
    else setInfo(lang === 'fr' ? '✓ Code renvoyé !' : '✓ تم إعادة الإرسال!');
    setBusy(false);
  };

  const titles = {
    login:  { fr: 'Connexion',           ar: 'تسجيل الدخول' },
    signup: { fr: 'Créer un compte',     ar: 'إنشاء حساب' },
    otp:    { fr: 'Confirmation',        ar: 'تأكيد' },
    reset:  { fr: 'Mot de passe oublié', ar: 'نسيت كلمة السر' },
  };
  const subtitles = {
    login:  { fr: 'Retrouve tes favoris',         ar: 'استرجعي مفضلاتك' },
    signup: { fr: 'Sauvegarde tes favoris',       ar: 'احفظي مفضلاتك' },
    otp:    { fr: 'Entre le code reçu par email', ar: 'أدخلي الرمز من الإيميل' },
    reset:  { fr: 'On t\'envoie un lien',         ar: 'سنرسل لك رابطًا' },
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,13,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--paper)', padding: 32, borderRadius: 20, width: '100%', maxWidth: 380, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'var(--paper-2)' }}>
          <Ic n="close" s={14} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Logo2 size={40} />
        </div>
        <h2 className="display" style={{ fontSize: 24, textAlign: 'center', marginBottom: 6 }}>{titles[mode][lang]}</h2>
        <p className="mono" style={{ fontSize: 11, opacity: 0.5, textAlign: 'center', marginBottom: 20 }}>{subtitles[mode][lang]}</p>

        {/* SIGNUP */}
        {mode === 'signup' && (
          <>
            <input className="input2" placeholder={lang === 'fr' ? 'Nom complet' : 'الاسم الكامل'} value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="input2" type="email" placeholder={lang === 'fr' ? 'E-mail' : 'البريد الإلكتروني'} value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="input2" type="password" placeholder={lang === 'fr' ? 'Mot de passe (6+ caractères)' : 'كلمة السر (6+ أحرف)'} value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={{ marginBottom: 10 }} />
          </>
        )}

        {/* LOGIN */}
        {mode === 'login' && (
          <>
            <input className="input2" type="email" placeholder={lang === 'fr' ? 'E-mail' : 'البريد الإلكتروني'} value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="input2" type="password" placeholder={lang === 'fr' ? 'Mot de passe' : 'كلمة السر'} value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={{ marginBottom: 6 }} />
            <p style={{ textAlign: 'right', fontSize: 12, marginBottom: 10 }}>
              <a onClick={() => { setMode('reset'); setErr(''); setInfo(''); }} style={{ opacity: 0.6, cursor: 'pointer', borderBottom: '1px solid currentColor' }}>
                {lang === 'fr' ? 'Mot de passe oublié ?' : 'نسيت كلمة السر؟'}
              </a>
            </p>
          </>
        )}

        {/* OTP */}
        {mode === 'otp' && (
          <>
            <p style={{ fontSize: 13, opacity: 0.7, textAlign: 'center', marginBottom: 14 }}>
              {lang === 'fr' ? 'Email envoyé à ' : 'تم الإرسال إلى '}<strong>{email}</strong>
            </p>
            <input
              className="input2"
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="••••••••"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ marginBottom: 10, textAlign: 'center', fontSize: 22, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '8px' }}
            />
            <p style={{ textAlign: 'center', fontSize: 12, marginBottom: 10 }}>
              <a onClick={resendCode} style={{ opacity: 0.6, cursor: 'pointer', borderBottom: '1px solid currentColor' }}>
                {lang === 'fr' ? 'Renvoyer le code' : 'إعادة إرسال الرمز'}
              </a>
            </p>
          </>
        )}

        {/* RESET */}
        {mode === 'reset' && (
          <input className="input2" type="email" placeholder={lang === 'fr' ? 'E-mail' : 'البريد الإلكتروني'} value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 10 }} />
        )}

        {info && <p style={{ color: 'green', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{info}</p>}
        {err && <p style={{ color: 'var(--clay)', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{err}</p>}

        <button className="btn2 btn2-dark" style={{ width: '100%', opacity: busy ? 0.5 : 1 }} disabled={busy} onClick={submit}>
          {busy ? '...' : (
            mode === 'login'  ? (lang === 'fr' ? 'Se connecter →' : 'دخول ←') :
            mode === 'signup' ? (lang === 'fr' ? 'Créer le compte →' : 'إنشاء ←') :
            mode === 'otp'    ? (lang === 'fr' ? 'Confirmer →' : 'تأكيد ←') :
                                (lang === 'fr' ? 'Envoyer le lien →' : 'إرسال الرابط ←')
          )}
        </button>

        {/* Switch links */}
        {mode === 'login' && (
          <p style={{ textAlign: 'center', fontSize: 13, marginTop: 16, opacity: 0.7 }}>
            {lang === 'fr' ? 'Pas de compte ? ' : 'ما عندكش حساب؟ '}
            <a onClick={() => { setMode('signup'); setErr(''); setInfo(''); }} style={{ borderBottom: '1px solid currentColor', cursor: 'pointer' }}>
              {lang === 'fr' ? "S'inscrire" : 'سجلي'}
            </a>
          </p>
        )}
        {mode === 'signup' && (
          <p style={{ textAlign: 'center', fontSize: 13, marginTop: 16, opacity: 0.7 }}>
            {lang === 'fr' ? 'Déjà inscrite ? ' : 'عندك حساب؟ '}
            <a onClick={() => { setMode('login'); setErr(''); setInfo(''); }} style={{ borderBottom: '1px solid currentColor', cursor: 'pointer' }}>
              {lang === 'fr' ? 'Connexion' : 'دخول'}
            </a>
          </p>
        )}
        {(mode === 'otp' || mode === 'reset') && (
          <p style={{ textAlign: 'center', fontSize: 13, marginTop: 16, opacity: 0.7 }}>
            <a onClick={() => { setMode('login'); setErr(''); setInfo(''); setOtp(''); }} style={{ borderBottom: '1px solid currentColor', cursor: 'pointer' }}>
              ← {lang === 'fr' ? 'Retour à la connexion' : 'الرجوع لتسجيل الدخول'}
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

// ======== ACCOUNT PAGE ========
const AccountYoung = ({ lang, user, onLogout, wishlist, onProduct }) => {
  const fav = WC_PRODUCTS.filter(p => wishlist.includes(p.id));
  const meta = user.user_metadata || {};
  const [tab, setTab] = u2S(() => {
    const t = window.__accountTab;
    if (t) { delete window.__accountTab; return t; }
    return 'profile';
  });
  const [name, setName] = u2S(meta.full_name || '');
  const [pwd, setPwd] = u2S('');
  const [pwd2, setPwd2] = u2S('');
  const [currentPwdName, setCurrentPwdName] = u2S('');
  const [currentPwdPwd, setCurrentPwdPwd] = u2S('');
  const [msg, setMsg] = u2S('');
  const [busy, setBusy] = u2S(false);
  const [orders, setOrders] = u2S([]);

  u2E(() => {
    if (tab === 'orders') {
      window._sb.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => setOrders(data || []));
    }
  }, [tab]);

  u2E(() => {
    const handler = () => {
      const t = window.__accountTab;
      if (t) { setTab(t); setMsg(''); delete window.__accountTab; }
    };
    window.addEventListener('account:gotab', handler);
    return () => window.removeEventListener('account:gotab', handler);
  }, []);

  u2E(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  const verifyPwd = async (currentPwd) => {
    const { error } = await window._sb.auth.signInWithPassword({ email: user.email, password: currentPwd });
    return !error;
  };

  const saveName = async () => {
    setMsg('');
    if (!currentPwdName) return setMsg(lang === 'fr' ? '⚠ Confirme ton mot de passe actuel' : '⚠ أكدي كلمة السر الحالية');
    setBusy(true);
    const ok = await verifyPwd(currentPwdName);
    if (!ok) { setBusy(false); return setMsg(lang === 'fr' ? '⚠ Mot de passe incorrect' : '⚠ كلمة السر غير صحيحة'); }
    const { error } = await window._sb.auth.updateUser({ data: { full_name: name } });
    setCurrentPwdName('');
    setBusy(false);
    if (error) { setMsg('⚠ ' + error.message); return; }
    setMsg(lang === 'fr' ? '✓ Nom mis à jour. Reconnexion...' : '✓ تم حفظ الاسم. إعادة الدخول...');
    setTimeout(() => { onLogout(); }, 1800);
  };

  const savePwd = async () => {
    setMsg('');
    if (!currentPwdPwd) return setMsg(lang === 'fr' ? '⚠ Confirme ton mot de passe actuel' : '⚠ أكدي كلمة السر الحالية');
    if (pwd.length < 6) return setMsg(lang === 'fr' ? '⚠ 6 caractères minimum' : '⚠ 6 أحرف على الأقل');
    if (pwd !== pwd2) return setMsg(lang === 'fr' ? '⚠ Les mots de passe ne correspondent pas' : '⚠ كلمتا السر مختلفتان');
    setBusy(true);
    const ok = await verifyPwd(currentPwdPwd);
    if (!ok) { setBusy(false); return setMsg(lang === 'fr' ? '⚠ Mot de passe actuel incorrect' : '⚠ كلمة السر الحالية غير صحيحة'); }
    const { error } = await window._sb.auth.updateUser({ password: pwd });
    setPwd(''); setPwd2(''); setCurrentPwdPwd('');
    setBusy(false);
    if (error) { setMsg('⚠ ' + error.message); return; }
    setMsg(lang === 'fr' ? '✓ Mot de passe modifié. Reconnexion...' : '✓ تم تغيير كلمة السر. إعادة الدخول...');
    setTimeout(() => { onLogout(); }, 1800);
  };

  const tabs = [
    { id: 'profile',  label: lang === 'fr' ? 'Profil'    : 'الملف الشخصي' },
    { id: 'orders',   label: lang === 'fr' ? 'Commandes' : 'طلباتي' },
    { id: 'wishlist', label: lang === 'fr' ? 'Favoris'   : 'مفضلاتي', count: fav.length },
  ];

  const fmt = (iso) => new Date(iso).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const isOk = msg.startsWith('✓');

  return (
    <div className="page2" style={{ padding: '40px 0 80px' }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
      {msg && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', zIndex: 300,
          transform: 'translateX(-50%)',
          background: isOk ? '#2E7D32' : 'var(--clay)',
          color: '#fff', padding: '12px 22px', borderRadius: 999,
          fontSize: 14, fontWeight: 500,
          boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
          animation: 'toastIn .25s ease',
          maxWidth: 'calc(100vw - 32px)', textAlign: 'center',
        }}>{msg}</div>
      )}
      <div className="wrap" style={{ maxWidth: 900 }}>
        <div style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>/ {lang === 'fr' ? 'mon compte' : 'حسابي'} /</span>
            <h1 className="display" style={{ fontSize: 'clamp(36px, 6vw, 56px)', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {lang === 'fr' ? 'Bonjour' : 'مرحبا'}, <em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>{meta.full_name || user.email.split('@')[0]}</em>
            </h1>
            <p className="mono" style={{ fontSize: 12, opacity: 0.5, marginTop: 6 }}>{user.email}</p>
          </div>
          <button className="btn2 btn2-outline" onClick={onLogout}>
            {lang === 'fr' ? '↗ Déconnexion' : '↗ خروج'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => { setTab(tb.id); setMsg(''); }} style={{
              padding: '10px 18px', borderBottom: tab === tb.id ? '2px solid var(--ink)' : '2px solid transparent',
              fontWeight: tab === tb.id ? 600 : 400, fontSize: 14, marginBottom: -1,
              color: tab === tb.id ? 'var(--ink)' : 'var(--muted)',
            }}>
              {tb.label} {tb.count !== undefined && <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>({tb.count})</span>}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div style={{ maxWidth: 480 }}>
            <div style={{ background: 'var(--paper-2)', padding: 24, borderRadius: 16, marginBottom: 16 }}>
              <h3 className="display" style={{ fontSize: 20, marginBottom: 14 }}>{lang === 'fr' ? 'Informations' : 'المعلومات'}</h3>
              <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{lang === 'fr' ? 'Nom complet' : 'الاسم الكامل'}</label>
              <input className="input2" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 4, marginBottom: 12 }} />
              <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>E-mail</label>
              <input className="input2" value={user.email} disabled style={{ marginTop: 4, marginBottom: 12, opacity: 0.6 }} />
              <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{lang === 'fr' ? 'Mot de passe actuel' : 'كلمة السر الحالية'}</label>
              <input className="input2" type="password" value={currentPwdName} onChange={e => setCurrentPwdName(e.target.value)} placeholder={lang === 'fr' ? 'Pour confirmer' : 'للتأكيد'} style={{ marginTop: 4, marginBottom: 12 }} />
              <button className="btn2 btn2-dark" onClick={saveName} disabled={busy} style={{ opacity: busy ? 0.5 : 1 }}>
                {lang === 'fr' ? 'Enregistrer' : 'حفظ'}
              </button>
            </div>

            <div style={{ background: 'var(--paper-2)', padding: 24, borderRadius: 16 }}>
              <h3 className="display" style={{ fontSize: 20, marginBottom: 14 }}>{lang === 'fr' ? 'Mot de passe' : 'كلمة السر'}</h3>
              <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{lang === 'fr' ? 'Mot de passe actuel' : 'كلمة السر الحالية'}</label>
              <input className="input2" type="password" value={currentPwdPwd} onChange={e => setCurrentPwdPwd(e.target.value)} style={{ marginTop: 4, marginBottom: 12 }} />
              <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{lang === 'fr' ? 'Nouveau mot de passe' : 'كلمة السر الجديدة'}</label>
              <input className="input2" type="password" value={pwd} onChange={e => setPwd(e.target.value)} style={{ marginTop: 4, marginBottom: 12 }} />
              <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{lang === 'fr' ? 'Confirmer' : 'تأكيد'}</label>
              <input className="input2" type="password" value={pwd2} onChange={e => setPwd2(e.target.value)} style={{ marginTop: 4, marginBottom: 12 }} />
              <button className="btn2 btn2-dark" onClick={savePwd} disabled={busy} style={{ opacity: busy ? 0.5 : 1 }}>
                {lang === 'fr' ? 'Modifier' : 'تغيير'}
              </button>
            </div>

          </div>
        )}

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: 'var(--paper-2)', borderRadius: 16 }}>
                <div style={{ fontSize: 40 }}>📦</div>
                <p style={{ marginTop: 10, opacity: 0.6 }}>
                  {lang === 'fr' ? 'Aucune commande pour le moment.' : 'مكاين حتى طلب.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.map(o => (
                  <div key={o.id} style={{ background: 'var(--paper-2)', padding: 18, borderRadius: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--clay)' }}>{o.order_number}</span>
                        <span className="mono" style={{ fontSize: 11, opacity: 0.5, marginLeft: 10 }}>{fmt(o.created_at)}</span>
                      </div>
                      <span className="mono" style={{ fontSize: 10, padding: '4px 10px', borderRadius: 999, background: 'var(--ink)', color: 'var(--paper)', textTransform: 'uppercase' }}>{o.status}</span>
                    </div>
                    {(o.items || []).map((it, i) => (
                      <div key={i} className="mono" style={{ fontSize: 12, opacity: 0.7 }}>
                        • {it.name} × {it.qty} — {it.size}
                      </div>
                    ))}
                    <div style={{ marginTop: 8, fontWeight: 700 }}>{o.total} MAD</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WISHLIST TAB */}
        {tab === 'wishlist' && (
          fav.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: 'var(--paper-2)', borderRadius: 16 }}>
              <div style={{ fontSize: 40 }}>🤍</div>
              <p style={{ marginTop: 10, opacity: 0.6 }}>
                {lang === 'fr' ? 'Aucun favori pour le moment.' : 'مكاين والو فالمفضلات.'}
              </p>
            </div>
          ) : (
            <div className="g4">
              {fav.map((p, i) => (
                <PCard key={p.id} product={p} lang={lang} onClick={onProduct} onWish={() => {}} wished={true} tint={TINTS[i % TINTS.length]} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

// ======== RECOVERY MODAL (set new password from email link) ========
const RecoveryYoung = ({ lang, onClose }) => {
  const [pwd, setPwd] = u2S('');
  const [pwd2, setPwd2] = u2S('');
  const [busy, setBusy] = u2S(false);
  const [msg, setMsg] = u2S('');
  const [done, setDone] = u2S(false);

  const submit = async () => {
    setMsg('');
    if (pwd.length < 6) return setMsg(lang === 'fr' ? '⚠ 6 caractères minimum' : '⚠ 6 أحرف على الأقل');
    if (pwd !== pwd2) return setMsg(lang === 'fr' ? '⚠ Les mots de passe ne correspondent pas' : '⚠ كلمتا السر مختلفتان');
    setBusy(true);
    const { error } = await window._sb.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) { setMsg('⚠ ' + error.message); return; }
    setDone(true);
    setTimeout(() => { onClose(); }, 1800);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,13,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--paper)', padding: 32, borderRadius: 20, width: '100%', maxWidth: 400, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Logo2 size={40} />
        </div>
        <h2 className="display" style={{ fontSize: 24, textAlign: 'center', marginBottom: 6 }}>
          {lang === 'fr' ? 'Nouveau mot de passe' : 'كلمة سر جديدة'}
        </h2>
        <p className="mono" style={{ fontSize: 11, opacity: 0.5, textAlign: 'center', marginBottom: 20 }}>
          {lang === 'fr' ? 'Choisis un nouveau mot de passe' : 'اختاري كلمة سر جديدة'}
        </p>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>✓</div>
            <p style={{ color: '#2E7D32', fontWeight: 600 }}>
              {lang === 'fr' ? 'Mot de passe modifié !' : 'تم تغيير كلمة السر!'}
            </p>
          </div>
        ) : (
          <>
            <input className="input2" type="password"
              placeholder={lang === 'fr' ? 'Nouveau mot de passe (6+)' : 'كلمة السر الجديدة (6+)'}
              value={pwd} onChange={e => setPwd(e.target.value)}
              style={{ marginBottom: 10 }} />
            <input className="input2" type="password"
              placeholder={lang === 'fr' ? 'Confirmer' : 'التأكيد'}
              value={pwd2} onChange={e => setPwd2(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ marginBottom: 14 }} />
            {msg && <p className="mono" style={{ fontSize: 12, color: 'var(--clay)', marginBottom: 10 }}>{msg}</p>}
            <button className="btn2 btn2-dark" onClick={submit} disabled={busy} style={{ width: '100%', opacity: busy ? 0.5 : 1 }}>
              {busy
                ? (lang === 'fr' ? '...' : '...')
                : (lang === 'fr' ? 'Modifier →' : 'تغيير →')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { HomeYoung, ShopYoung, PDetailYoung, CartYoung, CheckoutYoung, CaftanYoung, PrayerYoung, AboutYoung, LookbookYoung, AdminYoung, AuthYoung, AccountYoung, RecoveryYoung });
