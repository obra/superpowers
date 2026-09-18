# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `ledgerlite report` command that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six single-responsibility modules with no cross-imports beyond one direction: `model` (data) ← `parse` (text → transactions, raising `ParseError`) and `rules` (text → rule list, `categorize`) ← `balance` (closing balance) and `report` (totals + formatting) ← `cli` (argparse, file I/O, exit codes). All I/O and all error printing live in `cli.py`; every other module takes strings or objects and raises. Money is `decimal.Decimal` end to end — no float ever appears.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Python 3.11+, standard library only. No third-party dependencies.
- Amounts are `decimal.Decimal`, never `float`, at every stage including parsing and summing.
- Package layout is fixed by the spec: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Amounts print with exactly two fractional digits, a leading `-` for negatives, no thousands separators (`-12.50`, `0.00`, `1200.00`).
- Exit codes: 0 success, 1 transactions file unreadable, 2 malformed input.
- Error messages go to stderr and are prefixed `ledgerlite: `. Nothing is written to stdout on any error.
- Work directly on `main`; commit after each task.

## Decisions the spec leaves open

These are settled here so no task re-decides them:

- **Header row** is required and must be exactly `date,amount,description` (per-field whitespace stripped, case-insensitive). An empty file is a missing header. Both are line-1 parse errors.
- **Line numbers** in errors are physical file lines from `csv.reader(...).line_num`, so the header is line 1 and the first data row is line 2.
- **Wholly blank lines** in the CSV are skipped, not errors.
- **Date format** is exactly `YYYY-MM-DD`: a `^\d{4}-\d{2}-\d{2}$` regex guard, then `datetime.date.fromisoformat`. This rejects `20260304` and ISO week dates, which `fromisoformat` alone would accept.
- **Amounts** must be finite: `nan`, `Infinity`, `-Infinity` parse in `Decimal` but are malformed here.
- **Malformed rule lines** (blank, no `=`, empty substring, empty category) are skipped. The spec defines no error channel for the rules file, and a line with no `=` carries no meaning.
- **`--opening`** is validated by the same `parse_amount` used for rows, via an argparse `type=` callable, so a bad value is an argparse usage error and exits 2.
- **An unreadable `--rules` file** reuses the `cannot read` message and exit 1.
- **No running-balance accessor** is exposed: nothing in the report prints intermediate balances, so `balance.py` folds them internally and returns only the closing balance.
- **Fixed error message texts** (the spec says only "what is wrong"; tests assert these):
  `missing header row` · `expected header date,amount,description` · `expected 3 columns, got N` · `invalid date 'X'` · `invalid amount 'X'` · `amount 'X' has more than two decimal places`

## Review Focus

Input classes the spec implies but does not describe; each has a test in the task that owns the code.

- A CSV with no header row, or an empty file — a data row read as a header silently drops a transaction; must be a line-1 error, exit 2. (Task 1)
- `--opening abc` or `--opening 1.005` — must be a usage error with exit 2, not a traceback and not a silent `0`. (Task 5)
- `--rules` pointing at a missing or unreadable file — must print `cannot read` and exit 1, not traceback. (Task 5)
- Amount spellings `Decimal` accepts but a ledger must not: `nan`, `Infinity`. (Task 1)
- Negative-zero totals: a `-0.00` amount, or a category summing to negative zero, must print `0.00`. (Task 4)

---

### Task 1: Package skeleton, `Transaction`, and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py` (empty), `ledgerlite/model.py`, `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `model.Transaction` — frozen dataclass, fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`
  - `parse.ParseError(Exception)` — constructed `ParseError(line: int, message: str)`, attributes `.line: int`, `.message: str`
  - `parse.parse_amount(text: str) -> Decimal` — raises `ValueError` whose `str()` is the fixed message
  - `parse.parse_transactions(text: str) -> list[Transaction]` — input order preserved, raises `ParseError`

- [ ] **Step 1: Write the failing tests** in `test_parse.py`

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_transactions

HEADER = "date,amount,description\n"

class TestParseAmount(unittest.TestCase):
    def test_accepts_zero_one_and_two_decimal_places(self):
        self.assertEqual(parse_amount("1"), Decimal("1"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))

    def test_rejects_three_decimal_places(self):
        with self.assertRaises(ValueError) as ctx:
            parse_amount("1.005")
        self.assertEqual(str(ctx.exception), "amount '1.005' has more than two decimal places")

    def test_rejects_non_numeric(self):
        with self.assertRaises(ValueError) as ctx:
            parse_amount("abc")
        self.assertEqual(str(ctx.exception), "invalid amount 'abc'")

    def test_rejects_empty(self):
        with self.assertRaises(ValueError):
            parse_amount("")

    def test_rejects_nan_and_infinity(self):   # Review Focus
        for text in ("nan", "NaN", "Infinity", "-Infinity"):
            with self.assertRaises(ValueError):
                parse_amount(text)

