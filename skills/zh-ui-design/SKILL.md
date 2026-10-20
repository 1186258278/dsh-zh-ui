---
name: zh-ui-design
description: 中文界面设计规范：先定方向和唯一签名元素，再按页面类型（落地页、后台/仪表盘、文档、设置/表单、移动端、空状态/报错、博客）调整布局与文案；中文排版硬规则（中英文间距、全角标点、字体栈、行高、行长）；少文案、用界面代替说明；4 套带完整 token 的风格预设；交付前截图自查。Use when building, restyling or reviewing any Chinese-language UI.
---

# zh-ui-design：中文界面设计规范

目标：**像一家有设计团队的公司做出来的**——安静、可信、一眼能记住一个东西。项目里有 `DESIGN.md` / `design.tokens.json` / 现成组件库时以项目为准，本文只补空白。

## 0. 流程

1. **读题**：写三句话——这是什么产品、谁在用、这一页的主要任务。判断页面类型（§2）。
2. **定方向**：一句话方向 + 4–6 个命名色值 + 字体 + 一行 ASCII 布局草图。撞上 §1.2 的默认套路就换掉。
3. **定一个签名元素**（§1.1）。
4. **选 token**：用 §5 的预设或项目自己的 token，全部写进 `:root`。
5. **写代码**：排版守 §3，文案守 §4。
6. **自查**：§6 清单 + 截图亲眼看 + 运行 `zh_design_lint`。
7. **删减**：删一件可有可无的装饰、一句可有可无的话。

## 1. 方向

### 1.1 签名元素：只能一个

从品牌名或产品含义推出**恰好一个**视觉母题，在 Logo、主视觉、分隔线、状态组件、加载态、页脚里重复同一个形状；其余元素全部保持安静（中性色、无装饰）。唯一的强调色只用于"健康 / 可点击"两类状态。

例：「观澜」= 观看波澜。延迟曲线画成水面：首屏一条满宽、缓慢起伏的波线（SVG，`prefers-reduced-motion` 时静止），故障段隆起成浪峰并染成警示色，只标 `03:12 · 1,204 ms`；同一条线缩小后用作 Logo、分隔线、状态页组件和页脚；节点悬停时泛出涟漪。

判断：遮住产品名只看这个形状，能认出是谁家吗？不能，就还不是签名元素；出现第二个母题，删掉。签名元素的"音量"随页面类型变（§2）：落地页可以大，后台和表单里只留在 Logo、加载态和空状态。

找素材的方向：监控 → 真实曲线、可用率条；协作 → 多人编辑的光标、评论；支付 → 账单、到账时间线；开发者工具 → 一段真实命令和输出；消费品牌 → 产品实物照片。不要用发光光球、渐变色块、通用 3D 插画。

### 1.2 默认套路（题目没要求就不要用）

- 紫色 / 靛蓝到粉色渐变；米色纸底 + 衬线大标题 + 陶土色；近黑底 + 单一荧光绿。
- 首屏居中 + 三张等宽同阴影卡片、每张顶一个图标；Bento 网格铺满。
- 每个区块上方一行全大写英文小标签（"FEATURES"）；"01 / 02 / 03" 编号小标题。
- 按钮后加"→"；标题里只把一个词换颜色或加斜体。
- 每个区块都有进场淡入上滑；到处是玻璃拟态。

## 2. 按页面类型调整

| 类型 | 布局 | 文案预算 | 签名元素 | 要点 |
|---|---|---|---|---|
| 落地页 / 官网 | 首屏功能名标题 + 一行事实 + 两按钮，下接一张产品界面；区块只有标题 + 内容 | 首屏 1 标题 + 1 行事实；其余区块 0 句说明 | 大：首屏主视觉 | 定价写规格表；不写 FAQ 凑数；收尾一句事实 + 一个按钮 |
| 后台 / 仪表盘 | 侧栏 + 顶栏 + 内容；指标卡 → 图表 → 表格，信息密度优先 | 页面标题 = 对象名（"监控""订单"）；不写欢迎语 | 小：Logo、加载态、空状态 | 数字 tabular-nums 右对齐；状态用"色点 + 文字"，不只靠颜色；表格行高 40–48px；筛选和批量操作放表格上方 |
| 文档 / 帮助 | 左目录 + 正文（≤ 40 字/行）+ 右"本页目录" | 标题即任务（"配置告警"）；先给步骤和代码，再解释 | 很小：Logo、代码块角标 | 代码块可复制；提示框只分"注意 / 警告"两级；每页底部"上一篇 / 下一篇" |
| 设置 / 表单 | 单列，标签在上，分组用小标题 + 细线；危险操作单独放底部 | 标签 2–6 字；说明只写"会发生什么"（"关闭后不再发送短信"） | 无 | 标签始终可见（不用 placeholder 当标签）；错误就近显示，说明原因 + 怎么改；保存按钮固定在可见处；必填少时标"选填"而不是标星 |
| 移动端 App / H5 | 单列；底部 Tab ≤ 5；主操作在拇指区 | 导航栏标题 ≤ 8 字 | 小：启动页、下拉刷新、空状态 | 点击区 ≥ 44px；正文 ≥ 15px；考虑安全区 `env(safe-area-inset-*)`；列表优先于卡片 |
| 空状态 / 报错 / 404 | 居中一块：签名元素小图 + 一句事实 + 一个主操作 | ≤ 1 句 | 中：这里是它露面的好地方 | 说清发生了什么和下一步（"还没有监控。新建监控"）；报错给错误码和重试；不卖萌、不道歉三遍 |
| 博客 / 内容 | 单栏正文 34em；标题、作者、日期一行；图文交替 | 不限，但删掉开场白和总结套话 | 小：文章头图或分隔符 | 正文 17–18px、行高 1.8；可用衬线（思源宋体）；引用和代码有明确样式 |

