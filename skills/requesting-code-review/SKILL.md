---
name: requesting-code-review
description: 在完成任务、实现主要功能或合并前使用，以验证工作是否满足需求
---

# 请求代码审查

派遣 superpowers:code-reviewer 子代理，在问题扩散之前及时发现。

**核心原则：** 尽早审查，频繁审查。

## 何时请求审查

**必须审查：**
- 在子代理驱动开发中完成每个任务后
- 完成主要功能后
- 合并到 main 分支前

**可选但有价值：**
- 遇到困难时（获取新视角）
- 重构前（基线检查）
- 修复复杂 bug 后

## 如何请求

**1. 获取 git SHA：**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # 或 origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. 派遣 code-reviewer 子代理：**

使用 Task 工具，类型为 superpowers:code-reviewer，填写 `code-reviewer.md` 中的模板

**占位符：**
- `{WHAT_WAS_IMPLEMENTED}` - 你刚刚构建的内容
- `{PLAN_OR_REQUIREMENTS}` - 预期功能
- `{BASE_SHA}` - 起始提交
- `{HEAD_SHA}` - 结束提交
- `{DESCRIPTION}` - 简要摘要

**3. 处理反馈：**
- 立即修复严重（Critical）问题
- 在继续之前修复重要（Important）问题
- 记录次要（Minor）问题留待后续处理
- 如果审查者有误，提出异议（附带理由）

## 示例

```
[刚刚完成任务 2：添加验证功能]

你：让我在继续之前请求代码审查。

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[派遣 superpowers:code-reviewer 子代理]
  WHAT_WAS_IMPLEMENTED: 会话索引的验证和修复功能
  PLAN_OR_REQUIREMENTS: docs/plans/deployment-plan.md 中的任务 2
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: 添加了 verifyIndex() 和 repairIndex()，支持 4 种问题类型

[子代理返回]：
  优点：架构清晰，测试真实有效
  问题：
    重要：缺少进度指示器
    次要：用于报告间隔的魔法数字（100）
  评估：可以继续推进

你：[修复进度指示器]
[继续任务 3]
```

## 与工作流的集成

**子代理驱动开发：**
- 每个任务完成后审查
- 在问题累积之前发现
- 修复后再进入下一个任务

**执行计划：**
- 每批次（3 个任务）后审查
- 获取反馈，应用修改，继续推进

**临时开发：**
- 合并前审查
- 遇到困难时审查

## 危险信号

**绝不要：**
- 因为"很简单"而跳过审查
- 忽略严重（Critical）问题
- 在未修复重要（Important）问题的情况下继续推进
- 与合理的技术反馈争辩

**如果审查者有误：**
- 用技术理由提出异议
- 展示证明其正常运行的代码/测试
- 请求澄清

参见模板：requesting-code-review/code-reviewer.md
