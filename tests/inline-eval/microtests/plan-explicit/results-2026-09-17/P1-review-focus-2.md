## Review Focus

Input classes and failure modes `design.md` implies that no task's tests exercise — check each deliberately:

- **Empty file, end to end** — Task 1 tests `""` per-function, but no test runs `cli.main` on a 0-byte file; the spec implies a clean `words: 0\nlines: 0\nchars: 0` report and exit 0, not a crash or a blank/`words: 1` report.
- **No arguments at all (`main([])`)** — the spec says `main(argv)` parses "a single positional `path`" and returns an int; argparse's default is to print usage and raise `SystemExit(2)`, so confirm the intended behavior for a bare invocation is deliberate rather than an accidental uncaught `SystemExit` escaping `main`.
- **Missing file writes to *stderr*, not stdout** — Task 3 asserts only the `1` return code; the spec explicitly requires the message go to stderr, which means stdout must stay empty on that path.
- **Existing-but-unreadable path (a directory, or a file without read permission)** — the spec names only "missing file → 1", so verify these don't surface as an unhandled `IsADirectoryError`/`PermissionError` traceback; the spec's intent is that a path the tool can't read is a user error, not a crash.
- **Non-UTF-8 bytes in the file** — no test feeds undecodable input; reading text implies a decode step that can raise `UnicodeDecodeError`, and the spec offers no report for that case.
- **Whitespace-only text (`"   \n\t"`)** — "whitespace-separated tokens" implies `count_words` == 0, but a naive `text.split(" ")` returns non-empty tokens; untested by both `""` and `"the quick brown fox"`.
- **Interior blank lines and a lone newline** — the spec's rule is stated only via `"a\nb"`/`"a\nb\n"`; `"a\n\nb"` should be 3 and `"\n"` should be 1, neither of which the trailing-newline test pins down.
- **CRLF line endings (`"a\r\nb\r\n"`)** — the spec counts lines and counts chars "including whitespace"; verify line counting isn't confused by `\r` and that `\r` is counted as a character.
- **`count_chars` over text containing newlines** — every char test uses a single-line string, so nothing pins down that `"a\nb"` == 3 rather than a newline-stripped 2.
- **Multiple/leading/trailing spaces between words (`"  the   fox  "`)** — implies 2 words; the single well-formed word test can't distinguish this from a delimiter-splitting bug.
- **Non-ASCII text** — "number of characters" implies code points, not bytes: `"héllo"` is 5 chars, which a bytes-based read/len would report as 6.
- **Exact stdout shape** — the report is specified as a 3-line string with no trailing newline while `cli` "prints" it; confirm the CLI adds exactly one trailing newline and no extra blank line.
- **`format_report` with an incomplete or differently-ordered stats dict** — the spec fixes the output order as words, lines, chars regardless of insertion order, and says nothing about a missing key (currently a bare `KeyError`).
