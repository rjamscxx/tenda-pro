'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { adjustStock, addIngredient, updateIngredient, deleteIngredient, bulkReceiveStock } from './actions'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

const UNITS = ['kg', 'g', 'L', 'mL', 'pcs', 'box', 'bag', 'bottle', 'pack', 'can', 'jar', 'loaf']

const MOVEMENT_TYPES = [
  { value: 'received', label: 'Received', sign: '+' },
  { value: 'used',     label: 'Used',     sign: '−' },
  { value: 'wasted',   label: 'Wasted',   sign: '−' },
  { value: 'adjusted', label: 'Adjusted', sign: '±' },
] as const

type MovementType = typeof MOVEMENT_TYPES[number]['value']

const MOVEMENT_BADGE: Record<string, string> = {
  received: 'bg-success/15 text-success',
  used:     'bg-surface-3 text-ink-3',
  wasted:   'bg-danger/15 text-danger',
  adjusted: 'bg-warn/15 text-warn',
}

interface Ingredient {
  id: string
  name: string
  unit: string
  stockQty: number
  lowStockThreshold: number
  costPerUnit: number
}

interface Movement {
  id: string
  createdAt: string
  oldData: { stockQty: number; name: string } | null
  newData: { stockQty: number; delta: number; movementType: string; reason: string } | null
}

type Tab = 'stock' | 'movements'

function stockStatus(qty: number, threshold: number): 'out' | 'low' | 'ok' {
  if (qty <= 0) return 'out'
  if (threshold > 0 && qty <= threshold) return 'low'
  return 'ok'
}

const STATUS_BADGE = {
  out: 'bg-danger/15 text-danger',
  low: 'bg-warn/15 text-warn',
  ok:  'bg-success/15 text-success',
}
const STATUS_LABEL = { out: 'Out', low: 'Low', ok: 'OK' }

function fmtQty(qty: number) {
  return qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2)
}

