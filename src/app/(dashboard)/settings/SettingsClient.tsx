'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateVenue, updateProfile, downgradeTofree, deleteAccount, startTrial, activateSubscriptionRequest, rejectSubscriptionRequest } from './actions'
import InstallButton from '@/components/layout/InstallButton'

// ── Theme picker ──────────────────────────────────────────────────────────────

interface ThemeDef {
  id: string; name: string; label: string
  canvas: string; surface: string; accent: string; accentEnd: string; ink: string; dark: boolean
}

const THEMES: ThemeDef[] = [
  { id: 'sage-dark',   name: 'Sage Dark',    label: 'Default',       dark: true,  canvas: '#0E1714', surface: '#18231F', accent: '#58C098', accentEnd: '#3DA87A', ink: '#ECE6D5' },
  { id: 'sage-light',  name: 'Sage Light',   label: 'Light',         dark: false, canvas: '#F4F0E7', surface: '#FFFFFF', accent: '#1F5F4A', accentEnd: '#174D3A', ink: '#1A2420' },
  { id: 'espresso',    name: 'Espresso',     label: 'Coffee',        dark: true,  canvas: '#1A1410', surface: '#26201A', accent: '#D9A876', accentEnd: '#B8824E', ink: '#F0E8DA' },
  { id: 'citrus',      name: 'Citrus',       label: 'Fresh',         dark: true,  canvas: '#0F1410', surface: '#1A211A', accent: '#C9E663', accentEnd: '#A8C240', ink: '#EEF0D8' },
  { id: 'crimson',     name: 'Crimson',      label: 'Steakhouse',    dark: true,  canvas: '#14100F', surface: '#201A18', accent: '#DC2626', accentEnd: '#B91C1C', ink: '#F0E8E0' },
  { id: 'ocean',       name: 'Ocean',        label: 'Seafood',       dark: true,  canvas: '#060D14', surface: '#0D1820', accent: '#0EA5E9', accentEnd: '#0284C7', ink: '#DCF0F8' },
  { id: 'rose',        name: 'Rose',         label: 'Bakery',        dark: true,  canvas: '#150C10', surface: '#221520', accent: '#E879A6', accentEnd: '#DB2777', ink: '#F8ECF4' },
  { id: 'ember',       name: 'Ember',        label: 'BBQ & Grill',   dark: true,  canvas: '#130A04', surface: '#1F1408', accent: '#F97316', accentEnd: '#EA580C', ink: '#F8ECE0' },
  { id: 'midnight',    name: 'Midnight',     label: 'Fine Dining',   dark: true,  canvas: '#070714', surface: '#10111E', accent: '#818CF8', accentEnd: '#6366F1', ink: '#E8E8F8' },
  { id: 'harvest',     name: 'Harvest',      label: 'Brewery',       dark: true,  canvas: '#14100A', surface: '#201C14', accent: '#F59E0B', accentEnd: '#D97706', ink: '#F8F0D8' },
  { id: 'jade',        name: 'Jade',         label: 'Tea House',     dark: true,  canvas: '#071010', surface: '#101E20', accent: '#10B981', accentEnd: '#059669', ink: '#DCF0EC' },
  { id: 'slate',       name: 'Slate',        label: 'Modern Café',   dark: true,  canvas: '#0E1017', surface: '#181B24', accent: '#14B8A6', accentEnd: '#0D9488', ink: '#E0E4F0' },
  // ── Food-business themes ────────────────────────────────────────────────────
  { id: 'wasabi',      name: 'Wasabi',       label: 'Japanese · Sushi', dark: true,  canvas: '#0B1010', surface: '#161E1B', accent: '#84CC16', accentEnd: '#65A30D', ink: '#E8F0E4' },
  { id: 'trattoria',   name: 'Trattoria',    label: 'Italian',           dark: true,  canvas: '#15100C', surface: '#221A14', accent: '#D97746', accentEnd: '#B25E33', ink: '#F4ECD8' },
  { id: 'mariachi',    name: 'Mariachi',     label: 'Mexican',           dark: true,  canvas: '#14080A', surface: '#251114', accent: '#FBBF24', accentEnd: '#D97706', ink: '#FCE9D6' },
  { id: 'imperial',    name: 'Imperial',     label: 'Chinese Banquet',   dark: true,  canvas: '#100808', surface: '#1F1010', accent: '#EAB308', accentEnd: '#CA8A04', ink: '#F5E9CC' },
  { id: 'saffron',     name: 'Saffron',      label: 'Indian · Curry',    dark: true,  canvas: '#140C04', surface: '#25180D', accent: '#F97316', accentEnd: '#C2410C', ink: '#FCEACB' },
  { id: 'diner',       name: 'Diner',        label: 'American Diner',    dark: true,  canvas: '#080C14', surface: '#131B2C', accent: '#38BDF8', accentEnd: '#0284C7', ink: '#E8EEF8' },
  { id: 'halo',        name: 'Halo',         label: 'Halo-halo · Filipino Dessert', dark: true,  canvas: '#110A18', surface: '#1E1428', accent: '#C084FC', accentEnd: '#9333EA', ink: '#F2E8F5' },
  { id: 'boba',        name: 'Boba',         label: 'Bubble Tea · Milk Tea', dark: true,  canvas: '#14100E', surface: '#221C1A', accent: '#F472B6', accentEnd: '#DB2777', ink: '#F8ECE6' },
  // ── Light themes ────────────────────────────────────────────────────────────
  { id: 'cloud',       name: 'Cloud',        label: 'Minimal Light',     dark: false, canvas: '#FAFAFA', surface: '#FFFFFF', accent: '#0EA5E9', accentEnd: '#0284C7', ink: '#18181B' },
  { id: 'linen',       name: 'Linen',        label: 'Café Light',        dark: false, canvas: '#FAF6EE', surface: '#FFFEF9', accent: '#92400E', accentEnd: '#78350F', ink: '#2A1F12' },
  { id: 'mint',        name: 'Mint',         label: 'Fresh Light',       dark: false, canvas: '#F3FAF6', surface: '#FFFFFF', accent: '#047857', accentEnd: '#065F46', ink: '#0F2A1C' },
  { id: 'sand',        name: 'Sand',         label: 'Warm Beige',        dark: false, canvas: '#FBF7EE', surface: '#FFFFFF', accent: '#B45309', accentEnd: '#92400E', ink: '#292014' },
  { id: 'lavender',    name: 'Lavender',     label: 'Floral Light',      dark: false, canvas: '#F8F5FB', surface: '#FFFFFF', accent: '#7C3AED', accentEnd: '#6D28D9', ink: '#1F1430' },
]

