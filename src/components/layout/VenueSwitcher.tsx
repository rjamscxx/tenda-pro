'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { switchVenue, addVenue } from '@/lib/venue-actions'

interface VenueOption {
  id: string
  name: string
}

export default function VenueSwitcher({
  venues,
  activeVenueId,
  isPremium,
}: {
  venues: VenueOption[]
  activeVenueId: string
  isPremium: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const popRef = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  const active = venues.find(v => v.id === activeVenueId) ?? venues[0]
  const hasMultiple = venues.length > 1
  const canAdd = isPremium || venues.length === 0

  function handleSwitch(venueId: string) {
    if (venueId === activeVenueId) { setOpen(false); return }
    startTransition(async () => {
      const res = await switchVenue(venueId)
      if (res.error) { setError(res.error); return }
      setOpen(false)
      router.refresh()
    })
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) { setError('Enter a venue name'); return }
    setError(null)
    startTransition(async () => {
      const res = await addVenue({ name: newName.trim() })
      if (res.error) { setError(res.error); return }
      setAdding(false)
      setNewName('')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div ref={popRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 text-left pl-[34px] -mt-0.5 group"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-[11px] text-ink-4 truncate leading-none group-hover:text-ink-3 transition-colors">
          {active?.name ?? 'No venue'}
        </span>
        {hasMultiple || isPremium ? (
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            className={`text-ink-4 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          >
            <path d="M1.5 3l2.5 2 2.5-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : null}
      </button>

      {open && (
        <div className="absolute top-full left-2 mt-1.5 w-[200px] z-[var(--z-dropdown)] glass rounded-lg border border-hair shadow-xl overflow-hidden">

          {/* Venue list */}
          {!adding && (
            <>
              <div className="px-3 py-2 border-b border-hair">
                <p className="text-[9px] uppercase tracking-widest font-semibold text-ink-4">Switch venue</p>
              </div>
              <div className="py-1 max-h-[240px] overflow-y-auto">
                {venues.map(v => {
                  const isActive = v.id === activeVenueId
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSwitch(v.id)}
                      disabled={pending}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors disabled:opacity-60 ${
                        isActive ? 'text-accent bg-accent/8' : 'text-ink-2 hover:bg-surface-2'
                      }`}
                    >
                      <span className={`w-1 h-1 rounded-full shrink-0 ${isActive ? 'bg-accent' : 'bg-ink-4'}`} />
                      <span className="flex-1 truncate">{v.name}</span>
                      {isActive && <span className="text-[9px] text-accent shrink-0">active</span>}
                    </button>
                  )
                })}
              </div>

              {/* Add venue CTA */}
              <div className="border-t border-hair">
                <button
                  type="button"
                  onClick={() => { setAdding(true); setError(null) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors disabled:opacity-60"
                >
                  <span className="w-4 h-4 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M4.5 1v7M1 4.5h7" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <span className="flex-1 text-left">Add new venue</span>
                  {!canAdd && <span className="text-[9px] text-ink-4 shrink-0">💎</span>}
                </button>
              </div>
            </>
          )}

          {/* Add form */}
          {adding && (
            <form onSubmit={handleAdd} className="p-3 space-y-2.5">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-ink-4 mb-1.5">
                  New venue
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Tenda Pro Cebu"
                  disabled={pending}
                  className="input-field w-full text-[12px] px-2.5 py-1.5"
                />
              </div>
              {error && (
                <p className="text-[10px] text-danger leading-snug">{error}</p>
              )}
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => { setAdding(false); setNewName(''); setError(null) }}
                  disabled={pending}
                  className="flex-1 px-2.5 py-1.5 rounded-md border border-hair text-[11px] text-ink-3 hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || !canAdd}
                  className="flex-1 px-2.5 py-1.5 btn-primary rounded-md text-[11px] font-semibold disabled:opacity-60"
                >
                  {pending ? 'Adding…' : canAdd ? 'Create' : 'Premium only'}
                </button>
              </div>
            </form>
          )}

          {/* Error (when shown from switch) */}
          {error && !adding && (
            <div className="px-3 py-1.5 border-t border-hair">
              <p className="text-[10px] text-danger leading-snug">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
