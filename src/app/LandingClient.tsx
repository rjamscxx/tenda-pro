'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useCountUp } from '@/hooks/useCountUp'
import SizzleLogo from '@/components/ui/SizzleLogo'

const HeroScene3D = dynamic(() => import('@/components/3d/HeroScene3D'), {
  ssr: false,
  loading: () => <HeroSceneSkeleton />,
})

function HeroSceneSkeleton() {
  return <div className="w-full h-full rounded-2xl bg-surface-2/40 animate-pulse" />
}

// Defer the Three.js + R3F + Drei bundle until the browser is idle so the
// initial hydration thread is free for hero text + CTAs. Uses
// requestIdleCallback with a 1500ms timeout; falls back to setTimeout(600)
// on browsers that don't expose it (Safari ≤ 16.3).
function LazyHeroScene({ theme }: { theme: string }) {
  const [shouldLoad, setShouldLoad] = useState(false)
  useEffect(() => {
    type IdleWin = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const w = window as IdleWin
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => setShouldLoad(true), { timeout: 1500 })
      return () => w.cancelIdleCallback?.(id)
    }
    const t = setTimeout(() => setShouldLoad(true), 600)
    return () => clearTimeout(t)
  }, [])
  if (!shouldLoad) return <HeroSceneSkeleton />
  return <HeroScene3D theme={theme} />
}

// Below-fold landing sections — code-split so their JS doesn't block hydration.
const OwnerScene = dynamic(() => import('@/components/landing/OwnerScene'), {
  loading: () => <div className="min-h-[640px]" aria-hidden="true" />,
})
const ComparisonTable = dynamic(() => import('@/components/landing/ComparisonTable'), {
  loading: () => <div className="min-h-[720px]" aria-hidden="true" />,
})
const FounderStory = dynamic(() => import('@/components/landing/FounderStory'), {
  loading: () => <div className="min-h-[480px]" aria-hidden="true" />,
})
const FAQ = dynamic(() => import('@/components/landing/FAQ'), {
  loading: () => <div className="min-h-[520px]" aria-hidden="true" />,
})

import {
  SalesMock, MenuMock, ExpensesMock, ReportsMock,
  EmployeesMock, WasteMock, PayrollMock, InventoryMock,
  POSMock, QRMenuMock,
} from '@/components/landing/AppMocks'
import AppFrame from '@/components/landing/AppFrame'

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent">
        <path d="M2 14L6 10l3 3 4-5 5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6" cy="10" r="1" fill="currentColor"/>
      </svg>
    ),
    iconBg: 'bg-accent-dim',
    title: 'Sales & Revenue',
    body: 'Log every sale by channel — dine-in, takeout, or delivery. See daily and monthly revenue with delta comparisons and a 30-day cashflow chart.',
    large: true,
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-warn">
        <path d="M2 4L7 10l3-3.5 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: 'bg-warn-dim',
    title: 'Expense Tracking',
    body: 'Categorize every cost — ingredients, labor, rent, utilities. Mark expenses as recurring and Sizzle auto-logs them each month.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-danger">
        <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    iconBg: 'bg-danger-dim',
    title: 'Menu & Recipe Costing',
    body: 'Build recipes from your ingredients. Sizzle calculates real food cost per dish and gross margin — so you price with confidence.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent">
        <path d="M1.5 12.5h13M3 10.5V7.5M6.5 10.5V5.5M10 10.5V3.5M13.5 10.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    iconBg: 'bg-accent-dim',
    title: 'Reports & P&L',
    body: '6-month trend table, expense breakdown, top-selling dishes, and channel analysis — all exportable to CSV in one click.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 8h6M5 5.5h6M5 10.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    iconBg: 'bg-accent-dim',
    title: 'Inventory Management',
    body: 'Stock levels auto-update when a sale is logged. Low-stock alerts appear on your dashboard before you run out mid-service.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-danger">
        <path d="M2.5 4.5h11M6 4.5V3h4v1.5M5.5 4.5l.5 8.5h4l.5-8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: 'bg-danger-dim',
    title: 'Waste Log',
    body: 'Track spoilage, dropped plates, and expired stock by ingredient. See your estimated loss per month and cut your true food cost.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-ink-3">
        <circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11.5 7a2 2 0 100-4M13.5 14c0-1.93-1.12-3.6-2.75-4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    iconBg: 'bg-surface-3',
    title: 'Employees & Payroll',
    body: 'Manage staff with daily or monthly pay rates. Process payroll runs, log deductions, and track total labor cost alongside your food cost.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent">
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 7.5h6M8 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M4 12.5v1.5M12 12.5v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    iconBg: 'bg-accent-dim',
    title: 'Point of Sale',
    body: 'Fast sale entry with an item picker, channel selector, and automatic food cost calculation. Log a full transaction in under 30 seconds.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent">
        <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="10" y="10" width="2" height="2" fill="currentColor" rx="0.3"/>
        <path d="M9 13.5h2M12.5 12v1.5M12.5 10v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    iconBg: 'bg-accent-dim',
    title: 'QR Menu Generator',
    body: 'Every venue gets a public menu page. Share a QR code — customers scan and browse your full menu with prices. No app, no login, no printer needed.',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-ink-3">
        <rect x="3" y="1.5" width="10" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 7.5h6M5 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M6.5 5l1.5-1.5L9.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    iconBg: 'bg-surface-3',
    title: 'Install as App',
    body: 'Add Sizzle to your home screen on Android or desktop. Works as a progressive web app — fast, native-feeling, no app store required.',
  },
]


