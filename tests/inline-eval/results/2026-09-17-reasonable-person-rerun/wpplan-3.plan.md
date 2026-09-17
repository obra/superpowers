# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package with a CLI that reads a text file and prints a three-line report of its word, line, and character counts.

**Architecture:** Three modules with one responsibility each: `counter.py` holds pure `str -> int` functions with no I/O, `formatter.py` turns a stats dict into the report string, and `cli.py` is the only module that touches the filesystem, `sys.argv`, stdout, or stderr. `cli` composes the other two and never reimplements their logic. Tests sit at the repo root, one file per module, and run under `python3 -m unittest`.

**Tech Stack:** Python 3 standard library only — `argparse`, `sys`, `unittest`, `tempfile`, `contextlib`, `io`. No third-party runtime or test dependencies.

**Spec:** `design.md` (in this same directory)

## Global Constraints

- Standard library only — no third-party imports in package code or tests.
- Tests live at the repo root (`test_counter.py`, `test_formatter.py`, `test_cli.py`) and must be runnable with `python3 -m unittest` from the repo root.
- Package code lives under `wordstat/`; `wordstat/__init__.py` already exists and stays an empty package marker (do not add re-exports to it).
- Each module is independently testable: `counter` and `formatter` do no I/O and import nothing from each other; only `cli` imports both.
- `counter.count_lines`: a trailing newline does not add an empty final line — `"a\nb"` and `"a\nb\n"` are both `2`.
- `formatter.format_report` returns exactly three lines joined by `\n`, with no trailing newline: `"words: 12\nlines: 3\nchars: 57"`.
- `cli.main(argv)` returns an `int` exit code: `0` on success, `1` when the file cannot be read. It returns the code; it does not call `sys.exit` itself (except under the `__main__` guard).
- This is a local scratch repo with no remote. Work directly on `main`; commit after each task, never push.

## Review Focus

The spec fixes the happy path but is silent on these inputs. Each line names the input and the behavior a reasonable user expects; each has a test pinned to the task that owns the code, noted in brackets.

- Empty file (0 bytes) → report of all zeros, exit 0, not a crash or a spurious line count of 1. [Task 1 `test_empty_text_has_no_lines`, Task 3 `test_empty_file_reports_zeroes`]
- Whitespace-only text → 0 words but a non-zero char count. [Task 1 `test_whitespace_only_text_has_no_words`]
- Runs of mixed whitespace (tabs, double spaces, blank lines) between words → counted as one separator, not as empty words. [Task 1 `test_collapses_runs_of_mixed_whitespace`]
- CRLF (`\r\n`) line endings → one line break, not two. [Task 1 `test_crlf_counts_as_one_break`]
- Non-ASCII text → `count_chars` counts characters (code points), not UTF-8 bytes. [Task 1 `test_counts_code_points_not_bytes`, Task 3 `test_unicode_counts_code_points`]
- Path that exists but is a directory → same failure shape as a missing file (message to stderr, exit 1), not an unhandled traceback. [Task 3 `test_directory_path_is_an_error`]
- File whose bytes are not valid UTF-8 → message to stderr, exit 1, not an unhandled `UnicodeDecodeError`. [Task 3 `test_non_utf8_file_is_an_error`]
- On any failure, stdout stays empty — the error goes to stderr only, so `wordstat f > out.txt` never writes a half report. [Task 3 `test_missing_file_reports_error`]
- No positional argument at all → argparse's own usage message and `SystemExit(2)`; `main` deliberately does not swallow this. [Task 3 `test_missing_argument_exits_two`]

---

## File Structure

| File | Responsibility |
|---|---|
| `wordstat/__init__.py` | Package marker. Already exists, stays empty. |
| `wordstat/counter.py` | Pure stat functions: `count_words`, `count_lines`, `count_chars`. No I/O, no imports. |
| `wordstat/formatter.py` | `format_report(stats)` → report string. No I/O, no imports. |
| `wordstat/cli.py` | argparse entry point: parse args, read the file, call `counter` + `formatter`, print, return an exit code. The only module with side effects. |
| `test_counter.py` | Unit tests for `wordstat.counter`. |
| `test_formatter.py` | Unit tests for `wordstat.formatter`. |
| `test_cli.py` | Tests for `wordstat.cli.main`, using real temp files and captured stdout/stderr. |

---

### Task 1: `counter` — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `count_words(text: str) -> int` — number of whitespace-separated tokens.
  - `count_lines(text: str) -> int` — number of lines; a trailing newline adds no empty final line.
  - `count_chars(text: str) -> int` — number of characters, whitespace included.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py` with exactly this content:

```python
import unittest

from wordstat import counter


