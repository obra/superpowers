# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only CLI that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules, each one responsibility, wired bottom-up: `model` (data), `parse` (CSV text → transactions), `rules` (rules text → matchers), `balance` (ordering and closing balance), `report` (totals and formatting), `cli` (argparse, file I/O, exit codes). All I/O and all user-facing error text live in `cli`; the lower modules take and return strings and objects and raise `ParseError`, so every rule is unit-testable without touching the filesystem.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `dataclasses`, `argparse`, `re`, `unittest`).

**Spec:** `design.md` (repo root)

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies.
- Money is `decimal.Decimal` everywhere. Never `float`, at any point, including in tests.
- Package lives at `ledgerlite/` in the repo root. Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest` from the repo root.
- Exit codes: `0` success, `1` a named input file cannot be read, `2` input content is malformed (includes argparse usage errors).
- All error text goes to stderr, one line, ending in a newline. On any error nothing is written to stdout.
- Fixed error message formats (used verbatim, `{}` filled in):
  - `ledgerlite: cannot read {path}: {reason}`
  - `ledgerlite: {path}:{line}: {message}`
  - `ledgerlite: --opening: {message}`
- Fixed `{message}` values (`!r` means Python `repr`, e.g. `'1.005'`):
  - `expected header 'date,amount,description'`
  - `expected 3 columns, got {n}`
  - `invalid date {value!r}`
  - `invalid amount {value!r}`
  - `amount {value!r} has more than two decimal places`
  - `rule has no '='`
- Amounts print with exactly two fractional digits, a leading `-` only for values below zero, and no thousands separators.
- `line` in messages is the 1-based physical line number of the input file, so the first data row of a CSV is line 2.

## Review Focus

These are input classes the spec implies but does not enumerate. Each has a test in the task that owns the code; they are listed here because they are the ones most likely to bite a real user.

1. **Amount strings `Decimal()` happily accepts but a ledger must not** — `NaN`, `Infinity`, `1e5`, `""`. `Decimal("NaN")` succeeds and then poisons every sum, so amounts must be validated by regex before construction, not by catching `InvalidOperation`. (Task 1)
2. **Sloppy or impossible dates** — `date.fromisoformat` accepts the compact form `20260304`, so a shape check must come first; `2026-3-4`, `2026-02-30`, and `04/03/2026` must all be rejected as malformed rather than silently reinterpreted. (Task 1)
3. **Real-world CSV shape** — a UTF-8 BOM from a spreadsheet export, CRLF line endings, a quoted description containing a comma, and a missing or misnamed header row. A file whose header is absent must not have its first transaction silently swallowed as a header. (Tasks 2 and 7)
4. **Zero and negative zero** — a category whose amounts cancel, and a literal `-0.00` in the input, must both print `0.00`, not `-0.00`, and a transaction-free file must still print a closing balance. (Task 6)
5. **Unreadable inputs other than "file not found"** — a directory passed as the transactions path, a file containing non-UTF-8 bytes, and an unreadable `--rules` path all take the exit-1 "cannot read" path, not a traceback. (Task 7)

---

## File Structure

| File | Responsibility |
| --- | --- |
| `ledgerlite/__init__.py` | Empty package marker. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No logic. |
| `ledgerlite/parse.py` | `ParseError`; field parsers (`parse_amount`, `parse_date`); `parse_transactions(text)`. |
| `ledgerlite/rules.py` | `parse_rules(text)`; `categorize(description, rules)`. |
| `ledgerlite/balance.py` | `order_by_date`; `closing_balance`. |
| `ledgerlite/report.py` | `category_totals`; `format_amount`; `format_report`. |
| `ledgerlite/cli.py` | argparse wiring, file reading, error messages, exit codes, `main(argv) -> int`. |
| `ledgerlite/__main__.py` | `sys.exit(main())` so `python3 -m ledgerlite` works. |
| `test_parse.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py` | Unit tests per module; `test_cli.py` also holds the end-to-end tests. |

---

## Task 1: Transaction model and field parsers

**Files:**
- Create: `ledgerlite/__init__.py` (empty)
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `model.Transaction` — frozen dataclass, fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`.
  - `parse.ParseError(Exception)` — `__init__(self, line: int, message: str)`, attributes `.line: int` and `.message: str`, `str(err) == err.message`.
  - `parse.parse_amount(text: str) -> decimal.Decimal` — raises `ValueError`.
  - `parse.parse_date(text: str) -> datetime.date` — raises `ValueError`.
  - Neither field parser strips whitespace; callers strip first.

