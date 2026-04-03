---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Use a dedicated Codex reviewer agent to catch issues before they compound.

## When to Request Review

- After each task in subagent-driven development
- After completing a major feature
- Before merge or branch handoff
- When stuck and a fresh technical read would help

## How to Request Review

1. Read `agents/code-reviewer.md`
2. Substitute the task-specific scope, requirements, and diff range
3. Spawn a reviewer agent with the filled prompt
4. Wait for the reviewer result
5. If the reviewer finds blocking issues, fix them, commit the fixes, and rerun review against the same scope
6. Repeat until the review passes cleanly

## Diff Range

```bash
BASE_SHA=<commit before the reviewed task or batch began>
HEAD_SHA=$(git rev-parse HEAD)
```

Keep `BASE_SHA` pinned to the start of the reviewed task or batch, even if the fix loop produced multiple commits. Use `origin/main` or another explicit base when the review should cover more than the current task.

## Quality Bar

- Fix critical issues immediately
- Fix important issues before continuing
- Document why you disagree if you reject review feedback
- Do not skip review because the change feels small
