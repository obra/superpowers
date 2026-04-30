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

```
NO PUSH WITHOUT FRESH VERIFICATION OF EVERY COMMIT BEING PUSHED
```

Re-verify HEAD against the full gate suite, against the working tree, against the branch base. Then push.

This is the application of `superpowers:verification-before-completion` to git pushes.

## The Process

### Step 1: Identify what is actually being pushed

```bash
git rev-parse --abbrev-ref HEAD
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null
git log @{u}..HEAD --oneline
```

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

```bash
git diff @{u}..HEAD -- .github/workflows/ .gitlab-ci.yml .circleci/ azure-pipelines.yml
```

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

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null
# Falls back to checking against main, then master, if origin/HEAD not set.

git fetch origin <base-branch>
git rev-list --count HEAD..origin/<base-branch>
```

If the count is `0`: branch is current with base. Continue to Step 5.

If the count is `> 0`: branch is behind base. **Stop and ask:**

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

If user picks option 3, require typed confirmation:

```
Pushing without rebasing means CI runs against a stale base.
Type 'push stale' to confirm, or pick option 1 or 2.
```

If user types anything other than exactly `push stale`, stop. Re-ask.

If user picks 1 or 2: do the rebase/merge. The working tree, push set, and possibly CI workflow files have all changed → **jump back to Step 1** and run the entire process from the top.

### Step 5: Run the full gate suite on current HEAD

Load `.superpowers/ci-gates.json` (run discovery if missing — same as `committing-work` Step 1).

Run every gate where `skip_local: false` against the current working tree.

**No auto-fix in this skill.** Auto-fix at push time produces working-tree changes that don't match any commit being pushed; that silently breaks the "commit = exact thing CI sees" invariant.

If any gate fails, **stop and report:**

```
Gate failures detected on HEAD against current working tree.

Failed gates:
  - <type> (<command>)
    Tail of output: <last 5-10 lines>

Push set: <N> commits (<first-sha>..<HEAD-sha>)

Cannot push. Likely next step:
  1. superpowers:systematic-debugging — find root cause
  2. superpowers:committing-work — fix in a new commit (or amend HEAD)
  3. Re-invoke this skill (pushing-to-remote)
```

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
   ```
   Pushed <N> commit(s) to <remote>/<branch>:
   - <sha 1> <subject>
   - <sha 2> <subject>

   All <M> deterministic gates passed against the pushed HEAD.
   ```

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
