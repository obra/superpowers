# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python CLI that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired together only at the CLI edge. Pure functions in the middle (`parse`, `rules`, `balance`, `report`) take and return in-memory values — text in, data out, text out — so every behavior in the spec is testable without touching the filesystem. All file I/O, all error message formatting, and all exit codes live in `cli.py`. Money is `decimal.Decimal` end to end; `float` never appears.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `dataclasses`, `re`, `io`). Tests are `unittest`, run from the repo root with `python3 -m unittest`.

**Spec:** `design.md` (this directory)

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies, no `requirements.txt`, no packaging metadata beyond the package directory.
- Amounts are `decimal.Decimal` everywhere. Never `float`. Never `round()`.
- Package layout is exactly as the spec's "Package layout" section lists: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`, plus one addition — `ledgerlite/__main__.py`, a three-line shim so `python3 -m ledgerlite report ...` actually runs the tool (the spec shows the command line but names no entry point).
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`. There is no `test_model.py`; `model.py` holds a dataclass with no behavior and is exercised through `test_parse.py`.
- Exit codes: `0` success, `1` a file could not be read, `2` a malformed transactions row.
- Error messages go to stderr with these exact shapes:
  - `ledgerlite: cannot read <path>: <reason>`
  - `ledgerlite: <path>:<line>: <what is wrong>`
  - `<path>` is the path exactly as the user typed it on the command line, not resolved or absolutized.
- Amount output format: exactly two fractional digits, leading `-` for negatives, no thousands separators (`-12.50`, `0.00`, `1200.00`).
- Report body: one `<category>: <total>` line per category with at least one transaction, sorted alphabetically, `uncategorized` always last; then a blank line; then `closing balance: <amount>`.

## Decisions on spec-silent points

The spec is a vision document. These points it does not address; each decision below is implemented and tested by the task named, and each is called out again in Review Focus so a reviewer can second-guess the call rather than rediscover the question.

1. **Header row is validated.** The first row must be `date,amount,description` (per-field whitespace and case ignored). A wrong header is a malformed row → exit 2, line 1. Rationale: silently treating line 1 as a header means a header-less file loses its first transaction and reports a wrong balance with no complaint. (Task 2)
2. **A completely empty file, and a header-only file, both mean zero transactions** — not an error. The report is then a blank line followed by `closing balance: <opening>`, which is what the spec's report structure says literally when there are no categories. (Tasks 2, 5)
3. **Blank lines in the CSV are skipped**, not counted as wrong-column-count rows. (Task 2)
4. **Leading/trailing whitespace is stripped from the date and amount fields** before validation. The description is kept verbatim. (Task 1)
5. **Rules-file lines that are blank, contain no `=`, or have an empty substring or empty category are skipped.** The spec defines no error path for the rules file, and exit 2 is defined only for transaction rows, so a bad rule line cannot become an error without inventing behavior. (Task 3)
6. **A rules file that cannot be read is an exit-1 `cannot read` error**, same as the transactions file. (Task 6)
7. **A transactions file that is not valid UTF-8 "cannot be read"** → exit 1. (Task 6)
8. **An invalid `--opening` value is an argparse usage error** (stderr, exit 2), because argparse already owns argument validation and already exits 2. (Task 6)
9. **Alphabetical category ordering is case-insensitive**, tie-broken by the raw name, so `apparel` sorts before `Food`. (Task 5)
10. **A rule whose category is literally `uncategorized` merges into the uncategorized bucket** and therefore prints last. (Task 5)

## Review Focus

Input classes and failure modes the spec implies but does not spell out, most likely to bite first:

- Header-less or misspelled-header CSV — decision 1; tested in Task 2 (`test_wrong_header_is_malformed`).
- Empty file / header-only file — decision 2; tested in Task 2 and Task 5 (`test_report_with_no_transactions`).
- Amount strings `decimal.Decimal` happily accepts but a bank statement never contains: `NaN`, `Infinity`, `1e5`, `_1.00`, non-ASCII digits (`١٢`). All must be "not a decimal number". Tested in Task 1 (`test_rejects_non_numeric_amounts`).
- Date strings `datetime.date.fromisoformat` accepts on 3.11+ but which are not the spec's `2026-03-04` shape: `20260304`, `2026-W09-1`. Must be malformed. Tested in Task 1 (`test_rejects_non_iso_calendar_dates`).
- An input amount of `-0.00`, and any category total that sums to zero: must print `0.00`, never `-0.00`. Tested in Task 5 (`test_negative_zero_prints_as_zero`).
- Quoted CSV fields containing a comma or an embedded newline: column counting and the reported line number must both stay correct. Tested in Task 2 (`test_quoted_field_with_embedded_newline_keeps_line_numbers`).
- Rules-file whitespace and CRLF line endings: a category must not silently end up as `"housing\r"`. Tested in Task 3 (`test_strips_whitespace_and_carriage_returns`).
- Case-insensitive matching in both directions — upper-case description against lower-case rule and vice versa. Tested in Task 3 (`test_matching_is_case_insensitive_both_ways`).
- Same-date rows must keep input order even when the file is reverse-chronological, so sorting is stable and not a re-sort by amount or description. Tested in Task 4 (`test_ties_keep_input_order`).
- Nothing at all on stdout when a row is malformed — a partial report is worse than none. Tested in Task 6 (`test_malformed_row_prints_nothing_to_stdout`).
- **Reviewer-only, no test:** a running total whose digit count exceeds `decimal`'s default 28-digit context precision would make `quantize` raise `InvalidOperation`. Unreachable with realistic bank data; left unguarded deliberately. Confirm the code does not paper over it with a bare `except`.
- **Reviewer-only, no test:** output must not depend on locale or the machine's timezone. Confirm no `locale.*` call, no `strftime`/`strptime` for parsing, and no `datetime.now()` anywhere.

---

## File Structure

| File | Responsibility |
|---|---|
| `ledgerlite/__init__.py` | Package marker + one-line docstring. No logic. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No behavior. |
| `ledgerlite/parse.py` | `ParseError`; field validators `parse_date` / `parse_amount`; `parse_transactions(text) -> list[Transaction]`. Knows CSV shape and line numbers. Knows nothing about files or exit codes. |
| `ledgerlite/rules.py` | `parse_rules(text) -> list[tuple[str, str]]`; `categorize(description, rules) -> str \| None`. |
| `ledgerlite/balance.py` | `order_transactions`; `closing_balance`. |
| `ledgerlite/report.py` | `UNCATEGORIZED`; `format_amount`; `category_totals`; `format_report`. Owns every character of the report. |
| `ledgerlite/cli.py` | `argparse` wiring, file reading, error messages, exit codes. `main(argv) -> int`. |
| `ledgerlite/__main__.py` | `sys.exit(main(sys.argv[1:]))`. |
| `test_parse.py` | Field validators and CSV parsing, including `Transaction` construction. |
| `test_rules.py` | Rules text parsing and matching. |
| `test_balance.py` | Ordering and closing balance. |
| `test_report.py` | Amount formatting, per-category totals, whole-report text. |
| `test_cli.py` | End-to-end through `main()`: exit codes, stdout, stderr. |

---

## Task 1: Package skeleton, `Transaction`, and field validators

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Create: `test_parse.py`
- Create: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass, fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that positional order.
  - `ledgerlite.parse.ParseError(line: int, message: str)` — `Exception` subclass with `.line: int` and `.message: str` attributes.
  - `ledgerlite.parse.parse_date(text: str) -> datetime.date` — raises `ValueError` whose `str()` is the human-readable reason.
  - `ledgerlite.parse.parse_amount(text: str) -> decimal.Decimal` — raises `ValueError` whose `str()` is the human-readable reason.

- [ ] **Step 1: Create the package skeleton and `.gitignore`**

`ledgerlite/__init__.py`:

```python
"""ledgerlite: categorize bank transactions and summarize them."""
```

`ledgerlite/model.py`:

```python
"""The single data type this tool moves around."""

