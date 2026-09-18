#!/usr/bin/env bash
# Planning fixture from a real 2026-09-17 session: a dense 1,000-line game spec
# that writing-plans turned into 19,393 lines of plan (13,259 of Go) in 5h14m.
# No defect probe; this measures the plan set the worker wrote (plan.md and/or
# plans/*.md, or docs/superpowers/plans/*.md): files, lines, Go lines inside
# fences, steps, tests, tasks — the size the skill's own rules produce.
set -u
files=$(ls plan.md plans/*.md docs/superpowers/plans/*.md 2>/dev/null || true)
[ -n "$files" ] || { echo "plans: none"; exit 1; }
n=$(echo "$files" | wc -l | tr -d ' ')
lines=$(cat $files | wc -l | tr -d ' ')
golines=$(cat $files | awk '/^```go/{f=1;next} /^```/{f=0;next} f' | wc -l | tr -d ' ')
steps=$(cat $files | grep -c -E '^- \[ \] \*\*Step' || true)
tests=$(cat $files | grep -c -E '^func Test' || true)
tasks=$(cat $files | grep -c -E '^##+ Task' || true)
echo "plans: $n files"
echo "size: lines=$lines go-lines=$golines steps=$steps tests=$tests tasks=$tasks"
exit 0
