# dsh-zh-ui

[English](README.md) | 中文

DeepSeek Harness（`dsh`）插件：中文界面设计规范。包含三部分：

1. **skill `zh-ui-design`**：中文排版规则（中英文间距、全角标点、中文字体栈与回退、行高 1.6–1.8、每行 25–40 字）、反 AI 味清单，以及 "先定设计方向"的流程，以及 4 套风格预设（观测台、夜班值守、钴蓝海报、稳重可信），每套都给出完整的 CSS 变量和导航、首屏、定价卡、CTA 的组件配方。预设的文字颜色组合按 WCAG AA（4.5:1）校验过。
2. **项目规范注入**：每次组装提示词时读取当前会话工作目录下的 `DESIGN.md` 和 `design.tokens.json`，作为运行时上下文注入（不进入缓存的 system prompt）。文件不存在时不注入任何内容。
3. **工具 `zh_design_lint`**：静态扫描 HTML / CSS / SCSS / Vue / JSX / TSX / Svelte 源码和 Tailwind 类名，不渲染页面。

## zh_design_lint 规则

| 规则 | 检查内容 |
|---|---|
| `hardcoded-color` | CSS 变量定义（`--x:`）之外的字面色值，以及 Tailwind 任意色值 `bg-[#…]`。`design.tokens.json` 中出现的色值视为允许。 |
| `off-scale-px` | margin / padding / gap / font-size / border-radius / 定位属性中不在间距基数（默认 4px）倍数上的 px 值；Tailwind `p-[13px]` 等。默认允许 0、1、2，以及 token 中的 px 值。 |
| `font-family-cjk` | `font-family` 中没有任何中文字体（PingFang SC、Microsoft YaHei、Noto Sans SC 等）。`var(...)`、`inherit`、等宽字体跳过。 |
| `cjk-latin-spacing` | 页面可见文本中，汉字与英文字母或数字直接相连。 |
| `cjk-punctuation` | 汉字旁边使用半角 `, ; : ! ? .`。 |
| `cjk-line-height` | 正文选择器的无单位 `line-height` 小于 1.5（标题、按钮、价格等选择器除外）；`<p>`/`<li>` 等元素上的 `leading-none/tight/snug`。 |
| `purple-gradient` | 渐变中含紫色系颜色（按色相 250°–320° 判断）；Tailwind `from/via/to-purple|violet|fuchsia-*`。 |
| `emoji-icon` | 可见文本中的 emoji（`©`、`™` 等符号不算）。 |
| `heading-subtitle` | 两处及以上"标题后紧跟一句短副标题"，或"小标题 + 标题 + 副标题"三件套。 |
| `filler-copy` | 套话禁用词（一站式、赋能、无缝、seamless、elevate your……）。 |

已知局限：CSS 解析基于正则，不是完整解析器；不识别颜色关键字（如 `white`）；不计算对比度、点击区域、实际渲染字号，这些需要渲染页面的工具（例如 [dsh-design](https://github.com/Viger1/dsh-design) 的 `design_audit`）。

## 安装

```sh
dsh plugin --profile web add github:<owner>/dsh-zh-ui
```

本地开发时也可以用 patch 挂载构建产物：

```yaml
# extra.yml
- insert:
    - id: zh-ui
      name: '/absolute/path/to/dsh-zh-ui/lib/index.js'
```

```sh
dsh web --patch ./extra.yml
```

需要 Node 22 以上（`dsh` 本身的要求）。

## 配置

```yaml
- id: zh-ui
  name: dsh-zh-ui
  config:
    registerSkill: true          # 注册 zh-ui-design skill
    injectProjectSpec: true      # 注入 DESIGN.md / design.tokens.json
    specFiles: [DESIGN.md, design.tokens.json]
    maxSpecChars: 8000           # 每个文件最多注入的字符数
    rules: [hardcoded-color, off-scale-px, font-family-cjk, cjk-latin-spacing, cjk-punctuation, cjk-line-height, purple-gradient, emoji-icon, heading-subtitle, filler-copy]
    spacingBasePx: 4
    allowedPx: [0, 1, 2]
    minLineHeight: 1.5
    maxFiles: 200                # 单次 lint 最多扫描的文件数
```

## 使用的 DSH 接口

- `ctx.skills.register()`：注册运行时 skill（`@deepseek-ai/dsh-skill`）
- `ctx.on('system-prompt/assemble', …)`：在组装后追加一个 runtime context 条目，与 `@deepseek-ai/dsh-working-directory` 的做法相同
- `ctx.workingDirectory.get(session)`：取会话工作目录
- `ctx.tools.register(defineTool(…))`：注册工具（`@deepseek-ai/dsh-tools`）

lint 只读取工作目录内的文件，路径解析到工作目录之外会报错。

## 开发

```sh
npm install
npm run build
npm test
```

`demo/` 中有一份 A/B 对比示例，说明见 `demo/RESULTS.md`。

## 许可证

MIT

## 参考与致谢

skill 的写法参考了以下项目的思路，文字为重新撰写，未逐字复制：

- [anthropics/skills · frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)（Apache-2.0）：先写设计计划再自查是否落入默认套路、"只在一处用力"、生成式页面常见特征清单、截图自评。
- [Viger1/dsh-design](https://github.com/Viger1/dsh-design) 的 design-system skill（许可证未核实）：先固定色板和字号阶、一个强调色、间距网格、点击区域不等于字号。
- [SummerSec/SumSec-Skills · taste-skill](https://github.com/SummerSec/SumSec-Skills)（Apache-2.0）：按产品类型推断方向、避免米色+黄铜的"高级感"默认色板、阴影带底色调、圆角统一。
- [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines)：`:focus-visible`、不用 `transition: all`、`prefers-reduced-motion`、tabular-nums、移动端 44px 点击区域。
- [ChenYiming-aaa/dsh-ui-ux-pro-max](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max)（MIT，数据来自 nextlevelbuilder/ui-ux-pro-max-skill）：按优先级排列的检查项（对比度、触控、无 emoji 图标）。
