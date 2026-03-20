---
name: using-git-worktrees
description: 在需要与当前工作区隔离的功能工作开始时或执行实施计划之前使用 - 创建隔离的git工作树，具有智能目录选择和安全验证功能
---

# 使用 Git Worktrees

## 概述

Git worktrees 创建共享同一仓库的隔离工作空间，允许同时处理多个分支而无需切换。

**核心原则：** 系统化的目录选择 + 安全性验证 = 可靠的隔离。

**开始时声明：** "我正在使用 using-git-worktrees 技能来设置一个隔离的工作空间。"

## 目录选择流程

遵循以下优先级顺序：

### 1. 检查现有目录

```bash
# Check in priority order
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

**如果找到：** 使用该目录。如果两者都存在，`.worktrees` 优先。

### 2. 检查 CLAUDE.md

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**如果指定了偏好：** 直接使用，无需询问。

### 3. 询问用户

如果没有目录存在且 CLAUDE.md 中没有偏好设置：

```
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. ~/.config/superpowers/worktrees/<project-name>/ (global location)

Which would you prefer?
```

## 安全性验证

### 对于项目本地目录（.worktrees 或 worktrees）

**创建 worktree 前必须验证目录是否被忽略：**

```bash
# Check if directory is ignored (respects local, global, and system gitignore)
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**如果未被忽略：**

根据 Jesse 的规则“立即修复损坏的东西”：

1. 将适当的行添加到 .gitignore
2. 提交更改
3. 继续创建 worktree

**为何关键：** 防止意外地将 worktree 内容提交到仓库。

### 对于全局目录 (~/.config/superpowers/worktrees)

无需 .gitignore 验证——完全在项目之外。

## 创建步骤

### 1. 检测项目名称

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. 创建 Worktree

```bash
# Determine full path
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/.config/superpowers/worktrees/*)
    path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"
    ;;
esac

# Create worktree with new branch
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. 运行项目设置

自动检测并运行适当的设置：

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4. 验证干净的基线

运行测试以确保 worktree 从干净状态开始：

```bash
# Examples - use project-appropriate command
npm test
cargo test
pytest
go test ./...
```

**如果测试失败：** 报告失败，询问是继续还是调查。

**如果测试通过：** 报告就绪。

### 5. 报告位置

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## 快速参考

| 情况 | 操作 |
|-----------|--------|
| `.worktrees/` 存在 | 使用它（验证是否被忽略） |
| `worktrees/` 存在 | 使用它（验证是否被忽略） |
| 两者都存在 | 使用 `.worktrees/` |
| 都不存在 | 检查 CLAUDE.md → 询问用户 |
| 目录未被忽略 | 添加到 .gitignore + 提交 |
| 基线测试失败 | 报告失败 + 询问 |
| 没有 package.json/Cargo.toml | 跳过依赖安装 |

## 常见错误

### 跳过忽略验证

* **问题：** Worktree 内容被跟踪，污染 git status
* **修复：** 创建项目本地 worktree 前始终使用 `git check-ignore`

### 假设目录位置

* **问题：** 造成不一致，违反项目约定
* **修复：** 遵循优先级：现有 > CLAUDE.md > 询问

### 在测试失败的情况下继续

* **问题：** 无法区分新错误与预先存在的问题
* **修复：** 报告失败，获取明确的继续许可

### 硬编码设置命令

* **问题：** 在使用不同工具的项目上会失败
* **修复：** 根据项目文件（package.json 等）自动检测

## 示例工作流

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[Check .worktrees/ - exists]
[Verify ignored - git check-ignore confirms .worktrees/ is ignored]
[Create worktree: git worktree add .worktrees/auth -b feature/auth]
[Run npm install]
[Run npm test - 47 passing]

Worktree ready at /Users/jesse/myproject/.worktrees/auth
Tests passing (47 tests, 0 failures)
Ready to implement auth feature
```

## 红色警报

**绝不要：**

* 不验证是否被忽略就创建 worktree（项目本地）
* 跳过基线测试验证
* 不询问就在测试失败的情况下继续
* 在情况模糊时假设目录位置
* 跳过 CLAUDE.md 检查

**始终要：**

* 遵循目录优先级：现有 > CLAUDE.md > 询问
* 验证项目本地目录是否被忽略
* 自动检测并运行项目设置
* 验证干净的测试基线

## 集成

**由以下技能调用：**

* **brainstorming** （第 4 阶段） - 当设计被批准并随后进行实现时 **必需**
* **subagent-driven-development** - 在执行任何任务前 **必需**
* **executing-plans** - 在执行任何任务前 **必需**
* 任何需要隔离工作空间的技能

**与以下技能配合使用：**

* **finishing-a-development-branch** - 工作完成后进行清理时 **必需**
