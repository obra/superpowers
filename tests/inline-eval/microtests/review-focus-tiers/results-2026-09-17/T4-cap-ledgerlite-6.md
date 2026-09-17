```markdown
## Review Focus

The spec's edges that no task's tests currently touch, most likely to bite first:

1. **A malformed row reaching the CLI** — the whole exit-2 path is untested end to end: given a CSV whose line 3 has an unparseable date, the user expects `ledgerlite: <path>:3: <what is wrong>` on stderr, exit code 2, and *nothing* on stdout (the whole file is rejected). Task 2 tests `ParseError` in isolation and Task 6 tests only exit 0 and exit 1, so nothing checks that `ParseError` is caught, formatted with the path, or that stdout stays empty.
   → **Task 6, Step 1**, add to `test_cli.py`: `test_malformed_row_returns_2` — write `"date,amount,description\n2026-03-01,1.00,a\n2026-13-40,1.00,b\n"`, run `main(["report", path])`, assert `rc == 2`, `out.getvalue() == ""`, and `err.getvalue().startswith(f"ledgerlite: {path}:3: ")`.

2. **An amount with more than two fractional digits (`1.005`)** — the spec names this as malformed while `1.5` and `1.50` are fine, but Task 2's interface omits the rule and no test covers it, so a rate-rounded row will be silently accepted and quietly re-rounded in the report instead of rejected.
   → **Task 2, Step 1**, add to `test_parse.py`: `test_amount_precision` — `parse_csv("date,amount,description\n2026-03-04,1.005,x\n")` raises `ParseError` with `line == 2`, while `1.5` and `1.50` on line 2 both parse to `Decimal("1.5")` and `Decimal("1.50")` respectively. (Also widen Task 2's **Produces** text to list the fractional-digit rule.)

3. **`--opening` omitted, or given a negative/fractional amount** — every existing test passes `--opening 100`, so the documented default of `0` is never run and nothing forces the flag to be parsed as `Decimal` rather than `float`; a user reporting on a fresh file or an overdrawn account gets a wrong closing balance.
   → **Task 6, Step 1**, add to `test_cli.py`: `test_opening_default_and_decimal` — `main(["report", csv_path])` (no flag) ends with `closing balance: 1592.50`; `main(["report", csv_path, "--opening", "-25.75"])` ends with `closing balance: 1566.75`.

4. **No `--rules` at all** — the spec's documented "every transaction is uncategorized" mode is never exercised through the CLI, so the most likely first invocation a user tries can crash on a `None` rules path or print a `None:` line.
   → **Task 6, Step 1**, add to `test_cli.py`: `test_no_rules_all_uncategorized` — `main(["report", csv_path, "--opening", "100"])` returns 0 and prints exactly `"uncategorized: 1592.50\n\nclosing balance: 1692.50\n"` with empty stderr.

5. **A rule whose substring is capitalized (`Coffee=food`)** — Task 3 only tests lowercase substrings against an uppercase description, so an implementation that lowercases just the description passes while the spec's case-insensitive matching fails on the first rules file a person hand-writes.
   → **Task 3, Step 1**, add to `test_rules.py`: `test_rule_substring_case_insensitive` — `categorize([Transaction(date(2026, 3, 4), Decimal("-7.50"), "coffee shop")], [("COFFEE", "food")])[0].category == "food"`.
```
