'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * OwnerScene — "A day with Tenda Pro" section.
 * Tablet mockup built from CSS-themed primitives (so theme switching propagates
 * through it correctly) + floating POS phone + scroll-synced day timeline.
 */

const EXPENSE_BAR_HEIGHTS = Array.from({ length: 30 }, (_, i) => 6 + Math.abs(Math.sin(i * 1.7) * 12) + (i * 0.3 % 3))

const TAPS = [
  { x: 79, y: 67, label: 'Ask the assistant' },
]

const DAY_STEPS = [
  {
    time: '7:45 AM',
    title: 'Opening prep',
    detail: 'Glance at yesterday’s recap before staff arrives. Margins, top sellers, anything 86’d.',
    accent: 'text-accent',
  },
  {
    time: '12:30 PM',
    title: 'Lunch rush',
    detail: 'POS handles 40+ orders. Inventory auto-deducts. Food cost stays accurate.',
    accent: 'text-warn',
  },
  {
    time: '3:00 PM',
    title: 'Restock check',
    detail: 'Low-stock alerts on the dashboard. Order now or wait — you decide with data.',
    accent: 'text-accent',
  },
  {
    time: '10:00 PM',
    title: 'Close-out',
    detail: 'See net profit for the day. Daily digest summarizes the shift in two sentences.',
    accent: 'text-success',
  },
]