const TIMEZONES = [
  { value: 'Asia/Manila',      label: 'Philippines (UTC+8)' },
  { value: 'Asia/Singapore',   label: 'Singapore (UTC+8)' },
  { value: 'Asia/Jakarta',     label: 'Indonesia — WIB (UTC+7)' },
  { value: 'Asia/Bangkok',     label: 'Thailand (UTC+7)' },
  { value: 'Asia/Kuala_Lumpur',label: 'Malaysia (UTC+8)' },
  { value: 'Asia/Hong_Kong',   label: 'Hong Kong (UTC+8)' },
  { value: 'Asia/Tokyo',       label: 'Japan (UTC+9)' },
  { value: 'America/New_York', label: 'US Eastern (UTC-5/-4)' },
  { value: 'America/Chicago',  label: 'US Central (UTC-6/-5)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (UTC-8/-7)' },
  { value: 'Europe/London',    label: 'UK (UTC+0/+1)' },
  { value: 'Europe/Paris',     label: 'Central Europe (UTC+1/+2)' },
  { value: 'Australia/Sydney', label: 'Australia — AEST (UTC+10/+11)' },
]

// ── SubscriptionCountdown ───────────────────────────────────────────────────
// Live-ticking countdown for the Subscription section. Trials show a
// days-only readout (no need for seconds). Paid plans get a per-second
// "Subscription ends in: 17d 04:23:09" ticker plus a progress bar.

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

