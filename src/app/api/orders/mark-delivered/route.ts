import { NextResponse, after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendTelegramText, TELEGRAM_CHATS } from '@/lib/telegram';
// upsertOrderToSheet not imported — handled by Supabase webhook.
import { blockIfNotAdmin } from '@/lib/auth-guard';

/**
 * Marks an order as `livré` (delivered) and fires the celebratory
 * notification to the dedicated "Livrées" Telegram chat.
 *
 * Body: { orderId }
 *
 * The delivery confirmation is a SEPARATE chat (not the main orders
 * chat) so the team can quickly see real revenue at a glance, without
 * scrolling past every new/confirmed/edited notification.
 *
 * Returns 200 even if the Sheet sync fails — the status update on
 * Supabase is the source of truth and Telegram alerting is best-effort.
 */
export async function POST(req: Request) {
  try {
    const block = await blockIfNotAdmin();
    if (block) return block;
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'missing-order-id' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data: order, error } = await sb
      .from('orders')
      .update({ status: 'livré', delivered_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('order_number, full_name, phone, email, address, city, total, status, items, cancel_reason, created_at, lang')
      .single();

    if (error || !order) {
      return NextResponse.json(
        { ok: false, error: error?.message || 'order-not-found' },
        { status: 500 }
      );
    }

    // ─── Background: Telegram celebration ──────────────────────────
    // Sheet sync happens via the Supabase webhook automatically (the
    // status update above triggers it); we don't double-sync here.
    after(async () => {
      await sendTelegramText(
        `🎉 <b>LIVRÉ</b>\n` +
        `━━━━━━━━━━━━━━━━━\n` +
        `<b>${order.order_number}</b>\n` +
        `👤 ${order.full_name}\n` +
        `📞 ${order.phone}\n` +
        `📍 ${order.city}\n` +
        `💰 <b>${order.total} MAD</b>\n\n` +
        `✅ Commande livrée avec succès !\n` +
        `💵 Pense à encaisser le COD.`,
        TELEGRAM_CHATS.delivered,
      );
    });

    return NextResponse.json({ ok: true, queued: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
