import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { alertCritical, alertInfo } from '@/lib/alerts';

/**
 * Daily backup of the entire `orders` table → a fresh tab inside the
 * existing Google Sheet, named "backup-YYYY-MM-DD". This gives the user
 * an immutable audit trail they can browse / export, independent of the
 * live `orders` tab (which mutates as orders are updated/deleted).
 *
 * Why a Sheet tab instead of Google Drive directly? The Apps Script web
 * app we already deployed has the credentials to write to the Sheet —
 * no extra service account / OAuth dance needed. The Sheet lives in
 * the user's Drive anyway.
 *
 * Triggered by Vercel Cron daily (vercel.json). Protected by CRON_SECRET.
 */

const CRON_SECRET = process.env.CRON_SECRET;
const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  if (!WEBHOOK_URL || !WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'no-sheets-webhook' }, { status: 500 });
  }

  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('orders')
      .select('order_number,status,full_name,phone,email,address,city,total,created_at,cancel_reason,items')
      .order('created_at', { ascending: true });

    if (error) {
      alertCritical({
        title: 'Backup quotidien — Supabase fetch failed',
        body: 'Impossible de lire les commandes pour le backup.',
        context: { error: error.message },
        fingerprint: 'backup-supabase-fail',
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const today = new Date();
    const tabName = `backup-${today.toISOString().slice(0, 10)}`;

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        secret: WEBHOOK_SECRET,
        action: 'snapshot',
        tabName,
        orders: (data ?? []).map((o) => ({
          orderNumber: o.order_number,
          status: o.status,
          fullName: o.full_name,
          phone: o.phone,
          email: o.email,
          city: o.city,
          address: o.address,
          total: o.total,
          createdAt: o.created_at,
          cancelReason: o.cancel_reason,
          items: o.items,
        })),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      alertCritical({
        title: 'Backup quotidien — Apps Script failed',
        body: 'Le snapshot n\'a pas pu être écrit dans le Sheet.',
        context: { status: res.status, body: text.slice(0, 300) },
        fingerprint: 'backup-apps-script-fail',
      });
      return NextResponse.json({ ok: false, error: text.slice(0, 200) }, { status: 500 });
    }

    // Log a non-noisy info every successful backup so the admin can
    // confirm it ran (e.g. when they open the alerts group on Monday).
    alertInfo({
      title: `Backup quotidien OK — ${data?.length ?? 0} commandes`,
      body: `Sauvegarde dans l'onglet "${tabName}" du Google Sheet.`,
      fingerprint: 'backup-ok-' + tabName, // unique per day → no dedupe issue
    });

    return NextResponse.json({ ok: true, tabName, count: data?.length ?? 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    alertCritical({
      title: 'Backup quotidien — exception',
      body: msg,
      fingerprint: 'backup-throw',
    });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
