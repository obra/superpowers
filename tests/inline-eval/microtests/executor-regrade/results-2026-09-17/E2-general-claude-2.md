## Fix pass

- **Critical** — `wordstat/cli.py:27`: no `__main__` wiring, so `python3 -m wordstat.cli <path>` exits 0 and prints nothing — the advertised CLI cannot be run from a terminal at all, and fails silently rather than erroring.
- **Important** — `wordstat/cli.py:15`: universal-newline translation drops `\r` before counting, so any CRLF file silently reports a too-low `chars` total (`a\r\nb\r\n` → 4 instead of 6), contradicting "characters including whitespace".
- **Important** — `wordstat/cli.py:16`: `UnicodeDecodeError` escapes the `OSError` handler, so a non-UTF-8 or binary file produces a raw Python traceback instead of the clean stderr message + exit 1 the missing-file path establishes as the contract (re-graded up from Minor: the reviewer discounted it because the spec is silent on encoding, but the effect on a user is a crash on an ordinary input file).

## Deferred minors

- Final: minor (deferred): branch has one combined commit (`56ffbda`) instead of the plan's three per-task commits, so test-first sequencing isn't visible in history — no user-facing effect, no rewrite warranted.
