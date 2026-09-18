# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A command-line tool that reads a CSV of bank transactions, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Five small pure modules (`model`, `parse`, `rules`, `balance`, `report`) with no I/O, plus `cli.py` which does all file reading, all error printing, and all exit codes. Parsing raises `ParseError(line, message)`; the CLI is the only place that turns exceptions into stderr text and status codes. Money is `decimal.Decimal` end to end — no float ever touches an amount.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `dataclasses`, `re`, `io`), tests with `unittest`.

**Spec:** `design.md` (repo root)

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies.
- All amounts are `decimal.Decimal`. Never `float`, at any point, including in tests.
- Package layout is exactly as in `design.md` § Package layout: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Error text is byte-exact: `ledgerlite: cannot read <path>: <reason>` and `ledgerlite: <path>:<line>: <what is wrong>`, both on stderr.
- Exit codes: 0 success, 1 unreadable file, 2 malformed input.
- Amounts print with exactly two fractional digits, leading `-` for negatives, no thousands separators.
- Commit after every task (each task's final step).

## Review Focus

Input classes the spec implies but does not spell out. Each has a test in the task named.

1. `nan`, `Infinity`, `1e3`, `0x10` — `Decimal()` accepts all of these, so a naive `Decimal(raw)` silently admits non-numbers and infinities that poison every total. They must be malformed (Task 1).
2. A category total of exactly zero reached from negatives (`-5.00` + `5.00`) — `Decimal` keeps the sign and prints `-0.00`, which the spec's `0.00` example forbids (Task 4).
3. An empty or header-only transactions file — a legitimate month with no activity must print the blank line and `closing balance: <opening>`, not crash and not print a bogus `uncategorized: 0.00` (Tasks 1, 4, 5).
4. A `--rules` path that does not exist or cannot be read — the spec defines the read error only for TRANSACTIONS, but a typo'd rules path must produce the same `cannot read` line and exit 1, not a traceback (Task 5).
5. A rules file with blank lines, or a rule whose category is literally `uncategorized`, or a category containing `=` — junk lines must not become rules named `""`, and an explicit `uncategorized` category must merge with the no-match bucket and stay last (Tasks 2, 4).

## File Structure

| File | Responsibility |
|------|----------------|
| `ledgerlite/__init__.py` | Empty package marker. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No logic. |
| `ledgerlite/parse.py` | `ParseError`, `parse_amount`, `parse_transactions` (text → transactions). |
| `ledgerlite/rules.py` | `parse_rules` (text → rules), `categorize`. Imports `ParseError` from `parse`. |
| `ledgerlite/balance.py` | `order_transactions`, `closing_balance`. |
| `ledgerlite/report.py` | `UNCATEGORIZED`, `format_amount`, `category_totals`, `format_report`. |
| `ledgerlite/cli.py` | `main(argv)` — argparse, file reads, stderr text, exit codes. |
| `ledgerlite/__main__.py` | 2-line shim so `python3 -m ledgerlite` works. |
| `test_parse.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py` | One per module, repo root. |

**Assumptions** (spec is silent; recorded here so the executor does not re-decide them):
- `__main__.py` is added beyond the spec's layout because the spec gives a `ledgerlite report ...` invocation but no packaging metadata; `python3 -m ledgerlite report ...` is the runnable form.
- Date format is strict `YYYY-MM-DD`. `date.fromisoformat` also accepts `20260304` and week dates; the spec says ISO 8601 `2026-03-04`, so a regex gates it and `2026-3-4` is malformed.
- Empty file and header-only file both mean "no transactions", not "missing header".
- In a rules file, blank lines and lines whose first non-blank character is `#` are ignored; any other line without `=` is an error.

---

### Task 1: Transaction model and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py` (empty), `ledgerlite/model.py`, `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `model.Transaction` — frozen dataclass, fields `date: datetime.date`, `amount: Decimal`, `description: str`.
  - `parse.ParseError(Exception)` with attributes `line: int`, `message: str`.
  - `parse.parse_amount(raw: str) -> Decimal` — raises `ValueError` on anything that is not a plain decimal with ≤2 fractional digits.
  - `parse.parse_transactions(text: str) -> list[Transaction]` — raises `ParseError`; input order preserved.

- [ ] **Step 1: Write the failing tests**

`test_parse.py`:

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.parse import ParseError, parse_amount, parse_transactions

HEADER = "date,amount,description\n"

class ParseAmountTest(unittest.TestCase):
    def test_accepts_one_or_two_fractional_digits(self):
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))
        self.assertEqual(parse_amount("-12"), Decimal("-12"))
        self.assertEqual(parse_amount("+3.25"), Decimal("3.25"))
        self.assertEqual(parse_amount(" 7.00 "), Decimal("7.00"))

    def test_returns_decimal_never_float(self):
        self.assertIsInstance(parse_amount("0.10"), Decimal)

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError):
            parse_amount("1.005")

    def test_rejects_decimal_specials_and_exponents(self):
        # Decimal() accepts all of these; parse_amount must not.
        for raw in ("nan", "NaN", "Infinity", "-inf", "1e3", "0x10", "1_000", "1,000.00", "", "abc"):
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                parse_amount(raw)

