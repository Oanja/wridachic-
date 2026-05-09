'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { Marquee } from '@/components/ui/Marquee';
import { useApp } from '@/store/AppContext';
import { TR } from '@/lib/i18n';

const NAV_ITEMS = [
  { href: '/shop',   key: 'shop' as const },
  { href: '/prayer', key: 'prayer' as const },
  { href: '/new',    key: 'new' as const },
  { href: '/about',  key: 'about' as const },
];

export function Nav() {
  const { lang, setLang, cartCount, user, openAuth, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const t = TR[lang];
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [userOpen]);

  // close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <Marquee items={t.announce} />
      <nav className="nav2">
        <div className="nav2-inner">
          <Link href="/" className="nav2-logo">
            <Logo size={72} variant="menu" priority />
          </Link>

          <div className="nav2-links">
            {NAV_ITEMS.map((it) => (
              <Link key={it.key} href={it.href} className={pathname === it.href ? 'active' : ''}>
                {t.nav[it.key]}
              </Link>
            ))}
          </div>

          <div className="nav2-actions">
            <div className="nav2-lang">
              <button className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
              <button className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>ع</button>
            </div>
            <button className="nav2-search-btn" title="Recherche" aria-label="Recherche"><Icon n="search" /></button>
            <div ref={userRef} style={{ position: 'relative' }}>
              <button
                title={user ? (lang === 'fr' ? 'Mon compte' : 'حسابي') : (lang === 'fr' ? 'Connexion' : 'دخول')}
                onClick={() => (user ? setUserOpen((o) => !o) : openAuth())}
                style={user ? { background: 'var(--ink)', color: 'var(--paper)' } : {}}
                aria-label="Account"
              >
                <Icon n="user" />
              </button>
              {user && userOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 240,
                  maxWidth: 'calc(100vw - 24px)', background: 'var(--paper)',
                  border: '1px solid var(--line)', borderRadius: 14,
                  boxShadow: '0 12px 32px rgba(15,14,13,0.12)', padding: 8, zIndex: 80,
                  fontFamily: 'Space Grotesk', textAlign: lang === 'ar' ? 'right' : 'left',
                }}>
                  <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>
                      {(user.user_metadata as { full_name?: string })?.full_name || user.email?.split('@')[0]}
                    </div>
                    <div className="mono" style={{ fontSize: 10, opacity: 0.5, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>
                  {[
                    { label: lang === 'fr' ? 'Mon profil' : 'ملفي الشخصي', tab: 'profile' },
                    { label: lang === 'fr' ? 'Mes commandes' : 'طلباتي', tab: 'orders' },
                    { label: lang === 'fr' ? 'Mes favoris' : 'مفضلاتي', tab: 'wishlist' },
                  ].map((it, i) => (
                    <a
                      key={i}
                      onClick={() => {
                        setUserOpen(false);
                        if (typeof window !== 'undefined') {
                          (window as unknown as { __accountTab?: string }).__accountTab = it.tab;
                          window.dispatchEvent(new Event('account:gotab'));
                        }
                        router.push('/account');
                      }}
                      style={{ display: 'block', padding: '9px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                    >
                      {it.label}
                    </a>
                  ))}
                  <a
                    onClick={async () => { setUserOpen(false); await logout(); router.push('/'); }}
                    style={{ display: 'block', padding: '9px 12px', borderRadius: 8, fontSize: 13, color: 'var(--clay)', cursor: 'pointer', borderTop: '1px solid var(--line)', marginTop: 4 }}
                  >
                    ↗ {lang === 'fr' ? 'Déconnexion' : 'تسجيل خروج'}
                  </a>
                </div>
              )}
            </div>
            <Link href="/cart" title="Panier" style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }} aria-label="Cart">
              <Icon n="bag" />
              {cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
            </Link>
            <button className="nav2-menu-btn" onClick={() => setMenuOpen(!menuOpen)} title="Menu" aria-label="Menu">
              <Icon n={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)', padding: '8px 12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_ITEMS.map((it) => (
              <Link
                key={it.key} href={it.href}
                style={{
                  padding: '13px 16px', borderRadius: 12, fontSize: 16, fontWeight: 500,
                  background: pathname === it.href ? 'var(--ink)' : 'transparent',
                  color: pathname === it.href ? 'var(--paper)' : 'var(--ink)',
                }}
              >
                {t.nav[it.key]}
              </Link>
            ))}
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
              {[{ id: 'fr' as const, label: 'Français' }, { id: 'ar' as const, label: 'العربية' }].map((l) => (
                <button
                  key={l.id} onClick={() => setLang(l.id)}
                  style={{
                    flex: 1, padding: '10px', border: '1.5px solid var(--ink)', borderRadius: 999,
                    background: lang === l.id ? 'var(--ink)' : 'transparent',
                    color: lang === l.id ? 'var(--paper)' : 'var(--ink)', fontSize: 13,
                  }}
                >{l.label}</button>
              ))}
            </div>
          </div>
        )}
      </nav>
      <style>{`
        .nav2-menu-btn { display: none !important; }
        @media (max-width: 768px) { .nav2-menu-btn { display: flex !important; } }
      `}</style>
    </>
  );
}
