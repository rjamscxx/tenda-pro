import type { accounts } from './db/schema'

type Account = typeof accounts.$inferSelect

export const FREE_DAILY_TOKEN_BUDGET = 10_000   // ~5 AI conversations
export const PRO_DAILY_TOKEN_BUDGET  = 150_000  // ~75 AI conversations

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

export function getDailyTokenBudget(account: Account): number {
  return isPro(account) ? PRO_DAILY_TOKEN_BUDGET : FREE_DAILY_TOKEN_BUDGET
}

export function getTokensUsedToday(account: Account): number {
  const today = new Date().toLocaleDateString('en-CA')
  if (!account.aiTokensDate || account.aiTokensDate !== today) return 0
  return account.aiTokensToday
}

export function getTokenBudgetPct(account: Account): number {
  const used   = getTokensUsedToday(account)
  const budget = getDailyTokenBudget(account)
  return Math.min(100, (used / budget) * 100)
}
