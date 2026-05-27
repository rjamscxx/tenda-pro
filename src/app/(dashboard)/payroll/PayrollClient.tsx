'use client'

import { useState, useMemo } from 'react'
import { createPayrollRun, deletePayrollRun, logPayrollAsExpense } from './actions'
import Modal from '@/components/ui/Modal'
import { formatCurrency, formatDate, todayISO } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

interface PayrollItem {
  id: string
  employeeId: string
  employeeName: string
  employeeRole: string
  daysWorked: string
  grossPay: number
  deductions: number
  netPay: number
  note: string | null
}

interface PayrollRun {
  id: string
  periodStart: string
  periodEnd: string
  totalGross: number
  totalDeductions: number
  totalNet: number
  note: string | null
  createdAt: Date | string
  items: PayrollItem[]
}

interface ActiveEmployee {
  id: string
  fullName: string
  role: string
  payType: 'daily' | 'monthly' | 'hourly'
  payRate: number
}

interface Props {
  runs: PayrollRun[]
  activeEmployees: ActiveEmployee[]
}

interface PayEntry {
  employeeId: string
  daysWorked: string
  grossPay: string   // PHP string input
  deductions: string // PHP string input
}

function calcGross(emp: ActiveEmployee, units: string): number {
  const n = parseFloat(units)
  if (isNaN(n) || n <= 0) return 0
  if (emp.payType === 'daily')   return Math.round(n * emp.payRate)
  if (emp.payType === 'hourly')  return Math.round(n * emp.payRate)
  // monthly: prorate over 26 working days
  return Math.round((n / 26) * emp.payRate)
}

function unitsLabel(payType: ActiveEmployee['payType']): string {
  return payType === 'hourly' ? 'Hours Worked' : 'Days Worked'
}

function rateLabel(emp: ActiveEmployee): string {
  if (emp.payType === 'hourly')  return `${formatCurrency(emp.payRate)}/hr`
  if (emp.payType === 'monthly') return `${formatCurrency(emp.payRate)}/mo`
  return `${formatCurrency(emp.payRate)}/day`
}

