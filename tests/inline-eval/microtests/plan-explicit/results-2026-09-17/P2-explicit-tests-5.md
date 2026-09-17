## Implied cases made explicit

The additions below close the gap between what `design.md` requires and what the plan's tests currently exercise. Each is assigned to the task that owns the module, and each is written as a test method to be added to that task's step 1 (the failing-test step), in the plan's existing unittest style.

---

### Task 1 — `wordstat/counter.py` (add to `test_counter.py`)

**1. `count_words` with leading, trailing, and repeated whitespace.**
The spec defines words as "whitespace-separated tokens"; the plan only tests single-space separation, so runs of whitespace and padding are unexercised. Expected behavior: only tokens are counted, so surrounding and repeated whitespace contribute nothing.

```python
def test_count_words_ignores_surrounding_and_repeated_whitespace(self):
    self.assertEqual(counter.count_words("  the   quick  brown fox  "), 4)
```

**2. `count_words` with non-space whitespace as separators.**
"Whitespace-separated" covers tabs and newlines, not just spaces. Expected behavior: tabs and newlines separate tokens exactly as spaces do.

```python
def test_count_words_splits_on_tabs_and_newlines(self):
    self.assertEqual(counter.count_words("the\tquick\nbrown\r\nfox"), 4)
```

**3. `count_words` on whitespace-only text.**
The plan tests `""` but not text that is non-empty yet contains no tokens. Expected behavior: there are no whitespace-separated tokens, so the count is 0.

```python
def test_count_words_whitespace_only_is_zero(self):
    self.assertEqual(counter.count_words("   \n\t  "), 0)
```

**4. `count_lines` on a lone newline.**
The spec's rule "a trailing newline does not add an empty final line" has an untested boundary: text that is nothing but a trailing newline. Expected behavior: `"\n"` is one (empty) line, the same way `"a\n"` is one line.

```python
def test_count_lines_lone_newline_is_one_line(self):
    self.assertEqual(counter.count_lines("\n"), 1)
    self.assertEqual(counter.count_lines("a\n"), 1)
```

**5. `count_lines` with interior blank lines.**
Only the *trailing* newline is exempt from producing a line; blank lines inside the text are lines. Expected behavior: an empty line between two content lines is counted.

```python
def test_count_lines_counts_interior_blank_lines(self):
    self.assertEqual(counter.count_lines("a\n\nb"), 3)
    self.assertEqual(counter.count_lines("a\n\nb\n"), 3)
```

**6. `count_chars` counts newlines.**
The spec says "including whitespace", which covers line separators; the plan only tests a space. Expected behavior: newline characters are counted like any other character.

```python
def test_count_chars_includes_newlines(self):
    self.assertEqual(counter.count_chars("a\nb"), 3)
    self.assertEqual(counter.count_chars("a\nb\n"), 4)
```

**7. `count_chars` on empty text.**
`count_words` and `count_lines` both have an empty-input case in the plan; `count_chars` does not. Expected behavior: 0 characters.

```python
def test_count_chars_empty_is_zero(self):
    self.assertEqual(counter.count_chars(""), 0)
```

**8. `count_chars` counts characters, not bytes.**
The spec says "number of characters"; non-ASCII text distinguishes characters from encoded bytes. Expected behavior: each non-ASCII character counts once.

```python
def test_count_chars_counts_characters_not_bytes(self):
    self.assertEqual(counter.count_chars("héllo"), 5)
    self.assertEqual(counter.count_chars("naïve café"), 10)
```

---

### Task 2 — `wordstat/formatter.py` (add to `test_formatter.py`)

**9. Zero-valued stats.**
The CLI must be able to report on an empty file, so the all-zero stats dict is a required input class; the plan only tests one non-zero example. Expected behavior: the same 3-line report shape with zeros.

```python
def test_format_report_zero_stats(self):
    self.assertEqual(
        formatter.format_report({"words": 0, "lines": 0, "chars": 0}),
        "words: 0\nlines: 0\nchars: 0",
    )
```

**10. Report shape: exactly three lines, no trailing newline.**
The spec requires "a 3-line report"; the plan asserts one literal string but never pins the shape as a property, which is what `cli` relies on when printing. Expected behavior: three lines, in the order words, lines, chars, with no trailing newline.

