```markdown
## Review Focus

The spec implies these inputs and failure modes; no task above exercises them. Most likely to bite first.

1. **A malformed row reaching the CLI** — a real CSV with one bad date or a short row: the user expects `ledgerlite: <path>:<line>: <reason>` on stderr, exit 2, and *nothing* on stdout (no partial report). Task 2 tests `ParseError.line` but no test ever runs a bad file through `main`, so the exit code, the `<path>:<line>:` prefix, and the empty-stdout guarantee are all unpinned.
   - [ ] **Task 6, Step 1: add `test_malformed_row_returns_2` to `test_cli.py`** — write a CSV whose third line is `2026-13-40,1.00,x`, call `main(["report", path])`, assert `rc == 2`, `out.getvalue() == ""`, and `err.getvalue() == f"ledgerlite: {path}:3: ...\n"` (exact reason text as implemented, path and line pinned).

2. **`ledgerlite report FILE` with no flags** — the most common invocation. `--opening` defaults to `0` and every transaction is uncategorized. Task 6's only success test always passes `--rules` and `--opening 100`, so an argparse default of `"0"` (str) or a `float` conversion crashes or misprints on the bare command and no test notices.
   - [ ] **Task 6, Step 1: add `test_bare_report_uses_zero_opening_and_no_rules` to `test_cli.py`** — call `main(["report", csv_path])` with the existing three-row CSV, assert `rc == 0` and `out.getvalue() == "uncategorized: 1592.50\n\nclosing balance: 1592.50\n"`.

3. **Two or more transactions in the same category** — totals are sums. Every existing test has exactly one transaction per category, so an implementation that assigns (`totals[cat] = t.amount`) instead of accumulating passes the whole suite while reporting the wrong money.
   - [ ] **Task 5, Step 1: add `test_totals_sum_within_a_category` to `test_report.py`** — three transactions, two `"food"` (`-7.50`, `-2.25`) and one uncategorized (`5.00`), assert `totals_by_category(txns) == {"food": Decimal("-9.75"), "uncategorized": Decimal("5.00")}`.

4. **An amount with more than two fractional digits** — `1.005` is malformed (reject the whole file); `1.5` and `1.50` are fine. This is an explicit spec rule with no test anywhere; the obvious `Decimal(field)` accepts `1.005` silently and the extra precision then leaks into the printed totals via `quantize`.
   - [ ] **Task 2, Step 1: add `test_amount_precision` to `test_parse.py`** — assert `parse_csv("date,amount,description\n2026-03-04,1.005,x\n")` raises `ParseError` with `line == 2`, and that `1.5` and `1.50` parse to `Decimal("1.5")` and `Decimal("1.50")` without raising.

5. **A rules file written in the bank's own casing (`COFFEE=food`)** — matching is case-insensitive on the description, which means insensitive in both directions. The existing test only has a lowercase substring against a mixed-case description, so `substring in description.lower()` passes while every uppercase rule silently matches nothing.
   - [ ] **Task 3, Step 1: extend `test_first_match_wins_case_insensitive` in `test_rules.py`** — add a case with rules `[("COFFEE", "food")]` against description `"coffee shop"`, asserting `out[0].category == "food"`.
```