class CountWordsTests(unittest.TestCase):
    def test_counts_whitespace_separated_tokens(self):
        self.assertEqual(counter.count_words("the quick brown fox"), 4)

    def test_collapses_runs_of_mixed_whitespace(self):
        self.assertEqual(counter.count_words("a \t b\n\nc  "), 3)

    def test_empty_text_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_text_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t "), 0)


class CountLinesTests(unittest.TestCase):
    def test_counts_lines_without_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_single_line_without_newline(self):
        self.assertEqual(counter.count_lines("solo"), 1)

    def test_blank_interior_line_counts(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)

    def test_crlf_counts_as_one_break(self):
        self.assertEqual(counter.count_lines("a\r\nb\r\n"), 2)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)


class CountCharsTests(unittest.TestCase):
    def test_counts_all_characters_including_whitespace(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_code_points_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo→"), 6)
```

Why these cases: the three `count_words` whitespace cases pin down that words come from `str.split()` semantics rather than counting spaces; the `count_lines` group pins the trailing-newline rule from the spec plus the empty-file and CRLF cases from Review Focus; `test_counts_code_points_not_bytes` fails if someone reaches for `len(text.encode())` (that would be 8, not 6).

- [ ] **Step 2: Run the tests to verify they fail**

Run from the repo root: `python3 -m unittest test_counter -v`

Expected: an error, not passes — `ModuleNotFoundError` / `ImportError: cannot import name 'counter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py`:

```python
"""Pure text statistics. No I/O, no dependencies."""


def count_words(text):
    """Return the number of whitespace-separated tokens in ``text``."""
    return len(text.split())


def count_lines(text):
    """Return the number of lines in ``text``.

    A trailing newline does not add an empty final line: both ``"a\\nb"``
    and ``"a\\nb\\n"`` are 2 lines. The empty string is 0 lines.
    """
    return len(text.splitlines())


def count_chars(text):
    """Return the number of characters in ``text``, whitespace included."""
    return len(text)
```

`str.split()` with no argument collapses runs of whitespace and drops leading/trailing whitespace, which gives the word behavior for free. `str.splitlines()` gives the trailing-newline and CRLF behavior for free — this is exactly why the tests were written against those semantics.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: 13 tests, all PASS.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter module with word, line, and char stats"
```

---

### Task 2: `formatter` — render a stats dict as a report

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing (it takes a plain dict; it does not import `counter`).
- Produces: `format_report(stats: dict) -> str` — given `{"words": int, "lines": int, "chars": int}`, returns `"words: W\nlines: L\nchars: C"` with no trailing newline.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py` with exactly this content:

```python
import unittest

from wordstat import formatter


class FormatReportTests(unittest.TestCase):
    def test_renders_three_labelled_lines(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_renders_zeroes(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_has_no_trailing_newline(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))
        self.assertEqual(len(report.splitlines()), 3)

    def test_ignores_extra_keys(self):
        report = formatter.format_report(
            {"words": 1, "lines": 2, "chars": 3, "paragraphs": 9}
        )
        self.assertEqual(report, "words: 1\nlines: 2\nchars: 3")
```

Why these cases: the first is the spec's own example. `test_has_no_trailing_newline` matters because `cli` uses `print()`, which adds one — a trailing newline here would produce a blank line in real output, and no equality test on a single string would obviously flag it. `test_ignores_extra_keys` documents that the formatter reads the three keys it knows rather than iterating whatever it is handed, so key order in the caller's dict can never reorder the report.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: `ImportError: cannot import name 'formatter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py`:

```python
"""Render a stats mapping as a human-readable report. No I/O."""


def format_report(stats):
    """Return a three-line report for ``stats``.

    ``stats`` must contain the keys ``"words"``, ``"lines"`` and ``"chars"``.
    The returned string has no trailing newline.
    """
    return "\n".join(
        [
            "words: {}".format(stats["words"]),
            "lines: {}".format(stats["lines"]),
            "chars: {}".format(stats["chars"]),
        ]
    )
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: 4 tests, all PASS.

- [ ] **Step 5: Run the whole suite so far**

Run: `python3 -m unittest -v`

Expected: 17 tests, all PASS (Task 1's 13 plus these 4). This confirms root-level discovery picks up both files.

- [ ] **Step 6: Commit**

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
- Consumes: `counter.count_words(text) -> int`, `counter.count_lines(text) -> int`, `counter.count_chars(text) -> int`, `formatter.format_report(stats) -> str` (keys `"words"`, `"lines"`, `"chars"`).
- Produces: `cli.main(argv=None) -> int`. `argv` is the argument list *without* the program name (e.g. `["notes.txt"]`); `None` means read `sys.argv[1:]`. Returns `0` after printing the report to stdout, `1` after printing an error to stderr. Raises `SystemExit(2)` from argparse when the positional argument is missing or unparseable.

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
    """Shared helpers: a scratch directory and a capturing call to main()."""

    def setUp(self):
        tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(tmpdir.cleanup)
        self.tmpdir = tmpdir.name

    def write_file(self, name, data):
        """Write ``data`` (str or bytes) into the scratch dir; return the path."""
        path = os.path.join(self.tmpdir, name)
        if isinstance(data, bytes):
            with open(path, "wb") as handle:
                handle.write(data)
        else:
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(data)
        return path

    def run_main(self, argv):
        """Call main(argv); return (exit_code, stdout_text, stderr_text)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(argv)
        return code, out.getvalue(), err.getvalue()


class SuccessTests(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_file("notes.txt", "one two\nthree\n")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 3\nlines: 2\nchars: 14\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_zeroes(self):
        path = self.write_file("empty.txt", "")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")
        self.assertEqual(err, "")

    def test_unicode_counts_code_points(self):
        path = self.write_file("uni.txt", "héllo→\n")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 1\nlines: 1\nchars: 7\n")
        self.assertEqual(err, "")


class FailureTests(CliTestCase):
    def test_missing_file_reports_error(self):
        path = os.path.join(self.tmpdir, "no-such-file.txt")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("no-such-file.txt", err)
        self.assertTrue(err.endswith("\n"))

    def test_directory_path_is_an_error(self):
        code, out, err = self.run_main([self.tmpdir])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(self.tmpdir, err)

    def test_non_utf8_file_is_an_error(self):
        path = self.write_file("binary.dat", b"\xff\xfe\x00nope")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("UTF-8", err)

    def test_missing_argument_exits_two(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err), self.assertRaises(SystemExit) as caught:
            cli.main([])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage", err.getvalue())
```

Why these cases: `test_prints_report_and_returns_zero` is the end-to-end wiring check — `"one two\nthree\n"` is 3 words, 2 lines, and 14 characters, and the trailing `\n` in the expected stdout is the one `print()` adds. Every failure test asserts `out == ""` as well as the exit code, because a partially written report on failure is the bug that redirecting stdout to a file would expose. Real temp files are used rather than mocks so the tests exercise the actual `open()` behavior for missing paths, directories, and undecodable bytes.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py`:

```python
"""Command-line entry point: read a file, print its text statistics."""

import argparse
import sys

from . import counter
from . import formatter


def _build_parser():
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print word, line, and character counts for a text file.",
    )
    parser.add_argument("path", help="path to the text file to measure")
    return parser


