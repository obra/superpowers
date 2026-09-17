## Review Focus

Each line is one thing a person actually hands this program, the surprise the spec never mentions, and what they will reasonably expect to happen. Each carries the test that pins it, named against the task that owns the code.

- **`TRANSACTIONS` — the path itself.** They will point it at a directory (`ledgerlite report .`) or at a file they can't read; the spec only says "cannot be read," and `FileNotFoundError` is the only failure the plan's test covers. Expect the same `ledgerlite: cannot read <path>: <reason>` line and exit 1 for `IsADirectoryError` and `PermissionError`, never a traceback.
  - [ ] **Task 6, Step 1a: add `test_unreadable_path_returns_1`** — parametrize over a temp directory and a `chmod(0o000)` file; assert `rc == 1`, `out == ""`, and `err.startswith("ledgerlite: cannot read ")` for both.

- **`TRANSACTIONS` — a row with too many fractional digits.** A bank export carrying `1.005` or an interest line of `0.333` is malformed per the spec, but Task 2's `ParseError` list stops at "not a decimal number," so `1.005` would parse and silently skew every total. Expect rejection of the whole file with the line number.
  - [ ] **Task 2, Step 1a: add `test_amount_with_three_decimals_is_malformed`** — `parse_csv("date,amount,description\n2026-03-04,1.005,x\n")` raises `ParseError` with `line == 2`; `1.5`, `1.50`, `1`, and `-0.05` all parse.

- **`TRANSACTIONS` — a malformed row reaching the CLI.** Task 6 wires `parse_csv` but names no exit 2 path at all, so today a bad row escapes as an unhandled `ParseError`. Expect `ledgerlite: <path>:<line>: <what is wrong>` on stderr, exit 2, and an empty stdout — no partial report.
  - [ ] **Task 6, Step 1b: add `test_malformed_row_returns_2`** — write a CSV whose third line is `2026-03-04,abc,x`; assert `rc == 2`, `out.getvalue() == ""`, and `err.getvalue() == f"ledgerlite: {csv_path}:3: ...\n"` matched by prefix `f"ledgerlite: {csv_path}:3: "`.

- **`TRANSACTIONS` — a file that came out of a spreadsheet.** They will hand it a UTF-8 BOM, CRLF line endings, a trailing blank line, spaces after the commas, and a quoted `"SHOP, LTD"` description. None of that is malformed data to a person; the spec's grammar just never mentions it. Expect all five to parse to the obvious three transactions.
  - [ ] **Task 2, Step 1b: add `test_spreadsheet_export_quirks`** — `parse_csv("\ufeffdate, amount, description\r\n2026-03-04, -7.50, \"SHOP, LTD\"\r\n\r\n")` returns one transaction with `amount == Decimal("-7.50")` and `description == "SHOP, LTD"`.

- **`TRANSACTIONS` — a file with no header, or no bytes.** They will export rows without the header line, or hand over a zero-byte file from a failed download. The spec says the header exists; it does not say what happens when it doesn't. Expect a line-1 malformed error and exit 2, not an `IndexError` and not a report that silently drops the first transaction as a header.
  - [ ] **Task 2, Step 1c: add `test_missing_or_empty_header_is_line_1_error`** — both `parse_csv("2026-03-04,-7.50,COFFEE\n")` and `parse_csv("")` raise `ParseError` with `line == 1` and a reason naming the header.

- **`TRANSACTIONS` — a header-only month with no activity.** A quiet account produces zero transactions; `totals_by_category` is then empty and the spec's layout ("lines, blank line, closing balance") degenerates to a report that opens with a blank line. Expect just `closing balance: 0.00`.
  - [ ] **Task 5, Step 1a: add `test_empty_totals_prints_only_closing_balance`** — `format_report({}, Decimal("0"))` equals `"closing balance: 0.00"` with no leading newline.

