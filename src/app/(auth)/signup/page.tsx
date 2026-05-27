import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SizzleLogo from '@/components/ui/SizzleLogo'
import SignupForm from './SignupForm'

export const metadata = { title: 'Create account — Sizzle' }

export default async function SignupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="w-full max-w-sm glass glow rounded-2xl p-8 space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <SizzleLogo size={22} />
          <span className="font-semibold text-[17px] tracking-tight gradient-text">Sizzle</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
          <p className="text-sm text-ink-3">Start managing your business with Sizzle.</p>
        </div>
      </div>
      <SignupForm />
    </div>
  )
}
