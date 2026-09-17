# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package with a CLI that reads a text file and prints its word, line, and character counts.

**Architecture:** Three layers, each independently testable. `counter.py` holds pure functions from `str` → `int` with no I/O. `formatter.py` holds one pure function from a stats dict → report string. `cli.py` is the only module that touches the filesystem, `sys.stderr`, or `sys.argv`; it composes the other two. Nothing imports `cli`, so `counter` and `formatter` can be tested with no fixtures at all.

**Tech Stack:** Python 3 standard library only — `argparse`, `sys`, `unittest`, `tempfile`, `io`, `contextlib`, `subprocess`.

**Spec:** `design.md` (in this directory)

## Global Constraints

- **Standard library only.** No third-party runtime dependencies and no third-party test dependencies (no `pytest`, no `hypothesis`).
- **Python 3.8+.** f-strings and `open(..., encoding=...)` are used freely.
- **Tests live at the repo root**, named `test_counter.py`, `test_formatter.py`, `test_cli.py` — not in a `tests/` directory.
- **The whole suite must run with `python3 -m unittest`** from the repo root (bare `unittest` with no arguments is equivalent to `unittest discover`, which finds root-level `test_*.py`).
- **Each module is independently testable.** `counter` and `formatter` must not import each other, must not import `cli`, and must not perform I/O. Only `cli` composes them.
- **Package layout is fixed by the spec:** `wordstat/{__init__.py,counter.py,formatter.py,cli.py}`. `wordstat/__init__.py` already exists as an empty package marker — leave it empty.
- **Work directly on `main`.** This is a local scratch repo with no remote; do not create branches and do not push.

## Review Focus

Input classes and failure modes the spec implies but does not spell out. Each line names the expected behavior and the task that owns its test.

- **Empty text.** `""` → 0 words, 0 lines, 0 chars. An empty file is a legitimate input and must not crash or report 1 line. *Test in Task 1.*
- **Whitespace-only text.** `"   \n\t\n"` → 0 words but non-zero lines and chars. Word counting must not treat "has content" as "has words". *Test in Task 1.*
- **Consecutive and mixed whitespace.** `"a  \t b\n c"` → 3 words; runs of spaces/tabs/newlines separate tokens without producing empty tokens. *Test in Task 1.*
- **Interior blank lines.** `"a\n\nb\n"` → 3 lines. The trailing-newline rule must strip exactly one trailing `\n`, not collapse a run of them. *Test in Task 1.*
- **A lone newline.** `"\n"` → 1 line (one empty line), not 0 and not 2. *Test in Task 1.*
- **Non-newline control characters.** A form feed or vertical tab inside the text is not a line break — a line is `\n`-delimited. This rules out `str.splitlines()`, which splits on `\x0b`, `\x0c`, `\r`, and ` `. *Test in Task 1.*
- **Report key order and trailing newline.** `format_report` emits words, then lines, then chars regardless of the dict's insertion order, and returns a string with no trailing newline (the CLI's `print` supplies it). *Test in Task 2.*
- **Malformed stats dict.** A dict missing a key raises `KeyError` rather than silently rendering a partial or `None`-filled report. *Test in Task 2.*
- **Unreadable path that is not "missing".** A directory, or a file with no read permission, must take the same exit-1-with-stderr path as a missing file — catch `OSError`, not just `FileNotFoundError`. *Test in Task 3.*
- **Non-ASCII content.** Characters are counted as Python characters, not bytes: `"héllo"` is 5 chars. The file must be opened with an explicit `encoding="utf-8"` so behavior does not depend on the machine's locale. *Test in Task 3.*
- **CRLF line endings.** A file written with `\r\n` on disk is read through universal newlines, so `"a\r\nb\r\n"` reports 2 lines and 4 chars. *Test in Task 3.*
- **No path argument at all.** `main([])` lets argparse exit with `SystemExit(2)` and a usage message on stderr. The spec's "return 1" covers read failures, not usage errors. *Test in Task 3.*
- **stdout/stderr separation.** The report goes to stdout only; error messages go to stderr only. A caller piping stdout must never receive an error message. *Test in Task 3.*

---

## File Structure

| File | Responsibility |
|---|---|
| `wordstat/__init__.py` | Empty package marker. **Already exists — do not modify.** |
| `wordstat/counter.py` | Three pure functions: `count_words`, `count_lines`, `count_chars`. No I/O, no imports. |
| `wordstat/formatter.py` | One pure function: `format_report`. No I/O, no imports. |
| `wordstat/cli.py` | `main(argv=None)`. Owns argparse, file reading, stdout/stderr, exit codes, and the `__main__` guard. |
| `test_counter.py` | Unit tests for `counter`. No fixtures needed. |
| `test_formatter.py` | Unit tests for `formatter`. No fixtures needed. |
| `test_cli.py` | Unit tests for `cli` using `tempfile` + output redirection, plus one `subprocess` end-to-end smoke test. |

