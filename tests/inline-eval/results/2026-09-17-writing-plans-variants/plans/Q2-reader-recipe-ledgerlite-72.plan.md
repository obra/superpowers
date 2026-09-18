# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a standard-library-only CLI that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** A pipeline of small pure modules — `parse` turns CSV text into `Transaction` values (raising `ParseError` with a line number), `rules` turns rules text into ordered `(substring, category)` pairs, `balance` orders by date and accumulates, `report` aggregates and formats — with `cli` as the only module that touches the filesystem, stdout/stderr, and exit codes. All money is `decimal.Decimal` end to end; no module below `cli` prints or reads files, so every behavior is testable as a function call.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `dataclasses`, `argparse`, `pathlib`, `re`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies, no `pip install`, no `pyproject.toml` needed.
- All monetary values are `decimal.Decimal`, never `float`. No module may construct a `float` from an amount.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Amounts are printed with exactly two fractional digits, a leading `-` for negatives, and no thousands separators: `-12.50`, `0.00`, `1200.00`.
- Exit codes and stderr formats are exact: unreadable file → `ledgerlite: cannot read <path>: <reason>` and exit 1; malformed row → `ledgerlite: <path>:<line>: <what is wrong>` and exit 2; success → report on stdout and exit 0. On exit 1 or 2, nothing is written to stdout.
- Line numbers in errors are 1-based physical file lines; the header row is line 1.
- Package layout is fixed by the spec: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`. This plan adds one file the spec omits: `ledgerlite/__main__.py`, so the tool can be run as `python3 -m ledgerlite`.
- Work directly on `main`; commit after every task.

## Review Focus

These are the input classes the spec implies but does not spell out. Each line names the behavior a reasonable user expects and the task whose tests pin it.

1. **An existing-but-empty or header-only CSV** — an empty ledger, not a crash and not an error: zero transactions, report prints just the blank line and `closing balance: <opening>` (Task 2, Task 7).
2. **A description containing a comma or double quotes** (`"AMZN, INC"`) — must be read with the `csv` module, not `str.split(",")`, or every such row becomes a bogus "wrong column count" error (Task 2).
3. **Error line numbers when the file has blank lines or a quoted field containing a newline** — the reported line must be the physical line of the bad row, and a wrong or missing header must be named as such rather than reported as a bad date (Task 2).
4. **A total that is exactly zero, or an amount written `-0.00`** — prints `0.00`, never `-0.00`; the spec reserves the leading `-` for negatives (Task 6).
5. **A rules file with blank lines, no `=`, an empty substring, or that cannot be read** — junk lines are skipped rather than crashing, and an unreadable `--rules` path fails the same way an unreadable CSV does (`cannot read`, exit 1) (Task 3, Task 7).

---

## File Structure

| File | Responsibility |
|---|---|
| `ledgerlite/__init__.py` | Empty package marker. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. |
| `ledgerlite/parse.py` | `ParseError`; field validators `parse_date` / `parse_amount`; `parse_transactions` (CSV text → `list[Transaction]`). |
| `ledgerlite/rules.py` | `parse_rules` (rules text → ordered pairs); `categorize`. |
| `ledgerlite/balance.py` | `order_by_date`; `closing_balance`. |
| `ledgerlite/report.py` | `category_totals`; `format_amount`; `format_report`. |
| `ledgerlite/cli.py` | argparse wiring, file reading, exit codes; `main(argv) -> int`. |
| `ledgerlite/__main__.py` | `sys.exit(main())` so `python3 -m ledgerlite` works. |
| `test_parse.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py` | Root-level unittest modules. |

---

### Task 1: Package skeleton, `Transaction`, and field validators

**Files:**
- Create: `ledgerlite/__init__.py` (empty), `ledgerlite/model.py`, `ledgerlite/parse.py`, `.gitignore`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str` (in that order).
  - `ledgerlite.parse.ParseError(Exception)` — constructed as `ParseError(line: int, message: str)`, exposing `.line: int` and `.message: str`.
  - `ledgerlite.parse.parse_date(value: str) -> datetime.date` — raises `ValueError("invalid date: <value>")`.
  - `ledgerlite.parse.parse_amount(value: str) -> decimal.Decimal` — raises `ValueError("invalid amount: <value>")` or `ValueError("amount has more than two fractional digits: <value>")`.

- [ ] **Step 1: Write the failing tests**

