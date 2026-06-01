#!/usr/bin/env node
// Renders marketing/sizzle-flyer.html to a 1080×2400 PNG, optionally pulling
// a fresh hero screenshot from sizzle.app first.
//
// Run: node scripts/build-flyer.mjs
//   --no-hero       skip the live-site screenshot, use existing marketing/hero.png
//   --url=<url>     override sizzle.app (e.g. http://localhost:3000)

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT       = process.cwd()
const FLYER_HTML = path.join(ROOT, 'marketing', 'sizzle-flyer.html')
const FLYER_PNG  = path.join(ROOT, 'marketing', 'sizzle-flyer.png')
const HERO_PNG   = path.join(ROOT, 'marketing', 'hero.png')

const args = new Set(process.argv.slice(2))
const noHero = args.has('--no-hero')
const urlArg = process.argv.find(a => a.startsWith('--url='))
const SITE_URL = urlArg ? urlArg.slice(6) : 'https://sizzle.app'

await mkdir(path.join(ROOT, 'marketing'), { recursive: true })
const browser = await chromium.launch()

try {
  // ── 1. Hero screenshot from the live site ────────────────────────────────
  if (!noHero) {
    process.stdout.write(`▸ Capturing hero from ${SITE_URL} ... `)
    // Real-browser UA + locale headers so Vercel/Cloudflare bot rules don't
    // serve us an Access Denied page.
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      locale: 'en-PH',
      extraHTTPHeaders: {
        'Accept-Language': 'en-PH,en;q=0.9',
      },
    })
    const page = await context.newPage()
    try {
      const res = await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 25000 })
      const status = res?.status() ?? 0
      const body = await page.locator('body').innerText().catch(() => '')
      if (status >= 400 || /access denied|forbidden|just a moment/i.test(body)) {
        throw new Error(`origin returned ${status}: ${body.slice(0, 80)}`)
      }
      // The hero is at the top of the landing — give GSAP/lazy hooks a beat.
      await page.waitForTimeout(2000)
      await page.screenshot({
        path: HERO_PNG,
        clip: { x: 0, y: 0, width: 1440, height: 810 },
      })
      console.log('ok')
    } catch (err) {
      console.log(`failed (${err instanceof Error ? err.message : err})`)
      console.log(`  → flyer will render with the placeholder block.`)
    } finally {
      await context.close()
    }
  }

  // ── 2. Inject the hero image into the flyer if it exists ─────────────────
  const flyerPage = await browser.newPage({
    viewport: { width: 1080, height: 2400 },
    deviceScaleFactor: 2,
  })
  await flyerPage.goto('file:///' + FLYER_HTML.replace(/\\/g, '/'))
  if (existsSync(HERO_PNG)) {
    await flyerPage.evaluate(() => {
      const visual = document.getElementById('visual')
      if (!visual) return
      visual.classList.remove('placeholder')
      visual.innerHTML = '<img src="hero.png" alt="Sizzle dashboard" />'
    })
    // Give the image a moment to decode.
    await flyerPage.waitForLoadState('networkidle')
    await flyerPage.waitForTimeout(300)
  }

  // ── 3. Screenshot the flyer ──────────────────────────────────────────────
  process.stdout.write('▸ Rendering flyer to PNG ... ')
  await flyerPage.screenshot({
    path: FLYER_PNG,
    fullPage: false,  // we set the viewport to exact flyer size
    clip: { x: 0, y: 0, width: 1080, height: 2400 },
  })
  console.log('ok')
  console.log(`\n  marketing/sizzle-flyer.png  (1080 × 2400)`)
} finally {
  await browser.close()
}
