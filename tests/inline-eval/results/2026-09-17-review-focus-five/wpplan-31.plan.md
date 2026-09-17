# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package with a CLI that reads a text file and prints its word, line, and character counts.

**Architecture:** Three single-responsibility modules inside the existing `wordstat/` package: `counter.py` holds pure `str -> int` stat functions with no I/O, `formatter.py` renders a stats dict to a report string with no I/O, and `cli.py` is the only module that touches the filesystem, `sys.argv`, stdout, and stderr. `cli.main(argv)` composes the other two and returns an exit code instead of calling `sys.exit`, so it is testable in-process.

**Tech Stack:** Python 3 standard library only — `argparse` for parsing, `unittest` for tests, `tempfile`/`contextlib`/`io` for CLI test fixtures.

**Spec:** `design.md` (in the repo root, alongside this plan)

## Global Constraints

- Standard library only — no third-party runtime or test dependencies.
- Tests live at the repo root (`test_counter.py`, `test_formatter.py`, `test_cli.py`) and must run with `python3 -m unittest` from the repo root.
- Package directory is `wordstat/`; `wordstat/__init__.py` already exists and is empty — leave it empty (it is only a package marker).
- Each module is independently testable: `counter` and `formatter` do no I/O and import nothing from each other; only `cli` imports both.
- The report is exactly three lines in this order, with a `": "` separator: `words: <w>`, `lines: <l>`, `chars: <c>`, and no trailing newline (`print` supplies the newline).
- Line counting rule: a trailing newline does not add an empty final line — `"a\nb"` and `"a\nb\n"` are both 2.
- `cli.main(argv)` takes the argument list *without* the program name and **returns** an int exit code (0 success, 1 unreadable file); it never calls `sys.exit` itself. Only the `if __name__ == "__main__"` guard calls `sys.exit`.
- Work directly on `main`; this is a local scratch repo with no remote. Commit after every task.

## Review Focus

Input classes the spec implies but does not spell out. Each one has a test pinned to the task that owns the code:

1. **Empty file** — a 0-byte file must report `words: 0 / lines: 0 / chars: 0` and exit 0, not crash or report 1 line. (Tests: Task 1 Step 5, Task 3 Step 3.)
2. **Whitespace-only text** — `"   \n\t  "` has 0 words but a nonzero char count; a naive `split("\n")`/`split(" ")` would count empty tokens as words. (Test: Task 1 Step 1.)
3. **Path exists but is not a readable file** (a directory, or a permission-denied file) — must produce a `wordstat:` message on stderr and return 1, exactly like a missing file, rather than a traceback. Catch `OSError`, not just `FileNotFoundError`. (Test: Task 3 Step 3.)
4. **Non-UTF-8 bytes** — pointing the CLI at a binary file must produce a stderr message and return 1, not an uncaught `UnicodeDecodeError` traceback. (Test: Task 3 Step 3.)
5. **No path argument / too many arguments** — `argparse` raises `SystemExit(2)` with a usage message rather than returning an int; that behavior is intended and pinned by a test so nobody "fixes" it by returning 1. (Test: Task 3 Step 3.)

---

## File Structure

| File | Responsibility |
|---|---|
| `wordstat/__init__.py` | Package marker. Already exists, stays empty. Not modified by any task. |
| `wordstat/counter.py` | **Task 1.** Three pure functions: `count_words`, `count_lines`, `count_chars`. No imports, no I/O. |
| `wordstat/formatter.py` | **Task 2.** `format_report(stats)` → report string. No imports, no I/O. |
| `wordstat/cli.py` | **Task 3.** `main(argv)` → int. Argparse, file reading, error messages, printing. Imports `counter` and `formatter`. |
| `test_counter.py` | **Task 1.** unittest tests for `counter`. |
| `test_formatter.py` | **Task 2.** unittest tests for `formatter`. |
| `test_cli.py` | **Task 3.** unittest tests for `cli`, using `tempfile` for fixtures and `contextlib.redirect_stdout/stderr` for output capture. |

All commands below are run from the repo root (the directory containing `design.md` and `wordstat/`). Tests import the package as `wordstat.*`, which works because `python3 -m unittest` puts the current directory on `sys.path`.

---

### Task 1: `counter` — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `count_words(text: str) -> int` — number of whitespace-separated tokens.
  - `count_lines(text: str) -> int` — number of lines; a trailing newline does not add an empty final line.
  - `count_chars(text: str) -> int` — number of characters, whitespace included.

- [ ] **Step 1: Write the failing tests for `count_words`**

Create `test_counter.py` with this content:

```python
import unittest

from wordstat.counter import count_words


class CountWordsTests(unittest.TestCase):
    def test_counts_whitespace_separated_tokens(self):
        self.assertEqual(count_words("the quick brown fox"), 4)

    def test_collapses_runs_of_whitespace(self):
        self.assertEqual(count_words("  the\tquick \n brown  "), 3)

    def test_empty_text_has_no_words(self):
        self.assertEqual(count_words(""), 0)

    def test_whitespace_only_text_has_no_words(self):
        self.assertEqual(count_words("   \n\t  "), 0)


if __name__ == "__main__":
    unittest.main()
```

