## Implied cases made explicit

Each case below is an input class or failure mode that `design.md` requires but no test in `plan.md` currently exercises. Add each test to the named task's test file, in that task's step 1 (write the failing test first).

---

### Task 1 — `wordstat/counter.py` (add to `test_counter.py`)

Spec lines covered: "number of whitespace-separated tokens"; "number of lines (a trailing newline does not add an empty final line)"; "number of characters including whitespace".

**Implied case 1a — words are separated by *runs* of *any* whitespace, not by single spaces.** The spec says "whitespace-separated tokens", so repeated spaces, leading/trailing whitespace, tabs and newlines are all separators and none of them produce empty tokens.

```python
    def test_count_words_collapses_runs_of_mixed_whitespace(self):
        # "whitespace-separated tokens": tabs and newlines separate too, and
        # repeated/leading/trailing whitespace yields no empty tokens.
        self.assertEqual(counter.count_words("  the   quick  brown\tfox\n"), 4)
```

**Implied case 1b — whitespace-only text contains no tokens.** A string with whitespace but no non-whitespace characters has zero whitespace-separated tokens, exactly like `""`.

```python
    def test_count_words_whitespace_only_is_zero(self):
        self.assertEqual(counter.count_words("   \t\n  "), 0)
```

**Implied case 1c — a single token with no separator at all.** The boundary between the covered `""` (0) and `"the quick brown fox"` (4) cases.

```python
    def test_count_words_single_token(self):
        self.assertEqual(counter.count_words("word"), 1)
```

**Implied case 1d — text with no trailing newline is one line.** The spec's examples are all multi-line; a file whose content is unterminated is a single line.

```python
    def test_count_lines_no_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("abc"), 1)
```

**Implied case 1e — a blank line inside the text is a line; only the final trailing newline is the one that "does not add an empty final line".** In `"a\n\n"` the first newline terminates line `"a"` and the second terminates an empty line, and that second newline is the trailing one, so the count is 2 — the same rule that makes `"a\nb\n"` equal 2.

```python
    def test_count_lines_counts_a_blank_line_before_the_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\n\n"), 2)
```

**Implied case 1f — a lone newline is one (empty) line.** Distinguishes "no content" (`""` → 0, already covered) from "one empty line terminated by a newline".

```python
    def test_count_lines_lone_newline_is_one_empty_line(self):
        self.assertEqual(counter.count_lines("\n"), 1)
```

**Implied case 1g — newlines are characters.** `count_chars` counts "characters including whitespace", and a newline is whitespace, so it is counted.

```python
    def test_count_chars_includes_newlines(self):
        self.assertEqual(counter.count_chars("a\nb"), 3)
```

**Implied case 1h — empty text has zero characters.** The empty-input class is specified for words and lines but not for chars.

```python
    def test_count_chars_empty_is_zero(self):
        self.assertEqual(counter.count_chars(""), 0)
```

**Implied case 1i — characters, not bytes.** The spec says "number of characters", so a multi-byte character counts once.

```python
    def test_count_chars_counts_characters_not_bytes(self):
        # "héllo" is 5 characters (6 bytes as UTF-8).
        self.assertEqual(counter.count_chars("héllo"), 5)
```

---

### Task 2 — `wordstat/formatter.py` (add to `test_formatter.py`)

Spec line covered: "given `{"words": w, "lines": l, "chars": c}`, return a 3-line report, e.g. `"words: 12\nlines: 3\nchars: 57"`".

**Implied case 2a — zero stats.** An empty input file produces zeros (see case 3b), so the formatter must render them in the same shape rather than omitting or special-casing them.

```python
    def test_format_report_renders_zero_stats(self):
        self.assertEqual(
            formatter.format_report({"words": 0, "lines": 0, "chars": 0}),
            "words: 0\nlines: 0\nchars: 0",
        )
```

**Implied case 2b — exactly 3 lines, with no trailing newline.** The spec calls it "a 3-line report" and its example string ends at `57`, so the returned string contains two newlines and does not end with one. (The CLI, not the formatter, supplies the final newline — see case 3a.)

```python
    def test_format_report_is_exactly_three_lines_with_no_trailing_newline(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(len(report.splitlines()), 3)
        self.assertEqual(report.count("\n"), 2)
        self.assertFalse(report.endswith("\n"))
```

**Implied case 2c — line order is fixed by the report, not by the dict.** The spec fixes the report order as words, lines, chars; a `stats` dict built in another order must render identically.

