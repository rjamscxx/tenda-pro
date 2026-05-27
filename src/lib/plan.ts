import type { accounts } from './db/schema'

type Account = typeof accounts.$inferSelect

export function isPro(account: Account): boolean {
  if (account.plan !== 'pro') return false
  if (account.planExpiresAt && account.planExpiresAt < new Date()) return false
  return true
}

export function hasUsedTrial(account: Account): boolean {
  return account.trialStartedAt !== null
}

export function isTrialActive(account: Account): boolean {
  return isPro(account) && account.trialStartedAt !== null
}
