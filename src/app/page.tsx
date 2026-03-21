import type { Metadata } from 'next';
import CinematicHero from '@/components/CinematicHero';
import StatsBar from '@/components/home/StatsBar';
import ProblemSolution from '@/components/home/ProblemSolution';
import ThreePillarSystem from '@/components/home/ThreePillarSystem';
import TerritorySection from '@/components/home/TerritorySection';
import PricingSection from '@/components/home/PricingSection';
import ContactCTA from '@/components/home/ContactCTA';

export const metadata: Metadata = {
  title: 'Empire 8 Sales Direct — NY Cannabis Wholesale & Marketplace',
  description:
    'Licensed B2B cannabis wholesale and Weedbay marketplace across all 62 New York counties. Connecting top cannabis brands with dispensaries. OCM compliant. Temperature-controlled fleet.',
  keywords: [
    'cannabis wholesale new york',
    'cannabis distribution new york',
    'NY cannabis distributor',
    'B2B cannabis distribution',
    'OCM compliant distributor',
    'cannabis supply chain new york',
    'dispensary wholesale supply',
    'licensed cannabis distributor NY',
    'weedbay marketplace',
    'cannabis auction new york',
    'wholesale cannabis lots',
  ],
  alternates: { canonical: 'https://empire8ny.com' },
  openGraph: {
    title: 'Empire 8 Sales Direct — NY Cannabis Wholesale & Marketplace',
    description:
      'Licensed B2B cannabis wholesale and Weedbay marketplace across all 62 New York counties. Top brands, competitive pricing.',
    url: 'https://empire8ny.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Empire 8 Sales Direct — NY Cannabis Wholesale & Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Empire 8 Sales Direct — NY Cannabis Wholesale & Marketplace',
    description:
      'Licensed B2B cannabis wholesale and Weedbay marketplace across all 62 NY counties. OCM compliant. Statewide delivery.',
    images: ['/og-image.jpg'],
  },
};

export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#0F0520' }}>
      <CinematicHero />
      <StatsBar />
      <ProblemSolution />
      <ThreePillarSystem />
      <TerritorySection />
      <PricingSection />
      <ContactCTA />
    </div>
  );
}
