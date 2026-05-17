/**
 * Small helper for next/image's `unoptimized` flag.
 *
 * Background: <Image> can only optimize images served from origins that
 * are whitelisted in next.config.mjs (`images.remotePatterns`). For URLs
 * outside that list it throws at runtime, so callers usually set
 * `unoptimized` defensively. The naive pattern `src.startsWith('http')`
 * over-applies that — it also disables optimization for our own
 * Supabase Storage URLs, which IS whitelisted, costing ~40-60% extra
 * bandwidth on every product image.
 *
 * Use:
 *   <Image src={src} unoptimized={shouldSkipImageOptimization(src)} ... />
 */

// Mirror of the host pattern in next.config.mjs `images.remotePatterns`.
// Update both together if you ever add another image host.
const OPTIMIZABLE_HOSTS = ['.supabase.co'];

export function shouldSkipImageOptimization(src: string | undefined | null): boolean {
  if (!src) return false;
  // Relative path (e.g. /assets/...) — always optimizable via the default loader.
  if (!src.startsWith('http')) return false;
  // External URL — only skip optimization when it's NOT in our whitelist.
  return !OPTIMIZABLE_HOSTS.some((h) => src.includes(h));
}
