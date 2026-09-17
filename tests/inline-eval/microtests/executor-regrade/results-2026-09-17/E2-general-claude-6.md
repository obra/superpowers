## Fix pass

- **Critical** — `wordstat/cli.py:27`: no `__main__` wiring, so `python3 -m wordstat.cli FILE` exits 0 printing nothing — the shipped "CLI" cannot be run from a command line at all, and its failure mode is a silent success rather than an error.
- **Important** — `wordstat/cli.py:15`: default universal-newline translation collapses CRLF to LF before counting, so any Windows-authored file reports a silently wrong `chars` total (`a\r\nb\r\n` → 4 instead of 6); fix with `newline=""` plus a CRLF regression test.

## Deferred minors

- Final: minor (deferred): `UnicodeDecodeError` escapes the `OSError` handler in `wordstat/cli.py:16`, so a non-UTF-8 file prints a traceback instead of `wordstat: <error>` — the user is still correctly told it failed with a nonzero exit, so this is presentation only.
- Final: minor (deferred): branch history is one combined commit (`56ffbda`) instead of the plan's three per-task commits, so test-first sequencing isn't verifiable from history; no user-visible effect and no rewrite warranted.
