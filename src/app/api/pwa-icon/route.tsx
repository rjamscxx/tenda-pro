import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(req: NextRequest) {
  const size = Math.min(512, Math.max(16, parseInt(req.nextUrl.searchParams.get('size') ?? '192', 10)))
  const r = Math.round(size * 0.22)

  // Brand orange gradient — matches TendaLogo badge variant
  const BRAND       = '#F97316'
  const BRAND_LIGHT = '#FB923C'

  // The Tenda Pro mark (awning + post / "T") is defined in a 32×32 viewBox, matching the
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
        {/* Pushcart mark in white, matching the TendaLogo badge variant */}
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 32 32"
          fill="none"
        >
          <path d="M3.5 11 Q16 5.5 28.5 11 L28.5 11.6 L3.5 11.6 Z" fill="white" />
          <path d="M3.5 11.6 q2.1 2.4 4.2 0 q2.1 2.4 4.2 0 q2.1 2.4 4.2 0 q2.1 2.4 4.2 0 q2.1 2.4 4.2 0 Z" fill="white" fillOpacity={0.85} />
          <rect x="5.5" y="13.4" width="21" height="6.4" rx="1.4" fill="white" />
          <path d="M26.5 14.6 L30 12.2" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="10.5" cy="22.5" r="2.7" fill="white" />
          <circle cx="21" cy="22.5" r="2.7" fill="white" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
