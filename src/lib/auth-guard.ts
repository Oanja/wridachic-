/**
 * Server-side admin guard for protected API routes.
 *
 * Calls Supabase `is_admin` RPC using the user's session cookie. Returns
 * { ok: true } when allowed, otherwise an error you can return as 401/403.
 *
 * Usage in any /api/* route:
 *
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: guard.status });
 *
 * Why an RPC and not just a session check: any logged-in customer would
 * pass a bare session check. The RPC is the single source of truth used
 * by the admin UI itself (AdminPage.tsx → sb.rpc('is_admin')).
 */
import { NextResponse } from 'next/server';
import { getSupabaseServer } from './supabase/server';

export type GuardResult =
  | { ok: true }
  | { ok: false; status: 401 | 403; reason: string };

export async function requireAdmin(): Promise<GuardResult> {
  try {
    const sb = await getSupabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { ok: false, status: 401, reason: 'not-signed-in' };

    const { data: isAdmin, error } = await sb.rpc('is_admin');
    if (error) {
      console.error('[auth-guard] is_admin rpc failed', error);
      return { ok: false, status: 403, reason: 'rpc-failed' };
    }
    if (!isAdmin) return { ok: false, status: 403, reason: 'not-admin' };

    return { ok: true };
  } catch (e) {
    console.error('[auth-guard] unexpected', e);
    return { ok: false, status: 403, reason: 'guard-error' };
  }
}

/**
 * One-liner for routes: returns NextResponse if blocked, null if allowed.
 *
 *   const block = await blockIfNotAdmin();
 *   if (block) return block;
 */
export async function blockIfNotAdmin() {
  const g = await requireAdmin();
  if (g.ok) return null;
  return NextResponse.json({ ok: false, error: g.reason }, { status: g.status });
}

/**
 * For endpoints called both by the admin UI AND server-side by cron jobs.
 * Allows the request if the header `x-cron-secret` matches CRON_SECRET, OR
 * the session belongs to an admin. Returns null when allowed.
 */
export async function blockIfNotAdminOrCron(req: Request) {
  const cronHeader = req.headers.get('x-cron-secret');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && cronHeader && cronHeader === cronSecret) return null;
  return blockIfNotAdmin();
}
