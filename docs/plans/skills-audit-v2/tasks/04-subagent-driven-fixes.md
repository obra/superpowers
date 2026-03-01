# Task 4: Fix subagent-driven-development consistency (CX-13, CX-15, W3-1)

**Depends on:** None
**Produces:** Clearer subagent lifecycle semantics, announce instruction, and finishing callout

## Goal

Three fixes to subagent-driven-development: clarify that subagents are "fresh per task, persistent within task" (CX-13), add "Announce at start" instruction (CX-15), and add bold REQUIRED SUB-SKILL callout for the finishing step (W3-1).

## Acceptance Criteria

- [ ] Subagent lifecycle is explicitly described as "fresh per task, persistent within task (including re-review loops)"
- [ ] Skill has an "Announce at start" instruction near the top
- [ ] Finishing step has a bold **REQUIRED** callout for `superpowers:finishing-a-development-branch`

## Files

- Modify: `skills/subagent-driven-development/SKILL.md`

## Implementation Notes

**CX-13 (subagent freshness):** Add a note in the Overview or Process section clarifying:
```markdown
**Subagent lifecycle:** Each task gets a fresh subagent. The subagent persists within that task (including any re-review loops) but is not reused across tasks.
```

**CX-15 (announce at start):** Add after the Overview heading:
```markdown
**Announce at start:** "I'm using the subagent-driven-development skill to execute tasks with independent subagents."
```

**W3-1 (finishing callout):** In the Integration section or at the end of the process, add:
```markdown
**REQUIRED:** After all tasks are complete, invoke `superpowers:finishing-a-development-branch` to handle merge/PR/cleanup.
```

## Verification

```bash
grep -c "fresh per task" skills/subagent-driven-development/SKILL.md      # should be >= 1
grep -c "Announce at start" skills/subagent-driven-development/SKILL.md   # should be >= 1
grep -c "REQUIRED.*finishing" skills/subagent-driven-development/SKILL.md # should be >= 1
```

## Commit

`fix(subagent-driven): clarify lifecycle, add announce and finishing callout (CX-13, CX-15, W3-1)`