---

## Task 1: `counter` — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Test: `test_counter.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `count_words(text: str) -> int`
  - `count_lines(text: str) -> int`
  - `count_chars(text: str) -> int`

**Design note for the implementer:** the tricky one is `count_lines`. The rule is "a trailing newline does not add an empty final line," so `"a\nb"` and `"a\nb\n"` are both 2. Two tempting implementations are wrong:
- `text.rstrip("\n")` collapses *all* trailing newlines, so `"a\n\n"` wrongly reports 1 instead of 2.
- `len(text.splitlines())` also splits on `\r`, `\x0b`, `\x0c`, and ` `, so a form feed inside a line wrongly starts a new line.

Strip *exactly one* trailing `"\n"`, then count the remaining `"\n"` and add 1, with `""` special-cased to 0.

- [ ] **Step 1: Write the failing tests**

Create `test_counter.py`:

```python
"""Tests for wordstat.counter."""

import unittest

from wordstat import counter


class CountWordsTests(unittest.TestCase):
    def test_counts_whitespace_separated_tokens(self):
        self.assertEqual(counter.count_words("the quick brown fox"), 4)

    def test_empty_text_has_no_words(self):
        self.assertEqual(counter.count_words(""), 0)

    def test_whitespace_only_text_has_no_words(self):
        self.assertEqual(counter.count_words("   \n\t\n"), 0)

    def test_runs_of_mixed_whitespace_do_not_create_empty_tokens(self):
        self.assertEqual(counter.count_words("a  \t b\n c"), 3)

    def test_leading_and_trailing_whitespace_is_ignored(self):
        self.assertEqual(counter.count_words("  hello world  \n"), 2)


class CountLinesTests(unittest.TestCase):
    def test_counts_newline_separated_lines(self):
        self.assertEqual(counter.count_lines("a\nb"), 2)

    def test_trailing_newline_does_not_add_an_empty_line(self):
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_lone_newline_is_one_empty_line(self):
        self.assertEqual(counter.count_lines("\n"), 1)

    def test_interior_blank_line_is_counted(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)

    def test_only_one_trailing_newline_is_stripped(self):
        self.assertEqual(counter.count_lines("a\n\n"), 2)

    def test_text_without_any_newline_is_one_line(self):
        self.assertEqual(counter.count_lines("hello"), 1)

    def test_non_newline_control_characters_are_not_line_breaks(self):
        self.assertEqual(counter.count_lines("a\x0cb\x0bc"), 1)


class CountCharsTests(unittest.TestCase):
    def test_counts_all_characters_including_whitespace(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_text_has_no_chars(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_counts_characters_not_bytes(self):
        self.assertEqual(counter.count_chars("héllo"), 5)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_counter -v`

Expected: every test errors during collection with `ImportError: cannot import name 'counter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/counter.py`:

```python
"""Pure functions that compute statistics about a block of text."""


def count_words(text):
    """Return the number of whitespace-separated tokens in ``text``."""
    return len(text.split())


def count_lines(text):
    """Return the number of newline-delimited lines in ``text``.

    A single trailing newline terminates the last line rather than starting
    an empty one, so ``"a\\nb"`` and ``"a\\nb\\n"`` are both 2 lines.
    """
    if not text:
        return 0
    if text.endswith("\n"):
        text = text[:-1]
    return text.count("\n") + 1


def count_chars(text):
    """Return the number of characters in ``text``, including whitespace."""
    return len(text)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_counter -v`

Expected: `OK`, 16 tests.

- [ ] **Step 5: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter with word, line, and char stats"
```

---

## Task 2: `formatter` — render stats to a report

**Files:**
- Create: `wordstat/formatter.py`
- Test: `test_formatter.py`

**Interfaces:**
- Consumes: nothing (takes a plain dict; does not import `counter`).
- Produces: `format_report(stats: dict) -> str`, where `stats` has integer keys `"words"`, `"lines"`, `"chars"`. Returns exactly three lines joined by `"\n"`, with **no** trailing newline: `"words: 12\nlines: 3\nchars: 57"`.

**Design note for the implementer:** read the three keys explicitly in the fixed order words → lines → chars. Do not iterate over `stats.items()` — the output order must not depend on how the caller built the dict, and an unexpected extra key must not leak into the report. Returning no trailing newline is deliberate: `cli` prints the report with `print()`, which adds the final newline.

- [ ] **Step 1: Write the failing tests**

Create `test_formatter.py`:

```python
"""Tests for wordstat.formatter."""

