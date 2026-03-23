---
name: finishing-a-development-branch
description: 当实现完成、所有测试通过且需要决定如何集成工作时使用 - 通过提供合并、拉取请求或清理的结构化选项，指导开发工作的完成
---

# 完成开发分支

## 概述

通过呈现清晰选项并处理所选工作流，指导完成开发工作。

**核心原则：** 验证测试 → 呈现选项 → 执行选择 → 清理。

**开始时声明：** "我正在使用完成开发分支技能来完成这项工作。"

## 流程

### 步骤 1：验证测试

**在呈现选项之前，验证测试通过：**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**如果测试失败：**

```
测试失败（<N> 个失败项）。完成前必须修复：

[显示失败详情]

测试通过前无法进行合并/拉取请求操作。
```

停止。不要继续到步骤 2。

**如果测试通过：** 继续到步骤 2。

### 步骤 2：确定基础分支

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

或询问："此分支是从 main 分支分出来的 - 是否正确？"

### 步骤 3：呈现选项

准确呈现这 4 个选项：

```
实施完成。您想做什么？

1. 在本地合并回 <base-branch>
2. 推送并创建 Pull Request
3. 保持分支原样（我稍后处理）
4. 丢弃此项工作

请选择哪个选项？
```

**不要添加解释** - 保持选项简洁。

### 步骤 4：执行选择

#### 选项 1：本地合并

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <feature-branch>
```

然后：清理工作树（步骤 5）

#### 选项 2：推送并创建 PR

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

然后：清理工作树（步骤 5）

#### 选项 3：保持原样

报告："保持分支 <名称>。工作树保留在 <路径>。"

**不要清理工作树。**

#### 选项 4：丢弃

**首先确认：**

```
这将永久删除：
- 分支 <name>
- 所有提交：<commit-list>
- 位于 <path> 的工作树

输入 'discard' 以确认。
```

等待确切的确认。

如果确认：

```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

然后：清理工作树（步骤 5）

### 步骤 5：清理工作树

**对于选项 1, 2, 4：**

检查是否在工作树中：

```bash
git worktree list | grep $(git branch --show-current)
```

如果是：

```bash
git worktree remove <worktree-path>
```

**对于选项 3：** 保留工作树。

## 快速参考

| 选项 | 合并 | 推送 | 保留工作树 | 清理分支 |
|--------|-------|------|---------------|----------------|
| 1. 本地合并 | ✓ | - | - | ✓ |
| 2. 创建 PR | - | ✓ | ✓ | - |
| 3. 保持原样 | - | - | ✓ | - |
| 4. 丢弃 | - | - | - | ✓ (强制) |

## 常见错误

**跳过测试验证**

* **问题：** 合并损坏的代码，创建失败的 PR
* **修复：** 在提供选项之前始终验证测试

**开放式问题**

* **问题：** "接下来我该做什么？" → 模糊不清
* **修复：** 准确呈现 4 个结构化选项

**自动工作树清理**

* **问题：** 在可能还需要时移除工作树（选项 2, 3）
* **修复：** 仅清理选项 1 和 4 的情况

**丢弃时无确认**

* **问题：** 意外删除工作
* **修复：** 要求输入 "discard" 确认

## 危险信号

**切勿：**

* 在测试失败的情况下继续
* 未验证结果测试就进行合并
* 未经确认就删除工作
* 未经明确请求就强制推送

**始终：**

* 在提供选项之前验证测试
* 准确呈现 4 个选项
* 获取选项 4 的输入确认
* 仅清理选项 1 和 4 的工作树

## 集成

**由以下调用：**

* **subagent-driven-development** (步骤 7) - 所有任务完成后
* **executing-plans** (步骤 5) - 所有批次完成后

**与以下配对：**

* **using-git-worktrees** - 清理由该技能创建的工作树
