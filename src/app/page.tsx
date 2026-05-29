import LandingClient from './LandingClient'

export const metadata = {
  title: 'Sizzle — The Operating Dashboard for Restaurant Owners',
  description:
    'Track every peso, cut waste, and grow your margins. Sizzle gives restaurant and café owners a clear financial picture in one dashboard.',
}

// Landing is fully static so it can enter the browser bf-cache. Auth + theme
// state hydrate client-side inside LandingClient.
export default function Page() {
  return <LandingClient />
}
