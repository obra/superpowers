# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only CLI that reads a bank-transaction CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Five pure modules with no I/O (`model`, `parse`, `rules`, `balance`, `report`) wrapped by a thin `cli` module that owns all file reading, error messages, and exit codes. Parsing raises `ParseError` carrying a line number and message; the CLI is the only place that knows the path and turns that into `ledgerlite: <path>:<line>: <message>`. All money is `decimal.Decimal` end to end — no `float` appears anywhere in the package.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `dataclasses`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies.
- Amounts are parsed and summed as `decimal.Decimal`, never `float`.
- Package layout is exactly the tree in `design.md` ("Package layout"), plus
  `ledgerlite/__main__.py` (see Task 5) so the tool is runnable as
  `python3 -m ledgerlite`.
- Tests live at the repo root as `test_<module>.py` and run with
  `python3 -m unittest`.
- Error messages go to stderr and are prefixed `ledgerlite: `. Exit codes:
  0 success, 1 unreadable input file, 2 malformed row.
- Amounts are printed with exactly two fractional digits, a leading `-` only
  for negative values, and no thousands separators.

## Review Focus

Input classes the spec implies but does not describe, each pinned by a test in the task that owns the code:

1. **A CSV with a trailing newline or blank lines.** Nearly every real file has one; a naive column-count check would reject the whole file. Blank rows are skipped. (Task 1)
2. **A missing or misspelled header row.** The spec assumes a header; if the first row is silently discarded, a real transaction vanishes. A first row that is not `date,amount,description` is a malformed-file error at line 1. (Task 1)
3. **Amounts `nan`, `inf`, `Infinity`.** `Decimal()` accepts these happily and they would poison every total that follows. They are malformed amounts. (Task 1)
4. **A `--rules` path that cannot be read.** The spec defines the unreadable-file error only for TRANSACTIONS; silently treating a typo'd rules path as "no rules" would print a plausible but wrong report. Same message and exit 1. (Task 5)
5. **A category whose total is zero, or an amount of `-0.00`.** The spec says a leading `-` for negatives, and zero is not negative; `Decimal` preserves the sign of negative zero. `-0.00` formats as `0.00`. (Task 4)

---

### Task 1: Transaction model and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py` (empty package marker)
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass, fields in order
    `date: datetime.date`, `amount: decimal.Decimal`, `description: str`.
  - `ledgerlite.parse.ParseError(Exception)` — constructed
    `ParseError(line: int, message: str)`, with attributes `.line` and
    `.message`; `str(e)` is `message`.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` —
    returns rows in file order, raises `ParseError` on the first bad row.

Exact `ParseError.message` wording (the CLI test in Task 5 depends on these):

| condition | message |
|---|---|
| first row is not the header | `expected header date,amount,description` |
| row has n != 3 fields | `expected 3 columns, got {n}` |
| date not `YYYY-MM-DD` | `invalid date: '{value}'` |
| amount not a finite decimal number | `invalid amount: '{value}'` |
| amount has > 2 fractional digits | `amount has more than two fractional digits: '{value}'` |

- [ ] **Step 1: Write the failing tests**

`test_parse.py`, using `unittest.TestCase`, a module-level
`HEADER = "date,amount,description\n"`, and a helper
`self.assertRaisesParseError(text, line, message)` that asserts both `.line`
and `.message`:

```python
def test_returns_rows_in_file_order(self):
    txns = parse_transactions(HEADER + "2026-03-05,-7.50,Coffee Shop\n2026-03-04,2500.00,Payroll\n")
    self.assertEqual([t.description for t in txns], ["Coffee Shop", "Payroll"])
    self.assertEqual(txns[0].date, date(2026, 3, 5))
    self.assertEqual(txns[0].amount, Decimal("-7.50"))
    self.assertIsInstance(txns[0].amount, Decimal)

def test_accepts_one_or_two_fractional_digits(self):
    txns = parse_transactions(HEADER + "2026-03-04,1.5,a\n2026-03-04,1.50,b\n2026-03-04,3,c\n")
    self.assertEqual([t.amount for t in txns], [Decimal("1.5"), Decimal("1.50"), Decimal("3")])

def test_rejects_three_fractional_digits(self):
    # line 2, "amount has more than two fractional digits: '1.005'"

