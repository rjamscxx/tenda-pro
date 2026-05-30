'use client'

import { useState, useTransition } from 'react'

export default function AiTodayPush({
  initialText,
  refresh,
}: {
  initialText: string | null
  refresh: () => Promise<string | null>
}) {
  const [text, setText] = useState(initialText)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRefresh() {
    setError(null)
    startTransition(async () => {
      try {
        const t = await refresh()
        if (t) setText(t)
        else setError("Couldn't generate right now — check Anthropic credits.")
      } catch {
        setError('Unable to refresh.')
      }
    })
  }

  if (!text && !pending) {
    // Hide entirely when Anthropic isn't reachable or no text yet — don't
    // confuse the dashboard with an empty AI card.
    return null
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:p-5 relative">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1l1.8 4.2 4.2 1.8-4.2 1.8L7 13l-1.8-4.2L1 7l4.2-1.8L7 1z" fill="currentColor" className="text-accent"/>
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent/80 flex items-center gap-1.5">
            Sizzle AI · Today's push
            <span className="px-1.5 py-0 rounded text-[8px] bg-accent/15 text-accent border border-accent/30 font-bold uppercase tracking-wider">Premium</span>
          </p>
          {pending && !text ? (
            <p className="text-sm text-ink-3 mt-1.5 italic">Thinking…</p>
          ) : (
            <p className="text-sm text-ink mt-1.5 leading-relaxed">{text}</p>
          )}
          {error && <p className="text-xs text-warn mt-2">{error}</p>}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={pending}
          className="text-ink-4 hover:text-accent transition-colors p-1 disabled:opacity-50"
          title="Generate a fresh insight"
          aria-label="Refresh AI insight"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={pending ? 'animate-spin' : ''}>
            <path d="M12 2v3.5h-3.5M2 12V8.5h3.5M12 5.5a5 5 0 00-8.5-1.5L2 5.5M2 8.5a5 5 0 008.5 1.5L12 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
