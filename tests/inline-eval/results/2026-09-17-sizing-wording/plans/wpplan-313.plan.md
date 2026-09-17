# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package that counts words, lines, and characters in a text file and prints a three-line report from a CLI.

**Architecture:** Three single-responsibility modules composed in one direction: `counter.py` holds pure `str -> int` functions with no I/O, `formatter.py` turns a stats dict into the report string with no I/O, and `cli.py` does all the I/O (argparse, file read, stdout/stderr, exit code) by calling the other two. Nothing imports `cli`; `counter` and `formatter` never import each other. Each module gets its own root-level `unittest` test file, so each task ends with a green test run that does not depend on later tasks.

**Tech Stack:** Python 3 standard library only — `argparse`, `sys`, `unittest`, `tempfile`, `io`, `contextlib`. No third-party packages, no test runner beyond `python3 -m unittest`.

**Spec:** `design.md` (in this directory)

## Global Constraints

- Standard library only — no third-party runtime or test dependencies.
- Tests live at the repo root (`test_counter.py`, `test_formatter.py`, `test_cli.py`) and run with `python3 -m unittest`.
- Package layout is exactly: `wordstat/__init__.py` (already exists, empty — leave it empty), `wordstat/counter.py`, `wordstat/formatter.py`, `wordstat/cli.py`. Do not add other package files.
- Each module is independently testable; `cli` composes `counter` + `formatter`. `counter` and `formatter` do no I/O and do not import each other.
- Files are read as UTF-8 (`encoding="utf-8"` passed explicitly — never rely on the platform default encoding).
- A "line" is delimited by `"\n"` only, and a single trailing `"\n"` does not add an empty final line (`"a\nb"` and `"a\nb\n"` are both 2).
- Work directly on `main`; this is a local scratch repo with no remote. Commit at the end of every task.

## Review Focus

Every line below has a test in this plan; the owning task and step are named so the final reviewer can confirm each one is actually exercised rather than rediscovering it.

- Empty input (`""`): all three counters return `0`, and an empty file still prints a full report with exit 0 — Task 1 Step 1, Task 3 Step 6.
- Whitespace-only input (`"   \n\t "`): word count is `0`, not 1 — Task 1 Step 1.
- Runs of mixed whitespace between words (double spaces, tabs, newlines) count as one separator, not several — Task 1 Step 1.
- Bare newline (`"\n"`) is 1 line; interior blank lines (`"a\n\nb"`) count as real lines — Task 1 Step 1.
- CRLF line endings: `"a\r\nb\r\n"` is 2 lines, and the `\r` characters still count toward `chars` — Task 1 Step 1.
- Multi-byte characters count as one character each, not one per byte — Task 1 Step 1.
- Report field order is fixed (`words`, `lines`, `chars`) regardless of the stats dict's insertion order, and the report has no trailing newline of its own — Task 2 Step 1.
- CLI target is a directory, not a file: `IsADirectoryError` is an `OSError`, so it must produce the same stderr-message-and-`1` path as a missing file rather than a traceback — Task 3 Step 1.
- CLI invoked with no path argument: argparse's own usage error (`SystemExit` code 2) is the expected behavior, not a crash inside our code — Task 3 Step 1.
- CLI target is not valid UTF-8: `UnicodeDecodeError` is a `ValueError`, so it is not caught by the `OSError` handler and needs its own handler returning `1` — Task 3 Step 1.
- CLI stdout ends with exactly one newline (the report has none; `print` supplies it) — Task 3 Step 1.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `wordstat/__init__.py` | Package marker. Already exists and is empty. **Not modified by any task.** |
| `wordstat/counter.py` | Task 1. Pure counting functions: `count_words`, `count_lines`, `count_chars`. No imports, no I/O. |
| `wordstat/formatter.py` | Task 2. `format_report(stats)` → report string. No imports, no I/O. |
| `wordstat/cli.py` | Task 3. `main(argv=None)` → exit code. Argparse, file reading, stdout/stderr, error handling. Imports `counter` and `formatter`. |
| `test_counter.py` | Task 1 tests. |
| `test_formatter.py` | Task 2 tests. |
| `test_cli.py` | Task 3 tests. Uses `tempfile` for real files, `contextlib.redirect_stdout/redirect_stderr` for output capture. |

Import style inside the package is `from wordstat import counter` (absolute), which works because tests run from the repo root with the repo root on `sys.path`.

---

## Task 1: `counter` — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `count_words(text: str) -> int` — number of whitespace-separated tokens.
  - `count_lines(text: str) -> int` — number of `"\n"`-delimited lines; a single trailing newline does not add an empty final line; `""` is 0.
  - `count_chars(text: str) -> int` — number of characters, whitespace included.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py` with exactly this content:

```python
import unittest

from wordstat import counter


