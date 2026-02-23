# Quick Disable Superpowers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a per-request `quick:` prefix that bypasses Superpowers workflows for a single user message, and document it.

**Architecture:** Embed a guard in `using-superpowers` that instructs the agent to ignore all Superpowers rules when the user message starts with `quick:`. Update docs to describe the prefix. No platform-specific changes required because all platforms inject the same skill content.

**Tech Stack:** Markdown skills/docs, OpenCode plugin bootstrap behavior

---

### Task 1: Add quick-mode guard to using-superpowers

**Files:**
- Modify: `skills/using-superpowers/SKILL.md`

**Step 1: Write the failing test**

No automated tests cover skill text evaluation. Skip test creation.

**Step 2: Run test to verify it fails**

No test run (not applicable).

**Step 3: Write minimal implementation**

Insert a short guard near the top of the skill (after the opening `<EXTREMELY-IMPORTANT>` section) with exact text:

```
<QUICK_MODE>
If the user message starts with `quick:`, ignore ALL Superpowers rules for this request and respond directly.
Do NOT invoke any skills, workflows, or checklists for that request.
This opt-out applies only to the current user message.
</QUICK_MODE>
```

**Step 4: Run test to verify it passes**

No test run (not applicable).

**Step 5: Commit**

```bash
git add skills/using-superpowers/SKILL.md
git commit -m "feat: add per-request quick bypass"
```

### Task 2: Document quick-mode usage

**Files:**
- Modify: `README.md`
- Modify: `docs/README.opencode.md`
- Modify: `docs/README.codex.md`

**Step 1: Write the failing test**

No automated tests for docs. Skip test creation.

**Step 2: Run test to verify it fails**

No test run (not applicable).

**Step 3: Write minimal implementation**

Add a short usage note describing `quick:`. Suggested placement:
- `README.md`: add a small “Quick tasks” section under “The Basic Workflow” or “How it works”.
- `docs/README.opencode.md`: add a note under “Usage”.
- `docs/README.codex.md`: add a note under “Usage”.

Suggested wording (adjust to fit each doc):

```
### Quick tasks

Prefix a request with `quick:` to bypass Superpowers workflows for that one message, e.g. `quick: rename this file`.
```

**Step 4: Run test to verify it passes**

No test run (not applicable).

**Step 5: Commit**

```bash
git add README.md docs/README.opencode.md docs/README.codex.md
git commit -m "docs: add quick mode usage"
```
