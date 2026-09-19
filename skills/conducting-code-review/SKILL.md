---
name: conducting-code-review
description: Use when asked to review someone else's code or PR — provides a structured evaluation process that produces specific, actionable feedback categorized by severity
---

# Conducting Code Review

## Overview

Code review is a technical act, not a social one. Your job is to find real problems and give the author the information they need to fix them — not to perform thoroughness or soften every critique.

**Core principle:** Be specific, be honest, give a clear verdict.

## When to Conduct a Review

- You are asked to review a PR or branch
- A subagent requests a `superpowers:code-reviewer` review
- You are doing a self-review before requesting human sign-off

## The Review Process

```
1. ORIENT    — Understand what the change is trying to do
2. READ DIFF — Examine every changed file
3. VERIFY    — Check against requirements, tests, and existing code
4. CATEGORIZE — Sort findings by severity (Critical / Important / Minor)
5. REPORT    — Deliver specific, file:line findings with clear verdicts
```

### Step 1: Orient

Before reading code, understand intent:

```bash
# For a PR:
gh pr view <number> --json title,body,additions,deletions,changedFiles

# For a git range:
git log --oneline {BASE_SHA}..{HEAD_SHA}
git diff --stat {BASE_SHA}..{HEAD_SHA}
```

Ask: What problem does this solve? What should it NOT change?

### Step 2: Read the diff

```bash
# PR diff:
gh pr diff <number>

# Git range:
git diff {BASE_SHA}..{HEAD_SHA}
```

Read every changed line. Do not skim.

### Step 3: Verify

**For code changes:**
- [ ] Does it do what the description claims?
- [ ] Are tests present and testing behaviour, not mocks?
- [ ] Does it handle edge cases (null, empty, concurrent, large input)?
- [ ] Are there security risks at trust boundaries (user input, fetched URLs, external data)?
- [ ] Does it follow the existing patterns in this codebase?
- [ ] YAGNI: does it add anything not required right now?

**For skill/prompt changes (markdown instructions for agents):**
- [ ] Are instructions unambiguous? Could an agent misinterpret them?
- [ ] Do step numbers align with adjacent skills that reference them?
- [ ] Is the scope appropriate — minimum change to solve the problem?
- [ ] Does it match the frontmatter format, step structure, checkbox style?
- [ ] Does it expand trust boundaries (e.g., passing fetched content to tools without validation)?

### Step 4: Categorize findings

| Severity | Criteria |
|----------|----------|
| **Critical** | Bugs, data loss, security issues, broken functionality — block merge |
| **Important** | Missing requirements, poor error handling, test gaps, architectural problems |
| **Minor** | Style, naming, optimization, docs — address when convenient |

Do not inflate severity. A naming inconsistency is never Critical.

### Step 5: Report

Use this format:

```
### Strengths
[Specific things done well — at least one if any exist]

### Issues

#### Critical
[file:line — what's wrong — why it matters — how to fix]

#### Important
[file:line — what's wrong — why it matters — how to fix]

#### Minor
[file:line — what's wrong]

### Assessment
**Ready to merge?** Yes / No / With fixes
**Reasoning:** [One or two sentences. Be direct.]
```

## Forbidden Reviewer Behaviors

**NEVER:**
- "Looks good to me!" without checking every changed line
- Flag something as Critical because it feels wrong (show why it breaks things)
- Give vague feedback: "improve error handling", "add more tests"
- Skip the verdict — every review must say whether it's mergeable

**INSTEAD:**
- "auth.ts:42 — token compared with `==` not `===`, allows type coercion bypass"
- "Missing test for empty input to `parseConfig()` — currently throws uncaught TypeError"
- "Ready to merge with fixes: items 1 and 2 above"

## Giving Feedback on Prompt/Skill PRs

Skills in this repo are instructions that agents follow literally. Ambiguity is a bug.

**Ask for each changed instruction:**
- Could an agent interpret this in two different ways?
- Is the condition for triggering this step clear?
- Does the example match the rule?

**Scope check:** If a PR adds more than 200 lines to a skill, ask whether the additions solve a documented problem or are speculative. Reference YAGNI explicitly.

## Example Review

```
## Review: feat/add-retry-logic

### Strengths
- Exponential backoff is correctly implemented (retrier.ts:18-34)
- Tests cover the 3xx, 4xx, and 5xx cases separately

### Issues

#### Critical
1. **Infinite retry on 429**
   retrier.ts:45 — status 429 is not excluded from retry loop.
   A rate-limited API will be hammered until the process crashes.
   Fix: Add `if (status === 429) throw new RateLimitError(response)`

#### Important
2. **No timeout cap on backoff**
   retrier.ts:22 — `delay = base * 2^attempt` with no maximum.
   Attempt 20 = 6 days of waiting.
   Fix: `delay = Math.min(base * 2 ** attempt, MAX_DELAY_MS)`

#### Minor
3. retrier.ts:10 — `MAX_RETRIES` is hardcoded; could be a constructor param.

### Assessment
**Ready to merge: No**
**Reasoning:** The 429 infinite retry is a production reliability bug that will cause outages against any rate-limited API. Fix Critical + Important before merge.
```

## Integration with Workflows

**Subagent-driven development:**
- You may be dispatched as a `superpowers:code-reviewer` subagent
- Use the template at `requesting-code-review/code-reviewer.md`
- Return findings in the format above; the calling agent will fix Critical and Important issues

**Human review of PRs:**
- Fetch all three GitHub comment types before responding:
  ```
  gh api repos/{owner}/{repo}/pulls/{pr}/comments   # inline comments
  gh api repos/{owner}/{repo}/pulls/{pr}/reviews     # review bodies
  gh api repos/{owner}/{repo}/issues/{pr}/comments   # top-level discussion
  ```
- Post your review with `gh pr review <number> --comment --body "<review>"`
  or `--approve` / `--request-changes` as appropriate