const THEMES = [
  { id: 'sage-dark',   label: 'Sage',        canvas: '#0E1714', accent: '#58C098' },
  { id: 'sage-light',  label: 'Sage Light',  canvas: '#F4F0E7', accent: '#1F5F4A' },
  { id: 'espresso',    label: 'Espresso',    canvas: '#1A1410', accent: '#D9A876' },
  { id: 'citrus',      label: 'Citrus',      canvas: '#0F1410', accent: '#C9E663' },
  { id: 'crimson',     label: 'Crimson',     canvas: '#14100F', accent: '#DC2626' },
  { id: 'ocean',       label: 'Ocean',       canvas: '#060D14', accent: '#0EA5E9' },
  { id: 'rose',        label: 'Rose',        canvas: '#150C10', accent: '#E879A6' },
  { id: 'ember',       label: 'Ember',       canvas: '#130A04', accent: '#F97316' },
  { id: 'midnight',    label: 'Midnight',    canvas: '#070714', accent: '#818CF8' },
  { id: 'harvest',     label: 'Harvest',     canvas: '#14100A', accent: '#F59E0B' },
  { id: 'jade',        label: 'Jade',        canvas: '#071010', accent: '#10B981' },
  { id: 'slate',       label: 'Slate',       canvas: '#0E1017', accent: '#14B8A6' },
  { id: 'wasabi',      label: 'Wasabi',      canvas: '#0B1010', accent: '#84CC16' },
  { id: 'trattoria',   label: 'Trattoria',   canvas: '#15100C', accent: '#D97746' },
  { id: 'mariachi',    label: 'Mariachi',    canvas: '#14080A', accent: '#FBBF24' },
  { id: 'imperial',    label: 'Imperial',    canvas: '#100808', accent: '#EAB308' },
  { id: 'saffron',     label: 'Saffron',     canvas: '#140C04', accent: '#F97316' },
  { id: 'diner',       label: 'Diner',       canvas: '#080C14', accent: '#38BDF8' },
  { id: 'halo',        label: 'Halo',        canvas: '#110A18', accent: '#C084FC' },
  { id: 'boba',        label: 'Boba',        canvas: '#14100E', accent: '#F472B6' },
  { id: 'cloud',       label: 'Cloud',       canvas: '#FAFAFA', accent: '#0EA5E9' },
  { id: 'linen',       label: 'Linen',       canvas: '#FAF6EE', accent: '#92400E' },
  { id: 'mint',        label: 'Mint',        canvas: '#F3FAF6', accent: '#047857' },
  { id: 'sand',        label: 'Sand',        canvas: '#FBF7EE', accent: '#B45309' },
  { id: 'lavender',    label: 'Lavender',    canvas: '#F8F5FB', accent: '#7C3AED' },
]

const NAV_LINKS = [
  { label: 'Features',   href: '#features' },
  { label: 'Operations', href: '#ops-section' },
  { label: 'Themes',     href: '#themes' },
  { label: 'Pricing',    href: '#pricing' },
]

// ── Component ─────────────────────────────────────────────────────────────────

function smoothScrollTo(href: string) {
  const id = href.replace('#', '')
  const target = document.getElementById(id)
  if (!target) return
  // 80px offset for the fixed navbar
  const top = target.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top, behavior: 'smooth' })
}

// Landing is intentionally cookie-free for theming: the inline THEME_INIT
// script in layout.tsx already picked a random theme and applied it to
// <html data-theme>. We just read that back here so React state matches what
// the visitor already sees, instead of flashing on hydration.
function readInitialTheme(): string {
  if (typeof document === 'undefined') return 'ember'
  const v = document.documentElement.getAttribute('data-theme')
  return v && /^[a-z][a-z0-9-]{0,30}$/.test(v) ? v : 'ember'
}