from __future__ import annotations

import dataclasses
import datetime
import decimal


@dataclasses.dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV, validated."""

    date: datetime.date
    amount: decimal.Decimal
    description: str
```

`.gitignore`:

```
__pycache__/
*.pyc
```

- [ ] **Step 2: Write the failing tests for the field validators**

`test_parse.py`:

```python
"""Tests for ledgerlite.parse."""

import datetime
import decimal
import unittest

from ledgerlite.parse import ParseError, parse_amount, parse_date


class ParseDateTests(unittest.TestCase):
    def test_parses_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), datetime.date(2026, 3, 4))

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_date("  2026-03-04 "), datetime.date(2026, 3, 4))

    def test_rejects_impossible_calendar_date(self):
        with self.assertRaises(ValueError):
            parse_date("2026-13-45")

    def test_rejects_non_iso_calendar_dates(self):
        # date.fromisoformat() accepts all of these on 3.11+; the spec does not.
        for text in ["20260304", "2026-W09-1", "2026-3-4", "03/04/2026", ""]:
            with self.subTest(text=text):
                with self.assertRaises(ValueError):
                    parse_date(text)

    def test_error_message_quotes_the_offending_text(self):
        with self.assertRaises(ValueError) as caught:
            parse_date("03/04/2026")
        self.assertEqual(str(caught.exception), "invalid date '03/04/2026'")


class ParseAmountTests(unittest.TestCase):
    def test_parses_negative_two_digit_amount(self):
        self.assertEqual(parse_amount("-12.50"), decimal.Decimal("-12.50"))

    def test_parses_integer_and_one_digit_amounts(self):
        self.assertEqual(parse_amount("2500"), decimal.Decimal("2500"))
        self.assertEqual(parse_amount("1.5"), decimal.Decimal("1.5"))

    def test_parses_explicit_plus_sign(self):
        self.assertEqual(parse_amount("+7.25"), decimal.Decimal("7.25"))

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_amount(" -900.00 "), decimal.Decimal("-900.00"))

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertEqual(
            str(caught.exception),
            "amount '1.005' has more than two fractional digits",
        )

    def test_rejects_non_numeric_amounts(self):
        # Decimal() accepts several of these; the spec does not.
        for text in ["NaN", "Infinity", "-inf", "1e5", "1E+2", "_1.00", "1_000", "", "abc", "1.", ".5", "١٢"]:
            with self.subTest(text=text):
                with self.assertRaises(ValueError):
                    parse_amount(text)

    def test_error_message_quotes_the_offending_text(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("abc")
        self.assertEqual(str(caught.exception), "invalid amount 'abc'")

    def test_never_returns_a_float(self):
        self.assertNotIsInstance(parse_amount("1.50"), float)


class ParseErrorTests(unittest.TestCase):
    def test_carries_line_and_message(self):
        error = ParseError(7, "invalid amount 'abc'")
        self.assertEqual(error.line, 7)
        self.assertEqual(error.message, "invalid amount 'abc'")

    def test_str_includes_line_and_message(self):
        self.assertEqual(str(ParseError(7, "boom")), "7: boom")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'` (Step 1 deliberately did not create `parse.py`; Step 4 does).

- [ ] **Step 4: Write the minimal implementation**

`ledgerlite/parse.py`:

```python
"""Turn transactions-CSV text into Transaction objects."""

from __future__ import annotations

import datetime
import decimal
import re

# [0-9] rather than \d: \d also matches non-ASCII digits, which Decimal accepts.
_DATE_RE = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}\Z")
_AMOUNT_RE = re.compile(r"[+-]?[0-9]+(\.(?P<frac>[0-9]+))?\Z")


class ParseError(Exception):
    """A row of the transactions CSV is malformed."""

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_date(text: str) -> datetime.date:
    """Parse an ISO 8601 calendar date, e.g. '2026-03-04'."""
    stripped = text.strip()
    if _DATE_RE.match(stripped) is None:
        raise ValueError(f"invalid date {text!r}")
    try:
        return datetime.date.fromisoformat(stripped)
    except ValueError:
        raise ValueError(f"invalid date {text!r}") from None


def parse_amount(text: str) -> decimal.Decimal:
    """Parse a decimal amount with at most two fractional digits."""
    stripped = text.strip()
    match = _AMOUNT_RE.match(stripped)
    if match is None:
        raise ValueError(f"invalid amount {text!r}")
    fraction = match.group("frac")
    if fraction is not None and len(fraction) > 2:
        raise ValueError(f"amount {text!r} has more than two fractional digits")
    return decimal.Decimal(stripped)
```

Note the quoting in the error messages: `{text!r}` reproduces the *unstripped* text the user wrote, so `parse_amount(" abc ")` reports `invalid amount ' abc '`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS, all tests.

- [ ] **Step 6: Commit**

```bash
git add .gitignore ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: add Transaction model and date/amount field validators"
```

---

## Task 2: `parse_transactions` — CSV rows to transactions

**Files:**
- Modify: `ledgerlite/parse.py` (add imports, `HEADER`, `parse_transactions`)
- Modify: `test_parse.py` (add `ParseTransactionsTests`)

**Interfaces:**
- Consumes: `Transaction`, `ParseError`, `parse_date`, `parse_amount` from Task 1.
- Produces:
  - `ledgerlite.parse.HEADER: list[str]` — `["date", "amount", "description"]`.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — raises `ParseError` on the first malformed row; returns transactions in file order (no sorting here).

- [ ] **Step 1: Write the failing tests**

Append to `test_parse.py`, before the `if __name__ == "__main__":` block. Also extend the import line at the top of the file to:

```python
from ledgerlite.parse import ParseError, parse_amount, parse_date, parse_transactions
```

```python
HEADER_LINE = "date,amount,description\n"


class ParseTransactionsTests(unittest.TestCase):
    def test_parses_rows_in_file_order(self):
        text = HEADER_LINE + "2026-03-05,-7.50,Coffee shop\n2026-03-04,2500.00,Salary\n"
        transactions = parse_transactions(text)
        self.assertEqual(
            [(t.date, t.amount, t.description) for t in transactions],
            [
                (datetime.date(2026, 3, 5), decimal.Decimal("-7.50"), "Coffee shop"),
                (datetime.date(2026, 3, 4), decimal.Decimal("2500.00"), "Salary"),
            ],
        )

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER_LINE), [])

    def test_empty_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(""), [])

    def test_skips_blank_lines(self):
        text = HEADER_LINE + "\n2026-03-04,1.00,A\n\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_wrong_header_is_malformed(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("when,how much,what\n2026-03-04,1.00,A\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(
            caught.exception.message, "header must be date,amount,description"
        )

    def test_header_matching_ignores_case_and_padding(self):
        text = " Date , AMOUNT ,Description\n2026-03-04,1.00,A\n"
        self.assertEqual(len(parse_transactions(text)), 1)

    def test_too_few_columns_reports_line_number(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER_LINE + "2026-03-04,1.00\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 2")

    def test_too_many_columns_reports_line_number(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER_LINE + "2026-03-04,1.00,A,extra\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 4")

    def test_bad_date_reports_line_and_reason(self):
        text = HEADER_LINE + "2026-03-04,1.00,A\n2026-13-45,1.00,B\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.message, "invalid date '2026-13-45'")

    def test_bad_amount_reports_line_and_reason(self):
        text = HEADER_LINE + "2026-03-04,1.005,A\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(
            caught.exception.message,
            "amount '1.005' has more than two fractional digits",
        )

    def test_stops_at_the_first_malformed_row(self):
        text = HEADER_LINE + "nope,1.00,A\nalso-nope,1.00,B\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 2)

    def test_description_is_kept_verbatim(self):
        text = HEADER_LINE + '2026-03-04,1.00,"  Rent, March  "\n'
        self.assertEqual(parse_transactions(text)[0].description, "  Rent, March  ")

    def test_quoted_field_with_embedded_newline_keeps_line_numbers(self):
        text = HEADER_LINE + '2026-03-04,1.00,"two\nlines"\n2026-13-45,1.00,B\n'
        transactions = parse_transactions(text[: text.index("2026-13-45")])
        self.assertEqual(transactions[0].description, "two\nlines")
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        # The embedded newline is a physical line, so the bad row is line 4.
        self.assertEqual(caught.exception.line, 4)

    def test_handles_crlf_line_endings(self):
        text = "date,amount,description\r\n2026-03-04,1.00,A\r\n"
        self.assertEqual(parse_transactions(text)[0].description, "A")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'parse_transactions'`.

- [ ] **Step 3: Write the minimal implementation**

Add `csv` and `io` to the imports at the top of `ledgerlite/parse.py`, add the `HEADER` constant next to the regexes, and add `parse_transactions` at the end of the module:

```python
import csv
import io
```

```python
HEADER = ["date", "amount", "description"]
```

```python
def parse_transactions(text: str) -> list[Transaction]:
    """Parse transactions-CSV text, rejecting the whole file on any bad row."""
    # newline="" so csv sees line endings untranslated, per the csv docs.
    reader = csv.reader(io.StringIO(text, newline=""))
    transactions: list[Transaction] = []
    for index, row in enumerate(reader):
        line = reader.line_num
        if index == 0:
            if [field.strip().lower() for field in row] != HEADER:
                raise ParseError(line, "header must be date,amount,description")
            continue
        if not row:
            continue
        if len(row) != len(HEADER):
            raise ParseError(line, f"expected {len(HEADER)} columns, got {len(row)}")
        date_text, amount_text, description = row
        try:
            date = parse_date(date_text)
            amount = parse_amount(amount_text)
        except ValueError as error:
            raise ParseError(line, str(error)) from None
        transactions.append(
            Transaction(date=date, amount=amount, description=description)
        )
    return transactions
```

Add the model import to the top of `ledgerlite/parse.py`:

```python
from .model import Transaction
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV with per-line malformed-row errors"
```

---

## Task 3: `rules.py` — rules text and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Create: `test_rules.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — the first matching rule's category, or `None`.

- [ ] **Step 1: Write the failing tests**

`test_rules.py`:

```python
"""Tests for ledgerlite.rules."""

import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTests(unittest.TestCase):
    def test_parses_rules_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_empty_text_has_no_rules(self):
        self.assertEqual(parse_rules(""), [])

    def test_skips_blank_and_whitespace_only_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\n   \n"), [("coffee", "food")])

    def test_skips_lines_without_a_separator(self):
        self.assertEqual(parse_rules("coffee=food\nnonsense\n"), [("coffee", "food")])

    def test_skips_rules_with_an_empty_substring_or_category(self):
        self.assertEqual(parse_rules("=food\ncoffee=\n  =  \n"), [])

    def test_splits_on_the_first_separator_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_strips_whitespace_and_carriage_returns(self):
        self.assertEqual(
            parse_rules("  coffee  =  food  \r\nrent=housing\r\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_keeps_duplicate_substrings_in_order(self):
        self.assertEqual(
            parse_rules("coffee=food\ncoffee=treats\n"),
            [("coffee", "food"), ("coffee", "treats")],
        )


class CategorizeTests(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_substring_anywhere_in_description(self):
        self.assertEqual(categorize("BLUE BOTTLE COFFEE #12", self.RULES), "food")

    def test_matching_is_case_insensitive_both_ways(self):
        self.assertEqual(categorize("COFFEE", [("coffee", "food")]), "food")
        self.assertEqual(categorize("coffee", [("COFFEE", "food")]), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_when_there_are_no_rules(self):
        self.assertIsNone(categorize("Anything", []))

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "treats")]
        self.assertEqual(categorize("Coffee Shop", rules), "food")

    def test_earlier_rule_wins_even_if_a_later_one_matches_too(self):
        rules = [("rent", "housing"), ("coffee", "food")]
        self.assertEqual(categorize("Rent and coffee", rules), "housing")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`.

- [ ] **Step 3: Write the minimal implementation**

`ledgerlite/rules.py`:

```python
"""Rules text: '<substring>=<category>', first match wins."""

from __future__ import annotations

SEPARATOR = "="


def parse_rules(text: str) -> list[tuple[str, str]]:
    """Parse rules text into (substring, category) pairs, in file order.

    Lines that are blank, that lack a separator, or whose substring or
    category is empty are skipped: the spec defines no error path here.
    """
    rules: list[tuple[str, str]] = []
    for line in text.splitlines():
        substring, separator, category = line.partition(SEPARATOR)
        if not separator:
            continue
        substring = substring.strip()
        category = category.strip()
        if not substring or not category:
            continue
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[tuple[str, str]]) -> str | None:
    """Return the first matching rule's category, or None if none match."""
    lowered = description.lower()
    for substring, category in rules:
        if substring.lower() in lowered:
            return category
    return None
