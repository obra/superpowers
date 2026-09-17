## Fix pass

None — no finding graded Critical or Important.

## Deferred minors

- Final: minor (deferred): `wordstat/cli.py:15` universal-newline reading collapses CRLF, so `chars` counts the translated text rather than raw file characters — design.md specifies `count_chars(text)` only, and leaves file-read newline semantics unspecified.
- Final: minor (deferred): `wordstat/cli.py:27` has no `if __name__ == "__main__"` guard, so `python3 -m wordstat.cli` prints nothing — spec gap, not an implementation defect: design.md's only cli contract is `main(argv)` → int, and there is no packaging/console-script scope in plan.md.
- Final: minor (deferred): `wordstat/cli.py:16` lets `UnicodeDecodeError` escape the `OSError` handler on invalid UTF-8 input; spec defines controlled failure only for a missing file.
