# Codex 应用兼容性实现方案

> **面向智能体工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 来逐项任务实现此方案。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标：** 使 `using-git-worktrees`、`finishing-a-development-branch` 及相关技能能在 Codex 应用的沙盒化工作树环境中工作，且不破坏现有行为。

**架构：** 在两项技能开始时进行只读环境检测（`git-dir` 与 `git-common-dir`）。如果已处于链接的工作树中，则跳过创建。如果处于分离的 HEAD 状态，则发出一个交接负载，而不是显示 4 选项菜单。沙盒回退机制会在工作树创建期间捕获权限错误。

**技术栈：** Git，Markdown（技能文件是指令文档，非可执行代码）

**规格说明：** `docs/superpowers/specs/2026-03-23-codex-app-compatibility-design.md`

***

## 文件结构

| 文件 | 职责 | 操作 |
|---|---|---|
| `skills/using-git-worktrees/SKILL.md` | 工作树创建 + 隔离 | 添加步骤 0 检测 + 沙盒回退 |
| `skills/finishing-a-development-branch/SKILL.md` | 分支完成工作流 | 添加步骤 1.5 检测 + 清理防护 |
| `skills/subagent-driven-development/SKILL.md` | 使用子智能体执行方案 | 更新集成描述 |
| `skills/executing-plans/SKILL.md` | 内联执行方案 | 更新集成描述 |
| `skills/using-superpowers/references/codex-tools.md` | Codex 平台参考 | 添加检测 + 完成文档 |

***

### 任务 1：添加步骤 0 到 `using-git-worktrees`

**文件：**

* 修改：`skills/using-git-worktrees/SKILL.md:14-15`（在概述之后、目录选择过程之前插入）

* \[ ] **步骤 1：读取当前技能文件**

完整读取 `skills/using-git-worktrees/SKILL.md`。确定确切的插入点：在“开始宣布”行（第 14 行）之后，“## 目录选择过程”（第 16 行）之前。

* \[ ] **步骤 2：插入步骤 0 部分**

在概述部分和“## 目录选择过程”之间插入以下内容：

````markdown
## 步骤 0: 检查是否已处于独立工作区

在创建工作树之前，检查是否已存在一个：

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)

````

**如果 `GIT_DIR` 与 `GIT_COMMON` 不同：** 您已处于一个链接的工作树中（由 Codex 应用、Claude Code 的 Agent 工具、之前的技能运行或用户创建）。请勿再创建一个工作树。而是：

1. 运行项目设置（自动检测包管理器，如下方“运行项目设置”所述）
2. 验证干净基线（如下方“验证干净基线”所述运行测试）
3. 报告分支状态：
   * 在分支上：“已在 `<path>` 的隔离工作空间中，位于分支 `<name>`。测试通过。准备实施。”
   * 分离的 HEAD：“已在 `<path>` 的隔离工作空间中（分离的 HEAD，外部管理）。测试通过。注意：完成时需要创建分支。准备实施。”

报告后，停止。不要继续到目录选择或创建步骤。

**如果 `GIT_DIR` 等于 `GIT_COMMON`：** 继续下面的完整工作树创建流程。

**沙盒回退：** 如果您继续到创建步骤但 `git worktree add -b` 因权限错误（例如，“Operation not permitted”）而失败，则将此视为检测到受限环境。回退到上述行为——在当前目录中运行设置和基线测试，相应报告，然后停止。

````

- [ ] **步骤 3: 验证插入内容**

再次读取文件。确认：
- 步骤 0 出现在"概述"和"目录选择流程"之间
- 文件的其余部分（目录选择、安全验证、创建步骤等）保持不变
- 没有重复的章节或损坏的 Markdown

- [ ] **步骤 4: 提交**

```bash
git add skills/using-git-worktrees/SKILL.md
git commit -m "feat(using-git-worktrees): add Step 0 environment detection (PRI-823)

Skip worktree creation when already in a linked worktree. Includes
sandbox fallback for permission errors on git worktree add."
````

***

### 任务 2：更新 `using-git-worktrees` 集成部分

**文件：**

* 修改：`skills/using-git-worktrees/SKILL.md:211-215`（集成 > 调用者）

* \[ ] **步骤 1：更新三个“调用者”条目**

将第 212-214 行从：

```markdown
- **头脑风暴**（第四阶段）- 设计方案获批且即将实施时 **必须执行**
- **子代理驱动开发** - 执行任何任务前 **必须执行**
- **执行计划** - 执行任何任务前 **必须执行**
```

更改为：

```markdown
- **头脑风暴** - 必需：确保隔离的工作空间（创建一个或验证现有空间）
- **子代理驱动开发** - 必需：确保隔离的工作空间（创建一个或验证现有空间）
- **执行计划** - 必需：确保隔离的工作空间（创建一个或验证现有空间）
```

* \[ ] **步骤 2：验证集成部分**

阅读集成部分。确认所有三个条目都已更新，“配对使用”部分保持不变。

* \[ ] **步骤 3：提交**

```bash
git add skills/using-git-worktrees/SKILL.md
git commit -m "docs(using-git-worktrees): update Integration descriptions (PRI-823)

