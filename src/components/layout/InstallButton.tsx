'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// External-store snapshot for "is the app running as an installed PWA".
function subscribeStandalone(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mq = window.matchMedia('(display-mode: standalone)')
  mq.addEventListener('change', callback)
  window.addEventListener('appinstalled', callback)
  return () => {
    mq.removeEventListener('change', callback)
    window.removeEventListener('appinstalled', callback)
  }
}
function getStandaloneSnapshot() {
  return typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
}
function getServerSnapshot() {
  return false
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [acceptedInstall, setAcceptedInstall] = useState(false)
  const isStandalone = useSyncExternalStore(subscribeStandalone, getStandaloneSnapshot, getServerSnapshot)
  const installed = isStandalone || acceptedInstall

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
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
        if (outcome === 'accepted') setAcceptedInstall(true)
        setDeferredPrompt(null)
      }}
      className="flex items-center gap-2 px-4 py-2.5 btn-primary rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 1v9M4.5 7l3 3 3-3M2 11v1.5A1.5 1.5 0 003.5 14h8A1.5 1.5 0 0013 12.5V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Install Tenda on this device
    </button>
  )
}
