# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only Python CLI that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired together only in `cli.py`: `model` (the `Transaction` record), `parse` (text → transactions, with `ParseError` carrying a line number), `rules` (rules text → rule list, plus `categorize`), `balance` (date ordering and closing balance), `report` (bucketing and formatting), `cli` (argparse, file reading, exit codes). Everything below `cli` is pure — it takes and returns strings and objects, never touches the filesystem, and never prints — so all of it is directly unit-testable, and `cli` owns the only I/O and the only knowledge of paths and exit codes.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `dataclasses`, `argparse`, `pathlib`, `re`, `io`), tests with `unittest`.

**Spec:** `design.md` (in this repo root)

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies.
- Money is always `decimal.Decimal`, never `float`. No arithmetic path may pass through `float`.
- Package lives at `ledgerlite/`; tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Amounts print with exactly two fractional digits, a leading `-` for negatives, and no thousands separators (`-12.50`, `0.00`, `1200.00`).
- Error messages go to stderr and are exactly: `ledgerlite: cannot read <path>: <reason>` (exit 1) and `ledgerlite: <path>:<line>: <what is wrong>` (exit 2). Success prints only the report to stdout and exits 0.
- A malformed row rejects the whole file: nothing is printed to stdout.
- Work directly on `main`; this repo has no remote, so never push.

## Review Focus

Five input classes the spec implies but does not spell out. Each has a test in the task that owns the code; they are listed here because they are the ones most likely to bite a real user.

1. A description containing a comma or double quotes (`"COFFEE, LARGE"`) must parse as one field, not a column-count error — real bank exports quote descriptions. (Task 2)
2. A transactions path that names a directory, or a `--rules` path that does not exist, must produce the `cannot read` message and exit 1, never a traceback. (Task 6)
3. Amount spellings `decimal.Decimal` accepts but the spec does not (`1e3`, `NaN`, `Infinity`, the empty string) must be rejected as malformed with exit 2, not silently turned into a number. (Task 2)
4. A category whose amounts cancel to negative zero must print `0.00`, not `-0.00` — `Decimal` preserves the sign. (Task 5)
5. A transactions file that is not valid UTF-8 must produce the `cannot read` message and exit 1, not a `UnicodeDecodeError` traceback. (Task 6)

---

## File Structure

| File | Responsibility |
|---|---|
| `ledgerlite/__init__.py` | Empty package marker. |
| `ledgerlite/model.py` | `Transaction` frozen dataclass. |
| `ledgerlite/parse.py` | `ParseError`, `parse_amount`, `parse_transactions`. |
| `ledgerlite/rules.py` | `parse_rules`, `categorize`. |
| `ledgerlite/balance.py` | `order_by_date`, `closing_balance`. |
| `ledgerlite/report.py` | `format_amount`, `category_totals`, `format_report`. |
| `ledgerlite/cli.py` | `main(argv) -> int`: argparse, file reads, exit codes. |
| `ledgerlite/__main__.py` | `python3 -m ledgerlite` entry point. |
| `test_model.py`, `test_parse.py`, `test_rules.py`, `test_balance.py`, `test_report.py`, `test_cli.py` | Unit tests, repo root. |

`design.md`'s layout does not list `__main__.py`; it is added in Task 6 because without it the tool cannot be invoked at all. There is no packaging metadata, so the invocation is `python3 -m ledgerlite report ...` rather than a `ledgerlite` console script.

---

### Task 1: Package skeleton and `Transaction` model

**Files:**
- Create: `ledgerlite/__init__.py` (empty), `ledgerlite/model.py`, `.gitignore`
- Test: `test_model.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `Transaction`, a frozen dataclass with fields `date: datetime.date`, `amount: decimal.Decimal`, `description: str`, in that positional order. Every later task uses it.

- [ ] **Step 1: Write the failing tests in `test_model.py`**

- `test_fields_are_positional`: `Transaction(date(2026, 3, 4), Decimal("-7.50"), "Coffee")` has `.date == date(2026, 3, 4)`, `.amount == Decimal("-7.50")`, `.description == "Coffee"`
- `test_is_frozen`: assigning to `.amount` raises `dataclasses.FrozenInstanceError`
- `test_equality_by_value`: two `Transaction`s built from the same three values are `==`

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_model -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ledgerlite'`

