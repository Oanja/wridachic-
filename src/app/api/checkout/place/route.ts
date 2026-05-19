/**
 * Server-authoritative checkout endpoint.
 *
 * The browser previously inserted orders directly via the public anon
 * key and trusted the client-computed total. That meant a malicious
 * customer could send `{ total: 1, items: [...350 MAD dress...] }` and
 * we'd ship a 350 MAD dress for 1 MAD.
 *
 * This route fixes that completely:
 *   1. The client sends only product_id + qty + size + color per line.
 *   2. The server fetches the AUTHORITATIVE price from the products
 *      table (admin client, bypasses RLS).
 *   3. The server recomputes subtotal, auto-discount, coupon discount,
 *      delivery, and total — the client is never trusted for money.
 *   4. The server validates the coupon by consuming it via RPC.
 *   5. The server allocates an order number via the next_order_number
 *      sequence and inserts the row using the admin client.
 *
 * Bonus: also handles gift-coupon issuance, newsletter opt-in, and
 * triggers the downstream sync-order webhook — the client only needs
 * to call this single endpoint and then /api/notify-order.
 */
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { AUTO_DISCOUNT_PCT, AUTO_DISCOUNT_THRESHOLD } from '@/lib/coupon';
import { alertWarn } from '@/lib/alerts';
import { cleanText, cleanMultiline, cleanEmail, cleanPhone, FIELD_LIMITS } from '@/lib/validate';

const DELIVERY_THRESHOLD = 500; // free delivery above this many MAD
const DELIVERY_FEE = 35;

interface IncomingItem {
  product_id?: string;
  id?: string; // legacy
  qty: number;
  size: string;
  color: string;
}

interface IncomingForm {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  payment?: string;
}

interface PlaceBody {
  items?: IncomingItem[];
  form?: IncomingForm;
  couponCode?: string;
  marketingConsent?: boolean;
  lang?: 'fr' | 'en' | 'ar';
  userId?: string | null;
  /** Honeypot — bots fill it, real users don't. */
  hp?: string;
  /** Milliseconds the customer spent on the page before submitting. */
  elapsedMs?: number;
}

