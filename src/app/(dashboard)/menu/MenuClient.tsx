'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { createIngredient, updateIngredient, deleteIngredient } from './actions'
import { formatCurrency, parseCents } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import DishesClient, { type DishData, type IngredientOption } from './DishesClient'
import EmptyState from '@/components/ui/EmptyState'
import QRModal from './QRModal'

const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'cup', 'tbsp', 'tsp', 'pack', 'bottle', 'box', 'can', 'sachet']

interface Ingredient extends IngredientOption {
  stockQty: string
  lowStockThreshold: string
}

const EMPTY_FORM = { name: '', unit: 'pcs', costPerUnit: '', stockQty: '0', lowStockThreshold: '0' }

export default function MenuClient({
  ingredients,
  dishes,
  venueId,
  venueName,
  isBasic = false,
  showFinancials = true,
  dishLimit = 20,
  ingredientLimit = 15,
}: {
  ingredients: Ingredient[]
  dishes: DishData[]
  venueId: string
  venueName: string
  isBasic?: boolean
  showFinancials?: boolean
  dishLimit?: number
  ingredientLimit?: number
}) {
  const toast = useToast()
  const [tab, setTab] = useState<'dishes' | 'ingredients'>('dishes')
  const [qrOpen, setQrOpen] = useState(false)

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
      {/* Page header with integrated segment control */}
      <div className="px-6 py-4 border-b border-hair flex items-center justify-between gap-4 shrink-0 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Menu</h1>
          <p className="text-sm text-ink-3 mt-0.5">
            {dishes.length} dishes · {ingredients.length} ingredients
            {lowStock.length > 0 && <span className="ml-2 text-danger">· {lowStock.length} low stock</span>}
          </p>
        </div>

        {/* Segmented control */}
        <div className="flex items-center gap-0.5 p-1 bg-surface-2/60 rounded-xl border border-hair/60 shrink-0">
          <button
            onClick={() => setTab('dishes')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === 'dishes'
                ? 'bg-canvas text-ink shadow-sm border border-hair/50'
                : 'text-ink-4 hover:text-ink-2'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <ellipse cx="6.5" cy="8.5" rx="4" ry="2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4.5 4.5C4.5 3.4 5.4 3 6.5 3s2 .4 2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M2.5 8.5h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Dishes
            <span className={`text-[10px] font-bold px-1.5 py-px rounded-md tabular leading-none ${
              tab === 'dishes' ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-ink-4'
            }`}>{dishes.length}</span>
          </button>
          <button
            onClick={() => setTab('ingredients')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === 'ingredients'
                ? 'bg-canvas text-ink shadow-sm border border-hair/50'
                : 'text-ink-4 hover:text-ink-2'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 11C3.5 7.5 6 4.5 11 2.5 9.5 6 7 9 2 11z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 11c1.5-1.5 3-2.5 5-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Ingredients
            <span className={`text-[10px] font-bold px-1.5 py-px rounded-md tabular leading-none ${
              tab === 'ingredients' ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-ink-4'
            }`}>{ingredients.length}</span>
          </button>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'dishes' ? (
        <>
          <DishesClient dishes={dishes} ingredients={ingredients} isBasic={isBasic} showFinancials={showFinancials} dishLimit={dishLimit} />
          {/* QR Code button — fixed bottom-left of dishes tab */}
          <div className="px-6 py-3 border-t border-hair flex justify-end">
            <button
              onClick={() => setQrOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hair text-xs font-medium text-ink-3 hover:border-accent hover:text-accent transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1" y="1" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="7.5" y="1" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="1" y="7.5" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="2.5" y="2.5" width="1.5" height="1.5" fill="currentColor"/>
                <rect x="9" y="2.5" width="1.5" height="1.5" fill="currentColor"/>
                <rect x="2.5" y="9" width="1.5" height="1.5" fill="currentColor"/>
                <path d="M7.5 7.5h1.5v1.5H7.5zM10.5 7.5H12v1.5h-1.5zM7.5 10.5H9V12H7.5zM10.5 10.5H12V12h-1.5z" fill="currentColor"/>
              </svg>
              Menu QR Code
            </button>
          </div>
          <QRModal open={qrOpen} onClose={() => setQrOpen(false)} venueId={venueId} venueName={venueName} />
        </>
      ) : (
        <>
          {/* Ingredients sub-header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-hair">
            <p className="text-sm text-ink-3">
              {ingredients.length} ingredients
              {isBasic && <span className="ml-1.5 text-ink-4 text-xs">({ingredients.length}/{ingredientLimit})</span>}
              {lowStock.length > 0 && (
                <span className="ml-2 text-danger">· {lowStock.length} low stock</span>
              )}
            </p>
            {isBasic && ingredients.length >= ingredientLimit ? (
              <a
                href="/settings#plan"
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-accent/40 text-accent hover:bg-accent/10 transition-colors flex items-center gap-1.5"
              >
                🔒 Upgrade for more
              </a>
            ) : (
              <button onClick={openAdd} className="px-4 py-2 btn-primary rounded-lg">
                + Add ingredient
              </button>
            )}
          </div>

          {/* Low-stock alert banner */}
          {lowStock.length > 0 && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-start gap-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-danger shrink-0 mt-0.5">
                <path d="M8 2L14 13H2L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M8 6.5v3M8 10.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-medium text-danger">
                  {lowStock.length} ingredient{lowStock.length > 1 ? 's' : ''} running low
                </p>
                <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">
                  {lowStock.map(i => `${i.name} (${parseFloat(i.stockQty).toLocaleString()} ${i.unit.toUpperCase()} left)`).join(' · ')}
                </p>
              </div>
            </div>
          )}

          {/* Ingredients list */}
          <div className="flex-1 overflow-y-auto">
            {ingredients.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <rect x="3" y="7" width="20" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M9 7V6a4 4 0 018 0v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M8 13h10M8 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                }
                title="No ingredients yet"
                body="Add your ingredients with unit costs. Sizzle uses them to calculate the real food cost of every dish."
                action={{ label: '+ Add ingredient', onClick: openAdd }}
              />
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
                        <td className="px-6 py-3.5 text-ink-3 uppercase tabular tracking-wider text-xs">{ing.unit}</td>
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
