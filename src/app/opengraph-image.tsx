import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Wing — A new home for your ideas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '60px',
        }}
      >
        {/* Logo circle */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '4px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <svg
            width="90"
            height="90"
            viewBox="0 0 24 24"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C8 6 4 8 4 13a8 8 0 1016 0c0-5-4-7-8-11z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.03em',
            marginBottom: 20,
            display: 'flex',
          }}
        >
          Wing
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.3,
            display: 'flex',
          }}
        >
          A new home for your ideas
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 22,
            color: 'rgba(255,255,255,0.75)',
            fontWeight: 500,
            letterSpacing: '0.05em',
            display: 'flex',
          }}
        >
          wing-frontend.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}