class TestParseTransactions(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = HEADER + "2026-03-05,-7.50,Coffee Shop\n2026-03-04,2500.00,Salary\n"
        self.assertEqual(parse_transactions(text), [
            Transaction(date(2026, 3, 5), Decimal("-7.50"), "Coffee Shop"),
            Transaction(date(2026, 3, 4), Decimal("2500.00"), "Salary"),
        ])

    def test_header_only_yields_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_skips_blank_lines(self):
        text = HEADER + "\n2026-03-04,1.00,A\n\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_empty_file_is_missing_header(self):   # Review Focus
        with self.assertRaises(ParseError) as ctx:
            parse_transactions("")
        self.assertEqual((ctx.exception.line, ctx.exception.message), (1, "missing header row"))

    def test_data_row_as_first_line_is_header_error(self):   # Review Focus
        with self.assertRaises(ParseError) as ctx:
            parse_transactions("2026-03-04,1.00,A\n")
        self.assertEqual(ctx.exception.line, 1)
        self.assertEqual(ctx.exception.message, "expected header date,amount,description")

    def test_wrong_column_count_reports_line_number(self):
        text = HEADER + "2026-03-04,1.00,A\n2026-03-05,1.00\n"
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual((ctx.exception.line, ctx.exception.message), (3, "expected 3 columns, got 2"))

    def test_unparseable_date_reports_line_number(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(HEADER + "2026-13-45,1.00,A\n")
        self.assertEqual((ctx.exception.line, ctx.exception.message), (2, "invalid date '2026-13-45'"))

    def test_rejects_non_iso_date_spellings(self):
        for bad in ("20260304", "03/04/2026", "2026-W01-1"):
            with self.assertRaises(ParseError):
                parse_transactions(HEADER + f"{bad},1.00,A\n")

    def test_bad_amount_reports_line_number(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(HEADER + "2026-03-04,1.005,A\n")
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(ctx.exception.message, "amount '1.005' has more than two decimal places")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Create `ledgerlite/__init__.py` (empty) and `Transaction` in `ledgerlite/model.py`**

`@dataclass(frozen=True)` with the three fields from the Interfaces block, in that order.

- [ ] **Step 4: Implement `ledgerlite/parse.py`**

Define `ParseError`, then:
- `parse_amount(text: str) -> Decimal` — strip, `Decimal(...)` catching `decimal.InvalidOperation` → `ValueError(f"invalid amount {text!r}")`; reject non-finite via `is_finite()` with the same message; reject `as_tuple().exponent < -2` with the "more than two decimal places" message. Use `!r`-style quoting so messages read `'abc'`.
- `parse_date(text: str) -> date` (module-private helper) — regex guard then `date.fromisoformat`, raising `ValueError(f"invalid date {text!r}")`.
- `parse_transactions(text: str) -> list[Transaction]` — `csv.reader(io.StringIO(text))` so quoted fields and `reader.line_num` stay correct; first non-empty row is the header, validated per the decisions above; skip falsy rows; for each data row check `len(row) == 3`, then call the two helpers and wrap any `ValueError` as `ParseError(reader.line_num, str(exc))`.

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
- Consumes: nothing.
- Produces:
  - `rules.parse_rules(text: str) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order
  - `rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None`

- [ ] **Step 1: Write the failing tests** in `test_rules.py`

```python
import unittest
from ledgerlite.rules import categorize, parse_rules

class TestParseRules(unittest.TestCase):
    def test_parses_pairs_in_order(self):
        self.assertEqual(parse_rules("coffee=food\nrent=housing\n"),
                         [("coffee", "food"), ("rent", "housing")])

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_rules("  coffee = food  \n"), [("coffee", "food")])

    def test_splits_on_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_skips_blank_and_unparseable_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\nnonsense\n=food\ncoffee=\n"),
                         [("coffee", "food")])

class TestCategorize(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("MORNING COFFEE", self.RULES), "food")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "outings")]
        self.assertEqual(categorize("Coffee Shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee", []))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `parse_rules` and `categorize` in `ledgerlite/rules.py`**

`parse_rules`: per line, `split("=", 1)`, strip both parts, keep the pair only if both are non-empty. `categorize`: lowercase the description once, return the first rule's category whose lowercased substring is in it, else `None`.

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
- Consumes: `model.Transaction`.
- Produces:
  - `balance.sort_transactions(transactions: list[Transaction]) -> list[Transaction]` — by date, ties in input order
  - `balance.closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal`

- [ ] **Step 1: Write the failing tests** in `test_balance.py`

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.balance import closing_balance, sort_transactions
from ledgerlite.model import Transaction

