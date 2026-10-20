/**
 * Static Chinese-UI lint. Pure functions over source text: no DOM, no network.
 * Inputs are HTML / CSS / JSX-like sources; findings carry 1-based line numbers.
 */

export type RuleId =
  | 'hardcoded-color'
  | 'off-scale-px'
  | 'font-family-cjk'
  | 'cjk-latin-spacing'
  | 'cjk-punctuation'
  | 'cjk-line-height'
  | 'purple-gradient'
  | 'emoji-icon'
  | 'heading-subtitle'
  | 'filler-copy'

export const ALL_RULES: readonly RuleId[] = [
  'hardcoded-color', 'off-scale-px', 'font-family-cjk', 'cjk-latin-spacing',
  'cjk-punctuation', 'cjk-line-height', 'purple-gradient', 'emoji-icon',
  'heading-subtitle', 'filler-copy',
]

export interface LintOptions {
  /** Rules to run; defaults to all. */
  rules?: readonly RuleId[]
  /** Spacing/size px values must be multiples of this (or listed in allowedPx). */
  spacingBasePx?: number
  /** Extra px values that are always allowed (e.g. 1, 2 for hairlines; token values). */
  allowedPx?: readonly number[]
  /** Colors allowed outside custom-property definitions (normalized lowercase hex or raw). */
  allowedColors?: readonly string[]
  /** Minimum unitless line-height for body text. */
  minLineHeight?: number
}

export interface Finding {
  rule: RuleId
  file: string
  line: number
  message: string
}

const DEFAULTS = {
  spacingBasePx: 4,
  allowedPx: [0, 1, 2],
  minLineHeight: 1.5,
}

/** CJK ideographs (incl. Ext-A and compatibility). */
const HAN = '\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff'
const CJK_LATIN = new RegExp(`[${HAN}][A-Za-z0-9]|[A-Za-z0-9][${HAN}]`, 'g')
const CJK_HALF_PUNCT = new RegExp(`[${HAN}][,;:!?]|[,;:!?][${HAN}]|[${HAN}]\\.(?=[${HAN}]|\\s|$)`, 'g')
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/gu

/** Fonts that cover Simplified Chinese; one of them must appear in a font stack. */
export const CJK_FONTS = [
  'pingfang sc', 'pingfang tc', 'pingfang hk', 'hiragino sans gb', 'microsoft yahei', '微软雅黑',
  'noto sans sc', 'noto sans cjk sc', 'noto serif sc', 'noto serif cjk sc', 'source han sans sc',
  'source han serif sc', 'source han sans cn', '思源黑体', '思源宋体', 'harmonyos sans sc',
  'misans', 'wenquanyi micro hei', 'songti sc', 'stsong', 'simsun', '宋体', 'heiti sc', 'lxgw wenkai',
]

/** Selectors exempt from the body line-height rule (display text may be tight). */
const DISPLAY_SELECTOR = /\b(h[1-6]|button|btn|title|heading|logo|price|num|badge|tag|chip|icon|kpi|stat)/i

const lineAt = (src: string, index: number): number => {
  let n = 1
  for (let i = 0; i < index && i < src.length; i++) if (src.charCodeAt(i) === 10) n++
  return n
}

/** Parse a CSS color literal to [r,g,b] (0-255), or undefined. */
export function parseColor(raw: string): [number, number, number] | undefined {
  const s = raw.trim().toLowerCase()
  let m = /^#([0-9a-f]{3,8})$/.exec(s)
  if (m) {
    let h = m[1]
    if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map(c => c + c).join('')
    if (h.length < 6) return undefined
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(s)
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])]
  m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/.exec(s)
  if (m) return hslToRgb(Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100)
  return undefined
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)].map(v => Math.round(v * 255)) as [number, number, number]
}

/** Hue in degrees and HSL saturation (0-1). */
export function hueSat([r, g, b]: [number, number, number]): { hue: number, sat: number } {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min
  const l = (max + min) / 2
  if (d === 0) return { hue: 0, sat: 0 }
  const sat = d / (1 - Math.abs(2 * l - 1))
  let hue = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  hue *= 60
  if (hue < 0) hue += 360
  return { hue, sat }
}

