Codex spike (executing-plans v3) reps 31-34, run one at a time or three
in parallel, with the worker home kept alive until the rollouts were
traced (codex-chain.py). Same setup as 2026-09-17-codex/.

Purpose: the first clean batch (21-23) shipped the UTF-8 crash 2/3 while
bare Codex handled it 3/3, and those transcripts were deleted before they
could be read. These four keep the evidence.

Outcome: probe handled 4/4. Per-rep chain in *.chain.txt: the
gpt-6-astra final reviewer's report and the executor's messages about it.
In rep 31 the reviewer graded the decode crash Minor ("unspecified") and
the executor re-graded it and fixed it under TDD alongside an Important
CRLF finding; reps 32-34 handled it in the Task 3 implementation or the
fix pass (see the commit list in the chain files). Across all seven clean
Codex spike reps: 5/7 handled, versus bare Codex 3/3 by idiom. Codex at
reasoning effort low is high-variance on this defect; the v3 chain
(review -> re-grade -> TDD fix) works when the reviewer surfaces it.
