# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only CLI that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Five small pure modules (`model`, `parse`, `rules`, `balance`, `report`) plus a thin `cli` that owns all I/O. Parsing functions take *text*, not paths, so the CLI is the only place that touches the filesystem and the only place that formats error messages and picks exit codes. Money is `decimal.Decimal` end to end; a float never appears.

**Tech Stack:** Python 3.11+ standard library only (`csv`, `decimal`, `datetime`, `dataclasses`, `re`, `argparse`), tests with `unittest`.

**Spec:** `design.md`

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies, no `pyproject.toml` needed.
- Amounts are `decimal.Decimal` everywhere. Never `float`, not even transiently.
- Package layout is exactly as `design.md` specifies: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Error messages go to stderr and are prefixed `ledgerlite: `. The report goes to stdout.
- Exit codes: 0 success, 1 unreadable file, 2 malformed input.
- Amounts print with exactly two fractional digits, a leading `-` only for genuinely negative values, and no thousands separators.

## Review Focus

Five things the spec implies but does not spell out. Each has a test in the task that owns the code.

1. `--rules` pointing at a file that cannot be read must produce the same `cannot read` message and exit 1, not a traceback. The spec only names TRANSACTIONS, but a typo'd rules path is just as likely. (Task 5)
2. Amount strings that `Decimal()` happily accepts but the spec does not describe — `1e2`, `NaN`, `Infinity`, `1.`, `--5` — must be malformed (exit 2), not silently accepted as money. (Task 1)
3. A blank line in the CSV (including a file that ends with a stray newline) must be skipped, not reported as a wrong column count. (Task 1)
4. A file with no transactions (header only) must print `closing balance: <opening>` alone — no category lines and no leading blank line. (Task 4)
5. A total of `Decimal("-0.00")` must print `0.00`, not `-0.00`; the leading `-` is for negatives only. (Task 4)

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
  - `ledgerlite.model.Transaction` — frozen dataclass, fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str` (in that order).
  - `ledgerlite.parse.ParseError(Exception)` with attributes `line: int` and `message: str`.
  - `ledgerlite.parse.parse_amount(value: str) -> decimal.Decimal` — raises `ValueError(message)` where `message` is the human-readable reason. Reused by Task 5 for `--opening`.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — file order preserved, raises `ParseError` on the first bad row.

Exact error message strings (tests and Task 5 depend on them):
- `expected header date,amount,description`
- `expected 3 columns, got {n}`
- `invalid date: {value!r}`
- `invalid amount: {value!r}`
- `amount has more than two fractional digits: {value!r}`

- [ ] **Step 1: Write the failing tests**

Create `test_parse.py`. Note `HEADER` — every fixture needs it, and line numbers count the header as line 1, so the first data row is line 2.

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_transactions

HEADER = "date,amount,description\n"


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_file_order(self):
        txns = parse_transactions(
            HEADER + "2026-03-05,-7.50,Coffee Bar\n2026-03-04,2500.00,Salary\n"
        )
        self.assertEqual(
            [(t.date, t.amount, t.description) for t in txns],
            [
                (date(2026, 3, 5), Decimal("-7.50"), "Coffee Bar"),
                (date(2026, 3, 4), Decimal("2500.00"), "Salary"),
            ],
        )

    def test_amount_is_decimal_not_float(self):
        [txn] = parse_transactions(HEADER + "2026-03-04,0.10,dime\n")
        self.assertIsInstance(txn.amount, Decimal)
        self.assertEqual(txn.amount, Decimal("0.10"))

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_blank_lines_are_skipped(self):
        # Review Focus 3: a stray or trailing blank line is not a bad row.
        txns = parse_transactions(HEADER + "\n2026-03-04,1.00,a\n\n")
        self.assertEqual(len(txns), 1)

    def test_description_may_contain_commas_when_quoted(self):
        [txn] = parse_transactions(HEADER + '2026-03-04,-1.00,"Cafe, Downtown"\n')
        self.assertEqual(txn.description, "Cafe, Downtown")

    def test_accepts_one_or_two_fractional_digits(self):
        txns = parse_transactions(
            HEADER + "2026-03-04,1.5,a\n2026-03-04,1.50,b\n2026-03-04,2,c\n"
        )
        self.assertEqual([t.amount for t in txns],
                         [Decimal("1.5"), Decimal("1.50"), Decimal("2")])

    def assertRejects(self, text, line, message):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual((caught.exception.line, caught.exception.message),
                         (line, message))

    def test_rejects_missing_header(self):
        self.assertRejects(
            "2026-03-04,-7.50,coffee\n", 1,
            "expected header date,amount,description",
        )

    def test_rejects_empty_file(self):
        self.assertRejects("", 1, "expected header date,amount,description")

    def test_accepts_header_with_padding_and_odd_case(self):
        self.assertEqual(parse_transactions("Date, Amount , description\n"), [])

    def test_rejects_wrong_column_count(self):
        self.assertRejects(HEADER + "2026-03-04,-7.50\n", 2,
                           "expected 3 columns, got 2")
        self.assertRejects(HEADER + "2026-03-04,-7.50,coffee,extra\n", 2,
                           "expected 3 columns, got 4")

    def test_rejects_unparseable_dates(self):
        for value in ["2026-02-30", "04/03/2026", "2026-3-4", "20260304", ""]:
            with self.subTest(value=value):
                self.assertRejects(HEADER + f"{value},1.00,a\n", 2,
                                   f"invalid date: {value!r}")

    def test_rejects_non_decimal_amounts(self):
        # Review Focus 2: Decimal() accepts several of these; the spec does not.
        for value in ["abc", "1e2", "NaN", "Infinity", "1.", "--5", "", "1,000.00"]:
            with self.subTest(value=value):
                self.assertRejects(HEADER + f'2026-03-04,"{value}",a\n', 2,
                                   f"invalid amount: {value!r}")

    def test_rejects_more_than_two_fractional_digits(self):
        self.assertRejects(HEADER + "2026-03-04,1.005,a\n", 2,
                           "amount has more than two fractional digits: '1.005'")

    def test_reports_the_line_of_the_first_bad_row(self):
        text = HEADER + "2026-03-04,1.00,a\n2026-03-05,nope,b\n"
        self.assertRejects(text, 3, "invalid amount: 'nope'")


class ParseAmountTest(unittest.TestCase):
    def test_parses_signed_amounts(self):
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))
        self.assertEqual(parse_amount("+3"), Decimal("3"))
        self.assertEqual(parse_amount(" 4.25 "), Decimal("4.25"))

    def test_raises_value_error_with_reason(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1e2")
        self.assertEqual(str(caught.exception), "invalid amount: '1e2'")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`.

