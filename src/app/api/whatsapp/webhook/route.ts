import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { parseWhatsAppPayload, sendWhatsAppText } from '@/lib/whatsapp';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ADMIN_PHONE = process.env.WHATSAPP_ADMIN_PHONE;

const STATUS_BY_ACTION = {
  confirm: 'confirmé',
  cancel: 'annulé',
  edit: 'modification demandée',
} as const;

const REPLY_BY_ACTION = {
  confirm: (orderNumber: string) =>
    `Merci pour votre confirmation. Votre commande ${orderNumber} est bien confirmée. Notre équipe prépare la livraison.`,
  cancel: (orderNumber: string) =>
    `Votre demande d'annulation pour la commande ${orderNumber} est bien reçue. Merci de votre confiance.`,
  edit: (orderNumber: string) =>
    `Votre demande de modification pour la commande ${orderNumber} est bien reçue. Notre équipe va vous contacter rapidement.`,
} as const;

type WhatsAppWebhookMessage = {
  from?: string;
  type?: string;
  button?: { payload?: string; text?: string };
  interactive?: {
    button_reply?: { id?: string; title?: string };
  };
};

function extractButtonPayload(message: WhatsAppWebhookMessage) {
  return message.button?.payload || message.interactive?.button_reply?.id || '';
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
      const parsed = parseWhatsAppPayload(extractButtonPayload(message));
      if (!from || !parsed) continue;

      const nextStatus = STATUS_BY_ACTION[parsed.action];
      const { data, error } = await sb
        .from('orders')
        .update({ status: nextStatus })
        .eq('order_number', parsed.orderNumber)
        .select('order_number, full_name, phone, total')
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
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[whatsapp-webhook] failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
