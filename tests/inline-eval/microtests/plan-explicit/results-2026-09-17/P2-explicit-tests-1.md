## Implied cases made explicit

The cases below are input classes and failure modes that `design.md` implies but that no test named in `plan.md` currently exercises. Each is assigned to the task that owns the module under test, and each is given as the exact `unittest` method that task must add to its test file (same TDD ordering as the rest of the plan: add the method as part of step 1, red before green).

### Task 1 — `wordstat/counter.py` (add to `test_counter.py`)

Spec: *"`count_words(text)` → int: number of whitespace-separated tokens"*, *"`count_lines(text)` → int: number of lines (a trailing newline does not add an empty final line)"*, *"`count_chars(text)` → int: number of characters including whitespace"*.

**Implied class: padding whitespace around the token run.** "Whitespace-separated tokens" means leading/trailing whitespace bounds tokens rather than creating them, so the count is 4 as with the unpadded string.

```python
    def test_count_words_ignores_leading_and_trailing_whitespace(self):
        self.assertEqual(counter.count_words("  the quick brown fox  "), 4)
```

**Implied class: runs of whitespace between tokens.** A run of whitespace is one separator, so the token count is still 4 — not one token per gap character.

```python
    def test_count_words_collapses_runs_of_whitespace(self):
        self.assertEqual(counter.count_words("the   quick\t\tbrown\n\nfox"), 4)
```

**Implied class: non-space whitespace as the separator.** Tabs and newlines are whitespace, so they separate tokens exactly as spaces do: 3 tokens.

```python
    def test_count_words_treats_tabs_and_newlines_as_separators(self):
        self.assertEqual(counter.count_words("a\tb\nc"), 3)
```

**Implied class: text that is whitespace only.** There are no tokens, so the count is 0 — the same answer the plan already pins for `""`.

```python
    def test_count_words_whitespace_only_is_zero(self):
        self.assertEqual(counter.count_words("   \t\n  "), 0)
```

**Implied class: one line, no line terminator.** The plan pins `"a\nb"`/`"a\nb\n"` == 2 and `""` == 0 but never the single-line case; one line of text is 1 line.

```python
    def test_count_lines_single_line_without_newline(self):
        self.assertEqual(counter.count_lines("a"), 1)

    def test_count_lines_single_line_with_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\n"), 1)
```

**Implied class: blank lines inside the text.** Only a *trailing* newline is exempt from adding a line; an interior empty line is a line, so `"a\n\nb"` is 3.

```python
    def test_count_lines_counts_interior_blank_lines(self):
        self.assertEqual(counter.count_lines("a\n\nb"), 3)
```

**Implied class: text consisting of line terminators only.** `""` is 0 lines, but `"\n"` is one (empty) line, and `"a\n\n"` is two lines — the second is a real empty line and only the final newline is exempt. This is the boundary between the spec's `""` == 0 rule and its trailing-newline rule.

```python
    def test_count_lines_lone_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("\n"), 1)

    def test_count_lines_blank_final_line_before_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\n\n"), 2)
```

**Implied class: empty text for `count_chars`.** The plan pins the empty case for `count_words` and `count_lines` but not `count_chars`; no characters means 0.

```python
    def test_count_chars_empty_is_zero(self):
        self.assertEqual(counter.count_chars(""), 0)
```

**Implied class: line terminators as characters.** "Including whitespace" covers newlines, not just spaces, so `"a\nb"` is 3 characters.

```python
    def test_count_chars_counts_newlines(self):
        self.assertEqual(counter.count_chars("a\nb"), 3)
```

**Implied class: non-ASCII text.** The spec counts *characters*, so a 5-character string with a multi-byte character is 5, not its UTF-8 byte length.

```python
    def test_count_chars_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo"), 5)
```

### Task 2 — `wordstat/formatter.py` (add to `test_formatter.py`)

Spec: *"given `{"words": w, "lines": l, "chars": c}`, return a 3-line report, e.g. `"words: 12\nlines: 3\nchars: 57"`"*.

**Implied class: zero counts.** The stats dict for empty input is all zeros; the report renders them as `0` in the same three-line shape (no special-casing, no omitted lines).

```python
    def test_format_report_with_zero_stats(self):
        self.assertEqual(
            formatter.format_report({"words": 0, "lines": 0, "chars": 0}),
            "words: 0\nlines: 0\nchars: 0",
        )
```

**Implied failure mode: a fourth line.** "A 3-line report" means exactly three lines with no trailing newline — the example string ends at `57`. Pinning this keeps Task 3's stdout expectation (report plus the single newline `print` adds) well defined.

```python
    def test_format_report_has_no_trailing_newline(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report.splitlines(), ["words: 12", "lines: 3", "chars: 57"])
        self.assertFalse(report.endswith("\n"))
```

