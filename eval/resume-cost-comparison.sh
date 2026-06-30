#!/usr/bin/env bash
# Evaluation harness: compare the cost of resuming an interrupted plan WITH
# vs WITHOUT a task graph. Measures how much input an agent must read to
# reconstruct "what is done, what is next" after an interruption.
#
# This is the evidence for the executing-plans task-graph PR. It does not
# measure tokens directly (that needs a live model) but measures INPUT BYTES
# and LINES the agent must consume to decide where to resume — a reliable
# proxy, since every byte must enter context before a decision is made.
#
# Scenario: an 8-task plan was interrupted while Task 4 was in progress.
# Tasks 1-3 are committed (done), Task 4 is half-done (uncommitted work),
# Tasks 5-8 are pending. A fresh session must resume.
#
# Run:  bash eval/resume-cost-comparison.sh
#       (from repo root; requires jq)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

echo "=== Resume-cost comparison: interrupted at Task 4 of 8 ==="
echo

# --- shared fixtures --------------------------------------------------------
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT

# A realistic 8-task plan following writing-plans bite-sized conventions.
# Each task spells out Files, bite-sized Steps (2-5 min each), and Acceptance.
plan="$fixture/plan.md"
cat >"$plan" <<'PLAN'
# Export to CSV Implementation Plan

## Context
Users can filter and page query results in the UI but cannot export them.
This adds CSV export end-to-end: a serializer, a service hook, an HTTP route,
streaming for large sets, and the UI button + progress.

## File Structure
- src/serializers/csv.ts — pure CSV serialization, no I/O
- src/services/query.ts — query execution, now format-aware
- src/routes/export.ts — HTTP route, streaming response
- src/ui/ExportButton.tsx — UI trigger + loading state
- src/ui/DownloadProgress.tsx — progress bar + error toast

## Global Constraints
- TDD: every task ends green.
- One commit per task; commit message references the task id.
- No new dependencies; use the existing stream primitives.

## Task 1: Add CSV serializer + failing tests
### Files
- src/serializers/csv.ts
- test/serializers/csv.test.ts
### Steps
1. Write failing test: empty input -> empty string
2. Write failing test: single row -> "a,b,c\n"
3. Write failing test: quoted field with comma -> quoted-escaped
4. Write failing test: quoted field with newline -> quoted-escaped
5. Write failing test: null -> empty field
6. Implement serialize(rows) in csv.ts
7. Run tests, confirm green
8. Commit "T1: CSV serializer"
### Acceptance
serialize() handles empty, single-row, special-char (comma/quote/newline), and null cases per RFC 4180.

## Task 2: Wire serializer into query service
### Files
- src/services/query.ts
- test/services/query.test.ts
### Steps
1. Write failing test: query({format:'csv'}) returns CSV string
2. Write failing test: query({format:'json'}) still returns JSON (regression)
3. Add format param to query(), default 'json'
4. Branch on format; call serialize() for 'csv'
5. Run tests, confirm green
6. Commit "T2: query service format-aware"
### Acceptance
query() accepts {format:'csv'|'json'}; csv path delegates to the serializer; json path unchanged.

## Task 3: Expose GET /export.csv endpoint
### Files
- src/routes/export.ts
- test/routes/export.test.ts
### Steps
1. Write failing test: GET /export.csv?query=foo returns text/csv
2. Write failing test: missing query param -> 400
3. Wire route to query({format:'csv'})
4. Set Content-Type and Content-Disposition headers
5. Run tests, confirm green
6. Commit "T3: export route"
### Acceptance
GET /export.csv?query=X returns text/csv with proper headers; bad input -> 400.

## Task 4: Streaming response for large result sets
### Files
- src/routes/export.ts
- src/services/query.ts
- test/routes/export.streaming.test.ts
### Steps
1. Write failing test: 50k rows does not buffer whole result (assert streamed chunks)
2. Convert query() to return an async iterator for csv format
3. Pipe iterator to the response in the route
4. Add backpressure handling (pause/resume on drain)
5. Run tests, confirm green
6. Commit "T4: streaming export"
### Acceptance
Exports >10k rows stream chunk-by-chunk; memory stays flat regardless of result size.

## Task 5: Export button + loading state in the UI
### Files
- src/ui/ExportButton.tsx
- src/ui/ExportButton.test.tsx
### Steps
1. Write failing test: clicking button triggers export request
2. Write failing test: button shows spinner while request in flight
3. Implement ExportButton with loading state
4. Run tests, confirm green
5. Commit "T5: export button"
### Acceptance
ExportButton triggers the export and shows a loading state until completion.

## Task 6: Download progress + error toast
### Files
- src/ui/DownloadProgress.tsx
- src/ui/ExportButton.tsx
- src/ui/DownloadProgress.test.tsx
### Steps
1. Write failing test: progress bar advances on download progress events
2. Write failing test: network error -> error toast with retry
3. Implement DownloadProgress
4. Wire into ExportButton
5. Run tests, confirm green
6. Commit "T6: download progress"
### Acceptance
Download shows a progress bar; failures show a toast with a retry action.

## Task 7: Integration test: full export round-trip
### Files
- test/integration/export.e2e.test.ts
### Steps
1. Write failing test: filter -> export -> CSV content matches filtered query
2. Write failing test: large export completes without OOM
3. Run tests, confirm green
4. Commit "T7: export integration test"
### Acceptance
End-to-end export matches the filtered query; large export completes within memory budget.

