import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Truck, ArrowRight } from 'lucide-react';
import AnimateIn from '@/components/AnimateIn';

export const metadata: Metadata = {
  title: 'Delivery Zones | Cannabis Wholesale Across All 62 NY Counties',
  description:
    'Empire 8 Sales Direct delivers cannabis wholesale to all 62 New York counties. See our 7 delivery zones covering Long Island, NYC, Hudson Valley, Capital Region, North Country, Central NY, and Western Tier.',
  keywords: [
    'cannabis delivery new york',
    'cannabis wholesale near me',
    'cannabis distributor NYC',
    'cannabis wholesale Long Island',
    'cannabis wholesale Buffalo',
    'cannabis wholesale Rochester',
    'cannabis wholesale Albany',
    'cannabis wholesale Syracuse',
    'cannabis distributor Hudson Valley',
    'NY cannabis delivery zones',
    'cannabis wholesale all 62 counties',
  ],
  alternates: { canonical: 'https://empire8ny.com/locations' },
  openGraph: {
    title: 'Delivery Zones | Empire 8 Sales Direct',
    description: 'Cannabis wholesale delivery across all 62 New York counties. 7 delivery zones with same-week fulfillment.',
    url: 'https://empire8ny.com/locations',
  },
};

const ZONES = [
  {
    id: 1,
    name: 'Long Island',
    counties: ['Nassau', 'Suffolk'],
    cities: ['Hempstead', 'Brookhaven', 'Islip', 'Babylon', 'Huntington', 'Oyster Bay', 'North Hempstead', 'Smithtown'],
    delivery: 'Same-week delivery. Direct routes from NYC metro warehouse.',
    description:
      'Long Island is one of the fastest-growing cannabis retail markets in New York. With densely populated suburban communities across Nassau and Suffolk counties, dispensaries here benefit from high foot traffic and strong consumer demand. Empire 8 provides reliable wholesale supply with direct routing from our metro-area logistics hub.',
  },
  {
    id: 2,
    name: 'Metro NYC',
    counties: ['New York (Manhattan)', 'Kings (Brooklyn)', 'Queens', 'Bronx', 'Richmond (Staten Island)'],
    cities: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'Harlem', 'Williamsburg', 'Astoria'],
    delivery: 'Priority same-week delivery. Multiple weekly runs.',
    description:
      'The five boroughs represent the largest concentration of licensed dispensaries in the state. Empire 8 runs multiple weekly delivery routes throughout Metro NYC, ensuring dispensaries maintain consistent inventory. Our temperature-controlled fleet navigates the city efficiently with full OCM-compliant manifests on every shipment.',
  },
  {
    id: 3,
    name: 'Hudson Valley',
    counties: ['Westchester', 'Rockland', 'Orange', 'Dutchess', 'Ulster', 'Sullivan', 'Putnam', 'Columbia', 'Greene'],
    cities: ['White Plains', 'Yonkers', 'New Rochelle', 'Poughkeepsie', 'Newburgh', 'Kingston', 'Middletown'],
    delivery: 'Same-week delivery. Served from metro hub with dedicated Hudson Valley routes.',
    description:
      'The Hudson Valley corridor stretches from the northern suburbs of NYC through scenic river towns and into the Catskills. This region combines suburban retail demand with a growing tourism-driven cannabis market. Empire 8 provides consistent supply to dispensaries from Westchester through Sullivan County.',
  },
  {
    id: 4,
    name: 'Capital Region',
    counties: ['Albany', 'Schenectady', 'Rensselaer', 'Saratoga', 'Warren', 'Washington', 'Schoharie', 'Montgomery', 'Fulton'],
    cities: ['Albany', 'Schenectady', 'Troy', 'Saratoga Springs', 'Glens Falls', 'Amsterdam'],
    delivery: 'Weekly scheduled delivery. Dedicated Capital Region fleet.',
    description:
      'Anchored by the state capital, this region is a hub for both government and higher education, creating a steady consumer base for cannabis retail. Empire 8 maintains dedicated weekly routes through the Capital Region, serving dispensaries from Albany through Saratoga Springs and surrounding counties.',
  },
  {
    id: 5,
    name: 'North Country',
    counties: ['Clinton', 'Essex', 'Franklin', 'Jefferson', 'St. Lawrence', 'Hamilton', 'Lewis', 'Herkimer'],
    cities: ['Plattsburgh', 'Watertown', 'Ogdensburg', 'Malone', 'Lake Placid', 'Potsdam'],
    delivery: 'Scheduled weekly delivery. Temperature-controlled transport for extended routes.',
    description:
      'The North Country covers the northernmost reaches of New York, from the Adirondacks to the Canadian border. While more rural, this region has growing dispensary presence serving both local communities and seasonal tourism. Empire 8 ensures reliable supply even to the most remote licensed retailers in the state.',
  },
  {
    id: 6,
    name: 'Central NY',
    counties: ['Onondaga', 'Oneida', 'Broome', 'Cayuga', 'Cortland', 'Madison', 'Oswego', 'Tompkins', 'Tioga', 'Chenango', 'Otsego', 'Delaware'],
    cities: ['Syracuse', 'Utica', 'Binghamton', 'Ithaca', 'Cortland', 'Oneonta', 'Rome', 'Auburn'],
    delivery: 'Weekly scheduled delivery. Central distribution routes serving all counties.',
    description:
      'Central New York encompasses a broad region anchored by Syracuse, Utica, and Binghamton. University towns like Ithaca add strong consumer demand alongside established urban markets. Empire 8 runs efficient central routes that connect dispensaries across this geographically diverse zone.',
  },
  {
    id: 7,
    name: 'Western Tier',
    counties: ['Erie', 'Monroe', 'Niagara', 'Onondaga', 'Chautauqua', 'Cattaraugus', 'Allegany', 'Steuben', 'Chemung', 'Schuyler', 'Yates', 'Seneca', 'Wayne', 'Ontario', 'Livingston', 'Genesee', 'Orleans', 'Wyoming'],
    cities: ['Buffalo', 'Rochester', 'Niagara Falls', 'Jamestown', 'Batavia', 'Geneva', 'Elmira', 'Corning'],
    delivery: 'Weekly scheduled delivery. Dedicated Western Tier fleet with Buffalo and Rochester hubs.',
    description:
      'Western New York, anchored by Buffalo and Rochester, represents the second-largest metro market in the state. With revitalized downtowns and strong neighborhood retail, dispensaries in this zone see consistent demand. Empire 8 operates dedicated western routes with local staging to ensure fresh, compliant product reaches every partner.',
  },
];

