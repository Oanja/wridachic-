import { cache } from 'react';
import { getSupabaseServer } from './supabase/server';
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
export const getAllProducts = cache(async (): Promise<Product[]> => {
  try {
    const sb = await getSupabaseServer();
    const { data, error } = await sb
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return FALLBACK_PRODUCTS;
    return (data as SupabaseProductRow[]).map(transform);
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
