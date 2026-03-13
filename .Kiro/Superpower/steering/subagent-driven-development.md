---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
inclusion: always
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with two-stage review after each: spec compliance review first, then code quality review.

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration

## When to Use

- Have implementation plan with mostly independent tasks
- Want to stay in current session (vs parallel session)
- Need fast iteration with quality gates

**vs. Manual execution:**
- Subagents follow TDD naturally
- Fresh context per task (no confusion)
- Can ask questions before AND during work

## The Process

1. **Read plan, extract all tasks** with full text, note context
2. **For each task:**
   - Dispatch implementer subagent with full task text + context
   - Answer any questions they have
   - Let them implement, test, commit, self-review
   - Dispatch spec reviewer subagent to confirm code matches spec
   - If spec issues found, implementer fixes them
   - Dispatch code quality reviewer subagent
   - If quality issues found, implementer fixes them
   - Mark task complete
3. **After all tasks:** Final code review of entire implementation

## Two-Stage Review Process

**Stage 1: Spec Compliance Review**
- Does code match the specification exactly?
- Are all requirements implemented?
- Is anything extra added that wasn't requested?
- Must pass before code quality review

**Stage 2: Code Quality Review**
- Is code well-structured and maintainable?
- Are there any bugs or edge cases missed?
- Does it follow best practices?
- Are tests comprehensive?

## Advantages

**Quality gates:**
- Self-review catches issues before handoff
- Two-stage review: spec compliance, then code quality
- Review loops ensure fixes actually work
- Spec compliance prevents over/under-building
- Code quality ensures implementation is well-built

**Efficiency gains:**
- No file reading overhead (controller provides full text)
- Controller curates exactly what context is needed
- Subagent gets complete information upfront
- Questions surfaced before work begins (not after)

## Red Flags - Never Do These

- Skip reviews (spec compliance OR code quality)
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Ignore subagent questions (answer before letting them proceed)
- Accept "close enough" on spec compliance
- Skip review loops (reviewer found issues = implementer fixes = review again)
- Start code quality review before spec compliance is approved
- Move to next task while either review has open issues

## Integration with Other Skills

**Required workflow skills:**
- **writing-plans** - Creates the plan this skill executes
- **test-driven-development** - Subagents follow TDD for each task
- **requesting-code-review** - Code review template for reviewer subagents