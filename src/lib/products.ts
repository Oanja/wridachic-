import { cache } from 'react';
import { getSupabaseStatic } from './supabase/static';
import { FALLBACK_PRODUCTS } from './data';
import type { Product } from './types';

interface SupabaseProductRow {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  name_en: string | null;
  cat: string;
  price: number | string;
  tag: string | null;
  colors: string[] | null;
  sizes: string[] | null;
  img: string;
  img_files: string[] | null;
  description: string | null;
  description_ar: string | null;
  description_en: string | null;
  composition: string | null;
  entretien: string | null;
  details: string | null;
  mannequin: string | null;
  active: boolean | null;
  sort_order: number | null;
  stock: number | null;
  cost: number | string | null;
}

function normalizeImg(src: string): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) return src;
  return `/${src}`;
}

function transform(row: SupabaseProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameAr: row.name_ar ?? row.name,
    nameEn: row.name_en ?? undefined,
    cat: row.cat,
    price: Number(row.price),
    tag: (row.tag === 'new' || row.tag === 'sale' || row.tag === 'best' ? row.tag : undefined) as Product['tag'],
    colors: row.colors ?? [],
    sizes: row.sizes && row.sizes.length > 0 ? row.sizes : undefined,
    img: row.img,
    imgFiles: (row.img_files ?? []).map(normalizeImg).filter(Boolean),
    description: row.description ?? undefined,
    descriptionAr: row.description_ar ?? undefined,
    descriptionEn: row.description_en ?? undefined,
    composition: row.composition ?? undefined,
    entretien: row.entretien ?? undefined,
    details: row.details ?? undefined,
    mannequin: row.mannequin ?? undefined,
    stock: row.stock,
    cost: row.cost == null ? null : Number(row.cost),
  };
}

// Wrapped in React.cache so multiple calls within the same render
// (e.g. getProductBySlug + page.tsx both calling getAllProducts) hit
// Supabase only once per request.
//
// We also fold in the aggregated review ratings here — one extra query
// (small, indexed on (product_id, status)), result merged into each
// product. Doing it in this helper keeps PCard/ProductDetail dumb (no
// per-card fetch loop = no N+1).
export const getAllProducts = cache(async (): Promise<Product[]> => {
  try {
    const sb = getSupabaseStatic();
    const [productsRes, reviewsRes] = await Promise.all([
      sb.from('products').select('*').eq('active', true).order('sort_order', { ascending: true }),
      sb.from('product_reviews').select('product_id, rating').eq('status', 'approved'),
    ]);
    if (productsRes.error || !productsRes.data || productsRes.data.length === 0) return FALLBACK_PRODUCTS;

    // Build a Map<product_id, { sum, count }> in one pass.
    const ratingsByProduct = new Map<string, { sum: number; count: number }>();
    for (const r of (reviewsRes.data || []) as Array<{ product_id: string; rating: number }>) {
      const cur = ratingsByProduct.get(r.product_id) || { sum: 0, count: 0 };
      cur.sum += r.rating;
      cur.count += 1;
      ratingsByProduct.set(r.product_id, cur);
    }

    return (productsRes.data as SupabaseProductRow[]).map((row) => {
      const p = transform(row);
      const agg = ratingsByProduct.get(p.id);
      if (agg) {
        p.rating = Math.round((agg.sum / agg.count) * 10) / 10;
        p.reviewCount = agg.count;
      } else {
        p.rating = 0;
        p.reviewCount = 0;
      }
      return p;
    });
  } catch {
    return FALLBACK_PRODUCTS;
  }
});

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug || p.id === slug) ?? null;
}

export async function getAllSlugs(): Promise<string[]> {
  const all = await getAllProducts();
  return all.map((p) => p.slug);
}