import unittest

from wordstat import formatter


class FormatReportTests(unittest.TestCase):
    def test_renders_three_labelled_lines(self):
        report = formatter.format_report({"words": 12, "lines": 3, "chars": 57})
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_has_no_trailing_newline(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))

    def test_renders_zeros(self):
        report = formatter.format_report({"words": 0, "lines": 0, "chars": 0})
        self.assertEqual(report, "words: 0\nlines: 0\nchars: 0")

    def test_key_order_is_fixed_regardless_of_insertion_order(self):
        stats = {}
        stats["chars"] = 57
        stats["lines"] = 3
        stats["words"] = 12
        report = formatter.format_report(stats)
        self.assertEqual(report.splitlines()[0], "words: 12")
        self.assertEqual(report.splitlines()[1], "lines: 3")
        self.assertEqual(report.splitlines()[2], "chars: 57")

    def test_extra_keys_are_ignored(self):
        stats = {"words": 12, "lines": 3, "chars": 57, "pages": 99}
        report = formatter.format_report(stats)
        self.assertEqual(report, "words: 12\nlines: 3\nchars: 57")

    def test_missing_key_raises_key_error(self):
        with self.assertRaises(KeyError):
            formatter.format_report({"words": 12, "lines": 3})


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_formatter -v`

Expected: every test errors during collection with `ImportError: cannot import name 'formatter' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py`:

```python
"""Rendering of a stats mapping into a human-readable report."""


def format_report(stats):
    """Return a three-line report for ``stats``.

    ``stats`` must contain the integer keys ``words``, ``lines``, and
    ``chars``. The returned string has no trailing newline.
    """
    return (
        f"words: {stats['words']}\n"
        f"lines: {stats['lines']}\n"
        f"chars: {stats['chars']}"
    )
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_formatter -v`

Expected: `OK`, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter for the three-line stats report"
```

---

## Task 3: `cli` — argparse entry point

**Files:**
- Create: `wordstat/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes:
  - `wordstat.counter.count_words(text) -> int`
  - `wordstat.counter.count_lines(text) -> int`
  - `wordstat.counter.count_chars(text) -> int`
  - `wordstat.formatter.format_report(stats) -> str`
- Produces: `main(argv=None) -> int`. `argv` is the argument list **without** the program name (so `main(["notes.txt"])`); `None` means fall back to `sys.argv[1:]`. Returns `0` on success after printing the report to stdout, `1` after printing an error to stderr. Raises `SystemExit(2)` from argparse on a usage error (e.g. no path given).

**Design notes for the implementer:**
- Catch `OSError`, not `FileNotFoundError`. A directory (`IsADirectoryError`), an unreadable file (`PermissionError`), and a missing file (`FileNotFoundError`) are all `OSError` subclasses and all deserve the same "message to stderr, return 1" treatment.
- Pass `encoding="utf-8"` to `open` explicitly so char counts do not vary with the machine's locale.
- Return exit codes; do not call `sys.exit()` inside `main`. The `__main__` guard is what turns the return value into a process exit status. This is what makes `main` testable in-process.
- Include the `__main__` guard so `python3 -m wordstat.cli FILE` works — the end-to-end test in Step 1 exercises it.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py`:

