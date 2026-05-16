import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { parseWhatsAppPayload, sendWhatsAppText, normalizeWhatsAppPhone } from '@/lib/whatsapp';
import { upsertOrderToSheet } from '@/lib/sheets';
import { sendTelegramText, TELEGRAM_CHATS } from '@/lib/telegram';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ADMIN_PHONE = process.env.WHATSAPP_ADMIN_PHONE;

const STATUS_BY_ACTION = {
  confirm: 'confirmé',
  cancel: 'annulé',
  edit: 'modification demandée',
} as const;

// Friendly auto-replies sent back to the customer after a button click.
// Tone: warm, brand voice — Moroccan French. The 🌹 WridaChic header makes
// the sender obvious in the customer's chat list even before they save the
// number to their contacts.
const BRAND_HEADER = '🌹 *WridaChic*\n────────────\n';

const REPLY_BY_ACTION = {
  confirm: (orderNumber: string) =>
    `${BRAND_HEADER}✓ Merci ! Ta commande ${orderNumber} est confirmée.\n\nOn la prépare avec soin et tu recevras un appel pour finaliser la livraison. À très vite ! 💛`,
  cancel: (orderNumber: string) =>
    `${BRAND_HEADER}Bien reçu, ta commande ${orderNumber} est annulée.\n\nPour nous aider à améliorer notre service, peux-tu nous dire la raison ? (taille, délai, prix, autre…)\n\nÉcris-nous simplement ici en réponse 🙏`,
  edit: (orderNumber: string) =>
    `${BRAND_HEADER}Bien noté ! Pour modifier ta commande ${orderNumber}, notre équipe va te contacter dans les plus brefs délais.\n\nMerci pour ta patience 💛`,
} as const;

const CANCEL_REASON_THANK_YOU =
  `${BRAND_HEADER}Merci beaucoup pour ton retour 🙏\nC'est précieux pour nous, on en tient compte. À bientôt ! 💛`;

type WhatsAppWebhookMessage = {
  from?: string;
  type?: string;
  text?: { body?: string };
  button?: { payload?: string; text?: string };
  interactive?: {
    button_reply?: { id?: string; title?: string };
  };
};

function extractButtonPayload(message: WhatsAppWebhookMessage) {
  return message.button?.payload || message.interactive?.button_reply?.id || '';
}

