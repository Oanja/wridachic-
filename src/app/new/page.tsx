import type { Metadata } from 'next';
import { ShopPage } from '@/components/pages/ShopPage';
import { getAllProducts } from '@/lib/products';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Nouveautés',
  description: 'Les dernières arrivées chez wridachic — nouvelles robes & ensembles raffinés.',
};

// Categories surfaced on the public storefront. Anything else (legacy
// "prayer", "basics", etc.) stays in Supabase but is filtered out here.
const VISIBLE_CATS = new Set(['robes']);

export default async function Page() {
  const products = await getAllProducts();
  const filtered = products.filter((p) => VISIBLE_CATS.has(p.cat));
  return <ShopPage products={filtered} filterNew title={{ fr: 'Nouveautés.', en: 'New arrivals.', ar: 'الجديد.' }} />;
}
