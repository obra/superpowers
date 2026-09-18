### Task 1: Transaction model and CSV parsing

**Files:**
- Create: `ledgerlite/__init__.py` (empty)
- Create: `ledgerlite/model.py`
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `model.Transaction` — frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that order.
  - `parse.ParseError(Exception)` with attributes `line: int` (1-based line number in the file) and `message: str`.
  - `parse.parse_amount(text: str) -> Decimal` — raises `ValueError` whose `str()` is the message tail used in error output. Task 5 reuses this for `--opening`.
  - `parse.parse_transactions(text: str) -> list[Transaction]` — returns transactions in input order (no sorting), raises `ParseError`.

**Pinned decisions:**
- Line numbers are 1-based over the file's lines, so the header is line 1 and the first data row is line 2.
- The first line must be exactly the three fields `date`, `amount`, `description` after stripping surrounding whitespace from each and lowercasing. A zero-byte or whitespace-only file is `missing header row` at line 1.
- Exact `message` values: `missing header row`, `expected header date,amount,description`, `expected 3 columns, got {n}`, `date is not YYYY-MM-DD: '{raw}'`, `amount is not a decimal number: '{raw}'`, `amount has more than two fractional digits: '{raw}'`.
- A valid amount is a `Decimal` that is finite and whose `as_tuple().exponent` is `>= -2`.
- A valid date is a 10-character string accepted by `datetime.date.fromisoformat`.
- Each field is stripped of surrounding whitespace before validation.

- [ ] **Step 1: Write the failing tests**

`test_parse.py`:

```python
import unittest
from datetime import date
from decimal import Decimal

from ledgerlite.model import Transaction
from ledgerlite.parse import ParseError, parse_amount, parse_transactions

HEADER = "date,amount,description\n"


class ParseAmountTest(unittest.TestCase):
    def test_accepts_zero_one_or_two_fractional_digits(self):
        self.assertEqual(parse_amount("12"), Decimal("12"))
        self.assertEqual(parse_amount("1.5"), Decimal("1.5"))
        self.assertEqual(parse_amount("-12.50"), Decimal("-12.50"))

    def test_rejects_three_fractional_digits(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("1.005")
        self.assertEqual(
            str(caught.exception),
            "amount has more than two fractional digits: '1.005'",
        )

    def test_rejects_non_numeric(self):
        with self.assertRaises(ValueError) as caught:
            parse_amount("abc")
        self.assertEqual(
            str(caught.exception), "amount is not a decimal number: 'abc'"
        )

    def test_rejects_nan_and_infinity(self):
        for raw in ("NaN", "Infinity", "-inf"):
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                parse_amount(raw)


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

    def test_header_only_file_has_no_transactions(self):
        self.assertEqual(parse_transactions(HEADER), [])

    def test_empty_file_is_missing_header(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(caught.exception.message, "missing header row")

    def test_wrong_header_is_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions("when,how much,what\n2026-03-04,-7.50,Coffee\n")
        self.assertEqual(caught.exception.line, 1)
        self.assertEqual(
            caught.exception.message, "expected header date,amount,description"
        )

    def test_wrong_column_count_reports_its_line(self):
        text = HEADER + "2026-03-04,-7.50,Coffee\n2026-03-05,2500.00\n"
        with self.assertRaises(ParseError) as caught:
            parse_transactions(text)
        self.assertEqual(caught.exception.line, 3)
        self.assertEqual(caught.exception.message, "expected 3 columns, got 2")

    def test_unparseable_date_reports_its_line(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "2026-02-30,-7.50,Coffee\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(
            caught.exception.message, "date is not YYYY-MM-DD: '2026-02-30'"
        )

    def test_compact_iso_date_is_rejected(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "20260304,-7.50,Coffee\n")
        self.assertEqual(
            caught.exception.message, "date is not YYYY-MM-DD: '20260304'"
        )

    def test_malformed_amount_reports_its_line(self):
        with self.assertRaises(ParseError) as caught:
            parse_transactions(HEADER + "2026-03-04,1.005,Coffee\n")
        self.assertEqual(caught.exception.line, 2)
        self.assertEqual(
            caught.exception.message,
            "amount has more than two fractional digits: '1.005'",
        )

    def test_amount_is_decimal_not_float(self):
        [txn] = parse_transactions(HEADER + "2026-03-04,-7.50,Coffee\n")
        self.assertIsInstance(txn.amount, Decimal)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Implement `Transaction` in `ledgerlite/model.py`**

A `@dataclass(frozen=True)` with the three fields from the Interfaces block. Create an empty `ledgerlite/__init__.py`.

- [ ] **Step 4: Implement `ParseError`, `parse_amount`, and `parse_transactions` in `ledgerlite/parse.py`**

`ParseError.__init__(self, line, message)` stores both attributes and passes `f"{line}: {message}"` to `super().__init__`.

`parse_amount` uses `Decimal(text)` inside a `try` catching `decimal.InvalidOperation`, then checks `is_finite()` and the exponent; both failure paths raise `ValueError` with the pinned messages.

`parse_transactions` reads rows with `csv.reader(text.splitlines())`, tracking the 1-based line number with `enumerate(..., start=1)`. It validates the header row, then each data row: column count, then date, then amount (in that order, so the reported message is the first problem on the line). It converts a `ValueError` from `parse_amount` into `ParseError(line, str(err))`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/__init__.py ledgerlite/model.py ledgerlite/parse.py test_parse.py
git commit -m "feat: add Transaction model and transactions CSV parsing"
```
