/**
 * Telegram admin notifications.
 *
 * Why this exists: WhatsApp Cloud API requires a pre-approved template to
 * message a number outside the 24h customer window, so notifying ourselves
 * about new orders through WhatsApp is fragile. Telegram has no such limit
 * — a bot can DM/group-message us instantly, free, forever.
 *
 * Required env vars (both must be set; missing either → notifier silently
 * no-ops so checkout still succeeds):
 *   TELEGRAM_BOT_TOKEN  — from @BotFather (1234567890:AAEh...)
 *   TELEGRAM_CHAT_ID    — private chat id (positive) or group id (negative)
 */

import { withRetry } from './retry';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export interface TelegramOrderPayload {
  orderNumber: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  total: number;
  items: Array<{
    name: string;
    qty: number;
    size: string;
    color: string;
  }>;
}

function escape(s: string) {
  // Telegram MarkdownV2 reserves: _ * [ ] ( ) ~ ` > # + - = | { } . !
  // We use HTML mode instead (parse_mode=HTML), which only needs <, >, &.
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendOnce(text: string, chatId: string) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  if (res.ok) return { ok: true, reason: 'sent' };
  const body = await res.text();
  return { ok: false, reason: `HTTP ${res.status}: ${body.slice(0, 200)}` };
}

async function send(text: string, chatId?: string) {
  const targetChat = chatId || CHAT_ID;
  if (!BOT_TOKEN || !targetChat) {
    return { ok: false, reason: 'missing-telegram-env' };
  }
  return withRetry(() => sendOnce(text, targetChat), { attempts: 3, baseDelayMs: 300, label: 'telegram' });
}

export async function sendOrderTelegramNotification(order: TelegramOrderPayload) {
  const waPhone = order.phone.replace(/^0/, '212').replace(/\D/g, '');
  const itemsBlock = order.items
    .map((it) => `📦 ${escape(it.name)} — ${escape(it.size)} / ${escape(it.color)} × ${it.qty}`)
    .join('\n');

  const text = [
    `🛍️ <b>NOUVELLE COMMANDE</b>`,
    `━━━━━━━━━━━━━━━━━`,
    `<b>${escape(order.orderNumber)}</b>`,
    ``,
    `👤 ${escape(order.fullName)}`,
    `📞 <a href="tel:${escape(order.phone)}">${escape(order.phone)}</a> · <a href="https://wa.me/${waPhone}">WhatsApp</a>`,
    order.email ? `✉️ ${escape(order.email)}` : '',
    order.address || order.city
      ? `📍 ${escape([order.address, order.city].filter(Boolean).join(', '))}`
      : '',
    ``,
    itemsBlock,
    ``,
    `💰 <b>${order.total} MAD</b>`,
    ``,
    `<a href="https://wridachic.com/admin">→ Ouvrir l'admin</a>`,
  ]
    .filter(Boolean)
    .join('\n');

  return send(text);
}

/**
 * Send a free-form Telegram message. Defaults to the orders chat
 * (TELEGRAM_CHAT_ID). Pass a different `chatId` to route to a dedicated
 * group like the cancellations or modifications channels.
 */
export async function sendTelegramText(text: string, chatId?: string) {
  return send(text, chatId);
}

// Specialised chat IDs for grouping notifications by intent. All fall
// back to the main orders chat if unset, so adding/removing groups is a
// pure env-var change with no code redeploy.
export const TELEGRAM_CHATS = {
  orders: process.env.TELEGRAM_CHAT_ID,
  alerts: process.env.TELEGRAM_ALERTS_CHAT_ID || process.env.TELEGRAM_CHAT_ID,
  cancellations: process.env.TELEGRAM_CANCEL_CHAT_ID || process.env.TELEGRAM_CHAT_ID,
  modifications: process.env.TELEGRAM_MODIFY_CHAT_ID || process.env.TELEGRAM_CHAT_ID,
};