Clarify that skill ensures a workspace exists, not that it always creates one."
```

***

### 任务 3：添加步骤 1.5 到 `finishing-a-development-branch`

**文件：**

* 修改：`skills/finishing-a-development-branch/SKILL.md:38`（在步骤 1 之后、步骤 2 之前插入）

* \[ ] **步骤 1：读取当前技能文件**

完整读取 `skills/finishing-a-development-branch/SKILL.md`。确定插入点：在“**如果测试通过：** 继续步骤 2。”（第 38 行）之后，“### 步骤 2：确定基础分支”（第 40 行）之前。

* \[ ] **步骤 2：插入步骤 1.5 部分**

在步骤 1 和步骤 2 之间插入以下内容：

````markdown
### 步骤 1.5: 检测环境

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
````

**路径 A — `GIT_DIR` 与 `GIT_COMMON` 不同 且 `BRANCH` 为空（外部管理工作树，分离的 HEAD）：**

首先，确保所有工作都已暂存并提交（`git add` + `git commit`）。

然后向用户展示以下内容（请勿展示 4 选项菜单）：

```
实施完成。所有测试通过。
当前 HEAD：<完整提交哈希>

此工作空间为外部管理（分离的 HEAD）。
我无法在此处创建分支、推送或打开 PR。

⚠ 这些提交位于分离的 HEAD 上。如果不创建分支，
当此工作空间被清理时，它们可能会丢失。

如果您的宿主应用程序提供以下控制：
- "创建分支" — 命名分支，然后提交/推送/PR
- "移交至本地" — 将更改移动到您的本地检出

建议的分支名称：<工单ID/简短描述>
建议的提交消息：<工作摘要>
```

分支名称：如果可用则使用工单 ID（例如 `pri-823/codex-compat`），否则将方案标题的前 5 个单词转换为短横线分隔格式，否则省略。避免在分支名称中包含敏感内容。

跳转到步骤 5（清理操作无效——参见下面的防护）。

**路径 B — `GIT_DIR` 与 `GIT_COMMON` 不同 且 `BRANCH` 存在（外部管理工作树，命名分支）：**

继续到步骤 2 并正常展示 4 选项菜单。

**路径 C — `GIT_DIR` 等于 `GIT_COMMON`（正常环境）：**

继续到步骤 2 并正常展示 4 选项菜单。

````

- [ ] **步骤 3：验证插入内容**

再次读取文件。确认：
- 步骤 1.5 出现在步骤 1 和步骤 2 之间
- 步骤 2-5 保持不变
- 路径 A 移交包含提交 SHA 和数据丢失警告
- 路径 B 和 C 正常进行到步骤 2

- [ ] **步骤 4：提交**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "feat(finishing-a-development-branch): add Step 1.5 environment detection (PRI-823)

Detect externally managed worktrees with detached HEAD and emit handoff
payload instead of 4-option menu. Includes commit SHA and data loss warning."
````

***

### 任务 4：添加步骤 5 清理防护到 `finishing-a-development-branch`

**文件：**

* 修改：`skills/finishing-a-development-branch/SKILL.md`（步骤 5：清理工作树——通过章节标题查找，在任务 3 之后行号可能已改变）

* \[ ] **步骤 1：读取当前步骤 5 部分**

在 `skills/finishing-a-development-branch/SKILL.md` 中找到“### 步骤 5：清理工作树”部分（在任务 3 插入后行号可能已改变）。当前步骤 5 是：

````markdown
### 步骤 5：清理工作树

**对于选项 1、2、4：**

检查是否在工作树中：
```bash
git worktree list | grep $(git branch --show-current)
````

如果是：

```bash
git worktree remove <worktree-path>
```

**对于选项 3：** 保留工作树。

````

- [ ] **Step 2: Add the cleanup guard before existing logic**

Replace the Step 5 section with:

