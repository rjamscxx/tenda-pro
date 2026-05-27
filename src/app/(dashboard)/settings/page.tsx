import { cookies } from 'next/headers'
import { requireVenue } from '@/lib/queries/auth'
import { isPro, hasUsedTrial, getDailyTokenBudget, getTokensUsedToday } from '@/lib/plan'
import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import SettingsClient from './SettingsClient'

export const metadata = { title: 'Settings — Sizzle' }

export default async function SettingsPage() {
  const [cookieStore, { venue, dbUser, authUser, account }] = await Promise.all([
    cookies(),
    requireVenue(),
  ])

  const theme         = cookieStore.get('sizzle-theme')?.value ?? 'sage-dark'
  const trialUsed     = hasUsedTrial(account)
  const tokensUsed    = getTokensUsedToday(account)
  const tokenBudget   = getDailyTokenBudget(account)

  const recentActivity = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      tableName: auditLogs.tableName,
      newData: auditLogs.newData,
      oldData: auditLogs.oldData,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(eq(auditLogs.venueId, venue.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(20)

  return (
    <div className="p-6 max-w-2xl w-full space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink tracking-tight">Settings</h1>
        <p className="text-sm text-ink-4 mt-0.5">Manage your business and account preferences.</p>
      </div>
      <SettingsClient
        initialTheme={theme}
        plan={account.plan}
        planExpiresAt={account.planExpiresAt?.toISOString() ?? null}
        trialUsed={trialUsed}
        tokensUsed={tokensUsed}
        tokenBudget={tokenBudget}
        venue={{
          name: venue.name,
          timezone: venue.timezone,
          monthlyRevenueGoal: venue.monthlyRevenueGoal,
          monthlyExpenseBudget: venue.monthlyExpenseBudget,
          vatRegistered: venue.vatRegistered,
          dailyRevenueTarget: venue.dailyRevenueTarget,
          foodCostTarget: venue.foodCostTarget ?? 35,
        }}
        profile={{ fullName: dbUser.fullName ?? '', email: authUser.email ?? '' }}
        recentActivity={recentActivity.map(r => ({
          id: r.id,
          action: r.action,
          tableName: r.tableName,
          newData: r.newData as Record<string, unknown> | null,
          oldData: r.oldData as Record<string, unknown> | null,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
