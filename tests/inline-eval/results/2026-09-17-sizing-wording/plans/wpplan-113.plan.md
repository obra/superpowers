# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tiny Python CLI, `wordstat`, that reads a text file and prints a three-line report of its word, line, and character counts.

**Architecture:** Three single-responsibility modules inside the existing `wordstat/` package: `counter.py` holds pure functions over a string (no I/O), `formatter.py` turns a stats dict into a report string (no I/O), and `cli.py` does all the I/O — argument parsing, file reading, printing, exit codes — by composing the other two. Each module is testable on its own; only `cli.py` touches the filesystem.

**Tech Stack:** Python 3 standard library only. `argparse` for arguments, `unittest` for tests, `unittest.mock.patch` + `io.StringIO` for capturing CLI output, `tempfile` for CLI fixture files. No third-party packages, no `setup.py`/`pyproject.toml` — the package is used in place from the repo root.

**Spec:** `design.md` (in this directory)

## Global Constraints

- **Standard library only** — no third-party runtime or test dependencies.
- Tests live at the **repo root** (`test_counter.py`, `test_formatter.py`, `test_cli.py`), not in a `tests/` directory, and are runnable with `python3 -m unittest`.
- The package directory is `wordstat/`; `wordstat/__init__.py` already exists and is empty — leave it empty.
- Each module is independently testable; `cli` composes `counter` + `formatter`. `counter.py` and `formatter.py` must not import each other and must not perform I/O.
- Report format is exactly `"words: 12\nlines: 3\nchars: 57"` — lowercase labels, colon, single space, in the order words, lines, chars, with **no trailing newline** in the returned string.
- `cli.main(argv)` returns `0` on success and `1` when the file cannot be read; error messages go to **stderr**, the report goes to **stdout**.
- Work directly on `main` in this repo (no remote). Commit after each task.

## Review Focus

Input classes the spec implies but does not spell out. Each has a test assigned to the task that owns the code; the assignment is named on the line.

- **Empty string / empty file** — `count_words("")`, `count_lines("")`, `count_chars("")` must all be `0`; `""` has zero lines, not one. Tested in Task 1 and end-to-end in Task 3.
- **Whitespace-only and runs of whitespace** — `"  \n\t "` has zero words; `"a   b"` has two, not four. Tabs and newlines are word separators. Tested in Task 1.
- **Trailing and repeated newlines** — `"a\nb"` and `"a\nb\n"` are both 2 lines (stated in the spec); `"a\n\n"` is 2 lines, because the blank line between the two newlines is a real line and only the final newline is a terminator. Tested in Task 1.
- **CRLF line endings** — `"a\r\nb\r\n"` is 2 lines. Character count includes the `\r`, since `count_chars` counts every character. Tested in Task 1.
- **Non-ASCII text** — `count_chars` counts characters, not bytes: `"héllo"` is 5. The CLI must read files as UTF-8 explicitly rather than relying on the platform default encoding. Tested in Task 1 and Task 3.
- **Path is a directory, not a file** — opening it raises `IsADirectoryError`, not `FileNotFoundError`; the CLI must still exit 1 with a stderr message instead of crashing with a traceback. Tested in Task 3.
- **Unreadable file (permission denied)** — same requirement: exit 1 with a stderr message. Tested in Task 3.
- **No path argument at all** — `argparse` raises `SystemExit(2)` and prints its own usage message to stderr. That is acceptable behavior; the test pins it so nobody "fixes" it into a silent success. Tested in Task 3.
- **Stdout cleanliness on failure** — when the file cannot be read, nothing is printed to stdout. Tested in Task 3.

---

### Task 1: `counter` — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `count_words(text: str) -> int` — number of whitespace-separated tokens.
  - `count_lines(text: str) -> int` — number of lines; a single trailing newline does not add an empty final line.
  - `count_chars(text: str) -> int` — number of characters, including whitespace.

  All three take one `str` and return an `int`. None of them do I/O or raise on any string input.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py` with exactly this content:

```python
import unittest

from wordstat import counter


class CountWordsTests(unittest.TestCase):
    def test_simple_sentence(self):
        self.assertEqual(counter.count_words("the quick brown fox"), 4)

    def test_empty_string_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_has_no_words(self):
        self.assertEqual(counter.count_words("  \n\t "), 0)

    def test_runs_of_whitespace_do_not_create_empty_words(self):
        self.assertEqual(counter.count_words("a   b\t\tc\nd"), 4)

    def test_leading_and_trailing_whitespace_ignored(self):
        self.assertEqual(counter.count_words("  hello world  \n"), 2)


class CountLinesTests(unittest.TestCase):
    def test_two_lines_without_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_empty_string_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_single_line_without_newline(self):
        self.assertEqual(counter.count_lines("hello"), 1)

    def test_blank_line_before_trailing_newline_counts(self):
        # "a\n" ends line 1; the second "\n" ends a second, empty line.
        self.assertEqual(counter.count_lines("a\n\n"), 2)

    def test_crlf_line_endings(self):
        self.assertEqual(counter.count_lines("a\r\nb\r\n"), 2)


