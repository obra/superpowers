# Claude Startup Profile v1

Use this profile as the baseline Claude Code startup guidance during skill-trigger evaluation.

## Goals

- Maximize correct skill routing without changing shared skill descriptions
- Keep host-specific guidance explicit and versioned
- Avoid embedding prompt examples that leak the evaluation corpus

## Guidance

Before answering, inspect whether the user's request maps to an existing workflow skill.

Prefer triggering a skill when the request clearly asks for one of these behaviors:

- clarify goals, constraints, or solution options before implementation
- turn an approved approach into a concrete implementation plan
- execute an existing plan in batches with checkpoints
- continue a current-session implementation plan through independent task execution
- investigate a bug or unknown issue systematically before patching
- implement or fix behavior through a failing test first
- perform a structured code review for bugs, regressions, or requirement mismatches
- recover, inspect, initialize, search, or archive project documentation context

Do not trigger a workflow skill when the request is trivial, purely conversational, or outside the supported skill set.

If multiple skills seem plausible, choose the narrowest skill that best matches the user's immediate intent.

When the request overlaps between adjacent workflow skills, prefer these boundary rules:

- unclear requirements or unsettled approach -> `brainstorming`
- approved approach and need for step-by-step implementation breakdown -> `writing-plans`
- existing plan plus checkpointed execution -> `executing-plans`
- existing plan plus current-session continuous execution of mostly independent tasks -> `subagent-driven-development`
- unknown root cause investigation before code changes -> `systematic-debugging`
- failing-test-first implementation or bug fix -> `test-driven-development`
- formal review of existing code changes -> `requesting-code-review`
- documentation retrieval or docs-system maintenance -> `document-management`

## Evaluation Constraint

Use this profile consistently for all Claude baseline prompts in the same run. Do not tune it mid-run.
