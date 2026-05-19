/**
 * GDPR-compliant account + data deletion.
 *
 * Triggered by a signed-in customer from /account → "Supprimer mon
 * compte". Wipes everything PII-related:
 *   - the user's wishlist
 *   - their newsletter subscription
 *   - anonymizes their orders (we keep the order rows for accounting /
 *     fiscal obligations — Morocco requires invoices kept ~10 years —
 *     but blank out name/phone/email/address so they cease to be PII)
 *   - the Supabase Auth user itself (auth.users)
 *
 * The customer is signed out automatically as a side effect of the
 * auth.users deletion. Fully synchronous — by the time we return,
 * nothing personal remains in the DB.
 *
 * Rate-limited to 1 per 30 min per IP to slow down griefers who'd
 * spam delete attempts.
 */
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendTelegramText, TELEGRAM_CHATS } from '@/lib/telegram';

export async function POST(req: Request) {
  const rl = checkRateLimit(req, { limit: 1, windowMs: 30 * 60_000, scope: 'account-delete' });
  if (!rl.ok) return rl.response;

  // 1) Authenticate the caller via their session cookie.
  let userId: string;
  let userEmail: string | undefined;
  try {
    const sb = await getSupabaseServer();
    const { data: { user }, error } = await sb.auth.getUser();
    if (error || !user) return NextResponse.json({ ok: false, error: 'not-signed-in' }, { status: 401 });
    userId = user.id;
    userEmail = user.email;
  } catch {
    return NextResponse.json({ ok: false, error: 'auth-failed' }, { status: 401 });
  }

  // 2) Wipe personal data with the service role (bypasses RLS).
  const admin = getSupabaseAdmin();
  const results: Record<string, string> = {};

  try {
    await admin.from('wishlists').delete().eq('user_id', userId);
    results.wishlist = 'deleted';
  } catch (e) {
    results.wishlist = 'error: ' + (e instanceof Error ? e.message : 'unknown');
  }

  if (userEmail) {
    try {
      await admin.from('newsletter_subscribers').delete().eq('email', userEmail.toLowerCase());
      results.newsletter = 'deleted';
    } catch (e) {
      results.newsletter = 'error: ' + (e instanceof Error ? e.message : 'unknown');
    }
  }

  // Orders: anonymize but don't delete (fiscal record-keeping).
  try {
    const { count } = await admin
      .from('orders')
      .update({
        full_name: '[deleted]',
        phone: '[deleted]',
        email: null,
        address: '[deleted]',
        user_id: null,
      }, { count: 'exact' })
      .eq('user_id', userId);
    results.orders = `anonymized: ${count ?? 0}`;
  } catch (e) {
    results.orders = 'error: ' + (e instanceof Error ? e.message : 'unknown');
  }

  // 3) Delete the auth.users row last (irreversible — once gone, the
  // user is signed out everywhere and cannot recover the account).
  try {
    await admin.auth.admin.deleteUser(userId);
    results.auth = 'deleted';
  } catch (e) {
    results.auth = 'error: ' + (e instanceof Error ? e.message : 'unknown');
    // If we can't delete the auth row, partial wipe is a problem.
    // Surface to admin via Telegram so we can finish manually.
    sendTelegramText(
      `⚠️ GDPR delete partial — user ${userId} (${userEmail ?? 'no email'})\n` +
      `Auth row delete failed: ${results.auth}\n` +
      `PII tables: ${JSON.stringify(results)}`,
      TELEGRAM_CHATS.alerts,
    ).catch(() => {});
    return NextResponse.json({ ok: false, error: 'partial-delete', results }, { status: 500 });
  }

  // Audit log so the admin sees deletions in the Telegram timeline.
  sendTelegramText(
    `🗑️ Account deletion — ${userEmail ?? userId}\n` + JSON.stringify(results, null, 2),
    TELEGRAM_CHATS.alerts,
  ).catch(() => {});

  return NextResponse.json({ ok: true, results });
}
