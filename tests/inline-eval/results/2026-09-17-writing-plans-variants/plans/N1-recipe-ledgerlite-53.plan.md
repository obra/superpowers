# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only Python CLI that reads a bank-transaction CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each: `model` (the record type), `parse` (bytes on disk → `list[Transaction]`, or a `ParseError` naming the offending line), `rules` (rules text → ordered `(substring, category)` pairs, plus matching), `balance` (date ordering and the running/closing balance), `report` (per-category totals and text formatting), `cli` (argparse, exit codes, stderr messages). Data flows one way — `cli` → `parse`/`rules` → `balance`/`report` — so every module below `cli` is pure and directly unit-testable, and `cli` owns all I/O error translation.

**Tech Stack:** Python 3.11+, standard library only (`argparse`, `csv`, `dataclasses`, `datetime`, `decimal`, `re`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Python 3.11+. Standard library only — no third-party packages, no `pyproject.toml`, no dependencies.
- Money is `decimal.Decimal` everywhere. Never `float`. Never `f"{x:.2f}"` on a float, never `float(...)`, never `round(...)` on a float.
- Package lives at `ledgerlite/` with exactly the modules the spec's layout names: `__init__.py`, `model.py`, `parse.py`, `rules.py`, `balance.py`, `report.py`, `cli.py`. No other modules.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest` from the repo root.
- Exit codes: `0` success, `1` a file could not be read, `2` the transactions file had a malformed row.
- Error messages go to stderr, prefixed `ledgerlite: `. Report output goes to stdout.
- Amounts print with exactly two fractional digits, a leading `-` only for negatives, no thousands separators.
- This is a local scratch repo with no remote. Work directly on `main`. Commit after every task; never `git push`.

## Review Focus

Five things the spec implies but does not spell out, most likely to bite a real user first. Each already has a test assigned to the task that owns the code.

1. **A CSV exported from a spreadsheet starts with a UTF-8 BOM** — `﻿date` must still be recognized as the header, not reported as a missing header row. (Task 2)
2. **A file that is not valid UTF-8 at all** (a `café` description in latin-1) must exit 1 with `cannot read`, not crash with a `UnicodeDecodeError` traceback. (Tasks 2 and 6)
3. **`--rules` pointing at a file that does not exist** must exit 1 with the same `cannot read` message shape as a missing transactions file, not a traceback. The spec only names the transactions file; the same treatment is the only non-surprising answer. (Task 6)
4. **A rules file that maps something to the literal category `uncategorized`** must merge into the single `uncategorized` bucket printed last, not produce two lines or an alphabetically-placed one. (Task 5)
5. **A zero total printing as `-0.00`** (from an amount written `-0.00`) must print `0.00`; the spec's format list shows `0.00` and no negative zero. (Task 5)

Also pinned, in the tasks that own them: blank lines inside the CSV are skipped without shifting reported line numbers (Task 2); `2026-02-30` and `20260304` are rejected as dates (Task 2); `1e2` and `1,5` are rejected as amounts (Task 1); a rule with an empty substring does not match everything (Task 3); `--opening 1.005` is rejected instead of silently truncated (Task 6).

---

## File Structure

| File | Responsibility |
|---|---|
| `ledgerlite/__init__.py` | Empty package marker. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. Nothing else. |
| `ledgerlite/parse.py` | `parse_amount` (the one place the amount grammar lives), `ParseError`, `parse_transactions`. |
| `ledgerlite/rules.py` | `parse_rules`, `load_rules`, `categorize`. |
| `ledgerlite/balance.py` | `sort_by_date`, `closing_balance`. |
| `ledgerlite/report.py` | `UNCATEGORIZED`, `format_amount`, `category_totals`, `format_report`. |
| `ledgerlite/cli.py` | `main(argv)`; argparse wiring, exit codes, stderr messages. |
| `test_model.py` | Task 1. |
| `test_parse.py` | Tasks 1–2. |
| `test_rules.py` | Task 3. |
| `test_balance.py` | Task 4. |
| `test_report.py` | Task 5. |
| `test_cli.py` | Task 6. |

### Decisions the spec leaves open, resolved once here

Every task must honor these; they are the reason the tests below assert what they assert.

- **Amount grammar:** `re.fullmatch(r"[+-]?(?:\d+(?:\.\d+)?|\.\d+)", stripped)`. So `1`, `1.5`, `1.50`, `-12.50`, `+2500`, `.5` are decimal numbers; `1e2`, `1,5`, `1.`, `NaN`, `Infinity`, `""`, `abc` are not. A value that matches but has 3+ digits after the `.` is a *different* error than a value that does not match, because the spec names those two faults separately.
- **Date grammar:** `re.fullmatch(r"\d{4}-\d{2}-\d{2}", stripped)` and then `datetime.date.fromisoformat`. ISO 8601 basic form (`20260304`) and week dates are rejected even though 3.11's `fromisoformat` accepts them; the spec's example is the extended form and one accepted shape keeps errors predictable.
- **Whitespace:** the `date` and `amount` fields are stripped before parsing. `description` is used verbatim.
- **Header row:** required. Its three fields, stripped and lowercased, must be `date`, `amount`, `description` in that order. An empty file is a missing header row (line 1). A header-only file is zero transactions.
- **Blank CSV rows:** a row with no fields, or whose fields are all empty after stripping, is skipped anywhere in the file — a trailing blank line should not reject a whole export.
- **Line numbers** in `ParseError` come from `csv.reader.line_num`, so they are physical file lines and are unaffected by skipped blanks.
- **Encoding:** files open with `encoding="utf-8-sig"` (strips a BOM if present) and `newline=""` for the CSV.
- **Rules file:** each line is stripped; empty lines are ignored; a line with no `=` is ignored; the split is on the *first* `=`; substring and category are each stripped; a rule whose substring or category is empty after stripping is ignored. Matching lowercases both sides.
- **Category ordering:** plain string `sorted()` (codepoint order, so `Food` sorts before `food`). `uncategorized` is moved to last regardless.
- **Uncategorized line:** printed only when at least one transaction lands in that bucket.
- **`--opening`** is parsed with the same `parse_amount` grammar; a bad value is an argparse error (usage on stderr, exit 2).
- **Unreadable file** covers both `OSError` and `UnicodeDecodeError`; the reason text is `e.strerror` when it is set, otherwise `str(e)`.

---

## Task 1: Package skeleton, `Transaction`, and the amount grammar

**Files:**
- Create: `ledgerlite/__init__.py`, `ledgerlite/model.py`, `ledgerlite/parse.py`
- Test: `test_model.py`, `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass, fields in order `date: datetime.date`, `amount: decimal.Decimal`, `description: str`.
  - `ledgerlite.parse.parse_amount(raw: str) -> Decimal` — raises `ValueError`.
  - `ledgerlite.parse.ParseError(path: str, line: int, message: str)` — `Exception` subclass with attributes `path`, `line`, `message`; `str(err) == f"{path}:{line}: {message}"`.

- [ ] **Step 1: Write the failing tests**

Create `test_model.py`:

```python
import unittest
from dataclasses import FrozenInstanceError
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction


class TransactionTest(unittest.TestCase):
    def test_holds_date_amount_description(self):
        txn = Transaction(date(2026, 3, 4), Decimal("-7.50"), "Morning Coffee")
        self.assertEqual(txn.date, date(2026, 3, 4))
        self.assertEqual(txn.amount, Decimal("-7.50"))
        self.assertEqual(txn.description, "Morning Coffee")

    def test_is_frozen(self):
        txn = Transaction(date(2026, 3, 4), Decimal("1.00"), "x")
        with self.assertRaises(FrozenInstanceError):
            txn.amount = Decimal("2.00")

    def test_equality_is_by_value(self):
        self.assertEqual(
            Transaction(date(2026, 3, 4), Decimal("1.00"), "x"),
            Transaction(date(2026, 3, 4), Decimal("1.00"), "x"),
        )


if __name__ == "__main__":
    unittest.main()
```

And `test_parse.py`:

```python
import unittest
from decimal import Decimal

from ledgerlite.parse import ParseError, parse_amount


class ParseAmountTest(unittest.TestCase):
    def test_accepts_decimal_numbers(self):
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("1.50"), Decimal("1.50"))
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))
        self.assertEqual(parse_amount("+2500"), Decimal("2500"))
        self.assertEqual(parse_amount("0"), Decimal("0"))
        self.assertEqual(parse_amount(".5"), Decimal("0.5"))

    def test_strips_surrounding_whitespace(self):
        self.assertEqual(parse_amount("  -7.50 "), Decimal("-7.50"))

    def test_rejects_more_than_two_fractional_digits(self):
        with self.assertRaises(ValueError) as ctx:
            parse_amount("1.005")
        self.assertEqual(
            str(ctx.exception), "amount has more than two fractional digits: 1.005"
        )

    def test_rejects_values_that_are_not_decimal_numbers(self):
        for raw in ("", "abc", "1e2", "1,5", "1.", "1.2.3", "NaN", "Infinity", "$1.00"):
            with self.subTest(raw=raw):
                with self.assertRaises(ValueError) as ctx:
                    parse_amount(raw)
                self.assertEqual(
                    str(ctx.exception), f"amount is not a decimal number: {raw}"
                )