- [ ] **Step 3: Create the package and `Transaction` in `ledgerlite/model.py`**

`@dataclasses.dataclass(frozen=True)`. Create `ledgerlite/__init__.py` empty, and `.gitignore` containing `__pycache__/`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_model -v`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add .gitignore ledgerlite/__init__.py ledgerlite/model.py test_model.py
git commit -m "feat: add ledgerlite package skeleton and Transaction model"
```

---

### Task 2: `parse.py` — CSV text to transactions

**Files:**
- Create: `ledgerlite/parse.py`
- Test: `test_parse.py`

**Interfaces:**
- Consumes: `Transaction` from Task 1.
- Produces:
  - `class ParseError(Exception)` — constructed `ParseError(line: int, message: str)`, exposing `.line: int` and `.message: str`. `super().__init__(message)`.
  - `parse_amount(text: str) -> Decimal` — raises `ValueError` on bad input. Message is exactly `amount is not a decimal number` or `amount has more than two fractional digits`. Task 6 reuses this for `--opening`.
  - `parse_transactions(text: str) -> list[Transaction]` — input order preserved; raises `ParseError` on the first bad line.

**Pinned decisions (the spec leaves these open):**
- Line numbers are 1-based file lines, so the header is line 1 and the first data row is line 2. Use `csv.reader(io.StringIO(text))` and read `reader.line_num` for the current line, which stays correct when a quoted field spans newlines.
- The first row is the header. It must equal `date`, `amount`, `description` after stripping each field and lowercasing; otherwise `ParseError(1, "expected header 'date,amount,description'")`. A file with no rows at all is `ParseError(1, "file is empty")`.
- Rows that are empty or whose every field is blank after stripping are skipped, not errors — a stray blank line should not reject a file.
- `date` and `amount` fields are stripped before parsing; `description` is kept verbatim.
- Date parsing is `datetime.date.fromisoformat`, so `2026-3-4` and `2026-02-30` are malformed.
- Amount validity is a regex, not `Decimal`'s own leniency: `re.fullmatch(r"[+-]?\d+(?:\.\d+)?", s)` must match (else `amount is not a decimal number`), and any fractional part must be 1–2 digits (else `amount has more than two fractional digits`). This rejects `1e3`, `NaN`, `Infinity`, `.5` and `""`, and accepts `+5`, `1.5`, `1.50`.
- Row-level messages append the offending raw value: e.g. `amount is not a decimal number: 'abc'`.

- [ ] **Step 1: Write the failing tests in `test_parse.py`**

Helper: build CSV text inline with `"\n".join([...])`. `HEADER = "date,amount,description"`.

`parse_amount`:
- `test_amount_two_digits`: `parse_amount("-12.50")` -> `Decimal("-12.50")`
- `test_amount_one_digit_and_integer`: `parse_amount("1.5")` -> `Decimal("1.5")`; `parse_amount("+5")` -> `Decimal("5")`
- `test_amount_rejects_non_number`: each of `"abc"`, `"1e3"`, `"NaN"`, `"Infinity"`, `""`, `".5"` raises `ValueError` with `str(e) == "amount is not a decimal number"`
- `test_amount_rejects_extra_digits`: `parse_amount("1.005")` raises `ValueError` with `str(e) == "amount has more than two fractional digits"`

