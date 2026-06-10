'use server'

import { db } from '@/lib/db'
import { sales, saleItems, dishes } from '@/lib/db/schema'
import { and, eq, ne, asc, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireVenue } from '@/lib/queries/auth'

export interface KdsTicket {
  saleId:        string
  receivedAt:    string  // ISO
  channel:       'dine_in' | 'takeout' | 'delivery' | 'other'
  customerName:  string | null
  note:          string | null
  total:         number
  status:        'new' | 'preparing' | 'ready' | 'served'
  startedAt:     string | null
  readyAt:       string | null
  items: {
    dishName: string
    qty:      number
  }[]
}

/**
 * Returns every active kitchen ticket for the venue (any non-served sale).
 * Uses the partial index sales_venue_kitchen_active_idx for cheap polling.
 */
export async function getActiveTickets(): Promise<KdsTicket[]> {
  const { venue } = await requireVenue()

  const ticketRows = await db
    .select({
      saleId:       sales.id,
      receivedAt:   sales.soldAt,
      channel:      sales.channel,
      customerName: sales.customerName,
      note:         sales.note,
      total:        sales.total,
      status:       sales.kitchenStatus,
      startedAt:    sales.kitchenStartedAt,
      readyAt:      sales.kitchenReadyAt,
    })
    .from(sales)
    .where(and(eq(sales.venueId, venue.id), ne(sales.kitchenStatus, 'served')))
    .orderBy(asc(sales.soldAt))
    .limit(80)

  if (ticketRows.length === 0) return []

  const ids = ticketRows.map(t => t.saleId)
  const itemRows = await db
    .select({
      saleId:   saleItems.saleId,
      dishName: dishes.name,
      qty:      saleItems.qty,
    })
    .from(saleItems)
    .leftJoin(dishes, eq(saleItems.dishId, dishes.id))
    .where(sql`${saleItems.saleId} = ANY(${ids})`)

  const byId = new Map<string, { dishName: string; qty: number }[]>()
  for (const it of itemRows) {
    const list = byId.get(it.saleId) ?? []
    list.push({ dishName: it.dishName ?? 'Item', qty: it.qty })
    byId.set(it.saleId, list)
  }

  return ticketRows.map(t => ({
    saleId:       t.saleId,
    receivedAt:   t.receivedAt.toISOString(),
    channel:      t.channel,
    customerName: t.customerName,
    note:         t.note,
    total:        t.total,
    status:       t.status,
    startedAt:    t.startedAt ? t.startedAt.toISOString() : null,
    readyAt:      t.readyAt ? t.readyAt.toISOString() : null,
    items:        byId.get(t.saleId) ?? [],
  }))
}

async function transitionTicket(
  saleId: string,
  to: 'new' | 'preparing' | 'ready' | 'served',
): Promise<{ error?: string }> {
  const { venue } = await requireVenue()

  const set: Record<string, unknown> = { kitchenStatus: to }
  const now = new Date()
  if (to === 'preparing') set.kitchenStartedAt = now
  if (to === 'ready')     set.kitchenReadyAt   = now
  if (to === 'served')    set.kitchenServedAt  = now
  if (to === 'new') {
    set.kitchenStartedAt = null
    set.kitchenReadyAt   = null
    set.kitchenServedAt  = null
  }

  const res = await db.update(sales)
    .set(set)
    .where(and(eq(sales.id, saleId), eq(sales.venueId, venue.id)))
    .returning({ id: sales.id })

  if (res.length === 0) return { error: 'Ticket not found.' }

  revalidatePath('/kds')
  revalidatePath('/sales')
  return {}
}

export async function markPreparing(saleId: string) { return transitionTicket(saleId, 'preparing') }
export async function markReady(saleId: string)     { return transitionTicket(saleId, 'ready') }
export async function markServed(saleId: string)    { return transitionTicket(saleId, 'served') }
export async function reopenTicket(saleId: string)  { return transitionTicket(saleId, 'new') }

/**
 * Bulk-clear all served tickets older than ~10 minutes (used by the auto-archive
 * UI hint). v1: just no-op convenience — the partial index already excludes
 * 'served' from KDS reads, so this is purely cosmetic if a server actor needs it.
 */