- [ ] **Step 3: Write the implementation**

Create empty `ledgerlite/__init__.py`.

`ledgerlite/model.py`:

```python
"""The one data type the rest of the package passes around."""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    date: date
    amount: Decimal
    description: str
```

`ledgerlite/parse.py`. Two regexes do the strictness the stdlib won't: `date.fromisoformat` accepts `20260304`, and `Decimal` accepts `NaN`/`1e2`, so validate the shape first and only then convert.

```python
"""Transactions CSV -> list[Transaction]."""
import csv
import io
import re
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction

HEADER = ("date", "amount", "description")
_DATE = re.compile(r"\d{4}-\d{2}-\d{2}\Z")
_AMOUNT = re.compile(r"[+-]?\d+(?:\.(?P<frac>\d+))?\Z")


class ParseError(Exception):
    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_amount(value: str) -> Decimal:
    """Parse a money amount. Raises ValueError with a display-ready reason."""
    text = value.strip()
    match = _AMOUNT.match(text)
    if match is None:
        raise ValueError(f"invalid amount: {value!r}")
    frac = match.group("frac")
    if frac is not None and len(frac) > 2:
        raise ValueError(f"amount has more than two fractional digits: {value!r}")
    return Decimal(text)


def _parse_date(value: str) -> date:
    text = value.strip()
    if _DATE.match(text) is None:
        raise ValueError(f"invalid date: {value!r}")
    try:
        return date.fromisoformat(text)
    except ValueError:
        raise ValueError(f"invalid date: {value!r}") from None


def parse_transactions(text: str) -> list[Transaction]:
    """Parse the whole file, or raise ParseError on the first bad row."""
    reader = csv.reader(io.StringIO(text))
    transactions: list[Transaction] = []
    header_seen = False
    for row in reader:
        if not row or all(field.strip() == "" for field in row):
            continue  # blank line: not a row at all
        if not header_seen:
            header_seen = True
            if tuple(f.strip().lower() for f in row) != HEADER:
                raise ParseError(reader.line_num,
                                 "expected header date,amount,description")
            continue
        if len(row) != 3:
            raise ParseError(reader.line_num,
                             f"expected 3 columns, got {len(row)}")
        raw_date, raw_amount, description = row
        try:
            when = _parse_date(raw_date)
            amount = parse_amount(raw_amount)
        except ValueError as error:
            raise ParseError(reader.line_num, str(error)) from None
        transactions.append(Transaction(when, amount, description.strip()))
    if not header_seen:
        raise ParseError(1, "expected header date,amount,description")
    return transactions
```

