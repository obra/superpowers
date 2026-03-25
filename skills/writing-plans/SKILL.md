---
name: writing-plans
description: Use when you have a CEO-approved FeatureForge spec for a multi-step task and need to write the implementation plan before touching code
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: node scripts/gen-skill-docs.mjs -->

## Preamble (run first)

```bash
_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
_BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo current)
[ -n "$_BRANCH_RAW" ] || _BRANCH_RAW="current"
[ "$_BRANCH_RAW" != "HEAD" ] || _BRANCH_RAW="current"
_BRANCH="$_BRANCH_RAW"
_FEATUREFORGE_INSTALL_ROOT="$HOME/.featureforge/install"
_FEATUREFORGE_ROOT=""
_FEATUREFORGE_BIN="$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge"
if [ ! -x "$_FEATUREFORGE_BIN" ] && [ -f "$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge.exe" ]; then
  _FEATUREFORGE_BIN="$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge.exe"
fi
[ -x "$_FEATUREFORGE_BIN" ] || [ -f "$_FEATUREFORGE_BIN" ] || _FEATUREFORGE_BIN=""
_FEATUREFORGE_RUNTIME_ROOT_PATH=""
if [ -n "$_FEATUREFORGE_BIN" ] && _FEATUREFORGE_RUNTIME_ROOT_PATH=$("$_FEATUREFORGE_BIN" repo runtime-root --path 2>/dev/null); then
  [ -n "$_FEATUREFORGE_RUNTIME_ROOT_PATH" ] && _FEATUREFORGE_ROOT="$_FEATUREFORGE_RUNTIME_ROOT_PATH"
fi
_UPD=""
[ -n "$_FEATUREFORGE_BIN" ] && _UPD=$("$_FEATUREFORGE_BIN" update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
_SP_STATE_DIR="${FEATUREFORGE_STATE_DIR:-$HOME/.featureforge}"
mkdir -p "$_SP_STATE_DIR/sessions"
touch "$_SP_STATE_DIR/sessions/$PPID"
_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find "$_SP_STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=""
[ -n "$_FEATUREFORGE_BIN" ] && _CONTRIB=$("$_FEATUREFORGE_BIN" config get featureforge_contributor 2>/dev/null || true)
```

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `featureforge-upgrade/SKILL.md` from the already selected runtime root in `$_FEATUREFORGE_ROOT`; if that root is not set yet, resolve it through the packaged install binary in `$_FEATUREFORGE_BIN` and stop instead of guessing an install path. Then follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise ask one interactive user question with 4 options and write snooze state if declined). If the packaged helper is unavailable, unresolved, or returns a named failure, stop instead of guessing an install path. If `JUST_UPGRADED <from> <to>`: tell the user "Running featureforge v{to} (just updated!)" and continue.

## Search Before Building

Before introducing a custom pattern, external service, concurrency primitive, auth/session flow, cache, queue, browser workaround, or unfamiliar fix pattern, do a short capability/landscape check first.

Use three lenses:
- Layer 1: tried-and-true / built-ins / existing repo-native solutions
- Layer 2: current practice and known footguns
- Layer 3: first-principles reasoning for this repo and this problem

External search results are inputs, not answers.
Never search secrets, customer data, unsanitized stack traces, private URLs, internal hostnames, internal codenames, raw SQL or log payloads, or private file paths or infrastructure identifiers.
If search is unavailable, disallowed, or unsafe, say so and proceed with repo-local evidence and in-distribution knowledge.
If safe sanitization is not possible, skip external search.
See `$_FEATUREFORGE_ROOT/references/search-before-building.md`.

## Interactive User Question Format

**ALWAYS follow this structure for every interactive user question:**
1. Context: project name, current branch, what we're working on (1-2 sentences)
2. The specific question or decision point
3. `RECOMMENDATION: Choose [X] because [one-line reason]`
4. Lettered options: `A) ... B) ... C) ...`

