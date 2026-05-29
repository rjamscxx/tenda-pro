import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt =
  'Sizzle — All-in-one operating dashboard for restaurants and cafés'

const CANVAS = '#0E1714'
const SURFACE = '#18231F'
const HAIR = '#28332E'
const INK = '#ECE6D5'
const INK_3 = '#929B93'
const ACCENT = '#58C098'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: CANVAS,
          backgroundImage: `radial-gradient(circle at 12% 18%, rgba(88,192,152,0.18) 0%, rgba(88,192,152,0) 55%), radial-gradient(circle at 92% 96%, rgba(61,168,122,0.10) 0%, rgba(61,168,122,0) 50%)`,
          color: INK,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <svg width="40" height="54" viewBox="0 0 24 32" fill="none">
            <defs>
              <linearGradient id="g" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={ACCENT} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <path
              d="M17 5 C22 5 22 14 12 16 C2 18 2 27 7 27"
              stroke="url(#g)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <circle cx="7" cy="27" r="2.6" fill={ACCENT} />
          </svg>
          <span
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: INK,
            }}
          >
            Sizzle
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 600,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              color: INK,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', gap: 24 }}>
              <span>Know your</span>
              <span style={{ color: ACCENT }}>margins.</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span>Run your kitchen.</span>
            </div>
          </div>

          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              color: INK_3,
              maxWidth: 880,
              letterSpacing: '-0.01em',
            }}
          >
            The all-in-one operating dashboard for restaurant and café
            owners in the Philippines.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 28,
            borderTop: `1px solid ${HAIR}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 22,
              color: INK_3,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '999px',
                background: ACCENT,
                display: 'flex',
              }}
            />
            sizzle.app
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '10px 18px',
              borderRadius: 999,
              background: SURFACE,
              border: `1px solid ${HAIR}`,
              color: INK,
              fontSize: 20,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color: ACCENT,
                fontWeight: 600,
                display: 'flex',
              }}
            >
              Free forever
            </span>
            <span style={{ color: INK_3 }}>·</span>
            <span style={{ color: INK }}>Built in PH</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
