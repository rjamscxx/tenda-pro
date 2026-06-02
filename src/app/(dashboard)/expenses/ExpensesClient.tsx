'use client'

import { useState, useMemo } from 'react'
import Modal from '@/components/ui/Modal'
import { createExpense, updateExpense, deleteExpense } from './actions'
import { formatCurrency, formatDate, parseCents, todayISO } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'

const CATEGORIES = [
  { value: 'ingredients', label: 'Ingredients' },
  { value: 'labor',       label: 'Labor' },
  { value: 'rent',        label: 'Rent' },
  { value: 'utilities',   label: 'Utilities' },
  { value: 'marketing',   label: 'Marketing' },
  { value: 'other',       label: 'Other' },
]

const CATEGORY_BADGE: Record<string, string> = {
  ingredients: 'bg-accent/15 text-accent',
  labor:       'bg-sky-400/15 text-sky-400',
  rent:        'bg-warn/15 text-warn',
  utilities:   'bg-surface-3 text-ink-3',
  marketing:   'bg-purple-400/15 text-purple-400',
  other:       'bg-surface-3 text-ink-4',
}

const PERIODS = [
  { value: 'today',  label: 'Today' },
  { value: 'week',   label: '7 days' },
  { value: 'month',  label: 'This month' },
  { value: 'all',    label: 'All time' },
] as const

type Period = typeof PERIODS[number]['value']

interface Expense {
  id: string
  category: string
  amount: number
  vendor: string | null
  note: string | null
  expensedAt: string
  isRecurring: boolean
  recurrenceDay: number | null
}

const EMPTY_FORM = {
  category: 'ingredients', amount: '', vendor: '', note: '', expensedAt: todayISO(),
  isRecurring: false, recurrenceDay: '',
}

