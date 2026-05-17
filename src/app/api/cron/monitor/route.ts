import { NextResponse } from 'next/server';
import { alertWarn, alertCritical } from '@/lib/alerts';

/**
 * Scheduled monitor — pinged by Vercel Cron every 6 hours. Hits the
 * health + usage-stats endpoints, then alerts if any service is down OR
 * any quota crossed 80%.
 *
 * Vercel cron sends `Authorization: Bearer <CRON_SECRET>` (set in env).
 * We reject calls without it so randos can't trigger noise.
 */

const CRON_SECRET = process.env.CRON_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wridachic.com';

export async function GET(req: Request) {
  // Vercel cron auth check
  const auth = req.headers.get('authorization') || '';
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // Health check
  try {
    const r = await fetch(`${SITE_URL}/api/health`, {
      cache: 'no-store',
      headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
    });
    const data = await r.json();
    results.health = data;

    for (const [name, svc] of Object.entries(data.services as Record<string, { ok: boolean; detail?: string }>)) {
      if (!svc.ok) {
        alertCritical({
          title: `Service ${name} indisponible`,
          body: `Le service ${name} ne répond pas. Le site continue de fonctionner mais cette fonctionnalité est en panne.`,
          context: { service: name, detail: svc.detail },
          fingerprint: `cron-down-${name}`,
        });
      }
    }
  } catch (e) {
    results.healthError = e instanceof Error ? e.message : 'unknown';
  }

  // Usage check
  try {
    const r = await fetch(`${SITE_URL}/api/usage-stats`, {
      cache: 'no-store',
      headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
    });
    const data = await r.json();
    results.usage = data;

    for (const [name, quota] of Object.entries(data.quotas as Record<string, { used: number; limit: number; pct: number; ok: boolean }>)) {
      if (!quota.ok) {
        alertWarn({
          title: `Quota ${name} à ${quota.pct}%`,
          body: `Tu approches la limite : ${quota.used} / ${quota.limit}. Pense à upgrader avant que ça ne bloque les commandes.`,
          context: { quota: name, used: quota.used, limit: quota.limit, pct: quota.pct },
          fingerprint: `cron-quota-${name}`,
        });
      }
    }
  } catch (e) {
    results.usageError = e instanceof Error ? e.message : 'unknown';
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results });
}
