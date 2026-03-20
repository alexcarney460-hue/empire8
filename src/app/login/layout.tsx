import type { Metadata } from 'next';

const BASE = 'https://empire8ny.com';

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to your Empire 8 Sales Direct account. Access your dispensary dashboard, Weedbay marketplace, and wholesale ordering portal.',
  openGraph: {
    title: 'Sign In | Empire 8 Sales Direct',
    description: 'Access your dispensary dashboard, Weedbay marketplace, and wholesale ordering.',
    url: `${BASE}/login`,
  },
  twitter: {
    card: 'summary',
    title: 'Sign In | Empire 8 Sales Direct',
    description: 'Access your Empire 8 account and dispensary dashboard.',
  },
  robots: { index: false, follow: true },
  alternates: { canonical: `${BASE}/login` },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
