---
name: receiving-code-review
description: 在收到代码审查反馈时使用，特别是在反馈看起来不清楚或技术上存在疑问的情况下——这需要技术上的严谨性和验证，而不是形式上的同意或盲目执行
---

# 代码审查接待指南

## 概述

代码审查需要技术评估，而非情感表演。

**核心原则：** 先验证，后实施。先询问，后假设。技术正确性高于社交舒适度。

## 回应模式

```
WHEN receiving code review feedback:

1. READ: Complete feedback without reacting
2. UNDERSTAND: Restate requirement in own words (or ask)
3. VERIFY: Check against codebase reality
4. EVALUATE: Technically sound for THIS codebase?
5. RESPOND: Technical acknowledgment or reasoned pushback
6. IMPLEMENT: One item at a time, test each
```

## 禁止的回应

**绝对不要：**

* “你说得完全对！”（明确违反 CLAUDE.md）
* “好观点！” / “出色的反馈！”（表演性回应）
* “我现在就来实现它”（未经验证前）

**应该：**

* 重述技术需求
* 提出澄清性问题
* 如果错误，用技术推理进行反驳
* 直接开始工作（行动胜于言辞）

## 处理不明确的反馈

```
IF any item is unclear:
  STOP - do not implement anything yet
  ASK for clarification on unclear items

WHY: Items may be related. Partial understanding = wrong implementation.
```

**示例：**

```
your human partner: "Fix 1-6"
You understand 1,2,3,6. Unclear on 4,5.

❌ WRONG: Implement 1,2,3,6 now, ask about 4,5 later
✅ RIGHT: "I understand items 1,2,3,6. Need clarification on 4 and 5 before proceeding."
```

## 按来源处理

### 来自你的合作伙伴（人类）

* **信任** - 理解后实施
* **如果范围不明确，仍需询问**
* **不要进行表演性同意**
* **直接行动**或进行技术确认

### 来自外部审查者

```
BEFORE implementing:
  1. Check: Technically correct for THIS codebase?
  2. Check: Breaks existing functionality?
  3. Check: Reason for current implementation?
  4. Check: Works on all platforms/versions?
  5. Check: Does reviewer understand full context?

IF suggestion seems wrong:
  Push back with technical reasoning

IF can't easily verify:
  Say so: "I can't verify this without [X]. Should I [investigate/ask/proceed]?"

IF conflicts with your human partner's prior decisions:
  Stop and discuss with your human partner first
```

**你的合作伙伴的规则：** “外部反馈——保持怀疑，但仔细检查”

## 对“专业”功能的 YAGNI 检查

```
IF reviewer suggests "implementing properly":
  grep codebase for actual usage

  IF unused: "This endpoint isn't called. Remove it (YAGNI)?"
  IF used: Then implement properly
```

**你的合作伙伴的规则：** “你和审查者都向我汇报。如果我们不需要这个功能，就不要添加它。”

## 实施顺序

```
FOR multi-item feedback:
  1. Clarify anything unclear FIRST
  2. Then implement in this order:
     - Blocking issues (breaks, security)
     - Simple fixes (typos, imports)
     - Complex fixes (refactoring, logic)
  3. Test each fix individually
  4. Verify no regressions
```

## 何时进行反驳

在以下情况下进行反驳：

* 建议会破坏现有功能
* 审查者缺乏完整上下文
* 违反 YAGNI（未使用的功能）
* 在当前技术栈中技术上不正确
* 存在遗留/兼容性原因
* 与你的合作伙伴的架构决策相冲突

**如何反驳：**

* 使用技术推理，而非防御性态度
* 提出具体问题
* 引用有效的测试/代码
* 如果涉及架构，请让你的合作伙伴参与

**如果因公开反驳感到不适，请发出信号：** “Circle K 那边有点不对劲”

## 确认正确的反馈

当反馈**确实**正确时：

```
✅ "Fixed. [Brief description of what changed]"
✅ "Good catch - [specific issue]. Fixed in [location]."
✅ [Just fix it and show in the code]

❌ "You're absolutely right!"
❌ "Great point!"
❌ "Thanks for catching that!"
❌ "Thanks for [anything]"
❌ ANY gratitude expression
```

**为何不道谢：** 行动胜于言表。直接修复它。代码本身就表明你听到了反馈。

**如果你发现自己正要写“谢谢”：** 删除它。改为陈述修复内容。

## 优雅地纠正你的反驳

如果你反驳了，但你是错的：

```
✅ "You were right - I checked [X] and it does [Y]. Implementing now."
✅ "Verified this and you're correct. My initial understanding was wrong because [reason]. Fixing."

❌ Long apology
❌ Defending why you pushed back
❌ Over-explaining
```

客观地陈述更正并继续。

## 常见错误

| 错误 | 修正方法 |
|---------|-----|
| 表演性同意 | 陈述需求或直接行动 |
| 盲目实施 | 先对照代码库验证 |
| 批量处理而不测试 | 一次一个，逐个测试 |
| 假设审查者是对的 | 检查是否会破坏东西 |
| 避免反驳 | 技术正确性 > 舒适度 |
| 部分实施 | 先澄清所有事项 |
| 无法验证，仍继续 | 说明局限性，请求指示 |

## 真实示例

**表演性同意（错误）：**

```
Reviewer: "Remove legacy code"
❌ "You're absolutely right! Let me remove that..."
```

**技术验证（正确）：**

```
Reviewer: "Remove legacy code"
✅ "Checking... build target is 10.15+, this API needs 13+. Need legacy for backward compat. Current impl has wrong bundle ID - fix it or drop pre-13 support?"
```

**YAGNI（正确）：**

```
Reviewer: "Implement proper metrics tracking with database, date filters, CSV export"
✅ "Grepped codebase - nothing calls this endpoint. Remove it (YAGNI)? Or is there usage I'm missing?"
```

**不明确的项目（正确）：**

```
your human partner: "Fix items 1-6"
You understand 1,2,3,6. Unclear on 4,5.
✅ "Understand 1,2,3,6. Need clarification on 4 and 5 before implementing."
```

## GitHub 线程回复

当回复 GitHub 上的行内审查评论时，请在评论线程中回复（`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`），而不是作为 PR 的顶级评论。

## 底线

**外部反馈 = 需要评估的建议，而非必须遵循的命令。**

验证。质疑。然后实施。

不要表演性同意。始终保持技术严谨性。
