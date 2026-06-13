'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import TendaLogo from '@/components/ui/TendaLogo'

interface MobileNavVenue { id: string; name: string }

export default function MobileNav({ venueName, venues, activeVenueId, fullName, role, isPro, isPremium, isAdmin, pendingSubRequests }: { venueName: string; venues?: MobileNavVenue[]; activeVenueId?: string; fullName?: string; role?: string; isPro?: boolean; isPremium?: boolean; isAdmin?: boolean; pendingSubRequests?: number }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close drawer when route changes (e.g. back button, programmatic nav).
  // setState in effect is intentional here: external signal → UI sync.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      {/* Brand + hamburger pill — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[var(--z-dropdown)] flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-surface border border-hair text-ink-3 hover:text-ink shadow-sm"
        aria-label="Open menu"
      >
        <TendaLogo size={22} variant="badge" />
        <span className="font-semibold text-[14px] tracking-[-0.02em] gradient-text leading-none">Tenda</span>
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none" className="ml-1 shrink-0">
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
        <Sidebar venueName={venueName} venues={venues} activeVenueId={activeVenueId} fullName={fullName} role={role} isPro={isPro} isPremium={isPremium} isAdmin={isAdmin} onClose={() => setOpen(false)} pendingSubRequests={pendingSubRequests} />
      </div>

      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar venueName={venueName} venues={venues} activeVenueId={activeVenueId} fullName={fullName} role={role} isPro={isPro} isPremium={isPremium} isAdmin={isAdmin} pendingSubRequests={pendingSubRequests} />
      </div>
    </>
  )
}
