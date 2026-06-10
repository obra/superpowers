# SDD Task-Scoped Review Dispatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scope SDD's per-task reviews to the task (diff-first reading, justified broadening, no redundant test runs) while final branch review stays broad.

**Architecture:** Four prose edits to the subagent-driven-development skill (the per-task quality prompt becomes self-contained instead of delegating to the merge-readiness template; the spec prompt gets a third verdict channel and grounded skepticism; the implementer prompt gains a re-run-after-fix rule; SKILL.md gets controller guidance) plus one new eval scenario in the `evals/` submodule. `skills/requesting-code-review/` is deliberately untouched.

**Tech Stack:** Markdown skill files; Python setup helper + bash checks + story.md for the quorum eval.

**Spec:** `docs/superpowers/specs/2026-06-09-sdd-task-scoped-review-dispatch-design.md` — read it before starting. Decisions already settled there: full re-reviews stay; the two review stages stay separate; coordinator keeps model judgment; `requesting-code-review/` stays broad.

**These are behavior-shaping prose files, not code.** There are no unit tests for them. Each task's verification steps are exact `grep` checks that the edit landed; behavioral verification is Task 6 (static) and Task 7 (live evals, maintainer-gated).

---

### Task 1: Rewrite the per-task quality reviewer prompt as self-contained

The current file delegates to `../requesting-code-review/code-reviewer.md`, which is a merge-readiness review (architecture, security, production readiness, "Ready to merge?"). Replace the entire file with a self-contained, task-scoped template.

**Files:**
- Rewrite: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`

- [ ] **Step 1: Replace the full file contents with:**

````markdown
# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify one task's implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Subagent (general-purpose):
  description: "Review code quality for Task N"
  prompt: |
    You are reviewing one task's implementation for code quality. This is a
    task-scoped gate, not a merge review — a broad whole-branch review happens
    separately after all tasks are complete.

    ## What Was Implemented

    [DESCRIPTION]

    ## Task Requirements (context only)

    [TASK_TEXT]

    ## Git Range to Review

    **Base:** [BASE_SHA]
    **Head:** [HEAD_SHA]

    ```bash
    git diff --stat [BASE_SHA]..[HEAD_SHA]
    git diff [BASE_SHA]..[HEAD_SHA]
    ```

    ## Read-Only Review

    Your review is read-only on this checkout. Do not mutate the working tree,
    the index, HEAD, or branch state in any way. Use tools like `git show`,
    `git diff`, and `git log` to inspect history.

    ## Scope

    Spec compliance was already verified by a separate reviewer. Do not
    re-check whether the code matches the requirements or the plan.

    Start from the diff. Read the changed files first. Inspect code outside
    the diff only to evaluate a concrete risk you can name — and name it in
    your report. Cross-cutting changes are legitimate named risks: if the
    diff changes lock ordering, a function or API contract, or shared mutable
    state, checking the call sites is the right method. Do not crawl the
    codebase by default.

    ## Tests

    The implementer already ran the tests and reported results with TDD
    evidence for exactly this code. Do not re-run the suite to confirm their
    report. Run a test only when reading the code raises a specific doubt
    that no existing run answers — and then a focused test, never a
    package-wide suite, race detector run, or repeated/high-count loop. If
    heavy validation seems warranted, recommend it in your report instead of
    running it. If you cannot run commands in this environment, name the
    test you would run.

    ## What to Check

    **Code quality:**
    - Clean separation of concerns?
    - Proper error handling?
    - DRY without premature abstraction?
    - Edge cases handled?

    **Tests:**
    - Do the new and changed tests verify real behavior, not mocks?
    - Are the task's edge cases covered?

    **Structure:**
    - Does each file have one clear responsibility with a well-defined interface?
    - Are units decomposed so they can be understood and tested independently?
    - Is the implementation following the file structure from the plan?
    - Did this change create new files that are already large, or
      significantly grow existing files? (Don't flag pre-existing file
      sizes — focus on what this change contributed.)

    ## Calibration

    Categorize issues by actual severity. Not everything is Critical.
    Acknowledge what was done well before listing issues — accurate praise
    helps the implementer trust the rest of the feedback.

    ## Output Format

    ### Strengths
    [What's well done? Be specific.]

    ### Issues

    #### Critical (Must Fix)
    [Bugs, data loss risks, broken functionality]

    #### Important (Should Fix)
    [Poor error handling, test gaps, structural problems]

    #### Minor (Nice to Have)
    [Code style, optimization opportunities]

    For each issue:
    - File:line reference
    - What's wrong
    - Why it matters
    - How to fix (if not obvious)

    ### Assessment

    **Task quality:** [Approved | Needs fixes]

    **Reasoning:** [1-2 sentence technical assessment]
```

