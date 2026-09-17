```markdown
## Review Focus

The spec names one argument (`path`) and one file (whatever `path` points at), and foresees exactly one thing going wrong: the file is missing. Everything below is something a person will plausibly hand this program that the spec did not mention. None of it may raise an uncaught exception or print a traceback: the contract for every bad input is a one-line message on stderr and exit 1, and the contract for every readable file is a 3-line report and exit 0.

Inputs from the command line (all owned by **Task 3**, `wordstat/cli.py`):

- **No `path` at all** — `wordstat` typed bare. Expect the argparse usage message on stderr and a nonzero exit, not a traceback or a report of zeros. → Task 3 test: `- \`main([])\` raises \`SystemExit\` with code 2 and writes "usage:" to stderr.`
- **Two or more paths** — `wordstat a.txt b.txt`, expecting stats for both. Expect a usage error rather than silently ignoring `b.txt`. → Task 3 test: `- \`main(["a.txt", "b.txt"])\` raises \`SystemExit\` with code 2; stdout is empty.`
- **An unknown flag** — `wordstat --words notes.txt`. Expect a usage error naming the bad option. → Task 3 test: `- \`main(["--words", path])\` raises \`SystemExit\` with code 2 and mentions \`--words\` on stderr.`
- **`path` is a directory** — `wordstat .` or a tab-completed folder name. `open()` raises `IsADirectoryError`, which is not `FileNotFoundError`, so the spec's one error branch misses it. Expect the same friendly message and exit 1. → Task 3 test: `- \`main([str(tmpdir)])\` returns 1, writes a message naming the path to stderr, prints nothing to stdout.`
- **`path` exists but is not readable** — a root-owned or `chmod 000` file. `PermissionError`, again not `FileNotFoundError`. Expect message and exit 1. → Task 3 test: `- for a temp file \`chmod\`ed to \`0o000\`, \`main([path])\` returns 1 and writes to stderr (skip the test when running as root).`
- **`path` is `-`** — the near-universal shell idiom for "read stdin". The spec is silent, so pick one behavior and pin it: treat `-` as a literal filename, which lands in the not-found branch. Expect a clear message, exit 1, and no hang waiting on a terminal. → Task 3 test: `- \`main(["-"])\` returns 1 and writes a message to stderr without reading stdin.`
- **`path` is the empty string** — `wordstat ""` from an unset shell variable. Expect message and exit 1, not an `IsADirectoryError` or a confusing empty-quoted message. → Task 3 test: `- \`main([""])\` returns 1 and writes a non-empty message to stderr.`
- **`path` contains an unexpanded `~`** — `wordstat "~/notes.txt"`, quoted so the shell left it alone. Expect the not-found message to echo the path the person typed so they can see why it failed; expansion is not required. → Task 3 test: `- \`main(["~/nope.txt"])\` returns 1 and the stderr message contains \`~/nope.txt\`.`

Inputs from the file's bytes (counting rules owned by **Task 1**, `wordstat/counter.py`; decoding and reading owned by **Task 3**):

- **A file that is not valid UTF-8** — a latin-1 export, or any binary a person points at by mistake. `read()` raises `UnicodeDecodeError` mid-report. Expect a message and exit 1, not a traceback. → Task 3 test: `- for a temp file containing \`b"caf\xe9"\`, \`main([path])\` returns 1 and writes a message to stderr.`
- **A file with CRLF line endings** — anything authored on Windows. The `\r` must not become a word or an extra line; `chars` still counts it, since the spec counts all whitespace. → Task 1 test: `- \`count_lines("a\r\nb\r\n")\` == 2; \`count_words("a\r\nb\r\n")\` == 2; \`count_chars("a\r\n")\` == 3.`
- **A file whose last line has no trailing newline** — the common case for hand-edited files; the spec only shows the trailing-newline pair. → Task 1 test: `- \`count_lines("a")\` == 1; \`count_lines("a\nb\nc")\` == 3.`
- **A file with blank lines and tabs** — a paragraph-separated document. Blank lines still count as lines; tabs separate words and are not words themselves. → Task 1 test: `- \`count_lines("a\n\nb\n")\` == 3; \`count_words("a\t\tb\n \n")\` == 2.`
- **A completely empty file** — `touch notes.txt`, or `/dev/null`. Expect a real report of zeros and exit 0, not an error and not blank output. → Task 3 test: `- for an empty temp file, \`main([path])\` prints \`"words: 0\nlines: 0\nchars: 0"\` and returns 0.`
- **Zero counts reaching the formatter** — the empty file above must render as digits, not as blanks, `None`, or a dropped line; the report is always exactly 3 lines. → Task 2 test: `- \`format_report({"words": 0, "lines": 0, "chars": 0})\` == \`"words: 0\nlines: 0\nchars: 0"\` and has exactly 3 lines.`
- **A file of non-ASCII text** — accents, CJK, emoji. `chars` must count characters, not bytes, or the number will silently disagree with what the person sees on screen. → Task 1 test: `- \`count_chars("héllo")\` == 5; \`count_chars("日本")\` == 2; \`count_words("héllo wörld")\` == 2.`

Inputs from the environment (owned by **Task 3**):

- **A non-UTF-8 stdout encoding** — `LC_ALL=C` or `PYTHONIOENCODING=ascii` in a cron job or Docker image, with a non-ASCII filename in the error message or non-ASCII text in the file. Printing raises `UnicodeEncodeError` after the work succeeded. Expect the report to still be emitted, or at worst a clean exit 1 — never a traceback over a correct answer. → Task 3 test: `- with \`sys.stdout\` replaced by a \`TextIOWrapper\` over \`io.BytesIO\` using \`encoding="ascii", errors="replace"\`, \`main([path])\` for a file of non-ASCII text returns 0 and writes 3 lines.`
- **stdout closed early** — `wordstat big.txt | head -1`, which raises `BrokenPipeError` on flush. Expect a silent, nonzero-but-not-crashing exit rather than the `Exception ignored in: <_io.TextIOWrapper>` noise Python prints at shutdown. → Task 3 test: `- with \`sys.stdout\` replaced by an object whose \`write\` raises \`BrokenPipeError\`, \`main([path])\` returns nonzero and raises nothing.`
- **The current working directory** — every relative `path` is resolved against it, and the spec never says so. Expect a relative path to resolve against the process CWD, and the error message for a missing relative path to be unambiguous about what was tried. → Task 3 test: `- with \`os.chdir(tmpdir)\`, \`main(["notes.txt"])\` reads \`tmpdir/notes.txt\` and returns 0.`
```
