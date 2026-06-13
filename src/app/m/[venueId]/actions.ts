'use server'

import { db } from '@/lib/db'
import { venues, dishes, sales, saleItems, recipeItems, ingredients } from '@/lib/db/schema'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { requireVenue } from '@/lib/queries/auth'
import { revalidatePath } from 'next/cache'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Abuse caps on the PUBLIC endpoint.
const MAX_LINE_ITEMS = 40
const MAX_QTY_PER_ITEM = 50

export type OnlineOrderInput = {
  items: { dishId: string; qty: number }[]
  customerName: string
  customerPhone: string
  channel?: 'takeout' | 'delivery'
  note?: string
  paymentRef?: string
}
export type OnlineOrderResult =
  | { ok: true; total: number; itemCount: number }
  | { ok: false; error: string }

/**
 * PUBLIC, unauthenticated. Called from the QR-menu cart. Trusts NOTHING from
 * the client except dish ids + quantities: it re-validates the venue, loads the
 * real dishes from the DB, recomputes the total from DB prices, and snapshots
 * the recipe cost. The order lands PENDING (is_online + unpaid, not yet on the
 * KDS, no stock deducted) — the owner confirms it after verifying the GCash
 * payment (see confirmOnlineOrder), which is when stock deducts and it hits the
 * kitchen. This protects inventory from spam against a public endpoint.
 */
export async function createOnlineOrder(venueId: string, input: OnlineOrderInput): Promise<OnlineOrderResult> {
  if (!UUID_RE.test(venueId)) return { ok: false, error: 'Invalid venue.' }

  const name = (input.customerName || '').trim()
  const phone = (input.customerPhone || '').trim()
  if (name.length < 2) return { ok: false, error: 'Please enter your name.' }
  if (phone.replace(/\D/g, '').length < 7) return { ok: false, error: 'Please enter a valid phone number.' }

  // Normalize + cap the requested items.
  const reqMap = new Map<string, number>()
  for (const it of input.items || []) {
    if (!UUID_RE.test(it.dishId)) continue
    const qty = Math.floor(Number(it.qty))
    if (!Number.isFinite(qty) || qty < 1) continue
    reqMap.set(it.dishId, Math.min(MAX_QTY_PER_ITEM, (reqMap.get(it.dishId) ?? 0) + qty))
  }
  if (reqMap.size === 0) return { ok: false, error: 'Your cart is empty.' }
  if (reqMap.size > MAX_LINE_ITEMS) return { ok: false, error: 'Too many items in one order.' }

  // Venue must exist and have online ordering ON.
  const [venue] = await db
    .select({ id: venues.id, enabled: venues.onlineOrderingEnabled })
    .from(venues).where(eq(venues.id, venueId)).limit(1)
  if (!venue) return { ok: false, error: 'Venue not found.' }
  if (!venue.enabled) return { ok: false, error: 'This venue is not accepting online orders right now.' }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const dishIds = [...reqMap.keys()]

  // Load the real dishes — only this venue's active, non-sold-out items.
  const dishRows = await db
    .select({ id: dishes.id, name: dishes.name, price: dishes.price, soldOutDate: dishes.soldOutDate })
    .from(dishes)
    .where(and(eq(dishes.venueId, venueId), eq(dishes.isActive, true), inArray(dishes.id, dishIds)))
  const valid = dishRows.filter(d => d.soldOutDate !== today)
  if (valid.length === 0) return { ok: false, error: 'None of those items are available.' }

  // Recipe cost per dish (snapshot), computed from DB — never from the client.
  const recipes = await db
    .select({ dishId: recipeItems.dishId, qty: recipeItems.qty, costPerUnit: ingredients.costPerUnit })
    .from(recipeItems)
    .innerJoin(ingredients, eq(recipeItems.ingredientId, ingredients.id))
    .where(inArray(recipeItems.dishId, valid.map(d => d.id)))
  const costByDish = new Map<string, number>()
  for (const r of recipes) {
    costByDish.set(r.dishId, (costByDish.get(r.dishId) ?? 0) + Number(r.qty) * r.costPerUnit)
  }

  // Build line items + recompute total from DB prices.
  let total = 0
  const lines = valid.map(d => {
    const qty = reqMap.get(d.id)!
    total += d.price * qty
    return { dishId: d.id, qty, unitPrice: d.price, unitCost: Math.round(costByDish.get(d.id) ?? 0) }
  })
  if (total <= 0) return { ok: false, error: 'Order total is invalid.' }

  const channel = input.channel === 'delivery' ? 'delivery' : 'takeout'
  const note = (input.note || '').trim().slice(0, 280) || null
  const ref = (input.paymentRef || '').trim().slice(0, 60) || null

  await db.transaction(async tx => {
    const [order] = await tx.insert(sales).values({
      venueId,
      channel,
      total,
      note,
      customerName: name.slice(0, 80),
      customerPhone: phone.slice(0, 30),
      paymentRef: ref,
      isOnline: true,
      isPaid: false,            // owner verifies GCash, then confirms
      kitchenStatus: 'served',  // not on KDS until confirmed
    }).returning({ id: sales.id })

    await tx.insert(saleItems).values(
      lines.map(l => ({ saleId: order.id, dishId: l.dishId, qty: l.qty, unitPrice: l.unitPrice, unitCost: l.unitCost }))
    )
  })

  revalidatePath('/sales')
  revalidatePath('/dashboard')
  return { ok: true, total, itemCount: lines.reduce((s, l) => s + l.qty, 0) }
}

