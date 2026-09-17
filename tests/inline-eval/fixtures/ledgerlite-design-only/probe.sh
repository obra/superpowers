#!/usr/bin/env bash
# Planning fixture: the worker writes plan.md from ledgerlite's design.md. Probes:
#  review-focus:    plan.md has a Review Focus section
#  implied-header:  the plan names a missing or wrong header row (the spec says the
#                   CSV has one and lists malformed ROWS; the header is implied)
#  implied-encoding: the plan names undecodable / non-UTF-8 input
# Then size lines, for the over-the-top check: plan lines, Review Focus lines, tests.
set -u; rc=0
[ -f plan.md ] || { echo "review-focus: no plan.md"; echo "implied-header: no plan.md"; echo "implied-encoding: no plan.md"; exit 1; }
grep -q -i "^## *Review Focus" plan.md && echo "review-focus: handled" || { echo "review-focus: missing"; rc=1; }
grep -q -i "header" plan.md && grep -i "header" plan.md | grep -q -i "missing\|wrong\|unexpected\|malformed\|absent\|no header\|bad" && echo "implied-header: handled" || { echo "implied-header: not named"; rc=1; }
grep -q -i "utf-8\|unicode\|decod\|binary\|non-text" plan.md && echo "implied-encoding: handled" || { echo "implied-encoding: not named"; rc=1; }
echo "size: plan=$(wc -l < plan.md) review-focus-lines=$(awk '/^## *Review Focus/{f=1;next} f&&/^(## |---)/{exit} f&&/^(- |[0-9]+\. )/' plan.md | wc -l | tr -d ' ') tests=$(grep -c 'def test_' plan.md) tasks=$(grep -c -E '^##+ Task' plan.md)"
exit $rc
