---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

**Writing skills IS Test-Driven Development applied to process documentation.** If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.

**REQUIRED BACKGROUND:** You MUST understand sspower:test-driven-development before using this skill.

**Official guidance:** See `anthropic-best-practices.md` for Anthropic's official skill authoring best practices.

## The Iron Law

```
NO SKILL WITHOUT A FAILING TEST FIRST
```

This applies to NEW skills AND EDITS. Write skill before testing? Delete it. Start over.

**No exceptions:** Not for "simple additions", not for "just adding a section", not for "documentation updates". Don't keep untested changes as "reference". Delete means delete.

**Violating the letter of the rules is violating the spirit of the rules.**

## Skill Types

| Type | Examples | What It Is |
|------|----------|------------|
| **Technique** | condition-based-waiting, root-cause-tracing | Concrete method with steps |
| **Pattern** | flatten-with-flags, test-invariants | Way of thinking about problems |
| **Reference** | API docs, syntax guides | Tool documentation |

**Create when:** Technique wasn't obvious, you'd reference it across projects, pattern applies broadly.
**Don't create for:** One-off solutions, standard practices, project-specific conventions (use CLAUDE.md).

## SKILL.md Structure

```
skill-name/
├── SKILL.md              # Main reference (required)
└── references/           # Only if needed
    ├── scripts/          # Executable tools
    └── heavy-docs.md     # 100+ line references
```

**Frontmatter:** `name` (letters/numbers/hyphens only) + `description` (max 1024 chars, third person).

**Description rules:** Start with "Use when...", include specific triggers/symptoms, **NEVER summarize the skill's workflow** — this causes Claude to follow the description shortcut instead of reading the skill. See `references/cso-guide.md` for full CSO guidance with examples.

## RED-GREEN-REFACTOR Cycle

See `references/skill-creation-process.md` for the full process, bulletproofing techniques, testing by skill type, and rationalization tables.

**RED:** Run pressure scenarios WITHOUT skill. Document baseline failures and rationalizations verbatim.

**GREEN:** Write minimal skill addressing those specific failures. Run same scenarios WITH skill — agent should comply.

**REFACTOR:** Find new rationalizations, add explicit counters, re-test until bulletproof.

## Deployment

See `references/quality-checklist.md` for the full checklist (27 items), anti-patterns, file organization, and code example guidance.

**STOP before moving to next skill.** After writing ANY skill, complete the deployment checklist. Do NOT batch skills without testing each.

## Discovery Workflow

How future Claude finds your skill:
1. Encounters problem → 2. Description matches → 3. Scans overview → 4. Reads patterns → 5. Loads example

**Optimize for this flow** — put searchable terms early and often.
