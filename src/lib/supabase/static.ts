import { createClient } from '@supabase/supabase-js';

/**
 * A cookieless Supabase client for purely public reads (products,
 * settings, reviews aggregate, etc.).
 *
 * The default `getSupabaseServer()` opts the route into Next.js' dynamic
 * rendering because it awaits `cookies()` — every visit then bypasses
 * the CDN cache and hits origin. For data that is the same for every
 * user, that's a waste of TTFB. This client uses the anon key directly
 * with no cookies, so the route stays cacheable and `revalidate = 300`
 * actually works end-to-end:
 *
 *   First visit  → origin renders, Edge caches the HTML
 *   Next visits  → served from Edge in ~30 ms (vs 250-330 ms before)
 *
 * RLS still applies — anon role can only read what the policies allow.
 *
 * Usage:
 *   const sb = getSupabaseStatic();
 *   const { data } = await sb.from('products').select(...);
 */
let cachedClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseStatic() {
  if (cachedClient) return cachedClient;
  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
  return cachedClient;
}
