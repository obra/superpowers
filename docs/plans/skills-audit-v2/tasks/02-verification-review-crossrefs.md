# Task 2: Add verification/review cross-references (W1-2, W5-1)

**Depends on:** None
**Produces:** Integration and cross-reference sections linking verification and code review skills

## Goal

Add an Integration section to verification-before-completion listing its callers and usage context. Add "Pairs with" cross-references between requesting-code-review and receiving-code-review.

## Acceptance Criteria

- [ ] `verification-before-completion/SKILL.md` has a new `## Integration` section at the end (before any final line) listing callers
- [ ] `requesting-code-review/SKILL.md` has a "Pairs with" entry referencing `receiving-code-review`
- [ ] `receiving-code-review/SKILL.md` has a "Pairs with" entry referencing `requesting-code-review`

## Files

- Modify: `skills/verification-before-completion/SKILL.md` — add `## Integration` section after "The Bottom Line" section
- Modify: `skills/requesting-code-review/SKILL.md` — add "Pairs with" to existing Integration section
- Modify: `skills/receiving-code-review/SKILL.md` — add `## Integration` section with "Pairs with" entry

## Implementation Notes

**verification-before-completion Integration section content:**
```markdown
## Integration

**Called by:**
- **subagent-driven-development** — REQUIRED after each task completion
- **agent-team-driven-development** — REQUIRED for implementer completion reports
- **executing-plans** — REQUIRED before marking any task done
- **requesting-code-review** — reviewer uses evidence format for findings

**Pairs with:**
- **requesting-code-review** — reviewer uses the canonical evidence format defined here
- **finishing-a-development-branch** — final verification before merge/PR
```

**requesting-code-review "Pairs with" addition** (add to existing Integration section):
```markdown
**Pairs with:**
- **receiving-code-review** — the other side of the review process; handles responding to review feedback
```

**receiving-code-review Integration section:**
```markdown
## Integration

**Pairs with:**
- **requesting-code-review** — the other side of the review process; handles dispatching review and processing results
```

## Verification

```bash
grep -c "## Integration" skills/verification-before-completion/SKILL.md  # should be 1
grep -c "receiving-code-review" skills/requesting-code-review/SKILL.md   # should be >= 1
grep -c "requesting-code-review" skills/receiving-code-review/SKILL.md   # should be >= 1
```

## Commit

`fix: add cross-references between verification and code review skills (W1-2, W5-1)`
