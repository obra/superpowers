# wordstat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wordstat`, a stdlib-only Python package whose CLI reads a text file and prints a three-line report of its word, line, and character counts.

**Architecture:** Three modules with one responsibility each, composed by the CLI. `counter.py` holds pure `str -> int` functions with no I/O. `formatter.py` turns a stats dict into the report string, also pure. `cli.py` is the only module that touches the filesystem, `sys.stdout`/`sys.stderr`, and argument parsing; it calls into the other two. Tests live at the repo root, one file per module, so each module is verified in isolation and the CLI test only has to check composition and error handling.

**Tech Stack:** Python 3 standard library only — `argparse`, `sys`, `unittest`, `tempfile`, `io`, `contextlib`, `pathlib`. No third-party packages, no build system, no test runner beyond `python3 -m unittest`.

**Spec:** `design.md` (in this same directory)

## Global Constraints

- **Standard library only.** No third-party imports in package code or tests. No `requirements.txt`, no `pyproject.toml`, no `pip install` step.
- **Tests live at the repo root** as `test_counter.py`, `test_formatter.py`, `test_cli.py` — not in a `tests/` directory. They are run from the repo root with `python3 -m unittest`.
- **Package layout is fixed** by the spec: `wordstat/__init__.py` (already exists, empty — leave it empty), `wordstat/counter.py`, `wordstat/formatter.py`, `wordstat/cli.py`.
- **`unittest`, not pytest** — every test is a method on a `unittest.TestCase` subclass.
- **Each module independently testable**; `cli` composes `counter` + `formatter`. `counter` and `formatter` must not import each other, must not import `cli`, and must not perform I/O.
- **Report format is exact:** `"words: 12\nlines: 3\nchars: 57"` — lowercase labels, colon, single space, no trailing newline in the returned string.
- **Working directly on `main`** in this local scratch repo. No branches, no remote, no push. Commit after each task.
- Code may use f-strings (Python 3.6+). The interpreter here is Python 3.14.

## Review Focus

These are input classes the spec implies but does not spell out. Each one has a test assigned to the task that owns the code; the assignment is noted in parentheses so the final reviewer can confirm it landed.

- **Empty string** — `count_words("")`, `count_lines("")`, `count_chars("")` should all be `0`, not `1` line. (Task 1, Step 5)
- **Whitespace-only text** — `"   \n\t  "` has 0 words but nonzero chars; `str.split()` with no argument already discards leading/trailing runs. (Task 1, Step 5)
- **Runs of mixed whitespace between words** — tabs, multiple spaces, and newlines all separate tokens; `"a\t\tb  c\nd"` is 4 words, not 4-plus-empties. (Task 1, Step 1)
- **Windows line endings** — `count_lines("a\r\nb")` is 2, and the CLI reading a CRLF file gets 2 as well because `open()` in text mode does universal-newline translation. (Task 1 Step 5; Task 3 Step 9)
- **Non-ASCII text** — `count_chars` counts characters (code points), so `"héllo"` is 5, not the 6 bytes UTF-8 uses. Files are read as UTF-8. (Task 1, Step 5)
- **Zero values in the report** — an empty file must still print all three lines (`words: 0` / `lines: 0` / `chars: 0`), not a blank or short report. (Task 2 Step 5; Task 3 Step 9)
- **Report has no trailing newline** — `format_report` returns exactly 3 lines' worth of text; the single trailing newline on stdout comes from `print`. (Task 2 Step 5; Task 3 Step 5)
- **Path that exists but cannot be read as a file** — a directory, or a file the process lacks permission for. The spec names only "missing file", but a reasonable person expects the same behavior for every unopenable path: a message on stderr and exit code 1, never a traceback. Catch `OSError` (the parent of `FileNotFoundError`, `IsADirectoryError`, and `PermissionError`) rather than `FileNotFoundError` alone. (Task 3, Step 9)
- **File that is not valid UTF-8** — decoding raises `UnicodeDecodeError`, which is *not* an `OSError`, so it needs its own handler. Same contract: stderr message, exit code 1, no traceback. (Task 3, Step 9)
- **Wrong number of CLI arguments** — zero args or two positional args. `argparse` handles this by printing usage to stderr and raising `SystemExit(2)`; the test pins that this is what happens instead of a crash or a silent success. (Task 3, Step 9)
- **Error messages go to stderr, never stdout** — a caller piping stdout into another tool must not receive the error text. (Task 3, Step 9)

---

### Task 1: `counter` — pure stat functions

**Files:**
- Create: `wordstat/counter.py`
- Create: `test_counter.py`

