# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package whose CLI reads a text file and prints a three-line report of its word, line, and character counts.

**Architecture:** Three modules with one responsibility each, layered so nothing lower knows about anything higher. `counter.py` holds pure functions over a `str` (no I/O). `formatter.py` turns a stats dict into a report string (no I/O). `cli.py` is the only module that touches the filesystem, `sys.stdout`/`sys.stderr`, and `argparse`; it composes the other two. Tests live at the repo root, one file per module, and import the package by name (`from wordstat import counter`), which works because `python3 -m unittest` puts the current directory on `sys.path`.

**Tech Stack:** Python 3 standard library only — `argparse`, `sys`, `unittest`, `tempfile`, `io`, `contextlib`. No third-party packages, no `setup.py`/`pyproject.toml`, no test runner other than `python3 -m unittest`.

**Spec:** `design.md` (in this same directory)

## Global Constraints

- Standard library only — no third-party imports in package code or test code.
- Tests live at the repo root: `test_counter.py`, `test_formatter.py`, `test_cli.py`. They must be runnable with `python3 -m unittest` (bare, with discovery) from the repo root.
- Package layout is exactly: `wordstat/__init__.py` (already exists, leave it empty), `wordstat/counter.py`, `wordstat/formatter.py`, `wordstat/cli.py`. Do not add other files to the package.
- Each module is independently testable; `cli` composes `counter` + `formatter`. `counter` and `formatter` must not import each other, and neither may do I/O.
- Exact report format: `"words: 12\nlines: 3\nchars: 57"` — lowercase key, colon, single space, value; three lines; **no trailing newline** in the returned string.
- Stats dict keys are exactly `"words"`, `"lines"`, `"chars"`.
- `counter.count_lines`: a trailing newline does not add an empty final line; `"a\nb"` and `"a\nb\n"` are both `2`.
- `cli.main(argv)` returns `int`: `0` on success, `1` when the file cannot be read (message to stderr).
- This is a local scratch repo with no remote. Work directly on `main`. Commit at the end of every task; never `git push`.

## Review Focus

Input classes the spec implies but does not spell out. Each line below has a test assigned to the task that owns the code; the final reviewer should confirm these behaviors survived.

- **Empty file / empty string** — `count_words("")`, `count_lines("")`, `count_chars("")` must all be `0`, not `1`. A naive `text.split("\n")` implementation returns `1` line for `""`. (Test in Task 1.)
- **Whitespace-only text** — `"   \n\t \n"` has `0` words but non-zero lines and chars; word counting must not produce empty tokens. (Test in Task 1.)
- **Runs of mixed whitespace between words** — `"a  \t b\nc"` is 3 words; splitting on a single space character would over-count. (Test in Task 1.)
- **Non-ASCII text** — `count_chars` counts characters, not bytes: `"héllo"` is 5 chars. Requires reading the file as UTF-8 in the CLI. (Tests in Task 1 and Task 3.)
- **Zero-valued stats** — the formatter must still emit all three lines (`"words: 0\nlines: 0\nchars: 0"`), not skip or blank them. (Test in Task 2.)
- **Large values** — formatting must not insert thousands separators; `1234567` renders as `1234567`. (Test in Task 2.)
- **Path is a directory, or exists but is unreadable** — these are `OSError` subclasses, not `FileNotFoundError`. They must take the same "message to stderr, return 1" path as a missing file rather than raising a traceback. (Test in Task 3.)
- **File is not valid UTF-8** — must be reported to stderr with exit code 1, not raise `UnicodeDecodeError` out of `main`. (Test in Task 3.)
- **No path argument at all** — `argparse` handles this by raising `SystemExit(2)`; that is acceptable and intentional, but must be pinned by a test so nobody "fixes" it into a crash. (Test in Task 3.)
- **stdout is exactly the report plus one newline** — no banner, no blank line, nothing on stderr on success. (Test in Task 3.)

---

## File Structure

