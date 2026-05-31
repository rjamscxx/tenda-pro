import { cookies } from 'next/headers'
import { requireVenue } from '@/lib/queries/auth'
import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { createAdminClient } from '@/lib/supabase/admin'
import SettingsClient from './SettingsClient'

export const metadata = { title: 'Settings — Sizzle' }

const ADMIN_EMAIL = 'rjamscxx@gmail.com'

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

export default async function SettingsPage() {
  const [cookieStore, { venue, dbUser, authUser, account }] = await Promise.all([
    cookies(),
    requireVenue(),
  ])

  const theme = cookieStore.get('sizzle-theme')?.value ?? 'sage-dark'
  const isAdmin = authUser.email === ADMIN_EMAIL

  const [recentActivity, subRequests] = await Promise.all([
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
  ])

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
        trialStartedAt={account.trialStartedAt?.toISOString() ?? null}
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
        isAdmin={isAdmin}
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
