'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import Image from 'next/image';
import { TR, pick, pickField } from '@/lib/i18n';
import { useApp } from '@/store/AppContext';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import {
  AUTO_DISCOUNT_PCT, computeAutoDiscount, computeDiscount, readCoupon, writeCoupon,
} from '@/lib/coupon';
import { cartPayload, trackMetaEvent, readCookie, newEventId } from '@/lib/metaPixel';
import type { Coupon } from '@/lib/types';
import { shouldSkipImageOptimization } from '@/lib/image';

const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda'];

export function CheckoutPage() {
  const { lang, cart, user, clearCart } = useApp();
  const router = useRouter();
  const t = TR[lang];

  // 1 = form (everything on one page now), 4 = success.
  // The old intermediate "3 = review" step was merged into Step 1 so the
  // shopper places the order in a single tap.
  const [step, setStep] = useState<1 | 4>(1);
  const [payment] = useState<'cod'>('cod');
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '', city: 'Casablanca' });
  const [saving, setSaving] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderNum, setOrderNum] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [giftCopied, setGiftCopied] = useState(false);
  const [hp, setHp] = useState('');
  const startedAt = useRef(Date.now());

  const [coupon, setCoupon] = useState<Coupon | null>(() => readCoupon());
  const [codeInput, setCodeInput] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  // Cart-summary collapse state — collapsed by default on mobile (< 901px)
  // so the form is the first thing visible. Desktop keeps it expanded
  // because the grid puts it in a sidebar where space isn't competing.
  const [summaryOpen, setSummaryOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 901;
  });
  // Marketing emails opt-out: checked by default. The customer can
  // untick if they don't want news. We still record their choice on the
  // order (`marketing_consent` column) so we have a verifiable per-order
  // audit trail of who agreed and who declined.
  const [marketingOk, setMarketingOk] = useState(true);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemsCount = cart.reduce((s, i) => s + i.qty, 0);
  const autoDiscount = computeAutoDiscount(subtotal, itemsCount);
  const discount = computeDiscount(subtotal, coupon);
  const totalDiscount = autoDiscount + discount;
  const delivery = subtotal - totalDiscount > 500 ? 0 : 35;
  const total = Math.max(0, subtotal - totalDiscount) + delivery;
  const checkoutTracked = useRef(false);

  useEffect(() => {
    if (checkoutTracked.current || cart.length === 0) return;
    checkoutTracked.current = true;
    trackMetaEvent('InitiateCheckout', cartPayload(cart, total));
  }, [cart, total]);

  // Scroll-to-top on step transition.
  //
  // Default browser behaviour preserves scroll position across in-page
  // re-renders, which is great for accidental scrolls — but bad when we
  // *intentionally* swap content (Step 1 → Step 3 → confirmation).
  // Without this, after clicking "Continuer" the new section opens
  // wherever the button used to be, leaving the user staring at the
  // bottom of a fresh screen and forcing them to scroll up to read it.
  //
  // We only scroll forward — the browser still handles back-button
  // restoration the normal way for the rest of the site.
  useEffect(() => {
    // `auto` (not `smooth`) feels more like "the new page just opened",
    // which is what the user is mentally expecting at this point.
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  // Reaching /checkout with an empty cart used to render a mostly-blank
  // page (form + 0-item summary), which looked broken on mobile. Send the
  // user back to /cart instead. The 500 ms delay leaves room for cart
  // hydration from localStorage on first paint.
  useEffect(() => {
    if ((step as number) === 4) return;
    const id = setTimeout(() => {
      if (cart.length === 0) router.replace('/cart');
    }, 500);
    return () => clearTimeout(id);
  }, [cart.length, step, router]);

  const applyCoupon = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code || couponBusy) return;
    setCouponBusy(true); setCouponMsg('');
    try {
      const sb = getSupabaseBrowser();
      const { data, error } = await sb.rpc('validate_coupon', { p_code: code, p_user_id: user?.id ?? null });
      if (error) throw error;
      if (!data?.valid) {
        const reasons: Record<string, string> = lang === 'ar'
          ? { not_found: 'الكود غير موجود', inactive: 'الكود معطل', expired: 'انتهت صلاحية الكود', already_used: 'الكود مستعمل من قبل', not_for_you: 'هاد الكود ماشي ديالك' }
          : lang === 'en'
            ? { not_found: 'Code not found', inactive: 'Code disabled', expired: 'Code expired', already_used: 'Code already used', not_for_you: 'Code reserved for another customer' }
            : { not_found: 'Code introuvable', inactive: 'Code désactivé', expired: 'Code expiré', already_used: 'Code déjà utilisé', not_for_you: 'Code réservé à un autre client' };
        setCouponMsg('✕ ' + (reasons[data?.reason] ?? pick(lang, 'Code invalide', 'Invalid code', 'كود غير صحيح')));
      } else {
        const c: Coupon = { code, type: data.type, value: Number(data.value) };
        setCoupon(c); writeCoupon(c);
        setCouponMsg('✓ ' + pick(lang, 'Code appliqué', 'Code applied', 'تم تطبيق الكود'));
        setCodeInput('');
      }
    } catch {
      setCouponMsg('✕ ' + pick(lang, 'Erreur, réessaie', 'Error, please try again', 'خطأ، عاودي المحاولة'));
    }
    setCouponBusy(false);
  };
  const removeCoupon = () => { setCoupon(null); writeCoupon(null); setCouponMsg(''); };

  const placeOrder = async () => {
    setSaving(true);
    // Get a server-issued sequential order number. Falls back to the legacy
    // client-side random if the RPC isn't deployed yet (e.g. preview build
    // before migration runs) so checkout never blocks on the migration step.
    const sbForNum = getSupabaseBrowser();
    let num: string;
    try {
      const { data, error } = await sbForNum.rpc('next_order_number');
      if (error || typeof data !== 'string' || !data) throw error || new Error('no-rpc');
      num = data;
    } catch {
      num = 'WC-' + (Math.floor(Math.random() * 900000) + 100000);
    }
    setOrderNum(num);

    const elapsed = Date.now() - startedAt.current;
    const isBot = hp.length > 0 || elapsed < 3000;
    if (isBot) {
      console.warn('[order] suspected bot, skipped insert');
      setSaving(false); setStep(4);
      return;
    }

    const sb = getSupabaseBrowser();
    const itemsData = cart.map((it) => ({
      name: pickField(lang, it.name, it.nameEn, it.nameAr),
      qty: it.qty, size: it.size, color: it.color, price: it.price,
      // Snapshot the product cost at order time so future price/cost edits
      // don't retroactively change historical profit numbers.
      cost: it.cost ?? null,
      image: it.imgFiles?.[0],
    }));
    try {
      const payload: Record<string, unknown> = {
        order_number: num, status: 'nouveau',
        full_name: form.fullName, phone: form.phone, email: form.email,
        address: form.address, city: form.city, payment,
        subtotal, delivery, total, items: itemsData, lang,
        // Per-order audit trail of the marketing opt-in decision. We
        // store the boolean even when there's no email so we can later
        // tell "didn't share email" from "shared email but said no".
        marketing_consent: marketingOk && !!form.email.trim(),
      };
      if (user) payload.user_id = user.id;
      if (autoDiscount > 0) payload.auto_discount = autoDiscount;
      if (coupon) { payload.coupon_code = coupon.code; payload.discount = discount; }
      const { data: inserted, error: insertError } = await sb.from('orders').insert(payload).select('id').single();

      // Hard failure path: the order DID NOT save. Tell the user clearly so
      // they don't think the order went through, and ping the admin via the
      // server-side alert API (Telegram).
      if (insertError || !inserted) {
        const reason = insertError?.message || 'unknown DB error';
        console.error('[order] supabase insert failed', reason);
        // Server-side alert — Supabase RLS failure is critical.
        fetch('/api/notify-checkout-failure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: num,
            fullName: form.fullName,
            phone: form.phone,
            email: form.email,
            city: form.city,
            address: form.address,
            total,
            items: itemsData,
            reason,
          }),
        }).catch(() => {});
        setSaving(false);
        setOrderError(pick(lang,
          "Désolée, une erreur s'est produite. Notre équipe a été notifiée et te contactera sur WhatsApp dans les minutes qui suivent. Tu peux aussi nous écrire directement.",
          'Sorry, an error occurred. Our team has been notified and will contact you on WhatsApp shortly. You can also reach us directly.',
          'عذراً، حدث خطأ. تم إخطار فريقنا وسيتواصل معك على واتساب قريباً. يمكنك أيضاً مراسلتنا مباشرة.'));
        return;
      }

      // Fire-and-forget: push the brand-new order to Google Sheets immediately
      // so the admin doesn't have to hit "Sync Sheets" manually for every new
      // checkout. Failure is silent — the order is already saved in Supabase
      // and the next admin sync will pick it up regardless.
      if (inserted?.id) {
        fetch('/api/sync-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [inserted.id] }),
        }).catch(() => { /* silent */ });
      }

      if (coupon) {
        try { await sb.rpc('consume_coupon', { p_code: coupon.code, p_phone: form.phone, p_order: num }); } catch {}
        writeCoupon(null);
      }

      // Marketing opt-in: save the email (and phone) to the newsletter
      // table only if the customer actively ticked the consent box AND
      // provided an email. Silent failure (duplicates etc.) — never blocks
      // the order.
      if (marketingOk && form.email.trim()) {
        try {
          await sb.from('newsletter_subscribers').insert({
            email: form.email.trim(),
            phone: form.phone.trim() || null,
          });
        } catch { /* duplicate or RLS — fine */ }
      }

      if (itemsCount >= 2) {
        try {
          const { data } = await sb.rpc('issue_gift_coupon', {
            p_name: form.fullName || null, p_phone: form.phone || null,
            p_city: form.city || null, p_order: num,
          });
          if (data) setGiftCode(data);
        } catch {}
      }

      // Generate a single event_id used by BOTH the browser Pixel and
      // the server-side CAPI Purchase event. Meta uses this to merge the
      // two signals and count the conversion exactly once — without it
      // we'd double-count every conversion that wasn't blocked.
      const purchaseEventId = `order-${num}`;
      const fbp = readCookie('_fbp');
      const fbc = readCookie('_fbc');

      // Fire-and-forget email notification (admin + customer). Failure here
      // must NOT block the user — the order is already saved in Supabase.
      // Forwards eventId + fbp/fbc so the server-side CAPI call can
      // deduplicate against the browser Pixel and improve match quality.
      fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: num,
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          total,
          items: itemsData,
          lang,
          eventId: purchaseEventId,
          fbp,
          fbc,
        }),
      }).catch(() => { /* silent — email is non-critical */ });

      trackMetaEvent('Purchase', cartPayload(cart, total), purchaseEventId);
    } catch (e) {
      console.error('[order] unexpected throw', e);
      // Catch-all: network or runtime failure. Don't lose the customer.
      const reason = e instanceof Error ? e.message : 'unknown error';
      fetch('/api/notify-checkout-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: num,
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          city: form.city,
          address: form.address,
          total,
          items: itemsData,
          reason: 'CLIENT_THROW: ' + reason,
        }),
      }).catch(() => {});
      setSaving(false);
      setOrderError(pick(lang,
        "Désolée, une erreur s'est produite. Notre équipe a été notifiée et te contactera sur WhatsApp dans les minutes qui suivent. Tu peux aussi nous écrire directement.",
        'Sorry, an error occurred. Our team has been notified and will contact you on WhatsApp shortly. You can also reach us directly.',
        'عذراً، حدث خطأ. تم إخطار فريقنا وسيتواصل معك على واتساب قريباً. يمكنك أيضاً مراسلتنا مباشرة.'));
      return;
    }
    // Empty the cart immediately so navigating away (or back to /cart)
    // shows the right state, even if the customer never clicks "Retour".
    clearCart();
    setSaving(false); setStep(4);
  };

  const copyGift = async () => {
    try { await navigator.clipboard.writeText(giftCode); setGiftCopied(true); setTimeout(() => setGiftCopied(false), 1800); } catch {}
  };

  const finishOrder = () => { router.push('/'); };

  if (step === 4) {
    return (
      <div className="page2" style={{ padding: '100px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 72 }}>✨</div>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 72px)', marginTop: 20, letterSpacing: '-0.03em' }}>{t.checkout.success}</h1>
        <p style={{ opacity: 0.65, marginTop: 12, maxWidth: 480, margin: '12px auto 28px' }}>{t.checkout.successDesc}</p>
        <div style={{ background: 'var(--paper-2)', padding: 24, borderRadius: 16, maxWidth: 380, margin: '0 auto 28px', textAlign: lang === 'ar' ? 'right' : 'left' }}>
          <div className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>{pick(lang, 'Numéro de commande', 'Order number', 'رقم الطلب')}</div>
          <div className="display" style={{ fontSize: 26, marginTop: 4 }}>{orderNum}</div>
          <div className="mono" style={{ fontSize: 13, marginTop: 8, opacity: 0.7 }}>{total} MAD · {t.checkout.cod}</div>
        </div>

        {giftCode && (
          <div style={{ background: 'linear-gradient(135deg, var(--clay), #e89888)', color: '#fff', padding: 24, borderRadius: 18, maxWidth: 420, margin: '0 auto 28px', boxShadow: '0 12px 32px rgba(196,116,107,0.25)' }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>🎁</div>
            <div className="display" style={{ fontSize: 22, lineHeight: 1.2, marginBottom: 6 }}>
              {pick(lang, 'Ton code cadeau −10%', 'Your −10% gift code', 'كود الهدية ديالك −10%')}
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 14, lineHeight: 1.5 }}>
              {pick(lang,
                'Merci pour ta confiance ! Garde ce code pour ta prochaine commande.',
                'Thank you for your trust! Save this code for your next order.',
                'شكراً على ثقتك! احتفظي بهاد الكود لطلبيتك القادمة.')}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.18)', padding: '10px 14px', borderRadius: 12 }}>
              <span className="mono" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.06em' }}>{giftCode}</span>
              <button onClick={copyGift} style={{ padding: '6px 12px', borderRadius: 999, background: '#fff', color: 'var(--clay)', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                {giftCopied ? pick(lang, '✓ Copié', '✓ Copied', '✓ تنسخ') : pick(lang, '📋 Copier', '📋 Copy', '📋 نسخ')}
              </button>
            </div>
            <div className="mono" style={{ fontSize: 10, opacity: 0.7, marginTop: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {pick(lang, 'Valable 90 jours · usage unique', 'Valid 90 days · single use', 'صالح 90 يوم · مرة واحدة')}
            </div>
          </div>
        )}

        <button className="btn2 btn2-dark btn2-lg" onClick={finishOrder}>← {pick(lang, 'Retour boutique', 'Back to shop', 'العودة للمتجر')}</button>
      </div>
    );
  }

  const valid = form.fullName.trim() && /^[0-9]{9,10}$/.test(form.phone.trim()) && form.address.trim() && form.city.trim();

  // Empty cart but redirect hasn't fired yet → show a friendly message
  // instead of an empty form so the user understands why nothing's there.
  if (cart.length === 0 && (step as number) !== 4) {
    return (
      <div className="page2" style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🛒</div>
        <h1 className="display" style={{ fontSize: 28, marginBottom: 8, letterSpacing: '-0.02em' }}>
          {pick(lang, 'Panier vide', 'Empty cart', 'سلتك فارغة')}
        </h1>
        <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          {pick(lang,
            'Ajoute des articles avant de passer commande.',
            'Add some items before placing an order.',
            'زيدي قطع قبل ما تتممي الطلب.')}
        </p>
        <button onClick={() => router.push('/shop')} className="btn2 btn2-dark btn2-lg">
          {pick(lang, 'Découvrir la boutique', 'Discover the shop', 'اكتشفي المتجر')} →
        </button>
      </div>
    );
  }

  return (
    <div className="page2" style={{ padding: '40px 0 80px' }}>
      <div className="wrap" style={{ maxWidth: 1100 }}>
        {/* fontSize starts at 26px on small phones so "Finaliser la
            commande" never wraps to two lines, scales up smoothly on
            larger viewports. whiteSpace:nowrap as a belt-and-suspenders
            guard on phones where 26px still barely fits. */}
        <h1 className="display" style={{ fontSize: 'clamp(30px, 7vw, 56px)', textAlign: 'center', marginBottom: 20, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>{t.checkout.title}</h1>

        <div className="checkout-grid">
          {/* Aside is rendered FIRST so it naturally shows on top on mobile
              (block layout). On desktop the CSS grid swaps the order back. */}
          <aside style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 24, borderRadius: 16, height: 'fit-content' }}>
            {/* Tappable header — on mobile, click to expand/collapse the
                summary. On desktop the chevron is hidden and the summary
                is always open (handled in CSS via .checkout-summary-toggle). */}
            <button
              type="button"
              className="checkout-summary-toggle"
              onClick={() => setSummaryOpen((v) => !v)}
              aria-expanded={summaryOpen}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', background: 'transparent', border: 'none', color: 'inherit',
                padding: 0, marginBottom: summaryOpen ? 14 : 0, cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div className="display" style={{ fontSize: 20 }}>
                {/* Show total quantity (e.g. 7) not the count of
                    distinct products (2) — a customer with 4 dresses +
                    3 caftans expects to read "7 articles", not "2". */}
                🛍️ {itemsCount} {pick(lang, itemsCount > 1 ? 'articles' : 'article', itemsCount > 1 ? 'items' : 'item', itemsCount > 1 ? 'قطع' : 'قطعة')}
                <span className="mono" style={{ fontSize: 13, opacity: 0.65, marginLeft: 10, fontWeight: 400 }}>
                  · {total} MAD
                </span>
              </div>
              <span style={{ fontSize: 14, opacity: 0.7, transition: 'transform 0.2s', transform: summaryOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                ▼
              </span>
            </button>
            {/* class-based instead of inline display:none so the
                desktop media query in CSS can force this back open even
                if the user previously collapsed it on mobile then
                resized the window. Inline styles always win over CSS. */}
            <div className={`checkout-summary-content${summaryOpen ? '' : ' is-collapsed'}`}>
            {cart.map((item, i) => {
              const src = item.imgFiles?.[0];
              const qtyLabel = item.qty > 1 ? ` × ${item.qty}` : '';
              return (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13, alignItems: 'center', paddingBottom: 12, borderBottom: i < cart.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
                    {src && (
                      <Image src={src} alt="" fill sizes="56px" style={{ objectFit: 'cover' }} unoptimized={shouldSkipImageOptimization(src)} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                      {pickField(lang, item.name, item.nameEn, item.nameAr)}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11, opacity: 0.75 }}>
                      <span style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 7px', borderRadius: 999 }}>
                        {pick(lang, 'Taille', 'Size', 'القياس')} {item.size}
                      </span>
                      {item.color && (
                        <span style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 7px', borderRadius: 999 }}>
                          {item.color}
                        </span>
                      )}
                      <span style={{ background: 'rgba(255,255,255,0.18)', padding: '2px 7px', borderRadius: 999, fontWeight: 600 }} className="mono">
                        × {item.qty}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{item.price * item.qty} <span style={{ fontSize: 10, opacity: 0.6 }}>MAD</span></div>
                    {item.qty > 1 && (
                      <div className="mono" style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{item.price} × {item.qty}</div>
                    )}
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 12, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }} className="mono">
                <span style={{ opacity: 0.7 }}>subtotal</span>
                <span>{subtotal} MAD</span>
              </div>
              {autoDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#3D7A2C', fontWeight: 500 }} className="mono">
                  <span>2+ articles (−{AUTO_DISCOUNT_PCT}%)</span>
                  <span>−{autoDiscount} MAD</span>
                </div>
              )}
              {coupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'var(--clay)' }} className="mono">
                  <span style={{ opacity: 0.85 }}>
                    code ({coupon.code})
                    <button onClick={removeCoupon} style={{ marginLeft: 6, fontSize: 9, opacity: 0.7, background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
                  </span>
                  <span>−{discount} MAD</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }} className="mono">
                <span style={{ opacity: 0.7 }}>delivery</span>
                <span>{delivery === 0 ? 'free' : `${delivery} MAD`}</span>
              </div>

              {!coupon && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
                  <div className="mono" style={{ fontSize: 9, opacity: 0.5, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {pick(lang, 'Code promo', 'Promo code', 'كود الخصم')}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                      placeholder={pick(lang, 'EX: GIFT-A8K3', 'EX: GIFT-A8K3', 'مثال: GIFT-A8K3')}
                      style={{ flex: 1, padding: '7px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'var(--paper)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
                    />
                    <button onClick={applyCoupon} disabled={couponBusy || !codeInput.trim()} style={{ padding: '7px 12px', borderRadius: 999, background: 'var(--paper)', color: 'var(--ink)', fontSize: 11, fontWeight: 600, opacity: couponBusy || !codeInput.trim() ? 0.5 : 1 }}>
                      {couponBusy ? '…' : 'OK'}
                    </button>
                  </div>
                  {couponMsg && <div className="mono" style={{ fontSize: 10, marginTop: 5, color: couponMsg.startsWith('✓') ? '#4CAF50' : 'var(--clay)' }}>{couponMsg}</div>}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '12px 0 0', borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 12 }}>
                <span className="display" style={{ fontSize: 20 }}>
                  total
                  <span className="mono" style={{ fontSize: 12, opacity: 0.6, marginLeft: 8, fontWeight: 400 }}>
                    ({itemsCount} {pick(lang, itemsCount > 1 ? 'articles' : 'article', itemsCount > 1 ? 'items' : 'item', itemsCount > 1 ? 'قطع' : 'قطعة')})
                  </span>
                </span>
                <span className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{total} MAD</span>
              </div>
            </div>
            </div>
          </aside>

          <div className="checkout-main">
            {step === 1 && (
              <div>
                <h2 className="display" style={{ fontSize: 30, marginBottom: 20 }}>{t.checkout.shipping}</h2>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(['fullName', 'phone', 'email', 'address'] as const).map((f) => {
                    const required = f !== 'email';
                    return (
                      <div key={f}>
                        <label className="mono" style={{ fontSize: 12, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                          {t.checkout[f]} {required && <span style={{ color: 'var(--clay)', fontWeight: 700 }}>*</span>}
                        </label>
                        <input
                          className="input2"
                          value={form[f]}
                          onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                          style={{ marginTop: 4 }}
                          type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'}
                          required={required}
                        />
                      </div>
                    );
                  })}
                  <div>
                    <label className="mono" style={{ fontSize: 12, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                      {t.checkout.city} <span style={{ color: 'var(--clay)', fontWeight: 700 }}>*</span>
                    </label>
                    <select className="input2" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ marginTop: 4 }}>
                      {CITIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  {/* Honeypot trap for bots. We use the standard a11y
                      "visually-hidden" technique instead of `left:-9999px`
                      because in RTL mode the latter creates a 10000-px
                      wide overflow box, which forces mobile browsers to
                      scale the entire page down to fit. */}
                  <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>
                    <label>Site web (laisser vide)</label>
                    <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
                  </div>
                </div>
                {!valid && (form.fullName || form.phone || form.address) && (
                  <p className="mono" style={{ fontSize: 11, color: 'var(--clay)', marginTop: 12 }}>
                    {pick(lang,
                      '⚠ Remplis tous les champs obligatoires (téléphone valide).',
                      '⚠ Please fill all required fields (valid phone).',
                      '⚠ كملي جميع الحقول الإجبارية (رقم هاتف صحيح).')}
                  </p>
                )}

                {/* Email marketing opt-in — only meaningful if the customer
                    actually provided an email. We render the checkbox
                    regardless so the UI is stable, but disable it when
                    no email is present. */}
                <label
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    marginTop: 18, padding: '14px 16px',
                    background: 'var(--paper-2)', borderRadius: 12,
                    cursor: form.email.trim() ? 'pointer' : 'not-allowed',
                    opacity: form.email.trim() ? 1 : 0.5,
                    fontSize: 13, lineHeight: 1.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={marketingOk && !!form.email.trim()}
                    onChange={(e) => setMarketingOk(e.target.checked)}
                    disabled={!form.email.trim()}
                    style={{ width: 18, height: 18, marginTop: 1, accentColor: 'var(--ink)', cursor: 'inherit', flexShrink: 0 }}
                  />
                  <span>
                    {pick(lang,
                      'Je souhaite recevoir les nouveautés et offres exclusives WridaChic par email.',
                      'I want to receive WridaChic news and exclusive offers by email.',
                      'بغيت نتوصل بالجديد والعروض الحصرية ديال WridaChic عبر الإيميل.')}
                  </span>
                </label>

                {/* Payment method — folded directly into the main checkout
                    (one-page pattern like Shopify, Stripe, Apple Pay).
                    There's only one option (COD) so we show it as a
                    pre-selected radio with a friendly explanation
                    instead of forcing the user through a second step. */}
                <div style={{ marginTop: 28 }}>
                  <h3 className="display" style={{ fontSize: 22, marginBottom: 12 }}>
                    {pick(lang, 'Paiement', 'Payment', 'الدفع')}
                  </h3>
                  <div style={{ background: 'var(--paper-2)', padding: '16px 18px', borderRadius: 14, border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ink)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        💵 {t.checkout.cod}
                      </div>
                      <div style={{ opacity: 0.7, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>
                        {pick(lang,
                          'Tu paies en espèces quand le livreur te remet ton colis. Aucune avance, aucun risque.',
                          'You pay in cash when the courier hands you the package. No advance, no risk.',
                          'كاتخلصي كاش ملي السائق كيوصلك الكولي. بلا تسبيق، بلا خطر.')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline error UI — shown right above the "Place order"
                    button when the Supabase insert fails. Includes a
                    direct WhatsApp escape hatch so the customer can still
                    complete their order manually if our backend hiccups. */}
                {orderError && (
                  <div style={{ background: 'rgba(255,138,128,0.12)', border: '1px solid rgba(198,40,40,0.3)', color: '#C62828', padding: 14, borderRadius: 12, marginTop: 20, fontSize: 13, lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>⚠ {pick(lang, 'Problème technique', 'Technical issue', 'مشكل تقني')}</div>
                    <div style={{ marginBottom: 10 }}>{orderError}</div>
                    <a
                      href={`https://wa.me/212773847986?text=${encodeURIComponent(
                        pick(lang,
                          `Bonjour, j'ai eu un problème pour passer ma commande sur le site (panier de ${total} MAD).`,
                          `Hi, I had an issue placing my order on the site (cart of ${total} MAD).`,
                          `السلام، عندي مشكل فإتمام الطلب فالسيت (سلة ${total} درهم).`)
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#25D366', color: '#fff', padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                    >
                      📱 {pick(lang, 'Nous contacter sur WhatsApp', 'Contact us on WhatsApp', 'تواصلي معنا واتساب')}
                    </a>
                  </div>
                )}

                {/* Compact action summary — Shopify pattern: surface the
                    promo button + total right next to the call-to-action
                    so customers never have to scroll to recheck what
                    they're about to validate. Mobile-only: on desktop the
                    sidebar already shows the same info. */}
                <div className="checkout-action-block" style={{ marginTop: 24 }}>
                  {/* Toggle to expose the existing promo input (top
                      summary). When expanded scrolls the user up to the
                      coupon field so they can type without confusion. */}
                  {!coupon && (
                    <button
                      type="button"
                      onClick={() => { setSummaryOpen(true); setTimeout(() => { document.querySelector('input[placeholder^="EX:"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 16px', background: 'var(--paper)',
                        border: '1.5px solid rgba(15,14,13,0.22)', borderRadius: 999,
                        fontSize: 13, fontWeight: 500, color: 'var(--ink)',
                        cursor: 'pointer', marginBottom: 12,
                      }}
                    >
                      🏷️ {pick(lang, 'Ajouter une réduction', 'Add a discount', 'إضافة خصم')}
                    </button>
                  )}

                  {/* Mini total card — thumbnail + count + total + chevron
                      to expand the full top summary. Mirrors the Shopify /
                      Stripe pattern customers already recognise. */}
                  <button
                    type="button"
                    onClick={() => { setSummaryOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                      background: 'var(--paper-2)', border: '1.5px solid var(--line)',
                      borderRadius: 14, padding: '12px 16px', cursor: 'pointer',
                      textAlign: 'start', color: 'inherit',
                    }}
                  >
                    {cart[0]?.imgFiles?.[0] && (
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, background: 'rgba(0,0,0,0.05)' }}>
                        <Image src={cart[0].imgFiles[0]} alt="" fill sizes="44px" style={{ objectFit: 'cover' }} unoptimized={shouldSkipImageOptimization(cart[0].imgFiles[0])} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="display" style={{ fontSize: 17, lineHeight: 1.1 }}>
                        {pick(lang, 'Total', 'Total', 'المجموع')}
                      </div>
                      <div className="mono" style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                        {itemsCount} {pick(lang, itemsCount > 1 ? 'articles' : 'article', itemsCount > 1 ? 'items' : 'item', itemsCount > 1 ? 'قطع' : 'قطعة')}
                      </div>
                    </div>
                    {/* Force LTR on the price so it always reads "364 MAD"
                        and never gets bidi-flipped to "MAD 364" in Arabic. */}
                    <div className="mono" dir="ltr" style={{ fontSize: 18, fontWeight: 700 }}>{total} MAD</div>
                    <span style={{ fontSize: 12, opacity: 0.5 }}>▾</span>
                  </button>
                </div>

                {/* Single CTA — places the order directly (one-page
                    checkout). Goes from Step 1 straight to the success
                    screen, skipping the old review step entirely. */}
                <button
                  className="btn2 btn2-dark btn2-lg"
                  style={{ marginTop: 18, opacity: valid && !saving ? 1 : 0.5, cursor: valid && !saving ? 'pointer' : 'not-allowed', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  disabled={!valid || saving}
                  onClick={() => { if (valid && !saving) { setOrderError(''); placeOrder(); } }}
                >
                  {saving ? (
                    '...'
                  ) : orderError ? (
                    pick(lang, 'Réessayer', 'Retry', 'إعادة المحاولة')
                  ) : (
                    <>
                      {/* Green pulsing check chip — eye-catching call-
                          to-action that says "you're one tap from done"
                          without the legalese vibe of a padlock icon. */}
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 24, height: 24, borderRadius: '50%',
                          background: '#4CAF50', color: '#fff',
                          fontSize: 14, fontWeight: 800, lineHeight: 1,
                          boxShadow: '0 0 0 4px rgba(76,175,80,0.25)',
                        }}
                      >✓</span>
                      <span>{t.checkout.place} · {total} MAD</span>
                    </>
                  )}
                </button>
                <p style={{ marginTop: 10, fontSize: 11, opacity: 0.55, textAlign: 'center' }}>
                  {pick(lang,
                    'En confirmant, tu acceptes nos conditions et notre politique de confidentialité.',
                    'By confirming, you accept our terms and privacy policy.',
                    'بالتأكيد، كتوافقي على شروطنا وسياسة الخصوصية.')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Legal footer — standard trust signals (Shopify pattern). Shows
            on every step so the customer can review policies at any time
            before placing the order. */}
        {(step as number) !== 4 && (
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', gap: '8px 20px', justifyContent: 'center', fontSize: 12 }}>
            <a href="/returns" style={{ color: 'var(--ink)', opacity: 0.7, textDecoration: 'underline' }}>
              {pick(lang, 'Politique de remboursement', 'Refund policy', 'سياسة الاسترداد')}
            </a>
            <a href="/privacy" style={{ color: 'var(--ink)', opacity: 0.7, textDecoration: 'underline' }}>
              {pick(lang, 'Politique de confidentialité', 'Privacy policy', 'سياسة الخصوصية')}
            </a>
            <a href="/terms" style={{ color: 'var(--ink)', opacity: 0.7, textDecoration: 'underline' }}>
              {pick(lang, 'Conditions d\'utilisation', 'Terms of use', 'شروط الاستخدام')}
            </a>
            <a href="/contact" style={{ color: 'var(--ink)', opacity: 0.7, textDecoration: 'underline' }}>
              {pick(lang, 'Contact', 'Contact', 'تواصل')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
