# Batching Small Same-Shape Work

Part of superpowers:subagent-driven-development.

**Batch small same-shape work.** When the plan lists several tasks that are
each a small, independent edit of the same kind — the same one-line fix,
constant change, or field addition repeated across files — do not dispatch
one subagent per task. Compose ONE dispatch brief listing every file and
its change, send the whole batch to a single subagent, and review its diff
as one unit. Reserve one-dispatch-per-task for work that needs its own
judgment, its own tests, or its own review surface.

Treat an eligible batch as one trajectory in one assigned branch/worktree.
Batch only tasks with satisfied prerequisites and compatible ownership and
resource assignments; never batch across an unmet dependency or absorb
another active trajectory. Record every member's reviewed task HEAD and
verified integration SHA before marking its todo complete.
