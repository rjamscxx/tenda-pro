import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import SizzleLogo from '@/components/ui/SizzleLogo'
import OnboardingForm from './OnboardingForm'

export const metadata = { title: 'Set up your business — Sizzle' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, user.id)).limit(1)
  if (existing.length > 0) redirect('/dashboard')

  return (
    <div
      className="min-h-full flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}
    >
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md glass glow rounded-2xl p-8 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 mb-4">
            <SizzleLogo size={28} variant="badge" />
            <span className="font-semibold text-[17px] tracking-tight gradient-text">Sizzle</span>
          </div>
          <h1 className="text-2xl font-semibold text-ink">Set up your business</h1>
          <p className="text-sm text-ink-3">You can change this later in Settings.</p>
        </div>
        <OnboardingForm userId={user.id} email={user.email ?? ''} />
      </div>
    </div>
  )
}