class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_preserving_input_order(self):
        txns = parse_transactions(HEADER + "2026-03-05,-7.50,Coffee\n2026-03-04,2500.00,Salary\n")
        self.assertEqual([t.date for t in txns], [date(2026, 3, 5), date(2026, 3, 4)])
        self.assertEqual(txns[0].amount, Decimal("-7.50"))
        self.assertEqual(txns[1].description, "Salary")

    def test_empty_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(""), [])

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_rejects_bad_header(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions("when,how much,what\n")
        self.assertEqual(ctx.exception.line, 1)

    def test_rejects_wrong_column_count(self):
        for row in ("2026-03-04,-7.50\n", "2026-03-04,-7.50,Coffee,extra\n"):
            with self.subTest(row=row), self.assertRaises(ParseError) as ctx:
                parse_transactions(HEADER + row)
            self.assertEqual(ctx.exception.line, 2)

    def test_rejects_unparseable_date(self):
        for raw in ("2026-13-40", "2026-02-30", "2026-3-4", "04/03/2026", "20260304", ""):
            with self.subTest(raw=raw), self.assertRaises(ParseError) as ctx:
                parse_transactions(HEADER + f"{raw},-7.50,Coffee\n")
            self.assertEqual(ctx.exception.line, 2)

    def test_rejects_malformed_amount_with_row_line_number(self):
        text = HEADER + "2026-03-04,-7.50,Coffee\n2026-03-05,1.005,Rent\n"
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 3)

    def test_line_number_accounts_for_newline_inside_quoted_field(self):
        text = HEADER + '2026-03-04,-7.50,"Coffee\nshop"\n2026-03-05,nan,Rent\n'
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 4)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`.

- [ ] **Step 3: Write the model**

`ledgerlite/__init__.py`: empty file.

`ledgerlite/model.py`:

```python
"""The one data type that moves between modules."""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    date: date
    amount: Decimal
    description: str
```

- [ ] **Step 4: Write the parser**

`ledgerlite/parse.py`:

```python
"""Transactions CSV -> list[Transaction]."""
import csv
import io
import re
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction

COLUMNS = ["date", "amount", "description"]
_AMOUNT_RE = re.compile(r"^[+-]?(\d+(\.\d{1,2})?|\.\d{1,2})$")
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class ParseError(Exception):
    """A malformed line. `line` is 1-based within the source file."""

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_amount(raw: str) -> Decimal:
    """A plain decimal with at most two fractional digits. No nan/inf/exponents."""
    text = raw.strip()
    if not _AMOUNT_RE.match(text):
        raise ValueError(f"{raw!r} is not an amount with at most two decimal places")
    return Decimal(text)


def _parse_date(raw: str) -> date:
    text = raw.strip()
    if not _DATE_RE.match(text):
        raise ValueError(f"{raw!r} is not an ISO 8601 date (YYYY-MM-DD)")
    try:
        return date.fromisoformat(text)
    except ValueError:
        raise ValueError(f"{raw!r} is not a real date") from None