`parse_transactions`:
- `test_parses_rows_in_input_order`: header plus `2026-03-05,2500.00,Salary` and `2026-03-04,-7.50,Coffee` -> two `Transaction`s in that same input order, amounts `Decimal("2500.00")` then `Decimal("-7.50")`
- `test_header_only_is_empty_list`: `HEADER` alone -> `[]`
- `test_quoted_description_with_comma`: row `2026-03-04,-7.50,"COFFEE, LARGE"` -> one transaction with `.description == "COFFEE, LARGE"` (Review Focus 1)
- `test_quoted_description_with_quotes`: row `2026-03-04,-7.50,"say ""hi"""` -> `.description == 'say "hi"'`
- `test_skips_blank_lines`: header, a blank line, one valid row -> one transaction
- `test_strips_whitespace_in_date_and_amount`: row `  2026-03-04 , -7.50 ,Coffee` -> parses, `.amount == Decimal("-7.50")`
- `test_rejects_missing_header`: text `2026-03-04,-7.50,Coffee` (no header) raises `ParseError` with `.line == 1` and `.message == "expected header 'date,amount,description'"`
- `test_rejects_empty_file`: `parse_transactions("")` raises `ParseError` with `.line == 1`, `.message == "file is empty"`
- `test_rejects_wrong_column_count`: header plus `2026-03-04,-7.50` raises `ParseError` with `.line == 2`, `.message == "expected 3 columns, got 2"`
- `test_rejects_bad_date`: header plus `2026-3-4,-7.50,Coffee` raises `ParseError` with `.line == 2`, `.message == "date is not a valid ISO 8601 date: '2026-3-4'"`
- `test_rejects_impossible_date`: header plus `2026-02-30,-7.50,Coffee` raises `ParseError` with `.line == 2`
- `test_rejects_bad_amount`: header plus `2026-03-04,abc,Coffee` raises `ParseError` with `.line == 2`, `.message == "amount is not a decimal number: 'abc'"` (Review Focus 3)
- `test_rejects_too_many_fractional_digits`: header plus `2026-03-04,1.005,Coffee` raises `ParseError` with `.line == 2`, `.message == "amount has more than two fractional digits: '1.005'"`
- `test_reports_line_of_second_bad_row`: header, one valid row, then `2026-03-04,abc,X` raises `ParseError` with `.line == 3`

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_parse -v`
Expected: FAIL with `ImportError` / `No module named 'ledgerlite.parse'`

- [ ] **Step 3: Implement `ParseError`, `parse_amount`, and `parse_transactions` in `ledgerlite/parse.py`**

Follow the pinned decisions above. `parse_transactions` iterates the `csv.reader`, treats the first non-skipped row as the header, and wraps each `ValueError` from `parse_amount` / `date.fromisoformat` into `ParseError(reader.line_num, f"{message}: {raw!r}")`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_parse -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/parse.py test_parse.py
git commit -m "feat: parse transactions CSV into Transaction records"
```

---

### Task 3: `rules.py` — rules text and categorization

**Files:**
- Create: `ledgerlite/rules.py`
- Test: `test_rules.py`

**Interfaces:**
- Consumes: `ParseError` from Task 2 (imported, not redefined).
- Produces:
  - `parse_rules(text: str) -> list[tuple[str, str]]` — `(substring, category)` pairs in file order; raises `ParseError`.
  - `categorize(description: str, rules: list[tuple[str, str]]) -> str | None` — first matching rule wins, `None` if none match.

**Pinned decisions:**
- Blank/whitespace-only lines are skipped. Line numbers are 1-based over the rules file.
- Split on the first `=` only, so a category may contain `=`. Both halves are stripped.
- A non-blank line with no `=` is `ParseError(line, "rule line has no '='")`. An empty substring is `ParseError(line, "rule has an empty substring")`; an empty category is `ParseError(line, "rule has an empty category")`. Rejecting these is better than an empty substring silently matching every transaction.
- Matching lowercases (`str.casefold`) both the description and the substring.

- [ ] **Step 1: Write the failing tests in `test_rules.py`**

`parse_rules`:
- `test_parses_rules_in_order`: `"coffee=food\nrent=housing\n"` -> `[("coffee", "food"), ("rent", "housing")]`
- `test_skips_blank_lines`: `"\ncoffee=food\n   \n"` -> `[("coffee", "food")]`
- `test_empty_text_is_no_rules`: `parse_rules("")` -> `[]`
- `test_strips_whitespace`: `"  coffee  =  food  "` -> `[("coffee", "food")]`
- `test_splits_on_first_equals_only`: `"a=b=c"` -> `[("a", "b=c")]`
- `test_rejects_line_without_equals`: `"coffee=food\nrent\n"` raises `ParseError` with `.line == 2`, `.message == "rule line has no '='"`
- `test_rejects_empty_substring`: `"=food"` raises `ParseError` with `.line == 1`, `.message == "rule has an empty substring"`
- `test_rejects_empty_category`: `"coffee="` raises `ParseError` with `.line == 1`, `.message == "rule has an empty category"`

