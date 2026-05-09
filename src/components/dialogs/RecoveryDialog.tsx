'use client';

import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { useApp } from '@/store/AppContext';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export function RecoveryDialog() {
  const { lang } = useApp();
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowser();

    // Listen for the recovery event (fired after exchangeCodeForSession succeeds
    // OR when a stored recovery session is restored).
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setOpen(true);
    });

    // Supabase PKCE recovery links land on the site with ?code=...
    // The code is single-use and the verifier lives in the browser that requested
    // the reset — so opening the link in a different browser shows nothing unless
    // we explicitly exchange the code for a (recovery) session here. That exchange
    // fires PASSWORD_RECOVERY above, which opens the dialog.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        sb.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) console.warn('[recovery] exchangeCodeForSession failed:', error.message);
          // Strip the (now-used) code so a refresh doesn't retry it.
          url.searchParams.delete('code');
          window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        });
      }
    }

    return () => sub.subscription.unsubscribe();
  }, []);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const submit = async () => {
    setMsg('');
    if (pwd.length < 6) return setMsg(lang === 'fr' ? '⚠ 6 caractères minimum' : '⚠ 6 أحرف على الأقل');
    if (pwd !== pwd2) return setMsg(lang === 'fr' ? '⚠ Les mots de passe ne correspondent pas' : '⚠ كلمتا السر مختلفتان');
    setBusy(true);
    const sb = getSupabaseBrowser();
    const { error } = await sb.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) { setMsg('⚠ ' + error.message); return; }
    setDone(true);
    setTimeout(close, 1800);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,13,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--paper)', padding: 32, borderRadius: 20, width: '100%', maxWidth: 400, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Logo size={40} />
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
            <input
              className="input2" type="password"
              placeholder={lang === 'fr' ? 'Nouveau mot de passe (6+)' : 'كلمة السر الجديدة (6+)'}
              value={pwd} onChange={(e) => setPwd(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <input
              className="input2" type="password"
              placeholder={lang === 'fr' ? 'Confirmer' : 'التأكيد'}
              value={pwd2} onChange={(e) => setPwd2(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              style={{ marginBottom: 14 }}
            />
            {msg && <p className="mono" style={{ fontSize: 12, color: 'var(--clay)', marginBottom: 10 }}>{msg}</p>}
            <button className="btn2 btn2-dark" onClick={submit} disabled={busy} style={{ width: '100%', opacity: busy ? 0.5 : 1 }}>
              {busy ? '...' : (lang === 'fr' ? 'Modifier →' : 'تغيير →')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
