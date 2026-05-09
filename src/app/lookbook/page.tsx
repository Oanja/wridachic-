import type { Metadata } from 'next';
import { LookbookPage } from '@/components/pages/LookbookPage';

export const metadata: Metadata = {
  title: 'Lookbook SS26',
  description: 'Le lookbook printemps/été 2026 wridachic — médina, rooftop, souk.',
};

export default function Page() {
  return <LookbookPage />;
}
