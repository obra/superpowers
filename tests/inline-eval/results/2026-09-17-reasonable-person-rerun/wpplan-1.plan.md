# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package that counts words, lines and characters in a text file and prints a three-line report from a CLI.

**Architecture:** Three modules with one responsibility each, composed bottom-up. `counter.py` holds pure `str -> int` functions with no I/O. `formatter.py` turns a stats dict into the report string, also pure. `cli.py` is the only module that touches the filesystem, stdout/stderr and process exit codes; it reads the file, calls `counter` three times, calls `formatter` once, prints, and returns an exit code. Each module is tested in isolation by a test file at the repo root.

**Tech Stack:** Python 3 standard library only — `argparse`, `sys`, `unittest`, plus `tempfile`/`io`/`contextlib`/`subprocess` in tests. No third-party packages, no `setup.py`/`pyproject.toml` (the package is imported from the repo root).

**Spec:** `design.md` (same directory as this plan)

## Global Constraints

- **Standard library only.** No third-party imports in package code or test code.
- **Tests live at the repo root**, named `test_counter.py`, `test_formatter.py`, `test_cli.py`, and are runnable with `python3 -m unittest` from the repo root.
- **Package layout is exactly** `wordstat/{__init__.py,counter.py,formatter.py,cli.py}`. `wordstat/__init__.py` already exists and is empty — leave it empty; it is only a package marker.
- **Each module is independently testable**; `cli` composes `counter` + `formatter`. `counter` and `formatter` must not import each other, and neither may import `cli`, `sys`, `os`, or do any I/O.
- **Report format is exactly** `words: <w>\nlines: <l>\nchars: <c>` with no trailing newline (the trailing newline on stdout comes from `print`).
- Work directly on `main`; this is a local scratch repo with no remote. Commit at the end of every task.

## Review Focus

Input classes and behaviors the spec implies but does not spell out. Each line names the decision this plan makes, and the task whose tests pin it. All of them have tests; the reviewer should confirm those tests exist and still assert these exact behaviors.

- **Empty text** — `count_words("")`, `count_lines("")` and `count_chars("")` are all `0`; an empty file must print `words: 0\nlines: 0\nchars: 0`, not crash and not `lines: 1`. (Tasks 1 and 3)
- **Whitespace-only text** — `count_words("   \n\t  ")` is `0`, not 1. (Task 1)
- **Runs of mixed whitespace** — `"a  b\tc\nd"` is 4 words; tabs, newlines and repeated spaces are all separators and never produce empty tokens. (Task 1)
- **Which characters break a line** — only `\n`. `str.splitlines()` also splits on `\r`, `\x0b`, `\x0c`, `\x85`, `\u2028`, `\u2029`, so a file containing a form feed would report extra lines; the implementation must use `split("\n")`. (Task 1)
- **CRLF files** — `"a\r\nb\r\n"` is 2 lines; the `\r` is counted as a character but is not itself a line break. (Task 1)
- **A single `"\n"`** — 1 line, not 0 and not 2. (Task 1)
- **Blank interior lines** — `"a\n\nb\n"` is 3 lines; only the final trailing newline is absorbed. (Task 1)
- **Non-ASCII text** — `chars` counts Unicode code points, so `"café"` is 4, not 5; the file must be opened with `encoding="utf-8"` explicitly rather than the platform default. (Tasks 1 and 3)
- **Key order of the stats dict** — `format_report` always emits words, then lines, then chars, regardless of the dict's insertion order. (Task 2)
- **Path exists but is not a readable file** — a directory, or a file the process cannot open, is reported to stderr with exit code 1 like a missing file, not a traceback. `IsADirectoryError`/`PermissionError` are `OSError` subclasses, so catching `OSError` covers all three. (Task 3)
- **File that is not valid UTF-8** — reported to stderr with exit code 1. `UnicodeDecodeError` is a `ValueError`, *not* an `OSError`, so it must be caught explicitly. (Task 3)
- **No path argument given** — `argparse`'s standard behavior: usage message to stderr and `SystemExit(2)`. `main([])` therefore raises rather than returning; that is intended. (Task 3)
- **Nothing on stdout when the read fails** — the error path returns before printing the report. (Task 3)

---

## File Structure

| File | Responsibility |
|---|---|
| `wordstat/__init__.py` | Package marker. Already exists, empty. Not modified. |
| `wordstat/counter.py` | Three pure functions: `count_words`, `count_lines`, `count_chars`. No I/O, no imports. |
| `wordstat/formatter.py` | `format_report(stats)` → the three-line report string. No I/O, no imports. |
| `wordstat/cli.py` | `argparse` parser, file reading, composition of counter + formatter, printing, exit codes, `__main__` guard. |
| `test_counter.py` | Unit tests for `counter`. |
| `test_formatter.py` | Unit tests for `formatter`. |
| `test_cli.py` | Tests for `cli.main` with temp files and captured streams, plus one subprocess test of `python3 -m wordstat.cli`. |

---

## Task 1: counter — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `wordstat.counter.count_words(text: str) -> int`
  - `wordstat.counter.count_lines(text: str) -> int`
  - `wordstat.counter.count_chars(text: str) -> int`

  Task 3 imports the module (`from wordstat import counter`) and calls all three.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py` with exactly this content:

```python
import unittest

