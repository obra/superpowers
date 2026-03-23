# Commit Project-Specific Guidance

## Branch Naming

Convention: `<type>/<issue#>-<short-description>`

Examples:
- `fix/1-update-triage-skill-docs`
- `feat/2-add-new-skill-for-deployment`
- `chore/3-reorganize-documentation`

## Commit Message Format

```
<type>: <scope> — one line description

<optional longer description>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`

Scope examples: `triage-skill`, `setup-command`, `spec`, `documentation`

Example:
```
fix: bug-triage skill — correct hypothesis testing description

Updated the parallel hypothesis testing section to clarify that
subagents must be independent of each other's results.
```

## PR Template

PR body should include:
- **What changed:** Which skills, commands, or docs were updated
- **Why:** Reasoning for the change
- **Verification:** How the change was verified (manual review, docs read, etc.)

Example:
```markdown
## What Changed
Updated bug-triage skill documentation to clarify parallel hypothesis testing

## Why
The process for determining when hypotheses are independent needed clarification

## Verification
- Reviewed against loop-orchestrator expectations
- Confirmed dispatching-parallel-agents skill requirements match
```

## Cleanup

Before PR:
- [ ] All documentation is grammatically correct
- [ ] Code examples (if any) are accurate
- [ ] Cross-references to other skills/commands are correct
- [ ] JSON files are valid
- [ ] No trailing whitespace or formatting issues

## Notes

This repo contains documentation and skill definitions. Changes are primarily additive:
- New skills get new `skills/<name>/SKILL.md` files
- New commands get new `commands/<name>.md` files
- Design specs go in `docs/superpowers/specs/`
- Project-specific guidance goes in `.claude/shared/`

Deletions are rare and require discussion.
