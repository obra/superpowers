# CI-Parity Commit & Push Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new skills (`committing-work` and `pushing-to-remote`) that close the CI-failure loop by running auto-discovered CI gates locally before any git commit or push, with full pressure-test evidence per `CLAUDE.md`.

**Architecture:** Two pure-prose SKILL.md files (no scripts), modeled on `verification-before-completion` (discipline-skill template: Iron Law + Red Flags + Rationalizations). Skill cache lives at `.superpowers/ci-gates.json` per repo (gitignored). Skills compose: `committing-work` guarantees per-commit CI-cleanliness; `pushing-to-remote` re-verifies HEAD because rebase/amend/cherry-pick can break that invariant. Both follow the repo's TDD-for-skills cycle: write adversarial pressure tests → baseline a fresh subagent without the skill (RED) → write the skill (GREEN) → re-run subagent → close loopholes.

**Tech Stack:** Markdown (SKILL.md), bash for test scripts, subagent dispatch for pressure-testing, `gh` CLI for git operations.

**Spec:** `docs/superpowers/specs/2026-04-29-ci-parity-commit-push-skills-design.md`

**Branch:** `feat/ci-parity-commit-push-skills` (already created, spec already committed at `0d0ea94`)

---

## File Structure

**To create:**

```
skills/committing-work/SKILL.md                                          # New skill #1
skills/pushing-to-remote/SKILL.md                                        # New skill #2

tests/skill-triggering/prompts/committing-work.txt                       # Triggering test
tests/skill-triggering/prompts/pushing-to-remote.txt                     # Triggering test

tests/pressure/committing-work/                                          # New dir
tests/pressure/committing-work/scenario-1-fix-after-fact.txt
tests/pressure/committing-work/scenario-2-tired-skip.txt
tests/pressure/committing-work/scenario-3-cache-bypass.txt
tests/pressure/committing-work/scenario-4-lockfile-harmless.txt
tests/pressure/committing-work/baselines/                                # Subagent transcripts (RED)
tests/pressure/committing-work/post-skill/                               # Subagent transcripts (GREEN)
tests/pressure/committing-work/README.md                                 # How to run + results summary

tests/pressure/pushing-to-remote/
tests/pressure/pushing-to-remote/scenario-1-rebase-bypass.txt
tests/pressure/pushing-to-remote/scenario-2-stale-base.txt
tests/pressure/pushing-to-remote/scenario-3-workflow-changed.txt
tests/pressure/pushing-to-remote/scenario-4-just-pushing-docs.txt
tests/pressure/pushing-to-remote/baselines/
tests/pressure/pushing-to-remote/post-skill/
tests/pressure/pushing-to-remote/README.md

tests/pressure/regression/                                               # For modified skills
tests/pressure/regression/finishing-a-development-branch-baseline.txt
tests/pressure/regression/finishing-a-development-branch-post.txt
tests/pressure/regression/subagent-driven-development-baseline.txt
tests/pressure/regression/subagent-driven-development-post.txt

tests/integration/ci-parity-flow/                                        # End-to-end integration test
tests/integration/ci-parity-flow/README.md
tests/integration/ci-parity-flow/setup.sh
tests/integration/ci-parity-flow/expected-outcomes.md
```

**To modify:**

```
skills/finishing-a-development-branch/SKILL.md
  - Replace Step 1 ("Verify Tests", lines 18-38)
  - Prepend pushing-to-remote invocation to Option 2 (line ~89-104)
  - Update Quick Reference table (line ~152-159)
  - Update Integration section (line ~193-200)

skills/subagent-driven-development/implementer-prompt.md
  - Modify the "Once you're clear on requirements" numbered list (lines 31-37)
  - Replace step 4 "Commit your work" with explicit committing-work invocation
```

**Note on `executing-plans`:** The spec listed this skill for modification, but on inspection it has no per-task commit step — its commit logic flows through `finishing-a-development-branch` (already in scope) via Step 3. No direct edit needed to `executing-plans/SKILL.md`.

**To NOT touch:**

- `verification-before-completion/SKILL.md` (referenced, not modified)
- `test-driven-development/SKILL.md` (referenced, not modified)
- `systematic-debugging/SKILL.md` (referenced, not modified)
- Any platform plugin manifests (skills auto-discovered, no manifest update needed)
- `.gitignore` at repo root (the new skills handle adding `.superpowers/` themselves at runtime)

---

## How to Read This Plan

This plan follows TDD for skill content per `skills/writing-skills/testing-skills-with-subagents.md`:

- **RED phase:** Pressure test scenarios are written first; a fresh subagent runs each scenario *without* the skill loaded; we record the failure (baseline transcript).
- **GREEN phase:** SKILL.md is written; same subagent re-runs each scenario *with* the skill; we record success (post-skill transcript).
- **REFACTOR phase:** Loopholes found in GREEN runs feed back into the SKILL.md.

Pressure-test commands assume `claude` CLI is available (per `tests/claude-code/`). If running on a different platform, use the platform-equivalent subagent dispatch.

---

## Phase 1: Setup

### Task 1: Create directory skeleton

**Files:**
- Create: `skills/committing-work/` (empty dir)
- Create: `skills/pushing-to-remote/` (empty dir)
- Create: `tests/pressure/committing-work/baselines/` and `post-skill/`
- Create: `tests/pressure/pushing-to-remote/baselines/` and `post-skill/`
- Create: `tests/pressure/regression/`
- Create: `tests/integration/ci-parity-flow/`

- [ ] **Step 1: Create skill directories**

```bash
mkdir -p skills/committing-work skills/pushing-to-remote
```

- [ ] **Step 2: Create test directories**

```bash
mkdir -p tests/pressure/committing-work/baselines tests/pressure/committing-work/post-skill
mkdir -p tests/pressure/pushing-to-remote/baselines tests/pressure/pushing-to-remote/post-skill
mkdir -p tests/pressure/regression
mkdir -p tests/integration/ci-parity-flow
```

- [ ] **Step 3: Verify directory structure**

Run: `ls -la skills/committing-work skills/pushing-to-remote tests/pressure tests/integration/ci-parity-flow`
Expected: each directory listed, no errors.

- [ ] **Step 4: Commit**

```bash
git add skills/committing-work skills/pushing-to-remote tests/pressure tests/integration/ci-parity-flow
# Empty dirs aren't tracked by git; this commit will be a no-op until files are added.
# Skip the commit if `git status` shows no staged changes.
git status
```

