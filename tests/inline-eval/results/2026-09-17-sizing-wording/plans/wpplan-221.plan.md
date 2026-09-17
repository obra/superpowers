# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only Python command-line tool that reads a bank-transaction CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired together only at the CLI layer: `model` holds the `Transaction` dataclass; `parse` turns CSV *text* into transactions (raising `ParseError` with a line number); `rules` turns rules *text* into `(substring, category)` pairs and categorizes descriptions; `balance` does date-ordered summation; `report` formats; `cli` does argparse, file I/O, exit codes, and error messages. Every module below `cli` takes and returns plain values (`str` in, objects out) so tests never touch the filesystem — only `test_cli.py` uses temp files. Money is `decimal.Decimal` end to end; `float` never appears.

**Tech Stack:** Python 3.11+, standard library only (`argparse`, `csv`, `dataclasses`, `datetime`, `decimal`, `io`, `re`, `unittest`).

**Spec:** `design.md` (in this directory — read it before starting; this plan implements it and argues from it)

## Global Constraints

- Python 3.11+. Standard library only — no third-party packages, no `pip install`, no dependency files.
- Money is `decimal.Decimal` everywhere. `float` must not appear in the package at any point, including in tests.
- Package layout is exactly the tree in `design.md`: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`. Do not add modules; do not rename them.
- Tests live at the **repo root** as `test_<module>.py` (not in a `tests/` directory) and run with `python3 -m unittest`.
- Exit codes: `0` success, `1` transactions (or rules) file cannot be read, `2` malformed row.
- Error message formats, copied verbatim from the spec, both to **stderr**:
  - `ledgerlite: cannot read <path>: <reason>`
  - `ledgerlite: <path>:<line>: <what is wrong>`
- When exiting non-zero, **nothing** is written to stdout.
- Amounts are always printed with exactly two fractional digits, a leading `-` only for genuinely negative values, and no thousands separators.
- This is a local scratch repo with no remote. Work directly on `main`. Commit after every task; never push.

## Review Focus

Input classes the spec implies but does not spell out. Each line names the input and the expected behavior, and each has a test in the task listed. Most exist because the obvious stdlib call is *more* permissive than the spec.

1. `Decimal(...)` alone accepts `nan`, `Infinity`, `1_0`, `" 1.50 "`, and `1E+2`. None of these is "a decimal number with up to two fractional digits" — all are malformed. (Task 1)
2. "More than two fractional digits" is about digits, not value: `1.005` **and** `1.500` are malformed; `1.5`, `1.50`, `+3`, `-12.50`, `0` are fine. (Task 1)
3. `date.fromisoformat` in 3.11+ accepts `20260304` and `2026-W01-1` (which silently means 2025-12-29). The spec's date format is `YYYY-MM-DD`; anything else, including an empty field or `2026-3-4`, is an invalid date. (Task 1)
4. `\d` in a Python regex matches non-ASCII digits (`٣`). Amount and date patterns must be ASCII-only. (Task 1)
5. A missing, misspelled, or reordered header row, and a completely empty file, are malformed at line 1 — never silently treated as data, which would drop a real transaction. (Task 2)
6. A blank line in the middle of the CSV is a row with 0 columns → malformed at that line. (Task 2)
7. Line numbers are 1-based and count the header, so the first transaction is line 2; a quoted field containing a newline reports the row's last physical line. (Task 2)
8. A UTF-8 BOM (common in bank exports) must not turn the header into garbage — read with `utf-8-sig`. (Task 6)
9. Rules-file lines the grammar doesn't cover: blank lines, lines with no `=`, and lines with an empty category are skipped; only the **first** `=` splits, so `a=b=c` maps `a` → `b=c`; whitespace around both sides is stripped; an empty substring (`=food`) legitimately matches everything. (Task 3)
10. Case-insensitive matching must work in both directions (uppercase rule vs. lowercase description and vice versa), including non-ASCII text like `CAFÉ`. (Task 3)
11. "Ties keeping input order" requires a *stable* sort on the date alone — never a sort that also compares amount or description. (Task 4)
12. Zero transactions is legal: no category lines at all, then the blank line, then `closing balance: <opening>`, exit 0. (Task 5)
13. A category whose amounts cancel out, or a `-0.00` in the file, must print `0.00` — never `-0.00`. (Task 5)
14. A rules file whose category is literally `uncategorized` merges into the synthetic bucket and is printed last; a differently-cased `Uncategorized` is a separate, alphabetically-placed category. (Task 5)
15. "Alphabetically" is case-insensitive for humans: `food` sorts before `Travel`. (Task 5)
16. `--rules` pointing at a missing file or a directory gets the same `cannot read` message and exit 1 as an unreadable transactions file — the spec defines no other error channel. (Task 6)
17. A malformed `--opening` (`abc`, `1.005`) is an argparse usage error: exit 2, empty stdout. (Task 6)
18. Read order is transactions file → rules file → parse, so an unreadable rules file (exit 1) is reported before a malformed transactions row (exit 2). (Task 6)
19. Exits 1 and 2 write nothing to stdout — no partial report. (Task 6)

---

## File Structure

| File | Responsibility |
|---|---|
| `ledgerlite/__init__.py` | Package marker + docstring. No logic. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No behavior. |
| `ledgerlite/parse.py` | `ParseError`; field parsers `parse_date`/`parse_amount`; `parse_transactions(text)`. Knows nothing about files or paths. |
| `ledgerlite/rules.py` | `parse_rules(text)`, `categorize(description, rules)`. |
| `ledgerlite/balance.py` | `order_by_date`, `closing_balance`. |
| `ledgerlite/report.py` | `format_amount`, `category_totals`, `format_report`. |
| `ledgerlite/cli.py` | argparse wiring, file reading, error messages, exit codes, `main(argv)`. The only module that touches the filesystem or `sys`. |
| `test_model.py`, `test_parse.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py` | Tests, repo root, `unittest`. |

Dependency direction (never circular): `cli` → `report` → `balance`, `rules`; `report`/`balance`/`parse` → `model`.

---

## Task 1: Package skeleton, `Transaction`, and field parsers

The riskiest logic in this project is deciding whether a single date or amount field is valid, because the obvious stdlib calls are looser than the spec. This task pins that down and creates the package around it.

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_model.py`, `test_parse.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `ledgerlite.model.Transaction(date: datetime.date, amount: decimal.Decimal, description: str)` — frozen dataclass, keyword or positional in that field order.
  - `ledgerlite.parse.ParseError(line: int, message: str)` — exception with `.line` and `.message` attributes.
  - `ledgerlite.parse.parse_date(text: str) -> datetime.date` — raises `ValueError` whose message is `invalid date '<text>'`.
  - `ledgerlite.parse.parse_amount(text: str) -> decimal.Decimal` — raises `ValueError` whose message is `invalid amount '<text>'` or `amount '<text>' has more than two fractional digits`.

- [ ] **Step 1: Create the package directory and `__init__.py`**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite: summarize a CSV of bank transactions by category."""
```

