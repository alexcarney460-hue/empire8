import type { Metadata } from 'next';

const BASE = 'https://empire8ny.com';

export const metadata: Metadata = {
  title: 'Weedbay Cannabis Marketplace | Anonymous Wholesale Auctions',
  description:
    'Browse and bid on wholesale cannabis lots anonymously on Weedbay. NY-licensed brands list flower, vapes, edibles, and more at competitive auction prices.',
  keywords: [
    'weedbay marketplace',
    'cannabis wholesale auction',
    'anonymous cannabis marketplace',
    'wholesale cannabis lots NY',
    'cannabis bidding platform',
    'buy cannabis wholesale new york',
    'dispensary bulk cannabis',
  ],
  openGraph: {
    title: 'Weedbay Cannabis Marketplace | Anonymous Wholesale Auctions | Empire 8',
    description:
      'Browse and bid on wholesale cannabis lots anonymously. NY-licensed brands, competitive auction prices.',
    url: `${BASE}/marketplace`,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Weedbay Cannabis Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Weedbay Cannabis Marketplace | Empire 8',
    description:
      'Anonymous wholesale cannabis auctions. Browse lots from NY-licensed brands at competitive prices.',
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: `${BASE}/marketplace` },
};

const marketplaceSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Weedbay Cannabis Marketplace',
  description:
    'Anonymous wholesale cannabis auction marketplace. NY-licensed brands post lots, dispensaries bid.',
  url: `${BASE}/marketplace`,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Empire 8 Sales Direct',
    url: BASE,
  },
  about: {
    '@type': 'Service',
    name: 'Weedbay Marketplace',
    description: 'Anonymous large-lot cannabis auctions connecting licensed brands with dispensaries across New York.',
    provider: {
      '@type': 'Organization',
      name: 'Empire 8 Sales Direct',
    },
  },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    offerCount: '50+',
    itemOffered: {
      '@type': 'Product',
      name: 'Wholesale Cannabis Lots',
      category: 'Cannabis Products',
      description: 'Flower, concentrates, edibles, vapes, pre-rolls, tinctures, and more from NY-licensed brands.',
    },
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(marketplaceSchema) }}
      />
      {children}
    </>
  );
}
