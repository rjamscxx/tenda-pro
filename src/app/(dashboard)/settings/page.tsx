import { cookies } from 'next/headers'
import { requireVenue } from '@/lib/queries/auth'
import { db } from '@/lib/db'
import { auditLogs, accounts, users, venues } from '@/lib/db/schema'
import { eq, desc, and, isNull, isNotNull } from 'drizzle-orm'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin as checkIsAdmin } from '@/lib/admin'
import SettingsClient from './SettingsClient'

export const metadata = { title: 'Settings — Tenda' }

interface SubRequest {
  id: string
  fullName: string
  phone: string
  email: string
  billing: string
  receiptUrl: string | null
  status: string
  createdAt: string
}

interface SubscribedAccount {
  accountId: string
  fullName: string
  venueName: string
  email: string
  activatedAt: string
  planExpiresAt: string
}

export default async function SettingsPage() {
  const [cookieStore, { venue, dbUser, authUser, account }] = await Promise.all([
    cookies(),
    requireVenue(),
  ])

  const theme = cookieStore.get('sizzle-theme')?.value ?? 'ember'
  const isAdmin = checkIsAdmin(authUser)

  const [recentActivity, subRequests, subscribedAccounts] = await Promise.all([
    db.select({
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
    .limit(20),

    isAdmin
      ? createAdminClient()
          .from('subscription_requests')
          .select('id, full_name, phone, email, billing, receipt_url, status, created_at')
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data }) => (data ?? []) as Array<{
            id: string; full_name: string; phone: string; email: string
            billing: string; receipt_url: string | null; status: string; created_at: string
          }>)
      : Promise.resolve([]),

    isAdmin
      ? db
          .select({
            accountId: accounts.id,
            planExpiresAt: accounts.planExpiresAt,
            fullName: users.fullName,
            email: users.email,
            venueName: venues.name,
          })
          .from(accounts)
          .innerJoin(users, eq(users.accountId, accounts.id))
          .leftJoin(venues, eq(venues.accountId, accounts.id))
          .where(and(
            eq(accounts.plan, 'pro'),
            isNull(accounts.trialStartedAt),
            isNotNull(accounts.planExpiresAt),
          ))
          .orderBy(desc(accounts.planExpiresAt))
          .then(rows => rows.map(r => ({
            accountId: r.accountId,
            fullName: r.fullName ?? '',
            venueName: r.venueName ?? '',
            email: r.email ?? '',
            activatedAt: new Date(r.planExpiresAt!.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            planExpiresAt: r.planExpiresAt!.toISOString(),
          } satisfies SubscribedAccount)))
      : Promise.resolve([]),
  ])

  return (
    <div className="p-4 sm:p-6 max-w-2xl w-full space-y-5">
      <div className="card-enter card-d0 glass rounded-xl px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 text-accent">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M7 2H4a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="11.5" cy="4.5" r="3" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M10 4.5h3M11.5 3v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Settings</h1>
          <p className="text-sm text-ink-4 mt-0.5">Manage your business and account preferences.</p>
        </div>
      </div>
      <SettingsClient
        initialTheme={theme}
        plan={account.plan}
        planExpiresAt={account.planExpiresAt?.toISOString() ?? null}
        trialStartedAt={account.trialStartedAt?.toISOString() ?? null}
        venue={{
          id: venue.id,
          name: venue.name,
          timezone: venue.timezone,
          monthlyRevenueGoal: venue.monthlyRevenueGoal,
          monthlyExpenseBudget: venue.monthlyExpenseBudget,
          vatRegistered: venue.vatRegistered,
          dailyRevenueTarget: venue.dailyRevenueTarget,
          foodCostTarget: venue.foodCostTarget ?? 35,
          onlineOrderingEnabled: venue.onlineOrderingEnabled,
          gcashNumber: venue.gcashNumber ?? '',
          gcashName: venue.gcashName ?? '',
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
        isAdmin={isAdmin}
        subscribedAccounts={subscribedAccounts}
        subscriptionRequests={subRequests.map(r => ({
          id: r.id,
          fullName: r.full_name,
          phone: r.phone,
          email: r.email,
          billing: r.billing,
          receiptUrl: r.receipt_url,
          status: r.status,
          createdAt: r.created_at,
        }) satisfies SubRequest)}
      />
    </div>
  )
}
