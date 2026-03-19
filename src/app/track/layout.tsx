import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Glove Order — Order Status Lookup',
  description:
    'Track your Empire 8 Sales Direct glove order. Enter your email and tracking number to see real-time shipping status and delivery updates.',
  keywords: ['track glove order', 'order tracking', 'Empire 8 order status', 'glove shipment tracking'],
  alternates: { canonical: 'https://empire8salesdirect.com/track' },
  openGraph: {
    title: 'Track Your Glove Order | Empire 8 Sales Direct',
    description: 'Enter your email and tracking number to check your order status and delivery updates.',
    url: 'https://empire8salesdirect.com/track',
  },
  twitter: {
    card: 'summary',
    title: 'Track Your Order | Empire 8 Sales Direct',
    description: 'Look up your glove order status with your email and tracking number.',
  },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