- [ ] **Step 1: Write the failing tests**

Create `test_parse.py`:

```python
import dataclasses
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_date


class TransactionTest(unittest.TestCase):
    def test_holds_three_fields_and_is_frozen(self):
        txn = Transaction(
            date=datetime.date(2026, 3, 4),
            amount=Decimal("-7.50"),
            description="Coffee Bar",
        )
        self.assertEqual(txn.date, datetime.date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("-7.50"))
        self.assertEqual(txn.description, "Coffee Bar")
        with self.assertRaises(dataclasses.FrozenInstanceError):
            txn.amount = Decimal("0")


class ParseErrorTest(unittest.TestCase):
    def test_carries_line_and_message(self):
        err = ParseError(7, "invalid amount 'abc'")
        self.assertEqual(err.line, 7)
        self.assertEqual(err.message, "invalid amount 'abc'")
        self.assertEqual(str(err), "invalid amount 'abc'")


class ParseAmountTest(unittest.TestCase):
    def test_accepts_zero_one_or_two_fractional_digits(self):
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("2500"), Decimal("2500"))
        self.assertEqual(parse_amount("+7.25"), Decimal("7.25"))
        self.assertEqual(parse_amount("-0.00"), Decimal("-0.00"))

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError) as ctx:
            parse_amount("1.005")
        self.assertEqual(
            str(ctx.exception), "amount '1.005' has more than two decimal places"
        )

    def test_rejects_non_decimal_text(self):
        for bad in ("", "abc", "NaN", "nan", "Infinity", "-inf", "1e5",
                    "1,000.00", "$5.00", "1.2.3", "1.", ".5", " 1.50"):
            with self.subTest(bad=bad):
                with self.assertRaises(ValueError) as ctx:
                    parse_amount(bad)
                self.assertEqual(str(ctx.exception), f"invalid amount {bad!r}")


class ParseDateTest(unittest.TestCase):
    def test_accepts_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), datetime.date(2026, 3, 4))

    def test_rejects_sloppy_and_impossible_dates(self):
        for bad in ("", "2026-3-4", "20260304", "2026-02-30", "2026-13-01",
                    "04/03/2026", "2026-03-04T10:00:00", "not a date"):
            with self.subTest(bad=bad):
                with self.assertRaises(ValueError) as ctx:
                    parse_date(bad)
                self.assertEqual(str(ctx.exception), f"invalid date {bad!r}")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Create the package and `Transaction` in `ledgerlite/model.py`**

Empty `ledgerlite/__init__.py`. `Transaction` is `@dataclasses.dataclass(frozen=True)` with the three fields in the order `date, amount, description`.

- [ ] **Step 4: Implement `ParseError`, `parse_amount`, and `parse_date` in `ledgerlite/parse.py`**

`parse_amount` matches `^[+-]?\d+(?:\.\d+)?$` (fullmatch) first — anything else raises `ValueError(f"invalid amount {text!r}")`; then, if a `.` is present and more than two digits follow it, raises `ValueError(f"amount {text!r} has more than two decimal places")`; then returns `Decimal(text)`.

`parse_date` matches `^\d{4}-\d{2}-\d{2}$` (fullmatch) first, then returns `datetime.date.fromisoformat(text)`, converting its `ValueError` into `ValueError(f"invalid date {text!r}")`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: add Transaction model and amount/date field parsers"
```

---

## Task 2: CSV row parsing

**Files:**
- Modify: `ledgerlite/parse.py` (add `parse_transactions`)
- Test: `test_parse.py` (add cases)

