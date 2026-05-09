import type { Metadata } from 'next';
import { AdminPage } from '@/components/pages/AdminPage';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return <AdminPage />;
}
