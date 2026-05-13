---
name: subagent-driven-development
description: "You MUST use this when the user wants an existing implementation plan executed in the current session through mostly independent tasks, continuous forward progress, or self-directed task sequencing without waiting for approval after every step. Trigger on requests like '这个计划里的任务彼此独立，当前会话直接连续推进，边做边 review'、'按现有计划往下做，每个子任务做完就自查，然后接着下一个'、'当前会话就把这几个拆开的开发项尽量往前推，不用每一步都等我确认'. Do NOT use this when the user wants pause-and-review checkpoints after each batch; use `executing-plans` then. Do NOT use this when no implementation plan exists yet; use `writing-plans` or `brainstorming` first. 中文触发场景：当用户说'开始实施这个计划'、'按计划执行开发'、'执行开发任务'、'当前会话持续推进'、'任务独立可以并开'等需要子代理驱动开发时使用此技能。"
---

# Subagent-Driven Development

Execute plan by dispatching a fresh helper agent per task, with two-stage review after each: spec compliance review first, then code quality review.

**Core principle:** Fresh helper agent per task + two-stage review (spec then quality) = high quality, fast iteration

**Continuous execution:** After reading the plan and extracting task context, continue straight into the next task without "Should I continue?" style check-ins. Only stop for `BLOCKED` status, genuine ambiguity that prevents safe progress, or when all tasks are complete.

