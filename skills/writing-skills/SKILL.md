---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

Skills are reusable reference guides for techniques, patterns, or tools — not narratives about one-time solutions. Writing skills is TDD applied to process documentation: baseline the unaided agent (RED), write the skill (GREEN), close loopholes (REFACTOR).

**Required background:** `superpowers:test-driven-development` — same cycle, applied here to documentation.

**Official:** see `anthropic-best-practices.md` for Anthropic's skill-authoring guidance.

## TDD Mapping

| TDD | Skill creation |
|---|---|
| Test case | Pressure scenario with subagent |
| Production code | SKILL.md |
| RED | Agent violates without skill (record verbatim rationalizations) |
| GREEN | Agent complies with skill present |
| REFACTOR | Close loopholes, re-test until bulletproof |

## When to Create

Create when: technique is non-obvious, applies across projects, generalizable, others would benefit.

Don't create for: one-off solutions, standard practices documented elsewhere, project-specific conventions (→ CLAUDE.md), mechanical constraints enforceable by regex/validation (automate instead).

## Skill Types

- **Technique** — concrete method with steps (e.g., `condition-based-waiting`, `root-cause-tracing`)
- **Pattern** — way of thinking about problems (e.g., `flatten-with-flags`)
- **Reference** — API / syntax / tool docs

## Directory Structure

```
skills/<skill-name>/
  SKILL.md            # required
  <supporting>.*      # only when needed
```

Flat namespace. Separate files only for heavy reference (100+ lines) or reusable tools/scripts. Inline everything else.

## SKILL.md Structure

**Frontmatter (YAML, max 1024 chars):**
- `name` — letters, numbers, hyphens only
- `description` — third person, **triggering conditions only**, no workflow summary
  - Start with "Use when…"
  - Prefer symptoms and situations over language-specific signals
  - Keep under 500 chars when possible

**Body:**
```markdown
# Skill Name

## Overview — what it is, core principle (1-2 sentences)
## When to Use — symptoms + when NOT to use
## Core Pattern (techniques/patterns) — before/after
## Quick Reference — table/bullets
## Implementation — inline or link to heavy reference
## Common Mistakes
## Real-World Impact (optional)
```

## Claude Search Optimization

### Description = trigger, not workflow

Description summaries create a shortcut the agent will take *instead of reading the skill body*. Real test case: a description mentioning "code review between tasks" caused one review to run when the skill flowchart required two. Removing the workflow summary fixed it.

```yaml
# ❌ description: Use when executing plans — dispatches subagent per task with review between tasks
# ❌ description: Use for TDD — write test, watch fail, minimal code, refactor
# ✅ description: Use when executing implementation plans with independent tasks in the current session
# ✅ description: Use when implementing any feature or bugfix, before writing implementation code
```

### Keyword coverage

Use words the agent would search for: error messages ("Hook timed out", "ENOTEMPTY"), symptoms ("flaky", "hanging"), synonyms ("timeout/hang/freeze"), tool/library/file names.

### Naming

Active voice, verb-first, describes what you DO:
- ✅ `condition-based-waiting` / `creating-skills` / `flatten-with-flags`
- ❌ `async-test-helpers` / `skill-creation` / `data-structure-refactoring`

### Token efficiency

getting-started and frequently-loaded skills go into *every* conversation. Target: <150 words for getting-started, <200 for frequently-loaded, <500 otherwise. Move flag details to `--help`, cross-reference rather than repeat, compress examples, eliminate redundancy. Verify with `wc -w`.

### Cross-referencing

Use skill name with explicit markers — never `@` (force-loads, burns context):
- ✅ `**REQUIRED SUB-SKILL:** Use superpowers:test-driven-development`
- ✅ `**REQUIRED BACKGROUND:** You MUST understand superpowers:systematic-debugging`
- ❌ `@skills/testing/test-driven-development/SKILL.md`

## Flowcharts

Use only for non-obvious decisions, process loops where the agent might stop too early, or "A vs B" choices. Never for reference material (use tables), code (use code blocks), linear instructions (use numbered lists), or nodes without semantic meaning (`step1`, `helper2`).

