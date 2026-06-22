'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/utils'
import { saveShift, deleteShift, clearAllShifts } from './actions'
import {
  SHIFT_TYPES, SHIFT_STATUS, DAY_NAMES,
  type ShiftTypeKey, type ShiftStatusKey,
  hourlyRateCents, computeGrossPayCents, hoursBetween,
  colorForName, initials, nickname,
} from './lib'

// ── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  id: string
  fullName: string
  role: string
  payType: 'daily' | 'monthly' | 'hourly'
  payRate: number
  contactNumber: string | null
  isActive: boolean
}
interface Shift {
  id: string
  employeeId: string
  date: string                                  // 'YYYY-MM-DD'
  type: ShiftTypeKey
  status: ShiftStatusKey
  timeIn: string | null
  timeOut: string | null
  hours: number
  otHours: number
  lateHours: number
  grossPay: number
  note: string | null
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}
function isoFromDate(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}
function getWeekDates(offset: number): Date[] {
  // Week starts Monday, Manila-local.
  const now = new Date()
  const day = now.getDay()                                          // 0..6 (Sun..Sat)
  const mondayMs = now.getTime() - ((day === 0 ? 6 : day - 1) * 86_400_000) + (offset * 7 * 86_400_000)
  return Array.from({ length: 7 }, (_, i) => new Date(mondayMs + i * 86_400_000))
}
function fmtMonDay(d: Date) {
  return d.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' })
}

// ── Date-range filter for the log table ──────────────────────────────────────
type Period = 'all' | 'week' | 'last-week' | 'month' | 'last-month' | 'last-30' | 'custom'
function rangeForPeriod(p: Period): { from: string | null; to: string | null } {
  if (p === 'all') return { from: null, to: null }
  const today = new Date(); today.setHours(0,0,0,0)
  const day = today.getDay()
  let from = new Date(today), to = new Date(today)
  if (p === 'week') {
    from.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
    to.setDate(from.getDate() + 6)
  } else if (p === 'last-week') {
    from.setDate(today.getDate() - (day === 0 ? 13 : day + 6))
    to.setDate(from.getDate() + 6)
  } else if (p === 'month') {
    from = new Date(today.getFullYear(), today.getMonth(), 1)
    to   = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  } else if (p === 'last-month') {
    from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    to   = new Date(today.getFullYear(), today.getMonth(), 0)
  } else if (p === 'last-30') {
    from.setDate(today.getDate() - 29)
  }
  return { from: isoFromDate(from), to: isoFromDate(to) }
}

interface PayrollRunRef {
  id: string
  periodStart: string
  periodEnd: string
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ShiftsClient({
  employees, shifts, payrollRuns, isOwner,
}: {
  employees:   Employee[]
  shifts:      Shift[]
  payrollRuns: PayrollRunRef[]
  isOwner:     boolean
}) {
  const toast = useToast()
  const [, startTransition] = useTransition()

  const [weekOffset, setWeekOffset] = useState(0)
  const [logOpen, setLogOpen]   = useState(false)
  const [logSeed, setLogSeed]   = useState<{ employeeId?: string; date?: string; existing?: Shift } | null>(null)
  const [period, setPeriod]     = useState<Period>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo]     = useState('')

