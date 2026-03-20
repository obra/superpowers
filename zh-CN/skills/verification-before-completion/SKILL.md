---
name: verification-before-completion
description: 在准备声明工作完成、已修复或通过时使用，需在提交或创建PR之前运行验证命令并确认输出，然后才能做出任何成功声明；始终先提供证据再进行断言
---

# 完成前验证

## 概述

未经验证就声称工作已完成是不诚实，而非高效。

**核心原则：** 证据优先于声明，始终如此。

**违反此规则的字面意义即是违反其精神。**

## 铁律

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

如果你尚未运行此消息中的验证命令，就不能声称它通过了。

## 守门函数

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## 常见失败情况

| 声称 | 需要 | 不足够 |
|-------|----------|----------------|
| 测试通过 | 测试命令输出：0 失败 | 之前运行过、"应该能通过" |
| 代码检查通过 | 检查器输出：0 错误 | 部分检查、推断 |
| 构建成功 | 构建命令：退出码 0 | 检查器通过、日志看起来没问题 |
| Bug 已修复 | 原始症状测试：通过 | 代码已更改、假设已修复 |
| 回归测试有效 | 红绿循环已验证 | 测试通过一次 |
| 代理已完成 | 版本控制系统差异显示变更 | 代理报告"成功" |
| 需求已满足 | 逐项核对清单 | 测试通过 |

## 危险信号 - 立即停止

* 使用"应该"、"可能"、"似乎"
* 在验证前表达满意（"太好了！"、"完美！"、"完成了！"等）
* 即将提交/推送/创建拉取请求而未验证
* 信任代理的成功报告
* 依赖部分验证
* 认为"就这一次"
* 感到疲倦且希望工作结束
* **任何暗示成功但未运行验证的措辞**

## 防止合理化借口

| 借口 | 现实 |
|--------|---------|
| "现在应该能工作了" | **运行**验证 |
| "我有信心" | 信心 ≠ 证据 |
| "就这一次" | 没有例外 |
| "代码检查通过了" | 检查器 ≠ 编译器 |
| "代理说成功了" | 独立验证 |
| "我累了" | 疲惫 ≠ 借口 |
| "部分检查就够了" | 部分证明不了什么 |
| "措辞不同所以规则不适用" | 精神重于字面 |

## 关键模式

**测试：**

```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**回归测试（TDD 红绿循环）：**

```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without red-green verification)
```

**构建：**

```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

**需求：**

```
✅ Re-read plan → Create checklist → Verify each → Report gaps or completion
❌ "Tests pass, phase complete"
```

**代理委托：**

```
✅ Agent reports success → Check VCS diff → Verify changes → Report actual state
❌ Trust agent report
```

## 为何重要

基于 24 次失败记忆：

* 你的人类伙伴说"我不相信你" - 信任破裂
* 未定义的函数被发布 - 会导致崩溃
* 缺失的需求被发布 - 功能不完整
* 时间浪费在虚假的完成 → 重定向 → 返工
* 违反："诚实是核心价值观。如果你撒谎，你将被替换。"

## 何时应用

**在以下任何情况之前，始终应用：**

* 任何形式的成功/完成声明
* 任何满意度的表达
* 任何关于工作状态的正面陈述
* 提交、创建拉取请求、完成任务
* 转向下一项任务
* 委托给代理

**规则适用于：**

* 确切的措辞
* 释义和同义词
* 成功的暗示
* **任何**暗示完成/正确性的沟通

## 底线

**验证没有捷径。**

运行命令。阅读输出。**然后**声明结果。

这是不可协商的。
