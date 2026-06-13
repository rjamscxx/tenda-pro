import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(req: NextRequest) {
  const size = Math.min(512, Math.max(16, parseInt(req.nextUrl.searchParams.get('size') ?? '192', 10)))
  const r = Math.round(size * 0.22)

  // Brand orange gradient — matches TendaLogo badge variant
  const BRAND       = '#F97316'
  const BRAND_LIGHT = '#FB923C'

  // The Tenda mark (awning + post / "T") is defined in a 32×32 viewBox, matching the
  // TendaLogo badge variant. We scale it to fit inside the icon square with comfortable padding.
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
        {/* Awning + post mark in white, matching TendaLogo badge variant */}
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 32 32"
          fill="none"
        >
          <path d="M5 9 L27 9 L24.5 13.5 L7.5 13.5 Z" fill="white" />
          <path
            d="M7.5 13.5 q1.7 2.2 3.4 0 q1.7 2.2 3.4 0 q1.7 2.2 3.4 0 q1.7 2.2 3.4 0 Z"
            fill="white"
            fillOpacity={0.78}
          />
          <rect x="14.4" y="13.5" width="3.2" height="11" rx="1.4" fill="white" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
