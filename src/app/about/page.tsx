import type { Metadata } from 'next';
import { AboutPage } from '@/components/pages/AboutPage';

export const metadata: Metadata = {
  title: 'À propos — Notre histoire',
  description: 'wridachic — une marque marocaine qui réinterprète le vestiaire féminin entre modernité et modestie. Made in Maroc.',
};

export default function Page() {
  return <AboutPage />;
}
