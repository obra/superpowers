# Task 7: Fix dispatching-parallel-agents (CX-17, L2 sequential)

**Depends on:** None
**Produces:** Integration section and sequential fallback note in dispatching skill

## Goal

Add an Integration section to dispatching-parallel-agents (CX-17). Add a sequential fallback note for platforms that can't parallel-dispatch like Codex (L2 from markelz0r fork).

## Acceptance Criteria

- [ ] Skill has an `## Integration` section listing callers and related skills
- [ ] Skill has a note about sequential fallback for platforms without parallel dispatch capability

## Files

- Modify: `skills/dispatching-parallel-agents/SKILL.md`

## Implementation Notes

**CX-17 (Integration section):** Add at the end of the file:
```markdown
## Integration

**Called by:**
- **subagent-driven-development** — for parallel task execution within a session
- **agent-team-driven-development** — for spawning parallel implementer agents

**Pairs with:**
- **using-git-worktrees** — parallel agents often need isolated worktrees
```

**Sequential fallback (markelz0r/superpowers-codex):** Add a note in the "When to Use" or "When NOT to Use" section:
```markdown
### Platform Note

Some platforms (e.g., Codex) cannot dispatch agents in parallel. On these platforms, execute tasks sequentially instead — the same tasks, the same isolation, but one at a time rather than concurrent.
```

## Verification

```bash
grep -c "## Integration" skills/dispatching-parallel-agents/SKILL.md   # should be 1
grep -c "sequential" skills/dispatching-parallel-agents/SKILL.md       # should be >= 1
```

## Commit

`fix(dispatching): add integration section and sequential fallback note (CX-17, markelz0r)`
