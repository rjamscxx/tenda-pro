'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function inlineFormat(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return <>{parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )}</>
}

function renderMarkdown(text: string) {
  const blocks = text.split(/\n\n+/)
  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim())
        const isList = lines.length > 0 && /^[-•] |^\d+\. /.test(lines[0])
        if (isList) {
          return (
            <div key={bi} className="space-y-1">
              {lines.map((line, li) => {
                const numMatch = line.match(/^(\d+)\. (.*)/)
                const bullet = numMatch ? numMatch[1] + '.' : '•'
                const content = numMatch ? numMatch[2] : line.replace(/^[-•] /, '')
                return (
                  <div key={li} className="flex gap-2">
                    <span className="shrink-0 text-ink-4">{bullet}</span>
                    <span>{inlineFormat(content)}</span>
                  </div>
                )
              })}
            </div>
          )
        }
        return <p key={bi}>{inlineFormat(block.replace(/\n/g, ' '))}</p>
      })}
    </div>
  )
}

const DEFAULT_SUGGESTIONS = [
  "What was my revenue today?",
  "What are my top-selling dishes this week?",
  "Show me this month's profit summary",
  "What ingredients are low on stock?",
]

interface Props {
  suggestions?: string[]
}

export default function DashboardClient({ suggestions = DEFAULT_SUGGESTIONS }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: Message = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json() as { reply?: string; error?: string }
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply || data.error || 'No response.' },
      ])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error — please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass card-glow rounded-xl flex flex-col h-full" style={{ minHeight: '320px', maxHeight: '420px' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-hair flex items-center gap-2 shrink-0">
        <span className="gradient-text text-sm">◉</span>
        <span className="text-sm font-medium text-ink">AI Assistant</span>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="ml-auto text-xs text-ink-4 hover:text-danger transition-colors mr-1"
          >
            Clear
          </button>
        )}
        <span className={messages.length > 0 ? 'text-xs text-ink-4' : 'ml-auto text-xs text-ink-4'}>claude-sonnet-4-6</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <p className="text-sm text-ink-3 text-center">Ask anything about your restaurant</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-hair text-ink-3 hover:text-accent hover:border-accent transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'btn-primary rounded-br-sm'
                      : 'bg-surface-2 text-ink rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : <span>{msg.content}</span>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-2 px-4 py-3 rounded-xl rounded-bl-sm">
                  <div className="flex gap-1.5 items-center">
                    {[0, 120, 240].map(delay => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-hair flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
          placeholder="Ask about revenue, margins, stock…"
          disabled={loading}
          className="flex-1 px-3 py-2 rounded-lg bg-canvas border border-hair text-ink text-sm placeholder:text-ink-4 transition-colors"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="px-4 py-2 btn-primary rounded-lg text-sm disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  )
}
