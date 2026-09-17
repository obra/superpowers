## Review Focus

One line per thing a person hands this program. The spec names one happy path — a positional path to a readable UTF-8 text file — and says nothing about the rest; that silence is not permission for these to traceback, miscount, or exit 0 on failure.

**The command line (`argv`)**

- **No path at all** — someone runs `wordstat` bare to see what it does. `argparse` prints usage and raises `SystemExit(2)`; `main` never returns, so any caller doing `sys.exit(main(argv))` sees an exception path instead of an int. A reasonable person expects a usage message on stderr and a nonzero exit, no traceback.
  - Test: add to `test_cli.py` (Task 3, step 1): `test_no_path_argument_exits_nonzero_with_usage` — `assertRaises(SystemExit)` around `main([])`, assert code is nonzero and stderr (captured) mentions usage.
- **Two or more paths** — habit from `wc a.txt b.txt`. Spec defines a *single* positional, so the second file is silently rejected or silently ignored depending on the `nargs` chosen. A reasonable person expects a clear usage error and no report printed, rather than stats for only the first file with no warning.
  - Test: add to `test_cli.py` (Task 3, step 1): `test_extra_path_arguments_exit_nonzero_and_print_no_report` — `main(["a.txt", "b.txt"])` raises `SystemExit` with nonzero code and stdout stays empty.
- **`-` as the path** — the universal "read stdin" convention from `wc`/`cat`. The spec doesn't mention stdin, so `open("-")` is attempted and fails. A reasonable person expects either stdin to be read or the ordinary "no such file" message and exit 1 — not a bare `FileNotFoundError` traceback.
  - Test: add to `test_cli.py` (Task 3, step 1): `test_dash_path_reports_error_and_returns_1` — `main(["-"])` returns 1 and writes a message naming `-` to stderr.
- **`--help`** — the first thing anyone types. Exits 0 via `SystemExit`, which is correct, but only if `main` is not wrapped in a bare `except Exception` that swallows it into exit 1.
  - Test: add to `test_cli.py` (Task 3, step 1): `test_help_exits_zero` — `assertRaises(SystemExit)` around `main(["--help"])`, assert code is 0.

**The file at that path**

- **A directory** (`wordstat .`, or a path completed by the shell to a folder). `open()` raises `IsADirectoryError`, which is *not* `FileNotFoundError`, so a `try/except FileNotFoundError` written straight from the spec lets it escape as a traceback. A reasonable person expects the same one-line stderr message and exit 1 as a missing file.
  - Test: add to `test_cli.py` (Task 3, step 1): `test_directory_path_reports_error_and_returns_1` — `main([tempfile.mkdtemp()])` returns 1 and writes a message to stderr.
- **A file they can't read** — root-owned or mode `000`. `PermissionError`, again not `FileNotFoundError`. A reasonable person expects a message and exit 1.
  - Test: add to `test_cli.py` (Task 3, step 1): `test_unreadable_file_reports_error_and_returns_1` — `chmod(path, 0o000)` on a temp file, `main([path])` returns 1, stderr non-empty (skip when running as root).
- **A file that isn't UTF-8** — a Latin-1 or UTF-16 export, or any binary the person pointed at by mistake. `open().read()` raises `UnicodeDecodeError` mid-read. A reasonable person expects a message and exit 1, not a traceback and not a half-printed report.
  - Test: add to `test_cli.py` (Task 3, step 1): `test_undecodable_file_reports_error_and_returns_1` — write `b"caf\xe9\n"` to a temp file, `main([path])` returns 1, stdout empty, stderr non-empty.
- **An empty file** — the spec's counts are defined on `""`, but nothing says what the *report* looks like. A reasonable person expects the same 3-line report reading `words: 0 / lines: 0 / chars: 0` and exit 0, not blank output.
  - Test: add to `test_cli.py` (Task 3, step 1): `test_empty_file_prints_zero_report_and_returns_0` — assert stdout equals `"words: 0\nlines: 0\nchars: 0\n"`.
- **A file written on Windows (CRLF)** — extremely common in handed-over text. `"a\r\nb\r\n"` must be 2 lines, and `\r` must not ride along inside the last word of each line or inflate the word count. The spec's `"a\nb"` examples never say.
  - Test: add to `test_counter.py` (Task 1, step 1): `test_crlf_text` — `count_lines("a\r\nb\r\n") == 2` and `count_words("a\r\nb\r\n") == 2`.
