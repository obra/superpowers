# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A stdlib-only command-line tool that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired together only in `cli.py`: parsing (CSV text → `Transaction` list, raising `ParseError` with a line number), rules (rules text → substring/category pairs, plus lookup), balance (date ordering and closing balance), report (category totals and formatting). Every module is pure — it takes strings or lists and returns values — so all file I/O, exit codes, and stderr live in `cli.py`.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `dataclasses`, `re`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Python 3.11+, standard library only — no third-party dependencies.
- Money is always `decimal.Decimal`, never `float`. No arithmetic on amounts goes through `float` at any point.
- Package lives at `ledgerlite/`; tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Amounts are printed with exactly two fractional digits, a leading `-` only for negatives, and no thousands separators (`-12.50`, `0.00`, `1200.00`).
- Error messages are exactly: `ledgerlite: cannot read <path>: <reason>` (exit 1) and `ledgerlite: <path>:<line>: <what is wrong>` (exit 2). Both go to stderr; on exit 2 nothing is written to stdout.

## Review Focus

These are input classes the spec implies but does not call out. Each one's test is assigned to the task that owns the code.

1. **Amounts that `Decimal()` happily accepts but are not decimal numbers** — `NaN`, `Infinity`, `1e3`, `+1.50`, `1,000.00`, empty — must be rejected as malformed, not silently parsed. (Task 1)
2. **Loose date forms that `date.fromisoformat()` accepts on 3.11+** — `20260304`, `2026-3-4`, `2026-W10-3` — must be rejected; the spec pins `2026-03-04`. (Task 1)
3. **A `--rules` path that cannot be read** — the spec only names TRANSACTIONS, but the reasonable expectation is the same `cannot read` message and exit 1, not a traceback. (Task 5)
4. **Negative zero** — a `-0.00` amount or total must print `0.00`; the leading `-` is for negatives, and zero is not negative. (Task 4)
5. **A file with no transactions** (header only, or empty) — must print no category lines and a closing balance equal to the opening amount, not crash and not invent an `uncategorized: 0.00` line. (Task 4)

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
  - `model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that order.
  - `parse.ParseError(Exception)` with attributes `line: int` and `message: str`, constructed as `ParseError(line, message)`.
  - `parse.parse_transactions(lines: Iterable[str]) -> list[Transaction]` — takes any iterable of CSV lines (an open file, or a list of strings), returns transactions in input order. No file I/O.
  - `parse.AMOUNT_PATTERN` — the module-level compiled amount regex (below), reused by Task 5 for `--opening`.

**Decisions this task pins:**
- The first row is the header and is skipped unconditionally; its contents are not validated.
- A row with no fields at all (a blank line) is skipped. A row with a field count other than 3 is an error.
- Dates are parsed with `datetime.datetime.strptime(text, "%Y-%m-%d").date()`, *not* `date.fromisoformat`, so only the spec's form is accepted.
- An amount must match `AMOUNT_PATTERN = re.compile(r"-?\d+(\.\d{1,2})?")` via `fullmatch` before being passed to `Decimal`. This rejects `NaN`, `Infinity`, exponents, leading `+`, thousands separators, and more than two fractional digits.
- The date and amount fields are stripped of surrounding whitespace before validation; the description is kept verbatim.
- Checks run in this order per row: field count, then date, then amount. The first bad row raises immediately; later rows are not examined.
- Line numbers come from `csv.reader`'s `line_num`, so the header is line 1 and the first data row is line 2.

- [ ] **Step 1: Write the failing tests**

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_transactions

HEADER = "date,amount,description\n"


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        rows = parse_transactions([HEADER, "2026-03-04,-7.50,Coffee Shop\n", "2026-03-01,2500.00,Salary\n"])
        self.assertEqual(rows, [
            Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop"),
            Transaction(date(2026, 3, 1), Decimal("2500.00"), "Salary"),
        ])

    def test_header_only_yields_no_transactions(self):
        self.assertEqual(parse_transactions([HEADER]), [])

    def test_empty_input_yields_no_transactions(self):
        self.assertEqual(parse_transactions([]), [])

    def test_blank_lines_are_skipped(self):
        rows = parse_transactions([HEADER, "\n", "2026-03-04,-7.50,Coffee\n", "\n"])
        self.assertEqual(len(rows), 1)

    def test_accepts_one_or_two_fractional_digits(self):
        rows = parse_transactions([HEADER, "2026-03-04,1.5,a\n", "2026-03-04,1.50,b\n", "2026-03-04,-12,c\n"])
        self.assertEqual([r.amount for r in rows], [Decimal("1.5"), Decimal("1.50"), Decimal("-12")])

    def test_strips_whitespace_around_date_and_amount(self):
        rows = parse_transactions([HEADER, " 2026-03-04 , -7.50 ,  Coffee Shop \n"])
        self.assertEqual(rows[0].date, date(2026, 3, 4))
        self.assertEqual(rows[0].amount, Decimal("-7.50"))
        self.assertEqual(rows[0].description, "  Coffee Shop ")

    def test_wrong_column_count_is_an_error(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions([HEADER, "2026-03-04,-7.50\n"])
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(ctx.exception.message, "expected 3 columns, got 2")

    def test_rejects_bad_dates(self):
        for text in ["2026-13-40", "20260304", "2026-3-4", "2026-W10-3", "04/03/2026", ""]:
            with self.subTest(text=text), self.assertRaises(ParseError) as ctx:
                parse_transactions([HEADER, f"{text},-7.50,Coffee\n"])
            self.assertEqual(ctx.exception.message, f"invalid date '{text}'")

    def test_rejects_bad_amounts(self):
        for text in ["1.005", "abc", "", "NaN", "Infinity", "1e3", "+1.50", "1,000.00", "-"]:
            with self.subTest(text=text), self.assertRaises(ParseError) as ctx:
                parse_transactions([HEADER, f'2026-03-04,"{text}",Coffee\n'])
            self.assertEqual(ctx.exception.message, f"invalid amount '{text}'")

    def test_reports_the_first_bad_row_only(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions([HEADER, "2026-03-04,-7.50,ok\n", "nope,-1.00,bad\n", "also-bad,x,bad\n"])
        self.assertEqual(ctx.exception.line, 3)
        self.assertEqual(ctx.exception.message, "invalid date 'nope'")
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Implement `ledgerlite/__init__.py`, `ledgerlite/model.py`, and `ledgerlite/parse.py`**

`model.Transaction` is a `@dataclass(frozen=True)`. `parse.ParseError.__init__(self, line, message)` stores both attributes and passes `message` to `super().__init__`. `parse_transactions` wraps the iterable in `csv.reader` and applies the decisions listed above.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

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
  - `rules.parse_rules(lines: Iterable[str]) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order.
  - `rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — the category of the first matching rule, or `None`.

**Decisions this task pins:**
- A rule line splits on its *first* `=`; later `=` characters belong to the category.
- Lines that are blank/whitespace-only, contain no `=`, or have an empty substring before the `=` are skipped. A bad rules file is never an error — the spec defines no exit code for one.
- The substring and category keep their text as written except for surrounding whitespace, which is stripped from both.
- Matching is `substring.lower() in description.lower()`.

- [ ] **Step 1: Write the failing tests**

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_rules_in_file_order(self):
        self.assertEqual(parse_rules(["coffee=food\n", "rent=housing\n"]), [("coffee", "food"), ("rent", "housing")])

    def test_splits_on_first_equals(self):
        self.assertEqual(parse_rules(["a=b=c\n"]), [("a", "b=c")])

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_rules([" coffee = food \n"]), [("coffee", "food")])

    def test_skips_blank_and_unparseable_lines(self):
        self.assertEqual(parse_rules(["\n", "   \n", "no-equals-here\n", "=food\n", "coffee=food\n"]), [("coffee", "food")])


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("MORNING COFFEE", self.RULES), "food")
        self.assertEqual(categorize("Monthly Rent", self.RULES), "housing")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("shop", "retail")]
        self.assertEqual(categorize("Coffee Shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee Shop", []))
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `parse_rules` and `categorize` in `ledgerlite/rules.py`**

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (all tests)

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
- Consumes: `model.Transaction` (Task 1).
- Produces:
  - `balance.order_by_date(transactions: list[Transaction]) -> list[Transaction]` — new list, sorted by `date`, ties keeping input order.
  - `balance.closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — `opening` plus each amount in the order given; returns `opening` for an empty list.

