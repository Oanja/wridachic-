import { HomePage } from '@/components/pages/HomePage';
import { getAllProducts } from '@/lib/products';

export const revalidate = 300;

export default async function Page() {
  const products = await getAllProducts();
  return <HomePage products={products} />;
}
