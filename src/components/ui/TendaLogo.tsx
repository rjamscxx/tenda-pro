interface Props {
  size?: number
  className?: string
  variant?: 'mark' | 'badge'
}

// Brand color is always the Tenda orange — independent of the active theme.
const BRAND = '#F97316'
const BRAND_LIGHT = '#FB923C'

/**
 * Tenda mark — a market-stall awning over a vertical post.
 * Reads as a storefront/sari-sari stall roof (a nod to "tinda" = to sell) and,
 * simultaneously, as a geometric "T" monogram. Reduces to a strong T silhouette
 * at small sizes; the scalloped valance reads as an awning at larger sizes.
 *
 * Drawn within a 32x32 grid (shared by both variants). The `mark` variant keeps
 * the original 24x32-style proportions via a centered translate inside a 24x32 box.
 */
function MarkPaths({ color }: { color: string }) {
  return (
    <>
      {/* Awning roof: a flat trapezoidal bar — the stall canopy / top of the T */}
      <path
        d="M5 9 L27 9 L24.5 13.5 L7.5 13.5 Z"
        fill={color}
      />
      {/* Valance scallops — the fabric edge of the awning */}
      <path
        d="M7.5 13.5
           q1.7 2.2 3.4 0
           q1.7 2.2 3.4 0
           q1.7 2.2 3.4 0
           q1.7 2.2 3.4 0
           Z"
        fill={color}
        opacity="0.78"
      />
      {/* Post — the stall support / stem of the T */}
      <rect x="14.4" y="13.5" width="3.2" height="11" rx="1.4" fill={color} />
    </>
  )
}

export default function TendaLogo({ size = 24, className = '', variant = 'mark' }: Props) {
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
        {/* Mark in white, nudged up slightly to optically center inside the square */}
        <g transform="translate(0 -0.5)">
          <MarkPaths color="white" />
        </g>
      </svg>
    )
  }

  // Standalone colored mark — keep the original 24x32 box + sizing approach.
  const h = Math.round(size * 1.333)
  return (
    <svg width={size} height={h} viewBox="0 0 24 32" fill="none" className={className}>
      <defs>
        <linearGradient id="sizzle-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND_LIGHT} />
          <stop offset="100%" stopColor={BRAND} />
        </linearGradient>
      </defs>
      {/* Center the 32-grid mark inside the 24x32 viewBox */}
      <g transform="translate(-4 0)">
        <MarkPaths color="url(#sizzle-g)" />
      </g>
    </svg>
  )
}
