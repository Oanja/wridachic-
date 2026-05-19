import { NextResponse } from 'next/server';
import { alertCritical } from '@/lib/alerts';
import { sendTelegramText } from '@/lib/telegram';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Fired by the client when the user clicks "Confirmer" but Supabase
 * rejects the insert (RLS, network glitch, etc.). The customer sees a
 * friendly message + a WhatsApp escape hatch — but the admin needs to
 * know IMMEDIATELY so they can call them back before the customer gives up.
 */
export async function POST(req: Request) {
  // 3 failure pings per IP per 5 min — a customer retrying checkout never
  // needs more, and this prevents Telegram spam from a malicious script.
  const rl = checkRateLimit(req, { limit: 3, windowMs: 5 * 60_000, scope: 'checkout-fail' });
  if (!rl.ok) return rl.response;

  try {
    const data = await req.json();

    const items = Array.isArray(data.items)
      ? data.items.map((i: { name: string; qty: number; size: string }) =>
          `• ${i.name} × ${i.qty} (${i.size})`).join('\n')
      : '(no items)';

    await alertCritical({
      title: `Échec checkout — ${data.orderNumber || '?'}`,
      body: `Une cliente N'A PAS pu finaliser sa commande. Elle a vu le message d'erreur et a peut-être déjà cliqué sur le bouton WhatsApp. APPELLE-LA MAINTENANT.`,
      context: {
        customer: data.fullName,
        phone: data.phone,
        email: data.email || '(none)',
        city: data.city,
        address: data.address,
        total: data.total + ' MAD',
        items,
        reason: typeof data.reason === 'string' ? data.reason.slice(0, 500) : 'unknown',
      },
    });

    // Also send a plain-text message with a quick WhatsApp link to the
    // customer so the admin can one-tap to call her.
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
    if (adminPhone && data.phone) {
      const waLink = `https://wa.me/${data.phone.replace(/^0/, '212').replace(/\D/g, '')}`;
      await sendTelegramText(
        `🚨 ÉCHEC CHECKOUT\n\n` +
        `Client: ${data.fullName}\n` +
        `Tel: ${data.phone}\n` +
        `Total: ${data.total} MAD\n\n` +
        `Appel direct WhatsApp:\n${waLink}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