from wordstat import counter


class CountWordsTests(unittest.TestCase):
    def test_counts_whitespace_separated_tokens(self):
        self.assertEqual(counter.count_words("the quick brown fox"), 4)

    def test_collapses_runs_of_mixed_whitespace(self):
        self.assertEqual(counter.count_words("a  b\tc\nd  \n"), 4)

    def test_empty_text_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_text_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t  "), 0)


class CountLinesTests(unittest.TestCase):
    def test_counts_newline_separated_lines(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_single_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("\n"), 1)

    def test_blank_interior_lines_count(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)

    def test_only_newlines_break_lines(self):
        # str.splitlines() would wrongly split on \x0c and \r.
        self.assertEqual(counter.count_lines("a\x0cb\n"), 1)
        self.assertEqual(counter.count_lines("a\rb\n"), 1)

    def test_crlf_text_counts_two_lines(self):
        self.assertEqual(counter.count_lines("a\r\nb\r\n"), 2)


class CountCharsTests(unittest.TestCase):
    def test_counts_all_characters_including_whitespace(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_non_ascii_characters_once_each(self):
        self.assertEqual(counter.count_chars("café"), 4)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from the repo root:

```bash
python3 -m unittest test_counter -v
```

Expected: an error, not failures — collection blows up with `ImportError: cannot import name 'counter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py` with exactly this content:

```python
"""Pure functions that compute statistics about a block of text.

No I/O and no imports: every function takes a ``str`` and returns an ``int``.
"""


def count_words(text):
    """Return the number of whitespace-separated tokens in ``text``."""
    return len(text.split())


def count_lines(text):
    """Return the number of lines in ``text``.

    Only ``"\\n"`` separates lines, and a single trailing newline does not
    add an empty final line: ``"a\\nb"`` and ``"a\\nb\\n"`` are both 2.
    """
    if not text:
        return 0
    lines = text.split("\n")
    if lines[-1] == "":
        lines.pop()
    return len(lines)


def count_chars(text):
    """Return the number of characters in ``text``, whitespace included."""
    return len(text)
```

Two notes for the implementer:
- `text.split()` with no argument splits on runs of any whitespace and discards empty tokens, which is exactly the "whitespace-separated tokens" rule. Do **not** use `text.split(" ")`.
- Do **not** use `text.splitlines()` in `count_lines`; it also breaks on `\r`, `\x0b`, `\x0c`, `\x85`, `\u2028` and `\u2029`, which would fail `test_only_newlines_break_lines`.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
python3 -m unittest test_counter -v
```

Expected: PASS — 14 tests, `OK`.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter with word, line and char counts"
```

---

## Task 2: formatter — render the report string

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing from Task 1 (`formatter` must not import `counter`).
- Produces: `wordstat.formatter.format_report(stats: dict) -> str`, where `stats` has integer values under the keys `"words"`, `"lines"` and `"chars"`. Returns `"words: 12\nlines: 3\nchars: 57"` — no trailing newline. Task 3 calls it as `formatter.format_report(stats)`.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py` with exactly this content:

```python
import unittest

from wordstat.formatter import format_report


class FormatReportTests(unittest.TestCase):
    def test_renders_three_labelled_lines(self):
        report = format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_output_order_is_fixed_regardless_of_dict_order(self):
        report = format_report({"chars": 57, "lines": 3, "words": 12})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_has_no_trailing_newline(self):
        report = format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_zero_stats_render_as_zero(self):
        self.assertEqual(
            format_report({"words": 0, "lines": 0, "chars": 0}),
            "words: 0\nlines: 0\nchars: 0",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
python3 -m unittest test_formatter -v
```

Expected: an error — `ModuleNotFoundError: No module named 'wordstat.formatter'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py` with exactly this content:

```python
"""Render a stats mapping as the human-readable wordstat report."""


def format_report(stats):
    """Return a three-line report for ``stats``.

    ``stats`` maps ``"words"``, ``"lines"`` and ``"chars"`` to integers. The
    lines are always emitted in that order and there is no trailing newline.
    """
    return (
        f"words: {stats['words']}\n"
        f"lines: {stats['lines']}\n"
        f"chars: {stats['chars']}"
    )
```

Note for the implementer: read the three keys explicitly, in order, as shown. Do not iterate over `stats.items()` — that would leak the caller's dict ordering into the output and fail `test_output_order_is_fixed_regardless_of_dict_order`.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
python3 -m unittest test_formatter -v
```

Expected: PASS — 4 tests, `OK`.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter for the stats report"
```

---

## Task 3: cli — argparse entry point tying it together

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes:
  - `wordstat.counter.count_words(text) -> int`, `count_lines(text) -> int`, `count_chars(text) -> int` (Task 1)
  - `wordstat.formatter.format_report(stats) -> str`, `stats` keyed by `"words"`, `"lines"`, `"chars"` (Task 2)
- Produces: `wordstat.cli.main(argv: list[str]) -> int`. Prints the report to stdout and returns `0`; on an unreadable path prints a message to stderr and returns `1`. Also runnable as `python3 -m wordstat.cli <path>`.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py` with exactly this content:

```python
import contextlib
import io
import os
import subprocess
import sys
import tempfile
import unittest

from wordstat import cli

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))


def run_main(argv):
    """Call cli.main(argv), returning (exit_code, stdout, stderr)."""
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = cli.main(argv)
    return code, out.getvalue(), err.getvalue()


class CliTestCase(unittest.TestCase):
    def setUp(self):
        tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(tmpdir.cleanup)
        self.tmpdir = tmpdir.name

    def write_text(self, name, data):
        path = os.path.join(self.tmpdir, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(data)
        return path


class SuccessTests(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_text("sample.txt", "the quick brown fox\njumps over\n")
        code, out, err = run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 6\nlines: 2\nchars: 31\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_zeros(self):
        path = self.write_text("empty.txt", "")
        code, out, err = run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")
        self.assertEqual(err, "")

    def test_reads_the_file_as_utf8(self):
        path = self.write_text("unicode.txt", "café ☕\n")
        code, out, err = run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 7\n")
        self.assertEqual(err, "")


class FailureTests(CliTestCase):
    def test_missing_file_reports_to_stderr_and_returns_one(self):
        path = os.path.join(self.tmpdir, "nope.txt")
        code, out, err = run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("nope.txt", err)

    def test_directory_path_reports_to_stderr_and_returns_one(self):
        code, out, err = run_main([self.tmpdir])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(self.tmpdir, err)

    def test_undecodable_file_reports_to_stderr_and_returns_one(self):
        path = os.path.join(self.tmpdir, "binary.bin")
        with open(path, "wb") as handle:
            handle.write(b"\xff\xfe\x00\x01")
        code, out, err = run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("binary.bin", err)

    def test_missing_path_argument_exits_two(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as caught:
                cli.main([])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage:", err.getvalue())


class ModuleEntryPointTests(CliTestCase):
    def test_runnable_with_dash_m(self):
        path = self.write_text("sample.txt", "a b\n")
        result = subprocess.run(
            [sys.executable, "-m", "wordstat.cli", path],
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
        )
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "words: 2\nlines: 1\nchars: 4\n")

    def test_dash_m_exits_one_for_a_missing_file(self):
        result = subprocess.run(
            [sys.executable, "-m", "wordstat.cli",
             os.path.join(self.tmpdir, "nope.txt")],
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
        )
        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stdout, "")
        self.assertIn("nope.txt", result.stderr)


if __name__ == "__main__":
    unittest.main()
```

Where the expected numbers come from, so the implementer can check them rather than trust them:
- `"the quick brown fox\njumps over\n"` — 6 words; 2 lines (trailing newline absorbed); 31 chars (19 + 1 + 10 + 1).
- `"café ☕\n"` — 2 words; 1 line; 7 characters (`c`, `a`, `f`, `é`, space, `☕`, `\n`).
- `"a b\n"` — 2 words; 1 line; 4 chars.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
python3 -m unittest test_cli -v
```

Expected: an error — `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py` with exactly this content:

```python
"""Command-line entry point: ``python3 -m wordstat.cli <path>``."""

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


def main(argv):
    """Print a stats report for the file named in ``argv``.

    Returns 0 on success, or 1 if the file could not be read as UTF-8 text.
    """
    args = _build_parser().parse_args(argv)
    try:
        with open(args.path, encoding="utf-8") as handle:
            text = handle.read()
    except (OSError, UnicodeDecodeError) as exc:
        print(f"wordstat: cannot read {args.path}: {exc}", file=sys.stderr)
        return 1
    stats = {
        "words": counter.count_words(text),
        "lines": counter.count_lines(text),
        "chars": counter.count_chars(text),
    }
    print(formatter.format_report(stats))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
```

Three notes for the implementer:
- `encoding="utf-8"` is required. Without it, `open` uses the platform's preferred encoding and the non-ASCII test becomes machine-dependent.
- Both exception types in the `except` clause matter: `OSError` covers missing files, directories and permission errors; `UnicodeDecodeError` is a `ValueError` and would otherwise escape as a traceback.
- `main` returns an exit code and never calls `sys.exit` itself; only the `__main__` guard does. That is what makes it testable in-process.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
python3 -m unittest test_cli -v
```

Expected: PASS — 9 tests, `OK`.

- [ ] **Step 5: Run the whole suite and the CLI by hand**

```bash
python3 -m unittest discover -v
python3 -m wordstat.cli design.md
```

Expected: `OK` with 27 tests total (14 + 4 + 9), and a three-line report for `design.md` on stdout.

- [ ] **Step 6: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add wordstat CLI entry point"
```

---

## Done When

- [ ] `python3 -m unittest discover` passes from the repo root with 27 tests.
- [ ] `python3 -m wordstat.cli <some file>` prints a three-line report and exits 0.
- [ ] `python3 -m wordstat.cli /no/such/file; echo $?` prints a message to stderr and `1`.
- [ ] No file in the repo imports anything outside the standard library.
- [ ] `wordstat/__init__.py` is still empty.
