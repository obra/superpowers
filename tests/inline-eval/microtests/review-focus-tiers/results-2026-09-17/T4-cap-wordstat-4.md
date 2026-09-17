```markdown
## Review Focus

The spec's silences that a real user will hit first. Each line names the input, the behavior a reasonable person expects, and the test that pins it — added to the task that owns the code, in that task's step style.

1. **Words separated by newlines, tabs, or runs of spaces, and text that is only whitespace** — every real file has these; `count_words` must count whitespace-separated tokens, so `"a\n\tb  c"` is 3 and `"   \n "` is 0, never inflated by the empty strings a single-character split leaves between separators.
   - Task 1, step 1, `test_counter.py::test_count_words_splits_on_any_whitespace_run`: assert `count_words("a\n\tb  c") == 3`, `count_words(" a ") == 1`, `count_words("   \n ") == 0`.
2. **A `path` that exists but is not a readable file — a directory (`wordstat .`), or a file with read permission removed** — expect the same handled failure as a missing file: message on stderr, nothing on stdout, return 1; not an `IsADirectoryError`/`PermissionError` traceback, since the spec's error path is about "can't read this", not about one errno.
   - Task 3, step 1, `test_cli.py::test_unreadable_path_reports_error`: with `tempfile.TemporaryDirectory()` assert `main([tmpdir]) == 1` with captured stdout empty and stderr non-empty; repeat for a temp file after `os.chmod(p, 0o000)`, skipped when `os.geteuid() == 0`.
3. **A file that is not valid UTF-8 — binary data, or latin-1 accented text** — expect a message to stderr and return 1 (or a documented decode fallback), not a `UnicodeDecodeError` escaping `main` and burying the reason in a traceback.
   - Task 3, step 1, `test_cli.py::test_undecodable_file_reports_error`: write `b"caf\xe9\n\xff\xfe"` to a temp file, assert `main([path]) == 1` and stderr non-empty, and that no exception propagates.
4. **Wrong argument count — `main([])` when the user forgets the path, or `main(["a", "b"])`** — expect argparse's usage message on stderr and a nonzero exit status, i.e. a `SystemExit(2)` a caller can catch, rather than a `TypeError`, an `IndexError`, or a silent `None` return that a shell reads as success.
   - Task 3, step 1, `test_cli.py::test_argument_count_errors`: `with self.assertRaises(SystemExit) as cm: main([])` then assert `cm.exception.code == 2` and stderr mentions `usage`; same for `main(["a", "b"])`.
5. **An empty file, and a file that is exactly one newline** — expect exit 0 and a full three-line report (`"words: 0\nlines: 0\nchars: 0"` for empty), and `count_lines("\n") == 1` — the "trailing newline adds no line" rule must not turn a one-line file into zero lines, and `count_lines("a\n\n") == 2`.
   - Task 1, step 1, `test_counter.py::test_count_lines_trailing_newline_boundary`: assert `count_lines("\n") == 1`, `count_lines("a\n\n") == 2`, `count_lines("\n\n") == 2`.
   - Task 3, step 1, `test_cli.py::test_empty_file_reports_zeros`: for a zero-byte temp file assert `main([path]) == 0` and captured stdout `== "words: 0\nlines: 0\nchars: 0\n"`.
```
