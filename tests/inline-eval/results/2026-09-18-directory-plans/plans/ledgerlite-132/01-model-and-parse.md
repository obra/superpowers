### Task 1: Transaction model and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py` (empty)
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ledgerlite.model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str` (in that order).
  - `ledgerlite.parse.ParseError(Exception)` — constructed `ParseError(line: int, message: str)`, exposing attributes `.line` and `.message`.
  - `ledgerlite.parse.parse_transactions(text: str) -> list[Transaction]` — takes the whole file's *text*, not a path, and returns transactions in input order. Raises `ParseError` on the first bad line; callers render it as `ledgerlite: <path>:<line>: <message>`.

Malformed-row messages are exactly these (the value in the message is the raw field text):

| condition | message |
|---|---|
| file has no header row (empty text) | `missing header row` |
| header is not the three expected names | `expected header date,amount,description` |
| wrong column count | `expected 3 columns, got <n>` |
| unparseable date | `invalid date: '<field>'` |
| amount not a decimal number, or not finite | `invalid amount: '<field>'` |
| amount with more than two fractional digits | `amount has more than two decimal places: '<field>'` |

- [ ] **Step 1: Write the failing tests**

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_transactions

HEADER = "date,amount,description\n"


class ParseTransactionsTest(unittest.TestCase):
    def test_parses_rows_in_input_order(self):
        text = HEADER + "2026-03-05,2500.00,Salary\n2026-03-04,-7.50,Coffee shop\n"
        self.assertEqual(
            parse_transactions(text),
            [
                Transaction(date(2026, 3, 5), Decimal("2500.00"), "Salary"),
                Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee shop"),
            ],
        )

    def test_accepts_one_or_two_fractional_digits(self):
        text = HEADER + "2026-03-04,1.5,a\n2026-03-04,1.50,b\n2026-03-04,-2,c\n"
        self.assertEqual(
            [t.amount for t in parse_transactions(text)],
            [Decimal("1.5"), Decimal("1.50"), Decimal("-2")],
        )

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_description_may_contain_commas_when_quoted(self):
        text = HEADER + '2026-03-04,-1.00,"Coffee, black"\n'
        self.assertEqual(parse_transactions(text)[0].description, "Coffee, black")

    def assertParseError(self, text, line, message):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual((caught.exception.line, caught.exception.message), (line, message))

    def test_empty_file_is_missing_header(self):
        self.assertParseError("", 1, "missing header row")

    def test_wrong_header_is_rejected(self):
        self.assertParseError("date,amount\n", 1, "expected header date,amount,description")

    def test_too_few_columns(self):
        self.assertParseError(HEADER + "2026-03-04,-1.00\n", 2, "expected 3 columns, got 2")

    def test_too_many_columns(self):
        self.assertParseError(HEADER + "2026-03-04,-1.00,a,b\n", 2, "expected 3 columns, got 4")

    def test_unparseable_date(self):
        self.assertParseError(HEADER + "2026-13-01,-1.00,a\n", 2, "invalid date: '2026-13-01'")

    def test_non_numeric_amount(self):
        self.assertParseError(HEADER + "2026-03-04,abc,a\n", 2, "invalid amount: 'abc'")

    def test_empty_amount(self):
        self.assertParseError(HEADER + "2026-03-04,,a\n", 2, "invalid amount: ''")

    def test_non_finite_amounts_are_rejected(self):
        for field in ("nan", "Infinity", "-Infinity"):
            with self.subTest(field=field):
                self.assertParseError(
                    HEADER + f"2026-03-04,{field},a\n", 2, f"invalid amount: '{field}'"
                )

    def test_three_fractional_digits(self):
        self.assertParseError(
            HEADER + "2026-03-04,1.005,a\n",
            2,
            "amount has more than two decimal places: '1.005'",
        )

    def test_reports_the_line_number_of_the_bad_row(self):
        text = HEADER + "2026-03-04,-1.00,a\n2026-03-05,oops,b\n"
        self.assertParseError(text, 3, "invalid amount: 'oops'")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Implement `Transaction` in `ledgerlite/model.py`**

A `@dataclass(frozen=True)` with the three annotated fields and no methods.

- [ ] **Step 4: Implement `ParseError` and `parse_transactions(text: str) -> list[Transaction]` in `ledgerlite/parse.py`**

Read with `csv.reader(io.StringIO(text))` so quoted fields and embedded newlines work, and use `reader.line_num` for the line number in every `ParseError` (the header is line 1, so the first data row is line 2). Strip whitespace from the date and amount fields before parsing; leave the description exactly as the reader returns it. Compare the header row to `["date", "amount", "description"]` after stripping each name. Parse dates with `datetime.date.fromisoformat` and amounts with `decimal.Decimal`, catching `ValueError` and `decimal.InvalidOperation`; reject an amount whose `is_finite()` is false, and detect more than two fractional digits with `value.as_tuple().exponent < -2`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: Transaction model and transactions CSV parser"
```
