### Task 4: Category totals and report formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `model.Transaction` (Task 1); `rules.Rule`, `rules.categorize` (Task 2); `balance.closing_balance` (Task 3).
- Produces:
  - `report.UNCATEGORIZED` — the string constant `"uncategorized"`.
  - `report.format_amount(amount: Decimal) -> str`
  - `report.category_totals(transactions: list[Transaction], rules: list[Rule]) -> list[tuple[str, Decimal]]` — in print order.
  - `report.format_report(transactions: list[Transaction], rules: list[Rule], opening: Decimal) -> str` — the whole report, ending with a single trailing newline.

**Pinned decisions:**
- `format_amount` quantizes to `Decimal("0.01")` and renders negative zero as `0.00`.
- `category_totals` sorts real categories with plain `sorted()` on the category string (codepoint order) and appends `uncategorized` last, if and only if at least one transaction matched no rule. Categories with no transactions never appear, so two rules pointing at the same category produce one merged line.
- Report layout: one `<category>: <total>` line per entry, then a blank line, then `closing balance: <amount>`. With no transactions the report is a blank line followed by the closing balance line.

- [ ] **Step 1: Write the failing tests**

`test_report.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.report import category_totals, format_amount, format_report

RULES = [("coffee", "food"), ("rent", "housing")]
LEDGER = [
    Transaction(date(2026, 3, 5), Decimal("2500.00"), "Salary"),
    Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee shop"),
    Transaction(date(2026, 3, 1), Decimal("-900.00"), "Rent March"),
]


class FormatAmountTest(unittest.TestCase):
    def test_always_two_fractional_digits(self):
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")

    def test_negative_zero_prints_as_zero(self):
        self.assertEqual(format_amount(Decimal("-0.00")), "0.00")

    def test_no_thousands_separator(self):
        self.assertEqual(format_amount(Decimal("1234567.5")), "1234567.50")


class CategoryTotalsTest(unittest.TestCase):
    def test_sums_per_category_alphabetically_with_uncategorized_last(self):
        self.assertEqual(
            category_totals(LEDGER, RULES),
            [
                ("food", Decimal("-7.50")),
                ("housing", Decimal("-900.00")),
                ("uncategorized", Decimal("2500.00")),
            ],
        )

    def test_merges_rules_sharing_a_category(self):
        rules = [("coffee", "food"), ("rent", "food")]
        self.assertEqual(
            category_totals(LEDGER[1:], rules), [("food", Decimal("-907.50"))]
        )

    def test_omits_uncategorized_when_every_row_matches(self):
        self.assertEqual(
            [name for name, _ in category_totals(LEDGER[1:], RULES)],
            ["food", "housing"],
        )

    def test_no_rules_means_everything_uncategorized(self):
        self.assertEqual(
            category_totals(LEDGER, []), [("uncategorized", Decimal("1592.50"))]
        )

    def test_no_transactions_gives_no_lines(self):
        self.assertEqual(category_totals([], RULES), [])


class FormatReportTest(unittest.TestCase):
    def test_matches_the_design_example(self):
        self.assertEqual(
            format_report(LEDGER, RULES, Decimal("100")),
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


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_report -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `UNCATEGORIZED`, `format_amount`, `category_totals`, and `format_report` in `ledgerlite/report.py`**

`category_totals` accumulates into a `dict[str | None, Decimal]` keyed by `categorize(txn.description, rules)`, then builds the output list from the sorted non-`None` keys plus the `None` key last.

`format_report` joins the category lines, the blank line, and `closing balance: {format_amount(closing_balance(transactions, opening))}`. It does not need `order_by_date` itself — ordering only affects the balance, which `closing_balance` owns.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_report -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add category totals and report formatting"
```
