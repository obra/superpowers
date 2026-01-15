---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

## Overview

**Writing skills IS Test-Driven Development applied to process documentation.**

Write test cases (pressure scenarios with subagents), watch them fail (baseline behavior), write the skill (documentation), watch tests pass (agents comply), and refactor (close loopholes).

**Core principle:** If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.

**Personal skills live in agent-specific directories** (`~/.claude/skills` for Claude Code, `~/.codex/skills` for Codex)

<requirements>
## Requirements

1. Follow TDD: baseline test -> write skill -> verify compliance.
2. Description format: "Use when..." only - no workflow summary.
3. Gates follow shared-patterns.md format.
</requirements>

**Background:** Understand hyperpowers:test-driven-development before using this skill - it defines the RED-GREEN-REFACTOR cycle. For Anthropic's official skill authoring guidance, see anthropic-best-practices.md.

## What is a Skill?

A **skill** is a reference guide for proven techniques, patterns, or tools.

**Skills are:** Reusable techniques, patterns, tools, reference guides
**Skills are NOT:** Narratives about how you solved a problem once

| Skill Type | Description | Example |
|------------|-------------|---------|
| Technique | Concrete method with steps | condition-based-waiting |
| Pattern | Mental model for problems | flatten-with-flags |
| Reference | API docs, syntax guides | office docs |

## TDD Mapping for Skills

| TDD Concept | Skill Creation |
|-------------|----------------|
| Test case | Pressure scenario with subagent |
| Test fails (RED) | Agent violates rule without skill |
| Test passes (GREEN) | Agent complies with skill present |
| Refactor | Close loopholes while maintaining compliance |

## When to Create a Skill

**Create when:**
- Technique wasn't intuitively obvious
- Pattern applies broadly (not project-specific)
- Others would benefit

**Don't create for:**
- One-off solutions
- Project-specific conventions (put in CLAUDE.md)
- Mechanical constraints (automate with regex/validation instead)

## Directory Structure

```
skills/
  skill-name/
    SKILL.md              # Main reference (required)
    supporting-file.*     # Only if needed
```

**Flat namespace** - all skills in one searchable namespace

**Separate files for:** Heavy reference (100+ lines), reusable tools
**Keep inline:** Principles, code patterns (< 50 lines), everything else

## SKILL.md Structure

### Frontmatter (YAML)

```yaml
---
name: Skill-Name-With-Hyphens
description: Use when [specific triggering conditions and symptoms]
---
```

- Only two fields: `name` and `description`
- Max 1024 characters total
- `name`: Letters, numbers, hyphens only
- `description`: Third-person, starts with "Use when...", describes ONLY triggering conditions

### allowed-tools Field

Use to restrict tools during a skill:

```yaml
---
name: research-skill
description: Use when gathering information before implementation
allowed-tools: Read, Grep, Glob, WebSearch, WebFetch, Task
---
```

**Use for:** Read-only phases, verification phases, security-sensitive workflows
**Don't use for:** Implementation skills, debugging skills

### Body Structure

```markdown
# Skill Name

## Overview
Core principle in 1-2 sentences.

## When to Use
Symptoms and use cases. When NOT to use.

## Core Pattern
Before/after comparison (for techniques/patterns)

## Quick Reference
Table for scanning common operations

## Common Mistakes
What goes wrong + fixes
```

## Claude Search Optimization (CSO)

The description is HOW Claude discovers your skill. Make it answer: "Should I read this skill right now?"

### Description Rules

1. **"Use when..." format** - focus on triggering conditions
2. **NO workflow summaries** - Claude follows description, not content
3. **Include natural keywords** - words users would actually say

**Why no workflow in description:** Testing revealed that when a description summarizes workflow, Claude may follow the description instead of reading the full skill content. Descriptions that just state triggering conditions force Claude to read the actual skill.

```yaml
# BAD: Summarizes workflow - Claude may follow this instead of reading skill
description: Use when executing plans - dispatches subagent per task with code review

# GOOD: Just triggering conditions
description: Use when executing implementation plans with independent tasks
```

### Keywords

Use words Claude would search for:
- Error messages: "Hook timed out", "race condition"
- Symptoms: "flaky", "hanging", "zombie"
- Synonyms: "timeout/hang/freeze"

### Naming

**Use active voice, verb-first:**
- `creating-skills` not `skill-creation`
- `condition-based-waiting` not `async-test-helpers`

### Token Efficiency

Getting-started and frequently-referenced skills load into EVERY conversation.

**Target word counts:**
- Getting-started workflows: <150 words
- Frequently-loaded skills: <200 words
- Other skills: <500 words

**Techniques:**
- Move details to `--help`
- Use cross-references instead of repeating
- One example per pattern

### Cross-Referencing Skills

Use skill name only, with explicit markers:
- Good: `**Background:** hyperpowers:test-driven-development`
- Bad: `@skills/test-driven-development/SKILL.md` (force-loads, burns context)

## Flowcharts

**Use flowcharts ONLY for:**
- Non-obvious decision points
- Process loops where you might stop too early

