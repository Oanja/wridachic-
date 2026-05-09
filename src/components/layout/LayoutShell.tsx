'use client';

import { usePathname } from 'next/navigation';
import { Nav } from './Nav';
import { Footer } from './Footer';
import { Toast } from './Toast';
import { WaFloat } from '@/components/ui/WaFloat';
import { NewsletterPopup } from '@/components/ui/NewsletterPopup';
import { AuthDialog } from '@/components/dialogs/AuthDialog';
import { RecoveryDialog } from '@/components/dialogs/RecoveryDialog';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

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