export default function LandingClient() {
  const [scrolled, setScrolled]       = useState(false)
  const [activeTheme, setActiveTheme] = useState(readInitialTheme)
  const currentTheme = THEMES.find(t => t.id === activeTheme) ?? THEMES[0]
  const { ref: themeCountRef, count: themeCountVal } = useCountUp(25)
  // Landing always renders as logged-out. The rare logged-in visitor who hits
  // "/" sees the marketing CTAs; clicking "Start free" / "Sign in" routes
  // them to /signup or /login, both of which server-check auth and redirect
  // straight to /dashboard. Avoids running a Supabase auth client during
  // hydration (heavy import + chase, big TBT hit).
  const isLoggedIn = false

  // Nav scroll state
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // GSAP animations
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (noMotion) {
      // Reveal all initially-hidden elements immediately (no animation)
      document.querySelectorAll<HTMLElement>(
        '.hero-word, .hero-badge-el, .hero-sub-el, .hero-ctas-el, .hero-note-el, ' +
        '.hero-mock, .trust-item, .feature-card, .inventory-copy, .inventory-mock, ' +
        '.lp-fade-up, .pain-card, .step-card, .ss-card, .ops-card, .pricing-card, ' +
        '.cta-block, .theme-card'
      ).forEach(el => { el.style.opacity = '1' })
      return
    }

    const ctx = gsap.context(() => {

      // ── Hero entrance ─────────────────────────────────────
      gsap.fromTo('.hero-word',
        { y: 48, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.055, duration: 0.9, ease: 'expo.out', delay: 0.2 }
      )
      gsap.fromTo('.hero-badge-el',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, ease: 'expo.out', delay: 0.1 }
      )
      // .hero-sub-el is the LCP element — no entrance animation, no opacity gate
      // so it paints at first contentful frame.
      gsap.fromTo('.hero-ctas-el',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.7 }
      )
      gsap.fromTo('.hero-note-el',
        { opacity: 0 },
        { opacity: 1, duration: 0.55, delay: 0.85 }
      )

      // ── Hero mock card entrance (float handled by R3F Float component) ───
      gsap.fromTo('.hero-mock',
        { y: 40, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out', delay: 0.45 }
      )

      // ── Hero glow parallax ────────────────────────────────
      gsap.to('.hero-glow-1', {
        yPercent: -35, ease: 'none',
        scrollTrigger: { trigger: '#hero-section', start: 'top top', end: 'bottom top', scrub: 1 },
      })
      gsap.to('.hero-glow-2', {
        yPercent: -18, ease: 'none',
        scrollTrigger: { trigger: '#hero-section', start: 'top top', end: 'bottom top', scrub: 1.5 },
      })

      // ── Trust strip ───────────────────────────────────────
      gsap.fromTo('.trust-item',
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.05, duration: 0.55, ease: 'expo.out',
          scrollTrigger: { trigger: '.trust-strip', start: 'top 88%' } }
      )

      // ── Feature cards cascade ─────────────────────────────
      gsap.fromTo('.feature-card',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, duration: 0.75, ease: 'expo.out',
          scrollTrigger: { trigger: '#features', start: 'top 78%' } }
      )

      // ── Inventory section slide ───────────────────────────
      gsap.fromTo('.inventory-copy',
        { x: -36, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.85, ease: 'expo.out',
          scrollTrigger: { trigger: '#inventory-section', start: 'top 78%' } }
      )
      gsap.fromTo('.inventory-mock',
        { x: 36, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.85, ease: 'expo.out',
          scrollTrigger: { trigger: '#inventory-section', start: 'top 78%' } }
      )

      // ── Theme picker cards ────────────────────────────────
      gsap.fromTo('.theme-card',
        { y: 20, opacity: 0, scale: 0.92 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.03, duration: 0.5, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: '#themes', start: 'top 80%' } }
      )

      // ── Generic fade-up (lp-fade-up) ─────────────────────
      document.querySelectorAll('.lp-fade-up').forEach(el => {
        gsap.fromTo(el,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 85%' } }
        )
      })

      // ── Pain cards ────────────────────────────────────────
      gsap.fromTo('.pain-card',
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.75, ease: 'expo.out',
          scrollTrigger: { trigger: '.pain-card', start: 'top 80%' } }
      )

      // ── How it works steps ────────────────────────────────
      gsap.fromTo('.step-card',
        { y: 32, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 0.75, ease: 'back.out(1.2)',
          scrollTrigger: { trigger: '.step-card', start: 'top 80%' } }
      )

      // ── Screenshot gallery ────────────────────────────────
      gsap.fromTo('.ss-card',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'expo.out',
          scrollTrigger: { trigger: '.ss-card', start: 'top 82%' } }
      )

      // ── Ops section (Waste · Employees · Payroll) ─────────
      gsap.fromTo('.ops-card',
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.75, ease: 'expo.out',
          scrollTrigger: { trigger: '#ops-section', start: 'top 78%' } }
      )

      // ── Pricing elastic pop ───────────────────────────────
      gsap.fromTo('.pricing-card',
        { y: 36, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.12, duration: 0.8, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: '#pricing', start: 'top 78%' } }
      )

      // ── CTA reveal ────────────────────────────────────────
      gsap.fromTo('.cta-block',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.95, ease: 'expo.out',
          scrollTrigger: { trigger: '#cta-section', start: 'top 82%' } }
      )

    }) // end gsap.context

    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return (
    <main className="min-h-[100dvh] bg-canvas overflow-x-hidden" data-theme={activeTheme} suppressHydrationWarning>

      {/* ── Ambient theme gradient — fixed, full-page ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div style={{
          position: 'absolute',
          top: '-10%', right: '-5%',
          width: '55vw', height: '55vw',
          maxWidth: 860, maxHeight: 860,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${currentTheme.accent}1E 0%, transparent 70%)`,
          animation: 'sizzle-blob-1 14s ease-in-out infinite',
          transition: 'background 0.85s ease',
          filter: 'blur(48px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '15%', left: '-10%',
          width: '45vw', height: '45vw',
          maxWidth: 680, maxHeight: 680,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${currentTheme.accent}14 0%, transparent 70%)`,
          animation: 'sizzle-blob-2 18s ease-in-out infinite',
          transition: 'background 0.85s ease',
          filter: 'blur(56px)',
        }} />
        <div style={{
          position: 'absolute',
          top: '45%', left: '42%',
          width: '40vw', height: '40vw',
          maxWidth: 580, maxHeight: 580,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${currentTheme.accent}0C 0%, transparent 70%)`,
          animation: 'sizzle-blob-3 22s ease-in-out infinite',
          transition: 'background 0.85s ease',
          filter: 'blur(64px)',
        }} />
      </div>

      {/* ── Floating nav ───────────────────────────────────────────────────── */}
      <nav className="fixed top-4 left-4 right-4 z-50">
        <div
          className={`max-w-6xl mx-auto rounded-2xl px-5 py-3 flex items-center justify-between transition-all duration-500 ease-out ${
            scrolled
              ? 'glass shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border border-hair backdrop-blur-xl'
              : 'bg-transparent border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <SizzleLogo size={26} variant="badge" />
            <span className="font-semibold text-ink tracking-tight">Sizzle</span>
          </div>

          <div className="hidden md:flex items-center gap-7 text-sm text-ink-3">
            {NAV_LINKS.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="hover:text-ink transition-colors duration-150"
                onClick={e => { e.preventDefault(); smoothScrollTo(l.href) }}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link href="/dashboard" className="px-4 py-2 btn-primary rounded-xl text-sm active:scale-[0.98] transition-transform">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className={`hidden sm:block text-sm transition-colors px-3 py-1.5 ${scrolled ? 'text-ink-3 hover:text-ink' : 'text-ink-4 hover:text-ink-3'}`}>
                  Sign in
                </Link>
                <Link href="/signup" className={`px-4 py-2 rounded-xl text-sm active:scale-[0.98] transition-all duration-300 ${scrolled ? 'btn-primary' : 'border border-hair/60 text-ink-3 hover:border-accent hover:text-accent'}`}>
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section id="hero-section" className="relative pt-28 lg:pt-36 pb-16 lg:pb-20 px-4 overflow-hidden">

        {/* depth-1: Glow blobs — animated, theme-reactive */}
        <div
          className="hero-glow-1 pointer-events-none absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-3xl"
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle, ${currentTheme.accent}28 0%, transparent 70%)`,
            animation: 'sizzle-blob-1 9s ease-in-out infinite',
            transition: 'background 0.8s ease',
          }}
        />
        <div
          className="hero-glow-2 pointer-events-none absolute top-1/2 -left-24 w-[400px] h-[400px] rounded-full blur-2xl"
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle, ${currentTheme.accent}1C 0%, transparent 70%)`,
            animation: 'sizzle-blob-2 12s ease-in-out infinite',
            transition: 'background 0.8s ease',
          }}
        />
        <div
          className="hero-glow-3 pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-3xl"
          aria-hidden="true"
          style={{
            background: `radial-gradient(ellipse, ${currentTheme.accent}10 0%, transparent 70%)`,
            animation: 'sizzle-blob-3 16s ease-in-out infinite',
            transition: 'background 0.8s ease',
          }}
        />

        {/* Premium gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background: `radial-gradient(ellipse 80% 55% at 50% -5%, ${currentTheme.accent}10 0%, transparent 65%)`,
            transition: 'background 0.85s ease',
          }}
        />

        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-20 items-center">

          {/* Left: Text */}
          <div className="space-y-7">
            <div
              className="hero-badge-el inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-hair bg-surface-2 text-xs text-ink-3"
              style={{ opacity: 0 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              Made in the Philippines · Looking for the first 100 cafés
            </div>

            <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-semibold tracking-tighter leading-[0.92] text-ink">
              <span className="hero-word inline-block" style={{ opacity: 0 }}>Know</span>{' '}
              <span className="hero-word inline-block" style={{ opacity: 0 }}>your</span>
              <br />
              <span className="hero-word inline-block text-accent" style={{ opacity: 0 }}>margins.</span>
              <br />
              <span className="hero-word inline-block" style={{ opacity: 0 }}>Run</span>{' '}
              <span className="hero-word inline-block" style={{ opacity: 0 }}>your</span>{' '}
              <span className="hero-word inline-block" style={{ opacity: 0 }}>kitchen.</span>
            </h1>

            <p className="hero-sub-el text-base text-ink-3 leading-relaxed max-w-[50ch]">
              Sizzle gives restaurant and café owners a single dashboard to track sales, log expenses,
              cost every recipe, manage staff, and watch inventory — without spreadsheets.
            </p>

            {/* Concrete outcome line */}
            <div className="hero-sub-el flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-3">
              <span className="inline-flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-accent shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5L6.5 12 13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Replaces 4 spreadsheets, a notebook, and 3 apps
              </span>
              <span className="inline-flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-accent shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5L6.5 12 13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sale logged in under 30 seconds
              </span>
            </div>

            <div className="hero-ctas-el flex items-center gap-3 flex-wrap" style={{ opacity: 0 }}>
              {isLoggedIn ? (
                <Link href="/dashboard" className="px-6 py-3 btn-primary rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="px-6 py-3 btn-primary rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                    Start free
                  </Link>
                  <Link href="/login" className="px-6 py-3 rounded-xl text-sm font-medium text-ink-2 border border-hair hover:border-accent hover:text-ink transition-all duration-200">
                    Sign in
                  </Link>
                </>
              )}
            </div>

            <p className="hero-note-el text-xs text-ink-4" style={{ opacity: 0 }}>
              Free forever for one business · No credit card · 14-day Pro features unlocked at signup
            </p>
          </div>

          {/* Right: 3D floating dashboard panel */}
          <div className="hero-mock relative h-[340px] sm:h-[420px] lg:h-[520px]" style={{ opacity: 0 }}>
            <LazyHeroScene theme={activeTheme} />
          </div>
        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────────────────────────── */}
      <div className="trust-strip py-10 px-4 border-y border-hair">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] text-ink-4 uppercase tracking-widest text-center mb-6">Built for every type of food business</p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {['Casual Dining', 'Fast Food', 'Café & Coffee', 'Bakery', 'Food Truck', 'Cloud Kitchen', 'Bar & Grill'].map(type => (
              <span key={type} className="trust-item flex items-center gap-2 text-sm text-ink-4">
                <span className="w-1 h-1 rounded-full bg-hair-2 shrink-0" />
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recently shipped — momentum strip (combats 'is this abandonware' fear) */}
      <div className="momentum-strip py-7 px-4 border-b border-hair bg-surface/30 overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center gap-6 flex-wrap justify-center">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success/60 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-success">Built in public</span>
          </div>
          <span className="hidden sm:inline text-xs text-ink-4">Just shipped:</span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {[
              'Multi-venue',
              'AI Assistant',
              'POS',
              '25 themes',
              'QR Menu',
              'Inventory forecasting',
              'Daily digest email',
              'PayMongo billing',
            ].map(item => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 text-[11px] text-ink-3 bg-surface-2 border border-hair rounded-full px-2.5 py-1"
              >
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className="text-accent shrink-0" aria-hidden="true">
                  <path d="M2 6.5L5 9.5 10 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pain ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="lp-fade-up text-center max-w-[52ch] mx-auto">
            <p className="text-xs text-danger font-semibold uppercase tracking-widest mb-3">The problem</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight">
              Running a café shouldn&apos;t feel like this.
            </h2>
            <p className="text-base text-ink-3 mt-4 leading-relaxed">
              Most restaurant owners track sales in a notebook, expenses in a spreadsheet, and payroll in WhatsApp. Nobody has a clear picture.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-danger">
                    <rect x="2" y="2" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M6 8h10M6 12h7M6 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                title: 'Spreadsheet chaos',
                body: 'Three different sheets for sales, food cost, and payroll — none of them talk to each other. You spend Sunday reconciling instead of resting.',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-warn">
                    <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M11 7v4.5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'Margins? A guess.',
                body: "You know a dish is popular, but you don't know if it's profitable. Without recipe costing, every busy day could be a loss in disguise.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-ink-3">
                    <path d="M3 17l5-5 3 3 4-6 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 7h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'No early warnings',
                body: "You find out stock ran out when a customer orders it. You learn about a bad month after the month is already over. Sizzle catches it before it hurts.",
              },
            ].map(item => (
              <div key={item.title} className="pain-card glass rounded-2xl p-7 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" style={{ opacity: 0 }}>
                <div className="w-11 h-11 rounded-xl bg-surface-3 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-ink tracking-tight">{item.title}</h3>
                <p className="text-sm text-ink-3 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How owners actually use Sizzle (animated tablet + phone scene) ──── */}
      <OwnerScene />

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 border-t border-hair">
        <div className="max-w-6xl mx-auto space-y-12">

          <div>
            <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-3">What Sizzle does</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight max-w-[20ch]">
              Every tool your café actually needs.
            </h2>
          </div>

          {/* Row 1: Sales (wide) + Expenses — both stretch to same height */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 items-stretch">

            {/* Sales — large card with mini chart */}
            <div className="feature-card glass rounded-2xl p-7 flex flex-col gap-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" style={{ opacity: 0 }}>
              <div className={`w-10 h-10 rounded-xl ${FEATURES[0].iconBg} flex items-center justify-center shrink-0`}>
                {FEATURES[0].icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">{FEATURES[0].title}</h3>
                <p className="text-sm text-ink-3 mt-2 leading-relaxed max-w-[38ch]">{FEATURES[0].body}</p>
              </div>
              <div className="mt-auto bg-surface-2 rounded-xl p-4 space-y-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl font-semibold tabular text-ink">₱18,460</span>
                  <span className="text-xs text-success font-semibold">↑ 14.2% vs yesterday</span>
                </div>
                <div className="flex gap-[3px] items-end h-10">
                  {[38,62,44,71,53,86,65,56,80,69,91,76,97,85].map((h, i) => (
                    <div key={i} className="flex-1 rounded-[2px] bg-accent/30" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <p className="text-[10px] text-ink-4">14-day revenue trend</p>
              </div>
            </div>

            {/* Expenses — fills same height as Sales */}
            <div className="feature-card glass rounded-2xl p-6 flex flex-col gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" style={{ opacity: 0 }}>
              <div className={`w-9 h-9 rounded-xl ${FEATURES[1].iconBg} flex items-center justify-center shrink-0`}>
                {FEATURES[1].icon}
              </div>
              <div>
                <h3 className="font-semibold text-ink tracking-tight">{FEATURES[1].title}</h3>
                <p className="text-sm text-ink-3 mt-2 leading-relaxed">{FEATURES[1].body}</p>
              </div>
              <div className="mt-auto space-y-2 pt-2">
                {[
                  { label: 'Ingredients', pct: 45 },
                  { label: 'Labor',       pct: 30 },
                  { label: 'Overhead',    pct: 25 },
                ].map(({ label, pct }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[9px] text-ink-4 w-20 shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-warn/50" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] tabular text-ink-4">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Row 2+: 8 remaining features in a perfect 4-column grid (2 rows of 4) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {FEATURES.slice(2).map(feat => (
              <div key={feat.title} className="feature-card glass rounded-2xl p-5 flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" style={{ opacity: 0 }}>
                <div className={`w-9 h-9 rounded-xl ${feat.iconBg} flex items-center justify-center shrink-0`}>
                  {feat.icon}
                </div>
                <h3 className="text-sm font-semibold text-ink tracking-tight leading-snug">{feat.title}</h3>
                <p className="text-xs text-ink-3 leading-relaxed">{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-hair">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="lp-fade-up max-w-[44ch]">
            <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-3">Getting started</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight">
              Up and running in minutes.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* connecting line */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-hair via-accent/30 to-hair" aria-hidden="true" />
            {[
              {
                step: '01',
                title: 'Set up your business',
                body: 'Name your business, add your first ingredients with unit costs, and build your menu items. Takes about 4 minutes.',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent">
                    <path d="M9 2v3M9 13v3M2 9h3M13 9h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Log sales daily',
                body: "Tap a dish, enter the channel, hit save. Under 30 seconds per sale. Sizzle does the food cost math automatically.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent">
                    <path d="M3.5 9.5l3.5 3.5 7.5-7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Watch your numbers',
                body: 'Dashboard updates in real-time. Revenue, food cost %, inventory levels, and waste — all in one view, always current.',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent">
                    <path d="M2 13L6 9l3 3 4-5 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
            ].map(s => (
              <div key={s.step} className="step-card relative flex flex-col gap-5" style={{ opacity: 0 }}>
                <div className="relative w-16 h-16 rounded-2xl glass border border-hair flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
                  {s.icon}
                  <span className="absolute -top-2 -right-2 text-[9px] font-bold text-accent bg-canvas border border-hair rounded-full w-5 h-5 flex items-center justify-center">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-semibold text-ink tracking-tight">{s.title}</h3>
                <p className="text-sm text-ink-3 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics strip ─────────────────────────────────────────────────────── */}
      <div className="border-y border-hair py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-hair">
          <div className="px-8 py-10 md:pl-0 lp-fade-up">
            <p className="text-[clamp(2rem,4vw,2.8rem)] font-semibold tracking-tighter text-accent leading-none">{'< 2 min'}</p>
            <p className="text-sm font-medium text-ink mt-3">to log a full day&apos;s sales</p>
            <p className="text-xs text-ink-4 mt-1">Quick modal — channel + item picker</p>
          </div>
          <div ref={themeCountRef} className="px-8 py-10 lp-fade-up">
            <p className="text-[clamp(2rem,4vw,2.8rem)] font-semibold tracking-tighter text-accent leading-none tabular">{themeCountVal}</p>
            <p className="text-sm font-medium text-ink mt-3">restaurant-specific themes</p>
            <p className="text-xs text-ink-4 mt-1">Sage, Espresso, Trattoria, Boba, and 21 more</p>
          </div>
          <div className="px-8 py-10 md:pr-0 lp-fade-up">
            <p className="text-[clamp(2rem,4vw,2.8rem)] font-semibold tracking-tighter text-accent leading-none">Free</p>
            <p className="text-sm font-medium text-ink mt-3">for one business, forever</p>
            <p className="text-xs text-ink-4 mt-1">No trial period, no credit card</p>
          </div>
        </div>
      </div>

      {/* ── Inventory section ─────────────────────────────────────────────────── */}
      <section id="inventory-section" className="py-24 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 items-center">

          <div className="inventory-copy space-y-6" style={{ opacity: 0 }}>
            <p className="text-xs text-accent font-semibold uppercase tracking-widest">Inventory alerts</p>
            <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-tighter text-ink leading-tight">
              Stop running out of the things that sell.
            </h2>
            <p className="text-base text-ink-3 leading-relaxed max-w-[44ch]">
              Set a low-stock threshold on every ingredient. Sizzle flags anything running low directly
              on the dashboard — no more 86&apos;d dishes mid-service.
            </p>
            <ul className="space-y-3.5">
              {[
                'Track stock by unit — kg, liters, pieces',
                'Real-time food cost per ingredient',
                'Low and out-of-stock alerts on your dashboard',
                'Auto-deduct stock when a sale is logged',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-3">
                  <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.5 12 13 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="inventory-mock relative" style={{ opacity: 0 }}>
            <div className="absolute -inset-6 bg-warn/6 rounded-3xl blur-3xl pointer-events-none" />
            <AppFrame url="sizzle.app/inventory" height={380}>
              <InventoryMock />
            </AppFrame>
          </div>

        </div>
      </section>

      {/* ── POS + QR Menu ─────────────────────────────────────────────────────── */}
      <section id="pos-section" className="py-24 px-4 border-t border-hair">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="lp-fade-up">
            <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-3">Speed &amp; visibility</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight max-w-[26ch]">
              Fast for you. Beautiful for your customers.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* POS */}
            <div className="space-y-6 lp-fade-up">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-dim flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent">
                    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 7.5h6M8 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M4 12.5v1.5M12 12.5v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">Point of Sale</h3>
              </div>
              <p className="text-base text-ink-3 leading-relaxed max-w-[42ch]">
                Tap a dish, pick the channel, hit record. Food cost is calculated automatically. No clunky POS hardware — just a fast, focused interface built for real kitchen speed.
              </p>
              <ul className="space-y-3">
                {[
                  'Item picker with real-time food cost per sale',
                  'Channel selector — dine-in, takeout, delivery',
                  'Log a full transaction in under 30 seconds',
                  'Auto-deducts from inventory on every sale',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink-3">
                    <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6.5 12 13 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="relative">
                <div className="absolute -inset-4 bg-accent/5 rounded-2xl blur-2xl pointer-events-none" />
                <AppFrame url="sizzle.app/pos" height={280}>
                  <POSMock />
                </AppFrame>
              </div>
            </div>

            {/* QR Menu */}
            <div className="space-y-6 lp-fade-up">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-dim flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent">
                    <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                    <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                    <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                    <rect x="10" y="10" width="2" height="2" fill="currentColor" rx="0.3"/>
                    <path d="M9 13.5h2M12.5 12v1.5M12.5 10v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">QR Menu Generator</h3>
              </div>
              <p className="text-base text-ink-3 leading-relaxed max-w-[42ch]">
                Every venue gets a live public menu page the moment you add items. Print the QR code, stick it on the table — customers scan and see your full menu with prices, in your chosen theme.
              </p>
              <ul className="space-y-3">
                {[
                  'Auto-generated — no extra setup required',
                  'Matches your app theme (25 styles available)',
                  'Always live — updates when you edit your menu',
                  'Works on any phone, no app download needed',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink-3">
                    <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6.5 12 13 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="relative">
                <div className="absolute -inset-4 bg-accent/5 rounded-2xl blur-2xl pointer-events-none" />
                <AppFrame url="sizzle.app/m/your-venue" height={280}>
                  <QRMenuMock />
                </AppFrame>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Operations section: Waste + Staff + Payroll ───────────────────────── */}
      <section id="ops-section" className="py-24 px-4 border-t border-hair">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="lp-fade-up">
            <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-3">Operations</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight max-w-[24ch]">
              The stuff spreadsheets can&apos;t keep up with.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Waste */}
            <div className="ops-card glass rounded-2xl p-7 space-y-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" style={{ opacity: 0 }}>
              <div className="w-10 h-10 rounded-xl bg-danger-dim flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-danger">
                  <path d="M3 5.5h12M7 5.5V4h4v1.5M6.5 5.5l.5 9h4l.5-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">Waste Log</h3>
                <p className="text-sm text-ink-3 mt-2 leading-relaxed">
                  Log spoilage and dropped plates by ingredient. Sizzle calculates the estimated peso
                  loss and surfaces it monthly — so you can actually cut it.
                </p>
              </div>
              <div className="bg-surface-2 rounded-xl p-4 space-y-2">
                <p className="text-[9px] text-ink-4 uppercase tracking-widest">This Month — Estimated Loss</p>
                <p className="text-2xl font-semibold tabular text-danger">₱2,840</p>
                <div className="space-y-1.5">
                  {[
                    { reason: 'Spoilage', pct: 55 },
                    { reason: 'Dropped',  pct: 28 },
                    { reason: 'Expired',  pct: 17 },
                  ].map(r => (
                    <div key={r.reason} className="flex items-center gap-2">
                      <span className="text-[10px] text-ink-4 w-14">{r.reason}</span>
                      <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full bg-danger/40 rounded-full" style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Employees */}
            <div className="ops-card glass rounded-2xl p-7 space-y-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" style={{ opacity: 0 }}>
              <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-ink-3">
                  <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M1 16c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M13 8a2.5 2.5 0 100-5M16 16c0-2.4-1.34-4.5-3.38-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">Employees</h3>
                <p className="text-sm text-ink-3 mt-2 leading-relaxed">
                  Add staff with daily or monthly rates. Track who&apos;s active, their roles, and see your
                  estimated monthly labor cost right beside your food cost.
                </p>
              </div>
              <div className="bg-surface-2 rounded-xl p-4 space-y-2.5">
                {[
                  { name: 'Ana Cruz',    role: 'Barista',  type: 'Daily',   rate: '₱650/day' },
                  { name: 'Ben Reyes',  role: 'Cook',     type: 'Monthly', rate: '₱15K/mo' },
                  { name: 'Carla Sy',   role: 'Cashier',  type: 'Daily',   rate: '₱580/day' },
                ].map(e => (
                  <div key={e.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-medium text-ink">{e.name}</p>
                      <p className="text-[10px] text-ink-4">{e.role}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-ink-4 bg-surface rounded px-1.5 py-0.5">{e.type}</span>
                      <p className="text-[11px] tabular text-ink-3 mt-0.5">{e.rate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payroll */}
            <div className="ops-card glass rounded-2xl p-7 space-y-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" style={{ opacity: 0 }}>
              <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-ink-3">
                  <rect x="2" y="6" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 6V4.5h6V6M9 10v1m0 1.5v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="9" cy="11" r="1.75" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink tracking-tight">Payroll Runs</h3>
                <p className="text-sm text-ink-3 mt-2 leading-relaxed">
                  Process payroll by period. Set days worked, gross pay auto-calculates from rate, add
                  deductions, and Sizzle keeps the full history of every run.
                </p>
              </div>
              <div className="bg-surface-2 rounded-xl p-4 space-y-2.5">
                <p className="text-[9px] text-ink-4 uppercase tracking-widest">Latest Payroll Run</p>
                <p className="text-[11px] text-ink-3">May 1–15, 2026 · 3 employees</p>
                {[
                  { label: 'Gross',      value: '₱28,450', color: 'text-ink' },
                  { label: 'Deductions', value: '−₱1,200', color: 'text-danger' },
                  { label: 'Net Pay',    value: '₱27,250', color: 'text-success' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center">
                    <span className="text-[11px] text-ink-4">{r.label}</span>
                    <span className={`text-[12px] font-semibold tabular ${r.color}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Screenshot gallery ───────────────────────────────────────────────── */}
      <section id="gallery" className="py-24 px-4 border-t border-hair overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="lp-fade-up flex items-end justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-3">Every screen</p>
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight">
                See every module, live.
              </h2>
            </div>
            <p className="text-sm text-ink-4 max-w-[40ch] leading-relaxed">
              Live previews of every module — these update with your selected theme.
              Every feature you see is working today.
            </p>
          </div>

          {/* Row 1: Sales (large) + Menu */}
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none lg:grid lg:grid-cols-[1.6fr_1fr] lg:overflow-x-visible lg:pb-0">
            <div className="ss-card group snap-start shrink-0 w-[82vw] sm:w-[65vw] lg:w-auto" style={{ opacity: 0 }}>
              <AppFrame url="sizzle.app/sales" height={320} className="group-hover:shadow-[0_24px_72px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.1)] transition-shadow duration-500">
                <SalesMock />
              </AppFrame>
            </div>
            <div className="ss-card group snap-start shrink-0 w-[82vw] sm:w-[65vw] lg:w-auto" style={{ opacity: 0 }}>
              <AppFrame url="sizzle.app/menu" height={320} className="group-hover:shadow-[0_24px_72px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.1)] transition-shadow duration-500">
                <MenuMock />
              </AppFrame>
            </div>
          </div>

          {/* Row 2: Expenses · Reports · Employees */}
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none md:grid md:grid-cols-3 md:overflow-x-visible md:pb-0">
            {([
              ['sizzle.app/expenses',  <ExpensesMock key="exp" />],
              ['sizzle.app/reports',   <ReportsMock  key="rep" />],
              ['sizzle.app/employees', <EmployeesMock key="emp" />],
            ] as [string, React.ReactNode][]).map(([url, mock]) => (
              <div key={url} className="ss-card group snap-start shrink-0 w-[72vw] sm:w-[50vw] md:w-auto" style={{ opacity: 0 }}>
                <AppFrame url={url} height={220} className="group-hover:shadow-[0_24px_72px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.1)] transition-shadow duration-500">
                  {mock}
                </AppFrame>
              </div>
            ))}
          </div>

          {/* Row 3: Waste · Payroll */}
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none md:grid md:grid-cols-2 md:overflow-x-visible md:pb-0">
            {([
              ['sizzle.app/waste',   <WasteMock   key="waste"   />],
              ['sizzle.app/payroll', <PayrollMock key="payroll" />],
            ] as [string, React.ReactNode][]).map(([url, mock]) => (
              <div key={url} className="ss-card group snap-start shrink-0 w-[82vw] sm:w-[65vw] md:w-auto" style={{ opacity: 0 }}>
                <AppFrame url={url} height={260} className="group-hover:shadow-[0_24px_72px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.1)] transition-shadow duration-500">
                  {mock}
                </AppFrame>
              </div>
            ))}
          </div>

          {/* Row 4: POS · QR Menu */}
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none md:grid md:grid-cols-2 md:overflow-x-visible md:pb-0">
            {([
              ['sizzle.app/pos',          <POSMock   key="pos" />],
              ['sizzle.app/m/your-venue', <QRMenuMock key="qr" />],
            ] as [string, React.ReactNode][]).map(([url, mock]) => (
              <div key={url} className="ss-card group snap-start shrink-0 w-[82vw] sm:w-[65vw] md:w-auto" style={{ opacity: 0 }}>
                <AppFrame url={url} height={260} className="group-hover:shadow-[0_24px_72px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.1)] transition-shadow duration-500">
                  {mock}
                </AppFrame>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Reports section ──────────────────────────────────────────────────── */}
      <section id="reports-section" className="py-24 px-4 border-t border-hair">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-16 items-center">

          {/* Left: Report mock */}
          <div className="relative order-2 lg:order-1 lp-fade-up">
            <div className="absolute -inset-6 bg-accent/6 rounded-3xl blur-3xl pointer-events-none" />
            <AppFrame url="sizzle.app/reports" height={400}>
              <ReportsMock />
            </AppFrame>
          </div>

          {/* Right: Copy */}
          <div className="order-1 lg:order-2 space-y-6 lp-fade-up">
            <p className="text-xs text-accent font-semibold uppercase tracking-widest">Reports &amp; P&amp;L</p>
            <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-tighter text-ink leading-tight">
              Know your numbers.<br />Every month.
            </h2>
            <p className="text-base text-ink-3 leading-relaxed max-w-[44ch]">
              Six-month trend table, expense breakdown by category, top-selling dishes —
              all in one view. Export to CSV whenever your accountant asks.
            </p>
            <ul className="space-y-3.5">
              {[
                '6-month revenue and expense trends',
                'Gross profit and food cost % per period',
                'Top dishes by revenue and margin',
                'Channel breakdown — dine-in, takeout, delivery',
                'One-click CSV export',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-3">
                  <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.5 12 13 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* ── Theme Picker ─────────────────────────────────────────────────────── */}
      <section id="themes" className="py-24 px-4 border-t border-hair">
        <div className="max-w-6xl mx-auto space-y-12">

          <div className="lp-fade-up text-center">
            <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-3">25 themes</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight">
              Your dashboard, your style.
            </h2>
            <p className="text-base text-ink-3 mt-4 leading-relaxed max-w-[52ch] mx-auto">
              Click any theme below — the hero preview above updates live. 14 dark, 6 light, and 5 cuisine-inspired palettes. Every color you see is exactly how your dashboard will look.
            </p>
          </div>

          {/* Swatch grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  // Landing theme switcher is a preview only — does NOT
                  // write the cookie. The dashboard theme is owned by
                  // Settings; landing always randomizes on next visit.
                  setActiveTheme(t.id)
                }}
                className="theme-card group relative flex flex-col items-center gap-2.5 p-3 rounded-2xl border transition-all duration-200 cursor-pointer"
                style={{
                  borderColor: activeTheme === t.id ? 'var(--accent)' : 'var(--hair)',
                  boxShadow:   activeTheme === t.id ? '0 0 0 1px var(--accent)' : undefined,
                }}
              >
                {/* Canvas swatch */}
                <div
                  className="w-full rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{ background: t.canvas, aspectRatio: '5/3' }}
                >
                  <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '8px 8px' }} />
                  <div className="relative w-7 h-7 rounded-full shadow-sm" style={{ background: t.accent }} />
                </div>
                {/* Label */}
                <span
                  className="text-[11px] font-medium leading-none"
                  style={{ color: activeTheme === t.id ? 'var(--accent)' : 'var(--ink-4)' }}
                >
                  {t.label}
                </span>
                {/* Active checkmark */}
                {activeTheme === t.id && (
                  <div
                    className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: t.accent }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5 6.5 2" stroke={t.canvas} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-ink-4">
            The app previews above update live with your selected theme.{' '}
            <button
              onClick={() => smoothScrollTo('#gallery')}
              className="text-accent underline underline-offset-2 hover:no-underline transition-all"
            >
              See all screens ↑
            </button>
          </p>

        </div>
      </section>

      {/* ── Comparison Table ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-hair">
        <div className="max-w-6xl mx-auto">
          <ComparisonTable />
        </div>
      </section>

      {/* ── Founder Story ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-hair">
        <div className="max-w-6xl mx-auto">
          <FounderStory />
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 border-t border-hair">
        <div className="max-w-6xl mx-auto">
          <div className="lp-fade-up mb-12">
            <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight">
              Simple. No surprises.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl">

            {/* Basic */}
            <div className="pricing-card glass rounded-2xl p-7 space-y-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" style={{ opacity: 0 }}>
              <div>
                <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest">Basic</p>
                <p className="text-4xl font-semibold tracking-tighter text-ink mt-2">Free</p>
                <p className="text-xs text-ink-4 mt-1">Forever. One business.</p>
              </div>
              <ul className="space-y-3 text-sm text-ink-3">
                {['Sales & expense tracking', 'Menu with recipe costing', 'Inventory alerts', '6-month reports', 'All 25 themes'].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 text-accent shrink-0" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7.5L5.5 10.5 11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {isLoggedIn ? (
                <Link href="/dashboard" className="block w-full py-2.5 text-center rounded-xl border border-hair text-sm font-semibold text-ink-2 hover:border-accent hover:text-ink transition-all duration-200">
                  Go to Dashboard
                </Link>
              ) : (
                <Link href="/signup" className="block w-full py-2.5 text-center rounded-xl border border-hair text-sm font-semibold text-ink-2 hover:border-accent hover:text-ink transition-all duration-200">
                  Start free
                </Link>
              )}
            </div>

            {/* Pro */}
            <div className="pricing-card relative glass rounded-2xl p-7 space-y-6 overflow-hidden border border-accent/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" style={{ opacity: 0 }}>
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-accent-2 to-accent" />
              <div>
                <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest">Pro</p>
                <p className="text-4xl font-semibold tracking-tighter text-ink mt-2">
                  ₱399<span className="text-lg text-ink-4 font-normal">/mo</span>
                </p>
                <p className="text-xs text-ink-4 mt-1">Billed monthly. Cancel anytime.</p>
              </div>
              <ul className="space-y-3 text-sm text-ink-3">
                {['Everything in Basic', 'Unlimited dishes & ingredients', 'Employees, payroll & waste log', 'Advanced analytics & forecasting', 'Daily digest email', 'CSV exports & priority support'].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 text-accent shrink-0" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7.5L5.5 10.5 11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {isLoggedIn ? (
                <Link href="/settings#plan" className="block w-full py-2.5 text-center btn-primary rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                  Upgrade to Pro
                </Link>
              ) : (
                <Link href="/signup" className="block w-full py-2.5 text-center btn-primary rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                  Start free — get 14-day Pro
                </Link>
              )}
            </div>

            {/* Pro Annual */}
            <div className="pricing-card relative glass rounded-2xl p-7 space-y-6 overflow-hidden border border-accent/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" style={{ opacity: 0 }}>
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent/60 to-accent" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-accent/70 uppercase tracking-widest">Pro Annual</p>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">Save ₱788</span>
                </div>
                <p className="text-4xl font-semibold tracking-tighter text-ink mt-2">
                  ₱4,000<span className="text-lg text-ink-4 font-normal">/yr</span>
                </p>
                <p className="text-xs text-ink-4 mt-1">Billed once a year — ₱333/mo effective.</p>
              </div>
              <ul className="space-y-3 text-sm text-ink-3">
                {['Everything in Pro', 'One payment, full year', 'No monthly billing worry', 'Early access to new features'].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 text-accent shrink-0" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7.5L5.5 10.5 11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {isLoggedIn ? (
                <Link href="/settings#plan" className="block w-full py-2.5 text-center rounded-xl text-sm font-semibold border border-accent/40 text-accent hover:bg-accent/10 transition-colors active:scale-[0.98]">
                  Subscribe annually
                </Link>
              ) : (
                <Link href="/signup" className="block w-full py-2.5 text-center rounded-xl text-sm font-semibold border border-accent/40 text-accent hover:bg-accent/10 transition-colors active:scale-[0.98]">
                  Start free
                </Link>
              )}
            </div>

          </div>
          <p className="text-xs text-ink-4 mt-5">
            Every new account starts on <span className="text-ink">Basic — free forever</span>. We unlock <span className="text-ink">14 days of Pro features</span> at signup so you can see the full picture. No credit card needed.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-hair">
        <div className="max-w-6xl mx-auto">
          <FAQ />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section id="cta-section" className="py-24 px-4 border-t border-hair">
        <div className="max-w-6xl mx-auto">
          <div className="cta-block glass rounded-3xl p-12 md:p-16 relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]" style={{ opacity: 0 }}>
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative max-w-[38ch]">
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tighter text-ink leading-tight">
                Stop guessing.<br />Start tracking.
              </h2>
              <p className="text-base text-ink-3 mt-4 leading-relaxed">
                Set up your business in under 5 minutes. No training, no onboarding call, no contract.
              </p>
              <div className="mt-8 flex items-center gap-3 flex-wrap">
                {isLoggedIn ? (
                  <Link href="/dashboard" className="px-6 py-3 btn-primary rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/signup" className="px-6 py-3 btn-primary rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                      Start free
                    </Link>
                    <Link href="/login" className="text-sm text-ink-3 hover:text-ink transition-colors px-1 py-3">
                      Already have an account →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile sticky CTA bar ─────────────────────────────────────────────── */}
      {!isLoggedIn && <MobileStickyBar scrolled={scrolled} />}

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-hair pt-14 pb-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 pb-12 border-b border-hair">

            {/* Brand col */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <SizzleLogo size={24} variant="badge" />
                <span className="text-sm font-semibold text-ink">Sizzle</span>
              </div>
              <p className="text-sm text-ink-4 leading-relaxed max-w-[28ch]">
                The all-in-one operating dashboard for restaurant and café owners in the Philippines.
              </p>
              <p className="text-xs text-ink-4">Made with ♥ in the Philippines</p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Product</p>
              <ul className="space-y-2.5 text-sm text-ink-4">
                {[
                  { label: 'Features',   href: '#features' },
                  { label: 'Operations', href: '#ops-section' },
                  { label: 'Reports',    href: '#reports-section' },
                  { label: 'Pricing',    href: '#pricing' },
                ].map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="hover:text-ink transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dashboard */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Dashboard</p>
              <ul className="space-y-2.5 text-sm text-ink-4">
                {[
                  { label: 'Sales', href: '/sales' },
                  { label: 'Expenses', href: '/expenses' },
                  { label: 'Inventory', href: '/inventory' },
                  { label: 'Reports', href: '/reports' },
                  { label: 'Employees', href: '/employees' },
                  { label: 'Payroll', href: '/payroll' },
                ].map(l => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-ink transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-widest">Account</p>
              <ul className="space-y-2.5 text-sm text-ink-4">
                {isLoggedIn ? (
                  <>
                    <li><Link href="/dashboard" className="hover:text-ink transition-colors">Dashboard</Link></li>
                    <li><Link href="/settings"  className="hover:text-ink transition-colors">Settings</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/signup" className="hover:text-ink transition-colors">Create account</Link></li>
                    <li><Link href="/login"  className="hover:text-ink transition-colors">Sign in</Link></li>
                  </>
                )}
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="pt-8 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-ink-4">© 2026 Sizzle. All rights reserved.</p>
            <p className="text-xs text-ink-4">Built for restaurant owners who want clarity, not complexity.</p>
          </div>
        </div>
      </footer>

    </main>
  )
}

// ── Sticky mobile CTA — only renders below md, slides up after hero ─────────
function MobileStickyBar({ scrolled }: { scrolled: boolean }) {
  return (
    <div
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 border-t border-hair bg-canvas/85 backdrop-blur-xl transition-transform duration-400 ease-out ${
        scrolled ? 'translate-y-0' : 'translate-y-full'
      }`}
      inert={!scrolled || undefined}
    >
      <Link
        href="/signup"
        className="flex items-center justify-center gap-2 w-full py-3 btn-primary rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform shadow-[0_10px_30px_-12px_var(--accent)]"
      >
        Start free
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
      <p className="text-[10px] text-ink-4 text-center mt-1.5">No credit card · Free forever · 14-day Pro at signup</p>
    </div>
  )
}