```python
# test_parse.py
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_date


class TransactionTest(unittest.TestCase):
    def test_holds_date_amount_and_description(self):
        txn = Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee")
        self.assertEqual(txn.date, date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("-7.50"))
        self.assertEqual(txn.description, "Coffee")


class ParseErrorTest(unittest.TestCase):
    def test_exposes_line_and_message(self):
        err = ParseError(7, "invalid amount: abc")
        self.assertEqual(err.line, 7)
        self.assertEqual(err.message, "invalid amount: abc")


class ParseDateTest(unittest.TestCase):
    def test_parses_iso_date(self):
        self.assertEqual(parse_date("2026-03-04"), date(2026, 3, 4))

    def test_rejects_non_iso_and_impossible_dates(self):
        for value in ("03/04/2026", "20260304", "2026-13-40", "2026-3-4", "", "today"):
            with self.subTest(value=value):
                with self.assertRaises(ValueError) as caught:
                    parse_date(value)
                self.assertEqual(str(caught.exception), f"invalid date: {value}")


class ParseAmountTest(unittest.TestCase):
    def test_parses_zero_one_and_two_fractional_digits(self):
        self.assertEqual(parse_amount("-7.50"), Decimal("-7.50"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1200"), Decimal("1200"))
        self.assertEqual(parse_amount("+5"), Decimal("5"))

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertEqual(
            str(caught.exception),
            "amount has more than two fractional digits: 1.005",
        )

    def test_rejects_values_that_are_not_decimal_numbers(self):
        for value in ("abc", "", "1e5", "NaN", "Infinity", "1.2.3", "1,50", "1."):
            with self.subTest(value=value):
                with self.assertRaises(ValueError) as caught:
                    parse_amount(value)
                self.assertEqual(str(caught.exception), f"invalid amount: {value}")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Create the package and `Transaction` in `ledgerlite/model.py`**

Empty `ledgerlite/__init__.py`. `Transaction` is a `@dataclass(frozen=True)`. Add `.gitignore` containing `__pycache__/`.

- [ ] **Step 4: Implement `ParseError`, `parse_date`, `parse_amount` in `ledgerlite/parse.py`**

`ParseError.__init__(self, line, message)` stores both attributes and calls `super().__init__(message)`.

`parse_date` must reject anything that is not exactly `YYYY-MM-DD`, and neither stdlib option does that alone: `date.fromisoformat` also accepts `20260304`, and `strptime("%Y-%m-%d")` also accepts the unpadded `2026-3-4`. So guard with `re.compile(r"\d{4}-\d{2}-\d{2}").fullmatch(value)` first, then `datetime.datetime.strptime(value, "%Y-%m-%d").date()` for calendar validity, converting either failure into the `invalid date:` message.

`parse_amount` must distinguish the two failures, so validate the shape before constructing the `Decimal`:

```python
_AMOUNT = re.compile(r"[+-]?\d+(\.\d+)?")

def parse_amount(value: str) -> Decimal:
    if not _AMOUNT.fullmatch(value):
        raise ValueError(f"invalid amount: {value}")
    _, _, fraction = value.partition(".")
    if len(fraction) > 2:
        raise ValueError(f"amount has more than two fractional digits: {value}")
    return Decimal(value)
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add .gitignore ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: add Transaction model and transaction field validators"
```

---

### Task 2: `parse_transactions`

**Files:**
- Modify: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: `Transaction`, `ParseError`, `parse_date`, `parse_amount` from Task 1.
- Produces: `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — returns transactions in input order, raising `ParseError` on the first malformed row.

Pinned decisions (the spec leaves these open):

- Read with `csv.reader(io.StringIO(text))` and take line numbers from `reader.line_num`, so quoted commas and quoted newlines are handled and reported lines are physical lines.
- Rows that parse to `[]` (blank lines) are skipped anywhere in the file.
- A file with no non-blank rows at all (`""`, `"\n\n"`) is an empty ledger: return `[]`. A header-only file likewise returns `[]`.
- The first non-blank row is the header. It is valid when its three fields, stripped and lowercased, are `date`, `amount`, `description`; otherwise `ParseError(line, "expected header date,amount,description")`.
- Every field is stripped of surrounding whitespace before use, including the description.
- Wrong column count → `ParseError(line, "expected 3 columns, got <n>")`.
- A `ValueError` from `parse_date`/`parse_amount` becomes `ParseError(line, str(err))`.

- [ ] **Step 1: Write the failing tests (append to `test_parse.py`)**

