### Task 3: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `model.Transaction` from Task 1.
- Produces:
  - `balance.order_by_date(transactions: list[Transaction]) -> list[Transaction]` — a new list sorted by `date`, ties keeping input order.
  - `balance.closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — the running balance after the last transaction in date order; `opening` when there are none.

**Pinned decisions:**
- `order_by_date` does not mutate its argument.
- `closing_balance` folds the amounts in `order_by_date` order onto `opening` using `Decimal` addition only.

- [ ] **Step 1: Write the failing tests**

`test_balance.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class OrderByDateTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(5, "1.00", "b"), txn(4, "1.00", "a")]
        self.assertEqual(
            [t.description for t in order_by_date(rows)], ["a", "b"]
        )

    def test_ties_keep_input_order(self):
        rows = [txn(4, "1.00", "first"), txn(4, "2.00", "second")]
        self.assertEqual(
            [t.description for t in order_by_date(rows)], ["first", "second"]
        )

    def test_does_not_mutate_input(self):
        rows = [txn(5, "1.00", "b"), txn(4, "1.00", "a")]
        order_by_date(rows)
        self.assertEqual([t.description for t in rows], ["b", "a"])


class ClosingBalanceTest(unittest.TestCase):
    def test_adds_amounts_to_opening(self):
        rows = [txn(4, "-7.50"), txn(5, "2500.00"), txn(4, "-900.00")]
        self.assertEqual(closing_balance(rows, Decimal("100")), Decimal("1692.50"))

    def test_no_transactions_gives_opening(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))

    def test_arithmetic_is_exact(self):
        rows = [txn(4, "0.10"), txn(4, "0.10"), txn(4, "0.10")]
        self.assertEqual(closing_balance(rows, Decimal("0")), Decimal("0.30"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `order_by_date` and `closing_balance` in `ledgerlite/balance.py`**

`sorted` is already stable, so a `key` of the transaction's date gives the tie rule for free.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```
