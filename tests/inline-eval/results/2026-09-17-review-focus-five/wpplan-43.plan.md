# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library Python package and CLI that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Five small pure modules (`model`, `parse`, `rules`, `balance`, `report`) with no I/O, plus a thin `cli` module that does all file reading, error formatting, and exit codes. Money is `decimal.Decimal` end to end — never `float`. Parsing rejects the whole file on the first malformed row, so nothing reaches stdout unless every row is valid.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `datetime`, `decimal`, `argparse`, `re`, `dataclasses`), tests with `unittest`.

**Spec:** `design.md` (repo root) — read it before starting and keep it open; this plan implements it section by section.

## Global Constraints

Every task's requirements implicitly include these. Values are copied verbatim from `design.md`.

- Python 3.11+. Do not use syntax newer than 3.11 (no PEP 695 `type` statements or generic syntax).
- Standard library only. No third-party dependencies, no `pyproject.toml`, no `requirements.txt`.
- Money is parsed and carried as `decimal.Decimal`, **never** float. The string `float` must not appear anywhere in `ledgerlite/`.
- Package layout is exactly `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`, plus `ledgerlite/__main__.py` (a 3-line addition to the layout in the design, so the tool can actually be invoked as `python3 -m ledgerlite`).
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest` from the repo root.
- Exit codes: `0` success, `1` transactions (or rules) file cannot be read, `2` malformed input.
- Error text, verbatim shapes: `ledgerlite: cannot read <path>: <reason>` and `ledgerlite: <path>:<line>: <what is wrong>`, both to stderr.
- Amounts print with exactly two fractional digits, a leading `-` only for negatives, and no thousands separators (`-12.50`, `0.00`, `1200.00`).
- Work directly on `main` in this repo (local scratch repo, no remote). Commit at the end of every task; larger tasks commit twice where marked.

## Review Focus

The spec is a vision document: its silence about an input is not permission for that input to break the program. These five implied-but-unstated cases are the ones most likely to bite a real user; each has a pinned test in the task that owns the code.

1. **A UTF-8 BOM or CRLF line endings in the CSV** — the shape most bank exports actually have. A BOM must not make the header row unrecognizable, and `\r` must not end up glued to the last field. (Tests: Task 1 for CRLF, Task 5 for the BOM.)
2. **Amount spellings `decimal.Decimal` happily accepts but the spec does not** — `1e3`, `NaN`, `Infinity`, `.5`, `1.`, `1.005` must all be rejected as malformed rows, while `1.5`, `1.50` and `+5.00` are accepted. A silently-accepted `NaN` poisons every total. (Test: Task 1.)
3. **Zero and negative-zero totals** — a category whose amounts cancel out, or an input amount of `-0.00`, must print `0.00`, never `-0.00`. (Test: Task 4.)
4. **A transactions file with no data rows** — a header-only file is valid and must print no category lines with `closing balance` equal to the opening amount; a totally empty file (not even a header) is malformed and exits 2. (Tests: Tasks 1, 4, 5.)
5. **A rules line that isn't `<substring>=<category>`** — a typo'd line, an empty substring (which would otherwise match everything), or an empty category must fail loudly with a file/line message, not be silently dropped so the user sees a mysteriously uncategorized report. (Tests: Tasks 2, 5.)

## Resolved Ambiguities

The spec leaves these open. Decide once, here, so every task agrees:

- **Header row is validated, not skipped.** Line 1's three fields, stripped and lowercased, must equal `date`, `amount`, `description`; otherwise it is a malformed row at line 1. (Blindly skipping line 1 would silently swallow a transaction in a header-less file.)
- **An empty file** is malformed at line 1 (`file is empty; expected a header row date,amount,description`).
- **A blank line inside the CSV** is a wrong-column-count row (0 fields), so it is malformed.
- **Leading/trailing whitespace** is stripped from the `date` and `amount` fields and from both halves of a rule; `description` is kept verbatim (it is free text).
- **A leading `+`** on an amount is accepted (`+5.00` → `Decimal("5.00")`) — it is still "a decimal number".
- **A rules line splits at its first `=`**, so `coffee=food=drink` is the substring `coffee` with the category `food=drink`.
- **Rules-file problems reuse the malformed-input path**: unreadable rules file → exit 1 with the `cannot read` message; malformed rules line → exit 2 with `ledgerlite: <rules path>:<line>: <what is wrong>`.
- **If both files are bad**, the transactions error is reported (it is the primary input) and the rules file is not read.
- **Alphabetical is case-insensitive**: categories sort by `(name.casefold(), name)`, so `apple` precedes `Bank`.
- **A rule whose category is literally `uncategorized`** merges into the uncategorized bucket — one line, listed last.
- **`--opening` uses the same amount grammar** as a CSV amount; a bad value prints to stderr and exits 2.
- **`balance.py` exposes the closing balance only.** The running balance is the accumulation inside `closing_balance`; no consumer needs the per-row values, so none are exposed (YAGNI).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `ledgerlite/__init__.py` | Package docstring. No re-exports. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No logic. |
| `ledgerlite/parse.py` | `ParseError`, `parse_date`, `parse_amount`, `parse_transactions`. Pure: takes an iterable of lines, never opens a file. |
| `ledgerlite/rules.py` | `parse_rules`, `categorize`. Pure. |
| `ledgerlite/balance.py` | `order_transactions`, `closing_balance`. Pure. |
| `ledgerlite/report.py` | `format_amount`, `category_totals`, `format_report`. Pure; returns a string, prints nothing. |
| `ledgerlite/cli.py` | `build_parser`, `main(argv) -> int`. The only module that opens files, writes to stdout/stderr, or knows about exit codes. |
| `ledgerlite/__main__.py` | `python3 -m ledgerlite` wiring. |
| `test_parse.py`, `test_model.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py` | Repo-root tests, one per module. |

---

### Task 1: Transaction model and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py`, `ledgerlite/model.py`, `ledgerlite/parse.py`
- Test: `test_model.py`, `test_parse.py`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `ledgerlite.model.Transaction(date: datetime.date, amount: decimal.Decimal, description: str)` — frozen dataclass, keyword construction used everywhere.
  - `ledgerlite.parse.ParseError(line: int, problem: str)` — exception with `.line` and `.problem` attributes; the CLI formats it, `rules.py` raises it too.
  - `ledgerlite.parse.parse_date(raw: str) -> datetime.date` — raises `ValueError` with a human-readable problem.
  - `ledgerlite.parse.parse_amount(raw: str) -> decimal.Decimal` — raises `ValueError` with a human-readable problem. Used by `cli.py` for `--opening`.
  - `ledgerlite.parse.parse_transactions(lines: Iterable[str]) -> list[Transaction]` — input order preserved; raises `ParseError`.