**Placeholders:**
- `[DESCRIPTION]` — task summary, from implementer's report
- `[TASK_TEXT]` — the task's requirements text or plan reference, for context
- `[BASE_SHA]` — commit before this task
- `[HEAD_SHA]` — current commit

**Reviewer returns:** Strengths, Issues (Critical/Important/Minor), Task quality verdict
````

- [ ] **Step 2: Verify the rewrite landed**

Run: `grep -c "requesting-code-review" skills/subagent-driven-development/code-quality-reviewer-prompt.md || echo ABSENT`
Expected: `ABSENT` (no more delegation)

Run: `grep -n "Task quality:" skills/subagent-driven-development/code-quality-reviewer-prompt.md | head -2`
Expected: one match (the Output Format verdict line; the "Reviewer returns" footer says "Task quality verdict" without a colon)

Run: `grep -n "worktree add\|Ready to merge" skills/subagent-driven-development/code-quality-reviewer-prompt.md || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/code-quality-reviewer-prompt.md
git commit -m "Make per-task quality reviewer prompt self-contained and task-scoped"
```

---

### Task 2: Spec reviewer prompt cleanups

Four exact edits to `skills/subagent-driven-development/spec-reviewer-prompt.md`. Current line numbers refer to the file as of commit f55642e.

**Files:**
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`

- [ ] **Step 1: Add the judge-from-the-diff clause.** After the line (currently line 31):

```
    Only read files in this diff. Do not crawl the broader codebase.
```

insert a blank line and:

```
    Spec compliance is judged by reading the diff against the requirements.
    The implementer already ran the tests and reported TDD evidence — do not
    re-run them. If a requirement cannot be verified from this diff alone
    (it lives in unchanged code or spans tasks), report it as a ⚠️ item
    instead of broadening your search.
```

- [ ] **Step 2: Trim the read-only section.** Replace (currently line 35):

```
    Your review is read-only on this checkout. Do not mutate the working tree, the index, HEAD, or branch state in any way. Use tools like `git show`, `git diff`, and `git log` to inspect history. If you need a working copy of a different revision, check it out into a separate temporary directory (e.g. `git worktree add /tmp/review-[SHA] [SHA]`) — never move HEAD on this checkout.
```

with:

```
    Your review is read-only on this checkout. Do not mutate the working tree, the index, HEAD, or branch state in any way. Use tools like `git show`, `git diff`, and `git log` to inspect history.
```

- [ ] **Step 3: Ground the skepticism.** Replace (currently lines 39-40):

```
    The implementer finished suspiciously quickly. Their report may be incomplete,
    inaccurate, or optimistic. You MUST verify everything independently.
```

with:

```
    Treat the implementer's report as unverified claims about the code. It may
    be incomplete, inaccurate, or optimistic. Verify the claims against the diff.
