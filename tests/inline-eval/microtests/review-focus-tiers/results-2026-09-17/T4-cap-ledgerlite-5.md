```markdown
## Review Focus

These are the input classes the spec calls for that no task above exercises. Each line names the input, the behavior a reasonable person expects, and the test that pins it — most likely to bite first.

- **A transactions file with a malformed row, run through the CLI.** The spec's exit code 2 path — `ledgerlite: <path>:<line>: <what is wrong>` on stderr, nothing on stdout, the whole file rejected — is never exercised end to end; Task 6 only wires the happy path and the unreadable-file path, so `ParseError` will escape `main` as a traceback and a nonzero-by-accident exit.
  - [ ] **Task 6, Step 1 (additional case)** — add to `test_cli.py`:
    ```python
    def test_malformed_row_returns_2_and_prints_nothing(self):
        path = write("date,amount,description\n2026-03-04,-7.50,COFFEE SHOP\n2026-03-05,1.005,BAD\n")
        self.addCleanup(os.unlink, path)
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            rc = main(["report", path])
        self.assertEqual(rc, 2)
        self.assertEqual(out.getvalue(), "")
        self.assertTrue(err.getvalue().startswith(f"ledgerlite: {path}:3: "))
    ```

- **Malformed rows that are not a bad date: wrong column count, a non-numeric amount, and an amount with more than two fractional digits.** `1.005` must be rejected while `1.5` and `1.50` are accepted; Task 2 tests only the bad date and its Interfaces block omits the fractional-digit rule entirely, so `1.005` will silently parse and skew every total.
  - [ ] **Task 2, Step 1 (additional cases)** — add to `test_parse.py`:
    ```python
    def test_one_and_two_fractional_digits_are_fine(self):
        txns = parse_csv("date,amount,description\n2026-03-04,1.5,a\n2026-03-05,1.50,b\n")
        self.assertEqual([t.amount for t in txns], [Decimal("1.5"), Decimal("1.50")])

    def test_malformed_amounts_and_column_counts(self):
        for row in ("2026-03-04,1.005,x", "2026-03-04,abc,x", "2026-03-04,,x", "2026-03-04,1.00", "2026-03-04,1.00,x,y"):
            with self.assertRaises(ParseError) as cm:
                parse_csv(f"date,amount,description\n{row}\n")
            self.assertEqual(cm.exception.line, 2)
            self.assertTrue(cm.exception.reason)
    ```

- **`report FILE` with neither `--rules` nor `--opening`, and a fractional `--opening`.** Every transaction should land under `uncategorized` against an opening of `0`, and `--opening 0.10` must be read as `Decimal`, not `float`; no task test runs the CLI without both flags, so a missing-rules crash or a float opening would ship.
  - [ ] **Task 6, Step 1 (additional case)** — add to `test_cli.py`:
    ```python
    def test_defaults_and_decimal_opening(self):
        path = write(CSV)
        self.addCleanup(os.unlink, path)
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            self.assertEqual(main(["report", path]), 0)
        self.assertEqual(out.getvalue(), "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")
        out2 = io.StringIO()
        with redirect_stdout(out2), redirect_stderr(err):
            self.assertEqual(main(["report", path, "--opening", "0.10"]), 0)
        self.assertEqual(out2.getvalue(), "uncategorized: 1592.50\n\nclosing balance: 1592.60\n")
        self.assertEqual(err.getvalue(), "")
    ```

- **A transactions file with only a header row.** The spec says the closing balance is the opening amount when there are no transactions; with no categories there are no category lines, so the report must not open with a dangling blank separator line. Task 5 only formats a three-category dict, and Task 6 never reports on an empty file.
  - [ ] **Task 5, Step 1 (additional case)** — add to `test_report.py`:
    ```python
    def test_no_transactions_prints_only_closing_balance(self):
        self.assertEqual(totals_by_category([]), {})
        self.assertEqual(format_report({}, Decimal("100")), "closing balance: 100.00")
    ```

- **A rules file whose substrings are capitalized (`Coffee=food`, `RENT=housing`).** Matching is case-insensitive on the description, which must mean either side may be cased however the user wrote it; Task 3's test only ever passes lowercase substrings, so the natural `substring in description.lower()` implementation matches nothing for a capitalized rules file and quietly reports everything as `uncategorized`.
  - [ ] **Task 3, Step 1 (additional case)** — add to `test_rules.py`:
    ```python
    def test_uppercase_rule_substring_still_matches(self):
        txns = [Transaction(date(2026, 3, 4), Decimal("-7.50"), "coffee shop")]
        self.assertEqual(categorize(txns, [("COFFEE", "food")])[0].category, "food")
        self.assertEqual(parse_rules("Coffee=food\n"), [("Coffee", "food")])
    ```
```
