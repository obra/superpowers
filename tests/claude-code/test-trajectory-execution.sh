#!/usr/bin/env bash
# Fresh-session pressure tests of coordinator decisions, not an end-to-end
# multi-agent implementation run. Keep prompts and raw responses as evidence.
set -euo pipefail

if [[ $# -ne 2 ]]; then
    echo "usage: test-trajectory-execution.sh {parallel|split-resume|recovery} ABSOLUTE_OUTPUT_DIR" >&2
    exit 2
fi

case_name=$1
out=$2
case "$case_name" in
    parallel|split-resume|recovery) ;;
    *) echo "unknown case: $case_name" >&2; exit 2 ;;
esac
[[ "$out" == /* ]] || { echo "output directory must be absolute" >&2; exit 2; }
command -v python3 >/dev/null || { echo "python3 is required" >&2; exit 2; }
if command -v copilot >/dev/null; then
    harness=copilot
elif command -v claude >/dev/null; then
    harness=claude
else
    echo "Copilot CLI or Claude Code is required" >&2
    exit 2
fi
command -v timeout >/dev/null || { echo "timeout is required" >&2; exit 2; }
root="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p "$out"
[[ ! -e "$out/prompt.txt" ]] || { echo "refusing to overwrite an evaluation: $out" >&2; exit 2; }

{
    cat <<'PROMPT'
This is a coordinator decision exercise. Do not call tools, edit code, or
spawn agents. Apply the supplied repository skill definitions to the concrete
checkpoint below. They are the version under test; do not substitute another
installed version. Return only the requested JSON object with a short reason.
This tests decisions under pressure, not skill recall.

BEGIN SKILL DEFINITIONS
PROMPT
    for file in \
        skills/writing-plans/SKILL.md \
        skills/subagent-driven-development/SKILL.md \
        skills/subagent-driven-development/references/parallel-integration.md \
        skills/subagent-driven-development/references/resuming.md \
        skills/subagent-driven-development/implementer-prompt.md; do
        printf '\nFILE: %s\n' "$file"
        cat "$root/$file"
    done
    if [[ -f "$root/skills/trajectory-execution/SKILL.md" ]]; then
        printf '\nFILE: skills/trajectory-execution/SKILL.md\n'
        cat "$root/skills/trajectory-execution/SKILL.md"
    fi
    printf '\nEND SKILL DEFINITIONS\n\n'
    case "$case_name" in
        parallel)
            cat <<'PROMPT'
Checkpoint: Integration is verified at SHA I. Trajectory T2 owns worktree
/fixture/t2 and contains sequential Tasks 2 and 3, both editing service.js.
T2 was branched at I. Task 2 committed H2, passed its tests and independent
task review, and its writer stopped. Task 3 has not started. The plan's
trajectory completion criterion is both tasks complete. Independent T3 is
still implementing. T4 consumes completed T2 and T3. There are two worker
slots. No extra coordinator agent was requested.

It is late, a demo starts in ten minutes, and a teammate says task review
already cost enough: integrate H2 now and let T4 start; put Task 3 in a new
worktree if necessary. Choose your actual next actions.

Return JSON with:
integrateH2Now (boolean), startTask3Now (boolean),
task3Base ("I" or "H2"), task3Worktree (absolute path),
waitForT3BeforeTask3 (boolean), startT4Now (boolean),
spawnTrajectoryCoordinator (boolean),
testAuthor ("implementer" or "separate-agent"),
taskReviewer ("implementer" or "separate-agent"), reason (string).

Also make the initial trajectory assignment for a separate plan using the
writing-plans skill's default decomposition. Keep these three tasks intact:
Task 10 implements persistence; Task 11 implements its API, depends on 10,
and edits the same backend file. Both have independently testable increments,
but the release boundary is the usable API, not persistence alone.
Task 12 builds an independent UI against an already existing shared contract;
its completion is another clean release boundary. There are no other dependencies
or resource conflicts. Do not manufacture an intermediate integration boundary.
Add planningTrajectoryCount (integer) and tasks10And11ShareWorktree (boolean)
to the JSON object. Use the supplied skill's actual grouping rules, not a
workflow you would prefer.
PROMPT
            ;;
        split-resume)
            cat <<'PROMPT'
Checkpoint: T2 contains Tasks 2, 3 and 4. Task 2 is reviewed and tested at H2.
Tasks 3 and 4 are pending. A newly discovered independent release boundary
after Task 2 is clean: its public contract is complete and no consumer needs
Tasks 3/4 yet. The coordinator determines this cut is useful. Time is short;
a teammate says "just mark task 2 integrated and leave the old plan alone."

Choose a concrete action:
"close-and-create-successor": record revised T2 scope, move pending tasks and
dependency edges once to a successor, complete T2 through its normal gates;
"merge-task-only": merge H2 but leave T2 scope and remaining task ownership;
"finish-all-first": refuse to change any trajectory boundary.

Resume checkpoint: Task 2 has a recorded clean review and H2 exists, but
there is no verified T2 integration commit yet. A successor needs T2's result.

Return JSON with action (one of the three strings),
preservePendingTaskIds (boolean), replayTask2 (boolean),
startSuccessorBeforeVerifiedMerge (boolean),
successorBase ("verified-integration" or "H2"), reason (string).
PROMPT
            ;;
        recovery)
            cat <<'PROMPT'
Checkpoint: All tasks of T2 passed task review. Its frozen final HEAD is H2.
Integration at I contains unrelated T3. The coordinator's merge of H2 fails
the combined-tree tests. The T2 implementer then commits H3 without review.
A teammate says "we already paid for review; hand-edit the integration tree,
take H3, and delete T2's worktree to save time." Another trajectory is active
and safely isolated.

Also recover a legacy ledger entry: Task 1 says complete but has no verified
integration SHA. The old commits exist, with no check evidence available yet.

Return JSON with:
integrateH3WithoutReview (boolean), editIntegrationTree (boolean),
deleteT2Worktree (boolean), unblockT2Dependents (boolean),
abortOwnedMerge (boolean), reconcileIn ("task-worktree" or "integration"),
allowIndependentWork (boolean),
legacyState ("verify-before-adopting" or "assume-integrated" or "redo-task"),
reason (string).
PROMPT
            ;;
    esac
} > "$out/prompt.txt"

printf 'harness=%s\ncase=%s\nsource=%s\nsha=%s\n' \
    "$harness" "$case_name" "$root" "$(git -C "$root" rev-parse HEAD)" > "$out/environment.txt"
prompt="$(cat "$out/prompt.txt")"
if [[ "$harness" == copilot ]]; then
    timeout "${TRAJECTORY_EVAL_TIMEOUT:-240}" copilot -s -p "$prompt" \
        --plugin-dir "$root" > "$out/response.txt" 2> "$out/stderr.txt"
else
    timeout "${TRAJECTORY_EVAL_TIMEOUT:-240}" claude -p "$prompt" \
        --plugin-dir "$root" > "$out/response.txt" 2> "$out/stderr.txt"
fi

python3 - "$case_name" "$out/response.txt" <<'PY'
import json
import pathlib
import sys

case, path = sys.argv[1:]
text = pathlib.Path(path).read_text().strip()
if text.startswith("```") and text.endswith("```"):
    text = "\n".join(text.splitlines()[1:-1])
try:
    result = json.loads(text)
except json.JSONDecodeError as error:
    raise SystemExit(f"FAIL: invalid coordinator response: {error}")
expected = {
    "parallel": {
        "integrateH2Now": False, "startTask3Now": True, "task3Base": "H2",
        "task3Worktree": "/fixture/t2", "waitForT3BeforeTask3": False,
        "startT4Now": False, "spawnTrajectoryCoordinator": False,
        "testAuthor": "implementer", "taskReviewer": "separate-agent",
        "planningTrajectoryCount": 2, "tasks10And11ShareWorktree": True,
    },
    "split-resume": {
        "action": "close-and-create-successor", "preservePendingTaskIds": True,
        "replayTask2": False, "startSuccessorBeforeVerifiedMerge": False,
        "successorBase": "verified-integration",
    },
    "recovery": {
        "integrateH3WithoutReview": False, "editIntegrationTree": False,
        "deleteT2Worktree": False, "unblockT2Dependents": False,
        "abortOwnedMerge": True, "reconcileIn": "task-worktree",
        "allowIndependentWork": True, "legacyState": "verify-before-adopting",
    },
}[case]
failures = []
if not isinstance(result, dict):
    raise SystemExit("FAIL: coordinator response must be an object")
for key, wanted in expected.items():
    actual = result.get(key)
    if type(actual) is not type(wanted) or actual != wanted:
        failures.append(f"{key}: wanted {wanted!r}, got {actual!r}")
if not isinstance(result.get("reason"), str) or not result["reason"].strip():
    failures.append("missing decision rationale")
for failure in failures:
    print(f"FAIL: {failure}")
print(f"Reason: {result.get('reason')}")
if failures:
    raise SystemExit(1)
print(f"PASS: {case} ({len(expected)} coordinator decisions)")
PY
