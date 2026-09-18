# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A command-line tool that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** A `ledgerlite` package of single-responsibility modules layered bottom-up: `model` (the `Transaction` record), `parse` (text → transactions, all-or-nothing), `rules` (rules text → substring/category pairs, plus lookup), `balance` (date ordering and closing balance), `report` (totals and formatting), `cli` (argparse, file reading, exit codes). Every module below `cli` is pure — it takes and returns values, never touches the filesystem or prints — so `cli` owns all I/O and all three exit codes.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `dataclasses`), `unittest` for tests.

**Spec:** `design.md` (same directory as this plan)

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies.
- Money is `decimal.Decimal` everywhere. Never `float`, at any point, including in tests.
- Package lives at `ledgerlite/` with exactly the modules named in the spec's Package layout: `__init__.py`, `model.py`, `parse.py`, `rules.py`, `balance.py`, `report.py`, `cli.py`.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Amounts are rendered with exactly two fractional digits, a leading `-` for negatives, and no thousands separators: `-12.50`, `0.00`, `1200.00`.
- Work directly on `main`. Commit after every task.

## Review Focus

These are input classes the spec implies but does not spell out. Each one's test is assigned to the task that owns the code, and appears in that task's steps.

1. **`Decimal` accepts more than the spec means by "a decimal number":** `nan`, `Infinity`, `-Inf` all parse successfully and would poison every total. Must be rejected as a malformed amount (Task 1).
2. **A rules file that cannot be read:** the spec pins this behavior only for TRANSACTIONS. A missing `--rules` path must not traceback; treat it exactly like an unreadable TRANSACTIONS file — `ledgerlite: cannot read <path>: <reason>` on stderr, exit 1 (Task 5).
3. **An empty or header-only transactions file:** no category lines at all (not a `uncategorized: 0.00` line), and the closing balance is the opening amount (Tasks 4 and 5).
4. **A rule whose category is literally `uncategorized`:** its transactions merge into the same bucket as unmatched ones, and that bucket still prints last (Task 4).
5. **A blank line in the middle of the CSV:** it is a malformed row, so the whole file is rejected with exit 2 and nothing on stdout — not silently skipped (Tasks 1 and 5).

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
  ```python
  # ledgerlite/model.py
  @dataclass(frozen=True)
  class Transaction:
      date: datetime.date
      amount: decimal.Decimal
      description: str

  # ledgerlite/parse.py
  class ParseError(Exception):
      line: int       # 1-based line number in the file
      message: str    # "what is wrong", no path or line prefix

  def parse_transactions(text: str) -> list[Transaction]
  ```
  `parse_transactions` returns transactions in input order (no sorting). Line 1 is the header and is skipped unconditionally — its contents are not validated. Callers supply the file's full text; `parse.py` never opens files.

**Requirements:**
- Malformed row messages, exact strings (`<value>` is the offending field, `repr`-quoted):
  - wrong column count: `expected 3 columns, got 2`
  - unparseable date: `invalid date: '2026-13-01'`
  - amount not a decimal number: `invalid amount: 'abc'`
  - more than two fractional digits: `amount has more than two fractional digits: '1.005'`
- A malformed row raises immediately; no partial result is returned.

- [ ] **Step 1: Write the failing tests in `test_parse.py`**

