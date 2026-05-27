import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { accounts, users, venues, sales, expenses, ingredients, dishes, saleItems, wasteLogs, payrollRuns } from '@/lib/db/schema'
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { checkRateLimit } from '@/lib/ai/rate-limiter'
import { getDailyTokenBudget, getTokensUsedToday } from '@/lib/plan'

const anthropic = new Anthropic()

type ToolInput = Record<string, string | undefined>

async function getContext() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const [result] = await db
    .select({ venue: venues, account: accounts })
    .from(users)
    .innerJoin(venues,   eq(venues.accountId,   users.accountId))
    .innerJoin(accounts, eq(accounts.id,         users.accountId))
    .where(eq(users.id, session.user.id))
    .limit(1)
  return result ?? null
}

async function incrementTokens(accountId: string, tokens: number) {
  const today = new Date().toLocaleDateString('en-CA')
  const [current] = await db
    .select({ aiTokensDate: accounts.aiTokensDate, aiTokensToday: accounts.aiTokensToday })
    .from(accounts).where(eq(accounts.id, accountId)).limit(1)
  if (!current) return
  const alreadyToday = current.aiTokensDate === today
  await db.update(accounts).set({
    aiTokensToday: alreadyToday ? (current.aiTokensToday + tokens) : tokens,
    aiTokensDate:  today,
  }).where(eq(accounts.id, accountId))
}

