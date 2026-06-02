'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SizzleLogo from '@/components/ui/SizzleLogo'
import VenueSwitcher from './VenueSwitcher'

interface NavItemDef {
  href: string
  label: string
  icon: React.ReactNode
  proOnly?: boolean
  premiumOnly?: boolean
  ownerOnly?: boolean // hidden from staff (reveals financials)
}

const NAV_SECTIONS: { label: string; items: NavItemDef[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/><rect x="9" y="1" width="6" height="3" rx="1.5" fill="currentColor" opacity=".9"/><rect x="9" y="6" width="6" height="3" rx="1.5" fill="currentColor" opacity=".55"/><rect x="1" y="9" width="6" height="3" rx="1.5" fill="currentColor" opacity=".55"/><rect x="1" y="13" width="6" height="2" rx="1" fill="currentColor" opacity=".3"/><rect x="9" y="11" width="6" height="4" rx="1.5" fill="currentColor" opacity=".9"/></svg>
      )},
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/pos', label: 'POS', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4.5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 4.5V3h6v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 8.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M4 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="9.5" y="9.75" width="3" height="2.5" rx="0.75" fill="currentColor" opacity=".7"/></svg>
      )},
      { href: '/sales', label: 'Sales', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 11.5L5.5 7.5l3 2.5 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 4h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 14.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".35"/></svg>
      )},
      { href: '/menu', label: 'Menu', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M3 8h10M3 11.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12.5" cy="11.5" r="2" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="1.3"/><path d="M11.5 11.5h2M12.5 10.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
      )},
      { href: '/expenses', label: 'Expenses', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4.5L5.5 8l3-2.5 5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 11h3v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 14.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".35"/></svg>
      )},
      { href: '/inventory', label: 'Inventory', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8h6M5 5.5h6M5 10.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="12" cy="10.5" r="1" fill="currentColor" opacity=".6"/></svg>
      )},
      { href: '/suppliers', label: 'Suppliers', proOnly: true, icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 8h1.5l1.5 3v2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="4" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 5V3.5h6V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
      )},
      { href: '/waste', label: 'Waste Log', proOnly: true, icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5h11M6 4.5V3h4v1.5M5.5 4.5l.5 8.5h4l.5-8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )},
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/employees', label: 'Employees', proOnly: true, icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M11.5 7a2 2 0 100-4M13.5 14c0-1.93-1.12-3.6-2.75-4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      )},
      { href: '/shifts', label: 'Shifts', proOnly: true, icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><polyline points="8 4 8 8 11 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )},
      { href: '/payroll', label: 'Payroll', proOnly: true, icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="5" width="13" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 5V3.5h6V5M8 8.5v.5m0 1.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="9.75" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>
      )},
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/reports', label: 'Reports', ownerOnly: true, icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13V9M6 13V6M9 13V8M12 13V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M1.5 13.5h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".4"/></svg>
      )},
      { href: '/analytics', label: 'Analytics', proOnly: true, ownerOnly: true, icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 10l3.5-3.5 2.5 2.5L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12.5" cy="3.5" r="1.5" fill="currentColor" opacity=".7"/><path d="M2 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".4"/></svg>
      )},
    ],
  },
]

