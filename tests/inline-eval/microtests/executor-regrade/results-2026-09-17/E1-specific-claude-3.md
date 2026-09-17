## Fix pass

- **Important** — `wordstat/cli.py:16` — Invalid UTF-8 input raises an unhandled `UnicodeDecodeError` that escapes the `OSError` handler and dumps a traceback to the user instead of a stderr message and exit 1 (reviewer labeled Minor; re-graded up — unhandled exception, traceback reaching the user).
- **Important** — `wordstat/cli.py:15` — Universal-newline translation makes `count_chars` wrong on valid input: CRLF file `a\r\nb\r\n` reports `chars: 4` instead of 6, contradicting design.md's "characters including whitespace"; open with `newline=""` and add a CRLF regression test.

## Deferred minors

- `wordstat/cli.py:27` — No `if __name__ == "__main__"` wiring, so `python3 -m wordstat.cli PATH` prints nothing; the specified `main(argv)` contract is fully met and design.md's package layout lists no `__main__.py` or console-script entry point, so this is a spec addition rather than a defect.
