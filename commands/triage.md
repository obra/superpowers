# Triage: Investigate a Bug

Investigate a bug to identify root cause with evidence before any fix is attempted.

## Usage

```
/triage <issue#>
```

**Arguments:**
- `<issue#>` (required) — GitHub issue number to triage

## Behavior

Reads the issue from GitHub, traces the code, forms hypotheses, tests them with evidence, and produces a confirmed root cause with a reproduction test.

**Deliverable:** Root cause with specific code locations, reproduction test, and test acceptance criteria.

**Non-blocking:** In loop mode, posts questions via `[TRIAGE_QUESTION]` markers and moves to next item.

## Process

1. **Understand the issue** — Load issue details, read relevant docs
2. **Locate the code** — Trace symptom to specific files and line numbers
3. **Form hypotheses** — 2-5 specific hypotheses with file/line references
4. **Test hypotheses** — Parallel or sequential testing with evidence
5. **No hypothesis confirmed?** — Form new hypotheses from evidence
6. **Conclude** — State root cause with confidence level
7. **Define test acceptance criteria** — Checklist for `/fix` and `/test`
8. **Recommend next steps** — Suggest `/fix <issue#>` or `/write-plan <issue#>`

## Output

**Terminal:**
```
Triage complete for issue #123:

Root Cause: Connection timeout too short in auth/login.py:45
Confidence: High
Reproduction test: tests/scratch/test_login_timeout.py

Test Acceptance Criteria:
- Reproduction test validates timeout behavior
- Unit tests in auth/ must pass
- Integration tests for login flow must pass
- No regressions in existing auth tests

Next command: /fix 123
```

**GitHub Issue:**
Posts `[TRIAGE_READY]` marker with root cause summary and test criteria.

## Prerequisites

- Issue exists in GitHub
- GitHub CLI (`gh`) is installed and authenticated
- Project-specific triage context (`.claude/shared/triage-project.md`) if it exists

## Integration

**Invokes:**
- **superpowers:bug-triage** skill — does all the investigation work

**Followed by:**
- `/fix <issue#>` — for simple fixes
- `/write-plan <issue#>` — for complex fixes requiring architecture changes

## Examples

**Triage a login bug:**
```
/triage 123
```

**In loop mode:**
Loop orchestrator automatically calls triage for items in the Triage stage.

## Error Handling

**Configuration errors:**
- Issue doesn't exist → Stop, report error
- GitHub auth failed → Stop, suggest `gh auth login`
- No project-specific triage context → Continue with generic guidance

**Processing errors:**
- Can't locate code → Form broader hypotheses, may need handler input
- All hypotheses disproven after 2 rounds → Reassess fundamentals, ask for clarification
- Reproduction test can't be written → Note in triage conclusion, flag for discussion

## Tips

**For complex issues:**
- May take multiple rounds of hypothesis testing
- Don't skip the evidence — always run tests to confirm/disprove hypotheses

**For documentation issues:**
- Triage still applies — identify what's wrong, where it is, how to verify the fix

**Branch creation:**
- If no branch exists, triage will suggest creating one when test artifacts are needed
- Suggest branch name: `fix/<issue#>-short-description`

## Next Steps After Triage

1. Review the root cause and test acceptance criteria
2. Run `/fix <issue#>` for straightforward fixes
3. Run `/write-plan <issue#>` for complex fixes requiring design decisions
4. Create feature branch if not already on one