const BOTTOM_NAV = [
  { href: '/settings', label: 'Settings', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M12.6 3.4l-.9.9M4.3 11.7l-.9.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )},
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// Each nav item handles its own transition so the click registers visually in <1ms
function NavItem({
  href,
  label,
  icon,
  proOnly,
  premiumOnly,
  isUserPro,
  isUserPremium,
  onClose,
  badge,
}: {
  href: string
  label: string
  icon: React.ReactNode
  proOnly?: boolean
  premiumOnly?: boolean
  isUserPro?: boolean
  isUserPremium?: boolean
  onClose?: () => void
  badge?: number
}) {
  const pathname = usePathname()
  const router   = useRouter()
  const [isPending, startTransition] = useTransition()

  const locked = (proOnly && !isUserPro) || (premiumOnly && !isUserPremium)
  const active   = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  const isActive = active || isPending

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    if (active) return
    onClose?.()
    startTransition(() => router.push(href))
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={() => router.prefetch(href)}
      className={`nav-item flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium ${
        isActive ? 'nav-active' : locked ? 'text-ink-4 hover:text-ink-3 hover:bg-surface/70' : 'text-ink-3 hover:text-ink hover:bg-surface/80'
      }`}
    >
      <span className={`shrink-0 w-[22px] h-[22px] flex items-center justify-center rounded-[5px] transition-colors ${
        isActive ? 'bg-accent/12' : ''
      }`}>{icon}</span>
      {label}
      {locked && (
        <span className="ml-auto shrink-0 text-[10px] text-ink-4 opacity-60">
          {premiumOnly ? '💎' : '🔒'}
        </span>
      )}
      {badge && !locked && !isPending && (
        <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      {isPending && !locked && (
        <span className="ml-auto shrink-0">
          <svg className="animate-spin" width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5"
              strokeDasharray="22" strokeDashoffset="16" strokeLinecap="round" opacity="0.5"/>
          </svg>
        </span>
      )}
    </a>
  )
}

interface SidebarVenue {
  id: string
  name: string
}

interface SidebarProps {
  venueName: string
  venues?: SidebarVenue[]
  activeVenueId?: string
  fullName?: string
  role?: string
  isPro?: boolean
  isPremium?: boolean
  onClose?: () => void
  pendingSubRequests?: number
}

export default function Sidebar({ venueName, venues, activeVenueId, fullName, role, isPro, isPremium, onClose, pendingSubRequests }: SidebarProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = fullName ? getInitials(fullName) : '?'

  return (
    <aside
      className="relative w-56 shrink-0 flex flex-col bg-sidebar h-full border-r overflow-hidden"
      style={{ borderRightColor: 'color-mix(in srgb, var(--hair) 60%, var(--accent) 40%)' }}
    >
      {/* Ambient top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-36 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse 90% 60% at 50% -10%, var(--accent-tint), transparent 70%)' }}
      />
      {/* Logo */}
      <div className="relative z-10 h-[60px] flex flex-col justify-center px-4 border-b border-hair gap-1">
        <div className="flex items-center gap-2.5">
          <SizzleLogo size={28} variant="badge" />
          <span className="font-semibold text-[17px] tracking-tight gradient-text leading-none">Sizzle</span>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto text-ink-4 hover:text-ink p-1 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        {venues && venues.length > 0 && activeVenueId ? (
          <VenueSwitcher venues={venues} activeVenueId={activeVenueId} isPremium={!!isPremium} />
        ) : (
          <p className="text-[11px] text-ink-4 truncate leading-none pl-[38px]">{venueName}</p>
        )}
      </div>

      {/* Main nav — staff role doesn't see ownerOnly items (Reports, Analytics) */}
      <nav className="relative z-10 flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map(section => {
          const visible = section.items.filter(it => !(it.ownerOnly && role !== 'owner'))
          if (!visible.length) return null
          return (
            <div key={section.label}>
              <div className="px-3 mb-1 flex items-center gap-2">
                <span className="text-[7px] leading-none" style={{ color: 'var(--accent)', opacity: 0.55 }}>●</span>
                <span className="text-[10px] font-semibold text-ink-4 uppercase tracking-widest">{section.label}</span>
                <span className="flex-1 h-px" style={{ background: 'var(--hair)', opacity: 0.6 }} />
              </div>
              <div className="space-y-0.5">
                {visible.map(({ href, label, icon, proOnly, premiumOnly }) => (
                  <NavItem key={href} href={href} label={label} icon={icon} proOnly={proOnly} premiumOnly={premiumOnly} isUserPro={isPro} isUserPremium={isPremium} onClose={onClose} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="relative z-10 py-2 px-2 border-t border-hair space-y-0.5">
        {BOTTOM_NAV.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            onClose={onClose}
            badge={href === '/settings' && pendingSubRequests ? pendingSubRequests : undefined}
          />
        ))}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-ink-4 hover:text-danger hover:bg-surface transition-all duration-100 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>

        {/* User avatar chip */}
        {fullName && (
          <div className="mt-2 pt-2 border-t border-hair">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg glass">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  boxShadow: '0 0 0 2px var(--accent-tint)',
                }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-ink truncate">{fullName}</p>
                <p className="text-[10px] text-ink-4 capitalize">{role ?? 'owner'}</p>
              </div>
              <span
                className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: isPro ? 'var(--accent-dim)' : 'var(--surface-3)',
                  color: isPro ? 'var(--accent)' : 'var(--ink-4)',
                }}
              >
                {isPremium ? 'PRO+' : isPro ? 'PRO' : 'FREE'}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
