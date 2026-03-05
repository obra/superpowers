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

1. **Check and create task document if needed**:
   ```bash
   # 检查任务文档是否存在
   if [ -n "$TASK_DOC" ] && [ -f "$TASK_DOC" ]; then
     echo "✅ 任务文档: $TASK_DOC"
     # 读取任务文档获取上下文和检查点信息
     cat "$TASK_DOC"
   else
     # 任务文档不存在 - 提供创建选项
     echo "⚠️  任务文档不存在"
     echo ""

     # 检查是否有 plan 文档
     PLAN_DOCS=$(find docs/plans -name "*.md" -type f 2>/dev/null | grep -v "design-" | sort -r | head -3)

     if [ -n "$PLAN_DOCS" ]; then
       echo "📋 发现以下计划文档:"
       echo "$PLAN_DOCS" | nl -w2 -s'. '
       echo ""

       # 使用 AskUserQuestion 询问用户
       # (AI 会自动处理，这里列出选项供参考)
       echo "请选择:"
       echo "1. 从现有 plan 创建 task 文档（推荐）"
       echo "2. 运行完整的 writing-plans 流程"
       echo "3. 跳过文档系统，直接执行计划"
       echo ""

       # 选项 1: 从 plan 创建 task
       if [ "$USER_CHOICE" = "1" ]; then
         # 获取最新的 plan 文档
         LATEST_PLAN=$(echo "$PLAN_DOCS" | head -1)
         PLAN_NAME=$(basename "$LATEST_PLAN" .md)

         echo "正在从 $LATEST_PLAN 创建 task 文档..."

         TASK_DOC=$(node -e "
           const { UnifiedDocsManager } = require('\${CLAUDE_PLUGIN_ROOT}/lib/docs-core.js');
           const manager = new UnifiedDocsManager(process.cwd());

           // 从 plan 文件名提取标题
           const planName = '${PLAN_NAME}';
           const title = 'Implement: ' + planName.replace(/^\\d{4}-\\d{2}-\\d{2}-/, '');

           const result = manager.createActiveDocument('task', title, null, {
             plan: planName + '.md'
           });

           if (result.success) {
             console.log(result.path);
           } else {
             console.error('Error:', result.error);
             process.exit(1);
           }
         ")

         if [ $? -eq 0 ] && [ -f "$TASK_DOC" ]; then
           export TASK_DOC
           echo "✅ Task 文档创建成功: $TASK_DOC"
           echo ""
           cat "$TASK_DOC"
         else
           echo "❌ 创建失败，请使用选项 2 运行 writing-plans"
           exit 1
         fi
       fi

       # 选项 2: 运行 writing-plans
       if [ "$USER_CHOICE" = "2" ]; then
         echo ""
         echo "📝 请先运行 writing-plans 技能创建实施计划和任务文档"
         echo ""
         echo "完成后再重新调用 executing-plans 技能"
         exit 0
       fi

       # 选项 3: 跳过文档系统
       if [ "$USER_CHOICE" = "3" ]; then
         echo "⚠️  跳过文档系统，将不追踪任务进度"
         echo "继续执行计划..."
       fi
     else
       # 没有 plan 文档
       echo "📋 未找到计划文档"
       echo ""
       echo "推荐工作流程:"
       echo "1. brainstorming → 创建设计文档（可选）"
       echo "2. writing-plans → 创建实施计划和任务文档"
       echo "3. executing-plans → 执行计划"
       echo ""
       echo "是否现在运行 writing-plans？(yes/no)"

       if [ "$USER_RESPONSE" = "yes" ]; then
         echo ""
         echo "📝 正在调用 writing-plans 技能..."
         # 技能会自动切换，这里直接退出
         exit 0
       else
         echo "⚠️  没有任务文档，无法追踪进度"
         echo "继续执行计划..."
       fi
     fi
   fi
   ```

