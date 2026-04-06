# Claude Search Optimization (CSO) Guide

## Rich Description Field

**Purpose:** Claude reads description to decide which skills to load. Make it answer: "Should I read this skill right now?"

**Format:** Start with "Use when..." to focus on triggering conditions.

## CRITICAL: Description = When to Use, NOT What the Skill Does

The description should ONLY describe triggering conditions. Do NOT summarize the skill's process or workflow.

**Why this matters:** Testing revealed that when a description summarizes the skill's workflow, Claude may follow the description instead of reading the full skill content. A description saying "code review between tasks" caused Claude to do ONE review, even though the skill's flowchart clearly showed TWO reviews (spec compliance then code quality).

When the description was changed to just "Use when executing implementation plans with independent tasks" (no workflow summary), Claude correctly read the flowchart and followed the two-stage review process.

**The trap:** Descriptions that summarize workflow create a shortcut Claude will take. The skill body becomes documentation Claude skips.

### Good vs Bad Descriptions

```yaml
# ❌ BAD: Summarizes workflow - Claude may follow this instead of reading skill
description: Use when executing plans - dispatches subagent per task with code review between tasks

# ❌ BAD: Too much process detail
description: Use for TDD - write test first, watch it fail, write minimal code, refactor

# ❌ BAD: Too abstract, vague
description: For async testing

# ❌ BAD: First person
description: I can help you with async tests when they're flaky

# ❌ BAD: Mentions technology but skill isn't specific to it
description: Use when tests use setTimeout/sleep and are flaky

# ✅ GOOD: Just triggering conditions, no workflow summary
description: Use when executing implementation plans with independent tasks in the current session

# ✅ GOOD: Triggering conditions only
description: Use when implementing any feature or bugfix, before writing implementation code

# ✅ GOOD: Describes problem, no workflow
description: Use when tests have race conditions, timing dependencies, or pass/fail inconsistently

# ✅ GOOD: Technology-specific with explicit trigger
description: Use when using React Router and handling authentication redirects
```

### Description Content Rules
- Use concrete triggers, symptoms, situations
- Describe the *problem* not *language-specific symptoms*
- Keep triggers technology-agnostic unless skill is tech-specific
- Write in third person
- Keep under 500 characters if possible
- **NEVER summarize the skill's process or workflow**

## Keyword Coverage

Use words Claude would search for:
- Error messages: "Hook timed out", "ENOTEMPTY", "race condition"
- Symptoms: "flaky", "hanging", "zombie", "pollution"
- Synonyms: "timeout/hang/freeze", "cleanup/teardown/afterEach"
- Tools: Actual commands, library names, file types

## Naming Rules

**Use active voice, verb-first:**
- ✅ `creating-skills` not `skill-creation`
- ✅ `condition-based-waiting` not `async-test-helpers`

**Name by what you DO or core insight:**
- ✅ `flatten-with-flags` > `data-structure-refactoring`
- ✅ `root-cause-tracing` > `debugging-techniques`

**Gerunds (-ing) work well for processes:**
- `creating-skills`, `testing-skills`, `debugging-with-logs`

## Token Efficiency

**Target word counts:**
- getting-started workflows: <150 words each
- Frequently-loaded skills: <200 words total
- Other skills: <500 words

**Techniques:**
- Move details to tool help (reference `--help` instead of documenting all flags)
- Use cross-references instead of repeating content
- Compress examples (minimal, not verbose)
- Don't repeat what's in cross-referenced skills
- Verify: `wc -w skills/path/SKILL.md`

## Cross-Referencing Other Skills

Use skill name only, with explicit requirement markers:
- ✅ `**REQUIRED SUB-SKILL:** Use sspower:test-driven-development`
- ✅ `**REQUIRED BACKGROUND:** You MUST understand sspower:systematic-debugging`
- ❌ `See skills/testing/test-driven-development` (unclear if required)
- ❌ `@skills/testing/test-driven-development/SKILL.md` (force-loads, burns context)

**Why no @ links:** `@` syntax force-loads files immediately, consuming 200k+ context before needed.

## Flowchart Usage

**Use flowcharts ONLY for:**
- Non-obvious decision points
- Process loops where you might stop too early
- "When to use A vs B" decisions

**Never use flowcharts for:**
- Reference material → Tables, lists
- Code examples → Markdown blocks
- Linear instructions → Numbered lists
- Labels without semantic meaning

See @graphviz-conventions.dot for graphviz style rules.

**Render flowcharts:** `./render-graphs.js ../some-skill` or `--combine` for all in one SVG.
