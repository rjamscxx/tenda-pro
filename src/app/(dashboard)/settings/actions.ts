'use server'

import { db } from '@/lib/db'
import { accounts, venues, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireVenue } from '@/lib/queries/auth'

export async function updateVenue(input: {
  name: string
  timezone: string
  monthlyRevenueGoal: number   // cents
  monthlyExpenseBudget: number // cents
  dailyRevenueTarget: number   // cents; 0 = auto-derive from monthly
  foodCostTarget: number       // percentage integer e.g. 35
  vatRegistered: boolean
}) {
  const { venue } = await requireVenue()
  const name = input.name.trim()
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
  const { dbUser } = await requireVenue()
  const fullName = input.fullName.trim() || null
  await db.update(users).set({ fullName }).where(eq(users.id, dbUser.id))
  revalidatePath('/settings')
}

export async function upgradeToPro() {
  const { account } = await requireVenue()
  await db.update(accounts).set({ plan: 'pro', planExpiresAt: null }).where(eq(accounts.id, account.id))
  revalidatePath('/settings')
  revalidatePath('/(dashboard)', 'layout')
}

export async function downgradeTofree() {
  const { account } = await requireVenue()
  await db.update(accounts).set({ plan: 'free' }).where(eq(accounts.id, account.id))
  revalidatePath('/settings')
  revalidatePath('/(dashboard)', 'layout')
}

export async function startTrial() {
  const { account } = await requireVenue()
  if (account.trialStartedAt) return { error: 'Trial already used on this account' }
  if (account.plan === 'pro') return { error: 'Already on Pro' }
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 14)
  await db.update(accounts).set({
    plan: 'pro',
    planExpiresAt: trialEnd,
    trialStartedAt: new Date(),
  }).where(eq(accounts.id, account.id))
  revalidatePath('/settings')
  revalidatePath('/(dashboard)', 'layout')
}
