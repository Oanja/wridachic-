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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--ink)', paddingBottom: 16, marginBottom: 28 }}>
          <div>
            <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>/ {lang === 'fr' ? 'boutique' : 'المتجر'} /</span>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 7vw, 72px)', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {lang === 'fr' ? 'La boutique.' : 'المتجر.'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 12, opacity: 0.5 }}>{filtered.length} {lang === 'fr' ? 'articles' : 'قطعة'}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '8px 14px', border: '1.5px solid var(--ink)', borderRadius: 999, background: 'var(--paper)', fontFamily: 'inherit', fontSize: 13 }}>
              <option value="featured">{lang === 'fr' ? 'Sélection' : 'مميز'}</option>
              <option value="price-asc">{lang === 'fr' ? 'Prix croissant' : 'السعر ↗'}</option>
              <option value="price-desc">{lang === 'fr' ? 'Prix décroissant' : 'السعر ↘'}</option>
            </select>
          </div>
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
const PDetailYoung = ({ lang, product, onBack, onAddToCart, onProduct, wishlist, toggleWish }) => {
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
            <a className="btn2 btn2-wa" href="https://wa.me/212600000000" target="_blank" style={{ width: '100%', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ic n="wa" s={16} /> {t.product.buyWa}
            </a>

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
const CheckoutYoung = ({ lang, cart, onSuccess }) => {
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
      await window._sb.from('orders').insert({
        order_number: num, status: 'nouveau',
        full_name: form.fullName, phone: form.phone, email: form.email,
        address: form.address, city: form.city, payment,
        subtotal, delivery, total, items: itemsData, lang,
      });
    } catch(e) { console.error('Supabase:', e); }
    const itemsText = itemsData.map(it => `• ${it.name} × ${it.qty} — ${it.size} — ${it.color}`).join('\n');
    const msg = `🛍️ *طلب جديد — wridachic*\n━━━━━━━━━━━━━━━━━━━━\n👤 *الاسم:* ${form.fullName}\n📱 *الهاتف:* ${form.phone}\n📧 *الإيميل:* ${form.email}\n📍 *العنوان:* ${form.address}، ${form.city}\n\n🛒 *المنتجات:*\n${itemsText}\n\n💰 *المجموع:* ${subtotal} MAD\n🚚 *التوصيل:* ${delivery === 0 ? 'مجاني ✓' : delivery + ' MAD'}\n💳 *الإجمالي:* ${total} MAD\n💳 *الدفع:* ${payment === 'cod' ? 'عند الاستلام' : 'بطاقة بنكية'}\n\n📋 *رقم الطلب:* ${num}`;
    window.open(`https://wa.me/212772086545?text=${encodeURIComponent(msg)}`, '_blank');
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

        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, flexWrap: 'wrap' }}>
          {[t.checkout.shipping, t.checkout.payment, t.checkout.review].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: step > i ? 'var(--ink)' : step === i + 1 ? 'var(--clay)' : 'var(--muted)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step > i ? 'var(--ink)' : 'transparent', color: step > i ? 'var(--paper)' : 'inherit' }}>
                {step > i ? <Ic n="check" s={10} /> : `0${i + 1}`}
              </div>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s}</span>
              {i < 2 && <span style={{ width: 20, height: 1, background: 'currentColor', opacity: 0.25 }} />}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40 }}>
          <div>
            {step === 1 && (
              <div>
                <h2 className="display" style={{ fontSize: 30, marginBottom: 20 }}>{t.checkout.shipping}</h2>
                <div style={{ display: 'grid', gap: 12 }}>
                  {['fullName','phone','email','address'].map(f => (
                    <div key={f}>
                      <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{t.checkout[f]}</label>
                      <input className="input2" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} style={{ marginTop: 4 }} type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'} />
                    </div>
                  ))}
                  <div>
                    <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{t.checkout.city}</label>
                    <select className="input2" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ marginTop: 4 }}>
                      {['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir','Meknès','Oujda'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <button className="btn2 btn2-dark btn2-lg" style={{ marginTop: 24 }} onClick={() => setStep(2)}>{lang === 'fr' ? 'Continuer' : 'متابعة'} →</button>
              </div>
            )}
            {step === 2 && (
              <div>
                <h2 className="display" style={{ fontSize: 30, marginBottom: 20 }}>{t.checkout.payment}</h2>
                {[
                  { id: 'cod', t: t.checkout.cod, d: t.checkout.codDesc, ic: 'truck', tag: lang === 'fr' ? 'populaire' : 'الأكثر استخداماً' },
                  { id: 'cib', t: t.checkout.cib, d: t.checkout.cibDesc, ic: 'shield' },
                ].map(p => (
                  <label key={p.id} style={{ display: 'flex', gap: 14, padding: 20, border: `1.5px solid ${payment === p.id ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 14, marginBottom: 10, cursor: 'pointer', background: payment === p.id ? 'var(--paper-2)' : 'transparent' }}>
                    <input type="radio" checked={payment === p.id} onChange={() => setPayment(p.id)} style={{ accentColor: 'var(--ink)', marginTop: 2 }} />
                    <Ic n={p.ic} s={22} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{p.t}</span>
                        {p.tag && <span className="sticker" style={{ padding: '2px 8px', fontSize: 9 }}>{p.tag}</span>}
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.55, marginTop: 4 }}>{p.d}</div>
                    </div>
                  </label>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn2 btn2-outline" onClick={() => setStep(1)}>← {lang === 'fr' ? 'Retour' : 'رجوع'}</button>
                  <button className="btn2 btn2-dark btn2-lg" onClick={() => setStep(3)}>{lang === 'fr' ? 'Continuer' : 'متابعة'} →</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div>
                <h2 className="display" style={{ fontSize: 30, marginBottom: 20 }}>{t.checkout.review}</h2>
                {[
                  { label: t.checkout.shipping, content: <><div>{form.fullName || '—'}</div><div style={{ opacity: 0.6, fontSize: 13 }}>{form.address || '—'}, {form.city} · {form.phone || '—'}</div></> },
                  { label: t.checkout.payment, content: <div>{payment === 'cod' ? t.checkout.cod : t.checkout.cib}</div> },
                ].map(({ label, content }) => (
                  <div key={label} style={{ background: 'var(--paper-2)', padding: 18, borderRadius: 14, marginBottom: 10 }}>
                    <div className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                    {content}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn2 btn2-outline" onClick={() => setStep(2)}>← {lang === 'fr' ? 'Retour' : 'رجوع'}</button>
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
  const [loading, setLoading] = u2S(false);
  const [error, setError] = u2S('');

  const login = () => {
    if (pwd === ADMIN_PASS) { setAuthed(true); fetchOrders(); }
    else setError('Mot de passe incorrect');
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await window._sb.from('orders').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    await window._sb.from('orders').update({ status }).eq('id', id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const fmt = (iso) => new Date(iso).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)' }}>
      <div style={{ background: 'var(--paper)', padding: 40, borderRadius: 20, width: 320, textAlign: 'center' }}>
        <Logo2 size={48} />
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
    <div style={{ minHeight: '100vh', background: '#0F0E0D', color: '#FAF6F1', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Logo2 size={36} invert />
            <div>
              <div className="display" style={{ fontSize: 22 }}>Tableau de bord</div>
              <div className="mono" style={{ fontSize: 10, opacity: 0.4 }}>{orders.length} COMMANDES</div>
            </div>
          </div>
          <button onClick={fetchOrders} className="btn2 btn2-outline" style={{ fontSize: 12, color: '#FAF6F1', borderColor: 'rgba(250,246,241,0.3)' }}>
            ↻ Actualiser
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {STATUS_LABELS.map(s => {
            const count = orders.filter(o => o.status === s).length;
            const total = orders.filter(o => o.status === s).reduce((acc, o) => acc + (o.total || 0), 0);
            return (
              <div key={s} style={{ background: 'rgba(250,246,241,0.05)', borderRadius: 16, padding: 20, borderLeft: `3px solid ${STATUS_COLORS[s]}` }}>
                <div className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s}</div>
                <div className="display" style={{ fontSize: 32, marginTop: 4 }}>{count}</div>
                <div className="mono" style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>{total} MAD</div>
              </div>
            );
          })}
        </div>

        {/* Orders Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }} className="mono">Chargement...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }} className="mono">Aucune commande pour l'instant.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map(o => (
              <div key={o.id} style={{ background: 'rgba(250,246,241,0.04)', border: '1px solid rgba(250,246,241,0.1)', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr auto', gap: 20, alignItems: 'start' }}>
                  {/* Order # + date */}
                  <div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--clay)' }}>{o.order_number}</div>
                    <div className="mono" style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>{fmt(o.created_at)}</div>
                  </div>
                  {/* Customer */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{o.full_name}</div>
                    <div className="mono" style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>{o.phone}</div>
                    <div className="mono" style={{ fontSize: 11, opacity: 0.4 }}>{o.email}</div>
                    <div className="mono" style={{ fontSize: 11, opacity: 0.4 }}>{o.address}, {o.city}</div>
                  </div>
                  {/* Items + total */}
                  <div>
                    {(o.items || []).map((it, i) => (
                      <div key={i} className="mono" style={{ fontSize: 11, opacity: 0.7, marginBottom: 3 }}>
                        {it.name} × {it.qty} — {it.size}
                        <span style={{ display: 'inline-block', width: 10, height: 10, background: it.color, borderRadius: '50%', verticalAlign: 'middle', marginLeft: 6, border: '1px solid rgba(250,246,241,0.3)' }} />
                      </div>
                    ))}
                    <div style={{ marginTop: 8, fontWeight: 700 }}>{o.total} MAD
                      <span className="mono" style={{ fontSize: 10, opacity: 0.45, marginLeft: 8 }}>{o.payment === 'cod' ? 'COD' : 'CIB'}</span>
                    </div>
                  </div>
                  {/* Status */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {STATUS_LABELS.map(s => (
                      <button key={s} onClick={() => updateStatus(o.id, s)} className="mono" style={{
                        padding: '5px 12px', borderRadius: 999, fontSize: 10, cursor: 'pointer',
                        background: o.status === s ? STATUS_COLORS[s] : 'transparent',
                        color: o.status === s ? '#fff' : 'rgba(250,246,241,0.4)',
                        border: `1px solid ${o.status === s ? STATUS_COLORS[s] : 'rgba(250,246,241,0.15)'}`,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { HomeYoung, ShopYoung, PDetailYoung, CartYoung, CheckoutYoung, CaftanYoung, PrayerYoung, AboutYoung, LookbookYoung, AdminYoung });
