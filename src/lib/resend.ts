import { Resend } from 'resend'

// Lazy singleton. The Resend constructor throws "Missing API key" when the env
// var is absent — which crashed the Vercel build, because Next evaluates this
// module while collecting API routes (before runtime env is in play). We defer
// construction to first use via a Proxy, so the build never touches it and the
// real client is created on the first actual send (when the key is present).
let _client: Resend | null = null
function client(): Resend {
  if (!_client) {
    // Placeholder only matters if a send is attempted while unconfigured —
    // it 401s and the caller handles it. With the key set, this is the real key.
    _client = new Resend(process.env.RESEND_API_KEY || 're_unconfigured_placeholder')
  }
  return _client
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    const c = client() as unknown as Record<string | symbol, unknown>
    const value = c[prop]
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(c) : value
  },
})

export const isResendConfigured = () => !!process.env.RESEND_API_KEY
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@sizzle.app'
