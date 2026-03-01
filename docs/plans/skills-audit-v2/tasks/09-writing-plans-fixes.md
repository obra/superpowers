# Task 9: Fix writing-plans (CX-14, W2-1, L2 plan mode, L2 plan status)

**Depends on:** None
**Produces:** Clearer header instruction, worktree handoff, plan mode prohibition, and plan status frontmatter in writing-plans

## Goal

Four fixes: reorder "write header last" instruction for clarity (CX-14), make worktree handoff path more explicit (W2-1), add plan mode prohibition (L2 pcvelz), and add plan status frontmatter guidance (L2 pcvelz).

## Acceptance Criteria

- [ ] "Write the header last" instruction is clearly positioned and explained (why: because Team Fitness Check determines execution approach)
- [ ] Worktree path handoff is explicit: the plan must reference `worktree.main.path` from state.yml
- [ ] Skill has a plan mode prohibition block
- [ ] Plan document template includes `status: pending` YAML frontmatter

## Files

- Modify: `skills/writing-plans/SKILL.md`

## Implementation Notes

**CX-14 (header order):** The "Write the header last" instruction exists but its placement is confusing. Move or clarify it so implementers understand:
1. Draft all tasks first
2. Run Team Fitness Check
3. Then write the header (which includes the execution approach recommendation)

**W2-1 (worktree handoff):** In the "Save Location" or "After Writing" section, add explicit guidance:
```markdown
**Worktree context:** The plan executes in the worktree at `worktree.main.path` (from state.yml). Include this path context in the plan header so executors know where to work.
```

**Plan mode prohibition (pcvelz):** Add near the top:
```markdown
<HARD-GATE>
Do NOT use `EnterPlanMode` or `ExitPlanMode` during plan writing. These tools trap the session in plan mode where Write/Edit tools are restricted, preventing the writing-plans skill from saving the plan document.
</HARD-GATE>
```

**Plan status frontmatter (pcvelz):** Update the plan template to include:
```yaml
---
status: pending
---
```
And note in "After Writing" that executors change this to `status: executed` on completion.

## Verification

```bash
grep -c "header last" skills/writing-plans/SKILL.md         # should be >= 1
grep -c "worktree.main.path" skills/writing-plans/SKILL.md  # should be >= 1
grep -c "EnterPlanMode" skills/writing-plans/SKILL.md        # should be >= 1
grep -c "status: pending" skills/writing-plans/SKILL.md      # should be >= 1
```

## Commit

`fix(writing-plans): clarify header order, worktree handoff, add plan mode block and status (CX-14, W2-1, pcvelz)`
