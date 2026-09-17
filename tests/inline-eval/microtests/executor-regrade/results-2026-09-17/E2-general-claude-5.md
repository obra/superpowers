## Fix pass

- **Critical** — `wordstat/cli.py:27` — No `__main__` wiring: `python3 -m wordstat.cli FILE` exits 0 printing nothing, so the shipped "CLI" silently does nothing on its only shell invocation path; a text-stats tool that produces no output when run is a total failure of purpose, not a spec omission.
- **Important** — `wordstat/cli.py:15` — Universal-newline translation silently undercounts `chars` on CRLF files (`a\r\nb\r\n` → 4 instead of 6); a counting tool reporting wrong numbers with no error is a correctness defect regardless of the spec's silence on newline handling.
- **Important** — `wordstat/cli.py:16` — `UnicodeDecodeError` escapes the `OSError` handler, so any non-UTF-8 input (legacy Latin-1 text, a binary file) yields a raw Python traceback instead of the module's own `wordstat: <error>` line and controlled exit 1. Re-graded up from the reviewer's Minor: the reviewer graded the spec's silence on encoding, not the user-visible crash.

## Deferred minors

- None.