Note the blank-line skip runs before the header check, so a leading blank line does not become "the header".

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

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
- Consumes: nothing from Task 1.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order; the substring is lowercased for matching, the category is kept as written (stripped).
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first match wins, `None` when nothing matches.

Skipped rule lines (the spec is silent; these choices keep a typo from silently recategorizing everything): blank/whitespace-only lines, lines with no `=`, lines with an empty substring (an empty substring matches every description), and lines with an empty category.

- [ ] **Step 1: Write the failing tests**

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_one_rule_per_line_in_order(self):
        self.assertEqual(parse_rules("coffee=food\nrent=housing\n"),
                         [("coffee", "food"), ("rent", "housing")])

    def test_lowercases_substring_and_strips_padding(self):
        self.assertEqual(parse_rules(" COFFEE Bar = food \n"),
                         [("coffee bar", "food")])

    def test_splits_on_the_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_skips_blank_and_unusable_lines(self):
        text = "\n   \nnoequals\n=food\ncoffee=\ncoffee=food\n"
        self.assertEqual(parse_rules(text), [("coffee", "food")])

    def test_empty_text_gives_no_rules(self):
        self.assertEqual(parse_rules(""), [])


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("Monthly COFFEE order", self.RULES), "food")

    def test_first_matching_rule_wins(self):
        rules = [("bar", "drink"), ("coffee bar", "food")]
        self.assertEqual(categorize("Coffee Bar", rules), "drink")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee", []))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`.

- [ ] **Step 3: Write the implementation**

`ledgerlite/rules.py`:

