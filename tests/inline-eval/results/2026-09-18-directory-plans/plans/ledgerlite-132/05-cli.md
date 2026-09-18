### Task 5: CLI entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.parse_transactions` / `parse.ParseError` (Task 1), `rules.parse_rules` (Task 2), `report.format_report` (Task 4).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — `argv` excludes the program name and defaults to `sys.argv[1:]`. Usage: `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`, `--opening` defaulting to `Decimal("0")`.

Exit codes and streams:

| outcome | stdout | stderr | return |
|---|---|---|---|
| success | the report | empty | `0` |
| a file cannot be read (transactions **or** rules) | empty | `ledgerlite: cannot read <path>: <reason>` | `1` |
| a malformed row | empty | `ledgerlite: <path>:<line>: <what is wrong>` | `2` |
| bad usage, including an invalid `--opening` | empty | argparse's usage/error text | `SystemExit(2)` from argparse |

`--opening` accepts the same amounts a row does: a finite decimal number with at most two fractional digits. Anything else is an argparse type error.

- [ ] **Step 1: Write the failing tests**

```python
import io
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-05,2500.00,Salary\n"
    "2026-03-04,-7.50,Coffee shop\n"
    "2026-03-04,-900.00,Rent March\n"
)
RULES = "coffee=food\nrent=housing\n"
EXPECTED = (
    "food: -7.50\n"
    "housing: -900.00\n"
    "uncategorized: 2500.00\n"
    "\n"
    "closing balance: 1692.50\n"
)


class CliTest(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        self.txns = self.dir / "txns.csv"
        self.txns.write_text(TRANSACTIONS)
        self.rules = self.dir / "rules.txt"
        self.rules.write_text(RULES)

    def run_main(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_reports_the_spec_example(self):
        code, out, err = self.run_main(
            "report", str(self.txns), "--rules", str(self.rules), "--opening", "100"
        )
        self.assertEqual((code, out, err), (0, EXPECTED, ""))

    def test_opening_defaults_to_zero(self):
        code, out, _ = self.run_main("report", str(self.txns), "--rules", str(self.rules))
        self.assertTrue(out.endswith("closing balance: 1592.50\n"))
        self.assertEqual(code, 0)

    def test_without_rules_everything_is_uncategorized(self):
        code, out, _ = self.run_main("report", str(self.txns))
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")
        self.assertEqual(code, 0)

    def test_unreadable_transactions_file(self):
        missing = self.dir / "nope.csv"
        code, out, err = self.run_main("report", str(missing))
        self.assertEqual((code, out), (1, ""))
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "))
        self.assertTrue(err.endswith("\n"))

    def test_unreadable_rules_file(self):
        missing = self.dir / "nope.txt"
        code, out, err = self.run_main("report", str(self.txns), "--rules", str(missing))
        self.assertEqual((code, out), (1, ""))
        self.assertTrue(err.startswith(f"ledgerlite: cannot read {missing}: "))

    def test_malformed_row_rejects_the_whole_file(self):
        bad = self.dir / "bad.csv"
        bad.write_text("date,amount,description\n2026-03-04,-1.00,ok\n2026-03-05,1.005,no\n")
        code, out, err = self.run_main("report", str(bad))
        self.assertEqual(
            (code, out, err),
            (2, "", f"ledgerlite: {bad}:3: amount has more than two decimal places: '1.005'\n"),
        )

    def test_invalid_opening_is_a_usage_error(self):
        for value in ("abc", "1.005"):
            with self.subTest(value=value):
                err = io.StringIO()
                out = io.StringIO()
                with redirect_stdout(out), redirect_stderr(err):
                    with self.assertRaises(SystemExit) as caught:
                        main(["report", str(self.txns), "--opening", value])
                self.assertEqual(caught.exception.code, 2)
                self.assertEqual(out.getvalue(), "")
                self.assertIn("--opening", err.getvalue())


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `main(argv=None) -> int` in `ledgerlite/cli.py`**

Build an `argparse.ArgumentParser(prog="ledgerlite")` with a required `report` subcommand taking the positional `transactions` plus `--rules` and `--opening` (`default=Decimal("0")`, `type=` a module-level helper that returns a `Decimal` and raises `argparse.ArgumentTypeError` for anything not finite or with more than two fractional digits — the same test `parse` applies to a row's amount). Read each file with `pathlib.Path(path).read_text()`, catching `(OSError, UnicodeDecodeError)` and reporting `<reason>` as `getattr(error, "strerror", None) or str(error)`; catch `ParseError` around `parse_transactions` and print `ledgerlite: {path}:{error.line}: {error.message}`. Write every error line to `sys.stderr` and return before anything reaches stdout; print the string from `format_report` to stdout with `end=""`.

- [ ] **Step 4: Implement `ledgerlite/__main__.py`**

Two lines: call `main()` and pass its return value to `sys.exit`.

- [ ] **Step 5: Run the whole suite**

Run: `python3 -m unittest -v`
Expected: PASS — every test from Tasks 1-5

- [ ] **Step 6: Smoke-test the real command**

Run:
```bash
printf 'date,amount,description\n2026-03-05,2500.00,Salary\n2026-03-04,-7.50,Coffee shop\n2026-03-04,-900.00,Rent March\n' > /tmp/t.csv
printf 'coffee=food\nrent=housing\n' > /tmp/r.txt
python3 -m ledgerlite report /tmp/t.csv --rules /tmp/r.txt --opening 100; echo "exit=$?"
python3 -m ledgerlite report /tmp/missing.csv; echo "exit=$?"
```
Expected: the spec's example report then `exit=0`; then `ledgerlite: cannot read /tmp/missing.csv: No such file or directory` and `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: ledgerlite report command-line entry point"
```
