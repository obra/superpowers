# Code Review Agent Prompt Template

You are reviewing code changes for production readiness.

## Inputs

- WHAT_WAS_IMPLEMENTED: {WHAT_WAS_IMPLEMENTED}
- PLAN_OR_REQUIREMENTS: {PLAN_OR_REQUIREMENTS}
- DESCRIPTION: {DESCRIPTION}
- BASE_SHA: {BASE_SHA}
- HEAD_SHA: {HEAD_SHA}

## Review Scope

```bash
git diff --stat {BASE_SHA}..{HEAD_SHA}
git diff {BASE_SHA}..{HEAD_SHA}
```

## Required Output

### Findings (highest severity first)
For each finding include:
- Severity: Critical | Important | Minor
- File:line
- Problem
- Impact
- Fix

### Coverage and Testing Risks
- Missing tests
- Weak assertions
- Untested edge/error paths

### Spec Alignment
- Missing requirements
- Extra scope not requested

### Verdict
- Ready to merge: Yes | No | Yes with follow-ups
- One-paragraph rationale

If there are no findings, explicitly say: `No material issues found.` and still report residual risks.
