# 第 4 轮：Claude 旧测试稳定化 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: 2026-04-28

## 目标

修复当前剩余的两个旧 Claude 语义测试不稳定点：`test-systematic-debugging.sh` 的偶发超时，以及 `test-subagent-driven-development.sh` 的旧副本/措辞脆弱性。

## 架构方案

本轮只改测试，不改 skill 功能代码。优先通过“显式读取当前工作区 skill 文件、缩短或聚焦提示词、放宽过窄断言词表、必要时提高单条提示超时”来稳定语义测试，并用定向重跑和 `full` suite 验证结果。

## 技术栈

Bash 测试脚本、Claude Code headless prompts、正则断言、Claude full suite

---

### Task 1: 稳定 systematic-debugging 旧测试

**Files:**
- Modify: `tests/claude-code/test-systematic-debugging.sh`

**Step 1: 锚定当前工作区 skill 文件**

将测试提示显式绑定到 `skills/systematic-debugging/SKILL.md`，避免读取已安装旧副本。

**Step 2: 修正最容易超时的验证提示**

重点处理 “verify fix” 这一问，必要时：
- 缩短问题
- 明确只从当前 skill 文件回答
- 适度提高该条 prompt 的 timeout

**Step 3: 定向验证**

Run:

```bash
bash tests/claude-code/test-systematic-debugging.sh
```

Expected:
- 定向测试通过

### Task 2: 稳定 subagent-driven-development 旧测试

**Files:**
- Modify: `tests/claude-code/test-subagent-driven-development.sh`

**Step 1: 锚定当前工作区 skill 文件**

让测试问题显式读取 `skills/subagent-driven-development/SKILL.md`，避免命中安装态旧副本。

**Step 2: 放宽脆弱断言并规避拒答触发**

重点处理：
- continuous execution 的措辞波动
- self-review checklist 的措辞波动
- spec reviewer mindset 的拒答/措辞波动

**Step 3: 定向验证**

Run:

```bash
bash tests/claude-code/test-subagent-driven-development.sh
```

Expected:
- 定向测试通过

### Task 3: 跑回归并收尾

**Files:**
- Review: `tests/claude-code/test-systematic-debugging.sh`
- Review: `tests/claude-code/test-subagent-driven-development.sh`

**Step 1: 跑定向测试**

Run:

```bash
bash tests/claude-code/test-systematic-debugging.sh
bash tests/claude-code/test-subagent-driven-development.sh
```

**Step 2: 跑 Claude full 套件**

Run:

```bash
bash tests/claude-code/run-skill-tests.sh --suite full
```

Expected:
- `STATUS: PASSED`
