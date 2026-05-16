/**
 * Central place to send technical alerts to the admin via Telegram.
 *
 * The "orders" Telegram group already exists (TELEGRAM_CHAT_ID). For
 * critical system alerts (failed inserts, expiring quotas, etc.) you can
 * optionally point TELEGRAM_ALERTS_CHAT_ID at a different chat so business
 * notifications don't drown out tech ones. If unset, alerts fall back to
 * the orders chat.
 *
 * Every helper is fire-and-forget: it logs to the server console on
 * failure but never throws, so a flaky Telegram never breaks the user's
 * request.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALERTS_CHAT_ID =
  process.env.TELEGRAM_ALERTS_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

type Severity = 'info' | 'warn' | 'error' | 'critical';

const PREFIX: Record<Severity, string> = {
  info: 'ℹ️ <b>INFO</b>',
  warn: '⚠️ <b>WARN</b>',
  error: '🔴 <b>ERROR</b>',
  critical: '🚨 <b>CRITICAL</b>',
};

function escape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Simple in-memory dedupe so a single bad downstream service doesn't spam
// Telegram with thousands of identical alerts during an incident. We
// remember the last 30 fingerprints and suppress repeats within 5 minutes.
const RECENT: Map<string, number> = new Map();
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;
const RECENT_MAX = 30;

function shouldSend(fingerprint: string): boolean {
  const now = Date.now();
  for (const [k, ts] of RECENT) {
    if (now - ts > DEDUPE_WINDOW_MS) RECENT.delete(k);
  }
  const last = RECENT.get(fingerprint);
  if (last && now - last < DEDUPE_WINDOW_MS) return false;
  RECENT.set(fingerprint, now);
  if (RECENT.size > RECENT_MAX) {
    const oldest = Array.from(RECENT.entries()).sort((a, b) => a[1] - b[1])[0];
    if (oldest) RECENT.delete(oldest[0]);
  }
  return true;
}

export interface AlertOptions {
  /** Short title. Becomes the dedupe fingerprint by default. */
  title: string;
  /** Free-form body. Keep under ~1k chars — Telegram caps at 4096. */
  body?: string;
  /** Severity. Affects the icon + label only. */
  severity?: Severity;
  /** Key/value context dumped below the body. */
  context?: Record<string, unknown>;
  /** Custom fingerprint for dedupe. Defaults to `title`. */
  fingerprint?: string;
}

export async function sendAlert(opts: AlertOptions): Promise<void> {
  const severity = opts.severity ?? 'error';
  const fingerprint = opts.fingerprint ?? opts.title;
  if (!shouldSend(`${severity}:${fingerprint}`)) return;

  if (!BOT_TOKEN || !ALERTS_CHAT_ID) {
    console.error('[alert][missing-telegram-env]', opts.title, opts.body, opts.context);
    return;
  }

  const lines: string[] = [
    PREFIX[severity] + ' — ' + escape(opts.title),
  ];
  if (opts.body) lines.push('', escape(opts.body));
  if (opts.context) {
    lines.push('', '<pre>' + escape(JSON.stringify(opts.context, null, 2)).slice(0, 1500) + '</pre>');
  }
  const text = lines.join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ALERTS_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error('[alert][telegram-non-ok]', res.status, await res.text());
    }
  } catch (e) {
    console.error('[alert][telegram-throw]', e);
  }
}

/** Convenience helpers — same args as sendAlert but with severity preset. */
export const alertInfo = (o: Omit<AlertOptions, 'severity'>) => sendAlert({ ...o, severity: 'info' });
export const alertWarn = (o: Omit<AlertOptions, 'severity'>) => sendAlert({ ...o, severity: 'warn' });
export const alertError = (o: Omit<AlertOptions, 'severity'>) => sendAlert({ ...o, severity: 'error' });
export const alertCritical = (o: Omit<AlertOptions, 'severity'>) => sendAlert({ ...o, severity: 'critical' });
