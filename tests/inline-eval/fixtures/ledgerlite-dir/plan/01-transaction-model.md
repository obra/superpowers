### Task 1: Transaction model

**Files:**
- Create: `ledgerlite/__init__.py` (empty)
- Create: `ledgerlite/model.py`
- Test: `test_model.py`

**Interfaces:**
- Produces: `Transaction(date: datetime.date, amount: decimal.Decimal, description: str, category: str | None = None)` — a frozen dataclass.

- [ ] **Step 1: Write the failing test**

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.model import Transaction


class TransactionTests(unittest.TestCase):
    def test_fields_and_default_category(self):
        t = Transaction(date(2026, 3, 4), Decimal("-7.50"), "COFFEE SHOP")
        self.assertEqual(t.date, date(2026, 3, 4))
        self.assertEqual(t.amount, Decimal("-7.50"))
        self.assertEqual(t.description, "COFFEE SHOP")
        self.assertIsNone(t.category)

    def test_is_frozen(self):
        t = Transaction(date(2026, 3, 4), Decimal("1"), "x")
        with self.assertRaises(Exception):
            t.amount = Decimal("2")
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_model` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/model.py` as a `@dataclass(frozen=True)` with the four fields above.
- [ ] **Step 4: Run it and watch it pass** — `python3 -m unittest test_model` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite test_model.py && git commit -m "Add Transaction model"`
