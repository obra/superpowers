## Fix pass

- **Critical** — `wordstat/cli.py:27` — No `if __name__ == "__main__"` block: `python3 -m wordstat.cli FILE` exits 0 and prints nothing, so the advertised CLI cannot be run at all and fails silently rather than visibly. (Reviewer: Important; upgraded — the product's only user-facing surface is inoperable.)
- **Important** — `wordstat/cli.py:15` — Universal-newline translation collapses CRLF to LF before counting, so any Windows-authored file reports a silently wrong `chars` total (`a\r\nb\r\n` → 4, not 6), contradicting "characters including whitespace."
- **Important** — `wordstat/cli.py:16` — `UnicodeDecodeError` escapes the `OSError` handler, so pointing wordstat at a latin-1 or binary file emits a raw traceback instead of the designed stderr message + exit 1. (Reviewer: Minor because the spec is silent on encoding errors — that grades the spec, not the effect; an uncaught crash on plausible real input is the same class of failure the spec already handles for missing files.)

## Deferred minors

- `Final: minor (deferred): branch has one combined commit (56ffbda) instead of the plan's three per-task commits, so test-first sequencing isn't verifiable from history; no effect on shipped behavior and no rewrite warranted.`
