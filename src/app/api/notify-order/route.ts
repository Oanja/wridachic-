import { NextResponse } from 'next/server';
import { sendOrderWhatsAppConfirmation } from '@/lib/whatsapp';
import { sendOrderTelegramNotification } from '@/lib/telegram';
import { upsertOrderToSheet } from '@/lib/sheets';
import { alertError, alertWarn } from '@/lib/alerts';
import { withRetry } from '@/lib/retry';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Sends two emails (via Resend) when an order is placed:
 *   - one to the admin (RESEND_TO) so they see the order immediately,
 *   - one to the customer if they provided an email — a friendly confirmation.
 *
 * Required env vars (set in Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY   — get from https://resend.com (free tier = 100 emails/day)
 *   RESEND_FROM      — verified sender, e.g. "wridachic <orders@wridachic.com>"
 *   RESEND_TO        — your inbox, e.g. "you@wridachic.com"
 *
 * If RESEND_API_KEY is missing, the route returns 200 silently — the order
 * still succeeds, only the email step is skipped. This keeps dev/preview
 * happy without crashing checkout.
 */

interface OrderItem {
  name: string;
  qty: number;
  size: string;
  color: string;
  price: number;
  image?: string;
}

interface OrderPayload {
  orderNumber: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  total: number;
  items: OrderItem[];
  lang?: 'fr' | 'en' | 'ar';
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'wridachic <onboarding@resend.dev>';
const RESEND_TO = process.env.RESEND_TO;

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return { ok: false, reason: 'no-api-key' };
  // Wrap in retry so Resend's occasional 5xx hiccups (or our own network
  // glitches) don't lose a confirmation email.
  return withRetry(
    async () => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
      });
      if (res.ok) return { ok: true, reason: 'sent' };
      const body = await res.text();
      return { ok: false, reason: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    },
    { attempts: 3, baseDelayMs: 400, label: 'resend' },
  );
}

