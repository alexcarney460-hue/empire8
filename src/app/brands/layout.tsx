import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Brands | Empire 8 Sales Direct',
  description:
    'Browse our curated portfolio of NY-licensed cannabis brands. Premium flower, vapes, edibles, pre-rolls, and more for dispensaries across New York.',
  openGraph: {
    title: 'Our Brands | Empire 8 Sales Direct',
    description:
      'Curated portfolio of NY-licensed cannabis brands available for wholesale distribution.',
    url: 'https://empire8salesdirect.com/brands',
  },
  alternates: { canonical: 'https://empire8salesdirect.com/brands' },
};

export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
