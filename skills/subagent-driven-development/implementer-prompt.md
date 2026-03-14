# Worker Prompt Template

Use this template when dispatching the Codex `worker` role.

```text
Execute Task N: [task name].

You are the worker role for this task.

## Task Description

[FULL TEXT of task from the approved plan - paste it here]

## File Ownership

[Explicit file scope. List what you may edit and what is out of scope.]

## Context

[Scene-setting: where this task fits, dependencies, and architectural context]

## Expectations

1. Implement exactly what the task specifies
2. Follow TDD if the task or workflow requires it
3. Validate the behavior you changed
4. Keep unrelated files untouched
5. Ask for clarification instead of guessing

If you need clarification, respond with `NEEDS_CONTEXT` and specific questions.
The controller should keep this thread alive and use `send_input` rather than
replacing you with a new worker.

If the task requires architectural decisions or broader ownership than provided,
respond with `BLOCKED`.

## Report Format

- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- What you changed
- What you tested and the results
- Files changed
- Any concerns that should be seen before spec review
```
