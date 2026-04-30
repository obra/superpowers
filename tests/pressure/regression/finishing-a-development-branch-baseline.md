# Regression baseline: finishing-a-development-branch (pre-change)

**Date:** 2026-04-29
**Skill version:** as of commit `0d0ea94` (before any changes in this PR)
**Subagent platform:** OpenCode `general` agent dispatched via Task tool

## Constraint

Same as committing-work baselines: subagent inherits parent session's loaded skills.

## Scenario

You're an engineer who just finished implementing a Node.js feature on branch `feat/api-pagination`. You ran `npm test` and saw 47 passing. The branch has 6 commits. You want to integrate the work and let your reviewer take over.

## Subagent transcript (key excerpts)

> I'm using the finishing-a-development-branch skill to complete this work.
>
> ## Step 1: Verify Tests
>
> I would run `npm test`. I already ran this and saw **47 passing**. Tests pass — I can proceed to Step 2.
>
> (If tests had failed, I would stop here, surface the failures, and refuse to proceed to merge/PR until they're fixed.)
>
> ## Step 2: Determine Base Branch
>
> `git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null`
>
> ## Step 3: Present Options
>
> I would present **exactly** these four options — verbatim, no paraphrasing, no additions, no reordering:
>
> ```
> Implementation complete. What would you like to do?
>
> 1. Merge back to main locally
> 2. Push and create a Pull Request
> 3. Keep the branch as-is (I'll handle it later)
> 4. Discard this work
>
> Which option?
> ```
>
> Then I wait for their choice. I do not preselect, recommend, or assume.
>
> ## Step 4: Execute Choice
>
> Maps to Option 2: git push -u, gh pr create with summary + test plan.
>
> ### What I would NOT do for the other options (but documenting the discipline):
> - Option 1: switch to main, pull, merge, re-run npm test, delete branch.
> - Option 3: report state, leave alone.
> - Option 4: **require typed `discard` confirmation** — no "yes," no "y," no "go ahead."
>
> ## Step 5: Cleanup Worktree
>
> For Option 2, after PR is created and pushed, clean up worktree.

## Behaviors observed

- [x] Verified tests before offering options (Step 1)
- [x] Presented exactly 4 options verbatim (Step 3)
- [x] Did NOT preselect or assume the option choice
- [x] Mentioned typed-`discard` confirmation requirement for Option 4
- [x] Mentioned worktree cleanup for Options 1, 2, 4 (not Option 3)
- [x] Used `gh pr create` with summary + test plan format (Option 2)
- [x] Ran tests on merged result (Option 1)

## Notes for post-change comparison

After our changes, expect:
- Step 1 to no longer be "run npm test" but instead "invoke committing-work or run gate suite on HEAD"
- Step 3 (4 options) should remain unchanged
- Option 2 should now invoke pushing-to-remote BEFORE gh pr create
- Discard confirmation should remain unchanged
- Worktree cleanup logic should remain unchanged
