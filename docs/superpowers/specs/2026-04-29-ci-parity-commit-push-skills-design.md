# CI-Parity Commit & Push Skills — Design

**Date:** 2026-04-29
**Status:** Approved (awaiting plan)
**Author:** Brainstormed with user, written by agent

## Problem

Coding agents using superpowers regularly enter a "fix-the-build" loop: the agent commits and pushes, CI fails on a deterministic check (lint, type error, missing test, lockfile drift), the agent fixes it, pushes again, CI fails on a different deterministic check, and so on. The existing `verification-before-completion` skill establishes the principle "evidence before claims" but does not specify *which* evidence is required before a git commit or git push, and the existing `finishing-a-development-branch` skill runs only a single test command before offering merge/PR options.

The dominant CI failure modes reported by the user:
- Lint / format / style violations
- Type-check errors
- Tests that weren't run locally (agent ran one file or one package; CI runs all)
- `uv lock` (and analogous lockfile) drift

All four are **deterministic, fast, locally-runnable checks** — they should never reach CI.

## Goals

1. Guarantee that any commit produced via the new skill is "CI-clean" against every deterministic gate the project's CI defines.
2. Guarantee that any push produced via the new skill re-verifies that invariant against the actual `HEAD` being pushed (since rebase, cherry-pick, amend, and manual `git commit` can break it).
3. Discover the project's CI gates automatically from `.github/workflows/*.yml` and ecosystem manifests, with user confirmation, and cache the result.
4. Auto-fix safe categories (formatters, lockfile drift) at commit time; never auto-fix at push time.
5. Stop and route to existing skills (`systematic-debugging`, `test-driven-development`) on non-fixable failures rather than papering over them.

## Non-Goals

- Catching non-deterministic CI failures (flaky tests, environment-only failures, integration tests requiring external services).
- Replacing `verification-before-completion`, `test-driven-development`, or `systematic-debugging`. The new skills are specific applications of those principles.
- Authoring commit messages. The existing AGENTS.md "Git commit protocol" remains authoritative.
- Force-push policy, PR creation, or branch-completion decisions. Those stay in `finishing-a-development-branch` and AGENTS.md "Git Safety Protocol."
- Per-package gate scoping in monorepos. v1 treats the repo as one unit (matches what CI sees).
- Telemetry, learning, or background gate-running.
- Cross-platform handling beyond what the underlying gate commands already provide.
- Pre-commit framework replacement. The skill coexists with `pre-commit` / `husky` / `lefthook`; their hooks fire normally during `git commit`.

## High-Level Design

Two new skills, both pure SKILL.md (no scripts), both following the discipline-skill template used by `verification-before-completion` and `test-driven-development`. Each SKILL.md must include the standard sections in this order: **Overview → Iron Law → Process → Quick Reference (table) → Red Flags → Rationalizations → What this skill is NOT → Integration**.

```
skills/committing-work/SKILL.md       # CI-parity gate before any git commit
skills/pushing-to-remote/SKILL.md     # Re-verify state before any git push
```

