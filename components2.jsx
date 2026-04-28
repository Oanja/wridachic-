// Young/modern components for wridachic
const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;

/* Logo — invert=true makes it white (for dark backgrounds).
   variant: 'full' (default, footer) | 'menu' (compact mark for nav). */
const LOGO_SRC = {
  full: 'assets/wridachicNlogo.svg',
  menu: 'assets/wridachicNlogo 2.svg',
};
const Logo2 = ({ size = 38, invert = false, variant = 'full' }) => (
  <img
    src={LOGO_SRC[variant] || LOGO_SRC.full}
    alt="wridachic"
    style={{
      height: size,
      width: 'auto',
      maxWidth: '100%',
      objectFit: 'contain',
      filter: invert ? 'invert(1)' : 'none',
      mixBlendMode: invert ? 'normal' : 'multiply',
      display: 'block',
    }}
  />
);

const Ic = ({ n, s = 18 }) => {
  const p = {
    search:  'M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z',
    user:    'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
    heart:   'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    bag:     'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 11-8 0',
    close:   'M18 6L6 18M6 6l12 12',
    arr:     'M5 12h14M12 5l7 7-7 7',
    down:    'M6 9l6 6 6-6',
    check:   'M20 6L9 17l-5-5',
    plus:    'M12 5v14M5 12h14',
    minus:   'M5 12h14',
    star:    'M12 2l3 6.3L22 9l-5 5 1 7-6-3.3L6 21l1-7-5-5 7-.7z',
    truck:   'M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    shield:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    refresh: 'M23 4v6h-6 M1 20v-6h6 M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15',
    sparkle: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2',
    menu:    'M3 12h18M3 6h18M3 18h18',
    wa: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
  };
  if (n === 'wa') return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d={p[n]} /></svg>;
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={p[n]} /></svg>;
};

