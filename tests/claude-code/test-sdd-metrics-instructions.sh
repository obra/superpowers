#!/usr/bin/env bash
set -euo pipefail

skill_file='skills/subagent-driven-development/SKILL.md'
reference_file='skills/subagent-driven-development/metrics-events.md'
ignore_script='skills/subagent-driven-development/scripts/ensure-metrics-ignore'

grep -q 'metrics-events.md' "$skill_file"
grep -q 'Metrics run: <run-id>' "$skill_file"
grep -q 'run_started' "$reference_file"
grep -q 'task_implementation_review_result' "$reference_file"
grep -q 'task_quality_review_result' "$reference_file"
grep -q 'final_review_result' "$reference_file"
grep -q '## Operational boundary matrix' "$reference_file"
grep -q 'Controller only writes metrics' "$reference_file"
grep -q 'Never include prompts, source, diffs, secrets, command output' "$reference_file"
grep -q 'For definite append failure before any bytes' "$reference_file"
grep -q 'For uncertain write: inspect physical tail' "$reference_file"
grep -q 'node <plugin-root>/bin/superpowers.mjs metrics <plan-path>' "$reference_file"
grep -q 'Retain workspace, hand plan path and active run identity to finishing' "$reference_file"
grep -q 'ensure-metrics-ignore' "$reference_file"
grep -q 'continue SDD/event recording' "$reference_file"
grep -q 'if ! <path-to-this-skill>/scripts/ensure-metrics-ignore; then' "$reference_file"
grep -q 'shared across linked worktrees; this shared scope' "$reference_file"
grep -q 'task_count.*at least 1' "$reference_file"
grep -q 'git-blob:<40 or 64 lowercase hex>' "$reference_file"
grep -q 'plan_fingerprint.*previous_fingerprint' "$reference_file"
grep -q 'accepted revision becomes.*new_fingerprint' "$reference_file"
! grep -q 'git-blob:<40 lowercase hex>' "$reference_file"
grep -q 'git rev-parse --git-path info/exclude' "$ignore_script"
grep -q "probe='.superpowers/metrics/.ignore-probe'" "$ignore_script"
grep -q 'git check-ignore -q -- "$probe"' "$ignore_script"
grep -q '/.superpowers/metrics/' "$ignore_script"
grep -q 'git rev-parse --show-toplevel' "$ignore_script"
! grep -q 'Delete this plan.s workspace' "$skill_file"

finishing_file='skills/finishing-a-development-branch/SKILL.md'

grep -q 'active SDD metrics run' "$finishing_file"
grep -q 'final_test_result' "$finishing_file"
grep -q 'run_passed' "$finishing_file"
grep -q -- '--write --json' "$finishing_file"
grep -q 'git status --porcelain -- "<report>"' "$finishing_file"
grep -q 'git add -- "<report>"' "$finishing_file"
grep -q 'git commit --only' "$finishing_file"
grep -q 'SDD workspace removal' "$finishing_file"
grep -q 'run_blocked' "$finishing_file"
grep -q 'report uncommitted' "$finishing_file"
grep -qi 'preserve the SDD workspace' "$finishing_file"

line_number() {
  grep -n -m 1 -F -- "$1" "$finishing_file" | cut -d: -f1
}

final_test_result_line=$(line_number 'final_test_result')
run_passed_line=$(line_number 'run_passed')
report_write_line=$(line_number '--write --json')
report_stage_line=$(line_number 'git add -- "<report>"')
report_commit_line=$(line_number 'git commit --only')
workspace_removal_line=$(line_number 'SDD workspace removal')
present_options_line=$(line_number 'Present Options')

(( final_test_result_line < run_passed_line ))
(( run_passed_line < report_write_line ))
(( report_write_line < report_stage_line ))
(( report_stage_line < report_commit_line ))
(( report_commit_line < workspace_removal_line ))
(( workspace_removal_line < present_options_line ))

step1_start=$(grep -n -m 1 -F -- '## Step 1: Verify Tests' "$finishing_file" | cut -d: -f1)
step1_end=$(grep -n -m 1 -F -- '## Step 1a: Finalize an active SDD metrics run' "$finishing_file" | cut -d: -f1)

