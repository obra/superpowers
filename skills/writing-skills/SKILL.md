---
name: writing-skills
description: >
  Use when creating new skills, editing existing skills, or verifying skills
  work before deployment
license: MIT
metadata:
  author: obra
  version: "1.0"
---

# Writing Skills

## Overview

**Writing skills IS Test-Driven Development applied to process documentation.**

**Personal skills live in `~/.claude/skills`.**

You write test cases (pressure scenarios with subagents), watch them fail (baseline behavior), write the skill (documentation), watch tests pass (agents comply), and refactor (close loopholes).

**Core principle:** If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.

**REQUIRED BACKGROUND:** You MUST understand superpowers:test-driven-development before using this skill. That skill defines the fundamental RED-GREEN-REFACTOR cycle. This skill adapts TDD to documentation.

**Official guidance:** For Anthropic's official skill authoring best practices, see anthropic-best-practices.md. This document provides additional patterns and guidelines that complement the TDD-focused approach in this skill.

## What is a Skill?

A **skill** is a reference guide for proven techniques, patterns, or tools. Skills help future Claude instances find and apply effective approaches.

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
| **Write test first** | Run baseline scenario BEFORE writing skill |
| **Watch it fail** | Document exact rationalizations agent uses |
| **Minimal code** | Write skill addressing those specific violations |
| **Watch it pass** | Verify agent now complies |
| **Refactor cycle** | Find new rationalizations → plug → re-verify |

