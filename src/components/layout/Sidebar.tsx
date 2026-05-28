'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SizzleLogo from '@/components/ui/SizzleLogo'

interface NavItemDef {
  href: string
  label: string
  icon: React.ReactNode
  proOnly?: boolean
  premiumOnly?: boolean
}

const NAV_SECTIONS: { label: string; items: NavItemDef[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/></svg>
      )},
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/pos', label: 'POS', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M4 8.5h8M4 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="11.5" cy="11" r="0.75" fill="currentColor"/><path d="M5 4V2.5h6V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )},
      { href: '/sales', label: 'Sales', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 11.5L6 7l3 3 5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 5.5h3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )},
      { href: '/menu', label: 'Menu', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 8h5M8 5.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      )},
      { href: '/expenses', label: 'Expenses', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4.5L6 9l3-3 5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 10.5h3v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )},
      { href: '/inventory', label: 'Inventory', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8h6M5 5.5h6M5 10.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
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
      { href: '/payroll', label: 'Payroll', proOnly: true, icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="5" width="13" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 5V3.5h6V5M8 8.5v.5m0 1.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="9.75" r="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>
      )},
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/reports', label: 'Reports', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13V9M6 13V6M9 13V8M12 13V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
      )},
      { href: '/analytics', label: 'Analytics', premiumOnly: true, icon: (
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
}: {
  href: string
  label: string
  icon: React.ReactNode
  proOnly?: boolean
  premiumOnly?: boolean
  isUserPro?: boolean
  isUserPremium?: boolean
  onClose?: () => void
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
      <span className="shrink-0">{icon}</span>
      {label}
      {locked && (
        <span className="ml-auto shrink-0 text-[10px] text-ink-4 opacity-60">
          {premiumOnly ? '💎' : '🔒'}
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

interface SidebarProps {
  venueName: string
  fullName?: string
  role?: string
  isPro?: boolean
  isPremium?: boolean
  onClose?: () => void
}

export default function Sidebar({ venueName, fullName, role, isPro, isPremium, onClose }: SidebarProps) {
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
      className="w-56 shrink-0 flex flex-col bg-sidebar h-full border-r"
      style={{ borderRightColor: 'color-mix(in srgb, var(--hair) 60%, var(--accent) 40%)' }}
    >
      {/* Logo */}
      <div className="h-[60px] flex flex-col justify-center px-4 border-b border-hair gap-0.5">
        <div className="flex items-center gap-2">
          <SizzleLogo size={20} />
          <span className="font-semibold text-[15px] tracking-tight gradient-text">Sizzle</span>
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
        <p className="text-[11px] text-ink-4 truncate leading-none pl-[28px]">{venueName}</p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold text-ink-4 uppercase tracking-widest">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon, proOnly, premiumOnly }) => (
                <NavItem key={href} href={href} label={label} icon={icon} proOnly={proOnly} premiumOnly={premiumOnly} isUserPro={isPro} isUserPremium={isPremium} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="py-2 px-2 border-t border-hair space-y-0.5">
        {BOTTOM_NAV.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon} onClose={onClose} />
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
          <div className="mt-2 pt-2 border-t border-hair flex items-center gap-2.5 px-3 py-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-ink truncate">{fullName}</p>
              <p className="text-[10px] text-ink-4 capitalize">{role ?? 'owner'}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
