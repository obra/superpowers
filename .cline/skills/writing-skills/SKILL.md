---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

## Overview

**Writing skills IS Test-Driven Development applied to process documentation.**

**Personal skills live in your agent's global skills directory (e.g., `~/.claude/skills`, `~/.agents/skills/`, or `~/.config/opencode/skills/`)** 

You write test cases (pressure scenarios with subagents), watch them fail (baseline behavior), write the skill (documentation), watch tests pass (agents comply), and refactor (close loopholes).

## What is a Skill?

A **skill** is a reference guide for proven techniques, patterns, or tools. Skills help future agents find and apply effective approaches.

**Skills are:** Reusable techniques, patterns, tools, reference guides
**Skills are NOT:** Narratives about how you solved a problem once

## TDD Mapping for Skills

| TDD Concept | Skill Creation |
|-------------|----------------|
| **Test case** | Pressure scenario with subagent |
| **Production code** | Skill document (SKILL.md) |
| **Test fails (RED)** | Subagent violates rule without skill (baseline) |
| **Test passes (GREEN)** | Subagent complies with skill present |
| **Refactor** | Close loopholes while maintaining compliance |

## Directory Structure

```
skills/
  skill-name/
    SKILL.md              # Main reference (required)
    supporting-file.*     # Only if needed
```

## SKILL.md Structure

**Frontmatter (YAML):**
- Only two fields supported: `name` and `description`
- Max 1024 characters total
- `name`: Use letters, numbers, and hyphens only
- `description`: Third-person, describes ONLY when to use (NOT what it does)
  - Start with "Use when..." to focus on triggering conditions
  - **NEVER summarize the skill's process or workflow**

```markdown
---
name: Skill-Name-With-Hyphens
description: Use when [specific triggering conditions and symptoms]
---

# Skill Name
...
```

## Agent Search Optimization (ASO)

**Critical for discovery:** Future agents need to FIND your skill. Use the skill description and content keywords strategically.

### 1. Rich Description Field

**Purpose:** Agents read the description to decide which skills to load. Make it answer: "Should I read this skill right now?"
**Format:** Start with "Use when..." to focus on triggering conditions. Do NOT summarize the workflow.

### 2. Keyword Coverage

Use words an agent would see in its terminal:
- Error messages: "Hook timed out", "ENOTEMPTY", "race condition"
- Symptoms: "flaky", "hanging", "zombie", "pollution"
- Tools: commands, library names, file types

### 3. Token Efficiency (Critical)

**Target word counts:**
- Getting-started workflows: <150 words each
- Other skills: <500 words (be concise)

**Techniques:**
- **Move details to tool help:** Reference `--help` instead of documenting flags.
- **Use cross-references:** Reference other skills instead of repeating their rules.

## Cross-Referencing Other Skills

**When writing documentation that references other skills:**

Use skill name only, with explicit requirement markers:
- ✅ Good: `**REQUIRED SUB-SKILL:** Use test-driven-development`
- ❌ Bad: `@skills/testing/test-driven-development/SKILL.md` (force-loads, burns context)

**Why no @ links:** `@` syntax force-loads files automatically in some platforms, consuming context before you need them. Let the agent use its **Skill Loader** capability to load them on demand.

## Flowchart Usage

Use markdown dot diagrams natively. Do not use generic labels (e.g., `step1`).

## Testing Skills

Different skill types need different test approaches:
- **Discipline-Enforcing Skills:** Test with pressure scenarios (time, sunk cost).
- **Technique Skills:** Test with application scenarios to novel problems.

Deploying untested skills = deploying untested code. It's a violation of quality standards.
