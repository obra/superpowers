# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package whose CLI reads a text file and prints a three-line report of its word, line, and character counts.

**Architecture:** Three independent modules with one responsibility each: `counter` holds pure `str -> int` stat functions, `formatter` turns a stats mapping into the report string, and `cli` is the only module that touches the filesystem, `sys.argv`, stdout, and stderr. `cli` composes the other two and owns every error path, so `counter` and `formatter` never raise on ordinary input and never need I/O in their tests.

**Tech Stack:** Python 3 standard library only — `argparse` for parsing, `unittest` for tests, `tempfile`/`io`/`contextlib` for CLI test fixtures. No third-party packages, no `setup.py`/`pyproject.toml` (the package is used from the repo root).

**Spec:** `design.md` (in this directory)

## Global Constraints

- **Standard library only.** No third-party imports in package code or tests.
- **Tests live at the repo root** as `test_counter.py`, `test_formatter.py`, `test_cli.py`, and must be runnable with `python3 -m unittest` from the repo root.
- **Package layout is exactly** `wordstat/__init__.py` (already exists, stays empty), `wordstat/counter.py`, `wordstat/formatter.py`, `wordstat/cli.py`. Do not add other modules.
- **Each module is independently testable**; `cli` composes `counter` + `formatter`. `counter` and `formatter` must not import each other, `cli`, `argparse`, `os`, or `sys`.
- **Function names and signatures are fixed by the spec:** `count_words(text)`, `count_lines(text)`, `count_chars(text)`, `format_report(stats)`, `main(argv)`.
- **`main(argv)` takes the argument list explicitly** (not `sys.argv`) and returns an `int` exit code: 0 on success, 1 when the file cannot be read.
- Trailing-newline rule, verbatim from the spec: "a trailing newline does not add an empty final line; `"a\nb"` and `"a\nb\n"` are both 2".
- Report format, verbatim from the spec: `"words: 12\nlines: 3\nchars: 57"` — three lines, that field order, no trailing newline in the returned string.

## Review Focus

Input classes the spec implies but does not spell out. Each line below has a test assigned to the task that owns the code; the step number is named so a reviewer can find it.

- **Empty text** — `count_words("")`, `count_lines("")`, `count_chars("")` are all 0; an empty file is a success (exit 0), not an error. → Task 1 Step 1, Task 3 Step 1.
- **Whitespace-only text** — `"   \t\n "` has 0 words but non-zero chars. → Task 1 Step 1.
- **Runs of mixed whitespace as one separator** — spaces, tabs, and newlines between tokens, plus leading/trailing whitespace, must not produce empty tokens. → Task 1 Step 1.
- **Text with no trailing newline vs. with one** — both `"a\nb"` and `"a\nb\n"` are 2 lines; `"\n"` alone is 1 line; blank interior lines count. → Task 1 Step 1.
- **CRLF line endings** — `"a\r\nb\r\n"` is 2 lines, and `\r` counts as a character. → Task 1 Step 1.
- **Non-ASCII text** — `count_chars` counts characters (code points), not bytes, and the CLI decodes the file as UTF-8 so a multi-byte file reports character counts. → Task 1 Step 1, Task 3 Step 1.
- **Path exists but is not a readable file** (a directory) — must be the exit-1 stderr path, not a traceback. → Task 3 Step 1.
- **File is not valid UTF-8** — must be the exit-1 stderr path, not a traceback. → Task 3 Step 1.
- **No path argument at all** — `argparse` exits the process with code 2 and a usage message on stderr rather than returning; pin that so nobody "fixes" it into a silent 0. → Task 3 Step 1.
- **Field order independent of mapping order** — a `stats` dict built in another order still renders words, lines, chars. → Task 2 Step 1.
- **`stats` missing a key** — `format_report` raises `KeyError` naming the missing field rather than printing a partial report. → Task 2 Step 1.

---

### Task 1: `counter` — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py` (repo root)

**Interfaces:**
- Consumes: nothing (first task; `wordstat/__init__.py` already exists and stays empty).
- Produces:
  - `wordstat.counter.count_words(text: str) -> int`
  - `wordstat.counter.count_lines(text: str) -> int`
  - `wordstat.counter.count_chars(text: str) -> int`

- [ ] **Step 1: Write the failing test**

Create `test_counter.py` with exactly this content. Note the test class per function — that keeps failures legible when only one function is broken.