2. **Read related documents** (if specified in task document):
   ```bash
   # 只有当 TASK_DOC 文件存在时才读取相关文档
   if [ -f "$TASK_DOC" ]; then
     # 从任务文档中提取相关文档路径
     DESIGN_DOC=$(grep "设计文档:" "$TASK_DOC" | sed 's/.*\](\(.*\)).*/\1/')
     PLAN_DOC=$(grep "计划文档:" "$TASK_DOC" | sed 's/.*\](\(.*\)).*/\1/')

     # 读取设计文档（如果存在）
     if [ -n "$DESIGN_DOC" ] && [ -f "docs/plans/$DESIGN_DOC" ]; then
       echo "✅ 设计文档: docs/plans/$DESIGN_DOC"
       cat "docs/plans/$DESIGN_DOC"
     fi

     # 读取计划文档
     if [ -n "$PLAN_DOC" ] && [ -f "docs/plans/$PLAN_DOC" ]; then
       echo "✅ 计划文档: docs/plans/$PLAN_DOC"
       cat "docs/plans/$PLAN_DOC"
     fi
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
1. Read plan file:
   - If `$TASK_DOC` exists: read from task document's "相关文档" section
   - If `$PLAN_DOC` exists: read from that path
   - Otherwise: search for plan in `docs/plans/` or ask user for path
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Batch
**Default: First 3 tasks**

**Beads 状态同步 (IF enabled):**
Before starting first task:
```bash
IF `$TASK_DOC` is set AND beads integration enabled:
  node -e "
  const { createBeadsSync } = require('./lib/beads-sync.js');
  const sync = createBeadsSync(process.cwd());
  if (sync.isEnabled() && !sync.isAvailable()) {
    console.warn('⚠️  [beads] beads.enabled: true but beads CLI not found. Install: https://github.com/steveyegge/beads');
  } else if (sync.canSync() && process.env.TASK_DOC) {
    const success = sync.updateStatus(process.env.TASK_DOC, 'in_progress', { claim: true });
    if (success) console.log('✓ Task status updated: in_progress');
  }
  " 2>/dev/null || true
```

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

**Beads 同步 (IF enabled) - 仅更新进度，不关闭:**
```bash
IF `$TASK_DOC` is set AND beads integration enabled:
  node -e "
  const { createBeadsSync } = require('./lib/beads-sync.js');
  const sync = createBeadsSync(process.cwd());
  if (sync.isEnabled() && !sync.isAvailable()) {
    console.warn('⚠️  [beads] beads.enabled: true but beads CLI not found. Install: https://github.com/steveyegge/beads');
  } else if (sync.canSync() && process.env.TASK_DOC) {
    // 仅更新进度备注，不关闭任务（关闭需要用户确认）
    const notes = 'Checkpoint: Batch ' + process.env.BATCH_NUM + ' completed';
    sync.updateStatus(process.env.TASK_DOC, 'in_progress', { notes: notes });
    console.log('✓ Task progress updated in beads (status: in_progress)');
  }
  " 2>/dev/null || true
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

**Beads 同步 (IF enabled) - 询问后关闭任务:**

IF `$TASK_DOC` is set AND beads integration enabled:

**必须询问用户确认：**

```
✅ 所有任务已完成并通过验证

📋 验收确认

当前任务已达到完成标准：
- 所有计划步骤已执行
- 测试通过
- 代码已提交

═══════════════════════════════════════════════════

询问用户：
"当前任务已完成，请验收。是否关闭 beads 中的任务状态？"

选项：
1. ✅ 确认关闭 - 将任务状态更新为 closed
2. ⏸️ 暂不关闭 - 保持当前状态，稍后手动处理
3. 📝 添加备注 - 先添加完成备注，再关闭

═══════════════════════════════════════════════════
```

**IF user confirms 关闭:**
```bash
node -e "
const { createBeadsSync } = require('./lib/beads-sync.js');
const sync = createBeadsSync(process.cwd());
if (sync.canSync() && process.env.TASK_DOC) {
  const success = sync.closeTask(process.env.TASK_DOC, {
    reason: 'Implementation completed - verified by user',
    continue: true
  });
  if (success) console.log('✓ Task closed in beads');
}
" 2>/dev/null || true
```

**IF user chooses 暂不关闭:**
- 记录到任务文档：用户选择暂不关闭 beads 状态
- 继续后续流程（finishing-a-development-branch）
- 任务在 beads 中保持 open 状态，用户可手动关闭

**IF user chooses 添加备注:**
- 询问用户完成备注内容
- 同步到 beads：
```bash
node -e "
const { createBeadsSync } = require('./lib/beads-sync.js');
const sync = createBeadsSync(process.cwd());
if (sync.canSync() && process.env.TASK_DOC) {
  sync.updateStatus(process.env.TASK_DOC, 'in_progress', { notes: '${USER_NOTES}' });
  sync.closeTask(process.env.TASK_DOC, {
    reason: '${USER_NOTES}',
    continue: true
  });
}
" 2>/dev/null || true
```

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
