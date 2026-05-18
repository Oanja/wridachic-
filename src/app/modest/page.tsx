import type { Metadata } from 'next';
import { ModestPage } from '@/components/pages/ModestPage';
import { getAllProducts } from '@/lib/products';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Tenues Modestes — Robes longues & ensembles couvrants',
  description: 'Collection modeste élégante et confortable : robes longues, ensembles couvrants et jilbabs. Dès 299 MAD, livraison partout au Maroc.',
};

export default async function Page() {
  const products = await getAllProducts();
  return <ModestPage products={products} />;
}
