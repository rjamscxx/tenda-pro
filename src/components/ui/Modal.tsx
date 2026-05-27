'use client'

import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  icon?: React.ReactNode
  variant?: 'default' | 'danger'
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, icon, variant = 'default', children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass glow rounded-xl w-full max-w-md overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-hair">
          {icon ? (
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              variant === 'danger' ? 'bg-danger/15 text-danger' : 'bg-accent-dim text-accent'
            }`}>
              {icon}
            </div>
          ) : null}
          <h2 className="font-semibold text-ink flex-1">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink-4 hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-2 shrink-0"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
