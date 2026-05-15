import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  upsertOrderToSheet,
  bulkUpsertOrdersToSheet,
  deleteOrderFromSheet,
  type SheetsOrderPayload,
} from '@/lib/sheets';

/**
 * Single endpoint used by the admin and the WhatsApp webhook to keep the
 * Google Sheet in lockstep with Supabase. Accepts either:
 *
 *   { ids: string[] }            → fetch those orders from Supabase, upsert
 *   { delete: string[] }         → remove those order_numbers from the sheet
 *
 * Both lists may be sent in the same call. We always read from Supabase
 * (never trust client-supplied row data) so the sheet can't drift from the
 * source of truth.
 */

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
  items?: Array<{ name: string; qty: number; size: string; color: string }>;
}

function toSheetsPayload(o: OrderRow): SheetsOrderPayload {
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
    items: o.items ?? [],
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { ids?: string[]; delete?: string[] };
    const sb = getSupabaseAdmin();

    let upsertResult: { ok: boolean; reason: string } = { ok: true, reason: 'no-upsert' };
    let deleteResult: { ok: boolean; reason: string } = { ok: true, reason: 'no-delete' };

    if (body.ids && body.ids.length > 0) {
      const { data, error } = await sb
        .from('orders')
        .select('order_number,status,full_name,phone,email,address,city,total,created_at,cancel_reason,items')
        .in('id', body.ids);

      if (error) {
        upsertResult = { ok: false, reason: error.message };
      } else if (data && data.length > 0) {
        const payloads = (data as OrderRow[]).map(toSheetsPayload);
        upsertResult = await bulkUpsertOrdersToSheet(payloads);
      }
    }

    if (body.delete && body.delete.length > 0) {
      // Apps Script handles one delete per call — loop sequentially; the
      // list is tiny in practice (bulk admin deletes), so latency is fine.
      const reasons: string[] = [];
      for (const num of body.delete) {
        const r = await deleteOrderFromSheet(num);
        reasons.push(`${num}:${r.ok ? 'ok' : r.reason}`);
      }
      deleteResult = { ok: true, reason: reasons.join('|') };
    }

    return NextResponse.json({ ok: true, upsert: upsertResult, delete: deleteResult });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
