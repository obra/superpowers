---
description: "Compatibility shim for legacy brainstorming command usage"
---

This command is a compatibility shim.

Use `superpowers workflow phase` to report the current phase before routing work.

- If the current phase is brainstorming, continue with `superpowers:brainstorming`.
- If another workflow phase owns the next step, route to that supported surface instead of forcing brainstorming from a legacy command alias.
