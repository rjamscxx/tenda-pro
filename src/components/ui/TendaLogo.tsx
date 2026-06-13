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
      {/* awning — one clean curved canopy (no scallops) */}
      <path d="M4.5 11.8 Q16 7 27.5 11.8 L27.5 12.7 Q16 8.1 4.5 12.7 Z" fill={color} />
      {/* stall box — single clean rounded form */}
      <rect x="6" y="13.6" width="20" height="6" rx="1.5" fill={color} />
      {/* push handle — one stroke */}
      <path d="M26 15 L29.5 12.7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* two clean wheels (no hubs) */}
      <g className={spin ? 'tp-wheel' : ''} style={{ transformOrigin: '11px 22.3px' }}>
        <circle cx="11" cy="22.3" r="2.5" fill={color} />
      </g>
      <g className={spin ? 'tp-wheel' : ''} style={{ transformOrigin: '21px 22.3px' }}>
        <circle cx="21" cy="22.3" r="2.5" fill={color} />
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
