'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function MobileNav({ venueName, fullName, role, isPro }: { venueName: string; fullName?: string; role?: string; isPro?: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close on navigation
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[var(--z-dropdown)] p-2 rounded-lg bg-surface border border-hair text-ink-3 hover:text-ink"
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-[var(--z-overlay)] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-full z-[var(--z-modal)]
        transition-transform duration-200 ease-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar venueName={venueName} fullName={fullName} role={role} isPro={isPro} onClose={() => setOpen(false)} />
      </div>

      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar venueName={venueName} fullName={fullName} role={role} isPro={isPro} />
      </div>
    </>
  )
}