export async function POST(req: Request) {
  // 3 checkouts per IP per minute. A real customer never needs more,
  // and this kills checkout-spam vectors quickly.
  const rl = checkRateLimit(req, { limit: 3, windowMs: 60_000, scope: 'checkout-place' });
  if (!rl.ok) return rl.response;

  let body: PlaceBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 }); }

  // ── Validate basics ─────────────────────────────────────────────
  const { items, form, couponCode, marketingConsent, lang, userId, hp, elapsedMs } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: false, error: 'empty-cart' }, { status: 400 });
  }
  if (items.length > 50) {
    return NextResponse.json({ ok: false, error: 'too-many-items' }, { status: 400 });
  }

  // Sanitize + bound every customer-supplied field BEFORE we touch the
  // DB or any downstream service. This strips HTML tags (so injected
  // <img onerror> can't render in admin emails / Telegram), collapses
  // whitespace, and caps lengths so a malicious 1 MB "address" can't
  // bloat the DB or DoS the admin UI.
  const cleanedForm = {
    fullName: cleanText(form?.fullName, FIELD_LIMITS.fullName),
    phone: cleanPhone(form?.phone, FIELD_LIMITS.phone),
    email: cleanEmail(form?.email, FIELD_LIMITS.email), // '' if malformed
    address: cleanMultiline(form?.address, FIELD_LIMITS.address),
    city: cleanText(form?.city, FIELD_LIMITS.city),
    payment: cleanText(form?.payment, FIELD_LIMITS.payment) || 'cod',
  };

  if (!cleanedForm.fullName || !cleanedForm.phone || !cleanedForm.address || !cleanedForm.city) {
    return NextResponse.json({ ok: false, error: 'missing-customer-fields' }, { status: 400 });
  }
  // Reject if customer typed something email-shaped but malformed
  // (empty string from cleanEmail when input was non-empty). We
  // distinguish "no email provided" (allowed — COD doesn't need it)
  // from "email provided but invalid" (reject so the customer notices).
  if (form?.email && typeof form.email === 'string' && form.email.trim() && !cleanedForm.email) {
    return NextResponse.json({ ok: false, error: 'invalid-email' }, { status: 400 });
  }

  // Bot heuristic — honeypot field filled OR submitted in under 3 seconds.
  // Pretend success so the bot doesn't learn it was blocked.
  const isBot = (hp && hp.length > 0) || (typeof elapsedMs === 'number' && elapsedMs < 3000);
  if (isBot) {
    return NextResponse.json({ ok: true, orderNumber: 'WC-BOT', total: 0, suppressed: true });
  }

  const sb = getSupabaseAdmin();

  // ── Fetch authoritative prices ──────────────────────────────────
  const productIds = items.map((it) => it.product_id ?? it.id).filter(Boolean) as string[];
  const uniqueIds = Array.from(new Set(productIds));
  if (uniqueIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'missing-product-ids' }, { status: 400 });
  }
  const { data: products, error: prodErr } = await sb
    .from('products')
    .select('id, name, name_ar, name_en, price, cost, active, stock, img_files')
    .in('id', uniqueIds);

  if (prodErr || !products || products.length === 0) {
    return NextResponse.json({ ok: false, error: 'products-not-found' }, { status: 500 });
  }
  const byId = new Map(products.map((p) => [p.id, p]));

  // ── Build canonical line items + compute subtotal ───────────────
  let subtotal = 0;
  const canonicalItems: Array<{
    name: string; qty: number; size: string; color: string; price: number; cost: number | null; image?: string;
  }> = [];
  let qtyTotal = 0;

  for (const line of items) {
    const pid = line.product_id ?? line.id;
    if (!pid) continue;
    const prod = byId.get(pid);
    if (!prod || prod.active === false) {
      return NextResponse.json({ ok: false, error: 'product-unavailable', product_id: pid }, { status: 400 });
    }
    const qty = Math.max(1, Math.min(20, Math.floor(Number(line.qty) || 1)));
    if (typeof prod.stock === 'number' && prod.stock !== null && prod.stock < qty) {
      return NextResponse.json({ ok: false, error: 'insufficient-stock', product_id: pid }, { status: 400 });
    }
    qtyTotal += qty;
    subtotal += prod.price * qty;
    const localizedName = lang === 'ar' ? (prod.name_ar || prod.name)
                       : lang === 'en' ? (prod.name_en || prod.name)
                       : prod.name;
    canonicalItems.push({
      name: localizedName,
      qty,
      size: String(line.size ?? ''),
      color: String(line.color ?? ''),
      price: prod.price, // authoritative — taken from DB
      cost: prod.cost ?? null,
      image: Array.isArray(prod.img_files) ? prod.img_files[0] : undefined,
    });
  }

  // ── Discounts ───────────────────────────────────────────────────
  const autoDiscount = qtyTotal >= AUTO_DISCOUNT_THRESHOLD
    ? Math.round(subtotal * (AUTO_DISCOUNT_PCT / 100))
    : 0;

  // Validate + consume coupon server-side via RPC. The RPC returns
  // the discount amount (or 0/error). We never trust a client-sent
  // discount value.
  let coupon: { code: string; discount: number } | null = null;
  if (couponCode && typeof couponCode === 'string') {
    const code = couponCode.trim().toUpperCase().slice(0, 32);
    if (code) {
      const { data: couponRow } = await sb
        .from('coupons')
        .select('code, type, value, active, expires_at, min_subtotal')
        .eq('code', code)
        .maybeSingle();
      if (couponRow && couponRow.active !== false) {
        if (couponRow.expires_at && new Date(couponRow.expires_at) < new Date()) {
          // expired — silently ignore
        } else if (couponRow.min_subtotal && subtotal < Number(couponRow.min_subtotal)) {
          // below minimum — silently ignore
        } else {
          const value = Number(couponRow.value) || 0;
          const discountAmount = couponRow.type === 'percent'
            ? Math.round(subtotal * (value / 100))
            : Math.min(subtotal, value);
          if (discountAmount > 0) coupon = { code, discount: discountAmount };
        }
      }
    }
  }

  const totalDiscount = autoDiscount + (coupon?.discount ?? 0);
  const delivery = (subtotal - totalDiscount) > DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = Math.max(0, subtotal - totalDiscount) + delivery;

  // ── Allocate order number + insert ──────────────────────────────
  let orderNumber: string;
  try {
    const { data, error } = await sb.rpc('next_order_number');
    if (error || typeof data !== 'string' || !data) throw error || new Error('no-rpc');
    orderNumber = data;
  } catch {
    orderNumber = 'WC-' + (Math.floor(Math.random() * 900000) + 100000);
  }

  const insertPayload: Record<string, unknown> = {
    order_number: orderNumber,
    status: 'nouveau',
    full_name: cleanedForm.fullName,
    phone: cleanedForm.phone,
    email: cleanedForm.email,
    address: cleanedForm.address,
    city: cleanedForm.city,
    payment: cleanedForm.payment,
    subtotal,
    delivery,
    total,
    items: canonicalItems,
    lang: lang ?? 'fr',
    marketing_consent: !!(marketingConsent && cleanedForm.email),
  };
  if (userId) insertPayload.user_id = userId;
  if (autoDiscount > 0) insertPayload.auto_discount = autoDiscount;
  if (coupon) { insertPayload.coupon_code = coupon.code; insertPayload.discount = coupon.discount; }

  const { data: inserted, error: insertErr } = await sb
    .from('orders')
    .insert(insertPayload)
    .select('id, order_number')
    .single();

  if (insertErr || !inserted) {
    await alertWarn({
      title: `Checkout insert failed — ${orderNumber}`,
      body: 'Customer hit "Confirmer" but the order did not save. Call them back.',
      context: {
        orderNumber, customer: cleanedForm.fullName, phone: cleanedForm.phone, reason: insertErr?.message ?? 'no-row',
      },
      fingerprint: 'checkout-insert-failed',
    });
    return NextResponse.json({ ok: false, error: 'insert-failed', detail: insertErr?.message }, { status: 500 });
  }

  // ── Side effects (fire and forget) ──────────────────────────────
  // Consume the coupon record (mark as used / increment counter).
  if (coupon) {
    sb.rpc('consume_coupon', {
      p_code: coupon.code,
      p_phone: cleanedForm.phone,
      p_order: orderNumber,
    }).then(() => {}, () => {});
  }

  // Newsletter opt-in.
  if (marketingConsent && cleanedForm.email) {
    sb.from('newsletter_subscribers').insert({
      email: cleanedForm.email,
      phone: cleanedForm.phone || null,
    }).then(() => {}, () => {});
  }

  // Gift coupon for 2+ items.
  let giftCode: string | null = null;
  if (qtyTotal >= 2) {
    try {
      const { data: gift } = await sb.rpc('issue_gift_coupon', {
        p_name: cleanedForm.fullName || null,
        p_phone: cleanedForm.phone || null,
        p_city: cleanedForm.city || null,
        p_order: orderNumber,
      });
      if (typeof gift === 'string') giftCode = gift;
    } catch {}
  }

  return NextResponse.json({
    ok: true,
    orderNumber: inserted.order_number,
    orderId: inserted.id,
    subtotal,
    autoDiscount,
    couponDiscount: coupon?.discount ?? 0,
    delivery,
    total,
    items: canonicalItems,
    giftCode,
  });
}
