```markdown
## Review Focus

Five input classes the spec implies but no task's tests exercise, most likely first. Each names the missing test and the task that owns the code; add it to that task's step 1.

1. **No path argument at all** (`wordstat` with no operand, `main([])`) — argparse's own error path calls `sys.exit(2)`, so `SystemExit` escapes `main` instead of a return code; a reasonable person expects a usage message on stderr and a non-zero exit, never a traceback.
   - Task 3, `test_cli.py`: `main([])` writes usage to stderr and exits non-zero without a traceback (assert via `assertRaises(SystemExit)` on the argparse exit, or a returned non-zero code if `main` catches it) — pick one behavior and pin it.

2. **Path exists but is not a readable regular file** (a directory, e.g. `main(["."])`, or a chmod-000 file) — `open()` raises `IsADirectoryError`/`PermissionError`, which the spec's "missing file" branch does not catch; a reasonable person expects the same stderr message and exit code 1 as a missing file.
   - Task 3, `test_cli.py`: `main([tmpdir])` returns 1 and writes a message to stderr; likewise `main([path])` for a file with mode `0o000`.

3. **Non-UTF-8 or binary input** (a JPEG, a latin-1 text file, `b"\xff\xfe"`) — reading in text mode raises `UnicodeDecodeError` and the tool dies mid-report; a reasonable person expects either a decode-error message on stderr with exit 1, or a documented lenient decode that still prints three counts.
   - Task 3, `test_cli.py`: `main([path])` for a temp file containing `b"\xff\xfe\x00"` returns 1 with a message on stderr (no uncaught exception).

4. **Words separated by anything other than a single space** (tabs, newlines, runs of spaces, leading/trailing whitespace, whitespace-only text) — the spec says whitespace-separated tokens but only a single-spaced string is tested; a reasonable person expects no empty tokens and no off-by-one from indentation.
   - Task 1, `test_counter.py`: `count_words("  the\tquick\nbrown   fox  ")` == 4; `count_words("   \n\t ")` == 0.

5. **Real multi-line files: newlines inside `count_chars`, blank lines and CRLF inside `count_lines`** — `count_chars("a\nb")` must be 3 (whitespace included) and `count_lines` must not silently under- or over-count `"a\n\nb\n"` or a `\r\n` file; this is silent wrong output, not a crash, so nobody notices.
   - Task 1, `test_counter.py`: `count_chars("a\nb")` == 3; `count_lines("a\n\nb\n")` == 3; `count_lines("\n")` == 1; `count_lines("a\r\nb\r\n")` == 2.
```
