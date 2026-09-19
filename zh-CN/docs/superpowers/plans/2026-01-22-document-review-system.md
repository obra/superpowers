# 文档评审系统实施计划

> **对于智能体工作者：** 必需：使用 superpowers：子智能体驱动开发（如果子智能体可用）或 superpowers：执行计划来实现此计划。

**目标：** 为头脑风暴和编写计划技能添加规范和计划文档评审循环。

**架构：** 在每个技能目录中创建评审者提示模板。修改技能文件以在文档创建后添加评审循环。使用 Task 工具和通用子智能体进行评审者调度。

**技术栈：** Markdown 技能文件，通过 Task 工具进行子智能体调度

**规范：** docs/superpowers/specs/2026-01-22-document-review-system-design.md

***

## 模块 1：规范文档评审者

此模块将规范文档评审者添加到头脑风暴技能中。

### 任务 1：创建规范文档评审者提示模板

**文件：**

* 创建：`skills/brainstorming/spec-document-reviewer-prompt.md`

* \[ ] **步骤 1：** 创建评审者提示模板文件

```markdown
# 规格文档审阅者提示模板

在派发规格文档审阅者子代理时使用此模板。

**目的：** 验证规格是否完整、一致，并已准备好进行实施规划。

**派发时机：** 规格文档已写入 docs/superpowers/specs/
```

Task 工具（通用）：
description: "评审规范文档"
prompt: |
您是一名规范文档评审者。请验证此规范是否完整并已准备好进行规划。

```
**Spec to review:** [SPEC_FILE_PATH]

## What to Check

| Category | What to Look For |
|----------|------------------|
| Completeness | TODOs, placeholders, "TBD", incomplete sections |
| Coverage | Missing error handling, edge cases, integration points |
| Consistency | Internal contradictions, conflicting requirements |
| Clarity | Ambiguous requirements |
| YAGNI | Unrequested features, over-engineering |

## CRITICAL

Look especially hard for:
- Any TODO markers or placeholder text
- Sections saying "to be defined later" or "will spec when X is done"
- Sections noticeably less detailed than others

## Output Format

## Spec Review

**Status:** ✅ Approved | ❌ Issues Found

**Issues (if any):**
- [Section X]: [specific issue] - [why it matters]

**Recommendations (advisory):**
- [suggestions that don't block approval]
```

```
**审阅者返回：** 状态，问题（如有），建议
```

* \[ ] **步骤 2：** 验证文件是否正确创建

运行：`cat skills/brainstorming/spec-document-reviewer-prompt.md | head -20`
预期：显示标题和目的部分

* \[ ] **步骤 3：** 提交

```bash
git add skills/brainstorming/spec-document-reviewer-prompt.md
git commit -m "feat: add spec document reviewer prompt template"
```

***

### 任务 2：将评审循环添加到头脑风暴技能

**文件：**

* 修改：`skills/brainstorming/SKILL.md`

* \[ ] **步骤 1：** 读取当前的头脑风暴技能

运行：`cat skills/brainstorming/SKILL.md`

* \[ ] **步骤 2：** 在“设计之后”部分后添加评审循环部分

找到“设计之后”部分，并在文档之后、实施之前添加一个新的“规范评审循环”部分：

```markdown
**规范审查循环：**
编写规范文档后：
1. 派发规范文档审查子代理（参见 spec-document-reviewer-prompt.md）
2. 若 ❌ 发现问题：
   - 在规范文档中修复问题
   - 重新派发审查员
   - 重复直至 ✅ 获得批准
3. 若 ✅ 获得批准：继续执行实施设置

**审查循环指导原则：**
- 由编写规范的同一代理进行修复（保持上下文一致）
- 若循环超过5次迭代，则提请人工指导
- 审查员仅提供建议——若您认为反馈有误，请解释分歧点
```

* \[ ] **步骤 3：** 验证更改

运行：`grep -A 15 "Spec Review Loop" skills/brainstorming/SKILL.md`
预期：显示新的评审循环部分

* \[ ] **步骤 4：** 提交

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat: add spec review loop to brainstorming skill"
```

***

## 模块 2：计划文档评审者

此模块将计划文档评审者添加到编写计划技能中。

### 任务 3：创建计划文档评审者提示模板

**文件：**

* 创建：`skills/writing-plans/plan-document-reviewer-prompt.md`

* \[ ] **步骤 1：** 创建评审者提示模板文件

```markdown
# 计划文档评审员提示模板

在派遣计划文档评审员子代理时使用此模板。

**目的：** 验证计划片段是否完整，是否符合规范，并具有适当的任务分解。

