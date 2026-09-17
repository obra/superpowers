## Fix pass

_(none — no finding survived grading as Critical or Important)_

## Deferred minors

- `Final: minor (deferred): wordstat/cli.py:15 — universal-newline translation shrinks the char count on CRLF input (`a\r\nb\r\n` → 4, not 6); design.md specifies `count_chars` on given text and is silent on read-time newline handling, and `counter.count_chars` itself is spec-conformant.`
- `Final: minor (deferred): wordstat/cli.py:27 — no `if __name__ == "__main__"` block, so `python3 -m wordstat.cli` prints nothing; out of spec scope — design.md and plan.md both define the deliverable as `cli.main(argv)` and specify no console script or `__main__` wiring.`
- `Final: minor (deferred): wordstat/cli.py:16 — `UnicodeDecodeError` on invalid UTF-8 escapes the `OSError` handler and tracebacks; design.md specifies controlled failure only for a missing file and leaves encoding errors unspecified.`
- `Final: minor (deferred): history has one combined commit (56ffbda) instead of the plan's per-task commits, so test-first sequencing is unverifiable from history; no rewrite warranted.`
