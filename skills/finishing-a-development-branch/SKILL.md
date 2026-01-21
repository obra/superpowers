---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup. 中文触发场景：当用户说'开发完成了'、'功能做完了怎么办？'、'合并代码'、'结束开发分支'等需要完成开发分支时使用此技能。
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

**Announce at start:** "我正在使用完成开发分支技能..." (I'm using the finishing-a-development-branch skill to complete this work...)

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Documentation Integration: Complete Tasks

IF `.horspowers-config.yaml` exists AND `documentation.enabled: true`:

**Step 1: Complete task document**
**IF `$TASK_DOC` is set (from writing-plans):**
```bash
# Update task document to completed
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
manager.updateActiveDocument(process.env.TASK_DOC, {
  status: '已完成',
  progress: '## 完成时间\\n' + new Date().toISOString() + '\\n\\n## 验收结果\\n- 所有测试通过\\n- 代码已实现完成\\n- 准备合并到主分支'
});
"

# Archive completed task
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const result = manager.archiveDocument(process.env.TASK_DOC);
console.log('Task archived to:', result.archivedPath);
"
```

**Step 2: Handle bug documents (临时文档清理)**
**IF `$BUG_DOC` is set (from test-driven-development):**

First, verify bug status:
```bash
# Check if bug is marked as fixed
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const fs = require('fs');
const content = fs.readFileSync(process.env.BUG_DOC, 'utf8');
const isFixed = content.match(/- 状态[：:]\\s*(已修复|fixed)/i);
console.log('Bug fixed:', isFixed ? 'yes' : 'no');
"
```

**ASK user: "检测到 Bug 文档 `${BUG_DOC}`。Bug 文档是临时文档，修复完成后建议删除以避免文档膨胀。

**选项:**
1. **删除 Bug 文档** - Bug 已修复，删除临时文档（推荐）
2. **归档 Bug 文档** - 保留记录到 archive（用于重要 bug 复盘）
3. **保留 Bug 文档** - 暂时保留在 active/ 目录

说明: 删除后无法恢复，请确认 bug 已修复并验证通过"

**IF user chooses 删除 Bug 文档:**
```bash
# Delete the bug document
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const result = manager.deleteBugDocument(process.env.BUG_DOC, {
  verifyStatus: true,
  requireConfirmation: false
});
console.log(result.message);
"
```

**ELSE IF user chooses 归档 Bug 文档:**
```bash
# Archive resolved bug
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const result = manager.archiveDocument(process.env.BUG_DOC);
console.log('Bug archived to:', result.archivedPath);
"
```

**ELSE (user chooses 保留):**
Do nothing, bug document remains in active/

**Step 3: Clear environment variables**
```bash
# Clear active task tracking
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
manager.clearActiveTask();
"

# Unset environment variables
unset TASK_DOC
unset BUG_DOC
```

**Step 4: Check for other active documents**
```bash
# List all active documents
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const files = manager.getActiveFiles();
if (files.length > 0) {
  console.log('Remaining active documents:', files.join(', '));
} else {
  console.log('No remaining active documents.');
}
"

# If other related documents exist, ask user about handling them
```

**Step 5: Verify core document count**
```bash
# Check if core document count is within limits
node -e "
const DocsCore = require('./lib/docs-core.js');
const manager = new DocsCore(process.cwd());
const count = manager.countCoreDocs();
console.log('Core documents:', count.total);
console.log('Breakdown:', count.breakdown);
if (count.warning) {
  console.warn('WARNING:', count.warning);
}
"
```

### Step 2: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 3: Present Options

**Check configuration first:**

Read session context for `<config-detected>` marker to get current `completion_strategy` and `development_mode` settings.

**Present options based on configuration:**

**Personal Mode (`development_mode: personal`):**

```
Implementation complete. What would you like to do?

根据当前配置（个人开发者模式），推荐：
1. ✨ Merge back to <base-branch> locally （推荐）
2. Keep the branch as-is (I'll handle it later)
3. Discard this work

Which option?
```

**Team Mode (`development_mode: team`):**

```
Implementation complete. What would you like to do?

根据当前配置（团队协作模式），推荐：
1. ✨ Push and create a Pull Request （推荐）
2. Merge back to <base-branch> locally
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**If `completion_strategy` is explicitly set, the recommended option depends on mode:**

**Personal Mode:**
- `completion_strategy: merge` → Option 1 (Merge locally) ✨
- `completion_strategy: keep` → Option 2 (Keep as-is) ✨
- `completion_strategy: pr` → Not available in Personal Mode, use merge instead

**Team Mode:**
- `completion_strategy: pr` → Option 1 (Push and create PR) ✨
- `completion_strategy: merge` → Option 2 (Merge locally) ✨
- `completion_strategy: keep` → Option 3 (Keep as-is) ✨

**Keep options concise** - don't add explanations beyond the recommendation marker.

### Step 4: Execute Choice

#### Option 1: Merge Locally

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <feature-branch>
```

Then: Cleanup worktree (Step 5)

#### Option 2: Push and Create PR

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Cleanup worktree (Step 5)

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 5)

### Step 5: Cleanup Worktree

**For Options 1, 2, 4:**

Check if in worktree:
```bash
git worktree list | grep $(git branch --show-current)
```

If yes:
```bash
git worktree remove <worktree-path>
```

**For Option 3:** Keep worktree.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | ✓ | - | - | ✓ |
| 2. Create PR | - | ✓ | ✓ | - |
| 3. Keep as-is | - | - | ✓ | - |
| 4. Discard | - | - | - | ✓ (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Automatic worktree cleanup**
- **Problem:** Remove worktree when might need it (Option 2, 3)
- **Fix:** Only cleanup for Options 1 and 4

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request

**Always:**
- Verify tests before offering options
- Present exactly 4 options
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
