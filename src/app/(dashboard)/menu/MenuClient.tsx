'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { createIngredient, updateIngredient, deleteIngredient } from './actions'
import { formatCurrency, parseCents } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import DishesClient, { type DishData, type IngredientOption } from './DishesClient'
import EngineeringTab from './EngineeringTab'

const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'cup', 'tbsp', 'tsp', 'pack', 'bottle', 'box', 'can', 'sachet']

interface Ingredient extends IngredientOption {
  stockQty: string
  lowStockThreshold: string
}

interface SalesPoint { qty: number; revenue: number }

const EMPTY_FORM = { name: '', unit: 'pcs', costPerUnit: '', stockQty: '0', lowStockThreshold: '0' }

export default function MenuClient({
  ingredients,
  dishes,
  salesVolume,
  isPro,
}: {
  ingredients: Ingredient[]
  dishes: DishData[]
  salesVolume: Map<string, SalesPoint>
  isPro: boolean
}) {
  const toast = useToast()
  const [tab, setTab] = useState<'dishes' | 'ingredients' | 'engineering'>('dishes')

  // Ingredient modal state
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setError(''); setOpen(true) }
  function openEdit(ing: Ingredient) {
    setEditing(ing)
    setForm({
      name: ing.name,
      unit: ing.unit,
      costPerUnit: String(ing.costPerUnit / 100),
      stockQty: ing.stockQty,
      lowStockThreshold: ing.lowStockThreshold,
    })
    setError('')
    setOpen(true)
  }

  function updateForm(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const input = {
      name: form.name,
      unit: form.unit,
      costPerUnit: parseCents(form.costPerUnit),
      stockQty: parseFloat(form.stockQty) || 0,
      lowStockThreshold: parseFloat(form.lowStockThreshold) || 0,
    }
    const result = editing
      ? await updateIngredient(editing.id, input)
      : await createIngredient(input)
    if (result?.error) { setError(result.error); setLoading(false); return }
    const wasEditing = editing
    setOpen(false)
    setLoading(false)
    toast(wasEditing ? 'Ingredient updated' : 'Ingredient added')
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await deleteIngredient(id)
    toast('Ingredient deleted', 'info')
  }

  const lowStock = ingredients.filter(
    i => parseFloat(i.stockQty) <= parseFloat(i.lowStockThreshold) && parseFloat(i.lowStockThreshold) > 0
  )

  return (
    <>
      {/* Page header */}
      <div className="px-6 py-5 border-b border-hair">
        <h1 className="text-xl font-semibold text-ink">Menu</h1>
        <p className="text-sm text-ink-3 mt-0.5">
          {dishes.length} dishes · {ingredients.length} ingredients
          {lowStock.length > 0 && <span className="ml-2 text-danger">· {lowStock.length} low stock</span>}
        </p>
      </div>

      {/* Tab nav */}
      <div className="px-6 flex gap-6 border-b border-hair overflow-x-auto">
        <button
          onClick={() => setTab('dishes')}
          className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            tab === 'dishes' ? 'border-accent text-ink' : 'border-transparent text-ink-3 hover:text-ink-2'
          }`}
        >
          Dishes ({dishes.length})
        </button>
        <button
          onClick={() => setTab('ingredients')}
          className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
            tab === 'ingredients' ? 'border-accent text-ink' : 'border-transparent text-ink-3 hover:text-ink-2'
          }`}
        >
          Ingredients ({ingredients.length})
        </button>
        <button
          onClick={() => setTab('engineering')}
          className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            tab === 'engineering' ? 'border-accent text-ink' : 'border-transparent text-ink-3 hover:text-ink-2'
          }`}
        >
          Engineering
          {!isPro && <span className="text-[10px] text-ink-4 opacity-60">🔒</span>}
        </button>
      </div>

      {/* Tab content */}
      {tab === 'dishes' ? (
        <DishesClient dishes={dishes} ingredients={ingredients} />
      ) : tab === 'engineering' ? (
        isPro ? (
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-ink">Menu Engineering</h2>
              <p className="text-sm text-ink-4 mt-0.5">30-day sales data. Dishes are classified by popularity vs. margin.</p>
            </div>
            <EngineeringTab dishes={dishes} salesVolume={salesVolume} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-3">
            <span className="text-4xl">📊</span>
            <p className="text-base font-semibold text-ink">Menu Engineering</p>
            <p className="text-sm text-ink-4 max-w-xs">Classify your dishes into Stars, Plowhorses, Puzzles, and Dogs based on margin and popularity. Available on Pro.</p>
            <a href="/settings#plan" className="mt-2 px-4 py-2 btn-primary rounded-lg text-sm">Upgrade to Pro →</a>
          </div>
        )
      ) : (
        <>
          {/* Ingredients sub-header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-hair">
            <p className="text-sm text-ink-3">
              {ingredients.length} ingredients
              {lowStock.length > 0 && (
                <span className="ml-2 text-danger">· {lowStock.length} low stock</span>
              )}
            </p>
            <button
              onClick={openAdd}
              className="px-4 py-2 btn-primary rounded-lg"
            >
              + Add ingredient
            </button>
          </div>

          {/* Ingredients list */}
          <div className="flex-1 overflow-y-auto">
            {ingredients.length === 0 ? (
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
                  <p className="text-xs text-ink-4 mt-0.5">Add your first one to start tracking costs</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hair text-xs text-ink-4 uppercase tracking-wider">
                    <th className="px-6 py-3 text-left font-medium">Ingredient</th>
                    <th className="px-6 py-3 text-left font-medium">Unit</th>
                    <th className="px-6 py-3 text-right font-medium tabular">Cost / Unit</th>
                    <th className="px-6 py-3 text-right font-medium tabular">Stock</th>
                    <th className="px-6 py-3 text-right font-medium tabular">Alert below</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-hair">
                  {ingredients.map((ing) => {
                    const isLow =
                      parseFloat(ing.stockQty) <= parseFloat(ing.lowStockThreshold) &&
                      parseFloat(ing.lowStockThreshold) > 0
                    return (
                      <tr key={ing.id} className="group hover:bg-surface-2 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-ink">
                          <div className="flex items-center gap-2">
                            {isLow && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-danger inline-block shrink-0"
                                title="Low stock"
                              />
                            )}
                            {ing.name}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-ink-3">{ing.unit}</td>
                        <td className="px-6 py-3.5 text-right tabular text-ink">
                          {formatCurrency(ing.costPerUnit)}
                        </td>
                        <td
                          className={`px-6 py-3.5 text-right tabular font-medium ${isLow ? 'text-danger' : 'text-ink'}`}
                        >
                          {parseFloat(ing.stockQty).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-right tabular text-ink-3">
                          {parseFloat(ing.lowStockThreshold).toLocaleString()}
                        </td>
                        <td className="px-2 py-3.5">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => openEdit(ing)}
                              className="text-ink-4 hover:text-accent transition-colors p-1 rounded"
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(ing.id, ing.name)}
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
            )}
          </div>

          {/* Ingredient modal */}
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title={editing ? 'Edit ingredient' : 'Add ingredient'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm focus:outline-none focus:border-accent transition-colors"
                  placeholder="Chicken breast"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Unit</label>
                  <select
                    value={form.unit}
                    onChange={e => updateForm('unit', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm focus:outline-none focus:border-accent transition-colors"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                    Cost / Unit (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costPerUnit}
                    onChange={e => updateForm('costPerUnit', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular focus:outline-none focus:border-accent transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                    Current stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.stockQty}
                    onChange={e => updateForm('stockQty', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                    Alert below
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.lowStockThreshold}
                    onChange={e => updateForm('lowStockThreshold', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 btn-primary rounded-lg"
              >
                {loading ? 'Saving…' : editing ? 'Update ingredient' : 'Add ingredient'}
              </button>
            </form>
          </Modal>
        </>
      )}
    </>
  )
}
