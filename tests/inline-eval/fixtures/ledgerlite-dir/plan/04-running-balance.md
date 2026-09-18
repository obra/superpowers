### Task 4: Running balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1).
- Produces: `ordered(transactions: list[Transaction]) -> list[Transaction]` — sorted by date, stable. `closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — opening plus the sum of amounts (order does not affect the sum, but callers pass the ordered list).

- [ ] **Step 1: Write the failing test**

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.model import Transaction
from ledgerlite.balance import ordered, closing_balance

A = Transaction(date(2026, 3, 4), Decimal("-7.50"), "a")
B = Transaction(date(2026, 3, 1), Decimal("2500.00"), "b")
C = Transaction(date(2026, 3, 4), Decimal("-900.00"), "c")


class BalanceTests(unittest.TestCase):
    def test_ordered_by_date_stable(self):
        self.assertEqual([t.description for t in ordered([A, B, C])], ["b", "a", "c"])

    def test_closing_balance(self):
        self.assertEqual(closing_balance([A, B, C], Decimal("100")), Decimal("1692.50"))

    def test_closing_balance_empty_is_opening(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_balance` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/balance.py`; `sorted(..., key=lambda t: t.date)` is stable.
- [ ] **Step 4: Run it and watch it pass** — `python3 -m unittest test_balance` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite/balance.py test_balance.py && git commit -m "Add running balance"`