- [ ] **Step 1: Create the package skeleton**

Create `ledgerlite/__init__.py` with exactly:

```python
"""ledgerlite — categorize bank transactions and summarize them."""
```

- [ ] **Step 2: Write the failing model test**

Create `test_model.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTest(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        transaction = Transaction(
            date=datetime.date(2026, 3, 4),
            amount=Decimal("-7.50"),
            description="Coffee Bar",
        )

        self.assertEqual(transaction.date, datetime.date(2026, 3, 4))
        self.assertEqual(str(transaction.amount), "-7.50")
        self.assertEqual(transaction.description, "Coffee Bar")

    def test_is_immutable(self):
        transaction = Transaction(
            date=datetime.date(2026, 3, 4),
            amount=Decimal("-7.50"),
            description="Coffee Bar",
        )

        with self.assertRaises(Exception):
            transaction.amount = Decimal("0.00")
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.model'`

- [ ] **Step 4: Write model.py**

Create `ledgerlite/model.py`:

```python
"""The single record type shared by every other module."""

import dataclasses
import datetime
import decimal


@dataclasses.dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV, already validated."""

    date: datetime.date
    amount: decimal.Decimal
    description: str
```

Note the `import datetime` / `datetime.date` style: a bare `from datetime import date` would collide with the field named `date`.

- [ ] **Step 5: Run it to make sure it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS (2 tests)

- [ ] **Step 6: Write the failing happy-path parse tests**

Create `test_parse.py`:

```python
import datetime
import io
import unittest
from decimal import Decimal

from ledgerlite.parse import parse_transactions

GOOD_CSV = """\
date,amount,description
2026-03-05,-900.00,Rent March
2026-03-04,-7.50,Coffee Bar
2026-03-04,2500.00,ACME PAYROLL
"""


def read(text):
    """Parse CSV text the way the CLI does: no newline translation."""
    return parse_transactions(io.StringIO(text, newline=""))


class ParseTransactionsTest(unittest.TestCase):
    def test_reads_every_row_in_input_order(self):
        transactions = read(GOOD_CSV)

        self.assertEqual(
            [(t.date, str(t.amount), t.description) for t in transactions],
            [
                (datetime.date(2026, 3, 5), "-900.00", "Rent March"),
                (datetime.date(2026, 3, 4), "-7.50", "Coffee Bar"),
                (datetime.date(2026, 3, 4), "2500.00", "ACME PAYROLL"),
            ],
        )

    def test_amounts_are_decimals_not_floats(self):
        transactions = read("date,amount,description\n2026-03-04,0.10,Dime\n")

        self.assertIsInstance(transactions[0].amount, Decimal)
        self.assertEqual(transactions[0].amount * 3, Decimal("0.30"))

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(read("date,amount,description\n"), [])

    def test_header_is_case_and_whitespace_insensitive(self):
        transactions = read("Date, Amount , DESCRIPTION\n2026-03-04,-7.50,Coffee\n")

        self.assertEqual(len(transactions), 1)

    def test_description_keeps_commas_and_case(self):
        transactions = read('date,amount,description\n2026-03-04,-7.50,"Coffee, Bar"\n')

        self.assertEqual(transactions[0].description, "Coffee, Bar")

    def test_crlf_line_endings_do_not_leak_into_fields(self):
        transactions = read(
            "date,amount,description\r\n2026-03-04,-7.50,Coffee Bar\r\n"
        )

        self.assertEqual(transactions[0].description, "Coffee Bar")
        self.assertEqual(str(transactions[0].amount), "-7.50")

    def test_whitespace_around_date_and_amount_is_ignored(self):
        transactions = read("date,amount,description\n 2026-03-04 , -7.50 ,Coffee\n")

        self.assertEqual(transactions[0].date, datetime.date(2026, 3, 4))
        self.assertEqual(str(transactions[0].amount), "-7.50")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 7: Run it to make sure it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`

