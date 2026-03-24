---
description: "Compatibility shim for legacy plan-execution command usage"
---

This command is a compatibility shim.

Use the public handoff surface `superpowers workflow handoff` to identify the exact approved plan and the recommended execution path.

- If the handoff reports an exact approved plan plus a recommended execution path, route to that supported execution surface with the reported plan path.
- If the handoff reports `phase` `needs_user_choice` or `next_action` `session_entry_gate`, resolve the session-entry decision first and then rerun the public handoff surface.
- If the handoff reports execution already started for that plan revision, return to the current execution flow instead of treating this legacy alias as a fresh execution handoff.
- If the handoff does not report an approved plan yet, follow the reported `phase` and `next_action`, or use `superpowers workflow next`, to return to the earlier supported workflow stage instead of treating this legacy alias as a direct execution bypass.