`categorize`:
- `test_matches_substring`: `categorize("Blue Bottle Coffee", [("coffee", "food")])` -> `"food"`
- `test_match_is_case_insensitive_both_ways`: `categorize("BLUE BOTTLE COFFEE", [("Coffee", "food")])` -> `"food"`
- `test_first_matching_rule_wins`: `categorize("coffee rent", [("rent", "housing"), ("coffee", "food")])` -> `"housing"`
- `test_no_match_is_none`: `categorize("ATM", [("coffee", "food")])` -> `None`
- `test_no_rules_is_none`: `categorize("Coffee", [])` -> `None`

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_rules -v`
Expected: FAIL with `No module named 'ledgerlite.rules'`

- [ ] **Step 3: Implement `parse_rules` and `categorize` in `ledgerlite/rules.py`**

Follow the pinned decisions above.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_rules -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/rules.py test_rules.py
git commit -m "feat: parse rules file and categorize descriptions"
```

---

### Task 4: `balance.py` — date ordering and closing balance

**Files:**
- Create: `ledgerlite/balance.py`
- Test: `test_balance.py`

**Interfaces:**
- Consumes: `Transaction` from Task 1.
- Produces:
  - `order_by_date(transactions: list[Transaction]) -> list[Transaction]` — sorted by `.date`, ties keeping input order. New list; input untouched.
  - `closing_balance(transactions: list[Transaction], opening: Decimal) -> Decimal` — `opening` plus every amount.

Only the closing value is ever printed, so no per-transaction running-balance sequence is exposed; `closing_balance` walks the ordered list and returns the final value.

- [ ] **Step 1: Write the failing tests in `test_balance.py`**

- `test_orders_by_date`: `order_by_date([mar05, mar04])` -> `[mar04, mar05]`
- `test_same_date_keeps_input_order`: two transactions both dated `2026-03-04` with descriptions `"a"` then `"b"` -> descriptions still `["a", "b"]`
- `test_does_not_mutate_input`: the list passed to `order_by_date` is unchanged afterward
- `test_empty_list_orders_to_empty`: `order_by_date([])` -> `[]`
- `test_closing_balance_adds_amounts`: opening `Decimal("100")`, amounts `-7.50`, `-900.00`, `2500.00` -> `Decimal("1692.50")`
- `test_closing_balance_of_no_transactions_is_opening`: `closing_balance([], Decimal("100"))` -> `Decimal("100")`
- `test_closing_balance_is_exact_decimal`: opening `Decimal("0")`, amounts `Decimal("0.10")` ten times -> `Decimal("1.00")` (exactly `==`, proving no float path)

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_balance -v`
Expected: FAIL with `No module named 'ledgerlite.balance'`

- [ ] **Step 3: Implement `order_by_date` and `closing_balance` in `ledgerlite/balance.py`**

`sorted(transactions, key=lambda t: t.date)` is stable, which is what gives ties their input order.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_balance -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/balance.py test_balance.py
git commit -m "feat: add date ordering and closing balance"
```

---

### Task 5: `report.py` — totals and formatting

**Files:**
- Create: `ledgerlite/report.py`
- Test: `test_report.py`

**Interfaces:**
- Consumes: `Transaction` (Task 1), `categorize` (Task 3).
- Produces:
  - `format_amount(value: Decimal) -> str`
  - `category_totals(transactions: list[Transaction], rules: list[tuple[str, str]]) -> list[tuple[str, Decimal]]` — display order.
  - `format_report(totals: list[tuple[str, Decimal]], closing: Decimal) -> str` — the full report, **no** trailing newline.

**Pinned decisions:**
- `format_amount` quantizes to `Decimal("0.01")` and formats with `f"{q:f}"`, which never inserts thousands separators. If the quantized value is zero it formats `abs(q)`, so `Decimal("-0.00")` prints `0.00`.
- A category with no transactions is not listed, including `uncategorized`.
- Buckets are keyed by `categorize(...) or "uncategorized"`, so a rule whose category literally is `uncategorized` merges into that one bucket and prints last.
- Alphabetical means `key=lambda name: (name.casefold(), name)`, so `apple` sorts before `Food` (case-insensitive, with the raw name breaking ties for determinism); `uncategorized` is then moved to the end.
- `format_report` emits the blank separator line only when there is at least one category line.

