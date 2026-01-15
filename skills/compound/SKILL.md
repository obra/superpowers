---
name: compound
description: Use when a non-trivial problem has been solved, when phrases like "that worked" or "it's fixed" appear after debugging, or when the user invokes /hyperpowers:compound
allowed-tools: Read, Grep, Glob, Write
---

# Compound Skill (Knowledge Capture)

**Announce at start:** "I'm using the compound skill to capture this solution for future reference."

## Overview

Captures solutions from debugging sessions into a searchable knowledge base. Auto-triggers on resolution phrases for non-trivial problems. Prevents re-investigation of solved issues.

<requirements>
## Requirements

1. Only capture non-trivial solutions. Trivial fixes pollute the knowledge base and make it harder to find real solutions.
2. Include root cause explanation. Solutions without context don't teach - future readers need to understand why, not just what.
3. Document failed attempts. What didn't work is valuable for future debugging and prevents others from repeating mistakes.
</requirements>

## When to Use

**Auto-detection triggers** (proactively use this skill when you see):
- "that worked"
- "it's fixed"
- "working now"
- "problem solved"
- "finally got it"

**Plus** the problem was non-trivial:
- Investigation took multiple attempts
- Touched multiple files
- Required debugging or research
- Had back-and-forth before solution

**Manual invocation:** User says `/hyperpowers:compound`

## When NOT to Use

Do NOT capture if:
- Fix was trivial (typo, missing import, obvious error)
- Solution is already documented in `docs/solutions/`
- Problem was user error, not a real issue

## The Process

### Step 1: Assess Triviality

Before capturing, verify the problem was non-trivial. Check:
- Did investigation take more than a few minutes?
- Were multiple approaches tried before success?
- Did the fix touch multiple files or require research?

If trivial: Stay silent. Do not announce or capture.

### Step 2: Identify Category

Categorize the issue into one of 9 categories:

| Category | Use When |
|----------|----------|
| `build-errors` | Compilation, bundling, dependency resolution |
| `test-failures` | Test failures, flaky tests, test infrastructure |
| `runtime-errors` | Exceptions, crashes, runtime failures |
| `performance-issues` | Slow code, memory leaks, N+1 queries |
| `database-issues` | Queries, migrations, connections, data integrity |
| `security-issues` | Auth, permissions, vulnerabilities |
| `ui-bugs` | Display, interaction, styling issues |
| `integration-issues` | API, third-party services, cross-system |
| `logic-errors` | Incorrect behavior, wrong output, edge cases |

### Step 3: Create Solution Document

Write to `docs/solutions/{category}/{descriptive-name}-YYYY-MM-DD.md`:

```markdown
# [Searchable Title - Include Error Message or Symptom]

> Created: YYYY-MM-DD
> Category: [category]

## Symptoms
- [Exact error messages - quote them]
- [Observable behavior that indicated the problem]
- [Conditions when the problem occurred]

## Failed Attempts
- [What was tried first and why it didn't work]
- [Other approaches that didn't solve it]

## Root Cause
[Technical explanation of why the problem occurred]

## Solution
[Step-by-step fix]

```code
[Working code example if applicable]
```

## Prevention
- [How to avoid this in the future]
- [What to check for similar issues]

## Environment
- [Relevant versions, OS, configuration]

## Related
- [Links to similar issues if they exist]
```

### Step 4: Check for Patterns

After saving, check if 3+ solutions exist in the same category with similar symptoms:

```bash
ls docs/solutions/{category}/ | wc -l
```

If pattern detected (3+ similar issues):
- Note it to the user: "This is the Nth [category] issue with similar symptoms. Consider adding a lint rule or architectural review."

### Step 5: Announce Completion

"Solution captured to `docs/solutions/{category}/{filename}.md`. This will help if similar issues arise."

## Quick Reference

| Step | Action |
|------|--------|
| 1 | Assess triviality (silent if trivial) |
| 2 | Identify category |
| 3 | Write solution document |
| 4 | Check for patterns (alert if 3+) |
| 5 | Announce completion |

## Solution Categories

```
docs/solutions/
├── build-errors/
├── test-failures/
├── runtime-errors/
├── performance-issues/
├── database-issues/
├── security-issues/
├── ui-bugs/
├── integration-issues/
└── logic-errors/
```

## Red Flags - STOP

- Capturing trivial fixes (typos, obvious errors)
- Not including exact error messages in symptoms
- Writing vague solutions without steps
- Skipping the "Failed Attempts" section (valuable for future debugging)
- Not checking for pattern detection

<verification>
## Capture Verification

Complete these checks before saving solution document. Saving without verification produces incomplete solutions that fail to help future debugging.

**Solution Quality Gate:**

- [ ] Symptoms include exact error messages (quoted)
- [ ] Failed Attempts section has at least one entry (unless first attempt worked)
- [ ] Root Cause explains WHY (not just what)
- [ ] Solution has step-by-step instructions
- [ ] Prevention section has actionable items

If any checkbox is unchecked, complete missing section(s) before saving. Incomplete solutions waste the reader's time.

**Pattern Detection Gate (after saving):**

- [ ] Ran `ls docs/solutions/{category}/ | wc -l`
- [ ] If 3+, noted pattern to user

Skipping pattern detection misses opportunities to address systemic issues.
</verification>

## Integration

**With systematic-debugging:** After debugging completes, compound skill captures the solution.

**With code review:** Reviewers can reference solutions: "See `docs/solutions/performance-issues/n-plus-one-2026-01-08.md`"

<requirements>
## Requirements Reminder

Before completing, verify:
1. Only non-trivial solutions are captured
2. Root cause is explained (why, not just what)
3. Failed attempts are documented
</requirements>
