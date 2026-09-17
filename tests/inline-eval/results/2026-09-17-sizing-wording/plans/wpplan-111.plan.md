# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python CLI that reads a text file and prints its word, line, and character counts as a three-line report.

**Architecture:** Three layers with one responsibility each, built bottom-up. `wordstat/counter.py` holds pure `str -> int` functions with no I/O. `wordstat/formatter.py` turns a stats dict into a report string, also pure. `wordstat/cli.py` is the only module that touches the filesystem, `sys.stdout`/`sys.stderr`, or `argparse`; it composes the other two. Because the bottom two layers are pure, their tests need no fixtures or mocking, and the CLI tests only need a temp directory.

**Tech Stack:** Python 3 standard library only. `unittest` for tests, `argparse` for argument parsing, `tempfile` + `contextlib.redirect_stdout`/`redirect_stderr` for CLI tests.

**Spec:** `design.md` (in this same directory)

## Global Constraints

- **Standard library only.** No third-party runtime or test dependencies. No `requirements.txt`, no `pytest`.
- **Tests live at the repo root**, not in a `tests/` directory: `test_counter.py`, `test_formatter.py`, `test_cli.py`.
- **Tests run with `python3 -m unittest`** from the repo root. Bare `python3 -m unittest` performs discovery with the default `test*.py` pattern, which matches all three files.
- **Package layout is fixed by the spec:** `wordstat/__init__.py` (already exists, empty — do not modify it), `wordstat/counter.py`, `wordstat/formatter.py`, `wordstat/cli.py`.
- **Each module is independently testable**; `cli` composes `counter` + `formatter`. `counter` and `formatter` must not import each other, and neither may import `cli`.
- **Work directly on `main`.** This is a local scratch repo with no remote — commit locally, never push.

## Review Focus

Input classes the spec implies but does not spell out. Each line names the input and the behavior a reasonable person expects; each has a test assigned to the task that owns the code.

- **Empty text** — `count_words("")`, `count_lines("")`, `count_chars("")` are all `0`; `""` has zero lines, not one. Tested in Task 1.
- **Whitespace-only text** — `"   \n\t  "` has zero words, since `str.split()` with no argument discards leading/trailing runs. Tested in Task 1.
- **Runs of mixed whitespace between words** — `"one  two\tthree\nfour"` is 4 words, not 5 or 7; a double space, a tab, and a newline each separate exactly one word boundary. Tested in Task 1.
- **A lone newline** — `count_lines("\n")` is `1` (one empty line), which is the flip side of the spec's trailing-newline rule and the case most likely to be got wrong by a hand-rolled `split("\n")`. Tested in Task 1.
- **CRLF line endings** — `"a\r\nb\r\n"` is 2 lines, not 4; `str.splitlines()` gives this for free. Tested in Task 1.
- **Non-ASCII text** — `count_chars` counts characters, not bytes, so `"héllo→"` is `6`. This forces the CLI to open files in text mode with an explicit `encoding="utf-8"` rather than reading bytes. Tested in Task 1 (pure) and Task 3 (end-to-end).
- **Zero counts in the report** — `format_report` renders `0` values normally rather than blanking or omitting them. Tested in Task 2.
- **A path that exists but is not a readable text file** — a directory, or a file the process cannot read. The spec only names "missing file", but `open()` raises `IsADirectoryError`/`PermissionError` here, both subclasses of `OSError`, so catching `OSError` rather than `FileNotFoundError` handles all three with one branch: message to stderr, return 1. Tested in Task 3 (directory case; a permission-denied case is skipped because it cannot be created portably as root).
- **A file that is not valid UTF-8** — raises `UnicodeDecodeError`, which is *not* an `OSError`, so it needs its own name in the `except` clause. Without it the CLI dies with a traceback instead of returning 1. Tested in Task 3.
- **No path argument at all** — `argparse` prints usage to stderr and raises `SystemExit(2)`. `main` does not return `1` here; the exit code is argparse's, and that is the correct Unix convention for a usage error. Tested in Task 3 so the behavior is pinned rather than accidental.
- **Report has exactly one trailing newline on stdout** — `format_report` returns a string with no trailing newline, and `print()` adds exactly one. Tested in Task 2 (no trailing newline in the return value) and Task 3 (exactly one on stdout).

---

## Task 1: `counter` — pure stat functions

The bottom layer. Three functions, no I/O, no imports beyond nothing at all.

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`
- Do not modify: `wordstat/__init__.py` (already exists and should stay empty)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `count_words(text: str) -> int`
  - `count_lines(text: str) -> int`
  - `count_chars(text: str) -> int`

- [ ] **Step 1: Write the failing test**

Create `test_counter.py` with exactly this content:

```python
import unittest

from wordstat import counter


