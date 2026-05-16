import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Reports current free-tier usage so the admin (and the scheduled cron)
 * can spot the moment we approach an external limit and need to upgrade
 * or trim.
 *
 * The hard limits we care about:
 *   - Resend free plan:    100 emails/day
 *   - WhatsApp Cloud API:  1000 conversations/month
 *   - Supabase free:       500 MB DB size
 *   - Vercel Hobby:        100 GB bandwidth/month
 *
 * For Resend & WhatsApp we approximate by counting orders (1 order ≈
 * 2 emails + 1 WhatsApp conversation), which is accurate enough for
 * threshold alerts.
 */
export async function GET() {
  const sb = getSupabaseAdmin();
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ count: ordersToday }, { count: ordersThisMonth }, { count: totalOrders }] = await Promise.all([
    sb.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay.toISOString()),
    sb.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
    sb.from('orders').select('id', { count: 'exact', head: true }),
  ]);

  // Resend = 2 emails per order (admin + customer) — but customer only if
  // they gave an email. Conservative: assume 2/order.
  const emailsToday = (ordersToday ?? 0) * 2;
  const RESEND_DAILY_LIMIT = 100;
  const RESEND_PCT = Math.min(100, Math.round((emailsToday / RESEND_DAILY_LIMIT) * 100));

  // WhatsApp = 1 conversation per order (template send opens 24h window).
  const waMonth = ordersThisMonth ?? 0;
  const WA_MONTHLY_LIMIT = 1000;
  const WA_PCT = Math.min(100, Math.round((waMonth / WA_MONTHLY_LIMIT) * 100));

  // Supabase: rough estimate. Each row is ~3-5 KB once items JSON is
  // included; we use 5 KB as a safe upper bound.
  const orderRowsBytes = (totalOrders ?? 0) * 5_000;
  const SUPABASE_LIMIT = 500 * 1024 * 1024; // 500 MB
  const DB_PCT = Math.min(100, Math.round((orderRowsBytes / SUPABASE_LIMIT) * 100));

  return NextResponse.json({
    timestamp: now.toISOString(),
    orders: {
      today: ordersToday ?? 0,
      thisMonth: ordersThisMonth ?? 0,
      allTime: totalOrders ?? 0,
    },
    quotas: {
      resendEmailsToday: {
        used: emailsToday,
        limit: RESEND_DAILY_LIMIT,
        pct: RESEND_PCT,
        ok: RESEND_PCT < 80,
        resetIn: 'every 24h',
      },
      whatsappConvosThisMonth: {
        used: waMonth,
        limit: WA_MONTHLY_LIMIT,
        pct: WA_PCT,
        ok: WA_PCT < 80,
        resetIn: 'monthly',
      },
      supabaseDb: {
        usedBytes: orderRowsBytes,
        usedMb: Math.round(orderRowsBytes / 1024 / 1024 * 10) / 10,
        limitMb: 500,
        pct: DB_PCT,
        ok: DB_PCT < 80,
        note: 'rough estimate based on order count',
      },
    },
  });
}
