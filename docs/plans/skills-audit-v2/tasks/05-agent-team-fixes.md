# Task 5: Fix agent-team-driven-development (CX-15, L3 cross-task)

**Depends on:** None
**Produces:** Announce instruction and cross-task dependency check in agent-team skill

## Goal

Add "Announce at start" instruction to agent-team-driven-development (CX-15). Add cross-task dependency check to the final review phase (L3 upstream gap from PR #578).

## Acceptance Criteria

- [ ] Skill has an "Announce at start" instruction near the top
- [ ] Phase 3 (Completion) or final review includes a cross-task dependency check step

## Files

- Modify: `skills/agent-team-driven-development/SKILL.md`

## Implementation Notes

**CX-15 (announce at start):** Add after Overview/When to Use:
```markdown
**Announce at start:** "I'm using the agent-team-driven-development skill to orchestrate parallel specialist agents."
```

**Cross-task dependency check (PR #578 / STRML):** Add to Phase 3 (Completion) or the final review step:
```markdown
### Cross-Task Dependency Check

Before marking the plan complete, review all completed tasks together for cross-task issues:
- Import/export mismatches between tasks that were implemented in parallel
- Shared state assumptions that conflict across task boundaries
- Interface contracts that evolved during implementation but weren't propagated
- Test assertions in one task that depend on implementation details of another
```

## Verification

```bash
grep -c "Announce at start" skills/agent-team-driven-development/SKILL.md       # should be >= 1
grep -c "Cross-Task Dependency" skills/agent-team-driven-development/SKILL.md   # should be >= 1
```

## Commit

`fix(agent-team): add announce and cross-task dependency check (CX-15, PR #578)`
