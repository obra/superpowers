# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python package and CLI that reads a transactions CSV, categorizes each row with a rules file, and prints a per-category summary plus the closing balance.

**Architecture:** Seven small modules with one responsibility each, wired together only at the CLI layer. Pure functions take text and return values (`parse_transactions(text, path)`, `categorize(description, rules)`, `format_report(totals, closing)`); only `cli.py` touches the filesystem, stdout, stderr, and exit codes. All money is `decimal.Decimal` from the moment it is parsed to the moment it is formatted — never `float`. Errors travel as a single `ParseError` exception carrying `(path, line, message)`, which the CLI turns into the exact stderr strings the spec requires.

**Tech Stack:** Python 3.11+, standard library only (`argparse`, `csv`, `dataclasses`, `datetime`, `decimal`, `re`, `sys`), `unittest` for tests.

**Spec:** `design.md` (in this directory — read it before starting)

## Global Constraints

- Python 3.11+. Standard library only — no third-party packages, no `pyproject.toml` dependencies.
- Money is parsed and carried as `decimal.Decimal`. **Never** `float`, not even transiently.
- Package layout is fixed by the spec: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`.
- Tests live at the **repo root** as `test_<module>.py` and run with `python3 -m unittest`.
- Exit codes: `0` success, `1` transactions file cannot be read, `2` a row is malformed.
- Exact stderr formats, copied verbatim from the spec:
  - `ledgerlite: cannot read <path>: <reason>`
  - `ledgerlite: <path>:<line>: <what is wrong>`
- On a malformed row the **whole file is rejected**; nothing is written to stdout.
- Amounts are printed with exactly two fractional digits, a leading `-` for negatives, and no thousands separators (`-12.50`, `0.00`, `1200.00`).
- CLI shape: `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`; `--opening` defaults to `0`; `--rules` is optional.
- Category lines are alphabetical, `uncategorized` always last, then a blank line, then `closing balance: <amount>`.

## Review Focus

The spec is a vision document. These are input classes and failure modes it implies but does not spell out. Each line names the expected behavior and the task that owns its test; a decision is recorded here so the executor does not have to invent one.

1. **Non-decimal spellings that `Decimal()` accepts anyway** — `nan`, `Infinity`, `1e2`, `1_0` must be *malformed* (exit 2), not silently accepted. `Decimal("nan")` succeeds, so a naive `try: Decimal(raw)` is a live bug. Pinned by a regex in **Task 2**.
2. **Negative zero** — `Decimal("-0.00")` formats as `-0.00` under `f"{d:.2f}"`. The spec shows `0.00`. Zero must never print with a sign. **Task 6**.
3. **A file with no transactions** — no category lines exist, so the report must not begin with a stray blank line; it is just `closing balance: <opening>`. **Task 6**.
4. **A rules file with the category literally named `uncategorized`** — merges into the uncategorized bucket and still sorts last. **Task 6**.
5. **Missing, misspelled, or absent header row** — an empty file and a wrong header are line-1 malformed-row errors (exit 2), so a data row is never silently eaten as a header. **Task 3**.
6. **Blank lines inside the CSV** (including a trailing `\n\n`) — ignored, not reported as `expected 3 columns, got 0`. **Task 3**.
7. **CRLF line endings** — a Windows-authored CSV must parse, with no `\r` clinging to the description. **Task 3**.
8. **UTF-8 BOM** at the start of either file — must not corrupt the header check or the first rule. **Task 7**.
9. **Paths that exist but cannot be read** — a directory, a permission-denied file, undecodable bytes → exit 1 `cannot read`, never a traceback. **Task 7**.
10. **A malformed or unreadable `--rules` file** — the spec gives no code for this; treat it exactly like the transactions file (exit 2 malformed, exit 1 unreadable) so bad rules are never silently ignored. Transactions errors take precedence when both files are bad. **Task 4** and **Task 7**.
11. **Negative `--opening` on the command line** (`--opening -12.50`) — argparse can mistake a negative number for an option. **Task 7**.
12. **Two rules matching the same description** — the earlier line wins, per the spec's "first matching rule wins", even when a later rule is more specific. **Task 4**.
13. **Whitespace padding** around the date and amount fields (`2026-03-04 , -7.50 `) — tolerated; the description is kept verbatim. **Task 2** and **Task 3**.
14. **Amounts beyond float precision** (`12345678901234567890.12`) — must sum exactly. This is the test that would catch a `float` creeping in. **Task 5**.
15. **Mixed-case category names** — sorted with plain `sorted()`, i.e. uppercase before lowercase. **Task 6**.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `ledgerlite/__init__.py` | Package docstring only. No re-exports (keeps import order trivial). |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No behavior. |
| `ledgerlite/parse.py` | `ParseError`; `parse_amount(raw)`; `parse_transactions(text, path)`. |
| `ledgerlite/rules.py` | `parse_rules(text, path)`; `categorize(description, rules)`. |
| `ledgerlite/balance.py` | `order_transactions(txs)`; `closing_balance(opening, txs)`. |
| `ledgerlite/report.py` | `UNCATEGORIZED`; `format_amount(amount)`; `category_totals(txs, rules)`; `format_report(totals, closing)`. |
| `ledgerlite/cli.py` | `main(argv) -> int`: argparse, file I/O, stderr messages, exit codes. |
| `ledgerlite/__main__.py` | `python3 -m ledgerlite` entry point. Two lines. |
| `test_model.py` … `test_cli.py` | One test module per source module, at the repo root. |
| `README.md` | Usage, exit codes, file formats. |

**Addition beyond the spec's layout:** `__main__.py`. The spec names the tool `ledgerlite` but lists no packaging file, so without `__main__.py` there is no way to actually run it. It contains no logic.

---

## Task 1: Package skeleton and the Transaction model

**Files:**
- Create: `ledgerlite/__init__.py`
- Create: `ledgerlite/model.py`
- Test: `test_model.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `ledgerlite.model.Transaction`, a frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that order. Every later task constructs it with keyword arguments.

- [ ] **Step 1: Write the failing test**

Create `test_model.py`:

