---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements - uses invoking-similar-agents to discover and dispatch all code-reviewer agents in parallel, then synthesizes their findings
---

# Requesting Code Review

Dispatch code-reviewer subagent(s) to catch issues before they cascade.

**Core principle:** Review early, review often. Uses invoking-similar-agents skill for comprehensive coverage.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Use invoking-similar-agents skill:**

This skill automatically:
- Discovers all code-reviewer agents (built-in, superpowers, custom)
- Dispatches them in parallel with the same context
- Synthesizes findings with consensus validation

**Agent discovery methods:**
- Direct filesystem search of custom agents: `~/.claude/agents/**/code*review*.md`
- Superpowers templates: `requesting-code-review/code-reviewer.md`
- Built-in agents from Claude Code system prompt
- Optional: Agent Registry (if available) for faster lookup

**3. Prepare context for agents:**

All discovered agents receive the same context:
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit
- `{DESCRIPTION}` - Brief summary

**4. Review synthesis (automatic):**

The invoking-similar-agents skill handles:
- **Consensus issues**: Found by 2+ agents (HIGH PRIORITY)
- **Unique findings**: Found by single agent (evaluate by expertise)
- **Contradictions**: Where agents disagree (investigate trade-offs)
- **Positive highlights**: What multiple agents praised

**5. Act on synthesized feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Example: Single Reviewer

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Example: Multiple Reviewers

```
[Just completed Task 3: Implement authentication]

You: Let me request code review. I have both custom and superpowers reviewers available.

BASE_SHA=$(git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch BOTH reviewers in parallel]:
  - code-reviewer (custom agent)
  - superpowers template (filled with context)

[Custom code-reviewer returns]:
  🔴 Critical: Plain-text API key in auth.js:42
  🟡 Major: Missing rate limiting
  🟢 Minor: Improve variable naming
  Assessment: Major Issues - needs security fixes

[Superpowers reviewer returns]:
  Strengths: Good test coverage, clean error handling
  Issues:
    Critical: Credentials not encrypted
    Important: No help text in CLI
  Assessment: With fixes

You: Synthesizing reviews...
  CONSENSUS (HIGH PRIORITY):
    - Both found: Unencrypted credentials (auth.js:42)

  UNIQUE FINDINGS:
    - Custom: Rate limiting missing
    - Superpowers: No CLI help text

  Action: Fix credential encryption immediately, then address rate limiting and help text.

[Fix all critical/important issues]
[Continue to Task 4]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each batch (3 tasks)
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

## Benefits of Multiple Reviewers

**Why use invoking-similar-agents:**
- **Automatic discovery**: No manual tracking of which agents exist
- **Diverse perspectives**: Custom agents (project-specific) + built-in (general practices)
- **Comprehensive coverage**: Different agents catch different issues
- **Consensus validation**: Issues found by multiple agents are high-confidence
- **Reduced blind spots**: One agent's weakness is another's strength

**When to use single vs multiple:**
- **Single**: Quick reviews, small changes, time-constrained (skip invoking-similar-agents)
- **Multiple**: Major features, security-critical code, before merge to main (use invoking-similar-agents)

See also:
- invoking-similar-agents skill (generic multi-agent pattern)
- Template at: requesting-code-review/code-reviewer.md