- [ ] **Step 8: Write the minimal parse.py**

Only enough for the happy path; validation arrives in Step 12.

Create `ledgerlite/parse.py`:

```python
"""Turn transactions CSV text into validated Transaction objects."""

import csv
import datetime
import decimal

from ledgerlite.model import Transaction

HEADER = ["date", "amount", "description"]


def parse_transactions(lines):
    """Parse an iterable of CSV lines into Transactions, in input order."""
    reader = csv.reader(lines)
    next(reader, None)  # header row
    transactions = []
    for row in reader:
        raw_date, raw_amount, description = row
        transactions.append(
            Transaction(
                date=datetime.date.fromisoformat(raw_date.strip()),
                amount=decimal.Decimal(raw_amount.strip()),
                description=description,
            )
        )
    return transactions
```

- [ ] **Step 9: Run it to make sure it passes**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (7 tests). If `test_header_is_case_and_whitespace_insensitive` fails, the header is not being skipped — fix that before continuing.

- [ ] **Step 10: Commit the happy path**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_model.py test_parse.py
git commit -m "feat: parse well-formed transactions CSV into Transaction records"
```

- [ ] **Step 11: Write the failing malformed-input tests**

Append to `test_parse.py`, and extend the import at the top to:

```python
from ledgerlite.parse import ParseError, parse_amount, parse_date, parse_transactions
```

```python
class MalformedRowTest(unittest.TestCase):
    def reject(self, text):
        with self.assertRaises(ParseError) as caught:
            read(text)
        return caught.exception

    def test_empty_file_is_rejected_at_line_1(self):
        error = self.reject("")

        self.assertEqual(error.line, 1)
        self.assertIn("empty", error.problem)

    def test_wrong_header_is_rejected_at_line_1(self):
        error = self.reject("date,description,amount\n2026-03-04,Coffee,-7.50\n")

        self.assertEqual(error.line, 1)
        self.assertIn("header", error.problem)

    def test_too_few_fields(self):
        error = self.reject("date,amount,description\n2026-03-04,-7.50\n")

        self.assertEqual(error.line, 2)
        self.assertIn("3 fields", error.problem)

    def test_too_many_fields(self):
        error = self.reject("date,amount,description\n2026-03-04,-7.50,Coffee,x\n")

        self.assertEqual(error.line, 2)
        self.assertIn("3 fields", error.problem)

    def test_blank_line_inside_the_file(self):
        error = self.reject("date,amount,description\n\n2026-03-04,-7.50,Coffee\n")

        self.assertEqual(error.line, 2)
        self.assertIn("3 fields", error.problem)

    def test_non_iso_date(self):
        error = self.reject("date,amount,description\n04/03/2026,-7.50,Coffee\n")

        self.assertEqual(error.line, 2)
        self.assertIn("date", error.problem)

    def test_impossible_date(self):
        error = self.reject("date,amount,description\n2026-13-40,-7.50,Coffee\n")

        self.assertEqual(error.line, 2)
        self.assertIn("date", error.problem)

    def test_amount_with_three_fractional_digits(self):
        error = self.reject("date,amount,description\n2026-03-04,1.005,Coffee\n")

        self.assertEqual(error.line, 2)
        self.assertIn("amount", error.problem)

    def test_amounts_decimal_accepts_but_the_spec_does_not(self):
        for raw in ["1e3", "NaN", "Infinity", "-Infinity", ".5", "1.", "1,200.00", "", "abc"]:
            with self.subTest(amount=raw):
                error = self.reject(
                    f'date,amount,description\n2026-03-04,"{raw}",Coffee\n'
                )
                self.assertEqual(error.line, 2)
                self.assertIn("amount", error.problem)

    def test_line_number_survives_a_quoted_newline(self):
        error = self.reject(
            'date,amount,description\n'
            '2026-03-04,-7.50,"Coffee\nBar"\n'
            '2026-03-05,oops,Rent\n'
        )

        self.assertEqual(error.line, 4)

    def test_reports_the_first_bad_row_only(self):
        error = self.reject(
            "date,amount,description\n"
            "2026-03-04,-7.50,Coffee\n"
            "2026-03-05,oops,Rent\n"
            "2026-03-06,nope,Rent\n"
        )

        self.assertEqual(error.line, 3)


