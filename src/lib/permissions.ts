/**
 * Role-based UI gating. Owners see everything (food cost, margins, P&L,
 * reports, analytics). Staff see operational surfaces only — POS, sales
 * list, expense entry, inventory, waste — but never the financial drill-
 * down that would reveal what the business actually earns or spends.
 *
 * Server-side: use redirectIfNoFinancials in page.tsx for the gated routes.
 * Client-side: pass the boolean into components that conditionally render
 * cost/margin columns.
 */

type RoleHolder = { role: 'owner' | 'staff' }

export function canSeeFinancials(user: RoleHolder): boolean {
  return user.role === 'owner'
}

export function isOwner(user: RoleHolder): boolean {
  return user.role === 'owner'
}