- [ ] **Step 2: Write the failing test for `Transaction`**

Create `test_model.py`:

```python
import dataclasses
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTest(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        txn = Transaction(
            date=datetime.date(2026, 3, 4),
            amount=Decimal("-7.50"),
            description="Coffee Shop",
        )
        self.assertEqual(txn.date, datetime.date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("-7.50"))
        self.assertEqual(txn.description, "Coffee Shop")

    def test_field_order_is_date_amount_description(self):
        txn = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "x")
        self.assertEqual(
            [f.name for f in dataclasses.fields(txn)],
            ["date", "amount", "description"],
        )

    def test_is_frozen(self):
        txn = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "x")
        with self.assertRaises(dataclasses.FrozenInstanceError):
            txn.amount = Decimal("2.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.model'`

- [ ] **Step 4: Implement `model.py`**

Create `ledgerlite/model.py`:

```python
"""The transaction record."""

import dataclasses
import datetime
import decimal


@dataclasses.dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV.

    ``amount`` is negative for money out, positive for money in, and is
    always a ``Decimal`` — never a float.
    """

    date: datetime.date
    amount: decimal.Decimal
    description: str
```

- [ ] **Step 5: Run it to make sure it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS (3 tests)

- [ ] **Step 6: Write the failing tests for the field parsers**

Create `test_parse.py`. (Task 2 appends more classes to this file; keep the imports as written here.)

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_date


class ParseErrorTest(unittest.TestCase):
    def test_carries_line_and_message(self):
        err = ParseError(7, "invalid amount 'abc'")
        self.assertEqual(err.line, 7)
        self.assertEqual(err.message, "invalid amount 'abc'")


class ParseDateTest(unittest.TestCase):
    def test_parses_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), datetime.date(2026, 3, 4))

    def test_rejects_out_of_range_month(self):
        with self.assertRaises(ValueError) as ctx:
            parse_date("2026-13-01")
        self.assertEqual(str(ctx.exception), "invalid date '2026-13-01'")

    def test_rejects_non_yyyy_mm_dd_forms(self):
        # date.fromisoformat() accepts the last two on its own; the spec's
        # format is YYYY-MM-DD, so ledgerlite must not.
        for text in ["", " 2026-03-04", "2026-3-4", "04/03/2026", "not a date",
                     "2026-03-04T00:00", "20260304", "2026-W01-1"]:
            with self.subTest(text=text):
                with self.assertRaises(ValueError) as ctx:
                    parse_date(text)
                self.assertEqual(str(ctx.exception), f"invalid date {text!r}")

    def test_rejects_non_ascii_digits(self):
        with self.assertRaises(ValueError):
            parse_date("٢٠٢٦-٠٣-٠٤")