```markdown
### Step 5: Cleanup Worktree

**First, check if worktree is externally managed:**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
````

如果 `GIT_DIR` 与 `GIT_COMMON` 不同：跳过工作树移除——主机环境拥有此工作空间。

**否则，对于选项 1 和 4：**

检查是否在工作树中：

```bash
git worktree list | grep $(git branch --show-current)
```

如果是：

```bash
git worktree remove <worktree-path>
```

**对于选项 3：** 保留工作树。

````

注意：原始文本写的是“对于选项 1、2、4”，但快速参考表和常见错误部分写的是“仅选项 1 和 4”。此编辑使步骤 5 与这些部分保持一致。

- [ ] **步骤 3：验证替换内容**

阅读步骤 5。确认：
- 清理守卫（重新检测）首先出现
- 为非外部管理的工作树保留现有的移除逻辑
- “选项 1 和 4”（而不是“1、2、4”）与快速参考和常见错误部分一致

- [ ] **步骤 4：提交**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "feat(finishing-a-development-branch): add Step 5 cleanup guard (PRI-823)

Re-detect externally managed worktree at cleanup time and skip removal.
Also fixes pre-existing inconsistency: cleanup now correctly says
Options 1 and 4 only, matching Quick Reference and Common Mistakes."
````

***

### 任务 5：更新 `subagent-driven-development` 和 `executing-plans` 中的集成行

**文件：**

* 修改：`skills/subagent-driven-development/SKILL.md:268`

* 修改：`skills/executing-plans/SKILL.md:68`

* \[ ] **步骤 1：更新 `subagent-driven-development`**

将第 268 行从：

```
- **superpowers:using-git-worktrees** - REQUIRED: 在开始前设置隔离工作空间
```

更改为：

```
- **superpowers:using-git-worktrees** - 必需：确保隔离的工作区（创建一个或验证现有）
```

* \[ ] **步骤 2：更新 `executing-plans`**

将第 68 行从：

```
- **superpowers:using-git-worktrees** - REQUIRED: 在开始前设置隔离工作空间
```

更改为：

```
- **superpowers:using-git-worktrees** - 必需：确保隔离的工作区（创建一个或验证现有）
```

* \[ ] **步骤 3：验证两个文件**

读取 `skills/subagent-driven-development/SKILL.md` 的第 268 行和 `skills/executing-plans/SKILL.md` 的第 68 行。确认两者都写着“确保隔离的工作空间（创建一个或验证现有的）”。

* \[ ] **步骤 4：提交**

```bash
git add skills/subagent-driven-development/SKILL.md skills/executing-plans/SKILL.md
git commit -m "docs(sdd, executing-plans): update worktree Integration descriptions (PRI-823)

Clarify that using-git-worktrees ensures a workspace exists rather than
always creating one."
```

***

### 任务 6：添加环境检测文档到 `codex-tools.md`

**文件：**

* 修改：`skills/using-superpowers/references/codex-tools.md:25`（在末尾追加）

* \[ ] **步骤 1：读取当前文件**

完整读取 `skills/using-superpowers/references/codex-tools.md`。确认其在 multi\_agent 部分之后结束于第 25-26 行。

* \[ ] **步骤 2：追加两个新部分**

在文件末尾添加：

````markdown
## 环境检测

在创建 worktree 或结束分支前，技能应使用只读 git 命令检测其环境：

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)

````

* `GIT_DIR != GIT_COMMON` → 已处于链接的工作树中（跳过创建）
* `BRANCH` 为空 → 分离的 HEAD（无法从沙盒创建分支/推送/PR）

有关每个技能如何使用这些信号的详细信息，请参阅 `using-git-worktrees` 步骤 0 和 `finishing-a-development-branch` 步骤 1.5。

## Codex 应用完成

当沙盒阻止分支/推送操作时（在外部管理工作树中处于分离的 HEAD 状态），智能体提交所有工作并通知用户使用应用的原生控件：

* **“创建分支”** —— 命名分支，然后通过应用 UI 提交/推送/PR
* **“交接至本地”** —— 将工作转移到用户的本地检出

智能体仍可以运行测试、暂存文件，并输出建议的分支名称、提交消息和 PR 描述供用户复制。

````

- [ ] **Step 3: 验证添加的内容**

阅读完整文件。确认：
- 两个新章节出现在现有内容之后
- Bash 代码块渲染正确（未被转义）
- 存在指向 Step 0 和 Step 1.5 的交叉引用

- [ ] **Step 4: 提交**

```bash
git add skills/using-superpowers/references/codex-tools.md
git commit -m "docs(codex-tools): add environment detection and App finishing docs (PRI-823)

Document the git-dir vs git-common-dir detection pattern and the Codex
App's native finishing flow for skills that need to adapt."
````

***

### 任务 7：自动化测试——环境检测

**文件：**

* 创建：`tests/codex-app-compat/test-environment-detection.sh`

* \[ ] **步骤 1：创建测试目录**

```bash
mkdir -p tests/codex-app-compat
```

* \[ ] **步骤 2：编写检测测试脚本**