- [ ] **Step 1: Write the failing tests in `test_report.py`**

`format_amount`:
- `test_formats_two_fractional_digits`: `Decimal("-12.5")` -> `"-12.50"`; `Decimal("1200")` -> `"1200.00"`; `Decimal("0")` -> `"0.00"`
- `test_no_thousands_separator`: `Decimal("1234567.8")` -> `"1234567.80"`
- `test_negative_zero_prints_unsigned`: `format_amount(Decimal("-0.00"))` -> `"0.00"` (Review Focus 4)

`category_totals`:
- `test_sums_per_category_alphabetically`: transactions Coffee `-7.50` (rule `coffee=food`), Rent `-900.00` (rule `rent=housing`) -> `[("food", Decimal("-7.50")), ("housing", Decimal("-900.00"))]`
- `test_uncategorized_is_last`: add Salary `2500.00` matching no rule -> `[("food", ...), ("housing", ...), ("uncategorized", Decimal("2500.00"))]`
- `test_uncategorized_omitted_when_empty`: every transaction matches a rule -> no `uncategorized` entry
- `test_no_transactions_is_empty_list`: `category_totals([], rules)` -> `[]`
- `test_rule_named_uncategorized_merges_and_sorts_last`: rules `[("coffee", "uncategorized")]` with a Coffee `-7.50` and an unmatched Salary `2500.00` -> `[("uncategorized", Decimal("2492.50"))]`
- `test_alphabetical_is_case_insensitive`: rules yielding categories `Food` and `apple` -> `[("apple", ...), ("Food", ...)]`
- `test_no_rules_puts_everything_in_uncategorized`: `category_totals([t1, t2], [])` -> `[("uncategorized", t1.amount + t2.amount)]`

`format_report`:
- `test_matches_spec_example`: totals `[("food", Decimal("-7.50")), ("housing", Decimal("-900.00")), ("uncategorized", Decimal("2500.00"))]` and closing `Decimal("1692.50")` -> exactly `"food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50"`
- `test_no_categories_prints_only_closing_balance`: `format_report([], Decimal("100"))` -> `"closing balance: 100.00"`

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_report -v`
Expected: FAIL with `No module named 'ledgerlite.report'`

- [ ] **Step 3: Implement `format_amount`, `category_totals`, and `format_report` in `ledgerlite/report.py`**

Follow the pinned decisions above.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_report -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add ledgerlite/report.py test_report.py
git commit -m "feat: add per-category totals and report formatting"
```

---

### Task 6: `cli.py` — argparse, file I/O, exit codes

**Files:**
- Create: `ledgerlite/cli.py`, `ledgerlite/__main__.py`
- Test: `test_cli.py`

**Interfaces:**
- Consumes: `parse_amount`, `parse_transactions`, `ParseError` (Task 2); `parse_rules` (Task 3); `order_by_date`, `closing_balance` (Task 4); `category_totals`, `format_report` (Task 5).
- Produces: `main(argv: list[str] | None = None) -> int`. `__main__.py` is `raise SystemExit(main())`.

**Pinned decisions:**
- `argparse.ArgumentParser(prog="ledgerlite")` with subcommand `report`, positional `transactions`, options `--rules` (default `None`) and `--opening` (default `"0"`). `--opening` uses `type=` a wrapper that calls `parse_amount` and re-raises `ValueError` as `argparse.ArgumentTypeError(str(e))`, so a bad `--opening` and a missing argument both exit 2 through argparse's own path — `main` raises `SystemExit(2)` for usage errors rather than returning.
- Files are read with `pathlib.Path(path).read_text(encoding="utf-8")`. `OSError` -> reason `e.strerror or str(e)`; `UnicodeDecodeError` -> reason `not valid UTF-8`. Either prints `ledgerlite: cannot read <path>: <reason>` to stderr and returns 1, with `<path>` exactly as given on the command line.
- Order of operations, so failures are predictable: read the transactions file, then the rules file (exit 1 on either, transactions first), then `parse_transactions`, then `parse_rules` (exit 2 on either, transactions first). A `ParseError` prints `ledgerlite: {path}:{e.line}: {e.message}` for the file it came from.
- The report is written with `print(text)`, so stdout ends in exactly one newline. Nothing is written to stdout on any error path.
- Diagnostics go to `sys.stderr`; tests capture with `contextlib.redirect_stdout` / `redirect_stderr` and build input files under `tempfile.TemporaryDirectory()`.

