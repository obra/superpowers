```markdown
## Review Focus

Input classes and failure modes `design.md` implies that no task's tests cover — check each deliberately:

- **Words separated by tabs, newlines, or runs of spaces** — the spec says "whitespace-separated tokens", but every test uses single spaces; `count_words("a\tb\nc")` must be 3 and `count_words("a  b")` must be 2, which rules out `text.split(" ")`.
- **Whitespace-only text** — `count_words("   ")` and `count_words("\n\n")` must be 0, not 1 or 3; only the empty string is tested.
- **Real multi-line file through the CLI** — Task 3's test uses one temp file; confirm a file with several lines, blank lines, and a trailing newline yields word/line/char counts consistent with the three `counter` rules rather than off-by-one lines.
- **Missing file: stream and message** — spec requires the message on *stderr* and return 1; the plan tests only the return code, so check nothing is printed to stdout and no traceback escapes.
- **Path that exists but is not a readable file** — a directory or a permission-denied path raises `IsADirectoryError`/`PermissionError`, not `FileNotFoundError`; the spec's "missing file → stderr, return 1" intent implies these must not crash with a traceback.
- **`count_chars` counting newlines** — "including whitespace" means `count_chars("a\nb")` == 3; tests only exercise strings without newlines, so a line-stripping read path would go unnoticed.
- **File whose bytes are not valid UTF-8** — reading with the default text codec raises `UnicodeDecodeError`; the spec's "read that file" gives no crash budget, so this should fail as a stderr message and exit 1, not a traceback.
- **Empty file** — end-to-end result must be `words: 0` / `lines: 0` / `chars: 0` and exit 0; the empty-string unit cases are tested but the empty-file path is not.
- **No positional argument, or two of them** — spec says "a single positional `path`"; argparse raises `SystemExit(2)` rather than returning an int, so verify `main([])` behaves sanely and callers of `main` aren't promised a return value they won't get.
- **Exact stdout shape** — `format_report` returns a 3-line string with no trailing newline and `print` adds exactly one; check for a doubled trailing blank line.
- **CRLF line endings** — `"a\r\nb\r\n"` should report 2 lines, and char count should reflect whatever the read mode leaves in the string (universal newlines translates `\r\n` to `\n`); pick one and be consistent.
- **Non-ASCII text** — `count_chars` counts characters, not bytes; `count_chars("héllo")` == 5.
- **`format_report` given a stats dict with a missing or extra key** — spec defines only the three-key input, so a `KeyError` here is acceptable, but confirm the CLI always constructs the full dict.
```
