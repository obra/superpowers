# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a standard-library-only Python package whose CLI prints word, line, and character counts for a text file.

**Architecture:** Three layers, each independently testable. `counter.py` holds pure functions from `str` → `int` with no I/O. `formatter.py` turns a stats dict into the report string. `cli.py` is the only module that touches the filesystem, argv, stdout, or stderr; it composes the other two. Dependencies point one way: `cli` → (`counter`, `formatter`), and `counter` and `formatter` know nothing about each other.

**Tech Stack:** Python 3 standard library only. Tests use `unittest` (stdlib), run from the repo root with `python3 -m unittest`.

**Spec:** `design.md` (in this same directory)

## Global Constraints

- Standard library only — no third-party runtime or test dependencies, no `requirements.txt`, no `pip install`.
- Tests live at the **repo root** (`test_counter.py`, `test_formatter.py`, `test_cli.py`), not in a `tests/` directory, and are runnable with `python3 -m unittest`.
- Package modules live under `wordstat/`. `wordstat/__init__.py` already exists and is empty — leave it empty; it is only a package marker.
- All commands in this plan are run from the repo root (the directory containing `design.md`). That directory must be the working directory so that `import wordstat` resolves and `python3 -m unittest` discovers the root-level test files.
- `counter` functions are pure: they take a `str` and return an `int`. They never open files, never print, never raise for ordinary text input.
- `format_report` returns a 3-line string with **no trailing newline**: `"words: 12\nlines: 3\nchars: 57"`. Field order is always words, lines, chars.
- `cli.main(argv)` returns an `int` exit code: `0` on success, `1` when the file cannot be read. It takes the argument list explicitly (not `sys.argv`) so tests can call it directly.
- Line counting rule, verbatim from the spec: a trailing newline does not add an empty final line; `"a\nb"` and `"a\nb\n"` are both 2.
- Use `python3` (verified present: 3.14.7). Any Python 3.7+ works; the code uses only f-strings and `argparse`.

## Review Focus

These are input classes and failure modes the spec implies but does not spell out. Each one has a test assigned to the task that owns the code — the parenthetical says where.

- **Empty input.** An empty file is a legal text file. All three counters must return 0 and the CLI must print `words: 0 / lines: 0 / chars: 0` and exit 0 — not crash, not report 1 line. (Task 1 counter tests; Task 3 `test_empty_file_reports_zeros`.)
- **Whitespace-only and repeated whitespace.** `"   \n\t  "` has 0 words; `"  one\t\ntwo   three \n"` has 3, not 6 — no empty tokens from runs of spaces, tabs, or newlines. (Task 1 counter tests.)
- **Blank lines in the middle.** `"a\n\nb\n"` is 3 lines; the empty middle line counts. (Task 1 counter tests.)
- **Non-ASCII text.** `count_chars` counts *characters*, not bytes, so the CLI must decode the file as UTF-8 explicitly rather than relying on the platform's locale encoding. `"héllo"` is 5 chars. (Task 1 `test_counts_non_ascii_characters_as_one_each`; Task 3 `test_counts_non_ascii_characters_not_bytes`.)
- **A path that exists but is not a readable file.** The spec only names "missing file", but a directory or a permission-denied path is the same situation for the user: message to stderr, exit 1. Catching `OSError` (the parent of `FileNotFoundError`, `IsADirectoryError`, and `PermissionError`) covers all three with one branch. (Task 3 `test_directory_path_reports_error_and_returns_one`.)
- **A file that is not valid UTF-8.** Point the CLI at a JPEG and a bare `UnicodeDecodeError` traceback is not an acceptable answer. `UnicodeDecodeError` is a `ValueError`, *not* an `OSError`, so it needs its own `except` clause; it also has no `.strerror`. Same contract: stderr message, exit 1. (Task 3 `test_undecodable_file_reports_error_and_returns_one`.)
- **No path argument at all.** `argparse` handles this by printing usage to stderr and raising `SystemExit(2)`, so `main` never returns. That is the right behavior — do not suppress it — but it is worth pinning so nobody "fixes" it into a silent 0. (Task 3 `test_missing_argument_exits_with_usage_error`.)
- **`format_report` given a dict in a different key order, or missing a key.** The report order must not depend on dict insertion order, and a missing key should fail loudly (`KeyError`) rather than print a partial report. (Task 2 `test_field_order_is_fixed_regardless_of_dict_order`, `test_missing_key_raises_key_error`.)

