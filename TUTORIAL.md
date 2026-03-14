# Superpowers 功能速查教程

Superpowers 是一套给 AI 编程助手用的工作流技能库，安装后**技能自动触发**，无需手动调用。

---

## 安装

```bash
# Claude Code
/plugin install superpowers@claude-plugins-official

# Cursor
/add-plugin superpowers

# Gemini CLI
gemini extensions install https://github.com/obra/superpowers
```

---

## 核心工作流（按顺序触发）

| # | 技能 | 一句话 | 触发范例 |
|---|------|--------|----------|
| 1 | **brainstorming** | 写代码前先通过苏格拉底式问答把需求搞清楚，生成设计文档。 | "帮我做一个用户登录功能" |
| 2 | **using-git-worktrees** | 设计确认后自动创建隔离分支，保持主分支干净。 | 设计文档批准后自动触发 |
| 3 | **writing-plans** | 把设计拆成 2-5 分钟一个的任务，每个任务含文件路径、完整代码和验证步骤。 | "按这个设计写实现计划" |
| 4 | **subagent-driven-development** | 每个任务派一个独立子 agent 实现，经过规格检查+代码质量两轮审查。 | 计划确认后自动触发 |
| 5 | **test-driven-development** | 强制 RED→GREEN→REFACTOR 循环，先写失败的测试再写实现。 | 任何实现任务开始时触发 |
| 6 | **requesting-code-review** | 每个任务完成后对照计划做代码审查，严重问题阻断继续。 | 任务完成后自动触发 |
| 7 | **finishing-a-development-branch** | 所有任务完成后，提供 merge/PR/保留/丢弃选项并清理 worktree。 | "所有任务都完成了" |

---

## 其他技能

| 技能 | 一句话 | 触发范例 |
|------|--------|----------|
| **systematic-debugging** | 用 4 阶段方法（假设→隔离→验证→修复）系统排查 bug，拒绝凭感觉猜。 | "这个测试一直失败，帮我查" |
| **verification-before-completion** | 在宣布"修好了"之前强制跑测试验证，不允许仅凭逻辑推断说修复成功。 | "我觉得这个 bug 应该修好了" |
| **executing-plans** | 分批执行计划，每批后设置人工检查点（适合不想完全自动化的场景）。 | "一步一步执行这个计划" |
| **dispatching-parallel-agents** | 把独立任务并发派给多个子 agent 同时执行，加速开发。 | "这几个模块互不依赖，并行做" |
| **receiving-code-review** | 收到代码审查后，按优先级逐条处理反馈，不遗漏。 | 收到 PR review 后触发 |
| **writing-skills** | 按最佳实践创建新技能文件，并用子 agent 测试技能效果。 | "帮我写一个新的 skill" |

---

## 典型完整流程示例

```
你：我想做一个 TODO 应用，支持标签和截止日期

Agent：（brainstorming）让我先问几个问题：
       1. 需要多用户吗？
       2. 数据存本地还是云端？
       ...确认设计后保存 design.md

Agent：（using-git-worktrees）已在 feature/todo-app 分支创建 worktree

Agent：（writing-plans）已拆分为 8 个任务，最长单任务 4 分钟

Agent：（subagent-driven-development）
       任务 1/8：子 agent 实现 Todo 数据模型...
       → 规格审查通过 ✓
       → 代码质量审查通过 ✓
       任务 2/8：...

Agent：（finishing-a-development-branch）
       所有测试通过。选择：[merge] [PR] [keep] [discard]
```

---

> **核心理念**：不猜、不跳步、先测试、用子 agent 并行、完成才算完成。
