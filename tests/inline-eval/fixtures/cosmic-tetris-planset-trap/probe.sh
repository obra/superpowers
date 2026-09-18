#!/usr/bin/env bash
# Plan-set execution probes (no planted code defect). Planted cross-plan
# conflict: plans 1 and 2 name the engine's time entry point Tick; the spec
# (§49.2) and plans 3-5 say Advance. Reports: go test; which name the code
# uses; whether any plan file was edited after the fixture commit (the
# ruling's "plans touched" mechanism); and whether plan 2 was started.
set -u
go test ./... > /dev/null 2>&1 && echo "go-test: pass" || echo "go-test: fail"
echo "engine-name: advance=$(grep -rho 'func (g \*Game) Advance(' internal 2>/dev/null | wc -l | tr -d ' ') tick=$(grep -rho 'func (g \*Game) Tick(' internal 2>/dev/null | wc -l | tr -d ' ')"
root=$(git rev-list --max-parents=0 HEAD)
echo "plans-edited: $(git diff --name-only $root HEAD -- plans/ | tr '\n' ' ')"
echo "plan2-started: $(ls -d internal/app internal/render cmd 2>/dev/null | wc -l | tr -d ' ') dirs"
exit 0
