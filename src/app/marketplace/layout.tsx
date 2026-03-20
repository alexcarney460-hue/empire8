import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Weedbay Marketplace | Empire 8 Sales Direct',
  description:
    'Anonymous large-lot cannabis auctions. Brands post lots, dispensaries bid. 5% platform fee. Flower, concentrates, edibles, pre-rolls, and more.',
  openGraph: {
    title: 'Weedbay Marketplace | Empire 8 Sales Direct',
    description:
      'Anonymous large-lot cannabis auctions for licensed dispensaries and brands across New York.',
    url: 'https://empire8salesdirect.com/marketplace',
  },
  alternates: { canonical: 'https://empire8salesdirect.com/marketplace' },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