```python
def test_format_report_is_three_lines_without_trailing_newline(self):
    report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
    self.assertFalse(report.endswith("\n"))
    self.assertEqual(
        report.split("\n"),
        ["words: 12", "lines: 3", "chars: 57"],
    )
```

**11. Field order is fixed, independent of dict insertion order.**
The spec fixes the report's line order; the input is a dict, whose iteration order can differ from the spec's order. Expected behavior: the report is always words, then lines, then chars.

```python
def test_format_report_order_independent_of_dict_order(self):
    self.assertEqual(
        formatter.format_report({"chars": 57, "words": 12, "lines": 3}),
        "words: 12\nlines: 3\nchars: 57",
    )
```

---

### Task 3 — `wordstat/cli.py` (add to `test_cli.py`)

These use `tempfile`, `io.StringIO`, and `contextlib.redirect_stdout` / `redirect_stderr` — stdlib only, consistent with the plan's constraint.

**12. Report is printed to stdout followed by exactly one newline.**
The spec says `main` prints the report to stdout; the plan says "prints the expected report" without pinning the exact stream contents. Expected behavior: stdout is the formatter's report plus the single newline from printing it, and the return code is 0.

```python
def test_main_prints_report_to_stdout_and_returns_zero(self):
    with tempfile.TemporaryDirectory() as d:
        path = os.path.join(d, "sample.txt")
        with open(path, "w") as f:
            f.write("the quick brown fox\njumps\n")
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = cli.main([path])
    self.assertEqual(code, 0)
    self.assertEqual(out.getvalue(), "words: 5\nlines: 2\nchars: 26\n")
```

**13. Empty file end to end.**
An empty input file is a valid file and the composition of all three zero-valued stats; no task currently exercises it through `main`. Expected behavior: the all-zero report on stdout and exit code 0.

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

**14. Trailing newline in the real file does not add a line.**
The spec's trailing-newline rule for `count_lines` must survive the read-a-file path, where the trailing byte is easy to mishandle. Expected behavior: a file whose content ends in a newline reports the same line count as one that does not, while the character count differs by one.

```python
def test_main_trailing_newline_does_not_add_a_line(self):
    with tempfile.TemporaryDirectory() as d:
        with_nl = os.path.join(d, "with.txt")
        without_nl = os.path.join(d, "without.txt")
        with open(with_nl, "w") as f:
            f.write("a\nb\n")
        with open(without_nl, "w") as f:
            f.write("a\nb")
        out_with, out_without = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out_with):
            self.assertEqual(cli.main([with_nl]), 0)
        with contextlib.redirect_stdout(out_without):
            self.assertEqual(cli.main([without_nl]), 0)
    self.assertEqual(out_with.getvalue(), "words: 2\nlines: 2\nchars: 4\n")
    self.assertEqual(out_without.getvalue(), "words: 2\nlines: 2\nchars: 3\n")
```

**15. Missing file writes a message to stderr and nothing to stdout.**
The spec says "Missing file → message to stderr, return 1"; the plan only asserts the return code, leaving the message and the silence on stdout unexercised. Expected behavior: a non-empty message on stderr, empty stdout, no exception, return 1.

```python
def test_main_missing_file_writes_message_to_stderr(self):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = cli.main(["/no/such/file"])
    self.assertEqual(code, 1)
    self.assertEqual(out.getvalue(), "")
    self.assertNotEqual(err.getvalue().strip(), "")
```

**16. The positional `path` argument is required.**
The spec says `main` parses "a single positional `path` argument"; invoking it with no argument is an implied input class that the plan never covers. Expected behavior: argparse rejects the invocation rather than the code reading a file — it exits with a non-zero status and writes to stderr.

```python
def test_main_requires_path_argument(self):
    err = io.StringIO()
    with contextlib.redirect_stderr(err):
        with self.assertRaises(SystemExit) as ctx:
            cli.main([])
    self.assertNotEqual(ctx.exception.code, 0)
    self.assertNotEqual(err.getvalue().strip(), "")
```
