## Review Focus

Input classes and failure modes the design implies but no task's specified tests
exercise. A final reviewer should check each one deliberately.

- **`main([])` with no path argument** — argparse's own error path exits with `SystemExit(2)`, not a return of 1; confirm the design's "return an int" contract either holds or is knowingly delegated to argparse, and that `main` doesn't leak a bare traceback.
- **`path` naming a directory** — reading it raises `IsADirectoryError`, not `FileNotFoundError`; the design's single "missing file" branch must cover every unreadable path (directory, permission denied) with a stderr message and return 1, not just the nonexistent case.
- **Non-UTF-8 / binary file contents** — `open().read()` raises `UnicodeDecodeError` under the default text mode; the design says nothing about encoding, so verify the failure is handled (stderr + 1) rather than crashing.
- **Whitespace other than a single space in `count_words`** — tabs, newlines, runs of spaces, and leading/trailing whitespace; "whitespace-separated tokens" implies `split()` semantics, and a whitespace-only string must be 0, not 1.
- **Error text on stderr, report on stdout** — the design separates the two streams and Task 3's test only asserts the return code; confirm nothing writes the error to stdout or the report to stderr.
- **Empty file end-to-end** — a 0-byte file is a success case: `words: 0 / lines: 0 / chars: 0` printed, return 0, no "missing file" confusion between "empty" and "absent".
- **`count_lines` on a single line with no newline, and on interior blank lines** — `"a"` implies 1, and `"a\n\nb"` implies 3; only the trailing-newline rule is pinned by the tests, and a naive `split("\n")` or `count("\n")` gets one of these wrong.
- **Whether `count_chars` counts the file's trailing newline** — the design says "including whitespace", so a file ending in `\n` counts it; reviewers should confirm counter and CLI don't silently strip it, and that counts are characters (not bytes) for multibyte text.
- **`format_report` key order and missing/extra keys** — output order is fixed `words, lines, chars` regardless of dict insertion order, and the design leaves unspecified what a stats dict missing a key does; a `KeyError` escaping to the CLI would surface as a traceback.
- **Report has no trailing newline; `print` adds one** — verify the CLI emits exactly one trailing newline, not two or zero, since the formatter's contract string ends at `chars: 57`.