class ParseErrorTest(unittest.TestCase):
    def test_carries_path_line_message(self):
        err = ParseError("txns.csv", 4, "wrong column count: 2")
        self.assertEqual((err.path, err.line, err.message), ("txns.csv", 4, "wrong column count: 2"))
        self.assertEqual(str(err), "txns.csv:4: wrong column count: 2")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_model test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Create the package and `Transaction`**

Create empty `ledgerlite/__init__.py`. In `ledgerlite/model.py`, define `Transaction` with `@dataclass(frozen=True)` and the three annotated fields in the order given in Interfaces.

- [ ] **Step 4: Implement `parse_amount(raw: str) -> Decimal` and `ParseError` in `ledgerlite/parse.py`**

`parse_amount` strips `raw`, and if it does not `re.fullmatch(r"[+-]?(?:\d+(?:\.\d+)?|\.\d+)", stripped)` raises `ValueError(f"amount is not a decimal number: {stripped}")`. Otherwise, if the text after the first `.` is longer than two characters, raises `ValueError(f"amount has more than two fractional digits: {stripped}")`. Otherwise returns `Decimal(stripped)`.

`ParseError.__init__` stores `path`, `line`, `message` and calls `super().__init__(f"{path}:{line}: {message}")`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_model test_parse -v`
Expected: PASS, all green

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_model.py test_parse.py
git commit -m "feat: add Transaction model and strict amount parsing"
```

