'use client';

import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { AdminProducts } from '@/components/admin/AdminProducts';
import { AdminCoupons } from '@/components/admin/AdminCoupons';
import { AdminNewsletter } from '@/components/admin/AdminNewsletter';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminSite } from '@/components/admin/AdminSite';

type Tab = 'orders' | 'products' | 'coupons' | 'newsletter' | 'users' | 'site';

export function AdminPage() {
  const sb = getSupabaseBrowser();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('orders');

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getSession();
      if (data?.session?.user) {
        const { data: ok } = await sb.rpc('is_admin');
        if (ok) setAuthed(true);
      }
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async () => {
    setError(''); setBusy(true);
    const { data, error: e1 } = await sb.auth.signInWithPassword({ email: email.trim(), password: pwd });
    if (e1 || !data?.user) { setBusy(false); setError('Email ou mot de passe incorrect'); return; }
    const { data: ok, error: e2 } = await sb.rpc('is_admin');
    if (e2 || !ok) {
      await sb.auth.signOut();
      setBusy(false);
      setError("Ce compte n'a pas les permissions admin.");
      return;
    }
    setAuthed(true); setBusy(false); setPwd('');
  };

  const logoutAdmin = async () => {
    await sb.auth.signOut();
    setAuthed(false); setEmail(''); setPwd('');
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
        <div style={{ opacity: 0.4, fontSize: 12, fontFamily: 'monospace' }}>...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 16 }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 20, width: '100%', maxWidth: 340, textAlign: 'center', border: '1px solid rgba(15,14,13,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><Logo size={48} /></div>
          <h2 className="display" style={{ fontSize: 24, marginTop: 20, marginBottom: 6 }}>Admin</h2>
          <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 24, fontFamily: 'monospace' }}>TABLEAU DE BORD</p>
          <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} className="input2" style={{ marginBottom: 10 }} />
          <input type="password" placeholder="Mot de passe" autoComplete="current-password" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} className="input2" style={{ marginBottom: 12 }} />
          {error && <p style={{ color: 'var(--clay)', fontSize: 12, marginBottom: 10 }}>{error}</p>}
          <button className="btn2 btn2-dark" style={{ width: '100%' }} disabled={busy} onClick={login}>
            {busy ? '...' : 'Connexion →'}
          </button>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'orders', label: 'Commandes' },
    { id: 'products', label: 'Produits' },
    { id: 'coupons', label: 'Coupons' },
    { id: 'newsletter', label: 'Newsletter' },
    { id: 'users', label: 'Utilisateurs' },
    { id: 'site', label: '🎨 Site' },
  ];

  return (
    // Force LTR on the admin regardless of the user's chosen UI language so
    // form labels & tables don't flip when lang=ar.
    <div dir="ltr" style={{ minHeight: '100vh', background: '#FAF6F1', color: '#0F0E0D', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo size={32} />
            <div>
              <div className="display" style={{ fontSize: 20 }}>Tableau de bord</div>
              <div style={{ fontSize: 10, opacity: 0.5, fontFamily: 'monospace' }}>WRIDACHIC ADMIN</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '10px 16px', fontSize: 12, background: 'var(--clay)', color: '#fff', border: '1px solid var(--clay)', borderRadius: 8, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              🌹 Voir le site
            </a>
            <button onClick={logoutAdmin} style={{ padding: '10px 16px', fontSize: 12, background: '#fff', border: '1px solid rgba(15,14,13,0.18)', borderRadius: 8, cursor: 'pointer' }}>
              Déconnexion
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: '1px solid rgba(15,14,13,0.1)', flexWrap: 'wrap' }}>
          {tabs.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{
              padding: '12px 20px', fontSize: 14, marginBottom: -1, cursor: 'pointer',
              borderBottom: tab === tb.id ? '2px solid var(--clay)' : '2px solid transparent',
              color: tab === tb.id ? '#0F0E0D' : 'rgba(15,14,13,0.5)',
              fontWeight: tab === tb.id ? 600 : 500,
              background: 'transparent',
              border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid',
              borderBottomColor: tab === tb.id ? 'var(--clay)' : 'transparent',
            }}>{tb.label}</button>
          ))}
        </div>

        {tab === 'orders' && <AdminOrders />}
        {tab === 'products' && <AdminProducts />}
        {tab === 'coupons' && <AdminCoupons />}
        {tab === 'newsletter' && <AdminNewsletter />}
        {tab === 'users' && <AdminUsers />}
        {tab === 'site' && <AdminSite />}
      </div>

      {/* Floating "View site" button — sticks to the bottom-right corner so
          it's reachable from any tab even when scrolled deep into a long
          orders/products list. */}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        title="Voir le site"
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 100,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--clay)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, textDecoration: 'none',
          boxShadow: '0 8px 20px rgba(200,92,63,0.4)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        🌹
      </a>
    </div>
  );
}
