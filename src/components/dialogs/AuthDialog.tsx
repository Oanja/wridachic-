'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { useApp } from '@/store/AppContext';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type Mode = 'login' | 'signup' | 'otp' | 'reset';

const RESEND_COOLDOWN_SEC = 60;

export function AuthDialog() {
  const { lang, authOpen, closeAuth, authPrefill, setUser, showToast } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(authPrefill.mode);
  const [email, setEmail] = useState(authPrefill.email);
  const [pwd, setPwd] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [resendIn, setResendIn] = useState(0);

  // Sync prefill + reset transient state whenever the dialog re-opens.
  useEffect(() => {
    if (!authOpen) return;
    setMode(authPrefill.mode);
    setEmail(authPrefill.email);
    setErr(''); setInfo('');
  }, [authOpen, authPrefill]);

  // Resend cooldown ticker — Supabase rate-limits resend (~60s); show it visually.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  if (!authOpen) return null;

  const sb = getSupabaseBrowser();

  const onSuccess = (u: User, opts?: { welcome?: boolean }) => {
    setUser(u);
    closeAuth();
    if (opts?.welcome) {
      sessionStorage.setItem('wc2-welcome', name || '');
      // Soft-navigate so the React tree keeps the just-logged-in user in context.
      // window.location.href would force a reload and briefly render with user=null,
      // which made AccountPage re-trigger the auth dialog.
      router.push('/account');
    } else {
      const userName = (u.user_metadata as { full_name?: string })?.full_name || u.email?.split('@')[0];
      showToast({ msg: lang === 'fr' ? `✓ Bon retour, ${userName} !` : `✓ مرحبا بعودتك، ${userName}!`, type: 'ok' });
    }
  };

  // Use the current origin so links in emails (signup confirm + password reset)
  // come back to the right environment — localhost in dev, wridachic.com in prod.
  // The Supabase project's allowed Redirect URLs must include both.
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;

  const submit = async () => {
    setErr(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'signup') {
        if (pwd.length < 6) throw new Error(lang === 'fr' ? '6 caractères minimum' : '6 أحرف على الأقل');
        const { data, error } = await sb.auth.signUp({
          email, password: pwd,
          options: { data: { full_name: name }, emailRedirectTo: redirectTo },
        });
        if (error) throw error;

        // Supabase user-enumeration protection: when the email already exists,
        // signUp returns a fake user with `identities: []` and no error.
        // Detect that and tell the user to log in instead.
        const identities = (data.user as { identities?: unknown[] } | null)?.identities;
        if (data.user && Array.isArray(identities) && identities.length === 0) {
          throw new Error(lang === 'fr'
            ? 'Cet e-mail est déjà utilisé. Connecte-toi ou clique sur « Mot de passe oublié ».'
            : 'هاد الإيميل مسجل من قبل. سجلي الدخول أو اضغطي « نسيت كلمة السر ».');
        }

        if (data.user && !data.session) {
          setMode('otp');
          setResendIn(RESEND_COOLDOWN_SEC);
          setInfo(lang === 'fr' ? '✉ Code à 6 chiffres envoyé par email' : '✉ تم إرسال رمز من 6 أرقام للإيميل');
        } else if (data.user && data.session) {
          onSuccess(data.user, { welcome: true });
        }
      } else if (mode === 'login') {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pwd });
        if (error) {
          if (error.message.toLowerCase().includes('not confirmed') || error.message.toLowerCase().includes('email')) {
            await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } });
            setMode('otp');
            setResendIn(RESEND_COOLDOWN_SEC);
            setInfo(lang === 'fr' ? '⚠ Compte non confirmé. Code renvoyé par email.' : '⚠ الحساب غير مؤكد. تم إرسال رمز جديد.');
          } else throw error;
        } else if (data.user) {
          onSuccess(data.user);
        }
      } else if (mode === 'otp') {
        const { data, error } = await sb.auth.verifyOtp({ email, token: otp.trim(), type: 'signup' });
        if (error) throw error;
        if (data.user) onSuccess(data.user, { welcome: true });
      } else if (mode === 'reset') {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setInfo(lang === 'fr' ? '✓ Lien de réinitialisation envoyé.' : '✓ تم إرسال رابط إعادة التعيين.');
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    }
    setBusy(false);
  };

  const resendCode = async () => {
    if (resendIn > 0 || busy) return;
    setErr(''); setBusy(true);
    const { error } = await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } });
    if (error) {
      // Supabase typically returns "Email rate limit exceeded" or "For security
      // purposes, you can only request this after N seconds." Surface it raw.
      setErr(error.message);
    } else {
      setInfo(lang === 'fr' ? '✓ Code renvoyé !' : '✓ تم إعادة الإرسال!');
      setResendIn(RESEND_COOLDOWN_SEC);
    }
    setBusy(false);
  };

  const titles: Record<Mode, { fr: string; ar: string }> = {
    login:  { fr: 'Connexion',           ar: 'تسجيل الدخول' },
    signup: { fr: 'Créer un compte',     ar: 'إنشاء حساب' },
    otp:    { fr: 'Confirmation',        ar: 'تأكيد' },
    reset:  { fr: 'Mot de passe oublié', ar: 'نسيت كلمة السر' },
  };
  const subtitles: Record<Mode, { fr: string; ar: string }> = {
    login:  { fr: 'Retrouve tes favoris',         ar: 'استرجعي مفضلاتك' },
    signup: { fr: 'Sauvegarde tes favoris',       ar: 'احفظي مفضلاتك' },
    otp:    { fr: 'Entre le code reçu par email', ar: 'أدخلي الرمز من الإيميل' },
    reset:  { fr: "On t'envoie un lien",          ar: 'سنرسل لك رابطًا' },
  };

  return (
    <div onClick={closeAuth} style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,13,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--paper)', padding: 32, borderRadius: 20, width: '100%', maxWidth: 380, position: 'relative' }}>
        <button onClick={closeAuth} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'var(--paper-2)' }}>
          <Icon n="close" s={14} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Logo size={40} />
        </div>
        <h2 className="display" style={{ fontSize: 24, textAlign: 'center', marginBottom: 6 }}>{titles[mode][lang]}</h2>
        <p className="mono" style={{ fontSize: 11, opacity: 0.5, textAlign: 'center', marginBottom: 20 }}>{subtitles[mode][lang]}</p>

        {mode === 'signup' && (
          <>
            <input className="input2" placeholder={lang === 'fr' ? 'Nom complet' : 'الاسم الكامل'} value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="input2" type="email" placeholder={lang === 'fr' ? 'E-mail' : 'البريد الإلكتروني'} value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="input2" type="password" placeholder={lang === 'fr' ? 'Mot de passe (6+ caractères)' : 'كلمة السر (6+ أحرف)'} value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} style={{ marginBottom: 10 }} />
          </>
        )}

        {mode === 'login' && (
          <>
            <input className="input2" type="email" placeholder={lang === 'fr' ? 'E-mail' : 'البريد الإلكتروني'} value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="input2" type="password" placeholder={lang === 'fr' ? 'Mot de passe' : 'كلمة السر'} value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} style={{ marginBottom: 6 }} />
            <p style={{ textAlign: 'right', fontSize: 12, marginBottom: 10 }}>
              <a onClick={() => { setMode('reset'); setErr(''); setInfo(''); }} style={{ opacity: 0.6, cursor: 'pointer', borderBottom: '1px solid currentColor' }}>
                {lang === 'fr' ? 'Mot de passe oublié ?' : 'نسيت كلمة السر؟'}
              </a>
            </p>
          </>
        )}

        {mode === 'otp' && (
          <>
            <p style={{ fontSize: 13, opacity: 0.7, textAlign: 'center', marginBottom: 14 }}>
              {lang === 'fr' ? 'Email envoyé à ' : 'تم الإرسال إلى '}<strong>{email}</strong>
            </p>
            <input className="input2" type="text" inputMode="numeric" maxLength={6} placeholder="••••••" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && submit()} style={{ marginBottom: 10, textAlign: 'center', fontSize: 22, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '8px' }} />
            <p style={{ textAlign: 'center', fontSize: 12, marginBottom: 10 }}>
              {resendIn > 0 ? (
                <span style={{ opacity: 0.5 }}>
                  {lang === 'fr'
                    ? `Renvoyer le code dans ${resendIn}s`
                    : `إعادة الإرسال بعد ${resendIn}ث`}
                </span>
              ) : (
                <a onClick={resendCode} style={{ opacity: busy ? 0.4 : 0.7, cursor: busy ? 'not-allowed' : 'pointer', borderBottom: '1px solid currentColor' }}>
                  {lang === 'fr' ? 'Renvoyer le code' : 'إعادة إرسال الرمز'}
                </a>
              )}
            </p>
          </>
        )}

        {mode === 'reset' && (
          <input className="input2" type="email" placeholder={lang === 'fr' ? 'E-mail' : 'البريد الإلكتروني'} value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 10 }} />
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
}
