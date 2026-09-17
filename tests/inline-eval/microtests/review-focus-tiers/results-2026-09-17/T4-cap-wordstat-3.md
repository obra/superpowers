```markdown
## Review Focus

Five input classes the spec implies but no task's tests exercise, most likely to bite first:

- **Runs of whitespace, tabs, and leading/trailing space in `count_words`.** "Whitespace-separated tokens" means `"  the   quick\tbrown \n fox  "` is 4 words and `" \t\n "` is 0, but the plan only ever feeds single-spaced text, so a `split(" ")` implementation passes Task 1 and then miscounts nearly every real file.
  - Task 1, add to `test_counter.py` (step 1): `count_words("  the   quick\tbrown \n fox  ")` == 4; `count_words(" \t\n ")` == 0.

- **Missing path produces a message, not a traceback.** The spec asks for "message to stderr, return 1"; Task 3 asserts only the return code, so an implementation that lets `FileNotFoundError` escape (or that prints the error to stdout, corrupting a piped report) still goes green while a user sees a stack trace.
  - Task 3, add to `test_cli.py` (step 1): `main(["/no/such/file"])` returns 1 with non-empty stderr mentioning the path, empty stdout, and no exception raised; same for a path that is a directory.

- **Non-ASCII files and the ambient locale.** `count_chars` counts characters, so a UTF-8 file containing `"héllo\n"` must report 6 chars, not 7 bytes; nothing in the plan opens a non-ASCII file, so a bare `open(path)` that inherits a non-UTF-8 default encoding mangles or crashes on ordinary accented text.
  - Task 3, add to `test_cli.py` (step 1): write `"héllo wörld\n"` to a temp file as UTF-8, assert `main([path])` prints `"words: 2\nlines: 1\nchars: 12"` and returns 0.

- **Blank lines and newline-only text in `count_lines`.** The trailing-newline rule is tested only on `"a\nb\n"`; a reasonable person expects `"a\n\nb"` == 3, `"\n"` == 1, and `"a\n\n"` == 2, which a `count("\n")`-based or naive-`rstrip` implementation gets wrong on any file with paragraph breaks.
  - Task 1, add to `test_counter.py` (step 1): `count_lines("a\n\nb")` == 3; `count_lines("\n")` == 1; `count_lines("a\n\n")` == 2.

- **Invocation with no path, or with extra paths.** The spec types `main(argv)` as returning an `int`; with argparse's default behavior a bare `main([])` raises `SystemExit(2)` instead, so any caller that treats `main` as a function — including a `console_scripts`-style wrapper — gets an exception rather than a usage message and exit code.
  - Task 3, add to `test_cli.py` (step 1): `main([])` writes usage to stderr and yields exit status 2 (assert via `SystemExit` code or returned int, whichever `main` is written to do); `main([path, path2])` behaves the same way.

- **Report shape at the seam between formatter and stdout.** `format_report` returns a 3-line string with no trailing newline, so `print` must add exactly one; Task 2 checks the string and Task 3 checks a happy-path report, but neither pins that the process emits exactly four bytes of newline structure, letting a stray `print(report + "\n")` add a blank line that breaks `wc`-style downstream use.
  - Task 3, add to `test_cli.py` (step 1): for an empty temp file, captured stdout is exactly `"words: 0\nlines: 0\nchars: 0\n"` and `main([path])` returns 0.
```
