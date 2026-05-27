import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { and, eq, gte, lt } from 'drizzle-orm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Vercel cron sends "Authorization: Bearer <CRON_SECRET>"
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const nowManila   = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  const todayStr    = nowManila.toLocaleDateString('en-CA')        // YYYY-MM-DD
  const manilaDay   = nowManila.getDate()
  const monthStart  = todayStr.slice(0, 7) + '-01'
  const nextMonth   = new Date(nowManila.getFullYear(), nowManila.getMonth() + 1, 1)
  const nextMonthStart = nextMonth.toLocaleDateString('en-CA')

  // All recurring expense templates whose recurrenceDay = today's day
  const templates = await db.select().from(expenses)
    .where(and(eq(expenses.isRecurring, true), eq(expenses.recurrenceDay, manilaDay)))

  let created = 0
  let skipped = 0

  for (const tmpl of templates) {
    // Skip if an expense with same venue + category + amount already exists this calendar month
    const existing = await db.select({ id: expenses.id }).from(expenses)
      .where(and(
        eq(expenses.venueId, tmpl.venueId),
        eq(expenses.category, tmpl.category),
        eq(expenses.amount,   tmpl.amount),
        gte(expenses.expensedAt, monthStart),
        lt(expenses.expensedAt,  nextMonthStart),
      ))
      .limit(1)

    if (existing.length > 0) { skipped++; continue }

    await db.insert(expenses).values({
      venueId:       tmpl.venueId,
      userId:        tmpl.userId,
      category:      tmpl.category,
      amount:        tmpl.amount,
      vendor:        tmpl.vendor,
      note:          tmpl.note,
      expensedAt:    todayStr,
      isRecurring:   true,
      recurrenceDay: tmpl.recurrenceDay,
    })
    created++
  }

  return NextResponse.json({ ok: true, created, skipped, day: manilaDay })
}