---

## Task 2: `parse_transactions`

**Files:**
- Modify: `ledgerlite/parse.py`
- Test: `test_parse.py` (append)

**Interfaces:**
- Consumes: `Transaction`, `parse_amount`, `ParseError` from Task 1.
- Produces: `ledgerlite.parse.parse_transactions(path: str) -> list[Transaction]` — returns rows in **file order** (it does not sort). Raises `ParseError` for a malformed file. Lets `OSError` and `UnicodeDecodeError` propagate to the caller unchanged.

- [ ] **Step 1: Write the failing tests**

Append to `test_parse.py`, adding to its imports: `import os`, `import shutil`, `import tempfile`, `from datetime import date`, `from ledgerlite.model import Transaction`, and `parse_transactions` alongside the existing names from `ledgerlite.parse`:

```python
HEADER = "date,amount,description\n"  # module level, above the new class


class TransactionsFileTest(unittest.TestCase):  # insert before the `if __name__` block
    def write(self, text, encoding="utf-8"):
        return self.write_bytes(text.encode(encoding))

    def write_bytes(self, data):
        directory = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, directory)
        path = os.path.join(directory, "txns.csv")
        with open(path, "wb") as handle:
            handle.write(data)
        return path

    def test_parses_rows_in_file_order(self):
        path = self.write(
            HEADER
            + "2026-03-10,2500.00,Salary\n"
            + "2026-03-04,-7.50,Morning Coffee\n"
        )
        self.assertEqual(
            parse_transactions(path),
            [
                Transaction(date(2026, 3, 10), Decimal("2500.00"), "Salary"),
                Transaction(date(2026, 3, 4), Decimal("-7.50"), "Morning Coffee"),
            ],
        )

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(self.write(HEADER)), [])

    def test_accepts_quoted_description_containing_a_comma(self):
        path = self.write(HEADER + '2026-03-04,-7.50,"Coffee, large"\n')
        self.assertEqual(parse_transactions(path)[0].description, "Coffee, large")

    def test_accepts_crlf_line_endings(self):
        path = self.write("date,amount,description\r\n2026-03-04,-7.50,Coffee\r\n")
        self.assertEqual(len(parse_transactions(path)), 1)

    def test_accepts_a_utf8_bom(self):
        path = self.write(HEADER + "2026-03-04,-7.50,Coffee\n", encoding="utf-8-sig")
        self.assertEqual(parse_transactions(path)[0].amount, Decimal("-7.50"))

    def test_skips_blank_rows_without_shifting_line_numbers(self):
        path = self.write(
            HEADER
            + "2026-03-04,-7.50,Coffee\n"
            + "\n"
            + "2026-03-05,nope,Rent\n"
        )
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(path)
        self.assertEqual(ctx.exception.line, 4)

    def test_empty_file_is_a_missing_header(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(self.write(""))
        self.assertEqual(ctx.exception.line, 1)
        self.assertEqual(ctx.exception.message, "missing header row")

    def test_wrong_header_is_rejected(self):
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(self.write("amount,date,description\n"))
        self.assertEqual(ctx.exception.line, 1)
        self.assertEqual(
            ctx.exception.message, "expected header row date,amount,description"
        )

    def test_wrong_column_count_is_rejected(self):
        path = self.write(HEADER + "2026-03-04,-7.50\n")
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(path)
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(ctx.exception.message, "wrong column count: 2")

    def test_unparseable_dates_are_rejected(self):
        for raw in ("2026-02-30", "20260304", "04/03/2026", "March 4"):
            with self.subTest(raw=raw):
                path = self.write(HEADER + f"{raw},-7.50,Coffee\n")
                with self.assertRaises(ParseError) as ctx:
                    parse_transactions(path)
                self.assertEqual(ctx.exception.line, 2)
                self.assertEqual(
                    ctx.exception.message,
                    f"date is not a valid ISO 8601 date: {raw}",
                )

    def test_bad_amount_is_reported_with_the_amount_message(self):
        path = self.write(HEADER + "2026-03-04,1.005,Coffee\n")
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(path)
        self.assertEqual(ctx.exception.line, 2)
        self.assertEqual(
            ctx.exception.message, "amount has more than two fractional digits: 1.005"
        )

    def test_error_names_the_path(self):
        path = self.write(HEADER + "2026-03-04,abc,Coffee\n")
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(path)
        self.assertEqual(ctx.exception.path, path)

    def test_first_bad_row_wins(self):
        path = self.write(HEADER + "bad,-7.50,A\n" + "2026-03-05,bad,B\n")
        with self.assertRaises(ParseError) as ctx:
            parse_transactions(path)
        self.assertEqual(ctx.exception.line, 2)

    def test_undecodable_bytes_propagate(self):
        path = self.write_bytes(
            HEADER.encode() + b"2026-03-04,-7.50,caf\xe9\n"
        )
        with self.assertRaises(UnicodeDecodeError):
            parse_transactions(path)

    def test_missing_file_propagates_oserror(self):
        with self.assertRaises(FileNotFoundError):
            parse_transactions("/nonexistent/txns.csv")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ImportError: cannot import name 'parse_transactions'`