## Task 8: Docs: add export section to the user guide
### Files
- docs/user-guide/export.md
### Steps
1. Draft the export section with screenshots
2. Review with partner
3. Commit "T8: export docs"
### Acceptance
User guide documents how to export filtered results to CSV.
PLAN

# The task graph for the SAME plan, interrupted at Task 4
graph="$fixture/export.tasks.json"
cat >"$graph" <<'GRAPH'
{
  "version": 1,
  "metadata": {
    "featureId": "export-to-csv",
    "title": "Export query results to CSV",
    "planPath": "docs/superpowers/plans/export-to-csv.md",
    "createdAt": "2026-06-29",
    "updatedAt": "2026-06-29"
  },
  "tasks": [
    { "id": "T1", "title": "Add CSV serializer + failing tests", "status": "done", "dependencies": [] },
    { "id": "T2", "title": "Wire serializer into query service", "status": "done", "dependencies": ["T1"] },
    { "id": "T3", "title": "Expose GET /export.csv endpoint", "status": "done", "dependencies": ["T2"] },
    { "id": "T4", "title": "Streaming response for large result sets", "status": "in_progress", "dependencies": ["T3"] },
    { "id": "T5", "title": "Export button + loading state in the UI", "status": "pending", "dependencies": [] },
    { "id": "T6", "title": "Download progress + error toast", "status": "pending", "dependencies": ["T5", "T3"] },
    { "id": "T7", "title": "Integration test: full export round-trip", "status": "pending", "dependencies": ["T4", "T6"] },
    { "id": "T8", "title": "Docs: add export section to the user guide", "status": "pending", "dependencies": ["T6"] }
  ]
}
GRAPH

bytes() { wc -c <"$1" | tr -d ' '; }
lines() { wc -l <"$1" | tr -d ' '; }

echo "--- Fixture sizes (8-task plan, interrupted at Task 4) ---"
printf "  plan.md:            %6s bytes, %4s lines\n" "$(bytes "$plan")" "$(lines "$plan")"
printf "  export.tasks.json:  %6s bytes, %4s lines\n" "$(bytes "$graph")" "$(lines "$graph")"
echo

# --- RED: resume WITHOUT a task graph --------------------------------------
# The agent must: read the WHOLE plan (to know all tasks), then run git log
# and cross-reference commits against tasks to infer which are done.
echo "=== RED — resume WITHOUT a task graph ==="
echo "To answer 'what is done, what is next', the agent must:"
echo "  1. Read the ENTIRE plan (only way to know the task list)"
echo "  2. Run 'git log' to see committed work"
echo "  3. Cross-reference each commit to a task (commit msg -> task id)"
echo "  4. Reconcile: which task is the in-flight one (uncommitted work)?"
red_bytes=$(bytes "$plan")
red_lines=$(lines "$plan")
printf "  input read to reconstruct state: %s bytes, %s lines (plan only)\n" "$red_bytes" "$red_lines"
echo "  + git log output (~20 commits for an 8-task plan, ~1-2 KB)"
echo "  + a reasoning pass mapping commits -> tasks"
echo "  accuracy: inferred. Degrades when commits are not 1:1 with tasks"
echo "            (a task often spans 2 commits; a commit sometimes touches 2 tasks)."
echo "  failure mode: re-dispatching a task that was already committed, or"
echo "                skipping the half-done in-flight task."
echo

# --- GREEN: resume WITH a task graph ---------------------------------------
echo "=== GREEN — resume WITH a task graph ==="
echo "To answer 'what is done, what is next', the agent:"
echo "  1. Reads the task graph"
echo "  2. Runs 'scripts/task-graph ready'"
green_bytes=$(bytes "$graph")
green_lines=$(lines "$graph")
printf "  input read to reconstruct state: %s bytes, %s lines (graph only)\n" "$green_bytes" "$green_lines"
echo "  status snapshot (explicit, no inference):"
jq -r '.tasks[] | "    \(.id)  \(.status)  \(.title)"' "$graph"
echo -n "  ready to start now: "
bash skills/executing-plans/scripts/task-graph ready "$graph" | cut -f1 | paste -sd', ' -
echo "  accuracy: exact — status is an explicit field."
echo

# --- summary ---------------------------------------------------------------
echo "=== Summary ==="
ratio_bytes=$(awk "BEGIN{printf \"%.1f\", $red_bytes/$green_bytes}")
ratio_lines=$(awk "BEGIN{printf \"%.1f\", $red_lines/$green_lines}")
printf "  input bytes: %s -> %s  (%sx less)\n" "$red_bytes" "$green_bytes" "$ratio_bytes"
printf "  input lines: %s -> %s  (%sx less)\n" "$red_lines" "$green_lines" "$ratio_lines"
echo "  accuracy:    inferred -> exact"
echo "  reasoning:   plan + git-log + reconcile -> read-graph + ready"
echo
echo "Note: bytes/lines are a proxy for tokens (every byte enters context"
echo "before a resume decision). The accuracy gap is the larger win: with no"
echo "graph, the agent GUESSES task boundaries from commits and can silently"
echo "re-do or skip work; with a graph, 'done' is an explicit field."
