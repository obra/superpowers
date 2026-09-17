## Review Focus

Each line below is one thing the person running `wordstat` hands it, the value they are most likely to hand it that `design.md` does not mention, what a reasonable person expects to happen, and the test that pins it — named against the task that owns the code.

**The `path` argument (as it arrives in `argv`)**

- **No argument at all** — someone types `wordstat` to see what it does. The spec says "parse a single positional `path`" and stops there. Expect argparse's usage line on stderr and a nonzero exit, never a traceback or an `IndexError`. → *Task 3, `test_cli.py`*: `main([])` raises `SystemExit` with code 2 and writes a usage message to stderr.
- **Two or more paths** — `wordstat a.txt b.txt`, expecting stats for both. Expect a usage error, not a silent report on only the first file. → *Task 3, `test_cli.py`*: `main([p1, p2])` raises `SystemExit` with code 2.
- **A path that begins with `-`** (`-notes.txt`, or a bare `-` meaning stdin) — argparse reads it as an option and reports "unrecognized arguments". Expect that error to be a usage message, and that `--` before the path makes the real file work. → *Task 3, `test_cli.py`*: `main(["-x"])` raises `SystemExit(2)`; `main(["--", path])` prints the report and returns 0.
- **A directory instead of a file** — `wordstat notes/` by tab-completion. The spec foresees only "missing file", so `IsADirectoryError` escapes as a traceback. Expect the same one-line stderr message and return 1 as a missing file. → *Task 3, `test_cli.py`*: `main([tmpdir])` returns 1 and writes a non-empty message to stderr.
- **A file that exists but cannot be read** (mode `0o000`, or inside an unreadable directory) — `PermissionError`, again outside the spec's "missing file" case. Expect stderr message and return 1. → *Task 3, `test_cli.py`*: with a temp file `chmod`ed to `0o000`, `main([path])` returns 1 and stderr is non-empty (skip the test when `os.geteuid() == 0`).

**The contents of that file**

- **An empty file** — `wordstat empty.txt` on a freshly touched file. Expect `words: 0 / lines: 0 / chars: 0` and exit 0, not a crash and not empty output. → *Task 3, `test_cli.py`*: `main([empty])` prints `"words: 0\nlines: 0\nchars: 0"` and returns 0.
- **Bytes that are not UTF-8** — a Latin-1 or cp1252 export, or a UTF-16 file from Notepad; the read raises `UnicodeDecodeError` after the file has already opened successfully. Expect the same treatment as any other unreadable file: one message on stderr, return 1 (or, if you instead choose `errors="replace"`, exit 0 and count the replacement characters — pick one and pin it). → *Task 3, `test_cli.py`*: a file written as `b"caf\xe9\n"` makes `main([p])` return 1 with a message on stderr, no traceback.
- **Windows CRLF line endings** — a file authored on Windows. Expect `"a\r\nb\r\n"` to be 2 lines and the `\r` not to become part of a word or an extra token. → *Task 1, `test_counter.py`*: `count_lines("a\r\nb\r\n")` == 2 and `count_words("a\r\nb")` == 2.
- **Runs of tabs and multiple/leading/trailing spaces** — an indented or column-aligned file. Expect whitespace runs to collapse, not to produce empty tokens. → *Task 1, `test_counter.py`*: `count_words("  a\t\tb  \n")` == 2.
- **Blank lines, and a file that is just a newline** — prose with paragraph breaks. Expect interior blank lines to count, and `"\n"` to be one line (the spec only fixes the trailing-newline case). → *Task 1, `test_counter.py`*: `count_lines("a\n\nb\n")` == 3 and `count_lines("\n")` == 1.
- **Non-ASCII text** — accents, CJK, emoji. Expect `chars` to count characters, not bytes, so the number matches what the person sees in their editor. → *Task 1, `test_counter.py`*: `count_chars("héllo")` == 5 and `count_chars("日本語")` == 3.
- **A large file** — a log or a book, tens of megabytes. Expect it to finish and report correct numbers rather than being slowed by holding several copies of the text at once. → *Task 3, `test_cli.py`*: a generated ~10 MB temp file of known content makes `main([p])` return 0 with the expected counts.

**Everything else the person's shell supplies**

- **A stdout pipe that closes early** — `wordstat big.txt | head -1`. Expect a quiet exit, not a `BrokenPipeError` traceback on stderr. → *Task 3, `test_cli.py`*: run the module under `subprocess` piped into `head -1` and assert stderr contains no `Traceback`.
- **Locale/encoding environment (`LC_ALL=C`, `PYTHONIOENCODING`, `PYTHONUTF8`)** — the spec never mentions an encoding, so `open(path)` inherits whatever the shell says and the same file yields different counts (or a decode error) on different machines. Expect the counts to be independent of the environment, which means naming `encoding="utf-8"` explicitly at the read. → *Task 3, `test_cli.py`*: `subprocess` run of the CLI over a UTF-8 file with `env={"LC_ALL": "C"}` produces byte-identical output to the default-environment run.
