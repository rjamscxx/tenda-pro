'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { createExpense } from '@/app/(dashboard)/expenses/actions'
import { parseCents, todayISO } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

const CATEGORIES = [
  { value: 'ingredients', label: 'Ingredients' },
  { value: 'labor',       label: 'Labor' },
  { value: 'rent',        label: 'Rent' },
  { value: 'utilities',   label: 'Utilities' },
  { value: 'marketing',   label: 'Marketing' },
  { value: 'other',       label: 'Other' },
] as const

type Category = typeof CATEGORIES[number]['value']

const EMPTY = { category: 'ingredients' as Category, amount: '', vendor: '', expensedAt: '' }

export default function QuickExpenseButton() {
  const toast  = useToast()
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [form,    setForm]    = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function openModal() {
    setForm({ category: 'ingredients', amount: '', vendor: '', expensedAt: todayISO() })
    setError('')
    setOpen(true)
  }

  function update(k: keyof typeof EMPTY, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await createExpense({
      category:      form.category,
      amount:        parseCents(form.amount),
      vendor:        form.vendor,
      note:          '',
      expensedAt:    form.expensedAt,
      isRecurring:   false,
      recurrenceDay: null,
    })
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setOpen(false)
    toast('Expense logged')
    router.refresh()
  }

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 z-[var(--z-sticky)] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-hair text-ink-3 text-sm font-medium shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-accent hover:text-accent transition-all duration-200 active:scale-95"
        aria-label="Log expense"
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Expense
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Quick Expense">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Category</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => update('category', cat.value)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all duration-100 ${
                    form.category === cat.value
                      ? 'bg-accent-dim border-accent text-accent'
                      : 'bg-canvas border-hair text-ink-3 hover:border-accent/50 hover:text-ink-2'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Amount (₱)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              autoFocus
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Vendor + Date side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Vendor <span className="normal-case text-ink-4">(optional)</span></label>
              <input
                type="text"
                value={form.vendor}
                onChange={e => update('vendor', e.target.value)}
                placeholder="Supplier name"
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Date</label>
              <input
                type="date"
                required
                value={form.expensedAt}
                onChange={e => update('expensedAt', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 btn-primary rounded-lg text-sm font-medium"
          >
            {loading ? 'Saving…' : 'Log Expense'}
          </button>
        </form>
      </Modal>
    </>
  )
}
