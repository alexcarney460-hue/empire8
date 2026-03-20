import type { Metadata } from 'next';

const BASE = 'https://empire8ny.com';

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Create your Empire 8 Sales Direct account. Sign up as a dispensary, brand partner, or marketplace seller to access wholesale cannabis in New York.',
  keywords: [
    'empire 8 sign up',
    'cannabis wholesale account',
    'dispensary registration NY',
    'weedbay account',
  ],
  openGraph: {
    title: 'Create Account | Empire 8 Sales Direct',
    description: 'Sign up for wholesale cannabis access, Weedbay marketplace, and brand partnerships.',
    url: `${BASE}/signup`,
  },
  twitter: {
    card: 'summary',
    title: 'Create Account | Empire 8 Sales Direct',
    description: 'Register for Empire 8 wholesale cannabis and Weedbay marketplace access.',
  },
  robots: { index: false, follow: true },
  alternates: { canonical: `${BASE}/signup` },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
