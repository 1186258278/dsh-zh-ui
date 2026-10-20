import { describe, expect, it } from 'vitest'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lintSource, parseColor, hueSat, tokenAllowances, summarize } from '../src/lint.js'
import { parseSkill, readProjectSpec, runLint, Config } from '../src/index.js'
import { readFileSync } from 'node:fs'

const rules = (f: { rule: string }[]) => f.map(x => x.rule)

describe('css rules', () => {
  it('flags literal colors but not custom-property definitions', () => {
    const f = lintSource('a.css', ':root{--accent:#1f5eff}\n.btn{color:#fff;background:var(--accent)}')
    expect(rules(f)).toEqual(['hardcoded-color'])
    expect(f[0].line).toBe(2)
  })
  it('respects allowedColors from tokens', () => {
    expect(lintSource('a.css', '.x{color:#FFFFFF}', { allowedColors: ['#ffffff'] })).toEqual([])
  })
  it('flags off-scale px on spacing props only', () => {
    const f = lintSource('a.css', '.a{padding:13px 16px;width:333px;border:1px solid var(--b)}')
    expect(rules(f)).toEqual(['off-scale-px'])
    expect(f[0].message).toContain('13px')
  })
  it('allows token px values', () => {
    expect(lintSource('a.css', '.a{gap:10px}', { allowedPx: [10] })).toEqual([])
  })
  it('requires a CJK font in font stacks', () => {
    expect(rules(lintSource('a.css', 'body{font-family:Inter, sans-serif}'))).toEqual(['font-family-cjk'])
    expect(lintSource('a.css', 'body{font-family:Inter,"PingFang SC",sans-serif}')).toEqual([])
    expect(lintSource('a.css', 'body{font-family:var(--font-sans)}')).toEqual([])
    expect(lintSource('a.css', 'code{font-family:monospace}')).toEqual([])
  })
  it('flags tight line-height on body text but not headings', () => {
    expect(rules(lintSource('a.css', 'p{line-height:1.4}'))).toEqual(['cjk-line-height'])
    expect(lintSource('a.css', 'h1{line-height:1.2}')).toEqual([])
    expect(lintSource('a.css', 'p{line-height:1.7}')).toEqual([])
    expect(lintSource('a.css', '.big{font-size:48px;line-height:1.1}')).toEqual([])
    expect(lintSource('a.css', '.amt{font-size:var(--fs-3xl);line-height:1}')).toEqual([])
    expect(rules(lintSource('a.css', '.lede{font-size:var(--fs-m);line-height:1.3}'))).toEqual(['cjk-line-height'])
  })
  it('detects purple gradients by hue', () => {
    const f = lintSource('a.css', '.h{--x:0;background-image:linear-gradient(135deg,var(--a),var(--b))}\n.g{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}', { rules: ['purple-gradient'] })
    expect(rules(f)).toEqual(['purple-gradient'])
    expect(lintSource('a.css', '.g{background:linear-gradient(#1f5eff,#3ddc97)}', { rules: ['purple-gradient'] })).toEqual([])
  })
  it('ignores comments and handles @media nesting', () => {
    const f = lintSource('a.css', '/* color:#123456 */\n@media (max-width:600px){.a{margin:7px}}')
    expect(rules(f)).toEqual(['off-scale-px'])
    expect(f[0].line).toBe(2)
  })
})

describe('markup rules', () => {
  it('checks CJK/Latin spacing in visible text only', () => {
    const html = '<style>.a{}</style><script>var x="中文abc"</script><p>支持API调用</p><p>支持 API 调用</p>'
    const f = lintSource('a.html', html, { rules: ['cjk-latin-spacing'] })
    expect(f.length).toBe(2) // 持A and I调
  })
  it('flags half-width punctuation next to Chinese', () => {
    const f = lintSource('a.html', '<p>你好,世界.</p><p>Hello, world.</p>', { rules: ['cjk-punctuation'] })
    expect(f.length).toBe(2)
  })
  it('flags emoji in text', () => {
    expect(rules(lintSource('a.html', '<span>🚀 极速</span>', { rules: ['emoji-icon'] }))).toEqual(['emoji-icon'])
    expect(lintSource('a.html', '<p>© 2026 ❤️</p>', { rules: ['emoji-icon'] }).length).toBe(1)
  })
  it('lints <style> blocks and inline styles with correct lines', () => {
    const f = lintSource('a.html', '<html>\n<style>\n.a{color:#333}\n</style>\n<div style="padding:15px">x</div>', { rules: ['hardcoded-color', 'off-scale-px'] })
    expect(f.map(x => [x.rule, x.line])).toEqual([['hardcoded-color', 3], ['off-scale-px', 5]])
  })
  it('lints Tailwind classes', () => {
    const f = lintSource('a.tsx', '<p className="text-[#7c3aed] p-[13px] bg-gradient-to-r from-purple-500 to-pink-500 leading-tight">x</p>')
    expect(rules(f).sort()).toEqual(['cjk-line-height', 'hardcoded-color', 'off-scale-px', 'purple-gradient'])
  })
})

