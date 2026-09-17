# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python CLI that reads a text file and prints a three-line report of its word, line, and character counts.

**Architecture:** Three layers, each independently testable. `counter.py` holds pure functions from `str` to `int` — no I/O. `formatter.py` turns a stats dict into the report string — no I/O. `cli.py` is the only module that touches the filesystem, stdout, or stderr; it parses args, reads the file, calls `counter`, calls `formatter`, prints, and returns an exit code. Tests live at the repo root, one test module per source module.

**Tech Stack:** Python 3 standard library only. `argparse` for arg parsing, `unittest` for tests, `tempfile` + `io.StringIO` + `contextlib.redirect_stdout`/`redirect_stderr` for CLI tests.

**Spec:** `design.md` (in this same directory)

## Global Constraints

- **Standard library only.** No third-party runtime or test dependencies — not even `pytest`.
- **Tests are runnable with `python3 -m unittest`** and live at the repo root: `test_counter.py`, `test_formatter.py`, `test_cli.py`.
- **Package layout is fixed by the spec:** `wordstat/__init__.py` (already exists — do not modify it), `wordstat/counter.py`, `wordstat/formatter.py`, `wordstat/cli.py`.
- **Each module is independently testable.** `counter` and `formatter` must not import each other and must not do I/O. Only `cli` composes `counter` + `formatter`.
- **Report format is exactly** `"words: 12\nlines: 3\nchars: 57"` — lowercase labels, colon, single space, in the order words, lines, chars, with **no trailing newline** in the returned string.
- **`cli.main` returns an exit code** (`0` success, `1` unreadable file). It returns; it does not call `sys.exit` itself.
- Commit after every task, using the exact `git add` / `git commit` commands given in the task.

## Review Focus

The spec describes what the program must do, not every input it will meet. These are the input classes and failure modes it implies but never states. Each line names the input and the behavior a reasonable person would expect; each is pinned to a test in the task that owns the code.

- **Empty file / empty string** → all three counts are `0` and the report renders three zeros; `""` is zero lines, not one. *(Task 1: `test_empty_text_*`; Task 3: `test_empty_file_reports_zeros`)*
- **Whitespace-only and multi-whitespace text** (`"   \n\t "`, `"a  \t b"`) → word count counts tokens, not gaps or separators; leading/trailing whitespace adds no words. *(Task 1: `test_whitespace_only_*`, `test_runs_of_whitespace_*`)*
- **Missing trailing newline vs. present trailing newline vs. blank interior lines** → `"a\nb"` and `"a\nb\n"` are both 2 lines; `"a\n\nb\n"` is 3. *(Task 1: `test_trailing_newline_*`, `test_blank_interior_line_*`)*
- **Non-ASCII text** → `count_chars` counts characters, not bytes, and `cli` must read the file as UTF-8 explicitly rather than inheriting the platform's locale encoding. *(Task 1: `test_counts_characters_not_bytes`; Task 3: `test_utf8_file_counts_characters`)*
- **A path that exists but cannot be read as a file** (e.g. a directory) → still a message on stderr and exit code `1`, not an uncaught traceback. The spec says "missing file", but "unreadable" is the real class. *(Task 3: `test_directory_path_is_an_error`)*
- **A stats dict whose keys are in a different insertion order** → the report order is fixed by the formatter, not by the caller's dict. *(Task 2: `test_key_order_of_input_does_not_matter`)*
- **No positional argument at all** → `argparse`'s own usage error on stderr and exit status 2; `main` never reaches the file read. *(Task 3: `test_missing_argument_exits_with_usage_error`)*

---

### Task 1: Counter — the three pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing. This is the bottom layer.
- Produces:
  - `count_words(text: str) -> int`
  - `count_lines(text: str) -> int`
  - `count_chars(text: str) -> int`

  All three take a single `str` and return an `int`. No exceptions, no I/O, no module-level state. Task 3 imports all three.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py` with exactly this content:

```python
import unittest

from wordstat import counter


class CountWordsTests(unittest.TestCase):
    def test_counts_whitespace_separated_tokens(self):
        self.assertEqual(counter.count_words("the quick brown fox"), 4)

    def test_empty_text_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_text_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t  "), 0)

    def test_runs_of_whitespace_are_one_separator(self):
        self.assertEqual(counter.count_words("a  \t b\n\nc"), 3)

    def test_leading_and_trailing_whitespace_add_no_words(self):
        self.assertEqual(counter.count_words("  hello world  \n"), 2)


