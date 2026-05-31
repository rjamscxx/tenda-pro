'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { addSupplier, updateSupplier, deleteSupplier, assignSupplierToIngredient } from './actions'

export interface Supplier {
  id: string
  name: string
  contactName: string | null
  phone: string | null
  email: string | null
  notes: string | null
  ingredientCount: number
}

export interface IngredientRow {
  id: string
  name: string
  unit: string
  supplierId: string | null
  supplierName: string | null
}

interface FormState {
  name: string
  contactName: string
  phone: string
  email: string
  notes: string
}

const EMPTY_FORM: FormState = { name: '', contactName: '', phone: '', email: '', notes: '' }

function SupplierForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial: FormState
  onSubmit: (f: FormState) => void
  onCancel: () => void
  loading: boolean
  error: string
}) {
  const [form, setForm] = useState<FormState>(initial)
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Supplier name *</label>
        <input
          autoFocus
          value={form.name}
          onChange={set('name')}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent"
          placeholder="e.g. Mega Foodservice Supply"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Contact person</label>
          <input
            value={form.contactName}
            onChange={set('contactName')}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent"
            placeholder="Juan Dela Cruz"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent"
            placeholder="09XX XXX XXXX"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={set('email')}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent"
          placeholder="orders@supplier.ph"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">Notes</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-hair text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-accent resize-none"
          placeholder="Payment terms, delivery days, etc."
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-hair text-ink-3 text-sm font-medium hover:bg-surface transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={loading || !form.name.trim()}
          onClick={() => onSubmit(form)}
          className="flex-1 py-2 btn-primary rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save supplier'}
        </button>
      </div>
    </div>
  )
}