```python
"""Rules text -> (substring, category) pairs, and description matching."""


def parse_rules(text: str) -> list[tuple[str, str]]:
    rules: list[tuple[str, str]] = []
    for line in text.splitlines():
        substring, sep, category = line.partition("=")
        if not sep:
            continue
        substring, category = substring.strip().lower(), category.strip()
        if substring and category:
            rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[tuple[str, str]]) -> str | None:
    haystack = description.lower()
    for substring, category in rules:
        if substring in haystack:
            return category
    return None
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS.

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
  - `ledgerlite.balance.order_by_date(transactions: Iterable[Transaction]) -> list[Transaction]` — sorted by date, ties keeping input order.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal` — the running balance after the last transaction in date order; `opening` when there are none.

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
        rows = [txn(5, "1"), txn(3, "2"), txn(4, "3")]
        self.assertEqual([t.date.day for t in order_by_date(rows)], [3, 4, 5])

    def test_ties_keep_input_order(self):
        rows = [txn(4, "1", "second-in-file"), txn(3, "2"), txn(4, "3", "third-in-file")]
        ordered = order_by_date(rows)
        self.assertEqual([t.description for t in ordered],
                         ["x", "second-in-file", "third-in-file"])

    def test_does_not_mutate_input(self):
        rows = [txn(5, "1"), txn(3, "2")]
        order_by_date(rows)
        self.assertEqual([t.date.day for t in rows], [5, 3])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening(self):
        rows = [txn(4, "-7.50"), txn(3, "2500.00"), txn(5, "-900.00")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_no_transactions_gives_the_opening(self):
        self.assertEqual(closing_balance(Decimal("100.00"), []), Decimal("100.00"))

    def test_arithmetic_is_exact_decimal(self):
        rows = [txn(3, "0.10"), txn(4, "0.20")]
        self.assertEqual(closing_balance(Decimal("0"), rows), Decimal("0.30"))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`.

- [ ] **Step 3: Write the implementation**

`ledgerlite/balance.py`:

```python
"""Date-ordered running balance."""
from collections.abc import Iterable
from decimal import Decimal

from ledgerlite.model import Transaction


def order_by_date(transactions: Iterable[Transaction]) -> list[Transaction]:
    """Sort by date. sorted() is stable, so same-date rows keep input order."""
    return sorted(transactions, key=lambda t: t.date)


def closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal:
    balance = opening
    for transaction in order_by_date(transactions):
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS.

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
- Consumes: `Transaction` (Task 1), `categorize` (Task 2), `closing_balance` (Task 3).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED = "uncategorized"`
  - `ledgerlite.report.format_amount(amount: Decimal) -> str`
  - `ledgerlite.report.category_totals(transactions, rules) -> list[tuple[str, Decimal]]` — display order: categories alphabetically, then `uncategorized` if any transaction is uncategorized.
  - `ledgerlite.report.format_report(transactions, rules, opening: Decimal) -> str` — the whole report, **no** trailing newline (the CLI's `print` adds it).

- [ ] **Step 1: Write the failing tests**

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report


def txn(day, amount, description):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


RULES = [("coffee", "food"), ("rent", "housing")]


class FormatAmountTest(unittest.TestCase):
    def test_two_fractional_digits_and_sign(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_negative_zero_prints_unsigned(self):
        # Review Focus 5.
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.5")), "1234567.50")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_each_category_alphabetically(self):
        rows = [txn(3, "-900.00", "Rent"), txn(4, "-7.50", "Coffee Bar"),
                txn(5, "-2.00", "coffee beans")]
        self.assertEqual(category_totals(rows, RULES),
                         [("food", Decimal("-9.50")), ("housing", Decimal("-900.00"))])

    def test_uncategorized_is_last_even_when_not_alphabetically_last(self):
        rules = [("coffee", "food"), ("zoo", "zebras")]
        rows = [txn(3, "1.00", "Zoo"), txn(4, "2.00", "Coffee"), txn(5, "3.00", "Salary")]
        self.assertEqual([name for name, _ in category_totals(rows, rules)],
                         ["food", "zebras", "uncategorized"])

    def test_uncategorized_omitted_when_everything_matches(self):
        self.assertEqual(category_totals([txn(3, "1.00", "Coffee")], RULES),
                         [("food", Decimal("1.00"))])

    def test_no_transactions_gives_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])


class FormatReportTest(unittest.TestCase):
    def test_matches_the_design_example(self):
        rows = [txn(4, "-7.50", "Coffee Bar"), txn(3, "-900.00", "Rent"),
                txn(5, "2500.00", "Salary")]
        self.assertEqual(
            format_report(rows, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        # Review Focus 4: no category lines means no leading blank line either.
        self.assertEqual(format_report([], RULES, Decimal("100")),
                         "closing balance: 100.00")

    def test_without_rules_everything_is_uncategorized(self):
        self.assertEqual(
            format_report([txn(3, "-5.00", "Coffee")], [], Decimal("0")),
            "uncategorized: -5.00\n\nclosing balance: -5.00",
        )
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`.

- [ ] **Step 3: Write the implementation**

`ledgerlite/report.py`:

```python
"""Per-category totals and report text."""
from collections.abc import Iterable
from decimal import Decimal

from ledgerlite.balance import closing_balance
from ledgerlite.model import Transaction
from ledgerlite.rules import categorize

UNCATEGORIZED = "uncategorized"


def format_amount(amount: Decimal) -> str:
    """Exactly two fractional digits; a leading '-' only for real negatives."""
    if amount == 0:
        amount = Decimal(0)  # collapse -0.00
    return f"{amount:.2f}"


def category_totals(
    transactions: Iterable[Transaction], rules: list[tuple[str, str]]
) -> list[tuple[str, Decimal]]:
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        name = categorize(transaction.description, rules) or UNCATEGORIZED
        totals[name] = totals.get(name, Decimal(0)) + transaction.amount
    ordered = sorted(name for name in totals if name != UNCATEGORIZED)
    if UNCATEGORIZED in totals:
        ordered.append(UNCATEGORIZED)
    return [(name, totals[name]) for name in ordered]


def format_report(
    transactions: Iterable[Transaction],
    rules: list[tuple[str, str]],
    opening: Decimal,
) -> str:
    transactions = list(transactions)
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    if lines:
        lines.append("")
    closing = closing_balance(opening, transactions)
    lines.append(f"closing balance: {format_amount(closing)}")
    return "\n".join(lines)
```

`format_amount` reassigns rather than special-casing the return so that `Decimal("-0.00")` and `Decimal("0")` take the same path.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: format per-category totals and closing balance report"
```

---

### Task 5: CLI entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_amount`, `parse_transactions`, `ParseError` (Task 1); `parse_rules` (Task 2); `format_report` (Task 4).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int`.

Behavior: `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`. `--opening` defaults to `0` and is validated with `parse_amount`, so a bad value is an argparse usage error (exit 2). Both file reads are guarded: `OSError` → `ledgerlite: cannot read <path>: <reason>` on stderr, exit 1, where `<reason>` is `e.strerror` when present. `ParseError` → `ledgerlite: <path>:<line>: <message>`, exit 2. The report is only printed after both files parse cleanly, so a malformed file leaves stdout empty. `argparse` raises `SystemExit` for usage errors; `main` catches it and returns the code so callers always get an int.

- [ ] **Step 1: Write the failing tests**

```python
import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-04,-7.50,Coffee Bar\n"
    "2026-03-03,-900.00,Rent\n"
    "2026-03-05,2500.00,Salary\n"
)
RULES = "coffee=food\nrent=housing\n"


