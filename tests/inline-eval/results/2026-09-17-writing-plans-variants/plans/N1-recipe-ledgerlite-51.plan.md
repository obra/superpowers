# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library Python package with a `report` command that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired together only at the CLI layer: `parse` turns CSV text into `Transaction` objects (raising `ParseError` with a line number), `rules` turns rules text into ordered `(substring, category)` pairs and answers `categorize()`, `balance` orders by date and computes the closing balance, `report` formats amounts and assembles the report string, `cli` does the file I/O, error messages, and exit codes. Every function takes and returns plain values (text in, text out), so all tests are pure and no test needs a temp file except the CLI's.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `dataclasses`, `argparse`, `pathlib`), `unittest` for tests.

**Spec:** `design.md` (repo root)

## Global Constraints

- Python 3.11+. **Standard library only** — no third-party packages, no new dependency files.
- Money is `decimal.Decimal` everywhere. Never `float`, not even in a test.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Amounts are printed with exactly two fractional digits, a leading `-` for negatives, and no thousands separators: `-12.50`, `0.00`, `1200.00`.
- Error text is exact, to stderr, one line, no traceback:
  - unreadable file: `ledgerlite: cannot read <path>: <reason>` → exit 1
  - malformed line: `ledgerlite: <path>:<line>: <what is wrong>` → exit 2
  - `<path>` is the path exactly as the user typed it on the command line.
- Success prints the report to stdout and exits 0. On exit 2 nothing at all is printed to stdout.
- `--opening` defaults to `0`; `--rules` is optional.

**Assumptions this plan makes where the spec is silent** (each is pinned by a test; flag them if you disagree):

1. The header row is validated. A file whose first row is not `date,amount,description` is a malformed file at line 1 — otherwise a headerless CSV silently loses its first transaction.
2. The rules file gets the same error contract as the transactions file: unreadable → exit 1, a line that is not `<substring>=<category>` → exit 2 with that line number.
3. A category is listed only if at least one transaction has it, so `uncategorized` appears only when something is uncategorized. "Always listed last" is about ordering, not presence.
4. The package gets a two-line `ledgerlite/__main__.py` (not in the spec's layout) so the tool is runnable as `python3 -m ledgerlite report ...`.

## Review Focus

Five things the spec implies that a careless implementation gets wrong; each has a named test in the task that owns the code.

1. `Decimal("NaN")` and `Decimal("Infinity")` succeed — an amount column containing `NaN` must be rejected as malformed, not silently become a poison value that infects every total (Task 1).
2. A transactions file with no header row, or an empty file, must be rejected at line 1 rather than quietly dropping the first data row (Task 1).
3. A category whose amounts cancel out, or an input amount of `-0.00`, must print `0.00`, never `-0.00` (Task 4).
4. A rules file that cannot be read, or a rules line missing its `=`, must produce a real error with the rules path in it — not a traceback and not a silent "nothing matched" report (Task 2 for the line, Task 5 for the read failure).
5. A valid file with a header and zero data rows must still print a report: no category lines, a blank line, then `closing balance: <opening>` (Task 4).

---

### Task 1: Transaction model and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py` (empty), `ledgerlite/model.py`, `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that order.
  - `ledgerlite.parse.ParseError(Exception)` with `__init__(self, line: int, message: str)` storing `self.line` and `self.message`.
  - `ledgerlite.parse.parse_amount(raw: str) -> Decimal` — raises `ValueError` whose `str()` is the ready-to-print reason.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — file order preserved, raises `ParseError`.

- [ ] **Step 1: Write the failing happy-path tests in `test_parse.py`**

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_transactions

HEADER = "date,amount,description\n"


class ParseTransactionsTests(unittest.TestCase):
    def test_parses_rows_in_file_order(self):
        text = HEADER + "2026-03-04,-7.50,Coffee shop\n2026-03-01,2500.00,Salary\n"
        self.assertEqual(
            parse_transactions(text),
            [
                Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee shop"),
                Transaction(datetime.date(2026, 3, 1), Decimal("2500.00"), "Salary"),
            ],
        )

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_accepts_fewer_than_two_fractional_digits(self):
        text = HEADER + "2026-03-04,1.5,a\n2026-03-05,2,b\n"
        self.assertEqual(
            [t.amount for t in parse_transactions(text)],
            [Decimal("1.5"), Decimal("2")],
        )

    def test_quoted_description_may_contain_a_comma(self):
        text = HEADER + '2026-03-04,-1.00,"Cafe, downtown"\n'
        self.assertEqual(parse_transactions(text)[0].description, "Cafe, downtown")


class ParseAmountTests(unittest.TestCase):
    def test_parses_negative_two_digit_amount(self):
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))

    def test_rejects_three_fractional_digits(self):
        with self.assertRaises(ValueError):
            parse_amount("1.005")

    def test_rejects_values_that_are_not_finite_numbers(self):
        for raw in ["", "abc", "NaN", "Infinity", "-inf"]:
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                parse_amount(raw)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Create the package and implement `Transaction`, `ParseError`, `parse_amount`, `parse_transactions`**