```python
from ledgerlite.parse import parse_transactions

HEADER = "date,amount,description\n"


class ParseTransactionsTest(unittest.TestCase):
    def test_returns_rows_in_input_order(self):
        text = HEADER + "2026-03-05,2500.00,Salary\n2026-03-04,-7.50,Coffee\n"
        self.assertEqual(
            parse_transactions(text),
            [
                Transaction(date(2026, 3, 5), Decimal("2500.00"), "Salary"),
                Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee"),
            ],
        )

    def test_empty_and_header_only_files_have_no_transactions(self):
        for text in ("", "\n\n", HEADER, HEADER + "\n"):
            with self.subTest(text=text):
                self.assertEqual(parse_transactions(text), [])

    def test_strips_whitespace_around_fields(self):
        text = HEADER + " 2026-03-04 , -7.50 ,  Coffee  \n"
        self.assertEqual(
            parse_transactions(text),
            [Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee")],
        )

    def test_reads_quoted_description_containing_a_comma(self):
        text = HEADER + '2026-03-04,-7.50,"COFFEE, LTD"\n'
        self.assertEqual(parse_transactions(text)[0].description, "COFFEE, LTD")

    def test_skips_blank_lines_and_reports_physical_line_numbers(self):
        text = HEADER + "\n2026-03-04,-7.50,Coffee\n2026-03-05,abc,Rent\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 4)
        self.assertEqual(caught.exception.message, "invalid amount: abc")

    def test_reports_physical_line_after_a_quoted_newline(self):
        text = HEADER + '2026-03-04,-7.50,"COFFEE\nLTD"\n2026-03-05,abc,Rent\n'
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 4)

    def test_rejects_wrong_column_count(self):
        for row, count in (("2026-03-04,-7.50,Coffee,extra\n", 4), ("2026-03-04,-7.50\n", 2)):
            with self.subTest(row=row):
                with self.assertRaises(ParseError) as caught:
                    parse_transactions(HEADER + row)
                self.assertEqual(caught.exception.line, 2)
                self.assertEqual(caught.exception.message, f"expected 3 columns, got {count}")

    def test_rejects_bad_date_with_its_line(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "03/04/2026,-7.50,Coffee\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "invalid date: 03/04/2026")

    def test_rejects_a_wrong_header(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("d,a,desc\n2026-03-04,-7.50,Coffee\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(
            caught.exception.message, "expected header date,amount,description"
        )

    def test_accepts_header_with_odd_case_and_spacing(self):
        text = "Date, Amount ,DESCRIPTION\n2026-03-04,-7.50,Coffee\n"
        self.assertEqual(len(parse_transactions(text)), 1)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL with `ImportError: cannot import name 'parse_transactions'`

- [ ] **Step 3: Implement `parse_transactions(text: str) -> list[Transaction]` in `ledgerlite/parse.py`**

Follow the pinned decisions above. A single pass over `csv.reader`: skip `[]` rows; treat the first surviving row as the header and validate it; for later rows check length, then build a `Transaction` from the stripped fields, wrapping `ValueError` in `ParseError(reader.line_num, str(err))`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Transaction list"
```

---

### Task 3: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str) -> list[tuple[str, str]]` — ordered `(substring, category)` pairs; substrings are lowercased, categories keep their case.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — the category of the first rule whose substring occurs in the lowercased description, else `None`.

Pinned decisions (the spec leaves these open): a line is split on its **first** `=`, so a category may contain `=` but a substring may not; both sides are stripped; a line that is blank, has no `=`, or has an empty substring or empty category after stripping is skipped rather than raising — the spec defines no exit code for a bad rules file.

- [ ] **Step 1: Write the failing tests**

```python
# test_rules.py
import unittest

from ledgerlite.rules import categorize, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_keeps_order_and_lowercases_substrings(self):
        self.assertEqual(
            parse_rules("Coffee=food\nRENT=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_strips_whitespace_around_both_sides(self):
        self.assertEqual(parse_rules("  coffee = food  \n"), [("coffee", "food")])

    def test_splits_on_the_first_equals(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_skips_blank_and_malformed_lines(self):
        text = "\n   \nnoequals\n=food\ncoffee=\ncoffee=food\n"
        self.assertEqual(parse_rules(text), [("coffee", "food")])

    def test_empty_text_gives_no_rules(self):
        self.assertEqual(parse_rules(""), [])


class CategorizeTest(unittest.TestCase):
    def test_matches_substring_case_insensitively(self):
        self.assertEqual(categorize("MORNING COFFEE", [("coffee", "food")]), "food")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("shop", "retail")]
        self.assertEqual(categorize("Coffee Shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", [("coffee", "food")]))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Coffee", []))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `parse_rules` and `categorize` in `ledgerlite/rules.py`**

Use `str.partition("=")` for the first-`=` split; iterate `text.splitlines()`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules parsing and description categorization"
```

