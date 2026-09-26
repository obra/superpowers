# improve-agents run-records

Append-only, one block per round. Fields: date · reviewed/applied/declined ·
already-fixed · duplicates dropped · drift flags · approval-gate slips · upstreamed ·
queue sizes before/after.

- template baseline · agent defs over prompt-decompose's `BODY_LINE_THRESHOLD` (~400) at
  extraction: code-coordinator.md 482, code-implementer.md 401. Ported lessons grew them past
  the line; the next improve-agents round's step 7 will propose a prompt-decompose pass.

- prompt-decompose 2026-09-22 · code-implementer.md 401→366 lines: Steps 0, 2, 3 merged
  into procedures/implementer-preflight.md (105→155, numbered 1–3 ahead of the worktree
  sequence now 4–8); two cross-file refs renumbered. code-coordinator.md 482: not
  decomposable — the excess is Constraints (rules); standing feed for a metalearn pass-4
  consolidation of bullets duplicated across coordinator and implementer.
