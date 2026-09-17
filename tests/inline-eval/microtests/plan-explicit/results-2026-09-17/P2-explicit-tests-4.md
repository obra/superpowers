## Implied cases made explicit

Below are the input classes and failure modes that `design.md` states or directly implies, but that no task's tests in the current plan exercise. Each is assigned to the task that owns the behavior, with the exact test to add and the expected behavior stated in the spec's own terms.

---

### Task 1 — `wordstat/counter.py` (add to `test_counter.py`, step 1)

**1a. Whitespace-only text has no tokens.**
Spec: `count_words(text)` is "the number of whitespace-separated tokens." A string made only of whitespace contains no tokens, so the count is 0 — the same as `""`.

```python
    def test_count_words_whitespace_only_is_zero(self):
        self.assertEqual(counter.count_words("   "), 0)
        self.assertEqual(counter.count_words("\n\t \n"), 0)
```

**1b. Runs of whitespace, and leading/trailing whitespace, do not create tokens.**
Spec: tokens are "whitespace-separated", so a separator of any width separates exactly two tokens and padding at the ends separates nothing.

```python
    def test_count_words_collapses_whitespace_runs(self):
        self.assertEqual(counter.count_words("  the   quick  "), 2)
```

**1c. Whitespace means all whitespace, not just the space character.**
Spec: "whitespace-separated tokens" — newlines and tabs are whitespace and therefore separate tokens.

```python
    def test_count_words_separates_on_newlines_and_tabs(self):
        self.assertEqual(counter.count_words("a\nb\tc"), 3)
```

**1d. Text with no newline at all is one line.**
Spec: `count_lines(text)` is "the number of lines". Non-empty text with no line terminator is a single line; only `""` has no lines.

```python
    def test_count_lines_single_line_without_newline(self):
        self.assertEqual(counter.count_lines("a"), 1)
```

**1e. Blank interior lines are lines.**
Spec: `count_lines` counts lines; the exemption is only for the *final* empty line implied by a trailing newline, so an empty line in the middle counts like any other.

```python
    def test_count_lines_counts_blank_interior_lines(self):
        self.assertEqual(counter.count_lines("a\n\nb"), 3)
```

**1f. Only the trailing newline is absorbed, not a trailing blank line.**
Spec: "a trailing newline does not add an empty final line." In `"a\n\n"` the first newline terminates line `"a"` and the second terminates an empty second line, so there are 2 lines — by the same rule that makes `"a\nb\n"` 2, not 3.

```python
    def test_count_lines_trailing_blank_line_counts(self):
        self.assertEqual(counter.count_lines("a\n\n"), 2)
```

**1g. A lone newline is one (empty) line.**
Spec: same rule as `"a\n"` → 1. The newline terminates one empty line and adds no extra final line, so the answer is 1, distinguishing this input from `""` → 0.

```python
    def test_count_lines_lone_newline_is_one(self):
        self.assertEqual(counter.count_lines("\n"), 1)
```

**1h. Newlines are characters.**
Spec: `count_chars(text)` is "the number of characters **including whitespace**" — line terminators are whitespace characters and are counted.

```python
    def test_count_chars_includes_newlines(self):
        self.assertEqual(counter.count_chars("a\nb"), 3)
        self.assertEqual(counter.count_chars("a\n"), 2)
```

**1i. Empty text has no characters.**
Spec: `count_chars` counts characters; `""` has none. (The plan pins the empty-input case for `count_words` and `count_lines` but not for `count_chars`.)

```python
    def test_count_chars_empty_is_zero(self):
        self.assertEqual(counter.count_chars(""), 0)
```

**1j. Characters, not bytes.**
Spec: "number of characters". A non-ASCII character is one character regardless of how many bytes encode it.

```python
    def test_count_chars_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo"), 5)
```

---

### Task 2 — `wordstat/formatter.py` (add to `test_formatter.py`, step 1)

**2a. Zero stats render as zeros.**
Spec: `format_report(stats)` renders `{"words": w, "lines": l, "chars": c}` as a 3-line report. Zero is a legal value of each stat (it is what `counter` returns for empty text), and it must be printed as `0`, not omitted or blanked.

```python
    def test_format_report_zero_stats(self):
        self.assertEqual(
            formatter.format_report({"words": 0, "lines": 0, "chars": 0}),
            "words: 0\nlines: 0\nchars: 0",
        )
```

