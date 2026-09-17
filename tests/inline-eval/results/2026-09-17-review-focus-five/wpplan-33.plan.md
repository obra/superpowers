# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package whose CLI reads a text file and prints a three-line report of word, line, and character counts.

**Architecture:** Three modules with one responsibility each: `counter.py` holds pure `str -> int` stat functions, `formatter.py` turns a stats dict into the report string, and `cli.py` is the only module that touches the filesystem, `sys.stderr`, and exit codes. Because `counter` and `formatter` are pure, they are tested directly with values; `cli` is tested end-to-end against real temp files with stdout/stderr captured.

**Tech Stack:** Python 3 standard library only — `argparse`, `sys`, and `unittest` (plus `tempfile`, `io`, `contextlib`, `os` in tests). No third-party packages, no `pip install`, no `pyproject.toml`.

**Spec:** `design.md` (in this same directory)

## Global Constraints

- Standard library only — no third-party runtime or test dependencies.
- Tests live at the repo root as `test_counter.py`, `test_formatter.py`, `test_cli.py` and must be runnable with `python3 -m unittest`.
- Package modules live in `wordstat/`: `counter.py`, `formatter.py`, `cli.py`. `wordstat/__init__.py` already exists and stays an empty package marker.
- Each module is independently testable; `cli` composes `counter` + `formatter` and no other module reads files or writes to stdout/stderr.
- Line-counting rule, verbatim from the spec: "a trailing newline does not add an empty final line; `"a\nb"` and `"a\nb\n"` are both 2".
- Report format, verbatim from the spec: `"words: 12\nlines: 3\nchars: 57"` (no trailing newline — `print()` in the CLI supplies it).
- `cli.main` returns `0` on success and `1` on a file it cannot read; it never calls `sys.exit()` itself except under `__main__`.
- Work directly on `main`. This is a local scratch repo with no remote — never run `git push`.

## Review Focus

Input classes the spec implies but does not spell out. Each one has a test in the task named beside it.

1. **Empty file** — every count is `0` (including lines: an empty file has no lines) and the CLI still exits `0`. Tests: Task 1 (`counter`), Task 3 (CLI end-to-end).
2. **Whitespace-only and blank-line-heavy text** — `"   \n\t \n"` has `0` words; a blank line between two lines of text counts as a line, and `"a\n\n"` is 2 lines under the trailing-newline rule. Test: Task 1.
3. **Non-ASCII text** — the file is decoded as UTF-8 explicitly (not the locale default) and `count_chars` counts characters, not bytes, so `"héllo wörld\n"` is 12 chars. Tests: Task 1 (`counter`), Task 3 (CLI reads with `encoding="utf-8"`).
4. **A path that exists but is not a readable regular file** — a directory, or a file the user lacks permission for, gets the same treatment as a missing file: a message on stderr and exit `1`, never a traceback. Test: Task 3.
5. **A file whose bytes are not valid UTF-8** — e.g. pointing the CLI at a binary file. `UnicodeDecodeError` is not an `OSError`, so it needs its own handler: message on stderr, exit `1`. Test: Task 3.

---

## File Structure

| File | Responsibility |
|---|---|
| `wordstat/__init__.py` | Package marker. Already exists, stays empty. Not modified by any task. |
| `wordstat/counter.py` | Three pure functions: `count_words`, `count_lines`, `count_chars`. No I/O, no imports. |
| `wordstat/formatter.py` | One pure function: `format_report(stats)` → report string. No I/O. |
| `wordstat/cli.py` | `main(argv=None)`: argparse, file reading, error messages, exit codes. The only module that does I/O. |
| `test_counter.py` | Unit tests for `counter`, at repo root. |
| `test_formatter.py` | Unit tests for `formatter`, at repo root. |
| `test_cli.py` | End-to-end tests for `cli` against real temp files, at repo root. |

---

