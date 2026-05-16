import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Check whether an email is registered before triggering a password
 * reset, so the UI can show a clear "this email isn't registered"
 * message instead of pretending a code was sent.
 *
 * Returns 200 always (never reveals via HTTP status) but the JSON
 * { exists: boolean } tells the client what to do. We rate-limit
 * implicitly via Supabase's admin API rate limits.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ exists: false, error: 'bad-email' }, { status: 200 });
    }

    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ exists: false, error: 'invalid-format' }, { status: 200 });
    }

    const sb = getSupabaseAdmin();
    // Supabase's admin API supports filtering listUsers by email.
    const { data, error } = await sb.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    if (error) {
      console.error('[check-email] listUsers failed', error);
      // Fail-open: if we can't check, assume exists so user can still
      // attempt the reset. Worse to lock legitimate users out.
      return NextResponse.json({ exists: true, fallback: true }, { status: 200 });
    }

    // listUsers without filter returns paginated users; we need the
    // generateLink API to check existence cheaply. Alternative: scan
    // all pages — fine for small projects (< 1000 users).
    // For now, do a full-paginated lookup capped at 5 pages.
    let exists = false;
    let page = 1;
    while (page <= 5) {
      const { data: pageData } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
      const users = pageData?.users || [];
      if (users.some((u) => (u.email || '').toLowerCase() === normalized)) {
        exists = true;
        break;
      }
      if (users.length < 1000) break;
      page++;
    }

    return NextResponse.json({ exists }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { exists: true, fallback: true, error: e instanceof Error ? e.message : 'unknown' },
      { status: 200 }
    );
  }
}
