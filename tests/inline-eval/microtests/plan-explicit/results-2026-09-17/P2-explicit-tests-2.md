## Implied cases made explicit

Each case below is an input class or failure mode that `design.md` states or entails, but that no test in the current plan exercises. Each is assigned to the task that owns the behavior, with the exact `unittest` method to add to that task's failing-test step (step 1 of the task), and the expected behavior stated in the spec's own terms.

---

### Task 1 — `wordstat/counter.py` (add to `test_counter.py`)

**1.1 Runs of whitespace, and leading/trailing whitespace, do not create tokens**

Spec basis: `count_words(text)` is "number of whitespace-separated tokens" — separators are whitespace runs, not single characters, so `"  the   quick  "` has 2 tokens.

```python
    def test_count_words_collapses_whitespace_runs(self):
        self.assertEqual(counter.count_words("  the   quick  "), 2)
```

**1.2 Tabs and newlines are word separators, not just spaces**

Spec basis: tokens are *whitespace*-separated, so every whitespace character separates; `"a\tb\nc"` is 3 tokens.

```python
    def test_count_words_separates_on_any_whitespace(self):
        self.assertEqual(counter.count_words("a\tb\nc"), 3)
```

**1.3 Whitespace-only text has no words**

Spec basis: whitespace-only text contains no tokens, so the count is 0 — the same answer as `""`.

```python
    def test_count_words_whitespace_only_is_zero(self):
        self.assertEqual(counter.count_words("   \n\t "), 0)
```

**1.4 Text with no newline at all is one line**

Spec basis: `count_lines(text)` is "number of lines"; `"abc"` is a single line. The plan pins `"a\nb"`, `"a\nb\n"` and `""` but never the no-newline non-empty case, which is the boundary between the 0 case and the 2 cases.

```python
    def test_count_lines_no_newline_is_one(self):
        self.assertEqual(counter.count_lines("abc"), 1)
```

**1.5 Interior blank lines are counted**

Spec basis: only a *trailing* newline is exempt from adding a final line; an embedded blank line is a line, so `"a\n\nb"` is 3.

```python
    def test_count_lines_counts_interior_blank_lines(self):
        self.assertEqual(counter.count_lines("a\n\nb"), 3)
```

**1.6 A trailing newline after a blank line still does not add a final empty line**

Spec basis: `"a\n\n"` is the lines `"a"` and `""`, and the trailing newline does not add an empty final line — 2, by the same rule that makes `"a\nb\n"` equal 2.

```python
    def test_count_lines_trailing_newline_after_blank_line(self):
        self.assertEqual(counter.count_lines("a\n\n"), 2)
```

**1.7 Newlines count as characters**

Spec basis: `count_chars(text)` is "number of characters *including whitespace*" — newlines are whitespace and are counted, so `"a\nb"` is 3.

```python
    def test_count_chars_includes_newlines(self):
        self.assertEqual(counter.count_chars("a\nb"), 3)
```

**1.8 Empty text has zero characters**

Spec basis: the empty text has no characters, so the count is 0 (matching `count_words("")` and `count_lines("")`).

```python
    def test_count_chars_empty_is_zero(self):
        self.assertEqual(counter.count_chars(""), 0)
```

**1.9 Characters are counted as characters, not bytes**

Spec basis: `count_chars` counts *characters*, so `"héllo"` is 5 even though it is 6 bytes when UTF-8 encoded.

```python
    def test_count_chars_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo"), 5)
```

---

### Task 2 — `wordstat/formatter.py` (add to `test_formatter.py`)

**2.1 Zero stats render as zeros**

Spec basis: `format_report(stats)` returns a 3-line report for the given `{"words", "lines", "chars"}` dict; the all-zero dict (what an empty file produces) is a valid input and renders with `0` in each field.

```python
    def test_format_report_zero_stats(self):
        self.assertEqual(
            formatter.format_report({"words": 0, "lines": 0, "chars": 0}),
            "words: 0\nlines: 0\nchars: 0",
        )
```

**2.2 The report is exactly 3 lines, with no trailing newline**

Spec basis: the return value is "a 3-line report", e.g. `"words: 12\nlines: 3\nchars: 57"` — three lines joined by two newlines, with no newline after the last field.

```python
    def test_format_report_has_three_lines_and_no_trailing_newline(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report.count("\n"), 2)
        self.assertFalse(report.endswith("\n"))
```