**Never use for:** Reference material, code examples, linear instructions

See @graphviz-conventions.dot for style rules. Use `render-graphs.js` to render flowcharts to SVG.

## Code Examples

**One excellent example beats many mediocre ones**

Choose most relevant language. Make it complete, well-commented, from real scenario.

**Don't:** Implement in 5+ languages, create generic templates

## Proven Reinforcement Patterns

See `shared-patterns.md` for the 7 validated pattern definitions:
1. Gate Structure Pattern
2. Red Flags Table Pattern
3. Self-Check Question Pattern
4. Handoff Consumption Pattern
5. Counter-Rationalization Pattern
6. Evidence Requirements Pattern
7. Beginning-End Anchoring Pattern

Reference these patterns when writing discipline-enforcing skills.

## The Iron Law

```
NO SKILL WITHOUT A FAILING TEST FIRST
```

This applies to NEW skills AND EDITS to existing skills.

Write skill before testing? Delete it. Start over.
Edit skill without testing? Same violation.

**No exceptions:**
- Not for "simple additions"
- Not for "documentation updates"
- Don't keep untested changes as "reference"
- Delete means delete

## Testing All Skill Types

| Skill Type | Test With | Success Criteria |
|------------|-----------|------------------|
| Discipline-Enforcing | Pressure scenarios, combined pressures | Follows rule under maximum pressure |
| Technique | Application scenarios, edge cases | Applies technique correctly |
| Pattern | Recognition scenarios, counter-examples | Correctly identifies when to apply |
| Reference | Retrieval scenarios, gap testing | Finds and applies information |

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Skill is obviously clear" | Clear to you does not mean clear to agents. Test it. |
| "It's just a reference" | References have gaps. Test retrieval. |
| "Testing is overkill" | 15 min testing saves hours debugging. |
| "I'll test if problems emerge" | Test BEFORE deploying. |

## RED-GREEN-REFACTOR for Skills

### RED: Write Failing Test (Baseline)

Run pressure scenario WITHOUT the skill. Document:
- What choices did they make?
- What rationalizations did they use (verbatim)?

### GREEN: Write Minimal Skill

Write skill addressing specific rationalizations. Run scenarios WITH skill - agent should comply.

### REFACTOR: Close Loopholes

Agent found new rationalization? Add explicit counter. Re-test until bulletproof.

See @testing-skills-with-subagents.md for complete testing methodology.

<verification>
## TDD Phase Verification

**RED Phase Gate** (Required):

- [ ] Pressure scenarios created (3+ for discipline skills)
- [ ] Scenarios run WITHOUT skill
- [ ] Baseline behavior documented verbatim

**STOP CONDITION:** If writing skill without baseline test, STOP. Run baseline first.

**GREEN Phase Gate** (Required):

- [ ] Skill addresses specific baseline failures
- [ ] Scenarios run WITH skill
- [ ] Agents now comply

**STOP CONDITION:** If skill written without compliance test, STOP. Test it.

**REFACTOR Phase Gate** (Required):

- [ ] New rationalizations identified
- [ ] Explicit counters added
- [ ] Proven patterns applied (see shared-patterns.md)

**STOP CONDITION:** If deploying without REFACTOR phase, STOP. Close loopholes.
</verification>

## Anti-Patterns

| Anti-Pattern | Why Bad |
|--------------|---------|
| Narrative example | Too specific, not reusable |
| Multi-language dilution | Mediocre quality, maintenance burden |
| Code in flowcharts | Can't copy-paste |
| Generic labels (helper1, step2) | Labels need semantic meaning |

## Before Moving to Next Skill

After writing ANY skill, complete the deployment process.

**Do NOT:**
- Create multiple skills in batch without testing each
- Move to next skill before current one is verified

Deploying untested skills = deploying untested code.

## Skill Creation Checklist

Use TodoWrite to create todos for each phase.

**RED Phase:**
- [ ] Create pressure scenarios
- [ ] Run scenarios WITHOUT skill
- [ ] Document baseline behavior verbatim

**GREEN Phase:**
- [ ] Name uses letters, numbers, hyphens only
- [ ] YAML frontmatter with name and description
- [ ] Description starts with "Use when..."
- [ ] Address specific baseline failures
- [ ] Run scenarios WITH skill

**REFACTOR Phase:**
- [ ] Identify new rationalizations
- [ ] Add explicit counters
- [ ] Apply proven patterns from shared-patterns.md
- [ ] Re-test until bulletproof

**Deployment:**
- [ ] Commit and push
- [ ] Consider PR if broadly useful

<requirements>
## Requirements (reminder)

1. Follow TDD: baseline test -> write skill -> verify compliance.
2. Description format: "Use when..." only - no workflow summary.
3. Gates follow shared-patterns.md format.
</requirements>

## The Bottom Line

**Creating skills IS TDD for process documentation.**

Same Iron Law: No skill without failing test first.
Same cycle: RED (baseline) -> GREEN (write skill) -> REFACTOR (close loopholes).

If you follow TDD for code, follow it for skills.
