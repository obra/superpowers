---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code. 中文触发场景：当用户说'帮我写个实施计划'、'怎么实现这个功能？'、'制定开发计划'、'需要详细规划一下'等需要编写实施计划时使用此技能。
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "我正在使用编写计划技能来创建实施计划..." (I'm using the writing-plans skill to create the implementation plan...)

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header (中文模板):**

```markdown
# [功能名称] 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use horspowers:executing-plans to implement this plan task-by-task.

**日期**: YYYY-MM-DD

## 目标

[一句话描述这个计划要实现什么]

## 架构方案

[2-3 句话说明实现方法]

## 技术栈

[关键技术/库]

---
```

## Task Structure

```markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
```

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD, frequent commits

## Documentation Integration

Before offering execution choice, check if documentation is enabled:

IF `.superpowers-config.yaml` exists AND `documentation.enabled: true`:

  **Step 1: Search related documents (输入文档上下文):**
  Run: Search `docs/plans/` for related design documents
  Purpose: 读取设计文档（如果存在），理解设计决策

  **Step 2: Create plan document (静态参考):**
  Save: `docs/plans/YYYY-MM-DD-<feature-name>.md`
  Format: 使用 plan 模板（保持原有格式）

  **Step 3: Create task tracking document (动态追踪):**
  ```bash
  # 创建任务文档并捕获路径
  TASK_DOC=$(node -e "
  const DocsCore = require('./lib/docs-core.js');
  const manager = new DocsCore(process.cwd());

  // 构建相关文档链接
  const planFileName = '${date}-${featureSlug}.md';
  let relatedDocs = { plan: planFileName };

  // 如果存在 design 文档，添加到相关文档
  // (需要在搜索步骤中找到 design 文档路径)

  const result = manager.createActiveDocument('task', 'Implement: [feature-name]', null, relatedDocs);

  console.log(result.path);
  ")
  echo "Created task document: $TASK_DOC"
  export TASK_DOC
  ```

  **Step 4: Set active task for progress tracking:**
  ```bash
  # 设置活跃任务，供后续技能使用
  node -e "
  const DocsCore = require('./lib/docs-core.js');
  const manager = new DocsCore(process.cwd());
  manager.setActiveTask('$TASK_DOC', 'task');
  "
  ```

  **In the created task document, ensure:**
  - ## 任务描述: [来自计划的实施步骤概述]
  - ## 相关文档:
    - `- 计划文档: [../plans/YYYY-MM-DD-<feature>.md](../plans/YYYY-MM-DD-<feature>.md)`
    - `- 设计文档: [../plans/YYYY-MM-DD-design-<topic>.md](../plans/YYYY-MM-DD-design-<topic>.md)` (如果存在)
  - ## 实施计划: [拆解的具体任务列表，可引用计划中的步骤]
  - ## 验收标准: [如何验证任务完成]
  - ## 进展记录: [初始化为"待开始"]

  **Step 5: Check core document count (复杂度控制):**
  ```bash
  # 检查核心文档数量
  node -e "
  const DocsCore = require('./lib/docs-core.js');
  const manager = new DocsCore(process.cwd());
  const count = manager.countCoreDocs('[feature-name]');
  console.log('Core documents:', count.total);
  if (count.warning) {
    console.warn('WARNING:', count.warning);
  }
  "
  ```

  IF core document count > 3:
    WARN user: "当前核心文档数量为 ${count.total} 个，超过了建议的 3 个上限。建议检查是否所有文档都是必需的。"

  Store the document path as `$TASK_DOC` for progress tracking throughout implementation.

## Execution Handoff

After saving the plan (and creating task doc if enabled), offer execution choice:

**"计划已完成并保存到 `docs/plans/<filename>.md`。两种执行方式：**

**1. 子代理驱动（当前会话）** - 我为每个任务分派新的子代理，任务间进行审查，快速迭代

**2. 并行会话（独立）** - 在新会话中使用 executing-plans 批量执行，有检查点

**选择哪种方式？"** (Which approach?)

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use horspowers:subagent-driven-development
- Stay in this session
- Fresh subagent per task + code review

**If Parallel Session chosen:**
- Guide them to open new session in worktree
- **REQUIRED SUB-SKILL:** New session uses horspowers:executing-plans
