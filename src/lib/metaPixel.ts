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
    fbq?: (action: 'track', event: MetaPixelEvent, payload?: MetaPixelPayload) => void;
  }
}

function canTrackMetaPixel() {
  return (
    typeof window !== 'undefined' &&
    localStorage.getItem(CONSENT_KEY) === 'accepted' &&
    typeof window.fbq === 'function'
  );
}

export function trackMetaEvent(event: MetaPixelEvent, payload?: MetaPixelPayload) {
  if (!canTrackMetaPixel()) return;
  window.fbq?.('track', event, payload);
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
