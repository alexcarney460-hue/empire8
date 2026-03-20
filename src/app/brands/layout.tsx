import type { Metadata } from 'next';

const BASE = 'https://empire8ny.com';

export const metadata: Metadata = {
  title: 'Cannabis Brands | Premium NY-Licensed Partners',
  description:
    'Explore premium cannabis brands distributed by Empire 8 Sales Direct. NY-licensed flower, vape, edible, and concentrate brands available for wholesale.',
  keywords: [
    'cannabis brands new york',
    'NY licensed cannabis brands',
    'premium cannabis brands',
    'wholesale cannabis brands',
    'cannabis brand partners',
    'dispensary product brands NY',
  ],
  openGraph: {
    title: 'Cannabis Brands | Premium NY-Licensed Partners | Empire 8',
    description:
      'Explore premium NY-licensed cannabis brands distributed by Empire 8. Flower, vapes, edibles, and more.',
    url: `${BASE}/brands`,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Cannabis Brands — Empire 8 Sales Direct' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cannabis Brands | Empire 8 Sales Direct',
    description:
      'Premium NY-licensed cannabis brands available for wholesale. Flower, vapes, edibles, concentrates.',
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: `${BASE}/brands` },
};

const brandsSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Cannabis Brand Partners',
  description: 'Curated portfolio of NY-licensed cannabis brands distributed by Empire 8 Sales Direct.',
  url: `${BASE}/brands`,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Empire 8 Sales Direct',
    url: BASE,
  },
  mainEntity: {
    '@type': 'ItemList',
    name: 'NY-Licensed Cannabis Brands',
    description: 'Premium cannabis brands available for wholesale distribution across New York State.',
    itemListOrder: 'https://schema.org/ItemListUnordered',
    numberOfItems: 20,
  },
};

export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandsSchema) }}
      />
      {children}
    </>
  );
}