def main(argv=None):
    """Run the CLI. Return 0 on success, 1 if the file cannot be read."""
    args = _build_parser().parse_args(argv)

    try:
        with open(args.path, encoding="utf-8") as handle:
            text = handle.read()
    except OSError as exc:
        reason = exc.strerror or str(exc)
        print("wordstat: cannot read {}: {}".format(args.path, reason), file=sys.stderr)
        return 1
    except UnicodeDecodeError:
        print(
            "wordstat: cannot read {}: not valid UTF-8 text".format(args.path),
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

Notes for the implementer: read the whole file *before* printing anything, so a failure can never emit a partial report. `UnicodeDecodeError` is a `ValueError`, not an `OSError`, so it needs its own `except` clause — the ordering above is fine either way since the two classes are unrelated. `exc.strerror or str(exc)` guards against the rare `OSError` with no `strerror` set. `parse_args` raising `SystemExit(2)` for a missing argument is intentional and is not caught.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: 7 tests, all PASS.

- [ ] **Step 5: Run the full suite**

Run: `python3 -m unittest -v`

Expected: 24 tests, all PASS (13 + 4 + 7).

- [ ] **Step 6: Smoke-test the real CLI by hand**

```bash
printf 'hello world\nsecond line\n' > /tmp/wordstat-smoke.txt
python3 -m wordstat.cli /tmp/wordstat-smoke.txt
python3 -m wordstat.cli /tmp/definitely-missing.txt; echo "exit=$?"
python3 -m wordstat.cli --help
```

Expected: `words: 4 / lines: 2 / chars: 24` on three lines; then a `wordstat: cannot read ...: No such file or directory` line on stderr with `exit=1`; then the argparse usage/help text. Finally: `rm -f /tmp/wordstat-smoke.txt`.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add cli composing counter and formatter into a report"
```

---

## Done Criteria

- `python3 -m unittest` from the repo root: 24 tests, 0 failures, 0 errors.
- `python3 -m wordstat.cli <file>` prints the three-line report and exits 0; a bad path prints to stderr and exits 1.
- No third-party imports anywhere; `wordstat/__init__.py` still empty.
- Three commits on `main`, one per task, nothing pushed.