require_step1_marker() {
  local marker
  marker=$1
  awk -v start="$step1_start" -v end="$step1_end" -v marker="$marker" 'NR > start && NR < end && index($0, marker) { found = 1 } END { exit found ? 0 : 1 }' "$finishing_file"
}

require_step1_marker 'For an active SDD metrics run, continue to Step 1a after the full test command.'
require_step1_marker 'Only routine non-SDD finishing with passing tests may continue directly to Step 2.'

branch_start() {
  grep -n -m 1 -F -- "### Terminal branch: $1" "$finishing_file" | cut -d: -f1
}

branch_end() {
  awk -v start="$1" 'NR > start && /^### Terminal branch:/ { found = 1; print NR; exit } END { if (!found) print NR + 1 }' "$finishing_file"
}

branch_line() {
  awk -v start="$1" -v end="$2" -v marker="$3" 'NR > start && NR < end && index($0, marker) { print NR; exit }' "$finishing_file"
}

require_branch_marker() {
  local start end line
  start=$(branch_start "$1")
  end=$(branch_end "$start")
  line=$(branch_line "$start" "$end" "$2")
  [[ -n "$line" ]]
}

require_branch_marker 'final tests FAIL' 'final_test_result'
require_branch_marker 'final tests FAIL' 'run_blocked'
require_branch_marker 'final tests FAIL' 'report uncommitted'
require_branch_marker 'final tests FAIL' 'Preserve the SDD workspace'
require_branch_marker 'final tests FAIL' 'do not show the integration menu'

require_branch_marker 'final tests UNKNOWN' 'final_test_result'
require_branch_marker 'final tests UNKNOWN' 'run_incomplete'
require_branch_marker 'final tests UNKNOWN' 'report uncommitted'
require_branch_marker 'final tests UNKNOWN' 'Preserve the SDD workspace'
require_branch_marker 'final tests UNKNOWN' 'do not show the integration menu'

require_branch_marker 'final tests PASS, final review FAIL' 'run_blocked'
require_branch_marker 'final tests PASS, final review FAIL' 'final_test_result'
require_branch_marker 'final tests PASS, final review FAIL' 'final_review_result'
require_branch_marker 'final tests PASS, final review FAIL' 'report uncommitted'
require_branch_marker 'final tests PASS, final review FAIL' 'Preserve the SDD workspace'
require_branch_marker 'final tests PASS, final review FAIL' 'do not show the integration menu'

require_branch_marker 'final tests PASS, final review NOT_RUN' 'run_incomplete'
require_branch_marker 'final tests PASS, final review NOT_RUN' 'final_test_result'
require_branch_marker 'final tests PASS, final review NOT_RUN' 'report uncommitted'
require_branch_marker 'final tests PASS, final review NOT_RUN' 'Preserve the SDD workspace'
require_branch_marker 'final tests PASS, final review NOT_RUN' 'do not show the integration menu'

require_branch_marker 'final tests PASS, final review PASS' 'run_passed'
require_branch_marker 'final tests PASS, final review PASS' 'final_test_result'
require_branch_marker 'final tests PASS, final review PASS' 'final_review_result'
require_branch_marker 'final tests PASS, final review PASS' '--write --json'
require_branch_marker 'final tests PASS, final review PASS' 'git status --porcelain -- "<report>"'
require_branch_marker 'final tests PASS, final review PASS' 'git add -- "<report>"'
require_branch_marker 'final tests PASS, final review PASS' 'git commit --only'
require_branch_marker 'final tests PASS, final review PASS' 'SDD workspace removal'
require_branch_marker 'final tests PASS, final review PASS' 'post-write porcelain is the candidate check against HEAD and index'
grep -q 'Only final tests PASS and final review PASS may continue to Step 2' "$finishing_file"

node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EVENT_TYPES } from './lib/metrics/constants.mjs';
import { PAYLOAD_CONTRACTS } from './lib/metrics/schema-v1.mjs';