**Implied class: stats dict built in a different key order.** The report's line order is fixed by the spec (words, lines, chars); it is a property of the report, not of the caller's dict insertion order.

```python
    def test_format_report_order_is_fixed_regardless_of_dict_order(self):
        self.assertEqual(
            formatter.format_report({"chars": 57, "lines": 3, "words": 12}),
            "words: 12\nlines: 3\nchars: 57",
        )
```

**Implied class: multi-digit counts.** Counts from a real file are arbitrarily large; each is rendered as plain decimal digits with no thousands separators, padding, or alignment.

```python
    def test_format_report_renders_large_counts_without_separators(self):
        self.assertEqual(
            formatter.format_report({"words": 1234567, "lines": 1000, "chars": 9876543}),
            "words: 1234567\nlines: 1000\nchars: 9876543",
        )
```

### Task 3 — `wordstat/cli.py` (add to `test_cli.py`)

Spec: *"parse a single positional `path` argument, read that file, compute the three stats via `counter`, render via `formatter`, print the report to stdout, return exit code 0. Missing file → message to stderr, return 1."* Constraint: *"`cli` composes `counter` + `formatter`."*

These require `test_cli.py` to import `contextlib`, `io`, `os`, `tempfile`, `unittest`, and `from wordstat import cli, counter, formatter`.

**Implied failure mode: the missing-file message must actually reach stderr, and no report may reach stdout.** The plan only checks the return code; the spec also specifies *where* the message goes, and that a failed run produces no report.

```python
    def test_missing_file_writes_message_to_stderr_and_nothing_to_stdout(self):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(["/no/such/file"])
        self.assertEqual(code, 1)
        self.assertEqual(out.getvalue(), "")
        self.assertNotEqual(err.getvalue().strip(), "")
```

**Implied class: an existing but empty file.** This is a successful run, not an error: the three stats are all 0, the report is printed to stdout, and the exit code is 0.

```python
    def test_empty_file_reports_all_zero_and_returns_0(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "empty.txt")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write("")
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = cli.main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), "words: 0\nlines: 0\nchars: 0\n")
```

**Implied class: a file ending in a newline (the ordinary text-file case).** End to end, the trailing newline does not add a line (`lines: 2`) but is counted as a character (`chars: 6`), and stdout is the 3-line report followed by exactly one newline from printing it.

```python
    def test_file_with_trailing_newline_prints_report_once(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "sample.txt")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write("a b\nc\n")
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = cli.main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), "words: 3\nlines: 2\nchars: 6\n")
```

**Implied class: a file containing non-ASCII text.** Reading the file yields text, so `chars` is the number of characters (12), not the number of UTF-8 bytes (15).

```python
    def test_non_ascii_file_counts_characters_not_bytes(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "unicode.txt")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write("héllo wörld\n")
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = cli.main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), "words: 2\nlines: 1\nchars: 12\n")
```

**Implied failure mode: no `path` given.** `path` is a required positional argument, so an empty argv is a usage error: `argparse` exits with status 2 after writing usage to stderr, rather than reading anything or returning 0.

```python
    def test_no_path_argument_is_a_usage_error(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as caught:
                cli.main([])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage", err.getvalue().lower())
```

**Implied failure mode: more than one path given.** The spec allows a *single* positional argument, so a second one is a usage error with status 2, not a second file silently ignored or a second report.

```python
    def test_extra_positional_argument_is_a_usage_error(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                cli.main(["one.txt", "two.txt"])
        self.assertEqual(caught.exception.code, 2)
```

**Implied failure mode: a path that exists but cannot be read as a file.** The spec says `main(argv)` returns an `int` exit code, and that an unusable path produces a message on stderr and code 1. A directory path is the reachable instance of "cannot read that file" that is not `FileNotFoundError`; it must behave like the missing-file case rather than letting an exception escape `main`.

```python
    def test_directory_path_reports_error_and_returns_1(self):
        with tempfile.TemporaryDirectory() as tmp:
            out, err = io.StringIO(), io.StringIO()
            with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
                code = cli.main([tmp])
        self.assertEqual(code, 1)
        self.assertEqual(out.getvalue(), "")
        self.assertNotEqual(err.getvalue().strip(), "")
```

**Implied constraint: `cli` composes `counter` + `formatter`.** No test asserts that the printed report *is* `formatter.format_report` over the three `counter` values for the file's contents, rather than an independently formatted or independently counted string.

```python
    def test_output_is_formatter_over_counter_for_the_file_contents(self):
        content = "one two\nthree\n"
        expected = formatter.format_report(
            {
                "words": counter.count_words(content),
                "lines": counter.count_lines(content),
                "chars": counter.count_chars(content),
            }
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "compose.txt")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(content)
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = cli.main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), expected + "\n")
```
