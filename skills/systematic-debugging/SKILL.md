---
name: systematic-debugging
description: "You MUST use this when the user needs a bug, failure, or unexpected behavior investigated systematically before any fix is proposed. Trigger on requests like '帮忙调试一下'、'先梳理现象、假设和验证步骤'、'确认问题到底在哪一层'、'先缩小问题范围'. Do NOT use this for generic planning or implementation sequencing, and do NOT use it when the first required action is to write a failing or reproducing test; use test-driven-development then. 中文触发场景：当用户说'这里有个bug'、'测试失败了'、'为什么报错？'、'帮忙调试一下'、'出问题了'等遇到任何技术问题时使用此技能。"
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

**Announce at start:** "我正在使用系统化调试技能..." (I'm using systematic debugging...)

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**
- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)
- Manager wants it fixed NOW (systematic is faster than thrashing)

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 0: Load Bug Document Context (文档上下文加载)

**Before starting debugging:**

IF `.horspowers-config.yaml` exists AND `documentation.enabled: true`:

**IF `$BUG_DOC` is set (from TDD RED phase):**
```bash
# 检查 bug 文档是否存在
if [ -f "$BUG_DOC" ]; then
  echo "✅ Bug 文档: $BUG_DOC"
  cat "$BUG_DOC"
elif [ -n "$BUG_DOC" ]; then
  # 文档路径设置但文件不存在 - 增强处理
  echo "⚠️  警告: BUG_DOC 已设置但文件不存在: $BUG_DOC"
  echo ""

  # 尝试搜索相关文档
  echo "🔍 搜索相关 bug 文档..."
  RECENT_BUGS=$(find docs/active -name "bug*.md" -mtime -7 2>/dev/null | head -3)
  if [ -n "$RECENT_BUGS" ]; then
    echo "最近的 bug 文档:"
    echo "$RECENT_BUGS"
  fi

  # 检查文档系统是否初始化
  if [ ! -d "docs/active" ]; then
    echo "📋 文档系统未初始化。运行 'horspowers:document-management' 初始化文档系统。"
  fi

  echo "继续使用可用上下文进行调试..."
fi
```

**IF `$TASK_DOC` is set (from writing-plans):**
```bash
# 检查任务文档是否存在
if [ -f "$TASK_DOC" ]; then
  echo "✅ 任务文档: $TASK_DOC"
  # 读取任务文档了解正在调试什么
  cat "$TASK_DOC"
elif [ -n "$TASK_DOC" ]; then
  # 文档路径设置但文件不存在 - 增强处理
  echo "⚠️  警告: TASK_DOC 已设置但文件不存在: $TASK_DOC"
  echo ""

  # 尝试搜索相关文档
  echo "🔍 搜索相关任务文档..."
  RECENT_TASKS=$(find docs/active -name "task*.md" -mtime -7 2>/dev/null | head -3)
  if [ -n "$RECENT_TASKS" ]; then
    echo "最近的任务文档:"
    echo "$RECENT_TASKS"
  fi

  echo "继续使用可用上下文进行调试..."
fi
```

**IF no bug document exists but issue was found:**
- Note the issue details - TDD skill will create bug document in RED phase
- Proceed with systematic debugging

**Note:** 如果文档不存在，跳过加载并使用可用上下文继续调试。

**IF documentation is NOT enabled:**
- Skip document loading
- Proceed with debugging

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - They often contain the exact solution
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - Does it happen every time?
   - If not reproducible → gather more data, don't guess

3. **Check Recent Changes**
   - What changed that could cause this?
   - Git diff, recent commits
   - New dependencies, config changes
   - Environmental differences

4. **Gather Evidence in Multi-Component Systems**

   **WHEN system has multiple components (CI → build → signing, API → service → database):**

   **BEFORE proposing fixes, add diagnostic instrumentation:**
   ```
   For EACH component boundary:
     - Log what data enters component
     - Log what data exits component
     - Verify environment/config propagation
     - Check state at each layer

   Run once to gather evidence showing WHERE it breaks
   THEN analyze evidence to identify failing component
   THEN investigate that specific component
   ```

   **Example (multi-layer system):**
   ```bash
   # Layer 1: Workflow
   echo "=== Secrets available in workflow: ==="
   echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

   # Layer 2: Build script
   echo "=== Env vars in build script: ==="
   env | grep IDENTITY || echo "IDENTITY not in environment"

   # Layer 3: Signing script
   echo "=== Keychain state: ==="
   security list-keychains
   security find-identity -v

   # Layer 4: Actual signing
   codesign --sign "$IDENTITY" --verbose=4 "$APP"
   ```

   **This reveals:** Which layer fails (secrets → workflow ✓, workflow → build ✗)

5. **Trace Data Flow**

   **WHEN error is deep in call stack:**

   See `root-cause-tracing.md` in this directory for the complete backward tracing technique.

   **Quick version:**
   - Where does bad value originate?
   - What called this with bad value?
   - Keep tracing up until you find the source
   - Fix at source, not at symptom

### Phase 2: Pattern Analysis

**Find the pattern before fixing:**

1. **Find Working Examples**
   - Locate similar working code in same codebase
   - What works that's similar to what's broken?

2. **Compare Against References**
   - If implementing pattern, read reference implementation COMPLETELY
   - Don't skim - read every line
   - Understand the pattern fully before applying

3. **Identify Differences**
   - What's different between working and broken?
   - List every difference, however small
   - Don't assume "that can't matter"

4. **Understand Dependencies**
   - What other components does this need?
   - What settings, config, environment?
   - What assumptions does it make?

### Phase 3: Hypothesis and Testing

**Scientific method:**

