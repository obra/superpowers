# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python command-line tool that reads a bank-transaction CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired together by `cli.py`: `model` (the `Transaction` record), `parse` (field validation + CSV → `list[Transaction]`, raising `ParseError` carrying a line number), `rules` (rules text → ordered `(substring, category)` pairs, plus `categorize`), `balance` (date ordering and closing balance), `report` (per-category totals and text formatting), `cli` (argparse, file I/O, exit codes, error messages). All I/O lives in `cli.py`; every other module takes iterables of lines or lists of objects, so tests never need temp files except for the CLI task. Money is `decimal.Decimal` end to end — never `float`.

**Tech Stack:** Python 3.11+, standard library only (`argparse`, `csv`, `dataclasses`, `datetime`, `decimal`, `re`, `unittest`). Tests are `unittest` files at the repo root, run with `python3 -m unittest`.

**Spec:** `design.md` (in this directory — read it before starting; every task argues from it)

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies, no `pyproject.toml`, no packaging metadata.
- Money is parsed and summed as `decimal.Decimal`. `float` must not appear anywhere in the package.
- Package layout is fixed by the spec: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`, plus `ledgerlite/__main__.py` so `python3 -m ledgerlite` works (see Decisions).
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest` from the repo root.
- Exit codes: `0` success, `1` a named file cannot be read, `2` a file's contents are malformed (and, from argparse, bad command-line usage).
- Error messages, verbatim formats: `ledgerlite: cannot read <path>: <reason>` and `ledgerlite: <path>:<line>: <what is wrong>`, each on stderr with a trailing newline.
- When any error is reported, stdout stays empty.
- Amounts print with exactly two fractional digits, a leading `-` only for negatives, and no thousands separators: `-12.50`, `0.00`, `1200.00`.
- The uncategorized bucket is spelled `uncategorized` and is always listed last.
- Work directly on `main` in this repo (local scratch repo, no remote). Commit at the end of every task.

## Decisions where the spec is silent

These are judgment calls, made once here so tasks stay consistent. Each is pinned by a test in the task that owns the code.

