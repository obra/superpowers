---
description: "Run full code review: task review (spec compliance + code quality), plus Rails conventions (if Rails)"
---

# Full Code Review

Run the full review pipeline on recent changes.

## Step 1: Gather Context

Determine what to review:
- If user specified files/commits: use those
- Otherwise: review changes since last review or last commit

Get git SHAs:
```bash
git log --oneline -5  # Find BASE_SHA and HEAD_SHA
git diff --name-only BASE_SHA HEAD_SHA  # Files changed
```

## Step 2: Task Review (spec compliance + code quality)

Generate the review package (`skills/subagent-driven-development/scripts/review-package BASE_SHA HEAD_SHA` — it prints the file path it wrote), then dispatch the task reviewer using the template at `skills/subagent-driven-development/task-reviewer-prompt.md`:

```
Task tool (general-purpose):
  description: "Task review (spec + quality)"
  prompt: [Use template, fill in requirements and the review-package path]
```

**If issues found:** Report and stop. User must fix before continuing.

## Step 3: Rails Conventions Review (Rails projects only)

Check if Rails project (look for Gemfile with rails, app/controllers, etc.)

If Rails, dispatch rails reviewer using the template at `skills/subagent-driven-development/rails-reviewer-prompt.md`:

```
Task tool (general-purpose):
  Use template at skills/subagent-driven-development/rails-reviewer-prompt.md
  FILES_CHANGED: [list]
  BASE_SHA: [sha]
  HEAD_SHA: [sha]
```

**If violations found:** Report and stop. User must fix before continuing.

## Step 4: Run Local CI (if available)

If `bin/ci` exists, run it. Can run in parallel with review agents. If it fails, stop and report.

## Step 5: Report

Summarize all review results:
- ✅ Spec compliance: [passed/issues]
- ✅ Code quality: [passed/issues]
- ✅ Rails conventions: [passed/skipped/issues]
- ✅ Local CI: [passed/skipped/failed]

If all passed: "Ready for merge/PR"
If any failed: List issues with file:line references
