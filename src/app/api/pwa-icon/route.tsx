import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(req: NextRequest) {
  const size = Math.min(512, Math.max(16, parseInt(req.nextUrl.searchParams.get('size') ?? '192', 10)))
  const r = Math.round(size * 0.22)

  // Brand orange gradient — matches SizzleLogo badge variant
  const BRAND       = '#F97316'
  const BRAND_LIGHT = '#FB923C'

  // The Sizzle S-curve path is defined in a 32×32 viewBox with a 4px left offset (translate(4,0)).
  // We scale it to fit inside the icon square with comfortable padding (~18% each side).
  const pad  = size * 0.18
  const inner = size - pad * 2

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: `linear-gradient(180deg, ${BRAND_LIGHT} 0%, ${BRAND} 100%)`,
          borderRadius: r,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* S-curve logo in white, matching SizzleLogo badge variant */}
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 32 32"
          fill="none"
        >
          <g transform="translate(4 0)">
            <path
              d="M17 5 C22 5 22 14 12 16 C2 18 2 27 7 27"
              stroke="white"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="7" cy="27" r="2.8" fill="white" />
          </g>
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
