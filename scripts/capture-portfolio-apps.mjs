// Capture screenshots of every single-file HTML SaaS app in E:\SAAS\
// for use in the RJ-PORTFOLIO-v3 showcase.
//
// Usage:  cd "E:/SaaS/TENDA PRO/tenda-pro" && node scripts/capture-portfolio-apps.mjs

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "E:/SAAS";
const OUT  = `${ROOT}/screenshots`;

const apps = [
  { name: "courtside",            file: `${ROOT}/COURTSIDE PH/courtside (12).html`,                       device: "mobile" },
  { name: "grayscale-coffee-club", file: `${ROOT}/GRAYSCALECOFFEECLUB/grayscale-coffee-club (17).html`,    device: "mobile" },
  { name: "beanstack-pro",        file: `${ROOT}/GRAYSCALEV2/beanstack-pro.html`,                          device: "desktop" },
  { name: "assetos",              file: `${ROOT}/assetOS/premium.html`,                                    device: "desktop" },
  { name: "checkout-hub",         file: `${ROOT}/CHECKOUTHUBPH/checkout-hub-v6.html`,                      device: "desktop" },
  { name: "flowstack",            file: `${ROOT}/FLOWSTACK APP/FLOWSTACK APP 04-22.html`,                  device: "desktop" },
  { name: "doc-teethsko",         file: `${ROOT}/DOC TEETHSKO APP/DOC TEETHSKO APP V1 04-28.html`,         device: "desktop" },
  { name: "budtenderph",          file: `${ROOT}/BUDTENDERPH/budtenderth428.html`,                         device: "desktop" },
  { name: "jazel-hub",            file: `${ROOT}/JAZEL HUB/jazelhub42626.html`,                            device: "desktop" },
  { name: "youngminds",           file: `${ROOT}/YOUNGMINDS/youngminds_v7  5-5.html`,                      device: "desktop" },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900,  deviceScaleFactor: 1.5 },
  mobile:  { width: 414,  height: 896,  deviceScaleFactor: 2,   isMobile: true, hasTouch: true },
};

const fileToUrl = (p) => "file:///" + p.replace(/\\/g, "/").replace(/ /g, "%20");

async function captureApp(browser, app) {
  const vp = VIEWPORTS[app.device] ?? VIEWPORTS.desktop;
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
    isMobile: vp.isMobile ?? false,
    hasTouch: vp.hasTouch ?? false,
    colorScheme: "dark",
  });
  const page = await ctx.newPage();

  const outDir = join(OUT, app.name);
  await mkdir(outDir, { recursive: true });

  try {
    await page.goto(fileToUrl(app.file), { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(2500); // settle entrance animations

    // 1. Hero / viewport snapshot
    await page.screenshot({ path: join(outDir, "hero.png"), fullPage: false });

    // 2. Mid-page scroll
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.2, behavior: "instant" }));
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(outDir, "section-2.png"), fullPage: false });

    // 3. Further scroll
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2.5, behavior: "instant" }));
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(outDir, "section-3.png"), fullPage: false });

    // 4. Full page (capped — some apps are huge)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, "full.png"), fullPage: true, timeout: 60000 }).catch(() => {});

    console.log(`✓ ${app.name}`);
  } catch (err) {
    console.error(`✗ ${app.name}: ${err.message}`);
  } finally {
    await ctx.close();
  }
}

(async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  for (const app of apps) {
    await captureApp(browser, app);
  }
  await browser.close();
  console.log(`\nDone. Screenshots in ${OUT}`);
})();
