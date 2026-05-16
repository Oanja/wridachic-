import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { bulkUpsertOrdersToSheet, setupSheetsDashboard } from '@/lib/sheets';

/**
 * One-shot maintenance endpoint, fired from the admin UI:
 *   POST /api/sheets-backfill
 *
 * - Pulls every row from `orders` and bulk-upserts it into the Sheet so
 *   the user has their full history.
 * - Triggers the Apps Script's `setup_dashboard` action to (re)create the
 *   Dashboard tab with the latest KPI formulas.
 *
 * Safe to call repeatedly: bulk_upsert is idempotent (insert-or-update by
 * order_number) and setup_dashboard clears and rebuilds the dashboard
 * sheet from scratch.
 */

interface ItemSnapshot {
  name: string;
  qty: number;
  size: string;
  color: string;
  price?: number;
  cost?: number | null;
}

/** 20 MAD Casablanca, 35 MAD elsewhere. Same logic as /api/sync-order. */
function deliveryCostFor(city: string | null | undefined): number {
  const c = (city ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  return c.includes('casablanca') || c.includes('casa') ? 20 : 35;
}

export async function POST() {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('orders')
      .select('order_number,status,full_name,phone,email,address,city,total,created_at,cancel_reason,items')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const payloads = (data ?? []).map((o) => {
      const items: ItemSnapshot[] = o.items ?? [];
      const cost_total = items.reduce(
        (sum, it) => sum + (typeof it.cost === 'number' ? it.cost * it.qty : 0),
        0,
      );
      return {
        orderNumber: o.order_number,
        fullName: o.full_name,
        phone: o.phone,
        email: o.email,
        address: o.address,
        city: o.city,
        total: o.total,
        status: o.status,
        cancel_reason: o.cancel_reason,
        created_at: o.created_at,
        items,
        cost_total,
        delivery_cost: deliveryCostFor(o.city),
      };
    });

    const sync = await bulkUpsertOrdersToSheet(payloads);
    const dashboard = await setupSheetsDashboard();

    return NextResponse.json({ ok: true, count: payloads.length, sync, dashboard });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