/**
 * OWNER ONLY. Confirms a pending online order after the GCash payment is
 * verified: marks it paid, sends it to the kitchen, and deducts ingredient
 * stock (the same way logSale does). Scoped to the owner's venue.
 */
export async function confirmOnlineOrder(saleId: string): Promise<{ ok: boolean; error?: string }> {
  if (!UUID_RE.test(saleId)) return { ok: false, error: 'Invalid order.' }
  const { venue } = await requireVenue()

  await db.transaction(async tx => {
    const [order] = await tx.select({ id: sales.id })
      .from(sales)
      .where(and(eq(sales.id, saleId), eq(sales.venueId, venue.id), eq(sales.isOnline, true), eq(sales.isPaid, false)))
      .limit(1)
    if (!order) throw new Error('not_found')

    const items = await tx.select({ dishId: saleItems.dishId, qty: saleItems.qty })
      .from(saleItems).where(eq(saleItems.saleId, saleId))

    await tx.update(sales)
      .set({ isPaid: true, kitchenStatus: 'new' })
      .where(eq(sales.id, saleId))

    const dishIds = items.map(i => i.dishId).filter((x): x is string => !!x)
    if (dishIds.length) {
      const recipes = await tx.select({ dishId: recipeItems.dishId, ingredientId: recipeItems.ingredientId, qty: recipeItems.qty })
        .from(recipeItems).where(inArray(recipeItems.dishId, dishIds))
      const deductions = new Map<string, number>()
      for (const r of recipes) {
        const sold = items.find(i => i.dishId === r.dishId)
        if (!sold) continue
        deductions.set(r.ingredientId, (deductions.get(r.ingredientId) ?? 0) + Number(r.qty) * sold.qty)
      }
      for (const [ingredientId, deduction] of deductions) {
        await tx.update(ingredients)
          .set({ stockQty: sql`GREATEST('0'::numeric, ${ingredients.stockQty}::numeric - ${String(deduction)}::numeric)`, updatedAt: new Date() })
          .where(and(eq(ingredients.id, ingredientId), eq(ingredients.venueId, venue.id)))
      }
    }
  }).catch(e => { if ((e as Error).message !== 'not_found') throw e })

  revalidatePath('/sales'); revalidatePath('/inventory'); revalidatePath('/dashboard'); revalidatePath('/kds')
  return { ok: true }
}

/** OWNER ONLY. Rejects/voids a pending online order (no stock was deducted). */
export async function rejectOnlineOrder(saleId: string): Promise<{ ok: boolean; error?: string }> {
  if (!UUID_RE.test(saleId)) return { ok: false, error: 'Invalid order.' }
  const { venue } = await requireVenue()
  await db.delete(sales)
    .where(and(eq(sales.id, saleId), eq(sales.venueId, venue.id), eq(sales.isOnline, true), eq(sales.isPaid, false)))
  revalidatePath('/sales'); revalidatePath('/dashboard')
  return { ok: true }
}