---

### Task 4: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` from Task 1.
- Produces:
  - `ledgerlite.balance.order_by_date(transactions: list[Transaction]) -> list[Transaction]` — ascending by date, input order preserved within a date (a stable sort; do not mutate the argument).
  - `ledgerlite.balance.closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — the running balance after the last transaction, accumulated in the order given; `opening` when the list is empty.

- [ ] **Step 1: Write the failing tests**

```python
# test_balance.py
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction

COFFEE = Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee")
RENT = Transaction(date(2026, 3, 2), Decimal("-900.00"), "Rent")
SALARY = Transaction(date(2026, 3, 4), Decimal("2500.00"), "Salary")


class OrderByDateTest(unittest.TestCase):
    def test_sorts_ascending_by_date(self):
        self.assertEqual(order_by_date([COFFEE, RENT]), [RENT, COFFEE])

    def test_keeps_input_order_within_the_same_date(self):
        self.assertEqual(order_by_date([SALARY, RENT, COFFEE]), [RENT, SALARY, COFFEE])

    def test_does_not_mutate_its_argument(self):
        given = [COFFEE, RENT]
        order_by_date(given)
        self.assertEqual(given, [COFFEE, RENT])

    def test_empty_list(self):
        self.assertEqual(order_by_date([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_every_amount_to_the_opening_balance(self):
        ordered = order_by_date([COFFEE, RENT, SALARY])
        self.assertEqual(closing_balance(ordered, Decimal("100")), Decimal("1692.50"))

    def test_no_transactions_leaves_the_opening_balance(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))
        self.assertEqual(closing_balance([], Decimal("0")), Decimal("0"))

    def test_negative_opening_balance(self):
        self.assertEqual(closing_balance([COFFEE], Decimal("-10.00")), Decimal("-17.50"))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `order_by_date` and `closing_balance` in `ledgerlite/balance.py`**

`sorted(..., key=...)` is already stable, which is what "ties keeping input order" requires.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```

---

### Task 5: Per-category totals

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 3).
- Produces: `ledgerlite.report.category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[tuple[str, Decimal]]` — one pair per category that has at least one transaction, alphabetical, with `uncategorized` last.

Pinned decisions (the spec leaves these open): "alphabetically" means case-insensitive, with the raw name as tiebreak (`key=lambda name: (name.lower(), name)`); a category with no matching transaction is not listed at all; if a rules file names a category `uncategorized` it merges into the same `uncategorized` line that unmatched transactions go to, still listed last.

- [ ] **Step 1: Write the failing tests**

```python
# test_report.py
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals

RULES = [("coffee", "food"), ("rent", "housing")]
COFFEE = Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee")
RENT = Transaction(date(2026, 3, 2), Decimal("-900.00"), "Rent")
SALARY = Transaction(date(2026, 3, 4), Decimal("2500.00"), "Salary")


class CategoryTotalsTest(unittest.TestCase):
    def test_alphabetical_with_uncategorized_last(self):
        self.assertEqual(
            category_totals([SALARY, RENT, COFFEE], RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                ("uncategorized", Decimal("2500.00")),
            ],
        )

    def test_sums_several_transactions_in_one_category(self):
        latte = Transaction(date(2026, 3, 6), Decimal("-3.25"), "COFFEE BAR")
        self.assertEqual(
            category_totals([COFFEE, latte], RULES), [("food", Decimal("-10.75"))]
        )

    def test_omits_categories_with_no_transactions(self):
        self.assertEqual(category_totals([COFFEE], RULES), [("food", Decimal("-7.50"))])

    def test_no_rules_means_everything_is_uncategorized(self):
        self.assertEqual(
            category_totals([COFFEE, SALARY], []),
            [("uncategorized", Decimal("2492.50"))],
        )

    def test_no_transactions_gives_no_totals(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_alphabetical_order_is_case_insensitive(self):
        rules = [("coffee", "Zoo"), ("rent", "apple")]
        self.assertEqual(
            [name for name, _ in category_totals([COFFEE, RENT], rules)],
            ["apple", "Zoo"],
        )

    def test_a_rule_named_uncategorized_merges_and_stays_last(self):
        rules = [("coffee", "uncategorized"), ("rent", "housing")]
        self.assertEqual(
            category_totals([COFFEE, RENT, SALARY], rules),
            [("housing", Decimal("-900.00")), ("uncategorized", Decimal("2492.50"))],
        )
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `category_totals` in `ledgerlite/report.py`**

Accumulate into a dict keyed by `categorize(...) or "uncategorized"`, then emit the non-`uncategorized` keys sorted by `(name.lower(), name)` followed by `uncategorized` if present. Define the literal once as a module constant `UNCATEGORIZED = "uncategorized"`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals with uncategorized last"
```

---

### Task 6: Amount and report formatting

**Files:**
- Modify: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `category_totals` output shape from Task 5.
- Produces:
  - `ledgerlite.report.format_amount(amount: Decimal) -> str` — exactly two fractional digits, leading `-` only for negatives, no thousands separators.
  - `ledgerlite.report.format_report(totals: list[tuple[str, Decimal]], closing: Decimal) -> str` — `<category>: <total>` per line, then a blank line, then `closing balance: <amount>`, ending with a single trailing newline. The blank line is always present, so a ledger with no transactions renders as `"\nclosing balance: 0.00\n"`.

- [ ] **Step 1: Write the failing tests (append to `test_report.py`)**

```python
from ledgerlite.report import format_amount, format_report


class FormatAmountTest(unittest.TestCase):
    def test_always_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1.5")), "1.50")
        self.assertEqual(format_amount(Decimal("1.50")), "1.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_negatives_keep_a_leading_minus(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("-900.00")), "-900.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.8")), "1234567.80")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")
        self.assertEqual(format_amount(Decimal("-7.50") + Decimal("7.50")), "0.00")


class FormatReportTest(unittest.TestCase):
    def test_matches_the_design_example(self):
        totals = [
            ("food", Decimal("-7.50")),
            ("housing", Decimal("-900.00")),
            ("uncategorized", Decimal("2500.00")),
        ]
        self.assertEqual(
            format_report(totals, Decimal("1692.50")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_categories_still_prints_the_closing_balance(self):
        self.assertEqual(format_report([], Decimal("0")), "\nclosing balance: 0.00\n")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL with `ImportError: cannot import name 'format_amount'`

- [ ] **Step 3: Implement `format_amount` and `format_report` in `ledgerlite/report.py`**

`format_amount` quantizes to two places and normalizes negative zero, then formats with `f"{...:f}"` (never `%f`/`float`):

```python
def format_amount(amount: Decimal) -> str:
    quantized = amount.quantize(Decimal("0.01"))
    if quantized == 0:
        quantized = abs(quantized)
    return f"{quantized:f}"
```

`format_report` joins `f"{name}: {format_amount(total)}"` lines, then `""`, then `f"closing balance: {format_amount(closing)}"`, with `"\n".join(...) + "\n"`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add amount and report formatting"
```

---

### Task 7: CLI

**Files:**
- Create: `ledgerlite/cli.py`, `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_transactions`, `ParseError`, `parse_amount` (Tasks 1–2); `parse_rules` (Task 3); `order_by_date`, `closing_balance` (Task 4); `category_totals`, `format_report` (Tasks 5–6).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — writes the report to stdout, errors to stderr, and returns the exit code without calling `sys.exit`.

Argument surface: `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]` via `ArgumentParser(prog="ledgerlite")` plus a required subparser named `report`. `--opening` defaults to `Decimal("0")` and uses a `type=` converter that calls `parse_amount` and re-raises failures as `argparse.ArgumentTypeError(str(err))`, so `--opening 1.005` is rejected the same way a row amount is.

Pinned decisions (the spec leaves these open): an unreadable `--rules` path produces the same `cannot read` message and exit 1 as an unreadable transactions file; the reason text is the OS message (`err.strerror or str(err)`); reading is `utf-8`, and a decoding failure is also a `cannot read`.

- [ ] **Step 1: Write the failing tests**

```python
# test_cli.py
import contextlib
import io
import pathlib
import subprocess
import sys
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-04,-7.50,Coffee\n"
    "2026-03-02,-900.00,Rent\n"
    "2026-03-04,2500.00,Salary\n"
)
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


class CliTest(unittest.TestCase):
    def setUp(self):
        self.dir = pathlib.Path(tempfile.mkdtemp())

    def write(self, name, text):
        path = self.dir / name
        path.write_text(text, encoding="utf-8")
        return str(path)

    def test_prints_the_design_example(self):
        csv_path = self.write("t.csv", TRANSACTIONS)
        rules_path = self.write("r.txt", RULES)
        code, out, err = run(
            ["report", csv_path, "--rules", rules_path, "--opening", "100"]
        )
        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_without_rules_everything_is_uncategorized(self):
        code, out, _ = run(["report", self.write("t.csv", TRANSACTIONS)])
        self.assertEqual(code, 0)
        self.assertEqual(
            out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n"
        )

    def test_empty_file_reports_the_opening_balance(self):
        code, out, err = run(["report", self.write("t.csv", ""), "--opening", "100"])
        self.assertEqual((code, out, err), (0, "\nclosing balance: 100.00\n", ""))

    def test_negative_opening_balance(self):
        csv_path = self.write("t.csv", "date,amount,description\n2026-03-04,-7.50,Coffee\n")
        code, out, _ = run(["report", csv_path, "--opening", "-12.50"])
        self.assertEqual(code, 0)
        self.assertIn("closing balance: -20.00\n", out)

    def test_unreadable_transactions_file_returns_1(self):
        missing = str(self.dir / "nope.csv")
        code, out, err = run(["report", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "))
        self.assertIn("No such file or directory", err)

    def test_unreadable_rules_file_returns_1(self):
        csv_path = self.write("t.csv", TRANSACTIONS)
        missing = str(self.dir / "nope.txt")
        code, out, err = run(["report", csv_path, "--rules", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "))

    def test_malformed_row_returns_2_and_prints_nothing_to_stdout(self):
        csv_path = self.write(
            "t.csv", "date,amount,description\n2026-03-04,-7.50,Coffee\n2026-03-05,abc,Rent\n"
        )
        code, out, err = run(["report", csv_path])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {csv_path}:3: invalid amount: abc\n")

    def test_rejects_an_opening_amount_with_three_fractional_digits(self):
        csv_path = self.write("t.csv", TRANSACTIONS)
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                main(["report", csv_path, "--opening", "1.005"])
        self.assertEqual(caught.exception.code, 2)


class ModuleEntryPointTest(unittest.TestCase):
    def test_runs_as_python_m_ledgerlite(self):
        root = pathlib.Path(__file__).parent
        with tempfile.TemporaryDirectory() as tmp:
            csv_path = pathlib.Path(tmp) / "t.csv"
            csv_path.write_text(TRANSACTIONS, encoding="utf-8")
            rules_path = pathlib.Path(tmp) / "r.txt"
            rules_path.write_text(RULES, encoding="utf-8")
            done = subprocess.run(
                [
                    sys.executable, "-m", "ledgerlite", "report", str(csv_path),
                    "--rules", str(rules_path), "--opening", "100",
                ],
                capture_output=True, text=True, cwd=root,
            )
        self.assertEqual(done.returncode, 0, done.stderr)
        self.assertEqual(done.stdout, EXPECTED)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `main(argv: list[str] | None = None) -> int` in `ledgerlite/cli.py`**

Build the parser as described above, then: read the transactions file → `parse_transactions` → read and parse the rules file if `--rules` was given → `order_by_date` → `closing_balance` → `category_totals` → `sys.stdout.write(format_report(...))` → return 0. Because nothing may reach stdout on failure, do all reading and parsing before the first write.

Two small helpers keep the error paths honest:

```python
def _read(path: str) -> str:
    return pathlib.Path(path).read_text(encoding="utf-8")


def _reason(err: Exception) -> str:
    return getattr(err, "strerror", None) or str(err)
```

Each read is wrapped in `except (OSError, UnicodeDecodeError) as err:` → print `f"ledgerlite: cannot read {path}: {_reason(err)}"` to `sys.stderr` and return 1. `parse_transactions` is wrapped in `except ParseError as err:` → print `f"ledgerlite: {path}:{err.line}: {err.message}"` to `sys.stderr` and return 2.

- [ ] **Step 4: Create `ledgerlite/__main__.py`**

`sys.exit(main())` under an `if __name__ == "__main__":` guard, importing `main` from `.cli`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS

- [ ] **Step 6: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS, all five test modules, zero failures and zero errors

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report CLI"
```