function extractText(message: WhatsAppWebhookMessage) {
  return message.text?.body?.trim() || '';
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token && token === VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const messages: WhatsAppWebhookMessage[] =
      payload?.entry?.flatMap((entry: any) =>
        entry?.changes?.flatMap((change: any) => change?.value?.messages ?? []) ?? []
      ) ?? [];

    const sb = getSupabaseAdmin();

    for (const message of messages) {
      const from = message.from;
      if (!from) continue;

      // 1) Button click on the order-confirmation template
      const parsed = parseWhatsAppPayload(extractButtonPayload(message));
      if (parsed) {
        const nextStatus = STATUS_BY_ACTION[parsed.action];

        // For cancellations, also mark the order as awaiting the customer's
        // free-text reason so the very next plain message from them gets
        // saved into `cancel_reason` (see step 2 below).
        const updatePayload: Record<string, unknown> = { status: nextStatus };
        if (parsed.action === 'cancel') {
          updatePayload.awaiting_reply = 'cancel_reason';
        }

        // Fetch the full row back so we have everything Sheets needs (no
        // second round-trip): items + address are already used by Sheets.
        const { data, error } = await sb
          .from('orders')
          .update(updatePayload)
          .eq('order_number', parsed.orderNumber)
          .select('order_number, full_name, phone, email, address, city, total, status, items, cancel_reason, created_at')
          .single();

        if (error) {
          console.error('[whatsapp-webhook] order update failed', error);
          continue;
        }

        await sendWhatsAppText(from, REPLY_BY_ACTION[parsed.action](parsed.orderNumber));

        if (ADMIN_PHONE) {
          await sendWhatsAppText(
            ADMIN_PHONE,
            `WhatsApp: ${data.order_number} -> ${nextStatus}\nClient: ${data.full_name}\nTel: ${data.phone}\nTotal: ${data.total} MAD`
          );
        }

        // Route the notification to the right Telegram group so the
        // admin's main "orders" feed stays focused on positive actions.
        //   confirm → orders chat (continuation of the order lifecycle)
        //   cancel  → cancellations chat (paired later with the reason)
        //   edit    → modifications chat (needs a callback)
        const waLink = `https://wa.me/${data.phone.replace(/^0/, '212').replace(/\D/g, '')}`;
        const tgEmoji = parsed.action === 'confirm' ? '✅' : parsed.action === 'cancel' ? '❌' : '✏️';
        const tgLabel = parsed.action === 'confirm'
          ? '<b>CONFIRMÉ</b> par la cliente'
          : parsed.action === 'cancel'
            ? '<b>ANNULÉ</b> par la cliente'
            : '<b>MODIFICATION DEMANDÉE</b>';
        const tgAction = parsed.action === 'edit'
          ? `\n\n📞 <b>Appelle-la dans la journée</b> pour comprendre la modification souhaitée.`
          : parsed.action === 'cancel'
            ? `\n\n💬 La raison de l'annulation arrivera ici quand elle répondra au message WhatsApp.`
            : `\n\n🚚 Prépare la commande pour expédition.`;
        const tgChat = parsed.action === 'cancel'
          ? TELEGRAM_CHATS.cancellations
          : parsed.action === 'edit'
            ? TELEGRAM_CHATS.modifications
            : TELEGRAM_CHATS.orders;
        await sendTelegramText(
          `${tgEmoji} ${tgLabel}\n` +
          `━━━━━━━━━━━━━━━━━\n` +
          `<b>${data.order_number}</b>\n` +
          `👤 ${data.full_name}\n` +
          `📞 ${data.phone} · <a href="${waLink}">WhatsApp</a>\n` +
          `💰 ${data.total} MAD` +
          tgAction,
          tgChat,
        );

        // Mirror the status change into the Google Sheet. Failure here is
        // logged but never blocks the reply to the customer.
        const sheetSync = await upsertOrderToSheet({
          orderNumber: data.order_number,
          fullName: data.full_name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          total: data.total,
          status: data.status,
          cancel_reason: data.cancel_reason,
          created_at: data.created_at,
          items: data.items ?? [],
        });
        if (!sheetSync.ok) console.error('[sheets] webhook sync failed', sheetSync.reason);
        continue;
      }

      // 2) Plain text reply — if the customer was just asked for a cancel
      // reason, capture it on their most recent cancelled order.
      const text = extractText(message);
      if (!text) continue;

      const normalizedFrom = normalizeWhatsAppPhone(from);
      // Match either the raw international form or the Moroccan local form,
      // since phone stored in `orders` might come from the checkout form.
      const localFrom = normalizedFrom.startsWith('212')
        ? `0${normalizedFrom.slice(3)}`
        : normalizedFrom;

      const { data: pending } = await sb
        .from('orders')
        .select('id, order_number, full_name, phone')
        .eq('awaiting_reply', 'cancel_reason')
        .in('phone', [from, normalizedFrom, localFrom])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!pending) continue;

      const { data: updated } = await sb
        .from('orders')
        .update({ cancel_reason: text, awaiting_reply: null })
        .eq('id', pending.id)
        .select('order_number, full_name, phone, email, address, city, total, status, items, cancel_reason, created_at')
        .single();

      await sendWhatsAppText(from, CANCEL_REASON_THANK_YOU);

      if (ADMIN_PHONE) {
        await sendWhatsAppText(
          ADMIN_PHONE,
          `Raison d'annulation reçue\nCommande: ${pending.order_number}\nClient: ${pending.full_name}\nMessage: "${text}"`
        );
      }

      // Route the reason follow-up to the cancellations chat so it
      // pairs up with the original cancel notification in one place.
      const waLink = `https://wa.me/${pending.phone.replace(/^0/, '212').replace(/\D/g, '')}`;
      await sendTelegramText(
        `💬 <b>RAISON D'ANNULATION REÇUE</b>\n` +
        `━━━━━━━━━━━━━━━━━\n` +
        `<b>${pending.order_number}</b>\n` +
        `👤 ${pending.full_name}\n` +
        `📞 ${pending.phone} · <a href="${waLink}">WhatsApp</a>\n\n` +
        `<i>"${text.slice(0, 300)}"</i>\n\n` +
        `💡 Tu peux essayer de récupérer la vente (remise, échange…).`,
        TELEGRAM_CHATS.cancellations,
      );

      if (updated) {
        const sheetSync = await upsertOrderToSheet({
          orderNumber: updated.order_number,
          fullName: updated.full_name,
          phone: updated.phone,
          email: updated.email,
          address: updated.address,
          city: updated.city,
          total: updated.total,
          status: updated.status,
          cancel_reason: updated.cancel_reason,
          created_at: updated.created_at,
          items: updated.items ?? [],
        });
        if (!sheetSync.ok) console.error('[sheets] cancel-reason sync failed', sheetSync.reason);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[whatsapp-webhook] failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
