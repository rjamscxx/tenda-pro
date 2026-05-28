import type { accounts } from './db/schema'

type Account = typeof accounts.$inferSelect
export type PlanTier = 'free' | 'pro' | 'premium'

const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, premium: 2 }

export const BASIC_DISH_LIMIT = 20
export const BASIC_INGREDIENT_LIMIT = 15

export function getEffectivePlan(account: Account): PlanTier {
  const plan = account.plan as PlanTier
  if (plan === 'free') return 'free'
  if (account.planExpiresAt && account.planExpiresAt < new Date()) return 'free'
  return plan
}

export function isAtLeast(account: Account, tier: PlanTier): boolean {
  return TIER_RANK[getEffectivePlan(account)] >= TIER_RANK[tier]
}

export function isPro(account: Account): boolean {
  return isAtLeast(account, 'pro')
}

export function isPremium(account: Account): boolean {
  return isAtLeast(account, 'premium')
}

export function isTrial(account: Account): boolean {
  if (!account.trialStartedAt || !account.planExpiresAt) return false
  return account.plan === 'pro' && account.planExpiresAt > new Date()
}

export function getTrialDaysLeft(account: Account): number | null {
  if (!isTrial(account) || !account.planExpiresAt) return null
  const msLeft = account.planExpiresAt.getTime() - Date.now()
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
}

export function isTrialExpired(account: Account): boolean {
  if (!account.trialStartedAt) return false
  return account.plan === 'pro' && !!account.planExpiresAt && account.planExpiresAt < new Date()
}

export function hasUsedTrial(account: Account): boolean {
  return account.trialStartedAt !== null
}

export function isTrialActive(account: Account): boolean {
  return isTrial(account)
}
