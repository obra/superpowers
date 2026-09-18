# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `ledgerlite` command-line tool that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** A pure-function core in a `ledgerlite/` package — parsing (`parse.py`), rule matching (`rules.py`), ordering/summing (`balance.py`), formatting (`report.py`) — with all I/O, exit codes, and error messages confined to `cli.py`. Parsers raise exceptions carrying a line number and a message; the CLI is the only place that knows the file path and turns those into `stderr` text and exit codes. Money is `decimal.Decimal` end to end.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `dataclasses`), `unittest` for tests.

**Spec:** `design.md`

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies.
- Amounts are `decimal.Decimal` everywhere, never `float`. No arithmetic on money outside `Decimal`.
- Package layout is fixed by the spec: `ledgerlite/{__init__.py,model.py,parse.py,rules.py,balance.py,report.py,cli.py}`.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- All amounts printed with exactly two fractional digits, leading `-` for negatives, no thousands separators (`-12.50`, `0.00`, `1200.00`).
- Exit codes: `0` success, `1` a file cannot be read, `2` a malformed row.
- Error messages go to stderr and are exactly `ledgerlite: cannot read <path>: <reason>` and `ledgerlite: <path>:<line>: <what is wrong>`.
- One addition beyond the spec's layout: `ledgerlite/__main__.py` (a two-line `sys.exit(main())`), so the tool is runnable as `python3 -m ledgerlite report ...`. The spec names no packaging metadata, so this is the only way to invoke it.

## Review Focus

Input classes the spec implies but does not spell out. Each has a test placed in the task that owns the code.

1. **`--rules` naming an unreadable file** — the spec defines a read failure only for TRANSACTIONS, but a mistyped rules path is at least as likely; it must print the same `cannot read` message and return 1, not traceback. (Task 5)
2. **Negative zero** — `Decimal("-0.00")` (from an amount field of `-0.00`, or a category whose amounts cancel) formats as `-0.00` by default, which contradicts "a leading `-` for negatives". Zero must print `0.00`. (Task 4)
3. **`NaN` / `Infinity` amounts** — `Decimal("nan")` and `Decimal("inf")` parse without error and would poison every total; both must be rejected as malformed rows. (Task 1)
4. **A missing or mismatched header row, and an empty file** — without a header check the first transaction is silently eaten as a header, and an empty file has no header at all. Both are malformed at line 1. (Task 1)
5. **A blank line in the middle of the file** — `csv` yields an empty row, which must be reported as a wrong column count at its *own* line number (the line count must not drift after it). (Task 1)

---

