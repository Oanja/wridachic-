export type WhatsAppAction = 'confirm' | 'cancel' | 'edit';

export interface WhatsAppOrderItem {
  name: string;
  qty: number;
  size: string;
  color: string;
  price: number;
  image?: string;
}

export interface WhatsAppOrderPayload {
  orderNumber: string;
  fullName: string;
  phone: string;
  total: number;
  items: WhatsAppOrderItem[];
}

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TEMPLATE_NAME = process.env.WHATSAPP_ORDER_TEMPLATE_NAME;
const TEMPLATE_LANG = process.env.WHATSAPP_ORDER_TEMPLATE_LANG || 'fr';
const SHIPPED_TEMPLATE_NAME = process.env.WHATSAPP_SHIPPED_TEMPLATE_NAME || 'wridachic_order_shipped';
const SHIPPED_TEMPLATE_LANG = process.env.WHATSAPP_SHIPPED_TEMPLATE_LANG || TEMPLATE_LANG;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wridachic.com';

export function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('212')) return digits;
  if (digits.startsWith('0')) return `212${digits.slice(1)}`;
  if (digits.length === 9) return `212${digits}`;
  return digits;
}

export function buildWhatsAppPayload(action: WhatsAppAction, orderNumber: string) {
  return `wridachic:${action}:${orderNumber}`;
}

export function parseWhatsAppPayload(payload: string) {
  const match = payload.match(/^wridachic:(confirm|cancel|edit):(WC-\d{6})$/i);
  if (!match) return null;
  return {
    action: match[1].toLowerCase() as WhatsAppAction,
    orderNumber: match[2].toUpperCase(),
  };
}

function absoluteUrl(url?: string) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, SITE_URL).toString();
}

async function sendWhatsAppMessage(to: string, message: Record<string, unknown>) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    return { ok: false, reason: 'missing-whatsapp-env' };
  }

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      ...message,
    }),
  });

  const body = await res.text();
  return { ok: res.ok, reason: res.ok ? 'sent' : body };
}

export async function sendWhatsAppText(toPhone: string, body: string) {
  return sendWhatsAppMessage(normalizeWhatsAppPhone(toPhone), {
    type: 'text',
    text: {
      preview_url: false,
      body,
    },
  });
}

