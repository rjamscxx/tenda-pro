import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(req: NextRequest) {
  const size = Math.min(512, Math.max(16, parseInt(req.nextUrl.searchParams.get('size') ?? '192', 10)))
  const r = Math.round(size * 0.2)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#0E1714',
          borderRadius: r,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M3 11C3 8 5 6 7 6C9 6 11 8 11 11"
            stroke="#58C098"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M7 6V2M5 4l2-2 2 2"
            stroke="#58C098"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
