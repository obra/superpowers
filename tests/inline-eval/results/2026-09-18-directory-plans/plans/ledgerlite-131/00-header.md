# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `ledgerlite`, a stdlib-only CLI that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small modules with one responsibility each, wired by `cli.py`: parsing (CSV text → `Transaction` list, or `ParseError`), rules (rules text → `(substring, category)` list, plus `categorize`), balance (date ordering and closing balance), report (per-category totals and text formatting). Every module is pure — it takes and returns values, never touches the filesystem or `sys.stdout`. All file reading, error message formatting, and exit codes live in `cli.py`, which is what makes the pure modules directly unit-testable.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `dataclasses`, `pathlib`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies, no packaging metadata.
- Money is always `decimal.Decimal`, never `float`. No test or implementation line may construct a `Decimal` from a `float`.
- Package lives at `ledgerlite/`; tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Amounts are printed with exactly two fractional digits, a leading `-` for negatives, and no thousands separators: `-12.50`, `0.00`, `1200.00`.
- Every stderr message starts with `ledgerlite: `.
- Exit codes: `0` success, `1` a file could not be read, `2` a file's contents are malformed (and nothing is written to stdout).
- Rules matching is case-insensitive on the description; the first matching rule wins.

## Review Focus

Input classes the spec implies but does not spell out. Each line's test is added to the task named.

1. **An empty transactions file, and a header-only file with no data rows.** Header-only is legal and must report a closing balance equal to the opening amount with no category lines; a zero-byte file has no header and is malformed. (Tasks 1, 3, 4)
2. **Date strings that `datetime.date.fromisoformat` accepts on 3.11+ but the spec does not**, e.g. `20260304`. The spec says `2026-03-04`; anything else is a malformed row, not a silently accepted date. (Task 1)
3. **`NaN` and `Infinity` amounts.** `Decimal("NaN")` constructs successfully and would poison every total; both must be rejected as "not a decimal number". (Task 1)
4. **A malformed `--opening` value** such as `abc` or `1.005`. It must be rejected with a usage error and exit 2, not a traceback, and it must obey the same two-fractional-digit rule as row amounts. (Task 5)
5. **A rules file that is unreadable, or that has a line with no `=`.** The spec defines no error path for the rules file; this plan treats an unreadable rules file exactly like an unreadable transactions file (exit 1) and a line with no `=`, an empty substring, or an empty category as malformed content (exit 2), because silently ignoring a mistyped rule would make every transaction uncategorized with no feedback. Blank and whitespace-only rule lines are ignored. (Tasks 2, 5)

## Plan Set

None — this is the only plan.

---