| File | Responsibility |
|---|---|
| `wordstat/__init__.py` | Package marker. **Already exists and is empty — do not touch it.** |
| `wordstat/counter.py` | Three pure functions: `count_words`, `count_lines`, `count_chars`. Take `str`, return `int`. No imports needed. |
| `wordstat/formatter.py` | `format_report(stats)` — dict → report string. No imports needed. |
| `wordstat/cli.py` | `main(argv=None)` — argparse, file reading, error messages, printing. The only module doing I/O. |
| `test_counter.py` | unittest tests for `counter`. |
| `test_formatter.py` | unittest tests for `formatter`. |
| `test_cli.py` | unittest tests for `cli`, using `tempfile` for real files and `redirect_stdout`/`redirect_stderr` to capture output. |

Tasks map one-to-one onto the three modules, in dependency order: Task 1 (`counter`) and Task 2 (`formatter`) are independent of each other, Task 3 (`cli`) consumes both.

---

## Task 1: counter — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `count_words(text: str) -> int` — number of whitespace-separated tokens.
  - `count_lines(text: str) -> int` — number of lines; a trailing newline does not add an empty final line.
  - `count_chars(text: str) -> int` — number of characters, including whitespace and newlines.

Task 3 imports these as `from wordstat import counter` and calls `counter.count_words(text)` etc.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py` with exactly this content:

```python
import unittest

from wordstat import counter


class CountWordsTest(unittest.TestCase):
    def test_counts_space_separated_tokens(self):
        self.assertEqual(counter.count_words("one two three"), 3)

    def test_empty_string_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_string_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t \n"), 0)

    def test_runs_of_mixed_whitespace_are_one_separator(self):
        self.assertEqual(counter.count_words("a  \t b\nc"), 3)

    def test_leading_and_trailing_whitespace_ignored(self):
        self.assertEqual(counter.count_words("  hello  "), 1)


class CountLinesTest(unittest.TestCase):
    def test_counts_lines_without_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_empty_string_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_single_line_without_newline(self):
        self.assertEqual(counter.count_lines("only"), 1)

    def test_lone_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("\n"), 1)

    def test_blank_lines_in_the_middle_are_counted(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)


