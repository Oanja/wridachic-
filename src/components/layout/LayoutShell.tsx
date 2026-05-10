'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Nav } from './Nav';
import { Footer } from './Footer';
import { Toast } from './Toast';
import { WaFloat } from '@/components/ui/WaFloat';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

// Off-screen popups/dialogs: don't ship them in the initial bundle, load on
// demand. They're invisible until the user triggers them, so SSR isn't needed.
const NewsletterPopup = dynamic(
  () => import('@/components/ui/NewsletterPopup').then((m) => m.NewsletterPopup),
  { ssr: false }
);
const AuthDialog = dynamic(
  () => import('@/components/dialogs/AuthDialog').then((m) => m.AuthDialog),
  { ssr: false }
);
const RecoveryDialog = dynamic(
  () => import('@/components/dialogs/RecoveryDialog').then((m) => m.RecoveryDialog),
  { ssr: false }
);

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  if (isAdmin) {
    // Admin pages render bare — no public nav/footer/popups/floats.
    return (
      <>
        {children}
        <Toast />
      </>
    );
  }

  return (
    <>
      <ScrollReveal />
      <Nav />
      <main>{children}</main>
      <Footer />
      <WaFloat />
      <NewsletterPopup />
      <AuthDialog />
      <RecoveryDialog />
      <Toast />
    </>
  );
}
