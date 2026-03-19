import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const alt = 'Empire 8 Sales Direct — Licensed Cannabis Distribution in New York';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), 'public', 'logo.jpg'));
  const logoBase64 = `data:image/jpeg;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'linear-gradient(145deg, #1A0830 0%, #2D0A4E 35%, #4A0E78 65%, #2D0A4E 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gold glow — top */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: '50%',
            marginLeft: -200,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,162,60,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Purple glow — bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107,47,160,0.25) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Logo — large and centered */}
        <img
          src={logoBase64}
          width={600}
          height={400}
          style={{
            objectFit: 'contain',
            marginBottom: 20,
            filter: 'drop-shadow(0 8px 32px rgba(200,162,60,0.3))',
          }}
        />

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 1,
              backgroundColor: 'rgba(200,162,60,0.5)',
              display: 'flex',
            }}
          />
          <span
            style={{
              color: '#C8A23C',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            Licensed Cannabis Distribution
          </span>
          <div
            style={{
              width: 40,
              height: 1,
              backgroundColor: 'rgba(200,162,60,0.5)',
              display: 'flex',
            }}
          />
        </div>

        {/* Location */}
        <span
          style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginTop: 10,
            display: 'flex',
          }}
        >
          New York State
        </span>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #C8A23C 0%, #E8D48B 50%, #C8A23C 100%)',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
