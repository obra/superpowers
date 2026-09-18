### Task 4: Per-category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `rules.categorize` (Task 2), `balance.closing_balance` (Task 3).
- Produces:
  - `ledgerlite.report.format_amount(value: Decimal) -> str` — exactly two fractional digits, a leading `-` only for values below zero, no thousands separators.
  - `ledgerlite.report.category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[tuple[str, Decimal]]` — one pair per category that has at least one transaction, sorted alphabetically by category name, with `uncategorized` last if present. Uncategorized transactions, and transactions a rule puts in a category literally named `uncategorized`, share that one bucket.
  - `ledgerlite.report.format_report(transactions: list[Transaction], rules: list[tuple[str, str]], opening: Decimal) -> str` — the whole report: one `<category>: <total>` line per category, a blank line, then `closing balance: <amount>`. Ends with a single trailing newline.

- [ ] **Step 1: Write the failing tests**

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report

RULES = [("coffee", "food"), ("rent", "housing")]


def txn(day, amount, description):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class FormatAmountTest(unittest.TestCase):
    def test_formats_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_no_thousands_separators(self):
        self.assertEqual(format_amount(Decimal("1234567.89")), "1234567.89")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_per_category_alphabetically_with_uncategorized_last(self):
        rows = [
            txn(5, "2500.00", "Salary"),
            txn(4, "-7.50", "Coffee shop"),
            txn(4, "-900.00", "Rent March"),
        ]
        self.assertEqual(
            category_totals(rows, RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                ("uncategorized", Decimal("2500.00")),
            ],
        )

    def test_omits_uncategorized_when_everything_matches(self):
        rows = [txn(4, "-7.50", "Coffee shop")]
        self.assertEqual(category_totals(rows, RULES), [("food", Decimal("-7.50"))])

    def test_no_transactions_has_no_categories(self):
        self.assertEqual(category_totals([], RULES), [])

    def test_rule_named_uncategorized_shares_that_bucket_and_stays_last(self):
        rules = [("coffee", "uncategorized"), ("rent", "housing")]
        rows = [txn(4, "-7.50", "Coffee shop"), txn(4, "-900.00", "Rent"), txn(5, "1.00", "Gift")]
        self.assertEqual(
            category_totals(rows, rules),
            [("housing", Decimal("-900.00")), ("uncategorized", Decimal("-6.50"))],
        )

    def test_category_netting_to_zero_is_still_listed(self):
        rows = [txn(4, "-5.00", "Coffee"), txn(5, "5.00", "Coffee refund")]
        self.assertEqual(category_totals(rows, RULES), [("food", Decimal("0.00"))])


class FormatReportTest(unittest.TestCase):
    def test_matches_the_spec_example(self):
        rows = [
            txn(5, "2500.00", "Salary"),
            txn(4, "-7.50", "Coffee shop"),
            txn(4, "-900.00", "Rent March"),
        ]
        self.assertEqual(
            format_report(rows, RULES, Decimal("100")),
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_no_transactions_reports_the_opening_amount(self):
        self.assertEqual(format_report([], RULES, Decimal("100")), "\nclosing balance: 100.00\n")

    def test_zeroed_category_prints_without_a_minus_sign(self):
        rows = [txn(4, "-5.00", "Coffee"), txn(5, "5.00", "Coffee refund")]
        self.assertEqual(
            format_report(rows, RULES, Decimal("0")),
            "food: 0.00\n\nclosing balance: 0.00\n",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement the three functions in `ledgerlite/report.py`**

`format_amount` quantizes to `Decimal("0.01")` with `ROUND_HALF_UP` and formats with `f"{...:f}"`; take `abs()` first when the value is zero, so `-0.00` cannot reach the output. `category_totals` accumulates into a dict keyed by `categorize(t.description, rules) or "uncategorized"`, then sorts the items with a key that puts `uncategorized` after every other name. `format_report` joins the category lines, the empty line, and the closing-balance line built from `closing_balance(opening, transactions)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: per-category totals and report formatting"
```
