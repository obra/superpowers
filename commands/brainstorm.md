---
description: "Compatibility shim for legacy brainstorming command usage"
---

This command is a compatibility shim.

Resolve the session-entry decision first via `superpowers session-entry resolve --message-file <path>` before calling any workflow surface from this legacy alias.

- If `session-entry resolve` returns `needs_user_choice`, ask the bypass question before calling any workflow surface.
- If it returns `bypassed`, stop using this legacy alias and continue outside the Superpowers workflow unless the user explicitly re-entered.
- If it returns `runtime_failure`, surface that failure and stop instead of guessing.
- Only when it returns `enabled` for this turn should you use `superpowers workflow phase` to report the current phase before routing work.
- If the current phase is `needs_brainstorming` or `brainstorming`, continue with `superpowers:brainstorming`.
- If another workflow phase owns the next step, route to that supported surface instead of forcing brainstorming from a legacy command alias.