**2b. Exactly three lines, with no trailing newline.**
Spec: "return a 3-line report, e.g. `"words: 12\nlines: 3\nchars: 57"`" — the example ends after the last stat, so the returned string carries no trailing newline and splits into exactly 3 lines. (Task 3 depends on this: `print` supplies the final newline.)

```python
    def test_format_report_is_three_lines_without_trailing_newline(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))
        self.assertEqual(len(report.split("\n")), 3)
```

**2c. Line order is fixed by the report, not by the dict.**
Spec: the report is `words`, then `lines`, then `chars`. The argument is a stats dict, so the order in which a caller happens to build it must not change the report.

```python
    def test_format_report_order_independent_of_dict_order(self):
        stats = {}
        stats["chars"] = 57
        stats["lines"] = 3
        stats["words"] = 12
        self.assertEqual(
            formatter.format_report(stats), "words: 12\nlines: 3\nchars: 57"
        )
```

---

### Task 3 — `wordstat/cli.py` (add to `test_cli.py`, step 1)

**3a. The missing-file message goes to stderr, and stdout stays empty.**
Spec: "Missing file → message to stderr, return 1." The plan asserts only the return code; the stream and the absence of a report on stdout are equally part of the stated behavior.

```python
    def test_main_missing_file_writes_message_to_stderr_only(self):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(["/no/such/file"])
        self.assertEqual(code, 1)
        self.assertEqual(out.getvalue(), "")
        self.assertNotEqual(err.getvalue().strip(), "")
```

**3b. An empty file is a valid input, reported as all zeros.**
Spec: `main` reads the file, computes the three stats via `counter`, renders via `formatter`, prints to stdout, returns 0. An existing but empty file is not a missing file, so it takes the success path; `counter` gives 0 words, 0 lines, 0 chars.

```python
    def test_main_empty_file_reports_zeros_and_returns_zero(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "empty.txt")
            with open(path, "w", encoding="utf-8") as fh:
                fh.write("")
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = cli.main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), "words: 0\nlines: 0\nchars: 0\n")
```

**3c. The report reaches stdout as one printed report — three lines and nothing more.**
Spec: "print the report to stdout" — the printed output is the formatter's 3-line report plus the newline `print` adds, with no extra framing.

```python
    def test_main_prints_report_and_nothing_else(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "sample.txt")
            with open(path, "w", encoding="utf-8") as fh:
                fh.write("the quick brown fox\njumps\n")
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = cli.main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), "words: 5\nlines: 2\nchars: 26\n")
```

**3d. The `path` argument is required.**
Spec: "parse a single positional `path` argument." With no argument there is nothing to read, so `argparse` rejects the invocation rather than `main` returning 0; the plan never exercises the arg parser's own failure path.

```python
    def test_main_requires_path_argument(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as ctx:
                cli.main([])
        self.assertNotEqual(ctx.exception.code, 0)
```

**3e. A path that exists but cannot be read as a file still exits 1, not with a traceback.**
Spec: `main` returns an exit code — 0 on success, 1 when the file cannot be read. A directory path is not a missing file, but it is not a readable text file either, so it must land in the same reported-failure branch (message to stderr, return 1) rather than propagating an exception out of `main`.

```python
    def test_main_unreadable_path_returns_one(self):
        with tempfile.TemporaryDirectory() as d:
            out, err = io.StringIO(), io.StringIO()
            with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
                code = cli.main([d])
        self.assertEqual(code, 1)
        self.assertEqual(out.getvalue(), "")
        self.assertNotEqual(err.getvalue().strip(), "")
```

**3f. File contents are read as text, so `chars` counts characters.**
Spec: `main` reads the file and computes the three stats via `counter`; `count_chars` counts characters, so a UTF-8 file of non-ASCII text must report its character count, not its byte count.

```python
    def test_main_reads_file_as_text(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "utf8.txt")
            with open(path, "w", encoding="utf-8") as fh:
                fh.write("héllo wörld\n")
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = cli.main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), "words: 2\nlines: 1\nchars: 12\n")
```

*Imports these tests assume in `test_cli.py` (stdlib only, per the design's constraint): `contextlib`, `io`, `os`, `tempfile`, `unittest`, and `from wordstat import cli`.*
