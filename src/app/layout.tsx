import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { AppProvider } from '@/store/AppContext';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { TrackingScripts } from '@/components/analytics/TrackingScripts';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wridachic.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'wridachic — Mode féminine marocaine',
    template: '%s · wridachic',
  },
  description: 'wridachic (وريدة شيك) — Mode féminine marocaine : tenues de prière, robes et essentiels. Livraison partout au Maroc, paiement à la livraison. Dès 299 MAD.',
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
    description: 'Robes, ensembles & essentiels féminins — dès 299 MAD, livrés partout au Maroc en 24-48h.',
    images: [{ url: `${SITE_URL}/assets/3.jpg`, width: 1200, height: 630 }],
    locale: 'fr_MA',
    alternateLocale: ['ar_MA'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'wridachic — Mode féminine marocaine',
    description: 'Robes, ensembles & essentiels féminins — dès 299 MAD, livraison rapide au Maroc.',
    images: [`${SITE_URL}/assets/3.jpg`],
  },
  icons: {
    icon: [{ url: '/assets/wridachicNlogo-3.svg', type: 'image/svg+xml' }],
    apple: '/assets/wridachic-logo-new.png',
  },
  // Web app manifest enables "Add to Home Screen" on mobile and tells
  // Chrome/Safari we're installable. Required for the PWA service-worker
  // experience to be picked up as a proper app.
  manifest: '/manifest.json',
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
  priceRange: '299 MAD - 500 MAD',
  paymentAccepted: 'Cash on delivery, Credit card',
  areaServed: 'Morocco',
  sameAs: ['https://www.instagram.com/wrida.chic/', 'https://web.facebook.com/profile.php?id=61589508276595'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <head>
        {/* Preconnect to third-party origins we ALWAYS reach during a
            session (DNS + TLS handshake happens in parallel with HTML
            parsing → saves 100-300 ms on the first API call). Safe to
            include even if the user never triggers the request — modern
            browsers just drop the unused connection. */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} crossOrigin="" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://api.resend.com" />

        {/* Preload the two font weights that appear above the fold on
            every page (Regular for body text, Bold for the brand logo /
            display headlines). Cuts ~150-250 ms of LCP on mobile —
            previously the browser only discovered these fonts AFTER it
            had parsed globals.css, which arrives later in the waterfall.
            crossOrigin="" is required for <link rel=preload as=font>. */}
        <link rel="preload" href="/fonts/thmanyahsans/thmanyahsans-Regular.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/thmanyahserifdisplay/thmanyahserifdisplay-Bold.woff2" as="font" type="font/woff2" crossOrigin="" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
      </head>
      <body>
        <AppProvider>
          <LayoutShell>{children}</LayoutShell>
          <TrackingScripts />
          <Analytics />
          <ServiceWorkerRegister />
        </AppProvider>
      </body>
    </html>
  );
}
