'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <html>
      <body style={{ margin: 0, background: '#0E1714', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 360 }}>
          <p style={{ color: '#F87171', fontSize: 13, marginBottom: 8 }}>Unexpected error</p>
          <h1 style={{ color: '#ECE6D5', fontSize: 20, fontWeight: 600, margin: '0 0 16px' }}>Tenda Pro ran into a problem</h1>
          {error.digest && (
            <p style={{ color: '#6B8A7E', fontSize: 12, marginBottom: 16 }}>Error ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            style={{ background: '#58C098', color: '#0E1714', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
