### Task 4: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `Rule` and `categorize` (Task 2), `closing_balance` (Task 3).
- Produces:
  - `ledgerlite.report.UNCATEGORIZED = "uncategorized"`.
  - `ledgerlite.report.format_amount(amount: Decimal) -> str` — exactly two fractional digits, leading `-` only for genuinely negative values, no thousands separators.
  - `ledgerlite.report.category_totals(transactions: list[Transaction], rules: list[Rule]) -> list[tuple[str, Decimal]]` — one entry per category that has at least one transaction, alphabetical, with `UNCATEGORIZED` last if present.
  - `ledgerlite.report.format_report(transactions: list[Transaction], rules: list[Rule], opening: Decimal) -> str` — the whole report with **no** trailing newline, so the caller can `print()` it.

A rule whose category is literally `uncategorized` lands in the same bucket as unmatched transactions and is still listed last; that is acceptable and needs no special handling.

- [ ] **Step 1: Write the failing tests**

```python
# test_report.py
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report


def txn(day, amount, description):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


RULES = [("coffee", "food"), ("rent", "housing")]
DESIGN_ROWS = [
    txn(4, "-7.50", "Coffee Shop"),
    txn(1, "2500.00", "Salary"),
    txn(2, "-900.00", "Rent March"),
]


class FormatAmountTest(unittest.TestCase):
    def test_formats_two_fractional_digits(self):
        cases = [
            ("-12.5", "-12.50"),
            ("0", "0.00"),
            ("1200", "1200.00"),
            ("2500.00", "2500.00"),
            ("1234567.89", "1234567.89"),
        ]
        for value, expected in cases:
            with self.subTest(value=value):
                self.assertEqual(format_amount(Decimal(value)), expected)

    def test_negative_zero_prints_without_sign(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_per_category_alphabetically_with_uncategorized_last(self):
        self.assertEqual(
            category_totals(DESIGN_ROWS, RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                ("uncategorized", Decimal("2500.00")),
            ],
        )

    def test_no_rules_puts_everything_in_uncategorized(self):
        self.assertEqual(
            category_totals(DESIGN_ROWS, []),
            [("uncategorized", Decimal("1592.50"))],
        )

    def test_omits_uncategorized_when_every_row_matches(self):
        rows = [txn(1, "-7.50", "Coffee"), txn(2, "-900.00", "Rent")]
        self.assertEqual(
            category_totals(rows, RULES),
            [("food", Decimal("-7.50")), ("housing", Decimal("-900.00"))],
        )

    def test_no_transactions_has_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])


class FormatReportTest(unittest.TestCase):
    def test_matches_the_design_example(self):
        self.assertEqual(
            format_report(DESIGN_ROWS, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50",
        )

    def test_no_transactions_reports_the_opening_balance(self):
        self.assertEqual(
            format_report([], RULES, Decimal("100")),
            "\nclosing balance: 100.00",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `format_amount`, `category_totals`, and `format_report` in `ledgerlite/report.py`**

`format_amount`: `f"{amount:.2f}"`, but first replace a zero value with `abs(amount)` so `-0.00` cannot reach the format. `category_totals`: accumulate into a dict keyed by `categorize(...) or UNCATEGORIZED`, then sort the non-`UNCATEGORIZED` keys and append `UNCATEGORIZED` if it is in the dict. `format_report`: one `f"{name}: {format_amount(total)}"` line per entry, then an empty line, then `f"closing balance: {format_amount(closing_balance(transactions, opening))}"` — joined with `"\n"`, so a report with no categories begins with the empty line.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: per-category totals and report formatting"
```