**Decisions this task pins:**
- `order_by_date` returns a new list and does not mutate its argument; tie stability comes from `sorted`'s stability (no tiebreaker key, no index field on `Transaction`).

- [ ] **Step 1: Write the failing tests**

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class OrderByDateTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(4, "-7.50"), txn(1, "2500.00")]
        self.assertEqual([t.date.day for t in order_by_date(rows)], [1, 4])

    def test_ties_keep_input_order(self):
        rows = [txn(1, "1.00", "first"), txn(1, "2.00", "second")]
        self.assertEqual([t.description for t in order_by_date(rows)], ["first", "second"])

    def test_does_not_mutate_input(self):
        rows = [txn(4, "-7.50"), txn(1, "2500.00")]
        order_by_date(rows)
        self.assertEqual([t.date.day for t in rows], [4, 1])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_amounts_to_opening(self):
        rows = [txn(1, "2500.00"), txn(2, "-900.00"), txn(3, "-7.50")]
        self.assertEqual(closing_balance(rows, Decimal("100")), Decimal("1692.50"))

    def test_no_transactions_returns_opening(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))

    def test_result_is_decimal_not_float(self):
        self.assertIsInstance(closing_balance([txn(1, "0.10")], Decimal("0.20")), Decimal)
        self.assertEqual(closing_balance([txn(1, "0.10")], Decimal("0.20")), Decimal("0.30"))
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `order_by_date` and `closing_balance` in `ledgerlite/balance.py`**

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (all tests)

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
- Consumes: `model.Transaction` (Task 1), `rules.categorize` (Task 2), `balance.closing_balance` (Task 3).
- Produces:
  - `report.format_amount(amount: Decimal) -> str`
  - `report.category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[tuple[str, Decimal]]` — alphabetical by category, with `uncategorized` last if present.
  - `report.format_report(transactions: list[Transaction], rules: list[tuple[str, str]], opening: Decimal) -> str` — the whole report, ending in a single `\n`. Assumes `transactions` is already date-ordered (Task 5 calls `order_by_date` first).

