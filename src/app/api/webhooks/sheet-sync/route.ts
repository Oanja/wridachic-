import { NextResponse, after } from 'next/server';
import { upsertOrderToSheet, deleteOrderFromSheet, type SheetsOrderPayload } from '@/lib/sheets';

/**
 * Auto-sync orders → Google Sheet whenever the `orders` table changes.
 *
 * Wired up via Supabase Database Webhooks:
 *   Dashboard → Database → Webhooks → Create
 *     Table:   orders
 *     Events:  INSERT, UPDATE, DELETE
 *     URL:     https://wridachic.com/api/webhooks/sheet-sync
 *     Headers: x-webhook-secret: <SUPABASE_WEBHOOK_SECRET>
 *
 * Why this exists: the admin used to fire a manual `syncToSheet()` after
 * every action, which made every click feel laggy + missed any change
 * that didn't come through the admin UI (direct SQL, API, etc.). With
 * this webhook the Sheet stays in sync no matter HOW the data changed
 * — and the admin gets no extra latency because the sync runs in
 * after() on a separate function invocation.
 *
 * Payload shape (Supabase webhook v1):
 *   {
 *     type: "INSERT" | "UPDATE" | "DELETE",
 *     table: "orders",
 *     record:     <new row, present for INSERT/UPDATE>,
 *     old_record: <old row, present for UPDATE/DELETE>
 *   }
 *
 * Returns 200 immediately; the actual Apps Script call runs in the
 * background so Supabase's retry logic doesn't punish us for a slow
 * Sheet sync.
 */

interface OrderItem { name: string; qty: number; size: string; color: string; price?: number; cost?: number | null }
interface OrderRow {
  order_number: string;
  status: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  total: number;
  created_at: string;
  cancel_reason?: string | null;
  items?: OrderItem[];
  lang?: string | null;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record?: OrderRow;
  old_record?: OrderRow;
}

function deliveryCostFor(city: string | null | undefined): number {
  const c = (city ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  return c.includes('casa') ? 20 : 35;
}

function toSheetPayload(o: OrderRow): SheetsOrderPayload {
  const items = o.items ?? [];
  const cost_total = items.reduce(
    (s, it) => s + (typeof it.cost === 'number' ? it.cost * it.qty : 0),
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
    lang: o.lang,
  };
}

export async function POST(req: Request) {
  // Shared secret check — Supabase sets this in the webhook config.
  // We compare against the WEBHOOK_SECRET env var. Wrong / missing
  // header → 401 (silent, no body leakage).
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'webhook-not-configured' }, { status: 503 });
  }
  const header = req.headers.get('x-webhook-secret');
  if (header !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: WebhookPayload;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 }); }

  if (body.table !== 'orders') {
    // Wrong table — ack so Supabase stops retrying.
    return NextResponse.json({ ok: true, skipped: 'wrong-table' });
  }

  // Fire-and-forget via after() so we return 200 to Supabase quickly
  // and the Apps Script call doesn't slow down its retry queue.
  after(async () => {
    try {
      if (body.type === 'DELETE' && body.old_record?.order_number) {
        await deleteOrderFromSheet(body.old_record.order_number);
      } else if ((body.type === 'INSERT' || body.type === 'UPDATE') && body.record) {
        await upsertOrderToSheet(toSheetPayload(body.record));
      }
    } catch (e) {
      console.error('[webhook/sheet-sync] sync failed', e);
    }
  });

  return NextResponse.json({ ok: true, queued: true });
}
