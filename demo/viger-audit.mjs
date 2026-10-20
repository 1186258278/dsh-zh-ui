// Optional independent check using Viger1/dsh-design's render audit.
// Compile its audit.ts + collect.ts somewhere and point VIGER_AUDIT_DIR at the output; skipped otherwise.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'
const auditDir = process.env.VIGER_AUDIT_DIR
if (!auditDir || !existsSync(join(auditDir, 'audit.js'))) {
  console.error('viger-audit: skipped (set VIGER_AUDIT_DIR to a compiled Viger1/dsh-design audit build)')
  process.exit(0)
}
const { auditPage } = await import(pathToFileURL(join(auditDir, 'audit.js')).href)
const { COLLECT_SCRIPT } = await import(pathToFileURL(join(auditDir, 'collect.js')).href)
const dir = new URL('.', import.meta.url).pathname
const opts = { spacingBasePx: 4, maxTypeSizes: 6, maxPaletteColors: 8, neutralChroma: 0.18, minTapTargetPx: 24, maxCharsPerLine: 75 }
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const res = {}
for (const v of ['a', 'b', 'b2']) for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort())
  await page.goto(`file://${dir}${v}.html`)
  const sample = await page.evaluate(COLLECT_SCRIPT)
  const r = auditPage(sample, opts)
  if (v !== "a") console.error(w, JSON.stringify(r.violations.map(x=>[x.rule,x.message,x.elements.slice(0,4)])));
  res[`${v}-${w}`] = { violations: r.violations.map(x => `${x.rule}:${x.elements.length}`), typeSizes: r.summary.typeSizes, offGrid: r.summary.offGridSpacings.length, contrastFailures: r.summary.contrastFailures }
  await page.close()
}
await browser.close()
console.log(JSON.stringify(res, null, 1))
