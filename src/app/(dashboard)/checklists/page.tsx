import { getChecklistsState } from './actions'
import ChecklistsClient from './ChecklistsClient'

export const metadata = { title: 'Checklists — Tenda' }
export const revalidate = 0

export default async function ChecklistsPage() {
  const state = await getChecklistsState()
  return <ChecklistsClient initial={state} />
}
