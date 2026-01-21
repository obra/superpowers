---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints. 中文触发场景：当用户说'按计划执行'、'开始实施计划'、'执行这个开发计划'等需要执行已有计划时使用此技能。
---

# Executing Plans

## Overview

Load plan, review critically, execute tasks in batches, report for review between batches.

**Core principle:** Batch execution with checkpoints for architect review.

**Announce at start:** "我正在使用执行计划技能来实施这个计划..." (I'm using the executing-plans skill to implement this plan...)

## The Process

### Step 0: Load Document Context (文档上下文传递)

**Before loading plan:**

IF `.horspowers-config.yaml` exists AND `documentation.enabled: true`:

1. **Read task document path** (from writing-plans):
   ```bash
   # 检查任务文档是否存在
   if [ -n "$TASK_DOC" ] && [ -f "$TASK_DOC" ]; then
     echo "✅ 任务文档: $TASK_DOC"
     # 读取任务文档获取上下文和检查点信息
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

     # 从 git log 获取上下文
     echo ""
     echo "📝 从 git 获取上下文..."
     git log --oneline -5 2>/dev/null || true
     CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
     echo "当前分支: $CURRENT_BRANCH"

     # 提供流程引导建议
     echo ""
     echo "💡 推荐工作流程:"
     echo "   新功能: brainstorming → writing-plans → (当前技能)"
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

   # 计划文档 (从任务文档的"相关文档"部分获取路径)
   PLAN_DOC="docs/plans/YYYY-MM-DD-<feature>.md"
   if [ -f "$PLAN_DOC" ]; then
     echo "✅ 计划文档: $PLAN_DOC"
     cat "$PLAN_DOC"
   fi
   ```

3. **Support session resume**:
   IF task document exists and contains "检查点" (checkpoint) information:
   - Resume from last checkpoint position
   - Ask user: "检测到上次执行到检查点 N，是否从该处继续？"

**Note:** 如果文档不存在，跳过加载并使用可用上下文继续执行计划。

**IF documentation is NOT enabled:**
- Skip document loading
- Proceed with plan execution

### Step 1: Load and Review Plan
1. Read plan file (from task document's "相关文档" or directly)
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Batch
**Default: First 3 tasks**

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 2.5: Checkpoint (检查点保存)

**After each batch completes:**

IF `$TASK_DOC` is set AND documentation is enabled:

```bash
# Save checkpoint to task document
node -e "
const fs = require('fs');
const path = require('path');

const taskDoc = process.env.TASK_DOC;
if (fs.existsSync(taskDoc)) {
    let content = fs.readFileSync(taskDoc, 'utf8');
    const batchNum = N; // Current batch number
    const nextTask = 'M'; // Next task to execute

    const checkpointEntry = \`\\n## 检查点\\n- 批次: \${batchNum}\\n- 下次任务: \${nextTask}\\n- 时间: \${new Date().toISOString()}\`;

    // Update or add checkpoint section
    if (content.includes('## 检查点')) {
        content = content.replace(
            /(## 检查点[\\s\\S]*?)(?=\\n##|\\Z)/,
            '\$1' + checkpointEntry
        );
    } else {
        content += checkpointEntry;
    }

    fs.writeFileSync(taskDoc, content);
}
"
```

This allows session resume - if the session is interrupted, the next session can read the checkpoint and continue from the right place.

### Step 3: Report
When batch complete:
- Show what was implemented
- Show verification output
- Say: "Ready for feedback."

### Step 4: Continue
Based on feedback:
- Apply changes if needed
- Execute next batch
- Repeat until complete

### Step 5: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use horspowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-batch (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Between batches: just report and wait
- Stop when blocked, don't guess
