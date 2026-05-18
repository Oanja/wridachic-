import { getAllProducts } from '@/lib/products';

/**
 * Google Merchant Center product feed (XML).
 *
 * Spec: https://support.google.com/merchants/answer/7052112
 * Format: RSS 2.0 with Google Shopping namespace
 *
 * Why XML and not the simpler CSV: XML supports the `<g:additional_image_link>`
 * tag for multiple product photos (CSV is one image per row), and Merchant
 * Center polls it on a schedule so the catalogue stays fresh without any
 * manual upload.
 *
 * Cache: 1 hour at the edge — Merchant fetches roughly every 4-24 h so we
 * don't need real-time freshness, but we DO want cheap repeat fetches.
 *
 * URL: https://wridachic.com/api/feed/products.xml
 *
 * Setup at https://merchants.google.com:
 *   1. Add product feed → Source: "Scheduled fetch"
 *   2. URL: https://wridachic.com/api/feed/products.xml
 *   3. Schedule: Daily at 03:00 (matches our backup cron)
 *
 * Required Google fields per item (we generate all):
 *   id, title, description, link, image_link, availability, price,
 *   brand, condition, identifier_exists (false — handmade items, no GTIN)
 */

export const dynamic = 'force-dynamic';
export const revalidate = 3600;
// Edge runtime cuts cold-start to near-zero. The handler only reads
// products from Supabase (which has Edge-compatible js client) and
// emits XML — no Node-only APIs (fs, sharp, etc.) are touched, so
// this is a safe migration that drops latency by ~200-400 ms per request.
export const runtime = 'edge';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wridachic.com';
const BRAND = 'WridaChic';

// Minimal XML-escape — Google's parser is strict about unescaped & and <.
function esc(s: string | undefined | null): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absoluteUrl(src: string): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/')) return `${SITE_URL}${src}`;
  return `${SITE_URL}/${src}`;
}

export async function GET() {
  const products = await getAllProducts();

  // Only show items the visitor can actually buy. Out-of-stock items
  // CAN be listed with availability=out_of_stock but Google deprioritizes
  // them — better to skip until restocked.
  const sellable = products.filter((p) => p.stock === null || p.stock === undefined || p.stock > 0);

  const items = sellable.map((p) => {
    const images = (p.imgFiles || []).map(absoluteUrl).filter(Boolean);
    const primary = images[0] || `${SITE_URL}/wa-logo.png`;
    const additional = images.slice(1, 11); // Google allows up to 10 extra
    const productUrl = `${SITE_URL}/product/${p.slug}`;
    const description = p.description || `${p.name} — Mode féminine marocaine de qualité, livraison partout au Maroc.`;

    return `
    <item>
      <g:id>${esc(p.id)}</g:id>
      <g:title>${esc(p.name)}</g:title>
      <g:description>${esc(description)}</g:description>
      <g:link>${esc(productUrl)}</g:link>
      <g:image_link>${esc(primary)}</g:image_link>
${additional.map((img) => `      <g:additional_image_link>${esc(img)}</g:additional_image_link>`).join('\n')}
      <g:availability>in_stock</g:availability>
      <g:price>${p.price.toFixed(2)} MAD</g:price>
      <g:brand>${esc(BRAND)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing &gt; Dresses</g:google_product_category>
      <g:product_type>${esc(p.cat)}</g:product_type>
      <g:shipping>
        <g:country>MA</g:country>
        <g:service>Standard</g:service>
        <g:price>35.00 MAD</g:price>
      </g:shipping>
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>WridaChic — Mode féminine marocaine</title>
    <link>${SITE_URL}</link>
    <description>Robes, ensembles et essentiels féminins. Livraison partout au Maroc.</description>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