```

`str.splitlines()` handles `\n`, `\r\n`, and a missing final newline, so the `\r` never reaches a category.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules parsing and first-match-wins categorization"
```

---

## Task 4: `balance.py` — date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Create: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` from Task 1.
- Produces:
  - `ledgerlite.balance.order_transactions(transactions: Iterable[Transaction]) -> list[Transaction]` — sorted by date, stable (ties keep input order). Does not mutate its argument.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal` — the running balance after the last transaction; `opening` when there are none.

- [ ] **Step 1: Write the failing tests**

`test_balance.py`:

```python
"""Tests for ledgerlite.balance."""

import datetime
import decimal
import unittest

from ledgerlite.balance import closing_balance, order_transactions
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(
        date=datetime.date(2026, 3, day),
        amount=decimal.Decimal(amount),
        description=description,
    )


class OrderTransactionsTests(unittest.TestCase):
    def test_sorts_by_date(self):
        ordered = order_transactions([txn(5, "1.00", "b"), txn(4, "1.00", "a")])
        self.assertEqual([t.description for t in ordered], ["a", "b"])

    def test_ties_keep_input_order(self):
        # Reverse-chronological input with a same-date pair: the pair must
        # stay in input order, and must not be re-sorted by amount.
        given = [
            txn(9, "5.00", "late"),
            txn(4, "3.00", "second"),
            txn(4, "-1.00", "first-but-later-amount"),
        ]
        # Deliberately: 'second' appears before 'first-but-later-amount'.
        ordered = order_transactions(given)
        self.assertEqual(
            [t.description for t in ordered],
            ["second", "first-but-later-amount", "late"],
        )

    def test_empty_input_gives_empty_list(self):
        self.assertEqual(order_transactions([]), [])

    def test_does_not_mutate_its_argument(self):
        given = [txn(5, "1.00", "b"), txn(4, "1.00", "a")]
        order_transactions(given)
        self.assertEqual([t.description for t in given], ["b", "a"])