**Interfaces:**
- Consumes: nothing. This is the first task; `wordstat/__init__.py` already exists and stays empty.
- Produces:
  - `wordstat.counter.count_words(text: str) -> int`
  - `wordstat.counter.count_lines(text: str) -> int`
  - `wordstat.counter.count_chars(text: str) -> int`

  Task 3 imports this module as `from wordstat import counter` and calls all three.

- [ ] **Step 1: Write the failing test for `count_words`**

Create `test_counter.py` with exactly this content:

```python
"""Tests for wordstat.counter."""

import unittest

from wordstat import counter


class CountWordsTest(unittest.TestCase):
    def test_counts_space_separated_tokens(self):
        self.assertEqual(counter.count_words("one two three"), 3)

    def test_single_word(self):
        self.assertEqual(counter.count_words("hello"), 1)

    def test_mixed_whitespace_runs_separate_tokens(self):
        # Tabs, doubled spaces, and newlines are all separators, and a run of
        # them does not produce empty tokens.
        self.assertEqual(counter.count_words("a\t\tb  c\nd"), 4)

    def test_leading_and_trailing_whitespace_ignored(self):
        self.assertEqual(counter.count_words("  hi there \n"), 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run from the repo root:

```bash
python3 -m unittest test_counter -v
```

Expected: an error, not a failure — `ModuleNotFoundError: No module named 'wordstat.counter'` (raised at import time, so all four tests error out).

- [ ] **Step 3: Write the minimal implementation of `count_words`**

Create `wordstat/counter.py`:

```python
"""Pure functions that compute statistics about a block of text.

No I/O happens here: every function takes a string and returns an int.
"""


def count_words(text):
    """Return the number of whitespace-separated tokens in `text`."""
    # str.split() with no argument splits on runs of any whitespace and
    # discards leading/trailing whitespace, so no empty tokens appear.
    return len(text.split())
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
python3 -m unittest test_counter -v
```

Expected: `OK` — 4 tests pass.

- [ ] **Step 5: Write the failing tests for `count_lines` and `count_chars`**

Append these two classes to `test_counter.py`, above the `if __name__ == "__main__":` block:

```python
class CountLinesTest(unittest.TestCase):
    def test_trailing_newline_does_not_add_a_line(self):
        # Both spellings of a two-line file count as 2.
        self.assertEqual(counter.count_lines("a\nb"), 2)
        self.assertEqual(counter.count_lines("a\nb\n"), 2)

    def test_single_line_without_newline(self):
        self.assertEqual(counter.count_lines("just one line"), 1)

    def test_empty_text_has_no_lines(self):
        self.assertEqual(counter.count_lines(""), 0)

    def test_lone_newline_is_one_line(self):
        # One empty line, terminated.
        self.assertEqual(counter.count_lines("\n"), 1)

    def test_blank_interior_lines_are_counted(self):
        self.assertEqual(counter.count_lines("a\n\nb\n"), 3)

    def test_windows_line_endings(self):
        self.assertEqual(counter.count_lines("a\r\nb"), 2)


class CountCharsTest(unittest.TestCase):
    def test_counts_every_character_including_whitespace(self):
        self.assertEqual(counter.count_chars("a b\n"), 4)

    def test_empty_text(self):
        self.assertEqual(counter.count_chars(""), 0)

    def test_whitespace_only_text(self):
        text = "   \n\t  "
        self.assertEqual(counter.count_chars(text), 7)
        # Same text has no words at all.
        self.assertEqual(counter.count_words(text), 0)

    def test_counts_characters_not_utf8_bytes(self):
        # "héllo" is 5 characters but 6 bytes when encoded as UTF-8.
        self.assertEqual(counter.count_chars("héllo"), 5)
```

- [ ] **Step 6: Run the tests to verify the new ones fail**

```bash
python3 -m unittest test_counter -v
```

Expected: the 4 `CountWordsTest` tests still pass; the 10 new tests error with `AttributeError: module 'wordstat.counter' has no attribute 'count_lines'` / `'count_chars'`.

- [ ] **Step 7: Implement `count_lines` and `count_chars`**

Append to `wordstat/counter.py`:

```python
def count_lines(text):
    """Return the number of lines in `text`.

    A trailing newline terminates the last line rather than starting an
    empty one, so "a\\nb" and "a\\nb\\n" both count as 2. Empty text has
    no lines at all.
    """
    # str.splitlines() gives exactly this behavior: it drops the final
    # empty element that "a\nb\n".split("\n") would produce, returns []
    # for "", and treats "\r\n" as a single break.
    return len(text.splitlines())


def count_chars(text):
    """Return the number of characters in `text`, whitespace included."""
    return len(text)
