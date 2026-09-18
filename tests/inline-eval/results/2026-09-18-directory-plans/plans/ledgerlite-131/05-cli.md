### Task 5: CLI entry point

**Files:**
- Create: `ledgerlite/cli.py`
- Create: `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse.ParseError`, `parse.parse_amount`, `parse.parse_transactions` (Task 1); `rules.parse_rules` (Task 2); `report.format_report` (Task 4).
- Produces: `cli.main(argv: list[str] | None = None) -> int` — writes the report to `sys.stdout`, errors to `sys.stderr`, returns the exit code. `ledgerlite/__main__.py` is `sys.exit(main())`, so the tool runs as `python3 -m ledgerlite report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`.

**Pinned decisions:**
- No packaging metadata is added; `python3 -m ledgerlite` is the runnable form of the `ledgerlite` command in the spec.
- `argparse` with `prog="ledgerlite"`, one subcommand `report` (required), positional `transactions`, options `--rules` (default `None`) and `--opening` (default `Decimal("0")`).
- `--opening` uses `type=` a wrapper around `parse.parse_amount` that re-raises `ValueError` as `argparse.ArgumentTypeError`, so a bad value is an argparse usage error: message on stderr and `SystemExit(2)`.
- Files are read with `pathlib.Path(path).read_text(encoding="utf-8")`. `OSError` → reason is `err.strerror`; `UnicodeDecodeError` → reason is `not valid UTF-8`. Either way: `ledgerlite: cannot read {path}: {reason}` on stderr, return `1`.
- `ParseError` from either file → `ledgerlite: {path}:{err.line}: {err.message}` on stderr, return `2`, nothing on stdout. The transactions file is read and parsed before the rules file is read, so when both are bad the transactions error is the one reported.

- [ ] **Step 1: Write the failing tests**

`test_cli.py`:

```python
import io
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from tempfile import TemporaryDirectory

from ledgerlite.cli import main

TRANSACTIONS = (
    "date,amount,description\n"
    "2026-03-05,2500.00,Salary\n"
    "2026-03-04,-7.50,Coffee shop\n"
    "2026-03-01,-900.00,Rent March\n"
)
RULES = "coffee=food\nrent=housing\n"


class CliTest(unittest.TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)
        self.txns = self.write("txns.csv", TRANSACTIONS)
        self.rules = self.write("rules.txt", RULES)

    def write(self, name, text):
        path = self.dir / name
        path.write_text(text, encoding="utf-8")
        return str(path)

    def run_cli(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_prints_report_and_returns_zero(self):
        code, out, err = self.run_cli(
            ["report", self.txns, "--rules", self.rules, "--opening", "100"]
        )
        self.assertEqual(code, 0)
        self.assertEqual(err, "")
        self.assertEqual(
            out,
            "food: -7.50\n"
            "housing: -900.00\n"
            "uncategorized: 2500.00\n"
            "\n"
            "closing balance: 1692.50\n",
        )

    def test_without_rules_everything_is_uncategorized(self):
        code, out, _ = self.run_cli(["report", self.txns, "--opening", "100"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "uncategorized: 1592.50\n\nclosing balance: 1692.50\n")

    def test_opening_defaults_to_zero(self):
        _, out, _ = self.run_cli(["report", self.txns])
        self.assertIn("closing balance: 1592.50\n", out)

    def test_unreadable_transactions_file(self):
        missing = str(self.dir / "nope.csv")
        code, out, err = self.run_cli(["report", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: No such file or directory\n"
        )

    def test_unreadable_rules_file(self):
        missing = str(self.dir / "nope.txt")
        code, out, err = self.run_cli(["report", self.txns, "--rules", missing])
        self.assertEqual(code, 1)
        self.assertEqual(out, "")
        self.assertEqual(
            err, f"ledgerlite: cannot read {missing}: No such file or directory\n"
        )

    def test_malformed_row_returns_two_and_prints_nothing(self):
        bad = self.write("bad.csv", "date,amount,description\n2026-03-04,1.005,Coffee\n")
        code, out, err = self.run_cli(["report", bad])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(
            err,
            f"ledgerlite: {bad}:2: amount has more than two fractional digits: '1.005'\n",
        )

    def test_malformed_rules_file_returns_two(self):
        bad = self.write("bad.txt", "coffee=food\nrent housing\n")
        code, out, err = self.run_cli(["report", self.txns, "--rules", bad])
        self.assertEqual(code, 2)
        self.assertEqual(out, "")
        self.assertEqual(err, f"ledgerlite: {bad}:2: rule has no '='\n")

    def test_bad_opening_is_a_usage_error(self):
        for value in ("abc", "1.005"):
            with self.subTest(value=value):
                with self.assertRaises(SystemExit) as caught:
                    self.run_cli(["report", self.txns, "--opening", value])
                self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `main` in `ledgerlite/cli.py` and `ledgerlite/__main__.py`**

Build the parser, then read-and-parse in this order: transactions file, rules file (skipped when `--rules` is absent, giving `[]`). A single helper that takes a path and returns its text, raising the read error to be reported, keeps the two `cannot read` paths identical. Print with `print(format_report(...), end="")` since the report already ends in a newline, and write error lines to `sys.stderr`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (all tests)

- [ ] **Step 5: Run the whole suite and the tool itself**

Run: `python3 -m unittest -v`
Expected: PASS — every test in `test_parse`, `test_rules`, `test_balance`, `test_report`, `test_cli`

Then confirm the end-to-end path with real files, writing the spec's example ledger to a temp directory:

Run: `python3 -m ledgerlite report /tmp/txns.csv --rules /tmp/rules.txt --opening 100`
Expected: the four report lines from `design.md`, exit status 0 (`echo $?`)

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite CLI entry point"
```