```python
import dataclasses
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTests(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        tx = Transaction(
            date=datetime.date(2026, 3, 4),
            amount=Decimal("-7.50"),
            description="Coffee Bar",
        )
        self.assertEqual(tx.date, datetime.date(2026, 3, 4))
        self.assertEqual(tx.amount, Decimal("-7.50"))
        self.assertEqual(tx.description, "Coffee Bar")

    def test_is_frozen(self):
        tx = Transaction(
            date=datetime.date(2026, 3, 4),
            amount=Decimal("1.00"),
            description="x",
        )
        with self.assertRaises(dataclasses.FrozenInstanceError):
            tx.amount = Decimal("2.00")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/__init__.py`:

```python
"""ledgerlite: categorize bank transactions and summarize them by category."""
```

Create `ledgerlite/model.py`:

```python
"""The single data record ledgerlite passes around."""

import datetime
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Transaction:
    """One row of the transactions CSV."""

    date: datetime.date
    amount: Decimal
    description: str
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py test_model.py
git commit -m "feat: add Transaction model and package skeleton"
```

---

## Task 2: ParseError and amount parsing

Amount parsing is its own task because it is the one place the spec is easy to get
wrong: `decimal.Decimal` happily accepts `nan`, `Infinity`, `1e2`, and `1_0`, none
of which is "a decimal number with up to two fractional digits". A regex decides
what is valid; `Decimal` only converts.

**Files:**
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.parse.ParseError(path: str, line: int, message: str)` — an `Exception` whose `str()` is exactly `"<path>:<line>: <message>"` and which exposes `.path`, `.line`, `.message`.
  - `ledgerlite.parse.parse_amount(raw: str) -> Decimal` — raises `ValueError` whose message is exactly `invalid amount '<raw-stripped>': expected a decimal number with at most two fractional digits`. Task 3 wraps it in a `ParseError`; Task 7 reuses it for `--opening`.

- [ ] **Step 1: Write the failing tests**

Create `test_parse.py`:

```python
import unittest
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount


class ParseErrorTests(unittest.TestCase):
    def test_str_is_path_line_message(self):
        err = ParseError("in.csv", 4, "expected 3 columns, got 2")
        self.assertEqual(str(err), "in.csv:4: expected 3 columns, got 2")

    def test_exposes_parts(self):
        err = ParseError("in.csv", 4, "boom")
        self.assertEqual(err.path, "in.csv")
        self.assertEqual(err.line, 4)
        self.assertEqual(err.message, "boom")


class ParseAmountTests(unittest.TestCase):
    def test_accepts_two_fractional_digits(self):
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))

    def test_accepts_one_fractional_digit(self):
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))

    def test_accepts_no_fractional_digits(self):
        self.assertEqual(parse_amount("2500"), Decimal("2500"))

    def test_accepts_leading_plus(self):
        self.assertEqual(parse_amount("+7.25"), Decimal("7.25"))

    def test_accepts_bare_fraction(self):
        self.assertEqual(parse_amount(".50"), Decimal("0.50"))

    def test_accepts_surrounding_whitespace(self):
        # Review Focus 13: padded CSV fields are tolerated.
        self.assertEqual(parse_amount("  -7.50 "), Decimal("-7.50"))

    def test_returns_decimal_not_float(self):
        # Review Focus 14: exactness is the whole point of Decimal.
        self.assertIsInstance(parse_amount("0.10"), Decimal)
        self.assertEqual(parse_amount("0.10") * 3, Decimal("0.30"))

    def test_rejects_three_fractional_digits(self):
        with self.assertRaises(ValueError) as ctx:
            parse_amount("1.005")
        self.assertEqual(
            str(ctx.exception),
            "invalid amount '1.005': expected a decimal number "
            "with at most two fractional digits",
        )

    def test_rejects_non_numbers(self):
        for raw in ["", "   ", "abc", "1.2.3", "-", "$1.00", "1,000.00"]:
            with self.subTest(raw=raw):
                with self.assertRaises(ValueError):
                    parse_amount(raw)

    def test_rejects_spellings_decimal_would_accept(self):
        # Review Focus 1: Decimal("nan") succeeds; parse_amount must not.
        for raw in ["nan", "NaN", "Infinity", "-inf", "1e2", "1E2", "1_0"]:
            with self.subTest(raw=raw):
                with self.assertRaises(ValueError):
                    parse_amount(raw)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.parse'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/parse.py`:

```python
"""Turn transactions-CSV text into Transaction records."""

import re
from decimal import Decimal

# A decimal number with at most two fractional digits, and nothing else.
# Deliberately stricter than Decimal(), which accepts "nan", "1e2" and "1_0".
_AMOUNT_RE = re.compile(r"[+-]?(?:\d+(?:\.\d{1,2})?|\.\d{1,2})\Z")


class ParseError(Exception):
    """A row of an input file could not be understood."""

    def __init__(self, path: str, line: int, message: str) -> None:
        super().__init__(f"{path}:{line}: {message}")
        self.path = path
        self.line = line
        self.message = message


def parse_amount(raw: str) -> Decimal:
    """Parse a money amount. Raises ValueError if it is not a valid amount."""
    value = raw.strip()
    if not _AMOUNT_RE.match(value):
        raise ValueError(
            f"invalid amount {value!r}: expected a decimal number "
            "with at most two fractional digits"
        )
    return Decimal(value)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (12 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: add ParseError and strict amount parsing"
```

---

## Task 3: Transactions CSV parsing

