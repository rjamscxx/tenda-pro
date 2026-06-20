'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import TendaLogo from '@/components/ui/TendaLogo'
import Wordmark from '@/components/ui/Wordmark'

// A brief brand intro that plays once per browser session when the user first
// lands on an app surface (login / signup / dashboard / etc.). The pushcart
// rolls in with spinning wheels, then "Tenda Pro" rises in, then it fades to
// reveal the page. Skipped on the marketing landing (/) and the public customer
// menu (/m/...). Respects prefers-reduced-motion.
export default function AppIntro() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!pathname || pathname === '/' || pathname.startsWith('/m/')) return
    let seen = false
    try {
      seen = sessionStorage.getItem('tp-intro-v1') === '1'
      if (!seen) sessionStorage.setItem('tp-intro-v1', '1')
    } catch { /* private mode — just play it */ }
    if (seen) return

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time intro is gated on a client-only sessionStorage read, which cannot run during render
    setShow(true)
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const hold = reduce ? 700 : 2150
    const t1 = setTimeout(() => setLeaving(true), hold)
    const t2 = setTimeout(() => setShow(false), hold + 520)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [pathname])

  if (!show) return null

  return (
    <div className={`tp-intro ${leaving ? 'tp-intro-leaving' : ''}`} role="status" aria-label="Tenda Pro">
      <div className="tp-intro-cart">
        <TendaLogo size={96} variant="badge" animated />
      </div>
      <div className="tp-intro-word">
        <Wordmark className="text-[30px]" />
        <div className="text-ink-4 text-sm mt-3">Know your margins. Run your kitchen.</div>
      </div>
    </div>
  )
}
