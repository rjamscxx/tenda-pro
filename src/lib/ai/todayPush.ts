import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import { accounts, sales, saleItems, dishes, ingredients } from '@/lib/db/schema'
import { and, eq, sql, desc } from 'drizzle-orm'

const PHP = (cents: number) => `₱${(cents/100).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`

/**
 * Gathers a compact snapshot for the prompt — kept small so the call is fast
 * and cheap. The AI is asked for ONE actionable sentence about today.
 */
async function buildContext(venueId: string) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const todayStart = new Date(`${today}T00:00:00+08:00`)
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000)
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 86_400_000)

  const [todayAgg, weekAgg, top, lowStock, dishCosts] = await Promise.all([
    db.select({
      revenue: sql<string>`coalesce(sum(${sales.total}::bigint), 0)`,
      tickets: sql<string>`count(*)`,
    }).from(sales).where(and(
      eq(sales.venueId, venueId),
      sql`${sales.soldAt} >= ${todayStart.toISOString()}`,
      sql`${sales.soldAt} <  ${tomorrowStart.toISOString()}`,
    )),
    db.select({
      revenue: sql<string>`coalesce(sum(${sales.total}::bigint), 0)`,
      tickets: sql<string>`count(*)`,
    }).from(sales).where(and(
      eq(sales.venueId, venueId),
      sql`${sales.soldAt} >= ${sevenDaysAgo.toISOString()}`,
      sql`${sales.soldAt} <  ${todayStart.toISOString()}`,
    )),
    db.select({
      name: dishes.name,
      qty:  sql<string>`sum(${saleItems.qty})::int`,
    })
      .from(saleItems)
      .innerJoin(sales,  eq(saleItems.saleId, sales.id))
      .innerJoin(dishes, eq(saleItems.dishId, dishes.id))
      .where(and(
        eq(sales.venueId, venueId),
        sql`${sales.soldAt} >= ${todayStart.toISOString()}`,
        sql`${sales.soldAt} <  ${tomorrowStart.toISOString()}`,
      ))
      .groupBy(dishes.name)
      .orderBy(desc(sql`sum(${saleItems.qty})`))
      .limit(3),
    db.select({
      name:      ingredients.name,
      stockQty:  ingredients.stockQty,
      lowStock:  ingredients.lowStockThreshold,
      unit:      ingredients.unit,
    }).from(ingredients).where(and(
      eq(ingredients.venueId, venueId),
      sql`${ingredients.stockQty}::numeric <= ${ingredients.lowStockThreshold}::numeric`,
      sql`${ingredients.lowStockThreshold}::numeric > 0`,
    )),
    db.select({
      name:     dishes.name,
      price:    dishes.price,
      avgCost:  sql<string>`coalesce(avg(${saleItems.unitCost})::int, 0)`,
    })
      .from(dishes)
      .leftJoin(saleItems, eq(saleItems.dishId, dishes.id))
      .where(and(eq(dishes.venueId, venueId), eq(dishes.isActive, true)))
      .groupBy(dishes.id, dishes.name, dishes.price)
      .limit(20),
  ])

  const todayRev   = Number(todayAgg[0].revenue)
  const todayCnt   = Number(todayAgg[0].tickets)
  const weekRev    = Number(weekAgg[0].revenue)
  const weekCnt    = Number(weekAgg[0].tickets)
  const dailyAvg   = weekCnt > 0 ? Math.round(weekRev / 7) : 0

  const margins = dishCosts.map(d => ({
    name: d.name,
    price: d.price,
    cost: Number(d.avgCost),
    marginPct: d.price > 0 ? Math.round(((d.price - Number(d.avgCost)) / d.price) * 100) : 0,
  })).sort((a, b) => b.marginPct - a.marginPct).slice(0, 5)

  return `Today's revenue so far: ${PHP(todayRev)} (${todayCnt} tickets)
7-day daily average: ${PHP(dailyAvg)}
Top sellers today: ${top.length ? top.map(t => `${t.name} (×${t.qty})`).join(', ') : 'none yet'}
Low-stock now: ${lowStock.length ? lowStock.map(l => `${l.name} ${parseFloat(l.stockQty)}${l.unit.toUpperCase()} (threshold ${parseFloat(l.lowStock)}${l.unit.toUpperCase()})`).join('; ') : 'none'}
Highest-margin dishes: ${margins.map(m => `${m.name} ${m.marginPct}%`).join(', ')}`
}

/**
 * Generates a single short actionable sentence. Returns null on any error
 * so the caller can hide the card gracefully without leaking errors.
 */
export async function generateTodayPush(venueId: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const ctx = await buildContext(venueId)
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system:
        'You are a margin-obsessed café operations advisor. Read the snapshot and return ONE concrete suggestion the owner should act on TODAY — push a specific high-margin dish before stock runs out, restock something running low, or call out a slow day. Be concrete, name dishes/ingredients/numbers. ONE sentence, ≤25 words. No preamble, no markdown.',
      messages: [{ role: 'user', content: ctx }],
    })
    const block = msg.content.find(b => b.type === 'text')
    const text = block && 'text' in block ? block.text.trim() : null
    return text || null
  } catch (e) {
    console.error('generateTodayPush error:', e)
    return null
  }
}

/**
 * Cached wrapper — returns the same text all day, regenerates next day or
 * when force=true. Stores result on accounts.ai_push_text.
 */
export async function getOrGenerateTodayPush(accountId: string, venueId: string, force = false): Promise<string | null> {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  if (!force) {
    const [row] = await db.select({ text: accounts.aiPushText, date: accounts.aiPushDate })
      .from(accounts).where(eq(accounts.id, accountId)).limit(1)
    if (row?.text && row.date === today) return row.text
  }
  const text = await generateTodayPush(venueId)
  if (text) {
    await db.update(accounts)
      .set({ aiPushText: text, aiPushDate: today })
      .where(eq(accounts.id, accountId))
  }
  return text
}
