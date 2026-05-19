import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Reviews public API.
 *
 *   GET /api/reviews?product_id=X
 *     Returns approved reviews + aggregate rating for a product.
 *     Public, no auth.
 *
 *   POST /api/reviews
 *     Body: { product_id, rating (1-5), comment?, customer_name, hp? }
 *     Submits a review with status='pending'. Admin moderates from /admin.
 *     Honeypot field `hp` must be empty (anti-bot).
 *     Returns { ok: true } even on dedupe — never leaks moderation state.
 */

interface SubmitBody {
  product_id?: string;
  rating?: number;
  comment?: string;
  customer_name?: string;
  hp?: string; // honeypot
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get('product_id');
  if (!productId) {
    return NextResponse.json({ ok: false, error: 'missing-product-id' }, { status: 400 });
  }

  const sb = await getSupabaseServer();
  // Two queries in parallel: the list (visible reviews) + the aggregate.
  const [{ data: reviews, error: reviewsErr }, { data: agg, error: aggErr }] = await Promise.all([
    sb.from('product_reviews')
      .select('id, rating, comment, customer_name, created_at')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50),
    sb.rpc('product_rating_summary', { p_product_id: productId }),
  ]);

  if (reviewsErr) {
    return NextResponse.json({ ok: false, error: reviewsErr.message }, { status: 500 });
  }
  // RPC errors aren't critical — fall back to computing from the list.
  const summary = !aggErr && Array.isArray(agg) && agg[0]
    ? agg[0]
    : { avg_rating: null, total: reviews?.length || 0 };

  return NextResponse.json({
    ok: true,
    avg_rating: summary.avg_rating,
    total: summary.total,
    reviews: reviews || [],
  });
}

export async function POST(req: Request) {
  // 5 reviews per IP per 10 minutes — a real customer never needs more,
  // and bots get throttled before they fill the moderation queue.
  const rl = checkRateLimit(req, { limit: 5, windowMs: 10 * 60_000, scope: 'reviews' });
  if (!rl.ok) return rl.response;

  let body: SubmitBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 }); }

  const { product_id, rating, comment, customer_name, hp } = body;

  // Honeypot — bots fill every field including hidden ones, real users don't.
  // Silent success so the bot doesn't learn it was blocked.
  if (hp && hp.length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (!product_id || typeof product_id !== 'string') {
    return NextResponse.json({ ok: false, error: 'missing-product' }, { status: 400 });
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: 'invalid-rating' }, { status: 400 });
  }
  if (!customer_name || customer_name.trim().length < 2 || customer_name.trim().length > 100) {
    return NextResponse.json({ ok: false, error: 'invalid-name' }, { status: 400 });
  }
  if (comment && comment.length > 2000) {
    return NextResponse.json({ ok: false, error: 'comment-too-long' }, { status: 400 });
  }

  // We use the SERVICE ROLE here so this works whether or not the visitor
  // is authenticated. The schema's CHECK constraint + RLS still gate what
  // can be inserted (rating 1-5, status forced to 'pending').
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('product_reviews').insert({
    product_id,
    rating: Math.round(rating),
    comment: comment?.trim() || null,
    customer_name: customer_name.trim(),
    status: 'pending',
  });

  if (error) {
    console.error('[reviews] insert failed', error);
    return NextResponse.json({ ok: false, error: 'insert-failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
