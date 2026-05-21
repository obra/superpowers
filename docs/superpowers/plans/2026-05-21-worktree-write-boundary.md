# Worktree Write Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep all implementation writes inside the active worktree after Superpowers creates or detects an isolated workspace.

**Architecture:** Add a persistent active-workspace-root contract to `using-git-worktrees`, then thread that contract through `subagent-driven-development` controller and subagent prompt templates. Add a static regression test following the existing `test-worktree-path-policy.sh` style.

**Tech Stack:** Markdown skill files, Bash static regression tests.

---

### Task 1: Add Failing Worktree Boundary Regression Test

**Files:**
- Create: `tests/claude-code/test-worktree-write-boundary.sh`
- Modify: `tests/claude-code/run-skill-tests.sh`

- [ ] **Step 1: Write the failing test**

Create `tests/claude-code/test-worktree-write-boundary.sh`:

```bash
#!/usr/bin/env bash
# Regression check: implementation work must stay inside the active worktree.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

USING_SKILL="$REPO_ROOT/skills/using-git-worktrees/SKILL.md"
SDD_SKILL="$REPO_ROOT/skills/subagent-driven-development/SKILL.md"
IMPLEMENTER_PROMPT="$REPO_ROOT/skills/subagent-driven-development/implementer-prompt.md"
SPEC_REVIEWER_PROMPT="$REPO_ROOT/skills/subagent-driven-development/spec-reviewer-prompt.md"
CODE_REVIEWER_PROMPT="$REPO_ROOT/skills/subagent-driven-development/code-quality-reviewer-prompt.md"

failures=0

assert_contains() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if grep -Fq "$pattern" "$file"; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Expected to find: $pattern"
        echo "    In file: $file"
        failures=$((failures + 1))
    fi
}

echo "=== Worktree Write Boundary Test ==="
echo ""

assert_contains "$USING_SKILL" 'WORKTREE_ROOT=$(git rev-parse --show-toplevel)' "using-git-worktrees records active root"
assert_contains "$USING_SKILL" "active workspace root" "using-git-worktrees names the active workspace root"
assert_contains "$USING_SKILL" "translate it to the same relative path under `$WORKTREE_ROOT`" "using-git-worktrees remaps stale paths"
assert_contains "$USING_SKILL" "Never write to the parent checkout" "using-git-worktrees forbids parent checkout writes"

assert_contains "$SDD_SKILL" "Record the active workspace root before dispatching any subagent" "SDD records active root before dispatch"
assert_contains "$SDD_SKILL" "include the active workspace root in every implementer and reviewer prompt" "SDD threads root through prompts"
assert_contains "$SDD_SKILL" "translate it into the active workspace root before passing it to a subagent" "SDD remaps stale paths before dispatch"

assert_contains "$IMPLEMENTER_PROMPT" "Workspace Boundary" "implementer prompt has workspace boundary section"
assert_contains "$IMPLEMENTER_PROMPT" "Treat `Work from` as a hard boundary" "implementer prompt treats directory as hard boundary"
assert_contains "$IMPLEMENTER_PROMPT" "Do not edit files outside this directory" "implementer prompt forbids outside writes"

assert_contains "$SPEC_REVIEWER_PROMPT" "Review from: [directory]" "spec reviewer prompt receives review root"
assert_contains "$CODE_REVIEWER_PROMPT" "Review from: [directory]" "code reviewer prompt receives review root"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
```

Add it to the fast test list in `tests/claude-code/run-skill-tests.sh`.

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
bash tests/claude-code/test-worktree-write-boundary.sh
```

Expected: FAIL, because the current skills do not include the active root contract.

### Task 2: Add Active Workspace Root Contract

**Files:**
- Modify: `skills/using-git-worktrees/SKILL.md`

- [ ] **Step 1: Add workspace-boundary guidance**

After worktree creation/detection and before project setup, add a step that records:

```bash
WORKTREE_ROOT=$(git rev-parse --show-toplevel)
```

The text must say:

- `WORKTREE_ROOT` is the active workspace root.
- All later file and git operations must run inside that root.
- If another agent returns a path outside it, translate it to the same relative path under `$WORKTREE_ROOT`.
- Never write to the parent checkout or sibling worktree unless the human explicitly asks.

- [ ] **Step 2: Run the focused test**

Run:

```bash
bash tests/claude-code/test-worktree-write-boundary.sh
```

Expected: still FAIL until SDD and prompts are updated.

### Task 3: Thread Root Through SDD Prompts

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`

- [ ] **Step 1: Update controller guidance**

In `subagent-driven-development`, add guidance that the controller must:

- Record the active workspace root before dispatching any subagent.
- Include the active workspace root in every implementer and reviewer prompt.
- Translate stale paths into the active workspace root before passing them to a subagent.

- [ ] **Step 2: Update implementer prompt**

Add a `Workspace Boundary` section after `Work from: [directory]` that treats the directory as a hard boundary and forbids edits outside it.

- [ ] **Step 3: Update reviewer prompts**

Add `Review from: [directory]` to both reviewer prompt templates so reviewers inspect the active worktree.

- [ ] **Step 4: Run focused test**

Run:

```bash
bash tests/claude-code/test-worktree-write-boundary.sh
```

Expected: PASS.

### Task 4: Run Regression Tests

**Files:** None.

- [ ] **Step 1: Run fast Claude Code skill tests**

Run:

```bash
bash tests/claude-code/run-skill-tests.sh --test test-worktree-write-boundary.sh
bash tests/claude-code/test-worktree-path-policy.sh
```

Expected: PASS.

- [ ] **Step 2: Run static plugin tests**

Run:

```bash
bash tests/hooks/test-session-start.sh
bash tests/opencode/run-tests.sh
```

Expected: PASS.

- [ ] **Step 3: Inspect diff**

Run:

```bash
git diff --check
git diff --stat
```

Expected: no whitespace errors and only intended files changed.