class AmountGrammarTest(unittest.TestCase):
    def test_accepts_zero_one_and_two_fractional_digits(self):
        self.assertEqual(str(parse_amount("1")), "1")
        self.assertEqual(str(parse_amount("1.5")), "1.5")
        self.assertEqual(str(parse_amount("1.50")), "1.50")

    def test_accepts_a_leading_plus(self):
        self.assertEqual(parse_amount("+5.00"), Decimal("5.00"))

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError):
            parse_amount("1.005")


class DateGrammarTest(unittest.TestCase):
    def test_parses_an_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), datetime.date(2026, 3, 4))

    def test_rejects_a_non_iso_date(self):
        with self.assertRaises(ValueError):
            parse_date("2026/03/04")
```

Note the quoted `"{raw}"` in `test_amounts_decimal_accepts_but_the_spec_does_not`: it keeps `1,200.00` and the empty string as a single CSV field so the failure is about the amount, not the column count.

- [ ] **Step 12: Run them to make sure they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'ParseError' from 'ledgerlite.parse'`

- [ ] **Step 13: Write the validating parse.py**

Replace `ledgerlite/parse.py` entirely:

```python
"""Turn transactions CSV text into validated Transaction objects."""

import csv
import datetime
import decimal
import re

from ledgerlite.model import Transaction

HEADER = ["date", "amount", "description"]

_DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}\Z")
_AMOUNT_RE = re.compile(r"[-+]?\d+(\.\d{1,2})?\Z")


class ParseError(Exception):
    """An input file is malformed at a specific line.

    `line` is the 1-based physical line number; `problem` says what is wrong.
    """

    def __init__(self, line, problem):
        super().__init__(f"{line}: {problem}")
        self.line = line
        self.problem = problem


def parse_date(raw):
    """Parse an ISO 8601 date. Raises ValueError explaining any rejection."""
    if not _DATE_RE.match(raw):
        raise ValueError(f"{raw!r} is not an ISO 8601 date (YYYY-MM-DD)")
    try:
        return datetime.date.fromisoformat(raw)
    except ValueError:
        raise ValueError(f"{raw!r} is not a real date") from None


def parse_amount(raw):
    """Parse a decimal amount with at most two fractional digits.

    Raises ValueError explaining any rejection. Deliberately stricter than
    decimal.Decimal, which would accept 1e3, NaN and Infinity.
    """
    if not _AMOUNT_RE.match(raw):
        raise ValueError(
            f"{raw!r} is not a decimal number with at most two fractional digits"
        )
    return decimal.Decimal(raw)


def parse_transactions(lines):
    """Parse an iterable of CSV lines into Transactions, in input order.

    Raises ParseError on the first malformed line; the caller is expected to
    reject the whole file.
    """
    reader = csv.reader(lines)
    header = next(reader, None)
    if header is None:
        raise ParseError(
            1, "file is empty; expected a header row date,amount,description"
        )
    if [field.strip().lower() for field in header] != HEADER:
        raise ParseError(1, "expected header row date,amount,description")

    transactions = []
    for row in reader:
        line = reader.line_num
        if len(row) != 3:
            raise ParseError(line, f"expected 3 fields, got {len(row)}")
        raw_date, raw_amount, description = row
        try:
            date = parse_date(raw_date.strip())
        except ValueError as error:
            raise ParseError(line, f"bad date: {error}") from None
        try:
            amount = parse_amount(raw_amount.strip())
        except ValueError as error:
            raise ParseError(line, f"bad amount: {error}") from None
        transactions.append(
            Transaction(date=date, amount=amount, description=description)
        )
    return transactions
```

- [ ] **Step 14: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — all `test_model` and `test_parse` tests green.

- [ ] **Step 15: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: reject malformed transaction rows with file line numbers"
```

---

### Task 2: Rules file and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ledgerlite.parse.ParseError(line, problem)` from Task 1 — reused verbatim so the CLI formats rules errors and CSV errors with one code path.
- Produces:
  - `ledgerlite.rules.parse_rules(lines: Iterable[str]) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order; raises `ParseError`.
  - `ledgerlite.rules.categorize(rules: list[tuple[str, str]], description: str) -> str | None` — first matching rule's category, case-insensitive; `None` if nothing matches.

- [ ] **Step 1: Write the failing test**

Create `test_rules.py`:

```python
import io
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


def read(text):
    return parse_rules(io.StringIO(text))


