'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import MiniDashboard from './MiniDashboard'

// ── Particles ──────────────────────────────────────────────────────────────────

function Particles() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const dots = Array.from(el.querySelectorAll<HTMLSpanElement>('.particle-dot'))
    dots.forEach((dot) => {
      const xStart = (Math.random() - 0.5) * 80
      const yStart = (Math.random() - 0.5) * 80
      gsap.set(dot, { x: xStart + '%', y: yStart + '%', opacity: 0 })
      gsap.to(dot, {
        opacity: Math.random() * 0.35 + 0.1,
        duration: Math.random() * 1.5 + 0.8,
        delay: Math.random() * 2,
        onComplete() {
          gsap.to(dot, {
            x: `+=${(Math.random() - 0.5) * 20}%`,
            y: `+=${(Math.random() - 0.5) * 20}%`,
            opacity: Math.random() * 0.3 + 0.05,
            duration: Math.random() * 6 + 4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        },
      })
    })
    return () => { gsap.killTweensOf(dots) }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="particle-dot absolute w-[3px] h-[3px] rounded-full bg-accent opacity-0"
          style={{ left: '50%', top: '50%' }}
        />
      ))}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

interface Props { theme?: string }

export default function HeroScene3D({ theme = 'ember' }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const panel   = panelRef.current
    if (!wrapper || !panel) return

    gsap.to(panel, { y: -14, duration: 4.8, repeat: -1, yoyo: true, ease: 'sine.inOut' })

    const onMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect()
      const cx   = rect.left + rect.width  / 2
      const cy   = rect.top  + rect.height / 2
      const rx   = ((e.clientY - cy) / window.innerHeight) * -14
      const ry   = ((e.clientX - cx) / window.innerWidth)  *  16
      gsap.to(panel, { rotateX: rx, rotateY: ry, duration: 0.9, ease: 'power2.out', overwrite: 'auto' })
    }
    const onLeave = () => {
      gsap.to(panel, { rotateX: 0, rotateY: 0, duration: 1.4, ease: 'elastic.out(1, 0.55)', overwrite: 'auto' })
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    wrapper.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      wrapper.removeEventListener('mouseleave', onLeave)
      gsap.killTweensOf(panel)
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full flex items-center justify-center"
      style={{ perspective: '1100px' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <div className="w-[75%] h-[65%] rounded-3xl bg-accent/8 blur-[72px]" />
        <div className="absolute w-[45%] h-[40%] rounded-3xl bg-accent/5 blur-[40px]" />
      </div>

      <Particles />

      {/* 3D panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-[520px]"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {/* Edge glow ring */}
        <div
          className="absolute -inset-[2px] rounded-[16px] pointer-events-none z-0"
          style={{ background: 'linear-gradient(135deg, rgba(110,231,183,0.18) 0%, transparent 50%, rgba(110,231,183,0.08) 100%)' }}
          aria-hidden="true"
        />

        {/* Browser chrome */}
        <div
          className="relative z-10 rounded-[14px] overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)' }}
        >
          {/* Chrome bar */}
          <div style={{ background: '#161a1d', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: 10 }}>
              <div style={{ display: 'flex', gap: 5, marginRight: 10 }}>
                {(['#ff5f57', '#ffbd2e', '#28c840'] as const).map(c => (
                  <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, display: 'block' }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: '5px 5px 0 0', background: '#1e2328', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none', fontSize: 9, color: 'rgba(255,255,255,0.62)', fontFamily: 'system-ui' }}>
                <svg width="8" height="8" viewBox="0 0 14 14" fill="none"><path d="M3 11C3 8 5 6 7 6C9 6 11 8 11 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M7 6V2M5 4l2-2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Tenda
              </div>
            </div>
            <div style={{ display: 'flex', padding: '4px 0 8px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: '#0e1114', borderRadius: 5, padding: '4px 10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <svg width="8" height="9" viewBox="0 0 9 10" fill="none" style={{ opacity: 0.35 }}><rect x="1" y="4" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3 4V3a1.5 1.5 0 013 0v1" stroke="currentColor" strokeWidth="1.2"/></svg>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>tenda.ph/dashboard</span>
              </div>
            </div>
          </div>

          {/* Live themed dashboard — 320px tall */}
          <div data-theme={theme} style={{ height: 320, overflow: 'hidden' }}>
            <MiniDashboard />
          </div>
        </div>
      </div>
    </div>
  )
}
