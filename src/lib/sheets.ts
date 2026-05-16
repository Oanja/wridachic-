/**
 * Google Sheets sync via a user-owned Apps Script Web App.
 *
 * Architecture: a single /exec endpoint accepts {secret, action, ...} POSTs.
 * Actions: `upsert`, `bulk_upsert`, `delete`, `setup_dashboard`. The shared
 * secret keeps the public webhook from being spammed. All functions silently
 * no-op when the env vars are absent so checkout never blocks on Sheets.
 *
 * Required env vars:
 *   GOOGLE_SHEETS_WEBHOOK_URL
 *   GOOGLE_SHEETS_WEBHOOK_SECRET
 */

const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;

export interface SheetsOrderPayload {
  orderNumber: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  total: number;
  status?: string;
  cancel_reason?: string | null;
  created_at?: string;
  items: Array<{ name: string; qty: number; size: string; color: string; price?: number; cost?: number | null }>;
  /** Sum of (item.cost × qty) — products' purchase cost. */
  cost_total?: number;
  /** Delivery cost paid by the business (20 MAD Casablanca, 35 MAD elsewhere). */
  delivery_cost?: number;
}

type SheetsResult = { ok: boolean; reason: string; details?: unknown };

async function call(body: Record<string, unknown>): Promise<SheetsResult> {
  if (!WEBHOOK_URL || !WEBHOOK_SECRET) {
    return { ok: false, reason: 'missing-sheets-env' };
  }
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow', // Apps Script /exec → googleusercontent redirect
      body: JSON.stringify({ secret: WEBHOOK_SECRET, ...body }),
    });

    const text = await res.text();
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}: ${text.slice(0, 200)}` };

    try {
      const json = JSON.parse(text);
      return json.ok
        ? { ok: true, reason: 'sent', details: json }
        : { ok: false, reason: json.reason || 'unknown', details: json };
    } catch {
      return { ok: false, reason: `non-json: ${text.slice(0, 120)}` };
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function upsertOrderToSheet(order: SheetsOrderPayload) {
  return call({ action: 'upsert', order });
}

export async function bulkUpsertOrdersToSheet(orders: SheetsOrderPayload[]) {
  if (orders.length === 0) return { ok: true, reason: 'nothing to sync' };
  return call({ action: 'bulk_upsert', orders });
}

export async function deleteOrderFromSheet(orderNumber: string) {
  return call({ action: 'delete', orderNumber });
}

export async function setupSheetsDashboard() {
  return call({ action: 'setup_dashboard' });
}