**Interfaces:**
- Consumes: `Transaction`, `ParseError`, `parse_amount`, `parse_date` from Task 1.
- Produces: `parse.parse_transactions(text: str) -> list[Transaction]` — returns transactions in input order (no sorting), raises `ParseError` on the first bad line. Line 1 must be the header; data rows start at line 2.

- [ ] **Step 1: Write the failing tests**

Append to `test_parse.py` (add `from ledgerlite.parse import parse_transactions` to the imports):

```python
CSV = """date,amount,description
2026-03-01,-900.00,Rent March
2026-03-04,-7.50,Coffee Bar
"""


class ParseTransactionsTest(unittest.TestCase):
    def test_returns_rows_in_input_order(self):
        txns = parse_transactions(CSV)
        self.assertEqual(len(txns), 2)
        self.assertEqual(txns[0].description, "Rent March")
        self.assertEqual(txns[0].amount, Decimal("-900.00"))
        self.assertEqual(txns[0].date, datetime.date(2026, 3, 1))
        self.assertEqual(txns[1].description, "Coffee Bar")

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions("date,amount,description\n"), [])

    def test_header_may_vary_in_case_and_spacing(self):
        text = "Date, Amount , DESCRIPTION\n2026-03-04,-7.50,Coffee Bar\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_rejects_missing_or_wrong_header(self):
        for text in ("", "2026-03-04,-7.50,Coffee Bar\n", "date,amount\n"):
            with self.subTest(text=text):
                with self.assertRaises(ParseError) as ctx:
                    parse_transactions(text)
                self.assertEqual(ctx.exception.line, 1)
                self.assertEqual(
                    ctx.exception.message,
                    "expected header 'date,amount,description'",
                )

    def test_reports_wrong_column_count_with_line_number(self):
        text = "date,amount,description\n2026-03-01,-900.00,Rent\n2026-03-04,-7.50\n"
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 3)
        self.assertEqual(ctx.exception.message, "expected 3 columns, got 2")

    def test_blank_line_is_a_column_count_error(self):
        text = "date,amount,description\n\n2026-03-04,-7.50,Coffee\n"
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(ctx.exception.message, "expected 3 columns, got 0")

    def test_propagates_field_errors_with_line_number(self):
        cases = [
            ("2026-13-01,-7.50,Coffee", "invalid date '2026-13-01'"),
            ("2026-03-04,abc,Coffee", "invalid amount 'abc'"),
            ("2026-03-04,1.005,Coffee", "amount '1.005' has more than two decimal places"),
        ]
        for row, message in cases:
            with self.subTest(row=row):
                with self.assertRaises(ParseError) as ctx:
                    parse_transactions(f"date,amount,description\n{row}\n")
                self.assertEqual(ctx.exception.line, 2)
                self.assertEqual(ctx.exception.message, message)

    def test_quoted_description_may_contain_a_comma(self):
        text = 'date,amount,description\n2026-03-04,-7.50,"Coffee, large"\n'
        self.assertEqual(parse_transactions(text)[0].description, "Coffee, large")

    def test_accepts_crlf_line_endings(self):
        text = "date,amount,description\r\n2026-03-04,-7.50,Coffee Bar\r\n"
        self.assertEqual(parse_transactions(text)[0].description, "Coffee Bar")

    def test_strips_surrounding_whitespace_from_fields(self):
        text = "date,amount,description\n 2026-03-04 , -7.50 , Coffee Bar \n"
        txn = parse_transactions(text)[0]
        self.assertEqual(txn.date, datetime.date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("-7.50"))
        self.assertEqual(txn.description, "Coffee Bar")

    def test_two_rows_may_share_a_date(self):
        text = ("date,amount,description\n"
                "2026-03-04,-7.50,Coffee\n2026-03-04,-2.00,Tea\n")
        self.assertEqual(len(parse_transactions(text)), 2)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'parse_transactions'`

- [ ] **Step 3: Implement `parse_transactions(text: str) -> list[Transaction]` in `ledgerlite/parse.py`**

