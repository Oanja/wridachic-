import { HomePage } from '@/components/pages/HomePage';
import { getAllProducts } from '@/lib/products';
import { getSiteSettings } from '@/lib/settings-server';

export const revalidate = 300;

export default async function Page() {
  const [products, settings] = await Promise.all([
    getAllProducts(),
    getSiteSettings(),
  ]);
  return <HomePage products={products} settings={settings} />;
}
