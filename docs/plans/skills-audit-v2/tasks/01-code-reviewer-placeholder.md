# Task 1: Fix code-reviewer placeholder mismatch (CX-7)

**Depends on:** None
**Produces:** Consistent placeholder naming in code-reviewer template

## Goal

Fix the `{PLAN_REFERENCE}` placeholder in code-reviewer.md to match the `{PLAN_OR_REQUIREMENTS}` used elsewhere in the same file (line 7).

## Acceptance Criteria

- [ ] `{PLAN_REFERENCE}` on line 18 of code-reviewer.md is changed to `{PLAN_OR_REQUIREMENTS}`
- [ ] No other instances of `{PLAN_REFERENCE}` remain in the file

## Files

- Modify: `skills/requesting-code-review/code-reviewer.md` (line 18: section header "## Requirements/Plan" followed by placeholder)

## Verification

```bash
# Should return 0 matches:
grep -c "PLAN_REFERENCE" skills/requesting-code-review/code-reviewer.md
# Should return 2 matches (line 7 + line 18):
grep -c "PLAN_OR_REQUIREMENTS" skills/requesting-code-review/code-reviewer.md
```

## Commit

`fix(code-reviewer): align placeholder to {PLAN_OR_REQUIREMENTS} (CX-7)`
