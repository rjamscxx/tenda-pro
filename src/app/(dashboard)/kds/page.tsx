import { requireVenue } from '@/lib/queries/auth'
import { isPro } from '@/lib/plan'
import ProLockPage from '@/components/ui/ProLockPage'
import { getActiveTickets } from './actions'
import KdsClient from './KdsClient'

export const metadata = { title: 'Kitchen — Tenda' }
export const revalidate = 0

export default async function KdsPage() {
  const { account, venue } = await requireVenue()
  if (!isPro(account)) {
    return (
      <ProLockPage
        feature="Kitchen Display"
        hasUsedTrial={!!account.trialStartedAt}
      />
    )
  }

  const tickets = await getActiveTickets()
  return <KdsClient initialTickets={tickets} venueName={venue.name} />
}
