```markdown
## Review Focus

Input classes and failure modes `design.md` implies that no task's tests cover. The
final reviewer should check each of these deliberately against the finished code.

- **Words separated by anything other than a single space** — tabs, newlines, runs of
  spaces, and leading/trailing whitespace: `"whitespace-separated tokens"` means
  `count_words("  a\tb\n c  ")` == 3, so a `split(" ")`-based implementation passes
  Task 1's tests and miscounts every real file.
- **`main([])` with no path argument** — the spec types `main(argv)` as returning an
  `int`; bare `argparse` raises `SystemExit(2)` instead, which no test would catch.
- **`path` names a directory, or an unreadable file** — spec only promises exit 1 for a
  missing file, but a bare `except FileNotFoundError` lets `IsADirectoryError` /
  `PermissionError` escape as a traceback; a mistyped path is the common case.
- **The stderr message on the failure path** — Task 3 asserts only the return code, so
  an implementation that returns 1 silently (or writes the error to stdout) passes.
- **Exact stdout bytes on success** — the report has no trailing newline and `print`
  adds exactly one, so stdout is `report + "\n"`; "prints the expected report" admits a
  doubled or missing final newline.
- **Non-ASCII file content** — `count_chars` counts characters, not bytes, so `"héllo"`
  is 5; this also pins that the CLI decodes the file as UTF-8 text rather than relying on
  a locale-dependent default encoding.
- **An empty file end-to-end** — `count_lines("")` == 0 is unit-tested, but nothing
  checks the CLI renders `"words: 0\nlines: 0\nchars: 0"` and still exits 0.
- **`count_chars` on text containing newlines** — "including whitespace" means newlines
  count: `count_chars("a\nb\n")` == 4; only space-and-letter inputs are tested.
- **Blank and interior-empty lines** — `count_lines("a\n\nb\n")` == 3 and
  `count_lines("\n")` == 1 follow from the trailing-newline rule but are untested.
- **CRLF line endings** — `"a\r\nb\r\n"` is 2 lines, and the `\r` characters count
  toward `count_chars`.
- **`format_report` given a dict missing a key or holding non-int values** — the spec
  fixes the key set `{words, lines, chars}` and says nothing about violations; confirm
  the failure is a clean `KeyError` rather than a partially-rendered report.
```
