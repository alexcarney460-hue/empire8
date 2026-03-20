import type { Metadata } from 'next';

const BASE = 'https://empire8ny.com';

export const metadata: Metadata = {
  title: 'Post a Lot | Weedbay Cannabis Marketplace',
  description:
    'List your wholesale cannabis inventory on Weedbay. Set your starting price, upload photos, and reach licensed dispensaries across New York State.',
  keywords: [
    'sell cannabis wholesale',
    'list cannabis lot',
    'weedbay post lot',
    'cannabis wholesale listing NY',
    'sell to dispensaries new york',
  ],
  openGraph: {
    title: 'Post a Lot | Weedbay Cannabis Marketplace',
    description:
      'List wholesale cannabis inventory on Weedbay and reach licensed NY dispensaries.',
    url: `${BASE}/marketplace/create`,
  },
  twitter: {
    card: 'summary',
    title: 'Post a Lot | Weedbay Cannabis Marketplace',
    description: 'List your wholesale cannabis lots on Weedbay marketplace.',
  },
  alternates: { canonical: `${BASE}/marketplace/create` },
};

export default function CreateLotLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
