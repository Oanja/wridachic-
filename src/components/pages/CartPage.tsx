'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Placeholder } from '@/components/ui/Placeholder';
import { TINTS } from '@/lib/data';
import { TR, pick, pickField } from '@/lib/i18n';
import { useApp } from '@/store/AppContext';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import {
  AUTO_DISCOUNT_PCT, computeAutoDiscount, computeDiscount, readCoupon, writeCoupon,
} from '@/lib/coupon';
import type { Coupon } from '@/lib/types';

export function CartPage() {
  const { lang, cart, user, updateQty, removeItem } = useApp();
  const router = useRouter();
  const t = TR[lang];

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

  const applyCoupon = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code || couponBusy) return;
    setCouponBusy(true);
    setCouponMsg('');
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
        setCoupon(c);
        writeCoupon(c);
        setCouponMsg('✓ ' + pick(lang, 'Code appliqué', 'Code applied', 'تم تطبيق الكود'));
        setCodeInput('');
      }
    } catch {
      setCouponMsg('✕ ' + pick(lang, 'Erreur, réessaie', 'Error, please try again', 'خطأ، عاودي المحاولة'));
    }
    setCouponBusy(false);
  };

  const removeCoupon = () => { setCoupon(null); writeCoupon(null); setCouponMsg(''); };

  if (cart.length === 0) {
    return (
      <div className="page2" style={{ padding: '100px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 72 }}>🛍️</div>
        <h1 className="display" style={{ fontSize: 56, marginTop: 20 }}>{t.cart.empty}</h1>
        <p style={{ opacity: 0.55, margin: '12px 0 28px' }}>{pick(lang, 'Découvre nos collections ↓', 'Discover our collections ↓', 'اكتشفي مجموعاتنا ↓')}</p>
        <Link className="btn2 btn2-dark btn2-lg" href="/shop">{t.cart.continue} <Icon n="arr" s={14} /></Link>
      </div>
    );
  }

  return (
    <div className="page2" style={{ padding: '40px 0 80px' }}>
      <div className="wrap">
        <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 64px)', marginBottom: 32, letterSpacing: '-0.03em' }}>
          {t.cart.title} <span className="mono" style={{ fontSize: 16, opacity: 0.4 }}>({cart.length})</span>
        </h1>
        <div className="cart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40 }}>
          <div>
            {cart.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 16, padding: '20px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden' }}>
                  <Placeholder tint={TINTS[i % TINTS.length]} />
                </div>
                <div>
                  <div className="display" style={{ fontSize: 20 }}>{pickField(lang, item.name, item.nameEn, item.nameAr)}</div>
                  <div className="mono" style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                    {item.size} · <span style={{ display: 'inline-block', width: 10, height: 10, background: item.color, borderRadius: '50%', verticalAlign: 'middle' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--ink)', borderRadius: 999 }}>
                      <button onClick={() => updateQty(i, Math.max(1, item.qty - 1))} style={{ padding: '5px 10px' }}><Icon n="minus" s={10} /></button>
                      <span style={{ minWidth: 22, textAlign: 'center', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{item.qty}</span>
                      <button onClick={() => updateQty(i, item.qty + 1)} style={{ padding: '5px 10px' }}><Icon n="plus" s={10} /></button>
                    </div>
                    <button onClick={() => removeItem(i)} style={{ fontSize: 11, opacity: 0.5, borderBottom: '1px solid currentColor' }}>{t.cart.remove}</button>
                  </div>
                </div>
                <div className="mono" style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{item.price * item.qty}</span> <span style={{ fontSize: 10, opacity: 0.4 }}>MAD</span>
                </div>
              </div>
            ))}
            <Link className="btn2 btn2-outline" style={{ marginTop: 20 }} href="/shop">← {t.cart.continue}</Link>
          </div>

          <aside style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 28, borderRadius: 20, height: 'fit-content' }}>
            <div className="display" style={{ fontSize: 26, marginBottom: 20 }}>{pick(lang, 'Récapitulatif', 'Order summary', 'ملخص الطلب')}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 14 }}>
              <span style={{ opacity: 0.65 }}>{t.cart.subtotal}</span>
              <span className="mono">{subtotal} MAD</span>
            </div>
            {autoDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 14, color: 'var(--lime)' }}>
                <span style={{ opacity: 0.9 }}>
                  ✦ {pick(lang,
                    `Remise 2+ articles (−${AUTO_DISCOUNT_PCT}%)`,
                    `2+ items discount (−${AUTO_DISCOUNT_PCT}%)`,
                    `خصم قطعتين فأكثر (−${AUTO_DISCOUNT_PCT}٪)`)}
                </span>
                <span className="mono">−{autoDiscount} MAD</span>
              </div>
            )}
            {coupon && (
              <div style={{ background: 'rgba(76,175,80,0.18)', border: '1px solid rgba(76,175,80,0.45)', borderRadius: 12, padding: '10px 12px', margin: '10px 0 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#7BCF7E' }}>
                    ✓ {pick(lang, 'Code appliqué', 'Code applied', 'تم تطبيق الكود')}
                  </div>
                  <div className="mono" style={{ fontSize: 11, opacity: 0.85 }}>{coupon.code} · −{discount} MAD</div>
                </div>
                <button onClick={removeCoupon} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: 'rgba(250,246,241,0.1)', border: '1px solid rgba(250,246,241,0.2)', color: 'var(--paper)', cursor: 'pointer' }}>
                  {pick(lang, 'Retirer', 'Remove', 'حذف')}
                </button>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 14 }}>
              <span style={{ opacity: 0.65 }}>{t.cart.delivery}</span>
              <span className="mono">{delivery === 0 ? pick(lang, 'Offerte ✦', 'Free ✦', 'مجاني ✦') : `${delivery} MAD`}</span>
            </div>
            {subtotal < 500 && (
              <div className="mono" style={{ fontSize: 11, color: 'var(--lime)', paddingTop: 4 }}>
                + {500 - subtotal} MAD → {pick(lang, 'livraison offerte', 'free shipping', 'توصيل مجاني')}
              </div>
            )}

            {!coupon && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(250,246,241,0.12)' }}>
                <div className="mono" style={{ fontSize: 10, opacity: 0.55, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {pick(lang, 'Code promo', 'Promo code', 'كود الخصم')}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                    placeholder={pick(lang, 'EX: GIFT-A8K3', 'EX: GIFT-A8K3', 'مثال: GIFT-A8K3')}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(250,246,241,0.2)', background: 'rgba(250,246,241,0.06)', color: 'var(--paper)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
                  />
                  <button onClick={applyCoupon} disabled={couponBusy || !codeInput.trim()} style={{ padding: '8px 14px', borderRadius: 999, background: 'var(--paper)', color: 'var(--ink)', fontSize: 12, fontWeight: 600, opacity: couponBusy || !codeInput.trim() ? 0.5 : 1 }}>
                    {couponBusy ? '…' : pick(lang, 'OK', 'OK', 'تطبيق')}
                  </button>
                </div>
                {couponMsg && <div className="mono" style={{ fontSize: 11, marginTop: 6, opacity: 0.85, color: couponMsg.startsWith('✓') ? 'var(--lime)' : 'var(--clay)' }}>{couponMsg}</div>}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', borderTop: '1px solid rgba(250,246,241,0.18)', marginTop: 12 }}>
              <span className="display" style={{ fontSize: 22 }}>{t.cart.total}</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{total} MAD</span>
            </div>
            <button className="btn2 btn2-clay" style={{ width: '100%', marginTop: 20 }} onClick={() => router.push('/checkout')}>
              {t.cart.checkout} →
            </button>
            <a className="btn2 btn2-wa" href="https://wa.me/212772086545" target="_blank" rel="noopener noreferrer" style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Icon n="wa" s={14} /> WhatsApp
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
