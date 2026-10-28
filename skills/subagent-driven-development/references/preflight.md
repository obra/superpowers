# The Pre-flight Scan

Part of superpowers:subagent-driven-development. Run it once, before
dispatching Task 1.

Before dispatching Task 1, scan the plan once for conflicts, writing down
what you checked as you check it:

- tasks that contradict each other or the plan's Global Constraints
- anything the plan explicitly mandates that the review rubric treats as a
  defect (a test that asserts nothing, verbatim duplication of a logic block)
- dependency cycles or prerequisites that are only "implemented", not
  reviewed, integrated, and verified
- parallel tasks sharing files, mutable interfaces, lockfiles, generated
  outputs, ports, databases, or other resources without ownership/isolation
  or serialized access

Record each task's prerequisites, allowed files/interfaces, planned branch
and absolute worktree, resource assignments, and integration checks in the
ledger. Identify independent ready groups explicitly. Shared contracts
belong in a prerequisite; unsafe overlaps require serialization or a
dependent reconciliation task. A preferred merge order is not a dependency.

The scan's output is a table, not a verdict. One row for every pair of tasks
that share a file or an interface: the two tasks, what one produces against
what the other consumes, and what you found. One row for every task: whether
its own text agrees with itself — the tests it specifies against the code it
specifies, the files it creates against the files it later touches. "The scan
is clean" without those rows is not a scan you ran.

Write the table to the ledger. Rule on everything you find before execution
begins — each finding against the plan text that mandates it — and record
each ruling in the ledger. If the scan is clean, proceed without comment.
Rule on each conflict it surfaces — the spec is the binding authority, the
plan is its argument — record the ruling beside its row, and dispatch
Task 1. The review loop remains the net for conflicts that only emerge from
implementation.
