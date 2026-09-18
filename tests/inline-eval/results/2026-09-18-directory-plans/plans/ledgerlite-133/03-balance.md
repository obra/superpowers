### Task 3: Date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `ledgerlite.model.Transaction` (Task 1).
- Produces:
  - `ledgerlite.balance.order_by_date(transactions: list[Transaction]) -> list[Transaction]` — sorted by date, ties keeping input order, input list not mutated.
  - `ledgerlite.balance.running_balance(transactions: list[Transaction], opening: Decimal) -> list[Decimal]` — the balance after each transaction, in date order; one entry per transaction.
  - `ledgerlite.balance.closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — the last running balance, or `opening` when there are no transactions.

- [ ] **Step 1: Write the failing tests**

```python
# test_balance.py
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.balance import closing_balance, order_by_date, running_balance
from ledgerlite.model import Transaction


def txn(day, amount, description="x"):
    return Transaction(date(2026, 3, day), Decimal(amount), description)


class OrderByDateTest(unittest.TestCase):
    def test_sorts_by_date(self):
        rows = [txn(4, "-7.50", "b"), txn(1, "2500", "a")]
        self.assertEqual([t.description for t in order_by_date(rows)], ["a", "b"])

    def test_ties_keep_input_order(self):
        rows = [txn(4, "-1.00", "second"), txn(1, "5.00", "first"), txn(4, "-2.00", "third")]
        self.assertEqual(
            [t.description for t in order_by_date(rows)], ["first", "second", "third"]
        )

    def test_does_not_mutate_input(self):
        rows = [txn(4, "-1.00", "b"), txn(1, "5.00", "a")]
        order_by_date(rows)
        self.assertEqual([t.description for t in rows], ["b", "a"])


class RunningBalanceTest(unittest.TestCase):
    def test_accumulates_in_date_order(self):
        rows = [txn(4, "-7.50"), txn(1, "2500")]
        self.assertEqual(
            running_balance(rows, Decimal("100")),
            [Decimal("2600"), Decimal("2592.50")],
        )

    def test_no_transactions_has_no_entries(self):
        self.assertEqual(running_balance([], Decimal("100")), [])


class ClosingBalanceTest(unittest.TestCase):
    def test_is_opening_plus_every_amount(self):
        rows = [txn(4, "-7.50"), txn(1, "2500"), txn(2, "-900.00")]
        self.assertEqual(closing_balance(rows, Decimal("100")), Decimal("1692.50"))

    def test_no_transactions_is_the_opening_amount(self):
        self.assertEqual(closing_balance([], Decimal("100")), Decimal("100"))

    def test_default_opening_of_zero(self):
        self.assertEqual(closing_balance([txn(1, "-12.50")], Decimal("0")), Decimal("-12.50"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `order_by_date`, `running_balance`, and `closing_balance` in `ledgerlite/balance.py`**

`sorted(..., key=lambda t: t.date)` is stable, which is what "ties keeping input order" requires. `closing_balance` returns the last entry of `running_balance` or `opening` when it is empty.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: date ordering and running/closing balance"
```