```

- [ ] **Step 4: Add the third verdict channel.** Replace (currently lines 74-76):

```
    Report:
    - ✅ Spec compliant (if everything matches after code inspection)
    - ❌ Issues found: [list specifically what's missing or extra, with file:line references]
```

with:

```
    Report:
    - ✅ Spec compliant (if everything matches after code inspection)
    - ❌ Issues found: [list specifically what's missing or extra, with file:line references]
    - ⚠️ Cannot verify from diff: [requirements you could not verify from the
      diff alone, and what the controller should check — report alongside the
      ✅/❌ verdict for everything you could verify]
```

- [ ] **Step 5: Verify**

Run: `grep -n "suspiciously\|worktree add" skills/subagent-driven-development/spec-reviewer-prompt.md || echo CLEAN`
Expected: `CLEAN`

Run: `grep -c "⚠️" skills/subagent-driven-development/spec-reviewer-prompt.md`
Expected: `2` (judge-from-diff clause + verdict channel)

- [ ] **Step 6: Commit**

```bash
git add skills/subagent-driven-development/spec-reviewer-prompt.md
git commit -m "Spec reviewer: judge from the diff, grounded skepticism, ⚠️ verdict channel"
```

---

### Task 3: Implementer prompt — re-run tests after fixing review findings

The reviewers' "don't re-run the implementer's tests" rule assumes the implementer re-runs tests after every fix. Make that real.

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`

- [ ] **Step 1: Insert a new section.** Immediately before the line (currently line 100):

```
    ## Report Format
```

insert:

```
    ## After Review Findings

    If a reviewer finds issues and you fix them, re-run the tests that cover
    the amended code and include the results in your fix report. Reviewers
    will not re-run tests for you — your report is the test evidence.

```

- [ ] **Step 2: Verify**

Run: `grep -n "After Review Findings" skills/subagent-driven-development/implementer-prompt.md`
Expected: one match, on a line before `## Report Format`

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/implementer-prompt.md
git commit -m "Implementer prompt: re-run covering tests after fixing review findings"
```

---

### Task 4: SKILL.md controller changes

Six exact edits to `skills/subagent-driven-development/SKILL.md`. Current line numbers refer to commit f55642e.

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

- [ ] **Step 1: Point the final-review flowchart node at the broad template.** The node label `Dispatch final code reviewer subagent for entire implementation` appears 3 times (currently lines 65, 84, 85). In all 3 occurrences, replace the label string with:

```
Dispatch final code reviewer subagent (../requesting-code-review/code-reviewer.md)
```

(Graphviz nodes are matched by label text — all three must be byte-identical or the graph grows a phantom node.)

- [ ] **Step 2: Model selection by judgment.** Replace (currently lines 97-99):

```
**Architecture, design, and review tasks**: use the most capable available model.

**Task complexity signals:**
```

with:

```
**Architecture and design tasks**: use the most capable available model.

**Review tasks**: choose the model with the same judgment, scaled to the
diff's size, complexity, and risk. A small mechanical diff does not need the
most capable model; a subtle concurrency change does.

**Task complexity signals (implementation tasks):**
```

- [ ] **Step 3: Add controller guidance sections.** Immediately before the line (currently line 122):

```
## Prompt Templates
```

insert:

```
## Handling Spec Reviewer ⚠️ Items

The spec reviewer may report "⚠️ Cannot verify from diff" items — requirements
that live in unchanged code or span tasks. These do not block dispatching the
code quality reviewer, but you must resolve each one yourself before marking
the task complete: you hold the plan and cross-task context the reviewer
lacks. If you confirm an item is a real gap, treat it as a failed spec
review — send it back to the implementer and re-review.

## Constructing Reviewer Prompts

Per-task reviews are task-scoped gates. The broad review happens once, at the
final whole-branch review. When you fill a reviewer template:

- Do not add open-ended directives like "check all uses" or "run race tests
  if useful" without a concrete, task-specific reason
- Do not ask a reviewer to re-run tests the implementer already ran on the
  same code — the implementer's report carries the test evidence

```

- [ ] **Step 4: Prompt Templates list — add the final-review pointer.** Replace (currently line 126):

```
- [code-quality-reviewer-prompt.md](code-quality-reviewer-prompt.md) - Dispatch code quality reviewer subagent
```

with:

```
- [code-quality-reviewer-prompt.md](code-quality-reviewer-prompt.md) - Dispatch code quality reviewer subagent
- Final whole-branch review: use superpowers:requesting-code-review's [code-reviewer.md](../requesting-code-review/code-reviewer.md)
```

- [ ] **Step 5: Example workflow verdict vocabulary.** Two replacements:

Replace (currently line 157):
```
Code reviewer: Strengths: Good test coverage, clean. Issues: None. Approved.
```
with:
```
Code reviewer: Strengths: Good test coverage, clean. Issues: None. Task quality: Approved.
```

Replace (currently line 191):
```
Code reviewer: ✅ Approved
```
with:
```
Code reviewer: ✅ Task quality: Approved
```

(The final reviewer's "ready to merge" line, currently line 199, stays.)

- [ ] **Step 6: Integration section.** Replace (currently line 272):

```
- **superpowers:requesting-code-review** - Code review template for reviewer subagents
```

with:

```
- **superpowers:requesting-code-review** - Code review template for the final whole-branch review
```

- [ ] **Step 7: Verify**

Run: `grep -c "Dispatch final code reviewer subagent (../requesting-code-review/code-reviewer.md)" skills/subagent-driven-development/SKILL.md`
Expected: `3`

Run: `grep -n "most capable available model" skills/subagent-driven-development/SKILL.md`
Expected: exactly one match (architecture/design bullet)

Run: `grep -n "Handling Spec Reviewer\|Constructing Reviewer Prompts" skills/subagent-driven-development/SKILL.md`
Expected: two section headers, both before `## Prompt Templates`

Run: `grep -c "Task quality: Approved" skills/subagent-driven-development/SKILL.md`
Expected: `2`

- [ ] **Step 8: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "SDD controller: reviewer prompt budgets, ⚠️ handling, final-review pointer, model judgment"
```

---

### Task 5: New eval scenario — per-task quality reviewer catches a planted defect

Lives in the `evals/` **submodule** (separate repo, `superpowers-evals`). Work on a branch there; the parent submodule-pointer bump happens at finishing time per `evals/CLAUDE.md`.

The fixture plan's Task 2 implementation snippet duplicates Task 1's formatting logic verbatim. The duplication is spec-compliant, so the spec reviewer should pass it — the per-task quality reviewer is the gate under test (DRY violation).

**Files:**
- Create: `evals/setup_helpers/sdd_quality_defect_plan.py`
- Modify: `evals/setup_helpers/__init__.py`
- Create: `evals/scenarios/sdd-quality-reviewer-catches-planted-defect/story.md`
- Create: `evals/scenarios/sdd-quality-reviewer-catches-planted-defect/setup.sh`
- Create: `evals/scenarios/sdd-quality-reviewer-catches-planted-defect/checks.sh`

- [ ] **Step 0: Branch in the submodule**

```bash
cd evals
git checkout -b sdd-quality-defect-scenario
```

- [ ] **Step 1: Create `evals/setup_helpers/sdd_quality_defect_plan.py`:**

````python
"""Setup helper for the sdd-quality-reviewer-catches-planted-defect scenario.

Scaffolds a tiny Node project with a 2-task plan whose Task 2
implementation snippet duplicates Task 1's formatting logic verbatim.
The duplication is spec-compliant — the requirements only describe
behavior — so the spec compliance reviewer should pass it. The test
measures whether the per-task code quality reviewer catches the DRY
violation and forces a refactor in the review-fix loop.
"""

from __future__ import annotations

from pathlib import Path

from setup_helpers.base import _git

PACKAGE_JSON = """\
{
  "name": "report-quality",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
"""

PLAN_BODY = """\
# Report Formatter — Implementation Plan

Two report formatting functions. Implement exactly what each task
specifies.

## Task 1: User Report

**File:** `src/report.js`

**Requirements:**
- Function named `formatUserReport`
- Takes one parameter `user`: an object with `name`, `email`, `visits`
- Returns a multi-line string: a banner of 40 `=` characters, then
  `Report for <name> <<email>>`, then the banner again, then
  `Visits: <visits>`, then a closing banner
- Export the function

**Implementation:**
```javascript
export function formatUserReport(user) {
  const banner = "=".repeat(40);
  const lines = [];
  lines.push(banner);
  lines.push(`Report for ${user.name} <${user.email}>`);
  lines.push(banner);
  lines.push(`Visits: ${user.visits}`);
  lines.push(banner);
  return lines.join("\\n");
}
```

**Tests:** Create `test/report.test.js` verifying:
- the result contains `Report for Ada <ada@example.com>` for that user
- the result contains `Visits: 3` when `visits` is `3`
- the result starts and ends with the 40-char banner

**Verification:** `npm test`

## Task 2: Admin Report

**File:** `src/report.js` (add to existing file)

**Requirements:**
- Function named `formatAdminReport`
- Takes one parameter `admin`: an object with `name`, `email`, `lastLogin`
- Same banner layout as the user report; the body line is
  `Last login: <lastLogin>` instead of the visits line
- Export the function; keep `formatUserReport` working

**Implementation:**
```javascript
export function formatAdminReport(admin) {
  const banner = "=".repeat(40);
  const lines = [];
  lines.push(banner);
  lines.push(`Report for ${admin.name} <${admin.email}>`);
  lines.push(banner);
  lines.push(`Last login: ${admin.lastLogin}`);
  lines.push(banner);
  return lines.join("\\n");
}
```

**Tests:** Add to `test/report.test.js`:
- the result contains `Report for Grace <grace@example.com>` for that admin
- the result contains `Last login: 2026-06-01`
- the result starts and ends with the 40-char banner

**Verification:** `npm test`
"""


def scaffold_sdd_quality_defect_plan(workdir: Path) -> None:
    workdir = Path(workdir)
    workdir.mkdir(parents=True, exist_ok=True)
    _git(["git", "init", "-b", "main"], cwd=workdir)
    _git(["git", "config", "user.email", "drill@test.local"], cwd=workdir)
    _git(["git", "config", "user.name", "Drill Test"], cwd=workdir)

    (workdir / "package.json").write_text(PACKAGE_JSON)
    plans_dir = workdir / "docs" / "superpowers" / "plans"
    plans_dir.mkdir(parents=True, exist_ok=True)
    (plans_dir / "report-plan.md").write_text(PLAN_BODY)

    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "initial: report formatter plan"], cwd=workdir)
````

(Note the `\\n` in the JS snippets inside PLAN_BODY: the Python source must
produce a literal `\n` in the markdown so the JS reads `lines.join("\n")`.)

- [ ] **Step 2: Register the helper.** In `evals/setup_helpers/__init__.py`:

After the line:
```python
from setup_helpers.sdd_real_projects import scaffold_sdd_go_fractals, scaffold_sdd_svelte_todo
```
add:
```python
from setup_helpers.sdd_quality_defect_plan import scaffold_sdd_quality_defect_plan
```

After the registry entry:
```python
    "scaffold_sdd_yagni_plan": scaffold_sdd_yagni_plan,
```
add:
```python
    "scaffold_sdd_quality_defect_plan": scaffold_sdd_quality_defect_plan,
```

- [ ] **Step 3: Create `evals/scenarios/sdd-quality-reviewer-catches-planted-defect/story.md`:**

```markdown
---
id: sdd-quality-reviewer-catches-planted-defect
title: SDD's per-task code quality review catches a planted DRY violation
status: ready
tags: subagent-driven-development
quorum_max_time: 90m
---

You have a small plan at docs/superpowers/plans/report-plan.md — two report
formatting functions. The plan's Task 2 implementation snippet duplicates
Task 1's formatting logic verbatim instead of sharing it. The duplication is
spec-compliant (the requirements only describe behavior), so the spec
compliance reviewer should pass it — the per-task code quality reviewer is
the gate under test. You are spec-aware — name the skill.

When the agent is ready for input, tell it to execute the plan with SDD. Use
phrasing like:

"I have a small plan at docs/superpowers/plans/report-plan.md — two report
formatting functions. Use the superpowers:subagent-driven-development skill
to execute it end-to-end — dispatch fresh subagents per task and run the
two-stage review after each."

Let the agent proceed autonomously. If it asks clarifying questions, give
brief answers. If it asks where the finished work should land — merge to the
main branch, open a PR, etc. — tell it to **merge the work into the main
checkout** (this is a local repo with no remote). If a quality reviewer
flags the duplicated formatting logic and an implementer refactors it, let
the review-fix cycle play out — that cycle is exactly the behavior under
test.

The deliverable must end up in the checkout you launched in (the main
working tree). If the agent did its work on a branch or in a worktree, it
is not done until it has merged/finished that work back into the main
checkout. Once the agent reports the plan is complete (both functions
implemented, tests passing) AND the code is present on the main checkout,
you are done.

## Acceptance Criteria

- A `Skill` invocation naming `superpowers:subagent-driven-development`
  and at least one `Agent` (subagent dispatch) tool call appear in the
  session log.
- The duplicated report-formatting logic did not survive to the end of
  the run. Either (a) the implementer never introduced the duplication
  (wrote or self-reviewed its way to shared logic), or (b) the per-task
  code quality reviewer flagged the duplication as an issue and a
  review-fix loop removed it. A fail looks like the duplicated logic
  shipping with the per-task quality reviewer approving it, or the
  duplication being caught only by the final whole-branch review.
- The per-task quality reviewers stayed task-scoped: no package-wide
  test suites, race detector runs, or repeated/high-count test loops
  appear in reviewer subagent activity, and reviewers did not re-run
  the full test suite merely to confirm the implementer's report.
- `npm test` passes in the main checkout and both `formatUserReport` and
  `formatAdminReport` are exported from src/report.js. The deterministic
  assertions gate this; the criteria above are about whether the
  *per-task quality review* was the mechanism that kept the code clean.
```

- [ ] **Step 4: Create `evals/scenarios/sdd-quality-reviewer-catches-planted-defect/setup.sh`:**

```bash
#!/usr/bin/env bash
set -euo pipefail
uv run setup-helpers run scaffold_sdd_quality_defect_plan
```

Then: `chmod +x evals/scenarios/sdd-quality-reviewer-catches-planted-defect/setup.sh`

- [ ] **Step 5: Create `evals/scenarios/sdd-quality-reviewer-catches-planted-defect/checks.sh`** (no executable bit):

```bash
pre() {
    git-repo
    git-branch main
    requires-tool npm
    file-exists 'docs/superpowers/plans/report-plan.md'
    file-contains 'docs/superpowers/plans/report-plan.md' 'formatAdminReport'
    file-contains 'docs/superpowers/plans/report-plan.md' 'repeat\(40\)'
}

post() {
    skill-called superpowers:subagent-driven-development
    tool-called Agent
    command-succeeds 'npm test'
    file-contains 'src/report.js' 'export function formatUserReport'
    file-contains 'src/report.js' 'export function formatAdminReport'
    command-succeeds 'test "$(grep -c "repeat(40)" src/report.js)" -le 1'
}
```

(The last check is the deterministic DRY gate: the banner construction
`"=".repeat(40)` must appear at most once in the final file — shared, not
duplicated per function.)

- [ ] **Step 6: Validate and test in the evals repo**

```bash
cd evals
uv run quorum check
uv run ruff check
uv run pytest -x -q
```

Expected: all pass; `quorum check` lists the new scenario without errors.

- [ ] **Step 7: Commit (in the submodule)**

```bash
cd evals
git add setup_helpers/sdd_quality_defect_plan.py setup_helpers/__init__.py scenarios/sdd-quality-reviewer-catches-planted-defect/
git commit -m "Add sdd-quality-reviewer-catches-planted-defect scenario"
```

---

### Task 6: Static verification sweep

**Files:** none modified — verification only.

- [ ] **Step 1: No dangling references in the parent repo**

Run: `grep -rn "requesting-code-review" skills/subagent-driven-development/`
Expected: matches only in SKILL.md (final-review flowchart node ×3, Prompt Templates pointer, Integration bullet). None in code-quality-reviewer-prompt.md.

Run: `grep -rn "Ready to merge" skills/subagent-driven-development/ || echo CLEAN`
Expected: `CLEAN`

- [ ] **Step 2: Plugin infrastructure tests**

Run: `bash tests/shell-lint/test-lint-shell.sh`
Expected: all PASS (we added `setup.sh` only inside the evals submodule, which has its own checks).

- [ ] **Step 3: Cross-platform tool tables still coherent**

Run: `grep -n "code-quality-reviewer" skills/using-superpowers/references/antigravity-tools.md skills/using-superpowers/references/gemini-tools.md`
Expected: both tables still list `code-quality-reviewer` as a reviewer template (the new prompt's "If you cannot run commands in this environment, name the test you would run" line keeps the read-only `research` mapping valid — no table edits needed).

---

### Task 7: Live before/after evals (maintainer-gated)

Live quorum runs launch agent CLIs in permissive modes — **trusted-maintainer operation; Jesse launches these**, per `evals/CLAUDE.md`. Requires `ANTHROPIC_API_KEY`.

- [ ] **Step 1: Baseline (skills as released on dev)** — from the main checkout (`/Users/jesse/git/superpowers/superpowers`, on dev), or any checkout without this branch's changes:

```bash
cd evals
export SUPERPOWERS_ROOT=/Users/jesse/git/superpowers/superpowers
uv run quorum run scenarios/sdd-rejects-extra-features --coding-agent claude
uv run quorum run scenarios/sdd-go-fractals --coding-agent claude
uv run quorum run scenarios/sdd-svelte-todo --coding-agent claude
uv run quorum run scenarios/spec-reviewer-catches-planted-flaws --coding-agent claude
```

- [ ] **Step 2: After (this branch's skills)** — point `SUPERPOWERS_ROOT` at this worktree:

```bash
cd evals
export SUPERPOWERS_ROOT=/Users/jesse/git/superpowers/superpowers/.claude/worktrees/sdd-review-dispatch
uv run quorum run scenarios/sdd-rejects-extra-features --coding-agent claude
uv run quorum run scenarios/sdd-go-fractals --coding-agent claude
uv run quorum run scenarios/sdd-svelte-todo --coding-agent claude
uv run quorum run scenarios/spec-reviewer-catches-planted-flaws --coding-agent claude
uv run quorum run scenarios/sdd-quality-reviewer-catches-planted-defect --coding-agent claude
uv run quorum show
```

- [ ] **Step 3: Compare**

Pass bar: all four pre-existing scenarios still pass after the change (no regression in catch rate); the new planted-defect scenario passes. For exploration cost, compare reviewer-subagent tool-call counts between the before/after run transcripts (no automated check exists — the spec calls this out as a known gap).

---

## Finishing

After all tasks pass: the evals submodule commit needs to land in `superpowers-evals` (PR to its `main`), then this branch bumps the `evals` submodule pointer — per `evals/CLAUDE.md`, the parent bump is part of propagation, not optional. Then use superpowers:finishing-a-development-branch. PRs against superpowers target `dev`.
