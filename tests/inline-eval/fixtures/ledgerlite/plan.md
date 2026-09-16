# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A CLI that reads a transactions CSV, categorizes rows by substring rules, and prints per-category totals with a closing balance.

**Architecture:** Six small modules in a pipeline: model → parse → rules → balance → report → cli. Each module has one job and a pure function interface; the CLI wires them and owns all I/O and exit codes.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Amounts are `decimal.Decimal` everywhere; never `float`.
- Amounts print with exactly two fractional digits, leading `-` for negatives, no thousands separators.
- Report category order: alphabetical, `uncategorized` last.
- Transactions order: by date, stable on ties (input order preserved).
- Test output must be pristine (no warnings, no stray prints).

---

### Task 1: Transaction model

**Files:**
- Create: `ledgerlite/__init__.py` (empty)
- Create: `ledgerlite/model.py`
- Test: `test_model.py`

**Interfaces:**
- Produces: `Transaction(date: datetime.date, amount: decimal.Decimal, description: str, category: str | None = None)` — a frozen dataclass.

- [ ] **Step 1: Write the failing test**

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.model import Transaction


class TransactionTests(unittest.TestCase):
    def test_fields_and_default_category(self):
        t = Transaction(date(2026, 3, 4), Decimal("-7.50"), "COFFEE SHOP")
        self.assertEqual(t.date, date(2026, 3, 4))
        self.assertEqual(t.amount, Decimal("-7.50"))
        self.assertEqual(t.description, "COFFEE SHOP")
        self.assertIsNone(t.category)

    def test_is_frozen(self):
        t = Transaction(date(2026, 3, 4), Decimal("1"), "x")
        with self.assertRaises(Exception):
            t.amount = Decimal("2")
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_model` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/model.py` as a `@dataclass(frozen=True)` with the four fields above.
- [ ] **Step 4: Run it and watch it pass** — `python3 -m unittest test_model` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite test_model.py && git commit -m "Add Transaction model"`

### Task 2: CSV parsing

**Files:**
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1).
- Produces: `parse_csv(text: str) -> list[Transaction]` — parses CSV text with header `date,amount,description`, in input order, category `None`. `class ParseError(ValueError)` with attributes `line: int` (1-based, counting the header as line 1) and `reason: str`, raised on the first bad row: wrong column count, unparseable date, or an amount that is not a decimal number.

- [ ] **Step 1: Write the failing test**

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.parse import parse_csv, ParseError

CSV = "date,amount,description\n2026-03-04,-7.50,COFFEE SHOP\n2026-03-01,2500.00,SALARY\n"


class ParseTests(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        txns = parse_csv(CSV)
        self.assertEqual([t.description for t in txns], ["COFFEE SHOP", "SALARY"])
        self.assertEqual(txns[0].date, date(2026, 3, 4))
        self.assertEqual(txns[0].amount, Decimal("-7.50"))
        self.assertIsInstance(txns[1].amount, Decimal)
        self.assertIsNone(txns[0].category)

    def test_header_only_is_empty(self):
        self.assertEqual(parse_csv("date,amount,description\n"), [])

    def test_bad_date_raises_with_line(self):
        with self.assertRaises(ParseError) as cm:
            parse_csv("date,amount,description\n2026-13-40,1.00,x\n")
        self.assertEqual(cm.exception.line, 2)
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_parse` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/parse.py` using `csv.reader` over `text.splitlines()`; validate the header; build `Transaction` per row; raise `ParseError(line, reason)` on the first bad row.
- [ ] **Step 4: Run it and watch it pass** — `python3 -m unittest test_parse` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite/parse.py test_parse.py && git commit -m "Add CSV parsing"`

### Task 3: Categorization rules

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1).
- Produces: `parse_rules(text: str) -> list[tuple[str, str]]` — one `substring=category` per non-blank line, in order. `categorize(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[Transaction]` — returns new `Transaction` objects with `category` set by the first rule whose substring occurs in the description, case-insensitively; unchanged (`None`) when no rule matches. Input list is not mutated.

- [ ] **Step 1: Write the failing test**

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.model import Transaction
from ledgerlite.rules import parse_rules, categorize


