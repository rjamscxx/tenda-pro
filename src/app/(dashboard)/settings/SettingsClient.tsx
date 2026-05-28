'use client'

import { useState, useTransition } from 'react'
import { updateVenue, updateProfile, downgradeTofree, deleteAccount } from './actions'
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

interface Props {
  initialTheme: string
  plan: 'free' | 'pro' | 'premium'
  planExpiresAt: string | null
  trialStartedAt: string | null
  venue: { name: string; timezone: string; monthlyRevenueGoal: number; monthlyExpenseBudget: number; vatRegistered: boolean; dailyRevenueTarget: number; foodCostTarget: number }
  profile: { fullName: string; email: string }
  recentActivity: ActivityEntry[]
}

export default function SettingsClient({ initialTheme, plan, planExpiresAt, trialStartedAt, venue, profile, recentActivity }: Props) {
  const [active, setActive] = useState(initialTheme)
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const isExpired = planExpiresAt ? new Date(planExpiresAt) < now : false
  const effectivePlan: 'free' | 'pro' | 'premium' = isExpired ? 'free' : plan
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

  function applyTheme(id: string) {
    setActive(id)
    document.documentElement.setAttribute('data-theme', id)
    const secondsPerYear = 31_536_000
    document.cookie = `sizzle-theme=${id}; path=/; max-age=${secondsPerYear}; SameSite=Lax`
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
              {effectivePlan === 'premium'
                ? 'You\'re on Sizzle Premium — all features unlocked.'
                : effectivePlan === 'pro'
                  ? isOnTrial
                    ? `Pro trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining.`
                    : 'You\'re on Sizzle Pro — all Pro features unlocked.'
                  : 'You\'re on the Basic plan.'}
            </p>
          </div>
          <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            effectivePlan === 'premium' ? 'bg-warn/15 text-warn' :
            effectivePlan === 'pro' ? 'bg-accent/15 text-accent' :
            'bg-surface-3 text-ink-3'
          }`}>
            {effectivePlan === 'premium' ? '★ Premium' : effectivePlan === 'pro' ? '⚡ Pro' : 'Basic'}
          </span>
        </div>

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
              <p className="text-sm font-semibold text-accent">₱399 / month</p>
            </div>
            <ul className="text-xs text-ink-4 space-y-1">
              <li>✓ Everything in Basic</li>
              <li>✓ Unlimited dishes & ingredients</li>
              <li>✓ Employees & payroll management</li>
              <li>✓ Waste log tracking</li>
              <li>✓ CSV exports & priority support</li>
            </ul>
            {effectivePlan !== 'pro' && (
              <button
                disabled={isPending}
                onClick={async () => {
                  startTransition(async () => {})
                  const res = await fetch('/api/paymongo/checkout?plan=pro', { method: 'POST' })
                  const json = await res.json() as { url?: string; error?: string }
                  if (json.url) window.location.href = json.url
                }}
                className={`w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-60 ${
                  effectivePlan === 'free'
                    ? 'btn-primary'
                    : 'border border-hair text-ink-3 hover:border-accent hover:text-accent transition-colors'
                }`}
              >
                {effectivePlan === 'free' ? 'Upgrade to Pro — ₱399/mo →' : 'Switch to Pro — ₱399/mo'}
              </button>
            )}
          </div>

          {/* Premium */}
          <div className={`rounded-xl border p-4 space-y-2.5 ${effectivePlan === 'premium' ? 'border-warn/40 bg-warn/5' : 'border-hair/40 bg-surface/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink text-sm">Premium</p>
                {effectivePlan === 'premium' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warn/20 text-warn font-semibold">Current</span>}
              </div>
              <p className="text-sm font-semibold text-warn">₱1,999 / month</p>
            </div>
            <ul className="text-xs text-ink-4 space-y-1">
              <li>✓ Everything in Pro</li>
              <li>✓ Multiple businesses</li>
              <li>✓ AI-powered insights & advanced analytics</li>
              <li>✓ Dedicated support & first access to new features</li>
            </ul>
            {effectivePlan !== 'premium' && (
              <button
                disabled={isPending}
                onClick={async () => {
                  startTransition(async () => {})
                  const res = await fetch('/api/paymongo/checkout?plan=premium', { method: 'POST' })
                  const json = await res.json() as { url?: string; error?: string }
                  if (json.url) window.location.href = json.url
                }}
                className="w-full py-2 rounded-lg text-sm font-semibold bg-warn/15 text-warn border border-warn/30 hover:bg-warn/25 transition-colors disabled:opacity-60"
              >
                Upgrade to Premium — ₱1,999/mo →
              </button>
            )}
          </div>

        </div>

        {(effectivePlan === 'pro' || effectivePlan === 'premium') && (
          <p className="text-xs text-ink-4 text-center">
            Pay via GCash, Maya, card, or bank transfer. Cancel anytime.
          </p>
        )}
      </section>

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
