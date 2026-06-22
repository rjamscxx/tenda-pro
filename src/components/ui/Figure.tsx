'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

type Fmt = 'currency' | 'number' | 'percent'

/* useLayoutEffect on the client (so we set the start value before the browser
   paints — no flash of the final number), useEffect on the server (no SSR warn). */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3) // mirrors --ease-out's decelerate

function render(n: number, fmt: Fmt, decimals: number): string {
  switch (fmt) {
    case 'currency': return formatCurrency(Math.round(n))
    case 'percent':  return `${n.toFixed(decimals)}%`
    default:         return Math.round(n).toLocaleString('en-PH')
  }
}

/**
 * Figure — a financial number that counts up to its value on mount.
 *
 * The signature "premium" beat for a money dashboard: owners watch the peso
 * total resolve. SSR renders the final value (no layout shift, no hydration
 * mismatch); the animation runs once on mount. Respects prefers-reduced-motion
 * and skips zero values (nothing to roll up to). Always tabular Geist Mono.
 */
export default function Figure({
  value,
  format = 'number',
  decimals = 1,
  durationMs = 650,
  className = '',
}: {
  value: number
  format?: Fmt
  decimals?: number
  durationMs?: number
  className?: string
}) {
  // Initial state = final value → server HTML and first client render match.
  const [display, setDisplay] = useState(value)
  const raf = useRef<number | null>(null)

  useIsoLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || value === 0) { setDisplay(value); return }

    const start = performance.now()
    setDisplay(0)
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      setDisplay(value * easeOut(t))
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else setDisplay(value)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [value, durationMs])

  return <span className={`tabular ${className}`.trim()}>{render(display, format, decimals)}</span>
}
