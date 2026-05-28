'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Already running as standalone (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M4.5 7.5l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        App installed on this device
      </div>
    )
  }

  if (!deferredPrompt) {
    return (
      <p className="text-xs text-ink-4">
        Open this page in Chrome on Android or Edge on desktop to install the app.
      </p>
    )
  }

  return (
    <button
      onClick={async () => {
        if (!deferredPrompt) return
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') setInstalled(true)
        setDeferredPrompt(null)
      }}
      className="flex items-center gap-2 px-4 py-2.5 btn-primary rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 1v9M4.5 7l3 3 3-3M2 11v1.5A1.5 1.5 0 003.5 14h8A1.5 1.5 0 0013 12.5V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Install Sizzle on this device
    </button>
  )
}
