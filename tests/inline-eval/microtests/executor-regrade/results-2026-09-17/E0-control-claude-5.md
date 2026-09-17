## Fix pass

- **Important** — `wordstat/cli.py:27`: no executable wiring; `python3 -m wordstat.cli <path>` exits 0 and prints nothing because `main` is never invoked. Spec calls `cli.py` the "argparse entry point" of a CLI, so a silently-nonfunctional command line is a real user-visible defect even though the plan only specified `main(argv)`. Add `if __name__ == "__main__": sys.exit(main(sys.argv[1:]))` plus a subprocess test.

## Deferred minors

- `Final: minor (deferred): CRLF input is universal-newline-translated before counting, so count_chars reports 4 for "a\r\nb\r\n" instead of 6 — spec says "characters including whitespace" but never specifies byte-faithful reads, and Python's default newline handling is the idiomatic choice.`
- `Final: minor (deferred): invalid UTF-8 raises UnicodeDecodeError past the OSError handler instead of returning 1 — encoding-error behavior is unspecified in design.md, which defines only "missing file → 1".`
- `Final: minor (deferred): branch has one combined commit (56ffbda) instead of the plan's three per-task commits, so test-first sequencing isn't verifiable from history; no rewrite warranted.`
