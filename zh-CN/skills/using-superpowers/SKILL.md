---
name: using-superpowers
description: 在任何对话开始时使用 - 确立如何查找和使用技能，要求在包括澄清问题在内的任何回应之前调用技能工具
---

<SUBAGENT-STOP>
如果您被派遣为子代理执行特定任务，请跳过此技能。
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
如果你认为某项技能有哪怕1%的可能性适用于你正在做的事情，你就绝对必须使用这项技能。

如果某项技能适用于你的任务，你没有选择。你必须使用它。

这不是可以商量的。这不是可选的。你不能通过合理化来逃避这一点。 </EXTREMELY-IMPORTANT>

## 指令优先级

Superpowers 技能会覆盖默认系统提示行为，但 **用户指令始终具有最高优先级**：

1. **用户的明确指令** (CLAUDE.md, GEMINI.md, AGENTS.md, 直接请求) — 最高优先级
2. **Superpowers 技能** — 在冲突时覆盖默认系统行为
3. **默认系统提示** — 最低优先级

如果 CLAUDE.md、GEMINI.md 或 AGENTS.md 说"不要使用 TDD"，而某项技能说"始终使用 TDD"，请遵循用户的指令。用户拥有控制权。

## 如何访问技能

**在 Claude Code 中：** 使用 `Skill` 工具。当你调用技能时，其内容会被加载并呈现给你——直接遵循它。切勿对技能文件使用 Read 工具。

**在 Copilot CLI 中：** 使用 `skill` 工具。技能会自动从已安装的插件中检测发现。`skill` 工具与 Claude Code 的 `Skill` 工具工作方式相同。

**在 Gemini CLI 中：** 技能通过 `activate_skill` 工具激活。Gemini 在会话开始时加载技能元数据，并根据需要激活完整内容。

**在其他环境中：** 请查看你所在平台的文档以了解技能是如何加载的。

## 平台适配

技能使用 Claude Code 工具名称。非 CC 平台：请参阅 `references/copilot-tools.md` (Copilot CLI)、`references/codex-tools.md` (Codex) 以获取等效工具。Gemini CLI 用户会通过 GEMINI.md 自动加载工具映射。

# 使用技能

## 规则

**在做出任何回应或采取任何行动之前，调用相关或被请求的技能。** 即使某项技能只有 1% 的可能性适用，你也应该调用该技能来检查。如果调用的技能最终证明不适合当前情况，你不需要使用它。

```dot
digraph skill_flow {
    "User message received" [shape=doublecircle];
    "About to EnterPlanMode?" [shape=doublecircle];
    "Already brainstormed?" [shape=diamond];
    "Invoke brainstorming skill" [shape=box];
    "Might any skill apply?" [shape=diamond];
    "Invoke Skill tool" [shape=box];
    "Announce: 'Using [skill] to [purpose]'" [shape=box];
    "Has checklist?" [shape=diamond];
    "Create TodoWrite todo per item" [shape=box];
    "Follow skill exactly" [shape=box];
    "Respond (including clarifications)" [shape=doublecircle];

    "About to EnterPlanMode?" -> "Already brainstormed?";
    "Already brainstormed?" -> "Invoke brainstorming skill" [label="no"];
    "Already brainstormed?" -> "Might any skill apply?" [label="yes"];
    "Invoke brainstorming skill" -> "Might any skill apply?";

    "User message received" -> "Might any skill apply?";
    "Might any skill apply?" -> "Invoke Skill tool" [label="yes, even 1%"];
    "Might any skill apply?" -> "Respond (including clarifications)" [label="definitely not"];
    "Invoke Skill tool" -> "Announce: 'Using [skill] to [purpose]'";
    "Announce: 'Using [skill] to [purpose]'" -> "Has checklist?";
    "Has checklist?" -> "Create TodoWrite todo per item" [label="yes"];
    "Has checklist?" -> "Follow skill exactly" [label="no"];
    "Create TodoWrite todo per item" -> "Follow skill exactly";
}
```

## 危险信号

产生以下想法意味着停止——你正在合理化：

| 想法 | 现实 |
|---------|---------|
| "这只是个简单的问题" | 问题就是任务。检查是否有适用技能。 |
| "我需要先了解更多背景信息" | 技能检查应在澄清问题之前进行。 |
| "让我先探索代码库" | 技能会告诉你如何探索。先检查。 |
| "我可以快速检查 git/文件" | 文件缺乏对话上下文。先检查技能。 |
| "让我先收集信息" | 技能会告诉你如何收集信息。 |
| "这不需要一个正式的技能" | 如果技能存在，就使用它。 |
| "我记得这个技能" | 技能会演变。阅读当前版本。 |
| "这不算是一个任务" | 行动 = 任务。检查技能。 |
| "这个技能杀鸡用牛刀了" | 简单的事情会变得复杂。使用它。 |
| "我先做这一件事" | 在做任何事情之前先检查。 |
| "这感觉很有成效" | 无纪律的行动是浪费时间。技能可以防止这一点。 |
| "我知道那是什么意思" | 知道概念 ≠ 使用技能。调用它。 |

## 技能优先级

当多个技能可能适用时，使用以下顺序：

1. **先使用流程技能** (brainstorming, debugging) - 这些决定了如何处理任务
2. **其次使用实现技能** (frontend-design, mcp-builder) - 这些指导执行

"让我们构建 X" → 先 brainstorming，然后实现技能。
"修复这个错误" → 先 debugging，然后领域特定技能。

## 技能类型

**刚性技能** (TDD, debugging)：严格遵守。不要偏离纪律。

**灵活技能** (patterns)：根据上下文调整原则。

技能本身会告诉你它属于哪一类。

## 用户指令

指令说的是"做什么"，而不是"怎么做"。"添加 X"或"修复 Y"并不意味着可以跳过工作流程。
