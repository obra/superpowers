# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only Python CLI that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Five small pure modules (`model`, `parse`, `rules`, `balance`, `report`) with no I/O, plus `cli.py` which owns all file reading, error messages, and exit codes. Money is `decimal.Decimal` end to end; the CLI is the only place that touches the filesystem or stderr, so every other module is testable by passing strings and lists.

**Tech Stack:** Python 3.11+, standard library only (`argparse`, `csv`, `dataclasses`, `datetime`, `decimal`, `re`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies.
- Amounts are `decimal.Decimal`, never `float`. No arithmetic on money goes through `float` at any point.
- Package lives in `ledgerlite/`; tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Exit codes: `0` success, `1` a file could not be read, `2` malformed input content.
- Error messages go to stderr, exactly:
  - `ledgerlite: cannot read <path>: <reason>`
  - `ledgerlite: <path>:<line>: <what is wrong>`
- On any error, nothing is written to stdout.
- Amounts are formatted with exactly two fractional digits, a leading `-` only for negative values, and no thousands separators.
- The literal category name for transactions matching no rule is `uncategorized`, and it is always printed last.

## Review Focus

These are input classes the spec implies but does not spell out. Each has a test in the task that owns the code.

1. An amount of `-0.00`, or a category whose amounts cancel out, must print as `0.00` — never `-0.00`. (Task 4)
2. A CSV with a missing or misspelled header row must be reported as malformed at line 1, not silently swallow its first data row as a header. (Task 1)
3. A transactions path that is a directory, or a file that is not valid UTF-8, must produce the `cannot read` message and exit 1 — not a traceback. (Task 5)
4. `--opening` given junk (`abc`) or three fractional digits (`1.005`) must be rejected with a usage error, not coerced or silently truncated. (Task 5)
5. Fields padded with spaces (`2026-03-04, -7.50, coffee`) are ordinary CSV in the wild; date and amount must be stripped before parsing rather than rejected as malformed. (Task 1)

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
  - `model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`.
  - `parse.ParseError(Exception)` — constructed `ParseError(lineno: int, message: str)`; attributes `.lineno` and `.message`; `str(e) == e.message`.
  - `parse.parse_amount(text: str) -> Decimal` — raises `ValueError` whose message is the `<what is wrong>` text.
  - `parse.parse_transactions(text: str) -> list[Transaction]` — rows in input order; raises `ParseError`.

Message wording is fixed here because later tasks and tests assert on it:

| Condition | message |
|---|---|
| header row not `date,amount,description` | `expected header 'date,amount,description'` |
| row has N != 3 fields | `expected 3 columns, got N` |
| date unparseable | `invalid date '<raw>'` |
| amount unparseable | `invalid amount '<raw>'` |
| amount has >2 fractional digits | `amount '<raw>' has more than two fractional digits` |

- [ ] **Step 1: Write the failing tests**

`test_parse.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_transactions

HEADER = "date,amount,description\n"


class ParseAmountTest(unittest.TestCase):
    def test_accepts_two_one_and_zero_decimal_places(self):
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1200"), Decimal("1200"))

    def test_rejects_three_decimal_places(self):
        with self.assertRaises(ValueError) as cm:
            parse_amount("1.005")
        self.assertEqual(str(cm.exception), "amount '1.005' has more than two fractional digits")

    def test_rejects_non_numbers(self):
        for raw in ["abc", "", "1.2.3", "NaN", "Infinity", "1e5", "--1"]:
            with self.subTest(raw=raw), self.assertRaises(ValueError) as cm:
                parse_amount(raw)
            self.assertEqual(str(cm.exception), f"invalid amount '{raw}'")

    def test_returns_decimal_not_float(self):
        self.assertIsInstance(parse_amount("0.10"), Decimal)


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = HEADER + "2026-03-05,-7.50,Coffee Shop\n2026-03-04,2500.00,Salary\n"
        self.assertEqual(
            parse_transactions(text),
            [
                Transaction(date(2026, 3, 5), Decimal("-7.50"), "Coffee Shop"),
                Transaction(date(2026, 3, 4), Decimal("2500.00"), "Salary"),
            ],
        )

    def test_empty_text_and_header_only_yield_no_transactions(self):
        self.assertEqual(parse_transactions(""), [])
        self.assertEqual(parse_transactions(HEADER), [])

    def test_quoted_description_may_contain_comma(self):
        text = HEADER + '2026-03-04,-1.00,"Coffee, large"\n'
        self.assertEqual(parse_transactions(text)[0].description, "Coffee, large")

    def test_strips_whitespace_around_date_and_amount(self):
        text = HEADER + "2026-03-04, -7.50 ,coffee\n"
        txn = parse_transactions(text)[0]
        self.assertEqual((txn.date, txn.amount), (date(2026, 3, 4), Decimal("-7.50")))

    def test_missing_header_is_rejected_at_line_1(self):
        with self.assertRaises(ParseError) as cm:
            parse_transactions("2026-03-04,-7.50,coffee\n")
        self.assertEqual((cm.exception.lineno, cm.exception.message),
                         (1, "expected header 'date,amount,description'"))

    def test_header_is_case_and_space_insensitive(self):
        parse_transactions("Date, Amount, Description\n")  # must not raise

    def test_wrong_column_count_reports_line_number(self):
        with self.assertRaises(ParseError) as cm:
            parse_transactions(HEADER + "2026-03-04,-7.50\n")
        self.assertEqual((cm.exception.lineno, cm.exception.message), (2, "expected 3 columns, got 2"))

    def test_bad_date_reports_line_number(self):
        with self.assertRaises(ParseError) as cm:
            parse_transactions(HEADER + "2026-03-04,-1.00,ok\n2026-13-01,-1.00,bad\n")
        self.assertEqual((cm.exception.lineno, cm.exception.message), (3, "invalid date '2026-13-01'"))

    def test_bad_amount_reports_line_number(self):
        with self.assertRaises(ParseError) as cm:
            parse_transactions(HEADER + "2026-03-04,abc,bad\n")
        self.assertEqual((cm.exception.lineno, cm.exception.message), (2, "invalid amount 'abc'"))

    def test_amount_with_three_decimals_is_malformed(self):
        with self.assertRaises(ParseError) as cm:
            parse_transactions(HEADER + "2026-03-04,1.005,bad\n")
        self.assertEqual(cm.exception.message, "amount '1.005' has more than two fractional digits")

    def test_first_bad_row_wins(self):
        with self.assertRaises(ParseError) as cm:
            parse_transactions(HEADER + "2026-03-04,abc,bad\n2026-99-99,1.00,also bad\n")
        self.assertEqual(cm.exception.lineno, 2)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write `ledgerlite/__init__.py` and `ledgerlite/model.py`**

`__init__.py` is empty. `model.py`:

```python
from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    date: date
    amount: Decimal
    description: str
```

- [ ] **Step 4: Write `ledgerlite/parse.py`**

```python
AMOUNT_RE = re.compile(r"-?\d+(\.\d+)?")   # used with fullmatch: no exponents, no NaN/Infinity
HEADER = ("date", "amount", "description")


class ParseError(Exception):
    def __init__(self, lineno: int, message: str) -> None: ...   # sets .lineno, .message; super().__init__(message)


def parse_amount(text: str) -> Decimal:
    """Decimal from an amount field. ValueError with the report-ready message on bad input."""
```

Implementation notes for `parse_amount`: strip `text`; if it does not fully match `AMOUNT_RE`, raise `ValueError(f"invalid amount '{text}'")`; build `Decimal(stripped)`; if `-value.as_tuple().exponent > 2`, raise `ValueError(f"amount '{text}' has more than two fractional digits")`; return the `Decimal`. Note the `'<raw>'` in both messages is the *stripped* text, matching the tests.

```python
def parse_transactions(text: str) -> list[Transaction]:
    """Parse the whole CSV. Raises ParseError on the first malformed row."""
```

Implementation notes:
- `reader = csv.reader(io.StringIO(text, newline=""))`; iterate with `for row in reader`, using `reader.line_num` as the line number so quoted embedded newlines still count correctly.
- If `text.strip() == ""`, return `[]` before touching the reader (an empty file is zero transactions, not a missing header).
- First row is the header: raise `ParseError(1, "expected header 'date,amount,description'")` unless `tuple(f.strip().lower() for f in row) == HEADER`.
- For each later row: `len(row) != 3` → `ParseError(reader.line_num, f"expected 3 columns, got {len(row)}")`; then `datetime.date.fromisoformat(row[0].strip())` wrapped so `ValueError` becomes `ParseError(reader.line_num, f"invalid date '{row[0].strip()}'")`; then `parse_amount(row[1])` wrapped so `ValueError` becomes `ParseError(reader.line_num, str(exc))`. Description is `row[2]` unchanged.
- Return the transactions in input order; do not sort here.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: Transaction model and transactions CSV parsing"
```

---

### Task 2: Rules file parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `parse.ParseError(lineno, message)`.
- Produces:
  - `rules.Rule` — type alias `tuple[str, str]` of `(substring, category)`.
  - `rules.parse_rules(text: str) -> list[Rule]` — rules in file order; raises `ParseError`.
  - `rules.categorize(description: str, rules: list[Rule]) -> str | None` — first case-insensitive substring match wins; `None` if nothing matches.

Fixed messages: `rule has no '='`, `rule has empty substring`, `rule has empty category`.

- [ ] **Step 1: Write the failing tests**

`test_rules.py`:

```python
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_rules_in_file_order(self):
        self.assertEqual(parse_rules("coffee=food\nrent=housing\n"),
                         [("coffee", "food"), ("rent", "housing")])

    def test_skips_blank_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\n\n   \n"), [("coffee", "food")])

    def test_empty_text_yields_no_rules(self):
        self.assertEqual(parse_rules(""), [])

    def test_splits_on_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_rules("  coffee = food  \n"), [("coffee", "food")])

    def test_line_without_equals_is_rejected(self):
        with self.assertRaises(ParseError) as cm:
            parse_rules("coffee=food\noops\n")
        self.assertEqual((cm.exception.lineno, cm.exception.message), (2, "rule has no '='"))

    def test_empty_substring_is_rejected(self):
        with self.assertRaises(ParseError) as cm:
            parse_rules("=food\n")
        self.assertEqual((cm.exception.lineno, cm.exception.message), (1, "rule has empty substring"))

    def test_empty_category_is_rejected(self):
        with self.assertRaises(ParseError) as cm:
            parse_rules("coffee=\n")
        self.assertEqual((cm.exception.lineno, cm.exception.message), (1, "rule has empty category"))


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing"), ("co", "other")]

    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("MORNING COFFEE", self.RULES), "food")
        self.assertEqual(categorize("Coffee Shop", self.RULES), "food")

    def test_first_matching_rule_wins(self):
        self.assertEqual(categorize("coffee", self.RULES), "food")
        self.assertEqual(categorize("Costco", self.RULES), "other")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_no_rules_means_no_category(self):
        self.assertIsNone(categorize("coffee", []))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write `ledgerlite/rules.py`**

```python
Rule = tuple[str, str]


def parse_rules(text: str) -> list[Rule]:
    """One `<substring>=<category>` per line. Raises ParseError on a bad line."""


def categorize(description: str, rules: list[Rule]) -> str | None:
    """Category of the first rule whose substring appears in description, else None."""
```

Implementation notes:
- `parse_rules`: `enumerate(text.splitlines(), start=1)`; skip lines that are empty after `.strip()`; `if "=" not in line` → `ParseError(lineno, "rule has no '='")`; `substring, _, category = line.partition("=")`, then strip both; empty substring or category → the matching `ParseError`. Append `(substring, category)`.
- `categorize`: lowercase the description once, then `for substring, category in rules: if substring.lower() in lowered: return category`; fall through to `None`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: rules file parsing and categorization"
```

---

### Task 3: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `model.Transaction`.
- Produces:
  - `balance.in_date_order(transactions: list[Transaction]) -> list[Transaction]` — new list, sorted by date, ties keeping input order.
  - `balance.running_balance(opening: Decimal, transactions: list[Transaction]) -> list[Decimal]` — balance after each transaction, in date order.
  - `balance.closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal` — last running balance, or `opening` when there are none.

- [ ] **Step 1: Write the failing tests**

`test_balance.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, in_date_order, running_balance
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class InDateOrderTest(unittest.TestCase):
    def test_sorts_by_date(self):
        self.assertEqual(in_date_order([txn(5, "1"), txn(4, "2")]), [txn(4, "2"), txn(5, "1")])

    def test_ties_keep_input_order(self):
        first, second = txn(4, "1", "first"), txn(4, "2", "second")
        self.assertEqual(in_date_order([first, second]), [first, second])
        self.assertEqual(in_date_order([second, first]), [second, first])

    def test_does_not_mutate_input(self):
        given = [txn(5, "1"), txn(4, "2")]
        in_date_order(given)
        self.assertEqual(given, [txn(5, "1"), txn(4, "2")])


class BalanceTest(unittest.TestCase):
    def test_running_balance_follows_date_order(self):
        self.assertEqual(
            running_balance(Decimal("100"), [txn(5, "-7.50"), txn(4, "2500.00")]),
            [Decimal("2600.00"), Decimal("2592.50")],
        )

    def test_closing_balance_is_the_last_running_balance(self):
        self.assertEqual(closing_balance(Decimal("100"), [txn(4, "-7.50"), txn(4, "-900.00"),
                                                          txn(5, "2500.00")]), Decimal("1692.50"))

    def test_closing_balance_of_no_transactions_is_the_opening_amount(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))
        self.assertEqual(running_balance(Decimal("100"), []), [])

    def test_money_stays_decimal(self):
        self.assertIsInstance(closing_balance(Decimal("0"), [txn(4, "0.10"), txn(4, "0.20")]), Decimal)
        self.assertEqual(closing_balance(Decimal("0"), [txn(4, "0.10"), txn(4, "0.20")]), Decimal("0.30"))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write `ledgerlite/balance.py`**

```python
def in_date_order(transactions: list[Transaction]) -> list[Transaction]:
    """Copy sorted by date; Python's sort is stable, so ties keep input order."""
    return sorted(transactions, key=lambda t: t.date)


def running_balance(opening: Decimal, transactions: list[Transaction]) -> list[Decimal]:
    """Balance after each transaction, walking them in date order."""


def closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal:
    """Balance after the last transaction, or opening if there are none."""
```

Implementation notes: `running_balance` accumulates `balance += t.amount` over `in_date_order(transactions)`, appending after each add. `closing_balance` returns the last element of `running_balance(...)` or `opening` for an empty list. Never convert to `float`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: date ordering and running/closing balance"
```

---

### Task 4: Category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `model.Transaction`, `rules.Rule`, `rules.categorize`, `balance.closing_balance`.
- Produces:
  - `report.UNCATEGORIZED = "uncategorized"`
  - `report.format_amount(amount: Decimal) -> str` — exactly two fractional digits; `-` only for values below zero.
  - `report.category_totals(transactions: list[Transaction], rules: list[Rule]) -> list[tuple[str, Decimal]]` — categories alphabetically (case-insensitive), `uncategorized` last.
  - `report.format_report(transactions, rules, opening: Decimal) -> str` — the whole report, ending in a single newline.

- [ ] **Step 1: Write the failing tests**

`test_report.py`:

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
    def test_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.8")), "1234567.80")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
        self.assertEqual(format_amount(Decimal("-0.50") + Decimal("0.50")), "0.00")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_per_category_alphabetically_with_uncategorized_last(self):
        transactions = [txn(4, "-900.00", "Rent"), txn(4, "2500.00", "Salary"),
                        txn(5, "-7.50", "Coffee"), txn(6, "-2.50", "coffee again")]
        self.assertEqual(
            category_totals(transactions, RULES),
            [("food", Decimal("-10.00")), ("housing", Decimal("-900.00")),
             ("uncategorized", Decimal("2500.00"))],
        )

    def test_uncategorized_absent_when_every_row_matches(self):
        self.assertEqual(category_totals([txn(4, "-7.50", "Coffee")], RULES),
                         [("food", Decimal("-7.50"))])

    def test_without_rules_everything_is_uncategorized(self):
        self.assertEqual(category_totals([txn(4, "-7.50", "Coffee")], []),
                         [("uncategorized", Decimal("-7.50"))])

    def test_no_transactions_yields_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_alphabetical_order_ignores_case(self):
        rules = [("a", "Zebra"), ("b", "apple")]
        totals = category_totals([txn(4, "1.00", "a"), txn(4, "1.00", "b")], rules)
        self.assertEqual([name for name, _ in totals], ["apple", "Zebra"])


class FormatReportTest(unittest.TestCase):
    def test_matches_the_spec_example(self):
        transactions = [txn(4, "-900.00", "Rent"), txn(5, "-7.50", "Coffee"),
                        txn(6, "2500.00", "Salary")]
        self.assertEqual(
            format_report(transactions, RULES, Decimal("100")),
            "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50\n",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(format_report([], RULES, Decimal("0")), "\nclosing balance: 0.00\n")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Write `ledgerlite/report.py`**

```python
UNCATEGORIZED = "uncategorized"
TWO_PLACES = Decimal("0.01")


def format_amount(amount: Decimal) -> str:
    """Two fractional digits, leading '-' only for values below zero."""


def category_totals(transactions, rules) -> list[tuple[str, Decimal]]:
    """(category, total) pairs, alphabetical case-insensitively, UNCATEGORIZED last."""


def format_report(transactions, rules, opening: Decimal) -> str:
    """Category lines, a blank line, then the closing balance. Ends with one newline."""
```

Implementation notes:
- `format_amount`: `quantized = amount.quantize(TWO_PLACES)`; if `quantized == 0`, use `abs(quantized)` so `-0.00` becomes `0.00`; return `f"{quantized:f}"` (plain `f` format — never `,`, never `float`).
- `category_totals`: accumulate into a `dict[str, Decimal]` keyed by `categorize(t.description, rules) or UNCATEGORIZED`, seeding new keys with `Decimal("0")`; then sort the non-`UNCATEGORIZED` keys with `key=lambda name: (name.casefold(), name)` and append `UNCATEGORIZED` at the end if present. A rules file that literally names a category `uncategorized` therefore merges with the unmatched bucket and lands last — that is fine.
- `format_report`: `[f"{name}: {format_amount(total)}" for name, total in category_totals(...)]`, then `""`, then `f"closing balance: {format_amount(closing_balance(opening, transactions))}"`; `"\n".join(lines) + "\n"`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (all tests)

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
- Consumes: `parse.ParseError`, `parse.parse_amount`, `parse.parse_transactions`, `rules.parse_rules`, `report.format_report`.
- Produces: `cli.main(argv: list[str] | None = None) -> int`.

`__main__.py` is not in the spec's file list but is needed to run the package as `python3 -m ledgerlite report ...`; it is three lines and adds no logic.

Behavior:
- `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`.
- `--opening` defaults to `0` and is validated with `parse.parse_amount`; a bad value is an argparse usage error (stderr, exit 2).
- Unreadable transactions *or* rules file → `ledgerlite: cannot read <path>: <reason>` on stderr, return 1. `<reason>` is `exc.strerror` for `OSError`, otherwise `str(exc)`.
- `ParseError` from either file → `ledgerlite: <path>:<lineno>: <message>` on stderr, return 2.
- Success → write the report to stdout, return 0. Nothing reaches stdout on either error path.

- [ ] **Step 1: Write the failing tests**

`test_cli.py`:

```python
import io
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from tempfile import TemporaryDirectory

from ledgerlite.cli import main

CSV = ("date,amount,description\n"
       "2026-03-06,2500.00,Salary\n"
       "2026-03-04,-900.00,Monthly Rent\n"
       "2026-03-05,-7.50,Coffee Shop\n")
RULES = "coffee=food\nrent=housing\n"


class CliTest(unittest.TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)

    def write(self, name, text):
        path = self.dir / name
        path.write_text(text, encoding="utf-8")
        return str(path)

    def run_cli(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_reports_the_spec_example(self):
        code, out, err = self.run_cli(["report", self.write("t.csv", CSV),
                                       "--rules", self.write("r.txt", RULES), "--opening", "100"])
        self.assertEqual(code, 0)
        self.assertEqual(err, "")
        self.assertEqual(out, "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n"
                              "\nclosing balance: 1692.50\n")

    def test_defaults_no_rules_and_zero_opening(self):
        code, out, _ = self.run_cli(["report", self.write("t.csv", CSV)])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_missing_transactions_file(self):
        path = str(self.dir / "nope.csv")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

    def test_transactions_path_is_a_directory(self):
        code, out, err = self.run_cli(["report", str(self.dir)])
        self.assertEqual((code, out), (1, ""))
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.dir}: "))

    def test_transactions_file_is_not_utf8(self):
        path = self.dir / "bin.csv"
        path.write_bytes(b"date,amount,description\n2026-03-04,-1.00,\xff\xfe\n")
        code, out, err = self.run_cli(["report", str(path)])
        self.assertEqual((code, out), (1, ""))
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {path}: "))

    def test_missing_rules_file(self):
        rules_path = str(self.dir / "nope.txt")
        code, out, err = self.run_cli(["report", self.write("t.csv", CSV), "--rules", rules_path])
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(err, f"ledgerlite: cannot read {rules_path}: No such file or directory\n")

    def test_malformed_row_reports_path_and_line_and_exits_2(self):
        path = self.write("t.csv", "date,amount,description\n2026-03-04,1.005,oops\n")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(err, f"ledgerlite: {path}:2: "
                              "amount '1.005' has more than two fractional digits\n")

    def test_malformed_rules_line_reports_rules_path_and_exits_2(self):
        rules_path = self.write("r.txt", "coffee=food\noops\n")
        code, out, err = self.run_cli(["report", self.write("t.csv", CSV), "--rules", rules_path])
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(err, f"ledgerlite: {rules_path}:2: rule has no '='\n")

    def test_bad_opening_is_a_usage_error(self):
        for value in ["abc", "1.005"]:
            with self.subTest(value=value), self.assertRaises(SystemExit) as cm:
                self.run_cli(["report", self.write("t.csv", CSV), "--opening", value])
            self.assertEqual(cm.exception.code, 2)

    def test_negative_opening_is_allowed(self):
        code, out, _ = self.run_cli(["report", self.write("t.csv", "date,amount,description\n"),
                                     "--opening", "-5"])
        self.assertEqual((code, out), (0, "\nclosing balance: -5.00\n"))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write `ledgerlite/cli.py`**

```python
def _opening_amount(text: str) -> Decimal:
    """argparse type for --opening; ArgumentTypeError becomes a usage error."""


def _read(path: str) -> str:
    """Read a UTF-8 text file, letting OSError/UnicodeDecodeError escape to main."""


def main(argv: list[str] | None = None) -> int:
    """Parse args, print the report or an error message. Returns the exit code."""
```

Implementation notes:
- `_opening_amount`: call `parse_amount(text)`, converting `ValueError` into `argparse.ArgumentTypeError(str(exc))`.
- Parser: `argparse.ArgumentParser(prog="ledgerlite")` with `add_subparsers(dest="command", required=True)`; subparser `report` with positional `transactions`, `--rules` (default `None`), `--opening` (`type=_opening_amount`, `default=Decimal("0")`).
- `_read`: `Path(path).read_text(encoding="utf-8")`.
- In `main`, one `try` per file, in this order — rules only if `--rules` was given:
  - `except OSError as exc:` print `f"ledgerlite: cannot read {path}: {exc.strerror}"` to `sys.stderr`; `return 1`.
  - `except UnicodeDecodeError as exc:` same message shape with `str(exc)` as the reason; `return 1`.
  - `except ParseError as exc:` print `f"ledgerlite: {path}:{exc.lineno}: {exc.message}"`; `return 2`.
- Parse both files *before* writing anything to stdout, then `sys.stdout.write(format_report(transactions, rules, args.opening))` and `return 0`.
- Write errors with `print(..., file=sys.stderr)` so the tests' `redirect_stderr` captures them.

- [ ] **Step 4: Write `ledgerlite/__main__.py`**

```python
import sys

from ledgerlite.cli import main

sys.exit(main())
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (all tests)

- [ ] **Step 6: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — every test from Tasks 1–5.

- [ ] **Step 7: Check the CLI end to end by hand**

```bash
printf 'date,amount,description\n2026-03-06,2500.00,Salary\n2026-03-04,-900.00,Monthly Rent\n2026-03-05,-7.50,Coffee Shop\n' > /tmp/t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/r.txt
python3 -m ledgerlite report /tmp/t.csv --rules /tmp/r.txt --opening 100
```

Expected: the four report lines from `design.md`, ending `closing balance: 1692.50`, and `echo $?` prints `0`.

- [ ] **Step 8: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: ledgerlite report CLI"
```