def parse_transactions(text: str) -> list[Transaction]:
    reader = csv.reader(io.StringIO(text, newline=""))
    rows = iter(reader)
    header = next(rows, None)
    if header is None:
        return []
    if [field.strip().lower() for field in header] != COLUMNS:
        raise ParseError(reader.line_num, f"expected header {','.join(COLUMNS)}")

    transactions = []
    for row in rows:
        line = reader.line_num
        if not row:
            continue
        if len(row) != len(COLUMNS):
            raise ParseError(line, f"expected {len(COLUMNS)} columns, got {len(row)}")
        raw_date, raw_amount, description = row
        try:
            when = _parse_date(raw_date)
            amount = parse_amount(raw_amount)
        except ValueError as err:
            raise ParseError(line, str(err)) from None
        transactions.append(Transaction(date=when, amount=amount, description=description))
    return transactions
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS, all tests.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: transaction model and strict CSV parsing"
```

---

### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `parse.ParseError(line, message)`.
- Produces:
  - `rules.Rule = tuple[str, str]` — `(lowercased substring, category)`.
  - `rules.parse_rules(text: str) -> list[Rule]` — file order preserved; raises `ParseError`.
  - `rules.categorize(description: str, rules: list[Rule]) -> str | None` — first match wins, case-insensitive; `None` when nothing matches.

- [ ] **Step 1: Write the failing tests**

`test_rules.py`:

```python
import unittest
from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules

class ParseRulesTest(unittest.TestCase):
    def test_parses_rules_in_file_order_lowercasing_the_substring(self):
        self.assertEqual(parse_rules("Coffee=food\nRENT=housing\n"),
                         [("coffee", "food"), ("rent", "housing")])

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_rules("  coffee = food  \n"), [("coffee", "food")])

    def test_ignores_blank_and_comment_lines(self):
        self.assertEqual(parse_rules("\n# a note\n  \ncoffee=food\n"), [("coffee", "food")])

    def test_category_may_contain_equals(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_line_without_equals_is_an_error_with_its_line_number(self):
        with self.assertRaises(ParseError) as ctx:
            parse_rules("coffee=food\nrent housing\n")
        self.assertEqual(ctx.exception.line, 2)

    def test_empty_substring_or_category_is_an_error(self):
        for text in ("=food\n", "coffee=\n"):
            with self.subTest(text=text), self.assertRaises(ParseError) as ctx:
                parse_rules(text)
            self.assertEqual(ctx.exception.line, 1)

class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("MORNING COFFEE", self.RULES), "food")
        self.assertEqual(categorize("Rent for March", self.RULES), "housing")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "treats")]
        self.assertEqual(categorize("Coffee Shop", rules), "food")

    def test_no_match_returns_none(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_no_rules_returns_none(self):
        self.assertIsNone(categorize("Coffee", []))

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`.

- [ ] **Step 3: Write the implementation**

`ledgerlite/rules.py`:

```python
"""Rules text -> rules; description -> category."""
from ledgerlite.parse import ParseError

Rule = tuple[str, str]


def parse_rules(text: str) -> list[Rule]:
    rules: list[Rule] = []
    for line_number, raw_line in enumerate(text.splitlines(), start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        substring, sep, category = line.partition("=")
        if not sep:
            raise ParseError(line_number, f"expected <substring>=<category>, got {raw_line.strip()!r}")
        substring, category = substring.strip(), category.strip()
        if not substring or not category:
            raise ParseError(line_number, "rule needs a non-empty substring and category")
        rules.append((substring.lower(), category))
    return rules


def categorize(description: str, rules: list[Rule]) -> str | None:
    haystack = description.lower()
    for substring, category in rules:
        if substring in haystack:
            return category
    return None
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: rules parsing and first-match categorization"
```

---

### Task 3: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `model.Transaction`.
- Produces:
  - `balance.order_transactions(transactions: list[Transaction]) -> list[Transaction]` — sorted by date, stable so same-date rows keep input order. Returns a new list.
  - `balance.closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — opening plus every amount; `opening` when the list is empty.

Note: a sum is order-independent, so ordering does not change the closing figure. The spec still specifies the ordering, so it is a real function with its own tests, and the CLI orders before reporting.

- [ ] **Step 1: Write the failing tests**

`test_balance.py`:

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.balance import closing_balance, order_transactions
from ledgerlite.model import Transaction

def txn(day, amount, description="x"):
    return Transaction(date=date(2026, 3, day), amount=Decimal(amount), description=description)

class OrderTransactionsTest(unittest.TestCase):
    def test_orders_by_date(self):
        ordered = order_transactions([txn(5, "1.00"), txn(1, "2.00"), txn(3, "3.00")])
        self.assertEqual([t.date.day for t in ordered], [1, 3, 5])

    def test_ties_keep_input_order(self):
        ordered = order_transactions([txn(4, "1.00", "b"), txn(4, "1.00", "a"), txn(2, "1.00", "c")])
        self.assertEqual([t.description for t in ordered], ["c", "b", "a"])

    def test_does_not_mutate_input(self):
        given = [txn(5, "1.00"), txn(1, "2.00")]
        order_transactions(given)
        self.assertEqual([t.date.day for t in given], [5, 1])

class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_opening(self):
        txns = [txn(4, "-7.50"), txn(5, "-900.00"), txn(6, "2500.00")]
        self.assertEqual(closing_balance(txns, Decimal("100")), Decimal("1692.50"))

    def test_no_transactions_gives_opening(self):
        self.assertEqual(closing_balance([], Decimal("100.00")), Decimal("100.00"))

    def test_arithmetic_is_exact_decimal_not_float(self):
        total = closing_balance([txn(1, "0.10"), txn(2, "0.20")], Decimal("0"))
        self.assertEqual(total, Decimal("0.30"))
        self.assertIsInstance(total, Decimal)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`.

- [ ] **Step 3: Write the implementation**

`ledgerlite/balance.py`:

```python
"""Date ordering and the running balance's final value."""
from decimal import Decimal

from ledgerlite.model import Transaction


def order_transactions(transactions: list[Transaction]) -> list[Transaction]:
    """By date; `sorted` is stable, so same-date rows keep input order."""
    return sorted(transactions, key=lambda t: t.date)


def closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal:
    """The running balance after the last transaction."""
    balance = opening
    for transaction in order_transactions(transactions):
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: date ordering and closing balance"
```

---

### Task 4: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `model.Transaction`, `rules.Rule`, `rules.categorize`, `balance.closing_balance`.
- Produces:
  - `report.UNCATEGORIZED = "uncategorized"`.
  - `report.format_amount(value: Decimal) -> str` — two fractional digits, `-` for negatives, never `-0.00`, no thousands separators.
  - `report.category_totals(transactions, rules) -> list[tuple[str, Decimal]]` — alphabetical, `uncategorized` last; categories with no transactions do not appear.
  - `report.format_report(transactions, rules, opening: Decimal) -> str` — the whole report, one trailing newline.

- [ ] **Step 1: Write the failing tests**

`test_report.py`:

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.model import Transaction
from ledgerlite.report import UNCATEGORIZED, category_totals, format_amount, format_report

def txn(day, amount, description):
    return Transaction(date=date(2026, 3, day), amount=Decimal(amount), description=description)

RULES = [("coffee", "food"), ("rent", "housing")]
EXAMPLE = [txn(5, "-7.50", "Morning coffee"), txn(1, "-900.00", "Rent"), txn(3, "2500.00", "Salary")]

class FormatAmountTest(unittest.TestCase):
    def test_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("-1234567.89")), "-1234567.89")

    def test_zero_total_reached_from_negatives_has_no_minus_sign(self):
        self.assertEqual(format_amount(Decimal("-5.00") + Decimal("5.00")), "0.00")
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

class CategoryTotalsTest(unittest.TestCase):
    def test_alphabetical_with_uncategorized_last(self):
        self.assertEqual(category_totals(EXAMPLE, RULES),
                         [("food", Decimal("-7.50")),
                          ("housing", Decimal("-900.00")),
                          (UNCATEGORIZED, Decimal("2500.00"))])

    def test_sums_repeated_categories(self):
        txns = [txn(1, "-2.50", "Coffee"), txn(2, "-5.00", "coffee beans")]
        self.assertEqual(category_totals(txns, RULES), [("food", Decimal("-7.50"))])

    def test_no_transactions_gives_no_lines(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_uncategorized_absent_when_everything_matches(self):
        self.assertEqual([name for name, _ in category_totals([txn(1, "-1.00", "Coffee")], RULES)], ["food"])

    def test_all_uncategorized_without_rules(self):
        self.assertEqual(category_totals([txn(1, "-1.00", "Coffee")], []),
                         [(UNCATEGORIZED, Decimal("-1.00"))])

    def test_rule_category_named_uncategorized_merges_and_stays_last(self):
        rules = [("coffee", "uncategorized"), ("rent", "housing")]
        txns = [txn(1, "-2.00", "Coffee"), txn(2, "-900.00", "Rent"), txn(3, "5.00", "Salary")]
        self.assertEqual(category_totals(txns, rules),
                         [("housing", Decimal("-900.00")), (UNCATEGORIZED, Decimal("3.00"))])

class FormatReportTest(unittest.TestCase):
    def test_matches_the_design_example(self):
        self.assertEqual(
            format_report(EXAMPLE, RULES, Decimal("100")),
            "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50\n",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(format_report([], RULES, Decimal("100")), "\nclosing balance: 100.00\n")

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`.

- [ ] **Step 3: Write the implementation**

`ledgerlite/report.py`:

```python
"""Per-category totals and the printed report."""
from decimal import Decimal

from ledgerlite.balance import closing_balance
from ledgerlite.model import Transaction
from ledgerlite.rules import Rule, categorize

UNCATEGORIZED = "uncategorized"
_CENTS = Decimal("0.01")


def format_amount(value: Decimal) -> str:
    """Exactly two fractional digits; `-0.00` is normalized to `0.00`."""
    quantized = value.quantize(_CENTS)
    if quantized == 0:
        quantized = abs(quantized)
    return f"{quantized:f}"


def category_totals(transactions: list[Transaction], rules: list[Rule]) -> list[tuple[str, Decimal]]:
    """Alphabetical by category, with `uncategorized` always last."""
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        name = categorize(transaction.description, rules) or UNCATEGORIZED
        totals[name] = totals.get(name, Decimal("0")) + transaction.amount
    return sorted(totals.items(), key=lambda item: (item[0] == UNCATEGORIZED, item[0]))


def format_report(transactions: list[Transaction], rules: list[Rule], opening: Decimal) -> str:
    lines = [f"{name}: {format_amount(total)}" for name, total in category_totals(transactions, rules)]
    lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(transactions, opening))}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: per-category totals and report formatting"
```

---

### Task 5: CLI — argument parsing, file reading, exit codes

**Files:**
- Create: `ledgerlite/cli.py`, `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.ParseError`, `parse.parse_amount`, `parse.parse_transactions`, `rules.parse_rules`, `report.format_report`.
- Produces: `cli.main(argv: list[str] | None = None) -> int`. Writes the report to stdout, errors to stderr, returns the exit code (never calls `sys.exit` itself except via argparse's own usage errors).

- [ ] **Step 1: Write the failing tests**

`test_cli.py`:

```python
import io
import os
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-05,-7.50,Morning coffee\n"
    "2026-03-01,-900.00,Rent\n"
    "2026-03-03,2500.00,Salary\n"
)
RULES = "coffee=food\nrent=housing\n"

class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)

    def write(self, name, text):
        path = os.path.join(self.dir.name, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        return path

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

class SuccessTest(CliTestCase):
    def test_prints_report_and_returns_zero(self):
        txns = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", RULES)
        code, out, err = self.run_cli("report", txns, "--rules", rules, "--opening", "100")
        self.assertEqual(code, 0)
        self.assertEqual(out, "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\n"
                              "closing balance: 1692.50\n")
        self.assertEqual(err, "")

    def test_opening_defaults_to_zero(self):
        txns = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_cli("report", txns, "--rules", self.write("r.txt", RULES))
        self.assertEqual(code, 0)
        self.assertIn("closing balance: 1592.50\n", out)

    def test_without_rules_everything_is_uncategorized(self):
        txns = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_cli("report", txns)
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_header_only_file_reports_the_opening_balance(self):
        txns = self.write("t.csv", "date,amount,description\n")
        code, out, err = self.run_cli("report", txns, "--opening", "100")
        self.assertEqual((code, err), (0, ""))
        self.assertEqual(out, "\nclosing balance: 100.00\n")

class FailureTest(CliTestCase):
    def test_unreadable_transactions_file_returns_1(self):
        missing = os.path.join(self.dir.name, "nope.csv")
        code, out, err = self.run_cli("report", missing)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_unreadable_rules_file_returns_1(self):
        txns = self.write("t.csv", TRANSACTIONS)
        missing = os.path.join(self.dir.name, "nope.txt")
        code, out, err = self.run_cli("report", txns, "--rules", missing)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_malformed_row_returns_2_and_prints_nothing_to_stdout(self):
        txns = self.write("t.csv", "date,amount,description\n2026-03-04,1.005,Coffee\n")
        code, out, err = self.run_cli("report", txns)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: {txns}:2: "), err)

    def test_whole_file_is_rejected_even_when_only_the_last_row_is_bad(self):
        txns = self.write("t.csv", TRANSACTIONS + "2026-03-06,nan,Mystery\n")
        code, out, err = self.run_cli("report", txns)
        self.assertEqual((code, out), (2, ""))
        self.assertIn(f"{txns}:5:", err)

    def test_malformed_rules_file_returns_2_with_the_rules_path(self):
        txns = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", "coffee=food\nrent housing\n")
        code, out, err = self.run_cli("report", txns, "--rules", rules)
        self.assertEqual((code, out), (2, ""))
        self.assertTrue(err.startswith(f"ledgerlite: {rules}:2: "), err)

    def test_invalid_opening_amount_is_rejected(self):
        txns = self.write("t.csv", TRANSACTIONS)
        with self.assertRaises(SystemExit) as ctx, redirect_stderr(io.StringIO()):
            main(["report", txns, "--opening", "1.005"])
        self.assertEqual(ctx.exception.code, 2)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`.

- [ ] **Step 3: Write the implementation**

`ledgerlite/cli.py`:

```python
"""Command-line entry point: the only module that does I/O or picks exit codes."""
import argparse
import sys
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_transactions
from ledgerlite.report import format_report
from ledgerlite.rules import parse_rules

EXIT_OK = 0
EXIT_UNREADABLE = 1
EXIT_MALFORMED = 2


def _opening(raw: str) -> Decimal:
    try:
        return parse_amount(raw)
    except ValueError as err:
        raise argparse.ArgumentTypeError(str(err)) from None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="ledgerlite")
    subcommands = parser.add_subparsers(dest="command", required=True)
    report = subcommands.add_parser("report", help="print a per-category summary")
    report.add_argument("transactions", help="transactions CSV")
    report.add_argument("--rules", help="rules file (<substring>=<category> per line)")
    report.add_argument("--opening", type=_opening, default=Decimal("0"), help="opening balance")
    return parser


def _read(path: str) -> str:
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    sources = [(args.transactions, parse_transactions)]
    if args.rules is not None:
        sources.append((args.rules, parse_rules))

    parsed = []
    for path, parse_func in sources:
        try:
            text = _read(path)
        except OSError as err:
            print(f"ledgerlite: cannot read {path}: {err.strerror or err}", file=sys.stderr)
            return EXIT_UNREADABLE
        try:
            parsed.append(parse_func(text))
        except ParseError as err:
            print(f"ledgerlite: {path}:{err.line}: {err.message}", file=sys.stderr)
            return EXIT_MALFORMED

    transactions = parsed[0]
    rules = parsed[1] if len(parsed) > 1 else []
    print(format_report(transactions, rules, args.opening), end="")
    return EXIT_OK
```

`ledgerlite/__main__.py`:

```python
import sys

from ledgerlite.cli import main

sys.exit(main())
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS, all tests.

- [ ] **Step 5: Run the whole suite and the tool by hand**

```bash
python3 -m unittest -v
printf 'date,amount,description\n2026-03-05,-7.50,Morning coffee\n2026-03-01,-900.00,Rent\n2026-03-03,2500.00,Salary\n' > /tmp/t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/r.txt
python3 -m ledgerlite report /tmp/t.csv --rules /tmp/r.txt --opening 100
```

Expected: every test passes, and the command prints exactly the report from `design.md` § Report.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: ledgerlite report CLI with exit codes and error messages"
```