## Task 1: counter — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `count_words(text: str) -> int` — number of whitespace-separated tokens.
  - `count_lines(text: str) -> int` — number of lines; `""` → 0; a single trailing newline does not add an empty final line.
  - `count_chars(text: str) -> int` — number of characters, whitespace included.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py` with exactly this content:

```python
import unittest

from wordstat import counter


class CountWordsTests(unittest.TestCase):
    def test_counts_whitespace_separated_tokens(self):
        self.assertEqual(counter.count_words("the quick brown fox"), 4)

    def test_collapses_runs_of_whitespace(self):
        self.assertEqual(counter.count_words("a\t\tb\n c  \n"), 3)

    def test_empty_text_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_text_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t \n"), 0)


class CountLinesTests(unittest.TestCase):
    def test_counts_lines_without_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_blank_interior_line_counts(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)

    def test_trailing_blank_line_counts(self):
        self.assertEqual(counter.count_lines("a\n\n"), 2)

    def test_single_line_without_newline(self):
        self.assertEqual(counter.count_lines("just one line"), 1)

    def test_lone_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("\n"), 1)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)


class CountCharsTests(unittest.TestCase):
    def test_counts_all_characters_including_whitespace(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo wörld\n"), 12)


if __name__ == "__main__":
    unittest.main()
```

Why these cases: the first three tests of each class pin the spec's stated behavior; `test_whitespace_only_text_has_no_words`, `test_trailing_blank_line_counts`, `test_lone_newline_is_one_line`, `test_empty_text_has_no_lines`, and `test_counts_characters_not_bytes` pin Review Focus items 1–3. `"héllo wörld\n"` is 12 characters but 14 UTF-8 bytes, so a byte-based implementation fails that test.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`

Expected: FAIL/ERROR — `ImportError: cannot import name 'counter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py` with exactly this content:

```python
"""Pure functions that compute simple statistics about a block of text."""


def count_words(text):
    """Return the number of whitespace-separated tokens in ``text``."""
    return len(text.split())


def count_lines(text):
    """Return the number of lines in ``text``.

    A single trailing newline does not add an empty final line, so both
    ``"a\\nb"`` and ``"a\\nb\\n"`` are 2 lines. Empty text has 0 lines.
    """
    if not text:
        return 0
    if text.endswith("\n"):
        text = text[:-1]
    return text.count("\n") + 1


def count_chars(text):
    """Return the number of characters in ``text``, whitespace included."""
    return len(text)
```

Note on `count_lines`: strip **one** trailing newline, not all of them. `text.rstrip("\n")` would turn `"a\n\n"` into `"a"` and report 1 line, failing `test_trailing_blank_line_counts`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: PASS — 14 tests, `OK`.

- [ ] **Step 5: Commit**

```bash
git add test_counter.py wordstat/counter.py
git commit -m "feat: add counter module with word, line, and char counts"
```

---

## Task 2: formatter — render the report string

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing from Task 1 — `formatter` is independent of `counter` and imports nothing.
- Produces: `format_report(stats: dict) -> str`, where `stats` has integer keys `"words"`, `"lines"`, `"chars"`. Returns exactly three lines separated by `\n`, with **no** trailing newline.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py` with exactly this content:

```python
import unittest

from wordstat import formatter


class FormatReportTests(unittest.TestCase):
    def test_renders_three_labeled_lines(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_renders_zeros(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_has_no_trailing_newline(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_key_order_in_the_dict_does_not_change_the_report(self):
        report = formatter.format_report({"chars": 57, "lines": 3, "words": 12})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")


if __name__ == "__main__":
    unittest.main()
```

Why these cases: `test_renders_three_labeled_lines` uses the spec's own example values. `test_has_no_trailing_newline` protects the contract with `cli`, which uses `print()` and would otherwise emit a blank line. `test_key_order_...` rules out an implementation that iterates the dict, which would put the labels in the caller's order instead of the spec's.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: FAIL/ERROR — `ImportError: cannot import name 'formatter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py` with exactly this content:

```python
"""Render a stats mapping as a human-readable report."""


def format_report(stats):
    """Return a three-line report for ``stats``.

    ``stats`` maps ``"words"``, ``"lines"``, and ``"chars"`` to integers. The
    returned string has no trailing newline.
    """
    return "\n".join(
        (
            f"words: {stats['words']}",
            f"lines: {stats['lines']}",
            f"chars: {stats['chars']}",
        )
    )
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: PASS — 4 tests, `OK`.

- [ ] **Step 5: Commit**

```bash
git add test_formatter.py wordstat/formatter.py
git commit -m "feat: add formatter module that renders the stats report"
```

---

## Task 3: cli — argparse entry point

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `counter.count_words(text)`, `counter.count_lines(text)`, `counter.count_chars(text)` from Task 1; `formatter.format_report(stats)` from Task 2 (`stats` keys: `"words"`, `"lines"`, `"chars"`).
- Produces: `main(argv=None) -> int`. Takes one positional `path`. Prints the report to stdout and returns `0`; on an unreadable path prints a message to stderr, prints nothing to stdout, and returns `1`. `argv=None` means "read `sys.argv[1:]`", which is what the `__main__` block relies on.

This task has three TDD cycles: happy path, unreadable inputs, then module-level entry point.

- [ ] **Step 1: Write the failing happy-path tests**

Create `test_cli.py` with exactly this content:

```python
import contextlib
import io
import os
import tempfile
import unittest

from wordstat import cli


def run_cli(argv):
    """Run ``cli.main(argv)`` and return ``(exit_code, stdout, stderr)``."""
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = cli.main(argv)
    return code, out.getvalue(), err.getvalue()


class CliTestCase(unittest.TestCase):
    def setUp(self):
        tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(tmpdir.cleanup)
        self.tmpdir = tmpdir.name

    def write_file(self, text, name="sample.txt"):
        path = os.path.join(self.tmpdir, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        return path


class SuccessTests(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_file("the quick brown fox\njumps over\n")
        code, out, err = run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 6\nlines: 2\nchars: 31\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_zeros(self):
        path = self.write_file("")
        code, out, err = run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")
        self.assertEqual(err, "")

    def test_reads_utf8_text(self):
        path = self.write_file("héllo wörld\n")
        code, out, err = run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")
        self.assertEqual(err, "")


if __name__ == "__main__":
    unittest.main()
```

Why these numbers: `"the quick brown fox\njumps over\n"` is 6 tokens, 2 lines, and 31 characters (19 + newline + 10 + newline). `"héllo wörld\n"` is 12 characters. The exact-equality assertion on `out` pins the trailing newline that `print()` adds — exactly one, no blank line after it. `test_empty_file_reports_zeros` and `test_reads_utf8_text` cover Review Focus items 1 and 3.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: FAIL/ERROR — `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the minimal happy-path implementation**

Create `wordstat/cli.py` with exactly this content:

```python
"""Command-line entry point: read a text file and print its statistics."""

import argparse

from . import counter, formatter


def _build_parser():
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print simple statistics about a text file.",
    )
    parser.add_argument("path", help="path to the text file to analyze")
    return parser


def main(argv=None):
    """Print a stats report for the given file. Return an exit code."""
    args = _build_parser().parse_args(argv)
    with open(args.path, encoding="utf-8") as handle:
        text = handle.read()
    stats = {
        "words": counter.count_words(text),
        "lines": counter.count_lines(text),
        "chars": counter.count_chars(text),
    }
    print(formatter.format_report(stats))
    return 0
```

`encoding="utf-8"` is deliberate: without it, `open()` uses the locale encoding and the same file gives different character counts on different machines.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: PASS — 3 tests, `OK`.

- [ ] **Step 5: Commit the happy path**

```bash
git add test_cli.py wordstat/cli.py
git commit -m "feat: add cli entry point that prints the stats report"
```

- [ ] **Step 6: Write the failing tests for unreadable inputs**

Append this class to `test_cli.py`, directly after `SuccessTests` and before the `if __name__ == "__main__":` block:

```python
class FailureTests(CliTestCase):
    def test_missing_file_returns_one_with_stderr_message(self):
        path = os.path.join(self.tmpdir, "nope.txt")
        code, out, err = run_cli([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("nope.txt", err)

    def test_directory_path_returns_one_with_stderr_message(self):
        code, out, err = run_cli([self.tmpdir])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(self.tmpdir, err)

    def test_undecodable_bytes_return_one_with_stderr_message(self):
        path = os.path.join(self.tmpdir, "binary.dat")
        with open(path, "wb") as handle:
            handle.write(b"\xff\xfe\x00\x01")
        code, out, err = run_cli([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("binary.dat", err)

    def test_missing_path_argument_exits_two(self):
        with self.assertRaises(SystemExit) as caught:
            run_cli([])
        self.assertEqual(caught.exception.code, 2)
```

Why these cases: the spec names only the missing-file case, but a directory raises `IsADirectoryError` and a binary file raises `UnicodeDecodeError` — neither is caught by an `except FileNotFoundError`, and both would print a traceback (Review Focus items 4 and 5). The last test pins that a forgotten argument is argparse's usage error (exit 2), not a `TypeError` from our code.

- [ ] **Step 7: Run the tests to verify the new ones fail**

Run: `python3 -m unittest test_cli -v`

Expected: `SuccessTests` and `test_missing_path_argument_exits_two` PASS; the other three `FailureTests` ERROR with `FileNotFoundError`, `IsADirectoryError`, and `UnicodeDecodeError` respectively.

- [ ] **Step 8: Add the error handling**

In `wordstat/cli.py`, add `import sys` below `import argparse`, then replace the `with open(...)` block in `main` so the function reads:

```python
def main(argv=None):
    """Print a stats report for the given file. Return an exit code."""
    args = _build_parser().parse_args(argv)
    try:
        with open(args.path, encoding="utf-8") as handle:
            text = handle.read()
    except OSError as exc:
        reason = exc.strerror or str(exc)
        print(f"wordstat: cannot read {args.path}: {reason}", file=sys.stderr)
        return 1
    except UnicodeDecodeError:
        print(
            f"wordstat: cannot read {args.path}: not valid UTF-8 text",
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
```

Catching `OSError` (not just `FileNotFoundError`) covers missing files, directories, and permission errors with one branch. `UnicodeDecodeError` is a `ValueError`, not an `OSError`, so it needs the second handler.

- [ ] **Step 9: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: PASS — 7 tests, `OK`.

- [ ] **Step 10: Commit the error handling**

```bash
git add test_cli.py wordstat/cli.py
git commit -m "feat: report unreadable files on stderr and exit 1"
```

- [ ] **Step 11: Add the `python3 -m wordstat.cli` entry point**

Append to `wordstat/cli.py`:

```python
if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
```

- [ ] **Step 12: Verify the CLI works when actually run**

Run these commands from the repo root:

```bash
printf 'the quick brown fox\njumps over\n' > /tmp/wordstat-demo.txt
python3 -m wordstat.cli /tmp/wordstat-demo.txt; echo "exit=$?"
python3 -m wordstat.cli /tmp/definitely-not-here.txt; echo "exit=$?"
rm /tmp/wordstat-demo.txt
```

Expected: the first run prints `words: 6` / `lines: 2` / `chars: 31` and `exit=0`; the second prints `wordstat: cannot read /tmp/definitely-not-here.txt: No such file or directory` to stderr and `exit=1`.

- [ ] **Step 13: Run the whole suite**

Run: `python3 -m unittest discover -v`

Expected: PASS — 25 tests total (14 counter + 4 formatter + 7 cli), `OK`.

- [ ] **Step 14: Commit**

```bash
git add wordstat/cli.py
git commit -m "feat: allow running wordstat with python3 -m wordstat.cli"
```