function filterByPeriod(rows: Expense[], period: Period): Expense[] {
  if (period === 'all') return rows
  const today      = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const weekStart  = new Date(Date.now() - 6 * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const monthStart = today.slice(0, 7) + '-01'
  return rows.filter(e => {
    const d = e.expensedAt
    if (period === 'today') return d === today
    if (period === 'week')  return d >= weekStart
    if (period === 'month') return d >= monthStart
    return true
  })
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ExpensesClient({ expenses, vendors }: { expenses: Expense[]; vendors: string[] }) {
  const toast = useToast()
  const [open, setOpen]           = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [form, setForm]           = useState(EMPTY_FORM)
  const [period, setPeriod]       = useState<Period>('all')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [search, setSearch]       = useState('')

  // Unique recurring expense templates — deduped by category+vendor+amount, most recent first
  const quickTemplates = useMemo(() => {
    const seen = new Map<string, Expense>()
    for (const e of expenses) {
      if (!e.isRecurring) continue
      const key = `${e.category}|${e.vendor ?? ''}|${e.amount}`
      if (!seen.has(key)) seen.set(key, e)
    }
    return Array.from(seen.values()).slice(0, 6)
  }, [expenses])

  function updateForm(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
    setOpen(true)
  }

  function openEdit(exp: Expense) {
    setEditingId(exp.id)
    setForm({
      category:      exp.category,
      amount:        (exp.amount / 100).toFixed(2),
      vendor:        exp.vendor ?? '',
      note:          exp.note ?? '',
      expensedAt:    exp.expensedAt,
      isRecurring:   exp.isRecurring,
      recurrenceDay: exp.recurrenceDay ? String(exp.recurrenceDay) : '',
    })
    setError('')
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditingId(null)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload = {
      category:      form.category as 'ingredients' | 'labor' | 'rent' | 'utilities' | 'marketing' | 'other',
      amount:        parseCents(form.amount),
      vendor:        form.vendor,
      note:          form.note,
      expensedAt:    form.expensedAt,
      isRecurring:   form.isRecurring,
      recurrenceDay: form.isRecurring && form.recurrenceDay ? parseInt(form.recurrenceDay) : null,
    }
    const result = editingId
      ? await updateExpense(editingId, payload)
      : await createExpense(payload)
    if (result?.error) { setError(result.error); setLoading(false); return }
    closeModal()
    setLoading(false)
    toast(editingId ? 'Expense updated' : 'Expense logged')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id)
    toast('Expense deleted', 'info')
  }

  async function handleQuickLog(template: Expense) {
    setLoading(true)
    const result = await createExpense({
      category:      template.category as 'ingredients' | 'labor' | 'rent' | 'utilities' | 'marketing' | 'other',
      amount:        template.amount,
      vendor:        template.vendor ?? '',
      note:          template.note ?? '',
      expensedAt:    todayISO(),
      isRecurring:   true,
      recurrenceDay: template.recurrenceDay,
    })
    setLoading(false)
    if (result?.error) toast(result.error, 'error')
    else toast(`${CATEGORIES.find(c => c.value === template.category)?.label ?? template.category} logged`)
  }

  function exportCSV(rows: Expense[]) {
    const header = 'Date,Category,Vendor,Amount,Recurring,Note'
    const lines  = rows.map(e => {
      const cat = CATEGORIES.find(c => c.value === e.category)?.label ?? e.category
      return [
        e.expensedAt,
        cat,
        e.vendor ?? '',
        (e.amount / 100).toFixed(2),
        e.isRecurring ? 'Yes' : 'No',
        e.note ?? '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })
    downloadCSV('expenses.csv', [header, ...lines].join('\r\n'))
  }

  const byPeriod    = filterByPeriod(expenses, period)
  const byCat       = catFilter === 'all' ? byPeriod : byPeriod.filter(e => e.category === catFilter)
  const displayed   = search.trim()
    ? byCat.filter(e =>
        (e.vendor ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (e.note ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : byCat
  const periodTotal = displayed.reduce((s, e) => s + e.amount, 0)
  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? 'All time'

  return (
    <>
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-hair shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center shrink-0 text-danger">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">Expenses</h1>
            <p className="text-sm text-ink-4 mt-0.5">
              <span className="tabular">{displayed.length}</span> entries
              <span className="mx-1.5 text-hair-2">·</span>
              {periodLabel}: <span className="tabular text-ink font-medium">{formatCurrency(periodTotal)}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(displayed)}
            className="px-3 py-2 rounded-lg bg-surface-2 border border-hair text-ink-3 hover:text-ink hover:bg-surface-3 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 9v2.5h9V9M6.5 1v7M4 6l2.5 2.5L9 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            CSV
          </button>
          <button onClick={openAdd} className="px-4 py-2 btn-primary rounded-lg">
            + Log expense
          </button>
        </div>
      </div>

      {/* Quick log — one-tap re-log of recurring expenses */}
      {quickTemplates.length > 0 && (
        <div className="px-6 py-2.5 border-b border-hair flex items-center gap-2 shrink-0 flex-wrap">
          <span className="text-[11px] text-ink-4 uppercase tracking-wider font-semibold shrink-0">Quick log</span>
          {quickTemplates.map((t, i) => (
            <button
              key={i}
              onClick={() => handleQuickLog(t)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hair text-xs font-medium text-ink-3 hover:text-ink transition-colors disabled:opacity-50"
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${CATEGORY_BADGE[t.category]?.split(' ')[0] ?? 'bg-hair-2'}`} />
              {t.vendor || CATEGORIES.find(c => c.value === t.category)?.label}
              <span className="text-ink-4 font-normal">· {formatCurrency(t.amount)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Period filter */}
      <div className="px-6 py-2.5 border-b border-hair flex items-center gap-1.5 shrink-0 flex-wrap">
        <div className="flex gap-1.5">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p.value
                  ? 'bg-accent text-canvas'
                  : 'bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink-2'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-hair mx-1" />
        {/* Category filter */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setCatFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${catFilter === 'all' ? 'bg-ink text-canvas' : 'bg-surface-2 text-ink-4 hover:bg-surface-3'}`}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCatFilter(catFilter === c.value ? 'all' : c.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                catFilter === c.value
                  ? CATEGORY_BADGE[c.value]
                  : 'bg-surface-2 text-ink-4 hover:bg-surface-3'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="ml-auto relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendor or note…"
            className="pl-7 pr-3 py-1.5 rounded-lg bg-surface-2 border border-hair text-xs text-ink placeholder:text-ink-4 w-44 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {displayed.length === 0 ? (
          <EmptyState
            icon={
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M4 8L9 14l5-5 8 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            title={period !== 'all' ? 'No expenses in this period' : 'No expenses yet'}
            body={period !== 'all'
              ? 'Try a wider date range or log a new expense.'
              : 'Track every cost — ingredients, labor, rent, utilities — to see your real profit margin.'}
            action={period === 'all' ? { label: '+ Log expense', onClick: openAdd } : undefined}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-canvas/90 backdrop-blur-sm z-10">
              <tr className="border-b border-hair">
                <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider tabular">Amount</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Note</th>
                <th className="px-3 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {displayed.map(exp => (
                <tr key={exp.id} className="group hover:bg-surface-2 transition-colors border-l-2 border-l-transparent hover:border-l-accent">
                  <td className="px-6 py-3.5 text-ink-3 tabular whitespace-nowrap text-sm">{formatDate(exp.expensedAt)}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${CATEGORY_BADGE[exp.category] ?? 'bg-surface-3 text-ink-3'}`}>
                      {CATEGORIES.find(c => c.value === exp.category)?.label ?? exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-ink-2 text-sm">
                    <span>{exp.vendor ?? <span className="text-ink-4">—</span>}</span>
                    {exp.isRecurring && (
                      <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                        ↻{exp.recurrenceDay ? ` day ${exp.recurrenceDay}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right tabular font-medium text-ink">{formatCurrency(exp.amount)}</td>
                  <td className="px-6 py-3.5 text-ink-3 max-w-xs truncate text-sm">{exp.note ?? <span className="text-ink-4">—</span>}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => openEdit(exp)}
                        className="text-ink-4 hover:text-accent transition-colors p-1 rounded"
                        aria-label="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M9.5 2.5l2 2L4.5 11.5H2.5v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-ink-4 hover:text-danger transition-colors p-1 rounded"
                        aria-label="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M5.5 6v4M8.5 6v4M3 3.5l.7 7.2A1 1 0 004.7 12h4.6a1 1 0 001-.9L11 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-hair bg-surface-2/50">
                <td className="px-6 py-3 text-xs text-ink-4 font-medium" colSpan={3}>
                  {periodLabel} ({displayed.length} {displayed.length === 1 ? 'entry' : 'entries'})
                </td>
                <td className="px-6 py-3 text-right tabular font-semibold text-ink">{formatCurrency(periodTotal)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={open}
        onClose={closeModal}
        title={editingId ? 'Edit expense' : 'Log expense'}
        icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4.5L6 9l3-3 5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Category</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M1.5 1.5h5l6 6a1.4 1.4 0 010 2l-3 3a1.4 1.4 0 01-2 0l-6-6v-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  <circle cx="4.5" cy="4.5" r="1" fill="currentColor"/>
                </svg>
                <select value={form.category} onChange={e => updateForm('category', e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Amount (₱)</label>
              <input type="number" min="0" step="0.01" required
                value={form.amount} onChange={e => updateForm('amount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Date</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="2.5" width="12" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1 6h12M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input type="date" required
                  value={form.expensedAt} onChange={e => updateForm('expensedAt', e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Vendor <span className="text-ink-4 normal-case font-normal">(optional)</span></label>
              <input type="text"
                list="vendor-suggestions"
                value={form.vendor} onChange={e => updateForm('vendor', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
                placeholder="Supplier name" />
              <datalist id="vendor-suggestions">
                {vendors.map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Note <span className="text-ink-4 normal-case font-normal">(optional)</span></label>
              <input type="text"
                value={form.note} onChange={e => updateForm('note', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
                placeholder="Details…" />
            </div>
          </div>

          {/* Recurring toggle */}
          <div className="flex items-start gap-3 pt-1">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isRecurring: !f.isRecurring }))}
              className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                form.isRecurring ? 'bg-accent' : 'bg-surface-3'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
                form.isRecurring ? 'translate-x-4' : 'translate-x-1'
              }`} />
            </button>
            <div className="flex-1">
              <p className="text-sm text-ink-2 font-medium">Recurring expense</p>
              {form.isRecurring && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-xs text-ink-4 shrink-0">Repeats on day</label>
                  <input
                    type="number" min="1" max="28"
                    value={form.recurrenceDay} onChange={e => updateForm('recurrenceDay', e.target.value)}
                    className="w-20 px-3 py-1.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                    placeholder="1–28"
                  />
                  <span className="text-xs text-ink-4">of each month</span>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-2.5 btn-primary rounded-lg">
            {loading ? 'Saving…' : editingId ? 'Save changes' : 'Save expense'}
          </button>
        </form>
      </Modal>
    </>
  )
}
