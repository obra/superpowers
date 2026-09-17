# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tiny Python CLI, `wordstat`, that reads a text file and prints a three-line report of its word, line, and character counts.

**Architecture:** Three modules with one responsibility each: `counter.py` holds pure functions over a `str` (no I/O), `formatter.py` turns a stats dict into the report string (no I/O), and `cli.py` does all the I/O — argument parsing, file reading, printing, exit codes — by composing the other two. Because the first two layers are pure, their tests are plain value-in/value-out assertions; only `cli` needs temp files and stream capture.

**Tech Stack:** Python 3 standard library only. `argparse` for the CLI, `unittest` for tests, `tempfile` + `contextlib.redirect_stdout`/`redirect_stderr` for CLI tests.

**Spec:** `design.md` (in this same directory)

## Global Constraints

- Standard library only — no third-party runtime or test dependencies.
- Tests live at the **repo root** (`test_counter.py`, `test_formatter.py`, `test_cli.py`), not in a `tests/` package, and must be runnable with `python3 -m unittest`.
- Package modules live under `wordstat/`: `counter.py`, `formatter.py`, `cli.py`. `wordstat/__init__.py` already exists and is empty — leave it empty (it is just a package marker).
- Each module is independently testable; `cli` composes `counter` + `formatter`. `counter` and `formatter` must not import each other, and neither may do any I/O.
- `counter` and `formatter` never touch `sys`, files, or `print`.
- This is a local scratch repo with no remote. Work directly on `main`. Commit after each task; never push.

## Review Focus

Input classes and failure modes the spec implies but does not spell out. Each line below has a test assigned to the task that owns the code; the task number is given in brackets.

- **Empty input** (`""`): the natural reading of the spec is 0 words, 0 lines, 0 chars — a trailing newline does not create a final line, and an empty file has no lines at all. [Task 1]
- **Whitespace-only input** (`"   \n\t\n"`): 0 words, but a nonzero line and char count — `split()` on whitespace yields no tokens. [Task 1]
- **Runs of mixed whitespace between words** (`"a  \t b\n\nc"`): tokens are whitespace-separated, so repeated separators must not produce empty tokens. [Task 1]
- **A lone newline** (`"\n"`): one line, not zero and not two. [Task 1]
- **CRLF line endings** (`"a\r\nb\r\n"`): 2 lines — `str.splitlines()` handles this; a naive `count("\n")` would too, but a naive `split("\n")` would not. [Task 1]
- **Non-ASCII text**: `count_chars` counts characters, not bytes, so `"héllo"` is 5. [Task 1]
- **Report has no trailing newline**: `format_report` returns exactly `"words: W\nlines: L\nchars: C"`; the newline at the end of the terminal output comes from `print`. [Task 2, Task 3]
- **Zero counts render as `0`**, not blank or `-`. [Task 2]
- **Path that exists but is not a readable regular file** (a directory, or a file with no read permission): the spec only names "missing file", but a reasonable person expects the same one-line stderr message and exit 1 rather than a traceback. Catch `OSError` (the base class of `FileNotFoundError`, `IsADirectoryError`, and `PermissionError`), not just `FileNotFoundError`. [Task 3]
- **Binary / non-UTF-8 file**: decoding raises `UnicodeDecodeError`, which is *not* an `OSError`. It must also become a stderr message and exit 1, not a traceback. [Task 3]
- **No path argument at all**: `argparse` writes usage to stderr and raises `SystemExit(2)`. That is acceptable and conventional, but pin it with a test so nobody "fixes" it into a crash or a silent 0. [Task 3]
- **`main` returns an int; it does not call `sys.exit` itself.** The module-level `__main__` guard is the only place that exits, so `main` stays testable in-process. [Task 3]

---

### Task 1: `counter` — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py` (repo root)

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `count_words(text: str) -> int` — number of whitespace-separated tokens.
  - `count_lines(text: str) -> int` — number of lines; a trailing newline does not add an empty final line.
  - `count_chars(text: str) -> int` — number of characters, including whitespace.

  Task 3 imports all three by these exact names from `wordstat.counter`.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py` with this exact content:

```python
import unittest

from wordstat import counter


class CountWordsTest(unittest.TestCase):
    def test_counts_space_separated_tokens(self):
        self.assertEqual(counter.count_words("the quick brown fox"), 4)

    def test_empty_string_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_string_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t\n"), 0)

    def test_runs_of_mixed_whitespace_do_not_create_empty_tokens(self):
        self.assertEqual(counter.count_words("a  \t b\n\nc"), 3)

    def test_single_word_without_trailing_newline(self):
        self.assertEqual(counter.count_words("hello"), 1)


