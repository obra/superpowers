# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tiny Python CLI, `wordstat`, that reads a text file and prints a three-line report of its word, line, and character counts.

**Architecture:** Three layers, each in its own module and each independently testable. `counter.py` holds pure functions from text to integers (no I/O). `formatter.py` holds one pure function from a stats dict to a report string (no I/O). `cli.py` is the only module that touches the filesystem, stdout, stderr, or process exit codes; it parses arguments, reads the file, calls `counter`, calls `formatter`, prints, and returns an exit code. Because the two lower layers are pure, their tests need no temp files or output capture, and the CLI tests are the only place that needs either.

**Tech Stack:** Python 3 standard library only. `argparse` for argument parsing, `pathlib` for file reading, `unittest` for tests, run via `python3 -m unittest`.

**Spec:** `design.md` (in this repo's root)

## Global Constraints

- Standard library only — no third-party runtime or test dependencies.
- Tests live at the repo root as `test_counter.py`, `test_formatter.py`, `test_cli.py`, and must be discoverable and runnable with `python3 -m unittest`.
- Package layout is exactly: `wordstat/__init__.py` (already exists, empty — leave it empty), `wordstat/counter.py`, `wordstat/formatter.py`, `wordstat/cli.py`.
- Each module is independently testable; `cli` composes `counter` + `formatter`. `counter` and `formatter` must not import each other, must not import `cli`, and must not perform I/O.
- Exact public signatures: `counter.count_words(text) -> int`, `counter.count_lines(text) -> int`, `counter.count_chars(text) -> int`, `formatter.format_report(stats) -> str`, `cli.main(argv) -> int`.
- The stats dict shape is exactly `{"words": w, "lines": l, "chars": c}`.
- The report is exactly three lines in the order words, lines, chars, formatted `"words: 12\nlines: 3\nchars: 57"` — no trailing newline in the returned string.
- `count_lines`: a trailing newline does not add an empty final line — `"a\nb"` and `"a\nb\n"` are both `2`.
- `cli.main` returns `0` on success; a missing file prints a message to stderr and returns `1`.
- This is a local scratch repo with no remote. Work directly on `main`. Commit after each task; never push.

## Review Focus

The spec describes the happy path. These are the input classes it implies but does not spell out, ordered by how likely each is to bite a user. Each line names the expected behavior and the task whose tests pin it.

- **Empty text.** `""` must give `0` words, `0` lines, `0` chars — not `1` line. An empty file is the most common degenerate input a counting tool meets. → Task 1 (`count_lines("") == 0`) and Task 3 (empty file end-to-end).
- **Whitespace-only text.** `"   \n\t  "` has `0` words, but does have lines and chars. → Task 1.
- **Runs of mixed whitespace between words.** Double spaces, tabs, and newlines are all separators, and consecutive separators do not create empty words. → Task 1.
- **Path that exists but is not a readable file** (a directory). This is not literally a "missing file", but the user's experience is identical — the tool cannot read what they named — so it must take the same path: message to stderr, return `1`, never a traceback. → Task 3.
- **A file that is not valid UTF-8.** Reading bytes as text can fail on binary input. A traceback is the wrong answer; so is silently replacing bytes with `U+FFFD`, which would make the reported `chars` a quiet lie. Report to stderr and return `1`. → Task 3.
- **No path argument at all.** `argparse` handles this by writing usage to stderr and raising `SystemExit(2)`. That is acceptable and conventional, but it means `main` does not always return an int, so the behavior gets pinned deliberately rather than discovered. → Task 3.
- **CRLF and blank lines.** `"a\r\nb\r\n"` is 2 lines; `"a\n\nb"` is 3 lines (the blank middle line counts). → Task 1.
- **Non-ASCII text.** `chars` counts characters, not bytes: `"héllo"` is `5`. → Task 1.
- **Zero-valued stats in the report.** The formatter must render `0` as `0`, not as blank or `-`. → Task 2.
- **Stdout stays clean on the error paths.** When the file cannot be read, nothing is printed to stdout — a caller piping the report to another program gets empty input, not a half-report. → Task 3.

---

### Task 1: `counter` — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing (this is the base layer).
- Produces:
  - `count_words(text: str) -> int` — number of whitespace-separated tokens.
  - `count_lines(text: str) -> int` — number of lines; a trailing newline does not add an empty final line.
  - `count_chars(text: str) -> int` — number of characters, whitespace included.

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

    def test_runs_of_mixed_whitespace_are_one_separator(self):
        self.assertEqual(counter.count_words("a  b\tc\nd\r\ne"), 5)

    def test_leading_and_trailing_whitespace_make_no_empty_words(self):
        self.assertEqual(counter.count_words("  hello world  \n"), 2)

    def test_punctuation_stays_attached_to_its_token(self):
        self.assertEqual(counter.count_words("hello, world!"), 2)


class CountLinesTests(unittest.TestCase):
    def test_counts_lines_without_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_an_empty_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_text_without_any_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("just one line"), 1)

    def test_lone_newline_is_one_empty_line(self):
        self.assertEqual(counter.count_lines("\n"), 1)

    def test_blank_interior_lines_count(self):
        self.assertEqual(counter.count_lines("a\n\nb"), 3)

    def test_crlf_line_endings_count_once_each(self):
        self.assertEqual(counter.count_lines("a\r\nb\r\n"), 2)