- [ ] **Step 1: Write the failing tests in `test_cli.py`**

Helper: `run(*args)` calls `main(list(args))` inside redirected stdout/stderr and returns `(code, out, err)`.

- `test_spec_example_end_to_end`: transactions `2026-03-06,2500.00,Salary`, `2026-03-04,-7.50,Coffee`, `2026-03-05,-900.00,Rent`; rules `coffee=food` and `rent=housing`; `run("report", tx, "--rules", rules, "--opening", "100")` -> code `0`, stdout exactly the spec's example block (`"food: -7.50\nhousing: -900.00\nuncategorized: 2500.00\n\nclosing balance: 1692.50\n"`), stderr empty
- `test_defaults_no_rules_zero_opening`: same transactions, `run("report", tx)` -> code `0`, stdout `"uncategorized: 1592.50\n\nclosing balance: 1592.50\n"`
- `test_missing_transactions_file`: `run("report", "/no/such/file.csv")` -> code `1`, stdout empty, stderr `"ledgerlite: cannot read /no/such/file.csv: No such file or directory\n"`
- `test_transactions_path_is_a_directory`: pass the temp directory -> code `1`, stderr starts with `"ledgerlite: cannot read "` and contains `"Is a directory"` (Review Focus 2)
- `test_missing_rules_file`: valid transactions, `--rules /no/such/rules.txt` -> code `1`, stdout empty, stderr names the rules path (Review Focus 2)
- `test_non_utf8_transactions_file`: write bytes `b"date,amount,description\n2026-03-04,-7.50,caf\xe9\n"` -> code `1`, stderr `"ledgerlite: cannot read <path>: not valid UTF-8\n"` (Review Focus 5)
- `test_malformed_row_exits_2_with_line`: header plus a valid row plus `2026-03-04,1.005,X` -> code `2`, stdout empty, stderr `"ledgerlite: <path>:3: amount has more than two fractional digits: '1.005'\n"`
- `test_malformed_rules_file_exits_2_with_line`: valid transactions, rules `"coffee=food\nrent\n"` -> code `2`, stdout empty, stderr `"ledgerlite: <rules path>:2: rule line has no '='\n"`
- `test_bad_opening_exits_2`: `main(["report", tx, "--opening", "abc"])` raises `SystemExit` with `.code == 2`
- `test_negative_opening_accepted`: `--opening -50.25` with one transaction of `100.00` -> code `0`, stdout ends `"closing balance: 49.75\n"`
- `test_no_transactions_prints_only_closing_balance`: header-only file, `--opening 100` -> code `0`, stdout `"closing balance: 100.00\n"`

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest test_cli -v`
Expected: FAIL with `No module named 'ledgerlite.cli'`

- [ ] **Step 3: Implement `main` in `ledgerlite/cli.py` and the `ledgerlite/__main__.py` entry point**

Follow the pinned decisions above; keep the module's only logic the argument wiring, the two file reads, and the error formatting — the pipeline is `parse_transactions` → `order_by_date` → `closing_balance` / `category_totals` → `format_report`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest test_cli -v`
Expected: PASS (all tests)

- [ ] **Step 5: Run the whole suite and the real command**

Run: `python3 -m unittest -v`
Expected: PASS, every test from Tasks 1–6, no errors.

Then, from the repo root with a scratch CSV and rules file matching the spec example:
Run: `python3 -m ledgerlite report /tmp/tx.csv --rules /tmp/rules.txt --opening 100`
Expected: the example report on stdout, `echo $?` prints `0`.

- [ ] **Step 6: Commit**

```bash
git add ledgerlite/cli.py ledgerlite/__main__.py test_cli.py
git commit -m "feat: add ledgerlite report command-line interface"
```