**Decisions this task pins:**
- `format_amount` is `f"{amount:.2f}"`, with zero normalized first (`if amount == 0: amount = abs(amount)`) so `Decimal("-0.00")` prints `0.00`.
- A category appears only if at least one transaction has it; `uncategorized` is not printed when every transaction matched a rule, and no category lines are printed when there are no transactions.
- The blank line before `closing balance:` is always present, so a report with no categories starts with a blank line.

- [ ] **Step 1: Write the failing tests**

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report

RULES = [("coffee", "food"), ("rent", "housing")]


def txn(day, amount, description):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class FormatAmountTest(unittest.TestCase):
    def test_formats_two_fractional_digits(self):
        cases = [("-12.5", "-12.50"), ("0", "0.00"), ("1200", "1200.00"), ("1.5", "1.50"), ("1234567.89", "1234567.89")]
        for value, expected in cases:
            with self.subTest(value=value):
                self.assertEqual(format_amount(Decimal(value)), expected)

    def test_negative_zero_prints_without_sign(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_per_category_alphabetically_with_uncategorized_last(self):
        rows = [txn(1, "2500.00", "Salary"), txn(2, "-900.00", "Rent"), txn(3, "-7.50", "Coffee Shop")]
        self.assertEqual(category_totals(rows, RULES), [
            ("food", Decimal("-7.50")),
            ("housing", Decimal("-900.00")),
            ("uncategorized", Decimal("2500.00")),
        ])

    def test_omits_uncategorized_when_everything_matches(self):
        self.assertEqual(category_totals([txn(1, "-7.50", "Coffee")], RULES), [("food", Decimal("-7.50"))])

    def test_no_rules_puts_everything_in_uncategorized(self):
        rows = [txn(1, "-7.50", "Coffee"), txn(2, "-2.50", "Rent")]
        self.assertEqual(category_totals(rows, []), [("uncategorized", Decimal("-10.00"))])

    def test_no_transactions_yields_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])


class FormatReportTest(unittest.TestCase):
    def test_matches_the_spec_example(self):
        rows = [txn(1, "2500.00", "Salary"), txn(2, "-900.00", "Rent"), txn(3, "-7.50", "Coffee Shop")]
        self.assertEqual(
            format_report(rows, RULES, Decimal("100")),
            "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50\n",
        )

    def test_no_transactions_reports_only_the_opening_balance(self):
        self.assertEqual(format_report([], RULES, Decimal("100")), "\nclosing balance: 100.00\n")
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `format_amount`, `category_totals`, and `format_report` in `ledgerlite/report.py`**

