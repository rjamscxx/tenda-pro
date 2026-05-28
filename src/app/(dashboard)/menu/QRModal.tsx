'use client'

import { useEffect, useRef, useState } from 'react'
import Modal from '@/components/ui/Modal'
import QRCode from 'qrcode'

export default function QRModal({
  open,
  onClose,
  venueId,
  venueName,
}: {
  open: boolean
  onClose: () => void
  venueId: string
  venueName: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [menuUrl, setMenuUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMenuUrl(`${window.location.origin}/m/${venueId}`)
    }
  }, [venueId])

  useEffect(() => {
    if (!open || !canvasRef.current || !menuUrl) return
    QRCode.toCanvas(canvasRef.current, menuUrl, {
      width: 240,
      margin: 2,
      color: { dark: '#111111', light: '#ffffff' },
    })
  }, [open, menuUrl])

  function downloadQR() {
    if (!canvasRef.current) return
    const a = Object.assign(document.createElement('a'), {
      href: canvasRef.current.toDataURL('image/png'),
      download: `${venueName.toLowerCase().replace(/\s+/g, '-')}-menu-qr.png`,
    })
    a.click()
  }

  return (
    <Modal open={open} onClose={onClose} title="Menu QR Code">
      <div className="flex flex-col items-center gap-5">
        <div className="p-3 rounded-xl border border-hair bg-white">
          <canvas ref={canvasRef} className="rounded-md block" />
        </div>

        <div className="w-full space-y-1.5 text-center">
          <p className="text-[11px] text-ink-4 uppercase tracking-widest">Public menu link</p>
          <p className="text-xs text-ink-3 break-all font-mono bg-surface-2 rounded-lg px-3 py-2">
            {menuUrl}
          </p>
        </div>

        <p className="text-[11px] text-ink-4 text-center max-w-xs">
          Customers scan this code to view your live menu. Sold-out items are automatically hidden.
        </p>

        <div className="flex gap-2.5 w-full">
          <button
            onClick={downloadQR}
            className="flex-1 py-2.5 rounded-lg border border-hair text-sm font-medium text-ink-2 hover:border-accent hover:text-accent transition-colors"
          >
            Download PNG
          </button>
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 btn-primary rounded-lg text-sm font-medium text-center"
          >
            Open Menu →
          </a>
        </div>
      </div>
    </Modal>
  )
}
