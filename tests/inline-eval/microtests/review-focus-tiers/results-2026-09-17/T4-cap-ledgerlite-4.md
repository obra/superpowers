```markdown
## Review Focus

These are the input classes the spec requires the program to handle correctly, but that no task's tests currently exercise. Listed most likely to bite first.

1. **A malformed row reaching the CLI** — a real bank export with one bad line must exit 2, print `ledgerlite: <path>:<line>: <reason>` to stderr, and print *nothing* to stdout; today exit code 2 appears nowhere in any test, and Task 6 only covers exit 0 and exit 1.
2. **An amount with more than two fractional digits (`1.005`)** — the spec names this as malformed while `1.5` and `1.50` are fine; Task 2's interface omits the rule entirely, so nothing stops a third digit from silently becoming a total that prints rounded.
3. **`report FILE` with neither `--rules` nor `--opening`** — the documented bare invocation must report every transaction under `uncategorized` against an opening of `0`, printed as `0.00`; every CLI test passes both flags, so the default wiring (a `None` rules path, an opening that must be `Decimal`, not `int`/`float`) is never executed.
4. **A rules line with no `=` on it** — a comment, a stray word, or a hand-edited half-line must be ignored rather than crash the tool with an unpacking traceback, and a rule whose category contains `=` must split on the first separator only.
5. **A transactions file with a header and no data rows** — the spec explicitly contemplates zero transactions ("the opening amount if there are none"), so the report must be a blank line then `closing balance: <opening>` with no category lines, not a crash or a stray leading blank line.

### The tests that pin them

**1. Malformed row through the CLI** — Task 6, `test_cli.py::CliTests`:

- [ ] **Step 1 (add to the failing test): `test_malformed_row_returns_2`**

```python
    def test_malformed_row_returns_2(self):
        csv_path = write("date,amount,description\n2026-03-01,1.00,OK\n2026-13-40,1.00,BAD\n")
        self.addCleanup(os.unlink, csv_path)
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            rc = main(["report", csv_path])
        self.assertEqual(rc, 2)
        self.assertEqual(out.getvalue(), "")
        self.assertTrue(err.getvalue().startswith(f"ledgerlite: {csv_path}:3: "))
```

**2. Amount with more than two fractional digits** — Task 2, `test_parse.py::ParseTests` (and extend the Task 2 interface to name this rule and the wrong-column-count and non-numeric-amount rules it already claims):

- [ ] **Step 1 (add to the failing test): `test_amount_precision_and_shape`**

```python
    def test_three_fractional_digits_is_malformed(self):
        with self.assertRaises(ParseError) as cm:
            parse_csv("date,amount,description\n2026-03-04,1.005,x\n")
        self.assertEqual(cm.exception.line, 2)

    def test_one_and_two_fractional_digits_are_fine(self):
        txns = parse_csv("date,amount,description\n2026-03-04,1.5,a\n2026-03-04,1.50,b\n")
        self.assertEqual([t.amount for t in txns], [Decimal("1.5"), Decimal("1.50")])

    def test_wrong_column_count_and_bad_amount_raise_with_line(self):
        for bad in ("2026-03-04,1.00\n", "2026-03-04,1.00,x,y\n", "2026-03-04,twelve,x\n"):
            with self.subTest(bad=bad), self.assertRaises(ParseError) as cm:
                parse_csv("date,amount,description\n" + bad)
            self.assertEqual(cm.exception.line, 2)
```

**3. Bare invocation with no flags** — Task 6, `test_cli.py::CliTests`:

- [ ] **Step 1 (add to the failing test): `test_defaults_uncategorized_and_zero_opening`**

```python
    def test_defaults_uncategorized_and_zero_opening(self):
        csv_path = write(CSV)
        self.addCleanup(os.unlink, csv_path)
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            rc = main(["report", csv_path])
        self.assertEqual(rc, 0)
        self.assertEqual(out.getvalue(), "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")
        self.assertEqual(err.getvalue(), "")
```

**4. Rules line with no separator** — Task 3, `test_rules.py::RulesTests`:

- [ ] **Step 1 (add to the failing test): `test_parse_rules_tolerates_odd_lines`**

```python
    def test_lines_without_a_separator_are_skipped(self):
        self.assertEqual(parse_rules("coffee=food\nnot a rule\n   \nrent=housing\n"),
                         [("coffee", "food"), ("rent", "housing")])

    def test_splits_on_first_separator_only(self):
        self.assertEqual(parse_rules("a=b=c\n"), [("a", "b=c")])
```

**5. No transactions at all** — Task 5, `test_report.py::ReportTests` (`closing_balance([], opening)` is already covered by Task 4):

- [ ] **Step 1 (add to the failing test): `test_no_categories`**

```python
    def test_totals_of_no_transactions_is_empty(self):
        self.assertEqual(totals_by_category([]), {})

    def test_format_report_with_no_categories(self):
        self.assertEqual(format_report({}, Decimal("100")), "\nclosing balance: 100.00")
```
```
