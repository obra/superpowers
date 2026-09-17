## Review Focus

Input classes and failure modes the spec implies that no task's tests exercise. The reviewer should check each deliberately.

- **A file whose content ends with a trailing newline** — the common real case; spec pins `count_lines` (no empty final line) but no test feeds such content through `cli`, so end-to-end `lines` is unverified and `chars` must still include that newline.
- **`path` naming a directory** — spec only promises "missing file → stderr + 1"; a directory raises `IsADirectoryError` (not `FileNotFoundError`), so a bare `except FileNotFoundError` crashes with a traceback instead of the specified error path.
- **`main([])` with no positional argument** — spec says parse a single positional `path`; argparse's own failure raises `SystemExit(2)` rather than returning an int, so callers of `main` see an exception, not a return code.
- **The stderr message itself on a missing file** — spec requires a message to stderr *and* nothing meaningful on stdout; a test asserting only `== 1` passes even if the program is silent or writes the error to stdout.
- **A non-UTF-8 / binary file** — reading in text mode raises `UnicodeDecodeError`; spec's only defined failure is a missing file, so this must either be handled as an error path or be a deliberate, stated crash.
- **An unreadable (permission-denied) file** — same shape as the directory case: `PermissionError` is not `FileNotFoundError`, and spec implies an error message rather than a traceback.
- **Words separated by tabs, newlines, or runs of spaces, and leading/trailing whitespace** — spec says "whitespace-separated tokens", but only single-space input is tested; `"  a\tb\n c  "` must be 3, which rules out `split(" ")`.
- **Whitespace-only text** — implies `words` 0 but `lines` 1 for `"   "`; the tested `""` case (all zeros) does not distinguish this from a "no content ⇒ no lines" implementation.
- **An empty file, end-to-end** — spec's `count_lines("")` == 0 means the report is `words: 0 / lines: 0 / chars: 0`; only the unit function is tested, not the CLI path over a zero-byte file.
- **`count_chars` on text containing newlines** — spec says "including whitespace", so `"a\nb"` is 3; tests cover only the space case, leaving newline handling (e.g. an accidental `strip()` or line-joined read) unverified.
- **Non-ASCII text** — spec says characters, so `count_chars("héllo")` is 5 code points, not 6 bytes; nothing tests that the file is read as text with a defined encoding rather than bytes.
- **Exact stdout framing** — spec's report is exactly 3 lines with no trailing newline; `print()` adds one, so the reviewer should confirm the CLI emits three lines and not a trailing blank line, and that `format_report` itself returns the unterminated string.
- **`format_report` with zero and wide values** — spec's example shows `"words: 12"`, implying plain `str()` interpolation with no padding, alignment, or thousands separators for `0` or `1234567`.
