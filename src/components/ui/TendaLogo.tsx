interface Props {
  size?: number
  className?: string
  variant?: 'mark' | 'badge'
}

// Tenda Pro brand mark — a refined slab-serif "T" monogram. The bracketed top
// bar and slab foot read as established and premium (vs a plain geometric T),
// while staying minimal and legible from 16px to 512px. Ember is the brand
// color, independent of the active theme.
const BRAND = '#F97316'
const BRAND_LIGHT = '#FB923C'
const BRAND_DEEP = '#EA580C'

// The monogram on a shared 32-unit grid — top bar with subtle bracket serifs,
// centered stem, and a slab foot.
function Monogram({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <rect x="6.6" y="7.6" width="18.8" height="3.5" rx="1.15" />
      {/* bracket serifs at the bar ends — the premium terminal detail */}
      <rect x="6.6" y="10.4" width="2.6" height="1.7" rx="0.6" />
      <rect x="22.8" y="10.4" width="2.6" height="1.7" rx="0.6" />
      {/* stem */}
      <rect x="14.25" y="9.8" width="3.5" height="11.5" rx="1" />
      {/* slab foot */}
      <rect x="10.8" y="21" width="10.4" height="3.4" rx="1.15" />
    </g>
  )
}

export default function TendaLogo({ size = 24, className = '', variant = 'mark' }: Props) {
  if (variant === 'badge') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <defs>
          <linearGradient id="tenda-badge-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND_LIGHT} />
            <stop offset="55%" stopColor={BRAND} />
            <stop offset="100%" stopColor={BRAND_DEEP} />
          </linearGradient>
        </defs>
        {/* premium ember badge with a lit top edge */}
        <rect width="32" height="32" rx="7.5" fill="url(#tenda-badge-g)" />
        <rect x="0.5" y="0.5" width="31" height="31" rx="7" fill="none" stroke="#FFFFFF" strokeOpacity="0.18" />
        <Monogram fill="#FFF8F0" />
      </svg>
    )
  }

  // Standalone colored mark — keep the original 24x32 box + sizing approach,
  // centering the 32-grid monogram inside it.
  const h = Math.round(size * 1.333)
  return (
    <svg width={size} height={h} viewBox="0 0 24 32" fill="none" className={className}>
      <defs>
        <linearGradient id="tenda-mark-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND_LIGHT} />
          <stop offset="100%" stopColor={BRAND_DEEP} />
        </linearGradient>
      </defs>
      <g transform="translate(-4 0)">
        <Monogram fill="url(#tenda-mark-g)" />
      </g>
    </svg>
  )
}
