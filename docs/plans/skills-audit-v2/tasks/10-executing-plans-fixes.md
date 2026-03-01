# Task 10: Fix executing-plans (CX-20, W2-1, L2 plan mode, L2 plan status, L3 plan verify)

**Depends on:** None
**Produces:** Escalation guidance, worktree handoff, plan mode prohibition, plan status update, and plan verification step in executing-plans

## Goal

Five fixes: add autonomous plan revision escalation guidance (CX-20), make worktree handoff path more explicit (W2-1), add plan mode prohibition (L2 pcvelz), add plan status frontmatter update on completion (L2 pcvelz), and add plan verification step before executing (L3 from PR #448).

## Acceptance Criteria

- [ ] Skill includes guidance on when to escalate to the user for plan revision (not silently deviate)
- [ ] Worktree path is explicit: executor reads `worktree.main.path` from state.yml
- [ ] Skill has a plan mode prohibition block
- [ ] Completion step updates plan status frontmatter to `status: executed`
- [ ] Pre-execution step includes a 3-claim verification check against the codebase

## Files

- Modify: `skills/executing-plans/SKILL.md`

## Implementation Notes

**CX-20 (escalation guidance):** Add to "When to Stop" or "When to Revisit" section:
```markdown
### Plan Revision Escalation

If during execution you discover the plan is fundamentally wrong (not just a minor adjustment):
- **STOP execution** — do not silently deviate from the plan
- **Report to the user:** what you found, why the plan needs revision, what you recommend
- **Wait for approval** before continuing with a modified approach
- Minor adjustments (file path changes, small API differences) are fine — document them in the task completion report
```

**W2-1 (worktree handoff):** In the Pre-flight Check or Session Start section:
```markdown
**Worktree:** Execute all tasks in `worktree.main.path` from state.yml. If worktree is null (user opted out), execute in the current directory.
```

**Plan mode prohibition (pcvelz):**
```markdown
<HARD-GATE>
Do NOT use `EnterPlanMode` or `ExitPlanMode` during plan execution. These tools trap the session in plan mode where Write/Edit tools are restricted, preventing implementation work.
</HARD-GATE>
```

**Plan status (pcvelz):** In the completion/final step:
```markdown
Update the plan document's YAML frontmatter from `status: pending` to `status: executed`.
```

**Plan verification (PR #448 / banga87 / 3-Example Rule):** Add before the first task execution:
```markdown
### Plan Verification (3-Example Rule)

Before executing the first task, spot-check 3 claims from the plan against the actual codebase:
1. Pick 3 file paths, function names, or architectural assumptions from the plan
2. Verify each exists and matches what the plan expects
3. If any check fails: flag it, assess impact, revise the affected tasks before proceeding

This catches stale plans, renamed files, and wrong assumptions before wasted implementation work.
```

## Verification

```bash
grep -c "escalat" skills/executing-plans/SKILL.md           # should be >= 1
grep -c "worktree.main.path" skills/executing-plans/SKILL.md # should be >= 1
grep -c "EnterPlanMode" skills/executing-plans/SKILL.md       # should be >= 1
grep -c "status: executed" skills/executing-plans/SKILL.md    # should be >= 1
grep -c "3-Example" skills/executing-plans/SKILL.md           # should be >= 1
```

## Commit

`fix(executing-plans): add escalation, worktree handoff, plan mode block, status, verification (CX-20, W2-1, pcvelz, #448)`