def test_rejects_wrong_column_count(self):
    # HEADER + good row + "2026-03-04,-1.00\n" -> line 3, "expected 3 columns, got 2"

def test_rejects_unparseable_date(self):
    # "2026-13-40" and "03/04/2026" -> line 2, "invalid date: '...'"

def test_rejects_non_numeric_amount(self):
    # "twelve" and "" -> line 2, "invalid amount: '...'"

def test_rejects_nan_and_infinity_amounts(self):
    # "nan", "inf", "-Infinity" -> line 2, "invalid amount: '...'"

def test_skips_blank_rows(self):
    txns = parse_transactions(HEADER + "2026-03-04,1.00,a\n\n2026-03-05,2.00,b\n\n")
    self.assertEqual(len(txns), 2)

def test_rejects_missing_header(self):
    # "2026-03-04,1.00,a\n" -> line 1, "expected header date,amount,description"

def test_empty_file_and_header_only_file(self):
    self.assertEqual(parse_transactions(""), [])
    self.assertEqual(parse_transactions(HEADER), [])
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Implement `Transaction` in `ledgerlite/model.py`**

`@dataclass(frozen=True)` with the three fields above.

- [ ] **Step 4: Implement `ParseError` and `parse_transactions` in `ledgerlite/parse.py`**

Approach decisions to follow exactly:
- Read rows with `csv.reader(io.StringIO(text))`; use `reader.line_num` as the
  reported line number.
- A row is blank (and skipped, including the header check) when it is empty or
  every field is whitespace.
- The header check compares `[f.strip().lower() for f in row]` against
  `["date", "amount", "description"]` on the first non-blank row. An empty
  input is an empty list, not a missing-header error.
- Dates: `datetime.datetime.strptime(value.strip(), "%Y-%m-%d").date()`, so only
  the spec's `YYYY-MM-DD` form is accepted (`date.fromisoformat` is looser on
  3.11+).
- Amounts: `Decimal(value.strip())` catching `decimal.InvalidOperation`; then
  reject unless `amount.is_finite()`; then reject unless
  `-amount.as_tuple().exponent <= 2`.
- `description` is kept verbatim, not stripped.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Transaction records"
```

---

### Task 2: Rules file and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str) -> list[tuple[str, str]]` — list of
    `(substring, category)` in file order.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None`
    — the category of the first rule whose substring occurs in the description,
    case-insensitively; `None` if none match.

- [ ] **Step 1: Write the failing tests**

```python
def test_parses_rules_in_order(self):
    self.assertEqual(parse_rules("coffee=food\nrent=housing\n"), [("coffee", "food"), ("rent", "housing")])

def test_strips_whitespace_around_substring_and_category(self):
    self.assertEqual(parse_rules("  coffee = food  \n"), [("coffee", "food")])

def test_splits_on_first_equals_only(self):
    self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

def test_skips_blank_lines_and_lines_without_equals_and_empty_substrings(self):
    self.assertEqual(parse_rules("\n   \nnonsense\n=food\ncoffee=food\n"), [("coffee", "food")])

def test_first_matching_rule_wins(self):
    rules = [("coffee", "food"), ("coffee shop", "outings")]
    self.assertEqual(categorize("Coffee Shop #4", rules), "food")

def test_matching_is_case_insensitive_both_ways(self):
    self.assertEqual(categorize("COFFEE SHOP", [("coffee", "food")]), "food")
    self.assertEqual(categorize("coffee shop", [("COFFEE", "food")]), "food")

def test_returns_none_when_nothing_matches(self):
    self.assertIsNone(categorize("Payroll", [("coffee", "food")]))
    self.assertIsNone(categorize("Payroll", []))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `parse_rules` and `categorize` in `ledgerlite/rules.py`**

Split each line on the first `=` (`str.split("=", 1)`), strip both parts, drop
lines with no `=` or an empty substring. `categorize` lowercases the
description once and each substring before testing containment. A rule's
stored substring and category keep their original case.

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
  - `ledgerlite.balance.order_transactions(transactions: list[Transaction]) -> list[Transaction]`
    — sorted by date, ties keeping input order.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal`
    — `opening` plus each amount added in `order_transactions` order.

- [ ] **Step 1: Write the failing tests**

Use a helper `txn(day, amount, description="x")` building a `Transaction` in
March 2026.

```python
def test_orders_by_date(self):
    ordered = order_transactions([txn(5, "1.00"), txn(1, "2.00"), txn(3, "3.00")])
    self.assertEqual([t.date.day for t in ordered], [1, 3, 5])

