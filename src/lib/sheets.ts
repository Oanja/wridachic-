/**
 * Google Sheets sync via a user-owned Apps Script Web App.
 *
 * Why this design: a Web App URL + shared secret is the simplest way for a
 * user without a GCP project to get rows into their own Google Sheet. The
 * Apps Script runs *as the user*, so the sheet doesn't need to be shared
 * with any service account — it just needs to be the active spreadsheet of
 * the script. The shared secret stops randoms from spamming the endpoint.
 *
 * Required env vars (missing either → sync silently no-ops; orders still
 * succeed):
 *   GOOGLE_SHEETS_WEBHOOK_URL — the /exec URL from "Deploy → Web app"
 *   GOOGLE_SHEETS_WEBHOOK_SECRET — the SECRET constant inside the script
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
  items: Array<{ name: string; qty: number; size: string; color: string }>;
}

export async function upsertOrderToSheet(order: SheetsOrderPayload) {
  if (!WEBHOOK_URL || !WEBHOOK_SECRET) {
    return { ok: false, reason: 'missing-sheets-env' };
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Apps Script's /exec endpoint 302-redirects to a
      // googleusercontent.com URL on every call. fetch follows it
      // automatically and re-POSTs the body.
      redirect: 'follow',
      body: JSON.stringify({
        secret: WEBHOOK_SECRET,
        action: 'upsert',
        order,
      }),
    });

    const text = await res.text();
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}: ${text.slice(0, 200)}` };

    try {
      const json = JSON.parse(text);
      return json.ok
        ? { ok: true, reason: 'sent' }
        : { ok: false, reason: json.reason || 'unknown' };
    } catch {
      // Apps Script sometimes returns HTML on auth/redirect errors. Surface
      // a short snippet rather than dumping a whole page in logs.
      return { ok: false, reason: `non-json: ${text.slice(0, 120)}` };
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'unknown' };
  }
}
