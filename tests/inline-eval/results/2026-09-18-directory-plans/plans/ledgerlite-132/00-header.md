# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `ledgerlite` command-line tool that reads a transactions CSV, categorizes each row from a rules file, and prints per-category totals plus the closing balance.

**Architecture:** Six small stdlib-only modules, each a pure function layer over the one below: `parse` turns CSV text into `Transaction` values (raising `ParseError` with a line number), `rules` turns rules text into substring/category pairs, `balance` and `report` compute and format from those values, and `cli` is the only layer that touches the filesystem, `sys.argv`, streams, and exit codes. Because parsing takes text rather than a path, file-read failures (exit 1) and malformed rows (exit 2) stay cleanly separated.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `dataclasses`, `argparse`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Python 3.11+. Standard library only — no third-party dependencies.
- Money is `decimal.Decimal` everywhere, never `float`.
- Package layout is fixed by the spec: `ledgerlite/{__init__,model,parse,rules,balance,report,cli}.py`. This plan adds one file the spec does not list, `ledgerlite/__main__.py`, so the tool can be run as `python3 -m ledgerlite`.
- Tests live at the repo root as `test_<module>.py` and run with `python3 -m unittest`.
- Amounts are printed with exactly two fractional digits, a leading `-` for negatives, and no thousands separators (`-12.50`, `0.00`, `1200.00`).
- Error messages are exactly: `ledgerlite: cannot read <path>: <reason>` (exit 1) and `ledgerlite: <path>:<line>: <what is wrong>` (exit 2). Both go to stderr, and on either, stdout stays empty.

## Review Focus

1. `--opening` that is not a valid two-decimal number (`abc`, `1.005`) — rejected as a usage error on stderr with a nonzero exit, nothing on stdout. Test in Task 5.
2. A `--rules` path that cannot be read — same `ledgerlite: cannot read <path>: <reason>` treatment and exit 1 as an unreadable transactions file, not a traceback. Test in Task 5.
3. Rules lines that are not `<substring>=<category>` — blank lines, a line with no `=`, a substring that itself contains `=` (split at the first `=`), surrounding whitespace. Test in Task 2.
4. Amount strings `Decimal` accepts but money cannot be (`nan`, `Infinity`, `-Infinity`) — malformed rows, exit 2, not silent garbage in the totals. Test in Task 1.
5. Negative zero — an input amount of `-0.00`, or a category whose amounts net to zero, prints `0.00`, never `-0.00`. Test in Task 4.

## Plan Set

None — this is the only plan for this spec.

---
