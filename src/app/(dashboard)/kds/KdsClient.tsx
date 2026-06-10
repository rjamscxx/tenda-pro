'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { getActiveTickets, markPreparing, markReady, markServed, reopenTicket, type KdsTicket } from './actions'

const COLS: { status: KdsTicket['status']; label: string; tint: string }[] = [
  { status: 'new',       label: 'New',       tint: 'border-accent/40 bg-accent/5' },
  { status: 'preparing', label: 'Preparing', tint: 'border-warn/40 bg-warn/5' },
  { status: 'ready',     label: 'Ready',     tint: 'border-success/40 bg-success/5' },
]

const CHANNEL_LABEL: Record<KdsTicket['channel'], string> = {
  dine_in:  'Dine-in',
  takeout:  'Takeout',
  delivery: 'Delivery',
  other:    'Other',
}

function diffMinutes(fromIso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(fromIso).getTime()) / 60_000))
}

function ageLabel(min: number): string {
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  return `${h}h ${min % 60}m ago`
}

/** A short, polite double-beep using the Web Audio API. ~200ms total. */
function playBell() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const now = ctx.currentTime
    const make = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + start)
      gain.gain.linearRampToValueAtTime(0.22, now + start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.02)
    }
    make(880, 0, 0.14)
    make(1175, 0.09, 0.18)
    setTimeout(() => ctx.close().catch(() => {}), 600)
  } catch {/* audio not allowed; that's fine */}
}

