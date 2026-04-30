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

```
NO COMMIT WITHOUT FRESH PASSING OUTPUT FROM EVERY DISCOVERED CI GATE
```

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

   ```
   Discovered CI gates from <source files>:

   1. [lint]      npm run lint                  auto-fix: npm run lint -- --fix
   2. [typecheck] npm run typecheck             auto-fix: (none)
   3. [test]      npm test                      auto-fix: (none)
   4. [lockfile]  uv lock --check               auto-fix: uv lock
   5. [other]     ./scripts/integration.sh      auto-fix: (none)   skip_local: ?

   Confirm this list, or edit before saving.
   ```

   For any `type: "other"` gate, ask whether to mark `skip_local: true`.

   Wait for explicit user confirmation before saving.

9. Write `.superpowers/ci-gates.json`. Schema:

   ```json
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
   ```

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

```
Cannot commit. <N> gate(s) failed:

1. [<type>] <command>
   Tail of output:
   <last 10-20 lines>

2. [<type>] <command>
   Tail of output:
   <last 10-20 lines>

Likely next step: superpowers:<systematic-debugging | test-driven-development>
```

### Step 5: Commit

Defer to AGENTS.md "Git commit protocol" for the commit message and the actual `git commit` invocation. This skill does NOT introduce a parallel commit-message workflow.

After commit:
1. Run `git status` — confirm clean working tree (or expected remaining state).
2. Run `git log -1 --format='%H %s'` — confirm new commit.
3. **If auto-fixes ran during gate verification, explicitly note this in the report:**

   ```
   Committed <SHA>: <message>

   Auto-fixes applied during verification: <N> file(s)
   - <file 1>
   - <file 2>
   These changes are included in the commit.
   ```

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
