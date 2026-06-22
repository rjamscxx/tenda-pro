import { chromium } from 'playwright'
import path from 'path'
import { mkdirSync } from 'fs'
import { pathToFileURL } from 'url'

const APPS = [
  {
    name: 'budtenderph',
    file: 'E:/SaaS/BUDTENDERPH/budtenderth428.html',
    out:  'E:/SaaS/screenshots/budtenderph',
  },
  {
    name: 'jazel-hub',
    file: 'E:/SaaS/JAZEL HUB/jazelhub42626.html',
    out:  'E:/SaaS/screenshots/jazel-hub',
  },
  {
    name: 'youngminds',
    file: 'E:/SaaS/YOUNGMINDS/youngminds_v7  5-5.html',
    out:  'E:/SaaS/screenshots/youngminds',
  },
]

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  })

  for (const app of APPS) {
    mkdirSync(app.out, { recursive: true })
    const page = await ctx.newPage()
    const fileUrl = pathToFileURL(app.file).href
    console.log(`\nOpening ${app.name} (${fileUrl})`)

    try {
      await page.goto(fileUrl, { waitUntil: 'load', timeout: 20000 })
      await page.waitForTimeout(1500)

      // hero — top of page
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${app.out}/hero.png`, clip: { x:0, y:0, width:1440, height:900 } })
      console.log(`  hero.png ✓`)

      // section-2 — 30% down
      const h = await page.evaluate(() => document.body.scrollHeight)
      await page.evaluate((y) => window.scrollTo(0, y), Math.floor(h * 0.28))
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${app.out}/section-2.png`, clip: { x:0, y:0, width:1440, height:900 } })
      console.log(`  section-2.png ✓`)

      // section-3 — 56% down
      await page.evaluate((y) => window.scrollTo(0, y), Math.floor(h * 0.56))
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${app.out}/section-3.png`, clip: { x:0, y:0, width:1440, height:900 } })
      console.log(`  section-3.png ✓`)

      // section-4 — 80% down
      await page.evaluate((y) => window.scrollTo(0, y), Math.floor(h * 0.80))
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${app.out}/section-4.png`, clip: { x:0, y:0, width:1440, height:900 } })
      console.log(`  section-4.png ✓`)

      // full — entire page
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${app.out}/full.png`, fullPage: true })
      console.log(`  full.png ✓`)

    } catch (e) {
      console.error(`  ERROR: ${e.message}`)
    }

    await page.close()
  }

  await browser.close()
  console.log('\nDone!')
})()