## 3. 中文排版规则（必须遵守）

| 项目 | 规则 |
|---|---|
| 中英文间距 | 中文与英文、数字之间加半角空格：`支持 API 调用`、`每月 199 元`。全角标点前后不加空格；数字与 `%`、`°` 之间不加。 |
| 标点 | 中文句子用全角 `，。：；！？“”`；英文句子内部保留半角。 |
| 字体栈 | 西文字体在前、中文在后、`sans-serif` 收尾：`"Geist", "PingFang SC", "HarmonyOS Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`。中文用系统字体，不整套加载中文 Web 字体；特殊中文字体只做标题子集。 |
| 数字 | 选一款有性格的西文无衬线负责数字和英文（Geist、Inter Tight、Manrope、IBM Plex Sans）；价格、数据、表格用 `font-variant-numeric: tabular-nums`。 |
| 衬线 | 思源宋体 / 霞鹜文楷只用于内容、出版、文化类，不为"显得高级"而用。 |
| 字号阶 | 6 级左右（≤ 8），如 12 / 14 / 16 / 24 / 32 / 64。正文 16px，移动端 ≥ 15px。 |
| 字重 | 标题 600，正文 400；中文不用 800/900。 |
| 行高 | 正文 1.6–1.8；大标题 1.1–1.25；按钮、标签 1–1.2。 |
| 行长 | 正文每行 25–40 字：`max-width: 34em`。 |
| 字距 | 大标题可收紧 `-0.02em ~ -0.03em`；正文不加。 |
| 强调 | 中文不用斜体；用字重、颜色或灰阶。 |
| 断行 | 标题 `text-wrap: balance`，段落 `text-wrap: pretty`，`line-break: strict`，避免末行孤字。 |

## 4. 文案规则（硬性）

生成式界面最明显的痕迹在文案：每个区块"小标题 + 标题 + 副标题"，每张卡片一句复述标题的说明。成熟产品（Linear、Vercel、Raycast、飞书）是**界面和数字说话，文字只做标签**。

1. **标题只写标题。** 后面直接放内容。只有带着可核对事实的句子才留（"5 个监控永久免费"可以，"灵活的价格"不行）。全页最多一处"标题 + 副标题"。
2. **不要"小标题 + 标题 + 副标题"三件套**，默认三者只留标题。
3. **标题用功能名或名词**（"排班""告警路由"），不写口号，不套"X，让你 Y""不只是 X，更是 Y"。
4. **卡片不写描述段落**：标题 + 一块真实界面 / 数据 + 标签。
5. **标签优于句子，数字优于形容词**："30 秒""p95 186 ms"，不写"极速""稳定"。示例数据要像真的，但**不编用户数、好评、转化率**。
6. **按钮写动作**，2–6 字（"新建监控""保存""联系销售"）；不写"了解更多""点击这里"。
7. **提示与报错**：发生了什么 + 怎么办，一句话（"手机号格式不对，应为 11 位"）；不写"哎呀，出错了"。
8. **用界面代替说明**：与其三句话解释，不如一张表格、时间线或截图。
9. **删除测试**：逐句问"删掉它读者少知道什么？"——没少就删。
10. 禁用词：赋能、一站式、全方位、无缝、轻松搞定、极致体验、重新定义、开启……之旅、尽在掌握、智能化、革命性、为你打造；seamless、effortless、revolutionize、supercharge、unlock your、next-gen、elevate your、10x your。