**Announce at start:** "我正在使用子代理驱动开发技能来执行这个计划..." (I'm using subagent-driven development to execute this plan...)

## First Response Rule

On the first response after routing into this skill:

- announce that you are using subagent-driven-development
- restate that the next move is to keep executing the existing plan continuously in the current session
- ask at most one brief clarifying question only if the plan reference or task scope is still ambiguous

Do NOT read plan files, inspect the repository, dispatch helpers, or start task execution before that first response is sent.

## Quick Routing Boundaries

Route here immediately when the user asks to:

- keep moving through independent tasks in this session
- continue the plan without waiting for confirmation after every step
- self-order or parallelize tasks that are already defined
- keep executing, self-reviewing, and advancing from one task to the next
- finish each subtask, self-check it, and immediately continue with the next task

Do NOT drift to `executing-plans` just because the prompt mentions an existing plan.
If the main signal is continuous current-session execution of independent tasks, this skill is the right route.
Self-review after each completed subtask is still compatible with this skill when execution should continue immediately in the same session.

Do NOT drift to `writing-plans` when the task list already exists and the user wants execution now, not another breakdown.

## When to Use

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

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Two-stage review after each task: spec compliance first, then code quality
- Faster iteration (no human-in-loop between tasks)

## The Process

### Step 0: Load Document Context (文档上下文传递)

**Before starting task execution:**

IF `.horspowers-config.yaml` exists AND `documentation.enabled: true`:

1. **Read task document path** (from writing-plans):
   ```bash
   # 检查任务文档是否存在
   if [ -n "$TASK_DOC" ] && [ -f "$TASK_DOC" ]; then
     echo "✅ 任务文档: $TASK_DOC"
     cat "$TASK_DOC"
   elif [ -n "$TASK_DOC" ]; then
     # 文档路径设置但文件不存在 - 增强处理
     echo "⚠️  警告: TASK_DOC 已设置但文件不存在: $TASK_DOC"
     echo ""

     # 尝试搜索相关文档
     echo "🔍 搜索相关文档..."
     RECENT_TASKS=$(find docs/active -name "task*.md" -mtime -7 2>/dev/null | head -3)
     if [ -n "$RECENT_TASKS" ]; then
       echo "最近的任务文档:"
       echo "$RECENT_TASKS"
     fi

     # 提供流程引导建议
     echo ""
     echo "💡 推荐工作流程:"
     echo "   新功能: brainstorming → writing-plans → (当前技能)"
     echo "   修复 bug: systematic-debugging → test-driven-development"
     echo ""

     # 检查文档系统是否初始化
     if [ ! -d "docs/active" ]; then
       echo "📋 文档系统未初始化。运行 'horspowers:document-management' 初始化文档系统。"
     fi

     echo "继续使用可用上下文执行..."
   fi
   ```

2. **Read related documents** (if specified in task document):
   ```bash
   # 设计文档 (如果在任务文档中链接)
   DESIGN_DOC="docs/plans/YYYY-MM-DD-design-<topic>.md"
   if [ -f "$DESIGN_DOC" ]; then
     echo "✅ 设计文档: $DESIGN_DOC"
     cat "$DESIGN_DOC"
   fi

   # 计划文档 (如果在任务文档中链接)
   PLAN_DOC="docs/plans/YYYY-MM-DD-<feature>.md"
   if [ -f "$PLAN_DOC" ]; then
     echo "✅ 计划文档: $PLAN_DOC"
     cat "$PLAN_DOC"
   fi
   ```

3. **Pass document paths to helper agents**:
   Each helper-agent prompt should include relevant document paths for context

**Note:** 如果文档不存在，跳过加载并使用可用上下文继续执行任务。

**IF documentation is NOT enabled:**
- Skip document loading
- Proceed with plan execution

```dot
digraph process {
    rankdir=TB;

    "Load document context ($TASK_DOC, design, plan)" [shape=box style=filled fillcolor=lightyellow];
    "Read plan, extract all tasks with full text, note context, create host plan/todo list" [shape=box];

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
        "Update task document progress" [shape=box];
        "Mark task complete in host plan/todo tracker" [shape=box];
    }

    "More tasks remain?" [shape=diamond];
    "Dispatch final code reviewer subagent for entire implementation" [shape=box];
    "Use horspowers:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

    "Load document context ($TASK_DOC, design, plan)" -> "Read plan, extract all tasks with full text, note context, create host plan/todo list";
    "Read plan, extract all tasks with full text, note context, create host plan/todo list" -> "Dispatch implementer subagent (./implementer-prompt.md)";
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
    "Code quality reviewer subagent approves?" -> "Update task document progress" [label="yes"];
    "Update task document progress" -> "Mark task complete in host plan/todo tracker";
    "Mark task complete in host plan/todo tracker" -> "More tasks remain?";
    "More tasks remain?" -> "Dispatch implementer subagent (./implementer-prompt.md)" [label="yes"];
    "More tasks remain?" -> "Dispatch final code reviewer subagent for entire implementation" [label="no"];
    "Dispatch final code reviewer subagent for entire implementation" -> "Use horspowers:finishing-a-development-branch";
}
```

## Prompt Templates

- `./implementer-prompt.md` - Dispatch implementer subagent
- `./spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `./code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent

## Example Workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Read plan file once: docs/plans/feature-plan.md]
[Extract all 5 tasks with full text and context]
[Create the host's plan/todo list with all tasks]

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

## Advantages

**vs. Manual execution:**
- Helper agents follow TDD naturally
- Fresh context per task (no confusion)
- Parallel-safe (subagents don't interfere)
- Helper agent can ask questions (before AND during work)

**vs. Executing Plans:**
- Same session (no handoff)
- Continuous progress (no waiting)
- Review checkpoints automatic

**Efficiency gains:**
- No file reading overhead (controller provides full text)
- Controller curates exactly what context is needed
- Subagent gets complete information upfront
- Questions surfaced before work begins (not after)

**Quality gates:**
- Self-review catches issues before handoff
- Two-stage review: spec compliance, then code quality
- Review loops ensure fixes actually work
- Spec compliance prevents over/under-building
- Code quality ensures implementation is well-built

**Cost:**
- More subagent invocations (implementer + 2 reviewers per task)
- Controller does more prep work (extracting all tasks upfront)
- Review loops add iterations
- But catches issues early (cheaper than debugging later)

## Red Flags

**Never:**
- Skip reviews (spec compliance OR code quality)
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Ignore subagent questions (answer before letting them proceed)
- Accept "close enough" on spec compliance (spec reviewer found issues = not done)
- Skip review loops (reviewer found issues = implementer fixes = review again)
- Let implementer self-review replace actual review (both are needed)
- **Start code quality review before spec compliance is ✅** (wrong order)
- Move to next task while either review has open issues
- Pause between tasks for routine progress check-ins or "Should I continue?" confirmations
- Stop after a normal task/review cycle unless you are `BLOCKED`, genuinely ambiguous, or finished with all tasks

**If subagent asks questions:**
- Answer clearly and completely
- Provide additional context if needed
- Don't rush them into implementation

If the current host does not support native subagents/helper agents, execute the same workflow locally in order: implementer pass, spec review pass, then code-quality review pass.

**If reviewer finds issues:**
- Implementer (same subagent) fixes them
- Reviewer reviews again
- Repeat until approved
- Don't skip the re-review

**If subagent fails task:**
- Dispatch fix subagent with specific instructions
- Don't try to fix manually (context pollution)

## Task Completion

For each completed task:

1. **Update task document automatically:**
   IF `$TASK_DOC` is set AND documentation is enabled:
     ```bash
     # Update progress with task description
     node -e "
     const fs = require('fs');
     const path = require('path');

     const taskDoc = process.env.TASK_DOC;
     if (fs.existsSync(taskDoc)) {
         let content = fs.readFileSync(taskDoc, 'utf8');
         const timestamp = new Date().toISOString().slice(0, 10);
         const taskDesc = '[task-description]'; // Replace with actual task description

         // Update status to 进行中 if not already
         if (!content.includes('状态:进行中') && !content.includes('状态:已完成')) {
             content = content.replace(/- 状态[：:].+/, '- 状态: 进行中');
         }

         // Add progress entry
         const progressEntry = \`- \${timestamp}: \${taskDesc} 完成\`;

         if (content.includes('## 进展记录')) {
             // 已有进展记录，添加新条目
             content = content.replace(
                 /(## 进展记录\\n[\\s\\S]*?)(?=\\n##|\\Z)/,
                 '\$1\\n' + progressEntry
             );
         } else {
             // 没有进展记录，创建新的部分
             const lastHeaderMatch = content.lastIndexOf('\n## ');
             if (lastHeaderMatch > 0) {
                 const insertPoint = content.indexOf('\n', lastHeaderMatch);
                 const progressSection = \`\n## 进展记录\n\${progressEntry}\n\`;
                 content = content.slice(0, insertPoint + 1) + progressSection + content.slice(insertPoint + 1);
             }
         }

         fs.writeFileSync(taskDoc, content);
     }
     "
     ```

2. **Mark as complete when all tasks done:**
   IF all tasks completed AND `$TASK_DOC` is set:
     Update status to "已完成" and add final progress entry

## Integration

**Required workflow skills:**
- **horspowers:writing-plans** - Creates the plan this skill executes
- **horspowers:requesting-code-review** - Code review template for reviewer subagents
- **horspowers:finishing-a-development-branch** - Complete development after all tasks

**Helper agents should use:**
- **horspowers:test-driven-development** - Subagents follow TDD for each task

**Alternative workflow:**
- **horspowers:executing-plans** - Use for parallel session instead of same-session execution