- **A file with blank lines and trailing blank lines** — paragraph-separated prose. Spec says a trailing newline adds no line; it is silent on `"a\n\n"`. A reasonable person expects the blank line to count (2), and interior blank lines to count too.
  - Test: add to `test_counter.py` (Task 1, step 1): `test_blank_lines_count` — `count_lines("a\n\n") == 2`, `count_lines("a\n\nb\n") == 3`.
- **A file padded with tabs, runs of spaces, or leading/trailing whitespace** — real prose, not the spec's single-spaced example. Naive `text.split(" ")` yields empty tokens. A reasonable person expects `"  a\t\tb  "` to be 2 words.
  - Test: add to `test_counter.py` (Task 1, step 1): `test_words_ignore_repeated_and_tab_whitespace` — `count_words("  a\t\tb  ") == 2`, `count_words("   ") == 0`.
- **A file with non-ASCII text** — accents, CJK, emoji. "Characters including whitespace" must mean characters, not bytes: `count_chars("café") == 4`, not 5. Nothing in the spec forces the distinction.
  - Test: add to `test_counter.py` (Task 1, step 1): `test_chars_counts_characters_not_bytes` — `count_chars("café") == 4`, `count_chars("日本 語") == 4`.
- **A very large file** — a log or a dumped corpus. Reading whole-file into a string is what the spec implies and is acceptable, but a reasonable person expects it to finish rather than be quadratic; this is a note to keep counting single-pass, not a behavior test.
  - Test: none added; instead Task 1, step 2 must implement each count as one pass over the text with no repeated `split()` of the whole document per statistic.

**Whatever `cli` hands `formatter`**

- **A stats dict with a missing or misspelled key** — the realistic failure once a fourth statistic is added later. `"words: {stats['words']}"` raises `KeyError` deep inside formatting. A reasonable person expects a loud, named failure rather than a report with a blank or `None` where a number belongs.
  - Test: add to `test_formatter.py` (Task 2, step 1): `test_missing_key_raises_keyerror` — `assertRaises(KeyError)` on `format_report({"words": 1, "lines": 2})`.
- **Counts that are large** — a corpus with millions of words. The report must not gain thousands separators or scientific notation on some platforms; formatting must be plain `int`.
  - Test: add to `test_formatter.py` (Task 2, step 1): `test_large_counts_render_as_plain_integers` — `format_report({"words": 1234567, "lines": 1, "chars": 9999999})` contains `"words: 1234567"`.

**The environment**

- **The ambient locale / `LANG`, `LC_ALL`, `PYTHONIOENCODING`** — the person's shell, not something they think of as input. A bare `open(path)` decodes using `locale.getpreferredencoding()`, so the *same* file gives different `chars` counts (or an error) on a `C`-locale machine versus a UTF-8 one. A reasonable person expects the same file to produce the same numbers everywhere.
  - Test: add to `test_cli.py` (Task 3, step 1): `test_file_read_as_utf8_regardless_of_locale` — write UTF-8 `"café\n"`, run `main([path])` with `locale.getpreferredencoding` patched to return `"ascii"`, assert stdout reports `chars: 5` and return is 0. Task 3, step 2 must pass `encoding="utf-8"` explicitly.
- **A closed or broken stdout** — `wordstat big.txt | head -1`, or output redirected to a full disk. `print` raises `BrokenPipeError`/`OSError` after the pipe closes. A reasonable person expects a silent, nonzero-or-zero exit without a `BrokenPipeError` traceback on their terminal.
  - Test: add to `test_cli.py` (Task 3, step 1): `test_broken_stdout_does_not_traceback` — redirect stdout to an object whose `write` raises `BrokenPipeError`, assert `main([path])` returns an int rather than propagating.
- **The current working directory** — every path the person types is relative to it. A relative path must be resolved against the process CWD, not against the package directory, and the error message must echo the path as typed so they can see what was actually looked up.
  - Test: add to `test_cli.py` (Task 3, step 1): `test_relative_path_resolves_against_cwd_and_error_echoes_input` — `chdir` into a temp dir holding `notes.txt`, assert `main(["notes.txt"])` returns 0; then assert `main(["nope.txt"])` returns 1 and stderr contains `"nope.txt"`.