const isPurple = (raw: string): boolean => {
  const rgb = parseColor(raw)
  if (!rgb) return false
  const { hue, sat } = hueSat(rgb)
  return hue >= 250 && hue <= 320 && sat >= 0.35
}

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\([^)]*\)/g
const normColor = (c: string) => c.toLowerCase().replace(/\s+/g, '')

interface CssDecl { selector: string, prop: string, value: string, index: number, block: number }

/** Flatten innermost `selector { decls }` blocks; good enough for lint, not a full parser. */
export function cssDecls(css: string, baseIndex = 0): CssDecl[] {
  const out: CssDecl[] = []
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
  const block = /([^{}]*)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  let n = 0
  while ((m = block.exec(stripped))) {
    n++
    const selector = m[1].trim().split(/[;}]/).pop()!.trim()
    const bodyStart = m.index + m[0].indexOf('{') + 1
    const decl = /([-\w]+)\s*:\s*([^;]+)/g
    let d: RegExpExecArray | null
    while ((d = decl.exec(m[2]))) {
      out.push({ selector, prop: d[1].toLowerCase(), value: d[2].trim(), index: baseIndex + bodyStart + d.index, block: baseIndex * 1000 + n })
    }
  }
  return out
}

function inlineDecls(selector: string, style: string, index: number): CssDecl[] {
  const out: CssDecl[] = []
  const decl = /([-\w]+)\s*:\s*([^;]+)/g
  let d: RegExpExecArray | null
  while ((d = decl.exec(style))) out.push({ selector, prop: d[1].toLowerCase(), value: d[2].trim(), index: index + d.index, block: -index - 1 })
  return out
}

