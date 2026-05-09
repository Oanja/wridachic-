import type { Metadata } from 'next';
import { PrayerPage } from '@/components/pages/PrayerPage';
import { getAllProducts } from '@/lib/products';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Espace Prière — Jilbabs & Khimars',
  description: 'Tenues de prière élégantes et confortables : jilbabs, khimars et ensembles. Dès 149 MAD, livraison au Maroc.',
};

export default async function Page() {
  const products = await getAllProducts();
  return <PrayerPage products={products} />;
}