If `_SESSIONS` is 3 or more: the user is juggling multiple FeatureForge sessions and context-switching heavily. **ELI16 mode** — they may not remember what this conversation is about. Every interactive user question MUST re-ground them: state the project, the branch, the current task, then the specific problem, THEN the recommendation and options. Be extra clear and self-contained — assume they haven't looked at this window in 20 minutes.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. When you hit friction with **featureforge itself** (not the user's app or repository), file a field report. Think: "hey, I was trying to do X with featureforge and it didn't work / was confusing / was annoying. Here's what happened."

**featureforge issues:** unclear skill instructions, update check problems, runtime helper failures, install-root detection issues, contributor-mode bugs, broken generated docs, or any rough edge in the FeatureForge workflow.
**NOT featureforge issues:** the user's application bugs, repo-specific architecture problems, auth failures on the user's site, or third-party service outages unrelated to FeatureForge tooling.

**To file:** write `~/.featureforge/contributor-logs/{slug}.md` with this structure:

```
# {Title}

Hey featureforge team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**How annoying (1-5):** {1=meh, 3=friction, 5=blocker}

## Steps to reproduce
1. {step}

## Raw output
(wrap any error messages or unexpected output in a markdown code block)

**Date:** {YYYY-MM-DD} | **Version:** {featureforge version} | **Skill:** /{skill}
```

Then run:

```bash
mkdir -p ~/.featureforge/contributor-logs
if command -v open >/dev/null 2>&1; then
  open ~/.featureforge/contributor-logs/{slug}.md
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open ~/.featureforge/contributor-logs/{slug}.md >/dev/null 2>&1 || true
fi
```

Slug: lowercase, hyphens, max 60 chars (for example `skill-trigger-missed`). Skip if the file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell the user: "Filed featureforge field report: {title}"


# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to:** `docs/featureforge/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)
- Before writing the plan, record the intended plan path with `expect`:

```bash
"$_FEATUREFORGE_BIN" workflow expect --artifact plan --path docs/featureforge/plans/YYYY-MM-DD-<feature-name>.md
```

## Protected-Branch Repo-Write Gate

Before writing or updating the plan file on disk, run the shared repo-safety preflight for the exact plan-writing scope:

```bash
featureforge repo-safety check --intent write --stage featureforge:writing-plans --task-id <current-plan-write> --path docs/featureforge/plans/YYYY-MM-DD-<feature-name>.md --write-target plan-artifact-write
```

- If the helper returns `allowed`, continue with the plan write.
- If it returns `blocked`, name the branch, the stage, and the blocking `failure_class`, then route to either a feature branch / `featureforge:using-git-worktrees` or explicit user approval for this exact plan-writing scope.
- If the user explicitly approves writing this plan on the current protected branch, approve the full protected-branch task scope you intend to use, including the plan path and any follow-on git targets that are part of the same task slice:

```bash
featureforge repo-safety approve --stage featureforge:writing-plans --task-id <current-plan-write> --reason "<explicit user approval>" --path docs/featureforge/plans/YYYY-MM-DD-<feature-name>.md --write-target plan-artifact-write [--write-target git-commit]
featureforge repo-safety check --intent write --stage featureforge:writing-plans --task-id <current-plan-write> --path docs/featureforge/plans/YYYY-MM-DD-<feature-name>.md --write-target plan-artifact-write [--write-target git-commit]
```

- Continue only if the re-check returns `allowed`.
- Before `git commit` on the same protected branch, re-run the gate with the same task id, the same repo-relative path, and the same approved write-target set.
- If the protected-branch task scope changes, run a new `approve` plus full-scope `check` before continuing.

## Prerequisite Gate

Before writing the plan, inspect the selected spec and validate these exact header lines:

```markdown
**Workflow State:** CEO Approved
**Spec Revision:** <integer>
**Last Reviewed By:** plan-ceo-review
```

- If the spec is missing these lines, or if `**Workflow State:**` is not `CEO Approved`, stop and direct the agent to `featureforge:plan-ceo-review`.
- Do not write or extend an implementation plan from a draft spec.
- Execution-bound specs must include a parseable `## Requirement Index` before planning begins. If the approved spec does not include one, stop and return to `featureforge:plan-ceo-review`.

