'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/store/AppContext';
import { pick } from '@/lib/i18n';
import { getSupabaseBrowser } from '@/lib/supabase/client';

// Routes where the newsletter popup MUST NEVER appear — the user is in the
// middle of a purchase (cart / checkout) or already inside their account
// area, and a full-screen overlay there would just kill the conversion.
const SUPPRESS_ON = ['/cart', '/checkout', '/account', '/admin'];

export function NewsletterPopup() {
  const { lang } = useApp();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('wc2-newsletter-seen')) return;
    if (pathname && SUPPRESS_ON.some((p) => pathname.startsWith(p))) return;
    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      // Need BOTH a meaningful scroll (≥ 200 px) AND being past the half
      // point. Without the scroll-distance guard, a short page where the
      // initial viewport already covers >50% triggers the popup on first
      // load — which is what was hiding /checkout on mobile.
      if (window.scrollY >= 200 && scrolled / total >= 0.5) {
        setOpen(true);
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  // If the user navigates INTO a suppressed route while the popup is open,
  // close it. Prevents an open popup from following them to /checkout.
  useEffect(() => {
    if (open && pathname && SUPPRESS_ON.some((p) => pathname.startsWith(p))) {
      setOpen(false);
    }
  }, [pathname, open]);

  const close = () => {
    localStorage.setItem('wc2-newsletter-seen', '1');
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = email.trim();
    const p2 = phone.trim();
    if ((!e2 && !p2) || busy) return;
    setBusy(true);
    try {
      const sb = getSupabaseBrowser();
      const row: Record<string, string> = {};
      if (e2) row.email = e2;
      if (p2) row.phone = p2;
      await sb.from('newsletter_subscribers').insert(row);
    } catch {
      /* fail silently */
    }
    localStorage.setItem('wc2-newsletter-seen', '1');
    if (e2) localStorage.setItem('wc2-newsletter-email', e2);
    if (p2) localStorage.setItem('wc2-newsletter-phone', p2);
    setDone(true);
    setBusy(false);
    setTimeout(() => setOpen(false), 3200);
  };

  if (!open) return null;

  return (
    <div
      onClick={close}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,13,0.6)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fIn 0.3s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--paper)', padding: 36, borderRadius: 22, width: '100%', maxWidth: 440, position: 'relative', textAlign: 'center', boxShadow: '0 30px 80px rgba(15,14,13,0.35)' }}
      >
        <button
          onClick={close}
          style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'var(--paper-2)', border: 'none', cursor: 'pointer', fontSize: 14 }}
          aria-label="Close"
        >✕</button>
        <div className="mono" style={{ fontSize: 11, opacity: 0.55, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
          {pick(lang, '✦ Offre fidélité ✦', '✦ Loyalty offer ✦', '✦ عرض خاص ✦')}
        </div>
        <h2 className="display" style={{ fontSize: 26, lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.02em' }}>
          {lang === 'ar' ? (
            <>اشتري <em>قطعتين</em> فأكثر → <em>−10%</em> مباشرة + كود هدية</>
          ) : lang === 'en' ? (
            <>Buy <em>2 items</em> or more → <em>−10%</em> instantly + a gift code</>
          ) : (
            <>Achète <em>2 articles</em> et plus → <em>−10%</em> direct + un code cadeau</>
          )}
        </h2>
        <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 20, lineHeight: 1.55 }}>
          {pick(lang,
            "Le prix se réduit automatiquement de 10% dans ton panier, et tu reçois un code cadeau pour ta prochaine commande. Laisse ton e-mail ou ton numéro pour recevoir nos prochaines offres.",
            'The price drops 10% automatically in your cart, and you receive a gift code for your next order. Leave your e-mail or phone to get our upcoming offers.',
            'الثمن كينقص تلقائيا بـ10٪ ف السلة، وفنفس الوقت كتوصلك كود هدية لطلبيتك القادمة. خلي إيميلك أو رقمك باش توصلوك العروض الجاية.')}
        </p>
        {done ? (
          <div style={{ padding: '18px 0', color: 'var(--clay)', fontSize: 14, fontWeight: 500, lineHeight: 1.6 }}>
            {pick(lang, '✓ Merci ! Tu es dans la liste.', '✓ Thanks! You\'re on the list.', '✓ شكراً! دخلتي اللائحة.')}
          </div>
        ) : (
          <form onSubmit={submit}>
            <input
              className="input2" type="email"
              placeholder={pick(lang, 'Ton e-mail (optionnel)', 'Your e-mail (optional)', 'بريدك الإلكتروني (اختياري)')}
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ marginBottom: 8, textAlign: 'center' }}
            />
            <input
              className="input2" type="tel"
              placeholder={pick(lang, 'Ton numéro (optionnel)', 'Your phone (optional)', 'رقم هاتفك (اختياري)')}
              value={phone} onChange={(e) => setPhone(e.target.value)}
              style={{ marginBottom: 12, textAlign: 'center' }}
            />
            <button
              type="submit" className="btn2 btn2-dark"
              disabled={busy || (!email.trim() && !phone.trim())}
              style={{ width: '100%', opacity: busy ? 0.5 : 1 }}
            >
              {busy ? '…' : pick(lang, "Je m'inscris →", 'Sign up →', 'سجلي ←')}
            </button>
          </form>
        )}
        <p className="mono" style={{ fontSize: 10, opacity: 0.5, marginTop: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {pick(lang, 'Pas de spam. Désinscription en 1 clic.', 'No spam. 1-click unsubscribe.', 'بدون سبام. إلغاء الاشتراك بضغطة.')}
        </p>
      </div>
    </div>
  );
}
