# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python CLI that reads a transactions CSV, categorizes each transaction with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** A five-module package with one responsibility each: `model` (the record), `parse` (text → records, with `ParseError`), `rules` (rules text → matchers), `balance` (date ordering and closing balance), `report` (totals and formatting), `cli` (argparse, exception → exit code). Every module below `cli` is pure and raises exceptions; only `cli` touches `sys.stdout`/`sys.stderr` and returns exit codes. Money is `decimal.Decimal` end to end — no `float` appears anywhere in the package.

**Tech Stack:** Python 3.11+ standard library only (`csv`, `decimal`, `datetime`, `dataclasses`, `argparse`, `unittest`).

**Spec:** `design.md` (in this directory)

## Global Constraints

- Python 3.11+. Standard library only — no third-party packages, no `pyproject.toml` dependencies.
- Amounts are `decimal.Decimal`, **never** `float`. No `float()`, no `%f` on floats, no `round()` on floats anywhere in the package or tests.
- Package layout is exactly as the spec lists it: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py` (plus `__main__.py`, see Decisions).
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest` from the repo root.
- Exit codes: `0` success, `1` transactions/rules file cannot be read, `2` malformed input.
- Error messages go to stderr, verbatim shapes:
  - `ledgerlite: cannot read <path>: <reason>`
  - `ledgerlite: <path>:<line>: <what is wrong>`
- Amounts print with exactly two fractional digits, leading `-` for negatives, no thousands separators (`-12.50`, `0.00`, `1200.00`).
- Work directly on `main`. This repo has no remote — never push.
- End every commit message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Decisions

The spec is silent on these; the plan commits to the following and tests them:

1. **Header validation.** The first non-blank row must be `date,amount,description` (compared after `strip()` and `lower()` per cell). Anything else — including a file with no rows at all — is malformed: `<path>:1: expected header date,amount,description`, exit 2.
2. **Zero transactions.** A header-only file yields no category lines, so the report is just `closing balance: <opening>` with **no** leading blank line. The blank line is a separator between the category block and the closing line; with no category block there is nothing to separate.
3. **Rules-file failures.** An unreadable rules file uses the same `cannot read` message and exit 1; a rules line that is not `<substring>=<category>` reuses `ParseError` and exit 2. The spec defines no third failure channel, so rules errors travel the existing two.
4. **`__main__.py`.** The spec's layout omits an entry point, so nothing could actually invoke `main`. Add a three-line `ledgerlite/__main__.py` shim so `python3 -m ledgerlite report ...` works. It contains no logic.
5. **`--opening` validation.** Reuses the transactions amount validator, so `--opening 1.005` is rejected. argparse reports the error and exits 2, which matches the malformed-input code.
6. **`balance.py` surface.** The running balance is the accumulator inside `closing_balance`; it is not exported, because no caller needs the intermediate values (the report never prints them). `order_by_date` is exported because `report` needs it.

## Review Focus

Input classes the spec implies but does not spell out. Each line has a test in the named task; a final reviewer should confirm these specific behaviors.

- Missing or misspelled header row → exit 2 at line 1, nothing on stdout. *(Task 1)*
- Completely empty transactions file → exit 2 at line 1, not "zero transactions". *(Task 1)*
- Header-only file → stdout is exactly `closing balance: 0.00\n`, no leading blank line. *(Task 4 and Task 5)*
- `amount` of `nan`, `NaN`, `Infinity`, or `-inf` → malformed, exit 2. `Decimal()` accepts these strings, so an explicit `is_finite()` check is required or a NaN silently poisons every total. *(Task 1)*
- A physically blank line inside or at the end of the CSV → skipped, not "expected 3 columns, got 0". A row like `,,` is **not** blank and is malformed (bad date). *(Task 1)*
- CRLF line endings and a UTF-8 BOM on the header → parsed normally, not a header error. *(Task 1)*
- A rules file whose category is literally `uncategorized` → merges into the uncategorized bucket and stays last. *(Task 4)*
- A total or closing balance of negative zero (`--opening -0.00`) → prints `0.00`, never `-0.00`. *(Task 4)*
- A transactions file that is not valid UTF-8 → exit 1 `cannot read <path>: invalid UTF-8`, not a traceback. *(Task 5)*
- Only the **first** malformed row is reported, and stdout stays empty when any row is malformed. *(Task 1 and Task 5)*

