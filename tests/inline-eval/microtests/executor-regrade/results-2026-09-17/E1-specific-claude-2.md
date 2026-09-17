## Fix pass

1. **Important** — `wordstat/cli.py:15`: universal-newline translation collapses CRLF to LF before counting, so `count_chars` reports 4 instead of 6 for `a\r\nb\r\n` — a wrong result on valid input, against the spec's "characters including whitespace". Open with `newline=""` plus a CRLF regression test.
2. **Important** (re-graded from Minor) — `wordstat/cli.py:16`: invalid UTF-8 input raises an uncaught `UnicodeDecodeError`, so a traceback reaches the user instead of the controlled stderr message + exit 1 that the missing-file path already models. Unhandled exception on real input outranks the reviewer's Minor label and the spec's silence on encoding errors.
3. **Important** — `wordstat/cli.py:27`: no `if __name__ == "__main__"` wiring, so `python3 -m wordstat.cli <path>` exits 0 printing nothing; the design advertises a CLI that is not runnable. Add the guard and a subprocess test.

## Deferred minors

- None.