async function executeTool(name: string, input: ToolInput, venueId: string): Promise<string> {
  try {
    switch (name) {
      case 'get_sales_summary': {
        const start = new Date(input.start_date + 'T00:00:00Z')
        const end   = new Date(input.end_date   + 'T23:59:59Z')
        const [rev] = await db
          .select({
            total: sql<string>`coalesce(sum(${sales.total}), 0)`,
            count: sql<string>`count(*)`,
          })
          .from(sales)
          .where(and(eq(sales.venueId, venueId), gte(sales.soldAt, start), lte(sales.soldAt, end)))
        const byChannel = await db
          .select({
            channel: sales.channel,
            total:   sql<string>`coalesce(sum(${sales.total}), 0)`,
          })
          .from(sales)
          .where(and(eq(sales.venueId, venueId), gte(sales.soldAt, start), lte(sales.soldAt, end)))
          .groupBy(sales.channel)
        return JSON.stringify({
          revenue_php:       (Number(rev.total) / 100).toFixed(2),
          transaction_count: Number(rev.count),
          by_channel:        Object.fromEntries(byChannel.map(r => [r.channel, (Number(r.total) / 100).toFixed(2)])),
        })
      }

      case 'get_expense_summary': {
        const start    = input.start_date!
        const end      = input.end_date!
        const category = input.category
        const byCategory = await db
          .select({
            category: expenses.category,
            total:    sql<string>`coalesce(sum(${expenses.amount}), 0)`,
          })
          .from(expenses)
          .where(and(
            eq(expenses.venueId, venueId),
            gte(expenses.expensedAt, start),
            lte(expenses.expensedAt, end),
            category ? sql`${expenses.category} = ${category}` : undefined,
          ))
          .groupBy(expenses.category)
        const grandTotal = byCategory.reduce((s, r) => s + Number(r.total), 0)
        return JSON.stringify({
          total_php:   (grandTotal / 100).toFixed(2),
          by_category: Object.fromEntries(byCategory.map(r => [r.category, (Number(r.total) / 100).toFixed(2)])),
        })
      }

      case 'get_profit_summary': {
        const start   = input.start_date!
        const end     = input.end_date!
        const startTs = new Date(start + 'T00:00:00Z')
        const endTs   = new Date(end   + 'T23:59:59Z')
        const [[rev], [exp]] = await Promise.all([
          db.select({ total: sql<string>`coalesce(sum(${sales.total}), 0)` })
            .from(sales)
            .where(and(eq(sales.venueId, venueId), gte(sales.soldAt, startTs), lte(sales.soldAt, endTs))),
          db.select({ total: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
            .from(expenses)
            .where(and(eq(expenses.venueId, venueId), gte(expenses.expensedAt, start), lte(expenses.expensedAt, end))),
        ])
        const revenue  = Number(rev.total)
        const totalExp = Number(exp.total)
        const profit   = revenue - totalExp
        return JSON.stringify({
          revenue_php:       (revenue / 100).toFixed(2),
          total_expenses_php: (totalExp / 100).toFixed(2),
          gross_profit_php:  (profit / 100).toFixed(2),
          gross_margin_pct:  revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0',
        })
      }

      case 'get_dish_margins': {
        const dishRows = await db.query.dishes.findMany({
          where: eq(dishes.venueId, venueId),
          with: { recipeItems: { with: { ingredient: true } } },
        })
        const result = dishRows
          .map(d => {
            const cost = d.recipeItems
              .filter(ri => ri.ingredient != null)
              .reduce((s, ri) => s + Number(ri.qty) * ri.ingredient!.costPerUnit, 0)
            const pct = d.price > 0 ? ((d.price - cost) / d.price) * 100 : 0
            return {
              name:         d.name,
              category:     d.category,
              price_php:    (d.price / 100).toFixed(2),
              food_cost_php: (Math.round(cost) / 100).toFixed(2),
              margin_pct:   pct.toFixed(1),
              margin_php:   ((d.price - Math.round(cost)) / 100).toFixed(2),
              has_recipe:   d.recipeItems.length > 0,
            }
          })
          .sort((a, b) => parseFloat(a.margin_pct) - parseFloat(b.margin_pct))
        return JSON.stringify(result)
      }

      case 'get_top_dishes': {
        const start = new Date(input.start_date + 'T00:00:00Z')
        const end   = new Date(input.end_date   + 'T23:59:59Z')
        const rows = await db
          .select({
            dishName:     dishes.name,
            category:     dishes.category,
            totalQty:     sql<string>`sum(${saleItems.qty})::text`,
            totalRevenue: sql<string>`sum(${saleItems.qty} * ${saleItems.unitPrice})::text`,
          })
          .from(saleItems)
          .innerJoin(sales,  eq(saleItems.saleId, sales.id))
          .innerJoin(dishes, eq(saleItems.dishId, dishes.id))
          .where(and(eq(sales.venueId, venueId), gte(sales.soldAt, start), lte(sales.soldAt, end)))
          .groupBy(dishes.name, dishes.category)
          .orderBy(desc(sql`sum(${saleItems.qty})`))
          .limit(10)
        return JSON.stringify(rows.map(r => ({
          dish:        r.dishName,
          category:    r.category,
          units_sold:  Number(r.totalQty),
          revenue_php: (Number(r.totalRevenue) / 100).toFixed(2),
        })))
      }

      case 'get_waste_summary': {
        const start = input.start_date!
        const end   = input.end_date!
        const rows = await db
          .select({
            reason:       wasteLogs.reason,
            totalCost:    sql<string>`coalesce(sum(${wasteLogs.estimatedCost}), 0)`,
            totalEntries: sql<string>`count(*)`,
          })
          .from(wasteLogs)
          .where(and(
            eq(wasteLogs.venueId, venueId),
            gte(wasteLogs.wastedAt, start),
            lte(wasteLogs.wastedAt, end),
          ))
          .groupBy(wasteLogs.reason)
        const totalCost = rows.reduce((s, r) => s + Number(r.totalCost), 0)
        return JSON.stringify({
          total_waste_cost_php: (totalCost / 100).toFixed(2),
          by_reason: Object.fromEntries(rows.map(r => [
            r.reason,
            { cost_php: (Number(r.totalCost) / 100).toFixed(2), entries: Number(r.totalEntries) },
          ])),
        })
      }

      case 'get_payroll_summary': {
        const start = input.start_date!
        const end   = input.end_date!
        const runs = await db
          .select({
            periodStart:     payrollRuns.periodStart,
            periodEnd:       payrollRuns.periodEnd,
            totalGross:      payrollRuns.totalGross,
            totalDeductions: payrollRuns.totalDeductions,
            totalNet:        payrollRuns.totalNet,
          })
          .from(payrollRuns)
          .where(and(
            eq(payrollRuns.venueId, venueId),
            gte(payrollRuns.periodStart, start),
            lte(payrollRuns.periodEnd, end),
          ))
        const totalNet   = runs.reduce((s, r) => s + r.totalNet, 0)
        const totalGross = runs.reduce((s, r) => s + r.totalGross, 0)
        return JSON.stringify({
          payroll_runs:    runs.length,
          total_gross_php: (totalGross / 100).toFixed(2),
          total_net_php:   (totalNet / 100).toFixed(2),
          runs: runs.map(r => ({
            period:    `${r.periodStart} to ${r.periodEnd}`,
            gross_php: (r.totalGross / 100).toFixed(2),
            net_php:   (r.totalNet / 100).toFixed(2),
          })),
        })
      }

      case 'get_low_stock': {
        const rows = await db
          .select({
            name:      ingredients.name,
            unit:      ingredients.unit,
            stock:     ingredients.stockQty,
            threshold: ingredients.lowStockThreshold,
          })
          .from(ingredients)
          .where(eq(ingredients.venueId, venueId))
        const low = rows.filter(r =>
          parseFloat(r.threshold) > 0 && parseFloat(r.stock) <= parseFloat(r.threshold)
        )
        return JSON.stringify(low.map(r => ({
          name:      r.name,
          unit:      r.unit,
          stock:     parseFloat(r.stock),
          threshold: parseFloat(r.threshold),
        })))
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` })
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) })
  }
}

// Cache breakpoint on the last tool so Claude caches system + all tools on repeat turns
type ToolWithCache = Anthropic.Messages.Tool & { cache_control?: { type: 'ephemeral' } }

const TOOLS: ToolWithCache[] = [
  {
    name: 'get_sales_summary',
    description: 'Get total revenue and transaction count for a date range, broken down by channel.',
    input_schema: {
      type: 'object' as const,
      properties: {
        start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
        end_date:   { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_expense_summary',
    description: 'Get total expenses for a date range, broken down by category. Optionally filter by a single category.',
    input_schema: {
      type: 'object' as const,
      properties: {
        start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
        end_date:   { type: 'string', description: 'End date YYYY-MM-DD' },
        category:   { type: 'string', description: 'Optional filter: ingredients, labor, rent, utilities, marketing, other' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_profit_summary',
    description: 'Get revenue, total expenses, gross profit, and gross margin % for a date range.',
    input_schema: {
      type: 'object' as const,
      properties: {
        start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
        end_date:   { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_dish_margins',
    description: 'Get all menu dishes with price, food cost, and margin %, sorted lowest to highest margin.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_top_dishes',
    description: 'Get top-selling dishes by units sold for a date range, with revenue per dish.',
    input_schema: {
      type: 'object' as const,
      properties: {
        start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
        end_date:   { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_waste_summary',
    description: 'Get total waste cost for a date range, broken down by reason (spoilage, overcooked, dropped, expired, other).',
    input_schema: {
      type: 'object' as const,
      properties: {
        start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
        end_date:   { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_payroll_summary',
    description: 'Get payroll run totals (gross pay, deductions, net pay) for a date range.',
    input_schema: {
      type: 'object' as const,
      properties: {
        start_date: { type: 'string', description: 'Earliest period_start to include YYYY-MM-DD' },
        end_date:   { type: 'string', description: 'Latest period_end to include YYYY-MM-DD' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_low_stock',
    description: 'Get all ingredients currently below their low-stock threshold.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    cache_control: { type: 'ephemeral' },
  },
]

export async function POST(req: Request) {
  const ctx = await getContext()
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { venue, account } = ctx

  if (!checkRateLimit(venue.id))
    return Response.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })

  const tokensUsed  = getTokensUsedToday(account)
  const tokenBudget = getDailyTokenBudget(account)
  if (tokensUsed >= tokenBudget) {
    return Response.json({
      error: 'Daily AI limit reached. Upgrade to Pro for 15× more messages.',
    }, { status: 429 })
  }

  let body: { messages?: unknown }
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const raw = body.messages
  if (!Array.isArray(raw) || raw.length === 0) return Response.json({ error: 'messages required' }, { status: 400 })
  const messages = raw.filter(
    (m): m is { role: 'user' | 'assistant'; content: string } =>
      typeof m === 'object' && m !== null &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string'
  )
  if (messages.length === 0) return Response.json({ error: 'No valid messages' }, { status: 400 })

  const today    = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: venue.timezone,
  })
  const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: venue.timezone })

  const systemText = `You are a concise business operations assistant for ${venue.name} using Sizzle.
Currency: Philippine Peso (₱). Today is ${today} (${todayISO}).
Always call the relevant function to get real data before answering. Never guess figures.
Be concise: 1-3 sentences for simple questions, a short list for comparisons.
Format currency as ₱X,XXX.XX. Format percentages as X.X%.`

  const anthropicMessages: Anthropic.Messages.MessageParam[] = messages.map(m => ({
    role: m.role,
    content: m.content,
  }))

  let iterations = 0
  while (iterations++ < 6) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [{
        type: 'text',
        text: systemText,
        cache_control: { type: 'ephemeral' },
      }],
      tools: TOOLS as Anthropic.Messages.Tool[],
      messages: anthropicMessages,
    })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text')
      const totalTokens = (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0)
      void incrementTokens(account.id, totalTokens)
      return Response.json({ reply: textBlock?.type === 'text' ? textBlock.text : '' })
    }

    if (response.stop_reason !== 'tool_use') break

    // Add the full assistant response (may contain text + tool_use blocks)
    anthropicMessages.push({ role: 'assistant', content: response.content })

    // Execute all tool calls and collect results
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue
      const result = await executeTool(block.name, block.input as ToolInput, venue.id)
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
    }

    anthropicMessages.push({ role: 'user', content: toolResults })
  }

  return Response.json({ reply: 'I was unable to complete the request. Please try again.' })
}