const Marquee = ({ items }) => {
  return (
    <div className="marquee">
      <div className="marquee-track">
        {[0, 1].map((k) => (
          <div key={k} className="marquee-half">
            {items.map((m, i) => <span key={i}>{m}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
};

const Nav2 = ({ lang, setLang, cartCount, onNav, current, user, onAuth, onLogout }) => {
  const t = WC_TR[lang];
  const [menuOpen, setMenuOpen] = uS(false);
  const [userOpen, setUserOpen] = uS(false);
  const userRef = React.useRef(null);
  React.useEffect(() => {
    if (!userOpen) return;
    const onDoc = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [userOpen]);
  const items = [
    { id: 'shop',     label: t.nav.shop },
    { id: 'prayer',   label: t.nav.prayer },
    { id: 'new',      label: t.nav.new },
    // { id: 'lookbook', label: t.nav.lookbook }, // hidden until lookbook is ready — re-enable here when bringing it back
    { id: 'about',    label: t.nav.about },
  ];
  return (
    <>
      <Marquee items={t.announce} />
      <nav className="nav2">
        <div className="nav2-inner">
          <div className="nav2-logo" onClick={() => { onNav('home'); setMenuOpen(false); }}>
            <Logo2 size={72} variant="menu" />
          </div>

          {/* Desktop links */}
          <div className="nav2-links">
            {items.map((it) => (
              <a key={it.id} className={current === it.id ? 'active' : ''} onClick={() => onNav(it.id)}>
                {it.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="nav2-actions">
            <div className="nav2-lang">
              <button className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
              <button className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>ع</button>
            </div>
            <button className="nav2-search-btn" title="Recherche"><Ic n="search" /></button>
            <div ref={userRef} style={{ position: 'relative' }}>
              <button title={user ? (lang === 'fr' ? 'Mon compte' : 'حسابي') : (lang === 'fr' ? 'Connexion' : 'دخول')} onClick={() => user ? setUserOpen(o => !o) : onAuth()} style={user ? { background: 'var(--ink)', color: 'var(--paper)' } : {}}>
                <Ic n="user" />
              </button>
              {user && userOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  left: 'auto',
                  width: 240,
                  maxWidth: 'calc(100vw - 24px)',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: 14,
                  boxShadow: '0 12px 32px rgba(15,14,13,0.12)',
                  padding: 8,
                  zIndex: 80,
                  fontFamily: 'Space Grotesk',
                  textAlign: lang === 'ar' ? 'right' : 'left',
                }}>
                  <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>
                      {user.user_metadata?.full_name || user.email.split('@')[0]}
                    </div>
                    <div className="mono" style={{ fontSize: 10, opacity: 0.5, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  </div>
                  {[
                    { id: 'account',  label: lang === 'fr' ? 'Mon profil'   : 'ملفي الشخصي',   tab: 'profile' },
                    { id: 'account',  label: lang === 'fr' ? 'Mes commandes' : 'طلباتي',       tab: 'orders' },
                    { id: 'account',  label: lang === 'fr' ? 'Mes favoris'  : 'مفضلاتي',      tab: 'wishlist' },
                  ].map((it, i) => (
                    <a key={i} onClick={() => {
                      setUserOpen(false);
                      window.__accountTab = it.tab;
                      window.dispatchEvent(new Event('account:gotab'));
                      onNav('account');
                    }}
                      style={{ display: 'block', padding: '9px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {it.label}
                    </a>
                  ))}
                  {onLogout && (
                    <a onClick={() => { setUserOpen(false); onLogout(); }}
                      style={{ display: 'block', padding: '9px 12px', borderRadius: 8, fontSize: 13, color: 'var(--clay)', cursor: 'pointer', borderTop: '1px solid var(--line)', marginTop: 4 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      ↗ {lang === 'fr' ? 'Déconnexion' : 'تسجيل خروج'}
                    </a>
                  )}
                </div>
              )}
            </div>
            <button title="Panier" onClick={() => onNav('cart')}>
              <Ic n="bag" />
              {cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
            </button>
            <button className="nav2-menu-btn" onClick={() => setMenuOpen(!menuOpen)} title="Menu">
              <Ic n={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{
            background: 'var(--paper)',
            borderTop: '1px solid var(--line)',
            padding: '8px 12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            {items.map((it) => (
              <a
                key={it.id}
                style={{
                  padding: '13px 16px',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: current === it.id ? 'var(--ink)' : 'transparent',
                  color: current === it.id ? 'var(--paper)' : 'var(--ink)',
                }}
                onClick={() => { onNav(it.id); setMenuOpen(false); }}
              >
                {it.label}
              </a>
            ))}
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
              {[{ id: 'fr', label: 'Français' }, { id: 'ar', label: 'العربية' }].map(l => (
                <button key={l.id} onClick={() => setLang(l.id)} style={{
                  flex: 1, padding: '10px', border: `1.5px solid var(--ink)`, borderRadius: 999,
                  background: lang === l.id ? 'var(--ink)' : 'transparent',
                  color: lang === l.id ? 'var(--paper)' : 'var(--ink)', fontSize: 13, cursor: 'pointer',
                }}>{l.label}</button>
              ))}
            </div>
          </div>
        )}
      </nav>
      <style>{`
        .nav2-menu-btn { display: none !important; }
        @media (max-width: 768px) {
          .nav2-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
};

const TINTS = ['rose', 'clay', 'mint', 'lime', 'sky', 'ink'];

/* Clean color-block placeholder — images added by the user later */
const Ph2 = ({ label, tint, aspect = '3/4', rose = false }) => (
  <div
    className={`ph2 ph2-tint-${tint || 'rose'}`}
    style={{
      aspectRatio: aspect !== 'none' ? aspect : undefined,
      width: '100%',
      height: '100%',
    }}
  >
    {rose && (
      <div className="ph2-rose-mark">
        <img src="assets/wridachicNlogo.svg" alt="" />
      </div>
    )}
  </div>
);

const PCard = ({ product, lang, onClick, onWish, wished, tint }) => {
  const t = WC_TR[lang];
  const name = lang === 'ar' ? product.nameAr : product.name;
  const [hovered, setHovered] = uS(false);
  const [autoIdx, setAutoIdx] = uS(0);
  const hasTwo = product.imgFiles && product.imgFiles.length > 1;
  uE(() => {
    if (!hasTwo) return;
    const id = setInterval(() => setAutoIdx(i => (i + 1) % 2), 2800);
    return () => clearInterval(id);
  }, [hasTwo]);
  const showSecond = hasTwo && (hovered || autoIdx === 1);
  return (
    <div className="pcard" onClick={() => onClick(product)}>
      <div className="pcard-img" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {product.imgFiles ? (
          <>
            <img
              src={product.imgFiles[0]}
              alt={name}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0, transition: 'opacity 0.6s ease', opacity: showSecond ? 0 : 1 }}
            />
            {hasTwo && (
              <img
                src={product.imgFiles[1]}
                alt={name}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0, transition: 'opacity 0.6s ease', opacity: showSecond ? 1 : 0 }}
              />
            )}
          </>
        ) : (
          <Ph2 tint={tint || TINTS[parseInt(product.id.slice(1)) % TINTS.length]} rose />
        )}
        {product.tag === 'new'  && <span className="pcard-tag new">{lang === 'ar' ? 'جديد ✦' : 'Nouveau ✦'}</span>}
        {product.tag === 'sale' && <span className="pcard-tag sale">{lang === 'ar' ? `خصم −${Math.round((1 - product.price / product.oldPrice) * 100)}%` : `−${Math.round((1 - product.price / product.oldPrice) * 100)}%`}</span>}
        <button className={`pcard-wish ${wished ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); onWish(product.id); }}>
          <Ic n="heart" s={14} />
        </button>
        <div className="pcard-quick">+ {t.product.add}</div>
      </div>
      <div>
        <div className="pcard-name">{name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <div className="pcard-colors">
            {product.colors.map((c, i) => <span key={i} style={{ background: c }} />)}
          </div>
          <div className="pcard-price">
            {product.oldPrice && <span className="old">{product.oldPrice}</span>}
            {product.price} <span style={{ fontSize: 10, opacity: 0.5 }}>MAD</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Footer2 = ({ lang, onNav, onSignup }) => {
  const t = WC_TR[lang];
  const [emailInput, setEmailInput] = uS('');
  const submit = (e) => {
    e?.preventDefault();
    if (onSignup) onSignup(emailInput.trim());
  };
  return (
    <footer className="f2">
      <div className="wrap">
        <div className="f2-hero">
          <div>
            <h2>
              {lang === 'fr'
                ? <>Rejoins l'<em>univers</em>.</>
                : <>انضمي إلى <em>عالمنا</em>.</>}
            </h2>
            <p style={{ fontSize: 15, opacity: 0.75, marginTop: 16, maxWidth: '100%' }}>
              {lang === 'fr'
                ? 'Reçois nos nouveautés, lookbooks & coups de cœur chaque semaine — l\'élégance marocaine dans ta boîte mail.'
                : 'استقبلي جديدنا، اللوكبوك ومختاراتنا كل أسبوع — أناقة مغربية مباشرة في بريدك.'}
            </p>
            <form className="f2-newsletter" onSubmit={submit}>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={lang === 'fr' ? 'Ton e-mail…' : 'بريدك الإلكتروني…'}
              />
              <button type="submit">{lang === 'fr' ? "Je m'inscris →" : 'اشتركي →'}</button>
            </form>
          </div>
          <div className="f2-stickers">
            <span className="sticker">100% Maroc 🇲🇦</span>
            <span className="sticker sticker-rose" style={{ transform: 'rotate(3deg)' }}>
              {lang === 'fr' ? 'Livraison gratuite 500+ MAD' : 'توصيل مجاني 500+ درهم'}
            </span>
            <span className="sticker sticker-sky" style={{ transform: 'rotate(-1deg)' }}>
              {lang === 'fr' ? 'COD disponible ✓' : 'دفع عند الاستلام ✓'}
            </span>
          </div>
        </div>

        <div className="f2-cols">
          <div>
            <Logo2 size={150} invert />
            <p style={{ fontSize: 14, opacity: 0.65, marginTop: 16, maxWidth: 280, lineHeight: 1.7 }}>
              {t.footer.tagline}
            </p>
          </div>
          <div>
            <h4>{t.footer.shop}</h4>
            <ul>
              <li><a onClick={() => onNav('shop')}>{t.nav.shop}</a></li>
              <li><a onClick={() => onNav('prayer')}>{t.nav.prayer}</a></li>
              <li><a onClick={() => onNav('new')}>{t.nav.new}</a></li>
            </ul>
          </div>
          <div>
            <h4>{t.footer.help}</h4>
            <ul>
              <li><a>{t.footer.contact}</a></li>
              <li><a>{t.footer.faq}</a></li>
              <li><a>{t.footer.delivery}</a></li>
              <li><a>{t.footer.returns}</a></li>
              <li><a>{t.footer.sizes}</a></li>
            </ul>
          </div>
          <div>
            <h4>Follow</h4>
            <ul>
              <li><a>↗ Instagram</a></li>
              <li><a>↗ TikTok</a></li>
              <li><a>↗ Pinterest</a></li>
              <li><a>↗ WhatsApp</a></li>
            </ul>
          </div>
        </div>

        <div className="f2-bottom">
          <div>{t.footer.rights}</div>
          <div>MAD · Casablanca — partout au Maroc</div>
        </div>
      </div>
    </footer>
  );
};

const WaFloat2 = ({ lang }) => (
  <a className="wafloat2" href="https://wa.me/212772086545" target="_blank" rel="noopener noreferrer">
    <Ic n="wa" s={18} />
    <span className="wa-label">{lang === 'fr' ? 'Commander via WhatsApp' : 'اطلبي عبر واتساب'}</span>
  </a>
);

// ──── NEWSLETTER POPUP ────
// Shown to first-time visitors once they scroll 50% of the page.
// Announces the "buy 2 articles → -10% gift coupon" offer + collects email/phone for future drops.
const NewsletterPopup = ({ lang }) => {
  const [open, setOpen] = uS(false);
  const [email, setEmail] = uS('');
  const [phone, setPhone] = uS('');
  const [busy, setBusy] = uS(false);
  const [done, setDone] = uS(false);

  uE(() => {
    if (localStorage.getItem('wc2-newsletter-seen')) return;
    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled / total >= 0.5) {
        setOpen(true);
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => {
    localStorage.setItem('wc2-newsletter-seen', '1');
    setOpen(false);
  };

  const submit = async (e) => {
    e?.preventDefault();
    const e2 = email.trim(), p2 = phone.trim();
    if ((!e2 && !p2) || busy) return;
    setBusy(true);
    try {
      if (window._sb) {
        const row = {};
        if (e2) row.email = e2;
        if (p2) row.phone = p2;
        await window._sb.from('newsletter_subscribers').insert(row).then(() => {});
      }
    } catch (e) { /* fail silently */ }
    localStorage.setItem('wc2-newsletter-seen', '1');
    if (e2) localStorage.setItem('wc2-newsletter-email', e2);
    if (p2) localStorage.setItem('wc2-newsletter-phone', p2);
    setDone(true);
    setBusy(false);
    setTimeout(() => setOpen(false), 3200);
  };

  if (!open) return null;

  return React.createElement('div', {
    onClick: close,
    style: { position: 'fixed', inset: 0, background: 'rgba(15,14,13,0.6)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fIn 0.3s ease' },
  },
    React.createElement('div', {
      onClick: (e) => e.stopPropagation(),
      style: { background: 'var(--paper)', padding: 36, borderRadius: 22, width: '100%', maxWidth: 440, position: 'relative', textAlign: 'center', boxShadow: '0 30px 80px rgba(15,14,13,0.35)' },
    },
      React.createElement('button', {
        onClick: close,
        style: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'var(--paper-2)', border: 'none', cursor: 'pointer', fontSize: 14 },
      }, '✕'),
      React.createElement('div', { className: 'mono', style: { fontSize: 11, opacity: 0.55, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 } },
        lang === 'fr' ? '✦ Offre fidélité ✦' : '✦ عرض خاص ✦'
      ),
      React.createElement('h2', { className: 'display', style: { fontSize: 28, lineHeight: 1.15, marginBottom: 12, letterSpacing: '-0.02em' } },
        lang === 'fr'
          ? <>Achète <em>2 articles</em> → reçois un code <em>−10%</em></>
          : <>اشتري <em>قطعتين</em> واحصلي على كود <em>−10%</em></>
      ),
      React.createElement('p', { style: { fontSize: 14, opacity: 0.7, marginBottom: 20, lineHeight: 1.55 } },
        lang === 'fr'
          ? "Le code cadeau s'affiche à la fin de ta commande. Laisse ton e-mail ou ton numéro pour recevoir nos prochaines offres."
          : 'كود الهدية كيبان فآخر طلبك. خلي إيميلك أو رقمك باش توصلوك العروض الجاية.'
      ),
      done
        ? React.createElement('div', { style: { padding: '18px 0', color: 'var(--clay)', fontSize: 14, fontWeight: 500, lineHeight: 1.6 } },
            lang === 'fr' ? '✓ Merci ! Tu es dans la liste.' : '✓ شكراً! دخلتي اللائحة.'
          )
        : React.createElement('form', { onSubmit: submit },
            React.createElement('input', {
              className: 'input2',
              type: 'email',
              placeholder: lang === 'fr' ? 'Ton e-mail (optionnel)' : 'بريدك الإلكتروني (اختياري)',
              value: email,
              onChange: (e) => setEmail(e.target.value),
              style: { marginBottom: 8, textAlign: 'center' },
            }),
            React.createElement('input', {
              className: 'input2',
              type: 'tel',
              placeholder: lang === 'fr' ? 'Ton numéro (optionnel)' : 'رقم هاتفك (اختياري)',
              value: phone,
              onChange: (e) => setPhone(e.target.value),
              style: { marginBottom: 12, textAlign: 'center' },
            }),
            React.createElement('button', {
              type: 'submit', className: 'btn2 btn2-dark',
              disabled: busy || (!email.trim() && !phone.trim()),
              style: { width: '100%', opacity: busy ? 0.5 : 1 },
            }, busy ? '…' : (lang === 'fr' ? "Je m'inscris →" : 'سجلي ←'))
          ),
      React.createElement('p', { className: 'mono', style: { fontSize: 10, opacity: 0.5, marginTop: 14, textTransform: 'uppercase', letterSpacing: '0.08em' } },
        lang === 'fr' ? 'Pas de spam. Désinscription en 1 clic.' : 'بدون سبام. إلغاء الاشتراك بضغطة.'
      )
    )
  );
};

Object.assign(window, { Logo2, Ic, Marquee, Nav2, Ph2, PCard, Footer2, WaFloat2, NewsletterPopup, TINTS });
