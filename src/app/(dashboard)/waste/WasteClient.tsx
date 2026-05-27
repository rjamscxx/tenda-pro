'use client'

import { useState, useMemo } from 'react'
import { logWaste, deleteWaste } from './actions'
import Modal from '@/components/ui/Modal'
import { formatCurrency, formatDate, todayISO } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'

type Period = 'today' | 'week' | 'month' | 'all'
type WasteReason = 'spoilage' | 'overcooked' | 'dropped' | 'expired' | 'other'

interface WasteLog {
  id: string
  ingredientName: string
  qty: string
  unit: string
  reason: WasteReason
  estimatedCost: number
  note: string | null
  wastedAt: string
}

interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: number
}

interface Props {
  wasteLogs: WasteLog[]
  ingredients: Ingredient[]
}

const REASON_LABELS: Record<WasteReason, string> = {
  spoilage:   'Spoilage',
  overcooked: 'Overcooked',
  dropped:    'Dropped',
  expired:    'Expired',
  other:      'Other',
}

const REASON_BADGE: Record<WasteReason, string> = {
  spoilage:   'badge',
  overcooked: 'badge badge-accent',
  dropped:    'badge badge-danger',
  expired:    'badge badge-danger',
  other:      'badge',
}

export default function WasteClient({ wasteLogs, ingredients }: Props) {
  const toast = useToast()
  const [period, setPeriod]       = useState<Period>('month')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [deleting, setDeleting]   = useState<string | null>(null)

  // Form state
  const [ingredientId, setIngredientId] = useState('')
  const [qty, setQty]                   = useState('')
  const [reason, setReason]             = useState<WasteReason>('spoilage')
  const [note, setNote]                 = useState('')
  const [wastedAt, setWastedAt]         = useState(todayISO())

  const selectedIngredient = ingredients.find(i => i.id === ingredientId)
  const estimatedCost = selectedIngredient && qty && parseFloat(qty) > 0
    ? Math.round(selectedIngredient.costPerUnit * parseFloat(qty))
    : 0

  const filtered = useMemo(() => {
    const now = new Date()
    return wasteLogs.filter(w => {
      const d = new Date(w.wastedAt + 'T00:00:00')
      if (period === 'today') return d.toDateString() === now.toDateString()
      if (period === 'week') {
        const ago = new Date(now); ago.setDate(now.getDate() - 7)
        return d >= ago
      }
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }
      return true
    })
  }, [wasteLogs, period])

  const totalCost = filtered.reduce((s, w) => s + w.estimatedCost, 0)

  function resetForm() {
    setIngredientId(''); setQty(''); setReason('spoilage')
    setNote(''); setWastedAt(todayISO()); setError('')
  }

  async function handleSubmit() {
    if (!ingredientId || !qty || parseFloat(qty) <= 0) {
      setError('Select an ingredient and enter a valid quantity')
      return
    }
    setLoading(true); setError('')
    const res = await logWaste({ ingredientId, qty: parseFloat(qty), reason, note, wastedAt })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setModalOpen(false); resetForm()
    toast('Waste logged')
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteWaste(id)
    setDeleting(null)
    toast('Entry deleted', 'info')
  }

  return (
    <>
      {/* Header */}
      <div className="px-6 py-5 border-b border-hair flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Waste Log</h1>
          <p className="text-[12px] text-ink-4 mt-0.5">Track spoilage and food waste to monitor your true food cost.</p>
        </div>
        <button className="btn-primary px-4 py-2 text-[13px]" onClick={() => setModalOpen(true)}>
          + Log Waste
        </button>
      </div>

      {/* Stats + Period filter */}
      <div className="px-6 py-3 border-b border-hair flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold">Entries</p>
            <p className="text-[20px] font-semibold tabular text-ink leading-tight">{filtered.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold">Estimated Loss</p>
            <p className="text-[20px] font-semibold tabular text-danger leading-tight">{formatCurrency(totalCost)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
          {(['today', 'week', 'month', 'all'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                period === p ? 'bg-accent text-white' : 'text-ink-3 hover:text-ink'
              }`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? '7 Days' : p === 'month' ? 'Month' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M4 7.5h18M10 7.5V6a2 2 0 014 0v1.5M9.5 7.5l1 16h5l1-16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            title={period === 'all' ? 'No waste logged yet' : 'No waste for this period'}
            body={period === 'all'
              ? 'Track spoilage, dropped plates, and expired stock to see your real food cost.'
              : 'Try a wider date range or log a new entry.'}
            action={period === 'all' ? { label: 'Log first entry', onClick: () => setModalOpen(true) } : undefined}
          />
        ) : (
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-canvas z-10">
              <tr className="border-b border-hair">
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Ingredient</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Est. Loss</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-wider hidden md:table-cell">Note</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id} className="border-b border-hair hover:bg-surface-2 transition-colors">
                  <td className="px-6 py-3 text-ink-3 whitespace-nowrap">{formatDate(w.wastedAt)}</td>
                  <td className="px-4 py-3 font-medium text-ink">{w.ingredientName}</td>
                  <td className="px-4 py-3 text-right tabular text-ink whitespace-nowrap">
                    {parseFloat(w.qty)} {w.unit}
                  </td>
                  <td className="px-4 py-3">
                    <span className={REASON_BADGE[w.reason]}>{REASON_LABELS[w.reason]}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular font-medium text-danger whitespace-nowrap">
                    {formatCurrency(w.estimatedCost)}
                  </td>
                  <td className="px-4 py-3 text-ink-4 max-w-[160px] truncate hidden md:table-cell">
                    {w.note ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={deleting === w.id}
                      className="text-ink-4 hover:text-danger transition-colors disabled:opacity-40 p-1"
                      aria-label="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3.5h10M5.5 3.5V2.5h3v1M6 6v4M8 6v4M3 3.5l.5 7.5h7l.5-7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Log Waste Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm() }} title="Log Waste">
        <div className="space-y-4">
          {/* Ingredient */}
          <div>
            <label className="block text-[12px] font-medium text-ink-3 mb-1.5">Ingredient</label>
            {ingredients.length === 0 ? (
              <p className="text-[12px] text-ink-4 py-2">No ingredients found. Add ingredients in Menu first.</p>
            ) : (
              <select
                value={ingredientId}
                onChange={e => setIngredientId(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select ingredient…</option>
                {ingredients.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                ))}
              </select>
            )}
          </div>

          {/* Qty + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-ink-3 mb-1.5">
                Quantity
                {selectedIngredient && (
                  <span className="text-ink-4 ml-1 font-normal">({selectedIngredient.unit})</span>
                )}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder="0.00"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-3 mb-1.5">Date</label>
              <input
                type="date"
                value={wastedAt}
                onChange={e => setWastedAt(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Estimated cost preview */}
          {estimatedCost > 0 && (
            <div className="glass rounded-lg px-4 py-2.5 flex justify-between items-center">
              <span className="text-[12px] text-ink-3">Estimated loss</span>
              <span className="text-[15px] font-semibold tabular text-danger">{formatCurrency(estimatedCost)}</span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-[12px] font-medium text-ink-3 mb-2">Reason</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(REASON_LABELS) as WasteReason[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                    reason === r
                      ? 'border-accent bg-accent-tint text-accent'
                      : 'border-hair text-ink-3 hover:border-hair-2 hover:text-ink'
                  }`}
                >
                  {REASON_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-[12px] font-medium text-ink-3 mb-1.5">
              Note <span className="text-ink-4 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Any additional context…"
              rows={2}
              className="input-field w-full resize-none"
            />
          </div>

          {error && <p className="text-[12px] text-danger">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button className="btn-secondary flex-1" onClick={() => { setModalOpen(false); resetForm() }}>
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Logging…' : 'Log Waste'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
