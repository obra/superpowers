## Review Focus

Five input classes the spec implies but no task's tests exercise, most likely to bite first:

1. **A path that exists but is not a readable file** — a directory (easy to hit with tab completion) or a file with no read permission. `main` should behave like the missing-file case: one message on stderr, nothing on stdout, exit 1 — not an `IsADirectoryError`/`PermissionError` traceback. The existing missing-file test also never asserts *where* the message goes, so the spec's "message to stderr" is unpinned.
   - Task 3, `test_cli.py::test_unreadable_path_reports_to_stderr`: — `main([tmpdir])`, `main([chmod_000_file])`, and `main(["/no/such/file"])` each return 1, print nothing to stdout, and write a non-empty message to stderr (capture both with `contextlib.redirect_stdout`/`redirect_stderr`).

2. **No path argument, or more than one** — `wordstat` with a bare `main([])` or `main([a, b])`. argparse raises `SystemExit(2)` from inside `main`, so a caller that expects an `int` back gets an exception instead; a person expects a usage message on stderr and a non-zero exit.
   - Task 3, `test_cli.py::test_wrong_argument_count_exits_with_usage`: — `with self.assertRaises(SystemExit) as cm: main([])` asserts `cm.exception.code == 2` and that stderr contains `usage:`; same for `main(["a", "b"])`. (If `main` is instead specified to return, assert `== 2` and no traceback.)

3. **A file that is not valid UTF-8** — any latin-1 or binary file. Reading it raises `UnicodeDecodeError` and the user sees a traceback; expected is the same one-line stderr message and exit 1 as any other unusable input.
   - Task 3, `test_cli.py::test_undecodable_file_reports_error`: — write `b"caf\xe9\xff"` to a temp file, assert `main([path])` returns 1 with a message on stderr and no traceback escaping.

4. **Real-world whitespace: tabs, runs of spaces, leading/trailing blanks, blank interior lines, CRLF endings** — every counter test uses single spaces and bare `\n`. The spec says "whitespace-separated" and gives a trailing-newline rule, so a naive `text.split(" ")` or `text.split("\n")` passes the current tests and still miscounts an ordinary file.
   - Task 1, `test_counter.py::test_counts_ignore_whitespace_shape`: — `count_words("  the\tquick \n brown  fox  ")` == 4; `count_words("   ")` == 0; `count_lines("a\r\nb")` == 2; `count_lines("a\n\nb")` == 3; `count_lines("\n")` == 1; `count_lines("a")` == 1; `count_chars("a\tb\n")` == 4; `count_chars("héllo")` == 5 (characters, not bytes).

5. **An empty file end to end** — `count_lines("")` is specified as 0, but nothing checks the whole pipeline on a 0-byte file; a user pointed at a freshly created file expects a zeros report and exit 0, not a crash or blank output.
   - Task 3, `test_cli.py::test_empty_file_reports_zeros`: — `main([empty_path])` returns 0 and stdout is exactly `"words: 0\nlines: 0\nchars: 0\n"` (also pins that the report is printed with exactly one trailing newline, which matters when piping to a file).
