---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements. 中文触发场景：当用户说'帮我审查代码'、'检查一下代码质量'、'代码写完了帮我看看'等需要代码审查时使用此技能。
---

# Requesting Code Review

Dispatch horspowers:code-reviewer subagent to catch issues before they cascade.

**Core principle:** Review early, review often.

## Document Context Loading (文档上下文传递)

**Before requesting review:**

IF `.horspowers-config.yaml` exists AND `documentation.enabled: true`:

**IF `$TASK_DOC` is set (from writing-plans):**
```bash
# 检查任务文档是否存在
if [ -f "$TASK_DOC" ]; then
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

  # 从 git log 获取上下文
  echo ""
  echo "📝 从 git 获取上下文..."
  git log --oneline -5 2>/dev/null || true

  # 提供流程引导建议
  echo ""
  echo "💡 推荐工作流程:"
  echo "   完整流程: brainstorming → writing-plans → subagent-driven-development → (当前技能)"
  echo ""

  # 检查文档系统是否初始化
  if [ ! -d "docs/active" ]; then
    echo "📋 文档系统未初始化。运行 'horspowers:document-management' 初始化文档系统。"
  fi

  echo "继续使用可用上下文进行代码审查..."
fi
```

**Read related documents** (if specified in task document):
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

**Pass document context to reviewer:**
Include relevant document information in the review request to help reviewer understand requirements and design decisions.

**Note:** 如果文档不存在，跳过加载并使用可用上下文继续代码审查。

**IF documentation is NOT enabled:**
- Skip document loading
- Proceed with review request

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch code-reviewer subagent:**

Use Task tool with horspowers:code-reviewer type, fill template at `code-reviewer.md`

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit
- `{DESCRIPTION}` - Brief summary

**3. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch horspowers:code-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each batch (3 tasks)
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

## Update Task Document After Review (文档状态更新)

**After review is complete and issues are fixed:**

IF `.horspowers-config.yaml` exists AND `documentation.enabled: true`:

**IF `$TASK_DOC` is set:**
```bash
# Update task document with review results
node -e "
const fs = require('fs');
const taskDoc = process.env.TASK_DOC;
if (fs.existsSync(taskDoc)) {
    let content = fs.readFileSync(taskDoc, 'utf8');
    const timestamp = new Date().toISOString().slice(0, 10);

    const reviewEntry = \`- \${timestamp}: 代码审查完成 - [结果：通过/需要修改]\`;

    if (content.includes('## 进展记录')) {
        content = content.replace(
            /(## 进展记录\\n[\\s\\S]*?)(?=\\n##|\\Z)/,
            '\$1\\n' + reviewEntry
        );
    }

    // Update status if review passed
    if (content.includes('- 状态') && [REVIEW_PASSED]) {
        content = content.replace(/- 状态[：:].+/, '- 状态: 代码审查通过');
    }

    fs.writeFileSync(taskDoc, content);
}
"
```

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: requesting-code-review/code-reviewer.md
