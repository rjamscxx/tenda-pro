'use client'

import { useState } from 'react'
import { addEmployee, updateEmployee, toggleEmployeeActive } from './actions'
import type { EmployeeInput } from './actions'
import Modal from '@/components/ui/Modal'
import { formatCurrency, formatDate, todayISO } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'

interface Employee {
  id: string
  fullName: string
  role: string
  payType: 'daily' | 'monthly' | 'hourly'
  payRate: number
  startDate: string
  isActive: boolean
  contactNumber: string | null
  weekShifts: { count: number; hours: number }
}

interface Props {
  employees: Employee[]
}

export default function EmployeesClient({ employees }: Props) {
  const toast = useToast()
  const [modalOpen, setModalOpen]     = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [toggling, setToggling]         = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [search, setSearch]             = useState('')

  // Form state
  const [fullName, setFullName]           = useState('')
  const [role, setRole]                   = useState('')
  const [payType, setPayType]             = useState<'daily' | 'monthly' | 'hourly'>('daily')
  const [payRateInput, setPayRateInput]   = useState('')
  const [startDate, setStartDate]         = useState(todayISO())
  const [contactNumber, setContactNumber] = useState('')

  const active    = employees.filter(e => e.isActive)
  const inactive  = employees.filter(e => !e.isActive)
  const base      = showInactive ? employees : active
  const displayed = search.trim()
    ? base.filter(e =>
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
        e.role.toLowerCase().includes(search.toLowerCase())
      )
    : base

  const monthlyLaborEstimate = active.reduce((s, e) => {
    if (e.payType === 'monthly') return s + e.payRate
    if (e.payType === 'hourly')  return s + e.payRate * 8 * 26 // 8 hrs/day × 26 working days
    return s + e.payRate * 26 // daily × 26 working days
  }, 0)

  function openAdd() {
    setEditingId(null)
    setFullName(''); setRole(''); setPayType('daily')
    setPayRateInput(''); setStartDate(todayISO()); setContactNumber('')
    setError(''); setModalOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditingId(emp.id)
    setFullName(emp.fullName)
    setRole(emp.role)
    setPayType(emp.payType)
    setPayRateInput((emp.payRate / 100).toFixed(2))
    setStartDate(emp.startDate)
    setContactNumber(emp.contactNumber ?? '')
    setError(''); setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false); setEditingId(null); setError('')
  }

  function buildInput(): EmployeeInput | null {
    if (!fullName.trim()) { setError('Name is required'); return null }
    const rate = parseFloat(payRateInput)
    if (isNaN(rate) || rate <= 0) { setError('Enter a valid pay rate'); return null }
    if (!startDate) { setError('Start date is required'); return null }
    return {
      fullName,
      role:          role.trim() || 'Staff',
      payType,
      payRate:       Math.round(rate * 100),
      startDate,
      contactNumber: contactNumber.trim() || undefined,
    }
  }

  async function handleSubmit() {
    const input = buildInput()
    if (!input) return
    setLoading(true); setError('')
    const res = editingId
      ? await updateEmployee(editingId, input)
      : await addEmployee(input)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    const wasEditing = editingId
    closeModal()
    toast(wasEditing ? 'Employee updated' : 'Employee added')
  }

  async function handleToggle(id: string) {
    setToggling(id)
    await toggleEmployeeActive(id)
    setToggling(null)
    toast('Status updated', 'info')
  }

  return (
    <>
      {/* Header */}
      <div className="px-6 py-5 border-b border-hair flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Employees</h1>
          <p className="text-[12px] text-ink-4 mt-0.5">
            {employees.length === 0
              ? 'Manage staff records, pay rates, and status.'
              : [active.length > 0 && `${active.length} active`, inactive.length > 0 && `${inactive.length} inactive`].filter(Boolean).join(' · ')
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-7 pr-3 py-1.5 rounded-lg bg-surface-2 border border-hair text-[12px] text-ink placeholder:text-ink-4 w-32 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button className="btn-primary px-4 py-2 text-[13px]" onClick={openAdd}>
            + Add Employee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-3 border-b border-hair flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold">Active Staff</p>
            <p className="text-[20px] font-semibold tabular text-ink leading-tight">{active.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-ink-4 uppercase tracking-wider font-semibold">Est. Monthly Labor</p>
            <p className="text-[20px] font-semibold tabular text-ink leading-tight">{formatCurrency(monthlyLaborEstimate)}</p>
          </div>
        </div>
        {inactive.length > 0 && (
          <button
            onClick={() => setShowInactive(v => !v)}
            className="text-[12px] text-ink-4 hover:text-ink transition-colors"
          >
            {showInactive ? 'Hide inactive' : `Show ${inactive.length} inactive`}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <EmptyState
            icon={
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <circle cx="10" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M1 24c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M19 11a3.5 3.5 0 100-7M24 24c0-3.7-2.02-6.94-5-8.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
            title="No employees yet"
            body="Add staff with daily or monthly pay rates. Track labor costs alongside your food cost."
            action={{ label: '+ Add employee', onClick: openAdd }}
          />
        ) : (
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-canvas z-10">
              <tr className="border-b border-hair">
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Pay Type</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Rate</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-wider hidden md:table-cell">Since</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-ink-4 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(emp => (
                <tr
                  key={emp.id}
                  className={`border-b border-hair hover:bg-surface-2 transition-colors ${!emp.isActive ? 'opacity-50' : ''}`}
                >
                  <td className="px-6 py-3">
                    <div>
                      <p className="font-medium text-ink">{emp.fullName}</p>
                      {emp.contactNumber && (
                        <p className="text-[11px] text-ink-4">{emp.contactNumber}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-3">{emp.role}</td>
                  <td className="px-4 py-3">
                    <span className={emp.payType === 'monthly' ? 'badge badge-accent' : 'badge'}>
                      {emp.payType === 'monthly' ? 'Monthly' : emp.payType === 'hourly' ? 'Hourly' : 'Daily'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular font-medium text-ink">
                    {formatCurrency(emp.payRate)}
                    <span className="text-[11px] text-ink-4 font-normal ml-0.5">
                      /{emp.payType === 'monthly' ? 'mo' : emp.payType === 'hourly' ? 'hr' : 'day'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-4 hidden md:table-cell">{formatDate(emp.startDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={emp.isActive ? 'badge badge-accent' : 'badge'}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {emp.weekShifts.count > 0 && (
                        <a href="/shifts" className="text-[10px] text-ink-4 hover:text-accent transition-colors tabular">
                          {emp.weekShifts.count} shift{emp.weekShifts.count === 1 ? '' : 's'} · {emp.weekShifts.hours}h this wk →
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(emp)}
                        className="text-ink-4 hover:text-ink transition-colors p-1"
                        aria-label="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M9.5 2.5l2 2L4.5 11.5H2.5v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggle(emp.id)}
                        disabled={toggling === emp.id}
                        className="text-ink-4 hover:text-ink transition-colors p-1 disabled:opacity-40 text-[11px]"
                        aria-label={emp.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {emp.isActive ? (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                            <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                            <path d="M9 5l-4 4M5 5l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Employee' : 'Add Employee'}
      >
        <div className="space-y-4">
          {/* Name + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-ink-3 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Juan dela Cruz"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-3 mb-1.5">
                Role <span className="text-ink-4 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Barista, Cook"
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Pay Type */}
          <div>
            <label className="block text-[12px] font-medium text-ink-3 mb-2">Pay Type</label>
            <div className="flex gap-2">
              {([
                ['daily',   'Daily Rate'],
                ['hourly',  'Hourly Rate'],
                ['monthly', 'Monthly Salary'],
              ] as const).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPayType(t)}
                  className={`flex-1 py-2 rounded-lg text-[13px] font-medium border transition-all ${
                    payType === t
                      ? 'border-accent bg-accent-tint text-accent'
                      : 'border-hair text-ink-3 hover:border-hair-2 hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Pay Rate + Start Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-ink-3 mb-1.5">
                {payType === 'daily' ? 'Daily Rate (₱)' : payType === 'hourly' ? 'Hourly Rate (₱)' : 'Monthly Salary (₱)'}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={payRateInput}
                onChange={e => setPayRateInput(e.target.value)}
                placeholder={payType === 'daily' ? '650.00' : payType === 'hourly' ? '95.00' : '15000.00'}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-3 mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-[12px] font-medium text-ink-3 mb-1.5">
              Contact Number <span className="text-ink-4 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={contactNumber}
              onChange={e => setContactNumber(e.target.value)}
              placeholder="09XX XXX XXXX"
              className="input-field w-full"
            />
          </div>

          {error && <p className="text-[12px] text-danger">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button className="btn-secondary flex-1" onClick={closeModal}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving…' : editingId ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