1. **Form Single Hypothesis**
   - State clearly: "I think X is the root cause because Y"
   - Write it down
   - Be specific, not vague

2. **Test Minimally**
   - Make the SMALLEST possible change to test hypothesis
   - One variable at a time
   - Don't fix multiple things at once

3. **Verify Before Continuing**
   - Did it work? Yes → Phase 4
   - Didn't work? Form NEW hypothesis
   - DON'T add more fixes on top

4. **When You Don't Know**
   - Say "I don't understand X"
   - Don't pretend to know
   - Ask for help
   - Research more

### Phase 4: Implementation

**Fix the root cause, not the symptom:**

1. **Create Failing Test Case**
   - Simplest possible reproduction
   - Automated test if possible
   - One-off test script if no framework
   - MUST have before fixing
   - Use the `horspowers:test-driven-development` skill for writing proper failing tests

2. **Implement Single Fix**
   - Address the root cause identified
   - ONE change at a time
   - No "while I'm here" improvements
   - No bundled refactoring

3. **Verify Fix**
   - Test passes now?
   - No other tests broken?
   - Issue actually resolved?

4. **If Fix Doesn't Work**
   - STOP
   - Count: How many fixes have you tried?
   - If < 3: Return to Phase 1, re-analyze with new information
   - **If ≥ 3: STOP and question the architecture (step 5 below)**
   - DON'T attempt Fix #4 without architectural discussion

5. **If 3+ Fixes Failed: Question Architecture**

   **Pattern indicating architectural problem:**
   - Each fix reveals new shared state/coupling/problem in different place
   - Fixes require "massive refactoring" to implement
   - Each fix creates new symptoms elsewhere

   **STOP and question fundamentals:**
   - Is this pattern fundamentally sound?
   - Are we "sticking with it through sheer inertia"?
   - Should we refactor architecture vs. continue fixing symptoms?

   **Discuss with your human partner before attempting more fixes**

   This is NOT a failed hypothesis - this is a wrong architecture.

### Phase 4.5: Update Bug Document (文档输出)

**After root cause is identified and fix is implemented:**

IF `.horspowers-config.yaml` exists AND `documentation.enabled: true`:

**IF `$BUG_DOC` is set:**
```bash
# Update bug document with root cause analysis and fix details
node -e "
const fs = require('fs');
const bugDoc = process.env.BUG_DOC;
if (fs.existsSync(bugDoc)) {
    let content = fs.readFileSync(bugDoc, 'utf8');
    const timestamp = new Date().toISOString();

    const rootCauseSection = \`
## 根因分析
[Detailed root cause analysis from Phase 1-2]

分析时间: \${timestamp}
\`;

    const fixSection = \`
## 修复方案
[Description of the fix implemented in Phase 4]

修复时间: \${timestamp}
\`;

    // Add root cause and fix sections
    content += '\\n' + rootCauseSection + '\\n' + fixSection;

    fs.writeFileSync(bugDoc, content);
}
"
```

**IF `$TASK_DOC` is set:**
```bash
# Also update task document with debugging progress
node -e "
const fs = require('fs');
const taskDoc = process.env.TASK_DOC;
if (fs.existsSync(taskDoc)) {
    let content = fs.readFileSync(taskDoc, 'utf8');
    const timestamp = new Date().toISOString().slice(0, 10);

    const progressEntry = \`- \${timestamp}: 完成根因分析和修复：[bug description]\`;

    if (content.includes('## 进展记录')) {
        content = content.replace(
            /(## 进展记录\\n[\\s\\S]*?)(?=\\n##|\\Z)/,
            '\$1\\n' + progressEntry
        );
    }

    fs.writeFileSync(taskDoc, content);
}
"
```

## Red Flags - STOP and Follow Process

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- **"One more fix attempt" (when already tried 2+)**
- **Each fix reveals new problem in different place**

**ALL of these mean: STOP. Return to Phase 1.**

**If 3+ fixes failed:** Question the architecture (see Phase 4.5)

## your human partner's Signals You're Doing It Wrong

**Watch for these redirections:**
- "Is that not happening?" - You assumed without verifying
- "Will it show us...?" - You should have added evidence gathering
- "Stop guessing" - You're proposing fixes without understanding
- "Ultrathink this" - Question fundamentals, not just symptoms
- "We're stuck?" (frustrated) - Your approach isn't working

**When you see these:** STOP. Return to Phase 1.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "I'll write test after confirming fix works" | Untested fixes don't stick. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
| "I see the problem, let me fix it" | Seeing symptoms ≠ understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question pattern, don't fix again. |

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare | Identify differences |
| **3. Hypothesis** | Form theory, test minimally | Confirmed or new hypothesis |
| **4. Implementation** | Create test, fix, verify | Bug resolved, tests pass |

## When Process Reveals "No Root Cause"

If systematic investigation reveals issue is truly environmental, timing-dependent, or external:

1. You've completed the process
2. Document what you investigated
3. Implement appropriate handling (retry, timeout, error message)
4. Add monitoring/logging for future investigation

**But:** 95% of "no root cause" cases are incomplete investigation.

## Supporting Techniques

These techniques are part of systematic debugging and available in this directory:

- **`root-cause-tracing.md`** - Trace bugs backward through call stack to find original trigger
- **`defense-in-depth.md`** - Add validation at multiple layers after finding root cause
- **`condition-based-waiting.md`** - Replace arbitrary timeouts with condition polling

**Related skills:**
- **horspowers:test-driven-development** - For creating failing test case (Phase 4, Step 1)
- **horspowers:verification-before-completion** - Verify fix worked before claiming success

## Real-World Impact

From debugging sessions:
- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common
