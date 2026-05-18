/**
 * Meta Conversions API (CAPI) — server-side event tracking.
 *
 * Why CAPI alongside the browser Pixel?
 * ─────────────────────────────────────
 * The browser Pixel is blocked for ~30-50% of users (iOS 14+ ATT,
 * ad-blockers, Brave, Firefox strict mode, etc.) — those conversions
 * NEVER reach Meta, so the ad algorithm thinks the campaign is
 * underperforming and stops spending on what actually works.
 *
 * CAPI sends the same event from our SERVER (which no browser
 * extension can block) → Meta receives ~100% of conversions →
 * algorithm optimizes correctly → +30-50% ROAS in practice.
 *
 * Deduplication: we send both Pixel + CAPI with the SAME `event_id`.
 * Meta detects the match and counts the conversion only once. If only
 * one of the two arrives (Pixel blocked, or CAPI hiccup), Meta still
 * records it — best of both worlds.
 *
 * Env vars required:
 *   NEXT_PUBLIC_FB_PIXEL  — Pixel ID (already used by the browser Pixel)
 *   META_CAPI_TOKEN       — Conversions API access token
 *                           (Meta Events Manager → Settings → Conversions
 *                            API → Generate access token)
 *   META_TEST_EVENT_CODE  — OPTIONAL, only set during initial testing
 *                           so events show up in "Test Events" without
 *                           polluting production stats.
 */

import { createHash } from 'crypto';

const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL;
const CAPI_TOKEN = process.env.META_CAPI_TOKEN;
const TEST_CODE = process.env.META_TEST_EVENT_CODE; // optional

const GRAPH_API_VERSION = 'v21.0';

type CapiEventName = 'Purchase' | 'InitiateCheckout' | 'AddToCart' | 'ViewContent' | 'Lead';

interface CapiUserData {
  email?: string;
  phone?: string;        // E.164 ideally, plain digits also fine — we normalize
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;      // ISO-2 lowercase, default 'ma'
  clientIp?: string;
  clientUserAgent?: string;
  fbp?: string;          // _fbp cookie value
  fbc?: string;          // _fbc cookie value (click ID)
}

interface CapiCustomData {
  currency?: 'MAD';
  value?: number;
  content_ids?: string[];
  content_type?: 'product' | 'product_group';
  contents?: Array<{ id: string; quantity: number; item_price: number }>;
  num_items?: number;
  order_id?: string;
}

interface SendCapiEventParams {
  eventName: CapiEventName;
  eventId: string;          // MUST match the browser Pixel eventID for dedup
  eventSourceUrl?: string;  // page URL that triggered the conversion
  userData: CapiUserData;
  customData?: CapiCustomData;
  actionSource?: 'website' | 'system_generated';
}

/** SHA-256 lowercased hash — Meta's required PII format. */
function hash(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const cleaned = v.trim().toLowerCase();
  if (!cleaned) return undefined;
  return createHash('sha256').update(cleaned).digest('hex');
}

/** Normalize Moroccan phone to E.164-ish digits before hashing. */
function normalizePhone(p?: string): string | undefined {
  if (!p) return undefined;
  let digits = p.replace(/\D/g, '');
  // 06XXXXXXXX → 2126XXXXXXXX
  if (digits.startsWith('0') && digits.length === 10) digits = '212' + digits.slice(1);
  // Already with +212 → strip +
  if (digits.startsWith('00')) digits = digits.slice(2);
  return digits;
}

export async function sendCapiEvent(params: SendCapiEventParams): Promise<{ ok: boolean; reason: string }> {
  if (!PIXEL_ID || !CAPI_TOKEN) {
    return { ok: false, reason: 'capi-not-configured' };
  }

  const userData: Record<string, unknown> = {
    em: hash(params.userData.email),
    ph: hash(normalizePhone(params.userData.phone)),
    fn: hash(params.userData.firstName),
    ln: hash(params.userData.lastName),
    ct: hash(params.userData.city),
    country: hash(params.userData.country ?? 'ma'),
    client_ip_address: params.userData.clientIp,
    client_user_agent: params.userData.clientUserAgent,
    fbp: params.userData.fbp,
    fbc: params.userData.fbc,
  };
  // Strip undefined keys — Meta rejects nulls.
  for (const k of Object.keys(userData)) if (userData[k] === undefined) delete userData[k];

  const payload = {
    data: [
      {
        event_name: params.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        event_source_url: params.eventSourceUrl,
        action_source: params.actionSource ?? 'website',
        user_data: userData,
        custom_data: params.customData,
      },
    ],
    ...(TEST_CODE ? { test_event_code: TEST_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    if (res.ok) return { ok: true, reason: 'sent' };
    const body = await res.text();
    return { ok: false, reason: `HTTP ${res.status}: ${body.slice(0, 300)}` };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'unknown' };
  }
}

/** Convenience helper for the Purchase event (most important one). */
export interface CapiPurchaseInput {
  eventId: string;
  orderNumber: string;
  total: number;
  email?: string;
  phone?: string;
  fullName?: string;
  city?: string;
  items: Array<{ id?: string; name?: string; qty: number; price: number }>;
  clientIp?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  sourceUrl?: string;
}

export function sendCapiPurchase(input: CapiPurchaseInput) {
  const [firstName, ...rest] = (input.fullName ?? '').trim().split(/\s+/);
  const lastName = rest.join(' ') || undefined;

  return sendCapiEvent({
    eventName: 'Purchase',
    eventId: input.eventId,
    eventSourceUrl: input.sourceUrl,
    userData: {
      email: input.email,
      phone: input.phone,
      firstName,
      lastName,
      city: input.city,
      country: 'ma',
      clientIp: input.clientIp,
      clientUserAgent: input.clientUserAgent,
      fbp: input.fbp,
      fbc: input.fbc,
    },
    customData: {
      currency: 'MAD',
      value: input.total,
      order_id: input.orderNumber,
      content_type: 'product',
      content_ids: input.items.map((i) => i.id ?? i.name ?? 'unknown'),
      contents: input.items.map((i) => ({
        id: i.id ?? i.name ?? 'unknown',
        quantity: i.qty,
        item_price: i.price,
      })),
      num_items: input.items.reduce((s, i) => s + i.qty, 0),
    },
  });
}
