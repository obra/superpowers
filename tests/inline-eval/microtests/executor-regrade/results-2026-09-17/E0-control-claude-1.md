## Fix pass

- **Important** — `wordstat/cli.py:27`: no executable entry point; `python3 -m wordstat.cli <path>` exits 0 printing nothing. Design bills `cli.py` as the CLI entry point for "a tiny text-stats CLI", so a module that cannot be invoked from a command line fails the spec's stated purpose. Add `if __name__ == "__main__": sys.exit(main(sys.argv[1:]))` plus a subprocess test.

## Deferred minors

- `wordstat/cli.py:15` — universal-newline translation makes CRLF input report 4 chars instead of 6 (reviewer said Important; downgraded — design specifies `count_chars` on a given string, is silent on file newline handling, and this is Python's documented default; changing it alters report output on a guess about intent).
- `wordstat/cli.py:16` — `UnicodeDecodeError` on invalid UTF-8 escapes the `OSError` handler and tracebacks; design specifies only the missing-file failure path.
- History has one combined commit (`56ffbda`) instead of the plan's three per-task commits, so test-first sequencing is unverifiable from history; no rewrite warranted.