def test_same_date_keeps_input_order(self):
    ordered = order_transactions([txn(4, "1.00", "second-in-file"), txn(4, "2.00", "first-in-file")])
    self.assertEqual([t.description for t in ordered], ["second-in-file", "first-in-file"])

def test_closing_balance_matches_design_example(self):
    txns = [txn(5, "-7.50"), txn(4, "-900.00"), txn(6, "2500.00")]
    self.assertEqual(closing_balance(Decimal("100"), txns), Decimal("1692.50"))

def test_closing_balance_of_no_transactions_is_opening(self):
    self.assertEqual(closing_balance(Decimal("100.00"), []), Decimal("100.00"))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `order_transactions` and `closing_balance` in `ledgerlite/balance.py`**

`sorted(transactions, key=lambda t: t.date)` — `sorted` is stable, which is what
"ties keeping input order" requires. `closing_balance` starts at `opening` and
accumulates over `order_transactions(transactions)` so the running balance is
defined in the spec's order.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: order transactions by date and compute closing balance"
```

---

### Task 4: Category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 2).
- Produces:
  - `ledgerlite.report.format_amount(amount: Decimal) -> str` — exactly two
    fractional digits; `-` only for values less than zero.
  - `ledgerlite.report.category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[tuple[str, Decimal]]`
    — named categories alphabetically, then `("uncategorized", total)` last;
    a category with no transactions is absent entirely.
  - `ledgerlite.report.format_report(totals: list[tuple[str, Decimal]], closing: Decimal) -> str`
    — the report text with no trailing newline.

- [ ] **Step 1: Write the failing tests**

```python
def test_format_amount(self):
    self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
    self.assertEqual(format_amount(Decimal("1200")), "1200.00")
    self.assertEqual(format_amount(Decimal("0")), "0.00")
    self.assertEqual(format_amount(Decimal("12345678.90")), "12345678.90")

def test_format_amount_never_prints_negative_zero(self):
    self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
    self.assertEqual(format_amount(Decimal("-1.50") + Decimal("1.50")), "0.00")

def test_totals_are_alphabetical_with_uncategorized_last(self):
    rules = [("coffee", "food"), ("rent", "housing"), ("gym", "aaa")]
    txns = [txn("Payroll", "2500.00"), txn("Gym", "-30.00"), txn("Rent", "-900.00"), txn("Coffee", "-7.50")]
    self.assertEqual(category_totals(txns, rules),
                     [("aaa", Decimal("-30.00")), ("food", Decimal("-7.50")),
                      ("housing", Decimal("-900.00")), ("uncategorized", Decimal("2500.00"))])

def test_totals_sum_multiple_transactions_in_one_category(self):
    # two coffee rows -> single ("food", sum) entry

def test_no_uncategorized_entry_when_everything_matches(self):
    self.assertEqual(category_totals([txn("Coffee", "-7.50")], [("coffee", "food")]), [("food", Decimal("-7.50"))])

def test_all_uncategorized_without_rules(self):
    self.assertEqual(category_totals([txn("Coffee", "-7.50")], []), [("uncategorized", Decimal("-7.50"))])

def test_format_report_matches_design_example(self):
    totals = [("food", Decimal("-7.50")), ("housing", Decimal("-900.00")), ("uncategorized", Decimal("2500.00"))]
    self.assertEqual(format_report(totals, Decimal("1692.50")),
                     "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50")

def test_format_report_with_no_categories(self):
    self.assertEqual(format_report([], Decimal("100.00")), "\nclosing balance: 100.00")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement the three functions in `ledgerlite/report.py`**

- `format_amount`: `amount.quantize(Decimal("0.01"))` (inputs have at most two
  fractional digits, so this never rounds), then format the value; special-case
  a zero result so negative zero prints without the sign.
- `category_totals`: accumulate into a `dict[str | None, Decimal]` keyed by
  `categorize(t.description, rules)`, then emit `sorted()` named keys followed
  by the `None` key as `"uncategorized"` if present.
