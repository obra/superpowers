# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package that counts words, lines, and characters in a text file and prints a three-line report from a CLI.

**Architecture:** Three modules with one responsibility each: `counter.py` holds pure `str -> int` functions, `formatter.py` turns a stats dict into the report string, and `cli.py` is the only module that touches the filesystem, `sys.argv`, stdout, or exit codes. Data flows one way (`cli` → `counter` → `cli` → `formatter` → stdout), so `counter` and `formatter` are testable with plain values and need no mocks or temp files.

**Tech Stack:** Python 3 standard library only — `argparse`, `sys`, `unittest` (plus `tempfile`/`io`/`contextlib` in the CLI tests). No third-party packages, no `setup.py`/`pyproject.toml` (the package is imported from the repo root).

**Spec:** `design.md` (in this same directory)

## Global Constraints

- Standard library only — no third-party runtime or test dependencies.
- Tests live at the repo root: `test_counter.py`, `test_formatter.py`, `test_cli.py`.
- The whole suite must run with `python3 -m unittest` from the repo root (this means test files must be named `test*.py` for default discovery, and importable as top-level modules).
- Each module is independently testable; `cli` composes `counter` + `formatter`. `counter` must not import `formatter` or `cli`; `formatter` must not import `counter` or `cli`.
- Package layout is exactly: `wordstat/__init__.py` (already exists, leave it empty), `wordstat/counter.py`, `wordstat/formatter.py`, `wordstat/cli.py`.
- Report format is exactly `"words: 12\nlines: 3\nchars: 57"` — lowercase labels, `": "` separator, that order, no trailing newline in the returned string.
- `cli.main(argv)` returns an `int` exit code (0 success, 1 unreadable file). It returns codes; it does not call `sys.exit()` itself, so tests can call it directly.
- Work directly on `main`; commit after each task.

## Review Focus

These are input classes the spec implies but never names. Each line has a test assigned to the task that owns the code; the assignment is noted in brackets.

- Empty text `""` — `count_words`/`count_lines`/`count_chars` all return 0, and `count_lines("")` is 0 (not 1); an empty file must report all zeroes rather than crash. [Task 1 + Task 3]
- Whitespace-only text — `count_words("   \n\t  ")` is 0, not 1. [Task 1]
- Interior blank lines — `count_lines("a\n\n\nb\n")` is 4; blank lines are lines. [Task 1]
- Single line with no newline at all — `count_lines("hello")` is 1, not 0. [Task 1]
- Non-ASCII text — `count_chars` counts characters (code points), so `"héllo"` is 5, not the 6 bytes UTF-8 would use; the CLI must decode files as UTF-8 explicitly rather than inheriting the locale. [Task 1 + Task 3]
- Path that exists but is a directory — same user-visible outcome as a missing file: message on stderr, return 1, no traceback. [Task 3]
- File whose bytes are not valid UTF-8 — decoding raises `UnicodeDecodeError`, which is **not** an `OSError`; catch it too, or pointing the tool at a binary file prints a traceback. [Task 3]
- No `path` argument given — argparse's own behavior: usage on stderr and `SystemExit(2)`. Pinned as a test so nobody "fixes" it into a return value. [Task 3]
- Stats dict missing a key — `format_report` raises `KeyError` rather than silently printing a partial or padded report. [Task 2]

---

### Task 1: `counter` — the three pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing (first task; `wordstat/__init__.py` already exists and stays empty).
- Produces:
  - `count_words(text: str) -> int` — number of whitespace-separated tokens.
  - `count_lines(text: str) -> int` — number of lines; a trailing newline does not add an empty final line.
  - `count_chars(text: str) -> int` — number of characters, whitespace included.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py`:

```python
import unittest

from wordstat import counter


class CountWordsTests(unittest.TestCase):
    def test_counts_whitespace_separated_tokens(self):
        self.assertEqual(counter.count_words("the quick brown fox"), 4)

    def test_collapses_runs_of_mixed_whitespace(self):
        self.assertEqual(counter.count_words("a  \t b\nc\n"), 3)

    def test_empty_text_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_text_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t  "), 0)


class CountLinesTests(unittest.TestCase):
    def test_counts_lines_without_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_single_line_without_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("hello"), 1)

    def test_interior_blank_lines_are_counted(self):
        self.assertEqual(counter.count_lines("a\n\n\nb\n"), 4)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)


