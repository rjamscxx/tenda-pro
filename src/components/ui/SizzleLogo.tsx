interface Props {
  size?: number
  className?: string
  variant?: 'mark' | 'badge'
}

// Brand color is always the Sizzle orange — independent of the active theme.
const BRAND = '#F97316'
const BRAND_LIGHT = '#FB923C'

export default function SizzleLogo({ size = 24, className = '', variant = 'mark' }: Props) {
  if (variant === 'badge') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <defs>
          <linearGradient id="sizzle-badge-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND_LIGHT} />
            <stop offset="100%" stopColor={BRAND} />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="7" fill="url(#sizzle-badge-g)" />
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
    )
  }
  const h = Math.round(size * 1.333)
  return (
    <svg width={size} height={h} viewBox="0 0 24 32" fill="none" className={className}>
      <defs>
        <linearGradient id="sizzle-g" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={BRAND} />
          <stop offset="100%" stopColor={BRAND} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <path
        d="M17 5 C22 5 22 14 12 16 C2 18 2 27 7 27"
        stroke="url(#sizzle-g)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="7" cy="27" r="2.6" fill={BRAND} />
    </svg>
  )
}
