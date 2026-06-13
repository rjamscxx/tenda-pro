interface Props {
  size?: number
  className?: string
  variant?: 'mark' | 'badge'
  /** When true, the wheels spin + the cart gently rolls — used by the intro splash. */
  animated?: boolean
}

// Tenda Pro brand mark — a clean grocery SHOPPING CART (commerce icon, a nod to
// "tinda" = to sell). Monoline basket + handle, solid wheels. Ember is the brand
// color, theme-independent.
const BRAND = '#F97316'
const BRAND_LIGHT = '#FB923C'
const BRAND_DEEP = '#EA580C'

// Shopping cart on a shared 32-unit grid. Handle+base and basket are strokes of
// a single weight; wheels are solid. `spin` rotates the wheels for the intro.
function Cart({ color, spin }: { color: string; spin?: boolean }) {
  const sw = 2.1
  return (
    <g>
      {/* handle grip → diagonal → base rail */}
      <path d={`M4 7.5 H7 L10 18 H24`} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* basket — open trapezoid sitting on the rail */}
      <path d={`M8.4 10 H27 L24.4 18 H10.6`} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* two basket dividers (grocery-basket detail) */}
      <path d="M14.6 10.4 L13.9 17.6 M19.5 10.4 L19.9 17.6" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.75" />
      {/* wheels */}
      <g className={spin ? 'tp-wheel' : ''} style={{ transformOrigin: '13px 22.5px' }}>
        <circle cx="13" cy="22.5" r="2.4" fill={color} />
      </g>
      <g className={spin ? 'tp-wheel' : ''} style={{ transformOrigin: '22px 22.5px' }}>
        <circle cx="22" cy="22.5" r="2.4" fill={color} />
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