/** Display-size text (≥ 24px, or an xl+/display font-size token) may use tight leading. */
const isDisplaySize = (v: string): boolean => {
  const px = /(\d*\.?\d+)px/.exec(v)
  if (px) return Number(px[1]) >= 24
  const rem = /(\d*\.?\d+)r?em/.exec(v)
  if (rem) return Number(rem[1]) >= 1.5
  return /var\(--[\w-]*(xl|display|hero|title|big|h[1-3])\b/i.test(v)
}

const SPACING_PROPS = /^(margin|padding|gap|row-gap|column-gap|font-size|border-radius|top|right|bottom|left|inset)(-|$)/

function lintDecls(decls: CssDecl[], src: string, file: string, o: Required<LintOptions>, add: (f: Finding) => void): void {
  const on = (r: RuleId) => o.rules.includes(r)
  const allowedColors = new Set(o.allowedColors.map(normColor))
  const displayBlocks = new Set(decls.filter(d => d.prop === 'font-size' && isDisplaySize(d.value)).map(d => d.block))
  for (const d of decls) {
    const line = lineAt(src, d.index)
    const isTokenDef = d.prop.startsWith('--')
    if (on('hardcoded-color') && !isTokenDef) {
      for (const c of d.value.match(COLOR_LITERAL) ?? []) {
        if (allowedColors.has(normColor(c))) continue
        add({ rule: 'hardcoded-color', file, line, message: `${d.selector} { ${d.prop} } uses literal ${c}; reference a color token (var(--…)) instead` })
      }
    }
    if (on('purple-gradient') && /gradient\(/i.test(d.value)) {
      const purple = (d.value.match(COLOR_LITERAL) ?? []).filter(isPurple)
      if (purple.length) add({ rule: 'purple-gradient', file, line, message: `${d.selector} uses a violet/purple gradient (${purple.join(', ')}) — a common generated-UI tell` })
    }
    if (on('off-scale-px') && !isTokenDef && SPACING_PROPS.test(d.prop)) {
      for (const px of d.value.matchAll(/(-?\d*\.?\d+)px\b/g)) {
        const v = Math.abs(Number(px[1]))
        if (o.allowedPx.includes(v) || v % o.spacingBasePx === 0) continue
        add({ rule: 'off-scale-px', file, line, message: `${d.selector} { ${d.prop}: ${d.value} } — ${v}px is off the ${o.spacingBasePx}px scale` })
      }
    }
    if (on('font-family-cjk') && (d.prop === 'font-family' || (d.prop === 'font' && /,|serif|sans/.test(d.value)))) {
      const v = d.value.toLowerCase()
      if (!/var\(|inherit|initial|unset|monospace|^\s*mono/.test(v) && !CJK_FONTS.some(f => v.includes(f))) {
        add({ rule: 'font-family-cjk', file, line, message: `${d.selector} font stack "${d.value}" has no Chinese font (e.g. "PingFang SC", "Noto Sans SC", "Microsoft YaHei")` })
      }
    }
    if (on('cjk-line-height') && d.prop === 'line-height' && !DISPLAY_SELECTOR.test(d.selector) && !displayBlocks.has(d.block)) {
      const m = /^(\d*\.?\d+)$/.exec(d.value)
      if (m && Number(m[1]) < o.minLineHeight) {
        add({ rule: 'cjk-line-height', file, line, message: `${d.selector} line-height ${d.value} is tight for Chinese body text (use ${o.minLineHeight}–1.8)` })
      }
    }
  }
}

const TW_ARBITRARY = /\b(?:[a-z]+:)*(bg|text|border|from|via|to|fill|stroke|ring|shadow)-\[(#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?)\([^\]]*\))\]/g
const TW_ARBITRARY_PX = /\b(?:[a-z]+:)*-?(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|text|rounded|space-x|space-y)-\[(\d*\.?\d+)px\]/g
const TW_PURPLE = /\b(?:[a-z]+:)*(from|via|to)-(purple|violet|fuchsia)-\d{2,3}\b/g
const TW_TIGHT = /\bleading-(none|tight|snug)\b/

/** Lint one file. `kind` is inferred from the filename extension. */
export function lintSource(file: string, src: string, opts: LintOptions = {}): Finding[] {
  const o: Required<LintOptions> = {
    rules: opts.rules ?? ALL_RULES,
    spacingBasePx: opts.spacingBasePx ?? DEFAULTS.spacingBasePx,
    allowedPx: opts.allowedPx ?? DEFAULTS.allowedPx,
    allowedColors: opts.allowedColors ?? [],
    minLineHeight: opts.minLineHeight ?? DEFAULTS.minLineHeight,
  }
  const on = (r: RuleId) => o.rules.includes(r)
  const out: Finding[] = []
  const add = (f: Finding) => out.push(f)
  const isCss = /\.(css|scss|less)$/i.test(file)

  if (isCss) {
    lintDecls(cssDecls(src), src, file, o, add)
    return out
  }

  // Markup (HTML / Vue / JSX / Svelte): style blocks, inline styles, classes, text.
  for (const m of src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    lintDecls(cssDecls(m[1], m.index! + m[0].indexOf('>') + 1), src, file, o, add)
  }
  for (const m of src.matchAll(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi)) {
    lintDecls(inlineDecls('[style]', m[2], m.index! + m[0].indexOf(m[2])), src, file, o, add)
  }
  for (const m of src.matchAll(/\sclass(?:Name)?\s*=\s*(["'`])([\s\S]*?)\1/g)) {
    const cls = m[2], line = lineAt(src, m.index!)
    if (on('hardcoded-color')) for (const c of cls.matchAll(TW_ARBITRARY)) {
      if (!o.allowedColors.map(normColor).includes(normColor(c[2]))) add({ rule: 'hardcoded-color', file, line, message: `Tailwind arbitrary color ${c[0]}; use a theme token` })
    }
    if (on('off-scale-px')) for (const c of cls.matchAll(TW_ARBITRARY_PX)) {
      const v = Number(c[2])
      if (!o.allowedPx.includes(v) && v % o.spacingBasePx !== 0) add({ rule: 'off-scale-px', file, line, message: `Tailwind arbitrary ${c[0]} is off the ${o.spacingBasePx}px scale` })
    }
    if (on('purple-gradient') && cls.match(TW_PURPLE)) add({ rule: 'purple-gradient', file, line, message: `Tailwind purple/violet gradient classes (${cls.match(TW_PURPLE)!.join(' ')})` })
    if (on('cjk-line-height') && TW_TIGHT.test(cls)) {
      const tag = /<\s*([a-z0-9]+)[^<]*$/i.exec(src.slice(0, m.index!))?.[1] ?? ''
      if (/^(p|li|span|div|dd|blockquote|article)$/i.test(tag)) add({ rule: 'cjk-line-height', file, line, message: `<${tag}> uses ${cls.match(TW_TIGHT)![0]}; Chinese body text needs leading-relaxed (≈1.6–1.8)` })
    }
  }

  // Visible text: blank out script/style/comments/tags but keep offsets for line numbers.
  const blank = (s: string) => s.replace(/[^\n]/g, ' ')
  const text = src
    .replace(/<script[\s\S]*?<\/script>/gi, blank)
    .replace(/<style[\s\S]*?<\/style>/gi, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/<[^>]*>/g, blank)
  if (on('cjk-latin-spacing')) {
    for (const m of text.matchAll(CJK_LATIN)) add({ rule: 'cjk-latin-spacing', file, line: lineAt(src, m.index!), message: `missing space between Chinese and Latin/digits in "${contextAround(text, m.index!)}"` })
  }
  if (on('cjk-punctuation')) {
    for (const m of text.matchAll(CJK_HALF_PUNCT)) add({ rule: 'cjk-punctuation', file, line: lineAt(src, m.index!), message: `half-width punctuation in Chinese text "${contextAround(text, m.index!)}"; use full-width ，；：！？。` })
  }
  if (on('emoji-icon')) {
    for (const m of text.matchAll(EMOJI)) add({ rule: 'emoji-icon', file, line: lineAt(src, m.index!), message: `emoji ${m[0]} used in UI text; use an SVG icon or drop it` })
  }
  if (on('heading-subtitle')) {
    // A heading immediately followed by a short <p> is the generated "title + subtitle" pattern.
    // One instance can be legitimate (the hero); repeating it across sections is filler.
    const subs = [...src.matchAll(/<\/h([1-3])>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
      .filter(m => m[2].replace(/<[^>]*>/g, '').trim().length <= 80)
    if (subs.length >= 2) for (const m of subs) add({ rule: 'heading-subtitle', file, line: lineAt(src, m.index!), message: `h${m[1]} followed by a subtitle paragraph ("${m[2].replace(/<[^>]*>/g, '').trim().slice(0, 24)}…"); ${subs.length} headings do this — keep the title alone unless the sentence carries a fact` })
    for (const m of src.matchAll(/<(p|span|div|small)\b[^>]*>([^<]{1,16})<\/\1>\s*<h([1-3])\b[^>]*>[\s\S]*?<\/h\3>\s*<p\b/gi)) {
      if (/<\/h[1-6]>\s*$/i.test(src.slice(0, m.index!))) continue
      add({ rule: 'heading-subtitle', file, line: lineAt(src, m.index!), message: `eyebrow + heading + subtitle triplet ("${m[2].trim()}"); drop the eyebrow or the subtitle` })
    }
  }
  if (on('filler-copy')) {
    for (const m of text.matchAll(FILLER)) add({ rule: 'filler-copy', file, line: lineAt(src, m.index!), message: `filler phrase "${m[0]}" in "${contextAround(text, m.index!)}"; say the concrete function or number instead` })
  }
  return out
}

/** Stock phrases of generated Chinese/English marketing copy. Each says nothing a reader can check. */
const FILLER = /让[你您]?(?:轻松|更|随时|一键)|助[你您]|赋能|一站式|全方位|无缝|轻松(?:搞定|上手|实现)|极致体验|不只是[^，。]{1,12}更是|不仅仅?是[^，。]{1,12}更是|重新定义|开启[^，。]{0,6}之旅|尽在掌握|智能化|革命性|全新升级|为[你您]打造|seamless(?:ly)?|effortless(?:ly)?|revolutioni[sz]e|supercharge|unlock (?:the|your)|next-gen|elevate your|built for the future|10x your/gi

function contextAround(s: string, i: number): string {
  return s.slice(Math.max(0, i - 6), i + 8).replace(/\s+/g, ' ').trim()
}

/** Collect color and px leaf values from a design.tokens.json-like object. */
export function tokenAllowances(tokens: unknown): { colors: string[], px: number[] } {
  const colors: string[] = [], px: number[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') {
      if (parseColor(v)) colors.push(v)
      const m = /^(\d*\.?\d+)px$/.exec(v.trim())
      if (m) px.push(Number(m[1]))
    } else if (typeof v === 'number') px.push(v)
    else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x)
  }
  walk(tokens)
  return { colors, px }
}

export function summarize(findings: Finding[]): Record<string, number> {
  const s: Record<string, number> = {}
  for (const f of findings) s[f.rule] = (s[f.rule] ?? 0) + 1
  return s
}