- `format_report`: one `"{name}: {format_amount(total)}"` line per total, then
  an empty line, then `"closing balance: {format_amount(closing)}"`, joined with
  `"\n"`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: per-category totals and report formatting"
```

---

### Task 5: CLI entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_transactions`, `ParseError` (Task 1); `parse_rules` (Task 2);
  `closing_balance` (Task 3); `category_totals`, `format_report` (Task 4).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int`.

Behavior to implement, from the spec:
- `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`
- success: report to stdout, return 0. `--opening` defaults to `Decimal("0")`.
- unreadable TRANSACTIONS or RULES: `ledgerlite: cannot read <path>: <reason>`
  to stderr, return 1, nothing on stdout.
- `ParseError`: `ledgerlite: <path>:<line>: <message>` to stderr, return 2,
  nothing on stdout.

- [ ] **Step 1: Write the failing tests**

`test_cli.py` uses `tempfile.TemporaryDirectory` plus a helper
`invoke(*args) -> (code, out, err)` that calls `main(list(args))` under
`contextlib.redirect_stdout`/`redirect_stderr` with `io.StringIO`. Name it
`invoke`, not `run` — `TestCase.run` is the method unittest calls to execute
the test.

```python
def test_reports_design_example(self):
    # transactions: 2026-03-05,-7.50,Coffee Shop / 2026-03-04,-900.00,March Rent / 2026-03-06,2500.00,Payroll
    # rules: coffee=food / rent=housing
    code, out, err = self.invoke("report", txn_path, "--rules", rules_path, "--opening", "100")
    self.assertEqual(code, 0)
    self.assertEqual(out, "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50\n")
    self.assertEqual(err, "")

def test_without_rules_everything_is_uncategorized(self):
    # no --rules -> "uncategorized: ...\n\nclosing balance: ...\n"

def test_opening_defaults_to_zero(self):
    # single -7.50 row, no --opening -> "closing balance: -7.50"

def test_header_only_file_reports_opening_balance(self):
    # code 0, out == "\nclosing balance: 100.00\n"

def test_missing_transactions_file(self):
    code, out, err = self.invoke("report", os.path.join(self.dir, "nope.csv"))
    self.assertEqual(code, 1)
    self.assertEqual(out, "")
    self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

def test_missing_rules_file(self):
    # valid transactions, --rules pointing at a nonexistent path
    # code 1, out == "", err == "ledgerlite: cannot read <rules path>: No such file or directory\n"

def test_malformed_row_reports_path_and_line_and_prints_nothing(self):
    # third line "2026-03-04,1.005,Odd"
    self.assertEqual(code, 2)
    self.assertEqual(out, "")
    self.assertEqual(err, f"ledgerlite: {path}:3: amount has more than two fractional digits: '1.005'\n")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `main` in `ledgerlite/cli.py`**

- `argparse.ArgumentParser(prog="ledgerlite")` with a required `report`
  subcommand: positional `transactions`, `--rules`, `--opening` with
  `default=Decimal("0")` and a `type=` converter that wraps
  `Decimal(value)` and raises `argparse.ArgumentTypeError(f"invalid amount: {value!r}")`
  on `decimal.InvalidOperation` or a non-finite value.
- A single private helper reads a path as text (`encoding="utf-8"`,
  `newline=""`) and on `OSError` prints
  `f"ledgerlite: cannot read {path}: {exc.strerror}"` to stderr; `main` returns 1.
  Both TRANSACTIONS and RULES go through it.
- Wrap `parse_transactions` in `try/except ParseError` and print
  `f"ledgerlite: {path}:{exc.line}: {exc.message}"` to stderr, returning 2
  before anything reaches stdout.
- On success: `print(format_report(category_totals(txns, rules), closing_balance(opening, txns)))`.

- [ ] **Step 4: Implement `ledgerlite/__main__.py`**

`raise SystemExit(main())` so the tool runs as `python3 -m ledgerlite`.

- [ ] **Step 5: Run the full suite**

Run: `python3 -m unittest -v`
Expected: PASS — every test from Tasks 1–5

- [ ] **Step 6: Verify the tool by hand**

Run: `python3 -m ledgerlite report <a temp csv> --rules <a temp rules file> --opening 100`
Expected: the report on stdout, exit status 0 (`echo $?`)

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: ledgerlite report CLI"
```
