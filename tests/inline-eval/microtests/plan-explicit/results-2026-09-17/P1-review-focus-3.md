## Review Focus

Input classes and failure modes `design.md` implies that no task's tests cover — check each deliberately:

- `main([])` with no path argument: argparse's own error path exits via `SystemExit(2)` rather than returning an int, so the spec's "`main(argv)` → int" contract is silently broken for the commonest user mistake — decide and verify whether it propagates or is converted to a returned exit code.
- Missing file: the spec requires a *message to stderr*; Task 3 only asserts the return code, so confirm something is actually written to stderr, that stdout stays empty, and that no traceback escapes.
- `path` naming a directory: `open()` raises `IsADirectoryError`, not `FileNotFoundError` — an `except FileNotFoundError` implementation crashes with a traceback where the spec implies the error branch (message, exit 1).
- Unreadable file (exists but permission denied): same class as above — `PermissionError` must reach the error branch, not a traceback.
- Empty file end-to-end: implies `words: 0\nlines: 0\nchars: 0` and exit 0; only the empty *string* is unit-tested, never the empty-file path through `cli`.
- Runs of whitespace, tabs, and leading/trailing whitespace (`"  a\tb \n"`): "whitespace-separated tokens" implies 2, but a `split(" ")`-based implementation yields empty tokens and over-counts.
- Whitespace-only text (`"   "`, `"\n\n"`): implies 0 words; distinct from `""` and easy to get wrong alongside the split bug above.
- `count_lines("\n")` and `count_lines("a\n\n")`: the spec suppresses *one* trailing newline only, implying 1 and 2 respectively — an implementation using `splitlines()` or a blanket `rstrip("\n")` diverges on the blank-line-terminated case.
- `count_chars` on text containing newlines (`"a\nb"` → 3) and on `""` → 0: "including whitespace" implies newlines count, but neither is exercised, so a `strip()`-happy implementation passes the existing tests.
- Non-ASCII text (e.g. `"héllo"`, emoji): implies characters, not bytes — verify the file is read as text with an explicit/consistent encoding and `count_chars` counts code points.
- Binary or non-UTF-8 file: `UnicodeDecodeError` on read is unhandled by both spec branches; confirm it degrades to a stderr message and exit 1 rather than a traceback.
- CRLF-terminated text: `"a\r\nb\r\n"` should give 2 lines and not leave `\r` inside tokens.
- `format_report` output shape: field order must be fixed `words`/`lines`/`chars` regardless of dict insertion order (a `for k in stats` implementation passes the single canonical-dict test), and the returned string must have no trailing newline — so `cli`'s stdout is exactly the report plus `print`'s newline.