`zh_design_lint` 会自动检查其中两条：`heading-subtitle`（多处"标题后紧跟短副标题"或三件套）和 `filler-copy`（禁用词），以及 §3 的间距、标点、字体栈、行高和字面色值。

## 5. 风格预设（选一套，整套写进 `:root`）

每套文字/底色组合已按 WCAG AA（≥ 4.5:1）校验。预设只是起点：签名元素和强调色的用法仍按 §1。

### A. 观测台 `observatory`（B 端 SaaS、监控、数据产品；浅色）
方向：冷静、精确。浅灰蓝页底 + 白色面 + 一块深海军蓝控制台 + 信号青。
```css
:root {
  --font-sans: "Geist", "PingFang SC", "HarmonyOS Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
  --font-mono: "Geist Mono", "SFMono-Regular", Menlo, "Noto Sans CJK SC", monospace;
  --paper: #f3f6f8; --surface: #ffffff; --line: #dbe3e9; --line-soft: #e8eef2;
  --ink: #0f2232; --ink-2: #3e5263; --ink-3: #536676;
  --deep: #0c2a3b; --deep-2: #12384d; --on-deep: #e6f0f4; --on-deep-2: #a9c1cc;
  --signal: #09715f; --signal-ink: #ffffff; --signal-glow: #5fe0c4; --signal-soft: #dcf2ec;
  --grid-line: rgba(15, 34, 50, 0.06);
  --shadow-1: 0 1px 2px rgba(15, 34, 50, 0.06), 0 8px 24px -12px rgba(15, 34, 50, 0.18);
  --shadow-2: 0 2px 4px rgba(12, 42, 59, 0.08), 0 32px 64px -24px rgba(12, 42, 59, 0.45);
  --r-s: 8px; --r-m: 12px; --r-l: 20px; --r-pill: 999px;
  --fs-xs: 12px; --fs-s: 14px; --fs-m: 16px; --fs-l: 20px; --fs-xl: 24px; --fs-2xl: 32px; --fs-3xl: 48px; --fs-4xl: 64px;
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px; --sp-9: 96px; --sp-10: 128px;
}
```
配方：导航 64px，主按钮 `--signal`；首屏居中功能名标题 + 一行事实 + 两按钮，下接满宽产品界面（侧栏 + 指标 + 数据表，一行异常态）；定价是规格表；收尾 `--deep` 横条一句事实 + 一个按钮。后台页直接用 `--paper` 底 + `--surface` 卡片 + `--deep` 侧栏。

### B. 夜班值守 `night-shift`（开发者工具、运维、安全；深色）
方向：深夜城市。午夜蓝（不是纯黑）+ 钠灯琥珀色强调，等宽字体只用于时间和数字。
```css
:root {
  --font-sans: "Geist", "PingFang SC", "HarmonyOS Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
  --font-mono: "Geist Mono", "SFMono-Regular", Menlo, "Noto Sans CJK SC", monospace;
  --night: #0b1324; --night-2: #101b31; --night-3: #16243f; --rule: #22324f; --rule-soft: #1a2944;
  --text: #e9eef7; --text-2: #b3bfd3; --text-3: #8592aa;
  --lamp: #ffb547; --lamp-ink: #1a1203; --lamp-soft: #3a2c14;
  --ok: #4fd1a5; --bad: #ff7a6b;
  --glow: radial-gradient(60% 50% at 75% 0%, rgba(255, 181, 71, 0.16), transparent 70%);
  --shadow: 0 24px 64px -24px rgba(0, 0, 0, 0.6);
  --ring-bad: rgba(255, 122, 107, 0.18); --ring-lamp: rgba(255, 181, 71, 0.18); --ring-ok: rgba(79, 209, 165, 0.18);
  --r: 12px; --r-pill: 999px;
  --fs-xs: 12px; --fs-s: 14px; --fs-m: 16px; --fs-l: 20px; --fs-xl: 24px; --fs-2xl: 32px; --fs-3xl: 48px; --fs-4xl: 72px;
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px; --sp-9: 96px; --sp-10: 128px;
}
```
配方：首屏左大标题右两按钮，顶部 `--glow` 一束琥珀光；主体是一张真实界面（如故障详情：编号、状态标签、琥珀计时器、逐条事件）；定价规格表推荐列 `--lamp-soft`；收尾无盒子，一条细线 + 短句 + 琥珀按钮。终端 / IDE 类工具界面直接用这套。

