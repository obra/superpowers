# Sync Requirements Design

## Problem

Superpowers currently treats brainstorming specs and writing-plans documents as
dated execution artifacts. They are useful while a task is being designed and
implemented, but once the work completes, the durable requirements learned during
the session are not folded into a long-lived module requirements document. This makes it
easy for future agents to miss decisions that were made during implementation,
especially when the user added requirements after the original spec and plan were
written.

OpenSpec has a similar artifact lifecycle, but its sync workflow gives agents a
way to merge change-local specs into long-lived module requirements documents. Superpowers should
gain the same durable knowledge path without adopting OpenSpec's CLI or directory
layout wholesale.

## Goals

- Add a new Superpowers skill named `sync-requirements`.
- Store long-lived module requirements in `docs/req/<module>/req.md`.
- Keep existing brainstorming specs in `docs/superpowers/specs/` and writing
  plans in `docs/superpowers/plans/` as dated historical artifacts.
- Prompt users to sync requirements after implementation tasks complete, before
  branch finishing choices such as merge or PR.
- Include requirements that appeared in the session after the original spec and
  plan, so user-requested scope changes are not lost.
- Make sync idempotent: running it twice should not duplicate requirements or
  scenarios.

## Non-Goals

- Do not replace or rewrite dated design specs and implementation plans.
- Do not require the OpenSpec CLI or create an `openspec/` directory.
- Do not silently edit main requirements documents without user confirmation in the finishing
  workflow.
- Do not archive old design specs or plans as part of this feature.
- Do not add third-party dependencies.

## Architecture

Add a focused skill at `skills/sync-requirements/SKILL.md`. The skill is the only
place that performs requirement discovery, module selection, intelligent merging,
and final reporting.

Update `skills/finishing-a-development-branch/SKILL.md` so that, after tests
pass and before the merge/PR/keep/discard menu, it runs a requirement sync prompt.
That prompt should explain that the session may contain durable requirements not
captured in the original spec or plan and ask whether to run
`sync-requirements`.

The finishing skill should stay lightweight. It should not inline the merge
algorithm; it only detects whether this work likely has syncable artifacts and
presents the choice. If the user chooses to sync, the agent invokes or follows
`sync-requirements`, then returns to the normal branch-finishing menu.

## Main Requirements Document Format

Main requirements documents live under module directories:

```text
docs/req/<module>/req.md
```

Each req document uses a PRD-style requirements format, closer to a traditional software requirements specification than an implementation design artifact:

```markdown
# requirements-sync Requirements

## Purpose
Captures how completed Superpowers work updates durable module requirements.

## Requirements

### Requirement: Requirement Sync Prompt
The system SHALL ask whether to sync durable requirements before finishing a completed branch.

#### Scenario: Completed implementation has syncable requirements
- **WHEN** implementation tasks are complete and verification has passed
- **THEN** the agent offers to sync requirements before presenting branch completion choices
```

Module names should be stable, lowercase, and hyphen-separated. The sync skill
may infer a module from the work, but if multiple modules are plausible or the
work spans more than one module, it must ask the user rather than guessing.

## `sync-requirements` Workflow

### 1. Resolve Work Context

The skill first identifies the current work. It should look for:

- A referenced or recently created design spec under `docs/superpowers/specs/`.
- A referenced or recently created implementation plan under
  `docs/superpowers/plans/`.
- Current branch commits, task reports, progress ledgers, and final summaries
  when those are available in the session or workspace.
- User messages in the active session that changed requirements after the
  original spec or plan.

If the relevant design spec or plan cannot be inferred uniquely, the skill must
ask the user to choose from candidate files. It must not invent a context.

### 2. Extract Durable Requirements

The skill reads the available design spec and plan, then reviews the active
session for additional user requirements. It should extract durable product,
workflow, behavior, and constraint requirements.

It should ignore temporary execution details such as transient test failures,
debugging dead ends, local command output, implementation accidents, and branch
management choices unless they changed the intended behavior.

When user messages conflict with the original spec or plan, the later explicit
user message wins. The sync summary should mention that the newer requirement
superseded the older artifact.

### 3. Select Target Modules

The skill maps each durable requirement to one or more module requirements documents under `docs/req/<module>/req.md`.

If the target req document does not exist, the skill creates it with a clear Purpose and Requirements section. If a requirement belongs in an existing module requirements document, the skill reads that document before editing it.

If the module boundary is unclear, the skill asks a single multiple-choice
question showing the plausible module names and their rationale.

### 4. Merge Intelligently

The skill applies requirements by intent rather than copying artifact text.

- New durable behavior becomes a new `### Requirement`.
- Additional examples or edge cases become new `#### Scenario` entries under an
  existing requirement.
- Changed behavior updates the existing requirement or scenario while preserving
  unrelated content.
- Removed behavior is deleted only when the current work explicitly deprecated
  it.
- Renames update headings while preserving existing scenarios that still apply.

The merge must be idempotent. If the target req document already states the same
requirement or scenario, the skill reports that it was already synchronized
instead of duplicating it.

### 5. Report Results

After syncing, the skill reports:

- Which module requirements documents were created or modified.
- Which requirements or scenarios were added, modified, removed, or already in
  sync.
- Which session-only user requirements were captured.
- Which candidate details were skipped as temporary or non-durable.

## Finishing Workflow Integration

`finishing-a-development-branch` gains a step after test verification and before
environment/base-branch detection:

```text
Requirements may have changed during this session. Would you like to sync the
durable requirements into docs/req/<module>/req.md before finishing?

1. Sync requirements now (recommended)
2. Skip sync and continue finishing
3. Cancel finishing

Which option?
```

If the user chooses sync, the agent runs `sync-requirements` and then resumes the
existing finishing flow. If the user skips, the finishing flow continues
unchanged. If the user cancels, no merge/PR/cleanup option is presented.

## Error Handling

- If no design spec, plan, commits, or session requirements can be identified,
  report that there is nothing reliable to sync and return to the caller.
- If a target module requirements document contains ambiguous or contradictory existing requirements, ask the user before editing.
- If file writes fail, stop and report the exact path and failure.
- If the user declines sync, do not treat it as an error.

## Testing

This change is behavior-shaping skill content, so tests should focus on static
and workflow-level verification:

- Verify `skills/sync-requirements/SKILL.md` exists with the expected name and
  trigger description.
- Verify the skill documents `docs/req/<module>/req.md` as the main requirements document path.
- Verify the skill requires session-added user requirements to be considered.
- Verify `finishing-a-development-branch` prompts for requirement sync before its
  existing branch completion options.
- Verify README workflow documentation includes the new requirement sync step.

No runtime OpenSpec dependency is required.

## Open Questions Resolved

- Main requirements document path: `docs/req/<module>/req.md`.
- New skill name: `sync-requirements`.
- Dated brainstorming specs and writing plans remain in their current locations.
- Session-only requirements are part of the sync input and should be summarized
  explicitly.
