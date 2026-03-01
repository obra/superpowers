# Task 6: Fix writing-skills references (CX-9, W6-1)

**Depends on:** None
**Produces:** Correct skill name references in writing-skills

## Goal

Fix stale reference to "designing-before-coding" (should be "brainstorming") and upgrade the verification-before-completion reference from illustrative to functional.

## Acceptance Criteria

- [ ] No references to "designing-before-coding" in writing-skills/SKILL.md
- [ ] Any mention of verification-before-completion is a proper skill reference (`superpowers:verification-before-completion`) not just an illustrative example

## Files

- Modify: `skills/writing-skills/SKILL.md`

## Implementation Notes

**CX-9:** Search for "designing-before-coding" and replace with "brainstorming". This is a skill name that was renamed but the reference in writing-skills wasn't updated.

**W6-1:** Find where verification-before-completion is mentioned as an example and upgrade it to a functional reference. Ensure it uses the `superpowers:verification-before-completion` format.

## Verification

```bash
grep -c "designing-before-coding" skills/writing-skills/SKILL.md              # should be 0
grep -c "superpowers:verification-before-completion" skills/writing-skills/SKILL.md  # should be >= 1
```

## Commit

`fix(writing-skills): update stale skill reference and verification link (CX-9, W6-1)`
