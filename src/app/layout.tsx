import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Barlow, Barlow_Condensed, Inter, JetBrains_Mono } from 'next/font/google';
import '@/app/globals.css';
import Nav from '@/components/NavRedesign';
import Footer from '@/components/FooterRedesign';
import ChatWidget from '@/components/ChatWidget';
import PageTracker from '@/components/PageTracker';
import AgeGate from '@/components/AgeGate';
import { DispensaryCartProvider } from '@/context/DispensaryCartContext';
import DispensaryCartDrawer from '@/components/DispensaryCartDrawer';
import InstallPrompt from '@/components/InstallPrompt';
import SmoothScroll from '@/components/SmoothScroll';

/*
 * ── Analytics IDs ──────────────────────────────────────────────────────
 * Set these environment variables to enable tracking:
 *
 * NEXT_PUBLIC_GA_MEASUREMENT_ID   — Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX)
 *   Get it from: https://analytics.google.com → Admin → Data Streams → Measurement ID
 *
 * NEXT_PUBLIC_META_PIXEL_ID       — Meta (Facebook) Pixel ID (e.g. 123456789012345)
 *   Get it from: https://business.facebook.com → Events Manager → Data Sources → Pixel ID
 *
 * Scripts only load when the corresponding env var is set (no empty tracking).
 * ───────────────────────────────────────────────────────────────────────
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';

const barlow = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-barlow', display: 'swap' });
const barlowCondensed = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-barlow-condensed', display: 'swap' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-mono', display: 'swap' });

const BASE = 'https://empire8ny.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#4A0E78',
};

/*
 * ── Search Engine & Platform Verification Tags ──────────────────────────
 * To get the actual verification codes:
 *
 * Google Search Console:
 *   1. Go to https://search.google.com/search-console
 *   2. Add property → URL prefix → enter https://empire8ny.com
 *   3. Choose "HTML tag" verification method
 *   4. Copy the content="..." value and replace REPLACE_WITH_GOOGLE_VERIFICATION_CODE below
 *
 * Bing Webmaster Tools:
 *   1. Go to https://www.bing.com/webmasters
 *   2. Add your site → choose "HTML Meta Tag" method
 *   3. Copy the content="..." value and replace REPLACE_WITH_BING_VERIFICATION_CODE below
 * ─────────────────────────────────────────────────────────────────────────
 */

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  /* verification: Uncomment and replace with real codes when available
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE',
    other: {
      'msvalidate.01': 'YOUR_BING_VERIFICATION_CODE',
    },
  },
  */
  title: {
    default: 'Empire 8 Sales Direct — NY Cannabis Wholesale & Marketplace',
    template: 'Empire 8 Sales Direct | %s',
  },
  description:
    'Empire 8 Sales Direct is a NYS OCM licensed cannabis wholesale supplier and home of Weedbay marketplace. Serving dispensaries across New York with competitive pricing, reliable supply chain, and full regulatory compliance.',
  keywords: [
    'cannabis wholesale new york',
    'cannabis distribution new york',
    'NYS cannabis distributor',
    'licensed cannabis distributor',
    'cannabis supply chain NY',
    'dispensary supplier new york',
    'cannabis wholesale NY',
    'OCM licensed distributor',
    'cannabis logistics new york',
    'weedbay cannabis marketplace',
    'cannabis auction NY',
    'wholesale cannabis lots',
    'NY dispensary supply',
    'cannabis brands new york',
    'white label cannabis NY',
    'Empire 8 Sales Direct',
  ],
  authors: [{ name: 'Empire 8 Sales Direct', url: BASE }],
  creator: 'Empire 8 Sales Direct',
  publisher: 'Empire 8 Sales Direct',
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    siteName: 'Empire 8 Sales Direct',
    type: 'website',
    locale: 'en_US',
    title: 'Empire 8 Sales Direct — NY Cannabis Wholesale & Marketplace',
    description:
      'NYS OCM licensed cannabis wholesale supplier and home of Weedbay marketplace. Serving dispensaries across New York with reliable supply and full compliance.',
    url: BASE,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Empire 8 Sales Direct — NY Cannabis Wholesale & Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@empire8direct',
    creator: '@empire8direct',
    title: 'Empire 8 Sales Direct — NY Cannabis Wholesale & Marketplace',
    description:
      'Licensed cannabis wholesale supplier and Weedbay marketplace. Serving New York dispensaries statewide.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: BASE,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Empire 8',
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Empire 8 Sales Direct',
  url: BASE,
  logo: `${BASE}/logo.jpg`,
  image: `${BASE}/og-image.jpg`,
  description:
    'NYS OCM licensed cannabis wholesale supplier serving dispensaries across New York with reliable supply chain management and full regulatory compliance.',
  email: 'info@empire8ny.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'New York',
    addressRegion: 'NY',
    addressCountry: 'US',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@empire8ny.com',
      availableLanguage: 'English',
    },
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'sales@empire8ny.com',
      availableLanguage: 'English',
    },
  ],
  areaServed: [
    {
      '@type': 'State',
      name: 'New York',
      sameAs: 'https://en.wikipedia.org/wiki/New_York_(state)',
    },
    { '@type': 'City', name: 'New York City', sameAs: 'https://en.wikipedia.org/wiki/New_York_City' },
    { '@type': 'City', name: 'Buffalo' },
    { '@type': 'City', name: 'Rochester' },
    { '@type': 'City', name: 'Syracuse' },
    { '@type': 'City', name: 'Albany' },
    { '@type': 'City', name: 'Yonkers' },
    { '@type': 'City', name: 'Utica' },
    { '@type': 'City', name: 'Binghamton' },
  ],
  /* TODO: Add social profile URLs as they are created */
  sameAs: [],
  knowsAbout: [
    'cannabis wholesale supply',
    'cannabis supply chain',
    'NYS cannabis licensing',
    'dispensary supply',
    'cannabis logistics',
    'cannabis marketplace',
    'Weedbay cannabis auctions',
    'white label cannabis products',
    'cannabis wholesale near me',
    'dispensary supplier near me',
    'NY cannabis distributor',
  ],
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${BASE}/#localbusiness`,
  name: 'Empire 8 Sales Direct',
  url: BASE,
  logo: `${BASE}/logo.jpg`,
  image: `${BASE}/og-image.jpg`,
  description:
    'NYS OCM licensed cannabis wholesale supplier serving dispensaries across all 62 New York counties. Flower, concentrates, edibles, pre-rolls, vapes, and more.',
  email: 'info@empire8ny.com',
  priceRange: '$$',
  currenciesAccepted: 'USD',
  paymentAccepted: 'Credit Card, ACH, Wire Transfer',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'New York',
    addressRegion: 'NY',
    postalCode: '10001',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 40.7128,
    longitude: -74.006,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  areaServed: [
    { '@type': 'State', name: 'New York', sameAs: 'https://en.wikipedia.org/wiki/New_York_(state)' },
    { '@type': 'City', name: 'New York City' },
    { '@type': 'City', name: 'Brooklyn' },
    { '@type': 'City', name: 'Manhattan' },
    { '@type': 'City', name: 'Queens' },
    { '@type': 'City', name: 'Bronx' },
    { '@type': 'City', name: 'Staten Island' },
    { '@type': 'City', name: 'Buffalo' },
    { '@type': 'City', name: 'Rochester' },
    { '@type': 'City', name: 'Syracuse' },
    { '@type': 'City', name: 'Albany' },
    { '@type': 'City', name: 'Yonkers' },
    { '@type': 'City', name: 'Utica' },
    { '@type': 'City', name: 'Binghamton' },
    { '@type': 'City', name: 'White Plains' },
    { '@type': 'City', name: 'Poughkeepsie' },
    { '@type': 'City', name: 'Ithaca' },
    { '@type': 'City', name: 'Saratoga Springs' },
    { '@type': 'City', name: 'Niagara Falls' },
  ],
  serviceArea: {
    '@type': 'GeoShape',
    name: 'New York State - All 62 Counties',
    description: 'Cannabis wholesale delivery covering all 62 counties across New York State, organized into 7 delivery zones: Long Island, Metro NYC, Hudson Valley, Capital Region, North Country, Central NY, and Western Tier.',
  },
  availableAtOrFrom: {
    '@type': 'Place',
    name: 'Empire 8 Sales Direct Warehouse',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'NY',
      addressCountry: 'US',
    },
  },
  makesOffer: [
    {
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: 'Cannabis Wholesale Distribution', description: 'B2B wholesale cannabis supply for licensed NY dispensaries' },
      areaServed: { '@type': 'State', name: 'New York' },
    },
    {
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: 'Weedbay Marketplace', description: 'Anonymous large-lot cannabis auctions for licensed buyers' },
      areaServed: { '@type': 'State', name: 'New York' },
    },
    {
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: 'White Label Manufacturing', description: 'Custom cannabis products manufactured under your dispensary brand' },
      areaServed: { '@type': 'State', name: 'New York' },
    },
    {
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: 'Brand Distribution', description: 'Get your licensed cannabis brand distributed to NY dispensaries' },
      areaServed: { '@type': 'State', name: 'New York' },
    },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Cannabis Product Categories',
    itemListElement: [
      { '@type': 'OfferCatalog', name: 'Flower' },
      { '@type': 'OfferCatalog', name: 'Concentrates' },
      { '@type': 'OfferCatalog', name: 'Vapes & Cartridges' },
      { '@type': 'OfferCatalog', name: 'Pre-Rolls' },
      { '@type': 'OfferCatalog', name: 'Edibles' },
      { '@type': 'OfferCatalog', name: 'Beverages' },
      { '@type': 'OfferCatalog', name: 'Tinctures' },
      { '@type': 'OfferCatalog', name: 'Capsules' },
    ],
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Empire 8 Sales Direct',
  url: BASE,
  description: 'NYS OCM licensed cannabis wholesale supplier and Weedbay marketplace serving New York dispensaries.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE}/marketplace?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://ypqmcakzjvmtcypkyhce.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Empire 8" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-startup-image" href="/og-image.jpg" />
      </head>
      <body className={`${barlow.variable} ${barlowCondensed.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([orgSchema, localBusinessSchema, websiteSchema]) }}
        />

        {/* ── Service Worker Registration ─────────────────────────── */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js')
                .then(function(reg) {
                  console.log('[SW] Registered, scope:', reg.scope);
                })
                .catch(function(err) {
                  console.warn('[SW] Registration failed:', err);
                });
            }
          `}
        </Script>

        {/* ── Google Analytics 4 ──────────────────────────────────── */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        {/* ── Meta Pixel ──────────────────────────────────────────── */}
        {META_PIXEL_ID && (
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}

        <DispensaryCartProvider>
          <AgeGate>
            <Nav />
            <SmoothScroll>
              <div>{children}</div>
            </SmoothScroll>
            <Footer />
            <ChatWidget />
            <PageTracker />
            <DispensaryCartDrawer />
            <InstallPrompt />
          </AgeGate>
        </DispensaryCartProvider>
      </body>
    </html>
  );
}
