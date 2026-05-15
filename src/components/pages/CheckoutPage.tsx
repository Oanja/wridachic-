'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Placeholder } from '@/components/ui/Placeholder';
import { TINTS } from '@/lib/data';
import { TR, pick, pickField } from '@/lib/i18n';
import { useApp } from '@/store/AppContext';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import {
  AUTO_DISCOUNT_PCT, computeAutoDiscount, computeDiscount, readCoupon, writeCoupon,
} from '@/lib/coupon';
import { cartPayload, trackMetaEvent } from '@/lib/metaPixel';
import type { Coupon } from '@/lib/types';

const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda'];

export function CheckoutPage() {
  const { lang, cart, user, clearCart } = useApp();
  const router = useRouter();
  const t = TR[lang];

  const [step, setStep] = useState<1 | 3 | 4>(1);
  const [payment] = useState<'cod'>('cod');
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '', city: 'Casablanca' });
  const [saving, setSaving] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [giftCopied, setGiftCopied] = useState(false);
  const [hp, setHp] = useState('');
  const startedAt = useRef(Date.now());

  const [coupon, setCoupon] = useState<Coupon | null>(() => readCoupon());
  const [codeInput, setCodeInput] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);

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
    const num = 'WC-' + (Math.floor(Math.random() * 900000) + 100000);
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
      image: it.imgFiles?.[0],
    }));
    try {
      const payload: Record<string, unknown> = {
        order_number: num, status: 'nouveau',
        full_name: form.fullName, phone: form.phone, email: form.email,
        address: form.address, city: form.city, payment,
        subtotal, delivery, total, items: itemsData, lang,
      };
      if (user) payload.user_id = user.id;
      if (autoDiscount > 0) payload.auto_discount = autoDiscount;
      if (coupon) { payload.coupon_code = coupon.code; payload.discount = discount; }
      await sb.from('orders').insert(payload);

      if (coupon) {
        try { await sb.rpc('consume_coupon', { p_code: coupon.code, p_phone: form.phone, p_order: num }); } catch {}
        writeCoupon(null);
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

      // Fire-and-forget email notification (admin + customer). Failure here
      // must NOT block the user — the order is already saved in Supabase.
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
        }),
      }).catch(() => { /* silent — email is non-critical */ });

      trackMetaEvent('Purchase', cartPayload(cart, total));
    } catch (e) { console.error('Supabase:', e); }
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

  return (
    <div className="page2" style={{ padding: '40px 0 80px' }}>
      <div className="wrap" style={{ maxWidth: 1100 }}>
        <h1 className="display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', textAlign: 'center', marginBottom: 20, letterSpacing: '-0.03em' }}>{t.checkout.title}</h1>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, flexWrap: 'wrap' }}>
          {[t.checkout.shipping, t.checkout.review].map((s, i) => {
            const stepIdx = i === 0 ? 1 : 3;
            const passed = step > stepIdx;
            const active = step === stepIdx;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: passed ? 'var(--ink)' : active ? 'var(--clay)' : 'var(--muted)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', background: passed ? 'var(--ink)' : 'transparent', color: passed ? 'var(--paper)' : 'inherit' }}>
                  {passed ? <Icon n="check" s={10} /> : `0${i + 1}`}
                </div>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s}</span>
                {i < 1 && <span style={{ width: 20, height: 1, background: 'currentColor', opacity: 0.25 }} />}
              </div>
            );
          })}
        </div>

        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40 }}>
          <div>
            {step === 1 && (
              <div>
                <h2 className="display" style={{ fontSize: 30, marginBottom: 20 }}>{t.checkout.shipping}</h2>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(['fullName', 'phone', 'email', 'address'] as const).map((f) => {
                    const required = f !== 'email';
                    return (
                      <div key={f}>
                        <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>
                          {t.checkout[f]} {required && <span style={{ color: 'var(--clay)' }}>*</span>}
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
                    <label className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>
                      {t.checkout.city} <span style={{ color: 'var(--clay)' }}>*</span>
                    </label>
                    <select className="input2" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={{ marginTop: 4 }}>
                      {CITIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
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
                <button
                  className="btn2 btn2-dark btn2-lg"
                  style={{ marginTop: 16, opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'not-allowed' }}
                  disabled={!valid}
                  onClick={() => valid && setStep(3)}
                >{pick(lang, 'Continuer', 'Continue', 'متابعة')} →</button>
              </div>
            )}
            {step === 3 && (
              <div>
                <h2 className="display" style={{ fontSize: 30, marginBottom: 20 }}>{t.checkout.review}</h2>
                <div style={{ background: 'var(--paper-2)', padding: 18, borderRadius: 14, marginBottom: 10 }}>
                  <div className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{t.checkout.shipping}</div>
                  <div>{form.fullName || '—'}</div>
                  <div style={{ opacity: 0.6, fontSize: 13 }}>{form.address || '—'}, {form.city} · {form.phone || '—'}</div>
                </div>
                <div style={{ background: 'var(--paper-2)', padding: 18, borderRadius: 14, marginBottom: 10 }}>
                  <div className="mono" style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{pick(lang, 'Paiement', 'Payment', 'الدفع')}</div>
                  <div>{t.checkout.cod}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn2 btn2-outline" onClick={() => setStep(1)}>← {pick(lang, 'Retour', 'Back', 'رجوع')}</button>
                  <button className="btn2 btn2-clay btn2-lg" style={{ flex: 1 }} onClick={placeOrder} disabled={saving}>
                    {saving ? '...' : t.checkout.place + ' ✨'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 24, borderRadius: 16, height: 'fit-content' }}>
            <div className="display" style={{ fontSize: 20, marginBottom: 14 }}>{cart.length} {pick(lang, 'articles', 'items', 'قطعة')}</div>
            {cart.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 13 }}>
                <div style={{ width: 44, aspectRatio: '3/4', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                  <Placeholder tint={TINTS[i % TINTS.length]} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{pickField(lang, item.name, item.nameEn, item.nameAr)}</div>
                  <div className="mono" style={{ fontSize: 10, opacity: 0.5 }}>{item.size} · x{item.qty}</div>
                </div>
                <div className="mono" style={{ fontWeight: 600 }}>{item.price * item.qty}</div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 12, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }} className="mono">
                <span style={{ opacity: 0.5 }}>subtotal</span>
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
                <span style={{ opacity: 0.5 }}>delivery</span>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 12 }}>
                <span className="display" style={{ fontSize: 20 }}>total</span>
                <span className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{total} MAD</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