The entire skill creation process follows RED-GREEN-REFACTOR.

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
- Mechanical constraints (if it's enforceable with regex/validation, automate it—save documentation for judgment calls)

## Skill Types

### Technique
Concrete method with steps to follow (condition-based-waiting, root-cause-tracing)

### Pattern
Way of thinking about problems (flatten-with-flags, test-invariants)

### Reference
API docs, syntax guides, tool documentation (office docs)

## Skill ↔ Subagent Patterns (as of Claude Code 2.1.64)

Skills and subagents have two inverse integration patterns. Choose based on who controls the context:

| Pattern | How | When |
|---------|-----|------|
| **Skill loads into subagent** | Subagent frontmatter: `skills: [my-skill]` | Subagent needs domain knowledge at startup |
| **Skill runs in a subagent** | Skill frontmatter: `context: fork` | Skill needs isolation (heavy output, restricted tools) |

### Subagent loads skill (`skills:` in subagent)

The subagent controls its own system prompt. Skill content is injected at startup — the subagent gets the knowledge without needing to discover and load it.

```yaml
# In agents/api-builder.md
---
name: api-builder
description: Build API endpoints following team conventions
skills:
  - api-conventions
  - error-handling-patterns
---
```

### Skill runs in a subagent (`context: fork`)

The skill controls the prompt. Execution happens in an isolated subagent context, keeping verbose output out of the main conversation.

```yaml
# In skills/my-skill/SKILL.md frontmatter
---
name: my-skill
description: Use when running expensive analysis
context: fork
agent: my-custom-agent  # optional, uses default subagent if omitted
---
```

**When NOT to use either pattern:**
- Skill needs frequent back-and-forth with the user → run in main conversation
- Skill is lightweight and shares context with other work → keep inline

## Directory Structure

```
skills/
  skill-name/
    SKILL.md              # Main reference (required, ≤500 lines)
    references/           # Heavy content, progressive disclosure
      detailed-topic.md
      api-reference.md
    scripts/              # Executable tools (optional)
```

**Flat namespace** - all skills in one searchable namespace

**The `references/` convention:** Extract heavy content (100+ lines) into `references/` subdirectory. SKILL.md stays focused on concepts and decision tables; references hold implementation details, API docs, and comprehensive syntax. Link from SKILL.md's References section.

**Self-referencing with `${CLAUDE_SKILL_DIR}`:** Use this variable to reference files within the skill's own directory. It resolves to the skill's absolute path at runtime, making references portable across installations:

```markdown
See [API Reference](${CLAUDE_SKILL_DIR}/references/api-reference.md) for details.
```

**Keep inline in SKILL.md:**
- Principles and concepts
- Code patterns (< 50 lines)
- Decision tables and flowcharts

## SKILL.md Structure

**Frontmatter (YAML):**

Two specs govern skill frontmatter (as of Claude Code 2.1.64). Required fields from the Agent Skills spec, plus optional Claude Code fields:

| Field | Required | Source | Purpose |
|-------|----------|--------|---------|
| `name` | Yes | Agent Skills | Identifier (letters, numbers, hyphens only) |
| `description` | Yes | Agent Skills | When to use (see CSO section) |
| `license` | No | Agent Skills | SPDX identifier (e.g., `MIT`) |
| `metadata` | No | Agent Skills | `author`, `version`, etc. |
| `user-invocable` | No | Claude Code | Whether user can call via `/skill-name` |
| `model` | No | Claude Code | Model override for skill execution |
| `context` | No | Claude Code | Set to `fork` to run in a subagent |
| `agent` | No | Claude Code | Subagent name when `context: fork` |
| `hooks` | No | Claude Code | Lifecycle hooks scoped to skill |
| `argument-hint` | No | Claude Code | Placeholder text for skill arguments |
| `disable-model-invocation` | No | Claude Code | Prevent Claude from auto-invoking |

- Max 1024 characters total for frontmatter
- `description`: Third-person, describes ONLY when to use (NOT what it does)
  - Start with "Use when..." to focus on triggering conditions
  - Include specific symptoms, situations, and contexts
  - **NEVER summarize the skill's process or workflow** (see CSO section for why)
  - Keep under 500 characters if possible

```markdown
---
name: skill-name-with-hyphens
description: Use when [specific triggering conditions and symptoms]
license: MIT
metadata:
  author: your-name
  version: "1.0"
---

# Skill Name

## Overview
What is this? Core principle in 1-2 sentences.

## When to Use
[Small inline flowchart IF decision non-obvious]

Bullet list with SYMPTOMS and use cases
When NOT to use

## Core Pattern (for techniques/patterns)
Before/after code comparison

## Quick Reference
Table or bullets for scanning common operations

## Implementation
Inline code for simple patterns
Link to file for heavy reference or reusable tools

## Common Mistakes
What goes wrong + fixes

## Real-World Impact (optional)
Concrete results
```


## Claude Search Optimization (CSO)

**Critical for discovery:** Future Claude needs to FIND your skill

### 1. Rich Description Field

**Purpose:** Claude reads description to decide which skills to load for a given task. Make it answer: "Should I read this skill right now?"

**Format:** Start with "Use when..." to focus on triggering conditions

**CRITICAL: Description = When to Use, NOT What the Skill Does**

The description should ONLY describe triggering conditions. Do NOT summarize the skill's process or workflow in the description.

**Why this matters:** Testing revealed that when a description summarizes the skill's workflow, Claude may follow the description instead of reading the full skill content. A description saying "code review between tasks" caused Claude to do ONE review, even though the skill's flowchart clearly showed TWO reviews (spec compliance then code quality).

When the description was changed to just "Use when executing implementation plans with independent tasks" (no workflow summary), Claude correctly read the flowchart and followed the two-stage review process.

**The trap:** Descriptions that summarize workflow create a shortcut Claude will take. The skill body becomes documentation Claude skips.

```yaml
# ❌ BAD: Summarizes workflow — Claude follows this instead of reading skill
description: Use when executing plans - dispatches subagent per task with code review between tasks

# ❌ BAD: Too abstract / first person / technology-specific for generic skill
description: For async testing
description: I can help you with async tests when they're flaky
description: Use when tests use setTimeout/sleep and are flaky

# ✅ GOOD: Triggering conditions only, no workflow summary
description: Use when executing implementation plans with independent tasks in the current session
description: Use when tests have race conditions, timing dependencies, or pass/fail inconsistently
```

**Rules:**
- Start with "Use when..." — describe the *problem*, not language-specific symptoms
- Write in third person (injected into system prompt)
- Keep triggers technology-agnostic unless the skill itself is technology-specific
- **NEVER summarize the skill's process or workflow**

### 2. Keyword Coverage

Use words Claude would search for:
- Error messages: "Hook timed out", "ENOTEMPTY", "race condition"
- Symptoms: "flaky", "hanging", "zombie", "pollution"
- Synonyms: "timeout/hang/freeze", "cleanup/teardown/afterEach"
- Tools: Actual commands, library names, file types

### 3. Descriptive Naming

**Use active voice, verb-first:**
- ✅ `creating-skills` not `skill-creation`
- ✅ `condition-based-waiting` not `async-test-helpers`

### 4. Token Efficiency (Critical)

**Problem:** getting-started and frequently-referenced skills load into EVERY conversation. Every token counts.

**Hard limit:** SKILL.md MUST NOT exceed 500 lines. Skills over 500 lines MUST extract content into `references/` subdirectory.

**Target word counts:**
- getting-started workflows: <150 words each
- Frequently-loaded skills: <200 words total
- Other skills: <500 words (still be concise)

**Techniques:**

**Move details to tool help:**
```bash
# ❌ BAD: Document all flags in SKILL.md
search-conversations supports --text, --both, --after DATE, --before DATE, --limit N

# ✅ GOOD: Reference --help
search-conversations supports multiple modes and filters. Run --help for details.
```

**Use cross-references:**
```markdown
# ❌ BAD: Repeat workflow details
When searching, dispatch subagent with template...
[20 lines of repeated instructions]

# ✅ GOOD: Reference other skill
Always use subagents (50-100x context savings). REQUIRED: Use [other-skill-name] for workflow.
```

**Compress examples:**
```markdown
# ❌ BAD: Verbose example (42 words)
User: "How did we handle authentication errors in React Router before?"
You: I'll search past conversations for React Router authentication patterns.
[Dispatch subagent with search query: "React Router authentication error handling 401"]

# ✅ GOOD: Minimal example (20 words)
User: "How did we handle auth errors in React Router?"
You: Searching...
[Dispatch subagent → synthesis]
```

**Eliminate redundancy:**
- Don't repeat what's in cross-referenced skills
- Don't explain what's obvious from command
- Don't include multiple examples of same pattern

**Verification:**
```bash
wc -w skills/path/SKILL.md
# getting-started workflows: aim for <150 each
# Other frequently-loaded: aim for <200 total
```

**Name by what you DO or core insight:**
- ✅ `condition-based-waiting` > `async-test-helpers`
- ✅ `using-skills` not `skill-usage`
- ✅ `flatten-with-flags` > `data-structure-refactoring`
- ✅ `root-cause-tracing` > `debugging-techniques`

**Gerunds (-ing) work well for processes:**
- `creating-skills`, `testing-skills`, `debugging-with-logs`
- Active, describes the action you're taking

### 4. Cross-Referencing Other Skills

**When writing documentation that references other skills:**

Use skill name only, with explicit requirement markers:
- ✅ Good: `**REQUIRED SUB-SKILL:** Use superpowers:test-driven-development`
- ✅ Good: `**REQUIRED BACKGROUND:** You MUST understand superpowers:systematic-debugging`
- ❌ Bad: `See skills/testing/test-driven-development` (unclear if required)
- ❌ Bad: `@skills/testing/test-driven-development/SKILL.md` (force-loads, burns context)

**Why no @ links:** `@` syntax force-loads files immediately, consuming 200k+ context before you need them.

## Code Examples

**One excellent example beats many mediocre ones**

Choose most relevant language:
- Testing techniques → TypeScript/JavaScript
- System debugging → Shell/Python
- Data processing → Python

**Good example:**
- Complete and runnable
- Well-commented explaining WHY
- From real scenario
- Shows pattern clearly
- Ready to adapt (not generic template)

**Don't:**
- Implement in 5+ languages
- Create fill-in-the-blank templates
- Write contrived examples

You're good at porting - one great example is enough.

## File Organization

### Self-Contained Skill
```
defense-in-depth/
  SKILL.md    # Everything inline (<500 lines)
```
When: All content fits, no heavy reference needed

### Skill with References
```
writing-skills/
  SKILL.md              # Concepts + decision tables
  references/           # Progressive disclosure
    flowchart-usage.md
    testing-all-skill-types.md
```
When: Reference material exceeds inline threshold (100+ lines)

### Skill with Tools and References
```
pptx/
  SKILL.md              # Overview + workflows
  references/
    pptxgenjs.md        # 600 lines API reference
    ooxml.md            # 500 lines XML structure
  scripts/              # Executable tools
```
When: Both heavy reference and reusable scripts needed

## The Iron Law (Same as TDD)

```
NO SKILL WITHOUT A FAILING TEST FIRST
```

This applies to NEW skills AND EDITS to existing skills.

Write skill before testing? Delete it. Start over.
Edit skill without testing? Same violation.

**No exceptions:**
- Not for "simple additions"
- Not for "just adding a section"
- Not for "documentation updates"
- Don't keep untested changes as "reference"
- Don't "adapt" while running tests
- Delete means delete

**REQUIRED BACKGROUND:** The superpowers:test-driven-development skill explains why this matters. Same principles apply to documentation.

## Red Flags — STOP and Start Over

Any of these thoughts mean delete code and restart with TDD:

- "Skill is obviously clear" / "Testing is overkill" / "I'm confident it's good"
- "I already manually tested it" / "Academic review is enough"
- "Tests after achieve the same purpose" / "It's about spirit not ritual"
- Code before test, or "This is different because..."

Clear to you ≠ clear to other agents. Reading ≠ using. 15 min testing saves hours. **No exceptions.**

## RED-GREEN-REFACTOR for Skills

Follow the TDD cycle:

### RED: Write Failing Test (Baseline)

Run pressure scenario with subagent WITHOUT the skill. Document exact behavior:
- What choices did they make?
- What rationalizations did they use (verbatim)?
- Which pressures triggered violations?

This is "watch the test fail" - you must see what agents naturally do before writing the skill.

### GREEN: Write Minimal Skill

Write skill that addresses those specific rationalizations. Don't add extra content for hypothetical cases.

Run same scenarios WITH skill. Agent should now comply.

### REFACTOR: Close Loopholes

Agent found new rationalization? Add explicit counter. Re-test until bulletproof.

**Testing methodology:** See [Testing Skills with Subagents](references/testing-skills-with-subagents.md) for the complete methodology:
- How to write pressure scenarios
- Pressure types (time, sunk cost, authority, exhaustion)
- Plugging holes systematically
- Meta-testing techniques

## Anti-Patterns

- **Narrative:** "In session 2025-10-03, we found..." — too specific, not reusable
- **Multi-language:** example-js.js, example-py.py — mediocre quality, maintenance burden
- **Code in flowcharts:** `step1 [label="import fs"]` — can't copy-paste
- **Generic labels:** helper1, step3, pattern4 — labels need semantic meaning
- **Batch creation:** Creating multiple skills without testing each — deploy and test ONE at a time

## Discovery Workflow

How future Claude finds your skill:

1. **Encounters problem** ("tests are flaky")
3. **Finds SKILL** (description matches)
4. **Scans overview** (is this relevant?)
5. **Reads patterns** (quick reference table)
6. **Loads example** (only when implementing)

**Optimize for this flow** - put searchable terms early and often.

## The Bottom Line

**Creating skills IS TDD for process documentation.**

Same Iron Law: No skill without failing test first.
Same cycle: RED (baseline) → GREEN (write skill) → REFACTOR (close loopholes).
Same benefits: Better quality, fewer surprises, bulletproof results.

If you follow TDD for code, follow it for skills. It's the same discipline applied to documentation.


## References

- [Flowchart Usage](references/flowchart-usage.md)
- [Testing All Skill Types](references/testing-all-skill-types.md)
- [Bulletproofing Skills Against Rationalization](references/bulletproofing-skills-against-rationalization.md)
- [Skill Creation Checklist (TDD Adapted)](references/skill-creation-checklist-tdd-adapted.md)
