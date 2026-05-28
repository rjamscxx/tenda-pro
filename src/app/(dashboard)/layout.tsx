import { requireVenue } from '@/lib/queries/auth'
import { isPro as checkPro, isTrial, getTrialDaysLeft, isTrialExpired } from '@/lib/plan'
import MobileNav from '@/components/layout/MobileNav'
import PageTransition from '@/components/layout/PageTransition'
import TrialBanner from '@/components/layout/TrialBanner'
import TrialExpiredModal from '@/components/layout/TrialExpiredModal'
import { ToastProvider } from '@/components/ui/Toast'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { venue, dbUser, account } = await requireVenue()
  const pro = checkPro(account)
  const trialActive = isTrial(account)
  const daysLeft = getTrialDaysLeft(account)
  const trialExpired = isTrialExpired(account)

  return (
    <ToastProvider>
      <div className="flex h-full">
        <MobileNav venueName={venue.name} fullName={dbUser.fullName ?? ''} role={dbUser.role} isPro={pro} />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto dashboard-bg">
          <div className="lg:hidden h-12 w-full shrink-0" />
          {trialActive && daysLeft !== null && <TrialBanner daysLeft={daysLeft} />}
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <TrialExpiredModal trialExpired={trialExpired} />
    </ToastProvider>
  )
}