```python
"""Tests for wordstat.cli."""

import contextlib
import io
import os
import subprocess
import sys
import tempfile
import unittest

from wordstat import cli

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))


class CliTestCase(unittest.TestCase):
    """Base class providing a temp directory and a main() runner."""

    def setUp(self):
        self._tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmpdir.cleanup)
        self.tmpdir = self._tmpdir.name

    def write_file(self, name, text, newline=None):
        path = os.path.join(self.tmpdir, name)
        with open(path, "w", encoding="utf-8", newline=newline) as handle:
            handle.write(text)
        return path

    def run_main(self, argv):
        """Run cli.main(argv), returning (exit_code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(argv)
        return code, out.getvalue(), err.getvalue()


class SuccessTests(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_file("notes.txt", "the quick brown fox\njumps over\n")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 6\nlines: 2\nchars: 31\n")
        self.assertEqual(err, "")

    def test_empty_file_reports_all_zeros(self):
        path = self.write_file("empty.txt", "")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")

    def test_non_ascii_chars_are_counted_as_characters(self):
        path = self.write_file("accents.txt", "héllo wörld\n")
        code, out, _ = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")

    def test_crlf_endings_are_normalised_by_universal_newlines(self):
        path = self.write_file("crlf.txt", "a\r\nb\r\n", newline="")
        code, out, _ = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 2\nchars: 4\n")


class FailureTests(CliTestCase):
    def test_missing_file_reports_error_and_returns_one(self):
        path = os.path.join(self.tmpdir, "nope.txt")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("nope.txt", err)
        self.assertTrue(err.endswith("\n"))

    def test_directory_path_reports_error_and_returns_one(self):
        code, out, err = self.run_main([self.tmpdir])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(self.tmpdir, err)

    def test_unreadable_file_reports_error_and_returns_one(self):
        if os.getuid() == 0:
            self.skipTest("root can read mode-000 files")
        path = self.write_file("secret.txt", "hidden\n")
        os.chmod(path, 0o000)
        self.addCleanup(os.chmod, path, 0o600)
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("secret.txt", err)

    def test_missing_path_argument_exits_with_usage_error(self):
        with contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit) as caught:
                cli.main([])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage", err.getvalue())


class EndToEndTests(CliTestCase):
    def test_module_can_be_run_as_a_script(self):
        path = self.write_file("notes.txt", "one two\nthree\n")
        result = subprocess.run(
            [sys.executable, "-m", "wordstat.cli", path],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "words: 3\nlines: 2\nchars: 14\n")
        self.assertEqual(result.stderr, "")

    def test_script_exits_nonzero_for_a_missing_file(self):
        result = subprocess.run(
            [sys.executable, "-m", "wordstat.cli", os.path.join(self.tmpdir, "nope.txt")],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stdout, "")
        self.assertIn("nope.txt", result.stderr)


if __name__ == "__main__":
    unittest.main()
```

**Arithmetic check, so the implementer is not guessing at the expected numbers:**
- `"the quick brown fox\njumps over\n"` → 6 words; 2 lines; chars = 19 (`the quick brown fox`) + 1 (`\n`) + 10 (`jumps over`) + 1 (`\n`) = 31.
- `"héllo wörld\n"` → 2 words; 1 line; 11 characters + 1 newline = 12.
- `"a\r\nb\r\n"` on disk → read as `"a\nb\n"` → 2 words, 2 lines, 4 chars.
- `"one two\nthree\n"` → 3 words; 2 lines; 7 + 1 + 5 + 1 = 14 chars.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`

Expected: every test errors during collection with `ImportError: cannot import name 'cli' from 'wordstat'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py`:

```python
"""Command-line entry point for wordstat."""

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
    """Print a stats report for the given file.

    Returns 0 on success, or 1 if the file could not be read.
    """
    args = _build_parser().parse_args(argv)

    try:
        with open(args.path, encoding="utf-8") as handle:
            text = handle.read()
    except OSError as error:
        reason = error.strerror or error.__class__.__name__
        print(f"wordstat: cannot read {args.path}: {reason}", file=sys.stderr)
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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`

Expected: `OK`, 10 tests (or `OK (skipped=1)` if running as root).

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`

Expected: `OK`, 32 tests total across the three test modules. If the count is lower, discovery missed a module — confirm you are in the repo root and the files are named `test_*.py`.

- [ ] **Step 6: Manual smoke check against a real file**

```bash
printf 'hello world\nsecond line\n' > /tmp/wordstat-smoke.txt
python3 -m wordstat.cli /tmp/wordstat-smoke.txt; echo "exit=$?"
python3 -m wordstat.cli /tmp/definitely-missing.txt; echo "exit=$?"
python3 -m wordstat.cli; echo "exit=$?"
rm /tmp/wordstat-smoke.txt
```

Expected, in order:
1. `words: 4` / `lines: 2` / `chars: 24` then `exit=0`.
2. `wordstat: cannot read /tmp/definitely-missing.txt: No such file or directory` on stderr, then `exit=1`.
3. An argparse usage message ending in `error: the following arguments are required: path`, then `exit=2`.

- [ ] **Step 7: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add cli entry point composing counter and formatter"
```

---

## Definition of Done

- [ ] `wordstat/counter.py`, `wordstat/formatter.py`, and `wordstat/cli.py` all exist; `wordstat/__init__.py` is still empty.
- [ ] `python3 -m unittest` from the repo root reports `OK` with 32 tests.
- [ ] No file in `wordstat/` imports anything outside the standard library, and neither `counter` nor `formatter` imports the other or `cli`.
- [ ] `git status` is clean and `git log` shows three feature commits on `main`.
