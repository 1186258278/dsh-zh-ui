# dsh-zh-ui

English | [中文](README.zh.md)

A DeepSeek Harness (`dsh`) plugin for Chinese-language UI work. It has three parts:

1. **Skill `zh-ui-design`**: Chinese typography rules (spacing between Chinese and Latin/digits, full-width punctuation, CJK font stacks with fallbacks, line-height 1.6–1.8, 25–40 characters per line), an anti-"generated look" checklist, and a "design direction first" workflow and 4 style presets (observatory, night-shift, cobalt-poster, trust), each with complete CSS custom properties and nav / hero / pricing-card / CTA recipes. Preset text/background pairs are checked against WCAG AA (4.5:1).
2. **Project spec injection**: on every prompt assembly, reads `DESIGN.md` and `design.tokens.json` from the session's working directory and appends them as runtime context (not the cached system prompt). Nothing is injected when the files are absent.
3. **Tool `zh_design_lint`**: static scan of HTML / CSS / SCSS / Vue / JSX / TSX / Svelte sources and Tailwind classes. It does not render pages.

## zh_design_lint rules

| Rule | What it reports |
|---|---|
| `hardcoded-color` | Literal colors outside custom-property definitions (`--x:`), and Tailwind arbitrary colors `bg-[#…]`. Colors listed in `design.tokens.json` are allowed. |
| `off-scale-px` | px values in margin / padding / gap / font-size / border-radius / inset properties that are not multiples of the spacing base (default 4px); Tailwind `p-[13px]` etc. 0, 1, 2 and token px values are allowed. |
| `font-family-cjk` | `font-family` stacks with no Chinese font (PingFang SC, Microsoft YaHei, Noto Sans SC, …). `var(...)`, `inherit` and monospace stacks are skipped. |
| `cjk-latin-spacing` | Visible text where a Chinese character directly touches a Latin letter or digit. |
| `cjk-punctuation` | Half-width `, ; : ! ? .` next to Chinese characters. |
| `cjk-line-height` | Unitless `line-height` below 1.5 on body-text selectors (headings, buttons, prices etc. excluded); `leading-none/tight/snug` on `<p>`, `<li>` and similar. |
| `purple-gradient` | Gradients containing a violet/purple color (hue 250°–320°); Tailwind `from/via/to-purple|violet|fuchsia-*`. |
| `emoji-icon` | Emoji in visible text (symbols such as `©` and `™` are not counted). |
| `heading-subtitle` | Two or more headings each followed by a short subtitle paragraph, or an eyebrow + heading + subtitle triplet. |
| `filler-copy` | Stock marketing filler (一站式, 赋能, 无缝, seamless, elevate your …). |

Known limits: the CSS parsing is regex-based, not a full parser; color keywords such as `white` are not detected; contrast, tap-target size and rendered font sizes are not measured — use a rendering tool for those (for example `design_audit` from [dsh-design](https://github.com/Viger1/dsh-design)).

## Install

```sh
dsh plugin --profile web add github:1186258278/dsh-zh-ui
```

For local development, mount the build output with a patch:

```yaml
# extra.yml
- insert:
    - id: zh-ui
      name: '/absolute/path/to/dsh-zh-ui/lib/index.js'
```

```sh
dsh web --patch ./extra.yml
```

Requires Node 22+ (a `dsh` requirement).

## Configuration

```yaml
- id: zh-ui
  name: dsh-zh-ui
  config:
    registerSkill: true
    injectProjectSpec: true
    specFiles: [DESIGN.md, design.tokens.json]
    maxSpecChars: 8000
    rules: [hardcoded-color, off-scale-px, font-family-cjk, cjk-latin-spacing, cjk-punctuation, cjk-line-height, purple-gradient, emoji-icon, heading-subtitle, filler-copy]
    spacingBasePx: 4
    allowedPx: [0, 1, 2]
    minLineHeight: 1.5
    maxFiles: 200
```

## DSH APIs used

- `ctx.skills.register()` — runtime skill (`@deepseek-ai/dsh-skill`)
- `ctx.on('system-prompt/assemble', …)` — appends a runtime context entry after assembly, as `@deepseek-ai/dsh-working-directory` does
- `ctx.workingDirectory.get(session)` — the session's working directory
- `ctx.tools.register(defineTool(…))` — tool registration (`@deepseek-ai/dsh-tools`)

The lint only reads files inside the working directory; paths that resolve outside it are rejected.

## Development

```sh
npm install
npm run build
npm test
```

`demo/` contains an A/B comparison; see `demo/RESULTS.md`.

## License

MIT

## Credits

The skill text was written from scratch; ideas were adapted from:

- [anthropics/skills · frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) (Apache-2.0): plan first, review the plan against generic defaults, spend boldness in one place, list of generated-page tells, screenshot self-critique.
- [Viger1/dsh-design](https://github.com/Viger1/dsh-design) design-system skill (license not verified): fix palette and type scale first, one accent, spacing grid, hit area is not font size.
- [SummerSec/SumSec-Skills · taste-skill](https://github.com/SummerSec/SumSec-Skills) (Apache-2.0): infer direction from the product, avoid the cream + brass "premium" default palette, hue-tinted shadows, one radius system.
- [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines): `:focus-visible`, no `transition: all`, `prefers-reduced-motion`, tabular numbers, 44px mobile targets.
- [ChenYiming-aaa/dsh-ui-ux-pro-max](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max) (MIT, data from nextlevelbuilder/ui-ux-pro-max-skill): prioritized checks (contrast, touch, no emoji icons).