See `graphviz-conventions.dot` for style rules. Render with `render-graphs.js ../some-skill [--combine]`.

## Code Examples

One excellent example beats many mediocre ones. Pick the most relevant language. Complete, runnable, well-commented (WHY), from a real scenario, ready to adapt. No fill-in-the-blank templates, no multi-language dilution, no contrived examples.

## Iron Law

```
NO SKILL WITHOUT A FAILING TEST FIRST
```

Applies to new skills and edits. If you wrote before testing: delete, run the baseline, start over. "Violating the letter is violating the spirit" — this shuts down the "following the spirit" class of rationalizations before they start.

## Testing by Skill Type

- **Discipline (rules/requirements)** — academic questions + combined pressure scenarios (time + sunk cost + authority + exhaustion); add explicit counters for each rationalization observed. Success: complies under max pressure.
- **Technique (how-to)** — application and variation scenarios; missing-info tests for gaps. Success: correct application in new scenario.
- **Pattern (mental model)** — recognition + counter-example scenarios. Success: correctly identifies when to apply / not apply.
- **Reference (docs/APIs)** — retrieval + application + gap tests. Success: agent finds and uses the right info.

Testing methodology (pressure types, plugging holes, meta-testing): see `testing-skills-with-subagents.md`.

## RED-GREEN-REFACTOR

**RED — baseline**: run the pressure scenario without the skill. Record choices and rationalizations verbatim. Which pressures triggered violations?

**GREEN — minimal skill**: address only those observed failures. Re-run; agent should comply.

**REFACTOR — close loopholes**: new rationalization → explicit counter → re-test until bulletproof.

## Bulletproofing Discipline Skills

Discipline skills resist rationalization under pressure. For them only (not for technique/reference skills):

1. **Close loopholes explicitly.** Not just "don't X" — forbid specific workarounds ("don't keep as reference", "don't look at it").
2. **Rationalization table.** One row per excuse observed in RED, paired with the counter.
3. **Red-flag self-check list.** Short, scannable, ends with "All of these mean: <concrete action>."
4. **CSO trigger = symptoms.** Description surfaces when the agent is *about to* violate.

Psychology foundation (Cialdini, Meincke et al.): `persuasion-principles.md`.

## Anti-patterns

- **Narrative**: "In session 2025-10-03 we found…" — not reusable.
- **Multi-language dilution**: 5 translations of the same example — mediocre + maintenance burden.
- **Code in flowcharts** — can't copy, hard to read.
- **Generic labels**: `helper1`, `step3`, `pattern4` — labels must carry meaning.

## Before Deploying

Completing the deployment process is recommended before shipping — especially for skills other skills depend on, or skills for general release. Deploying untested skills = deploying untested code. Drafts batched for a later test pass are fine, but the checklist below must run before merge-to-main or real use.

## Checklist

Use TodoWrite to track each item.

**RED**
- [ ] 3+ combined-pressure scenarios (for discipline skills)
- [ ] Run without skill; document baseline verbatim
- [ ] Identify rationalization patterns

**GREEN**
- [ ] Name: letters/numbers/hyphens only
- [ ] Frontmatter: `name` + trigger-only `description` (≤1024 chars, third person)
- [ ] Searchable keywords surfaced early
- [ ] Overview states the core principle
- [ ] Body addresses the specific baseline failures
- [ ] Code inline or linked, one excellent example
- [ ] Re-run scenarios with skill; agents comply

**REFACTOR**
- [ ] Capture new rationalizations; add counters (discipline skills)
- [ ] Rationalization table + red-flags list (discipline skills)
- [ ] Re-test until bulletproof

**Quality**
- [ ] Flowchart only if decision is non-obvious
- [ ] Quick-reference table
- [ ] Common mistakes
- [ ] No narrative storytelling
- [ ] Supporting files only for tools / heavy reference

**Deployment**
- [ ] Commit + push to fork
- [ ] Consider PR back if broadly useful

## Discovery Flow

Future agent: hits problem → searches → finds SKILL by description → scans overview → reads quick reference → loads example when implementing. Put searchable terms early and often.
