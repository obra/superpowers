# Codex 应用兼容性：工作树与完成技能适配

让 superpowers 技能在 Codex 应用的沙盒化工作树环境中运行，同时不破坏现有 Claude Code 或 Codex CLI 的行为。

**工单：** PRI-823

## 动机

Codex 应用在其管理的 git 工作树内运行代理 —— 这些是分离的 HEAD，位于 `$CODEX_HOME/worktrees/` 下，并受 Seatbelt 沙盒保护，该沙盒会阻止 `git checkout -b`、`git push` 和网络访问。三个 superpowers 技能假设拥有不受限制的 git 访问权限：`using-git-worktrees` 使用命名分支创建手动工作树，`finishing-a-development-branch` 通过分支名进行合并/推送/PR 操作，而 `subagent-driven-development` 两者都需要。

Codex CLI（开源终端工具）则**没有**此冲突 —— 它没有内置的工作树管理功能。我们的手动工作树方法填补了那里的隔离空白。问题具体出现在 Codex 应用中。

## 实证发现

于 2026-03-23 在 Codex 应用中测试：

| 操作 | workspace-write 沙盒 | Full access 沙盒 |
|---|---|---|
| `git add` | 有效 | 有效 |
| `git commit` | 有效 | 有效 |
| `git checkout -b` | **被阻止**（无法写入 `.git/refs/heads/`） | 有效 |
| `git push` | **被阻止**（网络 + `.git/refs/remotes/`） | 有效 |
| `gh pr create` | **被阻止**（网络） | 有效 |
| `git status/diff/log` | 有效 | 有效 |

额外发现：

* `spawn_agent` 子代理**共享**父线程的文件系统（通过标记文件测试确认）
* 无论工作树从哪个分支启动，“创建分支”按钮都会出现在应用标题栏中
* 应用的原生完成流程：创建分支 → 提交模态框 → 提交并推送 / 提交并创建 PR
* 在 macOS 上，`network_access = true` 配置静默失效（问题 #10390）

## 设计：只读环境检测

三个只读 git 命令可在无副作用的情况下检测环境：

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

衍生出两个信号：

* **IN\_LINKED\_WORKTREE：** `GIT_DIR != GIT_COMMON` —— 代理位于由其他实体（Codex 应用、Claude Code Agent 工具、先前技能运行或用户）创建的工作树中
* **ON\_DETACHED\_HEAD：** `BRANCH` 为空 —— 不存在命名分支

为何使用 `git-dir != git-common-dir` 而非检查 `show-toplevel`：

* 在普通仓库中，两者都解析到同一个 `.git` 目录
* 在链接的工作树中，`git-dir` 是 `.git/worktrees/<name>`，而 `git-common-dir` 是 `.git`
* 在子模块中，两者相等 —— 避免了 `show-toplevel` 可能产生的误报
* 通过 `cd && pwd -P` 解析可处理相对路径问题（`git-common-dir` 在普通仓库中返回 `.git` 相对路径，但在工作树中返回绝对路径）和符号链接问题（macOS `/tmp` → `/private/tmp`）

### 决策矩阵

| 链接工作树？ | 分离的 HEAD？ | 环境 | 操作 |
|---|---|---|---|
| 否 | 否 | Claude Code / Codex CLI / 普通 git | 完整的技能行为（不变） |
| 是 | 是 | Codex 应用工作树（workspace-write） | 跳过工作树创建；在完成时传递交接负载 |
| 是 | 否 | Codex 应用（Full access）或手动工作树 | 跳过工作树创建；完整的完成流程 |
| 否 | 是 | 异常情况（手动分离的 HEAD） | 正常创建工作树；完成时发出警告 |

## 变更

### 1. `using-git-worktrees/SKILL.md` —— 添加步骤 0（约 12 行）

在“概述”和“目录选择过程”之间新增一节：

**步骤 0：检查是否已在隔离工作区中**

运行检测命令。如果 `GIT_DIR != GIT_COMMON`，则完全跳过工作树创建。改为：

1. 跳转到“创建步骤”下的“运行项目设置”小节 —— `npm install` 等操作是幂等的，出于安全考虑值得运行
2. 然后“验证干净基线” —— 运行测试
3. 报告分支状态：
   * 在分支上：“已在分支 `<name>` 上的 `<path>` 处的隔离工作区中。测试通过。准备实施。”
   * 分离的 HEAD：“已在 `<path>` 处的隔离工作区中（分离的 HEAD，由外部管理）。测试通过。注意：完成时需要创建分支。准备实施。”

如果 `GIT_DIR == GIT_COMMON`，则继续执行完整的工作树创建流程（不变）。

当触发步骤 0 时，安全验证（.gitignore 检查）会被跳过 —— 对于外部创建的工作树来说无关紧要。