  // ─── derived data ──────────────────────────────────────────────────────────
  const activeEmployees = employees.filter(e => e.isActive)
  const today = todayISO()
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  // Look-ups
  const shiftByEmpDate = useMemo(() => {
    const m = new Map<string, Shift>()
    for (const s of shifts) m.set(`${s.employeeId}|${s.date}`, s)
    return m
  }, [shifts])
  const empById = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees])

  // Is a shift date covered by any saved payroll run?
  function isShiftPaid(date: string): PayrollRunRef | null {
    for (const r of payrollRuns) if (date >= r.periodStart && date <= r.periodEnd) return r
    return null
  }

  // KPI: stats across all logged shifts (matches grayscale's behavior)
  const stats = useMemo(() => {
    const billable    = shifts.filter(s => s.status === 'present' || s.status === 'late')
    const hoursLogged = billable.reduce((t, s) => t + s.hours + s.otHours - s.lateHours, 0)
    const payOut      = shifts.reduce((t, s) => t + s.grossPay, 0)
    const presentToday = shifts.filter(s => s.date === today && s.status === 'present').length
    return {
      staff:        activeEmployees.length,
      hoursLogged:  Math.round(hoursLogged * 10) / 10,
      payOut,
      presentToday,
    }
  }, [shifts, activeEmployees.length, today])

  // ─── handlers ──────────────────────────────────────────────────────────────
  function openAdd(seed?: { employeeId?: string; date?: string }) {
    setLogSeed(seed ?? null)
    setLogOpen(true)
  }
  function openEdit(s: Shift) {
    setLogSeed({ employeeId: s.employeeId, date: s.date, existing: s })
    setLogOpen(true)
  }
  function handleDelete(s: Shift) {
    if (!confirm(`Remove ${empById.get(s.employeeId)?.fullName ?? 'this'} shift on ${s.date}?`)) return
    startTransition(async () => {
      const r = await deleteShift(s.id)
      if (r?.ok) toast('Shift removed', 'info')
    })
  }
  function handleClearAll() {
    if (!confirm(`Delete ALL ${shifts.length} shift entries for this venue? This cannot be undone.`)) return
    startTransition(async () => {
      const r = await clearAllShifts()
      if (r?.ok) toast('Log cleared', 'info')
    })
  }

  // ─── log table filtering ───────────────────────────────────────────────────
  const filteredLog = useMemo(() => {
    let from: string | null, to: string | null
    if (period === 'custom') { from = customFrom || null; to = customTo || null }
    else                     { ({ from, to } = rangeForPeriod(period)) }
    if (!from || !to) return [...shifts].sort((a, b) => b.date.localeCompare(a.date))
    return shifts
      .filter(s => s.date >= from! && s.date <= to!)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [shifts, period, customFrom, customTo])

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto w-full space-y-5">

        {/* Header */}
        <div className="card-enter card-d0 glass rounded-xl px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 text-accent">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M5 10h2M9 10h2M5 12.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink tracking-tight">Shifts</h1>
              <p className="text-sm text-ink-4 mt-0.5">
                {fmtMonDay(weekDates[0])} – {fmtMonDay(weekDates[6])}, {weekDates[0].getFullYear()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border border-hair bg-surface-2 overflow-hidden">
              <button onClick={() => setWeekOffset(o => o - 1)} className="px-3 py-1.5 text-xs text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors active:scale-[0.97]">‹ Prev</button>
              <button onClick={() => setWeekOffset(0)} className={`px-3 py-1.5 text-xs font-medium border-l border-hair transition-colors active:scale-[0.97] ${weekOffset === 0 ? 'bg-accent text-canvas' : 'text-ink-3 hover:text-ink hover:bg-surface-3'}`}>This week</button>
              <button onClick={() => setWeekOffset(o => o + 1)} className="px-3 py-1.5 text-xs text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors active:scale-[0.97] border-l border-hair">Next ›</button>
            </div>
            <button onClick={() => openAdd()} className="px-4 py-2 rounded-lg btn-primary text-xs font-semibold">
              + Log shift
            </button>
          </div>
        </div>

        {/* KPI row */}
        <section className="card-enter card-d1 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Active staff"   value={String(stats.staff)} tone="accent" />
          <KpiCard label="Hours logged"   value={`${stats.hoursLogged}h`} tone="ink" />
          <KpiCard label="Total pay out"  value={formatCurrency(stats.payOut)} tone="danger" />
          <KpiCard label="Present today"  value={String(stats.presentToday)} tone="success" />
        </section>

        {/* Weekly calendar */}
        <section className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ minWidth: 720 }}>

              {/* Header row */}
              <div className="grid border-b border-hair" style={{ gridTemplateColumns: '160px repeat(7, 1fr)' }}>
                <div className="px-4 py-3 text-[10px] font-semibold text-ink-4 uppercase tracking-widest">Staff</div>
                {weekDates.map(d => {
                  const iso = isoFromDate(d)
                  const isToday = iso === today
                  return (
                    <div key={iso} className={`px-2 py-3 text-center border-l border-hair ${isToday ? 'bg-accent/10' : ''}`}>
                      <p className="text-[10px] uppercase tracking-widest text-ink-4">{DAY_NAMES[d.getDay()]}</p>
                      <p className={`text-sm font-bold tabular mt-0.5 ${isToday ? 'text-accent' : 'text-ink'}`}>{d.getDate()}</p>
                    </div>
                  )
                })}
              </div>

              {/* Employee rows */}
              {activeEmployees.length === 0 ? (
                <div className="p-10 text-center text-sm text-ink-4">
                  No active employees yet. Add staff under <a href="/employees" className="text-accent hover:underline">Employees</a> first.
                </div>
              ) : activeEmployees.map(emp => {
                const color = colorForName(emp.fullName)
                return (
                  <div key={emp.id} className="grid border-b border-hair last:border-b-0 hover:bg-surface-2/30 transition-colors" style={{ gridTemplateColumns: '160px repeat(7, 1fr)' }}>
                    <div className="px-4 py-3 flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                        style={{ background: color + '22', color }}
                      >{initials(emp.fullName)}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{nickname(emp.fullName)}</p>
                        <p className="text-[10px] text-ink-4 truncate">{emp.role}</p>
                      </div>
                    </div>
                    {weekDates.map(d => {
                      const iso = isoFromDate(d)
                      const isToday = iso === today
                      const s = shiftByEmpDate.get(`${emp.id}|${iso}`)
                      return (
                        <div key={iso} className={`px-1.5 py-2 border-l border-hair flex items-center justify-center min-h-[64px] ${isToday ? 'bg-accent/5' : ''}`}>
                          {s ? <ShiftCell shift={s} paid={!!isShiftPaid(s.date)} onClick={() => openEdit(s)} /> : (
                            <button
                              onClick={() => openAdd({ employeeId: emp.id, date: iso })}
                              className="w-7 h-7 rounded-full border border-dashed border-hair text-ink-4 text-lg hover:border-accent hover:text-accent transition-colors active:scale-[0.9] flex items-center justify-center"
                              aria-label={`Log shift for ${emp.fullName} on ${iso}`}
                            >+</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Two-column: roster + shift log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <section className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Roster</h2>
              <span className="text-xs text-ink-4">{activeEmployees.length} active</span>
            </div>
            {employees.length === 0 ? (
              <p className="text-sm text-ink-4 text-center py-6">No employees yet.</p>
            ) : (
              <ul className="divide-y divide-hair">
                {employees.map(e => {
                  const color = colorForName(e.fullName)
                  const hourly = hourlyRateCents(e.payType, e.payRate)
                  return (
                    <li key={e.id} className={`py-2.5 flex items-center gap-3 ${!e.isActive ? 'opacity-50' : ''}`}>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ background: color + '22', color }}
                      >{initials(e.fullName)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{e.fullName}</p>
                        <p className="text-[11px] text-ink-4 truncate">{e.role} · {formatCurrency(hourly)}/hr est</p>
                      </div>
                      <p className="text-[11px] text-ink-4 text-right shrink-0">{e.contactNumber || ''}</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Shift log</h2>
              {isOwner && shifts.length > 0 && (
                <button onClick={handleClearAll} className="text-[11px] text-ink-4 hover:text-danger transition-colors active:scale-[0.95]">Clear log</button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="px-2 py-1 rounded-md bg-canvas border border-hair text-xs text-ink h-8">
                <option value="all">All time</option>
                <option value="week">This week</option>
                <option value="last-week">Last week</option>
                <option value="month">This month</option>
                <option value="last-month">Last month</option>
                <option value="last-30">Last 30 days</option>
                <option value="custom">Custom</option>
              </select>
              {period === 'custom' && (<>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-2 py-1 rounded-md bg-canvas border border-hair text-xs text-ink h-8" />
                <span className="text-ink-4 text-xs">–</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-2 py-1 rounded-md bg-canvas border border-hair text-xs text-ink h-8" />
              </>)}
            </div>

            {filteredLog.length === 0 ? (
              <EmptyState compact icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><polyline points="12 7 12 12 15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} title="No shifts logged" body="Tap + on the calendar grid above or click 'Log shift'." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-ink-4 border-b border-hair">
                      <th className="py-2 pr-2">Staff</th>
                      <th className="py-2 pr-2">Date</th>
                      <th className="py-2 pr-2">Shift</th>
                      <th className="py-2 pr-2 text-right">Hrs</th>
                      <th className="py-2 pr-2 text-right">Pay</th>
                      <th className="py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hair">
                    {filteredLog.slice(0, 40).map(s => {
                      const emp = empById.get(s.employeeId)
                      const st  = SHIFT_STATUS[s.status]
                      const paid = !!isShiftPaid(s.date)
                      return (
                        <tr key={s.id} className="hover:bg-surface-2/30 transition-colors">
                          <td className="py-2 pr-2 text-ink truncate">
                            <span className="inline-flex items-center gap-1.5">
                              {emp ? nickname(emp.fullName) : '—'}
                              {paid && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-accent bg-accent/15 border border-accent/30 px-1 rounded" title="In a payroll run">paid</span>
                              )}
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-ink-3 tabular">{s.date.slice(5)}</td>
                          <td className="py-2 pr-2">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${toneClasses(st.tone)}`}>{SHIFT_TYPES[s.type].label}</span>
                          </td>
                          <td className="py-2 pr-2 text-right tabular text-ink-3">{s.hours + s.otHours - s.lateHours}h</td>
                          <td className="py-2 pr-2 text-right tabular text-ink">{formatCurrency(s.grossPay)}</td>
                          <td className="py-2 text-right">
                            <button onClick={() => handleDelete(s)} className="text-ink-4 hover:text-danger text-xs" aria-label="Delete">×</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <LogShiftModal
        open={logOpen}
        onClose={() => { setLogOpen(false); setLogSeed(null) }}
        employees={activeEmployees}
        seed={logSeed}
        onSaved={() => { setLogOpen(false); setLogSeed(null); toast('Shift saved') }}
      />
    </div>
  )
}

// ── Tiny presentational sub-components ───────────────────────────────────────
function KpiCard({ label, value, tone }: { label: string; value: string; tone: 'accent'|'ink'|'success'|'danger' }) {
  const valCls  = tone === 'accent' ? 'text-accent' : tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-ink'
  const barCls  = tone === 'accent' ? 'bg-gradient-to-r from-accent to-accent-2'
                : tone === 'success' ? 'bg-gradient-to-r from-success/80 to-success'
                : tone === 'danger'  ? 'bg-gradient-to-r from-danger/70 to-danger'
                : 'bg-gradient-to-r from-ink-4/50 to-ink-3/60'
  const iconBg  = tone === 'accent' ? 'bg-accent-dim text-accent'
                : tone === 'success' ? 'bg-success/12 text-success'
                : tone === 'danger'  ? 'bg-danger/10 text-danger'
                : 'bg-surface-3 text-ink-3'
  const icon = tone === 'accent'
    ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 11.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
    : tone === 'success'
    ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : tone === 'danger'
    ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="3.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 3.5V3a2 2 0 014 0v.5M4.5 7h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
    : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  return (
    <div className="glass rounded-xl p-4 relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-[2px] ${barCls}`} />
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-4">{label}</p>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold tabular ${valCls}`}>{value}</p>
    </div>
  )
}

function toneClasses(tone: 'success'|'warn'|'danger'|'muted') {
  if (tone === 'success') return 'bg-success/15 text-success border-success/30'
  if (tone === 'warn')    return 'bg-warn/15 text-warn border-warn/30'
  if (tone === 'danger')  return 'bg-danger/15 text-danger border-danger/30'
  return 'bg-surface-3 text-ink-4 border-hair'
}

function ShiftCell({ shift, paid, onClick }: { shift: Shift; paid: boolean; onClick: () => void }) {
  const st = SHIFT_STATUS[shift.status]
  return (
    <button
      onClick={onClick}
      className={`relative w-full max-w-[100px] px-1.5 py-1 rounded-md border text-left ${toneClasses(st.tone)} hover:opacity-90 transition-opacity`}
      title={`${st.label} · ${SHIFT_TYPES[shift.type].label}${paid ? ' · already in a payroll run' : ''}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider truncate">{st.label}</p>
      <p className="text-[10px] tabular opacity-80 mt-0.5">
        {(shift.hours + shift.otHours - shift.lateHours).toFixed(1)}h · {formatCurrency(shift.grossPay)}
      </p>
      {paid && (
        <span
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent text-canvas flex items-center justify-center"
          title="Paid in a payroll run"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M1.5 4l2 2 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </button>
  )
}

// ── Log shift modal ──────────────────────────────────────────────────────────
function LogShiftModal({
  open, onClose, employees, seed, onSaved,
}: {
  open: boolean
  onClose: () => void
  employees: Employee[]
  seed: { employeeId?: string; date?: string; existing?: Shift } | null
  onSaved: () => void
}) {
  const [, startTransition] = useTransition()

  // Initial form values driven by seed (cell click) or existing edit row.
  const [empId, setEmpId]       = useState(seed?.employeeId ?? employees[0]?.id ?? '')
  const [date, setDate]         = useState(seed?.date ?? todayISO())
  const [type, setType]         = useState<ShiftTypeKey>(seed?.existing?.type ?? 'opening')
  const [status, setStatus]     = useState<ShiftStatusKey>(seed?.existing?.status ?? 'present')
  const [timeIn, setTimeIn]     = useState(seed?.existing?.timeIn ?? '06:00')
  const [timeOut, setTimeOut]   = useState(seed?.existing?.timeOut ?? '14:00')
  const [otHrs, setOtHrs]       = useState(seed?.existing?.otHours?.toString() ?? '')
  const [otMin, setOtMin]       = useState('0')
  const [lateHrs, setLateHrs]   = useState(seed?.existing?.lateHours?.toString() ?? '')
  const [lateMin, setLateMin]   = useState('0')
  const [note, setNote]         = useState(seed?.existing?.note ?? '')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Re-seed when modal reopens.
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmpId(seed?.employeeId ?? employees[0]?.id ?? '')
    setDate(seed?.date ?? todayISO())
    const existing = seed?.existing
    setType(existing?.type ?? 'opening')
    setStatus(existing?.status ?? 'present')
    setTimeIn(existing?.timeIn ?? SHIFT_TYPES.opening.timeIn ?? '06:00')
    setTimeOut(existing?.timeOut ?? SHIFT_TYPES.opening.timeOut ?? '14:00')
    setOtHrs(existing?.otHours ? String(Math.floor(existing.otHours)) : '')
    setOtMin(existing ? String(Math.round((existing.otHours % 1) * 60)) : '0')
    setLateHrs(existing?.lateHours ? String(Math.floor(existing.lateHours)) : '')
    setLateMin(existing ? String(Math.round((existing.lateHours % 1) * 60)) : '0')
    setNote(existing?.note ?? '')
    setError('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed])

  const emp = employees.find(e => e.id === empId)
  const hourlyCents = emp ? hourlyRateCents(emp.payType, emp.payRate) : 0

  // Live preview math
  const presetHours = type === 'custom' && timeIn && timeOut ? hoursBetween(timeIn, timeOut) : SHIFT_TYPES[type].hours
  const ot   = (parseFloat(otHrs)  || 0) + (parseFloat(otMin)  || 0) / 60
  const late = (parseFloat(lateHrs)|| 0) + (parseFloat(lateMin)|| 0) / 60
  const gross = computeGrossPayCents(status, presetHours, ot, late, hourlyCents)

  function handleSave() {
    if (!empId)               { setError('Pick an employee.'); return }
    if (!date)                { setError('Pick a date.'); return }
    if (type === 'custom' && (!timeIn || !timeOut)) { setError('Custom shift needs time in & out.'); return }
    setLoading(true); setError('')
    startTransition(async () => {
      const r = await saveShift({
        employeeId: empId, date, shiftType: type, status,
        timeIn: type === 'custom' ? timeIn : undefined,
        timeOut: type === 'custom' ? timeOut : undefined,
        otHours: ot, lateHours: late,
        note,
      })
      setLoading(false)
      if (r?.error) { setError(r.error); return }
      onSaved()
    })
  }

  // Sync time fields when preset changes
  function selectType(t: ShiftTypeKey) {
    setType(t)
    const preset = SHIFT_TYPES[t]
    if (preset.timeIn)  setTimeIn(preset.timeIn)
    if (preset.timeOut) setTimeOut(preset.timeOut)
  }

  return (
    <Modal open={open} onClose={onClose} title={seed?.existing ? 'Edit shift' : 'Log shift'}>
      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-ink-3">Employee</label>
          <select value={empId} onChange={e => setEmpId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-canvas border border-hair text-sm text-ink">
            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName} · {e.role}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-ink-3">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-canvas border border-hair text-sm text-ink" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-ink-3">Shift type</label>
            <select value={type} onChange={e => selectType(e.target.value as ShiftTypeKey)} className="w-full px-3 py-2 rounded-lg bg-canvas border border-hair text-sm text-ink">
              {(Object.keys(SHIFT_TYPES) as ShiftTypeKey[]).map(k => (
                <option key={k} value={k}>{SHIFT_TYPES[k].label}{SHIFT_TYPES[k].time ? ` · ${SHIFT_TYPES[k].time}` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {type === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-ink-3">Time in</label>
              <input type="time" value={timeIn} onChange={e => setTimeIn(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-canvas border border-hair text-sm text-ink tabular" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-ink-3">Time out</label>
              <input type="time" value={timeOut} onChange={e => setTimeOut(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-canvas border border-hair text-sm text-ink tabular" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-ink-3">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as ShiftStatusKey)} className="w-full px-3 py-2 rounded-lg bg-canvas border border-hair text-sm text-ink">
              {(Object.keys(SHIFT_STATUS) as ShiftStatusKey[]).map(k => (
                <option key={k} value={k}>{SHIFT_STATUS[k].label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-ink-3">Note</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. arrived 10m late" className="w-full px-3 py-2 rounded-lg bg-canvas border border-hair text-sm text-ink" />
          </div>
        </div>

        <fieldset className="border border-hair rounded-lg p-3 space-y-2">
          <legend className="text-[10px] font-semibold uppercase tracking-widest text-ink-3 px-1">Overtime</legend>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" min="0" max="12" placeholder="OT hours" value={otHrs} onChange={e => setOtHrs(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-canvas border border-hair text-sm text-ink tabular" />
            <select value={otMin} onChange={e => setOtMin(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-canvas border border-hair text-sm text-ink">
              <option value="0">0 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
            </select>
          </div>
        </fieldset>

        <fieldset className="border border-hair rounded-lg p-3 space-y-2">
          <legend className="text-[10px] font-semibold uppercase tracking-widest text-ink-3 px-1">Late (deducted)</legend>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" min="0" max="12" placeholder="Hours late" value={lateHrs} onChange={e => setLateHrs(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-canvas border border-hair text-sm text-ink tabular" />
            <input type="number" min="0" max="59" placeholder="Min late" value={lateMin} onChange={e => setLateMin(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-canvas border border-hair text-sm text-ink tabular" />
          </div>
        </fieldset>

        {/* Pay preview */}
        <div className="rounded-lg border border-hair bg-surface-2/40 px-3 py-2.5 text-xs text-ink-3">
          {emp ? (
            <div className="flex items-center justify-between">
              <span>
                {(presetHours + ot - late).toFixed(2)}h × <span className="tabular">{formatCurrency(hourlyCents)}/hr</span>
                {status === 'absent' || status === 'leave' ? <span className="ml-2 text-danger">· {SHIFT_STATUS[status].label.toLowerCase()}, no pay</span> : null}
              </span>
              <span className="tabular font-bold text-accent text-sm">{formatCurrency(gross)}</span>
            </div>
          ) : <span>Pick an employee to see pay estimate.</span>}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-3 py-2 rounded-lg bg-surface-2 border border-hair text-ink-3 hover:text-ink hover:bg-surface-3 text-xs font-medium">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-lg btn-primary text-xs font-semibold disabled:opacity-60">
            {loading ? 'Saving…' : seed?.existing ? 'Save changes' : 'Log shift'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
