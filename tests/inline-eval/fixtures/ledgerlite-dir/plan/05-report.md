### Task 5: Report

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1).
- Produces: `totals_by_category(transactions: list[Transaction]) -> dict[str, Decimal]` — keys are category names, with `None` mapped to `"uncategorized"`. `format_report(totals: dict[str, Decimal], closing: Decimal) -> str` — one `<category>: <amount>` line per category, alphabetical with `uncategorized` last, a blank line, then `closing balance: <amount>`; no trailing newline. `format_amount(amount: Decimal) -> str` — exactly two fractional digits, leading `-` for negatives.

- [ ] **Step 1: Write the failing test**

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.model import Transaction
from ledgerlite.report import totals_by_category, format_report, format_amount


class ReportTests(unittest.TestCase):
    def test_format_amount(self):
        self.assertEqual(format_amount(Decimal("-12.5")), "-12.50")
        self.assertEqual(format_amount(Decimal("0")), "0.00")
        self.assertEqual(format_amount(Decimal("1200")), "1200.00")

    def test_totals_map_none_to_uncategorized(self):
        txns = [
            Transaction(date(2026, 3, 4), Decimal("-7.50"), "a", "food"),
            Transaction(date(2026, 3, 4), Decimal("2500.00"), "b"),
            Transaction(date(2026, 3, 4), Decimal("-900.00"), "c", "housing"),
        ]
        self.assertEqual(totals_by_category(txns), {"food": Decimal("-7.50"), "uncategorized": Decimal("2500.00"), "housing": Decimal("-900.00")})

    def test_format_report_order_and_layout(self):
        totals = {"uncategorized": Decimal("2500.00"), "housing": Decimal("-900.00"), "food": Decimal("-7.50")}
        self.assertEqual(
            format_report(totals, Decimal("1692.50")),
            "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50",
        )
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_report` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/report.py` with the three functions; `format_amount` via `Decimal.quantize(Decimal("0.01"))`.
- [ ] **Step 4: Run it and watch it pass** — `python3 -m unittest test_report` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite/report.py test_report.py && git commit -m "Add report formatting"`
