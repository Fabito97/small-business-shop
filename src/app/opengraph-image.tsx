import { ImageResponse } from 'next/og';
import { BRAND } from '@/config/brand';

export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0E0E10',
          color: '#FAF7F2',
          padding: 60,
          position: 'relative',
        }}
      >
        {/* Subtle decorative inner border */}
        <div
          style={{
            position: 'absolute',
            inset: 30,
            border: '1px solid rgba(184, 149, 106, 0.35)',
            borderRadius: 12,
            display: 'flex',
          }}
        />

        {/* Small gold label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#B8956A',
            marginBottom: 20,
          }}
        >
          Original Wristwatches · Lagos, Nigeria
        </div>

        {/* Brand wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 68,
            fontFamily: 'serif',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#FAF7F2',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          {BRAND.name}
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            fontFamily: 'serif',
            fontStyle: 'italic',
            color: '#B8956A',
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          {`"${BRAND.tagline}"`}
        </div>

        {/* Footer features */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#8E8E93',
          }}
        >
          <span>Authenticity Guaranteed</span>
          <span style={{ margin: '0 20px', color: '#B8956A' }}>•</span>
          <span>12-Month Warranty</span>
          <span style={{ margin: '0 20px', color: '#B8956A' }}>•</span>
          <span>Nationwide Delivery</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