function renderItemsTable(items: OrderItem[]) {
  return `
    <table style="width:100%;border-collapse:collapse;margin-top:8px;font-family:system-ui,sans-serif">
      <thead>
        <tr style="background:#F2EBE1">
          <th style="text-align:left;padding:10px;font-size:12px">Article</th>
          <th style="text-align:left;padding:10px;font-size:12px">Taille</th>
          <th style="text-align:left;padding:10px;font-size:12px">Couleur</th>
          <th style="text-align:right;padding:10px;font-size:12px">Qté</th>
          <th style="text-align:right;padding:10px;font-size:12px">Prix</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((i) => `
          <tr style="border-top:1px solid #E6DDD0">
            <td style="padding:10px;font-size:13px">${i.name}</td>
            <td style="padding:10px;font-size:13px">${i.size}</td>
            <td style="padding:10px;font-size:13px">${i.color}</td>
            <td style="padding:10px;font-size:13px;text-align:right">${i.qty}</td>
            <td style="padding:10px;font-size:13px;text-align:right">${i.price * i.qty} MAD</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as OrderPayload;
    if (!data?.orderNumber || !data?.fullName) {
      return NextResponse.json({ ok: false, error: 'bad-payload' }, { status: 400 });
    }

    // Anti-abuse: confirm the order actually exists in Supabase before
    // burning Resend/WhatsApp/Telegram quotas. Without this, anyone who
    // finds the endpoint URL can spam fake orders and exhaust our budgets.
    try {
      const sb = getSupabaseAdmin();
      const { data: row, error } = await sb
        .from('orders')
        .select('order_number')
        .eq('order_number', data.orderNumber)
        .maybeSingle();
      if (error || !row) {
        return NextResponse.json({ ok: false, error: 'order-not-found' }, { status: 404 });
      }
    } catch (e) {
      // If we can't verify (DB blip), fail closed — don't let blind spam through.
      return NextResponse.json({ ok: false, error: 'verify-failed' }, { status: 503 });
    }

    // 1) Admin email DISABLED — we now rely on Telegram for instant admin
    // notifications. This halves Resend usage (140 → 70 emails for 70 orders
    // per day) so we stay within the 100/day free tier. The customer still
    // gets a confirmation email below — that's the one that matters for
    // trust and proof-of-purchase.
    const adminResult: { ok: boolean; reason: string } = { ok: true, reason: 'admin-email-disabled' };

    // 2) Email to customer if they provided one — friendly confirmation.
    let customerResult: { ok: boolean; reason: string } = { ok: false, reason: 'skipped' };
    if (data.email) {
      const lang = data.lang ?? 'fr';
      const t = lang === 'ar'
        ? {
            subject: `✓ تأكيد طلبك ${data.orderNumber}`,
            hi: `مرحبا ${data.fullName} 👋`,
            body: 'شكراً لطلبك! وصلنا و سنتصل بك خلال 24 ساعة لتأكيد التوصيل.',
            recap: 'ملخص طلبك',
            total: 'المجموع',
            help: 'سؤال؟ تواصلي معنا واتساب: +212 773-847986',
          }
        : lang === 'en'
        ? {
            subject: `✓ Order confirmation ${data.orderNumber}`,
            hi: `Hi ${data.fullName} 👋`,
            body: 'Thanks for your order! We received it and will call you within 24h to confirm delivery.',
            recap: 'Order summary',
            total: 'Total',
            help: 'Question? Reach us on WhatsApp: +212 773-847986',
          }
        : {
            subject: `✓ Confirmation de commande ${data.orderNumber}`,
            hi: `Bonjour ${data.fullName} 👋`,
            body: 'Merci pour ta commande ! On t\'appellera dans les 24h pour confirmer la livraison.',
            recap: 'Récapitulatif',
            total: 'Total',
            help: 'Une question ? Réponse rapide sur WhatsApp : +212 773-847986',
          };

      const customerHtml = `
        <div style="font-family:system-ui,sans-serif;color:#0F0E0D;max-width:600px;margin:0 auto;padding:32px 24px;background:#FAF6F1" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
          <h1 style="font-size:28px;margin:0 0 4px">${t.hi}</h1>
          <p style="font-family:monospace;color:#C85C3F;font-size:13px;margin:0 0 20px">${data.orderNumber}</p>
          <p style="font-size:16px;line-height:1.7">${t.body}</p>
          <h2 style="font-size:13px;margin:28px 0 6px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.6">${t.recap}</h2>
          ${renderItemsTable(data.items)}
          <div style="margin-top:18px;padding-top:12px;border-top:2px solid #0F0E0D;display:flex;justify-content:space-between;font-size:16px;font-weight:600">
            <span>${t.total}</span>
            <span>${data.total} MAD</span>
          </div>
          <p style="margin-top:32px;padding-top:20px;border-top:1px solid #E6DDD0;font-size:13px;opacity:0.7">${t.help}</p>
          <p style="margin-top:16px;font-size:11px;opacity:0.5;font-family:monospace;letter-spacing:0.08em;text-transform:uppercase">wridachic.com · Casablanca · 🇲🇦</p>
        </div>
      `;

      customerResult = await sendEmail(data.email, t.subject, customerHtml);
    }

    // Fire WhatsApp template + Telegram admin alert + Google Sheets sync
    // in parallel — they're independent and none should block the others.
    const [whatsappResult, telegramResult, sheetsResult] = await Promise.all([
      sendOrderWhatsAppConfirmation({
        orderNumber: data.orderNumber,
        fullName: data.fullName,
        phone: data.phone,
        total: data.total,
        items: data.items,
      }),
      sendOrderTelegramNotification({
        orderNumber: data.orderNumber,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        total: data.total,
        lang: data.lang,
        items: data.items,
      }),
      upsertOrderToSheet({
        orderNumber: data.orderNumber,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        total: data.total,
        status: 'nouveau',
        items: data.items,
        created_at: new Date().toISOString(),
        lang: data.lang,
      }),
    ]);

    if (whatsappResult.ok) {
      console.info('[whatsapp] order confirmation sent', {
        orderNumber: data.orderNumber,
        phoneLast4: data.phone.replace(/\D/g, '').slice(-4),
        reason: whatsappResult.reason,
      });
    } else {
      console.error('[whatsapp] order confirmation failed', {
        orderNumber: data.orderNumber,
        phoneLast4: data.phone.replace(/\D/g, '').slice(-4),
        reason: whatsappResult.reason,
      });
      // Only escalate to Telegram if WhatsApp is genuinely down. Skip the
      // self-send edge case ("can't message own number") to avoid noise.
      if (!/cannot message yourself|same phone/i.test(whatsappResult.reason)) {
        alertWarn({
          title: `Confirmation WhatsApp non envoyée — ${data.orderNumber}`,
          body: 'La cliente ne recevra pas le message de confirmation automatique. Contacte-la manuellement.',
          context: {
            orderNumber: data.orderNumber,
            customer: data.fullName,
            phone: data.phone,
            reason: whatsappResult.reason.slice(0, 400),
          },
          fingerprint: 'wa-confirm-failed',
        });
      }
    }

    if (!telegramResult.ok) {
      console.error('[telegram] admin notification failed', {
        orderNumber: data.orderNumber,
        reason: telegramResult.reason,
      });
      // If Telegram is down we obviously can't alert via Telegram. Just log.
    }

    if (!sheetsResult.ok) {
      console.error('[sheets] sync failed', {
        orderNumber: data.orderNumber,
        reason: sheetsResult.reason,
      });
      alertWarn({
        title: 'Google Sheets désynchronisé',
        body: `Le Sheet ne reflète plus la base. Clique « Sync Sheets » dans l'admin pour rattraper.`,
        context: { orderNumber: data.orderNumber, reason: sheetsResult.reason.slice(0, 400) },
        fingerprint: 'sheets-sync-failed',
      });
    }

    // If BOTH emails failed AND the customer has no Telegram backup, the
    // admin literally has no async record beyond Supabase — alert hard.
    if (!adminResult.ok && !telegramResult.ok) {
      alertError({
        title: `Aucune notification reçue pour ${data.orderNumber}`,
        body: 'Email admin ET Telegram ont échoué. La commande EST bien dans Supabase (ouvre /admin) mais aucune notif n\'a été envoyée.',
        context: {
          orderNumber: data.orderNumber,
          customer: data.fullName,
          phone: data.phone,
          adminEmailReason: adminResult.reason,
          telegramReason: telegramResult.reason,
        },
        fingerprint: 'notify-total-failure',
      });
    }

    return NextResponse.json({
      ok: true,
      admin: adminResult,
      customer: customerResult,
      whatsapp: whatsappResult,
      telegram: telegramResult,
      sheets: sheetsResult,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
