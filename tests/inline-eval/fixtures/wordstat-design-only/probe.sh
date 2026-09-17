#!/usr/bin/env bash
# Planning fixture: the worker writes plan.md from design.md. Probes:
#  review-focus:  plan.md has a Review Focus section
#  implied-decode: the plan names undecodable / non-UTF-8 input somewhere
#  decode-test:   a test in the plan exercises it (a test name or bytes literal near the mention)
set -u; rc=0
[ -f plan.md ] || { echo "review-focus: no plan.md"; echo "implied-decode: no plan.md"; echo "decode-test: no plan.md"; exit 1; }
grep -q -i "^## *Review Focus" plan.md && echo "review-focus: handled" || { echo "review-focus: missing"; rc=1; }
grep -q -i "utf-8\|unicode\|decod\|binary\|non-text" plan.md && echo "implied-decode: handled" || { echo "implied-decode: not named"; rc=1; }
grep -i -B2 -A12 "def test_[a-z_]*\(utf\|unicode\|decod\|binary\|bytes\|encoding\)" plan.md | grep -q "def test_" && echo "decode-test: handled" || { echo "decode-test: no test"; rc=1; }
exit $rc