export default function KdsClient({
  initialTickets,
  venueName,
}: {
  initialTickets: KdsTicket[]
  venueName: string
}) {
  const toast = useToast()  // toast(message, variant?)
  const [tickets, setTickets] = useState<KdsTicket[]>(initialTickets)
  const [, startTransition] = useTransition()
  const [muted, setMuted] = useState(false)
  const [, setTick] = useState(0)
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const seenIdsRef = useRef<Set<string>>(new Set(initialTickets.map(t => t.saleId)))
  const mutedRef = useRef(false)
  mutedRef.current = muted

  // Forces age-pill re-render every 15s without re-fetching.
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 15_000)
    return () => clearInterval(id)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const fresh = await getActiveTickets()
      const incomingIds = new Set(fresh.map(t => t.saleId))
      const newOnes = fresh.filter(t => !seenIdsRef.current.has(t.saleId) && t.status === 'new')
      if (newOnes.length > 0 && !mutedRef.current) playBell()
      seenIdsRef.current = incomingIds
      setTickets(fresh)
      setLastSync(new Date())
    } catch {/* network blip; next tick will retry */}
  }, [])

  // Poll every 5s while page is visible.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, 5_000)
    const onVis = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [refresh])

  function handleTransition(saleId: string, kind: 'prepare' | 'ready' | 'served' | 'reopen') {
    // Optimistic update — flip the local row immediately, sync afterward.
    setTickets(prev =>
      kind === 'served'
        ? prev.filter(t => t.saleId !== saleId)
        : prev.map(t => t.saleId === saleId
            ? { ...t,
                status: kind === 'prepare' ? 'preparing' : kind === 'ready' ? 'ready' : 'new',
                startedAt: kind === 'prepare' ? new Date().toISOString() : t.startedAt,
                readyAt:   kind === 'ready'   ? new Date().toISOString() : t.readyAt,
              }
            : t),
    )

    startTransition(async () => {
      const fn = kind === 'prepare' ? markPreparing : kind === 'ready' ? markReady : kind === 'served' ? markServed : reopenTicket
      const res = await fn(saleId)
      if (res.error) {
        toast(res.error, 'error')
        refresh()
      }
    })
  }

  const byStatus: Record<KdsTicket['status'], KdsTicket[]> = {
    new: [], preparing: [], ready: [], served: [],
  }
  for (const t of tickets) byStatus[t.status].push(t)

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 sm:px-6 py-4 border-b border-hair flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-[15px] font-semibold text-ink tracking-tight">Kitchen</h1>
          <p className="text-[11px] text-ink-4">
            {venueName} · {tickets.length} active · synced {lastSync.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <button
          onClick={() => setMuted(m => !m)}
          className="px-3 py-1.5 rounded-lg border border-hair text-[12px] text-ink-3 hover:text-ink hover:bg-surface transition-colors flex items-center gap-1.5"
          title={muted ? 'Unmute new-order bell' : 'Mute new-order bell'}
        >
          <span aria-hidden>{muted ? '🔕' : '🔔'}</span>
          {muted ? 'Muted' : 'Bell on'}
        </button>
        <button
          onClick={() => refresh()}
          className="px-3 py-1.5 rounded-lg border border-hair text-[12px] text-ink-3 hover:text-ink hover:bg-surface transition-colors"
        >
          Refresh
        </button>
      </header>

      {tickets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-hair flex items-center justify-center text-ink-3 text-2xl">🍳</div>
          <div className="space-y-1 max-w-[32ch]">
            <p className="text-sm font-semibold text-ink-2">No active tickets</p>
            <p className="text-xs text-ink-4 leading-relaxed">
              Orders sent from POS (dine-in + takeout) appear here. Manual sales from the Sales page skip the kitchen.
            </p>
          </div>
          <a href="/pos" className="px-4 py-2 rounded-lg btn-primary text-xs font-medium">Open POS →</a>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="grid grid-cols-3 gap-3 p-3 sm:p-4 min-w-[760px] h-full">
            {COLS.map(col => {
              const list = byStatus[col.status]
              return (
                <section key={col.status} className={`flex flex-col rounded-xl border ${col.tint} min-h-0`}>
                  <div className="px-3 py-2 flex items-center justify-between border-b border-hair/70 sticky top-0 backdrop-blur-sm">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-ink-3">{col.label}</span>
                    <span className="text-[10px] text-ink-4 tabular">{list.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                    {list.length === 0 ? (
                      <div className="text-[11px] text-ink-4 text-center py-6 opacity-60">empty</div>
                    ) : list.map(t => {
                      const min = diffMinutes(t.receivedAt)
                      const hot = min >= 10 && t.status !== 'ready'
                      return (
                        <article
                          key={t.saleId}
                          className={`rounded-lg border bg-canvas p-3 space-y-2 ${hot ? 'border-danger/60 shadow-[0_0_0_2px_var(--danger-tint,rgba(239,68,68,.15))]' : 'border-hair'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-ink truncate">
                                {t.customerName || CHANNEL_LABEL[t.channel]}
                              </p>
                              <p className="text-[10px] text-ink-4 uppercase tracking-wide">
                                {CHANNEL_LABEL[t.channel]} · {formatCurrency(t.total)}
                              </p>
                            </div>
                            <span className={`shrink-0 text-[10px] tabular px-1.5 py-0.5 rounded-full ${hot ? 'bg-danger/15 text-danger' : 'bg-surface-2 text-ink-4'}`}>
                              {ageLabel(min)}
                            </span>
                          </div>

                          <ul className="space-y-0.5 text-[12px] text-ink-2">
                            {t.items.map((it, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="tabular text-ink-3 shrink-0">{it.qty}×</span>
                                <span className="truncate">{it.dishName}</span>
                              </li>
                            ))}
                            {t.items.length === 0 && (
                              <li className="text-[11px] text-ink-4 italic">No line items (manual total)</li>
                            )}
                          </ul>

                          {t.note && (
                            <p className="text-[11px] text-warn bg-warn/10 px-2 py-1 rounded leading-snug">
                              📝 {t.note}
                            </p>
                          )}

                          <div className="flex items-center gap-1.5 pt-1">
                            {t.status === 'new' && (
                              <button
                                onClick={() => handleTransition(t.saleId, 'prepare')}
                                className="flex-1 px-2 py-1.5 rounded-md bg-accent text-canvas text-[11px] font-bold uppercase tracking-wide hover:opacity-90"
                              >
                                Start
                              </button>
                            )}
                            {t.status === 'preparing' && (
                              <>
                                <button
                                  onClick={() => handleTransition(t.saleId, 'reopen')}
                                  className="px-2 py-1.5 rounded-md border border-hair text-[11px] text-ink-3 hover:text-ink"
                                  title="Move back to New"
                                >
                                  ←
                                </button>
                                <button
                                  onClick={() => handleTransition(t.saleId, 'ready')}
                                  className="flex-1 px-2 py-1.5 rounded-md bg-success text-canvas text-[11px] font-bold uppercase tracking-wide hover:opacity-90"
                                >
                                  Ready
                                </button>
                              </>
                            )}
                            {t.status === 'ready' && (
                              <>
                                <button
                                  onClick={() => handleTransition(t.saleId, 'prepare')}
                                  className="px-2 py-1.5 rounded-md border border-hair text-[11px] text-ink-3 hover:text-ink"
                                  title="Move back to Preparing"
                                >
                                  ←
                                </button>
                                <button
                                  onClick={() => handleTransition(t.saleId, 'served')}
                                  className="flex-1 px-2 py-1.5 rounded-md bg-ink/85 text-canvas text-[11px] font-bold uppercase tracking-wide hover:opacity-90"
                                >
                                  Served ✓
                                </button>
                              </>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
