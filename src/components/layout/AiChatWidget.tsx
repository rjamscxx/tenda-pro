'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  'How are sales today vs yesterday?',
  'Top dishes this week?',
  'What\'s low on stock?',
  'Profit this month so far?',
]

export default function AiChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to the newest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // Focus the input when the panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function send(text: string) {
    const userText = text.trim()
    if (!userText || loading) return
    setError(null)
    setInput('')
    const next: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      setMessages([...next, { role: 'assistant', content: data.message }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.')
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close Sizzle Assistant' : 'Open Sizzle Assistant'}
        className="fixed bottom-5 right-5 z-[var(--z-dropdown)] w-12 h-12 rounded-full btn-primary shadow-lg shadow-accent/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 8.5C3 5.46 5.46 3 8.5 3h3C14.54 3 17 5.46 17 8.5v0c0 3.04-2.46 5.5-5.5 5.5H8l-3 3v-3.5C3.79 12.66 3 10.68 3 8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            <circle cx="7.5" cy="8.5" r="0.9" fill="currentColor"/>
            <circle cx="10" cy="8.5" r="0.9" fill="currentColor"/>
            <circle cx="12.5" cy="8.5" r="0.9" fill="currentColor"/>
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-[var(--z-dropdown)] w-[min(380px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-7rem))] glass rounded-2xl border border-hair shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-hair flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-accent">
                <path d="M7 1L8.5 5L12.5 5.5L9.5 8.5L10 12.5L7 10.5L4 12.5L4.5 8.5L1.5 5.5L5.5 5L7 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink leading-tight">Sizzle Assistant</p>
              <p className="text-[10px] text-ink-4 leading-tight">Premium · powered by Claude</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-ink-3 leading-relaxed">
                  Ask me about your sales, costs, margins, stock, or payroll — I&apos;ll pull the numbers and tell you what they mean.
                </p>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-4">Try</p>
                  {QUICK_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => void send(p)}
                      disabled={loading}
                      className="block w-full text-left px-3 py-2 rounded-lg border border-hair text-xs text-ink-2 hover:border-accent hover:text-ink transition-colors disabled:opacity-60"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  m.role === 'user'
                    ? 'ml-auto bg-accent text-canvas'
                    : 'mr-auto bg-surface-2 text-ink'
                }`}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="mr-auto bg-surface-2 rounded-2xl px-3.5 py-2.5 text-sm text-ink-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-4 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-4 animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-4 animate-pulse [animation-delay:300ms]" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-hair p-2.5 shrink-0">
            <div className="flex items-end gap-2 bg-surface-2 rounded-xl border border-hair focus-within:border-accent transition-colors px-2.5 py-1.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                disabled={loading}
                placeholder="Ask about your numbers…"
                className="flex-1 bg-transparent resize-none outline-none text-sm text-ink placeholder:text-ink-4 max-h-24 py-1"
              />
              <button
                onClick={() => void send(input)}
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="shrink-0 w-7 h-7 rounded-lg btn-primary flex items-center justify-center disabled:opacity-40"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5h9M6.5 2l4.5 4.5L6.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  )
}
