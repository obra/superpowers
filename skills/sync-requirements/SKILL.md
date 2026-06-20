---
name: sync-requirements
description: Use when implementation work is complete or durable requirements need to be merged from specs, plans, commits, reports, or session discussion into long-lived requirements documents
---

# Sync Requirements

## Overview

Merge durable requirements learned during Superpowers-driven work into
PRD-style module requirements documents.

**Core principle:** dated specs and plans are execution artifacts; durable
requirements belong in `docs/req/<module>/req.md`.

**Announce at start:** "I'm using the sync-requirements skill to update durable requirements."

## When to Use

Use this skill when:

- Implementation work is complete and requirements may need to be preserved.
- A user asks to merge a brainstorming spec or writing plan into long-lived requirements.
- A session included user-requested behavior changes after the original spec or plan.
- You need to update `docs/req/<module>/req.md` without archiving or rewriting dated artifacts.

Do not use this skill for:

- Temporary notes, command output, or debugging traces.
- Pure implementation details that belong in design docs, plans, or code comments.
- OpenSpec project state under `openspec/`; do not require the OpenSpec CLI.

## Requirements Document Convention

Main requirements documents live at:

```text
docs/req/<module>/req.md
```

Use stable, lowercase, hyphen-separated module names.

Each req document uses this structure:

```markdown
# <module> Requirements

## Purpose
One short paragraph explaining what durable capability this module describes.

## Requirements

### Requirement: <Name>
The system SHALL describe one durable behavior, constraint, or user-visible rule.

#### Scenario: <Scenario Name>
- **GIVEN** an initial state, when the state matters
- **WHEN** a condition, trigger, or user action occurs
- **THEN** an observable result is required
- **AND** an additional condition or outcome also applies
- **BUT** a prohibited behavior, exception, or negative expectation must hold
```

Requirement bodies use normative language:

- Use **SHALL** or **MUST** for required behavior.
- Use **SHALL NOT** or **MUST NOT** for prohibited behavior.
- Do not use weak substitutes such as "should avoid" or "does not usually".
- Every requirement must have at least one `#### Scenario:` block.
- Scenario steps use **WHEN** and **THEN** at minimum.
- Use **GIVEN** only when an initial state matters.
- Use **AND** for additional conditions or outcomes.
- Use **BUT** only for prohibited behavior, exceptions, or negative expectations.

## Workflow

### 1. Resolve Work Context

Identify the work to sync. Look for:

- A referenced or recently created design spec under `docs/superpowers/specs/`.
- A referenced or recently created plan under `docs/superpowers/plans/`.
- Current branch commits, task reports, progress ledgers, and final summaries.
- Session-only user requirements added after the original spec or plan.

If the relevant spec or plan cannot be inferred uniquely, ask the user to choose
from candidate files. Do not invent a context.

### 2. Extract Durable Requirements

Read the available design spec and plan, then review the active session for
additional user requirements.

Extract durable product, workflow, behavior, and constraint requirements.

Skip:

- Transient test failures.
- Debugging dead ends.
- Local command output.
- Implementation accidents.
- Branch management choices.

Keep a requirement from those skipped categories only when the user explicitly
changed the intended durable behavior.

When a later user message conflicts with the original spec or plan, the later
explicit user message wins. Mention that replacement in the sync summary.

### 3. Select Target Modules

Map each durable requirement to one or more module req documents under
`docs/req/<module>/req.md`.

If the target req document does not exist, create it with `# <module> Requirements`,
`## Purpose`, and `## Requirements`.

If the module boundary is unclear, ask one multiple-choice question showing the
plausible module names and why each is plausible.

### 4. Merge Intelligently

Apply requirements by intent rather than copying artifact text:

- New durable behavior becomes a new `### Requirement`.
- Additional examples or edge cases become new `#### Scenario` entries under an existing requirement.
- Changed behavior updates the existing requirement or scenario while preserving unrelated content.
- Removed behavior is deleted only when the current work explicitly deprecated it.
- Renames update headings while preserving scenarios that still apply.

The operation must be idempotent. If the target req document already states the
same requirement or scenario, report that it is already synchronized instead of
duplicating it.

### 5. Report Results

After syncing, report:

- Which module requirements documents were created or modified.
- Which requirements or scenarios were added, modified, removed, or already in sync.
- Which session-only user requirements were captured.
- Which candidate details were skipped as temporary or non-durable.

## Error Handling

- If no design spec, plan, commits, or session requirements can be identified,
  report that there is nothing reliable to sync and return to the caller.
- If a target module requirements document contains ambiguous or contradictory
  existing requirements, ask the user before editing.
- If file writes fail, stop and report the exact path and failure.

## Guardrails

- Do not require the OpenSpec CLI.
- Do not create an `openspec/` directory.
- Do not archive or rewrite dated specs in `docs/superpowers/specs/`.
- Do not archive or rewrite dated plans in `docs/superpowers/plans/`.
- Do not silently edit requirements if module selection is ambiguous.
- Preserve existing req document content not mentioned by the current work.
