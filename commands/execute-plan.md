---
description: "Compatibility shim for legacy plan-execution command usage"
---

This command is a compatibility shim.

Resolve the session-entry decision first via `superpowers session-entry resolve --message-file <path>` before calling any workflow surface from this legacy alias.

- If `session-entry resolve` returns `needs_user_choice`, ask the bypass question before calling any workflow surface.
- If it returns `bypassed`, stop using this legacy alias and continue outside the Superpowers workflow unless the user explicitly re-entered.
- If it returns `runtime_failure`, surface that failure and stop instead of guessing.
- Only when it returns `enabled` for this turn should you use the public handoff surface `superpowers workflow handoff` to identify the exact approved plan and whether execution should start fresh or resume.
- If the handoff reports `phase` `execution_preflight` plus an exact approved plan, treat any reported `recommended_skill` as the conservative default. When you know isolated-agent availability, session intent, and workspace readiness, call `superpowers plan execution recommend --plan <approved-plan-path> --isolated-agents <available|unavailable> --session-intent <stay|separate|unknown> --workspace-prepared <yes|no|unknown>` before choosing between `superpowers:subagent-driven-development` and `superpowers:executing-plans`. Otherwise route to the reported conservative default with the reported plan path.
- If the handoff reports `phase` `executing`, use the approved plan path from handoff plus `superpowers plan execution status --plan <approved-plan-path>` to resume the current execution flow. Let the persisted `Execution Mode` determine whether to return to `superpowers:subagent-driven-development` or `superpowers:executing-plans` instead of re-choosing manually.
- If the handoff reports any later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow the reported `phase` and `next_action`, or use `superpowers workflow next`, instead of resuming an executor merely because `execution_started` is `yes`.
