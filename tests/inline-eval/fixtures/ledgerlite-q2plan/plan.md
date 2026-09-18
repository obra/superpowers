# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only Python CLI that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Five small pure modules under `ledgerlite/` — parsing (`parse.py`), rules (`rules.py`), balance arithmetic (`balance.py`), formatting (`report.py`) — composed by a thin argparse shell (`cli.py`) that owns all I/O, all stderr messages, and all exit codes. Every module below `cli.py` takes and returns values (text in, data out), so every behavior in the spec is testable without touching the filesystem.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `pathlib`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies.
- Money is `decimal.Decimal` everywhere. Never `float`, not even transiently.
- Package lives in `ledgerlite/`; tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Amounts are printed with exactly two fractional digits, a leading `-` for negatives, and no thousands separators (`-12.50`, `0.00`, `1200.00`).
- Exit codes: `0` success, `1` a file cannot be read, `2` a malformed CSV row.
- Error messages go to stderr and are prefixed `ledgerlite: `.

## Review Focus

Spec-implied inputs that no task's own happy-path tests would exercise. Each has a test assigned to the task that owns the code:

1. A CSV with only a header row (or no rows at all) — should print the opening amount as the closing balance and exit 0, not crash on an empty sequence. → Task 1 (`test_header_only_file_has_no_transactions`), Task 4 (`test_no_transactions_prints_only_the_closing_balance`), Task 5 (`test_header_only_file_reports_the_opening_balance`).
2. Blank or whitespace-only lines in the CSV (a trailing newline is normal) — must be skipped, not reported as a malformed row. → Task 1 (`test_blank_lines_are_skipped`).
3. A category total that comes out as negative zero — must print `0.00`, never `-0.00`. → Task 4 (`test_negative_zero_prints_as_zero`).
4. `--opening` given a non-number or more than two fractional digits — must produce a usage error, not a traceback and not silent rounding. → Task 5 (`test_invalid_opening_exits_two`).
5. A `--rules` path that cannot be read — the spec names only TRANSACTIONS, but an unreadable rules file must give the same `cannot read` message and exit 1 rather than a traceback. → Task 5 (`test_unreadable_rules_file_returns_one`).

Two other silences resolved by decision rather than by test, so the implementer does not have to guess: `nan`/`Infinity` are valid `Decimal` inputs and are rejected as invalid amounts (Task 1); the header line is skipped unconditionally without validating its contents (Task 1).

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
  - `Transaction` — frozen dataclass in `ledgerlite/model.py` with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that order.
  - `ParseError(Exception)` in `ledgerlite/parse.py` with attributes `line: int` and `message: str`; `str(err)` is `f"{line}: {message}"`.
  - `parse_transactions(text: str) -> list[Transaction]` — input order preserved, raises `ParseError` on the first bad row.
  - `parse_amount(text: str) -> Decimal` — raises `ValueError` whose `str()` is the exact message `ParseError.message` will carry.

- [ ] **Step 1: Write the failing tests**