class CountWordsTests(unittest.TestCase):
    def test_counts_space_separated_tokens(self):
        self.assertEqual(counter.count_words("one two three"), 3)

    def test_empty_string_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_string_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t "), 0)

    def test_runs_of_mixed_whitespace_are_one_separator(self):
        self.assertEqual(counter.count_words("one  two\t\tthree\nfour"), 4)

    def test_leading_and_trailing_whitespace_is_ignored(self):
        self.assertEqual(counter.count_words("  hi there \n"), 2)

    def test_punctuation_stays_attached_to_its_token(self):
        self.assertEqual(counter.count_words("hello, world!"), 2)


class CountLinesTests(unittest.TestCase):
    def test_counts_newline_delimited_lines(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_single_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_empty_string_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_bare_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("\n"), 1)

    def test_text_without_any_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("just one line"), 1)

    def test_interior_blank_lines_count(self):
        self.assertEqual(counter.count_lines("a\n\nb"), 3)

    def test_two_trailing_newlines_leave_one_blank_line(self):
        self.assertEqual(counter.count_lines("a\n\n"), 2)

    def test_crlf_endings_count_as_one_line_each(self):
        self.assertEqual(counter.count_lines("a\r\nb\r\n"), 2)


class CountCharsTests(unittest.TestCase):
    def test_counts_every_character_including_whitespace(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_string_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_carriage_returns_are_counted(self):
        self.assertEqual(counter.count_chars("a\r\nb\r\n"), 6)

    def test_multibyte_characters_count_once_each(self):
        self.assertEqual(counter.count_chars("héllo wörld\n"), 12)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`

Expected: FAIL — the import line raises `ModuleNotFoundError: No module named 'wordstat.counter'`, so all tests error out.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py` with exactly this content:

```python
"""Pure counting helpers. No I/O, no dependencies."""


def count_words(text):
    """Return the number of whitespace-separated tokens in ``text``."""
    return len(text.split())


def count_lines(text):
    """Return the number of newline-delimited lines in ``text``.

    A single trailing newline does not add an empty final line, so
    ``"a\\nb"`` and ``"a\\nb\\n"`` are both 2. The empty string is 0.
    """
    if not text:
        return 0
    body = text[:-1] if text.endswith("\n") else text
    return body.count("\n") + 1


def count_chars(text):
    """Return the number of characters in ``text``, whitespace included."""
    return len(text)
```

Why `count_lines` is written this way: `text.split("\n")` would over-count a trailing newline, and `str.splitlines()` would also split on form feeds and other Unicode line separators, which the spec does not ask for. Stripping at most one trailing `"\n"` and then counting separators keeps the rule to `"\n"` alone and makes `"a\r\nb\r\n"` two lines with the `\r` characters left intact for `count_chars`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: PASS — 18 tests, `OK`.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter module with word, line, and char counts"
```

---

## Task 2: `formatter` — render the report string

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing from Task 1 — `formatter` is independent of `counter` and must not import it.
- Produces:
  - `format_report(stats: dict) -> str` — given `{"words": w, "lines": l, "chars": c}`, returns a three-line string `"words: {w}\nlines: {l}\nchars: {c}"` with **no** trailing newline. Field order is always words, lines, chars.

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

    def test_zero_values_are_rendered_as_zero(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_field_order_ignores_dict_insertion_order(self):
        report = formatter.format_report({"chars": 57, "lines": 3, "words": 12})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_missing_key_raises_key_error(self):
        with self.assertRaises(KeyError):
            formatter.format_report({"words": 1, "lines": 1})


if __name__ == "__main__":
    unittest.main()
```

The last test pins the contract deliberately: a caller that forgets a key should fail loudly at the missing key rather than get a report with a blank or invented number in it.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: FAIL — `ModuleNotFoundError: No module named 'wordstat.formatter'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py` with exactly this content:

```python
"""Render a stats mapping as a human-readable report. No I/O."""

_FIELDS = ("words", "lines", "chars")


def format_report(stats):
    """Return a three-line report for ``stats``.

    ``stats`` must contain the keys ``words``, ``lines`` and ``chars``.
    Fields are always rendered in that order, and the returned string has
    no trailing newline -- the caller decides how to terminate it.
    """
    return "\n".join(f"{field}: {stats[field]}" for field in _FIELDS)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: PASS — 5 tests, `OK`.

- [ ] **Step 5: Run the whole suite so far**

Run: `python3 -m unittest discover -v`

Expected: PASS — 23 tests, `OK`. Task 1's tests must still be green.

- [ ] **Step 6: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter module rendering the stats report"
```

---

## Task 3: `cli` — argparse entry point

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `counter.count_words(text)`, `counter.count_lines(text)`, `counter.count_chars(text)` from Task 1; `formatter.format_report(stats)` from Task 2.
- Produces:
  - `main(argv=None) -> int` — parses one positional `path`, reads the file as UTF-8, prints the report to stdout, returns `0`. On an unreadable path (missing file, directory, permission denied) or non-UTF-8 content, prints a message to stderr and returns `1`. `argv` is a list of arguments without the program name; `None` means use `sys.argv[1:]`.
  - Module is runnable as `python3 -m wordstat.cli <path>`.

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
    def run_cli(self, *argv):
        """Run cli.main(argv), returning (exit_code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def write_file(self, data, name="sample.txt"):
        """Write bytes or str to a temp file, returning its path."""
        directory = tempfile.mkdtemp()
        self.addCleanup(self._cleanup, directory)
        path = os.path.join(directory, name)
        mode = "wb" if isinstance(data, bytes) else "w"
        kwargs = {} if isinstance(data, bytes) else {"encoding": "utf-8"}
        with open(path, mode, **kwargs) as handle:
            handle.write(data)
        return path

    def _cleanup(self, directory):
        for entry in os.listdir(directory):
            os.remove(os.path.join(directory, entry))
        os.rmdir(directory)


class SuccessTests(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_file("one two three\nfour five\n")
        code, out, err = self.run_cli(path)
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 5\nlines: 2\nchars: 24\n")
        self.assertEqual(err, "")

    def test_stdout_ends_with_exactly_one_newline(self):
        path = self.write_file("hi\n")
        _, out, _ = self.run_cli(path)
        self.assertTrue(out.endswith("\n"))
        self.assertFalse(out.endswith("\n\n"))

    def test_empty_file_reports_zeroes(self):
        path = self.write_file("")
        code, out, _ = self.run_cli(path)
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")

    def test_unicode_file_is_read_as_utf8(self):
        path = self.write_file("héllo wörld\n")
        code, out, _ = self.run_cli(path)
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")


class FailureTests(CliTestCase):
    def test_missing_file_reports_error_and_returns_one(self):
        missing = os.path.join(tempfile.mkdtemp(), "nope.txt")
        code, out, err = self.run_cli(missing)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(missing, err)
        self.assertTrue(err.endswith("\n"))

    def test_directory_path_reports_error_and_returns_one(self):
        directory = tempfile.mkdtemp()
        self.addCleanup(os.rmdir, directory)
        code, out, err = self.run_cli(directory)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(directory, err)

    def test_non_utf8_file_reports_error_and_returns_one(self):
        path = self.write_file(b"\xff\xfe\x00bad", name="binary.bin")
        code, out, err = self.run_cli(path)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("UTF-8", err)


class ArgumentTests(CliTestCase):
    def test_no_arguments_exits_with_usage_error(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as caught:
                cli.main([])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage:", err.getvalue())


if __name__ == "__main__":
    unittest.main()
```

Two of the expected numbers are worth checking by hand before you trust a failure: `"one two three\nfour five\n"` is 5 words, 2 lines, and 24 characters (13 + newline + 9 + newline); `"héllo wörld\n"` is 2 words, 1 line, and 12 characters, because `é` and `ö` are one character each even though they are two bytes each.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: FAIL — `ModuleNotFoundError: No module named 'wordstat.cli'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py` with exactly this content:

```python
"""Command-line entry point: read a file, print its stats."""

import argparse
import sys

from wordstat import counter, formatter


def _build_parser():
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print word, line and character counts for a text file.",
    )
    parser.add_argument("path", help="path to the text file to summarize")
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

Two things to keep as written. The handler catches `OSError`, not `FileNotFoundError`, because a directory path raises `IsADirectoryError` and an unreadable file raises `PermissionError` — both are `OSError` subclasses and both deserve the same message-and-`1` behavior instead of a traceback. `UnicodeDecodeError` needs its own clause because it is a `ValueError`, so the `OSError` clause would never see it.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: PASS — 8 tests, `OK`.

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest discover -v`

Expected: PASS — 31 tests, `OK`.

- [ ] **Step 6: Verify the CLI end to end by hand**

```bash
printf 'one two three\nfour five\n' > /tmp/wordstat-demo.txt
python3 -m wordstat.cli /tmp/wordstat-demo.txt; echo "exit=$?"
python3 -m wordstat.cli /tmp/definitely-missing.txt; echo "exit=$?"
rm /tmp/wordstat-demo.txt
```

Expected: the first command prints

```
words: 5
lines: 2
chars: 24
```

followed by `exit=0`. The second prints a `wordstat: cannot read /tmp/definitely-missing.txt: No such file or directory` line **to stderr** followed by `exit=1`, and prints nothing to stdout.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add argparse CLI composing counter and formatter"
```

---

## Done When

- `python3 -m unittest discover -v` passes with 31 tests from the repo root.
- `wordstat/__init__.py` is still empty and no files exist beyond those in the File Structure table plus `design.md` and `plan.md`.
- No module outside `wordstat/cli.py` performs I/O, and no third-party import appears anywhere.