export default function OwnerScene() {
  const sectionRef = useRef<HTMLElement>(null)
  const tabletRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (noMotion) {
      sectionRef.current?.querySelectorAll<HTMLElement>(
        '.owner-tablet, .owner-phone, .day-step, .touch-dot, .owner-eyebrow, .owner-title, .owner-sub'
      ).forEach(el => { el.style.opacity = '1' })
      return
    }

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.owner-eyebrow', { y: 16, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.6, ease: 'expo.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 82%' },
      })
      gsap.fromTo('.owner-title', { y: 24, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.75, ease: 'expo.out', delay: 0.05,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 82%' },
      })
      gsap.fromTo('.owner-sub', { y: 18, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', delay: 0.15,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 82%' },
      })

      // Tablet entrance — 3D tilt-in
      gsap.fromTo(tabletRef.current,
        { y: 60, opacity: 0, rotationY: -16, rotationX: 12 },
        {
          y: 0, opacity: 1, rotationY: -6, rotationX: 4,
          duration: 1.2, ease: 'expo.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
        }
      )

      // Phone floats in after tablet
      gsap.fromTo(phoneRef.current,
        { y: 80, opacity: 0, rotation: 8, scale: 0.9 },
        {
          y: 0, opacity: 1, rotation: -4, scale: 1,
          duration: 1.1, ease: 'expo.out', delay: 0.35,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
        }
      )

      // Continuous gentle float on phone
      gsap.to(phoneRef.current, {
        y: -10, duration: 3.5, ease: 'sine.inOut',
        yoyo: true, repeat: -1, delay: 1.5,
      })

      // Parallax on tablet through section
      gsap.to(tabletRef.current, {
        y: -24, ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      })

      // Tap dots stagger in and pulse
      gsap.fromTo('.touch-dot',
        { scale: 0, opacity: 0 },
        {
          scale: 1, opacity: 1, stagger: 0.35, duration: 0.55,
          ease: 'back.out(1.8)', delay: 0.8,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
        }
      )

      // Day timeline cards
      gsap.fromTo('.day-step',
        { x: -30, opacity: 0 },
        {
          x: 0, opacity: 1, stagger: 0.12, duration: 0.7, ease: 'expo.out',
          scrollTrigger: { trigger: '.day-step', start: 'top 80%' },
        }
      )
    }, sectionRef)

    return () => { ctx.revert() }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="owner-scene"
      className="relative py-24 px-4 border-t border-hair overflow-hidden"
    >
      {/* Atmospheric steam wisps + coffee bean dots (low opacity) */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <svg
          className="absolute top-8 right-[8%] w-24 h-44 opacity-[0.06]"
          viewBox="0 0 40 70"
          fill="none"
        >
          <path d="M20 70 Q15 50, 22 38 T16 18 T24 0" stroke="currentColor" strokeWidth="1" className="text-accent" strokeLinecap="round">
            <animate
              attributeName="d"
              dur="7s"
              repeatCount="indefinite"
              values="M20 70 Q15 50, 22 38 T16 18 T24 0;
                      M20 70 Q24 50, 18 38 T22 18 T20 0;
                      M20 70 Q15 50, 22 38 T16 18 T24 0"
            />
          </path>
          <path d="M28 70 Q22 56, 30 44 T20 28 T28 14" stroke="currentColor" strokeWidth="0.8" className="text-accent" strokeLinecap="round" opacity="0.6">
            <animate
              attributeName="d"
              dur="9s"
              repeatCount="indefinite"
              values="M28 70 Q22 56, 30 44 T20 28 T28 14;
                      M28 70 Q34 56, 26 44 T30 28 T22 14;
                      M28 70 Q22 56, 30 44 T20 28 T28 14"
            />
          </path>
        </svg>

        {/* scattered bean dots */}
        <div className="absolute bottom-10 left-[6%] opacity-[0.05]">
          <svg width="220" height="80" viewBox="0 0 220 80" fill="none" className="text-accent">
            {[[20,20],[60,40],[100,20],[140,50],[180,30],[210,60]].map(([cx, cy], i) => (
              <g key={i} transform={`translate(${cx} ${cy})`}>
                <ellipse rx="6" ry="9" fill="currentColor" />
                <path d="M0 -9 Q3 0, 0 9" stroke="var(--canvas)" strokeWidth="0.8" fill="none" />
              </g>
            ))}
          </svg>
        </div>

        {/* corner accent glow */}
        <div
          className="absolute -top-20 -left-20 w-[480px] h-[480px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.05 }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* ── Eyebrow + heading ───────────────────────────────── */}
        <div className="text-center max-w-[60ch] mx-auto mb-16">
          <p className="owner-eyebrow text-xs text-accent font-semibold uppercase tracking-widest mb-3" style={{ opacity: 0 }}>
            A day with Tenda Pro
          </p>
          <h2 className="owner-title text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight" style={{ opacity: 0 }}>
            One screen. Every shift.
          </h2>
          <p className="owner-sub text-base text-ink-3 mt-4 leading-relaxed" style={{ opacity: 0 }}>
            Real café owners run their whole day through Tenda Pro — opening prep, lunch rush, restock,
            close-out. Tap once, get the answer. No spreadsheet detective work.
          </p>
        </div>

        {/* ── Main two-column scene ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-16 items-center">

          {/* LEFT — Day timeline cards */}
          <div className="space-y-4 order-2 lg:order-1">
            {DAY_STEPS.map((step, i) => (
              <div
                key={step.time}
                className="day-step glass rounded-2xl p-5 flex gap-4 items-start shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-accent/30 transition-colors"
                style={{ opacity: 0 }}
              >
                {/* step number badge */}
                <div className="relative w-11 h-11 rounded-xl bg-surface-2 border border-hair flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold tabular text-ink-3">0{i + 1}</span>
                  {i < DAY_STEPS.length - 1 && (
                    <span className="absolute left-1/2 -translate-x-1/2 top-full w-px h-4 bg-gradient-to-b from-hair to-transparent" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <p className={`text-[11px] font-semibold tabular tracking-wider ${step.accent}`}>{step.time}</p>
                    <p className="font-semibold text-ink text-sm tracking-tight">{step.title}</p>
                  </div>
                  <p className="text-xs text-ink-3 mt-1.5 leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — Tablet + phone scene */}
          <div
            className="relative h-[420px] sm:h-[480px] lg:h-[560px] order-1 lg:order-2"
            style={{ perspective: 1500 }}
          >

            {/* Tablet mockup w/ dashboard screenshot */}
            <div
              ref={tabletRef}
              className="owner-tablet absolute inset-x-0 top-4 mx-auto w-[92%] max-w-[560px]"
              style={{ opacity: 0, transformStyle: 'preserve-3d' }}
            >
              <div className="relative rounded-[1.8rem] bg-[#0a0a0a] border border-white/10 p-3 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]">
                {/* tablet front camera dot */}
                <span className="absolute top-1/2 -translate-y-1/2 left-2.5 w-1.5 h-1.5 rounded-full bg-white/20" aria-hidden="true" />

                {/* screen — CSS-themed mock dashboard (no static image, so it
                    follows the active theme: --canvas / --accent / --ink etc.) */}
                <div
                  className="relative rounded-[1.3rem] overflow-hidden bg-canvas aspect-[16/10] flex"
                  role="img"
                  aria-label="Tenda Pro dashboard mock — KPIs, 30-day cashflow chart, top sellers, low-stock alerts, AI assistant"
                >
                  {/* sidebar */}
                  <aside className="hidden sm:flex w-[16%] shrink-0 flex-col gap-1 px-2 py-3 border-r border-hair bg-surface/60">
                    <div className="flex items-center gap-1 px-1 mb-1">
                      <span className="w-2 h-2 rounded-sm bg-accent" aria-hidden />
                      <span className="text-[7px] font-semibold tracking-widest text-ink-3 uppercase">Tenda Pro</span>
                    </div>
                    {['Dashboard','Sales','POS','Menu','Inventory','Reports','Settings'].map((l, i) => (
                      <div key={l} className={`flex items-center gap-1.5 px-1.5 py-1 rounded ${i===0 ? 'bg-accent/12 text-accent' : 'text-ink-4'}`}>
                        <span className={`w-1 h-1 rounded-sm ${i===0 ? 'bg-accent' : 'bg-ink-4/40'}`} aria-hidden />
                        <span className="text-[7px] font-medium">{l}</span>
                      </div>
                    ))}
                  </aside>

                  {/* main */}
                  <div className="flex-1 flex flex-col min-w-0 p-2.5 gap-2">

                    {/* header strip */}
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-semibold text-ink tracking-tight">Good morning, Lina</p>
                      <span className="text-[6.5px] text-ink-4 tabular">Today, May 30</span>
                    </div>

                    {/* KPI row — two cards (Food Cost % + low-stock) deliberately
                        chosen instead of Revenue / Margin per spec */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-md border border-hair bg-surface px-1.5 py-1">
                        <p className="text-[6px] uppercase tracking-widest text-ink-4">Food cost %</p>
                        <p className="text-[12px] font-bold text-accent tabular leading-none mt-0.5">25.4<span className="text-[8px]">%</span></p>
                        <p className="text-[6px] text-ink-4 mt-0.5">on target · 32% goal</p>
                      </div>
                      <div className="rounded-md border border-hair bg-surface px-1.5 py-1">
                        <p className="text-[6px] uppercase tracking-widest text-ink-4">Needs restock</p>
                        <p className="text-[12px] font-bold text-warn tabular leading-none mt-0.5">5</p>
                        <p className="text-[6px] text-ink-4 mt-0.5">items below threshold</p>
                      </div>
                    </div>

                    {/* 30-day chart — themed bars + smooth line */}
                    <div className="rounded-md border border-hair bg-surface px-1.5 py-1 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <p className="text-[6px] uppercase tracking-widest text-ink-4">30-day cashflow</p>
                        <div className="flex items-center gap-1.5 text-[5.5px] text-ink-4">
                          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-sm bg-accent" aria-hidden />Rev</span>
                          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-sm bg-warn" aria-hidden />Exp</span>
                        </div>
                      </div>
                      <svg viewBox="0 0 200 60" className="flex-1 w-full mt-1" preserveAspectRatio="none" aria-hidden>
                        {/* grid */}
                        {[0,1,2,3].map(i => (
                          <line key={i} x1="0" x2="200" y1={15 + i*12} y2={15 + i*12} stroke="var(--hair)" strokeWidth="0.4" />
                        ))}
                        {/* expense bars (faint warn) */}
                        {EXPENSE_BAR_HEIGHTS.map((h, i) => (
                          <rect key={`e${i}`} x={i*6.5+1} y={60-h} width="3" height={h} fill="var(--warn)" opacity="0.45" />
                        ))}
                        {/* revenue area + line */}
                        <path
                          d={(() => {
                            let d = 'M0,55'
                            for (let i=0; i<30; i++) {
                              const x = i*6.5+2.5
                              const y = 50 - (15 + Math.sin(i*0.7)*8 + Math.cos(i*0.4)*5 + i*0.4)
                              d += ` L${x},${y}`
                            }
                            d += ' L200,55 Z'
                            return d
                          })()}
                          fill="var(--accent)"
                          opacity="0.18"
                        />
                        <path
                          d={(() => {
                            let d = ''
                            for (let i=0; i<30; i++) {
                              const x = i*6.5+2.5
                              const y = 50 - (15 + Math.sin(i*0.7)*8 + Math.cos(i*0.4)*5 + i*0.4)
                              d += (i === 0 ? `M${x},${y}` : ` L${x},${y}`)
                            }
                            return d
                          })()}
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="1.2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    {/* bottom: top sellers + AI bubble */}
                    <div className="grid grid-cols-[1.4fr_1fr] gap-1.5">
                      <div className="rounded-md border border-hair bg-surface px-1.5 py-1">
                        <p className="text-[6px] uppercase tracking-widest text-ink-4 mb-0.5">Today’s top sellers</p>
                        {[
                          { n: 'Café Latte',     q: 18 },
                          { n: 'Grilled Cheese', q: 14 },
                          { n: 'Croissant',      q: 12 },
                        ].map(s => (
                          <div key={s.n} className="flex items-center justify-between gap-1">
                            <span className="text-[6.5px] text-ink truncate">{s.n}</span>
                            <span className="text-[6.5px] tabular text-accent font-semibold">{s.q}×</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-md border border-accent/40 bg-accent/5 px-1.5 py-1 flex flex-col gap-0.5">
                        <p className="text-[6px] uppercase tracking-widest text-accent/80">Tenda Pro AI</p>
                        <p className="text-[6.5px] text-ink leading-snug">
                          “Tuna sandwich margin dropped 4% — tomatoes up to ₱85/kg.”
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* live-data overlay shimmer */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)',
                      animation: 'sizzle-shimmer 6s ease-in-out infinite',
                    }}
                  />

                  {/* Touch dots — 1 interactive point (Ask the assistant) */}
                  {TAPS.map((tap, i) => (
                    <div
                      key={i}
                      className="touch-dot absolute pointer-events-none"
                      style={{ left: `${tap.x}%`, top: `${tap.y}%`, opacity: 0, transform: 'translate(-50%,-50%)' }}
                    >
                      <div className="relative flex items-center justify-center">
                        <span
                          className="absolute w-6 h-6 rounded-full bg-accent/30"
                          style={{ animation: `sizzle-ping 2.4s ease-out infinite ${i * 0.6}s` }}
                        />
                        <span className="relative block w-3 h-3 rounded-full bg-accent shadow-[0_0_14px_rgba(88,192,152,0.75)]" />
                        {/* label tooltip */}
                        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-widest text-ink bg-canvas/95 border border-accent/40 rounded-full px-2 py-1 shadow-sm">
                          {tap.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* tablet bottom home indicator */}
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/15" aria-hidden="true" />
              </div>
            </div>

            {/* Floating phone w/ POS quick-action */}
            <div
              ref={phoneRef}
              className="owner-phone absolute right-1 sm:right-4 lg:right-0 bottom-0 w-[140px] sm:w-[170px] lg:w-[190px]"
              style={{ opacity: 0 }}
            >
              <div className="relative aspect-[9/19] rounded-[1.6rem] bg-[#0a0a0a] border border-white/10 p-2 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]">
                {/* notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3 rounded-full bg-black z-10" aria-hidden="true" />
                <div className="relative w-full h-full rounded-[1.2rem] overflow-hidden bg-surface-2 flex flex-col">
                  {/* phone status bar */}
                  <div className="flex items-center justify-between px-3 pt-3 pb-2 text-[8px] text-ink-3 tabular">
                    <span>10:32</span>
                    <span className="opacity-60">●●●</span>
                  </div>

                  {/* header */}
                  <div className="px-3 pb-2">
                    <p className="text-[8px] text-ink-4 uppercase tracking-widest">POS</p>
                    <p className="text-[10px] font-semibold text-ink mt-0.5 tabular">Sale #182</p>
                  </div>

                  {/* item rows */}
                  <div className="px-3 space-y-1.5 mt-1">
                    {[
                      { name: 'Iced Latte', qty: 2, price: 280 },
                      { name: 'Pandesal', qty: 4, price: 80 },
                      { name: 'Choco Cake', qty: 1, price: 150 },
                    ].map(it => (
                      <div key={it.name} className="flex items-center justify-between text-[8px]">
                        <span className="text-ink-3 truncate">{it.qty}× {it.name}</span>
                        <span className="text-ink tabular shrink-0 ml-2">₱{it.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="px-3 mt-2 pt-2 border-t border-hair flex items-center justify-between">
                    <span className="text-[8px] text-ink-4">Total</span>
                    <span className="text-[10px] font-semibold tabular text-accent">₱510</span>
                  </div>

                  {/* big CTA */}
                  <div className="mt-auto p-2">
                    <div className="rounded-lg bg-accent text-canvas text-center text-[9px] font-bold py-2 tracking-wide">
                      RECORD SALE
                    </div>
                  </div>
                </div>
              </div>

              {/* small "logged in 12 sec" caption */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-ink-4 italic">
                Recorded in 12 sec ↓
              </div>
            </div>

          </div>
        </div>

        {/* outcome strip */}
        <div className="mt-16 max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { k: '< 30 s', v: 'to log a sale' },
            { k: '4 → 1', v: 'tools collapsed into one' },
            { k: '0', v: 'spreadsheets needed' },
          ].map((it) => (
            <div key={it.v} className="day-step glass rounded-xl p-4" style={{ opacity: 0 }}>
              <p className="text-2xl font-semibold tabular text-accent tracking-tighter leading-none">{it.k}</p>
              <p className="text-[11px] text-ink-3 mt-1.5 leading-snug">{it.v}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