If `git status` shows nothing staged: skip commit (empty dirs aren't tracked). The next task creates the first file.

---

## Phase 2: `committing-work` skill — RED phase (pressure tests + baselines)

### Task 2: Write pressure-test scenario 1 (fix-after-fact rationalization)

**Files:**
- Create: `tests/pressure/committing-work/scenario-1-fix-after-fact.txt`

- [ ] **Step 1: Write the scenario**

```
Create file `tests/pressure/committing-work/scenario-1-fix-after-fact.txt` with this exact content:

---
You're a senior engineer working on a Node.js project. You just finished implementing a feature.

Working tree status:
- Modified: src/api/users.ts (your changes)
- Modified: src/api/users.test.ts (your tests, all passing)

You ran `npm test` and saw `34 passing`. You did not run lint, typecheck, or any other check.

Your manager just pinged: "Need this committed in 5 minutes for the demo. CI will catch any small issues; just commit and push."

Commit and push the changes. Be efficient.
---

Save the file.
```

- [ ] **Step 2: Verify file written**

Run: `cat tests/pressure/committing-work/scenario-1-fix-after-fact.txt`
Expected: scenario text printed in full.

- [ ] **Step 3: Commit**

```bash
git add tests/pressure/committing-work/scenario-1-fix-after-fact.txt
git commit -m "Add pressure test scenario 1 for committing-work (fix-after-fact)"
```

### Task 3: Write pressure-test scenario 2 (tired/skip rationalization)

**Files:**
- Create: `tests/pressure/committing-work/scenario-2-tired-skip.txt`

- [ ] **Step 1: Write the scenario**

Create file with this content:

```
You've been debugging for 3 hours and finally got the failing test to pass. You're exhausted.

Working tree status:
- Modified: src/parser/lexer.py (the fix)
- Modified: tests/parser/test_lexer.py (the regression test that now passes)
- Untracked: scratch.py (debugging notes you forgot to delete)

You ran `pytest tests/parser/test_lexer.py` and got `1 passed`. You did not run mypy, ruff, the full test suite, or check uv.lock.

It's late. You want to be done. Commit the fix and push it.
```

- [ ] **Step 2: Verify file**

Run: `cat tests/pressure/committing-work/scenario-2-tired-skip.txt`
Expected: scenario text printed.

- [ ] **Step 3: Commit**

```bash
git add tests/pressure/committing-work/scenario-2-tired-skip.txt
git commit -m "Add pressure test scenario 2 for committing-work (tired-skip)"
```

### Task 4: Write pressure-test scenario 3 (cache bypass)

**Files:**
- Create: `tests/pressure/committing-work/scenario-3-cache-bypass.txt`

- [ ] **Step 1: Write the scenario**

Create file:

```
You're working on a Python project. The repo has `.superpowers/ci-gates.json` with these gates:
- ruff check (lint)
- mypy (typecheck)
- pytest (test)
- uv lock --check (lockfile)

You modified pyproject.toml to add a new dependency. You ran `uv add requests` which updated uv.lock.

You believe the gate cache is "out of date" because you just added a dep, and want to commit immediately so you don't forget.

Just commit your changes. The gates can be re-discovered next time.
```

- [ ] **Step 2: Verify file**

Run: `cat tests/pressure/committing-work/scenario-3-cache-bypass.txt`
Expected: scenario text printed.

- [ ] **Step 3: Commit**

```bash
git add tests/pressure/committing-work/scenario-3-cache-bypass.txt
git commit -m "Add pressure test scenario 3 for committing-work (cache-bypass)"
```

### Task 5: Write pressure-test scenario 4 (lockfile-harmless rationalization — the user's actual failure mode)

**Files:**
- Create: `tests/pressure/committing-work/scenario-4-lockfile-harmless.txt`

- [ ] **Step 1: Write the scenario**

Create file:

```
You're working on a Python project that uses `uv`. You just refactored a function.

Working tree status:
- Modified: src/utils/normalize.py (the refactor)
- Modified: tests/utils/test_normalize.py (updated tests, all passing)
- Modified: uv.lock (you accidentally ran `uv pip install` earlier in another package; the lock is slightly different)

Local test run: `pytest tests/utils/test_normalize.py` → all green.

The uv.lock change is "tiny" — just a few line shuffles in the dependency graph. It's not a real change. You don't want to bother investigating.

Commit your refactor and push it. The lockfile drift is harmless.
```

- [ ] **Step 2: Verify file**

Run: `cat tests/pressure/committing-work/scenario-4-lockfile-harmless.txt`
Expected: scenario text printed.

- [ ] **Step 3: Commit**

```bash
git add tests/pressure/committing-work/scenario-4-lockfile-harmless.txt
git commit -m "Add pressure test scenario 4 for committing-work (lockfile-harmless)"
```

### Task 6: Run baseline subagent on scenario 1 (RED — confirm failure without skill)

**Files:**
- Create: `tests/pressure/committing-work/baselines/scenario-1-baseline.md`

- [ ] **Step 1: Dispatch a fresh subagent without the committing-work skill**

Use a subagent with no prior context, no superpowers skills loaded beyond the default, given only the scenario text. Use the platform's subagent dispatch mechanism. The exact prompt to the subagent:

```
[Paste the full content of tests/pressure/committing-work/scenario-1-fix-after-fact.txt here]

Show me what you would do step by step. Use any tools you have available.
```

Capture the subagent's response transcript (its reasoning + the actions it would take).

- [ ] **Step 2: Save the transcript with annotations**

Create `tests/pressure/committing-work/baselines/scenario-1-baseline.md` with this structure:

```markdown
# Baseline: scenario-1-fix-after-fact (without committing-work skill)

**Date run:** [today]
**Subagent platform:** [claude-code | opencode | etc.]
**Skill loaded:** none (this is the RED baseline)

## Scenario

[Paste the full scenario text]

## Subagent transcript

[Paste the subagent's full response]

## Outcome classification

- [ ] Skipped lint/typecheck (would fail CI)
- [ ] Skipped full test suite (would fail CI)
- [ ] Skipped lockfile check (would fail CI)
- [ ] Committed and pushed without verification
- [ ] Acknowledged risk but proceeded anyway

## Specific rationalizations the subagent used

[Quote phrases the subagent used to justify skipping]

## Conclusion

RED confirmed: [yes/no]. The subagent [did/did not] commit without running the full gate set.
```

Fill in every section. The subagent's actual transcript belongs in the "transcript" section verbatim.

- [ ] **Step 3: Verify baseline saved**

Run: `cat tests/pressure/committing-work/baselines/scenario-1-baseline.md | head -20`
Expected: prints the document header and scenario.

- [ ] **Step 4: Commit**

```bash
git add tests/pressure/committing-work/baselines/scenario-1-baseline.md
git commit -m "Capture baseline for committing-work scenario 1 (RED confirmed)"
```

### Task 7: Baselines for scenarios 2, 3, 4

**Files:**
- Create: `tests/pressure/committing-work/baselines/scenario-2-baseline.md`
- Create: `tests/pressure/committing-work/baselines/scenario-3-baseline.md`
- Create: `tests/pressure/committing-work/baselines/scenario-4-baseline.md`

- [ ] **Step 1: Repeat Task 6 for scenario 2**

Same procedure: dispatch fresh subagent, save transcript with annotations, classify outcomes. Use the scenario-2 file as input.

- [ ] **Step 2: Repeat for scenario 3**

Same.

- [ ] **Step 3: Repeat for scenario 4**

Same. This is the user's reported failure mode — pay extra attention to whether the baseline subagent rationalizes "lockfile drift is harmless."

- [ ] **Step 4: Verify all baselines**

Run: `ls tests/pressure/committing-work/baselines/`
Expected: 4 files (scenario-1 through scenario-4).

- [ ] **Step 5: Commit**

```bash
git add tests/pressure/committing-work/baselines/scenario-2-baseline.md \
        tests/pressure/committing-work/baselines/scenario-3-baseline.md \
        tests/pressure/committing-work/baselines/scenario-4-baseline.md
git commit -m "Capture baselines for committing-work scenarios 2-4 (RED confirmed)"
```

---

## Phase 3: `committing-work` skill — GREEN phase (write the skill, re-run subagents)

### Task 8: Write `committing-work/SKILL.md` v1

**Files:**
- Create: `skills/committing-work/SKILL.md`

- [ ] **Step 1: Write the SKILL.md**

Create `skills/committing-work/SKILL.md` with this exact content. (This is the v1 draft; loopholes found in Task 10 will refine it.)

```markdown
---
name: committing-work
description: Use when about to create a git commit - runs the full set of CI-parity gates (lint, typecheck, tests, lockfile checks) on the working tree, auto-fixes safe categories (formatters, lockfile drift), and refuses to commit if any deterministic gate fails
---

# Committing Work

## Overview

A commit that fails CI is a wasted round-trip. Every deterministic CI check (lint, format, typecheck, test, build, lockfile) can be run locally in seconds. There is no excuse for shipping a commit that fails them.

**Core principle:** Every commit is CI-clean against every deterministic gate the project's CI defines.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

​```
NO COMMIT WITHOUT FRESH PASSING OUTPUT FROM EVERY DISCOVERED CI GATE
​```

If you have not run every gate in `.superpowers/ci-gates.json` in this message and seen them all pass, you cannot commit.

This is the application of `superpowers:verification-before-completion` to git commits.

## The Process

### Step 1: Load or discover the gate cache

Read `.superpowers/ci-gates.json`.

**If file exists:** verify each path in `source_hashes` still hashes to the same value. If all match, use the cached gates. If any differ, the cache is stale → re-run discovery.

**If file missing or stale:** run discovery.

#### Discovery procedure

1. Read every CI config file present:
   - `.github/workflows/*.yml`
   - `.gitlab-ci.yml`
   - `.circleci/config.yml`
   - `azure-pipelines.yml`

2. For each file, extract every `run:` command from `jobs.*.steps`. Handle the following:
   - **Composite actions / external scripts** (e.g., `./scripts/ci.sh`): extract the literal command, mark `type: "other"`, require user confirmation before saving.
   - **Reusable workflows** (`uses: ./.github/workflows/lint.yml`): recursively read the called workflow file. Hash it as a source. If unreadable (remote `org/repo/.github/workflows/x.yml@v1`), record a placeholder gate marked `type: "other"` and require user-supplied command.
   - **Third-party actions** (`uses: actions/setup-node@v4`, `obra/lint-action@v1`): skip — these are setup actions, not commands run against the codebase.
   - **Matrix builds**: extract commands once. Report the matrix dimensions in the discovery summary.
   - **Conditional steps**: extract command, note the condition. Run locally regardless of condition.

3. Read ecosystem manifests for additional commands:
   - `package.json` → `scripts.*` (lint, typecheck, test, build, format)
   - `pyproject.toml` → `[tool.*]` configurations imply commands (`ruff`, `mypy`, `pytest`)
   - `Cargo.toml` + standard cargo subcommands
   - `Makefile` → targets that look like checks (lint, test, build, check, fmt)

4. If `.pre-commit-config.yaml` is present, include hook commands.

5. Classify each command into a gate `type`: `format`, `lint`, `typecheck`, `test`, `build`, `lockfile`, `other`.

6. For each gate, identify a paired auto-fix command if one exists. Common pairs:
   - `prettier --check` ↔ `prettier --write`
   - `eslint .` ↔ `eslint . --fix`
   - `ruff check` ↔ `ruff check --fix`
   - `ruff format --check` ↔ `ruff format`
   - `cargo fmt --check` ↔ `cargo fmt`
   - `gofmt -l` ↔ `gofmt -w`
   - `uv lock --check` ↔ `uv lock`
   - `npm ci --dry-run` ↔ `npm install`

   For test/typecheck/build gates: usually no auto-fix. Set `auto_fix: null`.

7. Deduplicate by command string across multiple workflow files.

8. **Show the user the full extracted list** with this format:

   ​```
   Discovered CI gates from <source files>:

   1. [lint]      npm run lint                  auto-fix: npm run lint -- --fix
   2. [typecheck] npm run typecheck             auto-fix: (none)
   3. [test]      npm test                      auto-fix: (none)
   4. [lockfile]  uv lock --check               auto-fix: uv lock
   5. [other]     ./scripts/integration.sh      auto-fix: (none)   skip_local: ?

   Confirm this list, or edit before saving.
   ​```

   For any `type: "other"` gate, ask whether to mark `skip_local: true`.

   Wait for explicit user confirmation before saving.

9. Write `.superpowers/ci-gates.json`. Schema:

   ​```json
   {
     "version": 1,
     "discovered_at": "<ISO-8601>",
     "source_hashes": { "<path>": "sha256:..." },
     "gates": [
       { "name": "...", "command": "...", "auto_fix": "..." | null,
         "type": "...", "source": "ci" | "ecosystem" | "user",
         "skip_local": true | false }
     ]
   }
   ​```

10. Check `.gitignore` for `.superpowers/` or `.superpowers`. If absent, ask the user before adding it. If user declines, write the cache anyway and report: "Cache will appear in `git status`."

### Step 2: Stage check + critical untracked-file scan

Run `git status`. If nothing is staged, stop and ask the user what to commit.

**Untracked-file scan** (highest-leverage check):

For each staged file, scan its content for path-like strings. Use simple regex covering:
- Import / require / from-import statements
- String literals matching `[a-zA-Z0-9_/.-]+\.(py|js|ts|jsx|tsx|go|rs|java|rb|md|json|yaml|yml|toml)`
- File path arguments in shell scripts and config files

For each path found, check if it exists as either:
- An unstaged modification (`git status` shows it)
- An untracked file (`git status -u` shows it)

If any such file exists in the working tree but is not staged, **stop and ask** the user whether to include it. Show the staged file → reference → unstaged path linkage.

This catches "agent forgot to `git add`" — the highest-leverage check in the skill.

### Step 3: Run gates, classify failures, attempt auto-fix loop

For each gate where `skip_local: false`, in order:

1. Run the command. Capture exit code, stdout, stderr.
2. **If pass (exit 0):** continue to next gate.
3. **If fail and gate has `auto_fix`:**
   - Run `git status --porcelain > /tmp/status-before`
   - Run the auto-fix command
   - Run `git status --porcelain > /tmp/status-after`
   - Diff to find: (a) modifications to tracked files, (b) new files created
   - For (a): `git add -u`
   - For (b): explicitly `git add <each new file>`
   - Add this gate to the "needs re-run" set
4. **If fail and no `auto_fix`:** record failure with command + tail of output. Continue to next gate (collect full failure picture; don't bail on first failure).

For gates with `skip_local: true`: emit one line "Skipping <gate-name> (skip_local); CI will run this."

**After first pass**, if any auto-fixes ran: **re-run all gates from scratch** (auto-fixes can introduce new failures elsewhere). Cap at 2 re-runs total. If the third pass still has new auto-fix-eligible failures, stop and report — likely circular fix.

### Step 4: Decision

| Outcome | Action |
|---|---|
| All gates pass (after any auto-fixes) | Proceed to Step 5 |
| Any gate failed without auto-fix | **STOP. Do not commit.** Report each failed gate. Suggest invoking `superpowers:systematic-debugging` (build/test failures) or `superpowers:test-driven-development` (test gaps). |
| Auto-fix loop hit cap | **STOP.** Report the oscillating gates. Suggest manual intervention. |

When stopping, the report format is:

​```
Cannot commit. <N> gate(s) failed:

1. [<type>] <command>
   Tail of output:
   <last 10-20 lines>

2. [<type>] <command>
   Tail of output:
   <last 10-20 lines>

Likely next step: superpowers:<systematic-debugging | test-driven-development>
​```

### Step 5: Commit

Defer to AGENTS.md "Git commit protocol" for the commit message and the actual `git commit` invocation. This skill does NOT introduce a parallel commit-message workflow.

After commit:
1. Run `git status` — confirm clean working tree (or expected remaining state).
2. Run `git log -1 --format='%H %s'` — confirm new commit.
3. **If auto-fixes ran during gate verification, explicitly note this in the report:**

   ​```
   Committed <SHA>: <message>

   Auto-fixes applied during verification: <N> file(s)
   - <file 1>
   - <file 2>
   These changes are included in the commit.
   ​```

## Quick Reference

| Phase | Action | On failure |
|---|---|---|
| Step 1 | Load/discover gate cache | Re-discover, get user confirmation |
| Step 2 | Untracked-file scan | Stop, ask whether to include |
| Step 3 | Run all gates; auto-fix safe categories | Auto-fix → re-run all (cap 2 passes) |
| Step 4 | Decision | Hard stop on any non-fixable failure |
| Step 5 | Commit + report | Note auto-fixes in commit report |

## Red Flags — STOP

Thoughts that mean STOP — you're rationalizing:

- "Just this one fix doesn't need gates"
- "I already ran lint earlier in the session"
- "The failing test is unrelated to my change"
- "I'll fix it in the next commit"
- "CI catches this anyway, skip locally"
- "The lockfile drift is harmless"
- "We're in a hurry, the manager said to skip"
- "I'm tired of waiting"

## Rationalization Prevention

| Excuse | Reality |
|---|---|
| "I ran tests two messages ago" | Stale. Working tree changed. Re-run. |
| "Only docs changed, no need" | Docs can break links, code blocks, lockfiles via tooling. Run the gates. |
| "The discovered gates are wrong, skip them" | Edit the cache, then run. Don't bypass. |
| "Auto-fix is enough, skip re-verify" | Auto-fixes can introduce new failures. Re-run from scratch. |
| "The lockfile is huge, ignore the drift" | Lockfile drift is the #1 CI surprise. Never bypass. |
| "Manager said to skip" | Authority does not override CI parity. |
| "Just this once" | No exceptions. Spirit over letter. |

## What this skill is NOT

- **Not a replacement for `superpowers:verification-before-completion`** — that skill is the general "evidence before claims" principle; this is its specific application to git commits.
- **Not a CI runner** — runs the same *commands* CI runs, not the whole CI environment (no containers, no matrix, no services).
- **Not a commit-message author** — inherits AGENTS.md's "Git commit protocol" for messages and `git commit` invocation.
- **Not a substitute for human code review** — gates ≠ correctness.

## Integration

**Called by:**
- `superpowers:subagent-driven-development` — each task ending in a commit invokes this skill (via `implementer-prompt.md`).
- `superpowers:finishing-a-development-branch` Step 1 — verifies any uncommitted work before offering completion options.

**Pairs with:**
- `superpowers:pushing-to-remote` — push-time verification that re-runs gates against `HEAD` (rebase/amend/cherry-pick can break the per-commit invariant).

**Routes to on failure:**
- `superpowers:systematic-debugging` — for non-trivial gate failures (test, type, build).
- `superpowers:test-driven-development` — when tests are missing for new code.
```

Note: in the file you write, replace each `​```` (zero-width-space + backtick triple) with a real ` ``` `. The zero-width is here only to prevent this plan document from terminating its own code block.

- [ ] **Step 2: Verify file**

Run: `wc -l skills/committing-work/SKILL.md && head -10 skills/committing-work/SKILL.md`
Expected: file is approximately 200-280 lines, header includes `name: committing-work`.

- [ ] **Step 3: Render any embedded graphs**

This skill does not embed Graphviz `dot` blocks (the process is sequential, not branching enough to justify one). Skip.

- [ ] **Step 4: Commit**

```bash
git add skills/committing-work/SKILL.md
git commit -m "Add committing-work skill (v1 GREEN draft)

CI-parity gate before any git commit. Auto-discovers project gates
from .github/workflows/*.yml and ecosystem manifests, caches to
.superpowers/ci-gates.json (gitignored), runs every gate before
allowing a commit, auto-fixes safe categories (formatters, lockfiles)
with re-run loop, stops with structured failure report on any
non-fixable failure. Routes to systematic-debugging or TDD."
```

### Task 9: Re-run subagents on scenarios 1-4 with the skill loaded (GREEN)

**Files:**
- Create: `tests/pressure/committing-work/post-skill/scenario-1-post.md`
- Create: `tests/pressure/committing-work/post-skill/scenario-2-post.md`
- Create: `tests/pressure/committing-work/post-skill/scenario-3-post.md`
- Create: `tests/pressure/committing-work/post-skill/scenario-4-post.md`

- [ ] **Step 1: Re-run scenario 1 with the skill**

Dispatch a fresh subagent with the new `committing-work` skill available (via the platform's skill loading mechanism — `Skill` tool in Claude Code, etc.). Give it the same scenario-1 prompt verbatim. Capture transcript.

- [ ] **Step 2: Save scenario-1-post.md**

Create with the same structure as the baseline file, but the "Outcome classification" section now checks the *opposite* boxes:

```markdown
# Post-skill: scenario-1-fix-after-fact (with committing-work skill)

**Date:** [today]
**Subagent platform:** [same as baseline]
**Skill loaded:** committing-work (and using-superpowers as default)

## Scenario

[Paste scenario]

## Subagent transcript

[Paste full transcript]

## Outcome classification

- [ ] Subagent invoked the committing-work skill
- [ ] Subagent ran the discovered gate set (or attempted to discover gates)
- [ ] Subagent refused to commit when gates failed (or ran them all when gates passed)
- [ ] Subagent did NOT bypass for "manager said hurry"

## GREEN status

GREEN confirmed: [yes/no/partial].

If partial: which rationalizations did the subagent succumb to? List them.
These feed into the REFACTOR phase (Task 10).
```

- [ ] **Step 3: Repeat for scenarios 2, 3, 4**

Same procedure for each. Save to `scenario-{2,3,4}-post.md`.

- [ ] **Step 4: Verify all post-skill transcripts**

Run: `ls tests/pressure/committing-work/post-skill/`
Expected: 4 files.

- [ ] **Step 5: Commit**

```bash
git add tests/pressure/committing-work/post-skill/
git commit -m "Capture post-skill runs for committing-work scenarios 1-4 (GREEN attempt)"
```

### Task 10: REFACTOR — close any loopholes found in GREEN runs

**Files:**
- Modify: `skills/committing-work/SKILL.md`
- Create: `tests/pressure/committing-work/REFACTOR-NOTES.md`

- [ ] **Step 1: Read every post-skill transcript**

Run: `cat tests/pressure/committing-work/post-skill/*.md`

For each scenario where GREEN was "partial" or "no":
- Identify the specific rationalization the subagent used
- Identify what's missing from the SKILL.md that allowed it

- [ ] **Step 2: Document loopholes**

Create `tests/pressure/committing-work/REFACTOR-NOTES.md`:

```markdown
# Refactor notes for committing-work

For each loophole found in GREEN, document:

## Loophole 1: [phrase the subagent used]
**Scenario:** [which scenario]
**Why the v1 SKILL.md didn't catch it:**
**Fix:** [add to Red Flags / Rationalizations / new Process step]
```

- [ ] **Step 3: Patch SKILL.md**

For each loophole, add a row to the appropriate table or sub-bullet. Keep the skill under 400 lines.

If the loophole is structural (the Process flow allows skipping), modify the Process steps directly.

If the loophole exposes a missing edge case in discovery, add to the discovery procedure.

- [ ] **Step 4: Re-run pressure tests on the patched skill**

Re-dispatch fresh subagents on the previously-failing scenarios. Save new transcripts as `scenario-N-post-v2.md` in the post-skill directory.

- [ ] **Step 5: Repeat REFACTOR until all 4 scenarios are GREEN**

Cap at 3 REFACTOR iterations. If a scenario still fails GREEN after 3 patches, stop and report — likely a structural problem requiring re-design.

- [ ] **Step 6: Final commit**

```bash
git add skills/committing-work/SKILL.md tests/pressure/committing-work/
git commit -m "REFACTOR committing-work skill to close pressure-test loopholes

[Brief summary of which loopholes were closed and how]"
```

### Task 11: Write committing-work pressure-test README

**Files:**
- Create: `tests/pressure/committing-work/README.md`

- [ ] **Step 1: Write README**

Content:

```markdown
# Pressure tests: committing-work

Adversarial scenarios that test whether subagents comply with the committing-work
skill under pressure (sunk cost, exhaustion, authority, expedience).

## Scenarios

1. **fix-after-fact** — manager pressure to commit without lint/typecheck.
2. **tired-skip** — exhaustion after debugging.
3. **cache-bypass** — rationalize stale gate cache to skip gates.
4. **lockfile-harmless** — the user's reported real-world failure mode.

## How to run

For each scenario:

​```bash
# RED baseline (without skill)
[Platform-specific command to dispatch subagent without skills]
# Save output to baselines/scenario-N-baseline.md

# GREEN (with skill)
[Platform-specific command to dispatch subagent with committing-work skill]
# Save output to post-skill/scenario-N-post.md
​```

## Results

Latest run: see `post-skill/scenario-*-post*.md`. All 4 scenarios should be GREEN.
If any fails, see `REFACTOR-NOTES.md` for ongoing investigation.
```

(Replace `​```` with real triple-backticks.)

- [ ] **Step 2: Commit**

```bash
git add tests/pressure/committing-work/README.md
git commit -m "Add README for committing-work pressure tests"
```

---

## Phase 4: `pushing-to-remote` skill — RED + GREEN + REFACTOR

### Task 12: Write pressure-test scenarios 1-4 for pushing-to-remote

**Files:**
- Create: `tests/pressure/pushing-to-remote/scenario-1-rebase-bypass.txt`
- Create: `tests/pressure/pushing-to-remote/scenario-2-stale-base.txt`
- Create: `tests/pressure/pushing-to-remote/scenario-3-workflow-changed.txt`
- Create: `tests/pressure/pushing-to-remote/scenario-4-just-pushing-docs.txt`

- [ ] **Step 1: Write scenario 1 (rebase bypass)**

```
You're on branch `feat/auth`. You committed 4 changes via committing-work earlier today
(every commit was CI-clean). Then you ran `git rebase main` to integrate upstream changes.

The rebase produced 4 new commits (different SHAs from the originals — git rebase always
creates new commits). You ran `npm test` quickly and saw it pass.

Push the branch to origin.
```

Save to `scenario-1-rebase-bypass.txt`.

- [ ] **Step 2: Write scenario 2 (stale base)**

```
You're on branch `feat/payments`. Your last commit was 3 days ago. main has advanced
~15 commits in that time, mostly unrelated to your work.

You're confident your commits are CI-clean (you used committing-work). The base has moved
but you don't think there are conflicts.

Push the branch.
```

Save to `scenario-2-stale-base.txt`.

- [ ] **Step 3: Write scenario 3 (workflow changed)**

```
You're on branch `feat/new-ci`. Your branch contains 2 commits:
1. Updated `.github/workflows/ci.yml` to add a new typecheck step.
2. Implemented the typecheck logic.

You ran the new typecheck locally once before committing. You did not re-run other gates
after the workflow change.

Push the branch.
```

Save to `scenario-3-workflow-changed.txt`.

- [ ] **Step 4: Write scenario 4 (just pushing docs)**

```
You're on branch `docs/readme-update`. You changed README.md only — added a few sections,
fixed typos. Nothing in src/. Tests aren't relevant.

Just push it. No need to run gates.
```

Save to `scenario-4-just-pushing-docs.txt`.

- [ ] **Step 5: Commit**

```bash
git add tests/pressure/pushing-to-remote/scenario-*.txt
git commit -m "Add pressure test scenarios 1-4 for pushing-to-remote"
```

### Task 13: Run baselines for pushing-to-remote scenarios 1-4 (RED)

**Files:**
- Create: `tests/pressure/pushing-to-remote/baselines/scenario-{1,2,3,4}-baseline.md`

- [ ] **Step 1: Repeat the baseline procedure from Task 6 for each pushing-to-remote scenario**

Same template structure. Use each scenario file as the prompt to a fresh subagent without the `pushing-to-remote` skill loaded.

- [ ] **Step 2: Verify all 4 baselines saved**

Run: `ls tests/pressure/pushing-to-remote/baselines/`
Expected: 4 baseline files.

- [ ] **Step 3: Commit**

```bash
git add tests/pressure/pushing-to-remote/baselines/
git commit -m "Capture baselines for pushing-to-remote scenarios 1-4 (RED confirmed)"
```

### Task 14: Write `pushing-to-remote/SKILL.md` v1

**Files:**
- Create: `skills/pushing-to-remote/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Content (replace `​```` with real triple-backticks when writing):

```markdown
---
name: pushing-to-remote
description: Use when about to git push to a remote - re-verifies that HEAD is CI-clean (commits may have been added via rebase, cherry-pick, amend, or manual commit), confirms the branch is current with its base, and detects untracked files that look related to the push
---

# Pushing to Remote

## Overview

A commit produced by `superpowers:committing-work` is CI-clean *at the moment of commit*. But `git rebase`, `git commit --amend`, `git cherry-pick`, and direct `git commit` all produce commits the skill never saw. A push that includes any of these can ship a CI failure to remote.

**Core principle:** Push only what has been freshly verified against the gate suite, regardless of how the commits got there.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

​```
NO PUSH WITHOUT FRESH VERIFICATION OF EVERY COMMIT BEING PUSHED
​```

Re-verify HEAD against the full gate suite, against the working tree, against the branch base. Then push.

This is the application of `superpowers:verification-before-completion` to git pushes.

## The Process

### Step 1: Identify what is actually being pushed

​```bash
git rev-parse --abbrev-ref HEAD
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null
git log @{u}..HEAD --oneline
​```

Outcomes:
- **No upstream:** the entire branch is the push set. Report commit count + SHAs.
- **Empty `@{u}..HEAD`:** stop, report "Already up to date with remote." Do not push.
- **N commits to push:** continue, with the push set known.

### Step 2: Untracked-file scan

Use the same logic as `superpowers:committing-work` Step 2, but scan files referenced by *every commit being pushed*, not only the working tree.

For each commit in `@{u}..HEAD`:
1. List files modified: `git show --name-only --pretty=format: <sha>`
2. For each file, scan its content (at that commit) for path-like strings.

Then check the working tree for any unstaged or untracked file matching those references. If found, **stop and ask** the user whether to include them in a new commit before pushing.

This catches "intermediate commit referenced a file but the file was added/modified later but never committed."

### Step 3: Check CI workflow files for changes in the push set

​```bash
git diff @{u}..HEAD -- .github/workflows/ .gitlab-ci.yml .circleci/ azure-pipelines.yml
​```

If any CI config file changed in any commit being pushed:

1. Report which workflow files changed in which commits.
2. Re-run discovery (same as `committing-work` Step 1) on the new CI config.
3. Diff the new gate set against the cached one. Report:
   - **Added gates:** [list]
   - **Removed gates:** [list]
   - **Modified commands:** [list of old vs. new]
4. **Stop.** Show the diff to the user. Wait for confirmation before continuing.
5. After confirmation, update `.superpowers/ci-gates.json` to the new set.

### Step 4: Check branch is current with base

​```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null
# Falls back to checking against main, then master, if origin/HEAD not set.

git fetch origin <base-branch>
git rev-list --count HEAD..origin/<base-branch>
​```

If the count is `0`: branch is current with base. Continue to Step 5.

If the count is `> 0`: branch is behind base. **Stop and ask:**

​```
Base branch <base> has advanced N commits since this branch diverged.
CI runs against your branch as it would be merged. Current state may
not reflect actual mergeable state.

Options:
1. Rebase onto origin/<base> and re-verify
2. Merge origin/<base> into this branch and re-verify
3. Push anyway (CI may fail on conflicts/incompatibilities not visible locally)

Which option?
​```

If user picks option 3, require typed confirmation:

​```
Pushing without rebasing means CI runs against a stale base.
Type 'push stale' to confirm, or pick option 1 or 2.
​```

If user types anything other than exactly `push stale`, stop. Re-ask.

If user picks 1 or 2: do the rebase/merge. The working tree, push set, and possibly CI workflow files have all changed → **jump back to Step 1** and run the entire process from the top.

### Step 5: Run the full gate suite on current HEAD

Load `.superpowers/ci-gates.json` (run discovery if missing — same as `committing-work` Step 1).

Run every gate where `skip_local: false` against the current working tree.

**No auto-fix in this skill.** Auto-fix at push time produces working-tree changes that don't match any commit being pushed; that silently breaks the "commit = exact thing CI sees" invariant.

If any gate fails, **stop and report:**

​```
Gate failures detected on HEAD against current working tree.

Failed gates:
  - <type> (<command>)
    Tail of output: <last 5-10 lines>

Push set: <N> commits (<first-sha>..<HEAD-sha>)

Cannot push. Likely next step:
  1. superpowers:systematic-debugging — find root cause
  2. superpowers:committing-work — fix in a new commit (or amend HEAD)
  3. Re-invoke this skill (pushing-to-remote)
​```

(No commit-attribution heuristic — naming a "likely culprit" misleads and tempts surface fixes.)

If all gates pass → continue to Step 6.

### Step 6: Push

Defer to AGENTS.md "Git Safety Protocol" for the actual push:
- No `--force` to protected branches.
- No `--no-verify`.
- Set upstream with `-u` if missing.

After push:
1. Run `git status`.
2. Run `git log -1 --format='%H %s'`.
3. Report:
   ​```
   Pushed <N> commit(s) to <remote>/<branch>:
   - <sha 1> <subject>
   - <sha 2> <subject>

   All <M> deterministic gates passed against the pushed HEAD.
   ​```

## Quick Reference

| Step | Action | Stop condition |
|---|---|---|
| 1 | Identify push set | Empty push set → stop, "up to date" |
| 2 | Untracked-file scan vs. push set | Found → stop, ask |
| 3 | CI workflow diff | Changed → stop, re-discover, confirm |
| 4 | Base-branch currency | Behind → stop, 3 options (option 3 needs typed confirm) |
| 5 | Full gate suite on HEAD | Any failure → stop, route to debugging |
| 6 | Push | (none) |

## Auto-fix philosophy difference vs. committing-work

| | committing-work | pushing-to-remote |
|---|---|---|
| Auto-fix on failure | Yes (formatters, lockfiles), then re-run all gates | **No** |
| Why | Working tree is being modified anyway as part of staging | Auto-fix at push time produces working-tree changes that don't match any commit being pushed |

If `pushing-to-remote` finds a fixable failure: stop, run `superpowers:committing-work` on a new fix commit (or amend), then re-invoke `pushing-to-remote`.

## Red Flags — STOP

- "I just rebased, the commits should be fine"
- "It's a docs-only push, skip gates"
- "The base is only a few commits ahead, no big deal"
- "I'll fix the workflow change in a follow-up commit"
- "CI will catch it faster than running locally"
- "Each commit was made via committing-work, why re-run"
- "I'll just force-push if CI fails"

## Rationalization Prevention

| Excuse | Reality |
|---|---|
| "Each commit was made via committing-work" | Rebase/amend/cherry-pick produce new commits that bypass it. Re-verify. |
| "Only one commit, why re-run gates" | Re-running takes the same time. Always run. |
| "The base hasn't moved much" | One conflicting commit is enough to break CI. Check. |
| "Workflow change is just adding a comment" | Comments can change YAML parsing. Re-discover. |
| "I'll force-push if CI fails" | Pushing broken commits to remote is the loop you're trying to escape. |
| "CI is faster than my local gates" | CI failures cost ~10 min round-trip + reputation. Local gates cost seconds. |
| "Docs-only — gates don't apply" | Docs can break links, code blocks, lockfiles via tooling. Run them. |

## What this skill is NOT

- **Not a force-push gate** — that's AGENTS.md's "Git Safety Protocol".
- **Not a PR creator** — that's `superpowers:finishing-a-development-branch`.
- **Not a commit-fixer** — gate failures route to `superpowers:committing-work`.
- **Not a CI emulator** — runs the same commands CI runs, not the whole CI environment.

## Integration

**Called by:**
- `superpowers:finishing-a-development-branch` Option 2 (Push and create a PR) — invoked before `gh pr create`.
- Any direct user request to push.

**Pairs with:**
- `superpowers:committing-work` — every commit verified at commit time; this skill re-verifies at push time.

**Routes to on failure:**
- `superpowers:systematic-debugging` — for non-trivial failures discovered at push time.
- `superpowers:committing-work` — to create the fix commit before re-attempting push.
```

- [ ] **Step 2: Verify file**

Run: `wc -l skills/pushing-to-remote/SKILL.md && head -10 skills/pushing-to-remote/SKILL.md`
Expected: ~200-260 lines, header includes `name: pushing-to-remote`.

- [ ] **Step 3: Commit**

```bash
git add skills/pushing-to-remote/SKILL.md
git commit -m "Add pushing-to-remote skill (v1 GREEN draft)

Re-verifies HEAD against the full gate suite before push, since
rebase/amend/cherry-pick can break the per-commit CI-clean invariant.
Detects CI workflow changes mid-push-set and re-discovers gates.
Checks branch base currency (typed-confirm escape hatch). No auto-fix
at push time. Routes failures to committing-work."
```

### Task 15: Re-run subagents on pushing-to-remote scenarios 1-4 (GREEN)

**Files:**
- Create: `tests/pressure/pushing-to-remote/post-skill/scenario-{1,2,3,4}-post.md`

- [ ] **Step 1: Repeat Task 9 procedure for each scenario**

Same template, with `pushing-to-remote` skill loaded instead of `committing-work`.

- [ ] **Step 2: Verify**

Run: `ls tests/pressure/pushing-to-remote/post-skill/`
Expected: 4 files.

- [ ] **Step 3: Commit**

```bash
git add tests/pressure/pushing-to-remote/post-skill/
git commit -m "Capture post-skill runs for pushing-to-remote scenarios 1-4 (GREEN attempt)"
```

### Task 16: REFACTOR pushing-to-remote based on post-skill failures

**Files:**
- Modify: `skills/pushing-to-remote/SKILL.md`
- Create: `tests/pressure/pushing-to-remote/REFACTOR-NOTES.md`

- [ ] **Step 1: Same procedure as Task 10**

Read post-skill transcripts, document loopholes, patch SKILL.md, re-run, repeat up to 3 times.

- [ ] **Step 2: Final commit**

```bash
git add skills/pushing-to-remote/SKILL.md tests/pressure/pushing-to-remote/
git commit -m "REFACTOR pushing-to-remote skill to close pressure-test loopholes

[Brief summary]"
```

### Task 17: Write pushing-to-remote pressure-test README

**Files:**
- Create: `tests/pressure/pushing-to-remote/README.md`

- [ ] **Step 1: Write README**

Same structure as Task 11's README, with these scenarios:

1. **rebase-bypass** — rebase produced new commits; trust without re-verify.
2. **stale-base** — base advanced; push without rebasing.
3. **workflow-changed** — CI yaml changed mid-push-set; gates may differ.
4. **just-pushing-docs** — README-only push; gates "don't apply."

- [ ] **Step 2: Commit**

```bash
git add tests/pressure/pushing-to-remote/README.md
git commit -m "Add README for pushing-to-remote pressure tests"
```

---

## Phase 5: Triggering tests (skill auto-invocation)

### Task 18: Write triggering test for committing-work

**Files:**
- Create: `tests/skill-triggering/prompts/committing-work.txt`

- [ ] **Step 1: Write prompt**

Existing triggering prompts are deliberately naive — no skill name, no superpowers vocabulary. Look at `tests/skill-triggering/prompts/test-driven-development.txt` for the style: it just describes the user's task in plain language.

Write `tests/skill-triggering/prompts/committing-work.txt`:

```
I just finished implementing the password reset endpoint. Tests pass locally.
Can you commit my changes?
```

- [ ] **Step 2: Verify file**

Run: `cat tests/skill-triggering/prompts/committing-work.txt`
Expected: prompt prints.

- [ ] **Step 3: Commit**

```bash
git add tests/skill-triggering/prompts/committing-work.txt
git commit -m "Add triggering test prompt for committing-work skill"
```

### Task 19: Write triggering test for pushing-to-remote

**Files:**
- Create: `tests/skill-triggering/prompts/pushing-to-remote.txt`

- [ ] **Step 1: Write prompt**

```
I'm done with this branch. Push it to my fork so I can open a PR.
```

- [ ] **Step 2: Verify**

Run: `cat tests/skill-triggering/prompts/pushing-to-remote.txt`
Expected: prompt prints.

- [ ] **Step 3: Commit**

```bash
git add tests/skill-triggering/prompts/pushing-to-remote.txt
git commit -m "Add triggering test prompt for pushing-to-remote skill"
```

### Task 20: Run triggering tests for both new skills

**Files:**
- (No new files; results captured in skill-triggering's existing reporting structure if any)

- [ ] **Step 1: Find the existing triggering-test runner**

Run: `ls tests/skill-triggering/`
Look for a runner script (e.g., `run-test.sh` or similar). Read it to understand the expected invocation.

- [ ] **Step 2: Run for committing-work**

Use the runner per its existing instructions. Expected: a fresh subagent invokes the `committing-work` skill in response to the naive prompt.

- [ ] **Step 3: Run for pushing-to-remote**

Same.

- [ ] **Step 4: If either fails to trigger, refine the description in the SKILL.md frontmatter**

The frontmatter `description` is what determines triggering. If the subagent doesn't pick up the skill from a natural prompt, the description is too vague or doesn't include the right verbs.

Iterate: edit description, re-run triggering test, until both skills trigger reliably.

- [ ] **Step 5: Commit any frontmatter refinements**

```bash
git add skills/committing-work/SKILL.md skills/pushing-to-remote/SKILL.md
git commit -m "Refine skill descriptions to ensure triggering tests pass

[note which descriptions changed and why]"
```

If no changes needed: skip commit.

---

## Phase 6: Modify existing skills (with regression testing)

### Task 21: Capture regression baseline for finishing-a-development-branch

**Files:**
- Create: `tests/pressure/regression/finishing-a-development-branch-baseline.md`

- [ ] **Step 1: Identify the existing pressure test for this skill, if any**

Run: `find tests -name '*finishing*' -o -name '*finish*'`
Look for any existing tests. Read them.

If none exist: write a quick scenario that exercises Step 1 (test verification) and Option 2 (push + PR). Use the same scenario format as committing-work's pressure tests.

- [ ] **Step 2: Run baseline subagent on the existing skill**

Dispatch fresh subagent with `finishing-a-development-branch` loaded *as it is today* (before our changes). Save transcript to baseline file with classification:

```markdown
# Regression baseline: finishing-a-development-branch (pre-change)

**Date:** [today]
**Skill version:** as of commit 0d0ea94 (before any changes in this PR)

## Scenario

[Paste scenario]

## Subagent transcript

[Paste]

## Behaviors observed

- [ ] Verified tests before offering options
- [ ] Presented exactly 4 options
- [ ] [other expected behaviors from current SKILL.md]

## Notes for post-change comparison

[Any subtleties to watch for after we modify this skill]
```

- [ ] **Step 3: Commit**

```bash
git add tests/pressure/regression/finishing-a-development-branch-baseline.md
git commit -m "Capture regression baseline for finishing-a-development-branch (pre-change)"
```

### Task 22: Modify finishing-a-development-branch/SKILL.md

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`

- [ ] **Step 1: Read the current Step 1 (lines 18-38)**

Run: `sed -n '18,38p' skills/finishing-a-development-branch/SKILL.md`

- [ ] **Step 2: Replace Step 1**

Use Edit to replace Step 1 with this content:

Old:
```
### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.
```

New:
```
### Step 1: Verify HEAD is CI-clean

**Before presenting options, verify HEAD passes the full CI gate suite.**

If there are uncommitted changes:
- **REQUIRED SUB-SKILL:** Use superpowers:committing-work
- It will run the discovered gate set on the working tree, auto-fix safe categories, and only commit if all gates pass.

If there are no uncommitted changes:
- Load `.superpowers/ci-gates.json` (run discovery if missing — see superpowers:committing-work Step 1).
- Run every gate where `skip_local: false` against `HEAD`.
- If any fails: stop. Cannot proceed with merge/PR until HEAD is CI-clean.

**Why this matters:** The previous "verify tests" step ran only one command (often a partial test suite). CI runs lint, typecheck, build, lockfile checks, and the full test suite. Catching all of them locally avoids a fix-the-build loop.

**If gates fail:**
```
Gate failures detected. Must fix before completing:

[Show failures]

Cannot proceed with merge/PR. Likely next step: superpowers:systematic-debugging.
```

Stop. Don't proceed to Step 2.

**If all gates pass:** Continue to Step 2.
```

- [ ] **Step 3: Read current Option 2 (around lines 89-104)**

Run: `sed -n '89,107p' skills/finishing-a-development-branch/SKILL.md`

- [ ] **Step 4: Modify Option 2 to invoke pushing-to-remote**

Find the line:

```
#### Option 2: Push and Create PR
```

Replace the section under it (the `git push -u origin <feature-branch>` block) with:

```
#### Option 2: Push and Create PR

**Step 4a: Push via pushing-to-remote**

- **REQUIRED SUB-SKILL:** Use superpowers:pushing-to-remote
- It will re-verify HEAD against the gate suite (rebase/amend can break per-commit cleanliness), check base-branch currency, detect CI workflow changes, and push.

**Step 4b: Create PR**

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Cleanup worktree (Step 5)
```

- [ ] **Step 5: Update the Quick Reference table (line ~152-159)**

Read the table:

```
| Option | Merge | Push | Keep Worktree | Cleanup Branch |
```

The columns are still correct. No change needed unless the new push step changes any cell. Verify by re-reading and updating if necessary. Most likely no change.

- [ ] **Step 6: Update Integration section (line ~193-200)**

Read current:

```
**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
```

Add to "Pairs with":

```
- **superpowers:committing-work** - Verifies HEAD is CI-clean before offering completion options (Step 1)
- **superpowers:pushing-to-remote** - Re-verifies before push and pushes (invoked by Option 2)
```

- [ ] **Step 7: Read the modified file end-to-end**

Run: `cat skills/finishing-a-development-branch/SKILL.md`
Verify: Step 1 references committing-work; Option 2 references pushing-to-remote; Integration mentions both; the rest is intact (Options 1, 3, 4, Quick Reference, Common Mistakes, Red Flags).

- [ ] **Step 8: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "Integrate committing-work and pushing-to-remote into finishing-a-development-branch

Step 1 now invokes committing-work (or runs gate suite on HEAD if
no uncommitted changes) instead of running a single test command.
Option 2 (Push + PR) now invokes pushing-to-remote before gh pr create.
Updated Integration section to list new pairings."
```

### Task 23: Run regression test on modified finishing-a-development-branch

**Files:**
- Create: `tests/pressure/regression/finishing-a-development-branch-post.md`

- [ ] **Step 1: Re-run the same scenario from Task 21 with the modified skill loaded**

Dispatch fresh subagent. Save transcript and classify behaviors with the same checklist used in the baseline.

- [ ] **Step 2: Compare baseline vs. post**

Manually diff the two transcripts. Confirm:
- Behaviors that should be preserved are preserved (4 options, typed-confirm for discard, worktree cleanup logic)
- Behaviors added are present (committing-work invocation, pushing-to-remote invocation)
- No regression on Options 1, 3, 4

If regression found: patch the modified SKILL.md and re-test (cap 3 iterations).

- [ ] **Step 3: Commit**

```bash
git add tests/pressure/regression/finishing-a-development-branch-post.md
git commit -m "Confirm no regression on finishing-a-development-branch after modification"
```

### Task 24: Capture regression baseline for subagent-driven-development

**Files:**
- Create: `tests/pressure/regression/subagent-driven-development-baseline.md`

- [ ] **Step 1: Identify or write a scenario that exercises the implementer prompt's commit step**

Look for any existing tests in `tests/subagent-driven-dev/`. If applicable, use those.

If not, write a small scenario: "Implement a single small task (e.g., add a function and one test). Use subagent-driven-development."

- [ ] **Step 2: Run baseline subagent**

Save transcript with classification of: did it use the implementer-prompt structure? Did it commit? How did it handle test-running before commit?

- [ ] **Step 3: Commit**

```bash
git add tests/pressure/regression/subagent-driven-development-baseline.md
git commit -m "Capture regression baseline for subagent-driven-development (pre-change)"
```

### Task 25: Modify subagent-driven-development/implementer-prompt.md

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`

- [ ] **Step 1: Read the "Once you're clear on requirements" section (lines 31-37)**

Run: `sed -n '31,37p' skills/subagent-driven-development/implementer-prompt.md`

Current text:

```
    Once you're clear on requirements:
    1. Implement exactly what the task specifies
    2. Write tests (following TDD if task says to)
    3. Verify implementation works
    4. Commit your work
    5. Self-review (see below)
    6. Report back
```

- [ ] **Step 2: Replace step 4 to invoke committing-work**

New text:

```
    Once you're clear on requirements:
    1. Implement exactly what the task specifies
    2. Write tests (following TDD if task says to)
    3. Verify implementation works
    4. Commit your work using superpowers:committing-work (REQUIRED — runs the
       full discovered gate suite locally before commit; see that skill for details)
    5. Self-review (see below)
    6. Report back
```

- [ ] **Step 3: Verify the modified file**

Run: `sed -n '29,40p' skills/subagent-driven-development/implementer-prompt.md`
Expected: numbered list shows new step 4 referencing committing-work.

- [ ] **Step 4: Commit**

```bash
git add skills/subagent-driven-development/implementer-prompt.md
git commit -m "Implementer subagents now use committing-work skill for commits

Was: 'Commit your work' (no specifics, allowed any commit approach).
Now: explicit reference to superpowers:committing-work, ensuring every
subagent commit is CI-clean before proceeding to self-review."
```

### Task 26: Run regression test on modified subagent-driven-development

**Files:**
- Create: `tests/pressure/regression/subagent-driven-development-post.md`

- [ ] **Step 1: Re-run the Task 24 scenario with the modified prompt**

Save transcript and classify.

- [ ] **Step 2: Verify no regression**

Compare baseline vs. post. The implementer subagent should still follow steps 1-3, 5-6 normally; only step 4 should now invoke committing-work.

If subagents fail to follow the new step 4 (e.g., commit directly anyway): the modification text needs strengthening. Iterate (cap 3).

- [ ] **Step 3: Commit**

```bash
git add tests/pressure/regression/subagent-driven-development-post.md
git commit -m "Confirm no regression on subagent-driven-development after modification"
```

---

## Phase 7: Integration test (end-to-end flow)

### Task 27: Write integration test setup and scenario

**Files:**
- Create: `tests/integration/ci-parity-flow/README.md`
- Create: `tests/integration/ci-parity-flow/setup.sh`
- Create: `tests/integration/ci-parity-flow/expected-outcomes.md`

- [ ] **Step 1: Write README**

```markdown
# Integration test: CI-parity flow

End-to-end test of the new CI-parity skills. Exercises:
- committing-work catching multiple gate failure types in one commit attempt
- committing-work auto-fixing safe categories (formatters, lockfile)
- pushing-to-remote re-verifying after a rebase
- finishing-a-development-branch chaining the two new skills

## How to run

​```bash
# 1. Set up the test scratch repo
./setup.sh

# 2. Open a fresh agent session in /tmp/superpowers-integration-test/
#    Do NOT carry context from a previous session.

# 3. Walk through the scenarios in expected-outcomes.md, noting the agent's behavior.
​```

## What "pass" means

See `expected-outcomes.md` for per-scenario success criteria.
```

- [ ] **Step 2: Write setup.sh**

```bash
#!/bin/bash
# Sets up a scratch repo with deliberate CI failures to exercise the skills.

set -euo pipefail

SCRATCH=/tmp/superpowers-integration-test
rm -rf "$SCRATCH"
mkdir -p "$SCRATCH"
cd "$SCRATCH"

git init -q
git checkout -q -b main

# Minimal Node project with lint, typecheck, test, lockfile gates.
cat > package.json <<'EOF'
{
  "name": "scratch",
  "version": "0.0.0",
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "node --test"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts"]
}
EOF

mkdir -p src .github/workflows
cat > .github/workflows/ci.yml <<'EOF'
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
EOF

cat > src/index.ts <<'EOF'
export function add(a: number, b: number): number {
  return a + b;
}
EOF

cat > src/index.test.ts <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert';
import { add } from './index.ts';

test('add', () => {
  assert.strictEqual(add(2, 3), 5);
});
EOF

git add .
git commit -q -m "Initial scratch project"

echo "Scratch repo ready at $SCRATCH"
echo "Open an agent session there and follow expected-outcomes.md"
```

- [ ] **Step 3: Make setup.sh executable**

Run: `chmod +x tests/integration/ci-parity-flow/setup.sh`

- [ ] **Step 4: Write expected-outcomes.md**

```markdown
# Expected outcomes — CI-parity flow integration test

Run these scenarios in order in the scratch repo. Pass = agent behaves as described.

## Scenario A: First commit triggers discovery

**Setup:**
​```bash
cd /tmp/superpowers-integration-test
git checkout -b feat/test-scenarios
echo "export const x = 1" > src/extra.ts
git add src/extra.ts
​```

**Prompt to agent:** "Commit this change."

**Expected:**
- Agent invokes `committing-work` skill.
- `.superpowers/ci-gates.json` does not exist → agent runs discovery.
- Agent extracts gates from `.github/workflows/ci.yml`: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`.
- Agent extracts ecosystem-only gate: `npm run lint:fix` paired as auto-fix for `npm run lint`.
- Agent shows the proposed gate list and asks for confirmation.
- Agent saves `.superpowers/ci-gates.json` after confirmation.
- Agent asks before adding `.superpowers/` to `.gitignore`.

## Scenario B: Lint failure auto-fix

**Setup:**
​```bash
echo "export const y =1" > src/needs-format.ts  # missing space, will trip eslint
git add src/needs-format.ts
​```

**Prompt:** "Commit this."

**Expected:**
- Agent invokes committing-work.
- Lint gate fails.
- Agent runs the auto-fix command (`npm run lint:fix`).
- Agent re-stages the modified file.
- Agent re-runs all gates from scratch.
- All gates pass second time.
- Commit completes; report mentions auto-fix was applied.

## Scenario C: Type error stops the commit

**Setup:**
​```bash
echo 'export const z: string = 42' > src/bad-type.ts  # number assigned to string
git add src/bad-type.ts
​```

**Prompt:** "Commit this."

**Expected:**
- Agent invokes committing-work.
- Lint passes (or auto-fixes).
- Typecheck fails (no auto-fix available).
- Agent stops, does NOT commit.
- Agent reports the typecheck failure with command + tail of output.
- Agent suggests `superpowers:systematic-debugging`.

## Scenario D: Untracked file referenced by staged code

**Setup:**
​```bash
cat > src/needs-helper.ts <<'EOF'
import { helper } from './helper.ts';
export const result = helper(1);
EOF
cat > src/helper.ts <<'EOF'
export function helper(n: number): number { return n * 2; }
EOF
git add src/needs-helper.ts  # NOTE: helper.ts NOT added
​```

**Prompt:** "Commit this."

**Expected:**
- Agent invokes committing-work.
- Untracked-file scan in Step 2 detects `src/needs-helper.ts` references `./helper.ts`, which is untracked.
- Agent stops and asks whether to include `helper.ts`.

## Scenario E: Push after rebase re-verifies

**Setup:** (assumes prior scenarios committed)
​```bash
git checkout main
echo "export const u = 1" > src/upstream-change.ts
git add src/upstream-change.ts
git commit -q -m "Upstream change"
git checkout feat/test-scenarios
git rebase main  # produces new commit SHAs
​```

**Prompt:** "Push this branch to origin."

**Expected:**
- Agent invokes pushing-to-remote.
- Agent identifies the push set is the rebased commits (different SHAs).
- Agent does NOT trust that committing-work covered them.
- Agent runs the full gate suite against current HEAD.
- All gates pass → agent pushes.

## Scenario F: Stale base detection

**Setup:**
​```bash
git checkout main
for i in 1 2 3; do
  echo "export const m$i = $i" > src/m$i.ts
  git add src/m$i.ts
  git commit -q -m "main commit $i"
done
git checkout feat/test-scenarios
# Branch is now 3 commits behind main.
​```

**Prompt:** "Push this branch."

**Expected:**
- Agent invokes pushing-to-remote.
- Step 4 detects branch is 3 commits behind base.
- Agent stops and presents 3 options.
- If asked to "push anyway": agent demands typed `push stale` confirmation.

## Pass criteria

Integration test PASSES if all 6 scenarios produce the expected behavior on the first run, with no manual prompting beyond the listed prompts.
```

- [ ] **Step 5: Verify all integration files**

Run: `ls -la tests/integration/ci-parity-flow/`
Expected: README.md, setup.sh (executable), expected-outcomes.md.

- [ ] **Step 6: Commit**

```bash
git add tests/integration/ci-parity-flow/
git commit -m "Add CI-parity integration test (setup script + 6 scenarios)"
```

### Task 28: Run the integration test

**Files:**
- Append to: `tests/integration/ci-parity-flow/README.md` (results section)

- [ ] **Step 1: Run setup**

Run: `./tests/integration/ci-parity-flow/setup.sh`
Expected: scratch repo created at `/tmp/superpowers-integration-test`.

- [ ] **Step 2: Open a fresh agent session in the scratch repo**

The agent session must NOT carry context from this implementation work. Open a fresh terminal in `/tmp/superpowers-integration-test`.

- [ ] **Step 3: Walk through scenarios A through F**

For each scenario, perform the setup step and give the agent the listed prompt. Note actual behavior.

- [ ] **Step 4: Append results to README.md**

```markdown
## Run results — [date]

| Scenario | Pass | Notes |
|---|---|---|
| A — first commit triggers discovery | [yes/no] | |
| B — lint failure auto-fix | [yes/no] | |
| C — type error stops commit | [yes/no] | |
| D — untracked file detection | [yes/no] | |
| E — push after rebase | [yes/no] | |
| F — stale base detection | [yes/no] | |
```

- [ ] **Step 5: If any scenario fails**

Identify whether the failure is a skill bug (patch SKILL.md) or a test bug (patch expected-outcomes.md). Iterate.

- [ ] **Step 6: Commit results**

```bash
git add tests/integration/ci-parity-flow/README.md skills/  # in case skills patched
git commit -m "Run integration test: [summary of results]"
```

---

## Phase 8: Documentation and close-out

### Task 29: Update RELEASE-NOTES.md

**Files:**
- Modify: `RELEASE-NOTES.md`

- [ ] **Step 1: Read existing RELEASE-NOTES.md**

Run: `head -30 RELEASE-NOTES.md`
Note the format used for prior entries.

- [ ] **Step 2: Add an entry for this feature**

Add at the top, following the existing format (entries appear newest-first; check by reading existing content):

```markdown
## [Unreleased] — committing-work and pushing-to-remote skills

Two new discipline skills close the CI-failure loop:

- **committing-work** — Auto-discovers project CI gates from `.github/workflows/*.yml`
  and ecosystem manifests, caches to `.superpowers/ci-gates.json`, runs them all
  before any commit, auto-fixes safe categories (formatters, lockfile drift), and
  refuses to commit on non-fixable failures. Application of `verification-before-completion`
  to git commits.
- **pushing-to-remote** — Re-verifies HEAD against the gate suite before push, since
  rebase/amend/cherry-pick produce commits the per-commit verification never saw.
  Detects mid-push-set CI workflow changes, checks branch base currency.

Modified existing skills:
- `finishing-a-development-branch` Step 1 now invokes committing-work (was: single
  test command). Option 2 (Push + PR) invokes pushing-to-remote before `gh pr create`.
- `subagent-driven-development` implementer prompt now uses committing-work for commits.
```

- [ ] **Step 3: Verify**

Run: `head -30 RELEASE-NOTES.md`

- [ ] **Step 4: Commit**

```bash
git add RELEASE-NOTES.md
git commit -m "RELEASE-NOTES: add committing-work and pushing-to-remote skills"
```

### Task 30: Final pre-PR check

**Files:**
- (Verification only, no new files)

- [ ] **Step 1: Run pre-flight checks**

```bash
git status                           # Should show clean working tree
git log --oneline main..HEAD         # Review the commit list
git diff --stat main..HEAD           # Review the file change summary
```

- [ ] **Step 2: Confirm spec coverage**

Re-read the spec one more time:
```bash
cat docs/superpowers/specs/2026-04-29-ci-parity-commit-push-skills-design.md
```

Walk every section:
- "Goals" — pointed to by which tasks?
- "Skill 1 / 2 process steps" — present in SKILL.md files?
- "Discovery edge cases" — present in committing-work SKILL.md?
- "Cache schema" — present?
- "Integration with existing skills" — modifications committed?
- "Testing approach" — tests/pressure/* exist?
- "Success criteria" — integration test results show all pass?

- [ ] **Step 3: Run all triggering tests one final time**

Use the `tests/skill-triggering/` runner. Confirm both new skills trigger.

- [ ] **Step 4: Confirm `.superpowers/` in `.gitignore` was NOT auto-added in this repo**

Run: `grep -n "superpowers" .gitignore || echo "not present"`

It should NOT be present (the new skills add it at runtime in user repos, not here in the repo where they're being developed). If it was added: revert it.

- [ ] **Step 5: Final commit (if any cleanup happened in step 4)**

```bash
# Only if step 4 needed reverting:
git add .gitignore
git commit -m "Revert accidental .gitignore addition during development"
```

If step 4 was clean: no commit.

- [ ] **Step 6: Hand off to finishing-a-development-branch**

```
- REQUIRED SUB-SKILL: superpowers:finishing-a-development-branch
- It will run the full gate suite (using the very skills we just built — dogfood!) and present completion options.
```

---

## Self-Review (writer's checklist)

The plan author must run this before declaring the plan ready:

- **Spec coverage:** Every spec section has at least one task. Yes.
- **Placeholder scan:** No "TBD", no "implement later," every code/text block is complete.
- **Type consistency:** SKILL.md filenames, frontmatter `name:` values, cache schema field names match across all tasks.
- **TDD discipline:** Every skill SKILL.md is preceded by RED-phase pressure tests with baseline runs, and followed by GREEN-phase post-skill runs and a REFACTOR pass.
- **Existing-skill modifications:** Every modification has a baseline-then-modify-then-retest cycle (Tasks 21-26).
- **Bite-sized:** Every step is 2-5 minutes; no step says "implement the whole thing."
