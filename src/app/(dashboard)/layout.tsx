import { requireVenue } from '@/lib/queries/auth'
import { isPro as checkPro } from '@/lib/plan'
import MobileNav from '@/components/layout/MobileNav'
import PageTransition from '@/components/layout/PageTransition'
import { ToastProvider } from '@/components/ui/Toast'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { venue, dbUser, account } = await requireVenue()
  const pro = checkPro(account)

  return (
    <ToastProvider>
      <div className="flex h-full">
        <MobileNav venueName={venue.name} fullName={dbUser.fullName ?? ''} role={dbUser.role} isPro={pro} />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto dashboard-bg">
          <div className="lg:hidden h-12 w-full shrink-0" />
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </ToastProvider>
  )
}
