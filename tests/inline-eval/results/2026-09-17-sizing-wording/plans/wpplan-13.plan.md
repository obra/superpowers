# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package whose CLI reads a text file and prints a three-line report of its word, line, and character counts.

**Architecture:** Three single-responsibility modules with no cycles: `counter.py` holds pure `str -> int` functions, `formatter.py` turns a stats dict into a report string, and `cli.py` is the only module that touches the filesystem, `sys`, or `argparse` — it composes the other two. `counter` and `formatter` never import each other or `cli`, so each is testable in isolation. Tests are stdlib `unittest` files at the repo root, one per module, built one task at a time in strict TDD order.

**Tech Stack:** Python 3 standard library only — `argparse`, `sys`, `unittest`, `tempfile`, `io`, `contextlib`, `os`. No third-party packages, no packaging metadata, no test runner beyond `python3 -m unittest`.

**Spec:** `design.md` (in the repo root, alongside this plan)

## Global Constraints

- Standard library only — no third-party imports in package code or test code.
- Tests live at the repo root (`test_counter.py`, `test_formatter.py`, `test_cli.py`) and must be discovered and pass with `python3 -m unittest` run from the repo root.
- Final package layout is exactly `wordstat/__init__.py` (already exists, empty — leave it empty), `wordstat/counter.py`, `wordstat/formatter.py`, `wordstat/cli.py`. Do not add other files to the package.
- Each module is independently testable. `counter` imports nothing from `wordstat`; `formatter` imports nothing from `wordstat`; only `cli` imports `counter` and `formatter`.
- Exact public names and signatures: `counter.count_words(text) -> int`, `counter.count_lines(text) -> int`, `counter.count_chars(text) -> int`, `formatter.format_report(stats) -> str`, `cli.main(argv) -> int`.
- `format_report` takes a dict with keys `"words"`, `"lines"`, `"chars"` and returns a 3-line string in that order, e.g. `"words: 12\nlines: 3\nchars: 57"` — no trailing newline.
- `cli.main` returns `0` on success and `1` when the file cannot be read; the error message goes to stderr, never stdout.
- This is a local scratch repo with no remote. Work directly on `main`. Commit at the end of every task; never push.

## Review Focus

Every line below has a test assigned to it in the task that owns the code. They are listed here because the spec implies them without stating them, and a reviewer should confirm each one still holds.

- **Empty file / empty string.** `count_words("")`, `count_lines("")`, `count_chars("")` are all `0` — an empty text has zero lines, not one. Tested in Task 1 and end-to-end in Task 3.
- **Runs of whitespace and tabs.** `"a  b\tc\nd"` is 4 words; leading/trailing whitespace contributes no words. Tested in Task 1.
- **Whitespace-only text.** `" \t\n "` has 0 words even though it has characters and lines. Tested in Task 1.
- **Blank interior lines.** `"a\n\nb"` is 3 lines — the blank line counts; only a *trailing* newline is absorbed. Tested in Task 1.
- **CRLF line endings.** `"a\r\nb\r\n"` is 2 lines, not 4, while `count_chars` still counts each `\r`. Tested in Task 1.
- **Non-ASCII text.** `count_chars` counts characters, not bytes: `"héllo — ok"` is 10. Tested in Task 1.
- **Zero counts render.** `format_report` with all zeros produces `"words: 0\nlines: 0\nchars: 0"` rather than blanks or omitted lines. Tested in Task 2.
- **Key order is fixed by the formatter, not by the caller's dict.** A dict built in `chars, lines, words` order still renders words-first. Tested in Task 2.
- **Exactly one trailing newline on stdout.** `format_report` returns no trailing newline and `print` supplies exactly one, so the report is not double-spaced. Tested in Task 2 (no trailing newline) and Task 3 (exact stdout bytes).
- **Path that exists but cannot be read as a text file.** A directory, and a file whose bytes are not valid UTF-8, must both produce a stderr message and exit code 1 — not a traceback. `UnicodeDecodeError` is a `ValueError`, not an `OSError`, so catching only `OSError` misses the binary-file case. Tested in Task 3.
- **Missing positional argument.** `cli.main([])` lets argparse print usage to stderr and raise `SystemExit(2)`; `main` does not swallow it and return 1. Tested in Task 3.

---