export default function PayrollClient({ runs, activeEmployees }: Props) {
  const toast = useToast()
  const [modalOpen, setModalOpen]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [deleting, setDeleting]               = useState<string | null>(null)
  const [expandedId, setExpandedId]           = useState<string | null>(null)
  const [loggingExpense, setLoggingExpense]   = useState<string | null>(null)
  const [pendingLogExpenseId, setPendingLogExpenseId] = useState<string | null>(null)

  // New run form
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [periodEnd, setPeriodEnd] = useState(todayISO())
  const [runNote, setRunNote]     = useState('')
  const [entries, setEntries]     = useState<PayEntry[]>([])

  const totalGross      = useMemo(() => entries.reduce((s, e) => s + Math.round((parseFloat(e.grossPay) || 0) * 100), 0), [entries])
  const totalDeductions = useMemo(() => entries.reduce((s, e) => s + Math.round((parseFloat(e.deductions) || 0) * 100), 0), [entries])
  const totalNet        = totalGross - totalDeductions

  function openModal() {
    setEntries(
      activeEmployees.map(emp => ({
        employeeId: emp.id,
        daysWorked:  '',
        grossPay:    '',
        deductions:  '0',
      }))
    )
    setPeriodStart(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) })
    setPeriodEnd(todayISO())
    setRunNote(''); setError(''); setModalOpen(true)
  }

  function closeModal() { setModalOpen(false); setError('') }

  function updateEntry(idx: number, field: keyof PayEntry, value: string) {
    setEntries(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }

      // Auto-calc gross when daysWorked changes for daily/monthly employees
      if (field === 'daysWorked') {
        const emp = activeEmployees[idx]
        if (emp) {
          const autoGross = calcGross(emp, value)
          if (autoGross > 0) {
            next[idx].grossPay = (autoGross / 100).toFixed(2)
          } else if (value === '' || parseFloat(value) <= 0) {
            next[idx].grossPay = ''
          }
        }
      }
      return next
    })
  }

  function getNetDisplay(idx: number): string {
    const gross = parseFloat(entries[idx]?.grossPay || '0')
    const deductions = parseFloat(entries[idx]?.deductions || '0')
    const net = gross - deductions
    if (isNaN(net)) return '—'
    return `₱${net.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  async function handleSubmit() {
    const filledEntries = entries.filter(e => parseFloat(e.grossPay) > 0)
    if (filledEntries.length === 0) {
      setError('Enter pay details for at least one employee')
      return
    }
    if (!periodStart || !periodEnd) {
      setError('Select a pay period')
      return
    }
    setLoading(true); setError('')
    const res = await createPayrollRun({
      periodStart,
      periodEnd,
      note: runNote || undefined,
      items: filledEntries.map(e => ({
        employeeId: e.employeeId,
        daysWorked: parseFloat(e.daysWorked) || 0,
        grossPay:   Math.round((parseFloat(e.grossPay) || 0) * 100),
        deductions: Math.round((parseFloat(e.deductions) || 0) * 100),
      })),
    })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    closeModal()
    toast('Payroll run saved')
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await deletePayrollRun(id)
    setDeleting(null)
    toast('Payroll run deleted', 'info')
  }

  async function handleLogExpense(run: PayrollRun) {
    if (pendingLogExpenseId !== run.id) {
      setPendingLogExpenseId(run.id)
      setTimeout(() => setPendingLogExpenseId(prev => prev === run.id ? null : prev), 3000)
      return
    }
    setPendingLogExpenseId(null)
    setLoggingExpense(run.id)
    await logPayrollAsExpense(run.id)
    setLoggingExpense(null)
    toast('Logged as labor expense')
  }

  const totalPaid = runs.reduce((s, r) => s + r.totalNet, 0)

  return (
    <>
      {/* Header */}
      <div className="px-6 py-5 border-b border-hair flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Payroll</h1>
          <p className="text-[12px] text-ink-4 mt-0.5">Process payroll runs and track total labor cost.</p>
        </div>
        <button
          className="btn-primary px-4 py-2 text-[13px]"
          onClick={openModal}
          disabled={activeEmployees.length === 0}
          title={activeEmployees.length === 0 ? 'Add employees first' : undefined}
        >
          + New Payroll Run
        </button>
      </div>

      {/* Stats */}
      <div className="px-6 py-3 border-b border-hair flex items-center gap-6">
        <div>
          <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold">Total Runs</p>
          <p className="text-[20px] font-semibold tabular text-ink leading-tight">{runs.length}</p>
        </div>
        <div>
          <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold">Total Paid Out</p>
          <p className="text-[20px] font-semibold tabular text-ink leading-tight">{formatCurrency(totalPaid)}</p>
        </div>
        <div>
          <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold">Active Employees</p>
          <p className="text-[20px] font-semibold tabular text-ink leading-tight">{activeEmployees.length}</p>
        </div>
      </div>

      {/* Runs List */}
      <div className="flex-1 overflow-y-auto">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-ink-4 gap-2">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="3" y="10" width="30" height="22" rx="3" stroke="currentColor" strokeWidth="1.6" opacity=".4"/>
              <path d="M12 10V8h12v2M18 19v1m0 3v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".4"/>
              <circle cx="18" cy="21" r="3.5" stroke="currentColor" strokeWidth="1.4" opacity=".4"/>
            </svg>
            <p className="text-[13px]">No payroll runs yet</p>
            {activeEmployees.length === 0 && (
              <p className="text-[12px]">Add employees first in the Employees page.</p>
            )}
            {activeEmployees.length > 0 && (
              <button className="text-[12px] text-accent hover:underline" onClick={openModal}>
                Create your first payroll run
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-hair">
            {runs.map(run => (
              <div key={run.id}>
                {/* Run Row */}
                <div
                  className="px-6 py-4 flex items-center gap-4 hover:bg-surface-2 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-[13px]">
                      {formatDate(run.periodStart)} – {formatDate(run.periodEnd)}
                    </p>
                    <p className="text-[11px] text-ink-4 mt-0.5">
                      {run.items.length} employee{run.items.length !== 1 ? 's' : ''}
                      {' · '}{new Date(run.createdAt).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })}
                      {run.note && ` · ${run.note}`}
                    </p>
                  </div>

                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] text-ink-4">Gross</p>
                    <p className="tabular text-[13px] font-medium text-ink">{formatCurrency(run.totalGross)}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] text-ink-4">Deductions</p>
                    <p className="tabular text-[13px] font-medium text-danger">−{formatCurrency(run.totalDeductions)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-ink-4">Net Pay</p>
                    <p className="tabular text-[14px] font-semibold text-ink">{formatCurrency(run.totalNet)}</p>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <svg
                      width="14" height="14" viewBox="0 0 14 14" fill="none"
                      className={`text-ink-4 transition-transform duration-150 ${expandedId === run.id ? 'rotate-180' : ''}`}
                    >
                      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <button
                      onClick={e => { e.stopPropagation(); handleLogExpense(run) }}
                      disabled={loggingExpense === run.id}
                      className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors disabled:opacity-40 ml-1 ${
                        pendingLogExpenseId === run.id
                          ? 'bg-warn/15 text-warn border border-warn/20'
                          : 'bg-surface-3 text-ink-4 hover:bg-accent/15 hover:text-accent'
                      }`}
                      title="Post net pay as a labor expense"
                    >
                      {loggingExpense === run.id ? '…' : pendingLogExpenseId === run.id ? 'Confirm?' : 'Log expense'}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(run.id) }}
                      disabled={deleting === run.id}
                      className="text-ink-4 hover:text-danger transition-colors disabled:opacity-40 p-1"
                      aria-label="Delete run"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3.5h10M5.5 3.5V2.5h3v1M6 6v4M8 6v4M3 3.5l.5 7.5h7l.5-7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded breakdown */}
                {expandedId === run.id && run.items.length > 0 && (
                  <div className="px-6 pb-4 bg-surface-2">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-hair">
                          <th className="py-2 text-left text-[10px] font-semibold text-ink-4 uppercase tracking-wider">Employee</th>
                          <th className="py-2 text-right text-[10px] font-semibold text-ink-4 uppercase tracking-wider">Days/Hrs</th>
                          <th className="py-2 text-right text-[10px] font-semibold text-ink-4 uppercase tracking-wider">Gross</th>
                          <th className="py-2 text-right text-[10px] font-semibold text-ink-4 uppercase tracking-wider">Deductions</th>
                          <th className="py-2 text-right text-[10px] font-semibold text-ink-4 uppercase tracking-wider">Net Pay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {run.items.map(item => (
                          <tr key={item.id} className="border-b border-hair last:border-0">
                            <td className="py-2">
                              <p className="font-medium text-ink">{item.employeeName}</p>
                              <p className="text-[10px] text-ink-4">{item.employeeRole}</p>
                            </td>
                            <td className="py-2 text-right tabular text-ink-3">{parseFloat(item.daysWorked)}</td>
                            <td className="py-2 text-right tabular text-ink">{formatCurrency(item.grossPay)}</td>
                            <td className="py-2 text-right tabular text-danger">
                              {item.deductions > 0 ? `−${formatCurrency(item.deductions)}` : '—'}
                            </td>
                            <td className="py-2 text-right tabular font-semibold text-ink">{formatCurrency(item.netPay)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Payroll Run Modal */}
      <Modal open={modalOpen} onClose={closeModal} title="New Payroll Run">
        <div className="space-y-4">
          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-ink-3 mb-1.5">Period Start</label>
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-3 mb-1.5">Period End</label>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-[12px] font-medium text-ink-3 mb-1.5">
              Note <span className="text-ink-4 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={runNote}
              onChange={e => setRunNote(e.target.value)}
              placeholder="e.g. Semi-monthly payroll"
              className="input-field w-full"
            />
          </div>

          {/* Employee pay entries */}
          <div>
            <p className="text-[12px] font-medium text-ink-3 mb-2">Employee Pay</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activeEmployees.map((emp, idx) => {
                const entry = entries[idx]
                if (!entry) return null
                const gross = parseFloat(entry.grossPay || '0')
                const ded   = parseFloat(entry.deductions || '0')
                const net   = gross - ded

                return (
                  <div key={emp.id} className="glass rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-ink">{emp.fullName}</p>
                        <p className="text-[10px] text-ink-4">
                          {emp.role} · {rateLabel(emp)}
                        </p>
                      </div>
                      {net > 0 && (
                        <p className="text-[13px] font-semibold tabular text-ink">{getNetDisplay(idx)}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-ink-4 mb-1">{unitsLabel(emp.payType)}</label>
                        <input
                          type="number"
                          min="0"
                          max={emp.payType === 'hourly' ? 248 : 31}
                          step={emp.payType === 'hourly' ? 0.5 : 0.5}
                          value={entry.daysWorked}
                          onChange={e => updateEntry(idx, 'daysWorked', e.target.value)}
                          placeholder="0"
                          className="input-field w-full text-[12px] py-1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-ink-4 mb-1">Gross Pay (₱)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.grossPay}
                          onChange={e => updateEntry(idx, 'grossPay', e.target.value)}
                          placeholder="0.00"
                          className="input-field w-full text-[12px] py-1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-ink-4 mb-1">Deductions (₱)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.deductions}
                          onChange={e => updateEntry(idx, 'deductions', e.target.value)}
                          placeholder="0.00"
                          className="input-field w-full text-[12px] py-1.5"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Totals preview */}
          {totalGross > 0 && (
            <div className="glass rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-ink-3">Total Gross</span>
                <span className="tabular font-medium text-ink">{formatCurrency(totalGross)}</span>
              </div>
              {totalDeductions > 0 && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-ink-3">Total Deductions</span>
                  <span className="tabular font-medium text-danger">−{formatCurrency(totalDeductions)}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px] border-t border-hair pt-1.5">
                <span className="font-semibold text-ink">Total Net Pay</span>
                <span className="tabular font-bold text-ink">{formatCurrency(totalNet)}</span>
              </div>
            </div>
          )}

          {error && <p className="text-[12px] text-danger">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button className="btn-secondary flex-1" onClick={closeModal}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Processing…' : 'Process Payroll'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
