'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

// ── Mini live dashboard preview ────────────────────────────────────────────────
// Renders using CSS variables so it responds to data-theme changes immediately

const BARS = [52, 68, 45, 74, 60, 83, 58, 77, 65, 88, 71, 94, 79, 91]

function MiniDashboard() {
  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{
        width: 44,
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--hair)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 0 12px',
        gap: 14,
        flexShrink: 0,
      }}>
        {/* Logo mark */}
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', marginBottom: 4 }} />
        {/* Nav dots */}
        {[true, false, false, false, false, false, false].map((active, i) => (
          <div key={i} style={{
            width: active ? 22 : 18,
            height: 4,
            borderRadius: 2,
            background: active ? 'var(--accent)' : 'var(--surface-3)',
            opacity: active ? 1 : 0.6,
          }} />
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, background: 'var(--canvas)', padding: '14px 14px 10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Page title */}
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          Dashboard
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {[
            { label: 'Revenue Today', value: '₱18.4K', sub: '+14.2%', pos: true },
            { label: 'Food Cost',     value: '28.4%',  sub: '−2.1%',  pos: true },
            { label: 'Gross Margin',  value: '71.6%',  sub: '+3.0%',  pos: true },
            { label: 'Low Stock',     value: '3',      sub: 'items',   pos: null },
          ].map(c => (
            <div key={c.label} style={{
              background: 'var(--surface)',
              border: '1px solid var(--hair)',
              borderRadius: 7,
              padding: '7px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}>
              <span style={{ fontSize: 7, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{c.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>{c.value}</span>
              <span style={{ fontSize: 8, fontWeight: 600, color: c.pos === true ? 'var(--success)' : c.pos === false ? 'var(--danger)' : 'var(--ink-3)' }}>{c.sub}</span>
            </div>
          ))}
        </div>

        {/* Cashflow chart */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--hair)',
          borderRadius: 7,
          padding: '8px 10px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minHeight: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>30-day Revenue vs Expenses</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['var(--accent)', 'Revenue'], ['var(--danger)', 'Expenses']].map(([c, l]) => (
                <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 1, background: c as string }} />
                  <span style={{ fontSize: 7, color: 'var(--ink-4)' }}>{l as string}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, flex: 1 }}>
            {BARS.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ height: `${h * 0.55}%`, borderRadius: '2px 2px 0 0', background: 'var(--danger)', opacity: 0.45 }} />
                <div style={{ height: `${h}%`, borderRadius: '2px 2px 0 0', background: 'var(--accent)', opacity: 0.7 + (i / BARS.length) * 0.3 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Top sellers */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--hair)',
          borderRadius: 7,
          padding: '8px 10px',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 8, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Today&apos;s Top Sellers</div>
          {[
            { name: 'Iced Matcha Latte', rev: '₱4,200' },
            { name: 'Avocado Toast',     rev: '₱3,150' },
            { name: 'Cold Brew Coffee',  rev: '₱2,880' },
          ].map(d => (
            <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', opacity: 0.7 }} />
                <span style={{ fontSize: 8.5, color: 'var(--ink-3)' }}>{d.name}</span>
              </div>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--accent)' }}>{d.rev}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

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

export default function HeroScene3D({ theme = 'sage-dark' }: Props) {
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: '5px 5px 0 0', background: '#1e2328', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none', fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui' }}>
                <svg width="8" height="8" viewBox="0 0 14 14" fill="none"><path d="M3 11C3 8 5 6 7 6C9 6 11 8 11 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M7 6V2M5 4l2-2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Sizzle
              </div>
            </div>
            <div style={{ display: 'flex', padding: '4px 0 8px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: '#0e1114', borderRadius: 5, padding: '4px 10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <svg width="8" height="9" viewBox="0 0 9 10" fill="none" style={{ opacity: 0.35 }}><rect x="1" y="4" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3 4V3a1.5 1.5 0 013 0v1" stroke="currentColor" strokeWidth="1.2"/></svg>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace' }}>sizzle.app/dashboard</span>
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
