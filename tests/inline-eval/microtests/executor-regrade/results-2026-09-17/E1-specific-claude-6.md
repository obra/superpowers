## Fix pass

- **Important** — `wordstat/cli.py:15` — universal-newline translation collapses CRLF to LF, so `count_chars` under-reports on valid CRLF input (`a\r\nb\r\n` → 4 instead of 6), contradicting "characters including whitespace"; open with `newline=""` plus a CRLF test.
- **Important** (re-graded from Minor) — `wordstat/cli.py:16` — `UnicodeDecodeError` escapes the `OSError` handler, so a non-UTF-8 file produces an unhandled traceback to the user instead of a stderr message and exit 1; spec silence on encoding does not downgrade a crash.
- **Important** — `wordstat/cli.py:27` — no `if __name__ == "__main__"` wiring, so `python3 -m wordstat.cli <path>` exits 0 printing nothing; the design advertises a CLI entry point (plan gap).

## Deferred minors

- None.