```python
import unittest

from wordstat import counter


class CountWordsTest(unittest.TestCase):
    def test_empty_string_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_string_has_no_words(self):
        self.assertEqual(counter.count_words("   \t\n "), 0)

    def test_counts_space_separated_tokens(self):
        self.assertEqual(counter.count_words("one two three"), 3)

    def test_runs_of_mixed_whitespace_separate_one_token_each(self):
        self.assertEqual(counter.count_words("  one   two\tthree\nfour  "), 4)

    def test_single_token_without_whitespace(self):
        self.assertEqual(counter.count_words("word"), 1)


class CountLinesTest(unittest.TestCase):
    def test_empty_string_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_single_line_without_trailing_newline(self):
        self.assertEqual(counter.count_lines("a"), 1)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_lone_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("\n"), 1)

    def test_blank_interior_lines_count(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)

    def test_crlf_endings_count_once_per_line(self):
        self.assertEqual(counter.count_lines("a\r\nb\r\n"), 2)


class CountCharsTest(unittest.TestCase):
    def test_empty_string_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_whitespace(self):
        self.assertEqual(counter.count_chars(" \t\n"), 3)

    def test_counts_letters_and_spaces(self):
        self.assertEqual(counter.count_chars("one two"), 7)

    def test_crlf_carriage_return_is_a_char(self):
        self.assertEqual(counter.count_chars("a\r\nb\r\n"), 6)

    def test_counts_characters_not_bytes(self):
        # "héllo wörld" is 11 characters but 13 bytes in UTF-8.
        self.assertEqual(counter.count_chars("héllo wörld"), 11)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run from the repo root:

```bash
python3 -m unittest test_counter -v
```

Expected: an error, not a pass — `ImportError: cannot import name 'counter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py` with exactly this content. `count_lines` deliberately splits on `"\n"` only (rather than `str.splitlines()`, which also breaks on `\r`, `\v`, `\f`, and ` `) so CRLF text counts one line per `\r\n`.

```python
"""Pure functions computing simple statistics about a block of text."""


def count_words(text):
    """Return the number of whitespace-separated tokens in `text`."""
    return len(text.split())


def count_lines(text):
    r"""Return the number of lines in `text`.

    A trailing newline does not introduce an empty final line, so "a\nb"
    and "a\nb\n" are both 2 lines. The empty string has 0 lines.
    """
    if not text:
        return 0
    return text.count("\n") + (0 if text.endswith("\n") else 1)


def count_chars(text):
    """Return the number of characters in `text`, whitespace included."""
    return len(text)
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
python3 -m unittest test_counter -v
```

Expected: `OK` — 16 tests run, 0 failures, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter with word, line, and char stats"
```

---

### Task 2: `formatter` — render stats as a report

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py` (repo root)

**Interfaces:**
- Consumes: nothing from Task 1. `formatter` must not import `counter` — it takes a plain mapping.
- Produces:
  - `wordstat.formatter.format_report(stats: dict) -> str` — `stats` maps the keys `"words"`, `"lines"`, `"chars"` to ints; returns three lines joined by `"\n"` with no trailing newline.
  - `wordstat.formatter.FIELDS = ("words", "lines", "chars")` — the render order.

- [ ] **Step 1: Write the failing test**

Create `test_formatter.py` with exactly this content.

```python
import unittest

from wordstat import formatter


class FormatReportTest(unittest.TestCase):
    def test_renders_three_labelled_lines(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_has_no_trailing_newline(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_field_order_is_fixed_regardless_of_mapping_order(self):
        stats = {}
        stats["chars"] = 57
        stats["lines"] = 3
        stats["words"] = 12
        report = formatter.format_report(stats)
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_renders_zeros(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_extra_keys_are_ignored(self):
        stats = {"words": 1, "lines": 1, "chars": 1, "bytes": 99}
        self.assertEqual(
            formatter.format_report(stats), "words: 1\nlines: 1\nchars: 1"
        )

    def test_missing_key_raises_keyerror_naming_the_field(self):
        with self.assertRaises(KeyError) as caught:
            formatter.format_report({"words": 1, "lines": 1})
        self.assertEqual(caught.exception.args[0], "chars")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
python3 -m unittest test_formatter -v
```

Expected: an error, not a pass — `ImportError: cannot import name 'formatter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py` with exactly this content. Indexing `stats[name]` (rather than `stats.get`) is what makes a missing field a loud `KeyError` instead of a report that quietly says `None`.

```python
"""Render a stats mapping as a human-readable report."""

FIELDS = ("words", "lines", "chars")


def format_report(stats):
    """Return a three-line report for `stats`.

    `stats` maps "words", "lines" and "chars" to ints. Fields are always
    rendered in that order, whatever order the mapping itself is in, and
    the returned string has no trailing newline.
    """
    return "\n".join(f"{name}: {stats[name]}" for name in FIELDS)
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
python3 -m unittest test_formatter -v
```