- [ ] **Step 3: Implement `parse_transactions(path: str) -> list[Transaction]` in `ledgerlite/parse.py`**

Open with `open(path, newline="", encoding="utf-8-sig")` and wrap the handle in `csv.reader`. Pull the first row: if there is none, raise `ParseError(path, 1, "missing header row")`; if its fields stripped and lowercased are not `["date", "amount", "description"]`, raise `ParseError(path, 1, "expected header row date,amount,description")`. Then for each remaining row, using `reader.line_num` as the line number:

- skip it if every field is empty after stripping (including the no-field case);
- raise `ParseError(path, line, f"wrong column count: {len(row)}")` unless it has exactly 3 fields;
- validate the stripped date against `re.fullmatch(r"\d{4}-\d{2}-\d{2}", ...)` and `date.fromisoformat`, raising `ParseError(path, line, f"date is not a valid ISO 8601 date: {stripped}")` if either rejects it;
- call `parse_amount` and re-raise any `ValueError` as `ParseError(path, line, str(exc))`;
- append `Transaction(parsed_date, amount, description)` with the description verbatim.

Return the list. Do not catch `OSError` or `UnicodeDecodeError`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV with per-line error reporting"
```

---

## Task 3: Rules parsing and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.rules.parse_rules(text: str) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order.
  - `ledgerlite.rules.load_rules(path: str) -> list[tuple[str, str]]` — reads the file with `encoding="utf-8-sig"`; lets `OSError`/`UnicodeDecodeError` propagate.
  - `ledgerlite.rules.categorize(description: str, rules: list[tuple[str, str]]) -> str | None`

- [ ] **Step 1: Write the failing tests**

Create `test_rules.py`:

```python
import os
import shutil
import tempfile
import unittest