创建 `tests/codex-app-compat/test-environment-detection.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

# Test environment detection logic from PRI-823
# Tests the git-dir vs git-common-dir comparison used by
# using-git-worktrees Step 0 and finishing-a-development-branch Step 1.5

PASS=0
FAIL=0
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

log_pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
log_fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }

# Helper: run detection and return "linked" or "normal"
detect_worktree() {
  local git_dir git_common
  git_dir=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
  git_common=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
  if [ "$git_dir" != "$git_common" ]; then
    echo "linked"
  else
    echo "normal"
  fi
}

echo "=== Test 1: Normal repo detection ==="
cd "$TEMP_DIR"
git init test-repo > /dev/null 2>&1
cd test-repo
git commit --allow-empty -m "init" > /dev/null 2>&1
result=$(detect_worktree)
if [ "$result" = "normal" ]; then
  log_pass "Normal repo detected as normal"
else
  log_fail "Normal repo detected as '$result' (expected 'normal')"
fi

echo "=== Test 2: Linked worktree detection ==="
git worktree add "$TEMP_DIR/test-wt" -b test-branch > /dev/null 2>&1
cd "$TEMP_DIR/test-wt"
result=$(detect_worktree)
if [ "$result" = "linked" ]; then
  log_pass "Linked worktree detected as linked"
else
  log_fail "Linked worktree detected as '$result' (expected 'linked')"
fi

echo "=== Test 3: Detached HEAD detection ==="
git checkout --detach HEAD > /dev/null 2>&1
branch=$(git branch --show-current)
if [ -z "$branch" ]; then
  log_pass "Detached HEAD: branch is empty"
else
  log_fail "Detached HEAD: branch is '$branch' (expected empty)"
fi

echo "=== Test 4: Linked worktree + detached HEAD (Codex App simulation) ==="
result=$(detect_worktree)
branch=$(git branch --show-current)
if [ "$result" = "linked" ] && [ -z "$branch" ]; then
  log_pass "Codex App simulation: linked + detached HEAD"
else
  log_fail "Codex App simulation: result='$result', branch='$branch'"
fi

echo "=== Test 5: Cleanup guard — linked worktree should NOT remove ==="
cd "$TEMP_DIR/test-wt"
result=$(detect_worktree)
if [ "$result" = "linked" ]; then
  log_pass "Cleanup guard: linked worktree correctly detected (would skip removal)"
else
  log_fail "Cleanup guard: expected 'linked', got '$result'"
fi

echo "=== Test 6: Cleanup guard — main repo SHOULD remove ==="
cd "$TEMP_DIR/test-repo"
result=$(detect_worktree)
if [ "$result" = "normal" ]; then
  log_pass "Cleanup guard: main repo correctly detected (would proceed with removal)"
else
  log_fail "Cleanup guard: expected 'normal', got '$result'"
fi

# Cleanup worktree before temp dir removal
cd "$TEMP_DIR/test-repo"
git worktree remove "$TEMP_DIR/test-wt" > /dev/null 2>&1 || true

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
```

* \[ ] **步骤 3：使其可执行并运行它**

```bash
chmod +x tests/codex-app-compat/test-environment-detection.sh
./tests/codex-app-compat/test-environment-detection.sh
```

预期输出：6 项通过，0 项失败。

* \[ ] **步骤 4：提交**

```bash
git add tests/codex-app-compat/test-environment-detection.sh
git commit -m "test: add environment detection tests for Codex App compat (PRI-823)

Tests git-dir vs git-common-dir comparison in normal repo, linked
worktree, detached HEAD, and cleanup guard scenarios."
```

***

### 任务 8：最终验证

**文件：**

* 读取：所有 5 个修改后的技能文件

* \[ ] **步骤 1：运行自动化检测测试**

```bash
./tests/codex-app-compat/test-environment-detection.sh
```

预期：6 项通过，0 项失败。

* \[ ] **步骤 2：读取每个修改后的文件并验证更改**

端到端读取每个文件：

* `skills/using-git-worktrees/SKILL.md` —— 步骤 0 存在，其余未更改

* `skills/finishing-a-development-branch/SKILL.md` —— 步骤 1.5 存在，清理防护存在，其余未更改

* `skills/subagent-driven-development/SKILL.md` —— 第 268 行已更新

* `skills/executing-plans/SKILL.md` —— 第 68 行已更新

* `skills/using-superpowers/references/codex-tools.md` —— 末尾有两个新部分

* \[ ] **步骤 3：验证无意外更改**

```bash
git diff --stat HEAD~7
```

应恰好显示 6 个文件已更改（5 个技能文件 + 1 个测试文件）。没有其他文件被修改。

* \[ ] **步骤 4：运行现有测试套件**

如果存在测试运行器：

```bash
# Run skill-triggering tests
./tests/skill-triggering/run-all.sh 2>/dev/null || echo "Skill triggering tests not available in this environment"

# Run SDD integration test
./tests/claude-code/test-subagent-driven-development-integration.sh 2>/dev/null || echo "SDD integration test not available in this environment"
```

注意：这些测试需要带有 `--dangerously-skip-permissions` 的 Claude Code。如果不可用，请记录应手动运行回归测试。
