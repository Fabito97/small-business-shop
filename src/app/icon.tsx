import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0E0E10',
          borderRadius: 6,
          border: '1px solid #B8956A',
          color: '#FAF7F2',
          fontFamily: 'serif',
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: 1,
        }}
      >
        <span style={{ color: '#B8956A' }}>D</span>
        <span style={{ color: '#FAF7F2' }}>S</span>
      </div>
    ),
    {
      ...size,
    }
  );
}
