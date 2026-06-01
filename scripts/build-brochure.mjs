#!/usr/bin/env node
// Renders marketing/sizzle-brochure.html → marketing/sizzle-brochure.pdf
// using Playwright's built-in PDF engine. A4 portrait, 8 pages, print
// backgrounds enabled so brand color sections render.
//
// Run: node scripts/build-brochure.mjs

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const ROOT       = process.cwd()
const HTML_PATH  = path.join(ROOT, 'marketing', 'sizzle-brochure.html')
const PDF_PATH   = path.join(ROOT, 'marketing', 'sizzle-brochure.pdf')
const PREVIEW_DIR = path.join(ROOT, 'marketing', 'brochure-preview')

const browser = await chromium.launch()
try {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('file:///' + HTML_PATH.replace(/\\/g, '/'), { waitUntil: 'networkidle' })

  // ── 1. PDF render (print media for @page rules) ─────────────────────────
  await page.emulateMedia({ media: 'print' })
  process.stdout.write('▸ Rendering brochure to PDF ... ')
  await page.pdf({
    path: PDF_PATH,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true,
  })
  console.log('ok')

  // ── 2. Per-page PNG previews (screen media for accurate colors) ─────────
  await page.emulateMedia({ media: 'screen' })
  await mkdir(PREVIEW_DIR, { recursive: true })
  const pages = page.locator('section.page')
  const count = await pages.count()
  process.stdout.write(`▸ Rendering ${count} page previews ... `)
  for (let i = 0; i < count; i++) {
    const num = String(i + 1).padStart(2, '0')
    await pages.nth(i).screenshot({
      path: path.join(PREVIEW_DIR, `page-${num}.png`),
    })
  }
  console.log('ok')

  console.log(`\n  marketing/sizzle-brochure.pdf       (A4 portrait, ${count} pages)`)
  console.log(`  marketing/brochure-preview/*.png    (page-by-page previews)`)
} finally {
  await browser.close()
}
