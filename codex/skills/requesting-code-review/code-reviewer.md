# Code Review Prompt Template

You are reviewing code changes for production readiness.

## Task

Review `{WHAT_WAS_IMPLEMENTED}` against `{PLAN_OR_REQUIREMENTS}`.

## What Was Implemented

{DESCRIPTION}

## Requirements Or Plan

{PLAN_REFERENCE}

## Diff Or Patch

Use the provided diff as the source of truth. If a commit range is available:

```bash
git diff --stat {BASE_SHA}..{HEAD_SHA}
git diff {BASE_SHA}..{HEAD_SHA}
```

If patch text is included below, review that patch directly:

```diff
{PATCH_TEXT}
```

## Verification Evidence

{VERIFICATION_COMMANDS_AND_RESULTS}

## Review Checklist

Code quality:
- Clear separation of concerns.
- Appropriate error handling.
- Type safety where applicable.
- Duplication is justified or removed.
- Edge cases are handled.

Architecture:
- Design fits the existing codebase.
- Performance and scalability risks are considered.
- Security and data safety risks are considered.
- Compatibility and migration concerns are handled.

Testing:
- Tests exercise behavior, not just mocks.
- Edge cases and regressions are covered.
- Integration coverage exists where needed.
- Reported checks actually passed.

Requirements:
- All required behavior is implemented.
- No scope creep.
- Breaking changes are documented or avoided.
- Ownership and forbidden-path boundaries are respected.

## Output Format

### Findings

List findings first, ordered by severity.

For each finding include:
- Severity: Critical, Important, or Minor
- File and line
- What is wrong
- Why it matters
- Suggested fix, if not obvious

### Strengths

[Optional. Specific strengths identified after the defect search, if any.]

### Open Questions

[Questions that block approval or affect scope.]

### Verification Notes

[Checks reviewed, checks still needed, or why evidence is insufficient.]

### Final Verdict

End with exactly one final verdict line:

`Verdict: APPROVE`

or

`Verdict: REJECT`

## Review Rules

- Be specific and technical.
- Categorize by actual severity.
- Do not invent findings not supported by the diff.
- Do not approve without inspecting the implementation and verification evidence.
- Do not reject for style-only preferences unless they create maintainability risk.
