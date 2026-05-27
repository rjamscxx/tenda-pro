'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { createDish, updateDish, deleteDish, saveRecipe, toggleDishActive, toggleSoldOut } from './dishActions'
import { formatCurrency, parseCents } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'

const DISH_CATEGORIES = ['Mains', 'Starters', 'Sides', 'Drinks', 'Desserts', 'Snacks', 'Other']

export interface IngredientOption {
  id: string
  name: string
  unit: string
  costPerUnit: number
}

export interface RecipeItemData {
  ingredientId: string
  qty: number
  ingredient: {
    id: string
    name: string
    unit: string
    costPerUnit: number
  }
}

export interface DishData {
  id: string
  name: string
  category: string
  price: number
  isActive: boolean
  soldOutDate: string | null
  recipeItems: RecipeItemData[]
}

interface RecipeRow {
  key: string
  ingredientId: string
  qty: string
}

function liveCostFromRows(rows: RecipeRow[], ingredients: IngredientOption[]): number {
  return rows.reduce((sum, row) => {
    const ing = ingredients.find(i => i.id === row.ingredientId)
    return ing ? sum + (parseFloat(row.qty) || 0) * ing.costPerUnit : sum
  }, 0)
}

function marginPct(price: number, cost: number): number {
  if (price <= 0) return 0
  return ((price - cost) / price) * 100
}

function marginColor(pct: number) {
  if (pct >= 60) return 'text-accent'
  if (pct >= 40) return 'text-warn'
  return 'text-danger'
}

const EMPTY_DISH_FORM = { name: '', category: 'Mains', price: '' }