---

## File Structure

| File | Responsibility |
|---|---|
| `wordstat/__init__.py` | Package marker. **Already exists, empty. Do not modify.** |
| `wordstat/counter.py` | Create (Task 1). Three pure functions: `count_words`, `count_lines`, `count_chars`. No imports needed. |
| `wordstat/formatter.py` | Create (Task 2). `format_report(stats) -> str` plus the module-level field-order constant. No imports needed. |
| `wordstat/cli.py` | Create (Task 3). `build_parser()`, `main(argv) -> int`, `_fail(path, reason) -> int`, and a `__main__` guard. Imports `argparse`, `sys`, `wordstat.counter`, `wordstat.formatter`. |
| `test_counter.py` | Create (Task 1). |
| `test_formatter.py` | Create (Task 2). |
| `test_cli.py` | Create (Task 3). |

Tasks are ordered by dependency: Task 3 imports the modules from Tasks 1 and 2. Do them in order.

---

## Task 1: counter — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing. This is the first task.
- Produces (Task 3 calls all three):
  - `counter.count_words(text: str) -> int`
  - `counter.count_lines(text: str) -> int`
  - `counter.count_chars(text: str) -> int`

**Background for the implementer.** Python's stdlib already does all three jobs, and reaching for the stdlib primitive is the correct answer here — do not hand-roll a loop:
- `str.split()` with **no arguments** splits on runs of any whitespace and discards leading/trailing whitespace, so `"  a  b \n".split()` is `["a", "b"]`. This is not the same as `split(" ")`, which would produce empty strings. Use the no-argument form.
- `str.splitlines()` splits on line boundaries and does **not** produce a trailing empty element for a trailing newline: `"a\nb".splitlines()` and `"a\nb\n".splitlines()` are both `["a", "b"]`, and `"".splitlines()` is `[]`. That matches the spec's line rule exactly, including the empty-file case. `text.split("\n")` would get both wrong.
- `len(text)` counts characters in a `str` (Python strings are sequences of code points, so one accented letter is one character).

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py` with exactly this content:

```python
import unittest

from wordstat import counter


class CountWordsTests(unittest.TestCase):
    def test_counts_whitespace_separated_tokens(self):
        self.assertEqual(counter.count_words("one two three"), 3)

    def test_collapses_runs_of_mixed_whitespace(self):
        self.assertEqual(counter.count_words("  one\t\ntwo   three \n"), 3)

    def test_single_word_without_whitespace(self):
        self.assertEqual(counter.count_words("solo"), 1)

    def test_empty_text_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_text_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t  "), 0)