class ParseAmountTest(unittest.TestCase):
    def test_parses_negative_and_positive(self):
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))
        self.assertEqual(parse_amount("2500.00"), Decimal("2500.00"))
        self.assertEqual(parse_amount("+3"), Decimal("3"))
        self.assertEqual(parse_amount("0"), Decimal("0"))

    def test_accepts_one_or_two_fractional_digits(self):
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))

    def test_returns_decimal_not_float(self):
        self.assertIsInstance(parse_amount("1.50"), Decimal)

    def test_rejects_more_than_two_fractional_digits(self):
        for text in ["1.005", "1.500", "0.123"]:
            with self.subTest(text=text):
                with self.assertRaises(ValueError) as ctx:
                    parse_amount(text)
                self.assertEqual(
                    str(ctx.exception),
                    f"amount {text!r} has more than two fractional digits",
                )

    def test_rejects_non_numbers(self):
        # Decimal() alone accepts every one of nan/Infinity/1_0/" 1.50 "/1E+2.
        for text in ["", "abc", "1.", ".50", "1,000.00", "$1.00", "1 000",
                     "nan", "NaN", "Infinity", "-inf", "1_0", " 1.50 ",
                     "1E+2", "1.5E-3", "١٢"]:
            with self.subTest(text=text):
                with self.assertRaises(ValueError) as ctx:
                    parse_amount(text)
                self.assertEqual(str(ctx.exception), f"invalid amount {text!r}")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 7: Run it to make sure it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'ParseError' from 'ledgerlite.parse'` (or `ModuleNotFoundError`)

- [ ] **Step 8: Implement `parse.py` (field parsers only)**

Create `ledgerlite/parse.py`. `re.ASCII` is what keeps `\d` from matching non-ASCII digits; the regexes are what keep `Decimal` and `fromisoformat` from accepting more than the spec allows.

```python
"""Turn transactions-CSV text into Transaction records."""

import datetime
import decimal
import re

_DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}\Z", re.ASCII)
_AMOUNT_RE = re.compile(r"[+-]?\d+(?:\.(\d+))?\Z", re.ASCII)


class ParseError(Exception):
    """A row of the transactions file is malformed.

    ``line`` is the 1-based physical line number in the file, counting the
    header row as line 1.
    """

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_date(text: str) -> datetime.date:
    """Parse a ``YYYY-MM-DD`` date, rejecting every other ISO 8601 form."""
    if _DATE_RE.match(text) is None:
        raise ValueError(f"invalid date {text!r}")
    try:
        return datetime.date.fromisoformat(text)
    except ValueError:
        raise ValueError(f"invalid date {text!r}") from None


def parse_amount(text: str) -> decimal.Decimal:
    """Parse a decimal number with at most two fractional digits."""
    match = _AMOUNT_RE.match(text)
    if match is None:
        raise ValueError(f"invalid amount {text!r}")
    fraction = match.group(1)
    if fraction is not None and len(fraction) > 2:
        raise ValueError(f"amount {text!r} has more than two fractional digits")
    return decimal.Decimal(text)
```

- [ ] **Step 9: Run the tests to make sure they pass**

Run: `python3 -m unittest -v`
Expected: PASS — all tests in `test_model.py` and `test_parse.py`

- [ ] **Step 10: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_model.py test_parse.py
git commit -m "feat: add Transaction model and date/amount field parsers"
```

---

## Task 2: `parse_transactions` — rows, header, and line numbers

**Files:**
- Modify: `ledgerlite/parse.py` (add imports, `HEADER`, `parse_transactions`)
- Test: `test_parse.py` (append a new test class)

**Interfaces:**
- Consumes: `Transaction` from Task 1; `ParseError`, `parse_date`, `parse_amount` from Task 1 (same module).
- Produces: `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — takes the **whole file text**, returns transactions in input order, raises `ParseError` on the first malformed row. Also `ledgerlite.parse.HEADER == ["date", "amount", "description"]`.

Why text rather than a path: the spec rejects the whole file on any bad row, so there is nothing to stream, and a text-in function is testable without temp files. `cli.py` (Task 6) does the reading.

- [ ] **Step 1: Write the failing tests**

Append to `test_parse.py` — and add `parse_transactions, HEADER` to the existing `from ledgerlite.parse import ...` line, plus `from ledgerlite.model import Transaction`:

```python
class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = (
            "date,amount,description\n"
            "2026-03-05,-900.00,Rent March\n"
            "2026-03-04,-7.50,Coffee Shop\n"
        )
        self.assertEqual(
            parse_transactions(text),
            [
                Transaction(datetime.date(2026, 3, 5), Decimal("-900.00"), "Rent March"),
                Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop"),
            ],
        )

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions("date,amount,description\n"), [])

    def test_accepts_quoted_comma_and_empty_description(self):
        text = (
            "date,amount,description\n"
            '2026-03-04,-7.50,"Coffee, Shop"\n'
            "2026-03-05,1.00,\n"
        )
        parsed = parse_transactions(text)
        self.assertEqual(parsed[0].description, "Coffee, Shop")
        self.assertEqual(parsed[1].description, "")

    def test_header_is_matched_case_insensitively_and_trimmed(self):
        text = "Date, Amount ,DESCRIPTION\n2026-03-04,1.00,x\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_missing_header_is_line_1(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions("2026-03-04,-7.50,Coffee Shop\n")
        self.assertEqual(ctx.exception.line, 1)
        self.assertEqual(
            ctx.exception.message,
            "expected header 'date,amount,description'",
        )

    def test_wrong_header_order_is_line_1(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions("amount,date,description\n2026-03-04,1.00,x\n")
        self.assertEqual(ctx.exception.line, 1)

    def test_empty_file_is_line_1(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions("")
        self.assertEqual(ctx.exception.line, 1)
        self.assertEqual(
            ctx.exception.message,
            "expected header 'date,amount,description'",
        )

    def test_too_few_columns(self):
        text = "date,amount,description\n2026-03-04,-7.50\n"
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(ctx.exception.message, "expected 3 columns, got 2")

    def test_too_many_columns(self):
        text = "date,amount,description\n2026-03-04,-7.50,Coffee,extra\n"
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(ctx.exception.message, "expected 3 columns, got 4")

    def test_blank_line_inside_file_is_malformed(self):
        text = "date,amount,description\n2026-03-04,-7.50,Coffee\n\n2026-03-05,1.00,x\n"
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 3)
        self.assertEqual(ctx.exception.message, "expected 3 columns, got 0")

    def test_trailing_newline_is_not_a_blank_row(self):
        self.assertEqual(len(parse_transactions("date,amount,description\n2026-03-04,1.00,x\n")), 1)

    def test_bad_date_reports_its_line(self):
        text = (
            "date,amount,description\n"
            "2026-03-04,-7.50,Coffee\n"
            "04/03/2026,-1.00,Bad\n"
        )
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 3)
        self.assertEqual(ctx.exception.message, "invalid date '04/03/2026'")

    def test_bad_amount_reports_its_line(self):
        text = "date,amount,description\n2026-03-04,abc,Coffee\n"
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(ctx.exception.message, "invalid amount 'abc'")

    def test_over_precise_amount_reports_its_line(self):
        text = "date,amount,description\n2026-03-04,1.005,Coffee\n"
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(
            ctx.exception.message,
            "amount '1.005' has more than two fractional digits",
        )

    def test_multiline_quoted_field_reports_last_physical_line(self):
        text = 'date,amount,description\n2026-03-04,abc,"two\nlines"\n'
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 3)

    def test_header_constant(self):
        self.assertEqual(HEADER, ["date", "amount", "description"])
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'parse_transactions' from 'ledgerlite.parse'`

- [ ] **Step 3: Implement `parse_transactions`**

Add `csv` and `io` to the imports at the top of `ledgerlite/parse.py`, and append:

```python
HEADER = ["date", "amount", "description"]


