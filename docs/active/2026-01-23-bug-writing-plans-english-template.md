# Bug: writing-plans 技能输出英文模板

## 基本信息
- 创建时间: 2026-01-23
- 优先级: 中
- 影响范围: 所有使用 writing-plans 技能的用户

## Bug 描述

在执行 `writing-plans` 技能时，生成的计划文档使用全英文模板，与 Horspowers 中文项目的定位不符。

## 问题根因

**模板不一致：**

`skills/writing-plans/SKILL.md` 第 32-45 行定义的 "Plan Document Header" 是全英文的：

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]
```

**而 `lib/docs-core.js` 第 627-661 行的 `getPlanTemplate()` 使用中文模板：**

```javascript
return `# ${featureName} 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: ${date}

## 目标

[一句话描述这个计划要实现什么]

## 架构方案

[2-3 句话说明实现方法]

## 技术栈

[关键技术/库]
```

## 影响范围

1. 用户按照 `writing-plans` 技能执行时，会生成英文模板的计划文档
2. 与项目整体中文定位不符
3. 与 `docs-core.js` 中的中文模板不一致

## 修复方案

### 方案 1: 更新 writing-plans 技能使用中文模板

将 `skills/writing-plans/SKILL.md` 中的 "Plan Document Header" 更新为中文版本：

```markdown
# [功能名称] 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: YYYY-MM-DD

**目标**: [一句话描述这个计划要实现什么]

**架构方案**: [2-3 句话说明实现方法]

**技术栈**: [关键技术/库]

---
```

### 方案 2: 使用 docs-core.js 的模板生成方法

在技能中指示使用 `docs-core.js` 的 `createPlanDocument()` 方法，而非手动写入模板。

## 验收标准

- [ ] `writing-plans` 技能中的模板更新为中文
- [ ] 与 `docs-core.js` 的 `getPlanTemplate()` 保持一致
- [ ] 测试 write-plan 输出中文模板

## 相关文件

- [skills/writing-plans/SKILL.md](../skills/writing-plans/SKILL.md)
- [lib/docs-core.js](../lib/docs-core.js)

## 进展记录

- 2026-01-23: Bug 创建 - 待修复
- 2026-01-23: 确认问题：技能模板与 docs-core.js 模板不一致