**派遣时机：** 每个计划片段撰写完成后
```

Task 工具（通用）：
description: "评审计划模块 N"
prompt: |
您是一名计划文档评审者。请验证此计划模块是否完整并已准备好实施。

```
**Plan chunk to review:** [PLAN_FILE_PATH] - Chunk N only
**Spec for reference:** [SPEC_FILE_PATH]

## What to Check

| Category | What to Look For |
|----------|------------------|
| Completeness | TODOs, placeholders, incomplete tasks, missing steps |
| Spec Alignment | Chunk covers relevant spec requirements, no scope creep |
| Task Decomposition | Tasks atomic, clear boundaries, steps actionable |
| Task Syntax | Checkbox syntax (`- [ ]`) on tasks and steps |
| Chunk Size | Each chunk under 1000 lines |

## CRITICAL

Look especially hard for:
- Any TODO markers or placeholder text
- Steps that say "similar to X" without actual content
- Incomplete task definitions
- Missing verification steps or expected outputs

## Output Format

## Plan Review - Chunk N

**Status:** ✅ Approved | ❌ Issues Found

**Issues (if any):**
- [Task X, Step Y]: [specific issue] - [why it matters]

**Recommendations (advisory):**
- [suggestions that don't block approval]
```

```
**审阅者返回：** 状态，问题（如有），建议
```

* \[ ] **步骤 2：** 验证文件已创建

运行：`cat skills/writing-plans/plan-document-reviewer-prompt.md | head -20`
预期：显示标题和目的部分

* \[ ] **步骤 3：** 提交

```bash
git add skills/writing-plans/plan-document-reviewer-prompt.md
git commit -m "feat: add plan document reviewer prompt template"
```

***

### 任务 4：将评审循环添加到编写计划技能

**文件：**

* 修改：`skills/writing-plans/SKILL.md`

* \[ ] **步骤 1：** 读取当前技能文件

运行：`cat skills/writing-plans/SKILL.md`

* \[ ] **步骤 2：** 添加逐模块评审部分

在“执行交接”部分之前添加：

```markdown
## 计划审查循环

完成每个计划区块后：

1. 针对当前区块调度计划-文档-审查子代理
   - 提供：区块内容、规范文档路径
2. 如果 ❌ 发现问题：
   - 在区块中修复问题
   - 重新调度该区块的审查
   - 重复直到 ✅ 通过批准
3. 如果 ✅ 通过批准：继续下一个区块（或如果是最后一个区块，则移交执行）

**区块边界：** 使用 `## Chunk N: <name>` 标题来划分区块。每个区块应 ≤1000 行且在逻辑上自成一体。
```

* \[ ] **步骤 3：** 更新任务语法示例以使用复选框

更改“任务结构”部分以显示复选框语法：

```markdown
### 任务 N: [组件名称]

- [ ] **步骤 1:** 编写失败的测试
  - 文件: `tests/path/test.py`
  ...
```

* \[ ] **步骤 4：** 验证评审循环部分已添加

运行：`grep -A 15 "Plan Review Loop" skills/writing-plans/SKILL.md`
预期：显示新的评审循环部分

* \[ ] **步骤 5：** 验证任务语法示例已更新

运行：`grep -A 5 "Task N:" skills/writing-plans/SKILL.md`
预期：显示复选框语法 `### Task N:`

* \[ ] **步骤 6：** 提交

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat: add plan review loop and checkbox syntax to writing-plans skill"
```

***

## 模块 3：更新计划文档标题

此模块更新计划文档标题模板，以引用新的复选框语法要求。

### 任务 5：在编写计划技能中更新计划标题模板

**文件：**

* 修改：`skills/writing-plans/SKILL.md`

* \[ ] **步骤 1：** 读取当前计划标题模板

运行：`grep -A 20 "Plan Document Header" skills/writing-plans/SKILL.md`

* \[ ] **步骤 2：** 更新标题模板以引用复选框语法

计划标题应注明任务和步骤使用复选框语法。更新标题注释：

```markdown
> **对于智能体工作者：** 必需：使用 superpowers:subagent-driven-development（如果子智能体可用）或 superpowers:executing-plans 来实施此计划。任务和步骤使用复选框（`- [ ]`）语法进行跟踪。
```

* \[ ] **步骤 3：** 验证更改

运行：`grep -A 5 "For agentic workers:" skills/writing-plans/SKILL.md`
预期：显示提及复选框语法的更新后标题

* \[ ] **步骤 4：** 提交

```bash
git add skills/writing-plans/SKILL.md
git commit -m "docs: update plan header to reference checkbox syntax"
```