Read rows with `csv.reader(text.splitlines())`, enumerating from line 1. Line 1 is the header: accept it when its fields, stripped and lowercased, equal `["date", "amount", "description"]`; otherwise raise. No rows at all (empty text) is also a header error at line 1. For each later row: reject when `len(row) != 3`, then strip each field and pass them to `parse_date` / `parse_amount`, converting a `ValueError` into `ParseError(line, str(err))`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (18 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV with per-line error reporting"
```

---

## Task 3: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ParseError` from Task 1.
- Produces:
  - `rules.parse_rules(text: str) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order, substring lowercased, category kept as written; raises `ParseError` for a line with no `=`.
  - `rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first matching rule wins, matching case-insensitively.

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_returns_pairs_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_lowercases_substring_and_keeps_category_case(self):
        self.assertEqual(parse_rules("Coffee=Food & Drink\n"),
                         [("coffee", "Food & Drink")])

    def test_strips_whitespace_around_line_and_parts(self):
        self.assertEqual(parse_rules("  coffee = food  \n"), [("coffee", "food")])

    def test_skips_blank_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\n\n   \n"),
                         [("coffee", "food")])

    def test_empty_text_has_no_rules(self):
        self.assertEqual(parse_rules(""), [])

    def test_splits_on_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_line_without_equals_is_an_error_with_its_line_number(self):
        with self.assertRaises(ParseError) as ctx:
            parse_rules("coffee=food\noops\n")
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(ctx.exception.message, "rule has no '='")


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("BIG COFFEE BAR", self.RULES), "food")
        self.assertEqual(categorize("Rent March", self.RULES), "housing")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("bar", "leisure")]
        self.assertEqual(categorize("Coffee Bar", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_when_there_are_no_rules(self):
        self.assertIsNone(categorize("Coffee Bar", []))

    def test_empty_substring_matches_everything(self):
        self.assertEqual(categorize("Salary", [("", "other")]), "other")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `parse_rules` and `categorize` in `ledgerlite/rules.py`**

`parse_rules`: enumerate `text.splitlines()` from 1, strip each line, skip empties, `partition("=")` and raise `ParseError(line, "rule has no '='")` when there is no separator, then append `(substring.strip().lower(), category.strip())`.

`categorize`: lowercase the description once, return the first category whose substring is `in` it, else `None`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (12 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules file parsing and description categorization"
```

---

## Task 4: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` from Task 1.
- Produces:
  - `balance.order_by_date(transactions: Iterable[Transaction]) -> list[Transaction]` — stable sort by `date`, ties keep input order; does not mutate its argument.
  - `balance.closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal` — `opening` plus each amount added in the order given.

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def txn(day, amount, description):
    return Transaction(
        date=datetime.date(2026, 3, day),
        amount=Decimal(amount),
        description=description,
    )


class OrderByDateTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(4, "-7.50", "Coffee"), txn(1, "-900.00", "Rent")]
        self.assertEqual([t.description for t in order_by_date(rows)],
                         ["Rent", "Coffee"])

    def test_ties_keep_input_order(self):
        rows = [txn(4, "-7.50", "Coffee"), txn(4, "-2.00", "Tea"),
                txn(1, "-900.00", "Rent")]
        self.assertEqual([t.description for t in order_by_date(rows)],
                         ["Rent", "Coffee", "Tea"])

    def test_does_not_mutate_input(self):
        rows = [txn(4, "-7.50", "Coffee"), txn(1, "-900.00", "Rent")]
        order_by_date(rows)
        self.assertEqual([t.description for t in rows], ["Coffee", "Rent"])

    def test_empty_input(self):
        self.assertEqual(order_by_date([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening(self):
        rows = [txn(1, "-900.00", "Rent"), txn(2, "2500.00", "Salary"),
                txn(4, "-7.50", "Coffee")]
        self.assertEqual(closing_balance(Decimal("100"), rows),
                         Decimal("1692.50"))

    def test_no_transactions_returns_the_opening(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))
        self.assertEqual(closing_balance(Decimal("0"), []), Decimal("0"))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `order_by_date` and `closing_balance` in `ledgerlite/balance.py`**

`order_by_date` returns `sorted(transactions, key=...)` on the date — `sorted` is stable, which is what "ties keep input order" requires. `closing_balance` folds the amounts onto `opening` with a loop or `sum(..., start=opening)`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```

---

## Task 5: Per-category totals

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 3).
- Produces:
  - `report.UNCATEGORIZED = "uncategorized"`.
  - `report.category_totals(transactions: Iterable[Transaction], rules: list[tuple[str, str]]) -> dict[str, Decimal]` — maps category name (or `UNCATEGORIZED`) to the sum of its amounts. Categories with no transactions are absent from the dict.

- [ ] **Step 1: Write the failing tests**

Create `test_report.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import UNCATEGORIZED, category_totals

RULES = [("coffee", "food"), ("rent", "housing")]


def txn(day, amount, description):
    return Transaction(
        date=datetime.date(2026, 3, day),
        amount=Decimal(amount),
        description=description,
    )


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_each_category_and_the_uncategorized_rest(self):
        rows = [txn(1, "-900.00", "Rent March"), txn(2, "2500.00", "Salary"),
                txn(4, "-7.50", "Coffee Bar")]
        self.assertEqual(
            category_totals(rows, RULES),
            {"housing": Decimal("-900.00"), UNCATEGORIZED: Decimal("2500.00"),
             "food": Decimal("-7.50")},
        )

    def test_two_substrings_may_share_a_category(self):
        rules = [("coffee", "food"), ("tea", "food")]
        rows = [txn(1, "-7.50", "Coffee Bar"), txn(2, "-2.00", "Tea House")]
        self.assertEqual(category_totals(rows, rules),
                         {"food": Decimal("-9.50")})

    def test_without_rules_everything_is_uncategorized(self):
        rows = [txn(1, "-900.00", "Rent March"), txn(2, "2500.00", "Salary")]
        self.assertEqual(category_totals(rows, []),
                         {UNCATEGORIZED: Decimal("1600.00")})

    def test_a_rule_named_uncategorized_merges_with_the_unmatched(self):
        rows = [txn(1, "-7.50", "Coffee Bar"), txn(2, "2500.00", "Salary")]
        self.assertEqual(category_totals(rows, [("coffee", "uncategorized")]),
                         {UNCATEGORIZED: Decimal("2492.50")})

    def test_no_transactions_gives_no_categories(self):
        self.assertEqual(category_totals([], RULES), {})

    def test_uncategorized_key_is_absent_when_every_row_matches(self):
        rows = [txn(1, "-900.00", "Rent March")]
        self.assertEqual(category_totals(rows, RULES),
                         {"housing": Decimal("-900.00")})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `UNCATEGORIZED` and `category_totals` in `ledgerlite/report.py`**

For each transaction, `categorize(...) or UNCATEGORIZED` gives the key; accumulate into a dict with `Decimal("0")` as the starting value.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals"
```

---

## Task 6: Amount and report formatting

**Files:**
- Modify: `ledgerlite/report.py` (add `format_amount`, `format_report`)
- Test: `test_report.py` (add cases)

**Interfaces:**
- Consumes: `order_by_date`, `closing_balance` (Task 4), `category_totals` (Task 5).
- Produces:
  - `report.format_amount(amount: Decimal) -> str` — exactly two fractional digits, `-` only when the value is less than zero (so `Decimal("-0.00")` prints `0.00`), no thousands separators.
  - `report.format_report(opening: Decimal, transactions: list[Transaction], rules: list[tuple[str, str]]) -> str` — the whole report, ending with a trailing newline: one `<category>: <total>` line per category sorted with plain `sorted()`, `uncategorized` forced last, then a blank line, then `closing balance: <amount>`.

- [ ] **Step 1: Write the failing tests**

Append to `test_report.py` (add `format_amount, format_report` to the `ledgerlite.report` import):

```python
class FormatAmountTest(unittest.TestCase):
    def test_formats_with_exactly_two_fractional_digits(self):
        cases = [
            (Decimal("-12.50"), "-12.50"),
            (Decimal("0"), "0.00"),
            (Decimal("0.00"), "0.00"),
            (Decimal("-0.00"), "0.00"),
            (Decimal("1200"), "1200.00"),
            (Decimal("-0.5"), "-0.50"),
            (Decimal("1.5"), "1.50"),
            (Decimal("1234567.5"), "1234567.50"),
        ]
        for amount, expected in cases:
            with self.subTest(amount=amount):
                self.assertEqual(format_amount(amount), expected)

    def test_cancelling_amounts_print_as_positive_zero(self):
        total = Decimal("-1.50") + Decimal("1.50")
        self.assertEqual(format_amount(total), "0.00")


class FormatReportTest(unittest.TestCase):
    def test_matches_the_example_from_the_design(self):
        rows = [txn(1, "-900.00", "Rent March"), txn(4, "-7.50", "Coffee Bar"),
                txn(2, "2500.00", "Salary")]
        self.assertEqual(
            format_report(Decimal("100"), rows, RULES),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_categories_are_alphabetical_with_uncategorized_last(self):
        rules = [("zoo", "zebras"), ("apple", "apples")]
        rows = [txn(1, "-1.00", "Zoo trip"), txn(2, "-2.00", "Salary"),
                txn(3, "-4.00", "Apple Store")]
        self.assertEqual(
            format_report(Decimal("0"), rows, rules),
            "apples: -4.00\n"
            "zebras: -1.00\n"
            "uncategorized: -2.00\n"
            "\n"
            "closing balance: -7.00\n",
        )

    def test_no_uncategorized_line_when_every_row_matches(self):
        rows = [txn(1, "-900.00", "Rent March")]
        self.assertEqual(
            format_report(Decimal("1000"), rows, RULES),
            "housing: -900.00\n\nclosing balance: 100.00\n",
        )

    def test_no_transactions_still_prints_the_closing_balance(self):
        self.assertEqual(format_report(Decimal("0"), [], RULES),
                         "\nclosing balance: 0.00\n")
        self.assertEqual(format_report(Decimal("100"), [], RULES),
                         "\nclosing balance: 100.00\n")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ImportError: cannot import name 'format_amount'`

- [ ] **Step 3: Implement `format_amount` in `ledgerlite/report.py`**

Quantize to `Decimal("0.01")` with `ROUND_HALF_UP` (inputs already have at most two places, so nothing rounds), then format the absolute value with `f"{value:f}"` and prepend `-` only when the amount is strictly less than zero — this is what keeps `-0.00` from reaching the output.

- [ ] **Step 4: Implement `format_report` in `ledgerlite/report.py`**

Order transactions with `order_by_date`, take `category_totals`, sort the keys with plain `sorted()` and move `UNCATEGORIZED` to the end if present, emit `f"{name}: {format_amount(total)}"` per key, then an empty line, then `f"closing balance: {format_amount(closing_balance(opening, ordered))}"`. Join with `"\n"` and end the string with a newline.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (12 tests)

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: format amounts and the full report"
```

---

## Task 7: CLI

**Files:**
- Create: `ledgerlite/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_transactions`, `ParseError` (Tasks 1–2), `parse_rules` (Task 3), `format_report` (Task 6), `parse_amount` (Task 1, for `--opening`).
- Produces: `cli.main(argv: list[str] | None = None) -> int` — never raises `SystemExit`; writes the report to `sys.stdout` and errors to `sys.stderr`.

**Behavior decisions this task locks in:**
- `argparse` with `prog="ledgerlite"` and one subcommand `report`: positional `transactions`, options `--rules` (default `None`) and `--opening` (default `"0"`, kept as a string and validated with `parse_amount`).
- argparse usage errors and `--help` are caught: `main` wraps only `parse_args` in `try/except SystemExit` and returns `exc.code` when it is an `int`, else `2`.
- Files are read with `encoding="utf-8-sig"` so a spreadsheet BOM is transparent. `OSError` → reason is `err.strerror`; `UnicodeDecodeError` → reason is the literal `invalid UTF-8`.
- `--opening` is validated with the same rules as a row amount; on failure print `ledgerlite: --opening: {message}` and return 2.
- The report is written with `print(text, end="")` because `format_report` already ends with a newline.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py`:

```python
import contextlib
import io
import pathlib
import tempfile
import unittest

from ledgerlite.cli import main

CSV = """date,amount,description
2026-03-01,-900.00,Rent March
2026-03-04,-7.50,Coffee Bar
2026-03-02,2500.00,Salary
"""
RULES = "coffee=food\nrent=housing\n"
EXPECTED = (
    "food: -7.50\n"
    "housing: -900.00\n"
    "uncategorized: 2500.00\n"
    "\n"
    "closing balance: 1692.50\n"
)


def run(argv):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = main(argv)
    return code, out.getvalue(), err.getvalue()


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = pathlib.Path(self.tmp.name)

    def write(self, name, text, encoding="utf-8"):
        path = self.dir / name
        path.write_text(text, encoding=encoding)
        return str(path)


class ReportSuccessTest(CliTestCase):
    def test_prints_the_report_and_returns_zero(self):
        csv = self.write("txns.csv", CSV)
        rules = self.write("rules.txt", RULES)
        code, out, err = run(["report", csv, "--rules", rules, "--opening", "100"])
        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_without_rules_everything_is_uncategorized(self):
        csv = self.write("txns.csv", CSV)
        code, out, err = run(["report", csv])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_opening_defaults_to_zero(self):
        csv = self.write("txns.csv", "date,amount,description\n2026-03-04,-7.50,X\n")
        code, out, _ = run(["report", csv])
        self.assertEqual(code, 0)
        self.assertIn("closing balance: -7.50\n", out)

    def test_negative_opening_is_accepted(self):
        csv = self.write("txns.csv", "date,amount,description\n2026-03-04,-7.50,X\n")
        code, out, _ = run(["report", csv, "--opening", "-50"])
        self.assertEqual(code, 0)
        self.assertIn("closing balance: -57.50\n", out)

    def test_reads_a_file_with_a_utf8_bom(self):
        csv = self.write("bom.csv", CSV, encoding="utf-8-sig")
        code, out, err = run(["report", csv, "--opening", "100"])
        self.assertEqual((code, err), (0, ""))
        self.assertEqual(out, EXPECTED)


class UnreadableInputTest(CliTestCase):
    def test_missing_transactions_file_returns_one(self):
        missing = str(self.dir / "nope.csv")
        code, out, err = run(["report", missing])
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: No such file or directory\n"
        )

    def test_directory_as_path_returns_one(self):
        code, out, err = run(["report", str(self.dir)])
        self.assertEqual((code, out), (1, ""))
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.dir}: "))
        self.assertTrue(err.endswith("\n"))

    def test_non_utf8_file_returns_one(self):
        path = self.dir / "bad.csv"
        path.write_bytes(b"date,amount,description\n2026-03-04,-7.50,caf\xe9\n")
        code, out, err = run(["report", str(path)])
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(err, f"ledgerlite: cannot read {path}: invalid UTF-8\n")

    def test_missing_rules_file_returns_one(self):
        csv = self.write("txns.csv", CSV)
        missing = str(self.dir / "nope.txt")
        code, out, err = run(["report", csv, "--rules", missing])
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: No such file or directory\n"
        )


class MalformedInputTest(CliTestCase):
    def test_bad_row_returns_two_with_path_and_line(self):
        csv = self.write(
            "txns.csv",
            "date,amount,description\n2026-03-01,-900.00,Rent\n2026-03-04,abc,Coffee\n",
        )
        code, out, err = run(["report", csv])
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(err, f"ledgerlite: {csv}:3: invalid amount 'abc'\n")

    def test_missing_header_returns_two(self):
        csv = self.write("txns.csv", "2026-03-04,-7.50,Coffee\n")
        code, out, err = run(["report", csv])
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err,
            f"ledgerlite: {csv}:1: expected header 'date,amount,description'\n",
        )

    def test_bad_rules_line_returns_two_with_the_rules_path(self):
        csv = self.write("txns.csv", CSV)
        rules = self.write("rules.txt", "coffee=food\noops\n")
        code, out, err = run(["report", csv, "--rules", rules])
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(err, f"ledgerlite: {rules}:2: rule has no '='\n")

    def test_bad_opening_returns_two(self):
        csv = self.write("txns.csv", CSV)
        code, out, err = run(["report", csv, "--opening", "1.005"])
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err,
            "ledgerlite: --opening: amount '1.005' has more than two decimal places\n",
        )

    def test_unparseable_opening_returns_two(self):
        csv = self.write("txns.csv", CSV)
        code, _, err = run(["report", csv, "--opening", "lots"])
        self.assertEqual(code, 2)
        self.assertEqual(err, "ledgerlite: --opening: invalid amount 'lots'\n")


