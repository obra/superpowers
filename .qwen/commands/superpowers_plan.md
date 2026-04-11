---
description: "Write comprehensive implementation plans. Use when you have a spec or requirements for a multi-step task, before touching code."
---

# /superpowers:plan

**REQUIRED SKILL:** `superpowers:writing-plans`

## When to Use

- After brainstorming and design approval
- Have a spec or requirements for a multi-step task
- Need detailed implementation plan before coding

## What It Does

Writes comprehensive implementation plans assuming the engineer has zero context for the codebase:

1. **Scope check** - ensure plan covers appropriate scope
2. **File structure mapping** - map out files to create/modify
3. **Task decomposition** - break into bite-sized tasks (2-5 minutes each)
4. **TDD workflow** - write test, make it fail, implement, make it pass, commit
5. **Save plan** - to `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
6. **Self-review** - check for gaps, placeholders, type consistency
7. **Execution handoff** - offer subagent-driven or inline execution

## Plan Structure

Each task includes:
- Exact file paths (create/modify/test)
- Complete code in every step
- Exact commands with expected output
- Following DRY, YAGNI, TDD principles
- Frequent commits

## No Placeholders

Never write:
- "TBD", "TODO", "implement later"
- "Add appropriate error handling" without showing how
- "Write tests for the above" without actual test code
- "Similar to Task N" - repeat the code

## After Completion

- Plan saved to `docs/superpowers/plans/`
- Self-review completed
- User chooses execution method:
  - **Subagent-Driven** (recommended) - fresh subagent per task
  - **Inline Execution** - execute in current session
