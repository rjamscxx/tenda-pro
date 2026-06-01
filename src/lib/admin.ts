export const ADMIN_EMAIL = 'rjamscxx@gmail.com'

export function isAdmin(authUser: { email?: string | null } | null | undefined): boolean {
  return !!authUser?.email && authUser.email === ADMIN_EMAIL
}