class CountLinesTests(unittest.TestCase):
    def test_counts_lines_without_trailing_newline(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_a_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_single_line_without_newline(self):
        self.assertEqual(counter.count_lines("just one line"), 1)

    def test_blank_interior_line_counts(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)


class CountCharsTests(unittest.TestCase):
    def test_counts_every_character_including_whitespace(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_non_ascii_characters_as_one_each(self):
        self.assertEqual(counter.count_chars("héllo"), 5)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`

Expected: an error, not a test failure — `ImportError: cannot import name 'counter' from 'wordstat'`, because `wordstat/counter.py` does not exist yet.

- [ ] **Step 3: Write the implementation**

Create `wordstat/counter.py` with exactly this content:

```python
"""Pure text statistics. No I/O, no printing."""


def count_words(text):
    """Number of whitespace-separated tokens in ``text``."""
    return len(text.split())


def count_lines(text):
    """Number of lines in ``text``; a trailing newline adds no empty line."""
    return len(text.splitlines())


def count_chars(text):
    """Number of characters in ``text``, whitespace included."""
    return len(text)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: `Ran 13 tests ... OK`

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter with word, line, and char stats"
```

---

## Task 2: formatter — render the stats dict

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing from Task 1. `formatter` does not import `counter`; it only receives a plain dict.
- Produces (Task 3 calls this):
  - `formatter.format_report(stats: dict) -> str` where `stats` has integer values under the keys `"words"`, `"lines"`, and `"chars"`. Returns three `"<label>: <value>"` lines joined by `"\n"`, in that fixed order, with **no trailing newline**.

**Background for the implementer.** Two design points the tests pin down:
- Iterate a module-level tuple of field names and look each one up in `stats`. Do **not** iterate `stats.items()` — that would make output order depend on how the caller built the dict, and a missing key would silently shorten the report instead of failing.
- Return the string without a trailing `"\n"`. The CLI uses `print()`, which supplies the line ending. Adding one here would produce a blank line in the terminal.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py` with exactly this content:

```python
import unittest

from wordstat import formatter


class FormatReportTests(unittest.TestCase):
    def test_renders_three_labelled_lines(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_field_order_is_fixed_regardless_of_dict_order(self):
        report = formatter.format_report({"chars": 57, "lines": 3, "words": 12})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_has_no_trailing_newline(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_renders_zero_values(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_missing_key_raises_key_error(self):
        with self.assertRaises(KeyError):
            formatter.format_report({"words": 1, "lines": 1})


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: `ImportError: cannot import name 'formatter' from 'wordstat'`.

- [ ] **Step 3: Write the implementation**

Create `wordstat/formatter.py` with exactly this content:

```python
"""Render a stats dict as a human-readable report."""

FIELDS = ("words", "lines", "chars")


def format_report(stats):
    """Return a report line per field in ``FIELDS``, joined by newlines.

    ``stats`` must contain an integer for every name in ``FIELDS``; a missing
    name raises ``KeyError`` rather than printing a partial report. The result
    has no trailing newline.
    """
    return "\n".join(f"{name}: {stats[name]}" for name in FIELDS)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: `Ran 5 tests ... OK`

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter for the stats report"
```

---

## Task 3: cli — argparse entry point composing counter and formatter

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes:
  - `counter.count_words(text) -> int`, `counter.count_lines(text) -> int`, `counter.count_chars(text) -> int` (Task 1)
  - `formatter.format_report(stats) -> str`, where `stats` is `{"words": int, "lines": int, "chars": int}` (Task 2)
- Produces:
  - `cli.main(argv) -> int` — `argv` is a list of argument strings *without* the program name (i.e. what you would pass as `sys.argv[1:]`). Returns `0` on success, `1` when the file cannot be read. Raises `SystemExit(2)` via argparse if `argv` is empty or malformed.
  - `cli.build_parser() -> argparse.ArgumentParser` — one positional argument, `path`.
  - `python3 -m wordstat.cli <path>` works as a command line.

**Background for the implementer.**
- `open(path, encoding="utf-8")` — pass `encoding` explicitly. Without it Python uses the platform's preferred encoding, so character counts for non-ASCII files would vary between machines.
- Keep both `open()` and `.read()` inside the `try`: the file opens fine and the decode error surfaces during `read()`.
- `except OSError` catches `FileNotFoundError`, `IsADirectoryError`, and `PermissionError` in one clause; `OSError.strerror` holds the human-readable reason (`"No such file or directory"`). Fall back to `str(exc)` because `strerror` can be `None`.
- `UnicodeDecodeError` is a subclass of `ValueError`, **not** `OSError`, so it needs its own `except` clause, and it has no `.strerror` — use `.reason`.
- Order matters: nothing is printed to stdout unless the read succeeded, so a failure produces stderr output and an empty stdout.
- The `if __name__ == "__main__":` guard passes `sys.argv[1:]` to `main` and hands the return value to `sys.exit`, which turns the int into the process exit status.

The test file uses `contextlib.redirect_stdout` / `redirect_stderr` with `io.StringIO` to capture output from a direct `main()` call — no subprocess needed for the unit tests, which keeps them fast. `tempfile.TemporaryDirectory` plus `self.addCleanup` gives each test a real file on disk that is removed afterward. The one subprocess test exists only to prove the `__main__` guard is wired up.

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


def run_main(argv):
    """Call cli.main(argv), returning (exit_code, stdout, stderr)."""
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = cli.main(argv)
    return code, out.getvalue(), err.getvalue()


class MainTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def write_file(self, name, text):
        path = os.path.join(self.tmp.name, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        return path

    def test_prints_report_and_returns_zero(self):
        path = self.write_file("sample.txt", "one two\nthree\n")
        code, out, err = run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 3\nlines: 2\nchars: 14\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_zeros(self):
        path = self.write_file("empty.txt", "")
        code, out, err = run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")
        self.assertEqual(err, "")

    def test_counts_non_ascii_characters_not_bytes(self):
        path = self.write_file("accents.txt", "héllo wörld\n")
        code, out, _err = run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")

    def test_missing_file_reports_error_and_returns_one(self):
        path = os.path.join(self.tmp.name, "nope.txt")
        code, out, err = run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("cannot read", err)
        self.assertIn("nope.txt", err)

    def test_directory_path_reports_error_and_returns_one(self):
        code, out, err = run_main([self.tmp.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("cannot read", err)

    def test_undecodable_file_reports_error_and_returns_one(self):
        path = os.path.join(self.tmp.name, "binary.bin")
        with open(path, "wb") as handle:
            handle.write(b"\xff\xfe\x00rubbish")
        code, out, err = run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("UTF-8", err)

    def test_missing_argument_exits_with_usage_error(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as caught:
                cli.main([])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage:", err.getvalue())


class ModuleEntryPointTests(unittest.TestCase):
    def test_running_the_module_prints_the_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "sample.txt")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write("a b c\n")
            result = subprocess.run(
                [sys.executable, "-m", "wordstat.cli", path],
                capture_output=True,
                text=True,
            )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, "words: 3\nlines: 1\nchars: 6\n")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the implementation**

Create `wordstat/cli.py` with exactly this content:

```python
"""Command-line entry point: read a file, print its stats."""

import argparse
import sys

from wordstat import counter, formatter


def build_parser():
    """Return the argument parser for the ``wordstat`` command."""
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Print word, line, and character counts for a text file.",
    )
    parser.add_argument("path", help="path to the text file to measure")
    return parser


def _fail(path, reason):
    """Report a read failure on stderr and return the failure exit code."""
    print(f"wordstat: cannot read {path!r}: {reason}", file=sys.stderr)
    return 1


def main(argv):
    """Print the report for the file named in ``argv``; return an exit code."""
    args = build_parser().parse_args(argv)
    try:
        with open(args.path, encoding="utf-8") as handle:
            text = handle.read()
    except OSError as exc:
        return _fail(args.path, exc.strerror or str(exc))
    except UnicodeDecodeError as exc:
        return _fail(args.path, f"not valid UTF-8 text ({exc.reason})")

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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: `Ran 8 tests ... OK`

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`

Expected: `Ran 26 tests ... OK` (13 counter + 5 formatter + 8 cli). `unittest` with no arguments discovers `test_*.py` in the current directory, which is why the tests live at the repo root.

- [ ] **Step 6: Try it by hand**

```bash
python3 -m wordstat.cli design.md
python3 -m wordstat.cli no-such-file.txt; echo "exit=$?"
```

Expected: the first prints three `words:` / `lines:` / `chars:` lines for `design.md`. The second prints `wordstat: cannot read 'no-such-file.txt': No such file or directory` to stderr and `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add cli composing counter and formatter"
```

---

## Done when

- `python3 -m unittest` passes from the repo root with 26 tests.
- `python3 -m wordstat.cli <file>` prints the three-line report and exits 0.
- A missing, unreadable, or non-UTF-8 path prints a message to stderr and exits 1, with nothing on stdout.
- No file outside `wordstat/` and the three root-level `test_*.py` files was created or modified, and no third-party package is imported anywhere.
