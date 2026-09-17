## Implied cases made explicit

Each entry names the task that owns the case, the exact test method to add to that task's test file (step 1 of the task, written failing first, same `unittest` style as the rest of the plan), and the behavior the spec requires.

### Task 1 — `wordstat/counter.py` (add to `test_counter.py`)

The spec defines `count_words` as "number of whitespace-separated tokens", `count_lines` with the rule "a trailing newline does not add an empty final line", and `count_chars` as "number of characters including whitespace". The plan's tests only exercise single-space, one-newline, and ASCII inputs. Add:

**Whitespace runs, tabs, newlines, and leading/trailing whitespace as separators** — tokens are whitespace-separated, so any run of whitespace of any kind is one separator and edge whitespace produces no empty tokens.

```python
    def test_count_words_collapses_whitespace_runs(self):
        self.assertEqual(counter.count_words("  the   quick\tbrown\nfox  "), 4)
        self.assertEqual(counter.count_words("a\n\nb"), 2)
```

**Whitespace-only text has no tokens** — same input class as `""` (0), but non-empty.

```python
    def test_count_words_whitespace_only_is_zero(self):
        self.assertEqual(counter.count_words("   \t\n  "), 0)
```

**A single line, with and without a trailing newline** — the trailing newline does not add an empty final line, so both are 1 line.

```python
    def test_count_lines_single_line(self):
        self.assertEqual(counter.count_lines("a"), 1)
        self.assertEqual(counter.count_lines("a\n"), 1)
```

**Blank lines are lines** — a blank interior line counts, and `"\n"` is one (empty) line, not zero and not two, because only the *trailing* newline is non-additive.

```python
    def test_count_lines_counts_blank_lines(self):
        self.assertEqual(counter.count_lines("a\n\nb"), 3)
        self.assertEqual(counter.count_lines("\n"), 1)
        self.assertEqual(counter.count_lines("a\n\n"), 2)
```

**Newlines are characters** — `count_chars` includes whitespace, and the trailing-newline rule of `count_lines` does not apply here.

```python
    def test_count_chars_includes_newlines(self):
        self.assertEqual(counter.count_chars("a\nb"), 3)
        self.assertEqual(counter.count_chars("a\nb\n"), 4)
        self.assertEqual(counter.count_chars(""), 0)
```

**Non-ASCII text counts characters, not bytes** — "number of characters".

```python
    def test_count_chars_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("naïve"), 5)
        self.assertEqual(counter.count_chars("héllo wörld"), 11)
```

### Task 2 — `wordstat/formatter.py` (add to `test_formatter.py`)

The spec fixes the shape as a "3-line report" over the keys `words`, `lines`, `chars`. The plan's single test uses one dict with distinct multi-digit values in spec order. Add:

**Zero stats** — the empty-file case that Task 3 will feed through; the report still has all three lines.

```python
    def test_format_report_zero_stats(self):
        self.assertEqual(
            formatter.format_report({"words": 0, "lines": 0, "chars": 0}),
            "words: 0\nlines: 0\nchars: 0",
        )
```

**Exactly three lines, no trailing newline** — the report is a 3-line string; the newline after the last field is the caller's (`cli` prints it).

```python
    def test_format_report_is_three_lines_without_trailing_newline(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(len(report.splitlines()), 3)
        self.assertFalse(report.endswith("\n"))
```

**Field order is fixed by the spec, not by the dict** — `words`, then `lines`, then `chars`, whatever order the mapping was built in.

```python
    def test_format_report_field_order_independent_of_dict_order(self):
        stats = {}
        stats["chars"] = 57
        stats["lines"] = 3
        stats["words"] = 12
        self.assertEqual(
            formatter.format_report(stats), "words: 12\nlines: 3\nchars: 57"
        )
```

### Task 3 — `wordstat/cli.py` (add to `test_cli.py`)

The spec requires: print the report to stdout and return 0; missing file → *message to stderr* and return 1; parse *a single positional* `path`. The plan's tests check the printed report and the exit code 1 only. Add (using `io.StringIO` with `contextlib.redirect_stdout` / `redirect_stderr`, and `tempfile` as the plan's existing test already does):

**Missing file writes to stderr and leaves stdout clean** — the failure path's output goes to stderr, not stdout, and the exit code is 1.

```python
    def test_missing_file_reports_to_stderr_not_stdout(self):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            rc = cli.main(["/no/such/file"])
        self.assertEqual(rc, 1)
        self.assertEqual(out.getvalue(), "")
        self.assertIn("/no/such/file", err.getvalue())
```

**The success path prints the report to stdout** — stdout is exactly the formatter's 3-line report plus the newline from printing it, and nothing goes to stderr.

```python
    def test_report_printed_to_stdout(self):
        path = self._write_temp("the quick brown fox\njumps\n")
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            rc = cli.main([path])
        self.assertEqual(rc, 0)
        self.assertEqual(out.getvalue(), "words: 5\nlines: 2\nchars: 26\n")
        self.assertEqual(err.getvalue(), "")
```

**An empty file is a success, reporting zeros** — reading succeeds, so the exit code is 0 and the three stats are all 0.

```python
    def test_empty_file_reports_zeros(self):
        path = self._write_temp("")
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            rc = cli.main([path])
        self.assertEqual(rc, 0)
        self.assertEqual(out.getvalue(), "words: 0\nlines: 0\nchars: 0\n")
```

**The composed counts obey `counter`'s own rules** — `cli` computes the stats *via* `counter`, so a file whose last line ends in a newline reports that trailing newline as a character but not as an extra line.

```python
    def test_trailing_newline_counted_as_char_not_extra_line(self):
        path = self._write_temp("a b\nc\n")
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            rc = cli.main([path])
        self.assertEqual(rc, 0)
        self.assertEqual(out.getvalue(), "words: 3\nlines: 2\nchars: 6\n")
```

**`path` is required** — the spec's single positional argument is mandatory, so `argparse` rejects an empty `argv` by exiting with status 2 rather than returning 0 or 1.

```python
    def test_missing_path_argument_is_an_argparse_error(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as ctx:
                cli.main([])
        self.assertEqual(ctx.exception.code, 2)
```