export default function InventoryClient({
  ingredients,
  movements,
  isPro,
}: {
  ingredients: Ingredient[]
  movements: Movement[]
  isPro: boolean
}) {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('stock')
  const [search, setSearch] = useState('')

  // Add ingredient modal
  const [addOpen, setAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [addForm, setAddForm] = useState({
    name: '', unit: 'kg', costPerUnit: '', stockQty: '0', lowStockThreshold: '0',
  })

  // Edit ingredient modal
  const [editOpen, setEditOpen]       = useState(false)
  const [editTarget, setEditTarget]   = useState<Ingredient | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError]     = useState('')
  const [editForm, setEditForm]       = useState({ name: '', unit: 'kg', costPerUnit: '', lowStockThreshold: '0' })

  function openEditIng(ing: Ingredient) {
    setEditTarget(ing)
    setEditForm({
      name:              ing.name,
      unit:              ing.unit,
      costPerUnit:       (ing.costPerUnit / 100).toFixed(2),
      lowStockThreshold: String(ing.lowStockThreshold),
    })
    setEditError('')
    setEditOpen(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setEditLoading(true); setEditError('')
    const result = await updateIngredient(editTarget.id, {
      name:              editForm.name.trim(),
      unit:              editForm.unit,
      costPerUnit:       Math.round(parseFloat(editForm.costPerUnit || '0') * 100),
      lowStockThreshold: parseFloat(editForm.lowStockThreshold || '0'),
    })
    if (result?.error) { setEditError(result.error); setEditLoading(false); return }
    setEditOpen(false); setEditLoading(false)
    toast('Ingredient updated')
  }

  // Adjust stock modal
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [adjustError, setAdjustError] = useState('')
  const [adjustTarget, setAdjustTarget] = useState<Ingredient | null>(null)
  const [adjustForm, setAdjustForm] = useState<{ movementType: MovementType; qty: string; reason: string }>({
    movementType: 'received', qty: '', reason: '',
  })

  function openAdjust(ing: Ingredient) {
    setAdjustTarget(ing)
    setAdjustForm({ movementType: 'received', qty: '', reason: '' })
    setAdjustError('')
    setAdjustOpen(true)
  }

  // Receive Delivery modal
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveLoading, setReceiveLoading] = useState(false)
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({})

  function openReceive() {
    setReceiveQtys({})
    setReceiveOpen(true)
  }

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault()
    const items = Object.entries(receiveQtys)
      .filter(([, qty]) => parseFloat(qty) > 0)
      .map(([ingredientId, qty]) => ({ ingredientId, qty: parseFloat(qty) }))
    if (items.length === 0) return
    setReceiveLoading(true)
    await bulkReceiveStock(items)
    setReceiveOpen(false)
    setReceiveLoading(false)
    toast('Delivery received')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    setAddError('')
    const result = await addIngredient({
      name: addForm.name.trim(),
      unit: addForm.unit,
      costPerUnit: Math.round(parseFloat(addForm.costPerUnit || '0') * 100),
      stockQty: parseFloat(addForm.stockQty || '0'),
      lowStockThreshold: parseFloat(addForm.lowStockThreshold || '0'),
    })
    if (result?.error) { setAddError(result.error); setAddLoading(false); return }
    setAddOpen(false)
    setAddForm({ name: '', unit: 'kg', costPerUnit: '', stockQty: '0', lowStockThreshold: '0' })
    setAddLoading(false)
    toast('Ingredient added')
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault()
    if (!adjustTarget) return
    setAdjustLoading(true)
    setAdjustError('')
    const raw = parseFloat(adjustForm.qty || '0')
    const delta = (adjustForm.movementType === 'used' || adjustForm.movementType === 'wasted') ? -raw : raw
    const result = await adjustStock({
      ingredientId: adjustTarget.id,
      delta,
      movementType: adjustForm.movementType,
      reason: adjustForm.reason,
    })
    if (result?.error) { setAdjustError(result.error); setAdjustLoading(false); return }
    setAdjustOpen(false)
    setAdjustLoading(false)
    toast('Stock adjusted')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this ingredient? This cannot be undone.')) return
    await deleteIngredient(id)
    toast('Ingredient deleted', 'info')
  }

  function exportCSV() {
    const header = 'Name,Unit,Stock Qty,Low Stock Threshold,Cost Per Unit (₱),Status'
    const lines = ingredients.map(i => {
      const status = stockStatus(i.stockQty, i.lowStockThreshold)
      return [
        i.name,
        i.unit,
        fmtQty(i.stockQty),
        fmtQty(i.lowStockThreshold),
        (i.costPerUnit / 100).toFixed(2),
        STATUS_LABEL[status],
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })
    const csv = [header, ...lines].join('\r\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })),
      download: 'inventory.csv',
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const outCount = ingredients.filter(i => stockStatus(i.stockQty, i.lowStockThreshold) === 'out').length
  const lowCount = ingredients.filter(i => stockStatus(i.stockQty, i.lowStockThreshold) === 'low').length

  const previewQty = adjustTarget && adjustForm.qty
    ? Math.max(0, adjustTarget.stockQty + (
        (adjustForm.movementType === 'used' || adjustForm.movementType === 'wasted')
          ? -parseFloat(adjustForm.qty)
          : parseFloat(adjustForm.qty)
      ))
    : null

  return (
    <>
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-hair shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Inventory</h1>
          <p className="text-sm text-ink-4 mt-0.5">
            <span className="tabular">{ingredients.length}</span> ingredients
            {outCount > 0 && (
              <><span className="mx-1.5 text-hair-2">·</span><span className="text-danger font-medium">{outCount} out of stock</span></>
            )}
            {lowCount > 0 && (
              <><span className="mx-1.5 text-hair-2">·</span><span className="text-warn font-medium">{lowCount} low</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-7 pr-3 py-1.5 rounded-lg bg-surface-2 border border-hair text-xs text-ink placeholder:text-ink-4 w-36 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          {isPro ? (
            <button
              onClick={exportCSV}
              className="px-3 py-2 rounded-lg bg-surface-2 border border-hair text-ink-3 hover:text-ink hover:bg-surface-3 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 9v2.5h9V9M6.5 1v7M4 6l2.5 2.5L9 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              CSV
            </button>
          ) : (
            <a
              href="/settings#plan"
              title="CSV export is a Pro feature"
              className="px-3 py-2 rounded-lg bg-surface-2 border border-hair text-ink-4 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              🔒 CSV
            </a>
          )}
          <button onClick={openReceive} className="px-4 py-2 rounded-lg bg-surface-2 border border-hair text-ink-2 text-sm font-medium hover:bg-surface-3 transition-colors">
            Receive Delivery
          </button>
          <button onClick={() => setAddOpen(true)} className="px-4 py-2 btn-primary rounded-lg">
            + Add ingredient
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-hair flex gap-5 shrink-0">
        {(['stock', 'movements'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              tab === t ? 'border-accent text-accent' : 'border-transparent text-ink-4 hover:text-ink-2'
            }`}
          >
            {t === 'stock' ? 'Stock Levels' : 'Movements'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ── Stock Levels tab ── */}
        {tab === 'stock' && (() => {
          const filtered = search.trim()
            ? ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
            : ingredients
          return filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-ink-4">
                  <rect x="3" y="6" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M7 6V5a2 2 0 014 0v1M11 6V5a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M7 11h8M7 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink-2">No ingredients yet</p>
                <p className="text-xs text-ink-4 mt-0.5">Add ingredients to start tracking stock</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-canvas/90 backdrop-blur-sm z-10">
                <tr className="border-b border-hair">
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Ingredient</th>
                  <th className="px-6 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider tabular">In Stock</th>
                  <th className="px-6 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider tabular">Threshold</th>
                  <th className="px-6 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider tabular">Cost / Unit</th>
                  <th className="px-6 py-3 text-center text-[11px] font-medium text-ink-4 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {filtered.map(ing => {
                  const status = stockStatus(ing.stockQty, ing.lowStockThreshold)
                  return (
                    <tr key={ing.id} className="group hover:bg-surface-2 transition-colors border-l-2 border-l-transparent hover:border-l-accent">
                      <td className="px-6 py-3.5 font-medium text-ink">{ing.name}</td>
                      <td className="px-6 py-3.5 text-right tabular text-ink">
                        <div>{fmtQty(ing.stockQty)}{' '}<span className="text-ink-4 text-xs font-normal">{ing.unit}</span></div>
                        {ing.lowStockThreshold > 0 && (() => {
                          const pct = Math.min((ing.stockQty / ing.lowStockThreshold) * 100, 100)
                          const color = status === 'out' ? 'bg-danger' : status === 'low' ? 'bg-warn' : 'bg-success'
                          return (
                            <div className="mt-1.5 h-1 bg-surface-3 rounded-full overflow-hidden w-16 ml-auto">
                              <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min((ing.stockQty / ing.lowStockThreshold) * 100, 100)}%` }} />
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-3.5 text-right tabular text-ink-3">
                        {ing.lowStockThreshold > 0
                          ? <>{fmtQty(ing.lowStockThreshold)} <span className="text-ink-4 text-xs">{ing.unit}</span></>
                          : <span className="text-ink-4">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-right tabular text-ink-3">
                        {ing.costPerUnit > 0 ? formatCurrency(ing.costPerUnit) : <span className="text-ink-4">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_BADGE[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => openEditIng(ing)}
                            className="text-ink-4 hover:text-accent transition-colors p-1 rounded"
                            aria-label="Edit"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M9.5 2.5l2 2L4.5 11.5H2.5v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => openAdjust(ing)}
                            className="text-xs px-2.5 py-1 rounded-md bg-surface-3 text-ink-3 hover:bg-accent hover:text-canvas transition-colors font-medium"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => handleDelete(ing.id)}
                            className="text-ink-4 hover:text-danger transition-colors p-1 rounded"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M5.5 6v4M8.5 6v4M3 3.5l.7 7.2A1 1 0 004.7 12h4.6a1 1 0 001-.9L11 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        })()}

        {/* ── Movements tab ── */}
        {tab === 'movements' && (
          movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-ink-4">
                  <path d="M4 11h14M15 7l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm text-ink-4">No stock movements recorded yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-canvas z-10">
                <tr className="border-b border-hair">
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Ingredient</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider tabular">Change</th>
                  <th className="px-6 py-3 text-right text-[11px] font-medium text-ink-4 uppercase tracking-wider tabular">New Qty</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-ink-4 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {movements.map(m => {
                  const nd = m.newData
                  const od = m.oldData
                  const delta = nd?.delta ?? 0
                  const mt = nd?.movementType ?? 'adjusted'
                  const mtLabel = MOVEMENT_TYPES.find(t => t.value === mt)?.label ?? mt
                  return (
                    <tr key={m.id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-6 py-3.5 text-ink-3 whitespace-nowrap tabular text-sm">
                        {new Date(m.createdAt).toLocaleString('en-PH', {
                          timeZone: 'Asia/Manila', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-ink">{od?.name ?? '—'}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${MOVEMENT_BADGE[mt] ?? 'bg-surface-3 text-ink-3'}`}>
                          {mtLabel}
                        </span>
                      </td>
                      <td className={`px-6 py-3.5 text-right tabular font-medium ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
                        {delta >= 0 ? '+' : ''}{fmtQty(delta)}
                      </td>
                      <td className="px-6 py-3.5 text-right tabular text-ink-2">
                        {nd?.stockQty !== undefined ? fmtQty(nd.stockQty) : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-ink-3 max-w-xs truncate text-sm">
                        {nd?.reason || <span className="text-ink-4">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* ── Add Ingredient Modal ── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add ingredient"
        icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>}
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Name</label>
              <input
                type="text" required
                value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
                placeholder="e.g. Chicken breast"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Unit</label>
              <select
                value={addForm.unit} onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Cost / unit (₱)</label>
              <input
                type="number" min="0" step="0.01"
                value={addForm.costPerUnit} onChange={e => setAddForm(f => ({ ...f, costPerUnit: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Initial stock</label>
              <input
                type="number" min="0" step="0.001"
                value={addForm.stockQty} onChange={e => setAddForm(f => ({ ...f, stockQty: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                Low stock alert <span className="text-ink-4 normal-case font-normal">(optional)</span>
              </label>
              <input
                type="number" min="0" step="0.001"
                value={addForm.lowStockThreshold} onChange={e => setAddForm(f => ({ ...f, lowStockThreshold: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                placeholder="0"
              />
            </div>
          </div>
          {addError && <p className="text-sm text-danger">{addError}</p>}
          <button type="submit" disabled={addLoading} className="w-full py-2.5 btn-primary rounded-lg">
            {addLoading ? 'Saving…' : 'Add ingredient'}
          </button>
        </form>
      </Modal>

      {/* ── Edit Ingredient Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit — ${editTarget?.name ?? ''}`}
        icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Name</label>
              <input type="text" required
                value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Unit</label>
              <select value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Cost / unit (₱)</label>
              <input type="number" min="0" step="0.01"
                value={editForm.costPerUnit} onChange={e => setEditForm(f => ({ ...f, costPerUnit: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                Low stock alert <span className="text-ink-4 normal-case font-normal">(use Adjust to change stock qty)</span>
              </label>
              <input type="number" min="0" step="0.001"
                value={editForm.lowStockThreshold} onChange={e => setEditForm(f => ({ ...f, lowStockThreshold: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
              />
            </div>
          </div>
          {editError && <p className="text-sm text-danger">{editError}</p>}
          <button type="submit" disabled={editLoading} className="w-full py-2.5 btn-primary rounded-lg">
            {editLoading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </Modal>

      {/* ── Receive Delivery Modal ── */}
      <Modal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        title="Receive Delivery"
        icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M5 3l-4 4 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      >
        <form onSubmit={handleReceive} className="space-y-4">
          <p className="text-xs text-ink-4">Enter quantities received. Leave blank to skip.</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {ingredients.map(ing => (
              <div key={ing.id} className="flex items-center gap-3">
                <span className="flex-1 min-w-0 text-sm text-ink truncate">{ing.name}</span>
                <span className="text-xs text-ink-4 w-8 shrink-0 text-right">{ing.unit}</span>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={receiveQtys[ing.id] ?? ''}
                  onChange={e => setReceiveQtys(prev => ({ ...prev, [ing.id]: e.target.value }))}
                  className="w-24 shrink-0 px-3 py-2 rounded-lg bg-canvas border border-hair text-ink text-sm tabular focus:outline-none focus:border-accent transition-colors"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <button type="submit" disabled={receiveLoading} className="w-full py-2.5 btn-primary rounded-lg">
            {receiveLoading ? 'Saving…' : 'Receive Stock'}
          </button>
        </form>
      </Modal>

      {/* ── Adjust Stock Modal ── */}
      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title={`Adjust — ${adjustTarget?.name ?? ''}`}
        icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M9 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      >
        <form onSubmit={handleAdjust} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Movement type</label>
            <div className="grid grid-cols-4 gap-2">
              {MOVEMENT_TYPES.map(mt => (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => setAdjustForm(f => ({ ...f, movementType: mt.value }))}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    adjustForm.movementType === mt.value
                      ? 'bg-accent text-canvas border-accent'
                      : 'bg-canvas text-ink-3 border-hair hover:border-accent/50 hover:text-ink'
                  }`}
                >
                  {mt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
              Quantity{adjustTarget ? ` (${adjustTarget.unit})` : ''}
              {adjustForm.movementType === 'received' && <span className="ml-2 text-success normal-case font-normal">+ adding to stock</span>}
              {(adjustForm.movementType === 'used' || adjustForm.movementType === 'wasted') && <span className="ml-2 text-danger normal-case font-normal">− removing from stock</span>}
              {adjustForm.movementType === 'adjusted' && <span className="ml-2 text-warn normal-case font-normal">positive or negative net change</span>}
            </label>
            <input
              type="number" min="0" step="0.001" required
              value={adjustForm.qty} onChange={e => setAdjustForm(f => ({ ...f, qty: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular"
              placeholder="0"
            />
            {adjustTarget && previewQty !== null && (
              <p className="text-xs text-ink-4">
                Current: <span className="tabular text-ink-2">{fmtQty(adjustTarget.stockQty)}</span>{' '}
                → New: <span className="tabular text-ink font-medium">{fmtQty(previewQty)}</span>{' '}
                {adjustTarget.unit}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
              Reason <span className="text-ink-4 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm"
              placeholder="e.g. Delivery from supplier"
            />
          </div>
          {adjustError && <p className="text-sm text-danger">{adjustError}</p>}
          <button type="submit" disabled={adjustLoading} className="w-full py-2.5 btn-primary rounded-lg">
            {adjustLoading ? 'Saving…' : 'Log movement'}
          </button>
        </form>
      </Modal>
    </>
  )
}
