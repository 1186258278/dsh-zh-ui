import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'
const dir = new URL('.', import.meta.url).pathname
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const out = {}
for (const v of (process.env.PAGES || 'a,b,b2').split(',').filter(x => existsSync(`${dir}${x}.html`))) for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`file://${dir}${v}.html`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  out[`${v}-${w}`] = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }))
  await page.screenshot({ path: `${dir}shots/${v}-${w}.png`, fullPage: true })
  await page.close()
}
await browser.close()
console.log(JSON.stringify(out))