export default function SuppliersClient({
  suppliers: initialSuppliers,
  ingredients,
}: {
  suppliers: Supplier[]
  ingredients: IngredientRow[]
}) {
  const toast = useToast()
  const [suppliers, setSuppliers]         = useState(initialSuppliers)
  const [showAdd, setShowAdd]             = useState(false)
  const [editTarget, setEditTarget]       = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<Supplier | null>(null)
  const [expandedId, setExpandedId]       = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)
  const [formError, setFormError]         = useState('')
  const [assigning, setAssigning]         = useState(false)

  const supplierIngredients = ingredients.filter(i => i.supplierId === expandedId)
  const unassigned = ingredients.filter(i => !i.supplierId)

  async function handleAdd(form: FormState) {
    setLoading(true)
    setFormError('')
    const res = await addSupplier(form)
    setLoading(false)
    if (res.error) { setFormError(res.error); return }
    setShowAdd(false)
    toast('Supplier added')
    window.location.reload()
  }

  async function handleUpdate(form: FormState) {
    if (!editTarget) return
    setLoading(true)
    setFormError('')
    const res = await updateSupplier(editTarget.id, form)
    setLoading(false)
    if (res.error) { setFormError(res.error); return }
    setEditTarget(null)
    toast('Supplier updated')
    window.location.reload()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setLoading(true)
    const res = await deleteSupplier(deleteTarget.id)
    setLoading(false)
    if (res.error) { toast(res.error, 'error'); return }
    setDeleteTarget(null)
    toast('Supplier removed')
    window.location.reload()
  }

  async function handleAssign(ingredientId: string, supplierId: string | null) {
    setAssigning(true)
    const res = await assignSupplierToIngredient(ingredientId, supplierId)
    setAssigning(false)
    if (res.error) { toast(res.error, 'error'); return }
    toast('Ingredient updated')
    window.location.reload()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hair shrink-0">
        <div>
          <h1 className="font-semibold text-ink text-base">Suppliers</h1>
          <p className="text-xs text-ink-4 mt-0.5">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setFormError('') }}
          className="btn-primary px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Add supplier
        </button>
      </div>

      {/* Empty */}
      {suppliers.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6 py-12">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-ink-4">
            <rect x="4" y="10" width="32" height="22" rx="3" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 10V8a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M14 20h12M14 25h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-ink-3 text-sm font-medium">No suppliers yet</p>
          <p className="text-ink-4 text-xs max-w-xs">Add your ingredient suppliers to track where you source from and quickly reorder low-stock items.</p>
          <button
            onClick={() => { setShowAdd(true); setFormError('') }}
            className="mt-1 btn-primary px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Add first supplier
          </button>
        </div>
      )}

      {/* Supplier list */}
      {suppliers.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {suppliers.map(sup => {
            const expanded = expandedId === sup.id
            const ings = ingredients.filter(i => i.supplierId === sup.id)
            return (
              <div
                key={sup.id}
                className="rounded-xl border border-hair bg-surface overflow-hidden"
              >
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                  >
                    {sup.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-sm truncate">{sup.name}</p>
                    <p className="text-xs text-ink-4 truncate">
                      {[sup.contactName, sup.phone].filter(Boolean).join(' · ') || (sup.email ?? 'No contact info')}
                    </p>
                  </div>
                  <span className="text-xs text-ink-4 shrink-0">{sup.ingredientCount} ingredient{sup.ingredientCount !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setExpandedId(expanded ? null : sup.id)}
                    className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-surface-2 transition-colors"
                    title={expanded ? 'Collapse' : 'View ingredients'}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
                      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => { setEditTarget(sup); setFormError('') }}
                    className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-surface-2 transition-colors"
                    title="Edit"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(sup)}
                    className="p-1.5 rounded-lg text-ink-4 hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5 3.5V2.5h4v1M5.5 3.5l.5 8h2l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Expanded: ingredient list + assign */}
                {expanded && (
                  <div className="border-t border-hair px-4 py-3 space-y-2 bg-canvas/40">
                    {ings.length === 0 && (
                      <p className="text-xs text-ink-4 italic">No ingredients linked to this supplier yet.</p>
                    )}
                    {ings.map(ing => (
                      <div key={ing.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-ink">{ing.name} <span className="text-ink-4">({ing.unit})</span></span>
                        <button
                          disabled={assigning}
                          onClick={() => handleAssign(ing.id, null)}
                          className="text-xs text-ink-4 hover:text-danger transition-colors"
                        >
                          Unlink
                        </button>
                      </div>
                    ))}
                    {/* Add unassigned ingredient */}
                    {unassigned.length > 0 && (
                      <div className="pt-1 flex items-center gap-2">
                        <select
                          id={`assign-${sup.id}`}
                          defaultValue=""
                          onChange={async e => {
                            if (!e.target.value) return
                            const val = e.target.value
                            e.target.value = ''
                            await handleAssign(val, sup.id)
                          }}
                          disabled={assigning}
                          className="flex-1 px-2 py-1.5 rounded-lg bg-surface border border-hair text-ink text-xs focus:outline-none focus:border-accent"
                        >
                          <option value="">+ Link an ingredient…</option>
                          {unassigned.map(i => (
                            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {sup.notes && (
                      <p className="text-xs text-ink-4 italic pt-1">{sup.notes}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add supplier">
        <SupplierForm
          initial={EMPTY_FORM}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          loading={loading}
          error={formError}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit supplier">
        {editTarget && (
          <SupplierForm
            initial={{
              name:        editTarget.name,
              contactName: editTarget.contactName ?? '',
              phone:       editTarget.phone ?? '',
              email:       editTarget.email ?? '',
              notes:       editTarget.notes ?? '',
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
            loading={loading}
            error={formError}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete supplier?">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-ink-3">
              Remove <span className="font-semibold text-ink">{deleteTarget.name}</span>? Their ingredients will be unlinked but not deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg border border-hair text-ink-3 text-sm font-medium hover:bg-surface"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleDelete}
                className="flex-1 py-2 rounded-lg bg-danger text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