export default function DishesClient({
  dishes,
  ingredients,
}: {
  dishes: DishData[]
  ingredients: IngredientOption[]
}) {
  const toast = useToast()
  const [dishOpen, setDishOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<DishData | null>(null)
  const [dishForm, setDishForm] = useState(EMPTY_DISH_FORM)
  const [dishLoading, setDishLoading] = useState(false)
  const [dishError, setDishError] = useState('')

  const [recipeOpen, setRecipeOpen] = useState(false)
  const [recipeDish, setRecipeDish] = useState<DishData | null>(null)
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([])
  const [whatIfPrice, setWhatIfPrice] = useState('')
  const [recipeLoading, setRecipeLoading] = useState(false)
  const [recipeError, setRecipeError] = useState('')

  function openAddDish() {
    setEditingDish(null)
    setDishForm(EMPTY_DISH_FORM)
    setDishError('')
    setDishOpen(true)
  }

  function openEditDish(dish: DishData) {
    setEditingDish(dish)
    setDishForm({ name: dish.name, category: dish.category, price: String(dish.price / 100) })
    setDishError('')
    setDishOpen(true)
  }

  async function handleDishSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDishLoading(true)
    setDishError('')
    const input = { name: dishForm.name, category: dishForm.category, price: parseCents(dishForm.price) }
    const result = editingDish ? await updateDish(editingDish.id, input) : await createDish(input)
    if (result?.error) { setDishError(result.error); setDishLoading(false); return }
    const wasEditing = editingDish
    setDishOpen(false)
    setDishLoading(false)
    toast(wasEditing ? 'Dish updated' : 'Dish added')
  }

  async function handleDeleteDish(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await deleteDish(id)
    toast('Dish deleted', 'info')
  }

  function openRecipeEditor(dish: DishData) {
    setRecipeDish(dish)
    setRecipeRows(
      dish.recipeItems.length > 0
        ? dish.recipeItems.map((item, i) => ({
            key: String(i),
            ingredientId: item.ingredientId,
            qty: String(item.qty),
          }))
        : [{ key: '0', ingredientId: ingredients[0]?.id ?? '', qty: '' }]
    )
    setWhatIfPrice(String(dish.price / 100))
    setRecipeError('')
    setRecipeOpen(true)
  }

  function addRecipeRow() {
    setRecipeRows(rows => [
      ...rows,
      { key: String(Date.now()), ingredientId: ingredients[0]?.id ?? '', qty: '' },
    ])
  }

  function removeRecipeRow(key: string) {
    setRecipeRows(rows => rows.filter(r => r.key !== key))
  }

  function updateRow(key: string, field: 'ingredientId' | 'qty', value: string) {
    setRecipeRows(rows => rows.map(r => (r.key === key ? { ...r, [field]: value } : r)))
  }

  async function handleSaveRecipe(e: React.FormEvent) {
    e.preventDefault()
    if (!recipeDish) return
    setRecipeLoading(true)
    setRecipeError('')
    const validRows = recipeRows.filter(r => r.ingredientId && parseFloat(r.qty) > 0)
    const result = await saveRecipe(
      recipeDish.id,
      validRows.map(r => ({ ingredientId: r.ingredientId, qty: parseFloat(r.qty) }))
    )
    if (result?.error) { setRecipeError(result.error); setRecipeLoading(false); return }
    setRecipeOpen(false)
    setRecipeLoading(false)
    toast('Recipe saved')
  }

  const liveCost = liveCostFromRows(recipeRows, ingredients)
  const whatIfCents = parseCents(whatIfPrice)
  const whatIfMarginPct = whatIfCents > 0 ? ((whatIfCents - liveCost) / whatIfCents) * 100 : 0
  const whatIfMarginCents = whatIfCents - liveCost

  return (
    <>
      {/* Sub-header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-hair">
        <p className="text-sm text-ink-3">{dishes.length} dishes</p>
        <button
          onClick={openAddDish}
          className="px-4 py-2 btn-primary rounded-lg"
        >
          + Add dish
        </button>
      </div>

      {/* Dish list */}
      <div className="flex-1 overflow-y-auto">
        {dishes.length === 0 ? (
          <EmptyState
            icon={
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <circle cx="13" cy="13" r="9" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M8 13h10M13 8v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            }
            title="No dishes yet"
            body="Add your menu items, attach ingredients, and Sizzle calculates your food cost and gross margin automatically."
            action={{ label: '+ Add dish', onClick: openAddDish }}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-canvas/90 backdrop-blur-sm z-10">
              <tr className="border-b border-hair text-xs text-ink-4 uppercase tracking-wider">
                <th className="px-6 py-3 text-left font-medium">Dish</th>
                <th className="px-6 py-3 text-left font-medium">Category</th>
                <th className="px-6 py-3 text-right font-medium tabular">Price</th>
                <th className="px-6 py-3 text-right font-medium tabular">Food Cost</th>
                <th className="px-6 py-3 text-right font-medium tabular">Margin %</th>
                <th className="px-6 py-3 text-right font-medium tabular">Margin ₱</th>
                <th className="px-6 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">86</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {dishes.map((dish) => {
                const cost = dish.recipeItems.reduce(
                  (sum, ri) => sum + ri.qty * ri.ingredient.costPerUnit,
                  0
                )
                const pct = marginPct(dish.price, cost)
                const marginAmt = dish.price - cost
                const hasRecipe = dish.recipeItems.length > 0
                const isSoldOutToday = dish.soldOutDate === new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
                return (
                  <tr key={dish.id} className="group hover:bg-surface-2 transition-colors border-l-2 border-l-transparent hover:border-l-accent">
                    <td className="px-6 py-3.5 font-medium text-ink">{dish.name}</td>
                    <td className="px-6 py-3.5 text-ink-3">{dish.category}</td>
                    <td className="px-6 py-3.5 text-right tabular text-ink">{formatCurrency(dish.price)}</td>
                    <td className="px-6 py-3.5 text-right tabular text-ink-3">
                      {hasRecipe ? formatCurrency(Math.round(cost)) : '—'}
                    </td>
                    <td className={`px-6 py-3.5 text-right tabular font-semibold ${hasRecipe ? marginColor(pct) : 'text-ink-4'}`}>
                      {hasRecipe ? `${pct.toFixed(1)}%` : '—'}
                    </td>
                    <td className={`px-6 py-3.5 text-right tabular font-medium ${hasRecipe ? marginColor(pct) : 'text-ink-4'}`}>
                      {hasRecipe ? formatCurrency(Math.round(marginAmt)) : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => toggleDishActive(dish.id)}
                        title={dish.isActive ? 'Deactivate dish' : 'Activate dish'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                          dish.isActive ? 'bg-accent' : 'bg-surface-3'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
                          dish.isActive ? 'translate-x-4' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => toggleSoldOut(dish.id)}
                        title={isSoldOutToday ? 'Mark as available' : 'Mark as sold out today (auto-resets tomorrow)'}
                        className={`inline-flex items-center justify-center h-6 min-w-[2rem] px-1.5 rounded text-xs font-bold transition-colors duration-200 focus:outline-none ${
                          isSoldOutToday
                            ? 'bg-warn/20 text-warn border border-warn/40'
                            : 'bg-surface-2 text-ink-4 border border-hair hover:border-warn/40 hover:text-warn'
                        }`}
                      >
                        86
                      </button>
                    </td>
                    <td className="px-2 py-3.5">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => openRecipeEditor(dish)}
                          className="text-xs text-ink-3 hover:text-accent transition-colors px-2.5 py-1 rounded-md border border-hair hover:border-accent whitespace-nowrap font-medium"
                        >
                          Recipe
                        </button>
                        <button
                          onClick={() => openEditDish(dish)}
                          className="text-ink-4 hover:text-accent transition-colors p-1 rounded"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish.id, dish.name)}
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

      {/* Dish modal */}
      <Modal
        open={dishOpen}
        onClose={() => setDishOpen(false)}
        title={editingDish ? 'Edit dish' : 'Add dish'}
        icon={editingDish
          ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          : <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        }
      >
        <form onSubmit={handleDishSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Name</label>
            <input
              type="text"
              required
              value={dishForm.name}
              onChange={e => setDishForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Chicken Adobo"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Category</label>
              <input
                type="text"
                list="dish-categories"
                value={dishForm.category}
                onChange={e => setDishForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm focus:outline-none focus:border-accent transition-colors"
                placeholder="Mains"
              />
              <datalist id="dish-categories">
                {DISH_CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Price (₱)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={dishForm.price}
                onChange={e => setDishForm(f => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-hair text-ink text-sm tabular focus:outline-none focus:border-accent transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>
          {dishError && <p className="text-sm text-danger">{dishError}</p>}
          <button
            type="submit"
            disabled={dishLoading}
            className="w-full py-2.5 btn-primary rounded-lg"
          >
            {dishLoading ? 'Saving…' : editingDish ? 'Update dish' : 'Add dish'}
          </button>
        </form>
      </Modal>

      {/* Recipe editor modal */}
      <Modal
        open={recipeOpen}
        onClose={() => setRecipeOpen(false)}
        title={`Recipe: ${recipeDish?.name ?? ''}`}
      >
        {ingredients.length === 0 ? (
          <div className="py-6 text-center text-sm text-ink-3">
            Add ingredients first before building a recipe.
          </div>
        ) : (
          <form onSubmit={handleSaveRecipe} className="space-y-4">
            {/* Ingredient rows */}
            <div className="space-y-2">
              {recipeRows.map((row) => {
                const ing = ingredients.find(i => i.id === row.ingredientId)
                const rowCost = ing ? (parseFloat(row.qty) || 0) * ing.costPerUnit : 0
                return (
                  <div key={row.key} className="flex gap-2 items-center">
                    <select
                      value={row.ingredientId}
                      onChange={e => updateRow(row.key, 'ingredientId', e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-canvas border border-hair text-ink text-sm focus:outline-none focus:border-accent transition-colors"
                    >
                      {ingredients.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={row.qty}
                      onChange={e => updateRow(row.key, 'qty', e.target.value)}
                      className="w-20 shrink-0 px-3 py-2 rounded-lg bg-canvas border border-hair text-ink text-sm tabular focus:outline-none focus:border-accent transition-colors"
                      placeholder="Qty"
                    />
                    <span className="text-xs text-ink-4 w-8 shrink-0">{ing?.unit ?? ''}</span>
                    <span className="text-xs tabular text-ink-3 w-16 text-right shrink-0">
                      {formatCurrency(Math.round(rowCost))}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRecipeRow(row.key)}
                      className="text-ink-4 hover:text-danger transition-colors px-1 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={addRecipeRow}
              className="text-sm text-accent hover:text-accent-2 transition-colors"
            >
              + Add ingredient
            </button>

            {/* Cost summary card */}
            <div className="rounded-lg bg-surface-2 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-3">Food cost</span>
                <span className="tabular font-medium text-ink">{formatCurrency(Math.round(liveCost))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">Selling price</span>
                <span className="tabular font-medium text-ink">{formatCurrency(recipeDish?.price ?? 0)}</span>
              </div>
              {recipeDish && recipeDish.price > 0 && (
                <div className="flex justify-between border-t border-hair pt-2">
                  <span className="text-ink-3">Margin</span>
                  <span className={`tabular font-semibold ${marginColor(marginPct(recipeDish.price, liveCost))}`}>
                    {marginPct(recipeDish.price, liveCost).toFixed(1)}%
                    {' · '}
                    {formatCurrency(Math.round(recipeDish.price - liveCost))}
                  </span>
                </div>
              )}
            </div>

            {/* What-if price tester */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                Test a price
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={whatIfPrice}
                  onChange={e => setWhatIfPrice(e.target.value)}
                  className="w-36 px-3 py-2 rounded-lg bg-canvas border border-hair text-ink text-sm tabular focus:outline-none focus:border-accent transition-colors"
                  placeholder="0.00"
                />
                {whatIfCents > 0 && (
                  <span className={`text-sm font-semibold ${marginColor(whatIfMarginPct)}`}>
                    → {whatIfMarginPct.toFixed(1)}% · {formatCurrency(Math.round(whatIfMarginCents))}
                  </span>
                )}
              </div>
            </div>

            {recipeError && <p className="text-sm text-danger">{recipeError}</p>}
            <button
              type="submit"
              disabled={recipeLoading}
              className="w-full py-2.5 btn-primary rounded-lg"
            >
              {recipeLoading ? 'Saving…' : 'Save recipe'}
            </button>
          </form>
        )}
      </Modal>
    </>
  )
}