- `ledgerlite/__init__.py`: empty.
- `ledgerlite/model.py`: `@dataclass(frozen=True)` `Transaction` with the fields from the Interfaces block.
- `ledgerlite/parse.py`: read the CSV with `csv.reader(io.StringIO(text))`. Take the row's line number from `reader.line_num` (it counts physical lines, so the first data row is 2 and quoted embedded newlines stay correct — do **not** use `enumerate`). Parse dates with `datetime.date.fromisoformat` on the stripped field. Build the list in reader order; do not sort here.
- `parse_amount` is the one place that decides what a valid amount is:

```python
def parse_amount(raw: str) -> Decimal:
    try:
        value = Decimal(raw.strip())
    except InvalidOperation:
        raise ValueError(f"invalid amount: {raw!r}") from None
    if not value.is_finite():
        raise ValueError(f"invalid amount: {raw!r}")
    if value.as_tuple().exponent < -2:
        raise ValueError(f"amount has more than two fractional digits: {raw!r}")
    return value
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS

- [ ] **Step 5: Add the failing malformed-input tests to `test_parse.py`**

```python
class MalformedFileTests(unittest.TestCase):
    def assert_parse_error(self, text, line, message):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual((ctx.exception.line, ctx.exception.message), (line, message))

    def test_missing_header_row(self):
        self.assert_parse_error(
            "2026-03-04,-7.50,Coffee\n", 1, "expected header date,amount,description"
        )

    def test_empty_file(self):
        self.assert_parse_error("", 1, "expected header date,amount,description")

    def test_too_few_columns(self):
        self.assert_parse_error(HEADER + "2026-03-04,-7.50\n", 2, "expected 3 columns, got 2")

    def test_too_many_columns(self):
        self.assert_parse_error(HEADER + "2026-03-04,-7.50,a,b\n", 2, "expected 3 columns, got 4")

    def test_unparseable_date(self):
        self.assert_parse_error(
            HEADER + "2026-13-01,-7.50,Coffee\n", 2, "invalid date: '2026-13-01'"
        )

    def test_line_number_counts_the_header(self):
        text = HEADER + "2026-03-04,-7.50,Coffee\n2026-03-05,seven,Tea\n"
        self.assert_parse_error(text, 3, "invalid amount: 'seven'")

    def test_amount_with_three_fractional_digits(self):
        self.assert_parse_error(
            HEADER + "2026-03-04,1.005,Coffee\n",
            2,
            "amount has more than two fractional digits: '1.005'",
        )

    def test_non_finite_amount_is_rejected(self):
        self.assert_parse_error(HEADER + "2026-03-04,NaN,Coffee\n", 2, "invalid amount: 'NaN'")
