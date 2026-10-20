import { runLint, renderFindings, Config } from '../lib/index.js'
import { summarize } from '../lib/lint.js'
import { writeFileSync } from 'node:fs'
const out = {}
for (const f of ['a.html', 'b.html', 'b2.html']) {
  const findings = await runLint(new URL('.', import.meta.url).pathname, [f], Config({}))
  out[f] = { total: findings.length, byRule: summarize(findings) }
  writeFileSync(new URL(`lint-${f}.txt`, import.meta.url), renderFindings(findings) + '\n')
}
writeFileSync(new URL('lint-summary.json', import.meta.url), JSON.stringify(out, null, 2))
console.log(JSON.stringify(out, null, 2))
