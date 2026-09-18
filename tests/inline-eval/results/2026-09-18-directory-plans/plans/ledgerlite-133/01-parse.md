### Task 1: Transaction model and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py` (empty)
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that order.
  - `ledgerlite.parse.ParseError(Exception)` with attributes `line: int` and `message: str`, constructed as `ParseError(line, message)`. `str(err)` is the message.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — takes the whole file's text, returns transactions in input order, raises `ParseError` on the first bad row.

Exact error messages (tests assert them verbatim):

| Condition | `message` |
|---|---|
| header row is not `date,amount,description` | `expected header date,amount,description` |
| row has other than 3 fields | `expected 3 columns, got 4` |
| date not ISO 8601 | `invalid date: 2026-13-40` |
| amount not a finite decimal | `invalid amount: NaN` |
| amount has 3+ fractional digits | `amount has more than two decimal places: 1.005` |

- [ ] **Step 1: Write the failing tests**

```python
# test_parse.py
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_transactions

HEADER = "date,amount,description\n"


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = HEADER + "2026-03-04,-7.50,Coffee Shop\n2026-03-01,2500,Salary\n"
        self.assertEqual(
            parse_transactions(text),
            [
                Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee Shop"),
                Transaction(date(2026, 3, 1), Decimal("2500"), "Salary"),
            ],
        )

    def test_header_only_file_is_empty(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_empty_file_is_missing_header(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(
            caught.exception.message, "expected header date,amount,description"
        )

    def test_first_row_not_header_is_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("2026-03-04,-7.50,Coffee\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(
            caught.exception.message, "expected header date,amount,description"
        )

    def test_wrong_column_count_reports_its_line(self):
        text = HEADER + "2026-03-01,2500,Salary\n2026-03-02,-1.00,Tea,extra\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 4")

    def test_unparseable_date(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "04/03/2026,-7.50,Coffee\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(caught.exception.message, "invalid date: 04/03/2026")

    def test_impossible_date(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "2026-13-40,-7.50,Coffee\n")
        self.assertEqual(caught.exception.message, "invalid date: 2026-13-40")

    def test_three_fractional_digits(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "2026-03-04,1.005,Coffee\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(
            caught.exception.message,
            "amount has more than two decimal places: 1.005",
        )

    def test_one_and_two_fractional_digits_are_fine(self):
        text = HEADER + "2026-03-04,1.5,A\n2026-03-05,1.50,B\n"
        amounts = [t.amount for t in parse_transactions(text)]
        self.assertEqual(amounts, [Decimal("1.5"), Decimal("1.50")])

    def test_non_numeric_amount(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "2026-03-04,ten pounds,Coffee\n")
        self.assertEqual(caught.exception.message, "invalid amount: ten pounds")

    def test_empty_amount(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "2026-03-04,,Coffee\n")
        self.assertEqual(caught.exception.message, "invalid amount: ")

    def test_non_finite_amounts_are_rejected(self):
        for value in ("NaN", "Infinity", "-inf"):
            with self.subTest(value=value):
                with self.assertRaises(ParseError) as caught:
                    parse_transactions(HEADER + f"2026-03-04,{value},Coffee\n")
                self.assertEqual(
                    caught.exception.message, f"invalid amount: {value}"
                )

    def test_quoted_description_with_comma(self):
        text = HEADER + '2026-03-04,-7.50,"Coffee, black"\n'
        self.assertEqual(parse_transactions(text)[0].description, "Coffee, black")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Create `ledgerlite/__init__.py` (empty) and the `Transaction` dataclass in `ledgerlite/model.py`**

`@dataclass(frozen=True)` so transactions compare by value in tests.

- [ ] **Step 4: Implement `parse_transactions(text: str) -> list[Transaction]` in `ledgerlite/parse.py`**

Read with `csv.reader(text.splitlines(keepends=True))` and use `reader.line_num` as the reported line, so a quoted field containing a newline still reports the physical line. Validate the first row against `["date", "amount", "description"]`; a file with no rows at all fails the same check. Amount: build `Decimal(value)` inside `try/except decimal.InvalidOperation`, then reject it unless `amount.is_finite()` (`invalid amount`), then reject `amount.as_tuple().exponent < -2` (more than two decimal places). Dates via `datetime.date.fromisoformat`, catching `ValueError`. Report the field's original text, unmodified, in the message.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Transaction objects"
```