class ClosingBalanceTests(unittest.TestCase):
    def test_adds_amounts_to_the_opening_balance(self):
        transactions = [txn(4, "2500.00"), txn(5, "-7.50"), txn(6, "-900.00")]
        self.assertEqual(
            closing_balance(decimal.Decimal("100"), transactions),
            decimal.Decimal("1692.50"),
        )

    def test_no_transactions_gives_the_opening_balance(self):
        self.assertEqual(
            closing_balance(decimal.Decimal("100.00"), []), decimal.Decimal("100.00")
        )

    def test_result_is_exact_not_floating_point(self):
        transactions = [txn(4, "0.10") for _ in range(3)]
        self.assertEqual(
            closing_balance(decimal.Decimal("0"), transactions),
            decimal.Decimal("0.30"),
        )

    def test_order_does_not_change_the_closing_balance(self):
        transactions = [txn(9, "-5.00"), txn(4, "3.00")]
        self.assertEqual(
            closing_balance(decimal.Decimal("1"), transactions),
            closing_balance(decimal.Decimal("1"), order_transactions(transactions)),
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`.

- [ ] **Step 3: Write the minimal implementation**

`ledgerlite/balance.py`:

```python
"""Date ordering and the running balance."""

from __future__ import annotations

import decimal
from collections.abc import Iterable

from .model import Transaction


def order_transactions(transactions: Iterable[Transaction]) -> list[Transaction]:
    """Return the transactions by date; ties keep input order.

    sorted() is stable, which is exactly the tie-breaking the spec asks for.
    """
    return sorted(transactions, key=lambda transaction: transaction.date)


def closing_balance(
    opening: decimal.Decimal, transactions: Iterable[Transaction]
) -> decimal.Decimal:
    """Return the running balance after the last transaction."""
    balance = opening
    for transaction in transactions:
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add stable date ordering and closing balance"
```

---

## Task 5: `report.py` — amount formatting, category totals, report text

**Files:**
- Create: `ledgerlite/report.py`
- Create: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 3), `order_transactions` and `closing_balance` (Task 4).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED: str` — `"uncategorized"`.
  - `ledgerlite.report.format_amount(amount: Decimal) -> str`.
  - `ledgerlite.report.category_totals(transactions: Iterable[Transaction], rules: list[tuple[str, str]]) -> dict[str, Decimal]` — keys are category names, uncategorized transactions under `UNCATEGORIZED`; categories with no transactions are absent.
  - `ledgerlite.report.format_report(transactions: Iterable[Transaction], rules: list[tuple[str, str]], opening: Decimal) -> str` — the whole report, ending in exactly one `"\n"`.

- [ ] **Step 1: Write the failing tests**

`test_report.py`:

```python
"""Tests for ledgerlite.report."""

import datetime
import decimal
import unittest

from ledgerlite.model import Transaction
from ledgerlite.report import (
    UNCATEGORIZED,
    category_totals,
    format_amount,
    format_report,
)


def txn(day, amount, description):
    return Transaction(
        date=datetime.date(2026, 3, day),
        amount=decimal.Decimal(amount),
        description=description,
    )


class FormatAmountTests(unittest.TestCase):
    def test_formats_two_fractional_digits(self):
        self.assertEqual(format_amount(decimal.Decimal("-12.50")), "-12.50")
        self.assertEqual(format_amount(decimal.Decimal("1200.00")), "1200.00")

    def test_pads_and_trims_to_exactly_two_digits(self):
        self.assertEqual(format_amount(decimal.Decimal("5")), "5.00")
        self.assertEqual(format_amount(decimal.Decimal("1.5")), "1.50")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(decimal.Decimal("1234567.89")), "1234567.89")

    def test_zero_has_no_sign(self):
        self.assertEqual(format_amount(decimal.Decimal("0")), "0.00")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(decimal.Decimal("-0.00")), "0.00")

    def test_no_scientific_notation_for_large_values(self):
        self.assertEqual(format_amount(decimal.Decimal("1E+9")), "1000000000.00")


class CategoryTotalsTests(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_sums_amounts_per_category(self):
        transactions = [
            txn(4, "-7.50", "Coffee shop"),
            txn(5, "-2.50", "COFFEE beans"),
            txn(6, "-900.00", "Rent March"),
        ]
        self.assertEqual(
            category_totals(transactions, self.RULES),
            {"food": decimal.Decimal("-10.00"), "housing": decimal.Decimal("-900.00")},
        )

    def test_unmatched_transactions_go_to_uncategorized(self):
        transactions = [txn(4, "2500.00", "Salary")]
        self.assertEqual(
            category_totals(transactions, self.RULES),
            {UNCATEGORIZED: decimal.Decimal("2500.00")},
        )

    def test_no_rules_means_everything_is_uncategorized(self):
        transactions = [txn(4, "1.00", "Coffee"), txn(5, "2.00", "Rent")]
        self.assertEqual(
            category_totals(transactions, []),
            {UNCATEGORIZED: decimal.Decimal("3.00")},
        )

    def test_categories_with_no_transactions_are_absent(self):
        self.assertNotIn("housing", category_totals([txn(4, "1.00", "Coffee")], self.RULES))

    def test_no_transactions_gives_no_categories(self):
        self.assertEqual(category_totals([], self.RULES), {})

    def test_rule_category_named_uncategorized_merges_into_the_bucket(self):
        transactions = [txn(4, "1.00", "Coffee"), txn(5, "2.00", "Salary")]
        self.assertEqual(
            category_totals(transactions, [("coffee", UNCATEGORIZED)]),
            {UNCATEGORIZED: decimal.Decimal("3.00")},
        )


class FormatReportTests(unittest.TestCase):
    def test_matches_the_spec_example(self):
        transactions = [
            txn(4, "2500.00", "Salary"),
            txn(5, "-7.50", "Coffee shop"),
            txn(6, "-900.00", "Rent March"),
        ]
        rules = [("coffee", "food"), ("rent", "housing")]
        self.assertEqual(
            format_report(transactions, rules, decimal.Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_categories_sort_alphabetically_case_insensitively(self):
        transactions = [
            txn(4, "1.00", "zebra"),
            txn(4, "1.00", "Apparel run"),
            txn(4, "1.00", "food thing"),
        ]
        rules = [("zebra", "Zoo"), ("apparel", "apparel"), ("food", "Food")]
        self.assertEqual(
            format_report(transactions, rules, decimal.Decimal("0")).splitlines()[:3],
            ["apparel: 1.00", "Food: 1.00", "Zoo: 1.00"],
        )

    def test_uncategorized_is_last_even_though_z_sorts_after_it(self):
        transactions = [txn(4, "1.00", "zebra"), txn(4, "2.00", "mystery")]
        report = format_report(transactions, [("zebra", "zoo")], decimal.Decimal("0"))
        self.assertEqual(
            report.splitlines()[:2], ["zoo: 1.00", "uncategorized: 2.00"]
        )

    def test_report_with_no_transactions(self):
        self.assertEqual(
            format_report([], [], decimal.Decimal("100")),
            "\nclosing balance: 100.00\n",
        )

    def test_closing_balance_uses_the_opening_amount(self):
        transactions = [txn(4, "-10.00", "Coffee")]
        report = format_report(transactions, [], decimal.Decimal("-5.00"))
        self.assertTrue(report.endswith("closing balance: -15.00\n"))

    def test_ends_with_exactly_one_newline(self):
        report = format_report([txn(4, "1.00", "a")], [], decimal.Decimal("0"))
        self.assertTrue(report.endswith("\n"))
        self.assertFalse(report.endswith("\n\n"))

    def test_does_not_depend_on_input_order(self):
        rules = [("coffee", "food")]
        a = [txn(6, "-1.00", "Coffee"), txn(4, "2.00", "Salary")]
        b = [txn(4, "2.00", "Salary"), txn(6, "-1.00", "Coffee")]
        self.assertEqual(
            format_report(a, rules, decimal.Decimal("0")),
            format_report(b, rules, decimal.Decimal("0")),
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`.

- [ ] **Step 3: Write the minimal implementation**

`ledgerlite/report.py`:

```python
"""Per-category totals and the report text."""

from __future__ import annotations

import decimal
from collections.abc import Iterable

from .balance import closing_balance, order_transactions
from .model import Transaction
from .rules import categorize

UNCATEGORIZED = "uncategorized"

_CENTS = decimal.Decimal("0.01")


def format_amount(amount: decimal.Decimal) -> str:
    """Format an amount with exactly two fractional digits and no separators."""
    quantized = amount.quantize(_CENTS)
    if quantized.is_zero():
        # Decimal('-0.00') would otherwise print a sign the spec forbids.
        quantized = decimal.Decimal("0.00")
    return f"{quantized:f}"


def category_totals(
    transactions: Iterable[Transaction], rules: list[tuple[str, str]]
) -> dict[str, decimal.Decimal]:
    """Sum amounts per category; unmatched transactions under UNCATEGORIZED."""
    totals: dict[str, decimal.Decimal] = {}
    for transaction in transactions:
        category = categorize(transaction.description, rules)
        if category is None:
            category = UNCATEGORIZED
        totals[category] = totals.get(category, decimal.Decimal("0")) + transaction.amount
    return totals


def _category_sort_key(category: str) -> tuple[bool, str, str]:
    """uncategorized last, then alphabetical ignoring case, raw name as tiebreak."""
    return (category == UNCATEGORIZED, category.lower(), category)


def format_report(
    transactions: Iterable[Transaction],
    rules: list[tuple[str, str]],
    opening: decimal.Decimal,
) -> str:
    """Render the whole report, ending in a single newline."""
    ordered = order_transactions(transactions)
    totals = category_totals(ordered, rules)
    lines = [
        f"{category}: {format_amount(totals[category])}"
        for category in sorted(totals, key=_category_sort_key)
    ]
    lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(opening, ordered))}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add amount formatting, category totals, and report rendering"
```

---

## Task 6: `cli.py` — argparse, file I/O, exit codes

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Create: `test_cli.py`
- Create: `README.md`

**Interfaces:**
- Consumes: `parse_amount`, `parse_transactions`, `ParseError` (Tasks 1–2), `parse_rules` (Task 3), `format_report` (Task 5).
- Produces:
  - `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — writes the report to stdout or an error to stderr; returns the exit code. Raises `SystemExit(2)` for argparse usage errors (missing subcommand, missing path, invalid `--opening`), which is argparse's own behavior and is deliberately not caught.

- [ ] **Step 1: Write the failing tests**

`test_cli.py`:

```python
"""End-to-end tests for ledgerlite.cli."""

import contextlib
import io
import os
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-06,-900.00,Rent March\n"
    "2026-03-04,2500.00,Salary\n"
    "2026-03-05,-7.50,Coffee shop\n"
)
RULES = "coffee=food\nrent=housing\n"