def parse_transactions(text: str) -> list[Transaction]:
    """Parse whole-file CSV text into transactions, in input order.

    Raises ParseError on the first malformed row; the caller is expected to
    reject the whole file.
    """
    reader = csv.reader(io.StringIO(text, newline=""))
    transactions: list[Transaction] = []
    try:
        header = next(reader, None)
        if header is None or [field.strip().lower() for field in header] != HEADER:
            raise ParseError(1, f"expected header {','.join(HEADER)!r}")
        for row in reader:
            if len(row) != len(HEADER):
                raise ParseError(
                    reader.line_num, f"expected 3 columns, got {len(row)}"
                )
            date_text, amount_text, description = row
            try:
                transactions.append(
                    Transaction(
                        date=parse_date(date_text),
                        amount=parse_amount(amount_text),
                        description=description,
                    )
                )
            except ValueError as exc:
                raise ParseError(reader.line_num, str(exc)) from exc
    except csv.Error as exc:
        raise ParseError(reader.line_num or 1, f"malformed CSV: {exc}") from exc
    return transactions
```

Also add to the imports at the top of the file:

```python
from ledgerlite.model import Transaction
```

Notes for the implementer: `reader.line_num` counts physical lines consumed, which is exactly the `<line>` the spec wants; the `csv.Error` wrapper catches library-level breakage (e.g. an oversized field) and cannot swallow `ParseError`, which is not a `csv.Error`.

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `python3 -m unittest -v`
Expected: PASS — all of `test_model.py` and `test_parse.py`

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV text with line-numbered errors"
```

---

## Task 3: `rules.py` — rule parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `ledgerlite.rules.Rule` — type alias for `tuple[str, str]`, i.e. `(substring, category)`.
  - `ledgerlite.rules.parse_rules(text: str) -> list[Rule]` — in file order.
  - `ledgerlite.rules.categorize(description: str, rules: Sequence[Rule]) -> str | None` — first matching rule's category, or `None`.

