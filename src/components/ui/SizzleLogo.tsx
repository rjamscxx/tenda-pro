interface Props {
  size?: number
  className?: string
}

export default function SizzleLogo({ size = 24, className = '' }: Props) {
  const h = Math.round(size * 1.333)
  return (
    <svg width={size} height={h} viewBox="0 0 24 32" fill="none" className={className}>
      <defs>
        <linearGradient id="sizzle-g" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path
        d="M17 5 C22 5 22 14 12 16 C2 18 2 27 7 27"
        stroke="url(#sizzle-g)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="7" cy="27" r="2.6" fill="var(--accent)" />
    </svg>
  )
}
