import type { Metadata } from 'next';
import { ContactPage } from '@/components/pages/ContactPage';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez wridachic — WhatsApp, e-mail et réseaux sociaux.',
};

export default function Page() {
  return <ContactPage />;
}
