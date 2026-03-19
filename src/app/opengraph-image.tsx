import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Empire 8 Sales Direct — Professional Gloves & Cannabis Trimming Supplies';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7f5 50%, #ecf2ed 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle green wash — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            right: -80,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(27,58,45,0.06) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Amber glow — top left */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            left: -60,
            width: 340,
            height: 340,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,146,42,0.08) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* ═══════════ LEFT — Text (58%) ═══════════ */}
        <div
          style={{
            width: 690,
            height: 630,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '56px 60px 52px 64px',
            position: 'relative',
          }}
        >
          {/* Brand badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(200,146,42,0.10)',
                border: '1.5px solid rgba(200,146,42,0.28)',
                borderRadius: 999,
                padding: '6px 18px',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#C8A23C',
                  display: 'flex',
                }}
              />
              <span
                style={{
                  color: '#C8A23C',
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                }}
              >
                empire8salesdirect.com
              </span>
            </div>
          </div>

          {/* Headline block */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                color: '#9A9590',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                marginBottom: 18,
                display: 'flex',
              }}
            >
              Retail + Wholesale + Distribution
            </span>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                lineHeight: 0.9,
                letterSpacing: '-0.02em',
              }}
            >
              <span
                style={{
                  color: '#1C1C1C',
                  fontSize: 74,
                  fontWeight: 900,
                  display: 'flex',
                }}
              >
                Professional
              </span>
              <span
                style={{
                  color: '#1C1C1C',
                  fontSize: 74,
                  fontWeight: 900,
                  display: 'flex',
                }}
              >
                Gloves &amp;
              </span>
              <span
                style={{
                  fontSize: 74,
                  fontWeight: 900,
                  display: 'flex',
                  color: '#4A0E78',
                }}
              >
                Supplies.
              </span>
            </div>
          </div>

          {/* Bottom: sub + CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span
              style={{
                color: '#6B6660',
                fontSize: 20,
                lineHeight: 1.55,
                display: 'flex',
              }}
            >
              Nitrile · Latex · Vinyl · Trimming Tools
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* CTA pill */}
              <div
                style={{
                  backgroundColor: '#C8A23C',
                  borderRadius: 999,
                  padding: '14px 28px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    display: 'flex',
                  }}
                >
                  Order by the Case →
                </span>
              </div>
              {/* Ghost pill */}
              <div
                style={{
                  borderRadius: 999,
                  padding: '14px 24px',
                  border: '2px solid #4A0E78',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    color: '#4A0E78',
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'flex',
                  }}
                >
                  Wholesale Pricing
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thin divider */}
        <div
          style={{
            position: 'absolute',
            left: 690,
            top: 40,
            bottom: 40,
            width: 1,
            backgroundColor: '#D8D4CD',
            display: 'flex',
          }}
        />

        {/* ═══════════ RIGHT — Product card (42%) ═══════════ */}
        <div
          style={{
            flex: 1,
            height: 630,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '48px 40px',
            gap: 16,
            position: 'relative',
          }}
        >
          {/* Amber glow behind card */}
          <div
            style={{
              position: 'absolute',
              inset: '10%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(200,146,42,0.12) 0%, transparent 70%)',
              display: 'flex',
            }}
          />

          {/* Best Seller card */}
          <div
            style={{
              width: '100%',
              backgroundColor: '#4A0E78',
              borderRadius: 20,
              padding: '28px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(200,146,42,0.20) 0%, transparent 70%)',
                display: 'flex',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  backgroundColor: '#C8A23C',
                  borderRadius: 999,
                  padding: '4px 12px',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  display: 'flex',
                }}
              >
                Best Seller
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, display: 'flex' }}>
                100 ct / case
              </span>
            </div>
            <span
              style={{
                color: '#fff',
                fontSize: 19,
                fontWeight: 800,
                lineHeight: 1.2,
                display: 'flex',
              }}
            >
              Nitrile Disposable Gloves — 5 mil
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: '#E5B84A', fontSize: 34, fontWeight: 900, display: 'flex' }}>$80</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, display: 'flex' }}>/ case</span>
            </div>
          </div>

          {/* Two tier mini-cards */}
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <div
              style={{
                flex: 1,
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: '16px 16px',
                border: '1px solid #E4E1DB',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{ color: '#7B5A9E', fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex' }}>
                Wholesale
              </span>
              <span style={{ color: '#1C1C1C', fontSize: 20, fontWeight: 900, display: 'flex' }}>$70/case</span>
              <span style={{ color: '#9A9590', fontSize: 12, display: 'flex' }}>30+ cases</span>
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: '16px 16px',
                border: '1px solid #E4E1DB',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{ color: '#C8A23C', fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex' }}>
                Distribution
              </span>
              <span style={{ color: '#1C1C1C', fontSize: 20, fontWeight: 900, display: 'flex' }}>$60/case</span>
              <span style={{ color: '#9A9590', fontSize: 12, display: 'flex' }}>120+ cases</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
