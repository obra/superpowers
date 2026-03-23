---
description: "Compatibility shim for legacy plan-writing command usage"
---

This command is a compatibility shim.

Use `superpowers-workflow handoff` to inspect the current phase and any current approved-plan handoff context before routing plan work.

- If the current phase shows that plan writing is the next supported step, continue with `superpowers:writing-plans`.
- If the handoff surface points to a different approved workflow stage, route there instead of treating this legacy alias as an alternate entrypoint.
