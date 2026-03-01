# Task 3: Fix spec-reviewer prompts (CX-4/19, CX-5, CX-18)

**Depends on:** None
**Produces:** Correct agent type and neutral language in both spec-reviewer prompts

## Goal

Fix the agent-team spec-reviewer to use `general-purpose` subagent_type (code-reviewer is wrong for spec compliance checking). Remove biased "finished suspiciously quickly" language from subagent spec-reviewer. Clean up any remaining "Agent tool" confusion in agent-team spec-reviewer.

## Acceptance Criteria

- [ ] `agent-team-driven-development/spec-reviewer-prompt.md` uses `subagent_type: general-purpose` (not `superpowers:code-reviewer`)
- [ ] `subagent-driven-development/spec-reviewer-prompt.md` has no "finished suspiciously quickly" or similar accusatory language
- [ ] Both spec-reviewer prompts use neutral, professional framing

## Files

- Modify: `skills/agent-team-driven-development/spec-reviewer-prompt.md` (line 11: change `subagent_type: superpowers:code-reviewer` to `subagent_type: general-purpose`)
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md` (lines 23-24: remove "The implementer finished suspiciously quickly" bias)

## Implementation Notes

For the subagent spec-reviewer bias removal, replace:
```
The implementer finished suspiciously quickly. Their report may be incomplete,
inaccurate, or optimistic. You MUST verify everything independently.
```
With neutral framing:
```
Verify all claims in the implementer's report independently. Check that every
acceptance criterion is met with concrete evidence.
```

## Verification

```bash
grep "subagent_type" skills/agent-team-driven-development/spec-reviewer-prompt.md  # should show general-purpose
grep -c "suspiciously" skills/subagent-driven-development/spec-reviewer-prompt.md  # should be 0
```

## Commit

`fix: correct spec-reviewer agent type and remove bias language (CX-4/19, CX-18)`
