const { useState, useEffect } = React;

const TWEAKS = /*EDITMODE-BEGIN*/{
  "accentColor": "#C85C3F",
  "defaultLang": "fr"
}/*EDITMODE-END*/;

function App() {
  const [lang, setLang] = useState(TWEAKS.defaultLang);
  // Read page from URL hash first, fallback to localStorage (NEVER restore admin from storage)
  const parseHash = () => {
    const h = decodeURIComponent(window.location.hash.replace('#', ''));
    if (h.startsWith('product/')) {
      const key = h.split('/')[1];
      const prod = (window.WC_PRODUCTS || []).find(p => p.slug === key || p.id === key);
      if (prod) return { page: 'product', product: prod };
    }
    if (h === 'admin') return { page: 'admin' };
    if (h) return { page: h };
    const saved = localStorage.getItem('wc2-page');
    if (saved && saved !== 'admin' && saved !== 'product') return { page: saved };
    return { page: 'home' };
  };
  const initial = parseHash();
  const [page, setPage] = useState(initial.page);
  const [currentProduct, setCurrentProduct] = useState(initial.product || null);
  const scrollPositions = React.useRef({});
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wc2-cart') || '[]'); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wc2-wishlist') || '[]'); } catch { return []; }
  });
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [globalToast, setGlobalToast] = useState(null);
  const [authPrefill, setAuthPrefill] = useState({ email: '', mode: 'login' });
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [accentColor, setAccentColor] = useState(TWEAKS.accentColor);
  const [editMode, setEditMode] = useState(false);
  const [productsVersion, setProductsVersion] = useState(0);
  const [productsReady, setProductsReady] = useState(() => !!window._productsLoaded);

  useEffect(() => {
    const bump = () => { setProductsVersion(v => v + 1); setProductsReady(true); };
    window.addEventListener('products:loaded', bump);
    const fallback = setTimeout(() => setProductsReady(true), 1500);
    return () => { window.removeEventListener('products:loaded', bump); clearTimeout(fallback); };
  }, []);

  // Scroll-reveal animations — fade + slide-up when entering viewport
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    const observe = () => {
      document.querySelectorAll('.reveal:not(.is-visible), .reveal-stagger:not(.is-visible), .reveal-img:not(.is-visible)')
        .forEach(el => io.observe(el));
    };
    observe();
    // Re-scan when content changes (new pages, products loaded, lang switch)
    const id = setInterval(observe, 600);
    return () => { io.disconnect(); clearInterval(id); };
  }, [page, productsVersion, lang]);

  // Load products from Supabase on startup (fallback to data.js if empty/fails)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await window._sb
          .from('products')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true });
        if (error || !data || data.length === 0) {
          console.log('[products] Using local data.js fallback');
          setProductsReady(true);
          return;
        }
        const transformed = data.map(p => ({
          id: p.id, slug: p.slug, name: p.name, nameAr: p.name_ar,
          cat: p.cat, price: Number(p.price), tag: p.tag,
          colors: p.colors || [], img: p.img,
          imgFiles: p.img_files || [],
          description: p.description, descriptionAr: p.description_ar,
          composition: p.composition, entretien: p.entretien,
          details: p.details, mannequin: p.mannequin,
        }));
        const sameAsCache = WC_PRODUCTS.length === transformed.length
          && transformed.every((p, i) => WC_PRODUCTS[i]
              && WC_PRODUCTS[i].id === p.id
              && WC_PRODUCTS[i].price === p.price
              && (WC_PRODUCTS[i].imgFiles || []).join('|') === (p.imgFiles || []).join('|'));
        WC_PRODUCTS.length = 0;
        transformed.forEach(p => WC_PRODUCTS.push(p));
        window.WC_PRODUCTS = WC_PRODUCTS;
        window._productsLoaded = true;
        if (!sameAsCache) window.dispatchEvent(new Event('products:loaded'));
        else setProductsReady(true);
      } catch (e) {
        console.warn('[products] load failed', e);
        setProductsReady(true);
      }
    };
    loadProducts();
    window.addEventListener('products:reload', loadProducts);
    return () => window.removeEventListener('products:reload', loadProducts);
  }, []);

  useEffect(() => { localStorage.setItem('wc2-page', page); }, [page]);
  useEffect(() => { localStorage.setItem('wc2-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('wc2-wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { document.body.className = lang === 'ar' ? 'ar' : ''; }, [lang]);
  useEffect(() => { document.documentElement.style.setProperty('--clay', accentColor); }, [accentColor]);
  useEffect(() => {
    if (page === 'product') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const saved = scrollPositions.current[page] || 0;
    const restore = () => window.scrollTo({ top: saved, behavior: 'instant' });
    restore();
    const r1 = requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
    const t = setTimeout(restore, 120);
    return () => { cancelAnimationFrame(r1); clearTimeout(t); };
  }, [page, currentProduct]);

  // ── HASH ROUTING : sync URL ↔ page state for back/forward buttons
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);
  useEffect(() => {
    let hash = '';
    if (page === 'product' && currentProduct) hash = `#product/${currentProduct.slug || currentProduct.id}`;
    else if (page !== 'home') hash = `#${page}`;
    if (window.location.hash !== hash) {
      window.history.pushState({ page, productId: currentProduct?.id }, '', hash || window.location.pathname);
    }
  }, [page, currentProduct]);
  useEffect(() => {
    const onPop = () => {
      const parsed = parseHash();
      setCurrentProduct(parsed.product || null);
      setPage(parsed.page);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ── AUTH : restore session + sync wishlist with Supabase
  useEffect(() => {
    window._sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        loadWishFromCloud(data.session.user.id);
      }
    });
    const { data: sub } = window._sb.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) loadWishFromCloud(session.user.id);
      if (event === 'PASSWORD_RECOVERY') setRecoveryOpen(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── REALTIME : si admin modifie le profil → déconnexion forcée
  useEffect(() => {
    if (!user) return;
    const channel = window._sb
      .channel('profile-watch-' + user.id)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'id=eq.' + user.id },
        async () => {
          await window._sb.auth.signOut();
          setUser(null);
          goto('home');
          alert(lang === 'fr'
            ? 'Tes informations ont été modifiées par un administrateur. Reconnecte-toi avec tes nouveaux identifiants.'
            : 'تم تعديل معلوماتك من طرف الإدارة. سجلي الدخول من جديد.');
        }
      )
      .subscribe();
    return () => { window._sb.removeChannel(channel); };
  }, [user]);

  const loadWishFromCloud = async (uid) => {
    const { data } = await window._sb.from('wishlists').select('product_ids').eq('user_id', uid).maybeSingle();
    if (data?.product_ids) setWishlist(data.product_ids);
  };
  const saveWishToCloud = async (uid, ids) => {
    await window._sb.from('wishlists').upsert({ user_id: uid, product_ids: ids }, { onConflict: 'user_id' });
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setEditMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const persist = (edits) => window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');

  const goto = (p) => { setCurrentProduct(null); setPage(p); };
  const openProduct = (p) => {
    if (page !== 'product') scrollPositions.current[page] = window.scrollY;
    setCurrentProduct(p);
    setPage('product');
  };
  const addToCart = (item) => setCart((c) => [...c, item]);
  const buyNow = (item) => { setCart([item]); setPage('checkout'); };
  const toggleWish = (id) => {
    if (!user) { setAuthOpen(true); return; }
    setWishlist((w) => {
      const next = w.includes(id) ? w.filter(x => x !== id) : [...w, id];
      saveWishToCloud(user.id, next);
      return next;
    });
  };
  const logout = async () => {
    await window._sb.auth.signOut();
    setUser(null);
    setGlobalToast({ msg: lang === 'fr' ? '✓ Tu es déconnectée. À bientôt !' : '✓ تم تسجيل الخروج. إلى اللقاء!', type: 'ok' });
  };

  useEffect(() => {
    if (!globalToast) return;
    const t = setTimeout(() => setGlobalToast(null), 3500);
    return () => clearTimeout(t);
  }, [globalToast]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const isAdmin = window.location.hash.includes('admin') || page === 'admin';

  if (!isAdmin && !productsReady) {
    return <div style={{ minHeight: '100vh', background: 'var(--paper, #FAF6F1)' }} />;
  }

  let content;
  if (isAdmin) content = <AdminYoung />;
  else if (page === 'home') content = <HomeYoung lang={lang} onNav={goto} onProduct={openProduct} wishlist={wishlist} toggleWish={toggleWish} />;
  else if (page === 'shop' || page === 'new') content = <ShopYoung lang={lang} onProduct={openProduct} wishlist={wishlist} toggleWish={toggleWish} />;
  else if (page === 'product' && currentProduct) content = <PDetailYoung lang={lang} product={currentProduct} onBack={() => goto('home')} onAddToCart={addToCart} onBuyNow={buyNow} onProduct={openProduct} wishlist={wishlist} toggleWish={toggleWish} />;
  else if (page === 'cart') content = <CartYoung lang={lang} cart={cart} user={user} updateQty={(i, q) => setCart(c => c.map((it, idx) => idx === i ? { ...it, qty: q } : it))} removeItem={(i) => setCart(c => c.filter((_, idx) => idx !== i))} onCheckout={() => setPage('checkout')} onContinue={() => goto('shop')} />;
  else if (page === 'checkout') content = <CheckoutYoung lang={lang} cart={cart} user={user} onSuccess={() => { setCart([]); goto('home'); }} />;
  else if (page === 'prayer') content = <PrayerYoung lang={lang} onProduct={openProduct} wishlist={wishlist} toggleWish={toggleWish} />;
  else if (page === 'about') content = <AboutYoung lang={lang} />;
  else if (page === 'lookbook') content = <LookbookYoung lang={lang} />;
  else if (page === 'account' && user) content = <AccountYoung lang={lang} user={user} onLogout={async () => { await logout(); goto('home'); }} wishlist={wishlist} onProduct={openProduct} />;
  else if (page === 'account' && !user) { setAuthOpen(true); content = <HomeYoung lang={lang} onNav={goto} onProduct={openProduct} wishlist={wishlist} toggleWish={toggleWish} />; }
  else if (page === 'product' && !currentProduct) content = <NotFoundYoung lang={lang} onNav={goto} />;
  else content = <NotFoundYoung lang={lang} onNav={goto} />;

  return (
    <div data-screen-label={`wridachic young · ${page}`}>
      {!isAdmin && <Nav2 lang={lang} setLang={setLang} cartCount={cartCount} onNav={goto} current={page} user={user} onAuth={() => setAuthOpen(true)} onLogout={async () => { await logout(); goto('home'); }} />}
      {isAdmin ? content : <div>{content}</div>}
      {!isAdmin && <Footer2 lang={lang} onNav={goto} onSignup={(email) => { setAuthPrefill({ email: email || '', mode: 'signup' }); setAuthOpen(true); }} />}
      {!isAdmin && <WaFloat2 lang={lang} />}
      {!isAdmin && <NewsletterPopup lang={lang} />}
      {authOpen && <AuthYoung lang={lang} initialEmail={authPrefill.email} initialMode={authPrefill.mode} onClose={() => { setAuthOpen(false); setAuthPrefill({ email: '', mode: 'login' }); }} onSuccess={(u, opts) => {
        setUser(u);
        setAuthOpen(false);
        setAuthPrefill({ email: '', mode: 'login' });
        if (opts?.welcome) {
          goto('account');
        } else {
          const userName = u.user_metadata?.full_name || u.email.split('@')[0];
          setGlobalToast({ msg: lang === 'fr' ? `✓ Bon retour, ${userName} !` : `✓ مرحبا بعودتك، ${userName}!`, type: 'ok' });
        }
      }} />}
      {recoveryOpen && <RecoveryYoung lang={lang} onClose={() => { setRecoveryOpen(false); window.history.replaceState(null, '', window.location.pathname); }} />}

      {globalToast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', zIndex: 9999,
          transform: 'translateX(-50%)',
          background: globalToast.type === 'ok' ? '#2E7D32' : '#C62828',
          color: '#fff', padding: '14px 26px', borderRadius: 999,
          fontSize: 14, fontWeight: 500,
          boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
          animation: 'toastIn .25s ease',
          maxWidth: 'calc(100vw - 32px)', textAlign: 'center',
          fontFamily: 'Space Grotesk, sans-serif',
        }}>{globalToast.msg}</div>
      )}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>

      {editMode && (
        <div style={{ position: 'fixed', bottom: 90, right: 24, width: 260, background: 'var(--paper)', border: '1.5px solid var(--ink)', borderRadius: 18, padding: 18, boxShadow: '0 12px 32px rgba(15,14,13,0.16)', zIndex: 100, fontFamily: 'Space Grotesk' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 14, fontFamily: 'JetBrains Mono, monospace' }}>◆ tweaks</div>
          <div style={{ marginBottom: 14 }}>
            <label className="mono" style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase' }}>accent</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {['#C85C3F', '#D87A6A', '#0F0E0D', '#D4E157', '#A5C4D9'].map(c => (
                <button key={c} onClick={() => { setAccentColor(c); persist({ accentColor: c }); }} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: accentColor === c ? '2px solid var(--ink)' : '1px solid var(--line)', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div>
            <label className="mono" style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase' }}>langue</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {[{ id: 'fr', label: 'FR' }, { id: 'ar', label: 'ع' }].map(l => (
                <button key={l.id} onClick={() => { setLang(l.id); persist({ defaultLang: l.id }); }} style={{ flex: 1, padding: 8, border: `1.5px solid var(--ink)`, borderRadius: 999, background: lang === l.id ? 'var(--ink)' : 'transparent', color: lang === l.id ? 'var(--paper)' : 'var(--ink)', fontSize: 12, cursor: 'pointer' }}>{l.label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <a href="wridachic.html" className="mono" style={{ fontSize: 11, opacity: 0.6, textDecoration: 'underline' }}>← v1 classique</a>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
