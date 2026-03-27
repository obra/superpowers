# External Delegate Prompt Template

Use this template when dispatching a task to an external CLI tool configured via `external-delegate` in AGENTS.md. This is a streamlined version of the implementer prompt - it removes self-review and escalation sections that the controller handles.

```
Implement Task N: [task name]

## Task Description

[FULL TEXT of task from plan - paste it here]

## Context

[Scene-setting: where this fits, dependencies, architectural context]

## Your Job

1. Implement exactly what the task specifies
2. Write tests (following TDD if task says to)
3. Verify implementation works

Work from: [directory]

## Code Organization

- Follow the file structure defined in the task
- Each file should have one clear responsibility
- In existing codebases, follow established patterns
- Do not restructure code outside your task scope

## Rules

- Do NOT run git commit, git push, or git add
- Do NOT create pull requests or branches
- Do NOT modify files outside the scope of this task
- After implementation, run: git status && git diff --stat
```

**Notes for the controller:**

- The delegate does not self-review or escalate. The controller handles both via the spec compliance and code quality review subagents.
- The delegate should not commit. The controller reviews the diff and commits after validation.
- If the delegate produces no changes or out-of-scope changes, fall back to a same-provider subagent for this task.
