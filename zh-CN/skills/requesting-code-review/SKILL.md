---
name: requesting-code-review
description: 用于完成任务、实现主要功能或合并前验证工作是否符合要求时使用
---

# 请求代码审查

调度 superpowers:code-reviewer 子代理以在问题蔓延前将其捕获。审查者会获得精心构建的评估上下文——绝不会是你会话的历史记录。这能让审查者专注于工作成果，而非你的思考过程，并为你自己的后续工作保留上下文。

**核心原则：** 早审查，常审查。

## 何时请求审查

**强制情况：**

* 在子代理驱动开发的每项任务之后
* 完成主要功能后
* 合并到主分支前

**可选但很有价值：**

* 遇到瓶颈时（获取新视角）
* 重构之前（基线检查）
* 修复复杂错误后

## 如何请求

**1. 获取 git SHA：**

```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. 调度 code-reviewer 子代理：**

使用 Task 工具，类型为 superpowers:code-reviewer，填写位于 `code-reviewer.md` 的模板

**占位符说明：**

* `{WHAT_WAS_IMPLEMENTED}` - 你刚刚构建了什么
* `{PLAN_OR_REQUIREMENTS}` - 它应该做什么
* `{BASE_SHA}` - 起始提交
* `{HEAD_SHA}` - 结束提交
* `{DESCRIPTION}` - 简要总结

**3. 处理反馈：**

* 立即修复 关键 问题
* 在继续之前修复 重要 问题
* 记录 次要 问题稍后处理
* 如果审查者有误，请提出反驳（并附上理由）

## 示例

```
[已完成任务 2：添加验证功能]

你：让我在继续之前请求代码审查。

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[调度 superpowers:code-reviewer 子代理]
  WHAT_WAS_IMPLEMENTED: 对话索引的验证和修复功能
  PLAN_OR_REQUIREMENTS: 来自 docs/superpowers/plans/deployment-plan.md 的任务 2
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: 添加了包含 4 种问题类型的 verifyIndex() 和 repairIndex()

[子代理返回]：
  优点：架构清晰，包含真实测试
  问题：
    重要：缺少进度指示器
    次要：报告间隔使用魔数 (100)
  评估：可以继续

你：[修复进度指示器]
[继续任务 3]
```

## 与工作流的集成

**子代理驱动开发：**

* 在 每项 任务后审查
* 在问题累积前将其捕获
* 在进入下一任务前修复

**执行计划时：**

* 每批（3项任务）后审查
* 获取反馈，应用，继续

**临时开发：**

* 合并前审查
* 遇到瓶颈时审查

## 危险信号

**切勿：**

* 因为“很简单”而跳过审查
* 忽视 关键 问题
* 带着未修复的 重要 问题继续
* 与有效的技术反馈争论

**如果审查者有误：**

* 用技术推理提出反驳
* 展示证明其有效的代码/测试
* 请求澄清

模板见：requesting-code-review/code-reviewer.md
