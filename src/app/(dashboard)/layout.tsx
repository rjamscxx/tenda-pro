import { requireVenue } from '@/lib/queries/auth'
import { isPro as checkPro, isPremium as checkPremium, isTrial, getTrialDaysLeft, isTrialExpired } from '@/lib/plan'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import MobileNav from '@/components/layout/MobileNav'
import PageTransition from '@/components/layout/PageTransition'
import TrialBanner from '@/components/layout/TrialBanner'
import TrialExpiredModal from '@/components/layout/TrialExpiredModal'
import TodayTicker from '@/components/layout/TodayTicker'
import AiChatWidget from '@/components/layout/AiChatWidget'
import { ToastProvider } from '@/components/ui/Toast'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { venue, venues, dbUser, account, authUser } = await requireVenue()
  const pro     = checkPro(account)
  const premium = checkPremium(account)
  const trialActive = isTrial(account)
  const daysLeft = getTrialDaysLeft(account)
  const trialExpired = isTrialExpired(account)
  const venueList = venues.map(v => ({ id: v.id, name: v.name }))

  // Pending-subscription badge is admin-only (not "any account owner").
  let pendingSubRequests = 0
  if (isAdmin(authUser)) {
    const supabase = createAdminClient()
    const { count } = await supabase
      .from('subscription_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    pendingSubRequests = count ?? 0
  }

  return (
    <ToastProvider>
      <div className="flex h-full">
        <MobileNav venueName={venue.name} venues={venueList} activeVenueId={venue.id} fullName={dbUser.fullName ?? ''} role={dbUser.role} isPro={pro} isPremium={premium} isAdmin={isAdmin(authUser)} pendingSubRequests={pendingSubRequests} />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto dashboard-bg">
          <div className="lg:hidden h-12 w-full shrink-0" />
          {trialActive && daysLeft !== null && <TrialBanner daysLeft={daysLeft} />}
          <TodayTicker venueId={venue.id} />
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <TrialExpiredModal trialExpired={trialExpired} userEmail={dbUser.email ?? ''} userFullName={dbUser.fullName ?? ''} />
      {/* Widget only mounts when both: account is Premium AND ANTHROPIC_API_KEY is
          configured on the server. Lets us ship the code without lighting the
          feature up until Anthropic credits are loaded. */}
      {premium && !!process.env.ANTHROPIC_API_KEY && <AiChatWidget />}
    </ToastProvider>
  )
}
