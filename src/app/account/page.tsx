import type { Metadata } from 'next';
import { AccountPage } from '@/components/pages/AccountPage';
import { getAllProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Mon compte',
  robots: { index: false, follow: false },
};

export default async function Page() {
  const products = await getAllProducts();
  return <AccountPage products={products} />;
}