- `test_parses_rows_in_input_order`: text with header + rows `2026-03-05,2500.00,Salary` then `2026-03-04,-7.50,Coffee` -> `[Transaction(date(2026,3,5), Decimal("2500.00"), "Salary"), Transaction(date(2026,3,4), Decimal("-7.50"), "Coffee")]`
- `test_amount_is_decimal_not_float`: parsing `-7.50` -> `.amount == Decimal("-7.50")` and `isinstance(.amount, Decimal)`
- `test_one_and_two_fractional_digits_ok`: amounts `1.5` and `1.50` both parse, to `Decimal("1.5")` and `Decimal("1.50")`
- `test_integer_amount_ok`: amount `100` -> `Decimal("100")`
- `test_empty_text_is_no_transactions`: `parse_transactions("")` -> `[]`
- `test_header_only_is_no_transactions`: `parse_transactions("date,amount,description\n")` -> `[]`
- `test_description_may_contain_comma`: row `2026-03-04,-7.50,"Coffee, large"` -> `.description == "Coffee, large"`
- `test_rejects_too_few_columns`: row `2026-03-04,-7.50` raises `ParseError` with `.line == 2` and `.message == "expected 3 columns, got 2"`
- `test_rejects_too_many_columns`: row with 4 fields raises `ParseError`, `.message == "expected 3 columns, got 4"`
- `test_rejects_blank_line_mid_file`: header, one good row, a blank line, one good row -> raises `ParseError` with `.line == 3` and `.message == "expected 3 columns, got 0"`
- `test_rejects_unparseable_date`: `2026-13-01` raises `ParseError`, `.message == "invalid date: '2026-13-01'"`
- `test_rejects_impossible_date`: `2026-02-30` raises `ParseError`, `.message == "invalid date: '2026-02-30'"`
- `test_rejects_non_numeric_amount`: `abc` raises `ParseError`, `.message == "invalid amount: 'abc'"`
- `test_rejects_empty_amount`: `` raises `ParseError`, `.message == "invalid amount: ''"`
- `test_rejects_three_fractional_digits`: `1.005` raises `ParseError`, `.message == "amount has more than two fractional digits: '1.005'"`
- `test_rejects_nan_amount`: `nan` raises `ParseError`, `.message == "invalid amount: 'nan'"`
- `test_rejects_infinity_amount`: `Infinity` raises `ParseError`, `.message == "invalid amount: 'Infinity'"`
- `test_reports_line_number_of_later_bad_row`: header + two good rows + one bad row -> `.line == 5`
- `test_first_bad_row_wins`: two malformed rows -> `.line` is the earlier one

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Implement `Transaction` in `ledgerlite/model.py` and `parse_transactions(text: str) -> list[Transaction]` plus `ParseError` in `ledgerlite/parse.py`**

Feed `csv.reader(text.splitlines())` so a trailing newline does not produce an extra row; enumerate from 1 for line numbers and skip the first row. Use `datetime.date.fromisoformat` for the date. Amount validation, in this order (the order matters — `as_tuple().exponent` is a string, not an int, for NaN and Infinity):

```python
try:
    amount = Decimal(field)
except decimal.InvalidOperation:
    raise ParseError(line, f"invalid amount: {field!r}")
if not amount.is_finite():
    raise ParseError(line, f"invalid amount: {field!r}")
if amount.as_tuple().exponent < -2:
    raise ParseError(line, f"amount has more than two fractional digits: {field!r}")
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS, all tests

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: add Transaction model and CSV parsing"
```

---

### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```python
  # ledgerlite/rules.py
  def parse_rules(text: str) -> list[tuple[str, str]]   # [(substring, category), ...] in file order
  def categorize(description: str, rules: list[tuple[str, str]]) -> str | None
  ```
  `categorize` returns the category of the first rule whose substring appears in the description, case-insensitively, or `None` when no rule matches. Rules text comes from the caller; `rules.py` never opens files.

**Requirements:**
- One rule per line, `<substring>=<category>`. Split on the *first* `=`, so a category may contain `=`.
- Blank lines and whitespace-only lines are ignored. Lines with no `=` are ignored. A rule with an empty substring is ignored (it would match everything).
- Leading and trailing whitespace is stripped from both substring and category.
- Matching is case-insensitive; first matching rule wins.

- [ ] **Step 1: Write the failing tests in `test_rules.py`**

- `test_parses_rules_in_order`: `"coffee=food\nrent=housing\n"` -> `[("coffee", "food"), ("rent", "housing")]`
- `test_strips_whitespace`: `"  coffee = food  \n"` -> `[("coffee", "food")]`
- `test_ignores_blank_and_whitespace_lines`: `"coffee=food\n\n   \nrent=housing\n"` -> two rules
- `test_ignores_lines_without_equals`: `"coffee=food\nnonsense\n"` -> `[("coffee", "food")]`
- `test_ignores_empty_substring`: `"=food\ncoffee=food\n"` -> `[("coffee", "food")]`
- `test_splits_on_first_equals_only`: `"a=b=c\n"` -> `[("a", "b=c")]`
- `test_empty_text_is_no_rules`: `parse_rules("")` -> `[]`
- `test_categorize_matches_substring`: `categorize("Blue Bottle Coffee", [("coffee", "food")])` -> `"food"`
- `test_categorize_is_case_insensitive_both_ways`: `categorize("COFFEE run", [("Coffee", "food")])` -> `"food"`
- `test_categorize_first_matching_rule_wins`: `categorize("coffee and rent", [("rent", "housing"), ("coffee", "food")])` -> `"housing"`
- `test_categorize_no_match_is_none`: `categorize("Salary", [("coffee", "food")])` -> `None`
- `test_categorize_no_rules_is_none`: `categorize("Salary", [])` -> `None`

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ImportError: cannot import name 'parse_rules'`

- [ ] **Step 3: Implement `parse_rules` and `categorize` in `ledgerlite/rules.py`**

Use `str.partition("=")` for the first-`=` split. Lowercase both the description and each substring at comparison time in `categorize` (keep the substrings as written in the returned rules).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS, all tests

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules parsing and categorization"
```

---

### Task 3: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (Task 1).
- Produces:
  ```python
  # ledgerlite/balance.py
  def order_by_date(transactions: list[Transaction]) -> list[Transaction]
  def closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal
  ```
  `order_by_date` returns a new list sorted by date, ties keeping input order. `closing_balance` is the running balance after the last date-ordered transaction — `opening` when the list is empty.

**Requirements:**
- Sorting must be stable (`sorted(key=...)`, not a comparison that reorders equal dates).
- `closing_balance` must not mutate its input and must stay in `Decimal`.

- [ ] **Step 1: Write the failing tests in `test_balance.py`**

- `test_orders_by_date`: two transactions dated `2026-03-05` then `2026-03-04` -> the `03-04` one first
- `test_same_date_keeps_input_order`: two transactions both dated `2026-03-04`, descriptions `"a"` then `"b"` -> descriptions `["a", "b"]`
- `test_order_does_not_mutate_input`: input list's own order is unchanged after the call
- `test_order_empty`: `order_by_date([])` -> `[]`
- `test_closing_balance_sums_in_date_order`: opening `Decimal("100")`, amounts `-7.50`, `-900.00`, `2500.00` -> `Decimal("1692.50")`
- `test_closing_balance_no_transactions_is_opening`: `closing_balance([], Decimal("100"))` -> `Decimal("100")`
- `test_closing_balance_default_opening_zero`: `closing_balance([tx(-7.50)], Decimal("0"))` -> `Decimal("-7.50")`
- `test_closing_balance_is_decimal`: result `isinstance(..., Decimal)`

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ImportError: cannot import name 'order_by_date'`

- [ ] **Step 3: Implement `order_by_date` and `closing_balance` in `ledgerlite/balance.py`**