**Files:**
- Modify: `ledgerlite/parse.py` (add `parse_transactions` and two private helpers below `parse_amount`)
- Modify: `test_parse.py` (add the classes below; keep Task 2's classes)

**Interfaces:**
- Consumes: `Transaction` (Task 1); `ParseError`, `parse_amount` (Task 2).
- Produces: `ledgerlite.parse.parse_transactions(text: str, path: str) -> list[Transaction]`. Returns rows in **input order** (ordering is Task 5's job). `path` is used only to build error messages. Raises `ParseError` on the first bad row.

Line numbers are physical file lines: the header is line 1, the first data row is line 2. `csv.reader.line_num` provides this and stays correct across quoted fields containing newlines, which is why the reader is fed `text.splitlines(keepends=True)` rather than a list of stripped lines.

- [ ] **Step 1: Write the failing tests for the happy path**

Append to `test_parse.py` (and extend the import line to
`from ledgerlite.parse import ParseError, parse_amount, parse_transactions`,
adding `import datetime` at the top):

```python
HEADER = "date,amount,description\n"


class ParseTransactionsTests(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = HEADER + "2026-03-05,-900.00,Rent\n2026-03-04,-7.50,Coffee Bar\n"
        rows = parse_transactions(text, "in.csv")
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0].date, datetime.date(2026, 3, 5))
        self.assertEqual(rows[0].amount, Decimal("-900.00"))
        self.assertEqual(rows[0].description, "Rent")
        self.assertEqual(rows[1].description, "Coffee Bar")

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER, "in.csv"), [])

    def test_accepts_positive_and_negative_amounts(self):
        text = HEADER + "2026-03-04,2500.00,Salary\n2026-03-04,-7.5,Coffee\n"
        rows = parse_transactions(text, "in.csv")
        self.assertEqual(rows[0].amount, Decimal("2500.00"))
        self.assertEqual(rows[1].amount, Decimal("-7.5"))

    def test_keeps_description_verbatim_and_handles_quotes_and_commas(self):
        text = HEADER + '2026-03-04,-7.50,"Coffee Bar, Ltd"\n'
        rows = parse_transactions(text, "in.csv")
        self.assertEqual(rows[0].description, "Coffee Bar, Ltd")

    def test_tolerates_padded_date_and_amount_fields(self):
        # Review Focus 13.
        text = HEADER + "  2026-03-04 , -7.50 ,Coffee Bar\n"
        rows = parse_transactions(text, "in.csv")
        self.assertEqual(rows[0].date, datetime.date(2026, 3, 4))
        self.assertEqual(rows[0].amount, Decimal("-7.50"))

    def test_ignores_blank_lines(self):
        # Review Focus 6: a blank line is not a zero-column row.
        text = HEADER + "\n2026-03-04,-7.50,Coffee\n\n"
        self.assertEqual(len(parse_transactions(text, "in.csv")), 1)

    def test_handles_crlf_line_endings(self):
        # Review Focus 7: no stray \r on the last field.
        text = "date,amount,description\r\n2026-03-04,-7.50,Coffee Bar\r\n"
        rows = parse_transactions(text, "in.csv")
        self.assertEqual(rows[0].description, "Coffee Bar")

    def test_accepts_case_insensitive_padded_header(self):
        text = "Date, Amount ,DESCRIPTION\n2026-03-04,-7.50,Coffee\n"
        self.assertEqual(len(parse_transactions(text, "in.csv")), 1)
```

- [ ] **Step 2: Write the failing tests for malformed input**

Also append to `test_parse.py`:

```python
class ParseTransactionsErrorTests(unittest.TestCase):
    def assert_error(self, text, expected):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text, "in.csv")
        self.assertEqual(str(ctx.exception), expected)

    def test_too_few_columns(self):
        self.assert_error(
            HEADER + "2026-03-04,-7.50\n",
            "in.csv:2: expected 3 columns, got 2",
        )

    def test_too_many_columns(self):
        self.assert_error(
            HEADER + "2026-03-04,-7.50,Coffee,extra\n",
            "in.csv:2: expected 3 columns, got 4",
        )

    def test_unparseable_date(self):
        self.assert_error(
            HEADER + "04/03/2026,-7.50,Coffee\n",
            "in.csv:2: invalid date '04/03/2026': expected YYYY-MM-DD",
        )

    def test_impossible_date(self):
        self.assert_error(
            HEADER + "2026-02-30,-7.50,Coffee\n",
            "in.csv:2: invalid date '2026-02-30': expected YYYY-MM-DD",
        )

    def test_non_iso_date_shapes_are_rejected(self):
        for raw in ["20260304", "2026-3-4", "2026-W01-1", ""]:
            with self.subTest(raw=raw):
                with self.assertRaises(ParseError):
                    parse_transactions(HEADER + f"{raw},-7.50,Coffee\n", "in.csv")

    def test_amount_with_three_fractional_digits(self):
        self.assert_error(
            HEADER + "2026-03-04,1.005,Coffee\n",
            "in.csv:2: invalid amount '1.005': expected a decimal number "
            "with at most two fractional digits",
        )

    def test_non_numeric_amount(self):
        self.assert_error(
            HEADER + "2026-03-04,seven,Coffee\n",
            "in.csv:2: invalid amount 'seven': expected a decimal number "
            "with at most two fractional digits",
        )

    def test_reports_the_line_number_of_the_offending_row(self):
        text = (
            HEADER
            + "2026-03-04,-7.50,Coffee\n"
            + "2026-03-05,-900.00,Rent\n"
            + "2026-03-06,oops,Broken\n"
        )
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text, "in.csv")
        self.assertEqual(ctx.exception.line, 4)

    def test_first_bad_row_wins(self):
        text = HEADER + "2026-03-04,oops,A\n2026-03-05,alsobad,B\n"
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text, "in.csv")
        self.assertEqual(ctx.exception.line, 2)

    def test_wrong_header(self):
        # Review Focus 5: never silently eat a data row as a header.
        self.assert_error(
            "when,how much,what\n2026-03-04,-7.50,Coffee\n",
            "in.csv:1: invalid header row: expected 'date,amount,description'",
        )

    def test_empty_file(self):
        self.assert_error(
            "",
            "in.csv:1: missing header row: expected 'date,amount,description'",
        )

    def test_file_of_only_blank_lines(self):
        self.assert_error(
            "\n\n",
            "in.csv:1: missing header row: expected 'date,amount,description'",
        )
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'parse_transactions'`

- [ ] **Step 4: Write the minimal implementation**

In `ledgerlite/parse.py`, add `import csv`, `import datetime`, and
`from ledgerlite.model import Transaction` to the imports; add this constant
next to `_AMOUNT_RE`:

```python
_DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}\Z")
_HEADER = ["date", "amount", "description"]
_MISSING_HEADER = "missing header row: expected 'date,amount,description'"
_BAD_HEADER = "invalid header row: expected 'date,amount,description'"
```

and append:

```python
def parse_transactions(text: str, path: str) -> list[Transaction]:
    """Parse the whole transactions CSV, in input order.

    Raises ParseError on the first malformed row; the caller rejects the
    whole file.
    """
    # keepends=True so csv.reader.line_num counts physical lines even when a
    # quoted description spans several of them.
    reader = csv.reader(text.splitlines(keepends=True))
    transactions: list[Transaction] = []
    header_seen = False
    for row in reader:
        line = reader.line_num
        if not row:  # a blank physical line
            continue
        if not header_seen:
            header_seen = True
            if [field.strip().lower() for field in row] != _HEADER:
                raise ParseError(path, line, _BAD_HEADER)
            continue
        if len(row) != 3:
            raise ParseError(path, line, f"expected 3 columns, got {len(row)}")
        raw_date, raw_amount, description = row
        transactions.append(
            Transaction(
                date=_parse_date(raw_date, path, line),
                amount=_parse_amount_field(raw_amount, path, line),
                description=description,
            )
        )
    if not header_seen:
        raise ParseError(path, 1, _MISSING_HEADER)
    return transactions


def _parse_date(raw: str, path: str, line: int) -> datetime.date:
    value = raw.strip()
    problem = ParseError(path, line, f"invalid date {value!r}: expected YYYY-MM-DD")
    if not _DATE_RE.match(value):
        raise problem
    try:
        return datetime.datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise problem from None


def _parse_amount_field(raw: str, path: str, line: int) -> Decimal:
    try:
        return parse_amount(raw)
    except ValueError as exc:
        raise ParseError(path, line, str(exc)) from None
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (32 tests)

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV with per-line error reporting"
```

---

## Task 4: Rules parsing and categorization

The spec does not say what happens to a rules line without an `=`, nor to an
unreadable rules file. Silently ignoring a broken rule would silently produce a
wrong report, so a broken rule reuses the same `ParseError` machinery and the
same exit code 2 as a broken transaction row. This is a decision, recorded in the
README in Task 7.

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ParseError` (Task 2).
- Produces:
  - `ledgerlite.rules.parse_rules(text: str, path: str) -> list[tuple[str, str]]` — a list of `(substring, category)` pairs in file order. Blank/whitespace-only lines are skipped. Raises `ParseError`.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — the category of the first rule whose substring appears in `description`, case-insensitively; `None` if none match.

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTests(unittest.TestCase):
    def test_parses_rules_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n", "rules.txt"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_empty_text_yields_no_rules(self):
        self.assertEqual(parse_rules("", "rules.txt"), [])

    def test_skips_blank_lines(self):
        self.assertEqual(
            parse_rules("\ncoffee=food\n   \n\nrent=housing\n", "rules.txt"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_strips_whitespace_around_substring_and_category(self):
        self.assertEqual(
            parse_rules("  coffee  =  food  \n", "rules.txt"),
            [("coffee", "food")],
        )

    def test_splits_on_the_first_equals_sign(self):
        self.assertEqual(
            parse_rules("a=b=c\n", "rules.txt"),
            [("a", "b=c")],
        )

    def test_line_without_equals_is_an_error(self):
        # Review Focus 10: never silently drop a rule.
        with self.assertRaises(ParseError) as ctx:
            parse_rules("coffee=food\njust some text\n", "rules.txt")
        self.assertEqual(
            str(ctx.exception),
            "rules.txt:2: rule has no '=' separator; "
            "expected <substring>=<category>",
        )

    def test_empty_substring_is_an_error(self):
        with self.assertRaises(ParseError) as ctx:
            parse_rules("=food\n", "rules.txt")
        self.assertEqual(
            str(ctx.exception), "rules.txt:1: rule has an empty substring"
        )

    def test_empty_category_is_an_error(self):
        with self.assertRaises(ParseError) as ctx:
            parse_rules("coffee=\n", "rules.txt")
        self.assertEqual(
            str(ctx.exception), "rules.txt:1: rule has an empty category"
        )


class CategorizeTests(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_a_substring_of_the_description(self):
        self.assertEqual(categorize("Coffee Bar, Ltd", self.RULES), "food")

    def test_matching_is_case_insensitive_both_ways(self):
        self.assertEqual(categorize("COFFEE BAR", self.RULES), "food")
        self.assertEqual(categorize("coffee bar", [("COFFEE", "food")]), "food")

    def test_no_match_returns_none(self):
        self.assertIsNone(categorize("Salary March", self.RULES))

    def test_first_matching_rule_wins(self):
        # Review Focus 12: file order beats specificity.
        rules = [("coffee", "food"), ("coffee bar", "treats")]
        self.assertEqual(categorize("Coffee Bar", rules), "food")

    def test_no_rules_returns_none(self):
        self.assertIsNone(categorize("Coffee Bar", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/rules.py`:

```python
"""Read the rules file and use it to categorize descriptions."""

from ledgerlite.parse import ParseError

_NO_SEPARATOR = "rule has no '=' separator; expected <substring>=<category>"


def parse_rules(text: str, path: str) -> list[tuple[str, str]]:
    """Parse `<substring>=<category>` lines, in file order.

    Blank lines are skipped. Raises ParseError on a malformed line.
    """
    rules: list[tuple[str, str]] = []
    for offset, raw in enumerate(text.splitlines()):
        line = offset + 1
        if not raw.strip():
            continue
        if "=" not in raw:
            raise ParseError(path, line, _NO_SEPARATOR)
        substring, category = (part.strip() for part in raw.split("=", 1))
        if not substring:
            raise ParseError(path, line, "rule has an empty substring")
        if not category:
            raise ParseError(path, line, "rule has an empty category")
        rules.append((substring, category))
    return rules


def categorize(description: str, rules: list[tuple[str, str]]) -> str | None:
    """The category of the first rule matching `description`, else None."""
    lowered = description.lower()
    for substring, category in rules:
        if substring.lower() in lowered:
            return category
    return None
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (13 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules parsing and case-insensitive categorization"
```

---

## Task 5: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1).
- Produces:
  - `ledgerlite.balance.order_transactions(transactions: list[Transaction]) -> list[Transaction]` — a new list sorted by date, ties keeping input order.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal` — the running balance after the last transaction in date order; `opening` when there are none.

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_transactions
from ledgerlite.model import Transaction


def tx(day, amount, description):
    return Transaction(
        date=datetime.date(2026, 3, day),
        amount=Decimal(amount),
        description=description,
    )


class OrderTransactionsTests(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [tx(5, "-900.00", "Rent"), tx(4, "-7.50", "Coffee")]
        self.assertEqual(
            [t.description for t in order_transactions(rows)],
            ["Coffee", "Rent"],
        )

    def test_ties_keep_input_order(self):
        rows = [tx(4, "-7.50", "second"), tx(4, "2500.00", "third"), tx(3, "1.00", "first")]
        self.assertEqual(
            [t.description for t in order_transactions(rows)],
            ["first", "second", "third"],
        )

    def test_does_not_mutate_the_input(self):
        rows = [tx(5, "-900.00", "Rent"), tx(4, "-7.50", "Coffee")]
        order_transactions(rows)
        self.assertEqual([t.description for t in rows], ["Rent", "Coffee"])

    def test_empty_list(self):
        self.assertEqual(order_transactions([]), [])


class ClosingBalanceTests(unittest.TestCase):
    def test_adds_every_amount_to_the_opening_balance(self):
        rows = [tx(4, "-7.50", "Coffee"), tx(5, "-900.00", "Rent"), tx(6, "2500.00", "Pay")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1592.50"))

    def test_no_transactions_returns_the_opening_balance(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_result_is_independent_of_input_order(self):
        rows = [tx(6, "2500.00", "Pay"), tx(4, "-7.50", "Coffee")]
        self.assertEqual(
            closing_balance(Decimal("0"), rows),
            closing_balance(Decimal("0"), list(reversed(rows))),
        )

    def test_is_exact_beyond_float_precision(self):
        # Review Focus 14: this fails loudly if a float sneaks in.
        rows = [tx(4, "12345678901234567890.12", "big"), tx(5, "0.01", "small")]
        self.assertEqual(
            closing_balance(Decimal("0"), rows),
            Decimal("12345678901234567890.13"),
        )

    def test_tenths_sum_exactly(self):
        rows = [tx(4, "0.10", "a"), tx(4, "0.20", "b")]
        self.assertEqual(closing_balance(Decimal("0"), rows), Decimal("0.30"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Write the minimal implementation**

Create `ledgerlite/balance.py`:

```python
"""Date ordering and the running balance."""

import operator
from decimal import Decimal

from ledgerlite.model import Transaction


def order_transactions(transactions: list[Transaction]) -> list[Transaction]:
    """Transactions by date. sorted() is stable, so ties keep input order."""
    return sorted(transactions, key=operator.attrgetter("date"))


def closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal:
    """The running balance after the last transaction in date order."""
    total = opening
    for transaction in order_transactions(transactions):
        total += transaction.amount
    return total
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and exact closing balance"
```

---

## Task 6: Amount formatting, category totals, and the report

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1); `categorize` (Task 4).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED` — the string `"uncategorized"`.
  - `ledgerlite.report.format_amount(amount: Decimal) -> str` — two fractional digits, `-` only for genuinely negative values, no thousands separators.
  - `ledgerlite.report.category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> dict[str, Decimal]` — category name to summed amount; unmatched transactions accumulate under `UNCATEGORIZED`. Categories with no transactions do not appear.
  - `ledgerlite.report.format_report(totals: dict[str, Decimal], closing: Decimal) -> str` — the full report, ending in a single trailing newline.

- [ ] **Step 1: Write the failing tests for format_amount**

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
)


def tx(day, amount, description):
    return Transaction(
        date=datetime.date(2026, 3, day),
        amount=Decimal(amount),
        description=description,
    )


class FormatAmountTests(unittest.TestCase):
    def test_pads_to_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_keeps_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")

    def test_zero_has_no_sign(self):
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("0.00")), "0.00")

    def test_negative_zero_has_no_sign(self):
        # Review Focus 2: f"{Decimal('-0.00'):.2f}" is "-0.00".
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_large_values_are_exact(self):
        self.assertEqual(
            format_amount(Decimal("12345678901234567890.13")),
            "12345678901234567890.13",
        )
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement format_amount**

