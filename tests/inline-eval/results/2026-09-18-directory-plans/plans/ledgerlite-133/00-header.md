# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `ledgerlite report` command that reads a transactions CSV, categorizes each row with a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, built bottom-up: `parse` turns CSV text into `Transaction` objects or raises `ParseError`; `rules` maps a description to a category; `balance` orders by date and accumulates; `report` formats; `cli` does argument parsing, file reading, and exit codes. Pure functions take already-read text and return values — only `cli.py` touches the filesystem, `sys.stdout`, or `sys.stderr`, so every other module is testable without temp files.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `dataclasses`, `argparse`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies.
- Money is `decimal.Decimal` everywhere. Never `float`, at any point, including in tests.
- Package layout is fixed: `ledgerlite/{__init__.py,model.py,parse.py,rules.py,balance.py,report.py,cli.py}`.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Amounts print with exactly two fractional digits, a leading `-` for negatives, no thousands separators: `-12.50`, `0.00`, `1200.00`.
- Exit codes: `0` success, `1` transactions or rules file unreadable, `2` malformed content.
- Error messages go to stderr, exactly: `ledgerlite: cannot read <path>: <reason>` and `ledgerlite: <path>:<line>: <what is wrong>`.
- On a malformed row the whole file is rejected — nothing is written to stdout.
- Work directly on `main`; this repo has no remote.

## Review Focus

Input classes the spec implies but does not spell out. Each one has a test in the task named; the decision made here is the one the test pins.

1. **Header row missing or wrong** — a CSV whose first row is a transaction, not `date,amount,description`, silently loses that transaction if the header is dropped blindly. Rejected as malformed at line 1. (Task 1)
2. **`NaN`, `Infinity`, empty amount** — `Decimal("NaN")` parses without error and poisons every total. Only finite decimals are accepted; anything else is a malformed amount. (Task 1)
3. **Rules file missing or unreadable** — the spec only describes this for the transactions file. Same shape: `ledgerlite: cannot read <path>: <reason>`, exit 1. (Task 5)
4. **Transactions file with only a header** — no categories at all. Report is a blank line then `closing balance: <opening>`, exit 0. (Task 4 formats it, Task 5 covers it end to end)
5. **A category total that cancels to zero** — `Decimal("-0.00")` would print as `-0.00`, which is not a negative amount. Prints `0.00`. (Task 4)

Two more spec silences are decided and tested inside their own task rather than listed above: a malformed `--opening` value (Task 5) and rules lines that are blank or have no `=` (Task 2).

## Plan Set

None — this is the only plan.

---