class CountLinesTest(unittest.TestCase):
    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_empty_string_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_lone_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("\n"), 1)

    def test_blank_lines_in_the_middle_are_counted(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)

    def test_crlf_line_endings(self):
        self.assertEqual(counter.count_lines("a\r\nb\r\n"), 2)


class CountCharsTest(unittest.TestCase):
    def test_counts_whitespace_and_newlines(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_string_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo"), 5)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`

Expected: FAIL — `ImportError: cannot import name 'counter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py`:

```python
"""Pure functions that compute statistics about a block of text."""


def count_words(text):
    """Return the number of whitespace-separated tokens in *text*."""
    return len(text.split())


def count_lines(text):
    """Return the number of lines in *text*.

    A trailing newline does not add an empty final line: both ``"a\\nb"`` and
    ``"a\\nb\\n"`` are 2 lines. The empty string has 0 lines.
    """
    return len(text.splitlines())


def count_chars(text):
    """Return the number of characters in *text*, including whitespace."""
    return len(text)
```

Why these one-liners are the right implementation, not a shortcut:
`str.split()` with no argument splits on runs of arbitrary whitespace and
discards empty tokens, which is exactly the "whitespace-separated tokens"
rule. `str.splitlines()` treats a trailing line terminator as terminating the
last line rather than starting a new one, and handles `\r\n`, which is exactly
the line rule. Do not reach for `text.split("\n")` — it returns `['a', 'b', '']`
for `"a\nb\n"` and would give 3.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: PASS — 13 tests, `OK`.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter with word, line, and char stats"
```

---

### Task 2: `formatter` — render a stats dict as a report

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py` (repo root)

**Interfaces:**
- Consumes: nothing from Task 1 — `formatter` must not import `counter`. It only knows about a dict shaped `{"words": int, "lines": int, "chars": int}`.
- Produces:
  - `format_report(stats: dict) -> str` — returns exactly `"words: W\nlines: L\nchars: C"`, in that key order, with **no** trailing newline.

  Task 3 imports `format_report` by this exact name from `wordstat.formatter` and passes it a dict with exactly those three keys.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py` with this exact content:

```python
import unittest

from wordstat.formatter import format_report


class FormatReportTest(unittest.TestCase):
    def test_renders_three_labelled_lines_in_order(self):
        report = format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_has_no_trailing_newline(self):
        report = format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_zero_counts_render_as_zero(self):
        report = format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_key_order_in_the_input_dict_does_not_matter(self):
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
"""Render a statistics mapping as a human-readable report."""


def format_report(stats):
    """Return a three-line report for *stats*.

    *stats* is a mapping with the keys ``"words"``, ``"lines"`` and
    ``"chars"``. The returned string has no trailing newline; the caller
    supplies that (``print`` does).
    """
    return "words: {words}\nlines: {lines}\nchars: {chars}".format(
        words=stats["words"],
        lines=stats["lines"],
        chars=stats["chars"],
    )
```

Note the explicit key lookups rather than iterating the dict: the report's line
order is fixed by the spec and must not depend on the caller's insertion order.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: PASS — 4 tests, `OK`.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter for the stats report"
```

---

### Task 3: `cli` — argparse entry point tying it together

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py` (repo root)

**Interfaces:**
- Consumes:
  - `wordstat.counter.count_words(text) -> int`, `count_lines(text) -> int`, `count_chars(text) -> int` (Task 1).
  - `wordstat.formatter.format_report(stats) -> str`, where `stats` is `{"words": int, "lines": int, "chars": int}` (Task 2).
- Produces:
  - `main(argv) -> int` — `argv` is the argument list **without** the program name (e.g. `["notes.txt"]`). Parses one positional `path`, reads the file as UTF-8, computes the three stats, prints the report to stdout, and returns `0`. On an unreadable path or undecodable content: prints a one-line message to stderr and returns `1`. Missing positional argument: `argparse` prints usage to stderr and raises `SystemExit(2)`.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py` with this exact content. `_write_file` is a helper that
creates a file inside a per-test temporary directory that `unittest` cleans up
automatically — no test leaves files behind, and no test depends on another
test's files.

```python
import contextlib
import io
import os
import tempfile
import unittest

from wordstat import cli


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmpdir.cleanup)

    def _write_file(self, content, name="input.txt", encoding="utf-8"):
        path = os.path.join(self.tmpdir.name, name)
        with open(path, "w", encoding=encoding) as handle:
            handle.write(content)
        return path

    def _run(self, argv):
        """Run cli.main(argv), returning (exit_code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(argv)
        return code, out.getvalue(), err.getvalue()


class MainSuccessTest(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self._write_file("the quick brown fox\njumped over\n")
        code, out, err = self._run([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 5\nlines: 2\nchars: 32\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_all_zeros(self):
        path = self._write_file("")
        code, out, err = self._run([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")
        self.assertEqual(err, "")

    def test_file_without_trailing_newline(self):
        path = self._write_file("hello world")
        code, out, _ = self._run([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 11\n")

    def test_non_ascii_file_counts_characters_not_bytes(self):
        path = self._write_file("héllo wörld\n")
        code, out, _ = self._run([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")


class MainErrorTest(CliTestCase):
    def test_missing_file_reports_to_stderr_and_returns_one(self):
        path = os.path.join(self.tmpdir.name, "nope.txt")
        code, out, err = self._run([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("nope.txt", err)
        self.assertTrue(err.endswith("\n"))

    def test_directory_path_reports_to_stderr_and_returns_one(self):
        code, out, err = self._run([self.tmpdir.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(self.tmpdir.name, err)

    def test_undecodable_file_reports_to_stderr_and_returns_one(self):
        path = os.path.join(self.tmpdir.name, "binary.bin")
        with open(path, "wb") as handle:
            handle.write(b"\xff\xfe\x00rubbish")
        code, out, err = self._run([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("binary.bin", err)

    def test_missing_argument_exits_two(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as raised:
                cli.main([])
        self.assertEqual(raised.exception.code, 2)
        self.assertIn("usage:", err.getvalue())


if __name__ == "__main__":
    unittest.main()
```

Two of the expected values are worth checking by hand so a failure is not
mistaken for a bug in the counter:
`"the quick brown fox\njumped over\n"` is 5 words, 2 lines, and 32 characters
(19 + 1 + 11 + 1). `"héllo wörld\n"` is 12 characters, though it is 14 bytes on
disk in UTF-8 — that is the point of the test.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: FAIL — `ModuleNotFoundError: No module named 'wordstat.cli'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py`:

```python
"""Command-line entry point: read a file and print its text statistics."""

import argparse
import sys

from wordstat import counter
from wordstat.formatter import format_report


def _build_parser():
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print word, line, and character counts for a text file.",
    )
    parser.add_argument("path", help="path to the text file to measure")
    return parser


def main(argv=None):
    """Run the CLI over *argv* and return a process exit code.

    *argv* is the argument list without the program name. Returns 0 on
    success, or 1 after writing a message to stderr if the file cannot be
    read or decoded.
    """
    args = _build_parser().parse_args(argv)

    try:
        with open(args.path, encoding="utf-8") as handle:
            text = handle.read()
    except OSError as error:
        print("wordstat: {}: {}".format(args.path, error.strerror), file=sys.stderr)
        return 1
    except UnicodeDecodeError:
        print(
            "wordstat: {}: not valid UTF-8 text".format(args.path),
            file=sys.stderr,
        )
        return 1

    stats = {
        "words": counter.count_words(text),
        "lines": counter.count_lines(text),
        "chars": counter.count_chars(text),
    }
    print(format_report(stats))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

Three details that the tests pin and that are easy to get wrong:

- `except OSError` (not `except FileNotFoundError`) is what makes the directory
  and permission cases produce a clean message instead of a traceback.
  `UnicodeDecodeError` is a `ValueError`, so it needs its own clause — an
  `OSError` handler will not catch it.
- `main` returns an int and never calls `sys.exit` itself; only the
  `__main__` guard exits. That is what lets the tests call it in-process.
- `print(format_report(stats))` supplies the single trailing newline, which is
  why `format_report` must not include one.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: PASS — 8 tests, `OK`.

- [ ] **Step 5: Run the whole suite together**

Run: `python3 -m unittest discover -v`

Expected: PASS — 25 tests total (13 counter + 4 formatter + 8 cli), `OK`.

- [ ] **Step 6: Check the CLI end-to-end by hand**

```bash
printf 'the quick brown fox\njumped over\n' > /tmp/wordstat-check.txt
python3 -m wordstat.cli /tmp/wordstat-check.txt; echo "exit=$?"
python3 -m wordstat.cli /tmp/definitely-missing.txt; echo "exit=$?"
rm /tmp/wordstat-check.txt
```

Expected: the first invocation prints `words: 5` / `lines: 2` / `chars: 32` and
`exit=0`; the second prints a `wordstat: ...: No such file or directory` line
(on stderr) and `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add cli entry point composing counter and formatter"
```
