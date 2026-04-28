// Supabase Edge Function — sends a newsletter to a list of recipients via Resend.
//
// Auth: caller must be an authenticated admin (we verify via the supabase JS
// client and the existing is_admin() RPC, so we don't trust the client to lie).
//
// Setup (one-time, by the user):
//   1. Sign up at https://resend.com → verify the wridachic.com domain
//      (add the DNS records Resend provides to the domain registrar).
//   2. Create an API key in the Resend dashboard.
//   3. In Supabase Dashboard → Project Settings → Edge Functions → Secrets:
//        RESEND_API_KEY  = re_xxxxxxxxxx
//        FROM_EMAIL      = wridachic <noreply@wridachic.com>
//   4. Deploy:  supabase functions deploy send-newsletter
//
// Body shape (POST JSON):
//   { subject: string, html: string, recipients: string[] }
//
// Response: { sent: number, failed: number, errors?: Array<{email, error}> }

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') || 'wridachic <onboarding@resend.dev>';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON  = Deno.env.get('SUPABASE_ANON_KEY')!;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST')    return json({ error: 'method_not_allowed' }, 405);

  if (!RESEND_API_KEY) return json({ error: 'resend_not_configured' }, 500);

  // ── Authenticate as the calling admin ──
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'no_auth' }, 401);

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr || !userData?.user) return json({ error: 'invalid_session' }, 401);

  const { data: isAdmin } = await sb.rpc('is_admin');
  if (!isAdmin) return json({ error: 'not_admin' }, 403);

  // ── Parse + validate ──
  let body: { subject?: string; html?: string; recipients?: string[] };
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const subject = (body.subject || '').trim();
  const html    = (body.html || '').trim();
  const recipients = Array.isArray(body.recipients)
    ? body.recipients.filter((e) => typeof e === 'string' && e.includes('@'))
    : [];

  if (!subject || !html) return json({ error: 'missing_subject_or_body' }, 400);
  if (recipients.length === 0) return json({ error: 'no_recipients' }, 400);
  if (recipients.length > 200)  return json({ error: 'too_many_recipients_max_200' }, 400);

  // ── Send each email individually so addresses stay private ──
  let sent = 0, failed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  for (const email of recipients) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    FROM_EMAIL,
          to:      [email],
          subject,
          html,
        }),
      });
      if (r.ok) {
        sent++;
      } else {
        failed++;
        const err = await r.text();
        errors.push({ email, error: err.slice(0, 200) });
      }
    } catch (e) {
      failed++;
      errors.push({ email, error: String(e).slice(0, 200) });
    }
  }

  return json({ sent, failed, errors: errors.length ? errors : undefined });
});