class CliTest(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())

    def write(self, name, text):
        path = self.dir / name
        path.write_text(text)
        return str(path)

    def run_cli(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_prints_the_report_and_returns_zero(self):
        argv = ["report", self.write("t.csv", TRANSACTIONS),
                "--rules", self.write("r.txt", RULES), "--opening", "100"]
        code, out, err = self.run_cli(argv)
        self.assertEqual(code, 0)
        self.assertEqual(err, "")
        self.assertEqual(out, "food: -7.50\nhousing: -900.00\n"
                              "uncategorized: 2500.00\n\nclosing balance: 1692.50\n")

    def test_defaults_are_zero_opening_and_no_rules(self):
        code, out, _ = self.run_cli(["report", self.write("t.csv", TRANSACTIONS)])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_unreadable_transactions_file(self):
        missing = str(self.dir / "nope.csv")
        code, out, err = self.run_cli(["report", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: "
                              "No such file or directory\n")

    def test_unreadable_rules_file(self):
        # Review Focus 1.
        missing = str(self.dir / "nope.txt")
        code, out, err = self.run_cli(
            ["report", self.write("t.csv", TRANSACTIONS), "--rules", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: "
                              "No such file or directory\n")

    def test_malformed_row_rejects_the_whole_file(self):
        path = self.write("bad.csv", "date,amount,description\n"
                                     "2026-03-04,-7.50,Coffee\n"
                                     "2026-03-05,1.005,Rent\n")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {path}:3: amount has more than "
                              "two fractional digits: '1.005'\n")

    def test_bad_opening_amount_is_a_usage_error(self):
        code, out, err = self.run_cli(
            ["report", self.write("t.csv", TRANSACTIONS), "--opening", "1.005"])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn("usage:", err)

    def test_negative_opening_is_accepted(self):
        code, out, _ = self.run_cli(
            ["report", self.write("t.csv", "date,amount,description\n"),
             "--opening", "-50.25"])
        self.assertEqual((code, out), (0, "closing balance: -50.25\n"))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`.

- [ ] **Step 3: Write the implementation**

`ledgerlite/cli.py`:

```python
"""Command line entry point: the only module that touches the filesystem."""
import argparse
import sys
from decimal import Decimal
from pathlib import Path

from ledgerlite.parse import ParseError, parse_amount, parse_transactions
from ledgerlite.report import format_report
from ledgerlite.rules import parse_rules


def _opening(value: str) -> Decimal:
    try:
        return parse_amount(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError(str(error)) from None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="ledgerlite")
    subcommands = parser.add_subparsers(dest="command", required=True)
    report = subcommands.add_parser("report", help="print a categorized summary")
    report.add_argument("transactions", metavar="TRANSACTIONS")
    report.add_argument("--rules", metavar="RULES")
    report.add_argument("--opening", metavar="AMOUNT", type=_opening,
                        default=Decimal(0))
    return parser


def _fail(message: str, code: int) -> int:
    print(f"ledgerlite: {message}", file=sys.stderr)
    return code


def _read(path: str) -> str:
    return Path(path).read_text()


def main(argv: list[str] | None = None) -> int:
    try:
        args = _build_parser().parse_args(sys.argv[1:] if argv is None else argv)
    except SystemExit as exit_request:  # argparse already printed usage
        return int(exit_request.code or 0)

    try:
        transactions_text = _read(args.transactions)
        rules_text = _read(args.rules) if args.rules else ""
    except OSError as error:
        path = error.filename or args.transactions
        return _fail(f"cannot read {path}: {error.strerror or error}", 1)

    try:
        transactions = parse_transactions(transactions_text)
    except ParseError as error:
        return _fail(f"{args.transactions}:{error.line}: {error.message}", 2)

    print(format_report(transactions, parse_rules(rules_text), args.opening))
    return 0


if __name__ == "__main__":  # python3 -m ledgerlite.cli report ...
    sys.exit(main())
```

Note `_build_parser` returns the *top-level* parser (the one `parse_args` is called on), not the `report` subparser.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS.

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — every test from Tasks 1-5.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py test_cli.py
git commit -m "feat: add report CLI with exit codes for unreadable and malformed input"
```

---

### Task 6: End-to-end smoke check and README note

**Files:**
- Create: `README.md`
- Test: `test_cli.py` (add one subprocess test)

**Interfaces:**
- Consumes: `ledgerlite.cli.main` (Task 5).
- Produces: nothing other modules use.

The design gives no packaging file, so the invocation is `python3 -m ledgerlite.cli report ...` from the repo root. This task pins that down so nobody has to guess, and proves the exit codes survive a real process boundary.

- [ ] **Step 1: Write the failing test**

Append to `test_cli.py`:

```python
import subprocess
import sys


class SubprocessTest(unittest.TestCase):
    def test_module_invocation_prints_report_and_exits_zero(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "t.csv"
            path.write_text("date,amount,description\n2026-03-04,-7.50,Coffee\n")
            done = subprocess.run(
                [sys.executable, "-m", "ledgerlite.cli", "report", str(path)],
                capture_output=True, text=True, cwd=Path(__file__).parent)
        self.assertEqual(done.returncode, 0)
        self.assertEqual(done.stdout,
                         "uncategorized: -7.50\n\nclosing balance: -7.50\n")

    def test_module_invocation_exits_two_on_malformed_input(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "t.csv"
            path.write_text("date,amount,description\nnope,-7.50,Coffee\n")
            done = subprocess.run(
                [sys.executable, "-m", "ledgerlite.cli", "report", str(path)],
                capture_output=True, text=True, cwd=Path(__file__).parent)
        self.assertEqual(done.returncode, 2)
        self.assertEqual(done.stdout, "")
        self.assertIn("invalid date: 'nope'", done.stderr)
```

- [ ] **Step 2: Run the tests**

Run: `python3 -m unittest test_cli.SubprocessTest -v`
Expected: PASS — this exercises the `__main__` guard added in Task 5. If it fails with a usage error or empty stdout, the guard is wrong: it must be `sys.exit(main())` with no argument, so `main` reads `sys.argv` itself.

- [ ] **Step 3: Write the README**

`README.md`:

```markdown
# ledgerlite

Categorize a bank-transactions CSV and print per-category totals with the
closing balance. Python 3.11+, standard library only.

    python3 -m ledgerlite.cli report transactions.csv --rules rules.txt --opening 100

- `transactions.csv` has the header `date,amount,description`.
- `rules.txt` holds one `<substring>=<category>` rule per line; matching is
  case-insensitive on the description and the first match wins.
- Exit codes: `0` success, `1` a file could not be read, `2` the transactions
  file is malformed (nothing is printed to stdout in that case).

Run the tests with `python3 -m unittest`.
```

- [ ] **Step 4: Run the whole suite one more time**

Run: `python3 -m unittest -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add README.md test_cli.py
git commit -m "docs: document invocation and add end-to-end CLI checks"
```