Step 5 widens this import as it adds the other two test classes to the same file.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'wordstat.counter'` (reported as an error while importing `test_counter`).

- [ ] **Step 3: Write the minimal implementation of `count_words`**

Create `wordstat/counter.py`:

```python
"""Pure functions that compute statistics about a block of text."""


def count_words(text):
    """Return the number of whitespace-separated tokens in *text*."""
    return len(text.split())
```

`str.split()` with no argument splits on runs of any whitespace and discards empty tokens, which is exactly the required behavior — do not pass a separator.

- [ ] **Step 4: Run the tests to verify `count_words` passes**

Run: `python3 -m unittest test_counter -v`
Expected: 4 tests, all PASS.

- [ ] **Step 5: Write the failing tests for `count_lines` and `count_chars`**

Widen the import at the top of `test_counter.py` to:

```python
from wordstat.counter import count_chars, count_lines, count_words
```

Then append these two classes, above the `if __name__ == "__main__":` block:

```python
class CountLinesTests(unittest.TestCase):
    def test_counts_lines(self):
        self.assertEqual(count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(count_lines("a\nb\n"), 2)

    def test_blank_interior_lines_are_counted(self):
        self.assertEqual(count_lines("a\n\nb\n"), 3)

    def test_single_newline_is_one_line(self):
        self.assertEqual(count_lines("\n"), 1)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(count_lines(""), 0)

    def test_crlf_is_a_single_line_break(self):
        self.assertEqual(count_lines("a\r\nb\r\n"), 2)


class CountCharsTests(unittest.TestCase):
    def test_counts_every_character_including_whitespace(self):
        self.assertEqual(count_chars("a b\n"), 4)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(count_chars(""), 0)

    def test_counts_characters_not_bytes(self):
        # "héllo →" is 7 characters but 10 bytes in UTF-8.
        self.assertEqual(count_chars("héllo →"), 7)
```

- [ ] **Step 6: Run the tests to verify the new ones fail**

Run: `python3 -m unittest test_counter -v`
Expected: FAIL — `ImportError: cannot import name 'count_lines' from 'wordstat.counter'`.

- [ ] **Step 7: Implement `count_lines` and `count_chars`**

Append to `wordstat/counter.py`:

```python
def count_lines(text):
    r"""Return the number of lines in *text*.

    A trailing newline does not add an empty final line: both "a\nb" and
    "a\nb\n" have two lines, and "" has zero.
    """
    return len(text.splitlines())


def count_chars(text):
    """Return the number of characters in *text*, whitespace included."""
    return len(text)
```

`str.splitlines()` already gives the required semantics: it drops the empty string after a trailing newline, returns `[]` for `""`, and treats `"\r\n"` as one break. Do not write `len(text.split("\n"))` — that counts a phantom final line.

- [ ] **Step 8: Run the whole file to verify all tests pass**

Run: `python3 -m unittest test_counter -v`
Expected: 13 tests, all PASS.

- [ ] **Step 9: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter with word, line and char stats"
```

---

### Task 2: `formatter` — render a stats dict to a report

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing from Task 1 — `formatter` must not import `counter`. It only receives a dict.
- Produces:
  - `format_report(stats: dict) -> str` where `stats` has the int keys `"words"`, `"lines"`, `"chars"`. Returns exactly `"words: {w}\nlines: {l}\nchars: {c}"` with no trailing newline.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py`:

```python
import unittest

from wordstat.formatter import format_report


class FormatReportTests(unittest.TestCase):
    def test_renders_three_labelled_lines(self):
        report = format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_has_no_trailing_newline(self):
        report = format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_renders_zeroes(self):
        report = format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_output_order_does_not_depend_on_dict_order(self):
        report = format_report({"chars": 57, "lines": 3, "words": 12})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'wordstat.formatter'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py`:

```python
"""Render a stats mapping as a human-readable report."""

FIELDS = ("words", "lines", "chars")


def format_report(stats):
    """Return a three-line report for *stats*, without a trailing newline.

    *stats* must have the int keys "words", "lines" and "chars"; the output
    order is fixed by FIELDS, not by the mapping's own ordering.
    """
    return "\n".join(f"{field}: {stats[field]}" for field in FIELDS)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`
Expected: 4 tests, all PASS.

- [ ] **Step 5: Run the full suite to confirm nothing regressed**

Run: `python3 -m unittest -v`
Expected: 17 tests (13 from Task 1 + 4 here), all PASS.

- [ ] **Step 6: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter that renders a stats report"
```

---

### Task 3: `cli` — argparse entry point composing counter and formatter

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `wordstat.counter.count_words/count_lines/count_chars` (Task 1) and `wordstat.formatter.format_report` (Task 2). Import the modules, not the names: `from wordstat import counter, formatter`.
- Produces:
  - `main(argv: list[str]) -> int` — `argv` excludes the program name. Prints the report to stdout and returns 0; on an unreadable path prints a `wordstat: ...` message to stderr and returns 1. A missing/extra positional argument raises `SystemExit(2)` from argparse.

- [ ] **Step 1: Write the failing happy-path test**

Create `test_cli.py`:

```python
import contextlib
import io
import os
import tempfile
import unittest

from wordstat.cli import main


class CliTestCase(unittest.TestCase):
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

    def run_main(self, argv):
        """Call main(argv), returning (exit_code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()


class HappyPathTests(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_text("sample.txt", "the quick brown fox\njumps\n")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 5\nlines: 2\nchars: 26\n")
        self.assertEqual(err, "")


if __name__ == "__main__":
    unittest.main()
```

The expected numbers: 5 words, 2 lines, and 26 characters (19 + newline + 5 + newline). `print` adds the final newline that `format_report` deliberately omits.

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'wordstat.cli'`.

- [ ] **Step 3: Write the failing edge-case tests**

Append to `test_cli.py`, above the `if __name__ == "__main__":` block:

```python
class EmptyAndOddInputTests(CliTestCase):
    def test_empty_file_reports_zeroes(self):
        path = self.write_text("empty.txt", "")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")
        self.assertEqual(err, "")

    def test_whitespace_only_file_reports_no_words(self):
        path = self.write_text("blank.txt", "   \n\t  \n")
        code, out, _ = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 2\nchars: 8\n")


class UnreadablePathTests(CliTestCase):
    def test_missing_file_reports_error_and_returns_one(self):
        path = os.path.join(self.tmpdir, "nope.txt")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith("wordstat:"), err)
        self.assertIn("nope.txt", err)

    def test_directory_reports_error_and_returns_one(self):
        code, out, err = self.run_main([self.tmpdir])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith("wordstat:"), err)

    def test_non_utf8_file_reports_error_and_returns_one(self):
        path = self.write_bytes("binary.dat", b"\xff\xfe\x00\x01")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("UTF-8", err)


