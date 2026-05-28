'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-danger">
            <path d="M10 2L18 16H2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M10 8v4M10 13.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-ink">Something went wrong</h2>
          <p className="text-sm text-ink-4 break-all">
            {error.message || (error.digest ? `Error ID: ${error.digest}` : 'An unexpected error occurred on this page.')}
          </p>
        </div>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 btn-primary rounded-lg text-sm"
          >
            Try again
          </button>
          <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-surface-2 border border-hair text-sm text-ink-3 hover:text-ink transition-colors">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
