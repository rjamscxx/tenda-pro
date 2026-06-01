#!/usr/bin/env node
// Walks every <section> on the landing page and screenshots each one into
// marketing/landing/. Also emits one full-page screenshot at the top.
//
// Run: node scripts/capture-landing.mjs
//   --url=<url>      defaults to http://localhost:3000
//   --width=<px>     viewport width (default 1440)
//   --height=<px>    viewport height (default 900)

import { chromium } from 'playwright'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'marketing', 'landing')

const urlArg    = process.argv.find(a => a.startsWith('--url='))
const widthArg  = process.argv.find(a => a.startsWith('--width='))
const heightArg = process.argv.find(a => a.startsWith('--height='))
const URL    = urlArg    ? urlArg.slice(6)    : 'http://localhost:3000'
const WIDTH  = widthArg  ? +widthArg.slice(8) : 1440
const HEIGHT = heightArg ? +heightArg.slice(9) : 900

await rm(OUT_DIR, { recursive: true, force: true })
await mkdir(OUT_DIR, { recursive: true })

const browser = await chromium.launch()
try {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  process.stdout.write(`▸ Loading ${URL} ... `)
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })
  console.log('ok')

  // Scroll to the bottom so every below-fold dynamic() import mounts,
  // then back to the top so we can walk sections in order. Some landing
  // sections (OwnerScene, ComparisonTable, FounderStory, FAQ) only
  // mount when scrolled near via requestIdleCallback.
  process.stdout.write('▸ Hydrating below-fold sections ... ')
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms))
    const max = document.documentElement.scrollHeight
    for (let y = 0; y < max; y += 400) {
      window.scrollTo(0, y)
      await sleep(80)
    }
    window.scrollTo(0, 0)
    await sleep(500)
  })
  await page.waitForLoadState('networkidle')
  console.log('ok')

  // ── Full-page screenshot ──────────────────────────────────────────────
  process.stdout.write('▸ Full-page screenshot ... ')
  await page.screenshot({
    path: path.join(OUT_DIR, '00-full-page.png'),
    fullPage: true,
  })
  console.log('ok')

  // ── Per-section screenshots ───────────────────────────────────────────
  const sections = page.locator('main > section, main section')
  const count = await sections.count()
  console.log(`▸ Found ${count} sections — capturing each:`)

  // Disable animations + hide overlays (sticky nav, Vercel dev toolbar, etc).
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0ms !important;
        transition-duration: 0ms !important;
      }
      header, nav[class*="fixed"], nav[class*="sticky"], div[class*="fixed top-"] {
        display: none !important;
      }
      /* Vercel dev toolbar / Next.js dev indicators (only on localhost) */
      vercel-live-feedback,
      div[id^="__next-build-watcher"],
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      [data-vercel-toolbar],
      [data-vercel-toolbar-root],
      #__next-dev-tools-menu,
      nextjs-portal { display: none !important; }
    `,
  })
  // Vercel toolbar lives in a closed shadow DOM, so CSS can't reach it.
  // Remove the host element instead — it's the only direct child of <body>
  // that isn't part of the app.
  await page.evaluate(() => {
    document.querySelectorAll('vercel-live-feedback, [data-vercel-toolbar]').forEach(el => el.remove())
    Array.from(document.body.children).forEach(el => {
      if (el.tagName?.toLowerCase().startsWith('vercel-') || el.id?.includes('vercel')) el.remove()
    })
  })

  for (let i = 0; i < count; i++) {
    const sec = sections.nth(i)
    const slug = await sec.evaluate((el) => {
      // Slug from id if present, else from first eyebrow + h1/h2 text.
      if (el.id) return el.id
      const eyebrow = el.querySelector('p, span')?.textContent?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ?? ''
      const heading = el.querySelector('h1, h2')?.textContent?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) ?? ''
      const parts = [eyebrow, heading].filter(Boolean)
      return parts.join('--') || `section-${el.tagName}`
    })
    const num = String(i + 1).padStart(2, '0')
    const filename = `${num}-${slug || 'unnamed'}.png`.replace(/-+/g, '-')

    try {
      await sec.scrollIntoViewIfNeeded({ timeout: 3000 })
      await page.waitForTimeout(200)
      await sec.screenshot({ path: path.join(OUT_DIR, filename) })
      console.log(`  ✓ ${filename}`)
    } catch (err) {
      console.log(`  ✗ ${filename} — ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`\n  ${count} sections + full-page → marketing/landing/`)
} finally {
  await browser.close()
}