class ArgumentParsingTests(CliTestCase):
    def test_missing_path_exits_with_usage_error(self):
        with contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit) as caught:
                main([])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage:", err.getvalue())

    def test_extra_argument_exits_with_usage_error(self):
        path = self.write_text("sample.txt", "hi\n")
        with contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit) as caught:
                main([path, path])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage:", err.getvalue())
```

`"   \n\t  \n"` is 8 characters over 2 lines with 0 words. The stderr assertions check the `wordstat:` prefix and the path rather than the OS's exact `strerror` wording, which varies by platform.

- [ ] **Step 4: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — still `ModuleNotFoundError: No module named 'wordstat.cli'`.

- [ ] **Step 5: Write the implementation**

Create `wordstat/cli.py`:

```python
"""Command-line entry point: read a file and print its text statistics."""

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
    """Run the CLI over *argv* (without the program name); return an exit code."""
    args = _build_parser().parse_args(argv)

    try:
        with open(args.path, encoding="utf-8") as handle:
            text = handle.read()
    except OSError as exc:
        reason = exc.strerror or exc.__class__.__name__
        print(f"wordstat: cannot read {args.path}: {reason}", file=sys.stderr)
        return 1
    except UnicodeDecodeError:
        print(f"wordstat: {args.path} is not valid UTF-8 text", file=sys.stderr)
        return 1

    report = formatter.format_report(
        {
            "words": counter.count_words(text),
            "lines": counter.count_lines(text),
            "chars": counter.count_chars(text),
        }
    )
    print(report)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
```

Catch `OSError`, not `FileNotFoundError` — a directory or an unreadable file must fail the same way. `UnicodeDecodeError` is a `ValueError`, not an `OSError`, so it needs its own clause.

- [ ] **Step 6: Run the CLI tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: 8 tests, all PASS.

- [ ] **Step 7: Run the full suite**

Run: `python3 -m unittest -v`
Expected: 25 tests (13 + 4 + 8), all PASS.

- [ ] **Step 8: Smoke-test the real entry point by hand**

```bash
printf 'the quick brown fox\njumps\n' > /tmp/wordstat-sample.txt
python3 -m wordstat.cli /tmp/wordstat-sample.txt; echo "exit=$?"
python3 -m wordstat.cli /tmp/definitely-missing.txt; echo "exit=$?"
rm /tmp/wordstat-sample.txt
```

Expected: the first prints `words: 5` / `lines: 2` / `chars: 26` then `exit=0`; the second prints a `wordstat: cannot read ...` line to stderr then `exit=1`.

- [ ] **Step 9: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add cli entry point composing counter and formatter"
```

---

## Done When

- `python3 -m unittest` from the repo root reports 25 passing tests and no failures or errors.
- `python3 -m wordstat.cli <file>` prints the three-line report and exits 0; `python3 -m wordstat.cli <missing>` prints a `wordstat:` message to stderr and exits 1.
- No file imports anything outside the standard library, and `wordstat/counter.py` and `wordstat/formatter.py` contain no imports at all.