from ledgerlite.rules import categorize, load_rules, parse_rules


class ParseRulesTest(unittest.TestCase):
    def test_parses_one_rule_per_line_in_order(self):
        self.assertEqual(
            parse_rules("coffee=food\nrent=housing\n"),
            [("coffee", "food"), ("rent", "housing")],
        )

    def test_ignores_blank_lines(self):
        self.assertEqual(parse_rules("\n  \ncoffee=food\n\n"), [("coffee", "food")])

    def test_ignores_lines_without_a_separator(self):
        self.assertEqual(parse_rules("nonsense\ncoffee=food\n"), [("coffee", "food")])

    def test_splits_on_the_first_separator(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])

    def test_strips_whitespace_around_both_parts(self):
        self.assertEqual(parse_rules("  coffee  =  food  \n"), [("coffee", "food")])

    def test_ignores_rules_with_an_empty_substring_or_category(self):
        self.assertEqual(parse_rules("=food\ncoffee=\n =  \n"), [])

    def test_handles_text_without_a_trailing_newline(self):
        self.assertEqual(parse_rules("coffee=food"), [("coffee", "food")])


class CategorizeTest(unittest.TestCase):
    RULES = [("coffee", "food"), ("rent", "housing")]

    def test_matches_a_substring_case_insensitively(self):
        self.assertEqual(categorize("MORNING COFFEE", self.RULES), "food")
        self.assertEqual(categorize("Rent March", self.RULES), "housing")

    def test_matches_when_the_rule_is_uppercase(self):
        self.assertEqual(categorize("morning coffee", [("COFFEE", "food")]), "food")

    def test_first_matching_rule_wins(self):
        rules = [("coffee", "food"), ("coffee shop", "treats")]
        self.assertEqual(categorize("Coffee Shop", rules), "food")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(categorize("Salary", self.RULES))

    def test_returns_none_with_no_rules(self):
        self.assertIsNone(categorize("Anything", []))


class LoadRulesTest(unittest.TestCase):
    def write(self, text, encoding="utf-8"):
        directory = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, directory)
        path = os.path.join(directory, "rules.txt")
        with open(path, "w", encoding=encoding) as handle:
            handle.write(text)
        return path

    def test_reads_and_parses_a_file(self):
        path = self.write("coffee=food\nrent=housing\n")
        self.assertEqual(load_rules(path), [("coffee", "food"), ("rent", "housing")])

    def test_tolerates_a_utf8_bom(self):
        path = self.write("coffee=food\n", encoding="utf-8-sig")
        self.assertEqual(load_rules(path), [("coffee", "food")])

    def test_missing_file_propagates_oserror(self):
        with self.assertRaises(FileNotFoundError):
            load_rules("/nonexistent/rules.txt")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `parse_rules`, `load_rules`, and `categorize` in `ledgerlite/rules.py`**