class CountCharsTests(unittest.TestCase):
    def test_counts_whitespace_and_letters(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_string(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo"), 5)

    def test_counts_carriage_returns(self):
        self.assertEqual(counter.count_chars("a\r\nb"), 4)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`

Expected: an error, not passes — `ImportError: cannot import name 'counter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py`:

```python
"""Pure functions computing simple statistics about a block of text."""


def count_words(text):
    """Return the number of whitespace-separated tokens in ``text``."""
    return len(text.split())


def count_lines(text):
    """Return the number of lines in ``text``.

    A single trailing newline terminates the last line rather than starting an
    empty one, so ``"a\\nb"`` and ``"a\\nb\\n"`` are both 2.
    """
    return len(text.splitlines())


def count_chars(text):
    """Return the number of characters in ``text``, including whitespace."""
    return len(text)
```

Notes for the implementer, so the one-liners are not mistaken for guesses:
- `str.split()` with no argument splits on runs of any whitespace and discards
  leading/trailing whitespace, which is exactly the "whitespace-separated
  tokens" rule — `"a   b".split()` is `["a", "b"]`, and `"".split()` is `[]`.
- `str.splitlines()` gives the trailing-newline behavior for free: `"a\nb\n"`
  → `["a", "b"]`, `"a\n\n"` → `["a", ""]`, `""` → `[]`. Do **not** use
  `text.count("\n")` or `text.split("\n")`; both get the empty string or the
  trailing newline wrong.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: `Ran 15 tests` … `OK`.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter module with word, line, and char counts"
```

---

### Task 2: `formatter` — render a stats dict to a report

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing from Task 1 — `formatter` must not import `counter`. It only relies on the dict shape `{"words": int, "lines": int, "chars": int}`.
- Produces:
  - `format_report(stats: dict) -> str` — given `{"words": w, "lines": l, "chars": c}`, returns a 3-line string, e.g. `"words: 12\nlines: 3\nchars: 57"`, with no trailing newline.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py` with exactly this content:

```python
import unittest

from wordstat import formatter


class FormatReportTests(unittest.TestCase):
    def test_exact_report_text(self):
        stats = {"words": 12, "lines": 3, "chars": 57}
        self.assertEqual(
            formatter.format_report(stats),
            "words: 12\nlines: 3\nchars: 57",
        )

    def test_no_trailing_newline(self):
        stats = {"words": 1, "lines": 1, "chars": 1}
        self.assertFalse(formatter.format_report(stats).endswith("\n"))

    def test_three_lines_in_fixed_order(self):
        stats = {"chars": 57, "lines": 3, "words": 12}
        lines = formatter.format_report(stats).split("\n")
        self.assertEqual(lines, ["words: 12", "lines: 3", "chars: 57"])

    def test_zero_values(self):
        stats = {"words": 0, "lines": 0, "chars": 0}
        self.assertEqual(
            formatter.format_report(stats),
            "words: 0\nlines: 0\nchars: 0",
        )


if __name__ == "__main__":
    unittest.main()
```

`test_three_lines_in_fixed_order` passes the dict with its keys in a different
order on purpose: the report order is fixed by the formatter, not by the
caller's dict.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: an error — `ImportError: cannot import name 'formatter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py`:

```python
"""Render a stats mapping as a human-readable report."""


def format_report(stats):
    """Return a 3-line report for ``stats``.

    ``stats`` is a mapping with the keys ``"words"``, ``"lines"`` and
    ``"chars"``. The returned string has no trailing newline; printing it adds
    one.
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

Expected: `Ran 4 tests` … `OK`.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter module rendering the stats report"
```

---

### Task 3: `cli` — argparse entry point tying it together

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes:
  - `wordstat.counter.count_words(text) -> int`, `count_lines(text) -> int`, `count_chars(text) -> int` (Task 1).
  - `wordstat.formatter.format_report(stats) -> str`, where `stats` is `{"words": int, "lines": int, "chars": int}` (Task 2).
- Produces:
  - `main(argv) -> int` — `argv` is the list of arguments **without** the program name (as in `main(["file.txt"])`). Parses one positional `path`, reads it as UTF-8, prints the report to stdout, returns `0`. If the file cannot be read, prints a message to stderr and returns `1`.
  - Module runs as a script: `python3 -m wordstat.cli <path>` exits with `main`'s return value.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py` with exactly this content:

```python
import io
import os
import stat
import tempfile
import unittest
from unittest import mock

from wordstat import cli


class CliTestCase(unittest.TestCase):
    """Base class giving each test a temp directory and output capture."""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.tmpdir = self._tmp.name

        self.stdout = io.StringIO()
        self.stderr = io.StringIO()
        patcher = mock.patch("sys.stdout", self.stdout)
        patcher.start()
        self.addCleanup(patcher.stop)
        patcher = mock.patch("sys.stderr", self.stderr)
        patcher.start()
        self.addCleanup(patcher.stop)

    def write_file(self, name, content):
        """Write ``content`` to ``name`` in the temp dir; return its path."""
        path = os.path.join(self.tmpdir, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(content)
        return path


class SuccessTests(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_file("sample.txt", "the quick brown fox\njumps\n")
        exit_code = cli.main([path])
        self.assertEqual(exit_code, 0)
        self.assertEqual(
            self.stdout.getvalue(),
            "words: 5\nlines: 2\nchars: 26\n",
        )

    def test_empty_file_reports_zeros(self):
        path = self.write_file("empty.txt", "")
        exit_code = cli.main([path])
        self.assertEqual(exit_code, 0)
        self.assertEqual(
            self.stdout.getvalue(),
            "words: 0\nlines: 0\nchars: 0\n",
        )

    def test_reads_file_as_utf8(self):
        path = self.write_file("accents.txt", "héllo wörld\n")
        exit_code = cli.main([path])
        self.assertEqual(exit_code, 0)
        self.assertEqual(
            self.stdout.getvalue(),
            "words: 2\nlines: 1\nchars: 12\n",
        )


class FailureTests(CliTestCase):
    def test_missing_file_returns_one_with_stderr_message(self):
        path = os.path.join(self.tmpdir, "does-not-exist.txt")
        exit_code = cli.main([path])
        self.assertEqual(exit_code, 1)
        self.assertIn(path, self.stderr.getvalue())
        self.assertEqual(self.stdout.getvalue(), "")

    def test_directory_path_returns_one_instead_of_crashing(self):
        exit_code = cli.main([self.tmpdir])
        self.assertEqual(exit_code, 1)
        self.assertIn(self.tmpdir, self.stderr.getvalue())
        self.assertEqual(self.stdout.getvalue(), "")

    def test_unreadable_file_returns_one(self):
        path = self.write_file("secret.txt", "hi\n")
        os.chmod(path, 0)
        self.addCleanup(os.chmod, path, stat.S_IRUSR | stat.S_IWUSR)
        if os.access(path, os.R_OK):  # e.g. running as root
            self.skipTest("cannot make a file unreadable for this user")
        exit_code = cli.main([path])
        self.assertEqual(exit_code, 1)
        self.assertIn(path, self.stderr.getvalue())
        self.assertEqual(self.stdout.getvalue(), "")

    def test_missing_argument_exits_two(self):
        with self.assertRaises(SystemExit) as caught:
            cli.main([])
        self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

Two notes on the expected numbers, so a failing assertion is not "fixed" by
editing the test:
- `"the quick brown fox\njumps\n"` — 5 words, 2 lines, and 26 characters
  (19 for `"the quick brown fox"`, plus `"\n"`, plus 5 for `"jumps"`, plus
  `"\n"`).
- `"héllo wörld\n"` — 2 words, 1 line, 12 characters. It is 14 *bytes* in
  UTF-8; asserting 12 is what pins character counting rather than byte
  counting.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: an error — `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py`:

```python
"""Command-line entry point: read a file and print its text statistics."""

import argparse
import sys

from wordstat import counter, formatter


def _build_parser():
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print word, line, and character counts for a text file.",
    )
    parser.add_argument("path", help="path to the text file to measure")
    return parser


def main(argv):
    """Run the CLI over ``argv`` (arguments without the program name).

    Returns 0 on success, or 1 if the file could not be read.
    """
    args = _build_parser().parse_args(argv)

    try:
        with open(args.path, "r", encoding="utf-8") as handle:
            text = handle.read()
    except OSError as error:
        print(
            "wordstat: cannot read {}: {}".format(args.path, error.strerror),
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
    sys.exit(main(sys.argv[1:]))
```

Why `except OSError` and not `except FileNotFoundError`: a missing file, a
directory, and a permission-denied file raise three different exceptions
(`FileNotFoundError`, `IsADirectoryError`, `PermissionError`), all subclasses
of `OSError`. Catching the base class covers all three with one message and
keeps a traceback off the user's screen. `error.strerror` is the OS's own
description ("No such file or directory", "Is a directory", "Permission
denied").

Note that `print(..., file=sys.stderr)` looks `sys.stderr` up at call time,
which is what lets the tests capture it by patching `sys.stderr`. Do not
rebind it to a module-level variable at import time.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: `Ran 7 tests` … `OK` (or `OK (skipped=1)` if the permission test
cannot run as the current user).

- [ ] **Step 5: Run the whole suite and check the CLI by hand**

Run: `python3 -m unittest discover -v`

Expected: all 26 tests from the three files pass — `OK`.

Then exercise the real entry point end to end:

```bash
printf 'the quick brown fox\njumps\n' > /tmp/wordstat-demo.txt
python3 -m wordstat.cli /tmp/wordstat-demo.txt; echo "exit=$?"
python3 -m wordstat.cli /tmp/nope.txt; echo "exit=$?"
```

Expected output:

```
words: 5
lines: 2
chars: 26
exit=0
wordstat: cannot read /tmp/nope.txt: No such file or directory
exit=1
```

(The second command's first line goes to stderr.)

- [ ] **Step 6: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add argparse CLI composing counter and formatter"
```
