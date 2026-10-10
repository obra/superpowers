# OpenCode SDD Implementer Dispatch

Harden `subagent-driven-development` so OpenCode dispatches its dedicated SDD implementer subagent while other harnesses keep their existing general-purpose implementer dispatch.

## Problem

OpenCode now exposes a dedicated `sp-implementer` subagent for SDD implementation work. The current SDD implementer template still says `Subagent (general-purpose)`, which is correct for other harnesses but too generic for OpenCode. `SKILL.md` also contains an inconsistent integration note that mentions `@implementer-sp`, which does not match the OpenCode subagent exposed in this session.

Changing the template globally to only name `sp-implementer` would incorrectly affect Claude Code, Codex, Gemini, Copilot CLI, and other harnesses that still map the SDD implementer role through a general-purpose subagent plus the prompt template.

## Goals

- OpenCode SDD implementation dispatches use `sp-implementer`.
- Non-OpenCode harnesses keep using their existing general-purpose subagent mapping.
- Reviewer dispatches remain unchanged.
- The change is small, local, and clear enough that future agents do not accidentally universalize the OpenCode-specific rule.

## Non-goals

- Do not create or modify the OpenCode `sp-implementer` agent itself.
- Do not change reviewer subagent selection.
- Do not introduce a separate OpenCode-only SDD skill or duplicate prompt template.
- Do not change SDD's execution, review, ledger, or model-selection process.

## Design

### Implementer Template

Update `skills/subagent-driven-development/implementer-prompt.md` so its dispatch header is explicitly harness-specific:

- OpenCode: use `sp-implementer`.
- Other harnesses: use `Subagent (general-purpose)` through the normal tool mapping.

The rest of the prompt remains unchanged. The dedicated OpenCode subagent still receives the same task brief, report-file contract, swe-skills:behavior-guidelines requirement, testing expectations, commit requirement, and self-review checklist.

### SDD Skill Integration Notes

Add an early implementer dispatch target section in `skills/subagent-driven-development/SKILL.md`, close to the process flow, so controllers see the OpenCode-specific target before dispatching task implementers:

- OpenCode uses `sp-implementer` with `implementer-prompt.md`.
- Other harnesses use their normal general-purpose subagent mapping with `implementer-prompt.md`.
- This applies to initial task implementer dispatches only; reviewer and fixer targets stay unchanged.

Also clean up the integration section:

- Replace the incorrect `@implementer-sp` note with `sp-implementer` for OpenCode.
- State that other harnesses should continue using their general-purpose subagent mapping for the implementer template.
- Keep reviewer guidance pointed at the existing reviewer templates and skills.

### Scope Guard

Do not touch `task-reviewer-prompt.md`, `code-quality-reviewer-prompt.md`, or `requesting-code-review` templates. The problem is implementer dispatch only.

## Architectural Decisions

- **Use a conditional dispatch note instead of replacing the template header outright.** Rationale: SDD is shared across multiple harnesses; a global `sp-implementer` header would be OpenCode-specific and would degrade other integrations. Rejected alternative: replace `Subagent (general-purpose)` with `sp-implementer` everywhere.
- **Keep one prompt template.** Rationale: the implementer behavior contract is identical across harnesses; only the subagent target differs. Rejected alternative: add a separate OpenCode-only implementer template, which would duplicate content and invite drift.
- **Limit the change to SDD implementer dispatch.** Rationale: the user problem concerns OpenCode's implementer integration, not review behavior. Rejected alternative: change reviewer dispatches or broader SDD execution behavior.

## Verification

- Read the changed files and confirm `sp-implementer` appears only as an OpenCode-specific implementer dispatch instruction.
- Confirm `Subagent (general-purpose)` remains available for non-OpenCode implementer dispatch.
- Confirm reviewer templates still use their existing dispatch targets.
- Run a focused text search for stale `implementer-sp` references and ensure none remain unless intentionally documented as rejected wording.
