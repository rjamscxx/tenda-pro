/**
 * Capture real Tenda Pro app screenshots with smoke-test data.
 *
 * Usage (from project root, with dev server running on :3000):
 *   npx dotenv -e .env.local -- node scripts/capture-app-screens.mjs
 *
 * Outputs:  public/landing/screenshots/<slug>.png
 * Tracked:  yes — public/landing/ is NOT gitignored.
 * Re-run:   any time you want fresh screenshots after seeding smoke data.
 *
 * Smoke account: smoketest+lina@tenda.local / SmokeTest!123
 * Seed command:  npx dotenv -e .env.local -- node scratch-simulate-day.mjs --theme=cafe
 */

import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE    = process.env.CAPTURE_BASE ?? 'http://localhost:3000'
const EMAIL   = 'smoketest+lina@tenda.local'
const PASS    = 'SmokeTest!123'
const VENUE   = 'b03d40ec-f718-4c46-85ec-e05b71360118'
const OUT     = path.join(__dirname, '..', 'public', 'landing', 'screenshots')

mkdirSync(OUT, { recursive: true })

const THEME_COOKIE = {
  name: 'tenda-theme', value: 'ember',
  domain: 'localhost', path: '/', expires: -1,
  httpOnly: false, secure: false, sameSite: 'Lax',
}

// Pages to capture — order determines gallery priority on landing
const PAGES = [
  { slug: 'dashboard',    url: '/dashboard' },
  { slug: 'sales',        url: '/sales' },
  { slug: 'pos',          url: '/pos' },
  { slug: 'menu',         url: '/menu' },
  { slug: 'inventory',    url: '/inventory' },
  { slug: 'expenses',     url: '/expenses' },
  { slug: 'reports',      url: '/reports' },
  { slug: 'analytics',    url: '/analytics' },
  { slug: 'employees',    url: '/employees' },
  { slug: 'payroll',      url: '/payroll' },
  { slug: 'shifts',       url: '/shifts' },
  { slug: 'waste',        url: '/waste' },
  { slug: 'checklists',   url: '/checklists' },
  { slug: 'kds',          url: '/kds' },
  { slug: 'suppliers',    url: '/suppliers' },
  { slug: 'close-day',    url: '/close-day' },
  { slug: 'settings',     url: '/settings' },
  // Public QR menu — no auth required
  { slug: 'qr-menu',      url: `/m/${VENUE}`, public: true },
]

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    storageState: { cookies: [THEME_COOKIE], origins: [] },
  })

  const page = await ctx.newPage()

  // Suppress AppIntro splash (session-gated, would cover the screenshot)
  await ctx.addInitScript(() => {
    sessionStorage.setItem('tp-intro-v1', '1')
  })

  // ── Login ──────────────────────────────────────────────────────────────────
  console.log('Logging in as', EMAIL, '...')
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })

  // Debug: log current URL and any error messages
  console.log('  At:', page.url())

  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASS)

  // Click submit and wait for navigation
  await Promise.all([
    page.waitForURL(u => !u.toString().includes('/login'), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ])

  // If we land on onboarding, skip it to dashboard
  if (page.url().includes('/onboarding')) {
    console.log('  Redirected to onboarding — skipping to dashboard')
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  }

  console.log('  Logged in ✓  →', page.url())

  // Ensure theme cookie is set after auth (SSR reads it for theme)
  await ctx.addCookies([THEME_COOKIE])

  // ── Capture each page ─────────────────────────────────────────────────────
  for (const p of PAGES) {
    if (p.public) {
      // Public pages — new tab, no auth needed
      const pubPage = await ctx.newPage()
      await pubPage.addInitScript(() => sessionStorage.setItem('tp-intro-v1', '1'))
      console.log(`Capturing ${p.slug}  (public)...`)
      await pubPage.goto(`${BASE}${p.url}`, { waitUntil: 'load', timeout: 30000 })
      await pubPage.waitForTimeout(2000)
      await pubPage.screenshot({
        path: path.join(OUT, `${p.slug}.png`),
        clip: { x: 0, y: 0, width: 1440, height: 900 },
      })
      await pubPage.close()
    } else {
      console.log(`Capturing ${p.slug}...`)
      await page.goto(`${BASE}${p.url}`, { waitUntil: 'networkidle' })
      // Wait for any staggered card-enter animations to settle
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: path.join(OUT, `${p.slug}.png`),
        clip: { x: 0, y: 0, width: 1440, height: 900 },
      })
    }
    console.log(`  ${p.slug}.png ✓`)
  }

  await browser.close()
  console.log(`\nDone! ${PAGES.length} screenshots → public/landing/screenshots/`)
}

run().catch(err => { console.error(err); process.exit(1) })
