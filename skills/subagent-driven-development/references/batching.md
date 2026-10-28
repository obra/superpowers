# Batching Small Same-Shape Work

Part of superpowers:subagent-driven-development.

**Batch small same-shape work.** When the plan lists several tasks that are
each a small, independent edit of the same kind — the same one-line fix,
constant change, or field addition repeated across files — do not dispatch
one subagent per task. Compose ONE dispatch brief listing every file and
its change, send the whole batch to a single subagent, and review its diff
as one unit. Reserve one-dispatch-per-task for work that needs its own
judgment, its own tests, or its own review surface.

An eligible batch is one task dispatch/review unit inside its existing
trajectory, not a new integration unit. Batch only tasks with satisfied
internal prerequisites and compatible ownership/resources; never cross an
unmet dependency or absorb another trajectory. Record each member's
completion and the batch's reviewed range before marking its todo complete.
Their trajectory still integrates only at its recorded completion boundary.
