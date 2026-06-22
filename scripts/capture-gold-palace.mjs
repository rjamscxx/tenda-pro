// Capture screenshots of Gold Palace Streetwear for the portfolio.
// Usage: cd "E:/SaaS/TENDA PRO/tenda-pro" && node scripts/capture-gold-palace.mjs

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const OUT    = "E:/SaaS/screenshots/gold-palace-streetwear";
const STORE  = "E:/SaaS/GOLD PALACE STREETWEAR/gold-palace-store.html";
const DASH   = "E:/SaaS/GOLD PALACE STREETWEAR/gold-palace.html";

const VP = { width: 1440, height: 900, deviceScaleFactor: 1.5 };

const fileUrl = (p) => "file:///" + p.replace(/\\/g, "/").replace(/ /g, "%20");

async function shot(page, outDir, name) {
  await page.screenshot({ path: join(outDir, name), fullPage: false });
  console.log(`  → ${name}`);
}

(async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  // ── STOREFRONT ───────────────────────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: { width: VP.width, height: VP.height }, deviceScaleFactor: VP.deviceScaleFactor, colorScheme: "dark" });
    const page = await ctx.newPage();
    console.log("Opening store...");
    await page.goto(fileUrl(STORE), { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(2500);

    // hero — top of store
    await shot(page, OUT, "hero.png");

    // section-2 — products grid
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.1, behavior: "instant" }));
    await page.waitForTimeout(700);
    await shot(page, OUT, "section-2.png");

    // full page
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT, "full.png"), fullPage: true, timeout: 60000 }).catch(() => {});
    console.log("  → full.png");

    await ctx.close();
  }

  // ── DASHBOARD ────────────────────────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: { width: VP.width, height: VP.height }, deviceScaleFactor: VP.deviceScaleFactor, colorScheme: "dark" });
    const page = await ctx.newPage();
    console.log("Opening dashboard...");
    await page.goto(fileUrl(DASH), { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(2500);

    // section-3 — dashboard view
    await shot(page, OUT, "section-3.png");

    await ctx.close();
  }

  await browser.close();
  console.log(`\n✓ Done. 4 screenshots saved to:\n  ${OUT}`);
})();
