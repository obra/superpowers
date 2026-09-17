```markdown
## Review Focus

The spec's edges that no task's tests currently touch — most likely to bite first:

1. **A CSV with one malformed row, via the CLI** (`ledgerlite report bad.csv`): the spec's exit code 2, the `ledgerlite: <path>:<line>: <what is wrong>` message on stderr, and an *empty* stdout — the whole file rejected. Task 2 tests `ParseError` but nothing in Task 6 tests the CLI mapping it to exit 2, so the likely outcome today is a raw traceback and exit code 1.
   - [ ] **Task 6, Step 1, add `CliTests.test_malformed_row_returns_2`:**
   ```python
   def test_malformed_row_returns_2(self):
       csv_path = write("date,amount,description\n2026-03-04,-7.50,COFFEE\nnot-a-date,1.00,x\n")
       self.addCleanup(os.unlink, csv_path)
       out, err = io.StringIO(), io.StringIO()
       with redirect_stdout(out), redirect_stderr(err):
           rc = main(["report", csv_path])
       self.assertEqual(rc, 2)
       self.assertEqual(out.getvalue(), "")
       self.assertTrue(err.getvalue().startswith(f"ledgerlite: {csv_path}:3: "))
       self.assertTrue(err.getvalue().endswith("\n"))
   ```

2. **`ledgerlite report txns.csv` with neither `--rules` nor `--opening`** — the simplest possible invocation, which the spec makes explicit (`--rules` optional, opening defaults to `0`): every transaction lands under `uncategorized` and the closing balance starts from zero. Every CLI test passes both flags, so an implementation that opens `args.rules` unconditionally crashes on the common case.
   - [ ] **Task 6, Step 1, add `CliTests.test_defaults_no_rules_zero_opening`:**
   ```python
   def test_defaults_no_rules_zero_opening(self):
       csv_path = write(CSV)
       self.addCleanup(os.unlink, csv_path)
       out, err = io.StringIO(), io.StringIO()
       with redirect_stdout(out), redirect_stderr(err):
           rc = main(["report", csv_path])
       self.assertEqual(rc, 0)
       self.assertEqual(out.getvalue(), "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")
       self.assertEqual(err.getvalue(), "")
   ```

3. **Two or more transactions in the same category** (two coffees, or two uncategorized rows): the category's line is the *sum* of its amounts. Every totals test uses exactly one transaction per category, so a `totals[cat] = amount` assignment bug — silently dropping all but the last row of each category, and disagreeing with the closing balance — passes the suite.
   - [ ] **Task 5, Step 1, add `ReportTests.test_totals_sum_multiple_rows_per_category`:**
   ```python
   def test_totals_sum_multiple_rows_per_category(self):
       txns = [
           Transaction(date(2026, 3, 1), Decimal("-7.50"), "a", "food"),
           Transaction(date(2026, 3, 2), Decimal("-2.25"), "b", "food"),
           Transaction(date(2026, 3, 3), Decimal("10.00"), "c"),
           Transaction(date(2026, 3, 4), Decimal("5.00"), "d"),
       ]
       self.assertEqual(totals_by_category(txns), {"food": Decimal("-9.75"), "uncategorized": Decimal("15.00")})
   ```

4. **A real bank export whose shape is off — a row with the wrong column count, or a first line that isn't `date,amount,description`** (extra column, `Date,Amount,Description`, or no header at all): both are malformed per the spec and must be reported and rejected, never silently truncated to three fields or have a data row eaten as a header. Task 2's Step 3 says "validate the header" but no test holds it to that.
   - [ ] **Task 2, Step 1, add `ParseTests.test_bad_shape_is_rejected`:**
   ```python
   def test_bad_shape_is_rejected(self):
       cases = {
           "date,amount,description\n2026-03-04,-7.50,COFFEE,EXTRA\n": 2,
           "date,amount,description\n2026-03-04,-7.50\n": 2,
           "date,amount\n2026-03-04,-7.50\n": 1,
           "2026-03-04,-7.50,COFFEE\n": 1,
       }
       for text, line in cases.items():
           with self.subTest(text=text):
               with self.assertRaises(ParseError) as cm:
                   parse_csv(text)
               self.assertEqual(cm.exception.line, line)
   ```

5. **Amount strings `Decimal` happily accepts but the spec forbids — `1.005`, `NaN`, `Infinity`, an empty field** — each is a malformed row, while `1.5` and `1.50` must both parse. `Decimal("NaN")` and `Decimal("1.005")` raise nothing, so the natural `Decimal(field)` implementation admits them and the report later prints `NaN` totals or a silently rounded amount.
   - [ ] **Task 2, Step 1, add `ParseTests.test_amount_precision_and_non_numbers`:**
   ```python
   def test_amount_precision_and_non_numbers(self):
       for bad in ("1.005", "abc", "NaN", "Infinity", "", "1,200.00"):
           with self.subTest(bad=bad):
               with self.assertRaises(ParseError) as cm:
                   parse_csv(f"date,amount,description\n2026-03-04,{bad},x\n")
               self.assertEqual(cm.exception.line, 2)

   def test_one_and_two_decimal_amounts_are_fine(self):
       txns = parse_csv("date,amount,description\n2026-03-04,1.5,a\n2026-03-05,1.50,b\n2026-03-06,-2,c\n")
       self.assertEqual([t.amount for t in txns], [Decimal("1.5"), Decimal("1.50"), Decimal("-2")])
   ```
```