更新“集成”部分的“由...调用”条目。将每个条目的描述从上下文特定的文本更改为：“确保隔离工作区（创建一个或验证现有的）”。例如，`subagent-driven-development` 条目从“必需：在开始前设置隔离工作区”更改为“必需：确保隔离工作区（创建一个或验证现有的）”。

**沙盒回退：** 如果 `GIT_DIR == GIT_COMMON` 并且技能继续执行“创建步骤”，但 `git worktree add -b` 因权限错误（例如，Seatbelt 沙盒拒绝）而失败，则将此视为延迟检测到的受限环境。回退到步骤 0 的“已在工作区中”行为 —— 跳过创建，在当前目录中运行设置和基线测试，并相应报告。

在步骤 0 中报告后，**停止**。不要继续执行“目录选择”或“创建步骤”。

**其他一切不变：** 目录选择、安全验证、创建步骤、项目设置、基线测试、快速参考、常见错误、危险信号。

### 2. `finishing-a-development-branch/SKILL.md` —— 添加步骤 1.5 + 清理保护（约 20 行）

**步骤 1.5：检测环境**（在步骤 1“验证测试”之后，步骤 2“确定基础分支”之前）

运行检测命令。三条路径：

* **路径 A** 完全跳过步骤 2 和 3（不需要基础分支或选项）。
* **路径 B 和 C** 正常执行步骤 2（确定基础分支）和步骤 3（呈现选项）。

**路径 A —— 外部管理的工作树 + 分离的 HEAD**（`GIT_DIR != GIT_COMMON` 且 `BRANCH` 为空）：

首先，确保所有工作都已暂存并提交（`git add` + `git commit`）。Codex 应用的完成控制操作依赖于已提交的工作。

然后向用户呈现以下内容（**不要**呈现 4 选项菜单）：

```
实施完成。所有测试通过。
当前 HEAD：<完整提交 SHA>

此工作区为外部管理（分离的 HEAD）。
我无法在此创建分支、推送或打开 PR。

⚠ 这些提交位于分离的 HEAD 上。如果不创建分支，
它们可能会在此工作区清理时丢失。

如果您的宿主应用程序提供以下控制：
- "创建分支" — 用于命名分支，然后提交/推送/PR
- "移交到本地" — 用于将更改移至本地检出

建议的分支名称：<工单 ID/简短描述>
建议的提交信息：<工作摘要>
```

分支名推导：如果可用则使用工单 ID（例如 `pri-823/codex-compat`），否则将计划标题的前 5 个词转换为 slug，否则省略建议。避免在分支名中包含敏感内容（漏洞描述、客户名称）。

跳转到步骤 5（对于外部管理的工作树，清理是无操作）。

**路径 B —— 外部管理的工作树 + 命名分支**（`GIT_DIR != GIT_COMMON` 且 `BRANCH` 存在）：

正常呈现 4 选项菜单。（步骤 5 的清理保护将独立地重新检测外部管理状态。）

**路径 C —— 正常环境**（`GIT_DIR == GIT_COMMON`）：

按当前方式呈现 4 选项菜单（不变）。

**步骤 5 清理保护：**

在清理时重新运行 `GIT_DIR` 与 `GIT_COMMON` 检测（不要依赖先前的技能输出 —— 完成技能可能在另一个会话中运行）。如果 `GIT_DIR != GIT_COMMON`，则跳过 `git worktree remove` —— 此工作区由宿主环境所有。

否则，按当前方式检查和移除。注意：现有的步骤 5 文本说“对于选项 1、2、4”，但“快速参考”表和“常见错误”部分说“仅选项 1 和 4”。新的保护逻辑添加在此现有逻辑之前，并且不改变哪些选项会触发清理。

**其他一切不变：** 选项 1-4 逻辑、快速参考、常见错误、危险信号。

### 3. `subagent-driven-development/SKILL.md` 和 `executing-plans/SKILL.md` —— 各 1 行编辑

这两个技能在“集成”部分有一行相同的文本。从：

```
- superpowers:using-git-worktrees - 必需：在开始前设置独立工作区
```

改为：

```
- superpowers:using-git-worktrees - 必需：确保独立的工作空间（创建一个或验证现有空间）
```

**其他一切不变：** 分发/审查循环、提示模板、模型选择、状态处理、危险信号。

### 4. `codex-tools.md` —— 添加环境检测文档（约 15 行）

末尾新增两个部分：

**环境检测：**

````markdown
## 环境检测

创建工作树或完成分支的技能应首先通过只读 git 命令检测其环境，然后再继续执行：

