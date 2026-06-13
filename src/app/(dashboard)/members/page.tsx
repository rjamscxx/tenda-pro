import { redirect } from 'next/navigation'
import { requireVenue } from '@/lib/queries/auth'
import { isAdmin as checkIsAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { accounts, users, venues } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export const metadata = { title: 'Members — Tenda Pro' }

function PlanBadge({ plan, isTrial }: { plan: string; isTrial: boolean }) {
  if (isTrial) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
      TRIAL
    </span>
  )
  if (plan === 'premium') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
      PRO+
    </span>
  )
  if (plan === 'pro') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
      PRO
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-3 text-ink-4">
      FREE
    </span>
  )
}

export default async function MembersPage() {
  const { authUser } = await requireVenue()
  if (!checkIsAdmin(authUser)) redirect('/dashboard')

  const rows = await db
    .select({
      accountId:      accounts.id,
      plan:           accounts.plan,
      trialStartedAt: accounts.trialStartedAt,
      planExpiresAt:  accounts.planExpiresAt,
      accountCreated: accounts.createdAt,
      fullName:       users.fullName,
      email:          users.email,
      contactNumber:  users.contactNumber,
      userCreated:    users.createdAt,
      venueName:      venues.name,
    })
    .from(accounts)
    .innerJoin(users, eq(users.accountId, accounts.id))
    .leftJoin(venues, eq(venues.accountId, accounts.id))
    .orderBy(desc(accounts.createdAt))

  const now = new Date()

  const members = rows.map(r => {
    const isTrial = r.plan === 'pro' && !!r.trialStartedAt && !!r.planExpiresAt
    const trialExpired = isTrial && r.planExpiresAt! < now
    const effectivePlan = trialExpired ? 'free' : r.plan
    return {
      accountId:     r.accountId,
      plan:          effectivePlan,
      isTrial:       isTrial && !trialExpired,
      planExpiresAt: r.planExpiresAt,
      joinedAt:      r.accountCreated,
      fullName:      r.fullName ?? '—',
      email:         r.email ?? '—',
      contactNumber: r.contactNumber ?? '—',
      venueName:     r.venueName ?? '—',
    }
  })

  const totalMembers = members.length
  const proMembers   = members.filter(m => m.plan === 'pro' && !m.isTrial).length
  const trialMembers = members.filter(m => m.isTrial).length
  const freeMembers  = members.filter(m => m.plan === 'free').length

  function fmt(d: Date | null | undefined) {
    if (!d) return '—'
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl w-full space-y-5">
      {/* Header */}
      <div className="card-enter card-d0 glass rounded-xl px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 text-accent">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M11.5 6.5a2 2 0 100-4M13.5 13c0-1.93-1.12-3.6-2.75-4.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-ink tracking-tight">Members</h1>
          <p className="text-sm text-ink-4 mt-0.5">All registered accounts — admin view only.</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 card-enter card-d1">
        {[
          { label: 'Total',   value: totalMembers, tone: 'ink'     },
          { label: 'Pro',     value: proMembers,   tone: 'accent'  },
          { label: 'Trial',   value: trialMembers, tone: 'warn'    },
          { label: 'Free',    value: freeMembers,  tone: 'muted'   },
        ].map(({ label, value, tone }) => {
          const barCls = tone === 'accent' ? 'bg-gradient-to-r from-accent to-accent-2'
                       : tone === 'warn'   ? 'bg-gradient-to-r from-warn/70 to-warn'
                       : tone === 'ink'    ? 'bg-gradient-to-r from-ink-4/50 to-ink-3/60'
                       : 'bg-gradient-to-r from-surface-3 to-surface-3'
          const valCls = tone === 'accent' ? 'text-accent'
                       : tone === 'warn'   ? 'text-warn'
                       : 'text-ink'
          return (
            <div key={label} className="glass rounded-xl p-4 relative overflow-hidden">
              <div className={`absolute inset-x-0 top-0 h-[2px] ${barCls}`} />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-4 mb-1">{label}</p>
              <p className={`text-2xl font-bold tabular ${valCls}`}>{value}</p>
            </div>
          )
        })}
      </div>

      {/* Members table */}
      <div className="card-enter card-d2 glass rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-hair flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">All accounts</p>
          <p className="text-xs text-ink-4">{totalMembers} total</p>
        </div>

        {members.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-ink-4">No members yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hair text-[10px] font-semibold uppercase tracking-widest text-ink-4">
                  <th className="px-4 py-2.5 text-left">Name</th>
                  <th className="px-4 py-2.5 text-left">Email</th>
                  <th className="px-4 py-2.5 text-left hidden lg:table-cell">Contact</th>
                  <th className="px-4 py-2.5 text-left hidden sm:table-cell">Venue</th>
                  <th className="px-4 py-2.5 text-left">Plan</th>
                  <th className="px-4 py-2.5 text-left hidden md:table-cell">Expires</th>
                  <th className="px-4 py-2.5 text-left hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {members.map((m, i) => (
                  <tr key={m.accountId} className={`hover:bg-surface/40 transition-colors ${i % 2 === 1 ? 'bg-surface/20' : ''}`}>
                    <td className="px-4 py-3 font-medium text-ink truncate max-w-[140px]">{m.fullName}</td>
                    <td className="px-4 py-3 text-ink-3 truncate max-w-[180px]">
                      {m.email !== '—' ? (
                        <a href={`mailto:${m.email}`} className="hover:text-accent hover:underline">{m.email}</a>
                      ) : m.email}
                    </td>
                    <td className="px-4 py-3 text-ink-3 hidden lg:table-cell whitespace-nowrap tabular">
                      {m.contactNumber !== '—' ? (
                        <a href={`tel:${m.contactNumber}`} className="hover:text-accent hover:underline">{m.contactNumber}</a>
                      ) : <span className="text-ink-4">—</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-3 truncate max-w-[140px] hidden sm:table-cell">{m.venueName}</td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={m.plan} isTrial={m.isTrial} />
                    </td>
                    <td className="px-4 py-3 text-ink-4 text-xs hidden md:table-cell whitespace-nowrap">
                      {m.planExpiresAt ? fmt(m.planExpiresAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-4 text-xs hidden md:table-cell whitespace-nowrap">
                      {fmt(m.joinedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
