## Fix pass

- **Important** (as labeled) — `wordstat/cli.py:15`: universal-newline translation collapses CRLF to LF before counting, so `count_chars` reports a wrong result on valid input (`a\r\nb\r\n` → 4 instead of 6); open with `newline=""` and add a CRLF test.
- **Important** (regraded up from Minor) — `wordstat/cli.py:16`: invalid UTF-8 input raises `UnicodeDecodeError`, escaping the `OSError` handler and putting a traceback in front of the user; catch it, print a concise stderr message, return 1. Spec silence on encoding does not make an unhandled crash minor.
- **Important** (as labeled) — `wordstat/cli.py:27`: no `if __name__ == "__main__"` wiring, so `python3 -m wordstat.cli <path>` silently exits 0 printing nothing despite the design shipping a CLI; add the guard calling `sys.exit(main(sys.argv[1:]))` plus a subprocess test.

## Deferred minors

- Branch has one combined commit (`56ffbda`) instead of the plan's three per-task commits, so test-first sequencing isn't verifiable from history; reviewer confirms no rewrite needed.