### Task 1: Transaction model and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py` (empty)
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str` (in that order).
  - `ledgerlite.parse.ParseError(Exception)` — constructed `ParseError(line: int, message: str)`, with attributes `.line: int` and `.message: str`; `str(err) == err.message`.
  - `ledgerlite.parse.parse_date(field: str) -> datetime.date` — raises `ValueError`.
  - `ledgerlite.parse.parse_amount(field: str) -> decimal.Decimal` — raises `ValueError`.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — raises `ParseError`. Preserves input row order.

- [ ] **Step 1: Write the failing tests in `test_parse.py`**

Header for valid fixtures is `date,amount,description`.

- `test_parses_one_row`: `parse_transactions("date,amount,description\n2026-03-04,-7.50,Coffee\n")` -> `[Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee")]`
- `test_amount_is_decimal_not_float`: `type(result[0].amount) is Decimal`
- `test_header_only_gives_empty_list`: `parse_transactions("date,amount,description\n")` -> `[]`
- `test_keeps_input_order_for_unsorted_rows`: rows dated `2026-03-05` then `2026-03-01` come back in that same order
- `test_accepts_one_fractional_digit`: amount field `1.5` -> `Decimal("1.5")`
- `test_accepts_two_fractional_digits`: amount field `1.50` -> `Decimal("1.50")`
- `test_accepts_integer_amount`: amount field `2500` -> `Decimal("2500")`
- `test_accepts_crlf_line_endings`: `"date,amount,description\r\n2026-03-04,-7.50,Coffee\r\n"` -> one transaction
- `test_accepts_quoted_comma_in_description`: `2026-03-04,-7.50,"Coffee, large"` -> description `"Coffee, large"`
- `test_strips_whitespace_around_date_and_amount`: `" 2026-03-04 , -7.50 ,Coffee"` -> `date(2026, 3, 4)`, `Decimal("-7.50")`
- `test_rejects_three_fractional_digits`: amount field `1.005` raises `ParseError` with `.line == 2` and `"fractional"` in `.message`
- `test_rejects_non_numeric_amount`: amount field `abc` raises `ParseError` with `.line == 2`
- `test_rejects_nan_amount`: amount field `nan` raises `ParseError` with `.line == 2` (Review Focus 3)
- `test_rejects_infinity_amount`: amount field `Infinity` raises `ParseError` with `.line == 2` (Review Focus 3)
- `test_rejects_empty_amount`: amount field `""` raises `ParseError` with `.line == 2`
- `test_rejects_unpadded_date`: date field `2026-3-4` raises `ParseError` with `.line == 2`
- `test_rejects_compact_date`: date field `20260304` raises `ParseError` with `.line == 2` (`date.fromisoformat` accepts it; the 10-character check must not)
- `test_rejects_impossible_date`: date field `2026-02-30` raises `ParseError` with `.line == 2`
- `test_rejects_too_few_columns`: `"date,amount,description\n2026-03-04,-7.50\n"` raises `ParseError` with `.line == 2` and `"columns"` in `.message`
- `test_rejects_too_many_columns`: a row with 4 fields raises `ParseError` with `.line == 2`
- `test_rejects_blank_line_midfile`: header, then a good row, then an empty line, then a good row — raises `ParseError` with `.line == 3` (Review Focus 5)
- `test_reports_line_number_of_later_bad_row`: header + good row + bad row -> `.line == 3`
- `test_rejects_missing_header`: `"2026-03-04,-7.50,Coffee\n"` raises `ParseError` with `.line == 1` (Review Focus 4)
- `test_rejects_empty_text`: `parse_transactions("")` raises `ParseError` with `.line == 1` (Review Focus 4)
- `test_parse_error_str_is_message`: `str(ParseError(2, "boom")) == "boom"`

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Implement `ledgerlite/model.py`**

`@dataclass(frozen=True)` `Transaction` with the three fields from the Interfaces block, in that order.

- [ ] **Step 4: Implement `ledgerlite/parse.py`**

- `ParseError` stores `line` and `message` and calls `super().__init__(message)`.
- `parse_date(field)`: `field = field.strip()`; require `len(field) == 10` before `datetime.date.fromisoformat(field)`, else `raise ValueError(f"date is not an ISO 8601 date: {field!r}")`. Raise the same message when `fromisoformat` raises.
- `parse_amount(field)`: `field = field.strip()`; `Decimal(field)` catching `decimal.InvalidOperation` -> `ValueError(f"amount is not a decimal number: {field!r}")`; then reject non-finite with the same message (`value.is_finite()` is `False` for `NaN`/`Infinity`); then `if value.as_tuple().exponent < -2: raise ValueError(f"amount has more than two fractional digits: {field!r}")`.
- `parse_transactions(text)`: `reader = csv.reader(io.StringIO(text, newline=""))` — the `newline=""` keeps `\r\n` intact for `csv`, and `reader.line_num` gives the 1-based file line for error reporting.
  - First row: if the reader is exhausted, or the row's fields stripped and lowercased are not `["date", "amount", "description"]`, raise `ParseError(1, "expected header row date,amount,description")`.
  - Each later row: if `len(row) != 3`, raise `ParseError(reader.line_num, f"expected 3 columns, got {len(row)}")`; else build a `Transaction` from `parse_date(row[0])`, `parse_amount(row[1])`, `row[2]` (description kept verbatim), converting any `ValueError` into `ParseError(reader.line_num, str(err))`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Transaction records"
```

---

### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first matching rule's category, or `None`.

- [ ] **Step 1: Write the failing tests in `test_rules.py`**

- `test_parses_one_rule`: `parse_rules("coffee=food\n")` -> `[("coffee", "food")]`
- `test_keeps_file_order`: `parse_rules("coffee=food\nrent=housing\n")` -> `[("coffee", "food"), ("rent", "housing")]`
- `test_strips_surrounding_whitespace`: `parse_rules("  coffee = food  \n")` -> `[("coffee", "food")]`
- `test_splits_on_first_equals`: `parse_rules("a=b=c\n")` -> `[("a", "b=c")]`
- `test_skips_blank_and_whitespace_lines`: `parse_rules("\n   \ncoffee=food\n")` -> `[("coffee", "food")]`
- `test_ignores_line_without_equals`: `parse_rules("nonsense\n")` -> `[]`
- `test_ignores_empty_substring`: `parse_rules("=food\n")` -> `[]`
- `test_ignores_empty_category`: `parse_rules("coffee=\n")` -> `[]`
- `test_parses_empty_text`: `parse_rules("")` -> `[]`
- `test_categorize_matches_substring`: `categorize("Morning coffee", [("coffee", "food")])` -> `"food"`
- `test_categorize_is_case_insensitive_on_description`: `categorize("MORNING COFFEE", [("coffee", "food")])` -> `"food"`
- `test_categorize_is_case_insensitive_on_rule`: `categorize("morning coffee", [("COFFEE", "food")])` -> `"food"`
- `test_categorize_first_match_wins`: `categorize("Coffee Shop", [("coffee", "food"), ("shop", "retail")])` -> `"food"`
- `test_categorize_first_match_wins_regardless_of_position`: `categorize("Coffee Shop", [("shop", "retail"), ("coffee", "food")])` -> `"retail"`
- `test_categorize_no_match_returns_none`: `categorize("Salary", [("coffee", "food")])` -> `None`
- `test_categorize_with_no_rules_returns_none`: `categorize("Coffee", [])` -> `None`

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — no module named `ledgerlite.rules`

- [ ] **Step 3: Implement `ledgerlite/rules.py`**

- `parse_rules`: iterate `text.splitlines()`; split each line once on `"="`; strip both sides; keep the pair only if both sides are non-empty (so blank lines, lines with no `=`, and half-empty rules are all skipped).
- `categorize`: lowercase the description once, return the category of the first rule whose lowercased substring is in it, else `None`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules file and categorize descriptions"
```

---

### Task 3: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (Task 1).
- Produces:
  - `ledgerlite.balance.order_by_date(transactions: list[Transaction]) -> list[Transaction]` — new list, ordered by date, ties keeping input order.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal` — the running balance after the last transaction in date order; `opening` when the list is empty.

- [ ] **Step 1: Write the failing tests in `test_balance.py`**

Use a small helper in the test file to build transactions, e.g. `tx("2026-03-04", "-7.50", "Coffee")`.

- `test_orders_by_date`: input dated `03-05, 03-01, 03-03` -> descriptions in date order
- `test_same_date_keeps_input_order`: two transactions both dated `2026-03-04` with descriptions `A` then `B` -> `["A", "B"]`; the reversed input -> `["B", "A"]`
- `test_order_does_not_mutate_input`: the argument list's order is unchanged after the call
- `test_orders_empty_list`: `order_by_date([])` -> `[]`
- `test_closing_balance_matches_spec_example`: `closing_balance(Decimal("100"), [-7.50, -900.00, 2500.00 amounts])` -> `Decimal("1692.50")`
- `test_closing_balance_with_no_transactions_is_opening`: `closing_balance(Decimal("100"), [])` -> `Decimal("100")`
- `test_closing_balance_is_exact_decimal`: amounts `0.10` and `0.20` with opening `0` -> `Decimal("0.30")` (a float sum would not be equal)
- `test_closing_balance_independent_of_input_order`: same amounts shuffled -> same result
- `test_closing_balance_returns_decimal`: `type(result) is Decimal`

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — no module named `ledgerlite.balance`

- [ ] **Step 3: Implement `ledgerlite/balance.py`**

- `order_by_date`: `sorted(transactions, key=lambda t: t.date)` — `sorted` is stable, which is what "ties keeping input order" means.
- `closing_balance`: start from `opening` and add each amount of `order_by_date(transactions)` in turn.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: order transactions by date and compute closing balance"
```

---

### Task 4: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `rules.categorize` (Task 2), `balance.order_by_date` and `balance.closing_balance` (Task 3).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED = "uncategorized"`
  - `ledgerlite.report.format_amount(amount: Decimal) -> str`
  - `ledgerlite.report.category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> dict[str, Decimal]` — keys are category names, uncategorized transactions under `UNCATEGORIZED`; categories with no transactions are absent.
  - `ledgerlite.report.format_report(transactions: list[Transaction], rules: list[tuple[str, str]], opening: Decimal) -> str` — the whole report, ending in a single newline.

- [ ] **Step 1: Write the failing tests in `test_report.py`**

- `test_format_amount_integer`: `format_amount(Decimal("1200"))` -> `"1200.00"`
- `test_format_amount_one_fractional_digit`: `format_amount(Decimal("-12.5"))` -> `"-12.50"`
- `test_format_amount_zero`: `format_amount(Decimal("0"))` -> `"0.00"`
- `test_format_amount_negative_zero`: `format_amount(Decimal("-0.00"))` -> `"0.00"` (Review Focus 2)
- `test_format_amount_no_thousands_separator`: `format_amount(Decimal("1234567.5"))` -> `"1234567.50"`
- `test_format_amount_large_value_not_exponential`: `format_amount(Decimal("1E+7"))` -> `"10000000.00"`
- `test_category_totals_sums_per_category`: two `coffee` transactions with rules `[("coffee", "food")]` -> `{"food": Decimal("-15.00")}`
- `test_category_totals_uses_uncategorized_key`: one unmatched transaction -> `{"uncategorized": Decimal("2500.00")}`
- `test_category_totals_omits_uncategorized_when_all_matched`: `"uncategorized" not in result`
- `test_category_totals_with_no_transactions`: `category_totals([], [])` -> `{}`
- `test_format_report_matches_spec_example`: transactions `2026-03-01 / -7.50 / "Coffee"`, `2026-03-02 / -900.00 / "Rent"`, `2026-03-03 / 2500.00 / "Salary"`, rules `[("coffee", "food"), ("rent", "housing")]`, opening `Decimal("100")` -> exactly:
  ```
  food: -7.50
  housing: -900.00
  uncategorized: 2500.00

  closing balance: 1692.50
  ```
  (with a trailing newline)
- `test_format_report_lists_categories_alphabetically`: categories produced in the order `zebra`, `apple` -> `apple` line before `zebra` line
- `test_format_report_puts_uncategorized_last`: categories `food` and `zebra` plus an unmatched transaction -> line order `food`, `zebra`, `uncategorized` (alphabetically `uncategorized` would precede `zebra`)
- `test_format_report_with_no_transactions`: `format_report([], [], Decimal("0"))` -> `"closing balance: 0.00\n"` — no category lines and no leading blank line
- `test_format_report_without_rules_is_all_uncategorized`: the spec example with `rules=[]` -> one `uncategorized: 1592.50` line and `closing balance: 1692.50`
- `test_format_report_uses_opening_when_no_transactions`: `format_report([], [], Decimal("100"))` -> `"closing balance: 100.00\n"`

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — no module named `ledgerlite.report`

- [ ] **Step 3: Implement `ledgerlite/report.py`**

- `format_amount`: quantize to `Decimal("0.01")` and format with `f"{value:f}"` (no separators, never exponential). Guard negative zero first: if the amount equals zero, format its absolute value.
- `category_totals`: accumulate over `order_by_date(transactions)` (the spec's stated ordering), keying on `categorize(t.description, rules)` or `UNCATEGORIZED`.
- `format_report`: category lines are `f"{name}: {format_amount(total)}"` for the totals' keys sorted alphabetically with `UNCATEGORIZED` removed and appended last if present; then a blank line, then `f"closing balance: {format_amount(closing_balance(opening, transactions))}"`. When there are no category lines, emit only the closing-balance line (no blank line). Return the joined lines with a trailing newline.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: format per-category totals and closing balance report"
```

---

### Task 5: CLI entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.parse_transactions`, `parse.parse_amount`, `parse.ParseError` (Task 1), `rules.parse_rules` (Task 2), `report.format_report` (Task 4).
- Produces:
  - `ledgerlite.cli.build_parser() -> argparse.ArgumentParser`
  - `ledgerlite.cli.main(argv: list[str] | None = None) -> int`

- [ ] **Step 1: Write the failing tests in `test_cli.py`**

Write fixture files into a `tempfile.TemporaryDirectory()` per test; capture output with `contextlib.redirect_stdout`/`redirect_stderr` over `io.StringIO`. The valid fixture is the spec example (three rows) with rules `coffee=food` and `rent=housing`.

- `test_report_returns_zero_and_prints_report`: `main(["report", csv_path, "--rules", rules_path, "--opening", "100"])` -> `0`, stdout equals the spec example report
- `test_opening_defaults_to_zero`: no `--opening` -> stdout ends `"closing balance: 1592.50\n"`
- `test_rules_optional_means_all_uncategorized`: no `--rules` -> stdout has an `uncategorized: 1592.50` line and no `food:` line
- `test_negative_opening_accepted`: `--opening -50.25` -> `closing balance: 1542.25`
- `test_missing_transactions_file_returns_one`: `main(["report", "/no/such/file.csv"])` -> `1`, stderr == `"ledgerlite: cannot read /no/such/file.csv: No such file or directory\n"`, stdout empty
- `test_directory_as_transactions_file_returns_one`: passing the temp directory itself -> `1`, stderr starts with `f"ledgerlite: cannot read {dir}: "`
- `test_missing_rules_file_returns_one`: valid CSV, `--rules /no/such/rules.txt` -> `1`, stderr == `"ledgerlite: cannot read /no/such/rules.txt: No such file or directory\n"`, stdout empty (Review Focus 1)
- `test_malformed_row_returns_two`: CSV whose second line is `2026-03-04,1.005,Coffee` -> `2`, stderr == `f"ledgerlite: {csv_path}:2: amount has more than two fractional digits: '1.005'\n"`
- `test_malformed_row_prints_nothing_to_stdout`: same fixture -> stdout is `""`
- `test_malformed_row_reports_later_line_number`: bad row on file line 3 -> stderr contains `f"{csv_path}:3: "`
- `test_missing_header_returns_two`: CSV with no header -> `2`, stderr contains `f"{csv_path}:1: "`
- `test_invalid_opening_exits_two`: `main(["report", csv_path, "--opening", "abc"])` raises `SystemExit` with `.code == 2`
- `test_opening_with_three_fractional_digits_exits_two`: `--opening 1.005` raises `SystemExit` with `.code == 2`
- `test_missing_subcommand_exits_two`: `main([])` raises `SystemExit` with `.code == 2`
- `test_header_only_file_prints_opening_as_closing`: CSV with only the header, `--opening 100` -> `0`, stdout == `"closing balance: 100.00\n"`

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — no module named `ledgerlite.cli`

- [ ] **Step 3: Implement `ledgerlite/cli.py`**

- `build_parser`: `ArgumentParser(prog="ledgerlite")` with `add_subparsers(dest="command", required=True)`; a `report` subparser taking positional `transactions`, `--rules` (default `None`), and `--opening` with `type=parse_amount, default=Decimal("0")` — reusing `parse_amount` makes argparse reject a bad opening amount with its own exit code 2.
- A module-level helper reads a path: `open(path, encoding="utf-8", newline="")` and return the text; let `OSError` and `UnicodeDecodeError` propagate.
- `main(argv=None)`: parse args; read the transactions file, then the rules file if `--rules` was given, inside one `try` that catches `OSError` (reason `err.strerror`) and `UnicodeDecodeError` (reason `err.reason`) and prints `f"ledgerlite: cannot read {path}: {reason}"` to `sys.stderr`, returning `1`. Then `parse_transactions`, catching `ParseError` to print `f"ledgerlite: {args.transactions}:{err.line}: {err.message}"` to `sys.stderr` and return `2`. Nothing is written to stdout before parsing succeeds. Finally print `format_report(...)` (already newline-terminated, so use `end=""`) and return `0`.

- [ ] **Step 4: Implement `ledgerlite/__main__.py`**

`sys.exit(main())` guarded by `if __name__ == "__main__":`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS

- [ ] **Step 6: Run the whole suite and the tool end to end**

Run: `python3 -m unittest -v`
Expected: PASS, all five test modules.

Run against a hand-made fixture: `python3 -m ledgerlite report tmp.csv --rules tmp.rules --opening 100`
Expected: the report on stdout, `echo $?` -> `0`.

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report command-line entry point"
```