`closing_balance` sums the `order_by_date` result starting from `opening`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS, all tests

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```

---

### Task 4: Category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 2), `order_by_date` and `closing_balance` (Task 3).
- Produces:
  ```python
  # ledgerlite/report.py
  UNCATEGORIZED = "uncategorized"

  def format_amount(amount: Decimal) -> str
  def category_totals(
      transactions: list[Transaction], rules: list[tuple[str, str]]
  ) -> list[tuple[str, Decimal]]
  def format_report(
      transactions: list[Transaction],
      rules: list[tuple[str, str]],
      opening: Decimal,
  ) -> str
  ```
  `category_totals` returns `(category, total)` pairs already in print order: named categories sorted alphabetically, then `uncategorized` last if and only if that bucket has at least one transaction. `format_report` returns the whole report text, ending with a single trailing newline.

**Requirements:**
- Report body: one `<category>: <total>` line per pair, then a blank line, then `closing balance: <amount>`.
- A rule whose category is the string `uncategorized` shares the one `uncategorized` bucket, which still prints last.
- No transactions -> no category lines at all: the report is a blank line then the closing balance line.
- `format_amount` renders a zero total as `0.00`, never `-0.00`.

- [ ] **Step 1: Write the failing tests in `test_report.py`**

- `test_format_amount_negative`: `format_amount(Decimal("-12.5"))` -> `"-12.50"`
- `test_format_amount_zero`: `format_amount(Decimal("0"))` -> `"0.00"`
- `test_format_amount_negative_zero`: `format_amount(Decimal("-0.00"))` -> `"0.00"`
- `test_format_amount_no_thousands_separator`: `format_amount(Decimal("1200"))` -> `"1200.00"`
- `test_format_amount_large`: `format_amount(Decimal("1234567.5"))` -> `"1234567.50"`
- `test_totals_sum_per_category`: two `coffee` transactions `-7.50` and `-2.50` with rules `[("coffee", "food")]` -> `[("food", Decimal("-10.00"))]`
- `test_totals_alphabetical`: categories `housing`, `food`, `travel` -> in that alphabetical order
- `test_uncategorized_last_despite_alphabet`: categories `zoo` and unmatched transactions -> `[("zoo", ...), ("uncategorized", ...)]`
- `test_uncategorized_omitted_when_empty`: every transaction matches a rule -> no `uncategorized` pair
- `test_explicit_uncategorized_rule_merges_into_bucket`: rules `[("coffee", "uncategorized")]`, one `-7.50` coffee transaction and one unmatched `2500.00` -> `[("uncategorized", Decimal("2492.50"))]` as the only pair, and it is last
- `test_totals_empty_transactions`: `category_totals([], [])` -> `[]`
- `test_report_matches_spec_example`: opening `Decimal("100")`, rules `coffee=food` and `rent=housing`, transactions `2026-03-04,-7.50,Coffee`, `2026-03-01,-900.00,Rent`, `2026-03-05,2500.00,Salary` -> exactly:
  ```
  food: -7.50
  housing: -900.00
  uncategorized: 2500.00

  closing balance: 1692.50
  ```
  (with a trailing newline)
- `test_report_no_transactions`: `format_report([], [], Decimal("100"))` -> `"\nclosing balance: 100.00\n"`
- `test_report_no_rules_is_all_uncategorized`: transactions with `rules=[]` -> single `uncategorized:` line totalling all amounts

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ImportError: cannot import name 'format_amount'`

- [ ] **Step 3: Implement `format_amount`, `category_totals`, and `format_report` in `ledgerlite/report.py`**

`format_amount`: quantize/format with `f"{amount:.2f}"`, and coerce an exact zero to its absolute value first so `-0.00` cannot appear. `category_totals`: accumulate into a dict keyed by `categorize(...) or UNCATEGORIZED`, then emit `sorted()` of the keys other than `UNCATEGORIZED`, appending `UNCATEGORIZED` if present. `format_report`: `category_totals` for the lines, `closing_balance` for the last line.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS, all tests

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add category totals and report formatting"
```

---

### Task 5: CLI entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_transactions` and `ParseError` (Task 1), `parse_rules` (Task 2), `format_report` (Task 4).
- Produces:
  ```python
  # ledgerlite/cli.py
  def main(argv: list[str] | None = None) -> int
  ```
  `main` prints to `sys.stdout` / `sys.stderr` and returns the exit code; it never calls `sys.exit` itself. `argv` excludes the program name (`["report", "tx.csv", "--rules", "r.txt"]`). Ends with `if __name__ == "__main__": sys.exit(main())`.

