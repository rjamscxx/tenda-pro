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
          <path d="M4.5 11.8 Q16 7 27.5 11.8 L27.5 12.7 Q16 8.1 4.5 12.7 Z" fill="white" />
          <rect x="6" y="13.6" width="20" height="6" rx="1.5" fill="white" />
          <path d="M26 15 L29.5 12.7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="11" cy="22.3" r="2.5" fill="white" />
          <circle cx="21" cy="22.3" r="2.5" fill="white" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