```

- [ ] **Step 6: Run the tests to verify the new ones fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL on the `MalformedFileTests` cases

- [ ] **Step 7: Add validation to `parse_transactions`**

Header check: compare `[c.strip().lower() for c in header]` to `["date", "amount", "description"]`; a missing first row (`StopIteration`) and a wrong first row both raise `ParseError(1, "expected header date,amount,description")`. Then per row: column count, then date, then amount — reusing `parse_amount` and passing `str(exc)` through as the `ParseError` message.

- [ ] **Step 8: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS

- [ ] **Step 9: Commit**

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
- Consumes: `ledgerlite.parse.ParseError`.
- Produces:
  - `ledgerlite.rules.Rule` — `NamedTuple` with `substring: str` (stored lowercased) and `category: str`; compares equal to a plain 2-tuple.
  - `ledgerlite.rules.parse_rules(text: str) -> list[Rule]` — file order preserved, raises `ParseError`.
  - `ledgerlite.rules.categorize(description: str, rules: Sequence[Rule]) -> str | None`.

- [ ] **Step 1: Write the failing tests in `test_rules.py`**

```python
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTests(unittest.TestCase):
    def test_parses_rules_in_file_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_lowercases_the_substring_and_strips_whitespace(self):
        self.assertEqual(parse_rules("  Coffee = food  \n"), [("coffee", "food")])

    def test_blank_lines_are_ignored_but_still_counted(self):
        with self.assertRaises(ParseError) as ctx:
            parse_rules("coffee=food\n\noops\n")
        self.assertEqual(ctx.exception.line, 3)

    def test_splits_on_the_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_line_without_equals_is_an_error(self):
        with self.assertRaises(ParseError) as ctx:
            parse_rules("coffee food\n")
        self.assertEqual(
            (ctx.exception.line, ctx.exception.message),
            (1, "rule must be <substring>=<category>"),
        )

    def test_empty_substring_or_category_is_an_error(self):
        for text in ["=food\n", "coffee=\n"]:
            with self.subTest(text=text), self.assertRaises(ParseError):
                parse_rules(text)


class CategorizeTests(unittest.TestCase):
    def test_matches_substring_case_insensitively(self):
        rules = parse_rules("coffee=food\n")
        self.assertEqual(categorize("BLUE BOTTLE COFFEE", rules), "food")

    def test_first_matching_rule_wins(self):
        rules = parse_rules("coffee=food\ncoffee=treats\n")
        self.assertEqual(categorize("Coffee shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", parse_rules("coffee=food\n")))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee shop", []))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `Rule`, `parse_rules`, and `categorize` in `ledgerlite/rules.py`**

Iterate with `enumerate(text.splitlines(), start=1)` so the line number is the physical line. Skip lines that are empty after `strip()`. Split with `line.split("=", 1)`; strip both halves; either half empty (or no `=`) raises `ParseError(line, "rule must be <substring>=<category>")`. `categorize` lowercases the description once, then returns the first rule whose substring is `in` it, else `None`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS

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
- Consumes: `ledgerlite.model.Transaction`.
- Produces:
  - `ledgerlite.balance.order_by_date(transactions: Sequence[Transaction]) -> list[Transaction]` — stable, so same-date rows keep input order.
  - `ledgerlite.balance.closing_balance(transactions: Sequence[Transaction], opening: Decimal) -> Decimal`.

- [ ] **Step 1: Write the failing tests in `test_balance.py`**

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(datetime.date(2026, 3, day), Decimal(amount), description)


class OrderByDateTests(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(4, "1.00", "b"), txn(1, "2.00", "a")]
        self.assertEqual([t.description for t in order_by_date(rows)], ["a", "b"])

    def test_same_date_keeps_input_order(self):
        rows = [txn(1, "1.00", "first"), txn(1, "2.00", "second")]
        self.assertEqual(
            [t.description for t in order_by_date(rows)], ["first", "second"]
        )

    def test_does_not_mutate_its_input(self):
        rows = [txn(4, "1.00", "b"), txn(1, "2.00", "a")]
        order_by_date(rows)
        self.assertEqual([t.description for t in rows], ["b", "a"])