export default function LocationsPage() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', backgroundColor: '#0F0520' }}>

      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(168deg, #2D0A4E 0%, #4A0E78 35%, #2D0A4E 70%, #1A0633 100%)',
          padding: '80px 24px 72px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            top: '-20%',
            left: '-10%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,162,60,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <AnimateIn>
            <span
              className="label-caps"
              style={{ color: '#C8A23C', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}
            >
              <span style={{ width: 28, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
              Statewide Coverage
              <span style={{ width: 28, height: 1.5, backgroundColor: '#C8A23C', display: 'inline-block', borderRadius: 99 }} />
            </span>
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                lineHeight: 1.1,
                color: '#FFFFFF',
                marginBottom: 20,
              }}
            >
              Cannabis Wholesale Delivery
              <br />
              Across All 62 NY Counties
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: 600, margin: '0 auto' }}>
              Empire 8 Sales Direct operates 7 delivery zones covering every licensed dispensary location in New York State.
              Temperature-controlled fleet. Full OCM compliance. Same-week fulfillment.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Stats bar */}
      <section
        style={{
          backgroundColor: '#1A0633',
          borderTop: '1px solid rgba(200,162,60,0.15)',
          borderBottom: '1px solid rgba(200,162,60,0.15)',
          padding: '32px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            gap: 48,
            flexWrap: 'wrap',
            textAlign: 'center',
          }}
        >
          {[
            { value: '7', label: 'Delivery Zones' },
            { value: '62', label: 'Counties Covered' },
            { value: '100%', label: 'NY State Coverage' },
            { value: 'Same-Week', label: 'Fulfillment' },
          ].map((stat) => (
            <div key={stat.label} style={{ minWidth: 120 }}>
              <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C8A23C', lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6, fontFamily: "'Barlow', Arial, sans-serif" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Zones */}
      <section style={{ backgroundColor: '#0F0520', padding: '72px 24px 96px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {ZONES.map((zone, i) => (
            <AnimateIn key={zone.id} delay={i * 70}>
              <div
                style={{
                  backgroundColor: 'rgba(74,14,120,0.12)',
                  border: '1px solid rgba(200,162,60,0.1)',
                  borderRadius: 20,
                  padding: '36px 32px',
                  transition: 'border-color 200ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: 'rgba(200,162,60,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={20} color="#C8A23C" />
                  </div>
                  <div>
                    <h2
                      className="font-display"
                      style={{ fontSize: '1.35rem', color: '#FFFFFF', lineHeight: 1.2, margin: 0 }}
                    >
                      Zone {zone.id}: {zone.name}
                    </h2>
                  </div>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.92rem', lineHeight: 1.8, margin: '0 0 20px' }}>
                  {zone.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <div
                    style={{
                      backgroundColor: 'rgba(200,162,60,0.04)',
                      border: '1px solid rgba(200,162,60,0.08)',
                      borderRadius: 12,
                      padding: '16px 20px',
                    }}
                  >
                    <div
                      className="label-caps"
                      style={{ color: '#C8A23C', fontSize: '0.65rem', marginBottom: 8 }}
                    >
                      Counties Served
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                      {zone.counties.join(', ')}
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'rgba(200,162,60,0.04)',
                      border: '1px solid rgba(200,162,60,0.08)',
                      borderRadius: 12,
                      padding: '16px 20px',
                    }}
                  >
                    <div
                      className="label-caps"
                      style={{ color: '#C8A23C', fontSize: '0.65rem', marginBottom: 8 }}
                    >
                      Major Cities
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                      {zone.cities.join(', ')}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                  <Truck size={14} color="#C8A23C" />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                    {zone.delivery}
                  </span>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: 'linear-gradient(180deg, #1A0633 0%, #2D0A4E 100%)',
          padding: '72px 24px',
          textAlign: 'center',
        }}
      >
        <AnimateIn>
          <h2
            className="font-display"
            style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', color: '#FFFFFF', marginBottom: 16 }}
          >
            Ready to Supply Your Dispensary?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 32px' }}>
            Licensed dispensaries across all 62 New York counties can apply for wholesale access. Get a dedicated account manager and same-week delivery.
          </p>
          <Link
            href="/dispensary-signup"
            style={{
              backgroundColor: '#C8A23C',
              color: '#1A0633',
              padding: '15px 34px',
              borderRadius: 9999,
              fontFamily: "'Barlow', Arial, sans-serif",
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 24px rgba(200,162,60,0.35)',
            }}
          >
            Apply for Wholesale Access <ArrowRight size={14} />
          </Link>
        </AnimateIn>
      </section>

      {/* JSON-LD for location zones */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Empire 8 Sales Direct',
            url: 'https://empire8ny.com',
            description: 'NYS OCM licensed cannabis wholesale supplier serving dispensaries across all 62 New York counties.',
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 40.7128,
              longitude: -74.006,
            },
            areaServed: ZONES.flatMap((zone) => [
              ...zone.cities.map((city) => ({
                '@type': 'City' as const,
                name: city,
                containedInPlace: { '@type': 'State' as const, name: 'New York' },
              })),
            ]),
            serviceArea: {
              '@type': 'State',
              name: 'New York',
              description: 'All 62 counties across 7 delivery zones',
            },
          }),
        }}
      />
    </div>
  );
}
