import type { Metadata } from 'next';
import { ShopPage } from '@/components/pages/ShopPage';
import { getAllProducts } from '@/lib/products';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Nouveautés',
  description: 'Les dernières arrivées chez wridachic — nouvelles robes, ensembles et tenues de prière.',
};

export default async function Page() {
  const products = await getAllProducts();
  return <ShopPage products={products} filterNew title={{ fr: 'Nouveautés.', ar: 'الجديد.' }} />;
}