Create `test_parse.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_transactions

CSV = (
    "date,amount,description\n"
    "2026-03-04,-7.50,Coffee Shop\n"
    "2026-03-01,2500.00,Salary\n"
)


class TestParseTransactions(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        self.assertEqual(
            parse_transactions(CSV),
            [
                Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop"),
                Transaction(date(2026, 3, 1), Decimal("2500.00"), "Salary"),
            ],
        )

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions("date,amount,description\n"), [])

    def test_blank_lines_are_skipped(self):
        self.assertEqual(len(parse_transactions(CSV + "\n   \n")), 2)

    def test_fields_are_stripped(self):
        text = "date,amount,description\n 2026-03-04 , -7.50 , Coffee Shop \n"
        self.assertEqual(
            parse_transactions(text),
            [Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop")],
        )

    def test_wrong_column_count(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions("date,amount,description\n2026-03-04,-7.50\n")
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(ctx.exception.message, "expected 3 columns, got 2")

    def test_unparseable_date(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions("date,amount,description\n2026-13-04,-7.50,x\n")
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(ctx.exception.message, "invalid date: '2026-13-04'")

    def test_amount_with_three_fractional_digits(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions("date,amount,description\n2026-03-04,1.005,x\n")
        self.assertEqual(
            ctx.exception.message,
            "amount has more than two fractional digits: '1.005'",
        )

    def test_error_names_the_offending_line_number(self):
        text = (
            "date,amount,description\n"
            "2026-03-04,1.00,ok\n"
            "2026-03-05,nope,bad\n"
        )
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(text)
        self.assertEqual(ctx.exception.line, 3)
        self.assertEqual(ctx.exception.message, "invalid amount: 'nope'")

    def test_str_of_parse_error_includes_line_and_message(self):
        self.assertEqual(str(ParseError(7, "invalid amount: 'x'")), "7: invalid amount: 'x'")


class TestParseAmount(unittest.TestCase):
    def test_accepts_zero_one_or_two_fractional_digits(self):
        self.assertEqual(parse_amount("-12"), Decimal("-12"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))

    def test_rejects_non_numeric(self):
        with self.assertRaises(ValueError) as ctx:
            parse_amount("abc")
        self.assertEqual(str(ctx.exception), "invalid amount: 'abc'")

    def test_rejects_non_finite(self):
        for text in ("nan", "Infinity", "-inf"):
            with self.subTest(text=text):
                with self.assertRaises(ValueError) as ctx:
                    parse_amount(text)
                self.assertEqual(str(ctx.exception), f"invalid amount: '{text}'")

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError) as ctx:
            parse_amount("1.005")
        self.assertEqual(
            str(ctx.exception),
            "amount has more than two fractional digits: '1.005'",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Create `ledgerlite/__init__.py` (empty) and the `Transaction` dataclass in `ledgerlite/model.py`**

`@dataclass(frozen=True)`, fields in the order given in Interfaces.

- [ ] **Step 4: Implement `ParseError`, `parse_amount(text: str) -> Decimal`, and `parse_transactions(text: str) -> list[Transaction]` in `ledgerlite/parse.py`**

`parse_amount`: build `Decimal(text)`, converting `decimal.InvalidOperation` into `ValueError(f"invalid amount: {text!r}")`; raise the same message when the result is not `is_finite()`; reject when `-amount.as_tuple().exponent > 2`.

`parse_transactions`: `csv.reader(text.splitlines())` with `enumerate(..., start=1)` so line numbers match the file. Skip line 1 (the header, unvalidated) and any row whose fields are all empty after stripping. Strip each of the three fields. Use `datetime.date.fromisoformat` for the date, converting `ValueError` into the `invalid date: ...` message. Column-count check comes first, then date, then amount.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Transaction records"
```

---

### Task 2: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `parse_rules(text: str) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order. **Substrings are already lowercased** by this function.
  - `categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first match wins, `None` when nothing matches. Assumes rule substrings are lowercased, as `parse_rules` returns them.

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
import unittest

from ledgerlite.rules import categorize, parse_rules


class TestParseRules(unittest.TestCase):
    def test_parses_pairs_in_file_order_with_lowercased_substrings(self):
        self.assertEqual(
            parse_rules("Coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_strips_whitespace_and_skips_blank_lines(self):
        self.assertEqual(parse_rules("\n  coffee = food  \n\n"), [("coffee", "food")])

    def test_skips_lines_with_no_separator_or_an_empty_side(self):
        self.assertEqual(
            parse_rules("nonsense\n=food\ncoffee=\ncoffee=food\n"),
            [("coffee", "food")],
        )

    def test_splits_on_the_first_equals_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_empty_text_has_no_rules(self):
        self.assertEqual(parse_rules(""), [])


class TestCategorize(unittest.TestCase):
    RULES = [("coffee", "food"), ("shop", "retail")]

    def test_matches_case_insensitively(self):
        self.assertEqual(categorize("COFFEE SHOP", self.RULES), "food")

    def test_first_matching_rule_wins(self):
        self.assertEqual(categorize("Corner Shop", self.RULES), "retail")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Rent", self.RULES))

    def test_no_rules_means_no_category(self):
        self.assertIsNone(categorize("Coffee", []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `parse_rules` and `categorize` in `ledgerlite/rules.py`**

`parse_rules`: split on `str.partition("=")`, strip both sides, lowercase the substring, skip a line when either side is empty. `categorize`: lowercase the description once, return the category of the first rule whose substring is `in` it.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (all tests)

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
- Consumes: `Transaction` from `ledgerlite.model` (Task 1).
- Produces:
  - `order_by_date(transactions: list[Transaction]) -> list[Transaction]` — new list, stable sort by date so ties keep input order; the argument is not mutated.
  - `closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal` — `opening` plus every amount, added in date order; `opening` when there are none.

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def tx(day, amount):
    return Transaction(date(2026, 3, day), Decimal(amount), f"row {day} {amount}")


class TestOrderByDate(unittest.TestCase):
    def test_orders_by_date_keeping_input_order_for_ties(self):
        a, b, c = tx(4, "1.00"), tx(1, "2.00"), tx(1, "3.00")
        self.assertEqual(order_by_date([a, b, c]), [b, c, a])

    def test_does_not_mutate_the_argument(self):
        a, b = tx(4, "1.00"), tx(1, "2.00")
        original = [a, b]
        order_by_date(original)
        self.assertEqual(original, [a, b])

    def test_empty_list(self):
        self.assertEqual(order_by_date([]), [])


class TestClosingBalance(unittest.TestCase):
    def test_adds_every_amount_to_the_opening_amount(self):
        transactions = [tx(4, "-7.50"), tx(1, "2500.00"), tx(2, "-900.00")]
        self.assertEqual(
            closing_balance(Decimal("100"), transactions), Decimal("1692.50")
        )

    def test_no_transactions_returns_the_opening_amount(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_result_is_a_decimal(self):
        self.assertIsInstance(closing_balance(Decimal("0"), [tx(1, "1.00")]), Decimal)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `order_by_date` and `closing_balance` in `ledgerlite/balance.py`**

`sorted(..., key=lambda t: t.date)` is stable, which is what the tie rule needs. `closing_balance` accumulates over `order_by_date(transactions)`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: order transactions by date and compute closing balance"
```

