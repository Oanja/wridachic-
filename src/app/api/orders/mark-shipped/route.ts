import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderShippedWhatsApp } from '@/lib/whatsapp';
import { sendTelegramText } from '@/lib/telegram';
import { upsertOrderToSheet } from '@/lib/sheets';
import { alertWarn } from '@/lib/alerts';

/**
 * Marks an order as expédié + records livreur info + fires the shipped
 * WhatsApp template to the customer.
 *
 * Body: { orderId, livreurName, livreurPhone }
 *
 * Returns 200 even if the WhatsApp send fails — the status update is the
 * primary action; the message is a nice-to-have. Failures are surfaced
 * via Telegram alerts so the admin knows to message manually.
 */
export async function POST(req: Request) {
  try {
    const { orderId, livreurName, livreurPhone } = await req.json();

    if (!orderId || !livreurName?.trim() || !livreurPhone?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'missing-fields' },
        { status: 400 }
      );
    }

    const sb = getSupabaseAdmin();
    const { data: order, error } = await sb
      .from('orders')
      .update({
        status: 'expédié',
        livreur_name: livreurName.trim(),
        livreur_phone: livreurPhone.trim(),
        shipped_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('order_number, full_name, phone, email, address, city, total, status, items, cancel_reason, created_at')
      .single();

    if (error || !order) {
      return NextResponse.json(
        { ok: false, error: error?.message || 'order-not-found' },
        { status: 500 }
      );
    }

    // Fire WhatsApp shipped template + Sheet sync in parallel
    const [waResult, sheetResult] = await Promise.all([
      sendOrderShippedWhatsApp({
        orderNumber: order.order_number,
        fullName: order.full_name,
        phone: order.phone,
        livreurName: livreurName.trim(),
        livreurPhone: livreurPhone.trim(),
      }),
      upsertOrderToSheet({
        orderNumber: order.order_number,
        fullName: order.full_name,
        phone: order.phone,
        email: order.email,
        address: order.address,
        city: order.city,
        total: order.total,
        status: 'expédié',
        cancel_reason: order.cancel_reason,
        created_at: order.created_at,
        items: order.items ?? [],
      }),
    ]);

    // Push a Telegram notification to the orders chat so the admin sees
    // the dispatch acknowledged.
    await sendTelegramText(
      `🚚 <b>EXPÉDIÉ</b>\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `<b>${order.order_number}</b>\n` +
      `👤 ${order.full_name}\n` +
      `📞 ${order.phone}\n` +
      `💰 ${order.total} MAD\n\n` +
      `🚚 Livreur : <b>${livreurName.trim()}</b>\n` +
      `📱 ${livreurPhone.trim()}\n\n` +
      (waResult.ok
        ? '✅ Message WhatsApp envoyé à la cliente'
        : '⚠️ Message WhatsApp PAS envoyé — contacte-la manuellement')
    );

    if (!waResult.ok) {
      alertWarn({
        title: `WhatsApp "expédié" non envoyé — ${order.order_number}`,
        body: 'Le statut est bien mis à "expédié" mais la cliente n\'a PAS reçu de notification. Préviens-la manuellement.',
        context: {
          orderNumber: order.order_number,
          customer: order.full_name,
          phone: order.phone,
          reason: waResult.reason.slice(0, 400),
        },
        fingerprint: 'shipped-wa-failed',
      });
    }

    return NextResponse.json({
      ok: true,
      whatsapp: waResult,
      sheet: sheetResult,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