### Task 1: `counter` — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing (first task; `wordstat/__init__.py` already exists and stays empty).
- Produces: module `wordstat.counter` with `count_words(text: str) -> int`, `count_lines(text: str) -> int`, `count_chars(text: str) -> int`. Task 3 calls all three.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py` with exactly this content:

```python
import unittest

from wordstat import counter


class CountWordsTests(unittest.TestCase):
    def test_counts_whitespace_separated_tokens(self):
        self.assertEqual(counter.count_words("the quick brown fox"), 4)

    def test_collapses_runs_of_whitespace(self):
        self.assertEqual(counter.count_words("a  b\tc\nd"), 4)

    def test_ignores_leading_and_trailing_whitespace(self):
        self.assertEqual(counter.count_words("  hello  "), 1)

    def test_empty_text_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_text_has_no_words(self):
        self.assertEqual(counter.count_words(" \t\n "), 0)


class CountLinesTests(unittest.TestCase):
    def test_counts_lines_without_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_single_line_without_newline(self):
        self.assertEqual(counter.count_lines("hello"), 1)

    def test_blank_interior_lines_count(self):
        self.assertEqual(counter.count_lines("a\n\nb"), 3)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_crlf_endings_count_once(self):
        self.assertEqual(counter.count_lines("a\r\nb\r\n"), 2)


class CountCharsTests(unittest.TestCase):
    def test_counts_every_character_including_whitespace(self):
        self.assertEqual(counter.count_chars("a b\nc"), 5)

    def test_counts_trailing_newline(self):
        self.assertEqual(counter.count_chars("ab\n"), 3)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo — ok"), 10)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from the repo root: `python3 -m unittest test_counter -v`

Expected: FAIL — `ImportError: cannot import name 'counter' from 'wordstat'` (the module does not exist yet). If instead you see `ModuleNotFoundError: No module named 'wordstat'`, you are not in the repo root — `cd` there and rerun.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py` with exactly this content:

```python
"""Pure functions computing simple statistics about a block of text."""


def count_words(text):
    """Return the number of whitespace-separated tokens in ``text``."""
    return len(text.split())


def count_lines(text):
    """Return the number of lines in ``text``.

    A trailing newline does not create an empty final line: ``"a\\nb"`` and
    ``"a\\nb\\n"`` are both 2 lines.
    """
    return len(text.splitlines())


def count_chars(text):
    """Return the number of characters in ``text``, whitespace included."""
    return len(text)
```

`str.split()` with no argument splits on runs of whitespace and discards empty
fields, which is what gives the whitespace-only and leading/trailing cases 0.
`str.splitlines()` gives the trailing-newline and CRLF behavior for free.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: PASS — 15 tests, `OK`.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter module with word, line, and char counts"
```

---

### Task 2: `formatter` — render a stats dict as a report

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing from Task 1 — `formatter` must not import `counter`. It only knows the dict shape `{"words": int, "lines": int, "chars": int}`.
- Produces: module `wordstat.formatter` with `format_report(stats: dict) -> str`, returning three `"label: value"` lines joined by `"\n"` with no trailing newline. Task 3 calls it.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py` with exactly this content:

```python
import unittest

from wordstat import formatter