describe('helpers', () => {
  it('parses colors', () => {
    expect(parseColor('#fff')).toEqual([255, 255, 255])
    expect(parseColor('rgb(1, 2, 3)')).toEqual([1, 2, 3])
    expect(hueSat(parseColor('#7c3aed')!).hue).toBeGreaterThan(250)
  })
  it('extracts token allowances', () => {
    expect(tokenAllowances({ color: { a: '#111111' }, space: { s: '10px', m: 12 } })).toEqual({ colors: ['#111111'], px: [10, 12] })
  })
  it('summarizes', () => {
    expect(summarize([{ rule: 'emoji-icon', file: '', line: 1, message: '' }])).toEqual({ 'emoji-icon': 1 })
  })
})

describe('plugin pieces', () => {
  it('bundled SKILL.md has valid frontmatter', () => {
    const s = parseSkill(readFileSync(new URL('../skills/zh-ui-design/SKILL.md', import.meta.url), 'utf8'))
    expect(s.name).toBe('zh-ui-design')
    expect(s.description.length).toBeGreaterThan(20)
    expect(s.content.startsWith('\n# ') || s.content.startsWith('# ')).toBe(true)
  })
  it('reads project spec and lints a workspace with tokens', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'zhui-'))
    writeFileSync(join(dir, 'DESIGN.md'), '# spec\n主色 #0f5c44')
    writeFileSync(join(dir, 'design.tokens.json'), JSON.stringify({ color: { accent: '#0f5c44' }, space: { odd: '10px' } }))
    mkdirSync(join(dir, 'src'))
    writeFileSync(join(dir, 'src', 'a.css'), '.a{color:#0f5c44;margin:10px;padding:13px}')
    expect(await readProjectSpec(dir, ['DESIGN.md', 'missing.json'], 100)).toContain('主色')
    expect(await readProjectSpec(dir, ['nope.md'], 100)).toBe('')
    const cfg = Config({})
    const f = await runLint(dir, ['.'], cfg)
    expect(f.map(x => x.message)).toEqual([expect.stringContaining('13px')])
    await expect(runLint(dir, ['../'], cfg)).rejects.toThrow(/outside/)
  })
})

describe('copy rules', () => {
  it('flags repeated heading + subtitle, not a single one', () => {
    const one = '<h1>接口监控</h1><p>12 个节点，30 秒一次。</p>'
    expect(rules(lintSource('a.html', one))).toEqual([])
    const two = one + '<h2>定价</h2><p>选择适合你的方案。</p>'
    expect(rules(lintSource('a.html', two))).toEqual(['heading-subtitle', 'heading-subtitle'])
  })
  it('flags eyebrow + heading + subtitle triplets', () => {
    const f = lintSource('a.html', '<span>功能</span><h2>一切尽在掌握</h2><p>说明很长的一句话但只有一个</p>', { rules: ['heading-subtitle'] })
    expect(rules(f)).toEqual(['heading-subtitle'])
  })
  it('flags stock filler phrases', () => {
    expect(rules(lintSource('a.html', '<p>一站式平台，让你轻松管理</p>'))).toEqual(['filler-copy', 'filler-copy'])
    expect(rules(lintSource('a.html', '<p>Seamlessly elevate your workflow</p>'))).toEqual(['filler-copy', 'filler-copy'])
    expect(lintSource('a.html', '<p>每 30 秒探测一次</p>')).toEqual([])
  })
})
