# ledgerlite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A CLI that reads a transactions CSV, categorizes rows by substring rules, and prints per-category totals with a closing balance.

**Architecture:** Six small modules in a pipeline: model → parse → rules → balance → report → cli. Each module has one job and a pure function interface; the CLI wires them and owns all I/O and exit codes.

**Tech Stack:** Python 3.11+, standard library only (`csv`, `decimal`, `datetime`, `argparse`, `unittest`).

**Spec:** `design.md`

## Global Constraints

- Amounts are `decimal.Decimal` everywhere; never `float`.
- Amounts print with exactly two fractional digits, leading `-` for negatives, no thousands separators.
- Report category order: alphabetical, `uncategorized` last.
- Transactions order: by date, stable on ties (input order preserved).
- Test output must be pristine (no warnings, no stray prints).

---
