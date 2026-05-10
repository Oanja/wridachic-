import type { Metadata, Viewport } from 'next';
import { AppProvider } from '@/store/AppContext';
import { LayoutShell } from '@/components/layout/LayoutShell';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wridachic.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'wridachic — Mode féminine marocaine',
    template: '%s · wridachic',
  },
  description: 'wridachic (وريدة شيك) — Mode féminine marocaine : tenues de prière, robes et essentiels. Livraison partout au Maroc, paiement à la livraison. Dès 149 MAD.',
  keywords: ['wridachic', 'wrida chic', 'وريدة شيك', 'mode marocaine', 'tenues de prière', 'jilbab', 'khimar', 'robes', 'caftan', 'mode femme Maroc', 'abaya', 'vêtements modestes'],
  authors: [{ name: 'wridachic' }],
  alternates: {
    canonical: '/',
    languages: { 'fr-MA': '/', 'ar-MA': '/' },
  },
  openGraph: {
    type: 'website',
    siteName: 'wridachic',
    url: SITE_URL,
    title: 'wridachic — Mode féminine marocaine',
    description: 'Tenues de prière, robes et essentiels — dès 149 MAD, livrés partout au Maroc en environ 1 semaine.',
    images: [{ url: `${SITE_URL}/assets/3.jpg`, width: 1200, height: 630 }],
    locale: 'fr_MA',
    alternateLocale: ['ar_MA'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'wridachic — Mode féminine marocaine',
    description: 'Tenues de prière, robes & essentiels — dès 149 MAD, livraison au Maroc.',
    images: [`${SITE_URL}/assets/3.jpg`],
  },
  icons: {
    icon: [{ url: '/assets/wridachicNlogo-3.svg', type: 'image/svg+xml' }],
    apple: '/assets/wridachic-logo-new.png',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAF6F1',
};

const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: 'wridachic',
  alternateName: ['wrida chic', 'وريدة شيك', 'وريدة'],
  url: SITE_URL,
  logo: `${SITE_URL}/assets/wridachicNlogo.svg`,
  image: `${SITE_URL}/assets/3.jpg`,
  description: 'Mode féminine marocaine : tenues de prière, robes et essentiels. Livraison partout au Maroc.',
  address: { '@type': 'PostalAddress', addressCountry: 'MA', addressLocality: 'Casablanca' },
  priceRange: '149 MAD - 500 MAD',
  paymentAccepted: 'Cash on delivery, Credit card',
  areaServed: 'Morocco',
  sameAs: ['https://www.instagram.com/wrida_chic/'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
      </head>
      <body>
        <AppProvider>
          <LayoutShell>{children}</LayoutShell>
        </AppProvider>
      </body>
    </html>
  );
}