---

### Task 4: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1); `categorize` (Task 2); `closing_balance`, `order_by_date` (Task 3).
- Produces:
  - `UNCATEGORIZED = "uncategorized"` constant.
  - `format_amount(amount: Decimal) -> str`
  - `category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[tuple[str, Decimal]]` — case-insensitively alphabetical, `UNCATEGORIZED` last and only when some transaction is uncategorized.
  - `format_report(transactions: list[Transaction], rules: list[tuple[str, str]], opening: Decimal) -> str` — the whole report, ending in a newline.

- [ ] **Step 1: Write the failing tests**

Create `test_report.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report

RULES = [("coffee", "food"), ("rent", "housing")]
EXAMPLE = [
    Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop"),
    Transaction(date(2026, 3, 1), Decimal("2500.00"), "Salary"),
    Transaction(date(2026, 3, 2), Decimal("-900.00"), "Rent March"),
]


class TestFormatAmount(unittest.TestCase):
    def test_always_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.8")), "1234567.80")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")


class TestCategoryTotals(unittest.TestCase):
    def test_sums_each_category_alphabetically_with_uncategorized_last(self):
        self.assertEqual(
            category_totals(EXAMPLE, RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                ("uncategorized", Decimal("2500.00")),
            ],
        )

    def test_orders_categories_case_insensitively(self):
        transactions = [
            Transaction(date(2026, 3, 1), Decimal("1.00"), "b thing"),
            Transaction(date(2026, 3, 1), Decimal("2.00"), "a thing"),
        ]
        rules = [("b thing", "Zebra"), ("a thing", "apples")]
        self.assertEqual(
            [name for name, _ in category_totals(transactions, rules)],
            ["apples", "Zebra"],
        )

    def test_omits_uncategorized_when_every_transaction_matches(self):
        transactions = [Transaction(date(2026, 3, 1), Decimal("-1.00"), "Coffee")]
        self.assertEqual(
            category_totals(transactions, RULES), [("food", Decimal("-1.00"))]
        )

    def test_no_transactions_has_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_without_rules_everything_is_uncategorized(self):
        self.assertEqual(
            category_totals(EXAMPLE, []), [("uncategorized", Decimal("1592.50"))]
        )


class TestFormatReport(unittest.TestCase):
    def test_matches_the_design_example(self):
        self.assertEqual(
            format_report(EXAMPLE, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_prints_only_the_closing_balance(self):
        self.assertEqual(
            format_report([], RULES, Decimal("100")),
            "\nclosing balance: 100.00\n",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `format_amount`, `category_totals`, and `format_report` in `ledgerlite/report.py`**

`format_amount`: `quantize(Decimal("0.01"))` then format; map a zero result to `abs()` first so negative zero cannot print a sign.

`category_totals`: accumulate into a dict keyed by `categorize(...) or UNCATEGORIZED` while walking `order_by_date(transactions)`, then sort the non-`UNCATEGORIZED` keys with `key=lambda name: (name.lower(), name)` and append `UNCATEGORIZED` if present.

`format_report`: one `f"{name}: {format_amount(total)}\n"` per row from `category_totals`, then `"\n"`, then `f"closing balance: {format_amount(closing_balance(opening, transactions))}\n"`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: format per-category totals and closing balance report"
```

---

### Task 5: CLI entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py` (not in the design's layout; without it there is no way to invoke the tool — it is three lines delegating to `cli.main`)
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `ParseError`, `parse_amount`, `parse_transactions` (Task 1); `parse_rules` (Task 2); `format_report` (Task 4).
- Produces: `main(argv: list[str] | None = None) -> int`.

Command line: `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`, `--opening` defaulting to `Decimal("0")`.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py`:

```python
import contextlib
import errno
import io
import os
import tempfile
import unittest
from pathlib import Path