**2.3 Field order is fixed by the report format, not by the dict**

Spec basis: the report format is words, then lines, then chars. The input is a dict, so the caller's key order must not affect the output.

```python
    def test_format_report_order_independent_of_dict_order(self):
        self.assertEqual(
            formatter.format_report({"chars": 57, "lines": 3, "words": 12}),
            "words: 12\nlines: 3\nchars: 57",
        )
```

---

### Task 3 — `wordstat/cli.py` (add to `test_cli.py`)

These use `tempfile` for the input file and `contextlib.redirect_stdout` / `redirect_stderr` with `io.StringIO` to capture output; add `import contextlib`, `import io`, `import os`, `import tempfile` to the test module.

**3.1 The report goes to stdout followed by a single newline**

Spec basis: `main(argv)` "print[s] the report to stdout" — printing the 3-line report yields exactly the report plus one terminating newline, and nothing else.

```python
    def test_main_prints_report_with_single_trailing_newline(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "sample.txt")
            with open(path, "w") as fh:
                fh.write("the quick brown fox\njumps\n")
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = cli.main([path])
            self.assertEqual(code, 0)
            self.assertEqual(out.getvalue(), "words: 5\nlines: 2\nchars: 26\n")
```

**3.2 An empty file reports zeros and succeeds**

Spec basis: an empty file is a readable file, so `main` computes the three stats via `counter` (0 words, 0 lines, 0 chars), renders via `formatter`, and returns exit code 0 — the empty file is not a failure.

```python
    def test_main_empty_file_reports_zeros(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "empty.txt")
            open(path, "w").close()
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = cli.main([path])
            self.assertEqual(code, 0)
            self.assertEqual(out.getvalue(), "words: 0\nlines: 0\nchars: 0\n")
```

**3.3 A missing file writes to stderr and prints nothing to stdout**

Spec basis: "Missing file → message to stderr, return 1." The plan asserts only the return code; the destination of the message (stderr, and *not* stdout) is the other half of the stated behavior. The message's wording is not specified, so only its presence is asserted.

```python
    def test_main_missing_file_writes_message_to_stderr_only(self):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(["/no/such/file"])
        self.assertEqual(code, 1)
        self.assertEqual(out.getvalue(), "")
        self.assertNotEqual(err.getvalue().strip(), "")
```

**3.4 A missing `path` argument is an argparse usage error, not a `1` return**

Spec basis: `main(argv)` "parse[s] a single positional `path` argument" using `argparse`. A required positional that is absent is a usage error, so `argparse` exits with its usage code (2) rather than returning — this is distinct from the "missing file → 1" path.

```python
    def test_main_without_path_argument_is_usage_error(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as cm:
                cli.main([])
        self.assertEqual(cm.exception.code, 2)
```

**3.5 More than one positional argument is an argparse usage error**

Spec basis: the CLI takes a *single* positional `path`; extra positionals are unrecognized, so `argparse` reports a usage error and exits 2.

```python
    def test_main_rejects_extra_positional_arguments(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as cm:
                cli.main(["a.txt", "b.txt"])
        self.assertEqual(cm.exception.code, 2)
```

**3.6 A directory path is handled as an unreadable file, not an unhandled crash**

Spec basis: `main` must "read that file" and, when it cannot, emit a message to stderr and return 1. A path that exists but is a directory cannot be read as a file, so it takes the same failure path as a missing file.

```python
    def test_main_directory_path_reports_failure(self):
        with tempfile.TemporaryDirectory() as d:
            out, err = io.StringIO(), io.StringIO()
            with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
                code = cli.main([d])
            self.assertEqual(code, 1)
            self.assertEqual(out.getvalue(), "")
            self.assertNotEqual(err.getvalue().strip(), "")
```

**3.7 End-to-end character counting reads text, not bytes**

Spec basis: `main` reads the file and computes the three stats "via `counter`", and `count_chars` counts characters — so a UTF-8 file whose contents are `"héllo\n"` reports 6 chars (5 letters plus the newline), not 7 bytes.

```python
    def test_main_counts_characters_not_bytes(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "unicode.txt")
            with open(path, "w", encoding="utf-8") as fh:
                fh.write("héllo\n")
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = cli.main([path])
            self.assertEqual(code, 0)
            self.assertEqual(out.getvalue(), "words: 1\nlines: 1\nchars: 6\n")
```
