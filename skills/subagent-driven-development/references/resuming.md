# Resuming From an Existing Ledger

Part of superpowers:subagent-driven-development. This plan's workspace
already has a ledger at `<workspace>/progress.md`.

Ignore any stray ledger at `.superpowers/sdd/progress.md`. Check
`<workspace>/progress.md`'s first line: if it names a different plan file,
it is another plan's progress — leave it in place and resolve a separate
workspace/ledger.

When the first line names your plan file:
- If its last line is exact line `finish`, it is a completed prior run
  — overwrite `<workspace>/progress.md` with a fresh
  `# SDD ledger — plan: <plan file path>` header and start from Task 1.
- Otherwise, tasks with a `Task <N>: complete` line are DONE — resume at
  the first task without one (or next round if the last line is a fix
  round).
