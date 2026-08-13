---
name: feature-context
description: Use when starting work in a project with domain-specific terminology, business rules, or architectural decisions that are not obvious from the code — when Claude lacks the domain knowledge needed to make good implementation decisions without being corrected
---

# Feature Context

## Overview

Domain knowledge that lives only in your human partner's head is a liability. Domain knowledge that lives in a versioned file is an asset available to every session, every subagent, and every future contributor.

**Core principle:** Externalize what you know. Codify what you learn.

## What Feature Context Is

A `.claude/context.md` file — or another path your project uses — that captures:

- **Domain glossary:** Terms that mean something specific in this project (not their general definition)
- **Business rules:** Invariants the system must maintain, regardless of what the code seems to permit
- **Key decisions:** Why the architecture is the way it is — and what alternatives were rejected
- **Common patterns:** The established way to do recurring things in this codebase
- **Known pitfalls:** What breaks silently if you don't have the background knowledge

This file is loaded at session start so domain knowledge is present from the first message, not only when your human partner thinks to mention it.

**This is not:**
- A substitute for code comments or docstrings
- A changelog, README, or onboarding guide
- An implementation plan or task list
- General best practices (those belong in `CLAUDE.md`)

## When to Create or Update Feature Context

**Create the file when you notice any of these:**
- Your human partner corrects you on terminology more than once
- The feature uses concepts specific to this business, not industry-standard terms
- The codebase has established patterns that aren't obvious from convention
- There's a business rule that isn't enforced or visible in the code
- Subagents are making the same category of mistakes because they lack background

**Update the file when:**
- Your human partner corrects you on something not already captured
- A business rule changes
- An architectural decision is revised
- A brainstorming session introduces new project-specific concepts

**Signal for update:** If you find yourself explaining something to your human partner that should be in the context file — stop and add it first.

**Don't create one if:**
- All relevant context is already captured in `CLAUDE.md`
- The project domain is entirely standard industry terminology (CRUD, REST, authentication)
- The codebase is simple enough that the code is genuinely self-documenting

## The Process

### Step 1: Survey What Already Exists

Before writing anything, check what's already captured:

```bash
ls .claude/ 2>/dev/null
cat CLAUDE.md 2>/dev/null
cat .claude/context.md 2>/dev/null
```

Don't duplicate what's already in `CLAUDE.md`. Feature context is for domain knowledge too detailed or too project-specific for the top-level configuration.

### Step 2: Interview Your Human Partner

Ask these questions — one at a time, not as a list:

1. "What terms do you use in this project that have a specific meaning here?"
2. "What business rules should never be violated, even if the code seems to allow it?"
3. "What architectural decisions have been made deliberately, and why?"
4. "What mistakes do you see me make repeatedly?"
5. "What would you tell a new developer on day one of this project?"

Listen for patterns. The most important domain knowledge is often the correction your human partner has given you twice.

### Step 3: Write the Context File

Create `.claude/context.md`:

```markdown
# [Project Name] Feature Context

> Loaded at session start. Focused on domain knowledge: terminology, business rules,
> key decisions, and pitfalls. Not a README or implementation guide.

## Domain Glossary

| Term | Meaning in this project |
|------|------------------------|
| [term] | [Specific meaning — not the dictionary definition. Include what it is NOT if that's commonly confused.] |

## Business Rules

Rules the system must never violate, regardless of what the code seems to permit:

1. **[Rule name]:** [What the rule is, why it exists, and what breaks if violated]
2. **[Rule name]:** [What the rule is, why it exists, and what breaks if violated]

## Key Architectural Decisions

Decisions made deliberately that should not be undone without discussion:

- **[Decision]:** [What was chosen, why, and what alternatives were explicitly rejected]

## Common Patterns

The established way to do recurring things in this codebase:

**[Pattern name]:**
```[language]
// The right way — match this when doing [recurring task]
[code example]
```

## Known Pitfalls

What breaks silently without this background knowledge:

- **[Pitfall name]:** [What happens if you don't know this, and how to avoid it]

## Current State

What the codebase is in the middle of right now (update this at the start of each significant work session):

- [Any in-progress migrations, feature flags, partial refactors, or temporary constraints]
```