class CountLinesTests(unittest.TestCase):
    def test_counts_lines(self):
        self.assertEqual(counter.count_lines("a\nb\nc"), 3)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_blank_interior_line_counts(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_single_line_without_newline(self):
        self.assertEqual(counter.count_lines("hello"), 1)


class CountCharsTests(unittest.TestCase):
    def test_counts_all_characters_including_whitespace(self):
        self.assertEqual(counter.count_chars("ab cd\n"), 6)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_characters_not_bytes(self):
        # "héllo wörld" is 11 characters but 13 bytes in UTF-8.
        self.assertEqual(counter.count_chars("héllo wörld"), 11)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`

Expected: every test errors with `ImportError: cannot import name 'counter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py` with exactly this content:

```python
"""Pure text statistics. No I/O, no state."""


def count_words(text):
    """Return the number of whitespace-separated tokens in *text*."""
    return len(text.split())


def count_lines(text):
    """Return the number of lines in *text*.

    A trailing newline does not add an empty final line: "a\\nb" and
    "a\\nb\\n" are both 2 lines. The empty string is 0 lines.
    """
    return len(text.splitlines())


def count_chars(text):
    """Return the number of characters in *text*, whitespace included."""
    return len(text)
```

Notes for the implementer:
- `str.split()` with no argument splits on runs of any whitespace and discards
  leading/trailing whitespace — that is exactly the token rule the spec wants.
  Do **not** write `text.split(" ")`; that yields empty strings for runs of
  spaces and would break `test_runs_of_whitespace_are_one_separator`.
- `str.splitlines()` gives the trailing-newline rule for free: `"a\nb\n"` and
  `"a\nb"` both yield `["a", "b"]`, and `""` yields `[]`. Do **not** write
  `text.count("\n")` or `text.split("\n")`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: `OK`, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter with word, line, and char stats"
```

---

### Task 2: Formatter — render a stats dict to a report string

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing at import time. It receives a dict with the integer keys
  `"words"`, `"lines"`, and `"chars"` — the same three quantities Task 1's
  functions produce — but it does not import `counter`.
- Produces:
  - `format_report(stats: dict) -> str`

  Returns a three-line string, lines joined by `"\n"`, no trailing newline, in
  the fixed order words, lines, chars. Task 3 imports it.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py` with exactly this content:

```python
import unittest

from wordstat import formatter


class FormatReportTests(unittest.TestCase):
    def test_renders_three_labelled_lines(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_renders_zeros(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_has_no_trailing_newline(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_key_order_of_input_does_not_matter(self):
        report = formatter.format_report({"chars": 57, "lines": 3, "words": 12})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: every test errors with `ImportError: cannot import name 'formatter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py` with exactly this content:

```python
"""Render a stats mapping as a human-readable report."""

FIELDS = ("words", "lines", "chars")


def format_report(stats):
    """Return a three-line report for *stats*.

    *stats* maps "words", "lines", and "chars" to integers. The report lines
    are always in that order regardless of the mapping's own key order, and
    the returned string has no trailing newline.
    """
    return "\n".join("{}: {}".format(field, stats[field]) for field in FIELDS)
```

Note for the implementer: iterate `FIELDS`, not `stats`. Iterating the dict
would let the caller's key order leak into the report and would break
`test_key_order_of_input_does_not_matter`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: `OK`, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter for the stats report"
```

---

### Task 3: CLI — argparse entry point composing counter and formatter

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes:
  - `wordstat.counter.count_words(text) -> int`
  - `wordstat.counter.count_lines(text) -> int`
  - `wordstat.counter.count_chars(text) -> int`
  - `wordstat.formatter.format_report(stats) -> str` where `stats` has keys
    `"words"`, `"lines"`, `"chars"`
- Produces:
  - `main(argv=None) -> int`

  Parses one positional `path` from `argv` (a list of strings; `None` means use
  `sys.argv[1:]`), prints the report to stdout, and **returns** `0`. On an
  unreadable path it prints a message to stderr and returns `1`. It does not
  call `sys.exit` — only the `__main__` guard does.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py` with exactly this content:

```python
import contextlib
import io
import os
import tempfile
import unittest

from wordstat import cli


class CliTestCase(unittest.TestCase):
    def run_main(self, argv):
        """Run cli.main(argv), returning (exit_code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(argv)
        return code, out.getvalue(), err.getvalue()

    def write_file(self, text):
        """Write *text* as UTF-8 to a temp file and return its path."""
        handle = tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", encoding="utf-8", delete=False
        )
        with handle:
            handle.write(text)
        self.addCleanup(os.unlink, handle.name)
        return handle.name


class MainSuccessTests(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_file("the quick brown fox\njumps over\n")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 6\nlines: 2\nchars: 31\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_zeros(self):
        path = self.write_file("")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")

    def test_utf8_file_counts_characters(self):
        # 11 characters, 13 UTF-8 bytes, plus the newline.
        path = self.write_file("héllo wörld\n")
        code, out, _ = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")


class MainErrorTests(CliTestCase):
    def test_missing_file_returns_one_with_stderr_message(self):
        code, out, err = self.run_main(["/no/such/file.txt"])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("/no/such/file.txt", err)
        self.assertIn("cannot read", err)

    def test_directory_path_is_an_error(self):
        directory = tempfile.mkdtemp()
        self.addCleanup(os.rmdir, directory)
        code, out, err = self.run_main([directory])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("cannot read", err)

    def test_missing_argument_exits_with_usage_error(self):
        with self.assertRaises(SystemExit) as caught:
            self.run_main([])
        self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

Notes on the expected numbers, so the implementer can check them by hand:
- `"the quick brown fox\njumps over\n"` — words: `the quick brown fox jumps
  over` = 6. Lines: `"the quick brown fox"`, `"jumps over"` = 2. Chars: 19 for
  the first line + 1 newline + 10 for the second + 1 newline = 31.
- `"héllo wörld\n"` — words 2, lines 1, chars 12 (11 letters/space + newline).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: every test errors with `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py` with exactly this content:

```python
"""Command-line entry point: read a file, print its stats."""

import argparse
import sys

from wordstat import counter, formatter


def build_parser():
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print word, line, and character counts for a text file.",
    )
    parser.add_argument("path", help="path to the text file to measure")
    return parser


