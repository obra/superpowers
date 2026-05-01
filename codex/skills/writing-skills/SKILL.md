---
name: writing-skills
description: Use when creating, editing, porting, or verifying Codex skills before deployment
---

# Writing Skills

## Overview

Write skills as compact, reusable operating instructions for Codex. A good skill tells Codex when it applies, what discipline or technique to follow, what tools are available, and how to verify compliance without relying on unavailable platform behavior.

## What a Skill Is

Skills are reusable techniques, patterns, tools, and reference guides.

Skills are not:

- Narratives about how one problem was solved.
- Project-specific rules that belong in repo instructions.
- Mechanical checks better enforced by tests or scripts.
- Long documentation dumps that Codex does not need at trigger time.

## Codex Skill Discovery

The frontmatter determines whether Codex loads the skill. Keep it precise.

```markdown
---
name: skill-name-with-hyphens
description: Use when <specific triggering conditions, symptoms, or contexts>
---
```

Rules:

- Use only `name` and `description` unless the target runtime documents more fields.
- Use lowercase hyphenated names.
- Start descriptions with `Use when`.
- Describe triggering conditions, not the workflow.
- Include concrete symptoms and synonyms a user might say.
- Keep frontmatter short enough to scan quickly.

Avoid descriptions that summarize the whole process. Codex may treat that summary as enough and skip important details in the body.

## Directory Structure

```text
skills/
  skill-name/
    SKILL.md
    supporting-file.ext
```

Keep the skill self-contained unless a support file is genuinely useful:

- Use support files for heavy references, runnable tools, templates, or large examples.
- Keep principles, checklists, and short examples inline.
- Do not copy support files that the skill does not reference.

## Writing Process

Use `update_plan` for skill work:

1. Define the behavior gap: what should Codex do differently when this skill is loaded?
2. Identify trigger language: what user requests, symptoms, or contexts should load it?
3. Draft the smallest useful `SKILL.md`.
4. Remove platform-specific or unavailable tool language.
5. Verify with deterministic checks and, when authorized, behavioral tests.
6. Refine loopholes found during review or testing.

## Discipline Skill Documentation TDD

For discipline skills such as TDD, debugging, verification, review reception, or skill-use rules, write the documentation test-first:

1. Create pressure scenarios that tempt Codex to skip the discipline, such as "tests later", "manual testing is enough", "too simple", "just this once", sunk cost, or "spirit vs letter".
2. Run the baseline scenario before implementing the skill change and capture the baseline failure: the exact shortcut, skipped step, or rationalization Codex used without the improved instruction.
3. Implement the smallest skill text that blocks those rationalizations.
4. Re-run or re-test the pressure scenario with the skill loaded and verify Codex now follows the discipline.
5. Close loopholes found during the with-skill rerun, then test again until the pressure scenario passes.

Capture rationalization evidence in notes, test output, a transcript, or the review record. If subagents are unavailable or not authorized, use a local transcript/manual audit fallback: simulate the pressure prompt, record the expected compliant behavior, inspect the actual response or proposed workflow against it, and explicitly state the residual risk that this is weaker than an isolated subagent pressure test.

Pure regex checks are not verification for discipline behavior. Regex can confirm required phrases are present, but it cannot prove Codex resists the shortcut under pressure; pair it with a pressure scenario, transcript audit, or behavioral test.

## Codex Tool Language

Use Codex-native terms:

- `update_plan` for visible checklists.
- Shell commands and local file inspection for repository work.
- `apply_patch` for manual file edits.
- `spawn_agent`, `send_input`, `wait_agent`, and `resume_agent` only when the user explicitly asks for delegation, subagents, parallel agent work, reviewer workflow, or team workflow.

Do not require automatic commits, pushes, or pull requests unless the user asks for them.

Do not describe unavailable tools as actions Codex can take. If porting from another agent platform, translate tool names into Codex equivalents or remove the instruction.

## Structure

Most skills should use this shape:

```markdown
---
name: skill-name
description: Use when ...
---

# Skill Title

## Overview
Core principle in 1-2 paragraphs.

## When to Use
Concrete triggers and non-triggers.

## Process
The required steps or decision pattern.

## Verification
Commands, inspection checks, or behavioral evidence.

## Common Mistakes
Short list of likely failures and corrections.
```

Use flowcharts only for non-obvious decisions or loops. Use tables and bullets for reference material. Prefer one strong example over several weak examples.

## Verification

For new or changed skills, choose the smallest reliable verification available:

- Run repository compatibility tests when they exist.
- Use `rg` checks for forbidden platform terms.
- Render or lint generated diagrams when a skill includes diagrams.
- Inspect frontmatter and support-file references.
- When the user explicitly authorizes delegation, pressure-test the skill with a worker subagent and pass it exact scenarios plus expected behavior.

Verification claims require fresh evidence from the current turn. If no executable harness exists, document the manual checklist used and any residual risk.

## Porting Checklist

When porting skills into Codex:

- Preserve the core discipline and intent.
- Replace non-Codex tool names with Codex tools.
- Remove mandatory delegation unless the user explicitly authorized it.
- Replace model-tier instructions with inherited model or reasoning-effort language.
- Remove forced commits unless the user requested commits.
- Keep writes inside the task's owned paths.
- Copy support files only when directly referenced and still valid after terminology cleanup.

## Common Mistakes

- Writing a description that explains the workflow instead of the trigger.
- Adding broad rules that belong in repo instructions.
- Keeping obsolete platform tool names in examples.
- Adding support files that are never referenced.
- Claiming the skill is verified without running the relevant command or checklist.
