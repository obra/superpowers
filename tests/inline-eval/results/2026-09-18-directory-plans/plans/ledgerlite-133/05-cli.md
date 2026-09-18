### Task 5: Command-line interface

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py` (one line: `from ledgerlite.cli import main` then `raise SystemExit(main())`, so the tool is runnable as `python3 -m ledgerlite report ...`; the design's layout does not list this file, but without it nothing can invoke the command)
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_transactions` / `ParseError` (Task 1), `parse_rules` (Task 2), `format_report` (Task 4).
- Produces: `ledgerlite.cli.main(argv: list[str] | None = None) -> int` — `argv` excludes the program name and defaults to `sys.argv[1:]`. Writes the report to stdout, errors to stderr, returns the exit code.

Command line: `ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`. `prog` is `ledgerlite`, the subcommand `report` is required. `--opening` defaults to `Decimal("0")`.

Exit codes and messages:

| Situation | stderr | return |
|---|---|---|
| success | — | `0` (report on stdout) |
| transactions file unreadable | `ledgerlite: cannot read <path>: <reason>` | `1` |
| rules file unreadable | `ledgerlite: cannot read <path>: <reason>` | `1` |
| malformed row or header | `ledgerlite: <path>:<line>: <what is wrong>` | `2`, stdout empty |
| `--opening` not a two-decimal number | argparse usage error | `SystemExit(2)` |

- [ ] **Step 1: Write the failing tests**

```python
# test_cli.py
import contextlib
import io
import os
import tempfile
import unittest

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-04,-7.50,Coffee Shop\n"
    "2026-03-01,2500.00,Salary\n"
    "2026-03-02,-900.00,Rent March\n"
)
RULES = "coffee=food\nrent=housing\n"
DESIGN_REPORT = (
    "food: -7.50\n"
    "housing: -900.00\n"
    "uncategorized: 2500.00\n"
    "\n"
    "closing balance: 1692.50\n"
)


class CliTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)

    def write(self, name, text):
        path = os.path.join(self.dir.name, name)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        return path

    def run_cli(self, *args):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(args))
        return code, out.getvalue(), err.getvalue()

    def test_reports_the_design_example(self):
        code, out, err = self.run_cli(
            "report",
            self.write("t.csv", TRANSACTIONS),
            "--rules",
            self.write("rules.txt", RULES),
            "--opening",
            "100",
        )
        self.assertEqual((code, err), (0, ""))
        self.assertEqual(out, DESIGN_REPORT)

    def test_opening_defaults_to_zero_and_rules_are_optional(self):
        code, out, _ = self.run_cli("report", self.write("t.csv", TRANSACTIONS))
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1592.50\n")

    def test_header_only_file_reports_the_opening_balance(self):
        path = self.write("t.csv", "date,amount,description\n")
        code, out, _ = self.run_cli("report", path, "--opening", "100")
        self.assertEqual((code, out), (0, "\nclosing balance: 100.00\n"))

    def test_missing_transactions_file(self):
        path = os.path.join(self.dir.name, "nope.csv")
        code, out, err = self.run_cli("report", path)
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(err, f"ledgerlite: cannot read {path}: No such file or directory\n")

    def test_missing_rules_file(self):
        transactions = self.write("t.csv", TRANSACTIONS)
        rules = os.path.join(self.dir.name, "nope.txt")
        code, out, err = self.run_cli("report", transactions, "--rules", rules)
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(err, f"ledgerlite: cannot read {rules}: No such file or directory\n")

    def test_malformed_row_prints_nothing_to_stdout(self):
        path = self.write(
            "t.csv", "date,amount,description\n2026-03-01,2500.00,Salary\n2026-03-04,1.005,Coffee\n"
        )
        code, out, err = self.run_cli("report", path)
        self.assertEqual((code, out), (2, ""))
        self.assertEqual(
            err, f"ledgerlite: {path}:3: amount has more than two decimal places: 1.005\n"
        )

    def test_missing_header_is_reported_at_line_1(self):
        path = self.write("t.csv", "2026-03-04,-7.50,Coffee\n")
        code, _, err = self.run_cli("report", path)
        self.assertEqual(code, 2)
        self.assertEqual(
            err, f"ledgerlite: {path}:1: expected header date,amount,description\n"
        )

    def test_invalid_opening_amount_is_a_usage_error(self):
        path = self.write("t.csv", TRANSACTIONS)
        with contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit) as caught:
                main(["report", path, "--opening", "1.005"])
        self.assertEqual(caught.exception.code, 2)
        self.assertIn("invalid opening amount: 1.005", err.getvalue())


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `main(argv=None) -> int` in `ledgerlite/cli.py`, plus `ledgerlite/__main__.py`**

Build the parser with `argparse.ArgumentParser(prog="ledgerlite")` and `add_subparsers(dest="command", required=True)`. `--opening` uses `type=_opening_amount`, a module-level function that returns a `Decimal` and raises `argparse.ArgumentTypeError(f"invalid opening amount: {value}")` for anything not a finite decimal with at most two fractional digits — the same three checks Task 1 applies to row amounts. Read each file with a helper that opens it with `encoding="utf-8", newline=""` and returns its text; wrap both reads in one `except OSError` that prints `ledgerlite: cannot read {path}: {reason}` to stderr and returns 1, where `reason` is `err.strerror` (or `str(err)` when that is `None`). Catch `ParseError` around `parse_transactions` and print `ledgerlite: {path}:{err.line}: {err.message}`, returning 2 before anything reaches stdout. On success `print(format_report(...))`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (all tests)

- [ ] **Step 5: Run the whole suite and the tool by hand**

Run: `python3 -m unittest -v`
Expected: PASS, every test from Tasks 1–5.

Run: `printf 'date,amount,description\n2026-03-04,-7.50,Coffee Shop\n2026-03-01,2500.00,Salary\n2026-03-02,-900.00,Rent March\n' > /tmp/t.csv && printf 'coffee=food\nrent=housing\n' > /tmp/r.txt && python3 -m ledgerlite report /tmp/t.csv --rules /tmp/r.txt --opening 100`
Expected: exactly the report from `design.md`'s example.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: ledgerlite report command-line interface"
```
