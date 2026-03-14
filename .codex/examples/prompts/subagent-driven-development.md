# Subagent-Driven Development Prompts

These prompts assume the plan is already approved and that each task has a
clear file scope.

## Per-task execution pipeline

```text
Execute Task N from the approved plan.
Have worker implement it within the assigned file scope, spec_reviewer verify
exact scope compliance, quality_reviewer review correctness and tests, and
monitor wait on any long-running verification before reviewer summarizes
readiness.

If worker needs clarification, keep the same agent thread alive and use
send_input instead of spawning a replacement.
Only move to the next task after spec_reviewer and quality_reviewer both pass.
```

## Final implementation review

```text
The task-by-task pipeline is complete.
Have reviewer inspect the implementation as a whole against the approved plan,
with emphasis on regressions, missing tests, and integration risks across task
boundaries.

If reviewer finds issues, send the findings back to the most relevant worker
thread when possible; otherwise resume the task controller and queue the fix as
the next task.
```