EXPECTED = (
    "food: -7.50\n"
    "housing: -900.00\n"
    "uncategorized: 2500.00\n"
    "\n"
    "closing balance: 1692.50\n"
)


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)

    def write(self, name, content, encoding="utf-8"):
        path = os.path.join(self.directory.name, name)
        with open(path, "w", encoding=encoding, newline="") as handle:
            handle.write(content)
        return path

    def run_main(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()


class ReportCommandTests(CliTestCase):
    def test_matches_the_spec_example(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", RULES)
        code, out, err = self.run_main(
            ["report", transactions, "--rules", rules, "--opening", "100"]
        )
        self.assertEqual(code, 0)
        self.assertEqual(out, EXPECTED)
        self.assertEqual(err, "")

    def test_opening_defaults_to_zero(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-03-04,1.25,A\n")
        code, out, _ = self.run_main(["report", transactions])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1.25\n\nclosing balance: 1.25\n")

    def test_without_rules_everything_is_uncategorized(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_main(["report", transactions, "--opening", "100"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1692.50\n")

    def test_negative_opening_is_accepted(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-03-04,1.00,A\n")
        code, out, _ = self.run_main(["report", transactions, "--opening", "-10.50"])
        self.assertEqual(code, 0)
        self.assertTrue(out.endswith("closing balance: -9.50\n"))

    def test_empty_file_reports_the_opening_balance(self):
        transactions = self.write("t.csv", "")
        code, out, _ = self.run_main(["report", transactions, "--opening", "42"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "\nclosing balance: 42.00\n")


class UnreadableFileTests(CliTestCase):
    def test_missing_transactions_file_exits_1(self):
        missing = os.path.join(self.directory.name, "nope.csv")
        code, out, err = self.run_main(["report", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_directory_as_transactions_file_exits_1(self):
        code, out, err = self.run_main(["report", self.directory.name])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.directory.name}: "))

    def test_missing_rules_file_exits_1(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        missing = os.path.join(self.directory.name, "nope.txt")
        code, out, err = self.run_main(["report", transactions, "--rules", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {missing}: No such file or directory\n")

    def test_non_utf8_transactions_file_exits_1(self):
        path = os.path.join(self.directory.name, "binary.csv")
        with open(path, "wb") as handle:
            handle.write(b"date,amount,description\n2026-03-04,1.00,\xff\xfe\n")
        code, out, err = self.run_main(["report", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: not valid UTF-8 text\n")


class MalformedRowTests(CliTestCase):
    def test_bad_amount_exits_2_with_path_and_line(self):
        path = self.write("t.csv", "date,amount,description\n2026-03-04,1.005,A\n")
        code, out, err = self.run_main(["report", path])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {path}:2: amount '1.005' has more than two fractional digits\n",
        )

    def test_bad_date_exits_2_with_path_and_line(self):
        path = self.write("t.csv", "date,amount,description\n2026-13-45,1.00,A\n")
        code, _, err = self.run_main(["report", path])
        self.assertEqual(code, 2)
        self.assertEqual(err, f"ledgerlite: {path}:2: invalid date '2026-13-45'\n")

    def test_wrong_column_count_exits_2(self):
        path = self.write("t.csv", "date,amount,description\n2026-03-04,1.00\n")
        code, _, err = self.run_main(["report", path])
        self.assertEqual(code, 2)
        self.assertEqual(err, f"ledgerlite: {path}:2: expected 3 columns, got 2\n")

    def test_malformed_row_prints_nothing_to_stdout(self):
        path = self.write(
            "t.csv",
            "date,amount,description\n2026-03-04,1.00,Good\n2026-03-05,oops,Bad\n",
        )
        code, out, err = self.run_main(["report", path])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {path}:3: invalid amount 'oops'\n")

    def test_error_path_is_the_argument_as_given(self):
        self.write("t.csv", "date,amount,description\n2026-03-04,oops,A\n")
        cwd = os.getcwd()
        os.chdir(self.directory.name)
        self.addCleanup(os.chdir, cwd)
        code, _, err = self.run_main(["report", "t.csv"])
        self.assertEqual(code, 2)
        self.assertEqual(err, "ledgerlite: t.csv:2: invalid amount 'oops'\n")


class UsageErrorTests(CliTestCase):
    def test_missing_subcommand_is_a_usage_error(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                main([])
        self.assertEqual(caught.exception.code, 2)

    def test_missing_transactions_argument_is_a_usage_error(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                main(["report"])
        self.assertEqual(caught.exception.code, 2)

    def test_invalid_opening_is_a_usage_error(self):
        path = self.write("t.csv", TRANSACTIONS)
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            with self.assertRaises(SystemExit) as caught:
                main(["report", path, "--opening", "1.005"])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("--opening", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`.

- [ ] **Step 3: Write the minimal implementation**

`ledgerlite/cli.py`:

```python
"""Command-line entry point: argument parsing, file I/O, exit codes."""

from __future__ import annotations

import argparse
import decimal
import sys

from .parse import ParseError, parse_amount, parse_transactions
from .report import format_report
from .rules import parse_rules

PROGRAM = "ledgerlite"


def amount(text: str) -> decimal.Decimal:
    """argparse `type` for --opening. Named so argparse's message reads well."""
    return parse_amount(text)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=PROGRAM, description="Summarize bank transactions by category."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    report = subparsers.add_parser("report", help="print a per-category summary")
    report.add_argument("transactions", help="path to the transactions CSV")
    report.add_argument("--rules", help="path to a <substring>=<category> rules file")
    report.add_argument(
        "--opening",
        type=amount,
        default=decimal.Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def read_text(path: str) -> str:
    # newline="" so csv sees line endings untranslated, per the csv docs.
    with open(path, encoding="utf-8", newline="") as handle:
        return handle.read()


def _reason(error: OSError | UnicodeDecodeError) -> str:
    if isinstance(error, UnicodeDecodeError):
        return "not valid UTF-8 text"
    return error.strerror or str(error)


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    texts = {}
    for key, path in (("transactions", args.transactions), ("rules", args.rules)):
        if path is None:
            continue
        try:
            texts[key] = read_text(path)
        except (OSError, UnicodeDecodeError) as error:
            print(
                f"{PROGRAM}: cannot read {path}: {_reason(error)}", file=sys.stderr
            )
            return 1

    try:
        transactions = parse_transactions(texts["transactions"])
    except ParseError as error:
        print(
            f"{PROGRAM}: {args.transactions}:{error.line}: {error.message}",
            file=sys.stderr,
        )
        return 2

    rules = parse_rules(texts["rules"]) if "rules" in texts else []
    sys.stdout.write(format_report(transactions, rules, args.opening))
    return 0
```

Reading both files before parsing either is what makes `test_missing_rules_file_exits_1` pass even when the transactions file is fine, and it guarantees no partial report can reach stdout.

`ledgerlite/__main__.py`:

```python
"""Allow `python3 -m ledgerlite ...`."""

import sys

from .cli import main

sys.exit(main(sys.argv[1:]))
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS, all tests.

- [ ] **Step 5: Run the whole suite and the tool by hand**

Run: `python3 -m unittest`
Expected: PASS, every test in every `test_*.py`, `OK`.

Then confirm the spec's example end to end:

```bash
printf 'date,amount,description\n2026-03-06,-900.00,Rent March\n2026-03-04,2500.00,Salary\n2026-03-05,-7.50,Coffee shop\n' > /tmp/t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/r.txt
python3 -m ledgerlite report /tmp/t.csv --rules /tmp/r.txt --opening 100
```

Expected, exactly:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
```

Then confirm the two error paths:

```bash
python3 -m ledgerlite report /tmp/missing.csv; echo "exit=$?"
printf 'date,amount,description\n2026-03-04,1.005,A\n' > /tmp/bad.csv
python3 -m ledgerlite report /tmp/bad.csv; echo "exit=$?"
```

Expected: `ledgerlite: cannot read /tmp/missing.csv: No such file or directory` with `exit=1`, then `ledgerlite: /tmp/bad.csv:2: amount '1.005' has more than two fractional digits` with `exit=2`, and no stdout in either case.

- [ ] **Step 6: Write the README**

`README.md`:

```markdown
# ledgerlite

Read a CSV of bank transactions, assign each a category from a rules file,
and print a per-category summary with the closing balance. Standard library
only, Python 3.11+.

## Usage

    python3 -m ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]

`TRANSACTIONS` is a CSV with the header `date,amount,description`. `RULES` is
a text file of `<substring>=<category>` lines; matching is case-insensitive on
the description and the first matching rule wins. `--opening` defaults to `0`.

    $ python3 -m ledgerlite report t.csv --rules r.txt --opening 100
    food: -7.50
    housing: -900.00
    uncategorized: 2500.00

    closing balance: 1692.50

Exit codes: `0` success, `1` a file could not be read, `2` a malformed row
(the whole file is rejected and nothing is printed to stdout).

## Tests

    python3 -m unittest

See `design.md` for the full specification.
```

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py README.md
git commit -m "feat: add CLI entry point with exit codes and error messages"
```

---

## Done when

- `python3 -m unittest` is green from the repo root.
- `python3 -m ledgerlite report ...` reproduces the spec's example byte for byte.
- No `float`, no `round()`, and no third-party import anywhere in `ledgerlite/`.
- Every file in the spec's "Package layout" exists, plus `__main__.py`.
