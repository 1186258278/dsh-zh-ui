/**
 * dsh-zh-ui — Chinese UI design spec for DeepSeek Harness.
 *  - registers the `zh-ui-design` skill (skills/zh-ui-design/SKILL.md) via ctx.skills.register
 *  - injects the project's DESIGN.md / design.tokens.json as runtime context on every assembly
 *  - registers the static `zh_design_lint` tool
 * @module dsh-zh-ui
 */
import { readFileSync } from 'node:fs'
import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-skill'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-working-directory'
import { ALL_RULES, lintSource, summarize, tokenAllowances, type Finding, type RuleId } from './lint.js'

export const name = 'zh-ui'
export const inject = ['tools', 'systemPrompt', 'workingDirectory']

export interface Config {
  registerSkill: boolean
  injectProjectSpec: boolean
  specFiles: string[]
  maxSpecChars: number
  rules: RuleId[]
  spacingBasePx: number
  allowedPx: number[]
  minLineHeight: number
  maxFiles: number
}

export const Config: z<Config> = z.object({
  registerSkill: z.boolean().default(true),
  injectProjectSpec: z.boolean().default(true),
  specFiles: z.array(z.string()).default(['DESIGN.md', 'design.tokens.json']),
  maxSpecChars: z.number().default(8000),
  rules: z.array(z.union(ALL_RULES as RuleId[])).default([...ALL_RULES]),
  spacingBasePx: z.number().default(4),
  allowedPx: z.array(z.number()).default([0, 1, 2]),
  minLineHeight: z.number().default(1.5),
  maxFiles: z.number().default(200),
})

const here = dirname(fileURLToPath(import.meta.url))
const SKILL_PATH = join(here, '..', 'skills', 'zh-ui-design', 'SKILL.md')
const LINT_EXT = new Set(['.html', '.htm', '.css', '.scss', '.less', '.vue', '.jsx', '.tsx', '.svelte'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'lib', '.next', 'out', 'coverage'])

/** Split `---` YAML frontmatter from a SKILL.md body (only `name`/`description` are read). */
export function parseSkill(md: string): { name: string, description: string, content: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(md)
  const head = m?.[1] ?? ''
  const field = (k: string) => new RegExp(`^${k}:\\s*(.+)$`, 'm').exec(head)?.[1].trim().replace(/^['"]|['"]$/g, '') ?? ''
  return { name: field('name'), description: field('description'), content: m ? md.slice(m[0].length) : md }
}

/** Read the project spec files under `cwd`, truncated, as one context block (or '' if none). */
export async function readProjectSpec(cwd: string, files: readonly string[], maxChars: number): Promise<string> {
  const parts: string[] = []
  for (const f of files) {
    const text = await readFile(join(cwd, f), 'utf8').catch(() => undefined)
    if (text === undefined) continue
    parts.push(`### ${f}\n${text.length > maxChars ? text.slice(0, maxChars) + '\n…(truncated)' : text}`)
  }
  if (!parts.length) return ''
  return '<project-design-spec>\nThis project defines a UI design spec. Follow it for any UI you write or change; '
    + 'prefer its tokens over new literal values, and run zh_design_lint on changed UI files.\n\n'
    + parts.join('\n\n') + '\n</project-design-spec>'
}

async function collectFiles(root: string, target: string, max: number): Promise<string[]> {
  const prefix = root.endsWith(sep) ? root : root + sep
  const abs = await realpath(resolve(root, target)).catch(() => { throw new Error(`path ${JSON.stringify(target)} does not exist`) })
  if (abs !== root && !abs.startsWith(prefix)) throw new Error(`path ${JSON.stringify(target)} resolves outside the workspace`)
  const out: string[] = []
  const walk = async (p: string) => {
    if (out.length >= max) return
    const s = await stat(p)
    if (s.isDirectory()) {
      for (const e of await readdir(p)) if (!SKIP_DIRS.has(e) && !e.startsWith('.')) await walk(join(p, e))
    } else if (LINT_EXT.has(extname(p).toLowerCase())) out.push(p)
  }
  await walk(abs)
  return out
}

/** Run the lint over workspace paths; exported for tests and the CLI demo. */
export async function runLint(cwd: string, paths: readonly string[], config: Config): Promise<Finding[]> {
  const root = await realpath(cwd)
  const tokens = await readFile(join(root, 'design.tokens.json'), 'utf8').then(JSON.parse).catch(() => undefined)
  const allow = tokenAllowances(tokens)
  const findings: Finding[] = []
  for (const p of paths) {
    for (const file of await collectFiles(root, p, config.maxFiles)) {
      findings.push(...lintSource(relative(root, file), await readFile(file, 'utf8'), {
        rules: config.rules,
        spacingBasePx: config.spacingBasePx,
        allowedPx: [...config.allowedPx, ...allow.px],
        allowedColors: allow.colors,
        minLineHeight: config.minLineHeight,
      }))
    }
  }
  return findings
}

export function renderFindings(findings: Finding[]): string {
  if (!findings.length) return 'zh_design_lint: no findings.'
  const s = summarize(findings)
  const head = `zh_design_lint: ${findings.length} findings — ` + Object.entries(s).map(([k, v]) => `${k} ${v}`).join(', ')
  const shown = findings.slice(0, 80).map(f => `${f.file}:${f.line} [${f.rule}] ${f.message}`)
  return [head, ...shown, findings.length > 80 ? `…and ${findings.length - 80} more` : ''].filter(Boolean).join('\n')
}

export function apply(ctx: Context, config: Config): void {
  // Session cwd when the working-directory service is composed; process cwd otherwise.
  const cwdOf = (agent: Agent | undefined): string => {
    if (agent?.session) return ctx.workingDirectory.get(agent.session)
    return ctx.workingDirectory.defaultDirectory
  }

  if (config.registerSkill) {
    const skill = parseSkill(readFileSync(SKILL_PATH, 'utf8'))
    ctx.inject(['skills'], (c) => { c.skills.register({ ...skill, source: 'runtime', resourceBase: { kind: 'directory', path: dirname(SKILL_PATH) } }) })
  }

  if (config.injectProjectSpec) {
    {
      // Waterfall pattern mirrors @deepseek-ai/dsh-working-directory: async read, then append a context entry.
      ctx.on('system-prompt/assemble', async (_assembly, context, next) => {
        const assembly = await next()
        if (context.agent === undefined) return assembly
        const text = await readProjectSpec(cwdOf(context.agent), config.specFiles, config.maxSpecChars)
        if (text) assembly.contexts.push({ name: 'zh-ui:project-spec', text, interpolate: false })
        return assembly
      })
    }
  }

  ctx.tools.register(defineTool({
    name: 'zh_design_lint',
    description:
      'Static lint for Chinese UI source (HTML, CSS, Vue, JSX/TSX, Tailwind classes). Reports literal colors '
      + 'outside tokens, px values off the spacing scale, font stacks with no Chinese font, missing spaces '
      + 'between Chinese and Latin/digits, half-width punctuation in Chinese text, tight line-height on body '
      + 'text, purple gradients and emoji used as icons. Reads design.tokens.json at the workspace root to '
      + 'allow token values. Run it on UI files you created or changed and fix what it reports.',
    parameters: {
      paths: {
        type: 'array',
        required: true,
        items: { type: 'string' },
        description: 'Workspace-relative files or directories to lint.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          total: { type: 'integer', required: true },
          text: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.text }],
    },
    async execute(args, exec) {
      const findings = await runLint(cwdOf(exec.agent), args.paths, config)
      return { total: findings.length, text: renderFindings(findings) }
    },
  }))
}