class ClosingBalanceTests(unittest.TestCase):
    def test_adds_every_amount_to_the_opening_balance(self):
        rows = [txn(4, "-7.50"), txn(1, "2500.00"), txn(2, "-900.00")]
        self.assertEqual(closing_balance(rows, Decimal("100")), Decimal("1692.50"))

    def test_no_transactions_returns_the_opening_balance(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))

    def test_arithmetic_is_exact(self):
        rows = [txn(1, "0.10"), txn(2, "0.20")]
        self.assertEqual(closing_balance(rows, Decimal("0")), Decimal("0.30"))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `order_by_date` and `closing_balance` in `ledgerlite/balance.py`**

`order_by_date` returns `sorted(transactions, key=lambda t: t.date)` (Python's sort is stable, and `sorted` leaves the caller's list alone). `closing_balance` starts at `opening` and accumulates the amounts of `order_by_date(transactions)` in order.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: date-ordered running balance and closing balance"
```

---

### Task 4: Category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction`, `Rule`, `categorize`, `closing_balance`.
- Produces:
  - `ledgerlite.report.UNCATEGORIZED: str = "uncategorized"`
  - `ledgerlite.report.format_amount(amount: Decimal) -> str`
  - `ledgerlite.report.category_totals(transactions: Sequence[Transaction], rules: Sequence[Rule]) -> list[tuple[str, Decimal]]` — alphabetical, `UNCATEGORIZED` last, categories with no transactions absent.
  - `ledgerlite.report.format_report(transactions: Sequence[Transaction], rules: Sequence[Rule], opening: Decimal) -> str` — the whole report, ending in exactly one `"\n"`.

- [ ] **Step 1: Write the failing tests in `test_report.py`**

```python
import datetime
import unittest
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report
from ledgerlite.rules import parse_rules

RULES = parse_rules("coffee=food\nrent=housing\n")
EXAMPLE = [
    Transaction(datetime.date(2026, 3, 4), Decimal("-7.50"), "Coffee shop"),
    Transaction(datetime.date(2026, 3, 1), Decimal("2500.00"), "Salary"),
    Transaction(datetime.date(2026, 3, 2), Decimal("-900.00"), "Rent March"),
]


class FormatAmountTests(unittest.TestCase):
    def test_formats_two_fractional_digits(self):
        cases = [
            ("-12.5", "-12.50"),
            ("0", "0.00"),
            ("1200", "1200.00"),
            ("1234567.89", "1234567.89"),
        ]
        for raw, expected in cases:
            with self.subTest(raw=raw):
                self.assertEqual(format_amount(Decimal(raw)), expected)

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")


class CategoryTotalsTests(unittest.TestCase):
    def test_alphabetical_with_uncategorized_last(self):
        rules = parse_rules("coffee=food\nsalary=zzz\n")
        self.assertEqual(
            category_totals(EXAMPLE, rules),
            [("food", Decimal("-7.50")), ("zzz", Decimal("2500.00")),
             ("uncategorized", Decimal("-900.00"))],
        )

    def test_sums_amounts_within_a_category(self):
        rows = EXAMPLE + [Transaction(datetime.date(2026, 3, 5), Decimal("-2.50"), "coffee")]
        self.assertEqual(dict(category_totals(rows, RULES))["food"], Decimal("-10.00"))

    def test_no_transactions_means_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_uncategorized_absent_when_everything_matches(self):
        rows = [EXAMPLE[0]]
        self.assertEqual([name for name, _ in category_totals(rows, RULES)], ["food"])


class FormatReportTests(unittest.TestCase):
    def test_matches_the_design_example(self):
        self.assertEqual(
            format_report(EXAMPLE, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_reports_the_opening_balance(self):
        self.assertEqual(
            format_report([], RULES, Decimal("100")), "\nclosing balance: 100.00\n"
        )

    def test_cancelling_category_prints_zero_not_negative_zero(self):
        rows = [
            Transaction(datetime.date(2026, 3, 1), Decimal("-5.00"), "Coffee"),
            Transaction(datetime.date(2026, 3, 2), Decimal("5.00"), "Coffee refund"),
        ]
        self.assertEqual(
            format_report(rows, RULES, Decimal("0")),
            "food: 0.00\n\nclosing balance: 0.00\n",
        )

    def test_no_rules_means_everything_is_uncategorized(self):
        self.assertEqual(
            format_report(EXAMPLE, [], Decimal("0")),
            "uncategorized: 1592.50\n\nclosing balance: 1592.50\n",
        )
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `format_amount`, `category_totals`, and `format_report` in `ledgerlite/report.py`**

```python
def format_amount(amount: Decimal) -> str:
    value = amount.quantize(Decimal("0.01"))
    if value == 0:                 # kills "-0.00"
        value = abs(value)
    return f"{value:f}"            # ":f" never adds thousands separators
