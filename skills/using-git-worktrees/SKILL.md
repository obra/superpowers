---
name: using-git-worktrees
description: 当需要与当前工作区隔离的功能开发或执行实施计划之前使用 - 通过智能目录选择和安全验证创建隔离的 git 工作树
---

# 使用 Git 工作树

## 概述

Git 工作树创建共享同一仓库的隔离工作空间，允许同时在多个分支上工作而无需切换。

**核心原则：** 系统化的目录选择 + 安全验证 = 可靠的隔离。

**开始时宣告：** "我正在使用 using-git-worktrees 技能来设置隔离的工作空间。"

## 目录选择流程

按以下优先顺序执行：

### 1. 检查现有目录

```bash
# 按优先顺序检查
ls -d .worktrees 2>/dev/null     # 首选（隐藏目录）
ls -d worktrees 2>/dev/null      # 备选
```

**如果找到：** 使用该目录。如果两者都存在，`.worktrees` 优先。

### 2. 检查 CLAUDE.md

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**如果指定了偏好：** 直接使用，无需询问。

### 3. 询问用户

如果不存在目录且 CLAUDE.md 中没有偏好设置：

```
未找到工作树目录。我应该在哪里创建工作树？

1. .worktrees/（项目本地，隐藏目录）
2. ~/.config/superpowers/worktrees/<项目名称>/（全局位置）

您更倾向于哪个？
```

## 安全验证

### 对于项目本地目录（.worktrees 或 worktrees）

**必须在创建工作树之前验证目录是否被忽略：**

```bash
# 检查目录是否被忽略（遵循本地、全局和系统 gitignore）
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**如果未被忽略：**

根据 Jesse 的规则"立即修复损坏的东西"：
1. 将相应的行添加到 .gitignore
2. 提交更改
3. 继续创建工作树

**为什么这很关键：** 防止意外将工作树内容提交到仓库。

### 对于全局目录（~/.config/superpowers/worktrees）

无需 .gitignore 验证 - 完全在项目之外。

## 创建步骤

### 1. 检测项目名称

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. 创建工作树

```bash
# 确定完整路径
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/.config/superpowers/worktrees/*)
    path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"
    ;;
esac

# 使用新分支创建工作树
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. 运行项目设置

自动检测并运行相应的设置：

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

运行测试以确保工作树在干净状态下启动：

```bash
# 示例 - 使用适合项目的命令
npm test
cargo test
pytest
go test ./...
```

**如果测试失败：** 报告失败情况，询问是否继续或进行调查。

**如果测试通过：** 报告就绪。

### 5. 报告位置

```
工作树已就绪，位于 <完整路径>
测试通过（<N> 个测试，0 个失败）
准备实施 <功能名称>
```

## 快速参考

| 情况 | 操作 |
|------|------|
| `.worktrees/` 存在 | 使用它（验证是否被忽略） |
| `worktrees/` 存在 | 使用它（验证是否被忽略） |
| 两者都存在 | 使用 `.worktrees/` |
| 两者都不存在 | 检查 CLAUDE.md → 询问用户 |
| 目录未被忽略 | 添加到 .gitignore + 提交 |
| 基线测试失败 | 报告失败 + 询问 |
| 没有 package.json/Cargo.toml | 跳过依赖安装 |

## 常见错误

### 跳过忽略验证

- **问题：** 工作树内容被跟踪，污染 git status
- **修复：** 在创建项目本地工作树之前始终使用 `git check-ignore`

### 假设目录位置

- **问题：** 造成不一致，违反项目约定
- **修复：** 遵循优先级：现有目录 > CLAUDE.md > 询问

### 在测试失败的情况下继续

- **问题：** 无法区分新 bug 和先前存在的问题
- **修复：** 报告失败情况，获得明确许可后再继续

### 硬编码设置命令

- **问题：** 在使用不同工具的项目上会失败
- **修复：** 从项目文件（package.json 等）自动检测

## 示例工作流

```
你：我正在使用 using-git-worktrees 技能来设置隔离的工作空间。

[检查 .worktrees/ - 存在]
[验证忽略状态 - git check-ignore 确认 .worktrees/ 已被忽略]
[创建工作树：git worktree add .worktrees/auth -b feature/auth]
[运行 npm install]
[运行 npm test - 47 个通过]

工作树已就绪，位于 /Users/jesse/myproject/.worktrees/auth
测试通过（47 个测试，0 个失败）
准备实施认证功能
```

## 危险信号

**绝不要：**
- 在未验证是否被忽略的情况下创建工作树（项目本地）
- 跳过基线测试验证
- 在未询问的情况下继续处理失败的测试
- 在不明确时假设目录位置
- 跳过 CLAUDE.md 检查

**始终要：**
- 遵循目录优先级：现有目录 > CLAUDE.md > 询问
- 验证项目本地目录是否被忽略
- 自动检测并运行项目设置
- 验证干净的测试基线

## 集成

**被以下技能调用：**
- **brainstorming**（第 4 阶段）- 当设计获批并进行实施时为必需
- **subagent-driven-development** - 执行任何任务之前为必需
- **executing-plans** - 执行任何任务之前为必需
- 任何需要隔离工作空间的技能

**配合使用：**
- **finishing-a-development-branch** - 工作完成后的清理为必需