const reference = await readFile('skills/subagent-driven-development/metrics-events.md', 'utf8');
assert.match(reference, /\| `plan_registered` \| `\{"task_count":<integer at least 1>\}` \|/, 'plan_registered task_count must be positive');
assert.match(reference, /git-blob:<40 or 64 lowercase hex>/, 'fingerprint templates must accept SHA-1 and SHA-256');
assert.doesNotMatch(reference, /git-blob:<40 lowercase hex>/, 'fingerprint templates must not drift back to SHA-1 only');
assert.match(reference, /plan-adjustment event envelope `plan_fingerprint` equals `previous_fingerprint`; then accepted revision becomes `new_fingerprint`\./, 'plan adjustments must bind envelope to the prior accepted revision');
const table = reference.match(/^## Canonical event table\n([\s\S]*?)(?=^## |\Z)/m)?.[1];
assert.ok(table, 'metrics-events.md must contain a Canonical event table');
const documentedTypes = [...table.matchAll(/^\|\s*`([a-z_]+)`\s*\|/gm)].map(([, eventType]) => eventType);
assert.deepEqual(documentedTypes, EVENT_TYPES, 'canonical event table must match EVENT_TYPES exactly');

const section = heading => reference.match(new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |\\Z)`, 'm'))?.[1];
const parseTable = heading => section(heading).split('\n').filter(line => line.startsWith('|') && !line.startsWith('|---')).map(line => line.slice(1, -1).split(/(?<!\\)\|/).map(cell => cell.trim().replaceAll('\\|', '|')));
const list = cell => cell === '-' ? [] : cell.split(',');
const enums = cell => cell === '-' ? {} : Object.fromEntries(cell.split(';').map(part => {
  const [field, values] = part.split('=');
  return [field, values.split('|')];
}));
const contractRows = parseTable('Canonical payload template matrix').slice(1);
const documentedContracts = Object.fromEntries(contractRows.map(([eventType, required, optional, enumCell]) => {
  const req = list(required), opt = list(optional);
  return [eventType.replaceAll('`', ''), { allowed: [...req, ...opt], required: req, optional: opt, enums: enums(enumCell) }];
}));
assert.deepEqual(documentedContracts, PAYLOAD_CONTRACTS, 'canonical payload matrix must exactly match schema metadata');

const boundaryMatrix = parseTable('Operational boundary matrix').slice(1);
const BOUNDARY_ORACLE = [
  ['new', 'task11', 'new_run', 'run_started>plan_registered>task_registered>preflight_completed'],
  ['resume', 'task11', 'blocked_or_incomplete', 'run_resumed'],
  ['amend', 'task11', 'plan_change', 'plan_task_added|plan_task_changed|plan_task_superseded'],
  ['dispatch', 'task11', 'preflight_PASS', 'task_dispatched'],
  ['report', 'task11', 'implementer_report', 'task_implementation_completed>task_test_result'],
  ['review', 'task11', 'one_reviewer', 'task_implementation_review_result>task_quality_review_result>finding_raised'],
  ['fix', 'task11', 'open_finding', 'fix_round_started>fix_round_completed>finding_resolved|finding_parked'],
  ['accept', 'task11', 'paired_PASS_no_open_critical_or_important', 'task_accepted'],
  ['block', 'task11', 'genuine_SDD_blocker_before_handoff', 'human_intervention_required>human_intervention_completed|task_blocked>run_blocked|run_incomplete'],
  ['final_handoff', 'task11_to_task12', 'final_review_complete', 'finding_raised>final_review_result;task12:final_test_result>run_passed|run_blocked'],
];
assert.deepEqual(boundaryMatrix, BOUNDARY_ORACLE, 'operational boundary matrix must match workflow oracle');

const compareContracts = candidate => assert.deepEqual(candidate, PAYLOAD_CONTRACTS);
const clonedContracts = () => structuredClone(documentedContracts);
let planted = clonedContracts(); planted.run_started.allowed = []; assert.throws(() => compareContracts(planted));
planted = clonedContracts(); planted.task_test_result.required.push('passed'); planted.task_test_result.optional = ['total']; assert.throws(() => compareContracts(planted));
planted = clonedContracts(); planted.run_started.enums.trigger = ['NEW_PLAN']; assert.throws(() => compareContracts(planted));
planted = clonedContracts(); planted.fix_round_completed.enums['finding_results[].verdict'].push('UNKNOWN'); assert.throws(() => compareContracts(planted));
const reorderedMatrix = structuredClone(boundaryMatrix); reorderedMatrix[0][3] = 'plan_registered>run_started>task_registered>preflight_completed'; assert.throws(() => assert.deepEqual(reorderedMatrix, BOUNDARY_ORACLE));
NODE