```

`category_totals`: accumulate into a `dict[str, Decimal]` keyed by `categorize(...) or UNCATEGORIZED`, then return the non-`UNCATEGORIZED` names `sorted()` followed by `UNCATEGORIZED` if it is present. `format_report`: one `"<name>: <amount>"` line per pair, then `""`, then `f"closing balance: {format_amount(closing_balance(transactions, opening))}"`, joined with `"\n"` plus a trailing `"\n"`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: per-category totals and report formatting"
```

---

### Task 5: CLI, exit codes, and error messages

**Files:**
- Create: `ledgerlite/cli.py`, `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_amount`, `parse_transactions`, `ParseError`, `parse_rules`, `format_report`.
- Produces:
  - `ledgerlite.cli.build_parser() -> argparse.ArgumentParser`
  - `ledgerlite.cli.main(argv: Sequence[str] | None = None) -> int`

- [ ] **Step 1: Write the failing tests in `test_cli.py`**

```python
import contextlib
import errno
import io
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-04,-7.50,Coffee shop\n"
    "2026-03-01,2500.00,Salary\n"
    "2026-03-02,-900.00,Rent March\n"
)
EXPECTED = (
    "food: -7.50\n"
    "housing: -900.00\n"
    "uncategorized: 2500.00\n"
    "\n"
    "closing balance: 1692.50\n"
)


class CliTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)

    def write(self, name, text):
        path = self.dir / name
        path.write_text(text, encoding="utf-8")
        return str(path)

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_reports_the_design_example(self):
        txns = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", "coffee=food\nrent=housing\n")
        self.assertEqual(
            self.run_cli("report", txns, "--rules", rules, "--opening", "100"),
            (0, EXPECTED, ""),
        )

    def test_without_rules_everything_is_uncategorized(self):
        txns = self.write("t.csv", TRANSACTIONS)
        code, out, err = self.run_cli("report", txns)
        self.assertEqual((code, err), (0, ""))
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_missing_transactions_file(self):
        missing = str(self.dir / "nope.csv")
        code, out, err = self.run_cli("report", missing)
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: {os.strerror(errno.ENOENT)}\n"
        )

    def test_missing_rules_file(self):
        txns = self.write("t.csv", TRANSACTIONS)
        missing = str(self.dir / "nope.txt")
        code, out, err = self.run_cli("report", txns, "--rules", missing)
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: {os.strerror(errno.ENOENT)}\n"
        )

    def test_malformed_row_prints_nothing_to_stdout(self):
        txns = self.write("t.csv", "date,amount,description\n2026-03-04,1.005,Coffee\n")
        code, out, err = self.run_cli("report", txns)
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err,
            f"ledgerlite: {txns}:2: amount has more than two fractional digits: '1.005'\n",
        )

    def test_malformed_rules_line(self):
        txns = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", "coffee=food\noops\n")
        code, out, err = self.run_cli("report", txns, "--rules", rules)
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(err, f"ledgerlite: {rules}:2: rule must be <substring>=<category>\n")

    def test_undecodable_transactions_file_cannot_be_read(self):
        path = self.dir / "bad.csv"
        path.write_bytes(b"date,amount,description\n2026-03-04,-1.00,\xff\xfe\n")
        code, out, err = self.run_cli("report", str(path))
        self.assertEqual((code, out), (1, ""))
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {path}: "), err)

    def test_bad_opening_amount(self):
        txns = self.write("t.csv", TRANSACTIONS)
        code, out, err = self.run_cli("report", txns, "--opening", "1.005")
        self.assertEqual((code, out), (2, ""))
        self.assertIn("1.005", err)

    def test_runs_as_a_module(self):
        txns = self.write("t.csv", TRANSACTIONS)
        proc = subprocess.run(
            [sys.executable, "-m", "ledgerlite", "report", txns, "--opening", "100"],
            capture_output=True,
            text=True,
            cwd=str(Path(__file__).parent),
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(proc.stdout, "uncategorized: 1592.50\n\nclosing balance: 1692.50\n")
```