`category_totals` accumulates into a dict keyed by `categorize(...) or "uncategorized"`, then sorts alphabetically with `uncategorized` forced last (e.g. `sorted(..., key=lambda kv: (kv[0] == "uncategorized", kv[0]))`). `format_report` joins `f"{name}: {format_amount(total)}"` lines, then a blank line, then `f"closing balance: {format_amount(closing_balance(transactions, opening))}"`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add category totals and report formatting"
```

---

### Task 5: CLI entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.parse_transactions`/`parse.ParseError` (Task 1), `rules.parse_rules` (Task 2), `balance.order_by_date` (Task 3), `report.format_report` (Task 4).
- Produces: `cli.main(argv: list[str] | None = None) -> int`. `__main__.py` is three lines: `import sys`, `from ledgerlite.cli import main`, `sys.exit(main())`.

**Decisions this task pins:**
- Command line: `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`, built with `argparse` subparsers; `report` is the only subcommand. Run as `python3 -m ledgerlite report ...`. (`__main__.py` is not in the spec's layout; it is what makes the package runnable.)
- `--opening` defaults to `Decimal("0")` and uses an argparse `type=` callable that applies Task 1's amount pattern and raises `argparse.ArgumentTypeError(f"invalid amount '{text}'")`. Invalid arguments therefore exit via argparse's own `SystemExit(2)` with its usage message — `main` does not catch it.
- Files are opened with `open(path, newline="", encoding="utf-8")`. `OSError` becomes `ledgerlite: cannot read {path}: {exc.strerror}` on stderr, return 1 — for the transactions path *and* the rules path.
- `ParseError` becomes `ledgerlite: {path}:{err.line}: {err.message}` on stderr, return 2, with nothing written to stdout. The transactions file is read and fully parsed before the rules file is opened, so a malformed row is reported even if the rules path is also bad.
- Output is written with `print(text, end="")` since `format_report` already ends in a newline.

- [ ] **Step 1: Write the failing tests**

```python
import io
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from tempfile import TemporaryDirectory

from ledgerlite.cli import main

TRANSACTIONS = """date,amount,description
2026-03-04,-7.50,Coffee Shop
2026-03-01,2500.00,Salary
2026-03-02,-900.00,Monthly Rent
"""
RULES = "coffee=food\nrent=housing\n"
EXPECTED = "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50\n"


class CliTest(unittest.TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)
        self.txns = self.dir / "txns.csv"
        self.txns.write_text(TRANSACTIONS)
        self.rules = self.dir / "rules.txt"
        self.rules.write_text(RULES)

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_prints_the_spec_example(self):
        code, out, err = self.run_cli("report", str(self.txns), "--rules", str(self.rules), "--opening", "100")
        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_defaults_to_zero_opening_and_no_rules(self):
        code, out, _ = self.run_cli("report", str(self.txns))
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_missing_transactions_file(self):
        missing = self.dir / "nope.csv"
        code, out, err = self.run_cli("report", str(missing))
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_unreadable_rules_file(self):
        missing = self.dir / "nope.txt"
        code, out, err = self.run_cli("report", str(self.txns), "--rules", str(missing))
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_malformed_row_rejects_whole_file(self):
        bad = self.dir / "bad.csv"
        bad.write_text("date,amount,description\n2026-03-04,-7.50,Coffee\n2026-03-05,1.005,Odd\n")
        code, out, err = self.run_cli("report", str(bad), "--rules", str(self.rules))
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {bad}:3: invalid amount '1.005'\n")

    def test_empty_file_reports_opening_balance(self):
        empty = self.dir / "empty.csv"
        empty.write_text("date,amount,description\n")
        code, out, _ = self.run_cli("report", str(empty), "--opening", "42.50")
        self.assertEqual((code, out), (0, "\nclosing balance: 42.50\n"))

    def test_invalid_opening_exits_two(self):
        with self.assertRaises(SystemExit) as ctx, redirect_stderr(io.StringIO()):
            main(["report", str(self.txns), "--opening", "abc"])
        self.assertEqual(ctx.exception.code, 2)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `main` in `ledgerlite/cli.py` and `ledgerlite/__main__.py`**

Follow the decisions above. Reuse Task 1's amount pattern for `--opening` by importing it from `parse` rather than re-writing the regex.

- [ ] **Step 4: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS (all tests from Tasks 1–5)

- [ ] **Step 5: Verify the tool runs end to end**

Run: `printf 'date,amount,description\n2026-03-04,-7.50,Coffee Shop\n2026-03-01,2500.00,Salary\n2026-03-02,-900.00,Monthly Rent\n' > /tmp/t.csv && printf 'coffee=food\nrent=housing\n' > /tmp/r.txt && python3 -m ledgerlite report /tmp/t.csv --rules /tmp/r.txt --opening 100`
Expected: the spec's example report, and `echo $?` prints `0`

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI"
```
