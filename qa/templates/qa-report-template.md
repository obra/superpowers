# QA Report: {APP_NAME}

| Field | Value |
|-------|-------|
| **Date** | {DATE} |
| **URL** | {URL} |
| **Branch** | {BRANCH} |
| **Commit** | {COMMIT_SHA} |
| **Tier** | Quick / Standard / Exhaustive |
| **Mode** | diff-aware / full / quick / regression |
| **Scope** | {SCOPE} |
| **Duration** | {DURATION} |
| **Pages visited** | {COUNT} |
| **Screenshots** | {COUNT} |
| **Framework** | {DETECTED or Unknown} |

## Health Score: {SCORE}/100

| Category | Score |
|----------|-------|
| Console | {0-100} |
| Links | {0-100} |
| Visual | {0-100} |
| Functional | {0-100} |
| UX | {0-100} |
| Performance | {0-100} |
| Accessibility | {0-100} |

## Top 3 Things to Fix

1. **{ISSUE-NNN}: {title}** — {one-line description}
2. **{ISSUE-NNN}: {title}** — {one-line description}
3. **{ISSUE-NNN}: {title}** — {one-line description}

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total** | **0** |

## Console Health

| Error | Count | First Seen |
|-------|-------|------------|
| {error message} | {N} | {URL} |

## Issues

### ISSUE-001: {Short title}

| Field | Value |
|-------|-------|
| **Severity** | critical / high / medium / low |
| **Category** | visual / functional / ux / content / performance / console / accessibility |
| **URL** | {page URL} |

**Description:** {What is wrong. Expected vs actual.}

**Repro Steps:**

1. Navigate to {URL}
2. Perform {action}
3. Observe {result}

**Evidence:** {screenshots, console snippet, or note}

## Ship Readiness

| Metric | Value |
|--------|-------|
| Health score | {SCORE} |
| Issues found | {N} |
| Deferred | {N} |

**PR Summary:** `QA found N issues, fixed 0, health score X.`

## Regression (if applicable)

| Metric | Baseline | Current | Delta |
|--------|----------|---------|-------|
| Health score | {N} | {N} | {+/-N} |
| Issues | {N} | {N} | {+/-N} |