### Step 4: Load It at Session Start

A context file that isn't read is useless. Make sure it's loaded automatically.

**If using Superpowers hooks (automatic):**

The session-start hook reads `.claude/context.md` if it exists. No additional configuration needed.

**If referencing manually from `CLAUDE.md`:**

Add a line to `CLAUDE.md`:

```markdown
## Project Context
Read `.claude/context.md` at the start of every session for domain terminology, business rules, and architectural decisions specific to this project.
```

**If configuring via settings hook:**

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "[ -f .claude/context.md ] && echo '=== Feature Context ===' && cat .claude/context.md"
          }
        ]
      }
    ]
  }
}
```

### Step 5: Validate Coverage

After writing the file, apply this test: if a fresh subagent started right now with only this file and the codebase, would it make good decisions on the first try?

If not, identify what's missing and add it.

### Step 6: Commit It

```bash
git add .claude/context.md
git commit -m "docs: add feature context with domain glossary and business rules"
```

This is documentation of your problem domain. It belongs in version control alongside the code it describes.

## Keeping It Current

Context rots when the domain evolves but the file doesn't. A stale context file is worse than no file — it teaches Claude incorrect things confidently.

**Update triggers:**
- Your human partner corrects you on something the file should have covered
- A business rule changes and the old rule is still in the file
- An architectural decision is reversed
- A new term is introduced and used consistently

**Rotation:** At the start of a long implementation session, quickly verify the "Current State" section is accurate. Update it in under two minutes or note it's current as-is.

**If you discover a stale entry mid-session:** Stop. Update the file before continuing. Working from a context entry you know is wrong is worse than having no context file — it means you're actively building on a false assumption.

## Red Flags — STOP

- Writing context for generic concepts (REST, CRUD, "the database")
- Duplicating content already in `CLAUDE.md`
- Writing a context file so long it becomes unusable — keep it scannable, not comprehensive
- Leaving the file uncommitted (it's documentation, not scratch space)
- Skipping the session-start hook or `CLAUDE.md` reference (a file that isn't loaded is useless)
- Treating it as a one-time artifact — it must stay current

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "The code is self-documenting" | Code shows what, not why. Business rules don't live in method names. |
| "I'll remember this for next session" | Subagents won't. The next session won't. Write it down. |
| "CLAUDE.md already covers this" | `CLAUDE.md` is for process and configuration. Context is for domain knowledge. Both are needed. |
| "It'll get out of date" | Update it when it changes. Staleness is a maintenance signal, not a reason to skip the file. |
| "It's just one project" | Domain knowledge compounds. A small file now prevents category-level mistakes later. |
| "I'll add it once the feature is done" | The feature is where you learn the domain knowledge. Capture it while you're learning it. |

## Quick Reference

| Section | Content | Update Trigger |
|---------|---------|---------------|
| Domain Glossary | Project-specific term definitions | New terms, corrected definitions |
| Business Rules | System invariants that code may not enforce | Rule changes, new invariants discovered |
| Key Decisions | Why the architecture is the way it is | Decision reversed or revised |
| Common Patterns | The established right way to do things | Better pattern established |
| Known Pitfalls | What breaks without this knowledge | New pitfall discovered |
| Current State | In-progress work, temporary constraints | Start of each significant work session |

## Integration

**Pairs with:**
- **superpowers:brainstorming** — brainstorming sessions often surface domain knowledge; add new terms and rules to context before the session ends
- **superpowers:writing-plans** — reference context when writing plans to ensure domain-appropriate file names, method names, and data shapes
- **superpowers:subagent-driven-development** — subagents read context at session start; accurate context prevents category-level mistakes across all tasks