def main(argv=None):
    """Print a stats report for the file named in *argv*.

    Returns 0 on success, or 1 if the file could not be read.
    """
    args = build_parser().parse_args(argv)

    try:
        with open(args.path, encoding="utf-8") as handle:
            text = handle.read()
    except OSError as exc:
        print(
            "wordstat: cannot read {}: {}".format(args.path, exc.strerror),
            file=sys.stderr,
        )
        return 1

    stats = {
        "words": counter.count_words(text),
        "lines": counter.count_lines(text),
        "chars": counter.count_chars(text),
    }
    print(formatter.format_report(stats))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

Notes for the implementer:
- Catch `OSError`, not `FileNotFoundError`. A directory raises
  `IsADirectoryError` and an unreadable file raises `PermissionError`; both are
  `OSError` subclasses, and both should be a clean message plus exit `1` rather
  than a traceback. `test_directory_path_is_an_error` pins this.
- Pass `encoding="utf-8"` explicitly. Without it, `open` uses the platform's
  locale encoding, so `test_utf8_file_counts_characters` would count bytes (or
  raise) on a non-UTF-8 locale.
- `print(...)` adds the trailing newline that `format_report` deliberately
  omits, which is why the expected stdout in the tests ends with `\n`.
- `main` returns its code; only the `__main__` guard calls `sys.exit`. Do not
  call `sys.exit` inside `main` — the tests call it directly and check the
  return value.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: `OK`, 6 tests.

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest discover -v`

Expected: `OK`, 23 tests (13 counter + 4 formatter + 6 cli).

- [ ] **Step 6: Verify the CLI works end to end**

```bash
printf 'the quick brown fox\njumps over\n' > /tmp/wordstat-demo.txt
python3 -m wordstat.cli /tmp/wordstat-demo.txt; echo "exit=$?"
python3 -m wordstat.cli /no/such/file.txt; echo "exit=$?"
rm /tmp/wordstat-demo.txt
```

Expected: the first command prints `words: 6`, `lines: 2`, `chars: 31` and
`exit=0`. The second prints `wordstat: cannot read /no/such/file.txt: No such
file or directory` on stderr and `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add cli composing counter and formatter"
```