class CountCharsTests(unittest.TestCase):
    def test_counts_characters(self):
        self.assertEqual(counter.count_chars("hello"), 5)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_whitespace_counts_as_characters(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo"), 5)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`

Expected: an error, not passes — `ImportError: cannot import name 'counter' from 'wordstat'` (the module does not exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py` with exactly this content:

```python
"""Pure functions computing simple statistics about a block of text."""


def count_words(text):
    """Return the number of whitespace-separated tokens in ``text``."""
    return len(text.split())


def count_lines(text):
    """Return the number of lines in ``text``.

    A trailing newline does not add an empty final line: both ``"a\\nb"`` and
    ``"a\\nb\\n"`` are two lines, and ``""`` is zero lines.
    """
    return len(text.splitlines())


def count_chars(text):
    """Return the number of characters in ``text``, whitespace included."""
    return len(text)
```

Notes for the implementer, so the one-liners are not mistaken for guesses:
- `str.split()` with no argument splits on runs of *any* whitespace and discards
  empty leading/trailing fields, which is exactly the word rule above. Do not
  use `text.split(" ")` — that would count `"a  b"` as three words.
- `str.splitlines()` implements the trailing-newline rule directly, and returns
  `[]` for `""`. Do not use `text.count("\n") + 1` — that gives `1` for `""` and
  `3` for `"a\nb\n"`, both wrong per the spec.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: all 17 tests PASS.

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
- Consumes: nothing at import time. It receives a dict shaped exactly `{"words": int, "lines": int, "chars": int}` — the shape `cli` builds in Task 3 from `counter`'s three functions.
- Produces: `format_report(stats: dict) -> str` — a three-line string, `"words: {w}\nlines: {l}\nchars: {c}"`, with no trailing newline.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py` with exactly this content:

```python
import unittest

from wordstat.formatter import format_report


class FormatReportTests(unittest.TestCase):
    def test_renders_the_three_stats_in_order(self):
        report = format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_renders_zeros_as_zeros(self):
        report = format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_has_no_trailing_newline(self):
        report = format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_is_exactly_three_lines(self):
        report = format_report({"words": 5, "lines": 2, "chars": 20})
        self.assertEqual(len(report.split("\n")), 3)

    def test_order_does_not_depend_on_dict_insertion_order(self):
        report = format_report({"chars": 57, "lines": 3, "words": 12})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_large_values_are_rendered_plainly(self):
        report = format_report({"words": 1234567, "lines": 89, "chars": 7654321})
        self.assertEqual(report, "words: 1234567\nlines: 89\nchars: 7654321")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: an error, not passes — `ModuleNotFoundError: No module named 'wordstat.formatter'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py` with exactly this content:

```python
"""Render a stats mapping as a human-readable report."""


def format_report(stats):
    """Return a three-line report for ``stats``.

    ``stats`` is a mapping with the keys ``"words"``, ``"lines"`` and
    ``"chars"``. The returned string has no trailing newline; printing it adds
    one.
    """
    return "\n".join(
        f"{label}: {stats[label]}" for label in ("words", "lines", "chars")
    )
```

The fixed `("words", "lines", "chars")` tuple is what makes the output order
independent of how the caller built the dict — do not iterate `stats` directly.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter module rendering a stats report"
```

---

### Task 3: `cli` — argparse entry point composing counter and formatter

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes:
  - `wordstat.counter.count_words(text) -> int`, `count_lines(text) -> int`, `count_chars(text) -> int` (Task 1).
  - `wordstat.formatter.format_report(stats) -> str`, where `stats` is `{"words": w, "lines": l, "chars": c}` (Task 2).
- Produces: `main(argv) -> int`. `argv` is the argument list *without* the program name (i.e. what you would pass as `sys.argv[1:]`). Returns `0` after printing the report to stdout, `1` after printing an error to stderr.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py` with exactly this content:

```python
import contextlib
import io
import os
import tempfile
import unittest

from wordstat import cli


def run_cli(argv):
    """Run ``cli.main(argv)``, returning ``(exit_code, stdout, stderr)``."""
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = cli.main(argv)
    return code, out.getvalue(), err.getvalue()


class CliSuccessTests(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmpdir.cleanup)

    def write_file(self, name, text):
        path = os.path.join(self.tmpdir.name, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        return path

    def test_prints_report_and_returns_zero(self):
        path = self.write_file("sample.txt", "the quick brown fox\njumps over\n")
        code, out, err = run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 6\nlines: 2\nchars: 31\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_all_zeros(self):
        path = self.write_file("empty.txt", "")
        code, out, err = run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")
        self.assertEqual(err, "")

    def test_file_without_trailing_newline_counts_its_last_line(self):
        path = self.write_file("noeol.txt", "alpha\nbeta")
        code, out, _ = run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 2\nchars: 10\n")


class CliErrorTests(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmpdir.cleanup)

    def test_missing_file_reports_to_stderr_and_returns_one(self):
        missing = os.path.join(self.tmpdir.name, "nope.txt")
        code, out, err = run_cli([missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(missing, err)
        self.assertTrue(err.endswith("\n"))

    def test_directory_path_reports_to_stderr_and_returns_one(self):
        code, out, err = run_cli([self.tmpdir.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(self.tmpdir.name, err)

    def test_non_utf8_file_reports_to_stderr_and_returns_one(self):
        path = os.path.join(self.tmpdir.name, "binary.bin")
        with open(path, "wb") as handle:
            handle.write(b"\xff\xfe\x00\x01")
        code, out, err = run_cli([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(path, err)

    def test_missing_argument_exits_with_usage_error(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as caught:
                cli.main([])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage:", err.getvalue())


if __name__ == "__main__":
    unittest.main()
```

The expected numbers, so a reviewer can check them by hand:
- `"the quick brown fox\njumps over\n"` — 6 words; 2 lines; `20 + 11 = 31` chars.
- `"alpha\nbeta"` — 2 words; 2 lines (no trailing newline); 10 chars.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: an error, not passes — `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py` with exactly this content:

```python
"""Command-line entry point: read a file and print its text statistics."""

import argparse
import sys
from pathlib import Path

from wordstat import counter
from wordstat.formatter import format_report


def _build_parser():
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print word, line, and character counts for a text file.",
    )
    parser.add_argument("path", help="path to the text file to measure")
    return parser


def main(argv):
    """Print a stats report for the file named in ``argv``.

    Returns 0 on success, or 1 if the file could not be read as UTF-8 text.
    """
    args = _build_parser().parse_args(argv)

    try:
        text = Path(args.path).read_text(encoding="utf-8")
    except OSError as exc:
        print(f"wordstat: {args.path}: {exc.strerror}", file=sys.stderr)
        return 1
    except UnicodeDecodeError:
        print(f"wordstat: {args.path}: not valid UTF-8 text", file=sys.stderr)
        return 1

    stats = {
        "words": counter.count_words(text),
        "lines": counter.count_lines(text),
        "chars": counter.count_chars(text),
    }
    print(format_report(stats))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
```

Two decisions worth understanding rather than copying blindly:
- Catching `OSError` (not just `FileNotFoundError`) is what makes a directory
  path, a permission failure, and a missing file all land on the same one-line
  stderr message instead of a traceback. `IsADirectoryError` and
  `PermissionError` are both `OSError` subclasses.
- `UnicodeDecodeError` is a `ValueError`, *not* an `OSError`, so it needs its own
  clause. Do not "fix" binary input with `errors="replace"` — that would report a
  `chars` count for text the file does not contain.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: all 7 tests PASS.

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`

Expected: all 30 tests across `test_counter`, `test_formatter`, and `test_cli` PASS, 0 failures, 0 errors.

- [ ] **Step 6: Check the CLI by hand, end to end**

```bash
python3 -m wordstat.cli design.md
python3 -m wordstat.cli no-such-file.txt; echo "exit=$?"
```

Expected: the first command prints three `label: number` lines for `design.md`
and exits 0. The second prints `wordstat: no-such-file.txt: No such file or
directory` to stderr and prints `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add cli entry point composing counter and formatter"
```

---

## Definition of Done

- `python3 -m unittest` passes from the repo root with 30 tests, 0 failures, 0 errors.
- `wordstat/counter.py`, `wordstat/formatter.py`, `wordstat/cli.py` exist; `wordstat/__init__.py` is still empty.
- No imports outside the standard library anywhere in the package or the tests.
- `counter` and `formatter` contain no I/O and do not import each other or `cli`.
- Three commits on `main`, one per task. Nothing pushed (there is no remote).
