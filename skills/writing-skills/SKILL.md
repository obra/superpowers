---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

## Overview

**Writing skills IS Test-Driven Development applied to process documentation.**

**Personal skills live in agent-specific directories (`~/.claude/skills` for Claude Code, `~/.codex/skills` for Codex)**

You write test cases (pressure scenarios with subagents), watch them fail (baseline behavior), write the skill (documentation), watch tests pass (agents comply), and refactor (close loopholes).

**Core principle:** If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.

**REQUIRED BACKGROUND:** You MUST understand superpowers:test-driven-development before using this skill.

**Reference material:** For detailed guidance on CSO techniques, flowcharts, testing patterns, bulletproofing, and anti-patterns, see SKILL_AUTHORING_DETAILS.md. For Anthropic's official best practices, see anthropic-best-practices.md.

## What is a Skill?

A **skill** is a reference guide for proven techniques, patterns, or tools.

**Skills are:** Reusable techniques, patterns, tools, reference guides
**Skills are NOT:** Narratives about how you solved a problem once

## TDD Mapping for Skills

| TDD Concept | Skill Creation |
|-------------|----------------|
| **Test case** | Pressure scenario with subagent |
| **Production code** | Skill document (SKILL.md) |
| **Test fails (RED)** | Agent violates rule without skill (baseline) |
| **Test passes (GREEN)** | Agent complies with skill present |
| **Refactor** | Close loopholes while maintaining compliance |

## When to Create a Skill

**Create when:**
- Technique wasn't intuitively obvious to you
- You'd reference this again across projects
- Pattern applies broadly (not project-specific)
- Others would benefit

**Don't create for:**
- One-off solutions
- Standard practices well-documented elsewhere
- Project-specific conventions (put in CLAUDE.md)
- Mechanical constraints (if enforceable with regex/validation, automate it)

## Skill Types

| Type | Description | Examples |
|------|-------------|----------|
| **Technique** | Concrete method with steps | condition-based-waiting, root-cause-tracing |
| **Pattern** | Way of thinking about problems | flatten-with-flags, test-invariants |
| **Reference** | API docs, syntax guides | office docs, library references |

## Directory Structure

```
skills/
  skill-name/
    SKILL.md              # Main reference (required)
    supporting-file.*     # Only if needed
```

**Flat namespace** - all skills in one searchable namespace
**Separate files for:** heavy reference (100+ lines), reusable tools
**Keep inline:** principles, concepts, code patterns (< 50 lines)

## SKILL.md Structure

**Frontmatter (YAML):**
- Only two fields: `name` and `description` (max 1024 chars total)
- `name`: letters, numbers, hyphens only
- `description`: Third-person, describes ONLY when to use (NOT what it does)

```markdown
---
name: Skill-Name-With-Hyphens
description: Use when [specific triggering conditions and symptoms]
---

# Skill Name

## Overview
Core principle in 1-2 sentences.

## When to Use
Bullet list with SYMPTOMS and use cases. When NOT to use.

## Core Pattern
Before/after code comparison

## Quick Reference
Table or bullets for scanning

## Common Mistakes
What goes wrong + fixes
```

## Claude Search Optimization (CSO)

**Critical for discovery:** Future Claude needs to FIND your skill

### Description Field

**CRITICAL: Description = When to Use, NOT What the Skill Does**

The description should ONLY describe triggering conditions. Do NOT summarize the skill's workflow.

**Why:** Testing revealed that when descriptions summarize workflow, Claude follows the description instead of reading the full skill content.

```yaml
# ❌ BAD: Summarizes workflow
description: Use when executing plans - dispatches subagent per task with code review

# ✅ GOOD: Just triggering conditions
description: Use when executing implementation plans with independent tasks
```

**Content:**
- Use concrete triggers, symptoms, and situations
- Describe the *problem* not *language-specific symptoms*
- Write in third person
- **NEVER summarize the skill's process or workflow**

For detailed CSO techniques (keyword coverage, token efficiency, cross-referencing), see SKILL_AUTHORING_DETAILS.md.

## The Iron Law

```
NO SKILL WITHOUT A FAILING TEST FIRST
```

This applies to NEW skills AND EDITS to existing skills.

Write skill before testing? Delete it. Start over.

**No exceptions:**
- Not for "simple additions"
- Not for "documentation updates"
- Don't keep untested changes as "reference"
- Delete means delete

## RED-GREEN-REFACTOR for Skills

### RED: Write Failing Test (Baseline)

Run pressure scenario with subagent WITHOUT the skill. Document:
- What choices did they make?
- What rationalizations did they use (verbatim)?
- Which pressures triggered violations?

### GREEN: Write Minimal Skill

Write skill addressing those specific rationalizations. Don't add content for hypothetical cases.

Run same scenarios WITH skill. Agent should now comply.

### REFACTOR: Close Loopholes

Agent found new rationalization? Add explicit counter. Re-test until bulletproof.

**Testing methodology:** See testing-skills-with-subagents.md for pressure scenarios, pressure types, and meta-testing techniques.

For detailed guidance on testing different skill types and bulletproofing against rationalization, see SKILL_AUTHORING_DETAILS.md.

## STOP: Before Moving to Next Skill

**After writing ANY skill, you MUST STOP and complete the deployment process.**

**Do NOT:**
- Create multiple skills in batch without testing each
- Move to next skill before current one is verified
- Skip testing because "batching is more efficient"

Deploying untested skills = deploying untested code.

## Skill Creation Checklist

**RED Phase:**
- [ ] Create pressure scenarios (3+ combined pressures for discipline skills)
- [ ] Run scenarios WITHOUT skill - document baseline behavior
- [ ] Identify patterns in rationalizations/failures

**GREEN Phase:**
- [ ] Name uses only letters, numbers, hyphens
- [ ] YAML frontmatter with name and description (max 1024 chars)
- [ ] Description starts with "Use when..." - no workflow summary
- [ ] Keywords throughout for search
- [ ] Address specific baseline failures identified in RED
- [ ] One excellent example (not multi-language)
- [ ] Run scenarios WITH skill - verify compliance

**REFACTOR Phase:**
- [ ] Identify NEW rationalizations from testing
- [ ] Add explicit counters (if discipline skill)
- [ ] Re-test until bulletproof

**Quality Checks:**
- [ ] Flowchart only if decision non-obvious
- [ ] Quick reference table
- [ ] Common mistakes section
- [ ] No narrative storytelling

**Deployment:**
- [ ] Commit and push
- [ ] Consider contributing back via PR

## Discovery Workflow

How future Claude finds your skill:

1. **Encounters problem** ("tests are flaky")
2. **Finds SKILL** (description matches)
3. **Scans overview** (is this relevant?)
4. **Reads patterns** (quick reference table)
5. **Loads example** (only when implementing)

**Optimize for this flow** - put searchable terms early and often.

## The Bottom Line

**Creating skills IS TDD for process documentation.**

Same Iron Law: No skill without failing test first.
Same cycle: RED → GREEN → REFACTOR.
Same benefits: Better quality, fewer surprises, bulletproof results.
