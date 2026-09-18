### Task 3: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (Task 1).
- Produces:
  - `ledgerlite.balance.order_transactions(transactions: list[Transaction]) -> list[Transaction]` — a new list ordered by date, ties keeping input order.
  - `ledgerlite.balance.closing_balance(opening: Decimal, transactions: list[Transaction]) -> Decimal` — the running balance after the last transaction in that order; `opening` when the list is empty.

- [ ] **Step 1: Write the failing tests**

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_transactions
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class OrderTransactionsTest(unittest.TestCase):
    def test_orders_by_date(self):
        rows = [txn(5, "1"), txn(3, "2"), txn(4, "3")]
        self.assertEqual([t.date.day for t in order_transactions(rows)], [3, 4, 5])

    def test_same_date_keeps_input_order(self):
        rows = [txn(4, "1", "first"), txn(3, "2"), txn(4, "3", "second")]
        self.assertEqual(
            [t.description for t in order_transactions(rows)], ["x", "first", "second"]
        )

    def test_does_not_mutate_the_input(self):
        rows = [txn(5, "1"), txn(3, "2")]
        order_transactions(rows)
        self.assertEqual([t.date.day for t in rows], [5, 3])


class ClosingBalanceTest(unittest.TestCase):
    def test_empty_ledger_returns_the_opening_amount(self):
        self.assertEqual(closing_balance(Decimal("100"), []), Decimal("100"))

    def test_adds_every_amount(self):
        rows = [txn(5, "2500.00"), txn(4, "-7.50"), txn(4, "-900.00")]
        self.assertEqual(closing_balance(Decimal("100"), rows), Decimal("1692.50"))

    def test_result_is_a_decimal_not_a_float(self):
        rows = [txn(4, "0.10"), txn(4, "0.20")]
        self.assertEqual(closing_balance(Decimal("0"), rows), Decimal("0.30"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `order_transactions` and `closing_balance` in `ledgerlite/balance.py`**

`sorted(transactions, key=...)` is already stable, which is what "ties keeping input order" means. `closing_balance` sums the amounts of `order_transactions(transactions)` onto `opening`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: date ordering and closing balance"
```
