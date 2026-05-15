import type { Metadata } from 'next';
import { ShopPage } from '@/components/pages/ShopPage';
import { getAllProducts } from '@/lib/products';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Boutique',
  description: 'Découvrez toute la collection wridachic : robes, ensembles, caftans et essentiels féminins. Livraison 24-48h partout au Maroc.',
};

const VISIBLE_CATS = new Set(['robes']);

export default async function Page() {
  const products = await getAllProducts();
  const filtered = products.filter((p) => VISIBLE_CATS.has(p.cat));
  return <ShopPage products={filtered} />;
}
