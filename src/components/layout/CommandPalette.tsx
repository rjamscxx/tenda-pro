'use client'

/**
 * Command Palette — Cmd/Ctrl-K quick navigation + actions.
 *
 * A keyboard-first launcher for the ops cockpit. Opens on ⌘K / Ctrl-K (or "/"
 * when no field is focused), fuzzy-filters every page and quick action the
 * current account can reach, and routes on Enter. Locked (Pro/Premium) and
 * owner-only destinations are filtered out so staff and free accounts never see
 * a dead end. Built entirely with tokens + inline SVG per DESIGN.md — glass
 * overlay, hairline rows, single accent, spring entrance, no spinner.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type CommandKind = 'page' | 'action'

interface Command {
  id: string
  label: string
  hint?: string
  kind: CommandKind
  keywords?: string
  href: string
  icon: React.ReactNode
  proOnly?: boolean
  premiumOnly?: boolean
  ownerOnly?: boolean
  adminOnly?: boolean
}

interface CommandPaletteProps {
  isPro?: boolean
  isPremium?: boolean
  role?: string
  isAdmin?: boolean
}

// Icons kept compact (14px) and stroke-only to match the sidebar set.
const ic = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/></svg>
  ),
  pos: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="4.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 4.5V3h6v1.5M4 8.5h8M4 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  ),
  sales: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 11.5L5.5 7.5l3 2.5 5-6M11 4h3v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  menu: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M3 8h10M3 11.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
  ),
  expenses: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4.5L5.5 8l3-2.5 5 5.5M10.5 11h3v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  inventory: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5.5h6M5 8h6M5 10.5h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  ),
  suppliers: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M11 8h1.5l1.5 3v2H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="4" cy="13" r="1.3" stroke="currentColor" strokeWidth="1.2"/><circle cx="12" cy="13" r="1.3" stroke="currentColor" strokeWidth="1.2"/></svg>
  ),
  waste: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5h11M6 4.5V3h4v1.5M5.5 4.5l.5 8.5h4l.5-8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  kitchen: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 6c0-2 1.5-3.5 3.5-3.5S10 4 10 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="2" y="6.5" width="9" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.3"/><path d="M12 4l2 1v9l-2 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
  ),
  checklists: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 6l1.5 1.5L9.5 4.5M5 10.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  employees: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5.5" r="2.3" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 13.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11.5 7a2 2 0 100-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  ),
  shifts: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  payroll: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="5" width="13" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5V3.5h6V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.2"/></svg>
  ),
  members: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.3" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 13.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  ),
  reports: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 13V9M6.5 13V6M10 13V8M13.5 13V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
  ),
  analytics: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 10l3.5-3.5 2.5 2.5L12 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12.5" cy="3.5" r="1.3" fill="currentColor"/></svg>
  ),
  settings: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M12.6 3.4l-.9.9M4.3 11.7l-.9.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  ),
  plus: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
  ),
  closeDay: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13.5 9.5A5.5 5.5 0 116.5 2.5a4.3 4.3 0 107 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
  ),
}

const COMMANDS: Command[] = [
  // Pages
  { id: 'p-dashboard', kind: 'page', label: 'Dashboard',  hint: 'Overview',   href: '/dashboard',  icon: ic.dashboard,  keywords: 'home overview kpi' },
  { id: 'p-pos',       kind: 'page', label: 'POS',         hint: 'Operations', href: '/pos',        icon: ic.pos,        keywords: 'point of sale charge cart' },
  { id: 'p-kitchen',   kind: 'page', label: 'Kitchen',     hint: 'Operations', href: '/kds',        icon: ic.kitchen,    keywords: 'kds tickets orders', proOnly: true },
  { id: 'p-checklists',kind: 'page', label: 'Checklists',  hint: 'Operations', href: '/checklists', icon: ic.checklists, keywords: 'opening closing routine' },
  { id: 'p-sales',     kind: 'page', label: 'Sales',       hint: 'Operations', href: '/sales',      icon: ic.sales,      keywords: 'revenue transactions orders' },
  { id: 'p-menu',      kind: 'page', label: 'Menu',        hint: 'Operations', href: '/menu',       icon: ic.menu,       keywords: 'dishes recipes ingredients costing' },
  { id: 'p-expenses',  kind: 'page', label: 'Expenses',    hint: 'Operations', href: '/expenses',   icon: ic.expenses,   keywords: 'costs spend bills' },
  { id: 'p-inventory', kind: 'page', label: 'Inventory',   hint: 'Operations', href: '/inventory',  icon: ic.inventory,  keywords: 'stock ingredients low restock' },
  { id: 'p-suppliers', kind: 'page', label: 'Suppliers',   hint: 'Operations', href: '/suppliers',  icon: ic.suppliers,  keywords: 'vendors purchasing', proOnly: true },
  { id: 'p-waste',     kind: 'page', label: 'Waste Log',   hint: 'Operations', href: '/waste',      icon: ic.waste,      keywords: 'spoilage loss', proOnly: true },
  { id: 'p-employees', kind: 'page', label: 'Employees',   hint: 'People',     href: '/employees',  icon: ic.employees,  keywords: 'staff team', proOnly: true },
  { id: 'p-shifts',    kind: 'page', label: 'Shifts',      hint: 'People',     href: '/shifts',     icon: ic.shifts,     keywords: 'schedule roster hours', proOnly: true },
  { id: 'p-payroll',   kind: 'page', label: 'Payroll',     hint: 'People',     href: '/payroll',    icon: ic.payroll,    keywords: 'salary pay wages', proOnly: true },
  { id: 'p-members',   kind: 'page', label: 'Members',     hint: 'Admin',      href: '/members',    icon: ic.members,    keywords: 'access roles invite', adminOnly: true },
  { id: 'p-reports',   kind: 'page', label: 'Reports',     hint: 'Insights',   href: '/reports',    icon: ic.reports,    keywords: 'pl profit loss export', ownerOnly: true },
  { id: 'p-analytics', kind: 'page', label: 'Analytics',   hint: 'Insights',   href: '/analytics',  icon: ic.analytics,  keywords: 'trends charts insights', proOnly: true, ownerOnly: true },
  { id: 'p-settings',  kind: 'page', label: 'Settings',    hint: 'Account',    href: '/settings',   icon: ic.settings,   keywords: 'preferences theme venue billing' },
  // Quick actions
  { id: 'a-log-sale',   kind: 'action', label: 'Log a sale',        hint: 'Action', href: '/sales?log=1',    icon: ic.plus,     keywords: 'new sale record add revenue' },
  { id: 'a-open-pos',   kind: 'action', label: 'Open POS',          hint: 'Action', href: '/pos',            icon: ic.pos,      keywords: 'charge order cart checkout' },
  { id: 'a-add-expense',kind: 'action', label: 'Add an expense',    hint: 'Action', href: '/expenses?add=1', icon: ic.plus,     keywords: 'new expense cost spend' },
  { id: 'a-add-dish',   kind: 'action', label: 'Add a dish',        hint: 'Action', href: '/menu?add=1',     icon: ic.plus,     keywords: 'new dish recipe menu item' },
  { id: 'a-close-day',  kind: 'action', label: 'Close the day',     hint: 'Action', href: '/close-day',      icon: ic.closeDay, keywords: 'end of day eod summary reconcile', ownerOnly: true },
]

function score(cmd: Command, q: string): number {
  if (!q) return 1
  const hay = `${cmd.label} ${cmd.hint ?? ''} ${cmd.keywords ?? ''}`.toLowerCase()
  const label = cmd.label.toLowerCase()
  if (label === q) return 100
  if (label.startsWith(q)) return 80
  if (label.includes(q)) return 60
  // subsequence match across the haystack (typo/abbrev friendly)
  let qi = 0
  for (let i = 0; i < hay.length && qi < q.length; i++) {
    if (hay[i] === q[qi]) qi++
  }
  if (qi === q.length) return 30
  return 0
}

export default function CommandPalette({ isPro, isPremium, role, isAdmin }: CommandPaletteProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const available = useMemo(
    () =>
      COMMANDS.filter(
        c =>
          !(c.proOnly && !isPro) &&
          !(c.premiumOnly && !isPremium) &&
          !(c.ownerOnly && role !== 'owner') &&
          !(c.adminOnly && !isAdmin)
      ),
    [isPro, isPremium, role, isAdmin]
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return available
      .map(c => ({ c, s: score(c, q) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s || (a.c.kind === b.c.kind ? 0 : a.c.kind === 'action' ? -1 : 1))
      .map(x => x.c)
  }, [available, query])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActive(0)
  }, [])

  const run = useCallback(
    (cmd?: Command) => {
      if (!cmd) return
      close()
      router.push(cmd.href)
    },
    [close, router]
  )

  // Global open hotkey: ⌘K / Ctrl-K, or "/" when nothing else is focused.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if (k === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
        return
      }
      if (e.key === '/' && !open) {
        const el = document.activeElement
        const typing =
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          (el instanceof HTMLElement && el.isContentEditable)
        if (!typing) {
          e.preventDefault()
          setOpen(true)
        }
      }
    }
    function onOpenEvent() { setOpen(true) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('tenda:command-palette', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('tenda:command-palette', onOpenEvent)
    }
  }, [open])

  // Focus the field and lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prev
    }
  }, [open])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setActive(0) }, [query])

  // Keep the highlighted row in view.
  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  if (!open) return null

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[active]) }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onKeyDown={onListKey}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md overlay-enter"
        onClick={close}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-xl glass rounded-2xl border border-hair overflow-hidden shadow-2xl modal-enter">
        {/* Search row */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-hair">
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" className="text-ink-4 shrink-0">
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages and actions…"
            className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-4 outline-none"
            spellCheck={false}
            autoComplete="off"
          />
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-medium text-ink-4 tabular px-1.5 py-0.5 rounded-md border border-hair bg-surface-2">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5 scrollbar-thin">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-ink-3">No matches for “{query}”</p>
              <p className="text-xs text-ink-4 mt-1">Try a page name like “sales” or “inventory”.</p>
            </div>
          ) : (
            results.map((cmd, idx) => {
              const isActive = idx === active
              return (
                <button
                  key={cmd.id}
                  data-idx={idx}
                  onClick={() => run(cmd)}
                  onMouseMove={() => setActive(idx)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 mx-1.5 my-px rounded-lg text-left transition-colors',
                    'py-2.5',
                    isActive ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:text-ink'
                  )}
                  style={{ width: 'calc(100% - 0.75rem)' }}
                >
                  <span
                    className={cn(
                      'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                      isActive ? 'bg-accent-dim text-accent' : 'bg-surface-2 text-ink-4'
                    )}
                  >
                    {cmd.icon}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-[14px] font-medium">{cmd.label}</span>
                  {cmd.kind === 'action' && (
                    <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                      Action
                    </span>
                  )}
                  <span className="shrink-0 text-[11px] text-ink-4">{cmd.hint}</span>
                  {isActive && (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0 text-ink-4">
                      <path d="M2 7h9M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer legend */}
        <div className="flex items-center gap-4 px-4 h-9 border-t border-hair text-[10px] text-ink-4">
          <span className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center px-1 py-0.5 rounded border border-hair bg-surface-2 tabular">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center px-1 py-0.5 rounded border border-hair bg-surface-2 tabular">↵</kbd>
            open
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <kbd className="inline-flex items-center px-1 py-0.5 rounded border border-hair bg-surface-2 tabular">⌘K</kbd>
            toggle
          </span>
        </div>
      </div>
    </div>
  )
}
