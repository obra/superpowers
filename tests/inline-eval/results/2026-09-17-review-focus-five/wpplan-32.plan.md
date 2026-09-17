# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package that counts words, lines, and characters in a text file and prints a three-line report from a CLI.

**Architecture:** Three independent modules with one responsibility each. `counter.py` holds pure functions over a `str` (no I/O). `formatter.py` renders a stats dict to a report string (no I/O). `cli.py` is the only module that touches the filesystem, stdout, or stderr: it parses argv, reads the file, calls `counter`, calls `formatter`, prints, and returns an exit code. Tests live at the repo root, one test module per source module, so each layer is tested without the ones above it.

**Tech Stack:** Python 3 standard library only. `argparse` for argument parsing, `unittest` for tests, `tempfile` for test fixtures. No third-party packages, no `setup.py`/`pyproject.toml` (not in the design's file layout).

**Spec:** `design.md` (in this directory)

## Global Constraints

- Standard library only — no third-party imports in source or tests.
- Tests must run with `python3 -m unittest` from the repo root (default discovery finds `test*.py`).
- File layout is exactly what `design.md` lists: `wordstat/__init__.py` (already exists, leave it empty), `wordstat/counter.py`, `wordstat/formatter.py`, `wordstat/cli.py`, and root-level `test_counter.py`, `test_formatter.py`, `test_cli.py`. Do not add other files.
- Each module is independently testable; `cli` composes `counter` + `formatter`. `counter` and `formatter` must not import each other, and neither may do I/O.
- `formatter.format_report` output is exactly `"words: {w}\nlines: {l}\nchars: {c}"` — lowercase labels, colon-space separator, no trailing newline.
- This is a local scratch repo with no remote. Work directly on `main`; commit after each task, never push.

## Review Focus

These are input classes the spec implies but does not spell out. Each one has a test assigned to the task that owns the code — do not skip them.

1. **Empty file** — `count_words("")`, `count_lines("")`, `count_chars("")` must all return `0` (an empty file has zero lines, not one), and the CLI must print `words: 0 / lines: 0 / chars: 0` and exit 0 rather than crash. (Tests in Task 1 and Task 3.)
2. **Non-ASCII text** — `count_chars` counts characters, not bytes (`"héllo"` is 5), and the CLI must read files as UTF-8 explicitly so behavior does not depend on the machine's locale. (Tests in Task 1 and Task 3.)
3. **Path that exists but cannot be read as a text file** — a directory, or a file with undecodable bytes. The design only names "missing file", but a reasonable person expects a message on stderr and exit 1 here too, not a traceback. (Tests in Task 3.)
4. **Whitespace-only content** — `"   \n\t\n"` has 0 words but a nonzero character count, and its lines still count. Splitting on whitespace must not produce phantom empty tokens. (Tests in Task 1.)
5. **No path argument at all** — `argparse` prints usage to stderr and raises `SystemExit(2)`; `main` does not return a code in that case. This is the intended behavior, but it must be pinned by a test so nobody "fixes" it into a silent `return 0`. (Test in Task 3.)

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

  Task 3 imports all three as `from wordstat import counter` and calls `counter.count_words(text)` etc.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py` with exactly this content:

```python
import unittest

from wordstat import counter


class CountWordsTests(unittest.TestCase):
    def test_counts_whitespace_separated_tokens(self):
        self.assertEqual(counter.count_words("one two three"), 3)

    def test_collapses_runs_of_whitespace(self):
        self.assertEqual(counter.count_words("  one   two\t\tthree\n"), 3)

    def test_newlines_separate_words(self):
        self.assertEqual(counter.count_words("one\ntwo"), 2)

    def test_empty_text_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_text_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t\n"), 0)


class CountLinesTests(unittest.TestCase):
    def test_counts_lines_without_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_single_line_without_newline(self):
        self.assertEqual(counter.count_lines("a"), 1)

    def test_blank_interior_lines_count(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)


class CountCharsTests(unittest.TestCase):
    def test_counts_all_characters_including_whitespace(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo"), 5)

    def test_whitespace_only_text_still_has_chars(self):
        self.assertEqual(counter.count_chars("   \n\t\n"), 6)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)


if __name__ == "__main__":
    unittest.main()
```

Note on `test_counts_characters_not_bytes`: `"héllo"` is 5 characters but 6 UTF-8 bytes. This test is what stops someone from implementing `count_chars` via `len(text.encode())`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`

Expected: FAIL — `ImportError: cannot import name 'counter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py`:

```python
"""Pure statistics functions over text. No I/O lives here."""


def count_words(text):
    """Return the number of whitespace-separated tokens in *text*."""
    return len(text.split())


def count_lines(text):
    """Return the number of lines in *text*.

    A trailing newline does not add an empty final line: both "a\\nb" and
    "a\\nb\\n" have 2 lines. Empty text has 0 lines.
    """
    return len(text.splitlines())


def count_chars(text):
    """Return the number of characters in *text*, whitespace included."""
    return len(text)
```

Why these three one-liners are correct rather than lazy:
- `str.split()` with no argument splits on runs of whitespace *and* discards leading/trailing whitespace, so `"  a   b "` yields 2 tokens and `"   "` yields 0. Do not pass a separator.
- `str.splitlines()` yields `[]` for `""` and does not produce a trailing empty string for `"a\n"`, which is exactly the spec's rule. Do not use `text.count("\n")` or `text.split("\n")`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: PASS — 14 tests, OK.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter module with word, line, and char counts"
```

---

### Task 2: `formatter` — render a stats dict to a report string

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing from Task 1 — `formatter` must not import `counter`.
- Produces:
  - `format_report(stats: dict) -> str` — given `{"words": int, "lines": int, "chars": int}`, returns `"words: {words}\nlines: {lines}\nchars: {chars}"`. Exactly three lines, no trailing newline.

  Task 3 imports it as `from wordstat import formatter` and calls `formatter.format_report(stats)`.

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

    def test_line_order_is_words_lines_chars(self):
        report = formatter.format_report({"words": 1, "lines": 2, "chars": 3})
        self.assertEqual(report.split("\n"), ["words: 1", "lines: 2", "chars: 3"])

    def test_key_order_in_the_dict_does_not_matter(self):
        report = formatter.format_report({"chars": 57, "lines": 3, "words": 12})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_renders_zeros(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")


if __name__ == "__main__":
    unittest.main()
```

`test_key_order_in_the_dict_does_not_matter` is what stops someone from implementing this by iterating over `stats.items()`, which would silently reorder the report depending on how the caller built the dict.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: FAIL — `ImportError: cannot import name 'formatter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py`:

```python
"""Rendering of a stats mapping into a human-readable report."""


def format_report(stats):
    """Return a three-line report for *stats*.

    *stats* is a mapping with "words", "lines" and "chars" keys. The lines are
    always emitted in that order, and the result has no trailing newline --
    the caller's ``print()`` supplies it.
    """
    return (
        f"words: {stats['words']}\n"
        f"lines: {stats['lines']}\n"
        f"chars: {stats['chars']}"
    )
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: PASS — 5 tests, OK.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter module rendering stats to a report"
```

---

### Task 3: `cli` — argparse entry point composing counter and formatter

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes:
  - `counter.count_words(text) -> int`, `counter.count_lines(text) -> int`, `counter.count_chars(text) -> int` from Task 1.
  - `formatter.format_report(stats) -> str` from Task 2, where `stats` is `{"words": int, "lines": int, "chars": int}`.
- Produces:
  - `main(argv=None) -> int` — parses a single positional `path`, reads that file as UTF-8, prints the report to stdout, returns `0`. On an unreadable path, prints a message to stderr and returns `1`. With no `path`, `argparse` raises `SystemExit(2)`.

  `argv` defaults to `None` so that `main()` reads `sys.argv[1:]`, which is what the `__main__` guard relies on.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py` with exactly this content:

```python
import io
import os
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout

from wordstat import cli


def run_cli(argv):
    """Run cli.main(argv), capturing output. Returns (code, stdout, stderr)."""
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        code = cli.main(argv)
    return code, out.getvalue(), err.getvalue()


class CliTestCase(unittest.TestCase):
    def write_file(self, data, encoding="utf-8"):
        """Write *data* to a temp file cleaned up after the test; return path."""
        directory = tempfile.mkdtemp()
        self.addCleanup(lambda: _remove_tree(directory))
        path = os.path.join(directory, "sample.txt")
        mode = "wb" if isinstance(data, bytes) else "w"
        kwargs = {} if isinstance(data, bytes) else {"encoding": encoding}
        with open(path, mode, **kwargs) as handle:
            handle.write(data)
        return path


def _remove_tree(directory):
    for name in os.listdir(directory):
        os.remove(os.path.join(directory, name))
    os.rmdir(directory)


class SuccessTests(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_file("one two\nthree\n")
        code, out, err = run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 3\nlines: 2\nchars: 14\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_all_zeros(self):
        path = self.write_file("")
        code, out, err = run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")
        self.assertEqual(err, "")

    def test_reads_file_as_utf8_regardless_of_locale(self):
        path = self.write_file("héllo wörld\n")
        code, out, err = run_cli([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")
        self.assertEqual(err, "")


class FailureTests(CliTestCase):
    def test_missing_file_reports_to_stderr_and_returns_one(self):
        directory = tempfile.mkdtemp()
        self.addCleanup(os.rmdir, directory)
        path = os.path.join(directory, "does-not-exist.txt")
        code, out, err = run_cli([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(path, err)
        self.assertTrue(err.endswith("\n"))

    def test_directory_path_reports_to_stderr_and_returns_one(self):
        directory = tempfile.mkdtemp()
        self.addCleanup(os.rmdir, directory)
        code, out, err = run_cli([directory])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(directory, err)

    def test_undecodable_file_reports_to_stderr_and_returns_one(self):
        path = self.write_file(b"\xff\xfe not utf-8 \xff")
        code, out, err = run_cli([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(path, err)

    def test_missing_argument_exits_two(self):
        with self.assertRaises(SystemExit) as caught:
            with redirect_stderr(io.StringIO()):
                cli.main([])
        self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

Two notes on the expected numbers, so you can check them by hand rather than by running the code:
- `"one two\nthree\n"` — 3 words, 2 lines, and 14 characters (`one two` = 7, `\n` = 1, `three` = 5, `\n` = 1).
- `"héllo wörld\n"` — 2 words, 1 line, 12 characters. It is 14 *bytes* in UTF-8; if this test reports 14 chars, the implementation is measuring bytes.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: FAIL — `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py`:

```python
"""Command-line entry point: read a file, compute stats, print a report."""

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
    """Run the CLI. Returns 0 on success, 1 if *path* cannot be read.

    *argv* is the argument list without the program name; None means use
    sys.argv[1:]. A missing path argument makes argparse exit with status 2.
    """
    args = _build_parser().parse_args(argv)

    try:
        with open(args.path, encoding="utf-8") as handle:
            text = handle.read()
    except OSError as error:
        print(f"wordstat: {args.path}: {error.strerror or error}", file=sys.stderr)
        return 1
    except UnicodeDecodeError:
        print(f"wordstat: {args.path}: not valid UTF-8 text", file=sys.stderr)
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

Why the error handling looks like this:
- Catch `OSError`, not `FileNotFoundError`. A directory raises `IsADirectoryError` and an unreadable file raises `PermissionError`; both are `OSError` subclasses, and both deserve the same message-and-exit-1 treatment rather than a traceback.
- `error.strerror or error` because `strerror` is `None` for some `OSError`s, and `"wordstat: /path: None"` is a useless message.
- `UnicodeDecodeError` is a `ValueError`, *not* an `OSError`, so it needs its own clause. It fires from `handle.read()` inside the `with`, which is why the `read()` is inside the `try`.
- `encoding="utf-8"` is explicit. Without it, `open()` uses the locale's preferred encoding and the same file would count differently on different machines.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: PASS — 7 tests, OK.

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`

Expected: PASS — 26 tests across `test_cli`, `test_counter`, and `test_formatter`, OK.

- [ ] **Step 6: Check the CLI by hand**

```bash
printf 'one two\nthree\n' > /tmp/wordstat-sample.txt
python3 -m wordstat.cli /tmp/wordstat-sample.txt; echo "exit=$?"
python3 -m wordstat.cli /tmp/definitely-missing.txt; echo "exit=$?"
rm /tmp/wordstat-sample.txt
```

Expected: the first prints `words: 3` / `lines: 2` / `chars: 14` then `exit=0`; the second prints a `wordstat: /tmp/definitely-missing.txt: No such file or directory` line on stderr then `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add cli composing counter and formatter"
```