**Requirements:**
- Usage: `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`. Use `argparse` with `prog="ledgerlite"` and a `report` subcommand.
- `--opening` defaults to `Decimal("0")` and is converted by a function that raises `argparse.ArgumentTypeError` for anything `Decimal` rejects or that is not finite, so a bad value produces an argparse usage error rather than a traceback.
- Exit 0: report on stdout, nothing on stderr.
- Exit 1: `ledgerlite: cannot read <path>: <reason>` on stderr, nothing on stdout. `<reason>` is the `OSError`'s `strerror` (e.g. `No such file or directory`); `<path>` is the path as given on the command line. This applies to TRANSACTIONS **and** to `--rules`.
- Exit 2: `ledgerlite: <path>:<line>: <message>` on stderr from the `ParseError`, nothing on stdout.
- Read the rules file (if given) and parse everything before printing anything, so a failure never leaves partial output on stdout.

- [ ] **Step 1: Write the failing tests in `test_cli.py`**

Write a helper that creates files in a `tempfile.TemporaryDirectory` and runs `main(argv)` with `contextlib.redirect_stdout`/`redirect_stderr` into `io.StringIO`, returning `(code, out, err)`.

- `test_report_success`: the spec's example CSV, rules `coffee=food\nrent=housing\n`, `--opening 100` -> code `0`, stdout is the spec's exact five-line report, stderr `""`
- `test_default_opening_is_zero`: same CSV, no `--opening` -> `closing balance: 1592.50`
- `test_no_rules_flag_is_all_uncategorized`: no `--rules` -> stdout has one `uncategorized:` line and no other category lines, code `0`
- `test_empty_transactions_file`: file containing only the header, `--opening 100` -> code `0`, stdout `"\nclosing balance: 100.00\n"`
- `test_missing_transactions_file`: path that does not exist -> code `1`, stderr `"ledgerlite: /no/such.csv: ..."` — assert it starts with `ledgerlite: cannot read /no/such.csv: ` and contains `No such file or directory`, and stdout is `""`
- `test_transactions_path_is_a_directory`: pass the temp directory -> code `1`, stderr starts with `ledgerlite: cannot read `, stdout `""`
- `test_missing_rules_file`: valid CSV, `--rules` pointing at a nonexistent path -> code `1`, stderr starts with `ledgerlite: cannot read ` naming the rules path, stdout `""`
- `test_malformed_row_exits_2`: CSV whose third line is `2026-03-04,abc,Coffee` -> code `2`, stderr `f"ledgerlite: {path}:3: invalid amount: 'abc'\n"`, stdout `""`
- `test_three_fractional_digits_exits_2`: amount `1.005` -> code `2`, stderr ends with `amount has more than two fractional digits: '1.005'`
- `test_wrong_column_count_exits_2`: a two-field row -> code `2`, stderr contains `expected 3 columns, got 2`
- `test_blank_line_exits_2_with_no_stdout`: blank line between two valid rows -> code `2`, stdout `""`
- `test_bad_opening_is_usage_error`: `--opening abc` -> `SystemExit` raised with code `2` (argparse), stdout `""`

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ImportError: cannot import name 'main'`

- [ ] **Step 3: Implement `main(argv)` in `ledgerlite/cli.py`**

Read files with `pathlib.Path(...).read_text()`, catching `OSError` for the exit-1 path. Print errors with `print(..., file=sys.stderr)`, and the report with `sys.stdout.write(...)` (it already ends in a newline).

- [ ] **Step 4: Run the whole suite to verify everything passes**

Run: `python3 -m unittest -v`
Expected: PASS, all tests from all five test modules

- [ ] **Step 5: Verify the tool end to end by hand**

Run, from the repo root, with a scratch CSV and rules file matching the spec's example:
`python3 -m ledgerlite.cli report tx.csv --rules rules.txt --opening 100`
Expected: the spec's example report on stdout, `echo $?` prints `0`. Then delete the scratch files.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py test_cli.py
git commit -m "feat: add ledgerlite CLI entry point"
```
