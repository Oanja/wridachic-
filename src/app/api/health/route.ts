import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Lightweight health check — used by the admin dashboard "System status"
 * widget AND by the scheduled Vercel cron job (every 6h) to confirm all
 * downstream dependencies are reachable. Returns 200 with per-service ok
 * flags so the cron can decide what to alert on.
 *
 * Intentionally has NO side effects — never alerts from here, so polling
 * doesn't generate noise. The cron job interprets results & alerts.
 */
interface ServiceStatus {
  ok: boolean;
  latencyMs?: number;
  detail?: string;
}

async function checkSupabase(): Promise<ServiceStatus> {
  const t0 = Date.now();
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from('orders').select('id', { count: 'exact', head: true }).limit(1);
    if (error) return { ok: false, detail: error.message };
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'unknown' };
  }
}

async function checkResend(): Promise<ServiceStatus> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, detail: 'no-api-key' };
  const t0 = Date.now();
  try {
    // GET /domains is cheap & doesn't send anything.
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'unknown' };
  }
}

async function checkTelegram(): Promise<ServiceStatus> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, detail: 'no-token' };
  const t0 = Date.now();
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'unknown' };
  }
}

async function checkWhatsApp(): Promise<ServiceStatus> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, detail: 'no-credentials' };
  const t0 = Date.now();
  try {
    // GET phone number info — confirms token is alive & WABA reachable.
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}?fields=verified_name`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, detail: `HTTP ${res.status}: ${body.slice(0, 100)}` };
    }
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function GET() {
  const [supabase, resend, telegram, whatsapp] = await Promise.all([
    checkSupabase(),
    checkResend(),
    checkTelegram(),
    checkWhatsApp(),
  ]);

  const services = { supabase, resend, telegram, whatsapp };
  const allOk = Object.values(services).every((s) => s.ok);

  return NextResponse.json({
    ok: allOk,
    timestamp: new Date().toISOString(),
    services,
  });
}
