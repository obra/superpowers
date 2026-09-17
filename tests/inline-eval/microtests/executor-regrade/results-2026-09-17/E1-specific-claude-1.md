## Fix pass

- **Important** — `wordstat/cli.py:15`: universal-newline translation collapses CRLF to LF before counting, so `count_chars` under-reports on valid CRLF input (`a\r\nb\r\n` → 4 instead of 6), contradicting "characters including whitespace"; open with `newline=""` and add a CRLF regression test.
- **Important** (re-graded from Minor) — `wordstat/cli.py:16`: `UnicodeDecodeError` escapes the `OSError` handler, so a non-UTF-8 file produces an unhandled traceback to the user instead of a stderr message and exit 1. Unhandled exception reaching the user overrides the "spec doesn't specify encoding errors" excuse.
- **Important** — `wordstat/cli.py:27`: no `if __name__ == "__main__"` wiring, so `python3 -m wordstat.cli <path>` exits 0 printing nothing; the design advertises a CLI, so the runnable command is in scope even though plan.md omitted the wiring.

## Deferred minors

- None. (The only Minor filed was re-graded into the fix pass; the one-commit-instead-of-three history note in Recommendations is not a code finding and needs no action per the reviewer.)
