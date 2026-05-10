'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { useApp } from '@/store/AppContext';
import { pick } from '@/lib/i18n';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type Mode = 'login' | 'signup' | 'otp' | 'reset';
type OtpType = 'signup' | 'recovery';

const RESEND_COOLDOWN_SEC = 60;

export function AuthDialog() {
  const { lang, authOpen, closeAuth, authPrefill, setUser, showToast } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(authPrefill.mode);
  const [otpType, setOtpType] = useState<OtpType>('signup');
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
    setOtpType('signup');
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
      router.push('/account');
    } else {
      const userName = (u.user_metadata as { full_name?: string })?.full_name || u.email?.split('@')[0];
      showToast({ msg: pick(lang, `✓ Bon retour, ${userName} !`, `✓ Welcome back, ${userName}!`, `✓ مرحبا بعودتك، ${userName}!`), type: 'ok' });
    }
  };

  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;

  const submit = async () => {
    setErr(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'signup') {
        if (pwd.length < 6) throw new Error(pick(lang, '6 caractères minimum', 'At least 6 characters', '6 أحرف على الأقل'));
        const { data, error } = await sb.auth.signUp({
          email, password: pwd,
          options: { data: { full_name: name }, emailRedirectTo: redirectTo },
        });
        if (error) throw error;

        const identities = (data.user as { identities?: unknown[] } | null)?.identities;
        if (data.user && Array.isArray(identities) && identities.length === 0) {
          throw new Error(pick(lang,
            'Cet e-mail est déjà utilisé. Connecte-toi ou clique sur « Mot de passe oublié ».',
            'This e-mail is already registered. Sign in or click "Forgot password".',
            'هاد الإيميل مسجل من قبل. سجلي الدخول أو اضغطي « نسيت كلمة السر ».'));
        }

        if (data.user && !data.session) {
          setOtpType('signup');
          setMode('otp');
          setResendIn(RESEND_COOLDOWN_SEC);
          setInfo(pick(lang, '✉ Code à 6 chiffres envoyé par email', '✉ 6-digit code sent by email', '✉ تم إرسال رمز من 6 أرقام للإيميل'));
        } else if (data.user && data.session) {
          onSuccess(data.user, { welcome: true });
        }
      } else if (mode === 'login') {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pwd });
        if (error) {
          if (error.message.toLowerCase().includes('not confirmed') || error.message.toLowerCase().includes('email')) {
            await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } });
            setOtpType('signup');
            setMode('otp');
            setResendIn(RESEND_COOLDOWN_SEC);
            setInfo(pick(lang,
              '⚠ Compte non confirmé. Code renvoyé par email.',
              '⚠ Account not confirmed. Code resent by email.',
              '⚠ الحساب غير مؤكد. تم إرسال رمز جديد.'));
          } else throw error;
        } else if (data.user) {
          onSuccess(data.user);
        }
      } else if (mode === 'otp') {
        // Same Supabase API for both signup & recovery, only the `type` differs.
        // Recovery verify creates a recovery session → PASSWORD_RECOVERY event
        // fires → RecoveryDialog opens automatically.
        const { data, error } = await sb.auth.verifyOtp({
          email, token: otp.trim(),
          type: otpType === 'recovery' ? 'recovery' : 'signup',
        });
        if (error) throw error;
        if (data.user) {
          if (otpType === 'recovery') {
            // Close auth dialog so the RecoveryDialog (listening to PASSWORD_RECOVERY) can take over.
            closeAuth();
          } else {
            onSuccess(data.user, { welcome: true });
          }
        }
      } else if (mode === 'reset') {
        // resetPasswordForEmail with no `redirectTo` makes Supabase send the
        // {{ .Token }} OTP code email (template-permitting). The redirectTo is
        // only used when the email contains {{ .ConfirmationURL }} link.
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setOtpType('recovery');
        setMode('otp');
        setResendIn(RESEND_COOLDOWN_SEC);
        setInfo(pick(lang,
          '✉ Code à 6 chiffres envoyé par email',
          '✉ 6-digit code sent by email',
          '✉ تم إرسال رمز من 6 أرقام للإيميل'));
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    }
    setBusy(false);
  };

  const resendCode = async () => {
    if (resendIn > 0 || busy) return;
    setErr(''); setBusy(true);
    const { error } = otpType === 'recovery'
      ? await sb.auth.resetPasswordForEmail(email, { redirectTo })
      : await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } });
    if (error) {
      setErr(error.message);
    } else {
      setInfo(pick(lang, '✓ Code renvoyé !', '✓ Code resent!', '✓ تم إعادة الإرسال!'));
      setResendIn(RESEND_COOLDOWN_SEC);
    }
    setBusy(false);
  };

  // OTP view shows different copy for signup vs recovery.
  const otpTitle = otpType === 'recovery'
    ? { fr: 'Code de réinitialisation', en: 'Reset code', ar: 'رمز إعادة التعيين' }
    : { fr: 'Confirmation', en: 'Confirmation', ar: 'تأكيد' };
  const otpSubtitle = otpType === 'recovery'
    ? { fr: 'Entre le code reçu par email', en: 'Enter the code you received by email', ar: 'أدخلي الرمز من الإيميل' }
    : { fr: 'Entre le code reçu par email', en: 'Enter the code you received by email', ar: 'أدخلي الرمز من الإيميل' };

  const titles: Record<Mode, { fr: string; en: string; ar: string }> = {
    login:  { fr: 'Connexion',           en: 'Sign in',           ar: 'تسجيل الدخول' },
    signup: { fr: 'Créer un compte',     en: 'Create an account', ar: 'إنشاء حساب' },
    otp:    otpTitle,
    reset:  { fr: 'Mot de passe oublié', en: 'Forgot password',   ar: 'نسيت كلمة السر' },
  };
  const subtitles: Record<Mode, { fr: string; en: string; ar: string }> = {
    login:  { fr: 'Retrouve tes favoris',         en: 'Find your wishlist again',         ar: 'استرجعي مفضلاتك' },
    signup: { fr: 'Sauvegarde tes favoris',       en: 'Save your wishlist',                ar: 'احفظي مفضلاتك' },
    otp:    otpSubtitle,
    reset:  { fr: 'On t\'envoie un code à 6 chiffres', en: 'We\'ll send you a 6-digit code', ar: 'سنرسل لك رمزًا من 6 أرقام' },
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
            <input className="input2" placeholder={pick(lang, 'Nom complet', 'Full name', 'الاسم الكامل')} value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="input2" type="email" placeholder={pick(lang, 'E-mail', 'E-mail', 'البريد الإلكتروني')} value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="input2" type="password" placeholder={pick(lang, 'Mot de passe (6+ caractères)', 'Password (6+ characters)', 'كلمة السر (6+ أحرف)')} value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} style={{ marginBottom: 10 }} />
          </>
        )}

        {mode === 'login' && (
          <>
            <input className="input2" type="email" placeholder={pick(lang, 'E-mail', 'E-mail', 'البريد الإلكتروني')} value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 10 }} />
            <input className="input2" type="password" placeholder={pick(lang, 'Mot de passe', 'Password', 'كلمة السر')} value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} style={{ marginBottom: 6 }} />
            <p style={{ textAlign: 'right', fontSize: 12, marginBottom: 10 }}>
              <a onClick={() => { setMode('reset'); setErr(''); setInfo(''); }} style={{ opacity: 0.6, cursor: 'pointer', borderBottom: '1px solid currentColor' }}>
                {pick(lang, 'Mot de passe oublié ?', 'Forgot password?', 'نسيت كلمة السر؟')}
              </a>
            </p>
          </>
        )}

        {mode === 'otp' && (
          <>
            <p style={{ fontSize: 13, opacity: 0.7, textAlign: 'center', marginBottom: 14 }}>
              {pick(lang, 'Email envoyé à ', 'Email sent to ', 'تم الإرسال إلى ')}<strong>{email}</strong>
            </p>
            <input className="input2" type="text" inputMode="numeric" maxLength={6} placeholder="••••••" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && submit()} style={{ marginBottom: 10, textAlign: 'center', fontSize: 22, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '8px' }} />
            <p style={{ textAlign: 'center', fontSize: 12, marginBottom: 10 }}>
              {resendIn > 0 ? (
                <span style={{ opacity: 0.5 }}>
                  {pick(lang,
                    `Renvoyer le code dans ${resendIn}s`,
                    `Resend code in ${resendIn}s`,
                    `إعادة الإرسال بعد ${resendIn}ث`)}
                </span>
              ) : (
                <a onClick={resendCode} style={{ opacity: busy ? 0.4 : 0.7, cursor: busy ? 'not-allowed' : 'pointer', borderBottom: '1px solid currentColor' }}>
                  {pick(lang, 'Renvoyer le code', 'Resend code', 'إعادة إرسال الرمز')}
                </a>
              )}
            </p>
          </>
        )}

        {mode === 'reset' && (
          <input className="input2" type="email" placeholder={pick(lang, 'E-mail', 'E-mail', 'البريد الإلكتروني')} value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} style={{ marginBottom: 10 }} />
        )}

        {info && <p style={{ color: 'green', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{info}</p>}
        {err && <p style={{ color: 'var(--clay)', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>{err}</p>}

        <button className="btn2 btn2-dark" style={{ width: '100%', opacity: busy ? 0.5 : 1 }} disabled={busy} onClick={submit}>
          {busy ? '...' : (
            mode === 'login'  ? (lang !== 'ar' ? 'Se connecter →' : 'دخول ←') :
            mode === 'signup' ? (lang !== 'ar' ? 'Créer le compte →' : 'إنشاء ←') :
            mode === 'otp'    ? (lang !== 'ar' ? 'Confirmer →' : 'تأكيد ←') :
                                (lang !== 'ar' ? 'Envoyer le code →' : 'إرسال الرمز ←')
          )}
        </button>

        {mode === 'login' && (
          <p style={{ textAlign: 'center', fontSize: 13, marginTop: 16, opacity: 0.7 }}>
            {lang !== 'ar' ? 'Pas de compte ? ' : 'ما عندكش حساب؟ '}
            <a onClick={() => { setMode('signup'); setErr(''); setInfo(''); }} style={{ borderBottom: '1px solid currentColor', cursor: 'pointer' }}>
              {lang !== 'ar' ? "S'inscrire" : 'سجلي'}
            </a>
          </p>
        )}
        {mode === 'signup' && (
          <p style={{ textAlign: 'center', fontSize: 13, marginTop: 16, opacity: 0.7 }}>
            {lang !== 'ar' ? 'Déjà inscrite ? ' : 'عندك حساب؟ '}
            <a onClick={() => { setMode('login'); setErr(''); setInfo(''); }} style={{ borderBottom: '1px solid currentColor', cursor: 'pointer' }}>
              {lang !== 'ar' ? 'Connexion' : 'دخول'}
            </a>
          </p>
        )}
        {(mode === 'otp' || mode === 'reset') && (
          <p style={{ textAlign: 'center', fontSize: 13, marginTop: 16, opacity: 0.7 }}>
            <a onClick={() => { setMode('login'); setErr(''); setInfo(''); setOtp(''); }} style={{ borderBottom: '1px solid currentColor', cursor: 'pointer' }}>
              ← {lang !== 'ar' ? 'Retour à la connexion' : 'الرجوع لتسجيل الدخول'}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
