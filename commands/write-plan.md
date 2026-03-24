---
description: "Compatibility shim for legacy plan-writing command usage"
---

This command is a compatibility shim.

Resolve the session-entry decision first via `superpowers session-entry resolve --message-file <path>` before calling any workflow surface from this legacy alias.

- If `session-entry resolve` returns `needs_user_choice`, ask the bypass question before calling any workflow surface.
- If it returns `bypassed`, stop using this legacy alias and continue outside the Superpowers workflow unless the user explicitly re-entered.
- If it returns `runtime_failure`, surface that failure and stop instead of guessing.
- Only when it returns `enabled` for this turn should you use `superpowers workflow handoff` to inspect the current phase and any current approved-plan handoff context before routing plan work.
- If the current phase shows that plan writing is the next supported step, continue with `superpowers:writing-plans`.
- If the handoff surface points to a different approved workflow stage, route there instead of treating this legacy alias as an alternate entrypoint.
