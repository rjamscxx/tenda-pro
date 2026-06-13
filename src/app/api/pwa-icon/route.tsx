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
        {/* Serif "T" monogram in white, matching the TendaLogo badge variant */}
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 32 32"
          fill="none"
        >
          <rect x="6.6" y="7.6" width="18.8" height="3.5" rx="1.15" fill="white" />
          <rect x="6.6" y="10.4" width="2.6" height="1.7" rx="0.6" fill="white" />
          <rect x="22.8" y="10.4" width="2.6" height="1.7" rx="0.6" fill="white" />
          <rect x="14.25" y="9.8" width="3.5" height="11.5" rx="1" fill="white" />
          <rect x="10.8" y="21" width="10.4" height="3.4" rx="1.15" fill="white" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
