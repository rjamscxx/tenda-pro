'use server'

import { db } from '@/lib/db'
import {
  accounts, venues, users,
  auditLogs, wasteLogs, recipeItems, saleItems,
  dishes, ingredients, sales, expenses,
  employees, payrollItems, payrollRuns,
} from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireVenue } from '@/lib/queries/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const UpdateVenueSchema = z.object({
  name:                 z.string().min(1, 'Business name is required').max(120),
  timezone:             z.string().min(1).max(60),
  monthlyRevenueGoal:   z.number().int().min(0),
  monthlyExpenseBudget: z.number().int().min(0),
  dailyRevenueTarget:   z.number().int().min(0),
  foodCostTarget:       z.number().int().min(1).max(100),
  vatRegistered:        z.boolean(),
})

const UpdateProfileSchema = z.object({
  fullName: z.string().max(120),
})

export async function updateVenue(input: {
  name: string
  timezone: string
  monthlyRevenueGoal: number   // cents
  monthlyExpenseBudget: number // cents
  dailyRevenueTarget: number   // cents; 0 = auto-derive from monthly
  foodCostTarget: number       // percentage integer e.g. 35
  vatRegistered: boolean
}) {
  const parsed = UpdateVenueSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const { venue } = await requireVenue()
  const name = parsed.data.name.trim()
  if (!name) return { error: 'Business name is required' }
  await db
    .update(venues)
    .set({
      name,
      timezone: input.timezone,
      monthlyRevenueGoal:   Math.max(0, Math.round(input.monthlyRevenueGoal)),
      monthlyExpenseBudget: Math.max(0, Math.round(input.monthlyExpenseBudget)),
      dailyRevenueTarget:   Math.max(0, Math.round(input.dailyRevenueTarget)),
      foodCostTarget:       Math.min(100, Math.max(1, Math.round(input.foodCostTarget || 35))),
      vatRegistered: input.vatRegistered,
      updatedAt: new Date(),
    })
    .where(eq(venues.id, venue.id))
  revalidatePath('/settings')
  revalidatePath('/(dashboard)', 'layout')
}

export async function updateProfile(input: { fullName: string }) {
  const parsed = UpdateProfileSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const { dbUser } = await requireVenue()
  const fullName = input.fullName.trim() || null
  await db.update(users).set({ fullName }).where(eq(users.id, dbUser.id))
  revalidatePath('/settings')
}

export async function downgradeTofree() {
  const { account } = await requireVenue()
  await db.update(accounts).set({ plan: 'free', planExpiresAt: null }).where(eq(accounts.id, account.id))
  revalidatePath('/settings')
  revalidatePath('/(dashboard)', 'layout')
}

export async function deleteAccount() {
  const { authUser, venue, account } = await requireVenue()

  // 1. Payroll items (restrict FK on employees — must go first)
  const venuePayrollRuns = await db
    .select({ id: payrollRuns.id })
    .from(payrollRuns)
    .where(eq(payrollRuns.venueId, venue.id))
  if (venuePayrollRuns.length > 0) {
    const runIds = venuePayrollRuns.map(r => r.id)
    await db.delete(payrollItems).where(inArray(payrollItems.payrollRunId, runIds))
  }

  // 2. Payroll runs
  await db.delete(payrollRuns).where(eq(payrollRuns.venueId, venue.id))

  // 3. Sale items (cascade from sales, but dish FK is set null — still safe to delete first)
  const venueSales = await db
    .select({ id: sales.id })
    .from(sales)
    .where(eq(sales.venueId, venue.id))
  if (venueSales.length > 0) {
    const saleIds = venueSales.map(s => s.id)
    await db.delete(saleItems).where(inArray(saleItems.saleId, saleIds))
  }

  // 4. Recipe items (restrict FK on ingredients — must go before dishes and ingredients)
  const venueDishes = await db
    .select({ id: dishes.id })
    .from(dishes)
    .where(eq(dishes.venueId, venue.id))
  if (venueDishes.length > 0) {
    const dishIds = venueDishes.map(d => d.id)
    await db.delete(recipeItems).where(inArray(recipeItems.dishId, dishIds))
  }

  // 5. Waste logs
  await db.delete(wasteLogs).where(eq(wasteLogs.venueId, venue.id))

  // 6. Audit logs
  await db.delete(auditLogs).where(eq(auditLogs.venueId, venue.id))

  // 7. Sales
  await db.delete(sales).where(eq(sales.venueId, venue.id))

  // 8. Expenses
  await db.delete(expenses).where(eq(expenses.venueId, venue.id))

  // 9. Dishes
  await db.delete(dishes).where(eq(dishes.venueId, venue.id))

  // 10. Ingredients
  await db.delete(ingredients).where(eq(ingredients.venueId, venue.id))

  // 11. Employees (payroll items already removed above)
  await db.delete(employees).where(eq(employees.venueId, venue.id))

  // 12. Venue
  await db.delete(venues).where(eq(venues.id, venue.id))

  // 13. Users row (mirrors auth.users)
  await db.delete(users).where(eq(users.accountId, account.id))

  // 14. Account
  await db.delete(accounts).where(eq(accounts.id, account.id))

  // 15. Remove Supabase auth user — must be last
  const adminClient = createAdminClient()
  await adminClient.auth.admin.deleteUser(authUser.id)

  redirect('/')
}
