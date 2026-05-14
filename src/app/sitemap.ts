import type { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/products';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wridachic.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,         lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/shop`,     lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/prayer`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/new`,      lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/about`,    lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/lookbook`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/data-deletion`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticUrls, ...productUrls];
}
