interface Props {
  size?: number
  className?: string
  variant?: 'mark' | 'badge'
  /** When true, the wheels spin + the cart gently rolls — used by the intro splash. */
  animated?: boolean
}

// Tenda Pro brand mark — a street vendor's PUSHCART (kariton / tinda cart): an
// awning canopy over a stall box on two wheels, with a push handle. A direct,
// ownable nod to "tinda" (to sell). Ember is the brand color, theme-independent.
const BRAND = '#F97316'
const BRAND_LIGHT = '#FB923C'
const BRAND_DEEP = '#EA580C'

// Pushcart drawn on a shared 32-unit grid. `stroke` is the line color, `wheelHub`
// the small hub dot. `spin` adds the wheel-rotation class for the animated intro.
function Cart({ color, spin }: { color: string; spin?: boolean }) {
  return (
    <g>
      {/* awning canopy with a scalloped front valance */}
      <path d="M3.5 11 Q16 5.5 28.5 11 L28.5 11.6 L3.5 11.6 Z" fill={color} />
      <path
        d="M3.5 11.6 q2.1 2.4 4.2 0 q2.1 2.4 4.2 0 q2.1 2.4 4.2 0 q2.1 2.4 4.2 0 q2.1 2.4 4.2 0 Z"
        fill={color}
        opacity="0.85"
      />
      {/* stall box */}
      <rect x="5.5" y="13.4" width="21" height="6.4" rx="1.4" fill={color} />
      {/* a counter shelf line across the box (negative space) */}
      <rect x="7.5" y="16.2" width="17" height="1.1" rx="0.55" fill="#000" opacity="0.18" />
      {/* push handle */}
      <path d="M26.5 14.6 L30 12.2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      {/* wheels (hub dot reads as a wheel; spin in the intro) */}
      <g className={spin ? 'tp-wheel' : ''} style={{ transformOrigin: '10.5px 22.5px' }}>
        <circle cx="10.5" cy="22.5" r="2.7" fill={color} />
        <circle cx="10.5" cy="22.5" r="0.95" fill="#000" opacity="0.22" />
      </g>
      <g className={spin ? 'tp-wheel' : ''} style={{ transformOrigin: '21px 22.5px' }}>
        <circle cx="21" cy="22.5" r="2.7" fill={color} />
        <circle cx="21" cy="22.5" r="0.95" fill="#000" opacity="0.22" />
      </g>
    </g>
  )
}

export default function TendaLogo({ size = 24, className = '', variant = 'mark', animated = false }: Props) {
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
        <rect width="32" height="32" rx="7.5" fill="url(#tenda-badge-g)" />
        <rect x="0.5" y="0.5" width="31" height="31" rx="7" fill="none" stroke="#FFFFFF" strokeOpacity="0.18" />
        <Cart color="#FFF8F0" spin={animated} />
      </svg>
    )
  }
  const h = Math.round(size * 1.333)
  return (
    <svg width={size} height={h} viewBox="2 4 28 24" fill="none" className={className}>
      <defs>
        <linearGradient id="tenda-mark-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND_LIGHT} />
          <stop offset="100%" stopColor={BRAND_DEEP} />
        </linearGradient>
      </defs>
      <Cart color="url(#tenda-mark-g)" spin={animated} />
    </svg>
  )
}
