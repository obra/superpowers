# Superpowers 发布说明

## v5.0.5 (2026-03-17)

### 错误修复

* **Brainstorm 服务器 ESM 修复** — 将 `server.js` 重命名为 `server.cjs`，使得 Brainstorming 服务器能在 Node.js 22+ 上正确启动，在这些版本中，根目录的 `package.json` `"type": "module"` 会导致 `require()` 失败。(PR #784 by @sarbojitrana，修复 #774, #780, #783)
* **Brainstorm 在 Windows 上的所有者 PID** — 在 Windows/MSYS2 上跳过 PID 生命周期监控，因为 Node.js 无法看到其 PID 命名空间，从而防止服务器在 60 秒后自行终止。(#770，文档来自 PR #768 by @lucasyhzlu-debug)
* **stop-server.sh 可靠性提升** — 在报告成功之前，验证服务器进程确实已终止。采用 SIGTERM + 等待 2 秒 + SIGKILL 备选方案。(#723)

### 已更改

* **执行移交** — 在计划编写后，恢复用户在子代理驱动执行和内联执行之间的选择。推荐使用子代理驱动，但不再是强制性的。

## v5.0.4 (2026-03-16)

### 审查循环优化

通过消除不必要的审查轮次和收紧审查者关注点，显著减少了令牌使用量，并加速了规范和计划的审查。

* **单次完整计划审查** — 计划审查者现在一次性审查完整计划，而不是分块审查。移除了所有与分块相关的概念（`## Chunk N:` 标题、1000 行分块限制、每块调度）。
* **提高了阻塞问题的门槛** — 规范和计划审查者的提示现在都包含一个“校准”部分：仅标记那些会在实施过程中导致实际问题的项目。轻微的措辞、风格偏好和格式上的吹毛求疵不应阻止批准。
* **减少了最大审查迭代次数** — 规范和计划审查循环都从 5 次减少到 3 次。如果审查者校准正确，3 轮就足够了。
* **精简了审查者清单** — 规范审查者从 7 个类别精简到 5 个；计划审查者从 7 个精简到 4 个。移除了以格式为重点的检查（任务语法、分块大小），转而关注实质内容（可构建性、规范一致性）。

### OpenCode

* **单行插件安装** — OpenCode 插件现在通过一个 `config` 钩子自动注册技能目录。不再需要符号链接或 `skills.paths` 配置。安装只需在 `opencode.json` 中添加一行。(PR #753)
* **添加了 `package.json`**，以便 OpenCode 可以从 git 安装 superpowers 作为 npm 包。

### 错误修复

* **验证服务器确实已停止** — `stop-server.sh` 现在会在报告成功之前确认进程已终止。采用 SIGTERM + 等待 2 秒 + SIGKILL 备选方案。如果进程存活，则报告失败。(PR #751)
* **通用代理语言** — brainstorm 伴侣等待页面现在说“代理”而不是“Claude”。

## v5.0.3 (2026-03-15)

### Cursor 支持

* **Cursor 钩子** — 添加了 `hooks/hooks-cursor.json`，采用 Cursor 的驼峰命名格式（`sessionStart`，`version: 1`），并更新了 `.cursor-plugin/plugin.json` 以引用它。修复了 `session-start` 中的平台检测，优先检查 `CURSOR_PLUGIN_ROOT`（Cursor 也可能设置 `CLAUDE_PLUGIN_ROOT`）。(基于 PR #709)

### 错误修复

* **停止在 `--resume` 时触发 SessionStart 钩子** — 启动钩子会在恢复的会话中重新注入上下文，而这些会话的对话历史中已经包含了上下文。该钩子现在仅在 `startup`、`clear` 和 `compact` 时触发。
* **Bash 5.3+ 钩子挂起** — 在 `hooks/session-start` 中用 `printf` 替换了 heredoc（`cat <<EOF`）。修复了在 macOS 上使用 Homebrew bash 5.3+ 时，由于 bash 在处理 heredoc 中大变量扩展时的回归问题导致的无限期挂起。(#572, #571)
* **POSIX 安全的钩子脚本** — 在 `hooks/session-start` 中用 `$0` 替换了 `${BASH_SOURCE[0]:-$0}`。修复了在 Ubuntu/Debian 上（其中 `/bin/sh` 是 dash）出现的“Bad substitution”错误。(#553)
* **可移植的 shebang** — 在所有 shell 脚本中用 `#!/usr/bin/env bash` 替换了 `#!/bin/bash`。修复了在 NixOS、FreeBSD 和 macOS（使用 Homebrew bash）上，因 `/bin/bash` 过时或缺失而导致的执行问题。(#700)
* **Brainstorm 服务器在 Windows 上** — 自动检测 Windows/Git Bash（`OSTYPE=msys*`，`MSYSTEM`）并切换到前台模式，修复了因 `nohup`/`disown` 进程回收导致的服务器静默失败问题。(#737)
* **Codex 文档修复** — 在 Codex 文档中用 `multi_agent` 替换了已弃用的 `collab` 标志。(PR #749)

## v5.0.2 (2026-03-11)

### 零依赖头脑风暴服务器

**移除所有打包的 node\_modules — server.js 现已完全自包含**

* 用零依赖的 Node.js 服务器替换了 Express/Chokidar/WebSocket 依赖项，使用内置的 `http`、`fs` 和 `crypto` 模块
* 移除了约 1,200 行打包的 `node_modules/`、`package.json` 和 `package-lock.json`
* 自定义 WebSocket 协议实现（RFC 6455 帧处理、ping/pong、正确的关闭握手）
* 原生的 `fs.watch()` 文件监视替换了 Chokidar
* 完整的测试套件：HTTP 服务、WebSocket 协议、文件监视和集成测试

### 头脑风暴服务器可靠性

* **空闲 30 分钟后自动退出** — 当没有客户端连接时，服务器关闭，防止产生孤儿进程
* **所有者进程追踪** — 服务器监控父进程的 PID，当所属会话终止时退出
* **活跃性检查** — 技能在重用现有实例前验证服务器是否响应
* **编码修复** — 在提供的 HTML 页面上使用正确的 `<meta charset="utf-8">`

### 子代理上下文隔离

* 所有委派技能（头脑风暴、并行代理调度、请求代码审查、子代理驱动开发、编写计划）现在都包含上下文隔离原则
* 子代理仅接收它们所需的上下文，防止上下文窗口污染

## v5.0.1 (2026-03-10)

### Agentskills 合规性

**Brainstorm-server 移至技能目录**

* 根据 [agentskills.io](https://agentskills.io) 规范，将 `lib/brainstorm-server/` 移至 `skills/brainstorming/scripts/`
* 所有 `${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/` 引用替换为相对的 `scripts/` 路径
* 技能现在完全跨平台可移植 — 无需平台特定的环境变量来定位脚本
* 删除了 `lib/` 目录（这是最后剩余的内容）

### 新功能

**Gemini CLI 扩展**

* 通过仓库根目录的 `gemini-extension.json` 和 `GEMINI.md` 实现原生的 Gemini CLI 扩展支持
* `GEMINI.md` 在会话开始时 @imports `using-superpowers` 技能和工具映射表
* Gemini CLI 工具映射参考（`skills/using-superpowers/references/gemini-tools.md`）— 将 Claude Code 工具名称（Read、Write、Edit、Bash 等）翻译为 Gemini CLI 等效项（read\_file、write\_file、replace 等）
* 记录了 Gemini CLI 的限制：无子代理支持，技能回退到 `executing-plans`
* 扩展根目录位于仓库根目录以实现跨平台兼容性（避免 Windows 符号链接问题）
* 安装说明已添加到 README

### 改进

**多平台头脑风暴服务器启动**

* visual-companion.md 中的每平台启动说明：Claude Code（默认模式）、Codex（通过 `CODEX_CI` 自动前台运行）、Gemini CLI（带有 `--foreground` 的 `is_background`）以及其他环境的回退方案
* 服务器现在将启动 JSON 写入 `$SCREEN_DIR/.server-info`，以便代理即使在后台执行隐藏了 stdout 时也能找到 URL 和端口

**头脑风暴服务器依赖项打包**

* `node_modules` 已打包到仓库中，这样头脑风暴服务器在全新插件安装后无需运行时执行 `npm` 即可立即工作
* 从打包的依赖项中移除了 `fsevents`（仅限 macOS 的原生二进制文件；chokidar 在缺少它时会优雅地回退）
* 如果缺少 `node_modules`，则通过 `npm install` 进行回退自动安装

**OpenCode 工具映射修复**

* `TodoWrite` → `todowrite`（之前错误地映射到 `update_plan`）；已根据 OpenCode 源代码验证

### 错误修复

**Windows/Linux：单引号破坏 SessionStart 钩子** (#577, #529, #644, PR #585)

* hooks.json 中 `${CLAUDE_PLUGIN_ROOT}` 周围的单引号在 Windows 上失败（cmd.exe 不将单引号识别为路径分隔符）以及在 Linux 上失败（单引号阻止变量扩展）
* 修复：将单引号替换为转义的双引号 — 在 macOS bash、Windows cmd.exe、Windows Git Bash 和 Linux 上均可工作，无论路径中是否包含空格
* 已在 Windows 11（NT 10.0.26200.0）上使用 Claude Code 2.1.72 和 Git for Windows 验证

**头脑风暴规范审查循环被跳过** (#677)

* 规范审查循环（调度 spec-document-reviewer 子代理，迭代直到批准）存在于散文“设计之后”部分，但在检查清单和流程图中缺失
* 由于代理遵循图表和检查清单比散文更可靠，规范审查步骤被完全跳过
* 已将步骤 7（规范审查循环）添加到检查清单，并将相应的节点添加到点图
* 使用 `claude --plugin-dir` 和 `claude-session-driver` 测试：worker 现在能正确调度审查者

**Cursor 安装命令** (PR #676)

* 修复了 README 中的 Cursor 安装命令：`/plugin-add` → `/add-plugin`（通过 Cursor 2.5 发布公告确认）

**头脑风暴中的用户审查关口** (#565)

* 在规范完成和编写计划交接之间添加了明确的用户审查步骤
* 用户必须在实施计划开始前批准规范
* 检查清单、流程图和散文已更新，包含新的关口

**会话启动钩子每个平台仅发出一次上下文**

* 钩子现在检测它是在 Claude Code 还是其他平台中运行
* 为 Claude Code 发出 `hookSpecificOutput`，为其他平台发出 `additional_context` — 防止双重上下文注入

**令牌分析脚本中的代码风格修复**

* `except:` → `except Exception:`，位于 `tests/claude-code/analyze-token-usage.py`

### 维护

**移除死代码**

* 删除了 `lib/skills-core.js` 及其测试（`tests/opencode/test-skills-core.js`）— 自 2026 年 2 月起未使用
* 从 `tests/opencode/test-plugin-loading.sh` 中移除了 skills-core 存在性检查

### 社区

* @karuturi — Claude Code 官方市场安装说明（PR #610）
* @mvanhorn — 会话启动钩子双重发出修复，OpenCode 工具映射修复
* @daniel-graham — 裸异常捕获的代码风格修复
* PR #585 作者 — Windows/Linux 钩子引号修复

***

## v5.0.0 (2026-03-09)

### 破坏性变更

**规范和计划目录结构调整**

* 规范（头脑风暴输出）现在保存到 `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
* 计划（编写计划输出）现在保存到 `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
* 用户对规范/计划位置的偏好会覆盖这些默认值
* 所有内部技能引用、测试文件和示例路径都已更新以匹配新结构
* 迁移：如果需要，将现有文件从 `docs/plans/` 移动到新位置

**在支持的子代理平台上强制使用子代理驱动开发**

编写计划不再提供在子代理驱动和执行计划之间的选择。在具有子代理支持的平台（Claude Code、Codex）上，子代理驱动开发是必需的。执行计划保留给没有子代理能力的平台，并且现在会告知用户 Superpowers 在支持子代理的平台上效果更好。

**执行计划不再分批执行**

移除了“执行 3 个任务后停止审查”的模式。计划现在连续执行，仅在遇到阻塞时停止。

**斜杠命令已弃用**

`/brainstorm`、`/write-plan` 和 `/execute-plan` 现在显示弃用通知，引导用户使用相应的技能。命令将在下一个主要版本中移除。

### 新功能

**可视化头脑风暴伴侣**

头脑风暴会话的可选浏览器伴侣。当主题受益于可视化时，头脑风暴技能会提供在浏览器窗口中显示与终端对话并行的线框图、图表、比较和其他内容。

* `lib/brainstorm-server/` — 包含浏览器助手库、会话管理脚本和深色/浅色主题框架模板（“Superpowers Brainstorming” 带 GitHub 链接）的 WebSocket 服务器
* `skills/brainstorming/visual-companion.md` — 服务器工作流程、屏幕创作和反馈收集的渐进式指南
* 头脑风暴技能在其流程中添加了一个可视化伴侣决策点：在探索项目上下文后，技能评估即将到来的问题是否涉及可视化内容，并在其自己的消息中提供伴侣
* 按问题决策：即使在接受后，每个问题都会评估浏览器还是终端更合适
* `tests/brainstorm-server/` 中的集成测试

**文档审查系统**

使用子代理调度的规范和计划文档的自动化审查循环：

* `skills/brainstorming/spec-document-reviewer-prompt.md` — 审查者检查完整性、一致性、架构和 YAGNI
* `skills/writing-plans/plan-document-reviewer-prompt.md` — 审查者检查规范对齐、任务分解、文件结构和文件大小
* 头脑风暴在编写设计文档后调度规范审查者
* 编写计划在每个部分后包含基于块的计划审查循环
* 审查循环重复直到批准或在 5 次迭代后升级
* `tests/claude-code/test-document-review-system.sh` 中的端到端测试
* `docs/superpowers/` 中的设计规范和实施计划

**贯穿技能管道的架构指导**

设计隔离和文件大小感知指导已添加到头脑风暴、编写计划和子代理驱动开发中：

* **头脑风暴** — 新章节：“为隔离和清晰度而设计”（清晰的边界、定义良好的接口、独立可测试的单元）和“在现有代码库中工作”（遵循现有模式，仅进行有针对性的改进）
* **编写计划** — 新的“文件结构”部分：在定义任务前规划文件和职责。新的“范围检查”后备机制：捕获应在头脑风暴期间分解的多子系统规范
* **SDD 实施者** — 新的“代码组织”部分（遵循计划的文件结构，报告对文件增长的担忧）和“当您力不从心时”的升级指导
* **SDD 代码质量审查者** — 现在检查架构、单元分解、计划符合性和文件增长
* **规范/计划审查者** — 架构和文件大小已添加到审查标准中
* **范围评估** — 头脑风暴现在评估项目是否对单个规范来说太大。多子系统请求会及早标记，并分解为子项目，每个子项目都有自己的规范 → 计划 → 实施周期

**子代理驱动开发的改进**

* **模型选择** — 按任务类型选择模型能力的指导：廉价模型用于机械实施，标准模型用于集成，能力强模型用于架构和审查
* **实施者状态协议** — 子代理现在报告 DONE、DONE\_WITH\_CONCERNS、BLOCKED 或 NEEDS\_CONTEXT。控制器适当地处理每个状态：用更多上下文重新调度、升级模型能力、分解任务或升级给人类

### 改进

**指令优先级层次结构**

向 using-superpowers 添加了明确的优先级排序：

1. 用户的明确指令（CLAUDE.md、AGENTS.md、直接请求）— 最高优先级
2. Superpowers 技能 — 覆盖默认系统行为
3. 默认系统提示 — 最低优先级

如果 CLAUDE.md 或 AGENTS.md 说“不要使用 TDD”而一个技能说“始终使用 TDD”，那么用户的指令胜出。

**SUBAGENT-STOP 关口**

向 using-superpowers 添加了 `<SUBAGENT-STOP>` 块。为特定任务调度的子代理现在跳过该技能，而不是激活 1% 规则并调用完整的技能工作流。

**多平台改进**

* Codex 工具映射移至渐进式参考文件（`references/codex-tools.md`）
* 添加了平台适配指针，以便非 Claude-Code 平台可以找到工具等效项
* 计划头部现在针对“代理工作者”而不是特定的“Claude”
* 协作功能要求在 `docs/README.codex.md` 中记录

**编写计划模板更新**

* 计划步骤现在使用复选框语法（`- [ ] **Step N:**`）进行进度跟踪
* 计划头部引用子代理驱动开发和执行计划，并具有平台感知的路由

***

## v4.3.1 (2026-02-21)

### 新增

**Cursor 支持**

Superpowers 现在可与 Cursor 的插件系统协同工作。包含一个 `.cursor-plugin/plugin.json` 清单，以及 README 中的 Cursor 特定安装说明。SessionStart 钩子的输出现在包含一个 `additional_context` 字段，与现有的 `hookSpecificOutput.additionalContext` 并列，以实现 Cursor 钩子的兼容性。

### 已修复

**Windows：恢复了多语言包装器以确保钩子可靠执行 (#518, #504, #491, #487, #466, #440)**

Claude Code 在 Windows 上的 `.sh` 自动检测功能，会在钩子命令前添加 `bash`，从而破坏执行。修复方法如下：

* 将 `session-start.sh` 重命名为 `session-start`（无扩展名），这样自动检测就不会干扰
* 恢复了 `run-hook.cmd` 多语言包装器，包含多位置 bash 发现（标准的 Git for Windows 路径，然后是 PATH 回退）
* 如果未找到 bash，则静默退出，而不是报错
* 在 Unix 上，包装器通过 `exec bash` 直接运行脚本
* 使用符合 POSIX 标准的 `dirname "$0"` 路径解析（适用于 dash/sh，不仅仅是 bash）

这修复了 Windows 上因路径包含空格、缺少 WSL、MSYS 上 `set -euo pipefail` 的脆弱性以及反斜杠处理错误导致的 SessionStart 失败。

## v4.3.0 (2026-02-12)

此修复应能显著提高 superpowers 技能合规性，并应降低 Claude 意外进入其原生计划模式的可能性。

### 已更改

**头脑风暴技能现在强制执行其工作流程，而非仅描述它**

模型曾跳过设计阶段，直接跳转到实现技能（如前端设计），或将整个头脑风暴过程压缩到单个文本块中。该技能现在使用硬性关卡、强制检查清单和 graphviz 流程来确保合规：

* `<HARD-GATE>`：在展示设计并获得用户批准之前，不得使用实现技能、编写代码或进行脚手架搭建
* 明确的检查清单（6项），必须创建为任务并按顺序完成
* 包含 `writing-plans` 作为唯一有效终止状态的 Graphviz 流程图
* 对“这太简单了，不需要设计”这种反模式提出警告——这正是模型用来跳过流程的合理化说辞
* 设计部分的大小基于部分复杂性，而非项目复杂性

**使用-superpowers 工作流图拦截 EnterPlanMode**

在技能流程图中添加了 `EnterPlanMode` 拦截。当模型即将进入 Claude 的原生计划模式时，它会检查是否已进行头脑风暴，并改为路由到头脑风暴技能。计划模式永远不会被进入。

### 已修复

**SessionStart 钩子现在同步运行**

将 hooks.json 中的 `async: true` 更改为 `async: false`。异步运行时，钩子可能在模型的第一个回合之前无法完成，这意味着使用-superpowers 指令在第一条消息时未处于上下文中。

## v4.2.0 (2026-02-05)

### 破坏性变更

**Codex：用原生技能发现替换了引导 CLI**

移除了 `superpowers-codex` 引导 CLI、Windows `.cmd` 包装器以及相关的引导内容文件。Codex 现在通过 `~/.agents/skills/superpowers/` 符号链接使用原生技能发现，因此不再需要旧的 `use_skill`/`find_skills` CLI 工具。

现在安装只需克隆 + 创建符号链接（在 INSTALL.md 中有记录）。不需要 Node.js 依赖。旧的 `~/.codex/skills/` 路径已被弃用。

### 修复

**Windows：修复了 Claude Code 2.1.x 的钩子执行 (#331)**

Claude Code 2.1.x 更改了 Windows 上钩子的执行方式：现在它会自动检测命令中的 `.sh` 文件，并在前面添加 `bash`。这破坏了多语言包装器模式，因为 `bash "run-hook.cmd" session-start.sh` 试图将 `.cmd` 文件作为 bash 脚本执行。

修复方法：hooks.json 现在直接调用 session-start.sh。Claude Code 2.1.x 会自动处理 bash 调用。同时添加了 .gitattributes 来为 shell 脚本强制执行 LF 行尾（修复了 Windows 检出时的 CRLF 问题）。

**Windows：SessionStart 钩子异步运行以防止终端冻结 (#404, #413, #414, #419)**

同步的 SessionStart 钩子在 Windows 上会阻止 TUI 进入原始模式，冻结所有键盘输入。异步运行钩子可以防止冻结，同时仍能注入 superpowers 上下文。

**Windows：修复了 O(n^2) 的 `escape_for_json` 性能**

使用 `${input:$i:1}` 的逐字符循环，由于子字符串复制开销，在 bash 中是 O(n^2) 复杂度。在 Windows Git Bash 上，这需要 60 多秒。已替换为 bash 参数替换（`${s//old/new}`），它将每个模式作为一次 C 语言级别的遍历运行——在 macOS 上快 7 倍，在 Windows 上显著加快。

**Codex：修复了 Windows/PowerShell 调用 (#285, #243)**

* Windows 不遵循 shebang，因此直接调用无扩展名的 `superpowers-codex` 脚本会触发“打开方式”对话框。所有调用现在都加上了 `node` 前缀。
* 修复了 Windows 上的 `~/` 路径扩展问题——PowerShell 在将 `~` 作为参数传递给 `node` 时不会扩展它。已更改为 `$HOME`，它在 bash 和 PowerShell 中都能正确扩展。

**Codex：修复了安装程序中的路径解析**

使用 `fileURLToPath()` 替代手动 URL 路径名解析，以在所有平台上正确处理包含空格和特殊字符的路径。

**Codex：修复了 writing-skills 中过时的技能路径**

将 `~/.codex/skills/` 引用（已弃用）更新为 `~/.agents/skills/`，以支持原生发现。

### 改进

**在实现之前现在需要工作树隔离**

为 `subagent-driven-development` 和 `executing-plans` 添加了 `using-git-worktrees` 作为必需技能。实现工作流现在明确要求在开始工作之前设置一个隔离的工作树，防止直接在 main 分支上意外工作。

**Main 分支保护放宽为需要明确同意**

技能不再完全禁止在 main 分支上工作，而是允许在获得用户明确同意后进行。这样更灵活，同时仍能确保用户了解其影响。

**简化了安装验证**

从验证步骤中移除了 `/help` 命令检查和特定的斜杠命令列表。技能主要通过描述你想要做的事情来调用，而不是通过运行特定命令。

**Codex：在引导程序中澄清了子代理工具映射**

改进了关于 Codex 工具如何映射到 Claude Code 等效工具以实现子代理工作流的文档。

### 测试

* 为 subagent-driven-development 添加了工作树要求测试
* 添加了 main 分支危险警告测试
* 修复了技能识别测试断言中的大小写敏感性

***

## v4.1.1 (2026-01-23)

### 修复

**OpenCode：根据官方文档标准化为 `plugins/` 目录 (#343)**

OpenCode 的官方文档使用 `~/.config/opencode/plugins/`（复数形式）。我们的文档之前使用 `plugin/`（单数形式）。虽然 OpenCode 接受两种形式，但我们已经标准化为官方约定，以避免混淆。

更改：

* 在仓库结构中，将 `.opencode/plugin/` 重命名为 `.opencode/plugins/`
* 更新了所有平台上的所有安装文档（INSTALL.md、README.opencode.md）
* 更新了测试脚本以匹配

**OpenCode：修复了符号链接说明 (#339, #342)**

* 在 `ln -s` 之前添加了明确的 `rm`（修复重新安装时的“文件已存在”错误）
* 添加了 INSTALL.md 中缺失的技能符号链接步骤
* 更新了已弃用的 `use_skill`/`find_skills` 引用，改为原生的 `skill` 工具引用

***

## v4.1.0 (2026-01-23)

### 破坏性变更

**OpenCode：切换到原生技能系统**

用于 OpenCode 的 Superpowers 现在使用 OpenCode 的原生 `skill` 工具，而不是自定义的 `use_skill`/`find_skills` 工具。这是一个更简洁的集成，可与 OpenCode 内置的技能发现协同工作。

**需要迁移：** 技能必须符号链接到 `~/.config/opencode/skills/superpowers/`（请参阅更新的安装文档）。

### 修复

**OpenCode：修复了会话开始时的代理重置问题 (#226)**

之前使用 `session.prompt({ noReply: true })` 的引导注入方法导致 OpenCode 在第一条消息时将所选代理重置为“build”。现在使用 `experimental.chat.system.transform` 钩子，它直接修改系统提示，没有副作用。

**OpenCode：修复了 Windows 安装问题 (#232)**

* 移除了对 `skills-core.js` 的依赖（消除了文件被复制而非符号链接时出现的损坏的相对导入问题）
* 为 cmd.exe、PowerShell 和 Git Bash 添加了全面的 Windows 安装文档
* 记录了每个平台正确的符号链接与连接点用法

**Claude Code：修复了 Claude Code 2.1.x 在 Windows 上的钩子执行问题**

Claude Code 2.1.x 更改了 Windows 上钩子的执行方式：现在它会自动检测命令中的 `.sh` 文件，并在前面添加 `bash `。这破坏了多语言包装器模式，因为 `bash "run-hook.cmd" session-start.sh` 试图将 .cmd 文件作为 bash 脚本执行。

修复方法：hooks.json 现在直接调用 session-start.sh。Claude Code 2.1.x 会自动处理 bash 调用。同时添加了 .gitattributes 来为 shell 脚本强制执行 LF 行尾（修复了 Windows 检出时的 CRLF 问题）。

***

## v4.0.3 (2025-12-26)

### 改进

**增强了使用-superpowers 技能以应对明确的技能请求**

解决了一个故障模式，即使用户明确按名称请求技能（例如，“请使用 subagent-driven-development”），Claude 也会跳过调用该技能。Claude 会认为“我知道那是什么意思”，然后直接开始工作，而不是加载技能。

更改：

* 更新了“规则”，将“检查技能”改为“调用相关或请求的技能”——强调主动调用而非被动检查
* 添加了“在任何响应或行动之前”——原始措辞只提到了“响应”，但 Claude 有时会在不先响应的情况下采取行动
* 添加了保证：调用错误的技能也没关系——减少犹豫
* 添加了新的危险信号：“我知道那是什么意思”→ 知道概念 ≠ 使用技能

**添加了明确的技能请求测试**

在 `tests/explicit-skill-requests/` 中添加了新的测试套件，用于验证当用户按名称请求技能时，Claude 是否正确调用技能。包括单回合和多回合测试场景。

## v4.0.2 (2025-12-23)

### 修复

**斜杠命令现在仅供用户使用**

为所有三个斜杠命令（`/brainstorm`、`/execute-plan`、`/write-plan`）添加了 `disable-model-invocation: true`。Claude 不能再通过 Skill 工具调用这些命令——它们仅限于手动用户调用。

底层技能（`superpowers:brainstorming`、`superpowers:executing-plans`、`superpowers:writing-plans`）仍然可供 Claude 自主调用。此更改防止了当 Claude 调用一个只是重定向到技能的指令时产生的混淆。

## v4.0.1 (2025-12-23)

### 修复

**阐明了如何在 Claude Code 中访问技能**

修复了一个令人困惑的模式：Claude 通过 Skill 工具调用技能后，会尝试单独读取技能文件。`using-superpowers` 技能现在明确指出，Skill 工具会直接加载技能内容——无需读取文件。

* 向 `using-superpowers` 添加了“如何访问技能”部分
* 在说明中将“读取技能”改为“调用技能”
* 更新了斜杠命令以使用完全限定的技能名称（例如，`superpowers:brainstorming`）

**向 receiving-code-review 添加了 GitHub 线程回复指南**（感谢 @ralphbean）

添加了关于在原始线程中回复内联评论，而不是作为顶级 PR 评论的说明。

**向 writing-skills 添加了自动化优于文档的指南**（感谢 @EthanJStark）

添加了指南：机械性约束应自动化，而非文档化——将技能留给判断性决策。

## v4.0.0 (2025-12-17)

### 新功能

**subagent-driven-development 中的两阶段代码审查**

子代理工作流现在在每个任务后使用两个独立的审查阶段：

1. **规范符合性审查** - 持怀疑态度的审查者验证实现是否完全符合规范。捕捉缺失的需求**和**过度构建。不信任实施者的报告——阅读实际代码。
2. **代码质量审查** - 仅在规范符合性通过后运行。审查代码整洁度、测试覆盖率、可维护性。

这捕捉了代码编写良好但与请求不符的常见失败模式。评审是循环而非单次操作：若评审者发现问题，实施者修复后，评审者会再次检查。

其他子代理工作流改进：

* 控制器向工作者提供完整任务文本（而非文件引用）
* 工作者可在工作开始前及工作中提出澄清问题
* 报告完成前进行自我评审检查清单
* 计划仅在开始时读取一次，并提取到TodoWrite

`skills/subagent-driven-development/`中的新提示模板：

* `implementer-prompt.md` - 包含自我评审检查清单，鼓励提问
* `spec-reviewer-prompt.md` - 针对需求进行怀疑性验证
* `code-quality-reviewer-prompt.md` - 标准代码评审

**调试技术与工具整合**

`systematic-debugging`现已捆绑支持技术和工具：

* `root-cause-tracing.md` - 通过调用栈反向追踪错误
* `defense-in-depth.md` - 在多个层级添加验证
* `condition-based-waiting.md` - 用条件轮询替代任意超时
* `find-polluter.sh` - 二分查找脚本定位产生污染的测试
* `condition-based-waiting-example.ts` - 来自实际调试会话的完整实现

**测试反模式参考**

`test-driven-development`现包含`testing-anti-patterns.md`，涵盖：

* 测试模拟行为而非真实行为
* 向生产类添加仅用于测试的方法
* 在不理解依赖关系的情况下进行模拟
* 隐藏结构假设的不完整模拟

**技能测试基础设施**

用于验证技能行为的三个新测试框架：

`tests/skill-triggering/` - 验证技能能否通过朴素提示触发而无需显式命名。测试6项技能以确保仅凭描述即可触发。

`tests/claude-code/` - 使用`claude -p`进行无头测试的集成测试。通过会话转录（JSONL）分析验证技能使用情况。包含用于成本跟踪的`analyze-token-usage.py`。

`tests/subagent-driven-dev/` - 包含两个完整测试项目的端到端工作流验证：

* `go-fractals/` - 包含Sierpinski/Mandelbrot的CLI工具（10项任务）
* `svelte-todo/` - 包含localStorage和Playwright的CRUD应用（12项任务）

### 主要变更

**将DOT流程图作为可执行规范**

使用DOT/GraphViz流程图作为权威流程定义重写了关键技能。文本内容变为辅助性材料。

**描述陷阱**（记录于`writing-skills`）：发现当技能描述包含工作流摘要时，技能描述会覆盖流程图内容。Claude会遵循简短描述而非阅读详细的流程图。修复方法：描述必须仅为触发用途（"在X情况下使用"），不包含流程细节。

**using-superpowers中的技能优先级**

当多个技能适用时，流程技能（头脑风暴、调试）现在明确优先于实现技能。"构建X"会先触发头脑风暴，然后是领域技能。

**头脑风暴触发机制强化**

描述改为命令式："在进行任何创造性工作前——创建功能、构建组件、添加功能或修改行为时，你必须使用此技能。"

### 破坏性变更

**技能整合** - 六项独立技能已合并：

* `root-cause-tracing`、`defense-in-depth`、`condition-based-waiting` → 捆绑于`systematic-debugging/`
* `testing-skills-with-subagents` → 捆绑于`writing-skills/`
* `testing-anti-patterns` → 捆绑于`test-driven-development/`
* `sharing-skills`已移除（已过时）

### 其他改进

* **render-graphs.js** - 从技能中提取DOT图表并渲染为SVG的工具
* **using-superpowers中的合理化表格** - 可扫描格式，包含新条目："我需要更多上下文"、"让我先探索"、"这感觉很有成效"
* **docs/testing.md** - 使用Claude Code集成测试测试技能的指南

***

## v3.6.2 (2025-12-03)

### 已修复

* **Linux兼容性**：修复了多语言钩子包装器（`run-hook.cmd`）以使用符合POSIX标准的语法
  * 第16行将bash特定的`${BASH_SOURCE[0]:-$0}`替换为标准`$0`
  * 解决了在Ubuntu/Debian系统上（其中`/bin/sh`为dash）出现的"Bad substitution"错误
  * 修复了#141

***

## v3.5.1 (2025-11-24)

### 已更改

* **OpenCode引导程序重构**：从`chat.message`钩子切换到`session.created`事件进行引导程序注入
  * 引导程序现通过`session.prompt()`在会话创建时注入，使用`noReply: true`
  * 明确告知模型using-superpowers已加载，防止冗余技能加载
  * 将引导程序内容生成整合到共享的`getBootstrapContent()`辅助函数中
  * 更简洁的单实现方法（移除了回退模式）

***

## v3.5.0 (2025-11-23)

### 新增

* **OpenCode支持**：OpenCode.ai的原生JavaScript插件
  * 自定义工具：`use_skill`和`find_skills`
  * 用于在上下文压缩后保持技能持久性的消息插入模式
  * 通过chat.message钩子自动注入上下文
  * 在session.compacted事件上自动重新注入
  * 三层技能优先级：项目 > 个人 > superpowers
  * 项目本地技能支持（`.opencode/skills/`）
  * 用于与Codex代码重用的共享核心模块（`lib/skills-core.js`）
  * 具有适当隔离的自动化测试套件（`tests/opencode/`）
  * 平台特定文档（`docs/README.opencode.md`、`docs/README.codex.md`）

### 已更改

* **重构的Codex实现**：现在使用共享的`lib/skills-core.js` ES模块
  * 消除了Codex和OpenCode之间的代码重复
  * 技能发现和解析的单一真实来源
  * Codex通过Node.js互操作成功加载ES模块

* **改进的文档**：重写README以清晰解释问题/解决方案
  * 移除了重复部分和冲突信息
  * 添加了完整的工作流描述（头脑风暴 → 计划 → 执行 → 完成）
  * 简化了平台安装说明
  * 强调技能检查协议而非自动激活声明

***

## v3.4.1 (2025-10-31)

### 改进

* 优化了superpowers引导程序以消除冗余技能执行。`using-superpowers`技能内容现在直接在会话上下文中提供，并附有明确指导，仅将Skill工具用于其他技能。这减少了开销，并防止了代理尽管在会话开始时已获得内容但仍手动执行`using-superpowers`的混乱循环。

## v3.4.0 (2025-10-30)

### 改进

* 简化了`brainstorming`技能，回归到原始的对话式愿景。移除了带有正式检查清单的重型6阶段流程，转而采用自然对话：一次提出一个问题，然后以200-300字的部分呈现设计并进行验证。保留了文档和实现交接功能。

## v3.3.1 (2025-10-28)

### 改进

* 更新了`brainstorming`技能，要求在提问前进行自主侦察，鼓励基于推荐的决策，并防止代理将优先级决定权交还给人类。
* 应用了写作清晰度改进至`brainstorming`技能，遵循Strunk的"Elements of Style"原则（省略不必要的词语，将否定形式转换为肯定形式，改进平行结构）。

### 错误修复

* 澄清了`writing-skills`指导，使其指向正确的代理特定个人技能目录（Claude Code的`~/.claude/skills`，Codex的`~/.codex/skills`）。

## v3.3.0 (2025-10-28)

### 新功能

**实验性Codex支持**

* 添加了统一的`superpowers-codex`脚本，包含引导程序/使用技能/查找技能命令
* 跨平台Node.js实现（适用于Windows、macOS、Linux）
* 命名空间技能：superpowers技能的`superpowers:skill-name`，个人技能的`skill-name`
* 名称匹配时，个人技能覆盖superpowers技能
* 清晰的技能显示：显示名称/描述，不含原始frontmatter
* 有帮助的上下文：显示每项技能的支持文件目录
* Codex的工具映射：TodoWrite→update\_plan、subagents→手动回退等
* 与最小AGENTS.md集成的引导程序，用于自动启动
* 特定于Codex的完整安装指南和引导程序说明

**与Claude Code集成的关键区别：**

* 单个统一脚本而非独立工具
* 用于Codex特定等效工具的工具替换系统
* 简化的子代理处理（手动工作而非委派）
* 更新的术语："Superpowers技能"替代"核心技能"

### 新增文件

* `.codex/INSTALL.md` - Codex用户的安装指南
* `.codex/superpowers-bootstrap.md` - 包含Codex适配的引导程序说明
* `.codex/superpowers-codex` - 包含所有功能的统一Node.js可执行文件

**注意：** Codex支持是实验性的。该集成提供了核心的superpowers功能，但可能需要根据用户反馈进行改进。

## v3.2.3 (2025-10-23)

### 改进

**更新了using-superpowers技能以使用Skill工具而非Read工具**

* 将技能调用说明从Read工具更改为Skill工具
* 更新描述："使用Read工具" → "使用Skill工具"
* 更新步骤3："使用Read工具" → "使用Skill工具读取并运行"
* 更新合理化列表："读取当前版本" → "运行当前版本"

Skill工具是Claude Code中调用技能的正确机制。此更新更正了引导程序说明，以指导代理使用正确的工具。

### 变更的文件

* 更新：`skills/using-superpowers/SKILL.md` - 将工具引用从Read更改为Skill

## v3.2.2 (2025-10-21)

### 改进

**强化了using-superpowers技能以应对代理合理化行为**

* 添加了包含绝对语言的EXTREMELY-IMPORTANT块，关于强制技能检查
  * "即使只有1%的可能性适用技能，你也必须读取它"
  * "你没有选择。你无法合理化地回避。"
* 添加了MANDATORY FIRST RESPONSE PROTOCOL检查清单
  * 代理在做出任何响应前必须完成的5步流程
  * 明确的"未完成此步骤即响应 = 失败"后果
* 添加了Common Rationalizations部分，包含8种特定的规避模式
  * "这只是一个简单问题" → 错误
  * "我可以快速检查文件" → 错误
  * "让我先收集信息" → 错误
  * 加上另外5种在代理行为中观察到的常见模式

这些变更解决了观察到的代理行为，即尽管有明确指示，他们仍会合理化地绕过技能使用。强制的语言和先发制人的反驳旨在使不遵守行为更难发生。

### 变更的文件

* 更新：`skills/using-superpowers/SKILL.md` - 添加了三层强制措施以防止技能跳过合理化

## v3.2.1 (2025-10-20)

### 新功能

**代码评审代理现已包含在插件中**

* 将`superpowers:code-reviewer`代理添加到插件的`agents/`目录
* 该代理提供针对计划和编码标准的系统性代码评审
* 之前要求用户拥有个人代理配置
* 所有技能引用已更新为使用命名空间的`superpowers:code-reviewer`
* 修复了#55

### 变更的文件

* 新增：`agents/code-reviewer.md` - 包含评审检查清单和输出格式的代理定义
* 更新：`skills/requesting-code-review/SKILL.md` - 对`superpowers:code-reviewer`的引用
* 更新：`skills/subagent-driven-development/SKILL.md` - 对`superpowers:code-reviewer`的引用

## v3.2.0 (2025-10-18)

### 新功能

**头脑风暴工作流中的设计文档**

* 为头脑风暴技能添加了第4阶段：设计文档
* 设计文档现在在实施前写入`docs/plans/YYYY-MM-DD-<topic>-design.md`
* 恢复了原始头脑风暴命令在技能转换过程中丢失的功能
* 在工作树设置和实施计划之前编写文档
* 通过子代理在时间压力下测试以验证合规性

### 破坏性变更

**技能引用命名空间标准化**

* 所有内部技能引用现在使用 `superpowers:` 命名空间前缀
* 更新后的格式：`superpowers:test-driven-development`（之前仅为 `test-driven-development`）
* 影响所有 REQUIRED SUB-SKILL、RECOMMENDED SUB-SKILL 和 REQUIRED BACKGROUND 引用
* 与使用 Skill 工具调用技能的方式保持一致
* 更新的文件：brainstorming、executing-plans、subagent-driven-development、systematic-debugging、testing-skills-with-subagents、writing-plans、writing-skills

### 改进

**设计文档与实现计划命名**

* 设计文档使用 `-design.md` 后缀以防止文件名冲突
* 实现计划继续使用现有的 `YYYY-MM-DD-<feature-name>.md` 格式
* 两者都存储在 `docs/plans/` 目录中，具有清晰的命名区分

## v3.1.1 (2025-10-17)

### 错误修复

* **修复了 README 中的命令语法** (#44) - 更新了所有命令引用以使用正确的命名空间语法（`/superpowers:brainstorm` 替代 `/brainstorm`）。插件提供的命令由 Claude Code 自动命名空间化，以避免插件之间的冲突。

## v3.1.0 (2025-10-17)

### 破坏性变更

**技能名称标准化为小写**

* 所有技能 frontmatter `name:` 字段现在使用小写 kebab-case，与目录名称匹配
* 示例：`brainstorming`、`test-driven-development`、`using-git-worktrees`
* 所有技能公告和交叉引用已更新为小写格式
* 这确保了目录名称、frontmatter 和文档之间的命名一致性

### 新功能

**增强的 brainstorming 技能**

* 添加了显示阶段、活动和工具使用的快速参考表
* 添加了用于跟踪进度的可复制工作流程清单
* 添加了用于决定何时重新访问早期阶段的决策流程图
* 添加了包含具体示例的全面 AskUserQuestion 工具指南
* 添加了“问题模式”部分，解释何时使用结构化问题与开放式问题
* 将关键原则重构为可扫描的表格

**Anthropic 最佳实践集成**

* 添加了 `skills/writing-skills/anthropic-best-practices.md` - 官方 Anthropic 技能编写指南
* 在 writing-skills SKILL.md 中引用以获取全面指导
* 提供了渐进式披露、工作流程和评估的模式

### 改进

**技能交叉引用清晰度**

* 所有技能引用现在使用明确的需求标记：
  * `**REQUIRED BACKGROUND:**` - 你必须理解的先决条件
  * `**REQUIRED SUB-SKILL:**` - 必须在工作流程中使用的技能
  * `**Complementary skills:**` - 可选但有用的相关技能
* 移除了旧的路径格式（`skills/collaboration/X` → 仅为 `X`）
* 使用分类关系（必需与补充）更新了集成部分
* 使用最佳实践更新了交叉引用文档

**与 Anthropic 最佳实践保持一致**

* 修复了描述语法和语态（完全第三人称）
* 添加了用于扫描的快速参考表
* 添加了 Claude 可以复制和跟踪的工作流程清单
* 对非明显决策点适当使用流程图
* 改进了可扫描的表格格式
* 所有技能均符合 500 行建议

### 错误修复

* **重新添加了缺失的命令重定向** - 恢复了在 v3.0 迁移中意外删除的 `commands/brainstorm.md` 和 `commands/write-plan.md`
* 修复了 `defense-in-depth` 名称不匹配问题（原为 `Defense-in-Depth-Validation`）
* 修复了 `receiving-code-review` 名称不匹配问题（原为 `Code-Review-Reception`）
* 修复了 `commands/brainstorm.md` 对正确技能名称的引用
* 移除了对不存在相关技能的引用

### 文档

**writing-skills 改进**

* 使用明确的需求标记更新了交叉引用指南
* 添加了对 Anthropic 官方最佳实践的引用
* 改进了显示正确技能引用格式的示例

## v3.0.1 (2025-10-16)

### 变更

我们现在使用 Anthropic 的第一方技能系统！

## v2.0.2 (2025-10-12)

### 错误修复

* **修复了当本地技能仓库领先于上游时的错误警告** - 初始化脚本在本地仓库提交领先于上游时错误地警告“上游有新的技能可用”。逻辑现在正确区分了三种 git 状态：本地落后（应更新）、本地领先（无警告）和分叉（应警告）。

## v2.0.1 (2025-10-12)

### 错误修复

* **修复了插件上下文中的 session-start 钩子执行问题** (#8, PR #9) - 该钩子静默失败并显示“插件钩子错误”，阻止了技能上下文的加载。通过以下方式修复：
  * 在 Claude Code 执行上下文中 BASH\_SOURCE 未绑定时使用 `${BASH_SOURCE[0]:-$0}` 回退
  * 添加 `|| true` 以在过滤状态标志时优雅处理空的 grep 结果

***

# Superpowers v2.0.0 发布说明

## 概述

Superpowers v2.0 通过一次重大的架构转变，使技能更易访问、更易维护且更具社区驱动性。

头条变更是**技能仓库分离**：所有技能、脚本和文档已从插件中移出，转移到一个专用仓库（[obra/superpowers-skills](https://github.com/obra/superpowers-skills)）。这将 superpowers 从一个单体插件转变为一个轻量级垫片，用于管理技能仓库的本地克隆。技能在会话开始时自动更新。用户通过标准的 git 工作流程进行分叉和贡献改进。技能库独立于插件进行版本控制。

除了基础设施之外，此版本还添加了九个专注于问题解决、研究和架构的新技能。我们以命令式语调和更清晰的结构重写了核心的 **using-skills** 文档，使 Claude 更容易理解何时以及如何使用技能。**find-skills** 现在输出可以直接粘贴到 Read 工具中的路径，消除了技能发现工作流程中的摩擦。

用户体验无缝操作：插件自动处理克隆、分叉和更新。贡献者发现新的架构使得改进和共享技能变得微不足道。此版本为技能作为社区资源快速发展奠定了基础。

## 重大变更

### 技能仓库分离

**最大的变化：** 技能不再存在于插件中。它们已移至位于 [obra/superpowers-skills](https://github.com/obra/superpowers-skills) 的独立仓库。

**这对您意味着：**

* **首次安装：** 插件自动将技能克隆到 `~/.config/superpowers/skills/`
* **分叉：** 在设置过程中，您将获得分叉技能仓库的选项（如果安装了 `gh`）
* **更新：** 技能在会话开始时自动更新（尽可能快进）
* **贡献：** 在分支上工作，本地提交，向上游提交 PR
* **不再有影子系统：** 旧的两层系统（个人/核心）被单一仓库分支工作流程取代

**迁移：**

如果您有现有安装：

1. 您旧的 `~/.config/superpowers/.git` 将备份到 `~/.config/superpowers/.git.bak`
2. 旧技能将备份到 `~/.config/superpowers/skills.bak`
3. 将在 `~/.config/superpowers/skills/` 处创建 obra/superpowers-skills 的新鲜克隆

### 移除的功能

* **个人 superpowers 覆盖系统** - 被 git 分支工作流程取代
* **setup-personal-superpowers 钩子** - 被 initialize-skills.sh 取代

## 新功能

### 技能仓库基础设施

**自动克隆与设置** (`lib/initialize-skills.sh`)

* 首次运行时克隆 obra/superpowers-skills
* 如果安装了 GitHub CLI，则提供分叉创建选项
* 正确设置上游/源远程仓库
* 处理从旧安装的迁移

**自动更新**

* 每次会话开始时从跟踪远程仓库获取
* 尽可能快进自动合并
* 需要手动同步时通知（分支分叉）
* 使用 pulling-updates-from-skills-repository 技能进行手动同步

### 新技能

**问题解决技能** (`skills/problem-solving/`)

* **collision-zone-thinking** - 强制无关概念碰撞以获得涌现的洞察
* **inversion-exercise** - 翻转假设以揭示隐藏的约束
* **meta-pattern-recognition** - 发现跨领域的通用原则
* **scale-game** - 在极端情况下测试以暴露基本真理
* **simplification-cascades** - 找到消除多个组件的洞察
* **when-stuck** - 派遣到正确的问题解决技术

**研究技能** (`skills/research/`)

* **tracing-knowledge-lineages** - 理解想法如何随时间演变

**架构技能** (`skills/architecture/`)

* **preserving-productive-tensions** - 保持多种有效方法，而不是强制过早解决

### 技能改进

**using-skills（原 getting-started）**

* 从 getting-started 重命名为 using-skills
* 使用命令式语调完全重写 (v4.0.0)
* 前置关键规则
* 为所有工作流程添加了“为什么”解释
* 引用中始终包含 /SKILL.md 后缀
* 更清晰地区分严格规则和灵活模式

**writing-skills**

* 交叉引用指南从 using-skills 移出
* 添加了令牌效率部分（字数目标）
* 改进了 CSO（Claude 搜索优化）指南

**sharing-skills**

* 更新为新的分支和 PR 工作流程 (v2.0.0)
* 移除了个人/核心分离引用

**pulling-updates-from-skills-repository（新）**

* 与上游同步的完整工作流程
* 取代了旧的“updating-skills”技能

### 工具改进

**find-skills**

* 现在输出带有 /SKILL.md 后缀的完整路径
* 使路径可直接与 Read 工具一起使用
* 更新了帮助文本

**skill-run**

* 从 scripts/ 移动到 skills/using-skills/
* 改进了文档

### 插件基础设施

**会话开始钩子**

* 现在从技能仓库位置加载
* 在会话开始时显示完整的技能列表
* 打印技能位置信息
* 显示更新状态（成功更新 / 落后于上游）
* 将“技能落后”警告移至输出末尾

**环境变量**

* `SUPERPOWERS_SKILLS_ROOT` 设置为 `~/.config/superpowers/skills`
* 在所有路径中一致使用

## 错误修复

* 修复了分叉时重复添加上游远程仓库的问题
* 修复了 find-skills 输出中双“skills/”前缀的问题
* 从 session-start 中移除了过时的 setup-personal-superpowers 调用
* 修复了整个钩子和命令中的路径引用

## 文档

### README

* 更新为新的技能仓库架构
* 显著链接到 superpowers-skills 仓库
* 更新了自动更新描述
* 修复了技能名称和引用
* 更新了元技能列表

### 测试文档

* 添加了全面的测试清单 (`docs/TESTING-CHECKLIST.md`)
* 为测试创建了本地市场配置
* 记录了手动测试场景

## 技术细节

### 文件变更

**添加：**

* `lib/initialize-skills.sh` - 技能仓库初始化和自动更新
* `docs/TESTING-CHECKLIST.md` - 手动测试场景
* `.claude-plugin/marketplace.json` - 本地测试配置

**移除：**

* `skills/` 目录（82 个文件）- 现在位于 obra/superpowers-skills
* `scripts/` 目录 - 现在位于 obra/superpowers-skills/skills/using-skills/
* `hooks/setup-personal-superpowers.sh` - 已过时

**修改：**

* `hooks/session-start.sh` - 使用来自 ~/.config/superpowers/skills 的技能
* `commands/brainstorm.md` - 更新路径至 SUPERPOWERS\_SKILLS\_ROOT
* `commands/write-plan.md` - 更新路径至 SUPERPOWERS\_SKILLS\_ROOT
* `commands/execute-plan.md` - 更新路径至 SUPERPOWERS\_SKILLS\_ROOT
* `README.md` - 为新架构完全重写

### 提交历史

此版本包括：

* 20+ 次提交用于技能仓库分离
* PR #1：受放大器启发的问题解决和研究技能
* PR #2：个人 superpowers 覆盖系统（后来被取代）
* 多次技能细化和文档改进

## 升级说明

### 全新安装

```bash
# In Claude Code
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

插件自动处理一切。

### 从 v1.x 升级

1. **备份您的个人技能**（如果有的话）：
   ```bash
   cp -r ~/.config/superpowers/skills ~/superpowers-skills-backup
   ```

2. **更新插件：**
   ```bash
   /plugin update superpowers
   ```

3. **在下一次会话开始时：**
   * 旧安装将自动备份
   * 将克隆全新的技能仓库
   * 如果你有 GitHub CLI，系统将提供 fork 选项

4. **迁移个人技能**（如果你有的话）：
   * 在本地技能仓库中创建一个分支
   * 从备份中复制你的个人技能
   * 提交并推送到你的 fork
   * 考虑通过 PR 回馈社区

## 下一步

### 对于用户

* 探索新的问题解决技能
* 尝试基于分支的工作流来改进技能
* 将技能贡献回社区

### 对于贡献者

* 技能仓库现位于 https://github.com/obra/superpowers-skills
* 采用 Fork → 分支 → PR 的工作流
* 查看 skills/meta/writing-skills/SKILL.md 了解文档的 TDD 方法

## 已知问题

目前没有。

## 致谢

* 问题解决技能灵感来源于 Amplifier 模式
* 社区贡献和反馈
* 对技能有效性进行了广泛的测试和迭代

***

**完整更新日志：** https://github.com/obra/superpowers/compare/dd013f6...main
**技能仓库：** https://github.com/obra/superpowers-skills
**问题反馈：** https://github.com/obra/superpowers/issues
