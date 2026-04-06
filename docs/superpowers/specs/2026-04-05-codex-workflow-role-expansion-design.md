# Codex Workflow Role Expansion Design

## Goal

Extend Superpowers' native Codex role catalog beyond reviewer-only roles so the
main workflow steps on Codex can use stable, named `superpowers_*` roles rather
than falling back to generic built-ins.

## Problem

Codex support currently becomes fully native only for reviewer-style work:

- `superpowers_reviewer`
- `superpowers_spec_reviewer`
- `superpowers_plan_reviewer`
- `superpowers_doc_reviewer`

That leaves important workflow steps, especially implementation and focused
repository exploration, on generic `worker` or `explorer` roles even when the
behavior Superpowers wants is stable and reusable. The result is weaker role
identity in Codex history, more repeated inline prompting, and less obvious role
mapping for users reading the docs.

## Constraints

- Keep built-in Codex roles as compatibility fallback when a matching native
  Superpowers role is unavailable.
- Do not override built-ins such as `worker` or `explorer`.
- Keep new roles generic to Superpowers workflows rather than project-specific.
- Prefer roles with behavior that can be described clearly and tested
  meaningfully.

## Design

Add three native Codex workflow roles under `.codex/agents/`:

### `superpowers_implementer`

A workspace-write role for one bounded task at a time. It should reinforce the
implementer behavior already described by `subagent-driven-development`:

- read the supplied task and context carefully
- ask questions instead of guessing
- keep changes focused
- run verification before reporting back
- report `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, or `BLOCKED`

This role closes the largest native-role gap in the current Codex workflow
because `subagent-driven-development` currently leaves its implementer on the
built-in `worker` role.

### `superpowers_explorer`

A read-only role for bounded repository questions. Its job is to answer with
concrete evidence from local files or command output and to keep speculation
clearly separated from findings.

This gives Codex a native Superpowers exploration role when a workflow wants
evidence-first repository analysis without drifting into implementation.

### `superpowers_verifier`

A workspace-write role for test execution and verification passes. It should run
the narrowest useful commands, report exactly what was observed, and avoid
claiming success beyond the evidence it actually collected.

This supports verification-oriented dispatch in Codex without overloading the
implementer or reviewer roles.

## Skill and Doc Updates

Update Codex-facing docs so the preferred dispatch model becomes:

- implementer -> `superpowers_implementer`
- spec compliance reviewer -> `superpowers_spec_reviewer`
- code quality reviewer -> `superpowers_reviewer`
- final code reviewer -> `superpowers_reviewer`
- focused repository exploration -> `superpowers_explorer`
- verification/test-only subagent -> `superpowers_verifier`

Built-in `worker`, `explorer`, and `default` remain the fallback path when the
matching native role is not installed.

## Tests

Cover the expansion at three levels:

- catalog test confirms the new TOMLs exist and Codex exposes the full native
  `superpowers_*` role list
- semantic workflow test confirms `subagent-driven-development` now maps the
  implementer to `superpowers_implementer`
- real integration test confirms session metadata captures native workflow role
  usage, including `superpowers_implementer`

## Non-Goals

- replacing Codex built-ins entirely
- introducing domain-specific roles
- locking models or reasoning settings for the new roles

## Validation

- run the new native role catalog test
- run the updated `subagent-driven-development` semantic test
- run the Codex integration test that exercises the implementer and reviewers
