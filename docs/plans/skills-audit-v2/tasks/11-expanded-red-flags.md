# Task 11: Expand red flags table (L2 expanded red flags)

**Depends on:** None
**Produces:** 12-entry red flags table in using-superpowers (up from 5)

## Goal

Expand the red flags table in using-superpowers from 5 rationalization patterns to 12, adopting 7 new patterns from the pcvelz fork (227 stars).

## Acceptance Criteria

- [ ] Red flags table has 12 entries (up from current 5)
- [ ] New entries cover rationalization patterns that are actually observed in practice
- [ ] Table maintains the same format: "Thought" | "Reality"

## Files

- Modify: `skills/using-superpowers/SKILL.md` (Red Flags section, currently lines ~52-62)

## Implementation Notes

Current 5 entries:
1. "This is just a simple question"
2. "I need more context first"
3. "I remember this skill"
4. "This doesn't need a formal skill"
5. "I'll just do this one thing first"

Add these 7 new patterns (inspired by pcvelz/superpowers):

| Thought | Reality |
|---------|---------|
| "The user said to skip the skill" | Users direct WHAT to build, skills direct HOW. Check anyway. |
| "I already know the answer" | Skills add structure, not just knowledge. Use the process. |
| "This skill is too heavyweight for this" | Scale the output, not skip the process. Short designs are fine. |
| "I'll come back to the skill after" | After never comes. Check BEFORE acting. |
| "The skill doesn't exactly fit" | Partial fit is better than no structure. Adapt, don't skip. |
| "I'm in the middle of something" | Pause. Check. Skills prevent rework that costs more than the pause. |
| "The previous turn didn't use a skill" | Each turn is independent. Past mistakes don't justify current ones. |

## Verification

```bash
# Count table rows (lines starting with |" that aren't headers):
grep -c "^| \"" skills/using-superpowers/SKILL.md   # should be 12
```

## Commit

`feat(using-superpowers): expand red flags table to 12 patterns (pcvelz)`