function SubscriptionCountdown({
  expiresAt,
  isTrial,
}: {
  expiresAt: string
  isTrial: boolean
}) {
  const target = new Date(expiresAt).getTime()
  // ms since epoch — reactive. Trials tick once per minute (60s) which is
  // plenty. Paid plans tick every second for the live H:M:S display.
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const intervalMs = isTrial ? 60_000 : 1000
    const id = setInterval(() => setNowMs(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [isTrial])

  const diffMs = Math.max(0, target - nowMs)
  const totalSeconds = Math.floor(diffMs / 1000)
  const days    = Math.floor(totalSeconds / 86400)
  const hours   = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const expires = new Date(target)
  const expiryStr = expires.toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  const urgent = diffMs <= 3 * 86400 * 1000 // ≤3 days
  const totalWindow = isTrial ? 14 : 30
  const pctRemaining = Math.min(100, Math.max(0, (days / totalWindow) * 100))

  const barTone = urgent ? 'from-danger to-danger/70' : 'from-accent to-accent-2'
  const labelTone = urgent ? 'text-danger' : 'text-accent'

  return (
    <div className={`rounded-xl border p-4 space-y-2.5 ${urgent ? 'border-danger/40 bg-danger/5' : 'border-hair/60 bg-surface/40'}`}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-4">
            {isTrial ? 'Trial ends in' : 'Subscription ends in'}
          </p>
          {isTrial ? (
            <p className={`text-2xl font-bold tabular tracking-tight mt-1 ${labelTone}`}>
              {days === 0 ? `${hours}h ${minutes}m` : `${days} ${days === 1 ? 'day' : 'days'}`}
            </p>
          ) : (
            <p className={`text-2xl font-bold tabular tracking-tight mt-1 ${labelTone}`}>
              <span>{days}d</span>{' '}
              <span>{pad2(hours)}:{pad2(minutes)}:{pad2(seconds)}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-4">
            {isTrial ? 'Then converts' : 'Ends at'}
          </p>
          <p className="text-xs text-ink-3 mt-1 tabular">{expiryStr}</p>
        </div>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barTone} transition-all duration-700`}
          style={{ width: `${pctRemaining}%` }}
        />
      </div>
      {urgent && diffMs > 0 && (
        <p className="text-[11px] text-danger leading-snug">
          {isTrial
            ? 'Your trial ends soon. Subscribe below to keep your Pro features.'
            : 'Your subscription ends soon. Renew below to avoid losing access.'}
        </p>
      )}
      {diffMs === 0 && (
        <p className="text-[11px] text-danger leading-snug">
          Your subscription has ended. Renew below to restore access.
        </p>
      )}
    </div>
  )
}

// ── SaveRow ──────────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function SaveRow({ state, error }: { state: SaveState; error?: string }) {
  return (
    <div className="flex items-center justify-between pt-1">
      <span className="text-xs">
        {state === 'saved' && <span className="text-success">Saved</span>}
        {state === 'error' && <span className="text-danger">{error}</span>}
      </span>
      <button
        type="submit"
        disabled={state === 'saving'}
        className="px-4 py-2 btn-primary rounded-lg text-sm"
      >
        {state === 'saving' ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface ActivityEntry {
  id: string
  action: string
  tableName: string
  newData: Record<string, unknown> | null
  oldData: Record<string, unknown> | null
  createdAt: string
}

const ACTION_LABEL: Record<string, string> = {
  'expense.created': 'Logged expense',
  'expense.deleted': 'Deleted expense',
  'dish.created':    'Added dish',
  'dish.deleted':    'Deleted dish',
  'sale.created':    'Recorded sale',
}

function activitySummary(entry: ActivityEntry): string {
  const label = ACTION_LABEL[entry.action] ?? entry.action
  const d = entry.newData ?? entry.oldData
  if (!d) return label
  if (entry.tableName === 'expenses') {
    const vendor = d.vendor ? ` — ${d.vendor}` : ''
    const amount = typeof d.amount === 'number' ? ` ₱${(d.amount / 100).toFixed(0)}` : ''
    return `${label}${amount}${vendor}`
  }
  if (entry.tableName === 'dishes') {
    return `${label}: ${d.name ?? ''}`
  }
  return label
}

interface SubRequest {
  id: string
  fullName: string
  phone: string
  email: string
  billing: string
  receiptUrl: string | null
  status: string
  createdAt: string
}

interface SubscribedAccount {
  accountId: string
  fullName: string
  venueName: string
  email: string
  activatedAt: string
  planExpiresAt: string
}

function AdminSubRequestRow({ req }: { req: SubRequest }) {
  const [state, setState] = useState<'idle' | 'activating' | 'rejecting' | 'done' | 'error'>('idle')
  const statusColor = req.status === 'pending' ? 'text-amber-500' : req.status === 'activated' ? 'text-accent' : 'text-ink-4'

  return (
    <div className="rounded-lg border border-hair bg-surface/40 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-ink">{req.fullName}</p>
          <p className="text-xs text-ink-4">{req.email} · {req.phone}</p>
          <p className="text-xs text-ink-3">{req.billing === 'annual' ? 'Pro Annual — ₱4,000/yr' : 'Pro Monthly — ₱399/mo'}</p>
        </div>
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${statusColor}`}>{req.status}</span>
      </div>
      {req.receiptUrl && (
        <a href={req.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent underline">View receipt →</a>
      )}
      {state === 'error' && <p className="text-xs text-danger">Something went wrong. Try again.</p>}
      {req.status === 'pending' && state !== 'done' && (
        <div className="flex gap-2 pt-1">
          <button
            disabled={state !== 'idle'}
            onClick={async () => {
              setState('activating')
              try { await activateSubscriptionRequest(req.id, req.email); setState('done') }
              catch { setState('error') }
            }}
            className="flex-1 py-1.5 btn-primary rounded-lg text-xs font-semibold disabled:opacity-50"
          >
            {state === 'activating' ? 'Activating…' : 'Activate Pro'}
          </button>
          <button
            disabled={state !== 'idle'}
            onClick={async () => {
              setState('rejecting')
              try { await rejectSubscriptionRequest(req.id); setState('done') }
              catch { setState('error') }
            }}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-hair text-ink-4 hover:border-danger hover:text-danger transition-colors disabled:opacity-50"
          >
            {state === 'rejecting' ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      )}
      {state === 'done' && <p className="text-xs text-accent font-medium">Done — page will refresh shortly.</p>}
    </div>
  )
}

interface Props {
  initialTheme: string
  plan: 'free' | 'pro' | 'premium'
  planExpiresAt: string | null
  trialStartedAt: string | null
  venue: { name: string; timezone: string; monthlyRevenueGoal: number; monthlyExpenseBudget: number; vatRegistered: boolean; dailyRevenueTarget: number; foodCostTarget: number }
  profile: { fullName: string; email: string }
  recentActivity: ActivityEntry[]
  isAdmin?: boolean
  subscriptionRequests?: SubRequest[]
  subscribedAccounts?: SubscribedAccount[]
}

export default function SettingsClient({ initialTheme, plan, planExpiresAt, trialStartedAt, venue, profile, recentActivity, isAdmin, subscriptionRequests, subscribedAccounts }: Props) {
  const router = useRouter()
  const [active, setActive] = useState(initialTheme)
  const [isPending, startTransition] = useTransition()
  const [planLoading, setPlanLoading] = useState<'trial' | null>(null)
  const [contactForm, setContactForm] = useState<{ billing: 'monthly' | 'annual' } | null>(null)
  const [contactFields, setContactFields] = useState({ fullName: '', phone: '', email: '' })
  const [contactSent, setContactSent] = useState(false)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactSubmitError, setContactSubmitError] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptUploading, setReceiptUploading] = useState(false)
  const [receiptError, setReceiptError] = useState<string | null>(null)

  async function compressAndUpload(file: File) {
    setReceiptUploading(true)
    setReceiptError(null)
    setReceiptUrl(null)
    try {
      // Draw to canvas at max 1200px, export JPEG 0.75
      const bitmap = await createImageBitmap(file)
      const MAX = 1200
      const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height))
      const w = Math.round(bitmap.width * scale)
      const h = Math.round(bitmap.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.75))
      const compressed = new File([blob], 'receipt.jpg', { type: 'image/jpeg' })
      // Preview
      setReceiptPreview(URL.createObjectURL(blob))
      // Upload
      const fd = new FormData()
      fd.append('file', compressed)
      const res = await fetch('/api/upload-receipt', { method: 'POST', body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed')
      setReceiptUrl(data.url)
    } catch (err) {
      setReceiptError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setReceiptUploading(false)
    }
  }

  const now = new Date()
  const isExpired = planExpiresAt ? new Date(planExpiresAt) < now : false
  const rawPlan = isExpired ? 'free' : plan
  const effectivePlan: 'free' | 'pro' = rawPlan === 'free' ? 'free' : 'pro'
  const isOnTrial = trialStartedAt !== null && !!planExpiresAt && !isExpired && plan === 'pro'
  const trialDaysLeft = isOnTrial && planExpiresAt
    ? Math.max(0, Math.ceil((new Date(planExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  // Venue form
  const [venueName, setVenueName] = useState(venue.name)
  const [venueTimezone, setVenueTimezone] = useState(venue.timezone)
  const [revenueGoal, setRevenueGoal] = useState(venue.monthlyRevenueGoal > 0 ? String(venue.monthlyRevenueGoal / 100) : '')
  const [expenseBudget, setExpenseBudget] = useState(venue.monthlyExpenseBudget > 0 ? String(venue.monthlyExpenseBudget / 100) : '')
  const [dailyRevenueTargetStr, setDailyRevenueTargetStr] = useState(venue.dailyRevenueTarget > 0 ? String(venue.dailyRevenueTarget / 100) : '')
  const [foodCostTargetStr, setFoodCostTargetStr] = useState(String(venue.foodCostTarget ?? 35))
  const [vatRegistered, setVatRegistered] = useState(venue.vatRegistered)
  const [venueState, setVenueState] = useState<SaveState>('idle')
  const [venueError, setVenueError] = useState('')

  // Profile form
  const [fullName, setFullName] = useState(profile.fullName)
  const [profileState, setProfileState] = useState<SaveState>('idle')
  const [profileError, setProfileError] = useState('')

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Sync the active theme to the DOM and the persistence cookie whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', active)
    const secondsPerYear = 31_536_000
    document.cookie = `sizzle-theme=${active}; path=/; max-age=${secondsPerYear}; SameSite=Lax`
  }, [active])

  function applyTheme(id: string) {
    setActive(id)
  }

  async function handleVenueSave(e: React.FormEvent) {
    e.preventDefault()
    setVenueState('saving')
    setVenueError('')
    const result = await updateVenue({
      name: venueName,
      timezone: venueTimezone,
      monthlyRevenueGoal: Math.round((parseFloat(revenueGoal) || 0) * 100),
      monthlyExpenseBudget: Math.round((parseFloat(expenseBudget) || 0) * 100),
      dailyRevenueTarget: Math.round((parseFloat(dailyRevenueTargetStr) || 0) * 100),
      foodCostTarget: parseInt(foodCostTargetStr, 10) || 35,
      vatRegistered,
    })
    if (result?.error) {
      setVenueError(result.error)
      setVenueState('error')
    } else {
      setVenueState('saved')
      setTimeout(() => setVenueState('idle'), 2000)
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileState('saving')
    setProfileError('')
    await updateProfile({ fullName })
    setProfileState('saved')
    setTimeout(() => setProfileState('idle'), 2000)
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await deleteAccount()
      // Server redirect handles navigation; fall back just in case
      window.location.href = '/'
    } catch {
      setDeleteError('Something went wrong. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Venue ────────────────────────────────────────────────────── */}
      <section className="glass card-glow rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Business</h2>
          <p className="text-sm text-ink-4 mt-0.5">Your business name appears in the sidebar and digest emails.</p>
        </div>
        <form onSubmit={handleVenueSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Business name</label>
            <input
              type="text"
              required
              value={venueName}
              onChange={e => { setVenueName(e.target.value); setVenueState('idle') }}
              className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
              placeholder="e.g. The Coffee House"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Timezone</label>
            <select
              value={venueTimezone}
              onChange={e => { setVenueTimezone(e.target.value); setVenueState('idle') }}
              className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <p className="text-xs text-ink-4">Used for date calculations in reports and digest emails.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                Monthly Revenue Goal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 text-sm">₱</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={revenueGoal}
                  onChange={e => { setRevenueGoal(e.target.value); setVenueState('idle') }}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-ink-4">Shows a progress bar on dashboard.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                Monthly Expense Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 text-sm">₱</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={expenseBudget}
                  onChange={e => { setExpenseBudget(e.target.value); setVenueState('idle') }}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-ink-4">Alerts when expenses exceed this amount.</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
              Daily Revenue Target
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 text-sm">₱</span>
              <input
                type="number"
                min="0"
                step="1"
                value={dailyRevenueTargetStr}
                onChange={e => { setDailyRevenueTargetStr(e.target.value); setVenueState('idle') }}
                className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-ink-4">Leave at 0 to auto-calculate from monthly goal ÷ 26 days.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
              Food Cost Target
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={foodCostTargetStr}
                onChange={e => { setFoodCostTargetStr(e.target.value); setVenueState('idle') }}
                className="w-full pr-8 pl-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                placeholder="35"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 text-sm">%</span>
            </div>
            <p className="text-xs text-ink-4">Dashboard warns when food cost exceeds this %. Anything 5% above triggers a danger alert.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-ink-3 uppercase tracking-wider">VAT</p>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={vatRegistered}
                onClick={() => { setVatRegistered(v => !v); setVenueState('idle') }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  vatRegistered ? 'bg-accent' : 'bg-surface-3'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
                  vatRegistered ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
              <div>
                <p className="text-sm font-medium text-ink">VAT Registered (12%)</p>
                <p className="text-xs text-ink-4">Shows VAT breakdown on POS receipts.</p>
              </div>
            </label>
          </div>
          <SaveRow state={venueState} error={venueError} />
        </form>
      </section>

      {/* ── Account ──────────────────────────────────────────────────── */}
      <section className="glass card-glow rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Account</h2>
          <p className="text-sm text-ink-4 mt-0.5">Your personal profile details.</p>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Display name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => { setFullName(e.target.value); setProfileState('idle') }}
              className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-hair text-ink-3 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-ink-4">Email is managed by your authentication provider.</p>
          </div>
          <SaveRow state={profileState} error={profileError} />
        </form>
      </section>

      {/* ── Subscription ─────────────────────────────────────────────── */}
      <section id="plan" className="glass card-glow rounded-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Subscription</h2>
            <p className="text-sm text-ink-4 mt-0.5">
              {effectivePlan === 'pro'
                ? isOnTrial
                  ? `Pro trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining.`
                  : 'You\'re on Sizzle Pro — all features unlocked.'
                : 'You\'re on the Basic plan.'}
            </p>
          </div>
          <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            effectivePlan === 'pro' ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-ink-3'
          }`}>
            {effectivePlan === 'pro' ? '⚡ Pro' : 'Basic'}
          </span>
        </div>

        {/* ── Countdown card — visible when on a paid plan with an expiry ── */}
        {effectivePlan !== 'free' && planExpiresAt && (
          <SubscriptionCountdown
            expiresAt={planExpiresAt}
            isTrial={isOnTrial}
          />
        )}

        <div className="space-y-3">

          {/* Basic */}
          <div className={`rounded-xl border p-4 space-y-2.5 ${effectivePlan === 'free' ? 'border-hair/60 bg-surface/60' : 'border-hair/40 bg-surface/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink text-sm">Basic</p>
                {effectivePlan === 'free' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-3 text-ink-3 font-semibold">Current</span>}
              </div>
              <p className="text-sm font-semibold text-ink">Free forever</p>
            </div>
            <ul className="text-xs text-ink-4 space-y-1">
              <li>✓ Sales tracking & expense logging</li>
              <li>✓ Menu with recipe costing (up to 20 dishes, 15 ingredients)</li>
              <li>✓ Inventory management & 6-month reports</li>
              <li className="text-ink-4/60">✗ Employees, payroll, waste log</li>
              <li className="text-ink-4/60">✗ CSV exports</li>
            </ul>
            {effectivePlan !== 'free' && (
              <button
                disabled={isPending}
                onClick={() => startTransition(() => downgradeTofree())}
                className="text-xs text-ink-4 hover:text-danger transition-colors disabled:opacity-60"
              >
                {isPending ? 'Updating…' : 'Downgrade to Basic'}
              </button>
            )}
          </div>

          {/* Pro */}
          <div className={`rounded-xl border p-4 space-y-2.5 ${effectivePlan === 'pro' ? 'border-accent/40 bg-accent/5' : 'border-hair/40 bg-surface/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink text-sm">Pro</p>
                {effectivePlan === 'pro' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">Current</span>}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-accent">₱399 / month</p>
                <p className="text-[10px] text-ink-4">or ₱4,000 / year</p>
              </div>
            </div>
            <ul className="text-xs text-ink-4 space-y-1">
              <li>✓ Everything in Basic</li>
              <li>✓ Unlimited dishes & ingredients</li>
              <li>✓ Employees, payroll & waste log</li>
              <li>✓ Advanced analytics & forecasting</li>
              <li>✓ Daily digest email & CSV exports</li>
            </ul>
            {effectivePlan !== 'pro' && (
              <div className="space-y-2">
                {!trialStartedAt && effectivePlan === 'free' && (
                  <button
                    disabled={!!planLoading}
                    onClick={async () => {
                      setPlanLoading('trial')
                      await startTrial()
                      router.refresh()
                      setPlanLoading(null)
                    }}
                    className="w-full py-2 rounded-lg text-sm font-semibold btn-primary disabled:opacity-60"
                  >
                    {planLoading === 'trial' ? 'Activating…' : 'Start 7-day free trial →'}
                  </button>
                )}
                <button
                  onClick={() => { setContactForm({ billing: 'monthly' }); setContactSent(false); setContactFields({ fullName: profile.fullName || '', phone: '', email: profile.email || '' }); setReceiptFile(null); setReceiptPreview(null); setReceiptUrl(null); setReceiptError(null); setContactSubmitting(false); setContactSubmitError(null) }}
                  className="w-full py-2 rounded-lg text-sm font-semibold btn-primary"
                >
                  Subscribe monthly — ₱399/mo →
                </button>
                <button
                  onClick={() => { setContactForm({ billing: 'annual' }); setContactSent(false); setContactFields({ fullName: profile.fullName || '', phone: '', email: profile.email || '' }); setReceiptFile(null); setReceiptPreview(null); setReceiptUrl(null); setReceiptError(null); setContactSubmitting(false); setContactSubmitError(null) }}
                  className="w-full py-2 rounded-lg text-sm font-semibold border border-accent/40 text-accent hover:bg-accent/10 transition-colors"
                >
                  Subscribe annually — ₱4,000/yr (save ₱788) →
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── Admin: Subscribed Accounts ───────────────────────────────── */}
      {isAdmin && subscribedAccounts && (
        <section className="glass card-glow rounded-xl p-6 space-y-4 border border-accent/20">
          <div>
            <h2 className="text-base font-semibold text-ink">Subscribed Accounts</h2>
            <p className="text-sm text-ink-4 mt-0.5">
              Admin only — all active Pro subscribers ({subscribedAccounts.length}).
            </p>
          </div>
          {subscribedAccounts.length === 0 ? (
            <p className="text-sm text-ink-4 text-center py-4">No active subscribers yet.</p>
          ) : (
            <div className="space-y-3">
              {subscribedAccounts.map(acct => {
                const now = Date.now()
                const expiresMs = new Date(acct.planExpiresAt).getTime()
                const activatedMs = new Date(acct.activatedAt).getTime()
                const totalMs = expiresMs - activatedMs
                const remainingMs = Math.max(0, expiresMs - now)
                const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24))
                const pct = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100))
                const urgent = daysLeft <= 5
                const activatedStr = new Date(acct.activatedAt).toLocaleString('en-PH', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })
                const expiresStr = new Date(acct.planExpiresAt).toLocaleString('en-PH', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })
                return (
                  <div key={acct.accountId} className="rounded-lg border border-hair bg-surface/40 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-ink">
                          {acct.venueName || acct.fullName || 'Unnamed'}
                        </p>
                        <p className="text-xs text-ink-4">{acct.email}</p>
                        {acct.fullName && acct.venueName && (
                          <p className="text-xs text-ink-3">{acct.fullName}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        urgent ? 'bg-danger/15 text-danger' : 'bg-accent/15 text-accent'
                      }`}>
                        {daysLeft === 0 ? 'Expired' : `${daysLeft}d left`}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${urgent ? 'bg-danger' : 'bg-accent'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-ink-4 tabular">
                        <span>Activated {activatedStr}</span>
                        <span>Expires {expiresStr}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Admin: Subscription Requests ─────────────────────────────── */}
      {isAdmin && subscriptionRequests && (
        <section className="glass card-glow rounded-xl p-6 space-y-4 border border-accent/20">
          <div>
            <h2 className="text-base font-semibold text-ink">Subscription Requests</h2>
            <p className="text-sm text-ink-4 mt-0.5">Admin only — activate or reject pending upgrade requests.</p>
          </div>
          {subscriptionRequests.length === 0 ? (
            <p className="text-sm text-ink-4 text-center py-4">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {subscriptionRequests.map(req => (
                <AdminSubRequestRow key={req.id} req={req} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Contact form modal ───────────────────────────────────────── */}
      {contactForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl w-full max-w-md p-8 space-y-6 shadow-2xl border border-hair">
            {!contactSent ? (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-ink">
                    {contactForm.billing === 'annual' ? 'Pro Annual — ₱4,000/yr' : 'Pro Monthly — ₱399/mo'}
                  </h2>
                  <p className="text-sm text-ink-4">Pay via any of the options below, then fill out the form with your receipt.</p>
                </div>

                {/* Payment QR codes */}
                <div className="flex gap-2">
                  {[
                    { name: 'GCash', src: '/payment-qrs/gcash.jpg' },
                    { name: 'GoTyme', src: '/payment-qrs/gotyme.jpg' },
                    { name: 'BPI', src: '/payment-qrs/bpi.jpg' },
                  ].map(({ name, src }) => (
                    <div key={name} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-white rounded-lg border border-hair overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`${name} QR code`}
                          className="w-full h-52 object-contain"
                        />
                      </div>
                      <span className="text-xs font-semibold text-ink-3">{name}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink-3">Full Name</label>
                    <input
                      type="text"
                      value={contactFields.fullName}
                      onChange={e => setContactFields(f => ({ ...f, fullName: e.target.value }))}
                      placeholder="Juan dela Cruz"
                      className="input-field w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink-3">Contact Number</label>
                    <input
                      type="tel"
                      value={contactFields.phone}
                      onChange={e => setContactFields(f => ({ ...f, phone: e.target.value }))}
                      placeholder="09XX XXX XXXX"
                      className="input-field w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink-3">Email Address</label>
                    <input
                      type="email"
                      value={contactFields.email}
                      readOnly
                      className="input-field w-full opacity-60 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-ink-4">This is your account email — used to activate your plan.</p>
                  </div>
                  {/* Receipt upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-3">Payment Receipt <span className="text-ink-4 font-normal">(GCash, GoTyme, BPI)</span></label>
                    <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-dashed border-hair hover:border-accent/50 p-3 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (f) { setReceiptFile(f); compressAndUpload(f) }
                        }}
                      />
                      {receiptPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={receiptPreview} alt="Receipt preview" className="h-14 w-14 object-cover rounded-md shrink-0" />
                      ) : (
                        <span className="text-xl">📎</span>
                      )}
                      <div className="min-w-0">
                        {receiptUploading && <p className="text-xs text-ink-4">Compressing & uploading…</p>}
                        {receiptUrl && !receiptUploading && <p className="text-xs text-accent">Receipt uploaded ✓</p>}
                        {receiptError && <p className="text-xs text-danger">{receiptError}</p>}
                        {!receiptFile && !receiptUploading && <p className="text-xs text-ink-4">Tap to attach screenshot</p>}
                        {receiptFile && !receiptUploading && !receiptUrl && !receiptError && (
                          <p className="text-xs text-ink-4 truncate">{receiptFile.name}</p>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  {contactSubmitError && (
                    <p className="text-xs text-danger text-center">{contactSubmitError}</p>
                  )}
                  <button
                    disabled={!contactFields.fullName || !contactFields.phone || !contactFields.email || receiptUploading || contactSubmitting}
                    onClick={async () => {
                      setContactSubmitting(true)
                      setContactSubmitError(null)
                      try {
                        const res = await fetch('/api/subscription-request', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            fullName: contactFields.fullName,
                            phone: contactFields.phone,
                            email: contactFields.email,
                            billing: contactForm.billing,
                            receiptUrl: receiptUrl ?? undefined,
                          }),
                        })
                        if (!res.ok) throw new Error('Could not send request. Please try again.')
                        setContactSent(true)
                      } catch (err) {
                        setContactSubmitError(err instanceof Error ? err.message : 'Could not send request. Please try again.')
                      } finally {
                        setContactSubmitting(false)
                      }
                    }}
                    className="w-full py-2.5 btn-primary rounded-lg text-sm font-semibold disabled:opacity-40"
                  >
                    {contactSubmitting ? 'Sending…' : 'Send request →'}
                  </button>
                  <button
                    onClick={() => setContactForm(null)}
                    className="w-full text-xs text-ink-4 hover:text-ink transition-colors py-1"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                <p className="text-4xl">🎉</p>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-ink">Request sent!</h2>
                  <p className="text-sm text-ink-4">We'll activate your Pro account within 24 hours after confirming your details.</p>
                </div>
                <button
                  onClick={() => setContactForm(null)}
                  className="px-6 py-2 rounded-lg text-sm font-medium border border-hair text-ink-3 hover:border-accent hover:text-accent transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Appearance ───────────────────────────────────────────────── */}
      <section className="glass card-glow rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Appearance</h2>
          <p className="text-sm text-ink-4 mt-0.5">Choose a color theme for your dashboard.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {THEMES.map(t => {
            const isActive = active === t.id
            return (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                className="group text-left rounded-xl overflow-hidden border-2 transition-all duration-150 focus:outline-none"
                style={{
                  borderColor: isActive ? t.accent : 'transparent',
                  boxShadow: isActive ? `0 0 0 1px ${t.accent}40, 0 4px 16px ${t.accent}30` : undefined,
                }}
              >
                <div className="h-16 w-full relative" style={{ background: t.canvas }}>
                  <div className="absolute left-0 top-0 h-full w-5"
                    style={{ background: t.dark ? `color-mix(in srgb, ${t.canvas} 85%, ${t.surface})` : t.surface }} />
                  <div className="absolute top-2 left-7 right-2 h-2 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${t.accent} 0%, ${t.accentEnd} 100%)` }} />
                  <div className="absolute bottom-2 left-7 right-2 h-3 rounded"
                    style={{ background: t.surface, opacity: 0.9 }} />
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: t.accent, color: t.dark ? '#000' : '#fff' }}>
                      ✓
                    </div>
                  )}
                </div>
                <div className="px-2.5 py-1.5 border-t"
                  style={{
                    background: t.dark ? `color-mix(in srgb, ${t.canvas} 90%, ${t.surface})` : t.surface,
                    borderColor: isActive ? `${t.accent}40` : `${t.ink}15`,
                  }}>
                  <p className="text-xs font-medium truncate" style={{ color: isActive ? t.accent : t.ink, opacity: isActive ? 1 : 0.8 }}>
                    {t.name}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: t.ink, opacity: 0.4 }}>
                    {t.label}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Activity Feed ────────────────────────────────────────── */}
      <section className="glass card-glow rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Recent Activity</h2>
          <p className="text-sm text-ink-4 mt-0.5">Last 20 actions logged in your account.</p>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-ink-4 py-4 text-center">No activity recorded yet.</p>
        ) : (
          <div className="space-y-1">
            {recentActivity.map(entry => {
              const ts = new Date(entry.createdAt)
              const timeStr = ts.toLocaleString('en-PH', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
              })
              const isDelete = entry.action.includes('.deleted')
              return (
                <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-hair last:border-0">
                  <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${isDelete ? 'bg-danger' : 'bg-accent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">{activitySummary(entry)}</p>
                  </div>
                  <span className="text-[11px] tabular text-ink-4 shrink-0 whitespace-nowrap">{timeStr}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Install App ──────────────────────────────────────────────── */}
      <section className="glass card-glow rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Install App</h2>
          <p className="text-sm text-ink-4 mt-0.5">Add Sizzle to your home screen for fast access — no app store needed.</p>
        </div>
        <InstallButton />
      </section>

      {/* ── Danger Zone ──────────────────────────────────────────────── */}
      <section className="border border-red-500/30 bg-red-500/5 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-red-500">Danger Zone</h2>
          <p className="text-sm text-ink-4 mt-0.5">Permanent actions that cannot be undone.</p>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">Delete Account</p>
            <p className="text-xs text-ink-4 mt-0.5">
              Permanently deletes your account, venue, all data, and cancels access. This cannot be recovered.
            </p>
          </div>
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError('') }}
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-red-500 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* ── Delete Account Modal ──────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!isDeleting) setShowDeleteModal(false) }}
          />
          <div className="relative z-10 w-full max-w-md bg-surface border border-hair rounded-2xl p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-base font-semibold text-red-500">Delete Account</h3>
              <p className="text-sm text-ink-4 mt-1">
                This will permanently delete your account and all associated data — venue settings, sales, expenses, dishes, ingredients, employees, and payroll records. This action is irreversible.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                Type <span className="font-bold text-red-500">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                disabled={isDeleting}
                placeholder="DELETE"
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-red-500/30 text-ink text-sm focus:outline-none focus:border-red-500/60 placeholder:text-ink-4/40 disabled:opacity-50"
                autoFocus
              />
            </div>
            {deleteError && (
              <p className="text-xs text-red-500">{deleteError}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-hair text-ink-3 hover:text-ink hover:border-hair/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting…' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
