import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/pages/ProductDetail';
import { getAllProducts, getProductBySlug } from '@/lib/products';

export const revalidate = 300;

export async function generateStaticParams() {
  const all = await getAllProducts();
  return all.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Produit introuvable' };

  const title = `${product.name} — ${product.price} MAD`;
  const description = product.description ?? `${product.name} — ${product.price} MAD. Mode féminine marocaine, livraison partout au Maroc.`;
  const images = product.imgFiles.length ? product.imgFiles.map((src) => (src.startsWith('http') ? src : src)) : ['/assets/3.jpg'];

  return {
    title,
    description: description.slice(0, 160),
    openGraph: { title, description, images, type: 'website' },
    alternates: { canonical: `/product/${product.slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const all = await getAllProducts();
  const related = all.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 4);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wridachic.com';
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.name,
    sku: product.id,
    image: product.imgFiles.map((f) => (f.startsWith('http') ? f : `${SITE_URL}${f}`)),
    brand: { '@type': 'Brand', name: 'wridachic' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'MAD',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/product/${product.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <ProductDetail product={product} related={related} />
    </>
  );
}
