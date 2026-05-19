/**
 * Lightweight in-memory IP rate limiter.
 *
 * Why not Upstash/Vercel KV: that would mean a new paid dependency and
 * an extra round-trip per request. For our scale (a few thousand requests
 * per day) an in-process Map is plenty — it stops the cheapest abuse
 * vectors (a script hammering /api/reviews in a loop) and any attacker
 * sophisticated enough to rotate IPs to bypass it would also bypass
 * Upstash anyway.
 *
 * Caveats this deliberately accepts:
 *   - Per-instance: Vercel serverless functions may spawn multiple
 *     instances, each with its own Map. A burst could get N× the limit.
 *     That's fine — we're protecting against script kiddies, not against
 *     a distributed attack. For DDoS Vercel's own protection layer
 *     handles it.
 *   - Memory: capped at ~10k unique IPs via LRU-ish pruning; old entries
 *     drop off automatically.
 *
 * Usage in any API route:
 *
 *   const rl = checkRateLimit(req, { limit: 5, windowMs: 60_000 });
 *   if (!rl.ok) return rl.response;
 *   // ... continue with the real handler
 */
import { NextResponse } from 'next/server';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function getClientIp(req: Request): string {
  // Vercel sets x-forwarded-for. First entry is the real client.
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export interface RateLimitOptions {
  /** Max requests allowed in `windowMs`. Default: 10. */
  limit?: number;
  /** Sliding window in milliseconds. Default: 60_000 (1 minute). */
  windowMs?: number;
  /** Bucket key prefix so two routes don't share counters. */
  scope?: string;
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; response: NextResponse; remaining: 0; resetAt: number };

export function checkRateLimit(req: Request, opts: RateLimitOptions = {}): RateLimitResult {
  const limit = opts.limit ?? 10;
  const windowMs = opts.windowMs ?? 60_000;
  const scope = opts.scope ?? 'global';
  const ip = getClientIp(req);
  const key = `${scope}:${ip}`;
  const now = Date.now();

  // Cheap LRU-ish prune so the Map doesn't grow unbounded across deploys.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt < now) buckets.delete(k);
      if (buckets.size < MAX_BUCKETS / 2) break;
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      ok: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      response: NextResponse.json(
        { ok: false, error: 'rate-limited', retryAfter: retryAfterSec },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
          },
        },
      ),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}
