### Task 2: CSV parsing

**Files:**
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1).
- Produces: `parse_csv(text: str) -> list[Transaction]` — parses CSV text with header `date,amount,description`, in input order, category `None`. `class ParseError(ValueError)` with attributes `line: int` (1-based, counting the header as line 1) and `reason: str`, raised on the first bad row: wrong column count, unparseable date, or an amount that is not a decimal number.

- [ ] **Step 1: Write the failing test**

```python
import unittest
from datetime import date
from decimal import Decimal
from ledgerlite.parse import parse_csv, ParseError

CSV = "date,amount,description\n2026-03-04,-7.50,COFFEE SHOP\n2026-03-01,2500.00,SALARY\n"


class ParseTests(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        txns = parse_csv(CSV)
        self.assertEqual([t.description for t in txns], ["COFFEE SHOP", "SALARY"])
        self.assertEqual(txns[0].date, date(2026, 3, 4))
        self.assertEqual(txns[0].amount, Decimal("-7.50"))
        self.assertIsInstance(txns[1].amount, Decimal)
        self.assertIsNone(txns[0].category)

    def test_header_only_is_empty(self):
        self.assertEqual(parse_csv("date,amount,description\n"), [])

    def test_bad_date_raises_with_line(self):
        with self.assertRaises(ParseError) as cm:
            parse_csv("date,amount,description\n2026-13-40,1.00,x\n")
        self.assertEqual(cm.exception.line, 2)
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_parse` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/parse.py` using `csv.reader` over `text.splitlines()`; validate the header; build `Transaction` per row; raise `ParseError(line, reason)` on the first bad row.
- [ ] **Step 4: Run it and watch it pass** — `python3 -m unittest test_parse` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite/parse.py test_parse.py && git commit -m "Add CSV parsing"`