def tx(day, amount, description="x"):
    return Transaction(date(2026, 3, day), Decimal(amount), description)

class TestSortTransactions(unittest.TestCase):
    def test_orders_by_date(self):
        rows = [tx(5, "1.00", "b"), tx(4, "1.00", "a")]
        self.assertEqual([t.description for t in sort_transactions(rows)], ["a", "b"])

    def test_ties_keep_input_order(self):
        rows = [tx(4, "1.00", "second"), tx(4, "1.00", "first")]
        self.assertEqual([t.description for t in sort_transactions(rows)],
                         ["second", "first"])

    def test_does_not_mutate_input(self):
        rows = [tx(5, "1.00", "b"), tx(4, "1.00", "a")]
        sort_transactions(rows)
        self.assertEqual([t.description for t in rows], ["b", "a"])

class TestClosingBalance(unittest.TestCase):
    def test_opening_plus_all_amounts(self):
        rows = [tx(5, "-7.50"), tx(4, "2500.00"), tx(6, "-900.00")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_no_transactions_returns_opening(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_result_is_decimal_not_float(self):
        self.assertIsInstance(closing_balance(Decimal("0"), [tx(4, "0.10")]), Decimal)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `sort_transactions` and `closing_balance` in `ledgerlite/balance.py`**

`sorted(..., key=…)` is stable, so it satisfies the tie rule and returns a new list. `closing_balance` folds the amounts in `sort_transactions` order onto `opening`; keep it a running total so the code matches the spec's wording.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: date-ordered running balance and closing balance"
```

---

### Task 4: Category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `model.Transaction`, `rules.categorize`, `balance.closing_balance`.
- Produces:
  - `report.UNCATEGORIZED = "uncategorized"`
  - `report.format_amount(amount: Decimal) -> str`
  - `report.category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[tuple[str, Decimal]]` — alphabetical, `uncategorized` last
  - `report.format_report(opening: Decimal, transactions: list[Transaction], rules: list[tuple[str, str]]) -> str` — ends with a trailing newline

- [ ] **Step 1: Write the failing tests** in `test_report.py`

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report

RULES = [("coffee", "food"), ("rent", "housing")]
EXAMPLE = [
    Transaction(date(2026, 3, 5), Decimal("-7.50"), "Coffee Shop"),
    Transaction(date(2026, 3, 1), Decimal("-900.00"), "Rent"),
    Transaction(date(2026, 3, 4), Decimal("2500.00"), "Salary"),
]

class TestFormatAmount(unittest.TestCase):
    def test_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_negative_zero_prints_as_zero(self):   # Review Focus
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

class TestCategoryTotals(unittest.TestCase):
    def test_alphabetical_with_uncategorized_last(self):
        self.assertEqual(category_totals(EXAMPLE, RULES), [
            ("food", Decimal("-7.50")),
            ("housing", Decimal("-900.00")),
            ("uncategorized", Decimal("2500.00")),
        ])

    def test_sums_multiple_transactions_per_category(self):
        rows = [Transaction(date(2026, 3, 1), Decimal("-1.25"), "Coffee"),
                Transaction(date(2026, 3, 2), Decimal("-2.25"), "coffee again")]
        self.assertEqual(category_totals(rows, RULES), [("food", Decimal("-3.50"))])

    def test_no_transactions_yields_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_without_rules_everything_is_uncategorized(self):
        self.assertEqual(category_totals(EXAMPLE, []),
                         [("uncategorized", Decimal("1592.50"))])

    def test_negative_zero_category_total(self):   # Review Focus
        rows = [Transaction(date(2026, 3, 1), Decimal("-0.00"), "Coffee")]
        self.assertEqual(format_report(Decimal("0"), rows, RULES),
                         "food: 0.00\n\nclosing balance: 0.00\n")

class TestFormatReport(unittest.TestCase):
    def test_matches_spec_example(self):
        self.assertEqual(format_report(Decimal("100"), EXAMPLE, RULES),
                         "food: -7.50\n"
                         "housing: -900.00\n"
                         "uncategorized: 2500.00\n"
                         "\n"
                         "closing balance: 1692.50\n")

    def test_no_transactions_prints_only_closing_balance(self):
        self.assertEqual(format_report(Decimal("100"), [], RULES),
                         "\nclosing balance: 100.00\n")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `ledgerlite/report.py`**

- `format_amount`: `quantize(Decimal("0.01"))`, formatted with `f"{...:f}"` to avoid exponent notation; map any zero result to `Decimal("0.00")` first so negative zero prints unsigned.
- `category_totals`: accumulate into a dict keyed by `categorize(...) or UNCATEGORIZED`, then return `sorted` pairs excluding `UNCATEGORIZED`, appending it last if present. (A rules file whose category is literally `uncategorized` merges with the implicit bucket — same key, listed last.)
- `format_report`: `"<name>: <amount>"` per category, then `""`, then `f"closing balance: {...}"` using `balance.closing_balance`; join with `"\n"` and end with `"\n"`.

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
- Create: `ledgerlite/cli.py`, `ledgerlite/__main__.py`
- Test: `test_cli.py`

`__main__.py` is not in the spec's layout but is needed for `python3 -m ledgerlite report ...` to exist at all; it is three lines calling `sys.exit(main())`.

**Interfaces:**
- Consumes: `parse.ParseError`, `parse.parse_amount`, `parse.parse_transactions`, `rules.parse_rules`, `report.format_report`.
- Produces: `cli.main(argv: list[str] | None = None) -> int`, printing the report to stdout and errors to stderr.

- [ ] **Step 1: Write the failing tests** in `test_cli.py`

```python
import io
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from tempfile import TemporaryDirectory
from ledgerlite.cli import main

CSV = ("date,amount,description\n"
       "2026-03-05,-7.50,Coffee Shop\n"
       "2026-03-01,-900.00,Rent\n"
       "2026-03-04,2500.00,Salary\n")

class CliTestCase(unittest.TestCase):
    def setUp(self):
        self._tmp = TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.dir = Path(self._tmp.name)

    def write(self, name, text):
        path = self.dir / name
        path.write_text(text, encoding="utf-8")
        return str(path)

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

class TestReportCommand(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        txns = self.write("t.csv", CSV)
        rules = self.write("r.txt", "coffee=food\nrent=housing\n")
        code, out, err = self.run_cli("report", txns, "--rules", rules, "--opening", "100")
        self.assertEqual((code, err), (0, ""))
        self.assertEqual(out, "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n"
                              "\nclosing balance: 1692.50\n")

    def test_opening_defaults_to_zero_and_rules_are_optional(self):
        code, out, _ = self.run_cli("report", self.write("t.csv", CSV))
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

class TestErrors(CliTestCase):
    def test_unreadable_transactions_file(self):
        missing = str(self.dir / "nope.csv")
        code, out, err = self.run_cli("report", missing)
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_malformed_row_rejects_whole_file(self):
        txns = self.write("t.csv", "date,amount,description\n2026-03-04,1.005,A\n")
        code, out, err = self.run_cli("report", txns)
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(err, f"ledgerlite: {txns}:2: "
                              "amount '1.005' has more than two decimal places\n")

    def test_unreadable_rules_file(self):   # Review Focus
        txns = self.write("t.csv", CSV)
        missing = str(self.dir / "nope.txt")
        code, out, err = self.run_cli("report", txns, "--rules", missing)
        self.assertEqual((code, out), (1, ""))
        self.assertIn(f"cannot read {missing}", err)

    def test_bad_opening_amount_is_usage_error(self):   # Review Focus
        txns = self.write("t.csv", CSV)
        for bad in ("abc", "1.005"):
            with self.assertRaises(SystemExit) as ctx:
                self.run_cli("report", txns, "--opening", bad)
            self.assertEqual(ctx.exception.code, 2)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `main` in `ledgerlite/cli.py`, plus `ledgerlite/__main__.py`**

- Parser: `prog="ledgerlite"`, a required `report` subcommand with positional `transactions`, `--rules`, and `--opening` using `type=` a wrapper that calls `parse_amount` and re-raises `ValueError` as `argparse.ArgumentTypeError`, `default=Decimal("0")`.
- One private helper reads a path with `Path(...).read_text(encoding="utf-8")` and raises a local error type carrying the message; `OSError` → `e.strerror`, `UnicodeDecodeError` → `invalid UTF-8`. Both transactions and rules go through it, so the `cannot read` wording exists once.
- Order: read transactions → read rules (empty rule list when `--rules` is absent) → `parse_transactions` → `format_report` → print. `ParseError` is caught around parsing only, and nothing is printed to stdout before parsing succeeds.
- Error prints use `file=sys.stderr`; return 1 for read failures, 2 for `ParseError`, 0 otherwise.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS

- [ ] **Step 5: Verify the whole suite and the tool end to end**

Run: `python3 -m unittest`
Expected: all tests from Tasks 1–5 pass.

Run: `printf 'date,amount,description\n2026-03-05,-7.50,Coffee Shop\n2026-03-01,-900.00,Rent\n2026-03-04,2500.00,Salary\n' > /tmp/t.csv && printf 'coffee=food\nrent=housing\n' > /tmp/r.txt && python3 -m ledgerlite report /tmp/t.csv --rules /tmp/r.txt --opening 100`
Expected: exactly the report in `design.md`'s example.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI"
```