class CountWordsTest(unittest.TestCase):
    def test_counts_whitespace_separated_tokens(self):
        self.assertEqual(counter.count_words("one two three"), 3)

    def test_empty_text_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_text_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t  "), 0)

    def test_runs_of_mixed_whitespace_separate_one_word(self):
        self.assertEqual(counter.count_words("one  two\tthree\nfour"), 4)

    def test_leading_and_trailing_whitespace_is_not_a_word(self):
        self.assertEqual(counter.count_words("  one two  "), 2)


class CountLinesTest(unittest.TestCase):
    def test_counts_lines_without_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_lone_newline_is_one_empty_line(self):
        self.assertEqual(counter.count_lines("\n"), 1)

    def test_blank_line_in_the_middle_counts(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)

    def test_crlf_endings_count_once(self):
        self.assertEqual(counter.count_lines("a\r\nb\r\n"), 2)


class CountCharsTest(unittest.TestCase):
    def test_counts_characters_including_whitespace(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo→"), 6)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_counter -v`

Expected: an `ImportError` collected as an error — `ImportError: cannot import name 'counter' from 'wordstat'`. The module does not exist yet, so the failure happens at import time and no individual test runs.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py`:

```python
"""Pure statistics over text. No I/O lives here."""


def count_words(text):
    """Number of whitespace-separated tokens in ``text``."""
    return len(text.split())


def count_lines(text):
    """Number of lines in ``text``.

    A trailing newline does not create an empty final line: both ``"a\\nb"``
    and ``"a\\nb\\n"`` are 2 lines, and ``""`` is 0 lines.
    """
    return len(text.splitlines())


def count_chars(text):
    """Number of characters in ``text``, including whitespace."""
    return len(text)
```

Why `str.split()` with no argument: it splits on runs of any whitespace and discards leading/trailing whitespace, which is exactly the "whitespace-separated tokens" rule. `text.split(" ")` would be wrong — it yields empty strings for double spaces.

Why `str.splitlines()`: it treats a trailing line terminator as a terminator rather than a separator, gives `[]` for `""`, and already handles `\r\n`. `text.split("\n")` would be wrong on all three counts.

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_counter -v`

Expected: `OK`, 14 tests run.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter with word, line, and char stats"
```

---

## Task 2: `formatter` — render a stats dict to a report

Also pure. Takes the dict shape the CLI will build and returns the exact report text.

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing from Task 1 at import time. It receives a dict with the integer keys `"words"`, `"lines"`, `"chars"` — the values `counter.count_words` / `count_lines` / `count_chars` return.
- Produces: `format_report(stats: dict) -> str` returning three lines joined by `"\n"`, in the order words, lines, chars, with **no** trailing newline.

- [ ] **Step 1: Write the failing test**

Create `test_formatter.py` with exactly this content:

```python
import unittest

from wordstat import formatter


class FormatReportTest(unittest.TestCase):
    def test_renders_three_labelled_lines_in_order(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_has_no_trailing_newline(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_renders_zero_counts(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_output_order_does_not_follow_dict_insertion_order(self):
        report = formatter.format_report({"chars": 3, "lines": 2, "words": 1})
        self.assertEqual(report, "words: 1\nlines: 2\nchars: 3")

    def test_extra_keys_are_ignored(self):
        report = formatter.format_report(
            {"words": 1, "lines": 2, "chars": 3, "bytes": 99}
        )
        self.assertEqual(report, "words: 1\nlines: 2\nchars: 3")


if __name__ == "__main__":
    unittest.main()
```

`test_output_order_does_not_follow_dict_insertion_order` is the one that matters most here: it catches an implementation that iterates `stats.items()` instead of reading the three keys by name.

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_formatter -v`

Expected: an error — `ImportError: cannot import name 'formatter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py`:

```python
"""Render a stats mapping as a human-readable report. No I/O lives here."""

_FIELDS = ("words", "lines", "chars")


def format_report(stats):
    """Return a 3-line report for ``stats``.

    ``stats`` maps ``"words"``, ``"lines"`` and ``"chars"`` to integers. The
    returned string has no trailing newline; the caller decides how to emit it.
    """
    return "\n".join("{}: {}".format(field, stats[field]) for field in _FIELDS)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_formatter -v`

Expected: `OK`, 5 tests run.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter for the stats report"
```

---

## Task 3: `cli` — argparse entry point

The only module with I/O. Parses one positional `path`, reads the file, calls `counter` three times, renders via `formatter`, prints to stdout, returns 0. Unreadable file → message on stderr, return 1.

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes, from Task 1: `counter.count_words(text)`, `counter.count_lines(text)`, `counter.count_chars(text)` — each `str -> int`. From Task 2: `formatter.format_report(stats)`, where `stats` is `{"words": int, "lines": int, "chars": int}`, returning a string with no trailing newline.
- Produces: `main(argv=None) -> int`. `argv` is the argument list **without** the program name (as in `sys.argv[1:]`); `None` means read `sys.argv[1:]`. Returns `0` on success, `1` on an unreadable path. Raises `SystemExit(2)` via argparse when `path` is missing.

- [ ] **Step 1: Write the failing test**

Create `test_cli.py` with exactly this content:

```python
import contextlib
import io
import os
import tempfile
import unittest

from wordstat import cli


class CliTestCase(unittest.TestCase):
    """Shared temp-directory and output-capture helpers."""

    def setUp(self):
        tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(tmpdir.cleanup)
        self.tmpdir = tmpdir.name

    def write_text(self, name, text):
        path = os.path.join(self.tmpdir, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        return path

    def write_bytes(self, name, data):
        path = os.path.join(self.tmpdir, name)
        with open(path, "wb") as handle:
            handle.write(data)
        return path

    def run_cli(self, argv):
        """Call cli.main(argv), returning (exit_code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(argv)
        return code, out.getvalue(), err.getvalue()


class SuccessTest(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_text("sample.txt", "one two\nthree\n")
        code, out, err = self.run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 3\nlines: 2\nchars: 14\n")
        self.assertEqual(err, "")

    def test_stdout_ends_with_exactly_one_newline(self):
        path = self.write_text("sample.txt", "one two\nthree\n")
        _, out, _ = self.run_cli([path])
        self.assertTrue(out.endswith("\n"))
        self.assertFalse(out.endswith("\n\n"))

    def test_counts_unicode_content_as_characters(self):
        path = self.write_text("unicode.txt", "héllo wörld\n")
        code, out, _ = self.run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")

    def test_empty_file_reports_zeroes(self):
        path = self.write_text("empty.txt", "")
        code, out, _ = self.run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")


class FailureTest(CliTestCase):
    def test_missing_file_reports_to_stderr_and_returns_one(self):
        path = os.path.join(self.tmpdir, "nope.txt")
        code, out, err = self.run_cli([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("nope.txt", err)

    def test_directory_path_returns_one(self):
        code, out, err = self.run_cli([self.tmpdir])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertNotEqual(err, "")

    def test_undecodable_bytes_return_one(self):
        path = self.write_bytes("binary.bin", b"\xff\xfe\x00\x01")
        code, out, err = self.run_cli([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertNotEqual(err, "")

    def test_missing_argument_is_an_argparse_usage_error(self):
        with self.assertRaises(SystemExit) as caught:
            self.run_cli([])
        self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

Two things worth knowing about this test file, since they are easy to get wrong:

- The expected numbers are arithmetic on the fixture strings, not guesses. `"one two\nthree\n"` is 3 words, 2 lines, and 14 characters (`3 + 1 + 3 + 1 + 5 + 1`). `"héllo wörld\n"` is 2 words, 1 line, 12 characters — the accented letters are one character each, which is the point of the test.
- `run_cli` redirects stderr *around* the `cli.main` call, so in `test_missing_argument_is_an_argparse_usage_error` argparse's usage message is captured rather than printed, and `SystemExit` still propagates out of the `with` block to `assertRaises`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_cli -v`

Expected: an error — `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py`:

```python
"""Command-line entry point: composes counter + formatter over a file."""

import argparse
import sys

from wordstat import counter, formatter


def _build_parser():
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print word, line and character counts for a text file.",
    )
    parser.add_argument("path", help="path to the text file to measure")
    return parser


def main(argv=None):
    """Run the CLI. Returns 0 on success, 1 if ``path`` cannot be read."""
    args = _build_parser().parse_args(argv)

    try:
        with open(args.path, "r", encoding="utf-8") as handle:
            text = handle.read()
    except (OSError, UnicodeDecodeError) as exc:
        print("wordstat: cannot read {}: {}".format(args.path, exc), file=sys.stderr)
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

Notes on the choices here, each of which a test in Step 1 pins:

- `parse_args(argv)` with `argv=None` falls through to argparse's own `sys.argv[1:]` default, so `main()` works both as a library call and from `__main__`.
- The `except` clause names `UnicodeDecodeError` alongside `OSError` because it is a `ValueError`, not an `OSError` — omitting it turns a binary file into an uncaught traceback.
- `encoding="utf-8"` is explicit rather than left to the platform default, so `chars` counts characters consistently regardless of the user's locale.
- `main` returns an int and never calls `sys.exit` itself; only the `__main__` block exits. That is what makes the CLI testable in-process.

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_cli -v`

Expected: `OK`, 8 tests run.

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`

Expected: `OK`, 27 tests run (14 + 5 + 8). Discovery picks up all three `test*.py` files from the repo root.

- [ ] **Step 6: Smoke-test the real CLI**

```bash
printf 'one two\nthree\n' > /tmp/wordstat-smoke.txt
python3 -m wordstat.cli /tmp/wordstat-smoke.txt; echo "exit=$?"
python3 -m wordstat.cli /tmp/definitely-not-here.txt; echo "exit=$?"
rm -f /tmp/wordstat-smoke.txt
```

Expected: the first command prints

```
words: 3
lines: 2
chars: 14
```

followed by `exit=0`. The second prints a single `wordstat: cannot read ...` line to stderr followed by `exit=1`, and no report.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add wordstat CLI entry point"
```