Create `ledgerlite/report.py`:

```python
"""Per-category totals and report formatting."""

from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.rules import categorize

UNCATEGORIZED = "uncategorized"


def format_amount(amount: Decimal) -> str:
    """Two fractional digits, sign only for negatives, no separators."""
    if amount == 0:
        amount = abs(amount)  # Decimal("-0.00") would otherwise print "-0.00"
    return f"{amount:.2f}"
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (6 tests)

- [ ] **Step 5: Write the failing tests for category_totals**

Append to `test_report.py`:

```python
class CategoryTotalsTests(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_sums_amounts_per_category(self):
        rows = [
            tx(4, "-7.50", "Coffee Bar"),
            tx(4, "-2.50", "COFFEE STAND"),
            tx(5, "-900.00", "Rent March"),
        ]
        self.assertEqual(
            category_totals(rows, self.RULES),
            {"food": Decimal("-10.00"), "housing": Decimal("-900.00")},
        )

    def test_unmatched_transactions_go_to_uncategorized(self):
        rows = [tx(6, "2500.00", "Salary"), tx(7, "-3.00", "Mystery")]
        self.assertEqual(
            category_totals(rows, self.RULES),
            {UNCATEGORIZED: Decimal("2497.00")},
        )

    def test_no_rules_means_everything_is_uncategorized(self):
        rows = [tx(4, "-7.50", "Coffee Bar")]
        self.assertEqual(
            category_totals(rows, []), {UNCATEGORIZED: Decimal("-7.50")}
        )

    def test_no_transactions_yields_no_categories(self):
        self.assertEqual(category_totals([], self.RULES), {})

    def test_a_rule_named_uncategorized_merges_with_the_bucket(self):
        # Review Focus 4.
        rows = [tx(4, "-7.50", "Coffee Bar"), tx(5, "-1.00", "Mystery")]
        self.assertEqual(
            category_totals(rows, [("coffee", UNCATEGORIZED)]),
            {UNCATEGORIZED: Decimal("-8.50")},
        )
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `python3 -m unittest test_report.CategoryTotalsTests -v`
Expected: FAIL — `ImportError: cannot import name 'category_totals'`

- [ ] **Step 7: Implement category_totals**

Append to `ledgerlite/report.py`:

```python
def category_totals(
    transactions: list[Transaction], rules: list[tuple[str, str]]
) -> dict[str, Decimal]:
    """Total amount per category. Unmatched rows land in UNCATEGORIZED."""
    totals: dict[str, Decimal] = {}
    for transaction in transactions:
        category = categorize(transaction.description, rules)
        if category is None:
            category = UNCATEGORIZED
        totals[category] = totals.get(category, Decimal("0")) + transaction.amount
    return totals
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (11 tests)

- [ ] **Step 9: Write the failing tests for format_report**

Append to `test_report.py`:

```python
class FormatReportTests(unittest.TestCase):
    def test_matches_the_spec_example(self):
        totals = {
            "housing": Decimal("-900.00"),
            UNCATEGORIZED: Decimal("2500.00"),
            "food": Decimal("-7.50"),
        }
        self.assertEqual(
            format_report(totals, Decimal("1692.50")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_categories_are_alphabetical(self):
        totals = {
            "travel": Decimal("-1.00"),
            "food": Decimal("-2.00"),
            "housing": Decimal("-3.00"),
        }
        self.assertEqual(
            format_report(totals, Decimal("0")).splitlines()[:3],
            ["food: -2.00", "housing: -3.00", "travel: -1.00"],
        )

    def test_uncategorized_is_last_even_though_u_sorts_before_z(self):
        totals = {UNCATEGORIZED: Decimal("1.00"), "zoo": Decimal("2.00")}
        self.assertEqual(
            format_report(totals, Decimal("3.00")).splitlines()[:2],
            ["zoo: 2.00", "uncategorized: 1.00"],
        )

    def test_uncategorized_is_omitted_when_absent(self):
        self.assertEqual(
            format_report({"food": Decimal("-2.00")}, Decimal("8.00")),
            "food: -2.00\n\nclosing balance: 8.00\n",
        )

    def test_no_categories_means_no_leading_blank_line(self):
        # Review Focus 3.
        self.assertEqual(
            format_report({}, Decimal("100")), "closing balance: 100.00\n"
        )

    def test_mixed_case_categories_use_plain_sort_order(self):
        # Review Focus 15: uppercase sorts before lowercase.
        totals = {"food": Decimal("1.00"), "Food": Decimal("2.00")}
        self.assertEqual(
            format_report(totals, Decimal("3.00")).splitlines()[:2],
            ["Food: 2.00", "food: 1.00"],
        )

    def test_ends_with_exactly_one_newline(self):
        report = format_report({"food": Decimal("1.00")}, Decimal("1.00"))
        self.assertTrue(report.endswith("closing balance: 1.00\n"))
        self.assertFalse(report.endswith("\n\n"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 10: Run the tests to verify they fail**

Run: `python3 -m unittest test_report.FormatReportTests -v`
Expected: FAIL — `ImportError: cannot import name 'format_report'`

- [ ] **Step 11: Implement format_report**

Append to `ledgerlite/report.py`:

```python
def format_report(totals: dict[str, Decimal], closing: Decimal) -> str:
    """The full report text, ending in a single newline."""
    lines = [
        f"{name}: {format_amount(totals[name])}"
        for name in sorted(name for name in totals if name != UNCATEGORIZED)
    ]
    if UNCATEGORIZED in totals:
        lines.append(f"{UNCATEGORIZED}: {format_amount(totals[UNCATEGORIZED])}")
    if lines:
        lines.append("")
    lines.append(f"closing balance: {format_amount(closing)}")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 12: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — all tests from Tasks 1-6 (74 tests)

- [ ] **Step 13: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add amount formatting, category totals and report layout"
```

---

## Task 7: CLI, module entry point, and README

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Create: `README.md`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_transactions`, `parse_amount`, `ParseError` (Tasks 2-3); `parse_rules` (Task 4); `closing_balance` (Task 5); `category_totals`, `format_report` (Task 6).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int`. Never raises `SystemExit` for a usage error — it catches argparse's `SystemExit` and returns the code, so tests can call it directly.

Decisions this task locks in:

- Both files are read as `utf-8-sig` (Review Focus 8) with `newline=""` so the `csv` module sees raw terminators.
- Read-and-parse the transactions file first, then the rules file, so when both are broken the transactions error is the one reported (Review Focus 10).
- `--opening` is validated by `parse_amount` through an argparse `type=`, so a bad value is an argparse usage error and exits 2, matching the spec's code for bad input.

- [ ] **Step 1: Write the failing tests for the happy path**

Create `test_cli.py`:

```python
import contextlib
import io
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-05,-900.00,Rent March\n"
    "2026-03-04,-7.50,Coffee Bar\n"
    "2026-03-06,2500.00,Salary\n"
)
RULES = "coffee=food\nrent=housing\n"


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = pathlib.Path(self.tmp.name)

    def write(self, name, text, encoding="utf-8"):
        path = self.dir / name
        path.write_text(text, encoding=encoding)
        return str(path)

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()


class ReportCommandTests(CliTestCase):
    def test_matches_the_spec_example(self):
        txs = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", RULES)
        code, out, err = self.run_cli(
            "report", txs, "--rules", rules, "--opening", "100"
        )
        self.assertEqual(code, 0)
        self.assertEqual(err, "")
        self.assertEqual(
            out,
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_opening_defaults_to_zero(self):
        txs = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_cli("report", txs)
        self.assertEqual(code, 0)
        self.assertEqual(
            out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n"
        )

    def test_without_rules_everything_is_uncategorized(self):
        txs = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_cli("report", txs, "--opening", "100")
        self.assertEqual(code, 0)
        self.assertIn("uncategorized: 1592.50\n", out)

    def test_negative_opening_on_the_command_line(self):
        # Review Focus 11: argparse can mistake "-12.50" for an option.
        txs = self.write("t.csv", "date,amount,description\n")
        code, out, _ = self.run_cli("report", txs, "--opening", "-12.50")
        self.assertEqual(code, 0)
        self.assertEqual(out, "closing balance: -12.50\n")

    def test_negative_opening_with_equals_form(self):
        txs = self.write("t.csv", "date,amount,description\n")
        code, out, _ = self.run_cli("report", txs, "--opening=-12.50")
        self.assertEqual(code, 0)
        self.assertEqual(out, "closing balance: -12.50\n")

    def test_empty_ledger_prints_only_the_closing_balance(self):
        txs = self.write("t.csv", "date,amount,description\n")
        code, out, _ = self.run_cli("report", txs, "--opening", "100")
        self.assertEqual(code, 0)
        self.assertEqual(out, "closing balance: 100.00\n")

    def test_handles_a_utf8_bom_in_both_files(self):
        # Review Focus 8.
        txs = self.write("t.csv", TRANSACTIONS, encoding="utf-8-sig")
        rules = self.write("r.txt", RULES, encoding="utf-8-sig")
        code, out, err = self.run_cli(
            "report", txs, "--rules", rules, "--opening", "100"
        )
        self.assertEqual((code, err), (0, ""))
        self.assertIn("food: -7.50\n", out)
```

- [ ] **Step 2: Write the failing tests for the error paths**

Append to `test_cli.py`:

```python
class UnreadableFileTests(CliTestCase):
    def test_missing_transactions_file(self):
        missing = str(self.dir / "nope.csv")
        code, out, err = self.run_cli("report", missing)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: No such file or directory\n"
        )

    def test_transactions_path_is_a_directory(self):
        # Review Focus 9.
        code, out, err = self.run_cli("report", str(self.dir))
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {self.dir}: "))

    def test_undecodable_transactions_file(self):
        # Review Focus 9: a UnicodeDecodeError is a read failure, not a crash.
        path = self.dir / "binary.csv"
        path.write_bytes(b"\xff\xfe\x00\x01")
        code, out, err = self.run_cli("report", str(path))
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {path}: "))

    @unittest.skipIf(os.geteuid() == 0, "root can read anything")
    def test_permission_denied(self):
        # Review Focus 9.
        path = self.dir / "secret.csv"
        path.write_text(TRANSACTIONS, encoding="utf-8")
        path.chmod(0o000)
        self.addCleanup(path.chmod, 0o600)
        code, out, err = self.run_cli("report", str(path))
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {path}: Permission denied\n"
        )

    def test_missing_rules_file(self):
        # Review Focus 10.
        txs = self.write("t.csv", TRANSACTIONS)
        missing = str(self.dir / "nope.txt")
        code, out, err = self.run_cli("report", txs, "--rules", missing)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: No such file or directory\n"
        )


class MalformedInputTests(CliTestCase):
    def test_malformed_row_rejects_the_whole_file(self):
        txs = self.write(
            "t.csv",
            "date,amount,description\n"
            "2026-03-04,-7.50,Coffee Bar\n"
            "2026-03-05,1.005,Rent\n",
        )
        code, out, err = self.run_cli("report", txs)
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {txs}:3: invalid amount '1.005': expected a decimal "
            "number with at most two fractional digits\n",
        )

    def test_wrong_column_count(self):
        txs = self.write("t.csv", "date,amount,description\n2026-03-04,-7.50\n")
        code, out, err = self.run_cli("report", txs)
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(err, f"ledgerlite: {txs}:2: expected 3 columns, got 2\n")

    def test_bad_date(self):
        txs = self.write("t.csv", "date,amount,description\n04/03/2026,-7.50,C\n")
        code, out, err = self.run_cli("report", txs)
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err,
            f"ledgerlite: {txs}:2: invalid date '04/03/2026': "
            "expected YYYY-MM-DD\n",
        )

    def test_malformed_rules_file(self):
        # Review Focus 10.
        txs = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", "coffee=food\noops\n")
        code, out, err = self.run_cli("report", txs, "--rules", rules)
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err,
            f"ledgerlite: {rules}:2: rule has no '=' separator; "
            "expected <substring>=<category>\n",
        )

    def test_transactions_error_wins_when_both_files_are_bad(self):
        # Review Focus 10.
        txs = self.write("t.csv", "date,amount,description\n2026-03-04,oops,C\n")
        rules = self.write("r.txt", "oops\n")
        code, _, err = self.run_cli("report", txs, "--rules", rules)
        self.assertEqual(code, 2)
        self.assertIn(f"{txs}:2:", err)


class UsageTests(CliTestCase):
    def test_bad_opening_amount_is_a_usage_error(self):
        txs = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_cli("report", txs, "--opening", "1.005")
        self.assertEqual(code, 2)
        self.assertEqual(out, "")

    def test_missing_subcommand_is_a_usage_error(self):
        code, out, _ = self.run_cli()
        self.assertEqual(code, 2)
        self.assertEqual(out, "")

    def test_unknown_subcommand_is_a_usage_error(self):
        code, _, _ = self.run_cli("summarise", "t.csv")
        self.assertEqual(code, 2)

    def test_help_exits_zero(self):
        code, out, _ = self.run_cli("--help")
        self.assertEqual(code, 0)
        self.assertIn("report", out)


class ModuleEntryPointTests(CliTestCase):
    def test_python_dash_m_ledgerlite_runs_the_report(self):
        txs = self.write("t.csv", TRANSACTIONS)
        result = subprocess.run(
            [sys.executable, "-m", "ledgerlite", "report", txs, "--opening", "100"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__)),
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(
            result.stdout, "uncategorized: 1592.50\n\nclosing balance: 1692.50\n"
        )

    def test_module_entry_point_propagates_the_error_exit_code(self):
        result = subprocess.run(
            [sys.executable, "-m", "ledgerlite", "report", "nope.csv"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__)),
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("ledgerlite: cannot read nope.csv: ", result.stderr)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 4: Write the minimal implementation**

Create `ledgerlite/cli.py`:

```python
"""Command-line entry point: argparse, file I/O, exit codes."""

import argparse
import sys
from decimal import Decimal

from ledgerlite.balance import closing_balance
from ledgerlite.parse import ParseError, parse_amount, parse_transactions
from ledgerlite.report import category_totals, format_report
from ledgerlite.rules import parse_rules

PROG = "ledgerlite"


def main(argv: list[str] | None = None) -> int:
    """Run the CLI. Returns the process exit code; never raises SystemExit."""
    try:
        args = _build_parser().parse_args(argv)
    except SystemExit as exc:  # argparse handled --help or a usage error
        return 0 if exc.code is None else int(exc.code)

    try:
        text = _read_text(args.transactions)
    except (OSError, UnicodeDecodeError) as exc:
        return _cannot_read(args.transactions, exc)
    try:
        transactions = parse_transactions(text, args.transactions)
    except ParseError as exc:
        return _malformed(exc)

    rules: list[tuple[str, str]] = []
    if args.rules is not None:
        try:
            rules_text = _read_text(args.rules)
        except (OSError, UnicodeDecodeError) as exc:
            return _cannot_read(args.rules, exc)
        try:
            rules = parse_rules(rules_text, args.rules)
        except ParseError as exc:
            return _malformed(exc)

    totals = category_totals(transactions, rules)
    sys.stdout.write(format_report(totals, closing_balance(args.opening, transactions)))
    return 0


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=PROG, description="Summarize bank transactions by category."
    )
    subcommands = parser.add_subparsers(dest="command", required=True)
    report = subcommands.add_parser(
        "report", help="print per-category totals and the closing balance"
    )
    report.add_argument("transactions", help="path to the transactions CSV")
    report.add_argument("--rules", help="path to the rules file")
    report.add_argument(
        "--opening",
        type=_opening_amount,
        default=Decimal("0"),
        help="opening balance (default: 0)",
    )
    return parser


def _opening_amount(raw: str) -> Decimal:
    try:
        return parse_amount(raw)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from None


def _read_text(path: str) -> str:
    # utf-8-sig strips a byte-order mark; newline="" keeps line terminators
    # intact for the csv module.
    with open(path, encoding="utf-8-sig", newline="") as handle:
        return handle.read()


def _cannot_read(path: str, exc: Exception) -> int:
    reason = getattr(exc, "strerror", None) or str(exc)
    print(f"{PROG}: cannot read {path}: {reason}", file=sys.stderr)
    return 1


def _malformed(exc: ParseError) -> int:
    print(f"{PROG}: {exc}", file=sys.stderr)
    return 2
```

Create `ledgerlite/__main__.py`:

```python
"""Support `python3 -m ledgerlite`."""

from ledgerlite.cli import main

raise SystemExit(main())
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (23 tests)

If `test_transactions_path_is_a_directory` fails on your platform because
opening a directory raises something other than `OSError`, do not weaken the
assertion — widen the caught exception type in `_read_text`'s caller instead.

- [ ] **Step 6: Write the README**

Create `README.md`:

```markdown
# ledgerlite

Read a CSV of bank transactions, categorize each one with a rules file, and
print a per-category summary with the closing balance. Standard library only,
Python 3.11+.

## Usage

    python3 -m ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]

    $ python3 -m ledgerlite report march.csv --rules rules.txt --opening 100
    food: -7.50
    housing: -900.00
    uncategorized: 2500.00

    closing balance: 1692.50

Categories are listed alphabetically, `uncategorized` always last. Amounts
print with exactly two fractional digits and no thousands separators.

## Transactions CSV

Header row `date,amount,description`, then one row per transaction:

- `date` — ISO 8601, `2026-03-04`.
- `amount` — a decimal number with at most two fractional digits; negative for
  money out. Parsed exactly, as `decimal.Decimal`.
- `description` — free text.

Rows may appear in any order; the report orders them by date, ties keeping
input order.

## Rules file

One rule per line, `<substring>=<category>`:

    coffee=food
    rent=housing

Matching is case-insensitive on the description and the first matching rule
wins. A transaction matching no rule is `uncategorized`. Blank lines are
ignored.

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Report printed. |
| 1 | An input file could not be read: `ledgerlite: cannot read <path>: <reason>` |
| 2 | A malformed row, or a usage error: `ledgerlite: <path>:<line>: <what is wrong>` |

A single malformed row rejects the whole file; nothing is printed to stdout.

## Notes on decisions the spec left open

- A malformed or unreadable `--rules` file is treated exactly like the
  transactions file (exit 2 and exit 1 respectively) rather than being ignored.
  When both files are bad, the transactions error is reported.
- An empty file or a wrong header row is a line-1 malformed-row error, so a
  data row is never silently consumed as a header.
- With no transactions the report is just `closing balance: <opening>` — no
  category lines and no leading blank line.
- A negative opening balance works as `--opening -12.50` and as
  `--opening=-12.50`.

## Tests

    python3 -m unittest
```

- [ ] **Step 7: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — every test from Tasks 1-7 (97 tests), no errors, no skips
other than the root-only permission test.

- [ ] **Step 8: Verify the spec's example end to end by hand**

```bash
printf 'date,amount,description\n2026-03-05,-900.00,Rent March\n2026-03-04,-7.50,Coffee Bar\n2026-03-06,2500.00,Salary\n' > /tmp/ll-t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/ll-r.txt
python3 -m ledgerlite report /tmp/ll-t.csv --rules /tmp/ll-r.txt --opening 100
echo "exit=$?"
```

Expected, byte for byte:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit=0
```

- [ ] **Step 9: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py README.md
git commit -m "feat: add ledgerlite report CLI with spec exit codes and README"
```
