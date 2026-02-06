# PR Template - Enforce 1GiB Worktree Hard Limit

## Title
chore(skills): enforce 1GiB worktree hard limit and mandatory cleanup

## Summary
- Enforce hard policy in worktree-related skills:
  - max 1 linked worktree per repo
  - max 1GiB (1024MB) per linked worktree and worktree storage
  - immediate clean (`git clean -fdx`) then re-check; destroy if still over limit
  - mandatory end-of-task removal for all linked worktrees and worktree directory
- Remove/replace guidance that implied keeping worktrees after task completion.
- Add baseline and post-update evidence docs for RED->GREEN policy behavior.

## Scope
- Updated skills:
  - `skills/using-git-worktrees/SKILL.md`
  - `skills/finishing-a-development-branch/SKILL.md`
  - `skills/executing-plans/SKILL.md`
  - `skills/subagent-driven-development/SKILL.md`
  - `skills/brainstorming/SKILL.md`
- Added plan/evidence docs under `docs/plans/`.

## Verification
- `git diff --check`
- `rg -n "1GiB|1024MB|clean -fdx|worktree remove --force|prune --expire now" skills/using-git-worktrees/SKILL.md skills/finishing-a-development-branch/SKILL.md skills/executing-plans/SKILL.md skills/subagent-driven-development/SKILL.md skills/brainstorming/SKILL.md`

## Risk
- Behavior change is strict by design: old workflows that retained worktrees are now intentionally blocked.
- Cleanup commands are destructive for linked worktrees; this is required by policy.

## Rollback
- Revert this PR if policy needs to be relaxed temporarily.

## Checklist
- [x] 1GiB hard limit documented and enforced in skill text
- [x] >1024MB clean->recheck->destroy flow documented
- [x] End-of-task full cleanup flow documented
- [x] “Keep worktree” guidance removed
- [x] Evidence docs added
