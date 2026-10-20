# 安装 dsh-zh-ui

dist 目录里有三种安装包，任选其一：

| 文件 | 用途 |
|---|---|
| `dist/dsh-zh-ui-0.2.0.tgz` | **推荐**。DSH Desktop「添加插件」或 `dsh plugin add` 直接安装 |
| `dist/dsh-zh-ui-0.2.0.zip` | 同样的内容解压成文件夹，用"本地目录"方式安装（会以 `link:` 记录，文件夹不能移动或删除） |
| `dist/skill/zh-ui-design/SKILL.md` | 只要设计规范、不要插件时，给 Claude Code / Codex / Cursor 等任何 agent 用 |

插件包含：`zh-ui-design` skill、`zh_design_lint` 工具、项目 `DESIGN.md` / `design.tokens.json` 注入。插件是本机可执行代码，只安装你信任的版本。

## 一、DSH Desktop（Windows）

1. 把 `dsh-zh-ui-0.2.0.tgz` 放到一个固定位置，例如 `C:\dsh-plugins\dsh-zh-ui-0.2.0.tgz`。
2. 打开 DSH Desktop →「设置 / 配置」→「插件」→「+ 添加插件」。
3. 在输入框填 tgz 的**绝对路径**：`C:\dsh-plugins\dsh-zh-ui-0.2.0.tgz`，确认安装。
4. 按提示**重启 Harness / Desktop**。
5. 验证：在插件列表能看到 `dsh-zh-ui`；新开会话，输入"用 zh_design_lint 检查 index.html"，agent 应能调用该工具；让它"按 zh-ui-design 规范做一个设置页"，应会加载这个 skill。

用文件夹安装：把 zip 解压到固定位置（如 `C:\dsh-plugins\dsh-zh-ui`），在「添加插件」里点文件夹按钮选择这个含 `package.json` 的目录，或手写 `link:C:\dsh-plugins\dsh-zh-ui`。

## 二、命令行

```sh
# 任意自定义 profile（第一次使用会自动初始化）
dsh plugin --profile web add /绝对路径/dsh-zh-ui-0.2.0.tgz
dsh plugin --profile web add /绝对路径/dsh-zh-ui          # 解压后的文件夹
dsh --profile web --dump-config | grep dsh-zh-ui           # 应看到 "# == dsh-zh-ui" 层
dsh plugin --profile web remove dsh-zh-ui                  # 卸载
```

Windows PowerShell 写法相同，路径用 `C:\...`，路径必须是绝对路径（相对路径会被拒绝）。

`desktop` profile 只能由 Desktop 自己管理：从普通终端运行 `dsh plugin --profile desktop ...` 会报 `profile "desktop" is managed exclusively by the Electron application`。请用上面的 Desktop 界面安装，或在 Desktop 托盘打开的终端里运行 `dsh plugin add <tgz 绝对路径>`（作用于当前激活 profile）。

## 三、只用 skill（不装插件）

把 `dist/skill/zh-ui-design/` 整个文件夹复制到对应 agent 的 skills 目录，例如 Claude Code 的 `~/.claude/skills/zh-ui-design/SKILL.md` 或项目内 `.claude/skills/`；其他 agent 可直接把 SKILL.md 内容放进项目规则文件。这个版本不引用任何插件工具。

## 配置（可选）

在 profile 的 `cordis.patch.yml` 里覆盖，详见 README.zh.md：`registerSkill`、`injectProjectSpec`、`specFiles`、`rules`、`spacingBasePx`、`allowedPx`、`minLineHeight`、`maxFiles`。

## 校验和

```
e0a707ff0eefc48869fef251ae8ffd6211fb6f9439ec3fa32d475dbdb39d6903  dsh-zh-ui-0.2.0.tgz
b54be5532e8ac628c9a43e322355f8ee524b2e57797ce932e88fb13a28af81bb  dsh-zh-ui-0.2.0.zip
```