class CountCharsTests(unittest.TestCase):
    def test_counts_every_character_including_whitespace(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_non_ascii_characters_once_each(self):
        self.assertEqual(counter.count_chars("héllo"), 5)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`

Expected: an import error, not test failures — `ModuleNotFoundError: No module named 'wordstat.counter'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py`:

```python
"""Pure text statistics. No I/O, no formatting."""


def count_words(text):
    """Number of whitespace-separated tokens in *text*."""
    return len(text.split())


def count_lines(text):
    """Number of lines in *text*; a trailing newline adds no empty line."""
    return len(text.splitlines())


def count_chars(text):
    """Number of characters in *text*, whitespace included."""
    return len(text)
```

Why these three one-liners are enough: `str.split()` with no argument splits on runs of
whitespace and discards empty leading/trailing pieces, so whitespace-only and empty
input both give `0`. `str.splitlines()` gives `[]` for `""` and `["a", "b"]` for both
`"a\nb"` and `"a\nb\n"`, which is exactly the trailing-newline rule in the spec — do not
hand-roll `text.count("\n")` logic instead.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: `OK`, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter with word, line and char counts"
```

---

### Task 2: `formatter` — render a stats dict to the report string

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing from Task 1 at import time — `formatter` must not import `counter`. It only relies on the *shape* of the dict `cli` will build: `{"words": int, "lines": int, "chars": int}`.
- Produces: `format_report(stats: dict) -> str` — a 3-line string, e.g. `"words: 12\nlines: 3\nchars: 57"`, with no trailing newline.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py`:

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

    def test_renders_zeroes(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_extra_keys_are_ignored(self):
        report = formatter.format_report(
            {"words": 2, "lines": 1, "chars": 3, "bytes": 99}
        )
        self.assertEqual(report, "words: 2\nlines: 1\nchars: 3")

    def test_missing_key_raises_key_error(self):
        with self.assertRaises(KeyError):
            formatter.format_report({"words": 1, "lines": 1})


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: `ModuleNotFoundError: No module named 'wordstat.formatter'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py`:

```python
"""Render a stats mapping as a human-readable report."""

_FIELDS = ("words", "lines", "chars")


def format_report(stats):
    """Return a 3-line report for *stats*, e.g. "words: 12\\nlines: 3\\nchars: 57"."""
    return "\n".join(f"{field}: {stats[field]}" for field in _FIELDS)
```

Indexing with `stats[field]` (not `stats.get(field, 0)`) is what makes the missing-key
test pass: a caller that forgot a stat gets a loud `KeyError` instead of a report that
quietly claims zero.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: `OK`, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter for stats report"
```

---

### Task 3: `cli` — argparse entry point tying it together

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `counter.count_words(text) -> int`, `counter.count_lines(text) -> int`, `counter.count_chars(text) -> int` (Task 1); `formatter.format_report(stats) -> str` where `stats` is `{"words": int, "lines": int, "chars": int}` (Task 2). Import them with relative imports: `from . import counter, formatter`.
- Produces: `main(argv: list[str]) -> int` — takes the argument list *without* the program name (so `main(["notes.txt"])`, never `main(sys.argv)`), prints the report to stdout, returns `0`; on an unreadable path prints a message to stderr and returns `1`.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py`:

```python
import contextlib
import io
import os
import tempfile
import unittest

from wordstat import cli


class CliTests(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmpdir.cleanup)

    def write_file(self, data, name="sample.txt"):
        """Write raw bytes into the temp dir and return the path."""
        path = os.path.join(self.tmpdir.name, name)
        with open(path, "wb") as handle:
            handle.write(data)
        return path

    def run_main(self, argv):
        """Call cli.main capturing stdout/stderr; return (code, out, err)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_prints_report_and_returns_zero(self):
        path = self.write_file(b"the quick brown fox\njumps\n")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 5\nlines: 2\nchars: 26\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_zeroes(self):
        path = self.write_file(b"")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")

    def test_reads_file_as_utf8(self):
        path = self.write_file("héllo wörld\n".encode("utf-8"))
        code, out, _ = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")

    def test_missing_file_returns_one_with_stderr_message(self):
        path = os.path.join(self.tmpdir.name, "nope.txt")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("cannot read", err)
        self.assertIn(path, err)

    def test_directory_path_returns_one(self):
        code, out, err = self.run_main([self.tmpdir.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("cannot read", err)

    def test_non_utf8_file_returns_one_without_traceback(self):
        path = self.write_file(b"\xff\xfe\x00binary")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("cannot read", err)

    def test_missing_argument_exits_two(self):
        with self.assertRaises(SystemExit) as caught:
            self.run_main([])
        self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

Two numbers worth checking by hand so nobody "fixes" a correct test: `"the quick brown
fox\njumps\n"` is 5 words, 2 lines, and 26 characters (19 + newline + 5 + newline).
`"héllo wörld\n"` is 12 characters — 11 code points plus the newline — even though it is
13 bytes on disk, which is exactly what the UTF-8 decoding assertion is for.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: `ModuleNotFoundError: No module named 'wordstat.cli'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py`:

```python
"""Command-line entry point: read a file, count, print the report."""

import argparse
import sys

from . import counter, formatter


def _build_parser():
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print word, line and character counts for a text file.",
    )
    parser.add_argument("path", help="path to the text file to analyze")
    return parser


def main(argv):
    """Run the CLI over *argv* (without the program name); return an exit code."""
    args = _build_parser().parse_args(argv)
    try:
        with open(args.path, encoding="utf-8") as handle:
            text = handle.read()
    except (OSError, UnicodeDecodeError) as exc:
        detail = getattr(exc, "strerror", None) or exc
        print(f"wordstat: cannot read {args.path}: {detail}", file=sys.stderr)
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

Three details that the tests depend on:
- `encoding="utf-8"` is explicit. Without it Python uses the locale encoding, so the
  character counts would differ between machines.
- The `except` clause catches `UnicodeDecodeError` as well as `OSError` because a binary
  file fails to *decode*, not to *open*, and `UnicodeDecodeError` is a `ValueError`.
  `getattr(exc, "strerror", None) or exc` covers that too — `OSError` has a friendly
  `strerror` like `"No such file or directory"`, `UnicodeDecodeError` has none.
- `print(...)` adds the trailing newline that `format_report` deliberately omits, which
  is why the expected stdout in the tests ends with `\n`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: `OK`, 7 tests.

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`

Expected: `OK`, 24 tests (12 counter + 5 formatter + 7 cli). If discovery finds 0 tests,
you are not in the repo root.

- [ ] **Step 6: Verify the CLI end to end by hand**

Run: `python3 -m wordstat.cli design.md`

Expected: three lines like `words: 213`, `lines: 38`, `chars: 1551` (exact numbers depend
on the file; they must be non-zero and plausible).

Run: `python3 -m wordstat.cli no-such-file.txt; echo "exit=$?"`

Expected: `wordstat: cannot read no-such-file.txt: No such file or directory` on stderr
and `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add wordstat CLI entry point"
```