Note on the last test: it passes no `--rules`, so every transaction is uncategorized (`1592.50`) while the closing balance also includes the opening `100`, giving `1692.50`. `cwd` is the repo root (where this test file lives) so that `-m ledgerlite` resolves.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `build_parser` and `main` in `ledgerlite/cli.py`**

- `build_parser`: `ArgumentParser(prog="ledgerlite")` with `add_subparsers(dest="command", required=True)` and one `report` subparser holding positional `transactions` (metavar `TRANSACTIONS`), `--rules` (default `None`), and `--opening` with `default=Decimal("0")` and `type=_opening`, where `_opening` calls `parse_amount` and re-raises `ValueError` as `argparse.ArgumentTypeError(str(exc))`.
- `main` must return an int for every path, including argparse's:

```python
def main(argv=None) -> int:
    try:
        args = build_parser().parse_args(argv)
    except SystemExit as exc:      # argparse already printed the message
        return int(exc.code or 0)
```

- Then, for the transactions path and (if given) the rules path: read with `Path(p).read_text(encoding="utf-8")`, catching `(OSError, UnicodeDecodeError)` and printing `f"ledgerlite: cannot read {p}: {reason}"` to stderr and returning 1. `reason` is `exc.strerror` when it is set, otherwise `str(exc)` — put that in one `_reason(exc) -> str` helper.
- Then parse each text, catching `ParseError` and printing `f"ledgerlite: {p}:{exc.line}: {exc.message}"` to stderr and returning 2. Read and parse the transactions file before touching the rules file.
- Nothing may be written to stdout before both files have parsed cleanly. Finish with `sys.stdout.write(format_report(transactions, rules, args.opening))` and `return 0`.

- [ ] **Step 4: Create `ledgerlite/__main__.py`**

```python
import sys

from ledgerlite.cli import main

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 5: Run the CLI tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS

- [ ] **Step 6: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS, every `test_*.py` collected, zero failures and zero errors

- [ ] **Step 7: Check the real command by hand**

```bash
printf 'date,amount,description\n2026-03-04,-7.50,Coffee shop\n2026-03-01,2500.00,Salary\n2026-03-02,-900.00,Rent March\n' > /tmp/t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/r.txt
python3 -m ledgerlite report /tmp/t.csv --rules /tmp/r.txt --opening 100
```

Expected: exactly the example block from `design.md`, and `echo $?` prints 0.

- [ ] **Step 8: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add report command with exit codes and error messages"
```
