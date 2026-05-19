/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // compress is handled by Vercel's edge — enabling Node-side gzip duplicates work.

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },

  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/wridachic.html', destination: '/', permanent: true },
      // /prayer was renamed to /modest to avoid Meta auto-classifying the
      // site as "Religion" (which triggers EU/GDPR data-sharing restrictions
      // on the Pixel). 301 keeps backlinks + Google ranking.
      { source: '/prayer', destination: '/modest', permanent: true },
    ];
  },

  async headers() {
    // Baseline security headers applied to every response.
    // - HSTS: force HTTPS for 2 years (Vercel already serves HTTPS, this
    //   blocks downgrade attacks on the customer's network).
    // - X-Content-Type-Options: stops the browser from MIME-sniffing a
    //   text/html out of an image upload.
    // - X-Frame-Options: nobody can iframe the checkout to phish.
    // - Referrer-Policy: don't leak full URLs (with order numbers) to
    //   third-party hosts like Meta Pixel.
    // - Permissions-Policy: disable APIs we never use; defence-in-depth
    //   in case a vulnerable third-party script tries.
    const securityHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
    ];

    return [
      // Apply security headers to every route.
      { source: '/:path*', headers: securityHeaders },
      // Long-cache immutable assets.
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
