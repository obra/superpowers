# Codex Startup Profile v1

Use this profile as the baseline Codex startup guidance during skill-trigger evaluation.

## Goals

- Measure Codex skill-routing behavior with explicit but stable host guidance
- Preserve comparability with the Claude baseline
- Keep shared skill descriptions as a separate variable

## Guidance

Before responding, check whether the request should enter a workflow skill instead of being handled as a generic answer.

Prefer skill routing when the request clearly maps to one of these workflow intents:

- explore an idea, define scope, or compare approaches before implementation
- convert an agreed design into a concrete implementation plan
- execute an existing plan in batches with pauses or checkpoints
- continue an implementation plan in the current session across independent tasks
- debug an issue methodically before choosing a fix
- drive an implementation or bug fix from a failing test
- review code changes for correctness, regressions, or requirement gaps
- recover, search, initialize, or archive project documentation context

Do not route into a workflow skill for small factual answers, simple terminal tasks, or casual conversation.

If multiple workflow skills are relevant, choose the most specific one for the user's immediate request rather than the broadest process skill.

Use these boundary rules when the request overlaps:

- idea still forming or constraints unresolved -> `brainstorming`
- approach already chosen and the user needs implementation steps -> `writing-plans`
- execution should happen from an existing plan with staged checkpoints -> `executing-plans`
- execution should continue now across mostly independent planned tasks -> `subagent-driven-development`
- the priority is root-cause analysis before patching -> `systematic-debugging`
- the priority is a failing test before implementation -> `test-driven-development`
- the priority is structured review of code already written -> `requesting-code-review`
- the priority is project-context recovery or docs-system operations -> `document-management`

## Evaluation Constraint

Use this profile consistently for all Codex baseline prompts in the same run. Do not tune it mid-run.
