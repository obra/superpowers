---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

Produce a bite-sized, zero-context implementation plan. Each step = one action (2-5 min). Exact paths, full code, exact commands with expected output. DRY, YAGNI, TDD, frequent commits.

Run in a dedicated worktree (created by `brainstorming`). Save to `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md` (user preferences override).

## Scope Check

If the spec covers multiple independent subsystems, split into one plan per subsystem — each producing working, testable software on its own.

## File Structure First

Map files to be created/modified with their responsibility before defining tasks. One clear responsibility per file, well-defined interfaces. Files that change together live together. In existing codebases, follow existing patterns; only split an already-unwieldy file if the plan naturally touches it.

## Plan Header

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use `- [ ]` checkbox syntax.

**Goal:** [one sentence]

**Architecture:** [2-3 sentences]

**Tech Stack:** [key libs]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write failing test**
```python
def test_specific_behavior():
    assert function(input) == expected
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Minimal implementation**
```python
def function(input): return expected
```

- [ ] **Step 4: Verify passes**
Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## No Placeholders

Plan failures — never write:
- "TBD", "TODO", "implement later"
- "Add appropriate error handling / validation / edge cases"
- "Write tests for the above" (without code)
- "Similar to Task N" (repeat the code — engineer may read out of order)
- Steps describing *what* without showing *how*
- References to types/functions/methods never defined in any task

**Allowed shortcut — `See <file:line-range>`:** acceptable when the referenced lines contain exactly the pattern to reuse (supports REUSE > CREATE, see `using-superpowers` § The Golden Rule). Must be concrete lines.

✅ `"Add validator following pattern in src/validators/email.ts:12-34"`
✅ `"Handle errors like src/api/users.ts:45-62 (catch + toast + log)"`
❌ `"Add appropriate validator"` — vague
❌ `"See existing validators"` — no anchor

## Self-Review

After writing, check the plan against the spec:

1. **Spec coverage:** every requirement → at least one task? List gaps, add tasks.
2. **Placeholder scan:** any "No Placeholders" pattern slipped in? Fix.
3. **Type consistency:** `clearLayers()` in Task 3 and `clearFullLayers()` in Task 7 is a bug — names/signatures match across tasks?

Fix inline, no re-review.

## Execution Handoff

After saving, ask:

> "Plan saved to `docs/superpowers/plans/<filename>.md`. Two options:
> 1. **Subagent-Driven (recommended)** — fresh subagent per task + batched review
> 2. **Inline Execution** — same session with batch checkpoints
>
> Which?"

- Subagent-Driven → `superpowers:subagent-driven-development`
- Inline → `superpowers:executing-plans`
