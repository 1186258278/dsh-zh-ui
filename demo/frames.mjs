import { chromium } from 'playwright-core'
const dir = new URL('.', import.meta.url).pathname
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
for (const [w, h] of [[1440, 560], [390, 520]]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } })
  for (const [i, t] of [[1, 0], [2, 2.2]]) {
    await p.goto(`file://${dir}b.html?t=${t}`, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready)
    await p.screenshot({ path: `${dir}shots/b-wave-frame${i}${w === 390 ? '-390' : ''}.png`, clip: { x: 0, y: 0, width: w, height: h } })
  }
  await p.close()
}
await b.close()
{
  const b2 = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
  const p = await b2.newPage({ viewport: { width: 1440, height: 900 } })
  await p.goto(`file://${dir}b.html?t=0`, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready)
  const n = p.locator('.node').first(); await n.scrollIntoViewIfNeeded(); await n.hover(); await p.waitForTimeout(1100)
  const box = await p.locator('.trio .card').first().boundingBox()
  await p.screenshot({ path: `${dir}shots/b-ripple-hover.png`, clip: { x: box.x, y: box.y, width: box.width, height: 220 } })
  await b2.close()
}
