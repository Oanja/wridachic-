import type { Metadata } from 'next';
import { ShopPage } from '@/components/pages/ShopPage';
import { getAllProducts } from '@/lib/products';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Boutique',
  description: 'Découvrez toute la collection wridachic : robes, ensembles, caftans et essentiels féminins. Livraison 24-48h partout au Maroc.',
};

export default async function Page() {
  const products = await getAllProducts();
  return <ShopPage products={products} />;
}