\```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
\```

- `GIT_DIR != GIT_COMMON` → 已处于链接的工作树中（跳过创建）
- `BRANCH` 为空 → 分离的 HEAD（无法从沙盒中分支/推送/创建 PR）

关于每个技能如何使用这些信号，请参阅 `using-git-worktrees` 第 0 步和 `finishing-a-development-branch` 第 1.5 步。
````

**Codex 应用完成：**

```markdown
## Codex 应用收尾处理

当沙盒环境阻止分支/推送操作（在外部管理的工作树中处于分离 HEAD 状态）时，代理会提交所有工作并通知用户使用应用的原生控制功能：

- **"创建分支"** — 命名分支，然后通过应用界面进行提交/推送/拉取请求
- **"移交至本地"** — 将工作转移到用户的本地检出副本

代理仍可运行测试、暂存文件，并输出建议的分支名称、提交消息和拉取请求描述，供用户复制使用。
```

## 保持不变的内容

* `implementer-prompt.md`、`spec-reviewer-prompt.md`、`code-quality-reviewer-prompt.md` —— 子代理提示未改动
* `executing-plans/SKILL.md` —— 仅“集成”描述更改一行（与 `subagent-driven-development` 相同）；所有运行时行为不变
* `dispatching-parallel-agents/SKILL.md` —— 无工作树或完成操作
* `.codex/INSTALL.md` —— 安装过程不变
* 4 选项完成菜单 —— 为 Claude Code 和 Codex CLI 完全保留
* 完整的工作树创建流程 —— 为非工作树环境完全保留
* 子代理分发/审查/迭代循环 —— 不变（文件系统共享已确认）

## 范围摘要

| 文件 | 变更 |
|---|---|
| `skills/using-git-worktrees/SKILL.md` | +12 行（步骤 0） |
| `skills/finishing-a-development-branch/SKILL.md` | +20 行（步骤 1.5 + 清理保护） |
| `skills/subagent-driven-development/SKILL.md` | 1 行编辑 |
| `skills/executing-plans/SKILL.md` | 1 行编辑 |
| `skills/using-superpowers/references/codex-tools.md` | +15 行 |

约 50 行在 5 个文件中添加/更改。零新增文件。零破坏性变更。

## 未来考虑

如果第三个技能需要相同的检测模式，将其提取到共享的 `references/environment-detection.md` 文件中（方法 B）。目前不需要 —— 只有 2 个技能使用它。

## 测试计划

### 自动化（在实施后于 Claude Code 中运行）

1. 正常仓库检测 —— 断言 IN\_LINKED\_WORKTREE=false
2. 链接工作树检测 —— `git worktree add` 测试工作树，断言 IN\_LINKED\_WORKTREE=true
3. 分离的 HEAD 检测 —— `git checkout --detach`，断言 ON\_DETACHED\_HEAD=true
4. 完成技能交接输出 —— 验证在受限环境中的交接消息（而非 4 选项菜单）
5. **步骤 5 清理保护** —— 创建链接工作树（`git worktree add /tmp/test-cleanup -b test-cleanup`），`cd` 进入其中，运行步骤 5 清理检测（`GIT_DIR` 与 `GIT_COMMON`），断言它**不会**调用 `git worktree remove`。然后 `cd` 回到主仓库，运行相同的检测，断言它**会**调用 `git worktree remove`。之后清理测试工作树。

### 手动 Codex 应用测试（5 项测试）

1. 在工作树线程（workspace-write）中的检测 —— 验证 GIT\_DIR != GIT\_COMMON，空分支
2. 在工作树线程（Full access）中的检测 —— 相同的检测，不同的沙盒行为
3. 完成技能交接格式 —— 验证代理发出交接负载，而非 4 选项菜单
4. 完整生命周期 —— 检测 → 提交 → 完成检测 → 正确行为 → 清理
5. **Local 线程中的沙盒回退** —— 启动一个 Codex 应用 **Local 线程**（workspace-write 沙盒）。提示：“使用 superpowers 技能 `using-git-worktrees` 为实施一个小更改设置隔离工作区。”预检查：`git checkout -b test-sandbox-check` 应失败并返回 `Operation not permitted`。预期：技能检测到 `GIT_DIR == GIT_COMMON`（普通仓库），尝试 `git worktree add -b`，遇到 Seatbelt 拒绝，回退到步骤 0 的“已在工作区中”行为 —— 运行设置、基线测试，从当前目录报告准备就绪。通过：代理优雅恢复，没有隐晦的错误消息。失败：代理打印原始 Seatbelt 错误、重试或因输出混乱而放弃。

### 回归

* 现有 Claude Code 技能触发测试仍然通过
* 现有子代理驱动开发集成测试仍然通过
* 正常 Claude Code 会话：完整的工作树创建 + 4 选项完成仍然有效