- **`TRANSACTIONS` — bytes that aren't UTF-8.** A UK bank export in cp1252 (`£`) or a Latin-1 `Café` decodes to a `UnicodeDecodeError` at open time. Expect the file-level failure the person already understands: `ledgerlite: cannot read <path>: <reason>` and exit 1. (This also settles the split between Task 2's `parse_csv(text)` and Task 6's `parse_csv(path)`: the CLI owns decoding, with `encoding="utf-8"` stated explicitly.)
  - [ ] **Task 6, Step 1c: add `test_undecodable_bytes_returns_1`** — write `b"date,amount,description\n2026-03-04,-7.50,Caf\xe9\n"`; assert `rc == 1` and `err` starts with `f"ledgerlite: cannot read {csv_path}: "`.

- **`--rules RULES` — a path that doesn't exist.** They will typo it or move the file; the spec promises a message only for `TRANSACTIONS`, and "`--rules` is optional" must not be read as "an unreadable rules file means no rules." Expect the same message shape and exit 1, never a silently all-`uncategorized` report that looks correct.
  - [ ] **Task 6, Step 1d: add `test_unreadable_rules_file_returns_1`** — `main(["report", csv_path, "--rules", "/no/such/rules.txt"])` returns 1, stdout empty, `err` starts with `"ledgerlite: cannot read /no/such/rules.txt: "`.

- **`--rules RULES` — a rules file written by a human.** They will add `# groceries` comments, a bare `coffee` with no `=`, trailing spaces (`rent = housing `), an `amazon=shopping=online`, and indented blank lines. The spec gives one grammar and no error path. Expect lines without `=` to be ignored rather than crash or invent a category, the split to be on the first `=`, and both sides stripped.
  - [ ] **Task 3, Step 1a: add `test_rule_lines_are_forgiving`** — `parse_rules("# comment\ncoffee\n  \nrent = housing \namazon=shopping=online\n")` equals `[("rent", "housing"), ("amazon", "shopping=online")]`.

- **`--opening AMOUNT` — a number typed the way people type money.** They will pass `1,200.00`, `$100`, `100.005`, `abc`, or an empty string; the spec says only that it defaults to `0`. Expect `ledgerlite: --opening: <what is wrong>` on stderr and exit 2, not a `decimal.InvalidOperation` traceback — and `--opening -50` must be read as a negative opening balance, not an unknown flag.
  - [ ] **Task 6, Step 1e: add `test_bad_opening_returns_2` and `test_negative_opening_is_accepted`** — `main(["report", csv_path, "--opening", "1,200.00"])` returns 2 with `err.startswith("ledgerlite: --opening: ")` and empty stdout; `main(["report", csv_path, "--opening", "-50"])` returns 0 and ends `"closing balance: 1542.50\n"`.

- **`argv` — the command line with nothing useful on it.** They will run `ledgerlite` bare, misspell the subcommand (`ledgerlite repot ...`), or ask for `--help`. `argparse` answers all three with `SystemExit`, which breaks the `main(argv) -> int` contract the CLI test relies on. Expect a usage message and a returned nonzero code (0 for `--help`), with no exception escaping `main`.
  - [ ] **Task 6, Step 1f: add `test_argv_errors_return_codes_not_exceptions`** — `main([])` and `main(["repot", "x.csv"])` each return a nonzero int with `"usage:"` in stderr; `main(["--help"])` returns 0; none raises `SystemExit`.

- **The environment — stdout, and the locale it inherits.** They will pipe the report into `head` or close the pipe early, and they will run this on a machine whose default encoding isn't UTF-8. Neither is in the spec. Expect a broken pipe to end the program quietly instead of printing a `BrokenPipeError` traceback, and file reads to be explicitly UTF-8 so `LC_ALL=C` doesn't change what parses.
  - [ ] **Task 6, Step 1g: add `test_broken_stdout_exits_quietly` and `test_locale_independent_read`** — redirect stdout to a stream whose `write` raises `BrokenPipeError` and assert `main([...])` returns nonzero without propagating; and run the end-to-end case with a `Café` description via `subprocess.run([sys.executable, "-m", "ledgerlite", ...], env={**os.environ, "LC_ALL": "C"})` asserting `returncode == 0`.