Expected: `OK` — 6 tests run, 0 failures, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter rendering stats as a report"
```

---

### Task 3: `cli` — argparse entry point composing counter and formatter

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py` (repo root)

**Interfaces:**
- Consumes:
  - `wordstat.counter.count_words(text) -> int`, `count_lines(text) -> int`, `count_chars(text) -> int` (Task 1)
  - `wordstat.formatter.format_report(stats) -> str`, where `stats` has keys `"words"`, `"lines"`, `"chars"` (Task 2)
- Produces:
  - `wordstat.cli.main(argv: list[str]) -> int` — prints the report to stdout and returns 0; on an unreadable path prints a message to stderr and returns 1.
  - `wordstat.cli.build_parser() -> argparse.ArgumentParser` — one positional argument, `path`.
  - `python3 -m wordstat.cli <path>` as the runnable command from the repo root.

- [ ] **Step 1: Write the failing test**

Create `test_cli.py` with exactly this content. `run_main` captures stdout and stderr so the assertions are about behavior, not about what a human sees scroll past; `subprocess` covers the `python3 -m` path that in-process calls cannot reach.

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


class MainTest(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmpdir.cleanup)

    def write_file(self, text, name="sample.txt"):
        path = os.path.join(self.tmpdir.name, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        return path

    def run_main(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_prints_report_and_returns_zero(self):
        path = self.write_file("one two\nthree\n")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 3\nlines: 2\nchars: 14\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_zeros_and_succeeds(self):
        path = self.write_file("")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")
        self.assertEqual(err, "")

    def test_utf8_file_reports_character_counts(self):
        path = self.write_file("héllo wörld\n")
        code, out, _ = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")

    def test_missing_file_reports_to_stderr_and_returns_one(self):
        path = os.path.join(self.tmpdir.name, "nope.txt")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(path, err)
        self.assertIn("cannot read", err)
        self.assertTrue(err.endswith("\n"))

    def test_directory_path_reports_to_stderr_and_returns_one(self):
        code, out, err = self.run_main([self.tmpdir.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("cannot read", err)

    def test_non_utf8_file_reports_to_stderr_and_returns_one(self):
        path = os.path.join(self.tmpdir.name, "binary.bin")
        with open(path, "wb") as handle:
            handle.write(b"\xff\xfe\x00garbage")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("cannot read", err)

    def test_missing_argument_exits_with_usage_error(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as caught:
                cli.main([])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage:", err.getvalue())


class ModuleEntryPointTest(unittest.TestCase):
    def test_runs_as_python_m_wordstat_cli(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "sample.txt")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write("one two\nthree\n")
            result = subprocess.run(
                [sys.executable, "-m", "wordstat.cli", path],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
            )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, "words: 3\nlines: 2\nchars: 14\n")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
python3 -m unittest test_cli -v
```

Expected: an error, not a pass — `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py` with exactly this content. `OSError` covers the missing-file, is-a-directory, and permission cases in one branch; `UnicodeDecodeError` is listed separately because it is a `ValueError`, not an `OSError`, and would otherwise escape as a traceback.

```python
"""Command-line entry point for wordstat."""

import argparse
import sys

from wordstat import counter, formatter


def build_parser():
    """Return the argument parser for the `wordstat` command."""
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print word, line and character counts for a text file.",
    )
    parser.add_argument("path", help="path to the text file to measure")
    return parser


def main(argv):
    """Read the file named in `argv`, print its stats, return an exit code."""
    args = build_parser().parse_args(argv)
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

- [ ] **Step 4: Run the test to verify it passes**

```bash
python3 -m unittest test_cli -v
```

Expected: `OK` — 8 tests run, 0 failures, 0 errors.

- [ ] **Step 5: Run the whole suite and the command by hand**

```bash
python3 -m unittest -v
```

Expected: `OK` — 30 tests run (16 counter + 6 formatter + 8 cli), 0 failures, 0 errors.

Then confirm the real command works on a real file:

```bash
python3 -m wordstat.cli design.md; echo "exit=$?"
python3 -m wordstat.cli no-such-file.md; echo "exit=$?"
```

Expected: the first prints three `words:`/`lines:`/`chars:` lines with non-zero numbers and `exit=0`; the second prints `wordstat: cannot read no-such-file.md: [Errno 2] No such file or directory: 'no-such-file.md'` to stderr and `exit=1`.

- [ ] **Step 6: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add cli composing counter and formatter"
```
