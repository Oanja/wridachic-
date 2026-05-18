import type { CartItem, Product } from './types';

const CONSENT_KEY = 'wc2-cookie-consent';

type MetaPixelEvent =
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase';

type MetaPixelPayload = {
  content_ids?: string[];
  content_name?: string;
  content_type?: 'product' | 'product_group';
  contents?: Array<{ id: string; quantity: number; item_price: number }>;
  currency?: 'MAD';
  num_items?: number;
  value?: number;
};

declare global {
  interface Window {
    fbq?: (
      action: 'track',
      event: MetaPixelEvent,
      payload?: MetaPixelPayload,
      options?: { eventID?: string },
    ) => void;
  }
}

function canTrackMetaPixel() {
  return (
    typeof window !== 'undefined' &&
    localStorage.getItem(CONSENT_KEY) === 'accepted' &&
    typeof window.fbq === 'function'
  );
}

/**
 * Fire a Pixel event. Pass `eventId` to deduplicate against the same
 * event sent server-side via Meta Conversions API (CAPI) — Meta will
 * count it exactly once even if both arrive.
 */
export function trackMetaEvent(event: MetaPixelEvent, payload?: MetaPixelPayload, eventId?: string) {
  if (!canTrackMetaPixel()) return;
  if (eventId) {
    window.fbq?.('track', event, payload, { eventID: eventId });
  } else {
    window.fbq?.('track', event, payload);
  }
}

/** Read a cookie value (used to forward _fbp and _fbc to CAPI). */
export function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Generate a unique event_id for Pixel ↔ CAPI deduplication. */
export function newEventId(prefix = 'evt'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function productPayload(product: Product, quantity = 1) {
  return {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product' as const,
    contents: [{ id: product.id, quantity, item_price: product.price }],
    currency: 'MAD' as const,
    value: product.price * quantity,
  };
}

export function cartPayload(cart: CartItem[], total?: number) {
  const value = total ?? cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  return {
    content_ids: cart.map((item) => item.id),
    content_type: 'product_group' as const,
    contents: cart.map((item) => ({ id: item.id, quantity: item.qty, item_price: item.price })),
    currency: 'MAD' as const,
    num_items: cart.reduce((sum, item) => sum + item.qty, 0),
    value,
  };
}
