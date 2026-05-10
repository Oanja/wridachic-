'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { PCard } from '@/components/ui/PCard';
import { TINTS } from '@/lib/data';
import { useApp } from '@/store/AppContext';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Product } from '@/lib/types';

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items?: Array<{ name: string; qty: number; size: string }>;
}

export function AccountPage({ products }: { products: Product[] }) {
  const { lang, user, authReady, wishlist, toggleWish, logout, openAuth } = useApp();
  const router = useRouter();

  const [tab, setTab] = useState<'profile' | 'orders' | 'wishlist'>('profile');
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [currentPwdName, setCurrentPwdName] = useState('');
  const [currentPwdPwd, setCurrentPwdPwd] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPwd, setEditingPwd] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  // Track whether we ever saw a user. If yes and they vanish, that's a logout —
  // route home silently instead of popping the auth dialog.
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      if (wasLoggedIn.current) {
        // User just logged out from this page → go home, no popup.
        router.push('/');
      } else {
        // Guest hit /account directly → invite to log in.
        openAuth();
      }
      return;
    }
    wasLoggedIn.current = true;
    const meta = user.user_metadata as { full_name?: string } | undefined;
    setName(meta?.full_name || '');
    if (typeof window !== 'undefined') {
      const w = sessionStorage.getItem('wc2-welcome');
      if (w !== null) {
        sessionStorage.removeItem('wc2-welcome');
        setWelcomeName(w);
      }
      const stored = (window as unknown as { __accountTab?: string }).__accountTab;
      if (stored === 'profile' || stored === 'orders' || stored === 'wishlist') {
        setTab(stored);
        delete (window as unknown as { __accountTab?: string }).__accountTab;
      }
    }
  }, [authReady, user, openAuth, router]);

  useEffect(() => {
    if (welcomeName === null) return;
    const t = setTimeout(() => setWelcomeName(null), 6000);
    return () => clearTimeout(t);
  }, [welcomeName]);

  useEffect(() => {
    if (tab !== 'orders' || !user) return;
    const sb = getSupabaseBrowser();
    sb.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data ?? []) as OrderRow[]));
  }, [tab, user]);

  useEffect(() => {
    const handler = () => {
      const stored = (window as unknown as { __accountTab?: string }).__accountTab;
      if (stored === 'profile' || stored === 'orders' || stored === 'wishlist') {
        setTab(stored); setMsg('');
        delete (window as unknown as { __accountTab?: string }).__accountTab;
      }
    };
    window.addEventListener('account:gotab', handler);
    return () => window.removeEventListener('account:gotab', handler);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  if (!authReady) {
    return <div style={{ minHeight: '60vh' }} />;
  }
  if (!user) return null;

  const meta = (user.user_metadata as { full_name?: string }) || {};
  const fav = products.filter((p) => wishlist.includes(p.id));
  const sb = getSupabaseBrowser();

  const verifyPwd = async (currentPwd: string) => {
    const { error } = await sb.auth.signInWithPassword({ email: user.email!, password: currentPwd });
    return !error;
  };

  const saveName = async () => {
    setMsg('');
    if (!currentPwdName) return setMsg(lang !== 'ar' ? '⚠ Confirme ton mot de passe actuel' : '⚠ أكدي كلمة السر الحالية');
    setBusy(true);
    const ok = await verifyPwd(currentPwdName);
    if (!ok) { setBusy(false); return setMsg(lang !== 'ar' ? '⚠ Mot de passe incorrect' : '⚠ كلمة السر غير صحيحة'); }
    const { error } = await sb.auth.updateUser({ data: { full_name: name } });
    setCurrentPwdName(''); setBusy(false);
    if (error) { setMsg('⚠ ' + error.message); return; }
    setMsg(lang !== 'ar' ? '✓ Nom mis à jour. Reconnexion...' : '✓ تم حفظ الاسم. إعادة الدخول...');
    setTimeout(async () => { await logout(); router.push('/'); }, 1800);
  };

  const savePwd = async () => {
    setMsg('');
    if (!currentPwdPwd) return setMsg(lang !== 'ar' ? '⚠ Confirme ton mot de passe actuel' : '⚠ أكدي كلمة السر الحالية');
    if (pwd.length < 6) return setMsg(lang !== 'ar' ? '⚠ 6 caractères minimum' : '⚠ 6 أحرف على الأقل');
    if (pwd !== pwd2) return setMsg(lang !== 'ar' ? '⚠ Les mots de passe ne correspondent pas' : '⚠ كلمتا السر مختلفتان');
    setBusy(true);
    const ok = await verifyPwd(currentPwdPwd);
    if (!ok) { setBusy(false); return setMsg(lang !== 'ar' ? '⚠ Mot de passe actuel incorrect' : '⚠ كلمة السر الحالية غير صحيحة'); }
    const { error } = await sb.auth.updateUser({ password: pwd });
    setPwd(''); setPwd2(''); setCurrentPwdPwd(''); setBusy(false);
    if (error) { setMsg('⚠ ' + error.message); return; }
    setMsg(lang !== 'ar' ? '✓ Mot de passe modifié. Reconnexion...' : '✓ تم تغيير كلمة السر. إعادة الدخول...');
    setTimeout(async () => { await logout(); router.push('/'); }, 1800);
  };

  const tabs = [
    { id: 'profile' as const,  label: lang !== 'ar' ? 'Profil' : 'الملف الشخصي' },
    { id: 'orders' as const,   label: lang !== 'ar' ? 'Commandes' : 'طلباتي' },
    { id: 'wishlist' as const, label: lang !== 'ar' ? 'Favoris' : 'مفضلاتي', count: fav.length },
  ];

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: '2-digit' });
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
        {welcomeName !== null && (
          <div style={{
            background: 'linear-gradient(135deg, var(--clay), #d49088)',
            color: '#fff', padding: '20px 24px', borderRadius: 16,
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 8px 24px rgba(196,116,107,0.25)',
            animation: 'toastIn .35s ease', position: 'relative',
          }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>✦</span>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 22, lineHeight: 1.2, marginBottom: 4 }}>
                {lang !== 'ar'
                  ? <>Bienvenue <em style={{ fontStyle: 'italic' }}>{welcomeName || user.email?.split('@')[0]}</em> ✦</>
                  : <>مرحبا بك <em style={{ fontStyle: 'italic' }}>{welcomeName || user.email?.split('@')[0]}</em> ✦</>}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                {lang !== 'ar' ? 'dans ta boutique wridachic — ton compte a été créé avec succès.' : 'في متجرك وريدة شيك — تم إنشاء حسابك بنجاح.'}
              </div>
            </div>
            <button onClick={() => setWelcomeName(null)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }}>
              <Icon n="close" s={12} />
            </button>
          </div>
        )}
        <div style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>/ {lang !== 'ar' ? 'mon compte' : 'حسابي'} /</span>
            <h1 className="display" style={{ fontSize: 'clamp(36px, 6vw, 56px)', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {lang !== 'ar' ? 'Bonjour' : 'مرحبا'}, <em style={{ color: 'var(--clay)', fontStyle: 'italic' }}>{meta.full_name || user.email?.split('@')[0]}</em>
            </h1>
            <p className="mono" style={{ fontSize: 12, opacity: 0.5, marginTop: 6 }}>{user.email}</p>
          </div>
          <button className="btn2 btn2-outline" onClick={async () => { await logout(); router.push('/'); }}>
            {lang !== 'ar' ? '↗ Déconnexion' : '↗ خروج'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
          {tabs.map((tb) => (
            <button key={tb.id} onClick={() => { setTab(tb.id); setMsg(''); }} style={{
              padding: '10px 18px', borderBottom: tab === tb.id ? '2px solid var(--ink)' : '2px solid transparent',
              fontWeight: tab === tb.id ? 600 : 400, fontSize: 14, marginBottom: -1,
              color: tab === tb.id ? 'var(--ink)' : 'var(--muted)',
            }}>
              {tb.label} {tb.count !== undefined && <span className="mono" style={{ fontSize: 11, opacity: 0.5 }}>({tb.count})</span>}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div style={{ maxWidth: 480 }}>
            <div style={{ background: 'var(--paper-2)', padding: 24, borderRadius: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 className="display" style={{ fontSize: 20 }}>{lang !== 'ar' ? 'Informations' : 'المعلومات'}</h3>
                {!editingName && (
                  <button onClick={() => setEditingName(true)} className="mono" style={{ fontSize: 11, padding: '6px 14px', border: '1px solid var(--ink)', borderRadius: 999, background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {lang !== 'ar' ? '✎ Modifier' : '✎ تعديل'}
                  </button>
                )}
              </div>

              {!editingName ? (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{lang !== 'ar' ? 'Nom complet' : 'الاسم الكامل'}</label>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{meta.full_name || '—'}</div>
                  </div>
                  <div>
                    <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>E-mail</label>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{user.email}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{lang !== 'ar' ? 'Nom complet' : 'الاسم الكامل'}</label>
                  <input className="input2" value={name} onChange={(e) => setName(e.target.value)} style={{ marginTop: 4, marginBottom: 12 }} />
                  <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>E-mail</label>
                  <input className="input2" value={user.email ?? ''} disabled style={{ marginTop: 4, marginBottom: 12, opacity: 0.6 }} />
                  <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{lang !== 'ar' ? 'Mot de passe actuel' : 'كلمة السر الحالية'}</label>
                  <input className="input2" type="password" value={currentPwdName} onChange={(e) => setCurrentPwdName(e.target.value)} placeholder={lang !== 'ar' ? 'Pour confirmer' : 'للتأكيد'} style={{ marginTop: 4, marginBottom: 12 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn2 btn2-dark" onClick={saveName} disabled={busy} style={{ opacity: busy ? 0.5 : 1 }}>
                      {lang !== 'ar' ? 'Enregistrer' : 'حفظ'}
                    </button>
                    <button onClick={() => { setEditingName(false); setName(meta.full_name || ''); setCurrentPwdName(''); setMsg(''); }} className="mono" style={{ fontSize: 12, padding: '0 18px', border: '1px solid var(--line)', borderRadius: 999, background: 'transparent', cursor: 'pointer' }}>
                      {lang !== 'ar' ? 'Annuler' : 'إلغاء'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: 'var(--paper-2)', padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 className="display" style={{ fontSize: 20 }}>{lang !== 'ar' ? 'Mot de passe' : 'كلمة السر'}</h3>
                {!editingPwd && (
                  <button onClick={() => setEditingPwd(true)} className="mono" style={{ fontSize: 11, padding: '6px 14px', border: '1px solid var(--ink)', borderRadius: 999, background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {lang !== 'ar' ? '✎ Modifier' : '✎ تعديل'}
                  </button>
                )}
              </div>

              {!editingPwd ? (
                <div>
                  <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{lang !== 'ar' ? 'Mot de passe' : 'كلمة السر'}</label>
                  <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '0.2em' }}>••••••••</div>
                </div>
              ) : (
                <div>
                  <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{lang !== 'ar' ? 'Mot de passe actuel' : 'كلمة السر الحالية'}</label>
                  <input className="input2" type="password" value={currentPwdPwd} onChange={(e) => setCurrentPwdPwd(e.target.value)} style={{ marginTop: 4, marginBottom: 12 }} />
                  <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{lang !== 'ar' ? 'Nouveau mot de passe' : 'كلمة السر الجديدة'}</label>
                  <input className="input2" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} style={{ marginTop: 4, marginBottom: 12 }} />
                  <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{lang !== 'ar' ? 'Confirmer' : 'تأكيد'}</label>
                  <input className="input2" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} style={{ marginTop: 4, marginBottom: 12 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn2 btn2-dark" onClick={savePwd} disabled={busy} style={{ opacity: busy ? 0.5 : 1 }}>
                      {lang !== 'ar' ? 'Modifier' : 'تغيير'}
                    </button>
                    <button onClick={() => { setEditingPwd(false); setPwd(''); setPwd2(''); setCurrentPwdPwd(''); setMsg(''); }} className="mono" style={{ fontSize: 12, padding: '0 18px', border: '1px solid var(--line)', borderRadius: 999, background: 'transparent', cursor: 'pointer' }}>
                      {lang !== 'ar' ? 'Annuler' : 'إلغاء'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: 'var(--paper-2)', borderRadius: 16 }}>
                <div style={{ fontSize: 40 }}>📦</div>
                <p style={{ marginTop: 10, opacity: 0.6 }}>
                  {lang !== 'ar' ? 'Aucune commande pour le moment.' : 'مكاين حتى طلب.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.map((o) => (
                  <div key={o.id} style={{ background: 'var(--paper-2)', padding: 18, borderRadius: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--clay)' }}>{o.order_number}</span>
                        <span className="mono" style={{ fontSize: 11, opacity: 0.5, marginLeft: 10 }}>{fmt(o.created_at)}</span>
                      </div>
                      <span className="mono" style={{ fontSize: 10, padding: '4px 10px', borderRadius: 999, background: 'var(--ink)', color: 'var(--paper)', textTransform: 'uppercase' }}>{o.status}</span>
                    </div>
                    {(o.items ?? []).map((it, i) => (
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

        {tab === 'wishlist' && (
          fav.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: 'var(--paper-2)', borderRadius: 16 }}>
              <div style={{ fontSize: 40 }}>🤍</div>
              <p style={{ marginTop: 10, opacity: 0.6 }}>
                {lang !== 'ar' ? 'Aucun favori pour le moment.' : 'مكاين والو فالمفضلات.'}
              </p>
            </div>
          ) : (
            <div className="g4">
              {fav.map((p, i) => (
                <PCard key={p.id} product={p} lang={lang} onWish={toggleWish} wished tint={TINTS[i % TINTS.length]} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
