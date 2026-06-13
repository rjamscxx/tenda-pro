import type Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import {
  sales, saleItems, expenses, ingredients, dishes,
  wasteLogs, employees, payrollRuns, payrollItems,
} from '@/lib/db/schema'
import { and, eq, gte, lt, lte, desc, sql, inArray } from 'drizzle-orm'

// Tool definitions sent to Claude. Kept stable across requests so they
// can sit inside the prompt cache. Date inputs are venue-local YYYY-MM-DD.
export const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_sales_summary',
    description:
      'Total revenue, transaction count, average order value, and per-channel breakdown for a date range.',
    input_schema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Venue-local start date, YYYY-MM-DD (inclusive).' },
        end_date:   { type: 'string', description: 'Venue-local end date, YYYY-MM-DD (inclusive).' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_expense_summary',
    description: 'Total expenses and per-category breakdown for a date range.',
    input_schema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Venue-local start date, YYYY-MM-DD (inclusive).' },
        end_date:   { type: 'string', description: 'Venue-local end date, YYYY-MM-DD (inclusive).' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_profit_summary',
    description: 'Revenue minus all expenses (net profit) and gross-margin % for a date range.',
    input_schema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Venue-local start date, YYYY-MM-DD (inclusive).' },
        end_date:   { type: 'string', description: 'Venue-local end date, YYYY-MM-DD (inclusive).' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_dish_margins',
    description:
      'For every active dish: price, ingredient food cost, gross profit per unit, and margin %.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_top_dishes',
    description: 'Top-selling dishes by quantity over a date range.',
    input_schema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Venue-local start date, YYYY-MM-DD (inclusive).' },
        end_date:   { type: 'string', description: 'Venue-local end date, YYYY-MM-DD (inclusive).' },
        limit:      { type: 'number', description: 'How many dishes to return. Default 10, max 20.' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_low_stock',
    description: 'Ingredients currently at or below their low-stock threshold, plus anything out of stock.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_waste_summary',
    description: 'Total waste cost and per-reason breakdown for a date range.',
    input_schema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Venue-local start date, YYYY-MM-DD (inclusive).' },
        end_date:   { type: 'string', description: 'Venue-local end date, YYYY-MM-DD (inclusive).' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_payroll_summary',
    description: 'Total payroll cost and per-employee breakdown for payroll runs that fall in a date range.',
    input_schema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Venue-local start date, YYYY-MM-DD (inclusive).' },
        end_date:   { type: 'string', description: 'Venue-local end date, YYYY-MM-DD (inclusive).' },
      },
      required: ['start_date', 'end_date'],
    },
  },
]

// All amounts are stored in centavos; convert to pesos for the model so it doesn't
// have to do math (and so its replies talk about real ₱ values).
const fromCents = (cents: number) => Math.round(cents) / 100

// Build an inclusive [start, endExclusive) range from venue-local YYYY-MM-DD strings
// for use against the soldAt timestamp column.
function dayRange(startStr: string, endStr: string) {
  const startUtc = new Date(`${startStr}T00:00:00Z`)
  const endUtcExclusive = new Date(`${endStr}T00:00:00Z`)
  endUtcExclusive.setUTCDate(endUtcExclusive.getUTCDate() + 1)
  return { startUtc, endUtcExclusive }
}

interface ToolCtx { venueId: string }

async function getSalesSummary(ctx: ToolCtx, args: { start_date: string; end_date: string }) {
  const { startUtc, endUtcExclusive } = dayRange(args.start_date, args.end_date)

  const [agg] = await db
    .select({
      revenue: sql<string>`coalesce(sum(${sales.total}::bigint), 0)`,
      count:   sql<string>`count(*)`,
    })
    .from(sales)
    .where(and(eq(sales.venueId, ctx.venueId), gte(sales.soldAt, startUtc), lt(sales.soldAt, endUtcExclusive)))

  const byChannelRows = await db
    .select({
      channel: sales.channel,
      revenue: sql<string>`coalesce(sum(${sales.total}::bigint), 0)`,
      count:   sql<string>`count(*)`,
    })
    .from(sales)
    .where(and(eq(sales.venueId, ctx.venueId), gte(sales.soldAt, startUtc), lt(sales.soldAt, endUtcExclusive)))
    .groupBy(sales.channel)

  const revenue = Number(agg.revenue)
  const count   = Number(agg.count)
  return {
    revenue_php: fromCents(revenue),
    transaction_count: count,
    average_order_php: count > 0 ? fromCents(revenue / count) : 0,
    by_channel: byChannelRows.map(r => ({
      channel: r.channel,
      revenue_php: fromCents(Number(r.revenue)),
      transaction_count: Number(r.count),
    })),
  }
}

async function getExpenseSummary(ctx: ToolCtx, args: { start_date: string; end_date: string }) {
  const [agg] = await db
    .select({ total: sql<string>`coalesce(sum(${expenses.amount}::bigint), 0)` })
    .from(expenses)
    .where(and(
      eq(expenses.venueId, ctx.venueId),
      gte(expenses.expensedAt, args.start_date),
      lte(expenses.expensedAt, args.end_date),
    ))

  const byCategoryRows = await db
    .select({
      category: expenses.category,
      total: sql<string>`coalesce(sum(${expenses.amount}::bigint), 0)`,
    })
    .from(expenses)
    .where(and(
      eq(expenses.venueId, ctx.venueId),
      gte(expenses.expensedAt, args.start_date),
      lte(expenses.expensedAt, args.end_date),
    ))
    .groupBy(expenses.category)
    .orderBy(desc(sql`sum(${expenses.amount})`))

  return {
    total_php: fromCents(Number(agg.total)),
    by_category: byCategoryRows.map(r => ({
      category: r.category,
      amount_php: fromCents(Number(r.total)),
    })),
  }
}

async function getProfitSummary(ctx: ToolCtx, args: { start_date: string; end_date: string }) {
  const sales = await getSalesSummary(ctx, args)
  const exp   = await getExpenseSummary(ctx, args)
  const profit = sales.revenue_php - exp.total_php
  const grossMarginPct = sales.revenue_php > 0
    ? Math.round(((sales.revenue_php - exp.total_php) / sales.revenue_php) * 1000) / 10
    : null
  return {
    revenue_php: sales.revenue_php,
    expenses_php: exp.total_php,
    net_profit_php: Math.round(profit * 100) / 100,
    gross_margin_pct: grossMarginPct,
  }
}

async function getDishMargins(ctx: ToolCtx) {
  const rows = await db.query.dishes.findMany({
    where: and(eq(dishes.venueId, ctx.venueId), eq(dishes.isActive, true)),
    with: { recipeItems: { with: { ingredient: true } } },
  })
  return {
    dishes: rows.map(d => {
      const foodCostCents = d.recipeItems
        .filter(ri => ri.ingredient != null)
        .reduce((sum, ri) => sum + Number(ri.qty) * ri.ingredient!.costPerUnit, 0)
      const price = d.price
      const profit = price - foodCostCents
      const marginPct = price > 0
        ? Math.round((profit / price) * 1000) / 10
        : null
      return {
        name: d.name,
        category: d.category,
        price_php: fromCents(price),
        food_cost_php: fromCents(foodCostCents),
        profit_per_unit_php: fromCents(profit),
        margin_pct: marginPct,
      }
    }),
  }
}

async function getTopDishes(ctx: ToolCtx, args: { start_date: string; end_date: string; limit?: number }) {
  const { startUtc, endUtcExclusive } = dayRange(args.start_date, args.end_date)
  const limit = Math.min(Math.max(args.limit ?? 10, 1), 20)

  const rows = await db
    .select({
      dishName:     dishes.name,
      totalQty:     sql<string>`sum(${saleItems.qty})`,
      totalRevenue: sql<string>`sum(${saleItems.qty} * ${saleItems.unitPrice})`,
    })
    .from(saleItems)
    .innerJoin(sales,  eq(saleItems.saleId, sales.id))
    .innerJoin(dishes, eq(saleItems.dishId, dishes.id))
    .where(and(eq(sales.venueId, ctx.venueId), gte(sales.soldAt, startUtc), lt(sales.soldAt, endUtcExclusive)))
    .groupBy(dishes.name)
    .orderBy(desc(sql`sum(${saleItems.qty})`))
    .limit(limit)

  return {
    dishes: rows.map(r => ({
      name: r.dishName,
      quantity_sold: Number(r.totalQty),
      revenue_php: fromCents(Number(r.totalRevenue)),
    })),
  }
}

async function getLowStock(ctx: ToolCtx) {
  const rows = await db.select().from(ingredients).where(eq(ingredients.venueId, ctx.venueId))

  const outOfStock: { name: string; unit: string }[] = []
  const lowStock:   { name: string; unit: string; stock: number; threshold: number }[] = []

  for (const i of rows) {
    const stock = parseFloat(i.stockQty)
    const threshold = parseFloat(i.lowStockThreshold)
    if (stock <= 0) {
      outOfStock.push({ name: i.name, unit: i.unit })
    } else if (threshold > 0 && stock <= threshold) {
      lowStock.push({ name: i.name, unit: i.unit, stock, threshold })
    }
  }

  return { out_of_stock: outOfStock, low_stock: lowStock }
}

async function getWasteSummary(ctx: ToolCtx, args: { start_date: string; end_date: string }) {
  const [agg] = await db
    .select({ total: sql<string>`coalesce(sum(${wasteLogs.estimatedCost}), 0)` })
    .from(wasteLogs)
    .where(and(
      eq(wasteLogs.venueId, ctx.venueId),
      gte(wasteLogs.wastedAt, args.start_date),
      lte(wasteLogs.wastedAt, args.end_date),
    ))

  const byReasonRows = await db
    .select({
      reason: wasteLogs.reason,
      total: sql<string>`coalesce(sum(${wasteLogs.estimatedCost}), 0)`,
    })
    .from(wasteLogs)
    .where(and(
      eq(wasteLogs.venueId, ctx.venueId),
      gte(wasteLogs.wastedAt, args.start_date),
      lte(wasteLogs.wastedAt, args.end_date),
    ))
    .groupBy(wasteLogs.reason)
    .orderBy(desc(sql`sum(${wasteLogs.estimatedCost})`))

  return {
    total_php: fromCents(Number(agg.total)),
    by_reason: byReasonRows.map(r => ({
      reason: r.reason,
      amount_php: fromCents(Number(r.total)),
    })),
  }
}

async function getPayrollSummary(ctx: ToolCtx, args: { start_date: string; end_date: string }) {
  const runs = await db
    .select({ id: payrollRuns.id, totalNet: payrollRuns.totalNet, periodStart: payrollRuns.periodStart })
    .from(payrollRuns)
    .where(and(
      eq(payrollRuns.venueId, ctx.venueId),
      gte(payrollRuns.periodStart, args.start_date),
      lte(payrollRuns.periodStart, args.end_date),
    ))

  if (runs.length === 0) {
    return { total_php: 0, by_employee: [], runs: 0 }
  }

  const runIds = runs.map(r => r.id)
  const items = await db
    .select({
      employeeName: employees.fullName,
      totalNet:     sql<string>`coalesce(sum(${payrollItems.netPay}::bigint), 0)`,
    })
    .from(payrollItems)
    .innerJoin(employees, eq(payrollItems.employeeId, employees.id))
    .where(inArray(payrollItems.payrollRunId, runIds))
    .groupBy(employees.fullName)
    .orderBy(desc(sql`sum(${payrollItems.netPay})`))

  const total = runs.reduce((s, r) => s + r.totalNet, 0)
  return {
    total_php: fromCents(total),
    runs: runs.length,
    by_employee: items.map(i => ({
      name: i.employeeName,
      amount_php: fromCents(Number(i.totalNet)),
    })),
  }
}

export async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolCtx,
): Promise<unknown> {
  switch (name) {
    case 'get_sales_summary':   return getSalesSummary(ctx, args as { start_date: string; end_date: string })
    case 'get_expense_summary': return getExpenseSummary(ctx, args as { start_date: string; end_date: string })
    case 'get_profit_summary':  return getProfitSummary(ctx, args as { start_date: string; end_date: string })
    case 'get_dish_margins':    return getDishMargins(ctx)
    case 'get_top_dishes':      return getTopDishes(ctx, args as { start_date: string; end_date: string; limit?: number })
    case 'get_low_stock':       return getLowStock(ctx)
    case 'get_waste_summary':   return getWasteSummary(ctx, args as { start_date: string; end_date: string })
    case 'get_payroll_summary': return getPayrollSummary(ctx, args as { start_date: string; end_date: string })
    default: throw new Error(`Unknown tool: ${name}`)
  }
}
