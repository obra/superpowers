## Fix pass

- **Important** — `wordstat/cli.py:16`: invalid UTF-8 input raises an unhandled `UnicodeDecodeError`, dumping a traceback to the user instead of the spec'd "message to stderr, return 1" failure path (re-graded up from reviewer's Minor: an unhandled exception reaching the user is Important regardless of the spec's silence on encoding).
- **Important** — `wordstat/cli.py:15`: universal-newline translation shrinks the character count (CRLF input `a\r\nb\r\n` reports `chars: 4`, not 6), a wrong result on valid input versus "number of characters including whitespace"; open with `newline=""` and add a CRLF test.
- **Important** — `wordstat/cli.py:27`: no `__main__` wiring, so `python3 -m wordstat.cli <path>` exits 0 printing nothing — the advertised CLI silently does nothing when invoked as a command (plan gap; spec describes a CLI).

## Deferred minors

- None.