export async function sendOrderWhatsAppConfirmation(order: WhatsAppOrderPayload) {
  if (!TEMPLATE_NAME) {
    return { ok: false, reason: 'missing-template-name' };
  }

  const item = order.items[0];
  if (!item) {
    return { ok: false, reason: 'missing-order-items' };
  }

  const productLabel = `${item.name} (${item.color} / ${item.size}) x ${item.qty}`;
  const to = normalizeWhatsAppPhone(order.phone);
  // Fallback image when the order item has no product photo. Meta's
  // template REQUIRES an IMAGE header — if we send no header it returns
  // "header: Format mismatch, expected IMAGE, received UNKNOWN" and the
  // confirmation never reaches the customer. The fallback is the brand
  // logo (converted from SVG → PNG in scripts/convert-logo.mjs) so the
  // message still feels on-brand even when the product photo is missing.
  // Overridable via WHATSAPP_FALLBACK_IMAGE_URL if we ever want to use a
  // different asset (e.g. a seasonal hero image) without redeploying.
  const FALLBACK_IMAGE = process.env.WHATSAPP_FALLBACK_IMAGE_URL
    || absoluteUrl('/wa-logo.png');
  const headerImage = absoluteUrl(item.image) || FALLBACK_IMAGE;

  const components: Array<Record<string, unknown>> = [];
  if (headerImage) {
    components.push({
      type: 'header',
      parameters: [{ type: 'image', image: { link: headerImage } }],
    });
  }

  components.push({
    type: 'body',
    parameters: [
      { type: 'text', text: order.fullName },
      { type: 'text', text: order.orderNumber },
      { type: 'text', text: productLabel },
      { type: 'text', text: String(order.total) },
    ],
  });

  (['confirm', 'cancel', 'edit'] as const).forEach((action, index) => {
    components.push({
      type: 'button',
      sub_type: 'quick_reply',
      index: String(index),
      parameters: [
        {
          type: 'payload',
          payload: buildWhatsAppPayload(action, order.orderNumber),
        },
      ],
    });
  });

  const sendWithLang = (code: string) =>
    sendWhatsAppMessage(to, {
      type: 'template',
      template: {
        name: TEMPLATE_NAME,
        language: { code },
        components,
      },
    });

  // The Meta UI shows the template language as "French (MAR)", but the API
  // language.code may be `fr_MA` OR plain `fr` depending on how Meta registered
  // it. Try the configured code first; if Meta rejects it with a language /
  // translation error, retry once with the other common French code so a
  // mis-set env var doesn't silently break order confirmations.
  const primary = await sendWithLang(TEMPLATE_LANG);
  if (primary.ok) return primary;

  const looksLikeLangError = /language|translation|does not exist|132001|132000/i.test(
    primary.reason,
  );
  const fallbackLang = TEMPLATE_LANG === 'fr' ? 'fr_MA' : 'fr';
  if (looksLikeLangError && fallbackLang !== TEMPLATE_LANG) {
    const retry = await sendWithLang(fallbackLang);
    if (retry.ok) {
      return { ok: true, reason: `sent (lang fallback: ${fallbackLang})` };
    }
    return { ok: false, reason: `primary[${TEMPLATE_LANG}]: ${primary.reason} | retry[${fallbackLang}]: ${retry.reason}` };
  }

  return primary;
}

/**
 * Sends the "Order Shipped" template to the customer when the admin marks
 * an order as expédié. The template takes 4 body variables:
 *   {{1}} = customer first name
 *   {{2}} = order number
 *   {{3}} = livreur (courier) name
 *   {{4}} = livreur phone
 *
 * Uses the same fr / fr_MA fallback dance as the confirmation template so
 * a mis-set lang env var doesn't break shipping notifications.
 */
export interface ShippedPayload {
  orderNumber: string;
  fullName: string;
  phone: string;
  livreurName: string;
  livreurPhone: string;
}

export async function sendOrderShippedWhatsApp(payload: ShippedPayload) {
  if (!SHIPPED_TEMPLATE_NAME) {
    return { ok: false, reason: 'missing-shipped-template-name' };
  }

  const to = normalizeWhatsAppPhone(payload.phone);

  const components: Array<Record<string, unknown>> = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: payload.fullName.split(' ')[0] || payload.fullName },
        { type: 'text', text: payload.orderNumber },
        { type: 'text', text: payload.livreurName },
        { type: 'text', text: payload.livreurPhone },
      ],
    },
  ];

  const sendWithLang = (code: string) =>
    sendWhatsAppMessage(to, {
      type: 'template',
      template: {
        name: SHIPPED_TEMPLATE_NAME,
        language: { code },
        components,
      },
    });

  const primary = await sendWithLang(SHIPPED_TEMPLATE_LANG);
  if (primary.ok) return primary;

  const looksLikeLangError = /language|translation|does not exist|132001|132000/i.test(
    primary.reason,
  );
  const fallbackLang = SHIPPED_TEMPLATE_LANG === 'fr' ? 'fr_MA' : 'fr';
  if (looksLikeLangError && fallbackLang !== SHIPPED_TEMPLATE_LANG) {
    const retry = await sendWithLang(fallbackLang);
    if (retry.ok) {
      return { ok: true, reason: `sent (lang fallback: ${fallbackLang})` };
    }
    return { ok: false, reason: `primary[${SHIPPED_TEMPLATE_LANG}]: ${primary.reason} | retry[${fallbackLang}]: ${retry.reason}` };
  }

  return primary;
}