from ledgerlite.cli import main

CSV = (
    "date,amount,description\n"
    "2026-03-04,-7.50,Coffee Shop\n"
    "2026-03-01,2500.00,Salary\n"
    "2026-03-02,-900.00,Rent March\n"
)
RULES = "coffee=food\nrent=housing\n"
REPORT = (
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


class TestMain(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.dir = Path(tmp.name)
        self.csv = self.dir / "tx.csv"
        self.csv.write_text(CSV, encoding="utf-8")
        self.rules = self.dir / "rules.txt"
        self.rules.write_text(RULES, encoding="utf-8")

    def test_reports_categories_and_closing_balance(self):
        code, out, err = run(
            ["report", str(self.csv), "--rules", str(self.rules), "--opening", "100"]
        )
        self.assertEqual((code, out, err), (0, REPORT, ""))

    def test_opening_defaults_to_zero(self):
        code, out, _ = run(["report", str(self.csv), "--rules", str(self.rules)])
        self.assertEqual(code, 0)
        self.assertIn("closing balance: 1592.50\n", out)

    def test_without_rules_everything_is_uncategorized(self):
        code, out, _ = run(["report", str(self.csv)])
        self.assertEqual(
            (code, out),
            (0, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n"),
        )

    def test_header_only_file_reports_the_opening_balance(self):
        empty = self.dir / "empty.csv"
        empty.write_text("date,amount,description\n", encoding="utf-8")
        code, out, _ = run(["report", str(empty), "--opening", "-5"])
        self.assertEqual((code, out), (0, "\nclosing balance: -5.00\n"))

    def test_missing_transactions_file_returns_one(self):
        missing = self.dir / "nope.csv"
        code, out, err = run(["report", str(missing)])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: cannot read {missing}: {os.strerror(errno.ENOENT)}\n",
        )

    def test_unreadable_rules_file_returns_one(self):
        missing = self.dir / "nope.txt"
        code, out, err = run(["report", str(self.csv), "--rules", str(missing)])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: cannot read {missing}: {os.strerror(errno.ENOENT)}\n",
        )

    def test_malformed_row_returns_two_and_prints_no_report(self):
        bad = self.dir / "bad.csv"
        bad.write_text(
            "date,amount,description\n2026-03-04,1.00,ok\n2026-03-05,nope,bad\n",
            encoding="utf-8",
        )
        code, out, err = run(["report", str(bad)])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {bad}:3: invalid amount: 'nope'\n")

    def test_invalid_opening_exits_two(self):
        for value in ("abc", "1.005"):
            with self.subTest(value=value):
                with self.assertRaises(SystemExit) as ctx:
                    run(["report", str(self.csv), "--opening", value])
                self.assertEqual(ctx.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `main(argv: list[str] | None = None) -> int` in `ledgerlite/cli.py`**

`argparse.ArgumentParser(prog="ledgerlite")` with a required `report` subcommand, positional `transactions`, optional `--rules`, and `--opening` whose `type=` wraps `parse_amount` and re-raises its `ValueError` as `argparse.ArgumentTypeError` (this is what makes an invalid `--opening` exit 2 through argparse), `default=Decimal("0")`.

Read both files inside one `try`, with `Path(...).read_text(encoding="utf-8")`:

```python
except OSError as exc:
    print(f"ledgerlite: cannot read {exc.filename}: {exc.strerror}", file=sys.stderr)
    return 1
except ParseError as exc:
    print(f"ledgerlite: {args.transactions}:{exc.line}: {exc.message}", file=sys.stderr)
    return 2
```

Then print `format_report(...)` with `end=""` and return 0. Nothing may reach stdout before parsing has succeeded.

- [ ] **Step 4: Create `ledgerlite/__main__.py`**

```python
import sys

from .cli import main

sys.exit(main())
```

- [ ] **Step 5: Run the whole suite to verify it passes**

Run: `python3 -m unittest -v`
Expected: PASS — every test in `test_parse`, `test_rules`, `test_balance`, `test_report`, `test_cli`

- [ ] **Step 6: Verify the tool runs end to end**

```bash
printf 'date,amount,description\n2026-03-04,-7.50,Coffee Shop\n2026-03-01,2500.00,Salary\n2026-03-02,-900.00,Rent March\n' > /tmp/tx.csv
printf 'coffee=food\nrent=housing\n' > /tmp/rules.txt
python3 -m ledgerlite report /tmp/tx.csv --rules /tmp/rules.txt --opening 100
```

Expected: exactly the example report from `design.md` (`food: -7.50`, `housing: -900.00`, `uncategorized: 2500.00`, blank line, `closing balance: 1692.50`).

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report command line interface"
```