`parse_rules` walks `text.splitlines()`, strips each line, skips it when empty or when `"="` is absent, splits once on `"="`, strips both halves, and keeps the pair only when both halves are non-empty.

`categorize` lowercases the description once, then returns the category of the first rule whose lowercased substring is contained in it, else `None`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_rules -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: add rules parsing and case-insensitive categorization"
```

---

## Task 4: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` from Task 1.
- Produces:
  - `ledgerlite.balance.sort_by_date(transactions: list[Transaction]) -> list[Transaction]` — a new list, stable so same-date rows keep input order; the argument is not mutated.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal` — the running balance after the last transaction in date order, or `opening` when there are none.

- [ ] **Step 1: Write the failing tests**

Create `test_balance.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, sort_by_date
from ledgerlite.model import Transaction


def txn(day, amount, description):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class SortByDateTest(unittest.TestCase):
    def test_orders_by_date(self):
        rows = [txn(10, "2500.00", "Salary"), txn(4, "-7.50", "Coffee")]
        self.assertEqual(
            [t.description for t in sort_by_date(rows)], ["Coffee", "Salary"]
        )

    def test_ties_keep_input_order(self):
        rows = [txn(4, "-1.00", "second-in-file"), txn(4, "-2.00", "third-in-file")]
        self.assertEqual(
            [t.description for t in sort_by_date(rows)],
            ["second-in-file", "third-in-file"],
        )

    def test_does_not_mutate_the_input(self):
        rows = [txn(10, "1.00", "b"), txn(4, "1.00", "a")]
        sort_by_date(rows)
        self.assertEqual([t.description for t in rows], ["b", "a"])

    def test_empty_list(self):
        self.assertEqual(sort_by_date([]), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_no_transactions_returns_the_opening_amount(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_adds_every_amount(self):
        rows = [
            txn(10, "2500.00", "Salary"),
            txn(4, "-7.50", "Coffee"),
            txn(5, "-900.00", "Rent"),
        ]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_stays_exact_with_decimals(self):
        rows = [txn(4, "0.10", "a"), txn(5, "0.20", "b")]
        self.assertEqual(closing_balance(Decimal("0"), rows), Decimal("0.30"))

    def test_result_is_a_decimal(self):
        self.assertIsInstance(closing_balance(Decimal("0"), [txn(4, "1.00", "a")]), Decimal)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `sort_by_date` and `closing_balance` in `ledgerlite/balance.py`**

`sort_by_date` returns `sorted(transactions, key=...)` on the date (Python's sort is stable, which is exactly the tie rule). `closing_balance` starts at `opening` and accumulates each amount walking `sort_by_date(transactions)` — walk the ordered list rather than summing the raw input, so the code says what the spec says.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```

---

## Task 5: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 3), `sort_by_date` and `closing_balance` (Task 4).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED: str = "uncategorized"`
  - `ledgerlite.report.format_amount(amount: Decimal) -> str`
  - `ledgerlite.report.category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[tuple[str, Decimal]]` — display order: categories sorted, then `uncategorized` last if present.
  - `ledgerlite.report.format_report(transactions: list[Transaction], rules: list[tuple[str, str]], opening: Decimal) -> str` — the whole report, ending in exactly one `"\n"`.

- [ ] **Step 1: Write the failing tests**

Create `test_report.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import UNCATEGORIZED, category_totals, format_amount, format_report

RULES = [("coffee", "food"), ("rent", "housing")]


def txn(day, amount, description):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


EXAMPLE = [
    txn(10, "2500.00", "Salary"),
    txn(4, "-7.50", "Morning Coffee"),
    txn(5, "-900.00", "Rent March"),
]


class FormatAmountTest(unittest.TestCase):
    def test_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-12.50")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("2500.5")), "2500.50")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_per_category_alphabetically_with_uncategorized_last(self):
        self.assertEqual(
            category_totals(EXAMPLE, RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                (UNCATEGORIZED, Decimal("2500.00")),
            ],
        )

    def test_sums_several_transactions_in_one_category(self):
        rows = [txn(4, "-7.50", "Coffee"), txn(6, "-2.50", "coffee beans")]
        self.assertEqual(category_totals(rows, RULES), [("food", Decimal("-10.00"))])

    def test_omits_uncategorized_when_everything_matched(self):
        self.assertEqual(
            category_totals([txn(4, "-7.50", "Coffee")], RULES),
            [("food", Decimal("-7.50"))],
        )

    def test_a_rule_named_uncategorized_merges_into_the_last_bucket(self):
        rows = [txn(4, "-7.50", "Mystery Fee"), txn(5, "2500.00", "Salary")]
        self.assertEqual(
            category_totals(rows, [("mystery", "uncategorized")]),
            [(UNCATEGORIZED, Decimal("2492.50"))],
        )

    def test_no_rules_means_everything_is_uncategorized(self):
        self.assertEqual(
            category_totals(EXAMPLE, []), [(UNCATEGORIZED, Decimal("1592.50"))]
        )

    def test_empty_input_has_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_category_names_sort_by_codepoint(self):
        rows = [txn(4, "-1.00", "Aaa"), txn(5, "-2.00", "bbb")]
        rules = [("aaa", "food"), ("bbb", "Food")]
        self.assertEqual(
            category_totals(rows, rules),
            [("Food", Decimal("-2.00")), ("food", Decimal("-1.00"))],
        )


class FormatReportTest(unittest.TestCase):
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
            format_report([], RULES, Decimal("0")), "\nclosing balance: 0.00\n"
        )

    def test_uses_the_opening_amount(self):
        self.assertEqual(
            format_report([txn(4, "-7.50", "Coffee")], RULES, Decimal("10")),
            "food: -7.50\n\nclosing balance: 2.50\n",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `format_amount(amount: Decimal) -> str` in `ledgerlite/report.py`**

Return `format(amount, ".2f")` — `Decimal.__format__`, never `float` — after replacing a value equal to zero with its absolute value so `-0.00` cannot reach the output.

- [ ] **Step 4: Implement `category_totals(transactions, rules) -> list[tuple[str, Decimal]]`**

Accumulate each transaction's amount into a dict keyed by `categorize(t.description, rules) or UNCATEGORIZED`, starting each key at `Decimal("0.00")`. Then return the non-`UNCATEGORIZED` keys `sorted()` with their totals, followed by the `UNCATEGORIZED` entry if that key exists.

- [ ] **Step 5: Implement `format_report(transactions, rules, opening) -> str`**

One `f"{name}: {format_amount(total)}\n"` line per entry from `category_totals`, then `"\n"`, then `f"closing balance: {format_amount(closing_balance(opening, sort_by_date(transactions)))}\n"`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals and report formatting"
```

---

## Task 6: CLI entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_transactions`, `parse_amount`, `ParseError` (Tasks 1–2); `load_rules` (Task 3); `format_report` (Task 5).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — `argv` excludes the program name and defaults to `sys.argv[1:]`.

- [ ] **Step 1: Write the failing tests**

Create `test_cli.py`:

```python
import contextlib
import io
import os
import shutil
import tempfile
import unittest

from ledgerlite.cli import main

TXNS = (
    "date,amount,description\n"
    "2026-03-10,2500.00,Salary\n"
    "2026-03-04,-7.50,Morning Coffee\n"
    "2026-03-05,-900.00,Rent March\n"
)
EXPECTED = (
    "food: -7.50\n"
    "housing: -900.00\n"
    "uncategorized: 2500.00\n"
    "\n"
    "closing balance: 1692.50\n"
)


class CliTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.directory)

    def write(self, name, text):
        path = os.path.join(self.directory, name)
        with open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(text)
        return path

    def run_cli(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_reports_with_rules_and_opening(self):
        txns = self.write("txns.csv", TXNS)
        rules = self.write("rules.txt", "coffee=food\nrent=housing\n")
        code, out, err = self.run_cli(["report", txns, "--rules", rules, "--opening", "100"])
        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_without_rules_everything_is_uncategorized(self):
        txns = self.write("txns.csv", TXNS)
        code, out, err = self.run_cli(["report", txns])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_opening_defaults_to_zero(self):
        txns = self.write("txns.csv", "date,amount,description\n")
        code, out, _ = self.run_cli(["report", txns])
        self.assertEqual((code, out), (0, "\nclosing balance: 0.00\n"))

    def test_missing_transactions_file_exits_1(self):
        path = os.path.join(self.directory, "nope.csv")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

    def test_missing_rules_file_exits_1(self):
        txns = self.write("txns.csv", TXNS)
        rules = os.path.join(self.directory, "nope.txt")
        code, out, err = self.run_cli(["report", txns, "--rules", rules])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: cannot read {rules}: No such file or directory\n")

    def test_undecodable_transactions_file_exits_1(self):
        path = os.path.join(self.directory, "latin1.csv")
        with open(path, "wb") as handle:
            handle.write(b"date,amount,description\n2026-03-04,-7.50,caf\xe9\n")
        code, out, err = self.run_cli(["report", path])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {path}: "), err)
        self.assertTrue(err.endswith("\n"))

    def test_malformed_row_exits_2_with_nothing_on_stdout(self):
        txns = self.write(
            "txns.csv", "date,amount,description\n2026-03-04,-7.50,Coffee\n2026-03-05,-900.00\n"
        )
        code, out, err = self.run_cli(["report", txns])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {txns}:3: wrong column count: 2\n")

    def test_bad_opening_amount_is_a_usage_error(self):
        txns = self.write("txns.csv", TXNS)
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as ctx:
                main(["report", txns, "--opening", "1.005"])
        self.assertEqual(ctx.exception.code, 2)

    def test_missing_subcommand_is_a_usage_error(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as ctx:
                main([])
        self.assertEqual(ctx.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `main(argv: list[str] | None = None) -> int` in `ledgerlite/cli.py`**

Build an `ArgumentParser(prog="ledgerlite")` with `add_subparsers(dest="command", required=True)` and one `report` subparser taking a positional `transactions`, an optional `--rules`, and `--opening` with `type=parse_amount` and `default=Decimal("0")`. (`argparse` turns the `ValueError` from `parse_amount` into its own usage error and exits 2, which is what the bad-`--opening` test expects.)

Then:

```python
try:
    transactions = parse_transactions(args.transactions)
    rules = load_rules(args.rules) if args.rules else []
except ParseError as exc:
    print(f"ledgerlite: {exc}", file=sys.stderr)
    return 2
except (OSError, UnicodeDecodeError) as exc:
    path = getattr(exc, "filename", None) or args.transactions
    reason = getattr(exc, "strerror", None) or str(exc)
    print(f"ledgerlite: cannot read {path}: {reason}", file=sys.stderr)
    return 1
print(format_report(transactions, rules, args.opening), end="")
return 0
```

(The `filename` lookup is what makes the missing-`--rules` message name the rules file. `UnicodeDecodeError` has no `filename`, so it falls back to the transactions path.)

End the module with `if __name__ == "__main__": sys.exit(main())`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS

- [ ] **Step 5: Run the whole suite and the tool end to end**

Run: `python3 -m unittest -v`
Expected: PASS, all tests from all five test files.

Then, from the repo root:

```bash
printf 'date,amount,description\n2026-03-10,2500.00,Salary\n2026-03-04,-7.50,Morning Coffee\n2026-03-05,-900.00,Rent March\n' > /tmp/txns.csv
printf 'coffee=food\nrent=housing\n' > /tmp/rules.txt
python3 -m ledgerlite.cli report /tmp/txns.csv --rules /tmp/rules.txt --opening 100
```

Expected: exactly the report from `design.md`:

```
food: -7.50
housing: -900.00
uncategorized: 2500.00

closing balance: 1692.50
```

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py test_cli.py
git commit -m "feat: add ledgerlite report CLI with exit codes"
```
