## Fix pass

_(none — no finding cleared the Critical/Important gate)_

## Deferred minors

- Final: minor (deferred): `wordstat/cli.py:15` reads with universal newlines, so CRLF input counts 4 chars instead of 6 — `count_chars`'s spec'd contract is over the string, and design.md specifies no read-time newline mode.
- Final: minor (deferred): `wordstat/cli.py:27` has no `if __name__ == "__main__"` wiring, so `python3 -m wordstat.cli` prints nothing — design.md's spec of record is `cli.main(argv) → int`, which is fully implemented, and neither design.md's layout nor plan.md Task 3 asks for a runnable command.
- Final: minor (deferred): `wordstat/cli.py:16` lets `UnicodeDecodeError` escape the `OSError` handler, so invalid UTF-8 tracebacks instead of returning 1 — encoding-error behavior is unspecified in design.md.