class RulesTests(unittest.TestCase):
    def test_parse_rules_skips_blank_lines(self):
        self.assertEqual(parse_rules("coffee=food\n\nrent=housing\n"), [("coffee", "food"), ("rent", "housing")])

    def test_first_match_wins_case_insensitive(self):
        txns = [Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop RENT")]
        out = categorize(txns, [("rent", "housing"), ("coffee", "food")])
        self.assertEqual(out[0].category, "housing")
        self.assertIsNone(txns[0].category)

    def test_no_match_stays_uncategorized(self):
        txns = [Transaction(date(2026, 3, 4), Decimal("1"), "MYSTERY")]
        self.assertIsNone(categorize(txns, [("coffee", "food")])[0].category)
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_rules` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/rules.py` with the two functions; use `dataclasses.replace` to produce the categorized copies.
- [ ] **Step 4: Run it and watch it pass** — `python3 -m unittest test_rules` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite/rules.py test_rules.py && git commit -m "Add categorization rules"`

### Task 4: Running balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1).
- Produces: `ordered(transactions: list[Transaction]) -> list[Transaction]` — sorted by date, stable. `closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — opening plus the sum of amounts (order does not affect the sum, but callers pass the ordered list).

- [ ] **Step 1: Write the failing test**

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.model import Transaction
from ledgerlite.balance import ordered, closing_balance

A = Transaction(date(2026, 3, 4), Decimal("-7.50"), "a")
B = Transaction(date(2026, 3, 1), Decimal("2500.00"), "b")
C = Transaction(date(2026, 3, 4), Decimal("-900.00"), "c")


class BalanceTests(unittest.TestCase):
    def test_ordered_by_date_stable(self):
        self.assertEqual([t.description for t in ordered([A, B, C])], ["b", "a", "c"])

    def test_closing_balance(self):
        self.assertEqual(closing_balance([A, B, C], Decimal("100")), Decimal("1692.50"))

    def test_closing_balance_empty_is_opening(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_balance` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/balance.py`; `sorted(..., key=lambda t: t.date)` is stable.
- [ ] **Step 4: Run it and watch it pass** — `python3 -m unittest test_balance` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite/balance.py test_balance.py && git commit -m "Add running balance"`

### Task 5: Report

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1).
- Produces: `totals_by_category(transactions: list[Transaction]) -> dict[str, Decimal]` — keys are category names, with `None` mapped to `"uncategorized"`. `format_report(totals: dict[str, Decimal], closing: Decimal) -> str` — one `<category>: <amount>` line per category, alphabetical with `uncategorized` last, a blank line, then `closing balance: <amount>`; no trailing newline. `format_amount(amount: Decimal) -> str` — exactly two fractional digits, leading `-` for negatives.

- [ ] **Step 1: Write the failing test**

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.model import Transaction
from ledgerlite.report import totals_by_category, format_report, format_amount


class ReportTests(unittest.TestCase):
    def test_format_amount(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_totals_map_none_to_uncategorized(self):
        txns = [
            Transaction(date(2026, 3, 4), Decimal("-7.50"), "a", "food"),
            Transaction(date(2026, 3, 4), Decimal("2500.00"), "b"),
            Transaction(date(2026, 3, 4), Decimal("-900.00"), "c", "housing"),
        ]
        self.assertEqual(totals_by_category(txns), {"food": Decimal("-7.50"), "uncategorized": Decimal("2500.00"), "housing": Decimal("-900.00")})

    def test_format_report_order_and_layout(self):
        totals = {"uncategorized": Decimal("2500.00"), "housing": Decimal("-900.00"), "food": Decimal("-7.50")}
        self.assertEqual(
            format_report(totals, Decimal("1692.50")),
            "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50",
        )
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_report` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/report.py` with the three functions; `format_amount` via `Decimal.quantize(Decimal("0.01"))`.
- [ ] **Step 4: Run it and watch it pass** — `python3 -m unittest test_report` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite/report.py test_report.py && git commit -m "Add report formatting"`

### Task 6: CLI

**Files:**
- Create: `ledgerlite/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_csv(path: str) -> list[Transaction]` (Task 2); `parse_rules`, `categorize` (Task 3); `ordered`, `closing_balance` (Task 4); `totals_by_category`, `format_report` (Task 5).
- Produces: `main(argv: list[str]) -> int` — `report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`; prints the report to stdout and returns 0; an unreadable TRANSACTIONS prints `ledgerlite: cannot read <path>: <reason>` to stderr and returns 1.

- [ ] **Step 1: Write the failing test**

```python
import io
import os
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from ledgerlite.cli import main

CSV = "date,amount,description\n2026-03-04,-7.50,COFFEE SHOP\n2026-03-01,2500.00,SALARY\n2026-03-04,-900.00,RENT MARCH\n"
RULES = "coffee=food\nrent=housing\n"


def write(text):
    f = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False)
    f.write(text)
    f.close()
    return f.name


class CliTests(unittest.TestCase):
    def test_report_end_to_end(self):
        csv_path, rules_path = write(CSV), write(RULES)
        self.addCleanup(os.unlink, csv_path)
        self.addCleanup(os.unlink, rules_path)
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            rc = main(["report", csv_path, "--rules", rules_path, "--opening", "100"])
        self.assertEqual(rc, 0)
        self.assertEqual(out.getvalue(), "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50\n")
        self.assertEqual(err.getvalue(), "")

    def test_missing_file_returns_1(self):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            rc = main(["report", "/no/such/file.csv"])
        self.assertEqual(rc, 1)
        self.assertEqual(out.getvalue(), "")
        self.assertTrue(err.getvalue().startswith("ledgerlite: cannot read /no/such/file.csv"))
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_cli` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/cli.py` with `argparse` (subcommand `report`), wiring the modules in order: parse → categorize → ordered → totals and closing balance → format_report; print the report with a trailing newline.
- [ ] **Step 4: Run the whole suite and watch it pass** — `python3 -m unittest` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite/cli.py test_cli.py && git commit -m "Add CLI"`