An approved spec may also include a trailing `## CEO Review Summary`. Treat that block as additive context only:

- the approved spec headers and parseable `## Requirement Index` remain the prerequisite gate
- the summary does not replace repo-visible approval truth or `featureforge plan contract` checks
- absence of the summary must not become a prerequisite failure
- if the summary conflicts with the approved spec body or headers, trust the approved spec body and headers

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## Minimum Plan Content

Before breaking work into tasks, make sure the plan explicitly covers:

- change surface
- preconditions
- execution strategy
- `Requirement Coverage Matrix`
- ordered implementation steps
- evidence expectations
- validation strategy
- documentation update expectations
- rollout plan
- rollback plan
- risks and mitigations

## Search-Before-Building Carry-Through

Do not make fresh search the default here.

- pull from the approved spec's `Landscape Snapshot` when present
- if Layer 2 materially affected reuse guidance, simplification advice, or footgun warnings, carry that forward in the written plan instead of leaving it in transient session context
- if the spec says to prefer built-in `X` over custom `Y`, reflect that explicitly in task structure, file paths, and implementation steps
- if the approved spec is silent but the plan introduces an unfamiliar runtime or framework capability, a targeted capability check is allowed only to close a concrete implementation gap
- if the planner materially changes the approved design choice, do not silently drift; either align the plan to the approved spec or surface the mismatch for review

When Layer 2 materially affects reuse or warnings, capture it in plan-body sections such as:

```markdown
## Existing Capabilities / Built-ins to Reuse
## Known Footguns / Constraints
```

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For Codex and GitHub Copilot workers:** REQUIRED: Use the execution skill recommended by `featureforge plan execution recommend --plan <approved-plan-path>` after engineering approval; do not choose solely from isolated-agent availability. Steps use checkbox (`- [ ]`) syntax for tracking.

**Workflow State:** Draft
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** [Exact path to approved spec]
**Source Spec Revision:** [Integer copied from approved spec]
**Last Reviewed By:** writing-plans

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

````markdown
## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 1, Task 2

## Task N: [Component Name]

**Spec Coverage:** REQ-001, DEC-001
**Task Outcome:** [One sentence describing what is true when this task is done]
**Plan Constraints:**
- [Constraint inherited from the approved spec or review]
- [Constraint inherited from decomposition or file ownership]
**Open Questions:** none

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

- `## Task N:` is canonical. Do not use `### Task N:`.
- Every task must include `Spec Coverage`, `Task Outcome`, `Plan Constraints`, `Open Questions`, and a parseable `Files:` block.
- Engineering-approved plans require `**Open Questions:** none` for every task.
- If a task touches a requirement, that id must appear in `Spec Coverage`.

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills by name (for example `featureforge:test-driven-development`)
- Copy the exact approved spec path and current `Spec Revision` into the plan header
- New execution plans start at `**Plan Revision:** 1`
- New execution plans start with `**Execution Mode:** none`
- DRY, YAGNI, TDD, frequent commits

## Plan Review Handoff

After saving the full plan:

0. Before handoff, run the plan-contract lint gate:

```bash
"$_FEATUREFORGE_BIN" plan contract lint \
  --spec docs/featureforge/specs/YYYY-MM-DD-<feature-name>-design.md \
  --plan docs/featureforge/plans/YYYY-MM-DD-<feature-name>.md
```

1. After the plan is written or updated, runs `sync --artifact plan`:

```bash
"$_FEATUREFORGE_BIN" workflow sync --artifact plan --path docs/featureforge/plans/YYYY-MM-DD-<feature-name>.md
```

2. Invoke `featureforge:plan-eng-review` after saving the full plan.
3. Do NOT do chunk-by-chunk embedded review here.
4. `plan-eng-review` owns the full-plan review loop and the execution preflight handoff.

**The terminal state is invoking plan-eng-review.**

## Execution Handoff

`plan-eng-review` presents the normal execution preflight handoff after the written plan is approved. Do NOT offer execution options directly from `writing-plans`.