## File Structure

| File | Responsibility |
|---|---|
| `ledgerlite/__init__.py` | Package docstring only. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No logic. |
| `ledgerlite/parse.py` | `ParseError`; field validators `parse_date`/`parse_amount`; `parse_transactions(text, path)`; `load_transactions(path)`. |
| `ledgerlite/rules.py` | `Rule` alias; `parse_rules(text, path)`; `load_rules(path)`; `categorize(description, rules)`. |
| `ledgerlite/balance.py` | `order_by_date`; `closing_balance`. |
| `ledgerlite/report.py` | `format_amount`; `category_totals`; `render_report`. |
| `ledgerlite/cli.py` | argparse wiring, exception → message + exit code, `main(argv) -> int`. |
| `ledgerlite/__main__.py` | `raise SystemExit(main(sys.argv[1:]))`. |
| `test_model.py` … `test_cli.py` | One test file per module, repo root. |

Dependency direction is strictly downward: `cli` → `report` → `balance`/`rules` → `parse` → `model`. `rules.py` imports `ParseError` from `parse.py` (the one malformed-input error type); nothing imports upward.

---

### Task 1: Transaction model and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py`, `ledgerlite/model.py`, `ledgerlite/parse.py`
- Test: `test_model.py`, `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `Transaction(date: datetime.date, amount: Decimal, description: str)` — frozen dataclass, keyword-constructible.
  - `ParseError(path: str, line: int, problem: str)` — exception with those three attributes; `str(error)` is `"<path>:<line>: <problem>"`.
  - `parse_date(text: str) -> datetime.date` — raises `ValueError` with a human-readable reason.
  - `parse_amount(text: str) -> Decimal` — raises `ValueError` with a human-readable reason.
  - `parse_transactions(text: str, path: str) -> list[Transaction]` — input order preserved; raises `ParseError`.
  - `load_transactions(path: str) -> list[Transaction]` — raises `OSError`, `UnicodeDecodeError`, or `ParseError`.

- [ ] **Step 1: Write the model test**

Create `test_model.py`:

```python
import unittest
from dataclasses import FrozenInstanceError
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTest(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        transaction = Transaction(
            date=date(2026, 3, 4), amount=Decimal("-7.50"), description="Coffee shop"
        )
        self.assertEqual(transaction.date, date(2026, 3, 4))
        self.assertEqual(transaction.amount, Decimal("-7.50"))
        self.assertEqual(transaction.description, "Coffee shop")

    def test_is_frozen(self):
        transaction = Transaction(
            date=date(2026, 3, 4), amount=Decimal("1.00"), description="x"
        )
        with self.assertRaises(FrozenInstanceError):
            transaction.amount = Decimal("2.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write the package init and model**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite: categorize bank transactions and summarize them."""
```

Create `ledgerlite/model.py`:

```python
"""The transaction record shared by every other module."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One validated row of the input CSV."""

    date: date
    amount: Decimal
    description: str
```

- [ ] **Step 4: Run the model test to verify it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit the model**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py test_model.py
git commit -m "feat: add Transaction model" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Write the failing parse tests**

Create `test_parse.py`. Every test is listed here in full — do not abbreviate.

```python
import os
import tempfile
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import (
    ParseError,
    load_transactions,
    parse_amount,
    parse_date,
    parse_transactions,
)

HEADER = "date,amount,description\n"


class ParseAmountTest(unittest.TestCase):
    def test_accepts_zero_one_and_two_fractional_digits(self):
        self.assertEqual(parse_amount("1"), Decimal("1"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))
        self.assertEqual(parse_amount("-900.00"), Decimal("-900.00"))

    def test_rejects_three_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertIn("more than two fractional digits", str(caught.exception))

    def test_rejects_non_numbers(self):
        for text in ("", "abc", "1.2.3", "$5.00"):
            with self.subTest(text=text), self.assertRaises(ValueError):
                parse_amount(text)

    def test_rejects_nan_and_infinity(self):
        for text in ("nan", "NaN", "Infinity", "-inf"):
            with self.subTest(text=text), self.assertRaises(ValueError) as caught:
                parse_amount(text)
            self.assertIn("not a decimal number", str(caught.exception))


class ParseDateTest(unittest.TestCase):
    def test_accepts_iso_dates(self):
        self.assertEqual(parse_date("2026-03-04"), date(2026, 3, 4))

    def test_rejects_other_text(self):
        for text in ("", "04/03/2026", "2026-13-01", "yesterday"):
            with self.subTest(text=text), self.assertRaises(ValueError) as caught:
                parse_date(text)
            self.assertIn("ISO 8601", str(caught.exception))


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = HEADER + "2026-03-05,-900.00,Rent\n2026-03-01,-7.50,Coffee shop\n"
        self.assertEqual(
            parse_transactions(text, "t.csv"),
            [
                Transaction(date=date(2026, 3, 5), amount=Decimal("-900.00"), description="Rent"),
                Transaction(
                    date=date(2026, 3, 1), amount=Decimal("-7.50"), description="Coffee shop"
                ),
            ],
        )

    def test_keeps_description_verbatim(self):
        text = HEADER + '2026-03-01,1.00,"  ACME, INC.  "\n'
        self.assertEqual(parse_transactions(text, "t.csv")[0].description, "  ACME, INC.  ")

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER, "t.csv"), [])

    def test_rejects_missing_header(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("2026-03-01,1.00,Coffee\n", "t.csv")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(
            caught.exception.problem, "expected header date,amount,description"
        )

    def test_rejects_empty_file(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("", "t.csv")
        self.assertEqual(caught.exception.line, 1)

    def test_rejects_wrong_column_count(self):
        text = HEADER + "2026-03-01,1.00,Coffee\n2026-03-02,2.00\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text, "t.csv")
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.problem, "expected 3 columns, got 2")

    def test_reports_first_bad_row_only(self):
        text = HEADER + "2026-03-01,1.00,ok\nnot-a-date,1.00,bad\n2026-03-02,x,also bad\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text, "t.csv")
        self.assertEqual(caught.exception.line, 3)
        self.assertIn("ISO 8601", caught.exception.problem)

    def test_rejects_bad_amount_with_line_number(self):
        text = HEADER + "2026-03-01,1.005,Coffee\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text, "t.csv")
        self.assertEqual(caught.exception.line, 2)
        self.assertIn("more than two fractional digits", caught.exception.problem)

    def test_str_includes_path_and_line(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "2026-03-01,x,Coffee\n", "books/t.csv")
        self.assertTrue(str(caught.exception).startswith("books/t.csv:2: "))

    def test_skips_blank_lines(self):
        text = HEADER + "\n2026-03-01,1.00,Coffee\n\n"
        self.assertEqual(len(parse_transactions(text, "t.csv")), 1)

    def test_all_empty_fields_is_malformed(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + ",,\n", "t.csv")
        self.assertEqual(caught.exception.line, 2)

    def test_handles_crlf_line_endings(self):
        text = "date,amount,description\r\n2026-03-01,-7.50,Coffee\r\n"
        self.assertEqual(parse_transactions(text, "t.csv")[0].amount, Decimal("-7.50"))


class LoadTransactionsTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)

    def write_bytes(self, name, payload):
        path = os.path.join(self.directory.name, name)
        with open(path, "wb") as handle:
            handle.write(payload)
        return path

    def test_reads_a_file(self):
        path = self.write_bytes("t.csv", b"date,amount,description\n2026-03-01,-7.50,Coffee\n")
        self.assertEqual(load_transactions(path)[0].description, "Coffee")

    def test_tolerates_a_utf8_bom(self):
        path = self.write_bytes(
            "bom.csv", b"\xef\xbb\xbfdate,amount,description\n2026-03-01,-7.50,Coffee\n"
        )
        self.assertEqual(len(load_transactions(path)), 1)

    def test_missing_file_raises_oserror(self):
        with self.assertRaises(FileNotFoundError):
            load_transactions(os.path.join(self.directory.name, "nope.csv"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 7: Run the parse tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`

- [ ] **Step 8: Implement `parse.py`**

Create `ledgerlite/parse.py`:

```python
"""Turn transactions CSV text into Transaction objects."""

import csv
import io
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from .model import Transaction

HEADER = ["date", "amount", "description"]
HEADER_PROBLEM = "expected header date,amount,description"


class ParseError(Exception):
    """A line of an input file is malformed."""

    def __init__(self, path: str, line: int, problem: str) -> None:
        super().__init__(f"{path}:{line}: {problem}")
        self.path = path
        self.line = line
        self.problem = problem


def parse_date(text: str) -> date:
    """Parse an ISO 8601 calendar date, e.g. 2026-03-04."""
    try:
        return datetime.strptime(text.strip(), "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"date {text!r} is not an ISO 8601 date") from None


def parse_amount(text: str) -> Decimal:
    """Parse a decimal amount with at most two fractional digits."""
    try:
        amount = Decimal(text.strip())
    except InvalidOperation:
        raise ValueError(f"amount {text!r} is not a decimal number") from None
    if not amount.is_finite():
        # Decimal() happily accepts "nan" and "Infinity"; money cannot be either.
        raise ValueError(f"amount {text!r} is not a decimal number")
    if -amount.as_tuple().exponent > 2:
        raise ValueError(f"amount {text!r} has more than two fractional digits")
    return amount


def parse_transactions(text: str, path: str) -> list[Transaction]:
    """Parse whole-file CSV text, preserving row order.

    Raises ParseError on the first malformed line; the whole file is rejected.
    """
    transactions: list[Transaction] = []
    header_seen = False
    reader = csv.reader(io.StringIO(text, newline=""))
    for row in reader:
        line = reader.line_num
        if not row:
            continue
        if not header_seen:
            header_seen = True
            if [cell.strip().lower() for cell in row] != HEADER:
                raise ParseError(path, line, HEADER_PROBLEM)
            continue
        if len(row) != 3:
            raise ParseError(path, line, f"expected 3 columns, got {len(row)}")
        raw_date, raw_amount, description = row
        try:
            when = parse_date(raw_date)
            amount = parse_amount(raw_amount)
        except ValueError as error:
            raise ParseError(path, line, str(error)) from None
        transactions.append(Transaction(date=when, amount=amount, description=description))
    if not header_seen:
        raise ParseError(path, 1, HEADER_PROBLEM)
    return transactions


def load_transactions(path: str) -> list[Transaction]:
    """Read and parse a transactions file. Raises OSError, UnicodeDecodeError, ParseError."""
    with open(path, encoding="utf-8-sig") as handle:
        text = handle.read()
    return parse_transactions(text, path)
```

- [ ] **Step 9: Run the parse tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 10: Run the whole suite**

Run: `python3 -m unittest`
Expected: OK

- [ ] **Step 11: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV with per-line errors" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ParseError(path, line, problem)` from `ledgerlite.parse`.
- Produces:
  - `Rule = tuple[str, str]` — `(lowercased substring, category)`.
  - `parse_rules(text: str, path: str) -> list[Rule]` — file order preserved; raises `ParseError`.
  - `load_rules(path: str) -> list[Rule]` — raises `OSError`, `UnicodeDecodeError`, `ParseError`.
  - `categorize(description: str, rules: list[Rule]) -> str | None` — first match wins, case-insensitive.

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
import os
import tempfile
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, load_rules, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_rules_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n", "r.txt"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_lowercases_the_substring_and_strips_whitespace(self):
        self.assertEqual(parse_rules("  COFFEE = food  \n", "r.txt"), [("coffee", "food")])

    def test_skips_blank_lines(self):
        self.assertEqual(parse_rules("\ncoffee=food\n   \n", "r.txt"), [("coffee", "food")])

    def test_splits_on_the_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n", "r.txt"), [("a", "b=c")])

    def test_rejects_a_line_without_an_equals(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules("coffee=food\nrent\n", "r.txt")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.problem, "rule must be <substring>=<category>")

    def test_rejects_empty_substring_or_category(self):
        for text in ("=food\n", "coffee=\n", "=\n"):
            with self.subTest(text=text), self.assertRaises(ParseError):
                parse_rules(text, "r.txt")


class CategorizeTest(unittest.TestCase):
    def setUp(self):
        self.rules = [("coffee", "food"), ("rent", "housing")]

    def test_matches_a_substring_case_insensitively(self):
        self.assertEqual(categorize("Monthly RENT payment", self.rules), "housing")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "treats")]
        self.assertEqual(categorize("Coffee shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.rules))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee shop", []))


class LoadRulesTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)

    def test_reads_a_file(self):
        path = os.path.join(self.directory.name, "r.txt")
        with open(path, "w", encoding="utf-8") as handle:
            handle.write("coffee=food\n")
        self.assertEqual(load_rules(path), [("coffee", "food")])

    def test_missing_file_raises_oserror(self):
        with self.assertRaises(FileNotFoundError):
            load_rules(os.path.join(self.directory.name, "nope.txt"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `rules.py`**

Create `ledgerlite/rules.py`:

```python
"""Rules text -> (substring, category) pairs, and category lookup."""

from .parse import ParseError

Rule = tuple[str, str]

RULE_PROBLEM = "rule must be <substring>=<category>"


def parse_rules(text: str, path: str) -> list[Rule]:
    """Parse one `<substring>=<category>` rule per line, in file order."""
    rules: list[Rule] = []
    for number, line in enumerate(text.splitlines(), start=1):
        if not line.strip():
            continue
        substring, separator, category = line.partition("=")
        substring = substring.strip().lower()
        category = category.strip()
        if not separator or not substring or not category:
            raise ParseError(path, number, RULE_PROBLEM)
        rules.append((substring, category))
    return rules


def load_rules(path: str) -> list[Rule]:
    """Read and parse a rules file. Raises OSError, UnicodeDecodeError, ParseError."""
    with open(path, encoding="utf-8-sig") as handle:
        text = handle.read()
    return parse_rules(text, path)


def categorize(description: str, rules: list[Rule]) -> str | None:
    """Return the category of the first matching rule, or None."""
    lowered = description.lower()
    for substring, category in rules:
        if substring in lowered:
            return category
    return None
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (all tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: OK

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules files and categorize descriptions" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` from `ledgerlite.model`.
- Produces:
  - `order_by_date(transactions: list[Transaction]) -> list[Transaction]` — stable sort by date; input list untouched.
  - `closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal`.

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def transaction(day, amount, description="x"):
    return Transaction(
        date=date(2026, 3, day), amount=Decimal(amount), description=description
    )


class OrderByDateTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [transaction(5, "1.00", "b"), transaction(1, "2.00", "a")]
        self.assertEqual([t.description for t in order_by_date(rows)], ["a", "b"])

    def test_ties_keep_input_order(self):
        rows = [
            transaction(3, "1.00", "first"),
            transaction(1, "1.00", "earliest"),
            transaction(3, "1.00", "second"),
        ]
        self.assertEqual(
            [t.description for t in order_by_date(rows)], ["earliest", "first", "second"]
        )

    def test_does_not_mutate_the_input(self):
        rows = [transaction(5, "1.00", "b"), transaction(1, "2.00", "a")]
        order_by_date(rows)
        self.assertEqual([t.description for t in rows], ["b", "a"])

    def test_empty_list(self):
        self.assertEqual(order_by_date([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening_balance(self):
        rows = [transaction(5, "-900.00"), transaction(1, "-7.50"), transaction(3, "2500.00")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_no_transactions_leaves_the_opening_balance(self):
        self.assertEqual(closing_balance(Decimal("100.00"), []), Decimal("100.00"))

    def test_arithmetic_is_exact(self):
        rows = [transaction(1, "0.10"), transaction(2, "0.20")]
        self.assertEqual(closing_balance(Decimal("0"), rows), Decimal("0.30"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `balance.py`**

Create `ledgerlite/balance.py`:

```python
"""Date ordering and the closing balance."""

from decimal import Decimal

from .model import Transaction


def order_by_date(transactions: list[Transaction]) -> list[Transaction]:
    """Return the transactions by date; ties keep input order (sorted is stable)."""
    return sorted(transactions, key=lambda transaction: transaction.date)


def closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal:
    """Run the balance forward in date order and return where it lands."""
    balance = opening
    for transaction in order_by_date(transactions):
        balance += transaction.amount
    return balance
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (all tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: OK

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction`; `order_by_date`, `closing_balance`; `Rule`, `categorize`.
- Produces:
  - `UNCATEGORIZED = "uncategorized"`.
  - `format_amount(amount: Decimal) -> str` — two fractional digits, no separators, never `-0.00`.
  - `category_totals(transactions: list[Transaction], rules: list[Rule]) -> list[tuple[str, Decimal]]` — named categories alphabetically, `uncategorized` last; only categories with at least one transaction appear.
  - `render_report(transactions: list[Transaction], rules: list[Rule], opening: Decimal) -> str` — the full report, ending in a newline.

- [ ] **Step 1: Write the failing tests**

Create `test_report.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, render_report


def transaction(day, amount, description):
    return Transaction(
        date=date(2026, 3, day), amount=Decimal(amount), description=description
    )


RULES = [("coffee", "food"), ("rent", "housing")]
EXAMPLE = [
    transaction(5, "-900.00", "Monthly RENT payment"),
    transaction(1, "-7.50", "Coffee shop"),
    transaction(3, "2500.00", "Salary"),
]


class FormatAmountTest(unittest.TestCase):
    def test_always_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_negatives_get_a_leading_minus(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_per_category_alphabetically_with_uncategorized_last(self):
        self.assertEqual(
            category_totals(EXAMPLE, RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                ("uncategorized", Decimal("2500.00")),
            ],
        )

    def test_omits_categories_with_no_transactions(self):
        rows = [transaction(1, "-7.50", "Coffee shop")]
        self.assertEqual(category_totals(rows, RULES), [("food", Decimal("-7.50"))])

    def test_no_transactions_yields_no_rows(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_without_rules_everything_is_uncategorized(self):
        self.assertEqual(
            category_totals(EXAMPLE, []), [("uncategorized", Decimal("1592.50"))]
        )

    def test_a_rule_named_uncategorized_merges_and_stays_last(self):
        rules = [("coffee", "uncategorized"), ("rent", "housing")]
        self.assertEqual(
            category_totals(EXAMPLE, rules),
            [("housing", Decimal("-900.00")), ("uncategorized", Decimal("2492.50"))],
        )


class RenderReportTest(unittest.TestCase):
    def test_matches_the_design_example(self):
        self.assertEqual(
            render_report(EXAMPLE, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(render_report([], RULES, Decimal("0")), "closing balance: 0.00\n")

    def test_no_transactions_keeps_the_opening_balance(self):
        self.assertEqual(
            render_report([], RULES, Decimal("100")), "closing balance: 100.00\n"
        )


if __name__ == "__main__":
    unittest.main()
```

Check the arithmetic in `test_a_rule_named_uncategorized_merges_and_stays_last`: `-7.50 + 2500.00 = 2492.50`. In `test_without_rules_everything_is_uncategorized`: `-900.00 - 7.50 + 2500.00 = 1592.50`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `report.py`**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and report formatting."""

from decimal import Decimal

from .balance import closing_balance, order_by_date
from .model import Transaction
from .rules import Rule, categorize

UNCATEGORIZED = "uncategorized"


def format_amount(amount: Decimal) -> str:
    """Format money with exactly two fractional digits and no separators."""
    text = f"{amount:.2f}"
    return "0.00" if text == "-0.00" else text


def category_totals(
    transactions: list[Transaction], rules: list[Rule]
) -> list[tuple[str, Decimal]]:
    """Total each category: named categories alphabetically, uncategorized last."""
    totals: dict[str, Decimal] = {}
    for transaction in order_by_date(transactions):
        category = categorize(transaction.description, rules) or UNCATEGORIZED
        totals[category] = totals.get(category, Decimal("0.00")) + transaction.amount
    names = sorted(name for name in totals if name != UNCATEGORIZED)
    if UNCATEGORIZED in totals:
        names.append(UNCATEGORIZED)
    return [(name, totals[name]) for name in names]


def render_report(
    transactions: list[Transaction], rules: list[Rule], opening: Decimal
) -> str:
    """Render the whole report, ending with a newline."""
    lines = [
        f"{name}: {format_amount(total)}"
        for name, total in category_totals(transactions, rules)
    ]
    if lines:
        # Blank line separates the category block from the closing balance.
        lines.append("")
    lines.append(f"closing balance: {format_amount(closing_balance(opening, transactions))}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (all tests)

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest`
Expected: OK

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: total categories and format the report" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: CLI entry point and exit codes

**Files:**
- Create: `ledgerlite/cli.py`, `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `ParseError`, `load_transactions`, `parse_amount`; `load_rules`; `render_report`.
- Produces: `main(argv: list[str] | None = None) -> int` — writes the report to stdout, errors to stderr, returns the exit code and never raises `SystemExit` itself.

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
    "2026-03-05,-900.00,Monthly RENT payment\n"
    "2026-03-01,-7.50,Coffee shop\n"
    "2026-03-03,2500.00,Salary\n"
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
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)

    def path_for(self, name):
        return os.path.join(self.directory.name, name)

    def write(self, name, text):
        path = self.path_for(name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        return path

    def run_cli(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_prints_the_report_and_returns_zero(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", RULES)
        code, out, err = self.run_cli(
            ["report", transactions, "--rules", rules, "--opening", "100"]
        )
        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_opening_defaults_to_zero(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_cli(["report", transactions, "--rules", self.write("r.txt", RULES)])
        self.assertEqual(code, 0)
        self.assertTrue(out.endswith("closing balance: 1592.50\n"))

    def test_without_rules_everything_is_uncategorized(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_cli(["report", transactions])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_header_only_file_prints_just_the_closing_balance(self):
        transactions = self.write("empty.csv", "date,amount,description\n")
        code, out, err = self.run_cli(["report", transactions, "--opening", "42.00"])
        self.assertEqual((code, out, err), (0, "closing balance: 42.00\n", ""))

    def test_unreadable_transactions_file_returns_one(self):
        missing = self.path_for("nope.csv")
        code, out, err = self.run_cli(["report", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        # The reason comes from the OS, so only the prefix is asserted.
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "))
        self.assertTrue(err.endswith("\n"))

    def test_non_utf8_transactions_file_returns_one(self):
        path = self.path_for("latin1.csv")
        with open(path, "wb") as handle:
            handle.write(b"date,amount,description\n2026-03-01,-1.00,caf\xe9\n")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(err, f"ledgerlite: cannot read {path}: invalid UTF-8\n")

    def test_malformed_row_returns_two_and_prints_nothing_to_stdout(self):
        path = self.write("bad.csv", "date,amount,description\n2026-03-01,1.005,Coffee\n")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err,
            f"ledgerlite: {path}:2: amount '1.005' has more than two fractional digits\n",
        )

    def test_missing_header_returns_two(self):
        path = self.write("noheader.csv", "2026-03-01,1.00,Coffee\n")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err, f"ledgerlite: {path}:1: expected header date,amount,description\n"
        )

    def test_unreadable_rules_file_returns_one(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        missing = self.path_for("nope.txt")
        code, out, err = self.run_cli(["report", transactions, "--rules", missing])
        self.assertEqual((code, out), (1, ""))
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "))

    def test_malformed_rules_file_returns_two(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", "coffee=food\noops\n")
        code, out, err = self.run_cli(["report", transactions, "--rules", rules])
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err, f"ledgerlite: {rules}:2: rule must be <substring>=<category>\n"
        )

    def test_bad_opening_amount_is_rejected(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        code, out, err = self.run_cli(["report", transactions, "--opening", "1.005"])
        self.assertEqual((code, out), (2, ""))
        self.assertNotEqual(err, "")

    def test_missing_subcommand_is_rejected(self):
        code, out, _ = self.run_cli([])
        self.assertEqual((code, out), (2, ""))


if __name__ == "__main__":
    unittest.main()
```

Check the arithmetic: with `--opening` defaulting to `0`, `-900.00 - 7.50 + 2500.00 = 1592.50`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `cli.py`**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point."""

import argparse
import sys
from decimal import Decimal

from .parse import ParseError, load_transactions, parse_amount
from .report import render_report
from .rules import load_rules

PROGRAM = "ledgerlite"


def _opening_amount(text: str) -> Decimal:
    try:
        return parse_amount(text)
    except ValueError as error:
        raise argparse.ArgumentTypeError(str(error)) from None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog=PROGRAM)
    subcommands = parser.add_subparsers(dest="command", required=True)
    report = subcommands.add_parser("report", help="print a per-category summary")
    report.add_argument("transactions", metavar="TRANSACTIONS", help="transactions CSV")
    report.add_argument("--rules", metavar="RULES", help="rules file")
    report.add_argument(
        "--opening",
        metavar="AMOUNT",
        type=_opening_amount,
        default=Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def _unreadable(path: str, error: Exception) -> int:
    reason = error.strerror if isinstance(error, OSError) and error.strerror else "invalid UTF-8"
    print(f"{PROGRAM}: cannot read {path}: {reason}", file=sys.stderr)
    return 1


def _malformed(error: ParseError) -> int:
    print(f"{PROGRAM}: {error.path}:{error.line}: {error.problem}", file=sys.stderr)
    return 2


def main(argv: list[str] | None = None) -> int:
    """Run ledgerlite and return its exit code."""
    parser = _build_parser()
    try:
        args = parser.parse_args(sys.argv[1:] if argv is None else argv)
    except SystemExit as error:
        # argparse already reported the problem (or printed --help).
        return 0 if error.code is None else int(error.code)

    try:
        transactions = load_transactions(args.transactions)
    except ParseError as error:
        return _malformed(error)
    except (OSError, UnicodeDecodeError) as error:
        return _unreadable(args.transactions, error)

    rules = []
    if args.rules is not None:
        try:
            rules = load_rules(args.rules)
        except ParseError as error:
            return _malformed(error)
        except (OSError, UnicodeDecodeError) as error:
            return _unreadable(args.rules, error)

    sys.stdout.write(render_report(transactions, rules, args.opening))
    return 0
```

Create `ledgerlite/__main__.py`:

```python
"""Allow `python3 -m ledgerlite ...`."""

import sys

from .cli import main

raise SystemExit(main(sys.argv[1:]))
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (all tests)

- [ ] **Step 5: Verify the real command end to end**

Run:

```bash
printf 'date,amount,description\n2026-03-05,-900.00,Monthly RENT payment\n2026-03-01,-7.50,Coffee shop\n2026-03-03,2500.00,Salary\n' > /tmp/ledgerlite-t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ledgerlite-r.txt
python3 -m ledgerlite report /tmp/ledgerlite-t.csv --rules /tmp/ledgerlite-r.txt --opening 100
echo "exit=$?"
```

Expected: exactly the design's example output, then `exit=0`:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit=0
```

Then confirm the failure paths:

```bash
python3 -m ledgerlite report /tmp/does-not-exist.csv; echo "exit=$?"
```

Expected: `ledgerlite: cannot read /tmp/does-not-exist.csv: No such file or directory` on stderr, `exit=1`.

- [ ] **Step 6: Run the whole suite**

Run: `python3 -m unittest`
Expected: OK

- [ ] **Step 7: Confirm no float crept in**

Run: `grep -rnE '\bfloat\(|%\.[0-9]f|\bround\(' ledgerlite/`
Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add report CLI with exit codes" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
rm -f /tmp/ledgerlite-t.csv /tmp/ledgerlite-r.txt
```

---

## Final Verification

- [ ] `python3 -m unittest` from the repo root: OK, all test files discovered (`test_model`, `test_parse`, `test_rules`, `test_balance`, `test_report`, `test_cli`).
- [ ] `git status` is clean and `git log --oneline` shows one commit per deliverable.
- [ ] Every module in the spec's layout exists and no extra modules beyond `__main__.py` (see Decisions #4).
- [ ] Walk the Review Focus list and confirm each behavior has a passing test.