class FormatReportTests(unittest.TestCase):
    def test_renders_three_labelled_lines(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_has_no_trailing_newline(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_labels_appear_in_fixed_order_regardless_of_dict_order(self):
        report = formatter.format_report({"chars": 57, "lines": 3, "words": 12})
        self.assertEqual(
            report.splitlines(), ["words: 12", "lines: 3", "chars: 57"]
        )

    def test_renders_zero_counts(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: FAIL — `ImportError: cannot import name 'formatter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py` with exactly this content:

```python
"""Render a stats mapping as a human-readable report."""

_FIELDS = ("words", "lines", "chars")


def format_report(stats):
    """Return a 3-line report for ``stats``.

    ``stats`` maps ``"words"``, ``"lines"`` and ``"chars"`` to integers. The
    lines always appear in that order and the result has no trailing newline.
    """
    return "\n".join(f"{field}: {stats[field]}" for field in _FIELDS)
```

Iterating `_FIELDS` rather than `stats` is what makes the output order
independent of the caller's dict insertion order.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: PASS — 4 tests, `OK`.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter module rendering stats as a report"
```

---

### Task 3: `cli` — argparse entry point composing counter and formatter

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `wordstat.counter.count_words(text)`, `wordstat.counter.count_lines(text)`, `wordstat.counter.count_chars(text)` from Task 1; `wordstat.formatter.format_report(stats)` from Task 2, where `stats` is `{"words": int, "lines": int, "chars": int}`.
- Produces: module `wordstat.cli` with `main(argv=None) -> int`. Returns `0` after printing the report to stdout, `1` after printing a message to stderr when the file cannot be read. A missing positional argument is argparse's business: it prints usage to stderr and raises `SystemExit(2)`.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py` with exactly this content:

```python
import io
import os
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout

from wordstat import cli


class CliTests(unittest.TestCase):
    def setUp(self):
        tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(tmpdir.cleanup)
        self.tmpdir = tmpdir.name

    def write_file(self, name, data):
        """Write ``data`` (str as UTF-8, bytes verbatim) and return its path."""
        path = os.path.join(self.tmpdir, name)
        if isinstance(data, bytes):
            with open(path, "wb") as handle:
                handle.write(data)
        else:
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(data)
        return path

    def run_main(self, argv):
        """Call ``cli.main(argv)`` capturing stdout and stderr."""
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = cli.main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_prints_report_and_returns_zero(self):
        path = self.write_file("sample.txt", "the quick brown fox\njumps over\n")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 6\nlines: 2\nchars: 31\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_zeros(self):
        path = self.write_file("empty.txt", "")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")

    def test_non_ascii_file_counts_characters(self):
        path = self.write_file("unicode.txt", "héllo — ok\n")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 3\nlines: 1\nchars: 11\n")

    def test_missing_file_reports_error_and_returns_one(self):
        path = os.path.join(self.tmpdir, "nope.txt")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("nope.txt", err)
        self.assertTrue(err.endswith("\n"))

    def test_directory_path_reports_error_and_returns_one(self):
        code, out, err = self.run_main([self.tmpdir])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(self.tmpdir, err)

    def test_undecodable_file_reports_error_and_returns_one(self):
        path = self.write_file("binary.bin", b"\xff\xfe\x00\x01")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("binary.bin", err)

    def test_missing_argument_exits_with_usage(self):
        with redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit) as raised:
                cli.main([])
        self.assertEqual(raised.exception.code, 2)
        self.assertIn("usage:", err.getvalue())


if __name__ == "__main__":
    unittest.main()
```

Why these numbers: `"the quick brown fox\njumps over\n"` is 6 words, 2 lines,
and 31 characters (19 + newline + 10 + newline). `"héllo — ok\n"` is 3 words,
1 line, and 11 characters — proof that `chars` counts characters rather than
the 14 UTF-8 bytes on disk.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: FAIL — `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py` with exactly this content:

```python
"""Command-line entry point: read a file, print its text statistics."""

import argparse
import sys

from wordstat import counter, formatter


def _build_parser():
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print simple statistics about a text file.",
    )
    parser.add_argument("path", help="path to the text file to analyze")
    return parser


def main(argv=None):
    """Run the CLI. Return 0 on success, 1 if ``path`` cannot be read."""
    args = _build_parser().parse_args(argv)

    try:
        with open(args.path, "r", encoding="utf-8") as handle:
            text = handle.read()
    except (OSError, UnicodeDecodeError) as error:
        print(f"wordstat: cannot read {args.path}: {error}", file=sys.stderr)
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

Notes: `parse_args(None)` falls back to `sys.argv[1:]`, so the `__main__` guard
needs no argument. `OSError` covers the missing-file, directory, and
permission-denied cases; `UnicodeDecodeError` (a `ValueError`, *not* an
`OSError`) covers the binary-file case, which is why both are listed.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: PASS — 7 tests, `OK`.

- [ ] **Step 5: Run the whole suite the way the spec specifies**

Run from the repo root: `python3 -m unittest`

Expected: PASS — 26 tests total across the three test modules, `OK`. This is
the discovery invocation the spec names, so it must work with no arguments.

- [ ] **Step 6: Smoke-test the CLI by hand**

```bash
python3 -m wordstat.cli design.md
echo "exit=$?"
python3 -m wordstat.cli no-such-file.txt
echo "exit=$?"
```

Expected: the first prints a three-line `words:/lines:/chars:` report for
`design.md` and `exit=0`; the second prints a `wordstat: cannot read
no-such-file.txt: ...` line to stderr and `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add cli entry point composing counter and formatter"
```
