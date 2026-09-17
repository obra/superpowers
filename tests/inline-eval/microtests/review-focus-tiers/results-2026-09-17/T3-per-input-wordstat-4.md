```markdown
## Review Focus

Every input below is something the person running `wordstat` can hand it today. The spec names only two: a `path` that exists and a `path` that doesn't. Its silence on the rest is not permission for them to crash, so each line names the input, the likely surprise, what a reasonable person expects, and the test that owns it.

- **`argv` with no path at all** — someone types `wordstat` to see what it does. Expect a usage message on stderr and a non-zero exit, not a `SystemExit` traceback leaking out of `main`; decide and pin whether the code is argparse's 2 or the spec's 1.
  - Task 3, step 1 (`test_cli.py`): `main([])` raises no traceback, writes usage to stderr, and returns a non-zero code (assert the exact code chosen).

- **`argv` with more than one path** — `wordstat *.txt` in a directory of several files. Expect a usage message naming the extra argument and a non-zero exit, not silently reporting on only the first file.
  - Task 3, step 1 (`test_cli.py`): `main([path_a, path_b])` returns the same non-zero code as the no-argument case and prints no report to stdout.

- **A `path` value that begins with `-`** — a real filename like `-notes.txt`, or a mistyped `--path file.txt`. argparse reads it as an unknown option. Expect a clear "unrecognized arguments" message and non-zero exit, and `wordstat -- -notes.txt` to work on the real file.
  - Task 3, step 1 (`test_cli.py`): `main(["-notes.txt"])` returns non-zero with stderr text; `main(["--", path])` on a temp file named `-notes.txt` prints the report and returns 0.

- **An empty-string `path`** — `wordstat "$FILE"` where the shell variable is unset. Expect the same treatment as a missing file: message to stderr, return 1, no `FileNotFoundError` traceback.
  - Task 3, step 1 (`test_cli.py`): `main([""])` returns 1 and writes a non-empty message to stderr.

- **A `path` that is a directory** — `wordstat notes/` by tab-completion. Python raises `IsADirectoryError`, which is not `FileNotFoundError`. Expect the missing-file path: message to stderr, return 1.
  - Task 3, step 1 (`test_cli.py`): `main([tmpdir])` returns 1 and writes a message mentioning the path to stderr.

- **A `path` that exists but is unreadable** — a root-owned or `chmod 000` file. `PermissionError` is again not `FileNotFoundError`. Expect an error naming the file and return 1.
  - Task 3, step 1 (`test_cli.py`): with a temp file `chmod`ed to `0o000` (skip the test when running as root), `main([path])` returns 1 and writes to stderr.

- **File contents that are not valid UTF-8** — a PDF, a JPEG, a `latin-1` text file dragged onto the terminal. `open(path).read()` raises `UnicodeDecodeError`. Expect an error saying the file could not be read as text and return 1, not a traceback and not silently mangled counts.
  - Task 3, step 1 (`test_cli.py`): a temp file of `b"\xff\xfe\x00\x81"` makes `main([path])` return 1 and write a message to stderr.

- **An empty file** — `wordstat empty.log` on a freshly rotated log. Expect a full report of zeros and exit 0, not a blank line or a crash on `stats` construction.
  - Task 3, step 1 (`test_cli.py`): a zero-byte temp file makes `main([path])` print exactly `"words: 0\nlines: 0\nchars: 0\n"` and return 0.

- **File contents that are whitespace only** — a file of blank lines, or one holding just `"\n"`. Expect words 0 while lines still counts the blank lines; `count_words` must not report 1 for a single space.
  - Task 1, step 1 (`test_counter.py`): `count_words("   ")` == 0, `count_words("\n\t \n")` == 0, `count_lines("\n\n")` == 2, `count_chars("\n\n")` == 2.

- **File contents with CRLF line endings** — a file written on Windows or pulled from a zip. Expect lines counted per line and `\r` never left glued to a word: `"a\r\nb\r\n"` is 2 lines, 2 words, 6 chars.
  - Task 1, step 1 (`test_counter.py`): `count_lines("a\r\nb\r\n")` == 2, `count_words("a\r\nb\r\n")` == 2, `count_chars("a\r\nb\r\n")` == 6.

- **File contents with non-ASCII text** — accented prose, CJK, an emoji. Expect `count_chars` to count characters, not UTF-8 bytes, and non-breaking or ideographic spaces to be handled by whatever splitting rule is chosen, consistently.
  - Task 1, step 1 (`test_counter.py`): `count_chars("héllo")` == 5, `count_words("日本 語")` == 2, `count_chars("🙂")` == 1.

- **Very large file contents** — `wordstat access.log` on a multi-gigabyte log. The spec's `read()`-everything reading is a memory ceiling the spec never states. A reasonable person expects it to finish rather than exhaust memory; if the plan keeps whole-file reads, say so out loud as a documented limit rather than leaving it implicit.
  - Task 3, step 1 (`test_cli.py`): `main([path])` on a temp file of ~5 MB of repeated lines returns 0 and reports counts matching the generated content (a guard that the reading strategy stays correct on non-trivial sizes).

- **Ambient stdout — the only environment value this program touches; it reads no environment variables** — `wordstat big.txt | head -1` closes the pipe early. Expect a quiet exit, not a `BrokenPipeError` traceback and "Exception ignored" noise at interpreter shutdown.
  - Task 3, step 1 (`test_cli.py`): with `sys.stdout` patched to an object whose `write` raises `BrokenPipeError`, `main([path])` returns a non-zero code and lets no exception escape.
```
