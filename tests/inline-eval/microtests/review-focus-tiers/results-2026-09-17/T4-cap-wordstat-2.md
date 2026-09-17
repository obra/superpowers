```markdown
## Review Focus

The spec's behavior list is a vision of the happy path; these are the inputs a
real user hands the tool that no task above exercises, most likely first.

1. **No path argument at all** — `cli.main([])`, i.e. the user runs `wordstat`
   bare. `argparse` raises `SystemExit(2)` from inside `parse_args`, so `main`
   never returns an `int` and callers importing it see an exception instead of an
   exit code. A reasonable person expects the usage message on stderr and a
   non-zero return, not a raised `SystemExit` escaping a function documented as
   returning `int`.
   - *Test to add* — Task 3, step 1, `test_cli.py::test_missing_argument_returns_nonzero`:
     - `main([])` returns a non-zero int (does not raise `SystemExit`), and a usage
       message is written to stderr.

2. **`path` exists but is not a readable regular file** — a directory
   (`main(["."])`) or a file the process cannot read. `open()` raises
   `IsADirectoryError` / `PermissionError`, neither of which is
   `FileNotFoundError`, so an error handler that only catches the missing-file
   case lets a traceback reach the user. The spec's "message to stderr, return 1"
   is the expectation for *any* unreadable path, not just an absent one.
   - *Test to add* — Task 3, step 1, `test_cli.py::test_unreadable_path_returns_1`:
     - `main([tmpdir])` (a directory) prints a message to stderr and returns 1 with
       no traceback; same for a file created with mode `0o000` (skip if running as root).

3. **Real prose whitespace: runs of spaces, tabs, indentation, leading/trailing
   blanks** — e.g. `count_words("  the\tquick  brown \n fox  ")` == 4 and
   `count_words("   \n\t ")` == 0. Only single-space input is tested, so
   `text.split(" ")` passes Task 1's tests while counting empty strings as words
   on every indented or double-spaced line of a real file. A reasonable person
   expects "whitespace-separated tokens" to mean tokens, never empty fragments.
   - *Test to add* — Task 1, step 1, `test_counter.py::test_count_words_whitespace_runs`:
     - `count_words("  the\tquick  brown \n fox  ")` == 4;
       `count_words("   \n\t ")` == 0; `count_words("\n")` == 0.

4. **A completely empty file, end to end** — `main([empty_path])`. Zero-byte
   files are ordinary (freshly created, truncated, piped-out logs), and the
   composed path is untested for them: a formatter or reader that assumes at
   least one line, or a `count_lines` implementation built on `count("\n") + 1`,
   yields `1` or crashes. The expected result is the report `words: 0`,
   `lines: 0`, `chars: 0` on stdout and exit code 0 — an empty file is valid
   input, not an error.
   - *Test to add* — Task 3, step 1, `test_cli.py::test_empty_file_reports_zeros`:
     - `main([empty_path])` prints `"words: 0\nlines: 0\nchars: 0"` and returns 0.

5. **A file that is not valid UTF-8** — a Latin-1 `.txt`, a stray `.pdf`, or any
   binary the user points at by mistake. Text-mode `open()` raises
   `UnicodeDecodeError` mid-read, producing a traceback rather than either of the
   two outcomes the spec sanctions (a report, or a stderr message and exit 1).
   A reasonable person expects the tool to say the file could not be read and
   return 1.
   - *Test to add* — Task 3, step 1, `test_cli.py::test_undecodable_file_returns_1`:
     - write `b"caf\xe9 \xff\xfe"` to a temp file; `main([path])` returns 1 with a
       message on stderr, raising no `UnicodeDecodeError`.
```
