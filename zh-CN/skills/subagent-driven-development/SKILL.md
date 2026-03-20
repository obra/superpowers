---
name: subagent-driven-development
description: 在当前会话中执行具有独立任务的实施计划时使用
---

# 子代理驱动开发

通过为每个任务派遣新的子代理来执行计划，每个任务后进行两阶段评审：先进行规范符合性评审，再进行代码质量评审。

**为何使用子代理：** 你将任务委托给具有独立上下文的专业代理。通过精确设计其指令和上下文，确保他们保持专注并成功完成任务。他们绝不应继承你会话的上下文或历史记录——你只构建他们所需的确切内容。这也为你自己的协调工作保留了上下文。

**核心原则：** 每个任务使用新的子代理 + 两阶段评审（先规范后质量）= 高质量、快速迭代

## 何时使用

```dot
digraph when_to_use {
    "Have implementation plan?" [shape=diamond];
    "Tasks mostly independent?" [shape=diamond];
    "Stay in this session?" [shape=diamond];
    "subagent-driven-development" [shape=box];
    "executing-plans" [shape=box];
    "Manual execution or brainstorm first" [shape=box];

    "Have implementation plan?" -> "Tasks mostly independent?" [label="yes"];
    "Have implementation plan?" -> "Manual execution or brainstorm first" [label="no"];
    "Tasks mostly independent?" -> "Stay in this session?" [label="yes"];
    "Tasks mostly independent?" -> "Manual execution or brainstorm first" [label="no - tightly coupled"];
    "Stay in this session?" -> "subagent-driven-development" [label="yes"];
    "Stay in this session?" -> "executing-plans" [label="no - parallel session"];
}
```

**对比执行计划（并行会话）：**

* 同一会话（无需切换上下文）
* 每个任务使用新的子代理（无上下文污染）
* 每个任务后进行两阶段评审：先进行规范符合性评审，再进行代码质量评审
* 迭代更快（任务之间无需人工介入）

## 流程

```dot
digraph process {
    rankdir=TB;

    subgraph cluster_per_task {
        label="Per Task";
        "Dispatch implementer subagent (./implementer-prompt.md)" [shape=box];
        "Implementer subagent asks questions?" [shape=diamond];
        "Answer questions, provide context" [shape=box];
        "Implementer subagent implements, tests, commits, self-reviews" [shape=box];
        "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [shape=box];
        "Spec reviewer subagent confirms code matches spec?" [shape=diamond];
        "Implementer subagent fixes spec gaps" [shape=box];
        "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [shape=box];
        "Code quality reviewer subagent approves?" [shape=diamond];
        "Implementer subagent fixes quality issues" [shape=box];
        "Mark task complete in TodoWrite" [shape=box];
    }

    "Read plan, extract all tasks with full text, note context, create TodoWrite" [shape=box];
    "More tasks remain?" [shape=diamond];
    "Dispatch final code reviewer subagent for entire implementation" [shape=box];
    "Use superpowers:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

    "Read plan, extract all tasks with full text, note context, create TodoWrite" -> "Dispatch implementer subagent (./implementer-prompt.md)";
    "Dispatch implementer subagent (./implementer-prompt.md)" -> "Implementer subagent asks questions?";
    "Implementer subagent asks questions?" -> "Answer questions, provide context" [label="yes"];
    "Answer questions, provide context" -> "Dispatch implementer subagent (./implementer-prompt.md)";
    "Implementer subagent asks questions?" -> "Implementer subagent implements, tests, commits, self-reviews" [label="no"];
    "Implementer subagent implements, tests, commits, self-reviews" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)";
    "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" -> "Spec reviewer subagent confirms code matches spec?";
    "Spec reviewer subagent confirms code matches spec?" -> "Implementer subagent fixes spec gaps" [label="no"];
    "Implementer subagent fixes spec gaps" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [label="re-review"];
    "Spec reviewer subagent confirms code matches spec?" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="yes"];
    "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" -> "Code quality reviewer subagent approves?";
    "Code quality reviewer subagent approves?" -> "Implementer subagent fixes quality issues" [label="no"];
    "Implementer subagent fixes quality issues" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="re-review"];
    "Code quality reviewer subagent approves?" -> "Mark task complete in TodoWrite" [label="yes"];
    "Mark task complete in TodoWrite" -> "More tasks remain?";
    "More tasks remain?" -> "Dispatch implementer subagent (./implementer-prompt.md)" [label="yes"];
    "More tasks remain?" -> "Dispatch final code reviewer subagent for entire implementation" [label="no"];
    "Dispatch final code reviewer subagent for entire implementation" -> "Use superpowers:finishing-a-development-branch";
}
```

## 模型选择

使用能够胜任每个角色的最小能力模型，以节约成本并提高速度。

**机械性实现任务**（独立的函数、明确的规范、1-2个文件）：使用快速、廉价的模型。当计划制定明确时，大多数实现任务都是机械性的。

**集成和判断任务**（多文件协调、模式匹配、调试）：使用标准模型。

**架构、设计和评审任务**：使用可用的最强大模型。

**任务复杂性信号：**

* 涉及1-2个文件且有完整规范 → 廉价模型
* 涉及多个文件且有集成问题 → 标准模型
* 需要设计判断或广泛的代码库理解 → 最强大模型

## 处理实现者状态

实现者子代理报告四种状态之一。请适当处理每种状态：

**完成：** 继续进行规范符合性评审。

**完成但有顾虑：** 实现者完成了工作，但标记了疑虑。在继续之前阅读这些顾虑。如果顾虑涉及正确性或范围，请在评审前解决它们。如果它们是观察性意见（例如，“这个文件变得很大”），记下它们并继续进行评审。