### C. 钴蓝海报 `cobalt-poster`（消费产品、活动、品牌页；浅色、高对比）
方向：瑞士海报。纯白 + 近黑文字 + 一块大面积钴蓝，粗体大字本身就是视觉。
```css
:root {
  --font-sans: "Inter Tight", "PingFang SC", "HarmonyOS Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
  --bg: #ffffff; --surface: #f2f4f7; --line: #d9dde3;
  --text: #121417; --text-2: #3d434b; --text-3: #5b626b;
  --cobalt: #1d3fd8; --on-cobalt: #ffffff; --on-cobalt-2: #c9d3ff; --cobalt-soft: #e7ecff;
  --pop: #ffd23f;
  --r: 0px; --r-pill: 999px;
  --fs-xs: 12px; --fs-s: 14px; --fs-m: 16px; --fs-l: 20px; --fs-xl: 28px; --fs-2xl: 40px; --fs-3xl: 64px; --fs-4xl: 96px;
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px; --sp-9: 96px; --sp-10: 128px;
}
```
配方：首屏标题 96px、字重 600、行高 1.05，占满 8/12 栏；右下角放一块钴蓝色块承载产品实物图或一个大数字；`--pop` 黄只用在一个小标记上。定价用三列纯文字排版、粗横线分隔；CTA 为整宽钴蓝色带，白字。直角，只有按钮全圆角。

### D. 稳重可信 `trust`（金融、政企、医疗、教育）
方向：可信、易读、高信息密度。白底、深石板蓝文字、沉稳的松绿强调，红色只表示错误。
```css
:root {
  --font-sans: "PingFang SC", "HarmonyOS Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", "Source Han Sans SC", sans-serif;
  --bg: #ffffff; --surface: #f5f7f9; --line: #d6dce3;
  --text: #16212e; --text-2: #3b4857; --text-3: #5a6776;
  --accent: #0d6e5a; --accent-ink: #ffffff; --accent-soft: #e2f1ec;
  --danger: #b42318;
  --shadow: 0 1px 2px rgba(22, 33, 46, 0.06), 0 4px 12px rgba(22, 33, 46, 0.06);
  --r: 6px; --r-pill: 999px;
  --fs-xs: 12px; --fs-s: 14px; --fs-m: 16px; --fs-l: 18px; --fs-xl: 24px; --fs-2xl: 28px; --fs-3xl: 36px; --fs-4xl: 44px;
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px; --sp-9: 96px; --sp-10: 128px;
}
```
配方：首屏左文案右"资质与数据"列表（牌照号、服务机构数、到账时效），不放装饰图；导航下方一条细的公告栏；定价/方案用表格优先；所有按钮最小 44px，正文 16px 以上，表单标签始终可见。

### 通用基线
```css
body { font-family: var(--font-sans); font-size: var(--fs-m); line-height: 1.7; -webkit-font-smoothing: antialiased; line-break: strict; overflow-wrap: anywhere; }
h1, h2, h3 { line-height: 1.25; font-weight: 600; text-wrap: balance; }
p { max-width: 34em; text-wrap: pretty; }
a:focus-visible, button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```

### 质感手法（任何预设都适用）

- 层次靠"面"不靠"框"：页底 / 白面 / 一块深色强调面；同屏最多一块深色面。
- 阴影带页面主色调、分两层；圆角只用三档；间距全在 4px 网格上。
- 数据当插画：内联 SVG 画曲线、状态条、时间线。
- 交互只做必要的：`transition` 只写具体属性，不用 `all`；`:focus-visible` 有清晰描边；尊重 `prefers-reduced-motion`。
- 图标用同一套线宽一致的 SVG，不用 emoji。

## 6. 交付前自查

- [ ] 写了方向一句话，避开了 §1.2 的默认套路。
- [ ] 只有一个签名元素，在多个位置重复；强调色只用于健康 / 可点击状态。
- [ ] 按 §2 的页面类型控制了布局、文案预算和签名元素音量。
- [ ] 颜色、字号、间距、圆角都来自 token，组件里没有字面色值。
- [ ] 对比度 ≥ 4.5:1；点击目标 ≥ 44px；不只靠颜色表达状态。
- [ ] 窄屏（390px）无横向滚动（宽表格放进可滚动容器）。
- [ ] 桌面和手机各截一张图**亲眼看**：第一眼落在哪？有没有孤字、拥挤、空得奇怪的区域？
- [ ] 文案过一遍 §4：没有副标题堆叠、没有描述复述、没有禁用词。
- [ ] 对改动文件运行 `zh_design_lint`，清零或逐条说明保留原因。
- [ ] 删掉了一件可有可无的装饰和一句可有可无的话。

回复用户时说明：页面类型、方向一句话、签名元素是什么、已知取舍。
