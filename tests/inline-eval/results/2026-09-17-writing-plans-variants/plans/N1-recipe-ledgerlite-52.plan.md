# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only Python CLI that reads a bank-transaction CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** A small pure-function library (`model` → `parse` → `rules` → `balance` → `report`) with all I/O, argument parsing, and exit codes confined to `cli.py`. Every function below the CLI takes already-read text lines or in-memory objects, so every behavior in the spec is unit-testable without touching the filesystem. Money is `decimal.Decimal` end to end.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `dataclasses`, `re`, `unittest`).

**Spec:** `design.md` (in the repo root, alongside this plan)

## Global Constraints

- Python 3.11+. **Standard library only** — no third-party imports, no dependency files.
- Money is `decimal.Decimal` everywhere. **Never** construct a `Decimal` from a `float`, and never convert an amount to `float`.
- Amounts print with exactly two fractional digits, a leading `-` for negatives, and no thousands separators: `-12.50`, `0.00`, `1200.00`.
- Exit codes: `0` success, `1` a named file cannot be read, `2` malformed input.
- Exact stderr formats (single line, no trailing period):
  - `ledgerlite: cannot read <path>: <reason>`
  - `ledgerlite: <path>:<line>: <what is wrong>`
- On exit 2, **nothing** is written to stdout — the whole file is rejected.
- Rule matching is case-insensitive on the description; the **first** matching rule wins.
- Package lives in `ledgerlite/`. Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Work directly on `main`; this is a local scratch repo with no remote. Commit at the end of every task.

## Review Focus

Five input classes the spec implies but does not spell out. Each already has a test assigned to the task that owns the code; the assignment is listed so a reviewer can find it.

1. **A transactions file with no usable header** — a zero-byte file, or a headerless file whose first data row would be silently swallowed as a header, must be rejected rather than quietly dropping a transaction. Same class: a UTF-8 BOM or CRLF line endings must not corrupt the header or the last field. → Task 1 (header validation) and Task 5 (`utf-8-sig`, `newline=""` reading).
2. **Amount spellings `Decimal()` accepts but the spec does not** — `NaN`, `Infinity`, `1e3`, `1_000` must be reported as invalid amounts, not folded into a total (a `NaN` amount would poison every total silently). → Task 1 (`parse_amount` regex).
3. **A total that is exactly zero but carries a negative sign** — `Decimal("-0.00")` formats as `-0.00`; the spec says zero prints `0.00`. → Task 4 (`format_amount`).
4. **A rules file that is unreadable or contains a line without `=`** — a typo like `coffee food` would otherwise match nothing and the user would see unexplained `uncategorized` totals. The spec gives no rules-file error path, so this plan reuses the two it defines: unreadable rules file → exit 1 `cannot read`; malformed rule line → exit 2 `<path>:<line>: <what is wrong>`. → Task 2 (rule-line errors) and Task 5 (read failure).
5. **Category names whose ordering or identity is ambiguous** — "alphabetically" must not put `Food` before `bank` on a capitalization technicality, and a rule whose category is literally `uncategorized` must merge into the uncategorized bucket and still print last. → Task 4 (ordering tests).

## File Structure

