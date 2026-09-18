### Task 6: CLI

**Files:**
- Create: `ledgerlite/cli.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_csv(path: str) -> list[Transaction]` (Task 2); `parse_rules`, `categorize` (Task 3); `ordered`, `closing_balance` (Task 4); `totals_by_category`, `format_report` (Task 5).
- Produces: `main(argv: list[str]) -> int` — `report TRANSACTIONS [--rules RULES] [--opening AMOUNT]`; prints the report to stdout and returns 0; an unreadable TRANSACTIONS prints `ledgerlite: cannot read <path>: <reason>` to stderr and returns 1.

- [ ] **Step 1: Write the failing test**

```python
import io
import os
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from ledgerlite.cli import main

CSV = "date,amount,description\n2026-03-04,-7.50,COFFEE SHOP\n2026-03-01,2500.00,SALARY\n2026-03-04,-900.00,RENT MARCH\n"
RULES = "coffee=food\nrent=housing\n"


def write(text):
    f = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False)
    f.write(text)
    f.close()
    return f.name


class CliTests(unittest.TestCase):
    def test_report_end_to_end(self):
        csv_path, rules_path = write(CSV), write(RULES)
        self.addCleanup(os.unlink, csv_path)
        self.addCleanup(os.unlink, rules_path)
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            rc = main(["report", csv_path, "--rules", rules_path, "--opening", "100"])
        self.assertEqual(rc, 0)
        self.assertEqual(out.getvalue(), "food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50\n")
        self.assertEqual(err.getvalue(), "")

    def test_missing_file_returns_1(self):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            rc = main(["report", "/no/such/file.csv"])
        self.assertEqual(rc, 1)
        self.assertEqual(out.getvalue(), "")
        self.assertTrue(err.getvalue().startswith("ledgerlite: cannot read /no/such/file.csv"))
```

- [ ] **Step 2: Run it and watch it fail** — `python3 -m unittest test_cli` → ImportError.
- [ ] **Step 3: Implement** `ledgerlite/cli.py` with `argparse` (subcommand `report`), wiring the modules in order: parse → categorize → ordered → totals and closing balance → format_report; print the report with a trailing newline.
- [ ] **Step 4: Run the whole suite and watch it pass** — `python3 -m unittest` → OK.
- [ ] **Step 5: Commit** — `git add ledgerlite/cli.py test_cli.py && git commit -m "Add CLI"`