1. **Header row is validated.** The first CSV line must be `date,amount,description` (field names compared after `.strip().lower()`). A file whose first line is something else is malformed at line 1 — otherwise a header-less file silently loses its first transaction. A completely empty file is malformed at line 1 (`missing header row date,amount,description`). A header-only file is valid and yields zero transactions.
2. **`date` and `amount` fields are `.strip()`ped before validation** (so `2026-03-04, -7.50, Coffee` parses); `description` is preserved byte-for-byte, including leading spaces, because it is free text.
3. **Amounts are validated by regex, not by `Decimal`'s tolerance.** `Decimal` accepts `NaN`, `Infinity`, `-inf`, `1e2`, and `1_0`; none of those is "a decimal number with up to two fractional digits", so all are malformed. `1.5`, `1.50`, `1200`, `.50`, `+3.00` are fine; `1.005` is not.
4. **Dates must be exactly `YYYY-MM-DD`.** `date.fromisoformat` on 3.11+ also accepts `20260304` and week dates; the spec pins one form, so a regex gates it first.
5. **Rules-file problems are reported like transaction problems**: `ledgerlite: <path>:<line>: <what is wrong>`, exit 2. Blank and whitespace-only lines are skipped. A line with no `=`, an empty substring, or an empty category is malformed. Substring and category are stripped of surrounding whitespace; the split is on the *first* `=`, so a category may contain `=`.
6. **An unreadable `--rules` file** is reported with the same `cannot read` message and exit 1 as an unreadable transactions file.
7. **Precedence:** the transactions file is read and parsed first, so its problems are reported before any rules-file problem.
8. **Zero categories still get the blank separator line.** With no transactions the whole report is `"\nclosing balance: 0.00\n"` — the spec says "then a blank line, then `closing balance`" unconditionally.
9. **Category ordering is a plain codepoint sort** (`sorted()`), so `Food` sorts before `auto`. Categories differing only in case are distinct categories.
10. **`--opening` is validated by the same amount rules.** An invalid value is an argparse error: usage on stderr, exit 2 (argparse's own code, which matches the malformed-input code).
11. **Files are opened with `encoding="utf-8-sig"`** so a UTF-8 BOM before the header does not break header validation. Undecodable bytes are reported as `cannot read`, exit 1 — never a traceback.
12. **Invocation is `python3 -m ledgerlite report ...`.** A `ledgerlite` console script would need packaging metadata, which the stdlib-only constraint rules out.

## Review Focus

These are the input classes the spec implies but never spells out, most likely to bite first. Each already has a test in the task that owns the code — listed here so a reviewer can check them as a set.

1. **Whitespace-padded CSV fields** (`2026-03-04, -7.50, Coffee`) — extremely common in real exports; must parse, not be rejected as malformed. (Tasks 2, 3)
2. **Strings `Decimal` accepts but the spec does not** — `NaN`, `Infinity`, `-inf`, `1e2`, `1_0`, `""` — must be malformed with exit 2, never silently summed into the balance. (Tasks 2, 7)
3. **A header-only file and a truly empty file** — zero transactions must print the blank line plus `closing balance: <opening>` and exit 0; an empty file must be a clean exit 2, not an `IndexError`. (Tasks 3, 6, 7)
4. **A category whose amounts sum to zero** must print `0.00`, never `-0.00`, and `-0.001`-style residue must be impossible because inputs are capped at two decimals. (Task 6)
5. **Paths that exist but cannot be read as text** — a directory, a permission-denied file, non-UTF-8 bytes — must produce `ledgerlite: cannot read <path>: <reason>` and exit 1, never a traceback. (Task 7)

---

## File Structure

| File | Responsibility |
|---|---|
| `ledgerlite/__init__.py` | Package docstring only. No re-exports (keeps import graph obvious). |
| `ledgerlite/model.py` | `Transaction` frozen dataclass: `date`, `amount`, `description`. |
| `ledgerlite/parse.py` | `ParseError`; `parse_amount`, `parse_date` field validators; `parse_transactions(lines)` → `list[Transaction]`. |
| `ledgerlite/rules.py` | `Rule` alias; `parse_rules(lines)` → `list[Rule]`; `categorize(description, rules)` → `str | None`. |
| `ledgerlite/balance.py` | `order_by_date(transactions)`; `closing_balance(opening, transactions)`. |
| `ledgerlite/report.py` | `UNCATEGORIZED`; `format_amount`; `category_totals`; `ordered_categories`; `format_report`. |
| `ledgerlite/cli.py` | argparse wiring, file reading, error messages, exit codes; `main(argv) -> int`. |
| `ledgerlite/__main__.py` | `sys.exit(main())` so `python3 -m ledgerlite` runs. |
| `test_model.py` … `test_cli.py` | One `unittest` file per module under test, at the repo root. |

Task order follows the dependency order: model → parse → rules → balance → report → cli.

---

### Task 1: Package skeleton and Transaction model

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Test: `test_model.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `ledgerlite.model.Transaction(date: datetime.date, amount: decimal.Decimal, description: str)` — a frozen dataclass with keyword or positional construction, field order `date, amount, description`. Every later task imports it.

- [ ] **Step 1: Write the failing test**

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
        self.assertEqual(txn.date, datetime.date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("1.00"))
        self.assertEqual(txn.description, "x")

    def test_is_frozen(self):
        txn = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "x")
        with self.assertRaises(dataclasses.FrozenInstanceError):
            txn.amount = Decimal("2.00")

    def test_equal_values_compare_equal(self):
        first = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "x")
        second = Transaction(datetime.date(2026, 3, 4), Decimal("1.00"), "x")
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite: summarize bank transactions by category."""
```

Create `ledgerlite/model.py`:

```python
"""The transaction record shared by every other module."""

from __future__ import annotations

import datetime
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV, with its fields already validated."""

    date: datetime.date
    amount: Decimal
    description: str
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py test_model.py
git commit -m "feat: add Transaction model and package skeleton"
```

---

### Task 2: Field validation — amounts, dates, and ParseError

**Files:**
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (imported here, used in Task 3).
- Produces:
  - `ParseError(line: int, message: str)` — exception with `.line` and `.message` attributes; `str(err)` is `"<line>: <message>"`.
  - `parse_amount(text: str) -> Decimal` — raises `ValueError` whose message is a complete "what is wrong" phrase.
  - `parse_date(text: str) -> datetime.date` — same error contract.
  - Both are reused by Task 3 (`parse_transactions`) and Task 7 (`--opening`).

- [ ] **Step 1: Write the failing tests**

Create `test_parse.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount, parse_date


class ParseErrorTest(unittest.TestCase):
    def test_records_line_and_message(self):
        error = ParseError(7, "expected 3 columns, got 2")
        self.assertEqual(error.line, 7)
        self.assertEqual(error.message, "expected 3 columns, got 2")
        self.assertEqual(str(error), "7: expected 3 columns, got 2")


class ParseAmountTest(unittest.TestCase):
    def test_accepts_two_fractional_digits(self):
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))

    def test_accepts_fewer_fractional_digits(self):
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1200"), Decimal("1200"))

    def test_accepts_leading_sign_and_bare_fraction(self):
        self.assertEqual(parse_amount("+3.00"), Decimal("3.00"))
        self.assertEqual(parse_amount(".50"), Decimal("0.50"))

    def test_accepts_surrounding_whitespace(self):
        self.assertEqual(parse_amount("  -7.50 "), Decimal("-7.50"))

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError):
            parse_amount("1.005")

    def test_rejects_strings_decimal_would_accept(self):
        for text in ("NaN", "Infinity", "-inf", "1e2", "1_0", "", "  ", "1,000.00", "$1.00"):
            with self.subTest(text=text):
                with self.assertRaises(ValueError):
                    parse_amount(text)

    def test_message_quotes_the_offending_text(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("abc")
        self.assertIn("'abc'", str(caught.exception))
        self.assertIn("amount", str(caught.exception))


class ParseDateTest(unittest.TestCase):
    def test_accepts_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), datetime.date(2026, 3, 4))

    def test_accepts_surrounding_whitespace(self):
        self.assertEqual(parse_date(" 2026-03-04 "), datetime.date(2026, 3, 4))

    def test_rejects_other_shapes_and_impossible_dates(self):
        for text in ("20260304", "2026-3-4", "03/04/2026", "2026-13-01", "2026-02-30", "", "today"):
            with self.subTest(text=text):
                with self.assertRaises(ValueError):
                    parse_date(text)

    def test_message_quotes_the_offending_text(self):
        with self.assertRaises(ValueError) as caught:
            parse_date("03/04/2026")
        self.assertIn("'03/04/2026'", str(caught.exception))
        self.assertIn("date", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/parse.py`:

```python
"""Read a transactions CSV, validating every field."""

from __future__ import annotations

import datetime
import re
from decimal import Decimal

_DATE_PATTERN = re.compile(r"\A\d{4}-\d{2}-\d{2}\Z")
# A decimal number with at most two fractional digits. Deliberately stricter
# than Decimal(), which also accepts NaN, Infinity, 1e2 and 1_0.
_AMOUNT_PATTERN = re.compile(r"\A[+-]?(?:\d+(?:\.\d{1,2})?|\.\d{1,2})\Z")


class ParseError(Exception):
    """A line of an input file could not be understood."""

    def __init__(self, line: int, message: str) -> None:
        super().__init__(f"{line}: {message}")
        self.line = line
        self.message = message


def parse_amount(text: str) -> Decimal:
    """Return `text` as a Decimal, or raise ValueError explaining why not."""
    candidate = text.strip()
    if not _AMOUNT_PATTERN.match(candidate):
        raise ValueError(
            f"invalid amount {candidate!r}: "
            "expected a number with at most two fractional digits"
        )
    return Decimal(candidate)


def parse_date(text: str) -> datetime.date:
    """Return `text` as a date, or raise ValueError explaining why not."""
    candidate = text.strip()
    if _DATE_PATTERN.match(candidate):
        try:
            return datetime.date.fromisoformat(candidate)
        except ValueError:
            pass
    raise ValueError(f"invalid date {candidate!r}: expected YYYY-MM-DD")
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (12 tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: PASS, no errors

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: validate transaction amount and date fields"
```

---

### Task 3: CSV parsing into transactions

**Files:**
- Modify: `ledgerlite/parse.py` (add `HEADER` and `parse_transactions`)
- Modify: `test_parse.py` (add `ParseTransactionsTest`)

**Interfaces:**
- Consumes: `ParseError`, `parse_amount`, `parse_date` (Task 2); `Transaction` (Task 1).
- Produces: `parse_transactions(lines: Iterable[str]) -> list[Transaction]`, in file order, raising `ParseError` on the first bad line. Takes an iterable of lines (an open file or `io.StringIO`), never a path — Task 7 owns file I/O.

- [ ] **Step 1: Write the failing tests**

Append to `test_parse.py` (and add `import io` to the imports at the top, plus `from ledgerlite.model import Transaction` and `parse_transactions` to the existing `ledgerlite.parse` import):

```python
HEADER_LINE = "date,amount,description\n"


def parse_csv(text):
    return parse_transactions(io.StringIO(text))


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_file_order(self):
        transactions = parse_csv(
            HEADER_LINE
            + "2026-03-05,-900.00,Monthly rent\n"
            + "2026-03-04,-7.50,Coffee Shop\n"
        )
        self.assertEqual(
            transactions,
            [
                Transaction(datetime.date(2026, 3, 5), Decimal("-900.00"), "Monthly rent"),
                Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop"),
            ],
        )

    def test_header_only_file_yields_no_transactions(self):
        self.assertEqual(parse_csv(HEADER_LINE), [])

    def test_empty_file_is_malformed_at_line_one(self):
        with self.assertRaises(ParseError) as caught:
            parse_csv("")
        self.assertEqual(caught.exception.line, 1)
        self.assertIn("header", caught.exception.message)

    def test_wrong_header_is_malformed_at_line_one(self):
        with self.assertRaises(ParseError) as caught:
            parse_csv("2026-03-04,-7.50,Coffee Shop\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertIn("header", caught.exception.message)

    def test_header_may_vary_in_case_and_padding(self):
        self.assertEqual(parse_csv(" Date , Amount , Description \n"), [])

    def test_padded_fields_are_accepted_and_description_is_verbatim(self):
        transactions = parse_csv(HEADER_LINE + "2026-03-04, -7.50, Coffee Shop\n")
        self.assertEqual(transactions[0].date, datetime.date(2026, 3, 4))
        self.assertEqual(transactions[0].amount, Decimal("-7.50"))
        self.assertEqual(transactions[0].description, " Coffee Shop")

    def test_quoted_description_may_contain_a_comma(self):
        transactions = parse_csv(HEADER_LINE + '2026-03-04,-7.50,"Coffee, large"\n')
        self.assertEqual(transactions[0].description, "Coffee, large")

    def test_too_few_columns_reports_the_line(self):
        with self.assertRaises(ParseError) as caught:
            parse_csv(HEADER_LINE + "2026-03-04,-7.50\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 2")

    def test_too_many_columns_reports_the_line(self):
        with self.assertRaises(ParseError) as caught:
            parse_csv(HEADER_LINE + "2026-03-04,-7.50,Coffee,extra\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 4")

    def test_blank_line_inside_the_file_is_malformed(self):
        with self.assertRaises(ParseError) as caught:
            parse_csv(HEADER_LINE + "2026-03-04,-7.50,Coffee\n" + "\n")
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 0")

    def test_bad_date_reports_the_line_and_reason(self):
        with self.assertRaises(ParseError) as caught:
            parse_csv(
                HEADER_LINE
                + "2026-03-04,-7.50,Coffee\n"
                + "04/03/2026,-1.00,Tea\n"
            )
        self.assertEqual(caught.exception.line, 3)
        self.assertIn("invalid date", caught.exception.message)

    def test_amount_with_three_fractional_digits_reports_the_line(self):
        with self.assertRaises(ParseError) as caught:
            parse_csv(HEADER_LINE + "2026-03-04,1.005,Coffee\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertIn("invalid amount", caught.exception.message)

    def test_amount_decimal_would_accept_is_rejected(self):
        for text in ("NaN", "Infinity", "1e2"):
            with self.subTest(text=text):
                with self.assertRaises(ParseError):
                    parse_csv(HEADER_LINE + f"2026-03-04,{text},Coffee\n")

    def test_missing_trailing_newline_is_fine(self):
        transactions = parse_csv(HEADER_LINE + "2026-03-04,-7.50,Coffee")
        self.assertEqual(len(transactions), 1)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse.ParseTransactionsTest -v`
Expected: FAIL — `ImportError: cannot import name 'parse_transactions'`

- [ ] **Step 3: Write the minimal implementation**

In `ledgerlite/parse.py`, add `import csv` and `from collections.abc import Iterable` to the imports, add `from .model import Transaction`, then add below the patterns:

```python
HEADER = ["date", "amount", "description"]
```

and append:

```python
def parse_transactions(lines: Iterable[str]) -> list[Transaction]:
    """Return the transactions in `lines`, or raise ParseError on the first bad line.

    `lines` is any iterable of CSV text lines — an open file or an io.StringIO.
    Line numbers in raised errors are 1-based file lines, header included.
    """
    reader = csv.reader(lines)
    try:
        header = next(reader)
    except StopIteration:
        raise ParseError(1, "missing header row date,amount,description") from None
    if [field.strip().lower() for field in header] != HEADER:
        raise ParseError(1, "expected header row date,amount,description") from None

    transactions: list[Transaction] = []
    for row in reader:
        line = reader.line_num
        if len(row) != 3:
            raise ParseError(line, f"expected 3 columns, got {len(row)}")
        date_text, amount_text, description = row
        try:
            date = parse_date(date_text)
            amount = parse_amount(amount_text)
        except ValueError as error:
            raise ParseError(line, str(error)) from None
        transactions.append(Transaction(date=date, amount=amount, description=description))
    return transactions
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (26 tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV, rejecting the whole file on a bad row"
```

---

### Task 4: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ParseError` from `ledgerlite.parse` (one error type keeps `cli.py`'s message formatting uniform for both input files).
- Produces:
  - `Rule = tuple[str, str]` — `(substring, category)`.
  - `parse_rules(lines: Iterable[str]) -> list[Rule]` — file order preserved, raises `ParseError`.
  - `categorize(description: str, rules: Sequence[Rule]) -> str | None` — case-insensitive, first match wins.

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
import io
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


def parse_text(text):
    return parse_rules(io.StringIO(text))


class ParseRulesTest(unittest.TestCase):
    def test_parses_one_rule_per_line_in_order(self):
        self.assertEqual(
            parse_text("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_skips_blank_and_whitespace_only_lines(self):
        self.assertEqual(parse_text("\ncoffee=food\n   \n"), [("coffee", "food")])

    def test_strips_whitespace_around_substring_and_category(self):
        self.assertEqual(parse_text("  coffee shop = food  \n"), [("coffee shop", "food")])

    def test_category_may_contain_an_equals_sign(self):
        self.assertEqual(parse_text("coffee=food=drink\n"), [("coffee", "food=drink")])

    def test_empty_input_is_no_rules(self):
        self.assertEqual(parse_text(""), [])

    def test_line_without_separator_is_malformed(self):
        with self.assertRaises(ParseError) as caught:
            parse_text("coffee=food\njust some text\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertIn("<substring>=<category>", caught.exception.message)

    def test_empty_substring_is_malformed(self):
        with self.assertRaises(ParseError) as caught:
            parse_text("=food\n")
        self.assertEqual(caught.exception.line, 1)

    def test_empty_category_is_malformed(self):
        with self.assertRaises(ParseError) as caught:
            parse_text("coffee=\n")
        self.assertEqual(caught.exception.line, 1)


class CategorizeTest(unittest.TestCase):
    def test_matches_a_substring_of_the_description(self):
        self.assertEqual(categorize("Coffee Shop", [("coffee", "food")]), "food")

    def test_matching_is_case_insensitive_in_both_directions(self):
        self.assertEqual(categorize("coffee shop", [("COFFEE", "food")]), "food")
        self.assertEqual(categorize("COFFEE SHOP", [("coffee", "food")]), "food")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "outings")]
        self.assertEqual(categorize("Coffee Shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", [("coffee", "food")]))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Salary", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/rules.py`:

```python
"""Turn a rules file into ordered (substring, category) pairs and apply them."""

from __future__ import annotations

from collections.abc import Iterable, Sequence

from .parse import ParseError

Rule = tuple[str, str]

_EXPECTED = "expected <substring>=<category>"


def parse_rules(lines: Iterable[str]) -> list[Rule]:
    """Return the rules in `lines`, in file order, or raise ParseError."""
    rules: list[Rule] = []
    for number, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()
        if not line:
            continue
        substring, separator, category = line.partition("=")
        substring, category = substring.strip(), category.strip()
        if not separator or not substring or not category:
            raise ParseError(number, f"{_EXPECTED}, got {line!r}")
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: Sequence[Rule]) -> str | None:
    """Return the category of the first rule matching `description`, else None."""
    lowered = description.lower()
    for substring, category in rules:
        if substring.lower() in lowered:
            return category
    return None
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (13 tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules file and categorize descriptions"
```

---

### Task 5: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1).
- Produces:
  - `order_by_date(transactions: Sequence[Transaction]) -> list[Transaction]` — sorted by date, ties keeping input order, input left untouched.
  - `closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal`.

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
        unordered = [txn(5, "-900.00"), txn(1, "2500.00"), txn(4, "-7.50")]
        self.assertEqual(
            [t.date.day for t in order_by_date(unordered)],
            [1, 4, 5],
        )

    def test_ties_keep_input_order(self):
        first = txn(4, "-7.50", "first")
        second = txn(4, "-1.00", "second")
        ordered = order_by_date([first, second, txn(1, "5.00", "earlier")])
        self.assertEqual([t.description for t in ordered], ["earlier", "first", "second"])

    def test_does_not_mutate_the_input(self):
        unordered = [txn(5, "-900.00"), txn(1, "2500.00")]
        order_by_date(unordered)
        self.assertEqual([t.date.day for t in unordered], [5, 1])

    def test_empty_input(self):
        self.assertEqual(order_by_date([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening_balance(self):
        transactions = [txn(4, "-7.50"), txn(5, "-900.00"), txn(1, "2500.00")]
        self.assertEqual(
            closing_balance(Decimal("100"), order_by_date(transactions)),
            Decimal("1692.50"),
        )

    def test_no_transactions_returns_the_opening_balance(self):
        self.assertEqual(closing_balance(Decimal("100.00"), []), Decimal("100.00"))

    def test_arithmetic_is_exact(self):
        transactions = [txn(1, "0.10"), txn(2, "0.20")]
        self.assertEqual(closing_balance(Decimal("0"), transactions), Decimal("0.30"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/balance.py`:

```python
"""Order transactions by date and walk the running balance."""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from decimal import Decimal

from .model import Transaction


def order_by_date(transactions: Sequence[Transaction]) -> list[Transaction]:
    """Return the transactions by date; ties keep input order (sorted is stable)."""
    return sorted(transactions, key=lambda transaction: transaction.date)


def closing_balance(opening: Decimal, transactions: Iterable[Transaction]) -> Decimal:
    """Return the running balance after the last transaction, or `opening` if none."""
    balance = opening
    for transaction in transactions:
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (7 tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```

---

### Task 6: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `Rule`/`categorize` (Task 4), `order_by_date`/`closing_balance` (Task 5).
- Produces:
  - `UNCATEGORIZED = "uncategorized"`.
  - `format_amount(amount: Decimal) -> str`.
  - `category_totals(transactions: Iterable[Transaction], rules: Sequence[Rule]) -> dict[str, Decimal]`.
  - `ordered_categories(totals: Mapping[str, Decimal]) -> list[str]`.
  - `format_report(transactions: Sequence[Transaction], rules: Sequence[Rule], opening: Decimal) -> str` — the complete report, newline-terminated. Task 7 prints it verbatim.

- [ ] **Step 1: Write the failing tests**

Create `test_report.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import (
    UNCATEGORIZED,
    category_totals,
    format_amount,
    format_report,
    ordered_categories,
)

RULES = [("coffee", "food"), ("rent", "housing")]


def txn(day, amount, description):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class FormatAmountTest(unittest.TestCase):
    def test_two_fractional_digits_always(self):
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("-1234567.89")), "-1234567.89")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
        self.assertEqual(format_amount(Decimal("-7.50") + Decimal("7.50")), "0.00")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_amounts_per_category(self):
        transactions = [
            txn(4, "-7.50", "Coffee Shop"),
            txn(6, "-2.50", "coffee beans"),
            txn(5, "-900.00", "Monthly rent"),
        ]
        self.assertEqual(
            category_totals(transactions, RULES),
            {"food": Decimal("-10.00"), "housing": Decimal("-900.00")},
        )

    def test_unmatched_transactions_land_in_uncategorized(self):
        transactions = [txn(1, "2500.00", "Salary"), txn(2, "-20.00", "Bookshop")]
        self.assertEqual(
            category_totals(transactions, RULES),
            {UNCATEGORIZED: Decimal("2480.00")},
        )

    def test_no_transactions_is_no_categories(self):
        self.assertEqual(category_totals([], RULES), {})


class OrderedCategoriesTest(unittest.TestCase):
    def test_alphabetical_with_uncategorized_last(self):
        totals = {
            UNCATEGORIZED: Decimal("1"),
            "housing": Decimal("1"),
            "food": Decimal("1"),
        }
        self.assertEqual(ordered_categories(totals), ["food", "housing", UNCATEGORIZED])

    def test_omits_uncategorized_when_absent(self):
        totals = {"housing": Decimal("1"), "food": Decimal("1")}
        self.assertEqual(ordered_categories(totals), ["food", "housing"])

    def test_empty_totals(self):
        self.assertEqual(ordered_categories({}), [])


class FormatReportTest(unittest.TestCase):
    def test_matches_the_design_example(self):
        transactions = [
            txn(5, "-900.00", "Monthly rent"),
            txn(1, "2500.00", "Salary"),
            txn(4, "-7.50", "Coffee Shop"),
        ]
        self.assertEqual(
            format_report(transactions, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_reports_the_opening_balance(self):
        self.assertEqual(
            format_report([], RULES, Decimal("0")),
            "\nclosing balance: 0.00\n",
        )

    def test_category_summing_to_zero_prints_zero(self):
        transactions = [txn(1, "-7.50", "Coffee Shop"), txn(2, "7.50", "Coffee refund")]
        self.assertEqual(
            format_report(transactions, RULES, Decimal("0")),
            "food: 0.00\n\nclosing balance: 0.00\n",
        )

    def test_without_rules_everything_is_uncategorized(self):
        transactions = [txn(1, "-7.50", "Coffee Shop")]
        self.assertEqual(
            format_report(transactions, [], Decimal("10.00")),
            "uncategorized: -7.50\n\nclosing balance: 2.50\n",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and the text of the report."""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from decimal import Decimal

from .balance import closing_balance, order_by_date
from .model import Transaction
from .rules import Rule, categorize

UNCATEGORIZED = "uncategorized"
_CENTS = Decimal("0.01")


def format_amount(amount: Decimal) -> str:
    """Return `amount` with exactly two fractional digits and no separators."""
    quantized = amount.quantize(_CENTS)
    if quantized == 0:
        quantized = abs(quantized)  # never print "-0.00"
    return f"{quantized:f}"


def category_totals(
    transactions: Iterable[Transaction], rules: Sequence[Rule]
) -> dict[str, Decimal]:
    """Return the sum of amounts per category; unmatched rows go to UNCATEGORIZED."""
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        category = categorize(transaction.description, rules)
        if category is None:
            category = UNCATEGORIZED
        totals[category] = totals.get(category, Decimal("0")) + transaction.amount
    return totals


def ordered_categories(totals: Mapping[str, Decimal]) -> list[str]:
    """Return category names alphabetically, with UNCATEGORIZED always last."""
    names = sorted(name for name in totals if name != UNCATEGORIZED)
    if UNCATEGORIZED in totals:
        names.append(UNCATEGORIZED)
    return names


def format_report(
    transactions: Sequence[Transaction], rules: Sequence[Rule], opening: Decimal
) -> str:
    """Return the whole report, newline-terminated."""
    ordered = order_by_date(transactions)
    totals = category_totals(ordered, rules)
    lines = [
        f"{name}: {format_amount(totals[name])}" for name in ordered_categories(totals)
    ]
    lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(opening, ordered))}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (13 tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: format per-category totals and closing balance"
```

---

### Task 7: Command-line interface

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `ParseError`, `parse_amount`, `parse_transactions` (Tasks 2–3); `parse_rules` (Task 4); `format_report` (Task 6).
- Produces: `main(argv: Sequence[str] | None = None) -> int` — the only public entry point. `python3 -m ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py`:

```python
import contextlib
import io
import os
import subprocess
import sys
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-05,-900.00,Monthly rent\n"
    "2026-03-01,2500.00,Salary\n"
    "2026-03-04,-7.50,Coffee Shop\n"
)
RULES = "coffee=food\nrent=housing\n"
EXPECTED_REPORT = (
    "food: -7.50\n"
    "housing: -900.00\n"
    "uncategorized: 2500.00\n"
    "\n"
    "closing balance: 1692.50\n"
)


class CliTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)

    def write(self, name, text, encoding="utf-8"):
        path = os.path.join(self.directory.name, name)
        with open(path, "w", encoding=encoding, newline="") as handle:
            handle.write(text)
        return path

    def write_bytes(self, name, data):
        path = os.path.join(self.directory.name, name)
        with open(path, "wb") as handle:
            handle.write(data)
        return path

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_reports_with_rules_and_opening(self):
        transactions = self.write("txns.csv", TRANSACTIONS)
        rules = self.write("rules.txt", RULES)
        code, out, err = self.run_cli(
            "report", transactions, "--rules", rules, "--opening", "100"
        )
        self.assertEqual((code, out, err), (0, EXPECTED_REPORT, ""))

    def test_opening_defaults_to_zero_and_rules_are_optional(self):
        transactions = self.write("txns.csv", TRANSACTIONS)
        code, out, err = self.run_cli("report", transactions)
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")
        self.assertEqual(err, "")

    def test_header_only_file_reports_the_opening_balance(self):
        transactions = self.write("empty.csv", "date,amount,description\n")
        code, out, err = self.run_cli("report", transactions, "--opening", "-12.50")
        self.assertEqual(code, 0)
        self.assertEqual(out, "\nclosing balance: -12.50\n")
        self.assertEqual(err, "")

    def test_utf8_bom_before_the_header_is_tolerated(self):
        transactions = self.write("bom.csv", TRANSACTIONS, encoding="utf-8-sig")
        code, out, _ = self.run_cli("report", transactions)
        self.assertEqual(code, 0)
        self.assertIn("closing balance: 1592.50", out)

    def test_missing_transactions_file_exits_one(self):
        missing = os.path.join(self.directory.name, "nope.csv")
        code, out, err = self.run_cli("report", missing)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "))
        self.assertTrue(err.endswith("\n"))

    def test_directory_as_transactions_file_exits_one(self):
        code, out, err = self.run_cli("report", self.directory.name)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn("cannot read", err)

    def test_undecodable_bytes_exit_one_without_a_traceback(self):
        transactions = self.write_bytes("bad.csv", b"date,amount,description\n\xff\xfe\n")
        code, out, err = self.run_cli("report", transactions)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertIn(f"cannot read {transactions}", err)

    def test_malformed_row_exits_two_naming_the_line(self):
        transactions = self.write(
            "bad.csv", "date,amount,description\n2026-03-04,-7.50\n"
        )
        code, out, err = self.run_cli("report", transactions)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: {transactions}:2: expected 3 columns, got 2\n"
        )

    def test_amount_with_three_decimals_exits_two(self):
        transactions = self.write(
            "bad.csv", "date,amount,description\n2026-03-04,1.005,Coffee\n"
        )
        code, out, err = self.run_cli("report", transactions)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn(f"{transactions}:2: invalid amount", err)

    def test_empty_transactions_file_exits_two(self):
        transactions = self.write("empty.csv", "")
        code, out, err = self.run_cli("report", transactions)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn(f"{transactions}:1:", err)

    def test_missing_rules_file_exits_one(self):
        transactions = self.write("txns.csv", TRANSACTIONS)
        missing = os.path.join(self.directory.name, "nope.txt")
        code, out, err = self.run_cli("report", transactions, "--rules", missing)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "))

    def test_malformed_rules_file_exits_two(self):
        transactions = self.write("txns.csv", TRANSACTIONS)
        rules = self.write("rules.txt", "coffee=food\nnonsense\n")
        code, out, err = self.run_cli("report", transactions, "--rules", rules)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn(f"{rules}:2:", err)

    def test_transactions_problem_is_reported_before_rules_problem(self):
        transactions = self.write("bad.csv", "date,amount,description\nnope\n")
        missing = os.path.join(self.directory.name, "nope.txt")
        code, _, err = self.run_cli("report", transactions, "--rules", missing)
        self.assertEqual(code, 2)
        self.assertIn(transactions, err)
        self.assertNotIn(missing, err)

    def test_invalid_opening_is_a_usage_error(self):
        transactions = self.write("txns.csv", TRANSACTIONS)
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                main(["report", transactions, "--opening", "1.005"])
        self.assertEqual(caught.exception.code, 2)

    def test_missing_subcommand_is_a_usage_error(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                main([])
        self.assertEqual(caught.exception.code, 2)


class ModuleEntryPointTest(unittest.TestCase):
    def test_python_m_ledgerlite_runs_the_cli(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "txns.csv")
            with open(path, "w", encoding="utf-8", newline="") as handle:
                handle.write(TRANSACTIONS)
            rules_path = os.path.join(directory, "rules.txt")
            with open(rules_path, "w", encoding="utf-8", newline="") as handle:
                handle.write(RULES)
            result = subprocess.run(
                [
                    sys.executable, "-m", "ledgerlite", "report", path,
                    "--rules", rules_path, "--opening", "100",
                ],
                capture_output=True,
                text=True,
                cwd=os.path.dirname(os.path.abspath(__file__)),
            )
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, EXPECTED_REPORT)
        self.assertEqual(result.stderr, "")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point: python3 -m ledgerlite report TRANSACTIONS ..."""

from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence
from decimal import Decimal

from .parse import ParseError, parse_amount, parse_transactions
from .report import format_report
from .rules import Rule, parse_rules

PROGRAM = "ledgerlite"


def _opening_amount(text: str) -> Decimal:
    try:
        return parse_amount(text)
    except ValueError as error:
        raise argparse.ArgumentTypeError(str(error)) from None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=PROGRAM, description="Summarize bank transactions by category."
    )
    subcommands = parser.add_subparsers(dest="command", required=True)
    report = subcommands.add_parser("report", help="print a per-category summary")
    report.add_argument("transactions", help="path to the transactions CSV")
    report.add_argument("--rules", help="path to the rules file")
    report.add_argument(
        "--opening",
        type=_opening_amount,
        default=Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def _read_lines(path: str) -> list[str]:
    """Return the lines of `path`. utf-8-sig strips a BOM before the CSV header."""
    with open(path, encoding="utf-8-sig", newline="") as handle:
        return handle.readlines()


def _reason(error: Exception) -> str:
    if isinstance(error, OSError) and error.strerror:
        return error.strerror
    return str(error)


def _cannot_read(path: str, error: Exception) -> int:
    print(f"{PROGRAM}: cannot read {path}: {_reason(error)}", file=sys.stderr)
    return 1


def _malformed(path: str, error: ParseError) -> int:
    print(f"{PROGRAM}: {path}:{error.line}: {error.message}", file=sys.stderr)
    return 2


def main(argv: Sequence[str] | None = None) -> int:
    """Run the CLI and return the process exit code."""
    args = _build_parser().parse_args(argv)

    try:
        transaction_lines = _read_lines(args.transactions)
    except (OSError, UnicodeDecodeError) as error:
        return _cannot_read(args.transactions, error)
    try:
        transactions = parse_transactions(transaction_lines)
    except ParseError as error:
        return _malformed(args.transactions, error)

    rules: list[Rule] = []
    if args.rules is not None:
        try:
            rules_lines = _read_lines(args.rules)
        except (OSError, UnicodeDecodeError) as error:
            return _cannot_read(args.rules, error)
        try:
            rules = parse_rules(rules_lines)
        except ParseError as error:
            return _malformed(args.rules, error)

    print(format_report(transactions, rules, args.opening), end="")
    return 0
```

Create `ledgerlite/__main__.py`:

```python
"""Allow `python3 -m ledgerlite`."""

import sys

from .cli import main

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (16 tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: PASS, all tests from Tasks 1–7, no errors

- [ ] **Step 6: Check the spec's example by hand**

```bash
printf 'date,amount,description\n2026-03-05,-900.00,Monthly rent\n2026-03-01,2500.00,Salary\n2026-03-04,-7.50,Coffee Shop\n' > /tmp/txns.csv
printf 'coffee=food\nrent=housing\n' > /tmp/rules.txt
python3 -m ledgerlite report /tmp/txns.csv --rules /tmp/rules.txt --opening 100; echo "exit=$?"
```

Expected, exactly:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit=0
```

- [ ] **Step 7: Confirm no floats crept in**

Run: `grep -rn "float" ledgerlite/`
Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report command line interface"
```

---

## Spec coverage check

| Spec requirement | Task |
|---|---|
| `date,amount,description` header, ISO dates, `Decimal` amounts, free-text description | 1, 2, 3 |
| Rows in any order; two rows may share a date | 5 (`order_by_date` stability) |
| Rules file `<substring>=<category>`, case-insensitive, first match wins, no match → no category | 4 |
| `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]` | 7 |
| Report to stdout, exit 0 | 7 |
| Unreadable TRANSACTIONS → `cannot read` message, exit 1 | 7 |
| Malformed row (columns, date, amount, >2 decimals) → `<path>:<line>:` message, exit 2, whole file rejected, no stdout | 3, 7 |
| `--opening` defaults to 0; `--rules` optional → all uncategorized | 6, 7 |
| Date ordering, running balance, closing balance (opening when empty) | 5 |
| One line per category alphabetically, `uncategorized` last, blank line, `closing balance:` | 6 |
| Two-fractional-digit formatting, leading `-`, no separators | 6 |
| Spec's worked example reproduced exactly | 6 (unit), 7 (end to end) |
| Package layout, stdlib only, Python 3.11+, root `test_<module>.py` via `python3 -m unittest` | all |