Grammar decisions (the spec gives no error channel for a rules file, so unusable lines are skipped rather than fatal): a line with no `=` is skipped, which also covers blank lines; a line whose category is empty after stripping is skipped, since a category needs a name; the first `=` splits; both sides are stripped.

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_one_rule_per_line_in_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_strips_whitespace_around_both_sides(self):
        self.assertEqual(parse_rules("  coffee = food  \n"), [("coffee", "food")])

    def test_splits_on_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_skips_blank_and_whitespace_only_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\n   \n\n"), [("coffee", "food")])

    def test_skips_lines_without_an_equals_sign(self):
        self.assertEqual(parse_rules("nonsense\ncoffee=food\n"), [("coffee", "food")])

    def test_skips_lines_with_an_empty_category(self):
        self.assertEqual(parse_rules("coffee=\ncoffee =  \nrent=housing\n"), [("rent", "housing")])

    def test_keeps_empty_substring_as_catch_all_rule(self):
        self.assertEqual(parse_rules("=food\n"), [("", "food")])

    def test_empty_text_is_no_rules(self):
        self.assertEqual(parse_rules(""), [])

    def test_last_line_without_newline(self):
        self.assertEqual(parse_rules("coffee=food"), [("coffee", "food")])


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_of_description(self):
        self.assertEqual(categorize("Coffee Shop 14", self.RULES), "food")

    def test_uppercase_rule_matches_lowercase_description(self):
        self.assertEqual(categorize("monthly rent", [("RENT", "housing")]), "housing")

    def test_lowercase_rule_matches_uppercase_description(self):
        self.assertEqual(categorize("MONTHLY RENT", [("rent", "housing")]), "housing")

    def test_case_insensitive_for_non_ascii(self):
        self.assertEqual(categorize("café milano", [("CAFÉ", "food")]), "food")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "treats")]
        self.assertEqual(categorize("Coffee Shop", rules), "food")

    def test_no_match_returns_none(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_no_rules_returns_none(self):
        self.assertIsNone(categorize("Coffee Shop", []))

    def test_empty_substring_matches_everything(self):
        self.assertEqual(categorize("anything at all", [("", "food")]), "food")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `rules.py`**

Create `ledgerlite/rules.py`:

```python
"""Category rules: ``<substring>=<category>``, first match wins."""

from collections.abc import Sequence

Rule = tuple[str, str]


def parse_rules(text: str) -> list[Rule]:
    """Parse rules-file text into (substring, category) pairs, in file order.

    Lines that cannot be a rule -- blank ones, ones with no ``=``, and ones
    with an empty category -- are skipped.
    """
    rules: list[Rule] = []
    for line in text.splitlines():
        if "=" not in line:
            continue
        substring, _, category = line.partition("=")
        substring = substring.strip()
        category = category.strip()
        if not category:
            continue
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: Sequence[Rule]) -> str | None:
    """Return the first matching rule's category, or None if none match."""
    lowered = description.lower()
    for substring, category in rules:
        if substring.lower() in lowered:
            return category
    return None
```

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `python3 -m unittest -v`
Expected: PASS — all tests so far

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules parsing and case-insensitive categorization"
```

---

## Task 4: `balance.py` — date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (Task 1).
- Produces:
  - `ledgerlite.balance.order_by_date(transactions: Sequence[Transaction]) -> list[Transaction]` — stable sort by date only; input list untouched.
  - `ledgerlite.balance.closing_balance(transactions: Sequence[Transaction], opening: Decimal) -> Decimal` — orders internally, then folds the amounts onto `opening`.

`closing_balance` sorts internally so no caller can compute it from unordered input.

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class OrderByDateTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(9, "1.00", "c"), txn(4, "2.00", "a"), txn(7, "3.00", "b")]
        self.assertEqual(
            [t.description for t in order_by_date(rows)], ["a", "b", "c"]
        )

    def test_ties_keep_input_order(self):
        rows = [
            txn(4, "-5.00", "second-in-file"),
            txn(1, "1.00", "earlier"),
            txn(4, "-9.00", "third-in-file"),
        ]
        self.assertEqual(
            [t.description for t in order_by_date(rows)],
            ["earlier", "second-in-file", "third-in-file"],
        )

    def test_does_not_mutate_input(self):
        rows = [txn(9, "1.00", "c"), txn(4, "2.00", "a")]
        order_by_date(rows)
        self.assertEqual([t.description for t in rows], ["c", "a"])

    def test_empty_list(self):
        self.assertEqual(order_by_date([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_no_transactions_returns_opening(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))

    def test_adds_amounts_to_opening(self):
        rows = [txn(4, "-7.50"), txn(5, "-900.00"), txn(6, "2500.00")]
        self.assertEqual(closing_balance(rows, Decimal("100")), Decimal("1692.50"))

    def test_result_is_independent_of_input_order(self):
        rows = [txn(6, "2500.00"), txn(4, "-7.50"), txn(5, "-900.00")]
        self.assertEqual(closing_balance(rows, Decimal("100")), Decimal("1692.50"))

    def test_default_opening_of_zero(self):
        self.assertEqual(closing_balance([txn(4, "-7.50")], Decimal("0")), Decimal("-7.50"))

    def test_returns_decimal(self):
        self.assertIsInstance(closing_balance([txn(4, "1.00")], Decimal("0")), Decimal)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `balance.py`**

Create `ledgerlite/balance.py`:

```python
"""Date-ordered running balance."""

import decimal
import operator
from collections.abc import Sequence

from ledgerlite.model import Transaction


def order_by_date(transactions: Sequence[Transaction]) -> list[Transaction]:
    """Return the transactions sorted by date, ties keeping input order."""
    return sorted(transactions, key=operator.attrgetter("date"))


def closing_balance(
    transactions: Sequence[Transaction], opening: decimal.Decimal
) -> decimal.Decimal:
    """Run the balance forward from ``opening`` over the date-ordered rows."""
    balance = opening
    for transaction in order_by_date(transactions):
        balance += transaction.amount
    return balance
```

`sorted` is stable, and the key is the date alone, which is what makes ties keep input order.

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `python3 -m unittest -v`
Expected: PASS — all tests so far

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date-ordered closing balance"
```

---

## Task 5: `report.py` — category totals and formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `rules.Rule`/`rules.categorize` (Task 3), `balance.closing_balance` (Task 4).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED == "uncategorized"`.
  - `ledgerlite.report.format_amount(value: Decimal) -> str` — two fractional digits, no `-0.00`, no thousands separators.
  - `ledgerlite.report.category_totals(transactions: Sequence[Transaction], rules: Sequence[Rule]) -> list[tuple[str, Decimal]]` — already in report order: categories case-insensitively alphabetical, `uncategorized` last.
  - `ledgerlite.report.format_report(transactions: Sequence[Transaction], rules: Sequence[Rule], opening: Decimal) -> str` — the whole report, ending in a single `"\n"`.

- [ ] **Step 1: Write the failing tests**

Create `test_report.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import UNCATEGORIZED, category_totals, format_amount, format_report


def txn(day, amount, description):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class FormatAmountTest(unittest.TestCase):
    def test_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("-900.00")), "-900.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
        self.assertEqual(format_amount(Decimal("1.00") + Decimal("-1.00")), "0.00")


class CategoryTotalsTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_sums_per_category_alphabetically_with_uncategorized_last(self):
        rows = [
            txn(4, "-7.50", "Coffee Shop"),
            txn(5, "-900.00", "Rent March"),
            txn(6, "2500.00", "Salary"),
        ]
        self.assertEqual(
            category_totals(rows, self.RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                (UNCATEGORIZED, Decimal("2500.00")),
            ],
        )

    def test_sums_several_transactions_in_one_category(self):
        rows = [txn(4, "-7.50", "Coffee A"), txn(5, "-2.25", "coffee b")]
        self.assertEqual(category_totals(rows, self.RULES), [("food", Decimal("-9.75"))])

    def test_no_transactions_is_no_lines(self):
        self.assertEqual(category_totals([], self.RULES), [])

    def test_without_rules_everything_is_uncategorized(self):
        rows = [txn(4, "-7.50", "Coffee Shop"), txn(5, "1.00", "Salary")]
        self.assertEqual(category_totals(rows, []), [(UNCATEGORIZED, Decimal("-6.50"))])

    def test_alphabetical_order_is_case_insensitive(self):
        rules = [("t", "Travel"), ("f", "food")]
        rows = [txn(4, "1.00", "t"), txn(5, "2.00", "f")]
        self.assertEqual(
            [name for name, _ in category_totals(rows, rules)], ["food", "Travel"]
        )

    def test_explicit_uncategorized_rule_merges_into_the_last_line(self):
        rules = [("fee", "uncategorized")]
        rows = [txn(4, "-1.00", "Bank fee"), txn(5, "2.00", "Salary")]
        self.assertEqual(category_totals(rows, rules), [(UNCATEGORIZED, Decimal("1.00"))])

    def test_differently_cased_uncategorized_is_its_own_category(self):
        rules = [("fee", "Uncategorized")]
        rows = [txn(4, "-1.00", "Bank fee"), txn(5, "2.00", "Salary")]
        self.assertEqual(
            category_totals(rows, rules),
            [("Uncategorized", Decimal("-1.00")), (UNCATEGORIZED, Decimal("2.00"))],
        )


class FormatReportTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_the_example_from_the_design(self):
        rows = [
            txn(4, "-7.50", "Coffee Shop"),
            txn(5, "-900.00", "Rent March"),
            txn(6, "2500.00", "Salary"),
        ]
        self.assertEqual(
            format_report(rows, self.RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(
            format_report([], self.RULES, Decimal("100")),
            "\nclosing balance: 100.00\n",
        )

    def test_closing_balance_uses_date_order(self):
        rows = [txn(6, "2500.00", "Salary"), txn(4, "-7.50", "Coffee Shop")]
        self.assertTrue(
            format_report(rows, self.RULES, Decimal("0")).endswith(
                "closing balance: 2492.50\n"
            )
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `report.py`**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and report formatting."""

import decimal
from collections.abc import Sequence

from ledgerlite import balance, rules as rules_module
from ledgerlite.model import Transaction

UNCATEGORIZED = "uncategorized"


def format_amount(value: decimal.Decimal) -> str:
    """Format money with exactly two fractional digits and no '-0.00'."""
    if value == 0:
        value = abs(value)
    return f"{value:.2f}"


def category_totals(
    transactions: Sequence[Transaction], rules: Sequence[rules_module.Rule]
) -> list[tuple[str, decimal.Decimal]]:
    """Total each category, in report order: alphabetical, uncategorized last."""
    totals: dict[str, decimal.Decimal] = {}
    for transaction in transactions:
        category = rules_module.categorize(transaction.description, rules)
        if category is None:
            category = UNCATEGORIZED
        totals[category] = totals.get(category, decimal.Decimal(0)) + transaction.amount

    named = sorted(
        (name for name in totals if name != UNCATEGORIZED),
        key=lambda name: (name.lower(), name),
    )
    ordered = [(name, totals[name]) for name in named]
    if UNCATEGORIZED in totals:
        ordered.append((UNCATEGORIZED, totals[UNCATEGORIZED]))
    return ordered


def format_report(
    transactions: Sequence[Transaction],
    rules: Sequence[rules_module.Rule],
    opening: decimal.Decimal,
) -> str:
    """Render the whole report, ending in a newline."""
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    lines.append("")
    closing = balance.closing_balance(transactions, opening)
    lines.append(f"closing balance: {format_amount(closing)}")
    return "\n".join(lines) + "\n"
```

Two subtleties worth keeping: `categorize` is checked with `is None` rather than `or`, so a category is never replaced by falsiness; and `format_amount` normalizes zero, because `Decimal("-0.00")` formats as `-0.00`.

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `python3 -m unittest -v`
Expected: PASS — all tests so far

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals and report formatting"
```

---

## Task 6: `cli.py` — argparse, file I/O, exit codes

**Files:**
- Create: `ledgerlite/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.parse_transactions`, `parse.parse_amount`, `parse.ParseError` (Tasks 1–2); `rules.parse_rules` (Task 3); `report.format_report` (Task 5).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — returns the exit code, does not call `sys.exit` itself (except via argparse on a usage error, which raises `SystemExit(2)`). Runnable as `python3 -m ledgerlite.cli report ...`.

Behavior: read the transactions file, then the rules file, then parse. Files are read with `encoding="utf-8-sig"` so a byte-order mark in a bank export doesn't corrupt the header. The reason in `cannot read` comes from `OSError.strerror` (e.g. `No such file or directory`) rather than `str(exc)`, which would repeat the path and errno.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py`:

```python
import contextlib
import io
import os
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-06,2500.00,Salary March\n"
    "2026-03-04,-7.50,Coffee Shop\n"
    "2026-03-05,-900.00,Rent March\n"
)
RULES = "coffee=food\nrent=housing\n"

EXPECTED = (
    "food: -7.50\n"
    "housing: -900.00\n"
    "uncategorized: 2500.00\n"
    "\n"
    "closing balance: 1692.50\n"
)


class CliTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def write(self, name, text, encoding="utf-8"):
        path = os.path.join(self.tmp.name, name)
        with open(path, "w", encoding=encoding) as handle:
            handle.write(text)
        return path

    def run_cli(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()


class ReportSuccessTest(CliTest):
    def test_design_example(self):
        txns = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", RULES)
        code, out, err = self.run_cli(["report", txns, "--rules", rules, "--opening", "100"])
        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_opening_defaults_to_zero(self):
        txns = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", RULES)
        code, out, _ = self.run_cli(["report", txns, "--rules", rules])
        self.assertEqual(code, 0)
        self.assertTrue(out.endswith("closing balance: 1592.50\n"), out)

    def test_without_rules_everything_is_uncategorized(self):
        txns = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_cli(["report", txns])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_negative_opening_is_accepted(self):
        txns = self.write("t.csv", "date,amount,description\n")
        code, out, _ = self.run_cli(["report", txns, "--opening", "-25.50"])
        self.assertEqual((code, out), (0, "\nclosing balance: -25.50\n"))

    def test_header_only_file_prints_opening_balance(self):
        txns = self.write("t.csv", "date,amount,description\n")
        code, out, err = self.run_cli(["report", txns, "--opening", "100"])
        self.assertEqual((code, out, err), (0, "\nclosing balance: 100.00\n", ""))

    def test_utf8_bom_is_tolerated(self):
        txns = self.write("t.csv", TRANSACTIONS, encoding="utf-8-sig")
        code, out, err = self.run_cli(["report", txns, "--opening", "100"])
        self.assertEqual(code, 0, err)
        self.assertTrue(out.endswith("closing balance: 1692.50\n"), out)


class UnreadableFileTest(CliTest):
    def test_missing_transactions_file(self):
        path = os.path.join(self.tmp.name, "nope.csv")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

    def test_transactions_path_is_a_directory(self):
        code, out, err = self.run_cli(["report", self.tmp.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.tmp.name}: "), err)

    def test_missing_rules_file(self):
        txns = self.write("t.csv", TRANSACTIONS)
        path = os.path.join(self.tmp.name, "nope.txt")
        code, out, err = self.run_cli(["report", txns, "--rules", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

    def test_unreadable_rules_wins_over_malformed_transactions(self):
        txns = self.write("t.csv", "date,amount,description\n2026-03-04,abc,x\n")
        path = os.path.join(self.tmp.name, "nope.txt")
        code, _, err = self.run_cli(["report", txns, "--rules", path])
        self.assertEqual(code, 1)
        self.assertIn("cannot read", err)


class MalformedRowTest(CliTest):
    def assert_row_error(self, text, expected_message):
        txns = self.write("t.csv", text)
        code, out, err = self.run_cli(["report", txns])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {txns}:{expected_message}\n")

    def test_wrong_column_count(self):
        self.assert_row_error(
            "date,amount,description\n2026-03-04,-7.50\n", "2: expected 3 columns, got 2"
        )

    def test_unparseable_date(self):
        self.assert_row_error(
            "date,amount,description\n2026-03-04,1.00,ok\n04/03/2026,-1.00,bad\n",
            "3: invalid date '04/03/2026'",
        )

    def test_unparseable_amount(self):
        self.assert_row_error(
            "date,amount,description\n2026-03-04,abc,bad\n", "2: invalid amount 'abc'"
        )

    def test_too_many_fractional_digits(self):
        self.assert_row_error(
            "date,amount,description\n2026-03-04,1.005,bad\n",
            "2: amount '1.005' has more than two fractional digits",
        )

    def test_missing_header(self):
        self.assert_row_error(
            "2026-03-04,-7.50,Coffee\n", "1: expected header 'date,amount,description'"
        )

    def test_empty_file(self):
        self.assert_row_error("", "1: expected header 'date,amount,description'")


class UsageErrorTest(CliTest):
    def assert_exits_2(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            with self.assertRaises(SystemExit) as ctx:
                main(argv)
        self.assertEqual(ctx.exception.code, 2)
        self.assertEqual(out.getvalue(), "")

    def test_bad_opening_amount(self):
        txns = self.write("t.csv", TRANSACTIONS)
        self.assert_exits_2(["report", txns, "--opening", "abc"])

    def test_over_precise_opening_amount(self):
        txns = self.write("t.csv", TRANSACTIONS)
        self.assert_exits_2(["report", txns, "--opening", "1.005"])

    def test_missing_subcommand(self):
        self.assert_exits_2([])

    def test_unknown_subcommand(self):
        self.assert_exits_2(["summarize", "t.csv"])

    def test_missing_transactions_argument(self):
        self.assert_exits_2(["report"])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `cli.py`**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point."""

import argparse
import decimal
import sys

from ledgerlite import parse, report, rules

PROG = "ledgerlite"


def _read_text(path: str) -> str:
    """Read a whole text file. Raises OSError or UnicodeDecodeError."""
    # utf-8-sig also reads plain UTF-8, and strips a byte-order mark so that
    # a BOM cannot turn the header row into an unrecognized column name.
    with open(path, encoding="utf-8-sig", newline="") as handle:
        return handle.read()


def _reason(exc: Exception) -> str:
    """The short human reason for a failed read."""
    return getattr(exc, "strerror", None) or str(exc)


def _amount(text: str) -> decimal.Decimal:
    """argparse type for --opening."""
    try:
        return parse.parse_amount(text)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from exc


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=PROG, description="Summarize bank transactions by category."
    )
    subcommands = parser.add_subparsers(dest="command", required=True)
    report_parser = subcommands.add_parser(
        "report", help="print a per-category summary and the closing balance"
    )
    report_parser.add_argument("transactions", help="path to the transactions CSV")
    report_parser.add_argument("--rules", help="path to the rules file")
    report_parser.add_argument(
        "--opening",
        type=_amount,
        default=decimal.Decimal(0),
        help="opening balance (default: 0)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    try:
        transactions_text = _read_text(args.transactions)
    except (OSError, UnicodeDecodeError) as exc:
        print(
            f"{PROG}: cannot read {args.transactions}: {_reason(exc)}",
            file=sys.stderr,
        )
        return 1

    rule_list: list[rules.Rule] = []
    if args.rules is not None:
        try:
            rules_text = _read_text(args.rules)
        except (OSError, UnicodeDecodeError) as exc:
            print(f"{PROG}: cannot read {args.rules}: {_reason(exc)}", file=sys.stderr)
            return 1
        rule_list = rules.parse_rules(rules_text)

    try:
        transactions = parse.parse_transactions(transactions_text)
    except parse.ParseError as exc:
        print(
            f"{PROG}: {args.transactions}:{exc.line}: {exc.message}", file=sys.stderr
        )
        return 2

    sys.stdout.write(report.format_report(transactions, rule_list, args.opening))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

Nothing is written to stdout until parsing has fully succeeded, which is what keeps exits 1 and 2 silent on stdout.

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — every test in `test_model.py`, `test_parse.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py`; zero failures, zero errors.

- [ ] **Step 6: Exercise the real command end to end**

```bash
printf 'date,amount,description\n2026-03-06,2500.00,Salary March\n2026-03-04,-7.50,Coffee Shop\n2026-03-05,-900.00,Rent March\n' > /tmp/ledgerlite-t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-r.txt
python3 -m ledgerlite.cli report /tmp/ledgerlite-t.csv --rules /tmp/ledgerlite-r.txt --opening 100
echo "exit=$?"
```

Expected, matching the example in `design.md`:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit=0
```

Then check the two error paths:

```bash
python3 -m ledgerlite.cli report /tmp/ledgerlite-missing.csv; echo "exit=$?"
printf 'date,amount,description\n2026-03-04,1.005,Coffee\n' > /tmp/ledgerlite-bad.csv
python3 -m ledgerlite.cli report /tmp/ledgerlite-bad.csv; echo "exit=$?"
```

Expected:

```
ledgerlite: cannot read /tmp/ledgerlite-missing.csv: No such file or directory
exit=1
ledgerlite: /tmp/ledgerlite-bad.csv:2: amount '1.005' has more than two fractional digits
exit=2
```

- [ ] **Step 7: Confirm no floats crept in**

Run: `grep -rn "float" ledgerlite/ test_*.py`
Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add ledgerlite/cli.py test_cli.py
git commit -m "feat: add ledgerlite report CLI with exit codes and error messages"
```
