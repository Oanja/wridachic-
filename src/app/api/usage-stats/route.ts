import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { blockIfNotAdminOrCron } from '@/lib/auth-guard';

/**
 * Pull the actual count of emails sent in the last 24h from Resend.
 *
 * Resend doesn't expose a usage endpoint, but the /emails list endpoint
 * gives us up to 100 most-recent emails per page — more than enough for
 * our daily volume. We filter client-side by `created_at` to count only
 * the past 24h, which is exactly what the free tier limit gates against.
 *
 * Returns null if the API key isn't set or the request fails — caller
 * then falls back to the order-count estimate so the dashboard never
 * shows a blank value.
 */
/**
 * Pull the actual count of WhatsApp Service conversations this month
 * from the Meta Graph API. Returns null if not configured / failed.
 *
 * Required env vars (both must be set, else we fall back to the estimate):
 *   WHATSAPP_BUSINESS_ACCOUNT_ID  — the WABA ID (find at business.facebook.com)
 *   WHATSAPP_ACCESS_TOKEN         — already used by send-message code
 *
 * Performance: one GET to graph.facebook.com per dashboard load. We
 * AbortController-timeout at 4 s so a slow Meta day can't hang the
 * admin page; on timeout we return null and the estimate kicks in.
 */
async function fetchWhatsAppConversationsThisMonth(): Promise<number | null> {
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!wabaId || !token) return null;

  const monthStartEpoch = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000);
  const nowEpoch = Math.floor(Date.now() / 1000);

  // We hit pricing_analytics (not conversation_analytics) because:
  //   1) conversation_analytics requires the field-expansion query syntax
  //      `?fields=conversation_analytics.start(...).end(...)...`, AND
  //   2) even with the correct query + scopes, Meta returned 200 with the
  //      field silently missing — a permission corner case we couldn't
  //      resolve without re-provisioning the System User.
  // pricing_analytics returns the same `volume` field (= conversation
  // count, billable or free) on the standard REST endpoint and works
  // with the existing whatsapp_business_management scope.
  // DAILY granularity also sidesteps the "Too small time window" error
  // that MONTHLY throws at the start of each calendar month.
  const url = `https://graph.facebook.com/v21.0/${wabaId}/pricing_analytics?` +
    `start=${monthStartEpoch}&end=${nowEpoch}&granularity=DAILY`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    // pricing_analytics response shape:
    //   { data: [ { data_points: [ { start, end, volume, cost }, ... ] } ] }
    // Each data_point.volume = conversations on that day (free + paid).
    const points = json?.data?.[0]?.data_points || [];
    const total = points.reduce((sum: number, p: { volume?: number }) => sum + (p.volume || 0), 0);
    return total;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function fetchResendEmailsLast24h(): Promise<number | null> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.resend.com/emails?limit=100', {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const items = Array.isArray(json?.data) ? json.data : [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return items.filter((e: { created_at?: string }) => {
      const t = e.created_at ? Date.parse(e.created_at) : 0;
      return t >= cutoff;
    }).length;
  } catch {
    return null;
  }
}

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
export async function GET(req: Request) {
  const block = await blockIfNotAdminOrCron(req);
  if (block) return block;
  const sb = getSupabaseAdmin();
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ count: ordersToday }, { count: ordersThisMonth }, { count: totalOrders }, resendReal, waReal, dbSizeRpc] = await Promise.all([
    sb.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay.toISOString()),
    sb.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
    sb.from('orders').select('id', { count: 'exact', head: true }),
    fetchResendEmailsLast24h(),
    fetchWhatsAppConversationsThisMonth(),
    // RPC returns bytes as a number (Postgres bigint). If the migration
    // hasn't run yet, .rpc throws — we swallow it and fall back to the
    // row-count × 5 KB estimate below.
    (async () => {
      try {
        const r = await sb.rpc('get_db_size');
        return typeof r.data === 'number' ? r.data : null;
      } catch { return null; }
    })(),
  ]);

  // Prefer the REAL count pulled live from Resend (matches what the
  // user sees at resend.com/emails). Fall back to the order-count
  // estimate if the API call failed — better an approximation than a
  // blank value on the admin dashboard.
  const emailsToday = resendReal ?? (ordersToday ?? 0) * 1;
  const emailsSource: 'resend-api' | 'estimate' = resendReal !== null ? 'resend-api' : 'estimate';
  const RESEND_DAILY_LIMIT = 100;
  const RESEND_PCT = Math.min(100, Math.round((emailsToday / RESEND_DAILY_LIMIT) * 100));

  // WhatsApp: prefer the REAL conversation count from Meta Graph API.
  // Fall back to order-count estimate if env vars missing / Meta down.
  const waMonth = waReal ?? (ordersThisMonth ?? 0);
  const waSource: 'meta-api' | 'estimate' = waReal !== null ? 'meta-api' : 'estimate';
  const WA_MONTHLY_LIMIT = 1000;
  const WA_PCT = Math.min(100, Math.round((waMonth / WA_MONTHLY_LIMIT) * 100));

  // Supabase: prefer the REAL pg_database_size() from the RPC. Fall back
  // to row-count × 5 KB estimate if the RPC isn't deployed yet.
  const orderRowsBytes = dbSizeRpc ?? ((totalOrders ?? 0) * 5_000);
  const dbSource: 'supabase-rpc' | 'estimate' = dbSizeRpc !== null ? 'supabase-rpc' : 'estimate';
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
        source: emailsSource,
      },
      whatsappConvosThisMonth: {
        used: waMonth,
        limit: WA_MONTHLY_LIMIT,
        pct: WA_PCT,
        ok: WA_PCT < 80,
        resetIn: 'monthly',
        source: waSource,
      },
      supabaseDb: {
        usedBytes: orderRowsBytes,
        usedMb: Math.round(orderRowsBytes / 1024 / 1024 * 10) / 10,
        limitMb: 500,
        pct: DB_PCT,
        ok: DB_PCT < 80,
        source: dbSource,
        note: dbSource === 'supabase-rpc' ? 'pg_database_size() live' : 'rough estimate based on order count',
      },
    },
  });
}
