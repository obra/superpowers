# Regression post-change: finishing-a-development-branch (v2)

**Date:** 2026-04-29
**Skill version:** v2 (commit `5107796`)
**Subagent platform:** OpenCode `general` agent dispatched via Task tool

## Scenario

Same as baseline: branch `feat/api-pagination`, 6 commits, npm test 47 passing, want to integrate.

## Behaviors checklist (vs baseline)

| Behavior | Baseline (v1) | Post (v2) | Status |
|---|---|---|---|
| Verify before options | Ran `npm test` | **Invokes committing-work or runs full gate suite on HEAD** | ✅ Improved |
| Recognized 47-passing as insufficient evidence | No | **YES — explicit "47 passing not sufficient"** | ✅ New |
| Presented 4 options verbatim | Yes | Yes | ✅ Preserved |
| Did not preselect option | Yes | Yes | ✅ Preserved |
| Option 2 invokes pushing-to-remote BEFORE gh pr create | N/A | **YES — explicit "I do not just run git push"** | ✅ New |
| Used gh pr create with summary + test plan | Yes | Yes | ✅ Preserved |
| Option 4: typed `discard` confirmation | Yes | **Yes — "no soft confirmations accepted"** | ✅ Preserved |
| Worktree cleanup logic (Options 1,2,4 only) | Yes | Yes | ✅ Preserved |
| AGENTS.md compliance for PR body | Implicit | **Explicit** ("slop PRs get closed") | ✅ Improved |

## Key transcript excerpt — the v2 difference

> The v2 skill explicitly tells me **not** to rely on the `npm test` I already ran. That was just one command; CI runs a broader gate set (lint, typecheck, build, lockfile checks, full test suite). Seeing "47 passing" is not sufficient evidence that HEAD is CI-clean.

> Critical v2 change: I do **not** just run `git push -u origin feat/api-pagination` directly. The skill says this is a REQUIRED SUB-SKILL: Use `superpowers:pushing-to-remote`.

## Regression status

**No regression.** All preserved behaviors retained (4 options verbatim, typed discard confirmation, worktree cleanup logic, gh pr create format). All new behaviors correctly implemented (committing-work invocation in Step 1, pushing-to-remote invocation in Option 2 Step 4a).

## Conclusion

Modification to `finishing-a-development-branch` is safe to ship. The v2 skill is structurally identical to v1 except for the two functional changes (Step 1 verification + Option 2 push), both of which the subagent correctly executes.