```

- [ ] **Step 8: Run the tests to verify they pass**

```bash
python3 -m unittest test_counter -v
```

Expected: `OK` — 14 tests pass.

- [ ] **Step 9: Commit**

```bash
git add wordstat/counter.py test_counter.py
git commit -m "feat: add counter module with word, line, and char counts"
```

---

### Task 2: `formatter` — render the stats dict

**Files:**
- Create: `wordstat/formatter.py`
- Create: `test_formatter.py`

**Interfaces:**
- Consumes: nothing from Task 1 — `formatter` must not import `counter`. It only knows the shape of the dict it is handed.
- Produces:
  - `wordstat.formatter.format_report(stats: dict) -> str`, where `stats` has integer values under the keys `"words"`, `"lines"`, and `"chars"`. Returns a 3-line string with no trailing newline, e.g. `"words: 12\nlines: 3\nchars: 57"`.

  Task 3 imports this module as `from wordstat import formatter` and builds a dict with exactly those three keys.

- [ ] **Step 1: Write the failing test**

Create `test_formatter.py` with exactly this content:

```python
"""Tests for wordstat.formatter."""

import unittest

from wordstat import formatter


class FormatReportTest(unittest.TestCase):
    def test_renders_three_labeled_lines(self):
        stats = {"words": 12, "lines": 3, "chars": 57}
        self.assertEqual(
            formatter.format_report(stats),
            "words: 12\nlines: 3\nchars: 57",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
python3 -m unittest test_formatter -v
```

Expected: `ModuleNotFoundError: No module named 'wordstat.formatter'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/formatter.py`:

```python
"""Render a stats mapping as the human-readable report text."""


def format_report(stats):
    """Return a 3-line report for `stats`.

    `stats` maps "words", "lines", and "chars" to integers. The returned
    string has no trailing newline; whoever prints it supplies that.
    """
    return "words: {}\nlines: {}\nchars: {}".format(
        stats["words"], stats["lines"], stats["chars"]
    )
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
python3 -m unittest test_formatter -v
```

Expected: `OK` — 1 test passes.

- [ ] **Step 5: Write the remaining tests**

Append these methods to `FormatReportTest` in `test_formatter.py`:

```python
    def test_zero_values_still_render_all_three_lines(self):
        stats = {"words": 0, "lines": 0, "chars": 0}
        self.assertEqual(
            formatter.format_report(stats),
            "words: 0\nlines: 0\nchars: 0",
        )

    def test_no_trailing_newline(self):
        report = formatter.format_report({"words": 1, "lines": 1, "chars": 1})
        self.assertFalse(report.endswith("\n"))
        self.assertEqual(len(report.splitlines()), 3)

    def test_label_order_is_fixed_regardless_of_dict_order(self):
        # Insertion order of the mapping must not leak into the report.
        stats = {"chars": 57, "lines": 3, "words": 12}
        self.assertEqual(
            formatter.format_report(stats),
            "words: 12\nlines: 3\nchars: 57",
        )

    def test_large_numbers_are_not_grouped_or_truncated(self):
        stats = {"words": 1234567, "lines": 89012, "chars": 7654321}
        self.assertEqual(
            formatter.format_report(stats),
            "words: 1234567\nlines: 89012\nchars: 7654321",
        )
```

- [ ] **Step 6: Run the tests to verify they pass**

These pass against the Step 3 implementation — that is expected and fine; they pin behavior the one-line implementation already has, so a future rewrite cannot quietly break it.

```bash
python3 -m unittest test_formatter -v
```

Expected: `OK` — 5 tests pass. If any fails, fix `format_report` (not the test) until all 5 pass.

- [ ] **Step 7: Commit**

```bash
git add wordstat/formatter.py test_formatter.py
git commit -m "feat: add formatter module rendering the stats report"
```

---

### Task 3: `cli` — argparse entry point

**Files:**
- Create: `wordstat/cli.py`
- Create: `test_cli.py`

**Interfaces:**
- Consumes:
  - `wordstat.counter.count_words(text) -> int`, `count_lines(text) -> int`, `count_chars(text) -> int` (Task 1)
  - `wordstat.formatter.format_report(stats) -> str`, `stats` keyed `"words"`, `"lines"`, `"chars"` (Task 2)
- Produces:
  - `wordstat.cli.main(argv=None) -> int`. `argv` is a list of command-line arguments *excluding* the program name, exactly what `argparse.ArgumentParser.parse_args` expects; `None` means fall back to `sys.argv[1:]`. Returns `0` on success, `1` when the file cannot be read or decoded. Raises `SystemExit(2)` from `argparse` on bad arguments.

- [ ] **Step 1: Write the failing happy-path test**

Create `test_cli.py` with exactly this content:

```python
"""Tests for wordstat.cli."""

import contextlib
import io
import os
import tempfile
import unittest

from wordstat import cli


class CliTestCase(unittest.TestCase):
    """Base class with helpers for writing temp files and running main()."""

    def setUp(self):
        self._tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmpdir.cleanup)

    def write_file(self, content, name="sample.txt", encoding="utf-8"):
        """Write `content` into the temp dir and return its path."""
        path = os.path.join(self._tmpdir.name, name)
        mode = "wb" if isinstance(content, bytes) else "w"
        kwargs = {} if isinstance(content, bytes) else {"encoding": encoding}
        # newline="" keeps whatever line endings the test asked for.
        if mode == "w":
            kwargs["newline"] = ""
        with open(path, mode, **kwargs) as handle:
            handle.write(content)
        return path

    def run_main(self, argv):
        """Run cli.main(argv), returning (exit_code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = cli.main(argv)
        return code, out.getvalue(), err.getvalue()


class MainSuccessTest(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        path = self.write_file("one two three\nfour five\n")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 5\nlines: 2\nchars: 24\n")
        self.assertEqual(err, "")


if __name__ == "__main__":
    unittest.main()
```

The expected numbers: `"one two three\nfour five\n"` has 5 tokens, 2 lines, and 24 characters (13 + 1 + 9 + 1). `main` prints the report, so stdout ends with exactly one newline that `print` added.

- [ ] **Step 2: Run the test to verify it fails**

```bash
python3 -m unittest test_cli -v
```

Expected: `ModuleNotFoundError: No module named 'wordstat.cli'`.

- [ ] **Step 3: Write the minimal implementation**

Create `wordstat/cli.py`:

```python
"""Command-line entry point: read a file, print its text statistics."""

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


def main(argv=None):
    """Run the CLI. Returns 0 on success, 1 if the file cannot be read."""
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


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
python3 -m unittest test_cli -v
```

Expected: `OK` — 1 test passes.

- [ ] **Step 5: Run the CLI by hand once**

Confirm the real end-to-end path works, not just the in-process test:

```bash
printf 'one two three\nfour five\n' > /tmp/wordstat-sample.txt
python3 -m wordstat.cli /tmp/wordstat-sample.txt
```

Expected, exactly:

```
words: 5
lines: 2
chars: 24
```

Then check the exit code and that there is no extra blank line:

```bash
python3 -m wordstat.cli /tmp/wordstat-sample.txt > /tmp/wordstat-out.txt
echo "exit=$?"
od -c /tmp/wordstat-out.txt | tail -3
```

Expected: the last bytes in the dump are `2`, `4`, `\n` — one newline after `chars: 24`, no blank line after it; `exit=0`.

- [ ] **Step 6: Commit the happy path**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: add cli entry point printing the stats report"
```

- [ ] **Step 7: Write the failing test for a missing file**

Append this class to `test_cli.py`, above the `if __name__ == "__main__":` block:

```python
class MainMissingFileTest(CliTestCase):
    def test_missing_file_reports_to_stderr_and_returns_one(self):
        path = os.path.join(self._tmpdir.name, "does-not-exist.txt")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(path, err)
        self.assertTrue(err.startswith("wordstat: "), err)
        self.assertTrue(err.endswith("\n"), err)
```

- [ ] **Step 8: Run it to verify it fails**

```bash
python3 -m unittest test_cli -v
```

Expected: FAIL — `FileNotFoundError: [Errno 2] No such file or directory` escapes `main` as a traceback instead of being turned into a message and exit code 1.

- [ ] **Step 9: Write the remaining error-path tests**

Append these two classes to `test_cli.py`, above the `if __name__ == "__main__":` block. They cover the rest of the Review Focus list for this module, so write them all before touching `cli.py` again.

```python
class MainUnreadablePathTest(CliTestCase):
    def test_directory_path_reports_to_stderr_and_returns_one(self):
        # A path that exists but is not an openable file.
        code, out, err = self.run_main([self._tmpdir.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(self._tmpdir.name, err)
        self.assertTrue(err.startswith("wordstat: "), err)

    def test_non_utf8_file_reports_to_stderr_and_returns_one(self):
        # 0xFF is never a valid byte in UTF-8.
        path = self.write_file(b"\xff\xfebad bytes")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(path, err)
        self.assertTrue(err.startswith("wordstat: "), err)


class MainArgumentAndEdgeCaseTest(CliTestCase):
    def test_empty_file_reports_all_zeros(self):
        path = self.write_file("")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 0\nlines: 0\nchars: 0\n")
        self.assertEqual(err, "")

    def test_crlf_file_counts_two_lines(self):
        # Text mode translates \r\n to \n while reading, so the \r is not
        # counted as a character either: "a\nb" is 3 chars.
        path = self.write_file("a\r\nb")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 2\nchars: 3\n")
        self.assertEqual(err, "")

    def test_utf8_file_counts_characters_not_bytes(self):
        path = self.write_file("héllo wörld\n")
        code, out, err = self.run_main([path])
        self.assertEqual(code, 0)
        self.assertEqual(out, "words: 2\nlines: 1\nchars: 12\n")
        self.assertEqual(err, "")

    def test_no_arguments_exits_two(self):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as caught:
                cli.main([])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage:", err.getvalue())

    def test_extra_positional_argument_exits_two(self):
        path = self.write_file("hello\n")
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as caught:
                cli.main([path, path])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("usage:", err.getvalue())
```

`"héllo wörld\n"` is 12 characters (11 letters/space + newline) but 14 UTF-8 bytes, which is what makes this test meaningful.

- [ ] **Step 10: Run the tests to see the error-path failures**

```bash
python3 -m unittest test_cli -v
```

Expected: the three success/edge-case tests in `MainArgumentAndEdgeCaseTest` pass, the two `SystemExit` tests pass (argparse already does that), and the three error-path tests (`MainMissingFileTest`, plus the directory and non-UTF-8 tests) fail with escaping `FileNotFoundError`, `IsADirectoryError`, and `UnicodeDecodeError`.

- [ ] **Step 11: Add error handling to `main`**

In `wordstat/cli.py`, replace the bare read:

```python
    with open(args.path, encoding="utf-8") as handle:
        text = handle.read()
```

with a helper call, so `main` stays a straight-line composition:

```python
    try:
        text = _read_text(args.path)
    except UnicodeDecodeError:
        print(
            "wordstat: cannot read {}: not valid UTF-8 text".format(args.path),
            file=sys.stderr,
        )
        return 1
    except OSError as exc:
        # Covers FileNotFoundError, IsADirectoryError, PermissionError, and
        # any other open/read failure. UnicodeDecodeError is a ValueError,
        # not an OSError, which is why it needs the clause above.
        reason = exc.strerror or str(exc)
        print(
            "wordstat: cannot read {}: {}".format(args.path, reason),
            file=sys.stderr,
        )
        return 1
```

and add the helper above `main`:

```python
def _read_text(path):
    """Return the full contents of `path`, decoded as UTF-8 text."""
    with open(path, encoding="utf-8") as handle:
        return handle.read()
```

- [ ] **Step 12: Run the full test suite**

```bash
python3 -m unittest discover -v
```

Expected: `OK` — 14 counter tests + 5 formatter tests + 9 cli tests = 28 tests, 0 failures, 0 errors.

- [ ] **Step 13: Check the error path by hand**

```bash
python3 -m wordstat.cli /tmp/definitely-not-here.txt; echo "exit=$?"
python3 -m wordstat.cli /tmp/definitely-not-here.txt 2>/dev/null; echo "exit=$? (stdout was empty)"
```

Expected: the first prints something like `wordstat: cannot read /tmp/definitely-not-here.txt: No such file or directory` followed by `exit=1`. The second prints only `exit=1 (stdout was empty)` — proving the message went to stderr, not stdout.

- [ ] **Step 14: Commit**

```bash
git add wordstat/cli.py test_cli.py
git commit -m "feat: handle unreadable and non-UTF-8 files in the cli"
```

---

## Final verification

- [ ] **Run everything from a clean checkout state**

```bash
git status --short
python3 -m unittest discover -v
```

Expected: `git status --short` prints nothing (all work committed, no stray files such as `__pycache__` if it is untracked — if `__pycache__` shows up, add a `.gitignore` containing `__pycache__/` and commit it). `unittest discover` reports 28 tests and `OK`.

- [ ] **Confirm the spec's file layout matches reality**

```bash
find . -name '*.py' -not -path './.git/*' -not -path '*__pycache__*' | sort
```

Expected exactly:

```
./test_cli.py
./test_counter.py
./test_formatter.py
./wordstat/__init__.py
./wordstat/cli.py
./wordstat/counter.py
./wordstat/formatter.py
```

- [ ] **Confirm the stdlib-only constraint**

```bash
grep -rhE '^\s*(import|from) ' --include='*.py' . | sort -u
```

Expected: only `argparse`, `sys`, `contextlib`, `io`, `os`, `tempfile`, `unittest`, and `wordstat` imports appear. Anything else violates the standard-library-only constraint.
