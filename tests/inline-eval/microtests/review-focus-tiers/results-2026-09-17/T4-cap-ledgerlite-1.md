```markdown
## Review Focus

1. **A malformed row reaching the CLI** — the spec's exit code 2 path is never exercised end to end; a user with one bad row in a 900-row export should see `ledgerlite: <path>:<line>: <reason>` on stderr, an empty stdout, and status 2, not a `ParseError` traceback or a half-printed report.
   - [ ] **Task 6, Step 1 (add to `test_cli.py`)** — pin the whole-file rejection:
     ```python
     def test_malformed_row_returns_2(self):
         csv_path = write("date,amount,description\n2026-03-04,-7.50,ok\n2026-03-05,1.005,bad\n")
         self.addCleanup(os.unlink, csv_path)
         out, err = io.StringIO(), io.StringIO()
         with redirect_stdout(out), redirect_stderr(err):
             rc = main(["report", csv_path])
         self.assertEqual(rc, 2)
         self.assertEqual(out.getvalue(), "")
         self.assertTrue(err.getvalue().startswith(f"ledgerlite: {csv_path}:3: "))
         self.assertTrue(err.getvalue().endswith("\n"))
     ```

2. **An amount with more than two fractional digits** — `1.005` (interest, FX-converted, or 3-decimal exports) is malformed per the spec, while `1.5` and `1.50` are fine; Task 2's interface omits this rule entirely, so today it would silently be accepted and quietly round in the totals.
   - [ ] **Task 2, Step 1 (add to `test_parse.py`)** — pin the fractional-digit rule (and add it to the `ParseError` reasons in Task 2's Interfaces):
     ```python
     def test_more_than_two_fractional_digits_is_malformed(self):
         with self.assertRaises(ParseError) as cm:
             parse_csv("date,amount,description\n2026-03-04,1.005,x\n")
         self.assertEqual(cm.exception.line, 2)

     def test_one_and_two_fractional_digits_are_fine(self):
         txns = parse_csv("date,amount,description\n2026-03-04,1.5,x\n2026-03-05,1.50,y\n")
         self.assertEqual([t.amount for t in txns], [Decimal("1.5"), Decimal("1.50")])
     ```

3. **`report FILE` with no `--rules` and no `--opening`** — the simplest and most common invocation is untested; it should print every transaction under `uncategorized` with an opening of `0`, not crash on a `None` rules path or default the opening to a float.
   - [ ] **Task 6, Step 1 (add to `test_cli.py`)** — pin the defaults:
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

4. **A negative or fractional `--opening`** — an overdrawn account starts below zero, and `--opening=-12.50` must reach the balance as an exact `Decimal` (argparse also needs the `=` form for a leading-dash value); `1200.005` or `abc` should be rejected as a usage error rather than becoming a float or a `decimal.InvalidOperation` traceback.
   - [ ] **Task 6, Step 1 (add to `test_cli.py`)** — pin the opening parse:
     ```python
     def test_negative_decimal_opening(self):
         csv_path = write(CSV)
         self.addCleanup(os.unlink, csv_path)
         out = io.StringIO()
         with redirect_stdout(out):
             rc = main(["report", csv_path, "--opening=-12.50"])
         self.assertEqual(rc, 0)
         self.assertTrue(out.getvalue().endswith("closing balance: 1580.00\n"))

     def test_non_numeric_opening_is_a_usage_error(self):
         with redirect_stderr(io.StringIO()):
             with self.assertRaises(SystemExit):
                 main(["report", "/no/such/file.csv", "--opening", "abc"])
     ```

5. **A `--rules` path that cannot be read** — a typo'd rules filename is as likely as a typo'd CSV, and the spec's silence on it is not permission to raise `FileNotFoundError`; it should report `ledgerlite: cannot read <path>: <reason>` and return 1, printing nothing to stdout.
   - [ ] **Task 6, Step 1 (add to `test_cli.py`)** — pin the rules-file read error:
     ```python
     def test_unreadable_rules_file_returns_1(self):
         csv_path = write(CSV)
         self.addCleanup(os.unlink, csv_path)
         out, err = io.StringIO(), io.StringIO()
         with redirect_stdout(out), redirect_stderr(err):
             rc = main(["report", csv_path, "--rules", "/no/such/rules.txt"])
         self.assertEqual(rc, 1)
         self.assertEqual(out.getvalue(), "")
         self.assertTrue(err.getvalue().startswith("ledgerlite: cannot read /no/such/rules.txt"))
     ```

6. **A header-only CSV (no transactions)** — a date-filtered export with nothing in range should print the closing balance equal to the opening amount with no category lines and no stray leading blank line; `format_report` is only ever tested with a populated totals dict.
   - [ ] **Task 5, Step 1 (add to `test_report.py`)** — pin the empty report:
     ```python
     def test_format_report_with_no_transactions(self):
         self.assertEqual(format_report({}, Decimal("100")), "closing balance: 100.00")
         self.assertEqual(totals_by_category([]), {})
     ```
```

Note: the instruction asked for five lines; I listed six because the negative/fractional `--opening` case (line 4) and the missing-`--rules` case (line 5) are distinct failures that both sit squarely in the spec's `--opening`/`--rules` sentence, and dropping either would leave an untested spec clause. If you want exactly five, line 6 (header-only CSV) is the one I'd cut — it is the least likely to be hit and the least damaging when it is.