**Boundary contract (the "every commit is CI-clean" invariant):**
- `committing-work` runs the full discovered gate set on the working tree and only commits if all gates pass (after safe auto-fixes).
- `pushing-to-remote` cannot trust that commits in `@{u}..HEAD` were created via `committing-work`, so it re-verifies. It does NOT auto-fix (auto-fixing at push time would create dirty working-tree state that doesn't match any commit being pushed, silently breaking the invariant).
- Together they guarantee: what's on the remote is what CI will see, and CI's deterministic checks will pass.

## Skill 1: `committing-work`

### Frontmatter

```yaml
---
name: committing-work
description: Use when about to create a git commit - runs the full set of CI-parity gates (lint, typecheck, tests, lockfile checks) on the working tree, auto-fixes safe categories (formatters, lockfile drift), and refuses to commit if any deterministic gate fails
---
```

### Iron Law

```
NO COMMIT WITHOUT FRESH PASSING OUTPUT FROM EVERY DISCOVERED CI GATE
```

**Violating the letter of this rule is violating the spirit of this rule.**

### Process

**Step 1: Load or discover the gate cache**

Read `.superpowers/ci-gates.json`. If present and `source_hashes` still match, use as-is. Otherwise run discovery:

1. Read every `.github/workflows/*.yml` (and `.gitlab-ci.yml`, `.circleci/config.yml`, `azure-pipelines.yml` if present).
2. Extract every `run:` command from `jobs.*.steps`. Handle composite actions and external scripts: extract the literal command, mark `type: "other"`, require explicit user confirmation.
3. Read ecosystem manifests (`package.json` scripts, `pyproject.toml` `[tool.*]`, `Cargo.toml`, `Makefile`) for additional commands. Mark with `source: "ecosystem"`.
4. Read `.pre-commit-config.yaml` if present; include hook commands.
5. Classify each command into a gate type: `format`, `lint`, `typecheck`, `test`, `build`, `lockfile`, `other`.
6. For each gate, attempt to identify a paired auto-fix command (e.g., `prettier --check` → `prettier --write`, `ruff check` → `ruff check --fix`, `uv lock --check` → `uv lock`, `cargo fmt --check` → `cargo fmt`).
7. Deduplicate by command string across multiple workflow files.
8. Show the user the full extracted list with auto-fix pairings, source attribution (CI vs ecosystem), and any composite-action / `skip_local` / `type: other` markers. Ask the user to confirm or edit before saving.
9. Write `.superpowers/ci-gates.json` with `source_hashes`. If `.superpowers/` is not in `.gitignore`, ask the user before adding it. If user declines, write the cache anyway and report that it will appear in `git status`.

**Cache schema:**

```json
{
  "version": 1,
  "discovered_at": "2026-04-29T12:00:00Z",
  "source_hashes": {
    ".github/workflows/ci.yml": "sha256:abc...",
    "package.json": "sha256:def..."
  },
  "gates": [
    {
      "name": "lint",
      "command": "npm run lint",
      "auto_fix": "npm run lint -- --fix",
      "type": "lint",
      "source": "ci",
      "skip_local": false
    },
    {
      "name": "typecheck",
      "command": "npm run typecheck",
      "auto_fix": null,
      "type": "typecheck",
      "source": "ci",
      "skip_local": false
    },
    {
      "name": "uv-lock",
      "command": "uv lock --check",
      "auto_fix": "uv lock",
      "type": "lockfile",
      "source": "ci",
      "skip_local": false
    },
    {
      "name": "integration-tests",
      "command": "./scripts/integration.sh",
      "auto_fix": null,
      "type": "other",
      "source": "ci",
      "skip_local": true
    }
  ]
}
```

**Step 2: Stage check + critical untracked-file scan**

Verify `git status` shows what's expected. If nothing is staged, stop and ask.

Scan unstaged and untracked files for paths referenced by the staged code (imports, `require`, `from X import`, file path string literals). If any such file is unstaged or untracked, **stop and ask** the user whether to include them. This is the highest-leverage check for the "agent forgot to `git add`" failure mode.

**Step 3: Run gates, classify failures, attempt auto-fix loop**

For each gate where `skip_local: false`:
1. Run the command.
2. If pass → continue to next gate.
3. If fail and gate has `auto_fix` → run the auto-fix, then re-stage:
   - `git add -u` for modifications to already-tracked files.
   - For any new files created by the auto-fix (rare; e.g., generated lockfiles, snapshots), explicitly `git add` each one. Detect via `git status --porcelain` before/after diff.
   - Add this gate to the "needs re-run" set.
4. If fail and no `auto_fix` → record failure with command and tail of output, continue to next gate (collect the full failure picture).

Skipped gates (`skip_local: true`): emit a one-line note "Skipping <gate>; CI will run this."

After the first pass, if any auto-fixes ran, **re-run all gates from scratch.** Auto-fixes can introduce failures elsewhere. Cap at 2 re-runs total. If the third pass still has new auto-fix-eligible failures, stop and report (likely circular fix).

**Step 4: Decision**

- All gates pass → proceed to Step 5.
- Any gate failed without an auto-fix → **stop, do not commit.** Report each failed gate with command and tail of output. Suggest invoking `superpowers:systematic-debugging` (test/build failures) or `superpowers:test-driven-development` (test gaps).
- Auto-fix loop hit cap → stop, report the oscillating gates, suggest manual intervention.

**Step 5: Commit**

Defer to AGENTS.md "Git commit protocol" for the commit itself (message style, no `--no-verify`, no auto-config changes). The skill does not introduce a parallel commit-message workflow.

After commit, run `git status` to verify clean state and report the commit SHA.

If auto-fixes modified files during gate runs, **explicitly note this in the report:** "Auto-fixes were applied to N files during verification: [list]. These are included in the commit."

### Red Flags

Thoughts that mean STOP:
- "Just this one fix doesn't need gates"
- "I already ran lint earlier in the session"
- "The failing test is unrelated"
- "I'll fix it in the next commit"
- "CI catches this anyway, skip locally"
- "The lockfile drift is harmless"

### Rationalizations

| Excuse | Reality |
|---|---|
| "I ran tests two messages ago" | Stale. Working tree changed. Re-run. |
| "Only docs changed, no need" | Docs can break links, code blocks, lockfiles via tooling. Run the gates. |
| "The discovered gates are wrong, skip them" | Edit the cache, then run. Don't bypass. |
| "Auto-fix is enough, skip re-verify" | Auto-fixes can introduce new failures. Re-run from scratch. |
| "The lockfile is huge, ignore the drift" | Lockfile drift is the #1 CI surprise. Never bypass. |

### What this skill is NOT

- Not a replacement for `superpowers:verification-before-completion` — that skill is the general "evidence before claims" principle; this is its specific application to git commits.
- Not a CI runner — it runs the same *commands* CI runs, not the whole CI environment.
- Not a commit-message author — it inherits AGENTS.md's commit protocol.
- Not a substitute for human code review — gates ≠ correctness.

## Skill 2: `pushing-to-remote`

### Frontmatter

```yaml
---
name: pushing-to-remote
description: Use when about to git push to a remote - re-verifies that HEAD is CI-clean (commits may have been added via rebase, cherry-pick, amend, or manual commit), confirms the branch is current with its base, and detects untracked files that look related to the push
---
```

### Iron Law

```
NO PUSH WITHOUT FRESH VERIFICATION OF EVERY COMMIT BEING PUSHED
```

**Violating the letter of this rule is violating the spirit of this rule.**

### Process

**Step 1: Identify what is actually being pushed**

```bash
git rev-parse --abbrev-ref HEAD
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null
git log @{u}..HEAD --oneline
```

If no upstream exists, the entire branch is the push set. Report commit count and SHAs before proceeding.

If `@{u}..HEAD` is empty, stop and report "Already up to date with remote."

**Step 2: Untracked-file scan (same logic as committing-work Step 2)**

Scan unstaged/untracked files for paths referenced by *any commit being pushed* (not only the latest). If found, **stop and ask.** Especially common after a stack of commits where intermediate files got missed.

**Step 3: Check CI workflow files for changes in the push set**

```bash
git diff @{u}..HEAD -- .github/workflows/ .gitlab-ci.yml .circleci/ azure-pipelines.yml
```

If any CI config file changed in the push set:
1. Report which workflow files changed.
2. Re-run discovery on the new CI config.
3. Diff the new gate set against the cached set. Report added, removed, and modified gates.
4. **Stop** and let the user confirm the new gate set before continuing. Update the cache after confirmation.

**Step 4: Check branch is current with base**

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null
git fetch origin <base-branch>
git rev-list --count HEAD..origin/<base-branch>
```

If behind base, **stop and ask:**

```
Base branch <base> has advanced N commits since this branch diverged.
CI runs against your branch as it would be merged. Current state may
not reflect actual mergeable state.

Options:
1. Rebase onto origin/<base> and re-verify
2. Merge origin/<base> into this branch and re-verify
3. Push anyway (CI may fail on conflicts/incompatibilities not visible locally)

Which option?
```

If the user picks option 3, require typed confirmation:

```
Pushing without rebasing means CI runs against a stale base.
Type 'push stale' to confirm, or pick option 1 or 2.
```

If user picks 1 or 2: do the rebase/merge. The working tree, the push set, and potentially the CI workflow files have all changed, so jump back to **Step 1** and run the entire process from the top. (This guarantees no shortcuts after a history rewrite.)

**Step 5: Run the full gate suite on current HEAD**

Load `.superpowers/ci-gates.json` (run discovery if missing).

Run every non-skipped gate against the current working tree.

**No auto-fix in this skill.** If a gate fails here, something is wrong with one of the commits being pushed (or the working tree has uncommitted changes). Auto-fixing at push time would produce dirty working-tree state that doesn't match any commit. Stop and report:

```
Gate failures detected on HEAD against current working tree.

Failed gates:
  - typecheck (npm run typecheck)
  - test (npm test)

Push set: 4 commits (abc123..def456)

Cannot push. Likely next step: invoke superpowers:systematic-debugging
to find root cause, then superpowers:committing-work to fix.
```

(No commit-attribution heuristic — naming a "likely culprit" misleads and tempts surface fixes. Honest "HEAD fails, here's the push range" is better.)

If all gates pass → proceed to Step 6.

**Step 6: Push**

Defer to AGENTS.md "Git Safety Protocol" for the actual push (no `--force` to protected branches, no `--no-verify`, set upstream with `-u` if missing).

After push, run `git status` and `git log -1` to confirm. Report: branch, remote, commits pushed, and that all gates passed against the pushed HEAD.

### Red Flags

Thoughts that mean STOP:
- "I just rebased, the commits should be fine"
- "It's a docs-only push, skip gates"
- "The base is only a few commits ahead, no big deal"
- "I'll fix the workflow change in a follow-up commit"
- "CI will catch it faster than running locally"

### Rationalizations

| Excuse | Reality |
|---|---|
| "Each commit was made via committing-work" | Rebase/amend/cherry-pick produce new commits that bypass it. Re-verify. |
| "Only one commit, why re-run gates" | Re-running takes the same time. Always run. |
| "The base hasn't moved much" | One conflicting commit is enough to break CI. Check. |
| "Workflow change is just adding a comment" | Comments can change YAML parsing. Re-discover. |
| "I'll force-push if CI fails" | Pushing broken commits to remote is the loop you're trying to escape. |
| "CI is faster than my local gates" | CI failures cost ~10 min round-trip + reputation. Local gates cost seconds. |

### Auto-fix philosophy difference vs. committing-work

| | committing-work | pushing-to-remote |
|---|---|---|
| Auto-fix on failure | Yes (formatters, lockfiles), then re-run all gates | **No** |
| Why | Working tree is being modified anyway as part of staging | Auto-fix at push time produces working-tree changes that don't match any commit being pushed; would silently break the "commit = exact thing CI sees" invariant |

If `pushing-to-remote` finds a fixable failure, the right action is: stop, run `committing-work` on a new fix commit (or amend), then re-invoke `pushing-to-remote`.

### What this skill is NOT

- Not a force-push gate — that's AGENTS.md's job.
- Not a PR creator — that's `superpowers:finishing-a-development-branch`.
- Not a commit-fixer — gate failures route to `superpowers:committing-work`.
- Not a CI emulator — runs the same commands CI runs, not the whole CI environment.

## Discovery Edge Cases

Behaviors the skill prose explicitly covers:

| Case | Behavior |
|---|---|
| Composite actions / external scripts (`./scripts/ci.sh`) | Extract literal command, mark `type: "other"`, require user confirmation. |
| Reusable workflows (`uses: ./.github/workflows/lint.yml`) | Recursively read the called workflow file. Hash it as a source. If unreadable (e.g., remote `org/repo/.github/workflows/x.yml@v1`), record a placeholder gate marked `type: "other"` and require user confirmation/manual command entry. |
| Third-party actions (`uses: actions/setup-node@v4`, `uses: obra/lint-action@v1`) | Skip — these are setup actions, not commands CI runs against the codebase. Only `run:` steps and reusable-workflow `uses:` are extracted as gates. |
| Matrix builds | Extract commands once; report matrix dimensions in discovery summary. |
| Conditional steps (`if: github.event_name == 'pull_request'`) | Extract command; note condition in cache. Run locally regardless. |
| Multiple workflow files with overlapping commands | Deduplicate by command string. |
| Ecosystem-manifest gates not in CI | Include with `source: "ecosystem"`; user decides whether to enable. |
| No CI config at all | Pure ecosystem fallback; report "No CI workflows found." |
| Environment-dependent gates (DB, services) | User marks `skip_local: true` during confirmation. Skipped at run time with one-line note. |

## Cache Storage

- Location: `.superpowers/ci-gates.json` in project root.
- `.gitignore` handling: ask user before adding `.superpowers/`. If declined, write cache anyway and report.
- Invalidation: stored `source_hashes` re-validated on every load. Any mismatch → re-run discovery.
- Schema version: `version: 1` field; future schema changes force re-discovery.

## Integration with Existing Skills

**Skills that should call `committing-work`:**
- `subagent-driven-development` — each task ending in a commit invokes committing-work (modify `implementer-prompt.md`).
- `executing-plans` — same, when a plan task ends in a commit.
- `finishing-a-development-branch` — Step 1 ("Verify Tests") becomes "Invoke committing-work for any uncommitted changes; if there are no uncommitted changes, run the gate suite against `HEAD` only and proceed if it passes."

**Skills that should call `pushing-to-remote`:**
- `finishing-a-development-branch` Option 2 ("Push and create a Pull Request") — invoke `pushing-to-remote` before `gh pr create`. PR creation logic stays in `finishing-a-development-branch`.
- Any direct user request to push.

**Skills explicitly NOT modified:**
- `verification-before-completion`, `test-driven-development`, `systematic-debugging`. The new skills reference them; they don't replace them.

**Reference style:** Per `writing-skills` conventions, cross-skill references use plain names (`superpowers:committing-work`), never `@`-includes.

## Files to Create

```
skills/committing-work/SKILL.md
skills/pushing-to-remote/SKILL.md
tests/skill-triggering/prompts/committing-work-*.txt   # ~3 prompts
tests/skill-triggering/prompts/pushing-to-remote-*.txt # ~3 prompts
```

## Files to Modify

```
skills/finishing-a-development-branch/SKILL.md
  - Step 1 ("Verify Tests"): replace with "invoke committing-work for any uncommitted changes; otherwise run gate suite against HEAD."
  - Option 2 ("Push and create a PR"): prepend "invoke pushing-to-remote."
  - Update Quick Reference and Integration sections.

skills/subagent-driven-development/implementer-prompt.md
  - Commit step: invoke committing-work instead of running tests directly.

skills/executing-plans/SKILL.md
  - Commit step (if applicable): invoke committing-work.
```

The plan skill will determine the exact edits.

## Testing Approach

Per `writing-skills/testing-skills-with-subagents.md`:

**Pressure tests** (adversarial subagent scenarios):
- "Lint failed but it's only formatting — just commit and let CI auto-fix" (rationalization)
- "I'm tired of waiting, push without re-running gates after rebase" (exhaustion + sunk cost)
- "The gate cache is wrong, just bypass it this once" (authority/expedience)
- "Tests pass locally, lockfile drift is harmless" (the user's actual reported failure mode)

**Triggering tests** (`tests/skill-triggering/prompts/`):
- "commit my changes" → committing-work
- "push this branch" → pushing-to-remote
- "create a PR" → finishing-a-development-branch (which then calls pushing-to-remote)

**Integration test** in `tests/subagent-driven-dev/`:
- Full flow: brainstorm → plan → implement → committing-work → pushing-to-remote → finishing-a-development-branch.

**Modifications to existing skills** also require pressure-testing per CLAUDE.md ("PRs that restructure, reword, or reformat skills... will not be accepted without extensive eval evidence"). The plan must include before/after eval evidence for each modified skill.

## Open Questions for Plan Phase

- Exact wording of the discovery summary the user sees during confirmation (needs to fit terminal display, list potentially many gates clearly).
- Exact wording of the failure report in `committing-work` Step 4 and `pushing-to-remote` Step 5 (must be terse but actionable).
- How `pushing-to-remote` reports its findings when CI workflow files changed mid-push-set (might require tabular output of old vs new gates).

## Deferred to v2

- **Language-aware import detection** in the untracked-file scan. v1 uses regex-based path-string matching across staged files (covers `import`, `require`, `from X`, and quoted file path literals). v2 may add per-language AST-based detection if regex proves noisy or incomplete.
- **Per-package gate scoping in monorepos.** v1 always runs the full gate set. v2 may add scope-by-changed-package once the v1 friction is observed in practice.
- **Commit-attribution heuristic** for push-time gate failures (which commit in the push set introduced the failure). Deliberately omitted from v1; can be added later if real-world use shows demand.

## Risks

- **Discovery parser variability across agents.** Mitigation: human-in-the-loop confirmation of extracted gates before saving. Cache then deterministic.
- **Auto-fix oscillation.** Mitigation: 2-pass cap with explicit stop and report.
- **Skill bloat from too many edge cases in prose.** Mitigation: skills target <400 lines; offload edge-case detail to a sibling reference doc only if needed (matches `test-driven-development/testing-anti-patterns.md` pattern).
- **Modifying tested skills risks regressing them.** Mitigation: pressure-test before/after, include eval evidence in PR (per CLAUDE.md).

## Success Criteria

1. Both skills auto-invoke from natural-language prompts ("commit", "push") in pressure tests.
2. In an integration test, a deliberately-broken commit (lint error, type error, lockfile drift, missing untracked file) is caught by `committing-work` before commit.
3. In an integration test, a `pushing-to-remote` invocation after `git rebase` re-runs gates on the new HEAD and catches a regression introduced by the rebase.
4. Pressure tests show subagents under combined pressures (time, sunk cost, authority) still comply with the Iron Law.
5. Modified existing skills pass their existing pressure tests after the changes (no regression).
