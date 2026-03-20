import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Order — Order Status Lookup',
  description:
    'Track your Empire 8 Sales Direct order. Enter your email and tracking number to see real-time shipping status and delivery updates.',
  keywords: ['track order', 'order tracking', 'Empire 8 order status', 'cannabis shipment tracking'],
  alternates: { canonical: 'https://empire8ny.com/track' },
  openGraph: {
    title: 'Track Your Order | Empire 8 Sales Direct',
    description: 'Enter your email and tracking number to check your order status and delivery updates.',
    url: 'https://empire8ny.com/track',
  },
  twitter: {
    card: 'summary',
    title: 'Track Your Order | Empire 8 Sales Direct',
    description: 'Look up your order status with your email and tracking number.',
  },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
