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
  const pad  = size * 0.215
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
          <path d="M4 7.5 H7 L10 18 H24" stroke="white" strokeWidth={2.1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.4 10 H27 L24.4 18 H10.6" stroke="white" strokeWidth={2.1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="14" cy="8.8" r="2.1" fill="white" />
          <circle cx="19.8" cy="8.1" r="2.5" fill="white" />
          <circle cx="13" cy="22.5" r="2.4" fill="white" />
          <circle cx="22" cy="22.5" r="2.4" fill="white" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