```python
    def test_format_report_order_is_independent_of_dict_insertion_order(self):
        stats = {}
        stats["chars"] = 57
        stats["lines"] = 3
        stats["words"] = 12
        self.assertEqual(
            formatter.format_report(stats), "words: 12\nlines: 3\nchars: 57"
        )
```

---

### Task 3 — `wordstat/cli.py` (add to `test_cli.py`)

Spec line covered: "parse a single positional `path` argument, read that file, compute the three stats via `counter`, render via `formatter`, print the report to stdout, return exit code 0. Missing file → message to stderr, return 1."

These tests assume the file-writing helper below in `test_cli.py`:

```python
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)

    def write(self, content):
        path = os.path.join(self._tmp.name, "sample.txt")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)
        return path
```

**Implied case 3a — stdout is the formatter's report followed by exactly one newline.** The spec says the report is *printed* to stdout, so the captured stdout is `format_report(...)` plus the newline `print` adds — nothing more, and no extra blank line.

```python
    def test_main_prints_report_to_stdout_with_single_trailing_newline(self):
        path = self.write("the quick brown fox\njumps\n")
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), "words: 5\nlines: 2\nchars: 26\n")
        self.assertEqual(err.getvalue(), "")
```

**Implied case 3b — empty file.** Reading an empty file yields `""`, whose three stats are all 0 per Task 1, and this is still success (exit code 0), not an error.

```python
    def test_main_on_empty_file_reports_zeros_and_succeeds(self):
        path = self.write("")
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = cli.main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), "words: 0\nlines: 0\nchars: 0\n")
```

**Implied case 3c — the printed report is what `counter` + `formatter` produce for that content.** The spec requires the CLI to *compose* the two modules rather than compute or format stats itself; this pins the composition to the real functions instead of to hand-written numbers.

```python
    def test_main_composes_counter_and_formatter(self):
        content = "alpha beta\ngamma\n"
        path = self.write(content)
        expected = formatter.format_report(
            {
                "words": counter.count_words(content),
                "lines": counter.count_lines(content),
                "chars": counter.count_chars(content),
            }
        )
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = cli.main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), expected + "\n")
```

**Implied case 3d — the file is read as text, so `chars` counts characters and not bytes.** Follows from case 1i once the content comes from a file: a file holding multi-byte characters must be decoded before counting.

```python
    def test_main_reads_file_as_text_so_chars_are_characters(self):
        path = self.write("héllo wörld\n")  # 12 characters, 14 UTF-8 bytes
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = cli.main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue(), "words: 2\nlines: 1\nchars: 12\n")
```

**Implied case 3e — a missing file writes a message to stderr and prints no report.** The spec's failure mode is "message to stderr, return 1"; the existing test only checks the return code, so the message (non-empty stderr) and the absence of a report on stdout are unexercised. The path is named in the message so the user knows which file failed.

```python
    def test_main_missing_file_writes_message_to_stderr_and_prints_nothing(self):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(["/no/such/file"])
        self.assertEqual(code, 1)
        self.assertEqual(out.getvalue(), "")
        self.assertNotEqual(err.getvalue().strip(), "")
        self.assertIn("/no/such/file", err.getvalue())
```

**Implied case 3f — a missing file must not raise.** "Missing file → ... return 1" means the error is reported by return value, so `main` returns normally rather than propagating `FileNotFoundError` or exiting.

```python
    def test_main_missing_file_does_not_raise(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            try:
                code = cli.main(["/no/such/file"])
            except (OSError, SystemExit) as exc:
                self.fail("main() must return 1 for a missing file, not raise %r" % (exc,))
        self.assertEqual(code, 1)
```

**Implied case 3g — the `path` argument is required.** The spec says `main(argv)` parses "a single positional `path` argument"; with no argument, `argparse` reports the usage error and exits with its standard code 2.

```python
    def test_main_requires_a_path_argument(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as ctx:
                cli.main([])
        self.assertEqual(ctx.exception.code, 2)
```

**Implied case 3h — only one positional argument is accepted.** The counterpart of 3g for the "single" half of "a single positional `path` argument": extra positionals are a usage error, not silently ignored.

```python
    def test_main_rejects_extra_positional_arguments(self):
        path = self.write("a\n")
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as ctx:
                cli.main([path, path])
        self.assertEqual(ctx.exception.code, 2)
```
