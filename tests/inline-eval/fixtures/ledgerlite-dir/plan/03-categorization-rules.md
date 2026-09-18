### Task 3: Categorization rules

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1).
- Produces: `parse_rules(text: str) -> list[tuple[str, str]]` — one `substring=category` per non-blank line, in order. `categorize(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[Transaction]` — returns new `Transaction` objects with `category` set by the first rule whose substring occurs in the description, case-insensitively; unchanged (`None`) when no rule matches. Input list is not mutated.

- [ ] **Step 1: Write the failing test**

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.model import Transaction
from ledgerlite.rules import parse_rules, categorize


class RulesTests(unittest.TestCase):
    def test_parse_rules_skips_blank_lines(self):
        self.assertEqual(parse_rules("coffee=food\n\nrent=housing\n"), [("coffee", "food"), ("rent", "housing")])

    def test_first_match_wins_case_insensitive(self):
        txns = [Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop RENT")]
        out = categorize(txns, [("rent", "housing"), ("coffee", "food")])
        self.assertEqual(out[0].category, "housing")
        self.assertIsNone(txns[0].category)

    def test_no_match_stays_uncategorized(self):
        txns = [Transaction(date(2026, 3, 4), Decimal("1"), "MYSTERY")]
        self.assertIsNone(categorize(txns, [("coffee", "food")])[0].category)
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_rules` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/rules.py` with the two functions; use `dataclasses.replace` to produce the categorized copies.
- [ ] **Step 4: Run it and watch it pass** — `python3 -m unittest test_rules` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite/rules.py test_rules.py && git commit -m "Add categorization rules"`