**需要上下文：** 实现者需要未提供的信息。提供缺失的上下文并重新派遣。

**受阻：** 实现者无法完成任务。评估阻碍因素：

1. 如果是上下文问题，提供更多上下文并用同一模型重新派遣
2. 如果任务需要更多推理，用更强大的模型重新派遣
3. 如果任务太大，将其分解为更小的部分
4. 如果计划本身有误，上报给人类

**切勿** 忽略上报或在不做任何更改的情况下强制同一模型重试。如果实现者表示受阻，则必须做出某些改变。

## 提示词模板

* `./implementer-prompt.md` - 派遣实现者子代理
* `./spec-reviewer-prompt.md` - 派遣规范符合性评审者子代理
* `./code-quality-reviewer-prompt.md` - 派遣代码质量评审者子代理

## 示例工作流

```
You: I'm using Subagent-Driven Development to execute this plan.

[Read plan file once: docs/superpowers/plans/feature-plan.md]
[Extract all 5 tasks with full text and context]
[Create TodoWrite with all tasks]

Task 1: Hook installation script

[Get Task 1 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: "Before I begin - should the hook be installed at user or system level?"

You: "User level (~/.config/superpowers/hooks/)"

Implementer: "Got it. Implementing now..."
[Later] Implementer:
  - Implemented install-hook command
  - Added tests, 5/5 passing
  - Self-review: Found I missed --force flag, added it
  - Committed

[Dispatch spec compliance reviewer]
Spec reviewer: ✅ Spec compliant - all requirements met, nothing extra

[Get git SHAs, dispatch code quality reviewer]
Code reviewer: Strengths: Good test coverage, clean. Issues: None. Approved.

[Mark Task 1 complete]

Task 2: Recovery modes

[Get Task 2 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: [No questions, proceeds]
Implementer:
  - Added verify/repair modes
  - 8/8 tests passing
  - Self-review: All good
  - Committed

[Dispatch spec compliance reviewer]
Spec reviewer: ❌ Issues:
  - Missing: Progress reporting (spec says "report every 100 items")
  - Extra: Added --json flag (not requested)

[Implementer fixes issues]
Implementer: Removed --json flag, added progress reporting

[Spec reviewer reviews again]
Spec reviewer: ✅ Spec compliant now

[Dispatch code quality reviewer]
Code reviewer: Strengths: Solid. Issues (Important): Magic number (100)

[Implementer fixes]
Implementer: Extracted PROGRESS_INTERVAL constant

[Code reviewer reviews again]
Code reviewer: ✅ Approved

[Mark Task 2 complete]

...

[After all tasks]
[Dispatch final code-reviewer]
Final reviewer: All requirements met, ready to merge

Done!
```

## 优势

**对比手动执行：**

* 子代理自然遵循测试驱动开发
* 每个任务都有新的上下文（无混淆）
* 支持并行安全（子代理互不干扰）
* 子代理可以提问（在工作开始前和工作期间）

**对比执行计划：**

* 同一会话（无需交接）
* 持续进展（无需等待）
* 评审检查点自动进行

**效率提升：**

* 无文件读取开销（控制器提供完整文本）
* 控制器精心策划所需的确切上下文
* 子代理一开始就获得完整信息
* 问题在工作开始前就浮出水面（而非之后）

**质量关卡：**

* 自评审在交接前发现问题
* 两阶段评审：规范符合性，然后代码质量
* 评审循环确保修复实际有效
* 规范符合性防止过度构建或构建不足
* 代码质量确保实现构建良好

**成本：**

* 更多的子代理调用（每个任务：实现者 + 2名评审者）
* 控制器做更多准备工作（提前提取所有任务）
* 评审循环增加了迭代次数
* 但能及早发现问题（比后期调试更便宜）

## 危险信号

**切勿：**

* 未经用户明确同意就在主分支上开始实现
* 跳过评审（规范符合性或代码质量）
* 带着未修复的问题继续
* 并行派遣多个实现子代理（冲突）
* 让子代理读取计划文件（应提供完整文本）
* 跳过场景设定上下文（子代理需要理解任务所处位置）
* 忽略子代理的问题（在让他们继续之前回答）
* 在规范符合性上接受“差不多就行”（规范评审者发现问题 = 未完成）
* 跳过评审循环（评审者发现问题 = 实现者修复 = 再次评审）
* 让实现者自评审取代实际评审（两者都需要）
* **在规范符合性评审通过前开始代码质量评审**（顺序错误）
* 在任一评审仍有未解决问题时转向下一个任务

**如果子代理提问：**

* 清晰完整地回答
* 必要时提供额外上下文
* 不要催促他们进入实现阶段

**如果评审者发现问题：**

* 由实现者（同一子代理）修复它们
* 评审者再次评审
* 重复直至批准
* 不要跳过重新评审

**如果子代理任务失败：**

* 派遣修复子代理并给出具体指令
* 不要尝试手动修复（上下文污染）

## 集成

**必需的工作流技能：**

* **superpowers:using-git-worktrees** - **必需**：在开始前设置独立的工作空间
* **superpowers:writing-plans** - 创建此技能执行的计划
* **superpowers:requesting-code-review** - 用于评审者子代理的代码评审模板
* **superpowers:finishing-a-development-branch** - 在所有任务完成后完成开发

**子代理应使用：**

* **superpowers:test-driven-development** - 子代理为每个任务遵循测试驱动开发

**替代工作流：**

* **superpowers:executing-plans** - 用于并行会话而非同一会话执行
