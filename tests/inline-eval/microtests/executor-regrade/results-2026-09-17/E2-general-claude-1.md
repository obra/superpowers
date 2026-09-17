## Fix pass

- **Important** — `wordstat/cli.py:15`: universal-newline translation silently drops `\r`, so `chars` undercounts CRLF files (`a\r\nb\r\n` → 4 instead of 6); open with `newline=""` and add a CRLF regression test.
- **Important** — `wordstat/cli.py:16`: `UnicodeDecodeError` escapes the `OSError` handler, so pointing the tool at a non-UTF-8 or binary file dumps a raw traceback instead of the specified stderr message + exit 1 — re-graded up from the reviewer's Minor, which graded the spec's silence on encoding rather than the crash a real user hits.
- **Important** — `wordstat/cli.py:27`: no `if __name__ == "__main__"` wiring, so `python3 -m wordstat.cli FILE` exits 0 printing nothing — the advertised CLI silently no-ops; add the entry point and a subprocess test.

## Deferred minors

- Final: minor (deferred): branch history is one combined commit (`56ffbda`) instead of the plan's three per-task commits, so test-first sequencing isn't verifiable — reviewer confirms no history rewrite is warranted.