class ParseRulesTest(unittest.TestCase):
    def test_reads_pairs_in_file_order(self):
        self.assertEqual(
            read("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_ignores_blank_lines_and_surrounding_whitespace(self):
        self.assertEqual(
            read("\n  coffee = food  \n\n"),
            [("coffee", "food")],
        )

    def test_splits_at_the_first_equals_sign(self):
        self.assertEqual(read("coffee=food=drink\n"), [("coffee", "food=drink")])

    def test_keeps_the_category_spelled_as_written(self):
        self.assertEqual(read("coffee=Food\n"), [("coffee", "Food")])

    def test_rejects_a_line_without_an_equals_sign(self):
        with self.assertRaises(ParseError) as caught:
            read("coffee=food\njust-a-typo\n")

        self.assertEqual(caught.exception.line, 2)
        self.assertIn("=", caught.exception.problem)

    def test_rejects_an_empty_substring(self):
        with self.assertRaises(ParseError) as caught:
            read("=food\n")

        self.assertEqual(caught.exception.line, 1)
        self.assertIn("substring", caught.exception.problem)

    def test_rejects_an_empty_category(self):
        with self.assertRaises(ParseError) as caught:
            read("coffee=\n")

        self.assertEqual(caught.exception.line, 1)
        self.assertIn("category", caught.exception.problem)


class CategorizeTest(unittest.TestCase):
    def setUp(self):
        self.rules = [("coffee", "food"), ("rent", "housing")]

    def test_matches_a_substring_case_insensitively(self):
        self.assertEqual(categorize(self.rules, "COFFEE BAR 12"), "food")
        self.assertEqual(categorize(self.rules, "morning coffee"), "food")

    def test_first_matching_rule_wins(self):
        self.assertEqual(categorize(self.rules, "rent and coffee"), "housing")
        self.assertEqual(categorize([("rent", "housing")] + self.rules, "coffee"), "food")

    def test_rule_substring_case_does_not_matter(self):
        self.assertEqual(categorize([("COFFEE", "food")], "coffee bar"), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize(self.rules, "Bookshop"))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize([], "Coffee Bar"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write the implementation**

Create `ledgerlite/rules.py`:

```python
"""Turn rules text into (substring, category) pairs and apply them."""

from ledgerlite.parse import ParseError


def parse_rules(lines):
    """Parse `<substring>=<category>` lines. Raises ParseError on a bad line.

    Blank lines are ignored. A line is split at its first '='.
    """
    rules = []
    for number, raw in enumerate(lines, start=1):
        line = raw.strip()
        if not line:
            continue
        substring, separator, category = line.partition("=")
        if not separator:
            raise ParseError(
                number,
                f"rule {line!r} has no '='; expected <substring>=<category>",
            )
        substring = substring.strip()
        category = category.strip()
        if not substring:
            raise ParseError(number, "rule has an empty substring before '='")
        if not category:
            raise ParseError(number, "rule has an empty category after '='")
        rules.append((substring, category))
    return rules


def categorize(rules, description):
    """Return the first matching rule's category, or None if none match."""
    haystack = description.casefold()
    for substring, category in rules:
        if substring.casefold() in haystack:
            return category
    return None
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (12 tests)

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
- Consumes: `ledgerlite.model.Transaction` from Task 1.
- Produces:
  - `ledgerlite.balance.order_transactions(transactions: list[Transaction]) -> list[Transaction]` — sorted by date, ties keeping input order.
  - `ledgerlite.balance.closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — the running balance after the last transaction in that order; `opening` when the list is empty.

- [ ] **Step 1: Write the failing test**

Create `test_balance.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_transactions
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(
        date=datetime.date(2026, 3, day),
        amount=Decimal(amount),
        description=description,
    )


class OrderTransactionsTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(5, "-900.00"), txn(4, "-7.50"), txn(6, "1.00")]

        self.assertEqual(
            [t.date.day for t in order_transactions(rows)], [4, 5, 6]
        )

    def test_ties_keep_input_order(self):
        rows = [
            txn(4, "-7.50", "second-in-file"),
            txn(3, "1.00", "earlier-date"),
            txn(4, "2500.00", "third-in-file"),
        ]

        self.assertEqual(
            [t.description for t in order_transactions(rows)],
            ["earlier-date", "second-in-file", "third-in-file"],
        )

    def test_does_not_mutate_its_input(self):
        rows = [txn(5, "1.00"), txn(4, "2.00")]
        order_transactions(rows)

        self.assertEqual([t.date.day for t in rows], [5, 4])

    def test_empty_list(self):
        self.assertEqual(order_transactions([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening_amount(self):
        rows = [txn(5, "-900.00"), txn(4, "-7.50"), txn(4, "2500.00")]

        self.assertEqual(
            closing_balance(rows, Decimal("100")), Decimal("1692.50")
        )

    def test_no_transactions_leaves_the_opening_amount(self):
        self.assertEqual(closing_balance([], Decimal("100.00")), Decimal("100.00"))

    def test_default_opening_of_zero(self):
        self.assertEqual(closing_balance([txn(4, "-7.50")], Decimal("0")), Decimal("-7.50"))

    def test_arithmetic_is_exact(self):
        rows = [txn(4, "0.10"), txn(4, "0.20")]

        self.assertEqual(str(closing_balance(rows, Decimal("0.00"))), "0.30")


if __name__ == "__main__":
    unittest.main()
```

`test_arithmetic_is_exact` is the float canary: with floats, `0.10 + 0.20` would not be `0.30`.

- [ ] **Step 2: Run it to make sure it fails**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write the implementation**

Create `ledgerlite/balance.py`:

```python
"""Date ordering and the running balance."""


def order_transactions(transactions):
    """Return the transactions ordered by date; ties keep input order."""
    return sorted(transactions, key=lambda transaction: transaction.date)


def closing_balance(transactions, opening):
    """Return the running balance after the last date-ordered transaction."""
    balance = opening
    for transaction in order_transactions(transactions):
        balance += transaction.amount
    return balance
```

`sorted` is stable, which is exactly the "ties keep input order" rule.

- [ ] **Step 4: Run it to make sure it passes**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: order transactions by date and compute the closing balance"
```

---

### Task 4: Category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 2), `closing_balance` (Task 3).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED = "uncategorized"`
  - `ledgerlite.report.format_amount(value: Decimal) -> str` — two fractional digits, no separators, no `-0.00`.
  - `ledgerlite.report.category_totals(transactions, rules) -> list[tuple[str, Decimal]]` — case-insensitive alphabetical, `uncategorized` last.
  - `ledgerlite.report.format_report(transactions, rules, opening: Decimal) -> str` — the whole report, ending in a single newline.

- [ ] **Step 1: Write the failing test**

Create `test_report.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report

RULES = [("coffee", "food"), ("rent", "housing")]


def txn(day, amount, description):
    return Transaction(
        date=datetime.date(2026, 3, day),
        amount=Decimal(amount),
        description=description,
    )


EXAMPLE = [
    txn(5, "-900.00", "Rent March"),
    txn(4, "-7.50", "Coffee Bar"),
    txn(4, "2500.00", "ACME PAYROLL"),
]


class FormatAmountTest(unittest.TestCase):
    def test_always_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-7.5")), "-7.50")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
        self.assertEqual(
            format_amount(Decimal("-0.50") + Decimal("0.50")), "0.00"
        )


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_each_category(self):
        self.assertEqual(
            category_totals(EXAMPLE, RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                ("uncategorized", Decimal("2500.00")),
            ],
        )

    def test_uncategorized_is_last_despite_the_alphabet(self):
        rows = [txn(4, "1.00", "Bookshop"), txn(4, "-7.50", "Coffee Bar")]

        self.assertEqual(
            [name for name, _ in category_totals(rows, RULES)],
            ["food", "uncategorized"],
        )

    def test_categories_sort_case_insensitively(self):
        rules = [("a", "Zebra"), ("b", "apple"), ("c", "Bank")]
        rows = [txn(4, "1.00", "a"), txn(4, "1.00", "b"), txn(4, "1.00", "c")]

        self.assertEqual(
            [name for name, _ in category_totals(rows, rules)],
            ["apple", "Bank", "Zebra"],
        )

    def test_two_rules_with_the_same_category_share_a_line(self):
        rules = [("coffee", "food"), ("bakery", "food")]
        rows = [txn(4, "-7.50", "Coffee Bar"), txn(5, "-2.50", "BAKERY")]

        self.assertEqual(category_totals(rows, rules), [("food", Decimal("-10.00"))])

    def test_a_rule_category_named_uncategorized_merges_into_the_bucket(self):
        rules = [("coffee", "uncategorized")]
        rows = [txn(4, "-7.50", "Coffee Bar"), txn(5, "1.00", "Bookshop")]

        self.assertEqual(
            category_totals(rows, rules), [("uncategorized", Decimal("-6.50"))]
        )

    def test_no_transactions_means_no_category_lines(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_with_no_rules_everything_is_uncategorized(self):
        self.assertEqual(
            category_totals(EXAMPLE, []), [("uncategorized", Decimal("1592.50"))]
        )


class FormatReportTest(unittest.TestCase):
    def test_matches_the_example_from_the_design(self):
        self.assertEqual(
            format_report(EXAMPLE, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_reports_the_opening_amount(self):
        self.assertEqual(
            format_report([], RULES, Decimal("100")),
            "\nclosing balance: 100.00\n",
        )

    def test_a_category_that_cancels_out_prints_zero(self):
        rows = [txn(4, "-7.50", "Coffee Bar"), txn(5, "7.50", "Coffee refund")]

        self.assertEqual(
            format_report(rows, RULES, Decimal("0")),
            "food: 0.00\n\nclosing balance: 0.00\n",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Write the implementation**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and the printable report."""

import decimal

from ledgerlite.balance import closing_balance
from ledgerlite.rules import categorize

UNCATEGORIZED = "uncategorized"


def format_amount(value):
    """Format a Decimal with exactly two fractional digits, no separators."""
    if value == 0:
        value = decimal.Decimal(0)  # a total of -0.00 prints as 0.00
    return f"{value:.2f}"


def category_totals(transactions, rules):
    """Total each category: alphabetical, case-insensitive, uncategorized last."""
    totals = {}
    for transaction in transactions:
        name = categorize(rules, transaction.description)
        if name is None:
            name = UNCATEGORIZED
        totals[name] = totals.get(name, decimal.Decimal(0)) + transaction.amount

    named = sorted(
        (name for name in totals if name != UNCATEGORIZED),
        key=lambda name: (name.casefold(), name),
    )
    ordered = [(name, totals[name]) for name in named]
    if UNCATEGORIZED in totals:
        ordered.append((UNCATEGORIZED, totals[UNCATEGORIZED]))
    return ordered


def format_report(transactions, rules, opening):
    """Render the whole report, ending in a newline."""
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    lines.append("")
    balance = closing_balance(transactions, opening)
    lines.append(f"closing balance: {format_amount(balance)}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `python3 -m unittest test_report -v`
Expected: PASS (13 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: total transactions per category and format the report"
```

---

### Task 5: CLI, exit codes, and error messages

**Files:**
- Create: `ledgerlite/cli.py`, `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_amount`, `parse_transactions`, `ParseError` (Task 1), `parse_rules` (Task 2), `format_report` (Task 4).
- Produces:
  - `ledgerlite.cli.build_parser() -> argparse.ArgumentParser`
  - `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — writes the report to stdout, errors to stderr, returns the exit code. Never calls `sys.exit`.

- [ ] **Step 1: Write the failing test**

Create `test_cli.py`:

```python
import contextlib
import io
import pathlib
import subprocess
import sys
import tempfile
import unittest

from ledgerlite.cli import main

GOOD_CSV = """\
date,amount,description
2026-03-05,-900.00,Rent March
2026-03-04,-7.50,Coffee Bar
2026-03-04,2500.00,ACME PAYROLL
"""

GOOD_RULES = "coffee=food\nrent=housing\n"

EXPECTED = (
    "food: -7.50\n"
    "housing: -900.00\n"
    "uncategorized: 2500.00\n"
    "\n"
    "closing balance: 1692.50\n"
)


class CliTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.directory = pathlib.Path(directory.name)

    def write(self, name, text, encoding="utf-8"):
        path = self.directory / name
        path.write_text(text, encoding=encoding, newline="")
        return str(path)

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_reports_the_example(self):
        transactions = self.write("t.csv", GOOD_CSV)
        rules = self.write("r.txt", GOOD_RULES)

        code, out, err = self.run_cli(
            "report", transactions, "--rules", rules, "--opening", "100"
        )

        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_opening_defaults_to_zero(self):
        transactions = self.write("t.csv", GOOD_CSV)
        rules = self.write("r.txt", GOOD_RULES)

        code, out, _ = self.run_cli("report", transactions, "--rules", rules)

        self.assertEqual(code, 0)
        self.assertIn("closing balance: 1592.50\n", out)

    def test_without_rules_everything_is_uncategorized(self):
        transactions = self.write("t.csv", GOOD_CSV)

        code, out, _ = self.run_cli("report", transactions)

        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_utf8_bom_is_tolerated(self):
        transactions = self.write("bom.csv", GOOD_CSV, encoding="utf-8-sig")

        code, out, err = self.run_cli("report", transactions)

        self.assertEqual((code, err), (0, ""))
        self.assertIn("closing balance: 1592.50\n", out)

    def test_header_only_file_reports_the_opening_amount(self):
        transactions = self.write("empty.csv", "date,amount,description\n")

        code, out, err = self.run_cli("report", transactions, "--opening", "100")

        self.assertEqual((code, out, err), (0, "\nclosing balance: 100.00\n", ""))

    def test_unreadable_transactions_file(self):
        missing = str(self.directory / "nope.csv")

        code, out, err = self.run_cli("report", missing)

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "))
        self.assertIn("No such file", err)

    def test_unreadable_rules_file(self):
        transactions = self.write("t.csv", GOOD_CSV)
        missing = str(self.directory / "nope.txt")

        code, out, err = self.run_cli("report", transactions, "--rules", missing)

        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "))

    def test_malformed_row_rejects_the_whole_file(self):
        transactions = self.write(
            "bad.csv",
            "date,amount,description\n2026-03-04,-7.50,Coffee\n2026-03-05,1.005,Rent\n",
        )

        code, out, err = self.run_cli("report", transactions)

        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: {transactions}:3: "))
        self.assertIn("amount", err)

    def test_malformed_rules_line(self):
        transactions = self.write("t.csv", GOOD_CSV)
        rules = self.write("r.txt", "coffee=food\noops\n")

        code, out, err = self.run_cli("report", transactions, "--rules", rules)

        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: {rules}:2: "))

    def test_transactions_error_wins_over_a_rules_error(self):
        transactions = self.write(
            "bad.csv", "date,amount,description\n2026-03-04,oops,Coffee\n"
        )
        rules = self.write("r.txt", "oops\n")

        code, _, err = self.run_cli("report", transactions, "--rules", rules)

        self.assertEqual(code, 2)
        self.assertIn(transactions, err)
        self.assertNotIn(rules, err)

    def test_bad_opening_amount(self):
        transactions = self.write("t.csv", GOOD_CSV)

        code, out, err = self.run_cli("report", transactions, "--opening", "1.005")

        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertIn("--opening", err)

    def test_missing_subcommand_is_a_usage_error(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                main([])

        self.assertEqual(caught.exception.code, 2)


class ModuleEntryPointTest(unittest.TestCase):
    def test_python_m_ledgerlite_prints_the_report(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "t.csv"
            path.write_text(GOOD_CSV, encoding="utf-8")
            rules = pathlib.Path(directory) / "r.txt"
            rules.write_text(GOOD_RULES, encoding="utf-8")

            result = subprocess.run(
                [
                    sys.executable, "-m", "ledgerlite", "report", str(path),
                    "--rules", str(rules), "--opening", "100",
                ],
                cwd=str(pathlib.Path(__file__).parent),
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, EXPECTED)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Write cli.py**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point: the only module that touches files or streams."""

import argparse
import io
import sys

from ledgerlite.parse import ParseError, parse_amount, parse_transactions
from ledgerlite.report import format_report
from ledgerlite.rules import parse_rules


def build_parser():
    parser = argparse.ArgumentParser(
        prog="ledgerlite",
        description="Summarize bank transactions by category.",
    )
    subcommands = parser.add_subparsers(dest="command", required=True)
    report = subcommands.add_parser(
        "report", help="print a per-category summary and the closing balance"
    )
    report.add_argument(
        "transactions", metavar="TRANSACTIONS", help="transactions CSV to read"
    )
    report.add_argument(
        "--rules", metavar="RULES", help="rules file (<substring>=<category> per line)"
    )
    report.add_argument(
        "--opening",
        metavar="AMOUNT",
        default="0",
        help="opening balance (default: 0)",
    )
    return parser


def _read_text(path):
    """Return the file's text, or print the reason and return None."""
    try:
        with open(path, encoding="utf-8-sig", newline="") as handle:
            return handle.read()
    except OSError as error:
        reason = error.strerror or str(error)
    except UnicodeDecodeError as error:
        reason = str(error)
    print(f"ledgerlite: cannot read {path}: {reason}", file=sys.stderr)
    return None


def _report_parse_error(path, error):
    print(f"ledgerlite: {path}:{error.line}: {error.problem}", file=sys.stderr)


def main(argv=None):
    args = build_parser().parse_args(argv)

    try:
        opening = parse_amount(args.opening.strip())
    except ValueError as error:
        print(f"ledgerlite: bad --opening: {error}", file=sys.stderr)
        return 2

    text = _read_text(args.transactions)
    if text is None:
        return 1
    try:
        transactions = parse_transactions(io.StringIO(text, newline=""))
    except ParseError as error:
        _report_parse_error(args.transactions, error)
        return 2

    rules = []
    if args.rules is not None:
        rules_text = _read_text(args.rules)
        if rules_text is None:
            return 1
        try:
            rules = parse_rules(io.StringIO(rules_text))
        except ParseError as error:
            _report_parse_error(args.rules, error)
            return 2

    sys.stdout.write(format_report(transactions, rules, opening))
    return 0
```

Nothing is written to stdout until both files have parsed, which is what "the whole file is rejected; nothing is printed to stdout" requires.

- [ ] **Step 4: Write `__main__.py`**

Create `ledgerlite/__main__.py`:

```python
"""Allow `python3 -m ledgerlite`."""

import sys

from ledgerlite.cli import main

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 5: Run the CLI tests**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (13 tests)

- [ ] **Step 6: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — every test in `test_model`, `test_parse`, `test_rules`, `test_balance`, `test_report`, `test_cli`.

- [ ] **Step 7: Check the float ban and try it by hand**

Run:

```bash
grep -rn "float" ledgerlite/ ; echo "exit: $?"
```

Expected: no matches (`exit: 1`).

Then exercise the real command:

```bash
printf 'date,amount,description\n2026-03-05,-900.00,Rent March\n2026-03-04,-7.50,Coffee Bar\n2026-03-04,2500.00,ACME PAYROLL\n' > /tmp/ledger.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledger.rules
python3 -m ledgerlite report /tmp/ledger.csv --rules /tmp/ledger.rules --opening 100
echo "exit: $?"
python3 -m ledgerlite report /tmp/missing.csv ; echo "exit: $?"
```

Expected: the design's example report then `exit: 0`; then `ledgerlite: cannot read /tmp/missing.csv: No such file or directory` and `exit: 1`.

- [ ] **Step 8: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI with exit codes and error messages"
```