class UsageErrorTest(CliTestCase):
    def test_missing_arguments_return_two_without_raising(self):
        for argv in ([], ["report"], ["nonsense"]):
            with self.subTest(argv=argv):
                self.assertEqual(run(argv)[0], 2)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `ledgerlite/cli.py`**

Structure: a private `_build_parser()` returning the argparse parser described above; a private `_read(path) -> str` that opens with `encoding="utf-8-sig"` and raises a small internal error (or returns via exception) carrying the `cannot read` reason — `err.strerror` for `OSError`, `"invalid UTF-8"` for `UnicodeDecodeError`; and `main(argv=None)` that parses args (catching `SystemExit`), validates `--opening` via `parse_amount`, reads and parses the transactions file, reads and parses the rules file when `--rules` was given, prints `format_report(...)` with `end=""`, and returns 0. Each failure path prints its one line to `sys.stderr` and returns 1 or 2 per the Global Constraints.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (15 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/cli.py test_cli.py
git commit -m "feat: add ledgerlite report CLI"
```

---

## Task 8: `python3 -m ledgerlite` entry point and end-to-end check

**Files:**
- Create: `ledgerlite/__main__.py`
- Modify: `test_cli.py` (add an end-to-end test class)

**Interfaces:**
- Consumes: `cli.main` (Task 7).
- Produces: `python3 -m ledgerlite report ...` as the runnable command; nothing importable.

- [ ] **Step 1: Write the failing test**

Append to `test_cli.py` (add `import subprocess` and `import sys` to the imports):

```python
class EndToEndTest(CliTestCase):
    def run_module(self, args):
        return subprocess.run(
            [sys.executable, "-m", "ledgerlite", *args],
            cwd=str(pathlib.Path(__file__).parent),
            capture_output=True,
            text=True,
        )

    def test_prints_the_design_example(self):
        csv = self.write("txns.csv", CSV)
        rules = self.write("rules.txt", RULES)
        done = self.run_module(["report", csv, "--rules", rules, "--opening", "100"])
        self.assertEqual(done.returncode, 0, done.stderr)
        self.assertEqual(done.stdout, EXPECTED)
        self.assertEqual(done.stderr, "")

    def test_malformed_file_exits_two_with_empty_stdout(self):
        csv = self.write("txns.csv", "date,amount,description\n2026-03-04,abc,X\n")
        done = self.run_module(["report", csv])
        self.assertEqual(done.returncode, 2)
        self.assertEqual(done.stdout, "")
        self.assertEqual(done.stderr, f"ledgerlite: {csv}:2: invalid amount 'abc'\n")

    def test_missing_file_exits_one(self):
        done = self.run_module(["report", str(self.dir / "nope.csv")])
        self.assertEqual(done.returncode, 1)
        self.assertEqual(done.stdout, "")
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_cli.EndToEndTest -v`
Expected: FAIL — `No module named ledgerlite.__main__` in the subprocess's stderr

- [ ] **Step 3: Implement `ledgerlite/__main__.py`**

Under `if __name__ == "__main__":`, `sys.exit(main())`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_cli.EndToEndTest -v`
Expected: PASS (3 tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — all 5 test modules, no failures, no errors

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__main__.py test_cli.py
git commit -m "feat: add module entry point and end-to-end tests"
```