| File | Responsibility |
| --- | --- |
| `ledgerlite/__init__.py` | Empty package marker. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. No logic. |
| `ledgerlite/parse.py` | `ParseError`, `parse_amount`, `parse_transactions`. Owns every "this row is malformed" decision for the CSV. |
| `ledgerlite/rules.py` | `parse_rules`, `categorize`. Owns rule-line syntax and case-insensitive matching. |
| `ledgerlite/balance.py` | `order_by_date`, `closing_balance`. Owns the spec's ordering rule. |
| `ledgerlite/report.py` | `UNCATEGORIZED`, `format_amount`, `category_totals`, `format_report`. Owns all output text. |
| `ledgerlite/cli.py` | `main(argv) -> int`: argparse, file reading, error messages, exit codes. |
| `ledgerlite/__main__.py` | Two-line shim so `python3 -m ledgerlite` works. (Not in the spec's layout list; without it the tool cannot be run, only imported.) |
| `test_parse.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py` | Root-level unittest modules, one per implementation module. |

`rules.py` imports `ParseError` from `parse.py` (the spec assigns `ParseError` to `parse.py`, and `parse.py` imports nothing from `rules.py`, so there is no cycle).

---

### Task 1: Package skeleton, `Transaction`, and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py` (empty), `ledgerlite/model.py`, `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that order.
  - `ledgerlite.parse.ParseError(line: int, message: str)` — exception with attributes `.line: int` and `.message: str`.
  - `ledgerlite.parse.parse_amount(text: str) -> decimal.Decimal` — raises `ValueError` whose `str()` is the ready-to-print `<what is wrong>` text.
  - `ledgerlite.parse.parse_transactions(lines: Iterable[str]) -> list[Transaction]` — raises `ParseError`. Returns transactions in **input order** (ordering is Task 3's job).
  - `ledgerlite.parse.HEADER = ["date", "amount", "description"]`

- [ ] **Step 1: Write the failing happy-path test in `test_parse.py`**

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_transactions


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        lines = [
            "date,amount,description\n",
            "2026-03-05,-7.50,Coffee Bar\n",
            "2026-03-04,2500.00,ACME Salary\n",
        ]
        self.assertEqual(
            parse_transactions(lines),
            [
                Transaction(date(2026, 3, 5), Decimal("-7.50"), "Coffee Bar"),
                Transaction(date(2026, 3, 4), Decimal("2500.00"), "ACME Salary"),
            ],
        )

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(["date,amount,description\n"]), [])

    def test_blank_lines_are_skipped(self):
        lines = ["date,amount,description\n", "\n", "2026-03-04,1.5,Tip\n", "\n"]
        self.assertEqual(
            parse_transactions(lines),
            [Transaction(date(2026, 3, 4), Decimal("1.5"), "Tip")],
        )

    def test_one_and_two_fractional_digits_both_parse(self):
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))
        self.assertEqual(parse_amount("-12"), Decimal("-12"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Create `ledgerlite/__init__.py` (empty) and `Transaction` in `ledgerlite/model.py`**

Use `@dataclasses.dataclass(frozen=True)` so instances compare by value (the tests above rely on `==`).

- [ ] **Step 4: Write the failing rejection tests in `test_parse.py`**

Add to the same file. `assertRaises(...)` as a context manager, asserting both `.line` and `.message`, since the CLI prints both.

```python
class ParseRejectionTest(unittest.TestCase):
    def _error(self, lines):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(lines)
        return caught.exception

    def test_empty_file_is_rejected(self):
        error = self._error([])
        self.assertEqual(error.line, 1)
        self.assertEqual(error.message, 'expected header "date,amount,description"')

    def test_missing_header_is_rejected_not_swallowed(self):
        error = self._error(["2026-03-04,1.00,Tip\n"])
        self.assertEqual(error.line, 1)
        self.assertEqual(error.message, 'expected header "date,amount,description"')

    def test_wrong_column_count(self):
        error = self._error(["date,amount,description\n", "2026-03-04,1.00\n"])
        self.assertEqual(error.line, 2)
        self.assertEqual(error.message, "expected 3 columns, got 2")

    def test_unparseable_date(self):
        error = self._error(["date,amount,description\n", "04/03/2026,1.00,Tip\n"])
        self.assertEqual(error.line, 2)
        self.assertEqual(error.message, 'invalid date "04/03/2026"')

    def test_too_many_fractional_digits(self):
        error = self._error(["date,amount,description\n", "2026-03-04,1.005,Tip\n"])
        self.assertEqual(error.line, 2)
        self.assertEqual(
            error.message, 'amount "1.005" has more than two fractional digits'
        )

    def test_reports_the_second_bad_row_by_its_own_line_number(self):
        lines = [
            "date,amount,description\n",
            "2026-03-04,1.00,Tip\n",
            "2026-03-05,nope,Tip\n",
        ]
        self.assertEqual(self._error(lines).line, 3)

    def test_amount_spellings_decimal_accepts_but_spec_does_not(self):
        for value in ["NaN", "Infinity", "1e3", "1_000", "1.2.3", ""]:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    parse_amount(value)
```

- [ ] **Step 5: Run the tests to verify every one fails for the same reason**

Run: `python3 -m unittest test_parse -v`
Expected: 11 tests FAIL — `ImportError: cannot import name 'ParseError' from 'ledgerlite.parse'` (or `ModuleNotFoundError`, since `parse.py` does not exist yet)

- [ ] **Step 6: Implement `parse_amount(text: str) -> Decimal` in `ledgerlite/parse.py`**

Validate with a module-level regex before touching `Decimal`, because `Decimal()` accepts `NaN`, `Infinity`, `1e3`, and `1_000`, none of which the spec allows:

```python
_AMOUNT_RE = re.compile(r"^[+-]?\d*\.?\d+$")
```

- `text.strip()` first.
- No regex match → `raise ValueError(f'invalid amount "{text}"')`.
- More than two digits after the `.` → `raise ValueError(f'amount "{text}" has more than two fractional digits')`.
- Otherwise return `Decimal(stripped)`.

- [ ] **Step 7: Implement `ParseError` and `parse_transactions` in `ledgerlite/parse.py`**

`ParseError.__init__(self, line, message)` stores `self.line` and `self.message` and calls `super().__init__(f"line {line}: {message}")`.

`parse_transactions` walks `csv.reader(lines)` and uses `reader.line_num` as the line number (it counts physical lines, so it stays correct for quoted fields containing newlines). Per row:
- Row is `[]` (a blank line) → skip, wherever it appears.
- First non-blank row is the header: compare `[field.strip().lower() for field in row]` against `HEADER`; mismatch → `ParseError(line, 'expected header "date,amount,description"')`. Do not emit a transaction for it.
- Not exactly 3 fields → `ParseError(line, f"expected 3 columns, got {len(row)}")`.
- Date: `datetime.datetime.strptime(value.strip(), "%Y-%m-%d").date()`; `ValueError` → `ParseError(line, f'invalid date "{value}"')`. Use `strptime`, not `date.fromisoformat`, which also accepts `20260304`.
- Amount: `parse_amount(value)`; catch `ValueError as exc` → `ParseError(line, str(exc))`.
- Description: used verbatim, not stripped.

Raise on the first bad row; the caller prints nothing to stdout.

- [ ] **Step 8: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (11 tests)

- [ ] **Step 9: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Transaction objects"
```

---

### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ledgerlite.parse.ParseError(line, message)`.
- Produces:
  - `ledgerlite.rules.Rule = tuple[str, str]` — `(substring, category)`, stored as written in the file after stripping.
  - `ledgerlite.rules.parse_rules(lines: Iterable[str]) -> list[Rule]` — raises `ParseError`. Preserves file order, which is match precedence.
  - `ledgerlite.rules.categorize(description: str, rules: Sequence[Rule]) -> str | None` — `None` when no rule matches.

- [ ] **Step 1: Write the failing test in `test_rules.py`**

```python
import unittest

from ledgerlite.parse import ParseError
from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_rules_in_file_order(self):
        lines = ["coffee=food\n", "rent=housing\n"]
        self.assertEqual(parse_rules(lines), [("coffee", "food"), ("rent", "housing")])

    def test_blank_lines_are_skipped_and_whitespace_stripped(self):
        lines = ["\n", "  coffee = food  \n", "   \n"]
        self.assertEqual(parse_rules(lines), [("coffee", "food")])

    def test_only_the_first_equals_sign_splits(self):
        self.assertEqual(parse_rules(["a=b=c\n"]), [("a", "b=c")])

    def test_line_without_equals_is_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules(["coffee=food\n", "rent housing\n"])
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, 'rule has no "="')

    def test_empty_substring_is_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules(["=food\n"])
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "rule has an empty substring")

    def test_empty_category_is_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_rules(["coffee=\n"])
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "rule has an empty category")


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_case_insensitively_on_a_substring(self):
        self.assertEqual(categorize("MORNING COFFEE BAR", self.RULES), "food")
        self.assertEqual(categorize("Rent March", self.RULES), "housing")

    def test_first_matching_rule_wins(self):
        rules = [("bar", "drinks"), ("coffee bar", "food")]
        self.assertEqual(categorize("Coffee Bar", rules), "drinks")

    def test_no_match_returns_none(self):
        self.assertIsNone(categorize("ACME Salary", self.RULES))

    def test_no_rules_returns_none(self):
        self.assertIsNone(categorize("Coffee", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `parse_rules` and `categorize` in `ledgerlite/rules.py`**

`parse_rules` numbers lines 1-based with `enumerate(lines, start=1)`, skips lines that are empty after `.strip()`, splits with `line.split("=", 1)`, and strips both halves. `categorize` returns the category of the first rule whose `substring.lower()` is `in description.lower()`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (10 tests)

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
  - `ledgerlite.balance.order_by_date(transactions: Sequence[Transaction]) -> list[Transaction]`
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: Sequence[Transaction]) -> Decimal`

Note for the implementer: summing is order-independent, so `closing_balance` would produce the same number without sorting. `order_by_date` exists because the spec makes the ordering rule a requirement of this module and Task 4 has nothing to do with it; keep `closing_balance` folding over `order_by_date` so the rule has exactly one home.

- [ ] **Step 1: Write the failing test in `test_balance.py`**

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def tx(day, amount, description):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class OrderByDateTest(unittest.TestCase):
    def test_sorts_by_date(self):
        later, earlier = tx(5, "1.00", "b"), tx(4, "2.00", "a")
        self.assertEqual(order_by_date([later, earlier]), [earlier, later])

    def test_ties_keep_input_order(self):
        first, second = tx(4, "1.00", "first"), tx(4, "2.00", "second")
        self.assertEqual(order_by_date([first, second]), [first, second])
        self.assertEqual(order_by_date([second, first]), [second, first])

    def test_does_not_mutate_its_argument(self):
        transactions = [tx(5, "1.00", "b"), tx(4, "2.00", "a")]
        order_by_date(transactions)
        self.assertEqual(transactions[0].description, "b")


class ClosingBalanceTest(unittest.TestCase):
    def test_opening_plus_every_amount(self):
        transactions = [tx(5, "-7.50", "c"), tx(4, "2500.00", "s"), tx(6, "-900.00", "r")]
        self.assertEqual(
            closing_balance(Decimal("100"), transactions), Decimal("1592.50")
        )

    def test_no_transactions_returns_the_opening_amount(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_result_is_exact_not_floating_point(self):
        transactions = [tx(4, "0.10", "a"), tx(4, "0.20", "b")]
        self.assertEqual(closing_balance(Decimal("0"), transactions), Decimal("0.30"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `order_by_date` and `closing_balance` in `ledgerlite/balance.py`**

`order_by_date` returns `sorted(transactions, key=lambda t: t.date)` — Python's sort is stable, which is exactly the spec's "ties keep input order", and `sorted` returns a new list.

- [ ] **Step 4: Run the test to verify it passes**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```

---

### Task 4: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction`, `ledgerlite.rules.Rule`/`categorize`, `ledgerlite.balance.closing_balance`.
- Produces:
  - `ledgerlite.report.UNCATEGORIZED = "uncategorized"`
  - `ledgerlite.report.format_amount(value: Decimal) -> str`
  - `ledgerlite.report.category_totals(transactions: Sequence[Transaction], rules: Sequence[Rule]) -> dict[str, Decimal]` — keys are category names, uncategorized transactions under `UNCATEGORIZED`; categories with no transactions do not appear.
  - `ledgerlite.report.format_report(transactions: Sequence[Transaction], rules: Sequence[Rule], opening: Decimal) -> str` — the full report, ending in exactly one `"\n"`.

- [ ] **Step 1: Write the failing test in `test_report.py`**

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import UNCATEGORIZED, category_totals, format_amount, format_report

RULES = [("coffee", "food"), ("rent", "housing")]


def tx(day, amount, description):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class FormatAmountTest(unittest.TestCase):
    def test_two_fractional_digits_and_leading_minus(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_negative_zero_prints_without_a_sign(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_each_category_and_uncategorized(self):
        transactions = [
            tx(4, "-7.50", "Coffee Bar"),
            tx(5, "-2.50", "COFFEE beans"),
            tx(6, "-900.00", "Rent March"),
            tx(7, "2500.00", "ACME Salary"),
        ]
        self.assertEqual(
            category_totals(transactions, RULES),
            {
                "food": Decimal("-10.00"),
                "housing": Decimal("-900.00"),
                UNCATEGORIZED: Decimal("2500.00"),
            },
        )

    def test_no_rules_puts_everything_in_uncategorized(self):
        self.assertEqual(
            category_totals([tx(4, "-7.50", "Coffee Bar")], []),
            {UNCATEGORIZED: Decimal("-7.50")},
        )

    def test_no_transactions_has_no_categories(self):
        self.assertEqual(category_totals([], RULES), {})


class FormatReportTest(unittest.TestCase):
    def test_matches_the_spec_example(self):
        transactions = [
            tx(4, "-7.50", "Coffee Bar"),
            tx(5, "-900.00", "Rent March"),
            tx(6, "2500.00", "ACME Salary"),
        ]
        self.assertEqual(
            format_report(transactions, RULES, Decimal("100")),
            "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\n"
            "closing balance: 1692.50\n",
        )

    def test_categories_are_alphabetical_ignoring_case(self):
        rules = [("a", "Food"), ("b", "bank"), ("c", "Travel")]
        transactions = [tx(4, "1.00", "a"), tx(4, "2.00", "b"), tx(4, "4.00", "c")]
        report = format_report(transactions, rules, Decimal("0"))
        self.assertEqual(
            report.splitlines()[:3], ["bank: 2.00", "Food: 1.00", "Travel: 4.00"]
        )

    def test_uncategorized_is_last_even_though_z_sorts_after_it(self):
        rules = [("zoo", "zoo")]
        transactions = [tx(4, "1.00", "zoo trip"), tx(4, "2.00", "mystery")]
        self.assertEqual(
            format_report(transactions, rules, Decimal("0")).splitlines()[:2],
            ["zoo: 1.00", "uncategorized: 2.00"],
        )

    def test_a_rule_category_named_uncategorized_merges_and_stays_last(self):
        rules = [("coffee", "uncategorized"), ("rent", "housing")]
        transactions = [
            tx(4, "-1.00", "Coffee"),
            tx(4, "-2.00", "mystery"),
            tx(4, "-3.00", "Rent"),
        ]
        self.assertEqual(
            format_report(transactions, rules, Decimal("0")).splitlines()[:2],
            ["housing: -3.00", "uncategorized: -3.00"],
        )

    def test_no_transactions_reports_only_the_opening_balance(self):
        self.assertEqual(
            format_report([], RULES, Decimal("100")), "\nclosing balance: 100.00\n"
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `format_amount` in `ledgerlite/report.py`**

Quantize to two places with `value.quantize(Decimal("0.01"))`, then drop the sign when the result is zero (`if quantized == 0: quantized = abs(quantized)`), then format with `f"{quantized:f}"`. Do not use `:,` — no thousands separators.

- [ ] **Step 4: Implement `category_totals` in `ledgerlite/report.py`**

Accumulate into a plain `dict`, keyed by `rules.categorize(t.description, rules) or UNCATEGORIZED`, starting each new key at `Decimal("0")`.

- [ ] **Step 5: Implement `format_report` in `ledgerlite/report.py`**

Order the names with `sorted(name for name in totals if name != UNCATEGORIZED, key=lambda n: (n.lower(), n))` and append `UNCATEGORIZED` last if it is present. Emit one `f"{name}: {format_amount(total)}"` line per name, then an empty line, then `f"closing balance: {format_amount(balance.closing_balance(opening, transactions))}"`. Join with `"\n"` and end with a single `"\n"` — with zero categories that yields a leading blank line, which is the literal reading of the spec's "one line per category, then a blank line, then the closing balance".

- [ ] **Step 6: Run the test to verify it passes**

Run: `python3 -m unittest test_report -v`
Expected: PASS (11 tests)

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: format per-category totals and closing balance report"
```

---

### Task 5: CLI, file reading, and exit codes

**Files:**
- Create: `ledgerlite/cli.py`, `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.parse_transactions`, `parse.parse_amount`, `parse.ParseError`, `rules.parse_rules`, `report.format_report`.
- Produces: `ledgerlite.cli.main(argv: Sequence[str] | None = None) -> int` — returns the process exit code and never calls `sys.exit` itself (except through argparse's own errors).

- [ ] **Step 1: Write the failing test in `test_cli.py`**

```python
import contextlib
import io
import os
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-06,2500.00,ACME Salary\n"
    "2026-03-04,-7.50,Coffee Bar\n"
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


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)

    def write(self, name, text, encoding="utf-8"):
        path = os.path.join(self.dir.name, name)
        with open(path, "w", encoding=encoding, newline="") as handle:
            handle.write(text)
        return path

    def run_cli(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()


class ReportCommandTest(CliTestCase):
    def test_spec_example_end_to_end(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", RULES)
        code, out, err = self.run_cli(
            ["report", transactions, "--rules", rules, "--opening", "100"]
        )
        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_opening_defaults_to_zero(self):
        transactions = self.write("t.csv", "date,amount,description\n2026-03-04,1.50,Tip\n")
        code, out, _ = self.run_cli(["report", transactions])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1.50\n\nclosing balance: 1.50\n")

    def test_without_rules_everything_is_uncategorized(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        code, out, _ = self.run_cli(["report", transactions, "--opening", "100"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1692.50\n")

    def test_bom_and_crlf_do_not_break_parsing(self):
        transactions = self.write(
            "t.csv", "\ufeff" + TRANSACTIONS.replace("\n", "\r\n")
        )
        rules = self.write("r.txt", RULES)
        code, out, err = self.run_cli(
            ["report", transactions, "--rules", rules, "--opening", "100"]
        )
        self.assertEqual((code, out, err), (0, EXPECTED, ""))


class UnreadableFileTest(CliTestCase):
    def test_missing_transactions_file_exits_1(self):
        path = os.path.join(self.dir.name, "nope.csv")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

    def test_missing_rules_file_exits_1(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        path = os.path.join(self.dir.name, "nope.txt")
        code, out, err = self.run_cli(["report", transactions, "--rules", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")


class MalformedInputTest(CliTestCase):
    def test_malformed_row_exits_2_and_prints_nothing_to_stdout(self):
        transactions = self.write(
            "t.csv",
            "date,amount,description\n2026-03-04,1.00,Tip\n2026-03-05,1.005,Fee\n",
        )
        code, out, err = self.run_cli(["report", transactions])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f'ledgerlite: {transactions}:3: amount "1.005" has more than two '
            "fractional digits\n",
        )

    def test_malformed_rule_line_exits_2(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = self.write("r.txt", "coffee=food\nrent housing\n")
        code, out, err = self.run_cli(["report", transactions, "--rules", rules])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f'ledgerlite: {rules}:2: rule has no "="\n')

    def test_invalid_opening_amount_is_rejected(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        for value in ["1.005", "abc"]:
            with self.subTest(value=value):
                with self.assertRaises(SystemExit) as caught:
                    with contextlib.redirect_stderr(io.StringIO()):
                        main(["report", transactions, "--opening", value])
                self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `main(argv)` in `ledgerlite/cli.py`**

Structure:
- `_read_lines(path: str) -> list[str]` — `open(path, encoding="utf-8-sig", newline="")` and `readlines()`. `utf-8-sig` strips a BOM; `newline=""` is what the `csv` module requires. It also makes `\r\n` files parse cleanly.
- `_opening(text: str) -> Decimal` — the `type=` callable for `--opening`; wraps `parse.parse_amount` and re-raises `ValueError` as `argparse.ArgumentTypeError(str(exc))` so argparse prints usage and exits 2.
- Parser: `ArgumentParser(prog="ledgerlite")` with `add_subparsers(dest="command", required=True)`; the `report` subparser takes positional `transactions`, `--rules` (default `None`), and `--opening` (`type=_opening`, `default=Decimal("0")`).
- Read and parse the transactions file, then the rules file if `--rules` was given (empty rules list otherwise). Wrap both in one helper so the error handling is written once:

```python
def _load(path, parse_fn):
    """Returns (value, None) or (None, error_line_to_print)."""
```

  where the error line is `f"ledgerlite: cannot read {path}: {reason}"` (exit 1) or `f"ledgerlite: {path}:{exc.line}: {exc.message}"` (exit 2). `reason` is `exc.strerror or str(exc)` for `OSError`, and `"invalid UTF-8"` for `UnicodeDecodeError`.
- On any error: `print(line, file=sys.stderr)` and return `1` or `2` — before anything reaches stdout.
- On success: `print(report.format_report(transactions, rules, args.opening), end="")` and return `0`.

- [ ] **Step 4: Create `ledgerlite/__main__.py`**

```python
import sys

from ledgerlite.cli import main

if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (9 tests)

- [ ] **Step 6: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS, 47 tests, no errors

- [ ] **Step 7: Verify the spec example through the real command line**

```bash
printf 'date,amount,description\n2026-03-06,2500.00,ACME Salary\n2026-03-04,-7.50,Coffee Bar\n2026-03-05,-900.00,Rent March\n' > /tmp/t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/r.txt
python3 -m ledgerlite report /tmp/t.csv --rules /tmp/r.txt --opening 100; echo "exit=$?"
python3 -m ledgerlite report /tmp/missing.csv; echo "exit=$?"
```

Expected, in order:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
exit=0
ledgerlite: cannot read /tmp/missing.csv: No such file or directory
exit=1
```

- [ ] **Step 8: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI"
```
