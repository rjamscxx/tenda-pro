'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import {
  startRun, toggleRunItem,
  addTemplateItem, updateTemplateItem, deleteTemplateItem,
} from './actions'

type Kind = 'opening' | 'closing'

interface TemplateItem { id: string; position: number; label: string }
interface RunItem { id: string; position: number; label: string; checked: boolean; checkedAt: string | null }
interface RunState { id: string; templateId: string | null; startedAt: string; completedAt: string | null; items: RunItem[] }
interface SideState {
  template: { id: string; kind: Kind; name: string }
  items: TemplateItem[]
  run: RunState | null
}
interface InitialState {
  today: string
  opening: SideState
  closing: SideState
}

const KIND_LABEL: Record<Kind, string> = { opening: 'Opening', closing: 'Closing' }
const KIND_EMOJI: Record<Kind, string> = { opening: '🌅', closing: '🌙' }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })
}

export default function ChecklistsClient({ initial }: { initial: InitialState }) {
  const toast = useToast()
  const router = useRouter()
  const [tab, setTab] = useState<'today' | 'edit'>('today')
  const [editingKind, setEditingKind] = useState<Kind>('opening')

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 sm:px-6 py-4 border-b border-hair flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-[15px] font-semibold text-ink tracking-tight">Checklists</h1>
          <p className="text-[11px] text-ink-4">
            {new Date(`${initial.today}T00:00:00+08:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <nav className="inline-flex rounded-lg border border-hair p-0.5 text-[12px] font-medium">
          <button
            onClick={() => setTab('today')}
            className={`px-3 py-1 rounded-md transition-colors active:scale-[0.97] ${tab === 'today' ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:text-ink'}`}
          >Today</button>
          <button
            onClick={() => setTab('edit')}
            className={`px-3 py-1 rounded-md transition-colors active:scale-[0.97] ${tab === 'edit' ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:text-ink'}`}
          >Edit lists</button>
        </nav>
      </header>

      {tab === 'today' ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid lg:grid-cols-2 gap-4 max-w-5xl">
          <RunCard kind="opening" side={initial.opening} onChange={() => router.refresh()} toast={toast} />
          <RunCard kind="closing" side={initial.closing} onChange={() => router.refresh()} toast={toast} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl w-full space-y-4">
          <nav className="inline-flex rounded-lg border border-hair p-0.5 text-[12px] font-medium">
            {(['opening', 'closing'] as Kind[]).map(k => (
              <button
                key={k}
                onClick={() => setEditingKind(k)}
                className={`px-3 py-1 rounded-md transition-colors active:scale-[0.97] ${editingKind === k ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:text-ink'}`}
              >
                {KIND_EMOJI[k]} {KIND_LABEL[k]}
              </button>
            ))}
          </nav>
          <TemplateEditor
            kind={editingKind}
            side={editingKind === 'opening' ? initial.opening : initial.closing}
            onChange={() => router.refresh()}
            toast={toast}
          />
        </div>
      )}
    </div>
  )
}

function RunCard({
  kind, side, onChange, toast,
}: {
  kind: Kind
  side: SideState
  onChange: () => void
  toast: ReturnType<typeof useToast>
}) {
  const [, startTransition] = useTransition()
  const run = side.run
  const totalItems = run ? run.items.length : side.items.length
  const doneItems = run ? run.items.filter(i => i.checked).length : 0
  const pct = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100)
  const completed = !!run?.completedAt

  function handleStart() {
    startTransition(async () => {
      const res = await startRun(kind)
      if (res.error) toast(res.error, 'error')
      else onChange()
    })
  }

  function handleToggle(itemId: string, checked: boolean) {
    startTransition(async () => {
      const res = await toggleRunItem({ runItemId: itemId, checked })
      if (res.error) toast(res.error, 'error')
      else onChange()
    })
  }

  return (
    <section className={`rounded-xl border ${completed ? 'border-success/40' : 'border-hair'} bg-surface flex flex-col`}>
      <div className="px-4 py-3 flex items-center gap-3 border-b border-hair">
        <span className="text-xl" aria-hidden>{KIND_EMOJI[kind]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-ink leading-tight">{side.template.name}</p>
          {run ? (
            <p className="text-[11px] text-ink-4 mt-0.5">
              {completed
                ? `Done at ${formatTime(run.completedAt!)} · ${doneItems}/${totalItems}`
                : `Started ${formatTime(run.startedAt)} · ${doneItems}/${totalItems}`}
            </p>
          ) : (
            <p className="text-[11px] text-ink-4 mt-0.5">{totalItems} steps · not started</p>
          )}
        </div>
        {completed && <span className="text-[10px] font-bold text-success px-2 py-0.5 rounded-full bg-success/12">✓ DONE</span>}
      </div>

      {run ? (
        <>
          <div className="h-1 bg-surface-2">
            <div
              className={`h-full transition-all ${completed ? 'bg-success' : 'bg-accent'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="flex-1 p-2 space-y-1">
            {run.items.map(it => (
              <li key={it.id}>
                <label className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 accent-accent cursor-pointer"
                    checked={it.checked}
                    onChange={e => handleToggle(it.id, e.target.checked)}
                  />
                  <span className={`text-[13px] leading-snug ${it.checked ? 'text-ink-4 line-through' : 'text-ink-2'}`}>
                    {it.label}
                  </span>
                  {it.checked && it.checkedAt && (
                    <span className="ml-auto text-[10px] text-ink-4 shrink-0 tabular">
                      {formatTime(it.checkedAt)}
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex-1 p-4 flex flex-col items-center justify-center gap-3 text-center min-h-[160px]">
          <p className="text-[12px] text-ink-4 max-w-[28ch]">
            {kind === 'opening'
              ? 'Walk through the opening routine before you start serving.'
              : 'End the day clean — count cash, lock up, set up tomorrow.'}
          </p>
          <button
            onClick={handleStart}
            className="px-4 py-2 rounded-lg btn-primary text-xs font-semibold"
          >
            Start {KIND_LABEL[kind].toLowerCase()} checklist →
          </button>
        </div>
      )}
    </section>
  )
}

function TemplateEditor({
  kind, side, onChange, toast,
}: {
  kind: Kind
  side: SideState
  onChange: () => void
  toast: ReturnType<typeof useToast>
}) {
  const [, startTransition] = useTransition()
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  function handleAdd() {
    const label = newLabel.trim()
    if (!label) return
    startTransition(async () => {
      const res = await addTemplateItem(side.template.id, label)
      if (res.error) toast(res.error, 'error')
      else { setNewLabel(''); onChange() }
    })
  }

  function handleSaveEdit(itemId: string) {
    const label = editValue.trim()
    if (!label) { setEditingId(null); return }
    startTransition(async () => {
      const res = await updateTemplateItem(itemId, label)
      if (res.error) toast(res.error, 'error')
      else { setEditingId(null); onChange() }
    })
  }

  function handleDelete(itemId: string) {
    if (!confirm('Remove this step from the template?')) return
    startTransition(async () => {
      const res = await deleteTemplateItem(itemId)
      if (res.error) toast(res.error, 'error')
      else onChange()
    })
  }

  return (
    <section className="rounded-xl border border-hair bg-surface">
      <div className="px-4 py-3 border-b border-hair flex items-center gap-2">
        <span className="text-lg" aria-hidden>{KIND_EMOJI[kind]}</span>
        <h2 className="text-[13px] font-semibold text-ink">{side.template.name}</h2>
        <span className="ml-auto text-[11px] text-ink-4">{side.items.length} steps</span>
      </div>

      <ul className="p-2 space-y-1">
        {side.items.map(it => (
          <li key={it.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-2 group">
            <span className="text-[11px] text-ink-4 tabular w-5 shrink-0">{it.position + 1}.</span>
            {editingId === it.id ? (
              <>
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveEdit(it.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 input-field text-[13px]"
                />
                <button onClick={() => handleSaveEdit(it.id)} className="text-[11px] text-accent font-semibold">Save</button>
                <button onClick={() => setEditingId(null)} className="text-[11px] text-ink-4">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-[13px] text-ink-2">{it.label}</span>
                <button
                  onClick={() => { setEditingId(it.id); setEditValue(it.label) }}
                  className="opacity-0 group-hover:opacity-100 text-[11px] text-ink-4 hover:text-ink transition-opacity"
                >Edit</button>
                <button
                  onClick={() => handleDelete(it.id)}
                  className="opacity-0 group-hover:opacity-100 text-[11px] text-ink-4 hover:text-danger transition-opacity"
                >×</button>
              </>
            )}
          </li>
        ))}
        {side.items.length === 0 && (
          <li className="text-[12px] text-ink-4 px-3 py-4 text-center">No steps yet — add the first one below.</li>
        )}
      </ul>

      <div className="border-t border-hair p-3 flex items-center gap-2">
        <input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder={kind === 'opening' ? 'e.g. Check espresso machine pressure' : 'e.g. Empty grease trap'}
          className="flex-1 input-field text-[13px]"
        />
        <button
          onClick={handleAdd}
          disabled={!newLabel.trim()}
          className="px-3 py-2 rounded-lg btn-primary text-[12px] font-semibold disabled:opacity-50"
        >
          Add step
        </button>
      </div>

      <p className="px-4 pb-3 text-[10px] text-ink-4 leading-relaxed">
        Edits apply to future runs. Today&apos;s run keeps its current steps so checked items don&apos;t disappear mid-shift.
      </p>
    </section>
  )
}