class CountCharsTest(unittest.TestCase):
    def test_counts_every_character(self):
        self.assertEqual(counter.count_chars("abc"), 3)

    def test_includes_whitespace_and_newlines(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_string_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo"), 5)


if __name__ == "__main__":
    unittest.main()
```

Why these tests: the three "empty string" cases and the mixed-whitespace case are the Review Focus items this task owns. `test_counts_characters_not_bytes` matters because `"héllo"` is 6 bytes in UTF-8 but 5 characters — it pins that we count `str` length, not encoded length.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`

Expected: FAIL — `ModuleNotFoundError: No module named 'wordstat.counter'` (an import error, so unittest reports one error for the module rather than 15 individual failures).

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py` with exactly this content:

```python
"""Pure functions computing simple statistics about a block of text."""


def count_words(text):
    """Return the number of whitespace-separated tokens in ``text``."""
    return len(text.split())


def count_lines(text):
    """Return the number of lines in ``text``.

    A trailing newline does not introduce an empty final line, so ``"a\\nb"``
    and ``"a\\nb\\n"`` are both 2 lines. The empty string has 0 lines.
    """
    return len(text.splitlines())


def count_chars(text):
    """Return the number of characters in ``text``, whitespace included."""
    return len(text)
```

Two notes on why this is the right minimal code:
- `str.split()` with no argument splits on runs of arbitrary whitespace and discards empty tokens, so `"a  \t b"` is 2 words and `""` is 0 words. `text.split(" ")` would get both wrong.
- `str.splitlines()` gives `[]` for `""`, `["a", "b"]` for both `"a\nb"` and `"a\nb\n"`, and `[""]` for `"\n"` — exactly the spec's line semantics. `text.split("\n")` would report 1 line for `""` and 3 for `"a\nb\n"`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: PASS — `Ran 15 tests` / `OK`.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat(counter): add word, line, and character counting"
```

---

## Task 2: formatter — render stats to a report string

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing (it does not import `counter`; it only reads keys out of a plain dict).
- Produces:
  - `format_report(stats: dict) -> str` — given `{"words": int, "lines": int, "chars": int}`, return a 3-line string with no trailing newline, e.g. `"words: 12\nlines: 3\nchars: 57"`.

Task 3 imports this as `from wordstat import formatter` and calls `formatter.format_report(stats)`.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py` with exactly this content:

```python
import unittest

from wordstat import formatter


class FormatReportTest(unittest.TestCase):
    def test_renders_the_three_stats_in_order(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_has_no_trailing_newline(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_has_exactly_three_lines(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertEqual(len(report.split("\n")), 3)

    def test_zero_values_still_render_all_three_lines(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_large_values_have_no_thousands_separators(self):
        report = formatter.format_report(
            {"words": 1234567, "lines": 1000, "chars": 9876543}
        )
        self.assertEqual(report, "words: 1234567\nlines: 1000\nchars: 9876543")

    def test_key_order_in_the_input_dict_does_not_matter(self):
        report = formatter.format_report({"chars": 57, "words": 12, "lines": 3})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")


if __name__ == "__main__":
    unittest.main()
```

Why these tests: the zero-value and large-value cases are this task's Review Focus items. `test_key_order_in_the_input_dict_does_not_matter` pins that the report order comes from the formatter, not from dict insertion order — otherwise a caller building the dict differently would silently reorder the output.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: FAIL — `ModuleNotFoundError: No module named 'wordstat.formatter'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py` with exactly this content:

```python
"""Render a stats mapping as a human-readable report."""

FIELDS = ("words", "lines", "chars")


def format_report(stats):
    """Return a 3-line report for ``stats``.

    ``stats`` must contain the keys ``"words"``, ``"lines"`` and ``"chars"``.
    The returned string has no trailing newline; printing it adds one.
    """
    return "\n".join(f"{field}: {stats[field]}" for field in FIELDS)
```

The `FIELDS` tuple is what makes the output order independent of the input dict's order.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: PASS — `Ran 6 tests` / `OK`.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat(formatter): render stats dict as a three-line report"
```

---

## Task 3: cli — argparse entry point composing counter and formatter

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`
- Read (do not modify): `wordstat/counter.py`, `wordstat/formatter.py`

**Interfaces:**
- Consumes:
  - `counter.count_words(text) -> int`, `counter.count_lines(text) -> int`, `counter.count_chars(text) -> int` (Task 1).
  - `formatter.format_report(stats) -> str` where `stats` is `{"words": int, "lines": int, "chars": int}` (Task 2).
- Produces:
  - `main(argv=None) -> int` — parses one positional `path`, reads the file as UTF-8, prints the report to stdout, returns `0`. On a read failure prints a message to stderr and returns `1`. `argv` is a list of arguments **without** the program name (e.g. `["notes.txt"]`); `None` means use `sys.argv[1:]`.

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
    """Base class giving each test a temp directory and a run() helper."""

    def setUp(self):
        self._tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmpdir.cleanup)
        self.tmpdir = self._tmpdir.name

    def write_file(self, name, content):
        path = os.path.join(self.tmpdir, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(content)
        return path

    def run_cli(self, argv):
        """Run cli.main(argv), returning (exit_code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(argv)
        return code, out.getvalue(), err.getvalue()


class SuccessTest(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_file("notes.txt", "one two three\nfour five\n")
        code, out, err = self.run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 5\nlines: 2\nchars: 24\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_all_zeroes(self):
        path = self.write_file("empty.txt", "")
        code, out, err = self.run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")
        self.assertEqual(err, "")

    def test_non_ascii_file_is_read_as_utf8(self):
        path = self.write_file("accents.txt", "héllo wörld\n")
        code, out, err = self.run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")
        self.assertEqual(err, "")


class FailureTest(CliTestCase):
    def test_missing_file_reports_to_stderr_and_returns_one(self):
        path = os.path.join(self.tmpdir, "nope.txt")
        code, out, err = self.run_cli([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("nope.txt", err)
        self.assertTrue(err.endswith("\n"))

    def test_directory_path_reports_to_stderr_and_returns_one(self):
        code, out, err = self.run_cli([self.tmpdir])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(self.tmpdir, err)

    def test_non_utf8_file_reports_to_stderr_and_returns_one(self):
        path = os.path.join(self.tmpdir, "binary.bin")
        with open(path, "wb") as handle:
            handle.write(b"\xff\xfe\x00garbage")
        code, out, err = self.run_cli([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("binary.bin", err)


class ArgumentParsingTest(CliTestCase):
    def test_missing_argument_exits_with_code_two(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                cli.main([])
        self.assertEqual(caught.exception.code, 2)

    def test_help_exits_with_code_zero(self):
        with contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                cli.main(["--help"])
        self.assertEqual(caught.exception.code, 0)


if __name__ == "__main__":
    unittest.main()
```

Notes on the expected numbers, so you can check them rather than trust them:
- `"one two three\nfour five\n"` — 5 words; `splitlines()` gives 2 lines; `len()` is 13 + 1 + 9 + 1 = 24 chars.
- `"héllo wörld\n"` — 2 words, 1 line, 12 characters (11 letters/space + newline), even though it is 14 bytes on disk. This is the CLI half of the "counts characters, not bytes" Review Focus item.
- `redirect_stdout` is what makes `print()` inside `main` land in a `StringIO`, so the assertions can check stdout byte-for-byte, including the single trailing newline `print` adds to the report.
- The `argparse` tests use `cli.main` directly (not `run_cli`) because `SystemExit` propagates out of the `with` blocks and `run_cli` would never return.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: FAIL — `ModuleNotFoundError: No module named 'wordstat.cli'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py` with exactly this content:

```python
"""Command-line entry point: read a text file and print its statistics."""

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
    """Run the CLI. Return 0 on success, 1 if the file cannot be read."""
    args = _build_parser().parse_args(argv)

    try:
        with open(args.path, "r", encoding="utf-8") as handle:
            text = handle.read()
    except OSError as exc:
        reason = exc.strerror or exc
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


if __name__ == "__main__":
    sys.exit(main())
```

Why it is written this way:
- Catching `OSError` (not just `FileNotFoundError`) covers a missing file, a directory passed as the path, and a permission error with one branch — all three are "cannot read this file", all three return 1.
- `UnicodeDecodeError` is a `ValueError`, **not** an `OSError`, so it needs its own `except` clause. Without it, a binary file would raise a traceback out of `main`.
- The error messages include `args.path`, which the tests assert on; `print(..., file=sys.stderr)` supplies the trailing newline.
- The `if __name__ == "__main__"` block lets you run `python3 -m wordstat.cli FILE` by hand. It stays inside `cli.py` so the package layout matches the spec.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: PASS — `Ran 8 tests` / `OK`.

- [ ] **Step 5: Run the whole suite via discovery**

Run: `python3 -m unittest -v`

Expected: PASS — `Ran 29 tests` / `OK` (15 from `test_counter`, 6 from `test_formatter`, 8 from `test_cli`). If discovery finds 0 tests, you are not in the repo root — `cd` to the directory containing `design.md` and re-run.

- [ ] **Step 6: Smoke-test the CLI by hand**

```bash
printf 'one two three\nfour five\n' > /tmp/wordstat-smoke.txt
python3 -m wordstat.cli /tmp/wordstat-smoke.txt; echo "exit=$?"
python3 -m wordstat.cli /tmp/definitely-missing.txt; echo "exit=$?"
rm -f /tmp/wordstat-smoke.txt
```

Expected: the first command prints

```
words: 5
lines: 2
chars: 24
```

then `exit=0`. The second prints a `wordstat: cannot read /tmp/definitely-missing.txt: No such file or directory` line to stderr, then `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat(cli): add argparse entry point composing counter and formatter"
```

---

## Done When

- `python3 -m unittest` from the repo root reports `OK` with 29 tests.
- `python3 -m wordstat.cli <file>` prints the three-line report and exits 0; a missing path prints to stderr and exits 1.
- One commit per task landed on `main` (three total), and `git status` shows no uncommitted changes under `wordstat/` or to the `test_*.py` files.
- No file outside the spec's layout was added to `wordstat/`, and no third-party import appears anywhere.
