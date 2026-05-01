#!/usr/bin/env bash
# Fails when Codex skills contain operational references to unavailable tools or model names.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILLS_DIR="$REPO_ROOT/codex/skills"
TEAM_SKILL="$SKILLS_DIR/team-driven-development/SKILL.md"
USING_SUPERPOWERS_SKILL="$SKILLS_DIR/using-superpowers/SKILL.md"
TDD_SKILL="$SKILLS_DIR/test-driven-development/SKILL.md"
EXECUTING_PLANS_SKILL="$SKILLS_DIR/executing-plans/SKILL.md"
WRITING_PLANS_SKILL="$SKILLS_DIR/writing-plans/SKILL.md"
WRITING_SKILLS_SKILL="$SKILLS_DIR/writing-skills/SKILL.md"
MODEL_ASSIGNMENT_SKILL="$SKILLS_DIR/model-assignment/SKILL.md"
VERIFICATION_SKILL="$SKILLS_DIR/verification-before-completion/SKILL.md"
DISPATCHING_SKILL="$SKILLS_DIR/dispatching-parallel-agents/SKILL.md"
SUBAGENT_SKILL="$SKILLS_DIR/subagent-driven-development/SKILL.md"
REQUESTING_REVIEW_SKILL="$SKILLS_DIR/requesting-code-review/SKILL.md"
REVIEWER_TEMPLATE="$SKILLS_DIR/requesting-code-review/code-reviewer.md"
AUDIT_VERIFICATION_SKILL="$SKILLS_DIR/audit-verification/SKILL.md"
WIKI_MANAGEMENT_SKILL="$SKILLS_DIR/wiki-management/SKILL.md"
BRAINSTORMING_SKILL="$SKILLS_DIR/brainstorming/SKILL.md"
FORBIDDEN='TeamCreate|TaskCreate|TaskUpdate|TaskList|TaskGet|SendMessage|TodoWrite|Task tool|Skill tool|NotebookEdit|`Edit`|`Write`|Edit tool|Write tool|Opus|Sonnet|Haiku'

fail() {
  echo "  [FAIL] $1"
  exit 1
}

pass() {
  echo "  [PASS] $1"
}

require_skill_text() {
  local file="$1"
  local pattern="$2"
  local message="$3"

  [ -f "$file" ] || fail "Missing skill file: $file"

  if rg -U -q "$pattern" "$file"; then
    pass "$message"
  else
    fail "$message"
  fi
}

require_skill_not_text() {
  local file="$1"
  local pattern="$2"
  local message="$3"

  [ -f "$file" ] || fail "Missing skill file: $file"

  if rg -q "$pattern" "$file"; then
    fail "$message"
  else
    pass "$message"
  fi
}

require_order() {
  local file="$1"
  local first_pattern="$2"
  local second_pattern="$3"
  local message="$4"
  local first_line second_line

  [ -f "$file" ] || fail "Missing file: $file"

  first_line="$(rg -n "$first_pattern" "$file" | head -n 1 | cut -d: -f1 || true)"
  second_line="$(rg -n "$second_pattern" "$file" | head -n 1 | cut -d: -f1 || true)"

  [ -n "$first_line" ] || fail "$message (missing first pattern: $first_pattern)"
  [ -n "$second_line" ] || fail "$message (missing second pattern: $second_pattern)"

  if [ "$first_line" -lt "$second_line" ]; then
    pass "$message"
  else
    fail "$message"
  fi
}

require_team_skill_text() {
  require_skill_text "$TEAM_SKILL" "$1" "$2"
}

echo "=== Test: Codex Skill Language ==="

[ -d "$SKILLS_DIR" ] || fail "Missing skills directory: $SKILLS_DIR"

matches="$(rg -n "$FORBIDDEN" "$SKILLS_DIR" || true)"
if [ -z "$matches" ]; then
  pass "no unavailable operational references found"
else
  violations="$(printf '%s\n' "$matches" | grep -v 'not available in Codex' || true)"
  if [ -n "$violations" ]; then
    echo "$violations"
    fail "Codex skills contain unavailable operational references"
  fi

  pass "only explicitly disallowed-in-Codex explanations mention unavailable terms"
fi

require_team_skill_text "MUST NOT (edit|write|modify).*directly|directly (edit|write|modify)" \
  "team-driven-development keeps the main session orchestration-only"
require_team_skill_text "responsible for orchestration.*task boundaries.*review routing.*final verification" \
  "team-driven-development defines main orchestration responsibilities"
require_team_skill_text "clean-context worker.*spawn_agent|spawn_agent.*clean-context worker" \
  "team-driven-development creates clean-context worker subagents"
require_team_skill_text "reviewer is a separate.*created after worker output|worker result.*separate reviewer.*spawn_agent" \
  "team-driven-development creates separate reviewers after worker output"
require_team_skill_text "(?s)Reviewer prompt must include:.*(actual diff|direct diff inspection|diff/patch|\\bpatch\\b).*Reviewer output must include:" \
  "team-driven-development requires reviewer handoff to include actual diffs or patches"
require_team_skill_text "(?s)Reviewer prompt must include:.*(worker'?s?.{0,200}(verification evidence|verification output|test evidence|test output|tests run|commands run)|(verification evidence|verification output|test evidence|test output|tests run|commands run).{0,200}worker'?s?).*Reviewer output must include:" \
  "team-driven-development passes worker verification evidence or output to reviewers"
require_team_skill_text "(?s)Reviewer.{0,1200}((must not|cannot|may not|MUST NOT).{0,200}APPROVE.{0,300}(summary|self-report).{0,200}(only|alone)|(summary|self-report).{0,200}(only|alone).{0,300}(must not|cannot|may not|MUST NOT).{0,200}APPROVE)" \
  "team-driven-development prevents reviewer approval from worker summary or self-report alone"
require_team_skill_text "(?s)(APPROVE.{0,200}(only|after|when|requires).{0,300}(actual diff|direct diff inspection|diff/patch|\\bpatch\\b).{0,300}(verification evidence|verification output|test evidence|test output)|APPROVE.{0,200}(only|after|when|requires).{0,300}(verification evidence|verification output|test evidence|test output).{0,300}(actual diff|direct diff inspection|diff/patch|\\bpatch\\b))" \
  "team-driven-development allows APPROVE only after diff or patch plus verification evidence review"
require_team_skill_text "final line.*exactly .*Verdict: APPROVE.*Verdict: REJECT|exactly .*Verdict: APPROVE.*Verdict: REJECT" \
  "team-driven-development requires exact Verdict: APPROVE or Verdict: REJECT reviewer verdict"
require_team_skill_text "Do not bypass reviewer validation" \
  "team-driven-development forbids bypassing reviewer validation"
require_team_skill_text "worker.*self-report|self-report.*worker" \
  "team-driven-development says worker self-report is insufficient"
require_team_skill_text "REJECT.*send.*findings.*send_input|findings.*send_input.*revision" \
  "team-driven-development routes REJECT findings back with send_input"
require_team_skill_text "revised result to review again|Repeat review until" \
  "team-driven-development requires re-review after revision"
require_team_skill_text "APPROVE.*inspect the diff|APPROVE.*main session has inspected" \
  "team-driven-development requires main diff inspection after APPROVE"
require_team_skill_text "per-worker review.*not replaceable.*shared final audit|shared final audit.*per-worker|separate reviewer.*shared final audit" \
  "team-driven-development keeps per-worker review distinct from final audit"
require_team_skill_text "(?s)(Final Integration Gate|remaining review findings).*remaining review findings.*(send_input.*worker|worker.*send_input)" \
  "team-driven-development routes remaining findings to workers with send_input"
require_team_skill_text "(?s)(Final Integration Gate|remaining review findings).*remaining review findings.*(separate reviewer|reviewed again|review again|re-review)" \
  "team-driven-development requires separate reviewer re-review for remaining findings"
require_team_skill_text "(?s)(Final Integration Gate|remaining review findings).*remaining review findings.*(escalate.*user.*blocker|blocker.*user input|user.*blocker)" \
  "team-driven-development escalates unresolved findings as blockers"
require_team_skill_text "(?s)(worker is closed|closed worker|worker.*closed).*(resume_agent).*(replacement worker|spawn a replacement worker)" \
  "team-driven-development handles closed workers with resume_agent or replacement workers"

require_skill_text "$USING_SUPERPOWERS_SKILL" "(?s)team-driven-development.*upper-level orchestration/execution mode.*before choosing any direct execution path.*Process skills still apply" \
  "using-superpowers treats team-driven requests as an upper-level orchestration mode above implementation-process skills"
require_skill_text "$USING_SUPERPOWERS_SKILL" "(?s)Process skills still apply.*(debugging.*TDD|TDD.*debugging).*In team-driven-development mode.*worker assignments and reviewer instructions.*instead of performing main-session implementation, debugging, testing, or rework" \
  "using-superpowers nests process skills inside worker/reviewer assignments instead of running them directly in main"
require_skill_text "$USING_SUPERPOWERS_SKILL" "main.*orchestration.*task routing.*review routing.*final inspection|orchestration.*task routing.*review routing.*final inspection" \
  "using-superpowers keeps main session focused on orchestration, routing, and final inspection"
require_skill_text "$USING_SUPERPOWERS_SKILL" "(1% chance|one percent chance|even a 1%)" \
  "using-superpowers restores the compact 1% skill-use rule"
require_skill_text "$USING_SUPERPOWERS_SKILL" "(?s)(Red Flags|red flags).*(rationaliz|skip|just this once|too simple|overkill)" \
  "using-superpowers includes anti-rationalization red flags"
require_skill_text "$USING_SUPERPOWERS_SKILL" "cannot rationalize|rationaliz.*not.*optional|not optional.*rationaliz" \
  "using-superpowers explicitly forbids rationalizing around skill use"
require_skill_text "$USING_SUPERPOWERS_SKILL" "(?s)(Reviewer subagents|delegated reviewers|reviewer subagents).{0,240}(must not|MUST NOT|do not|Do not).{0,180}(team-driven-development|team-driven mode|orchestrators|orchestration).{0,260}(inspect.*diff|review.*diff|diff.*directly|directly inspect)" \
  "using-superpowers prevents reviewer subagents from re-entering team-driven orchestration"

require_skill_text "$TDD_SKILL" "(?s)(write code before|implementation before|production code before).{0,160}(delete|discard).{0,120}(start over|restart)|(?s)(delete|discard).{0,120}(start over|restart).{0,160}(write code before|implementation before|production code before)" \
  "test-driven-development restores delete/start-over safeguard for implementation before tests"
require_skill_text "$TDD_SKILL" "(?s)(Rationalization|rationalization).{0,200}(Reality|Correction|Truth)|(?s)(Excuse|Rationalization).{0,200}(tests later|write tests after|manual testing|just this once)" \
  "test-driven-development includes a rationalization table"

require_skill_text "$EXECUTING_PLANS_SKILL" "Team-driven mode.*team-driven development.*subagents.*delegation.*parallel agent work.*reviewer workflow" \
  "executing-plans routes team, subagent, parallel, and reviewer requests to team mode"
require_skill_text "$EXECUTING_PLANS_SKILL" "Invoke .*team-driven-development" \
  "executing-plans invokes team-driven-development for team mode"
require_skill_text "$EXECUTING_PLANS_SKILL" "orchestration-only.*Do not follow implementation steps directly.*edit files directly" \
  "executing-plans does not inline implement in team mode"
require_skill_text "$EXECUTING_PLANS_SKILL" "exactly .*Verdict: APPROVE.*Verdict: REJECT" \
  "executing-plans requires exact Verdict: APPROVE or Verdict: REJECT reviewer verdicts"
require_skill_text "$EXECUTING_PLANS_SKILL" "(?s)(actual .*diff|file patch).*resume_agent.*(replacement worker|spawn a replacement worker)" \
  "executing-plans includes diff or patch handoff and closed-worker fallback"

require_skill_text "$WRITING_PLANS_SKILL" "Team-Driven Task Contract" \
  "writing-plans includes Team-Driven Task Contract"
require_skill_text "$WRITING_PLANS_SKILL" "Owned Files/Modules.*worker may edit|owned files/modules" \
  "writing-plans requires worker-owned files"
require_skill_text "$WRITING_PLANS_SKILL" "Check correctness.*scope control.*integration risk.*test adequacy" \
  "writing-plans includes reviewer criteria"
require_skill_text "$WRITING_PLANS_SKILL" "exact final verdict line: .*Verdict: APPROVE.*Verdict: REJECT|exact verdict line: .*Verdict: APPROVE.*Verdict: REJECT|exactly .*Verdict: APPROVE.*Verdict: REJECT" \
  "writing-plans requires exact Verdict: APPROVE or Verdict: REJECT reviewer verdict"
require_skill_text "$WRITING_PLANS_SKILL" "Rework Handling" \
  "writing-plans includes rework handling"
require_skill_text "$WRITING_PLANS_SKILL" "REJECT.*send.*send_input|send.*REJECT.*send_input" \
  "writing-plans routes rejected work back with send_input"
require_skill_text "$WRITING_PLANS_SKILL" "(?s)(actual .*diff|file patch).*resume_agent.*(replacement worker|spawns a replacement worker|spawn a replacement worker)" \
  "writing-plans requires diff or patch handoff and closed-worker fallback in team task contracts"

require_skill_text "$WRITING_SKILLS_SKILL" "(?s)(pressure scenarios|pressure-test|pressure test).*(discipline skills|discipline skill|TDD|debugging|verification)|(?s)(discipline skills|discipline skill|TDD|debugging|verification).*(pressure scenarios|pressure-test|pressure test)" \
  "writing-skills requires pressure scenarios for discipline skills"
require_skill_text "$WRITING_SKILLS_SKILL" "(baseline failure|baseline fail|watch.*fail|red.*green|fail first)" \
  "writing-skills requires baseline failure before discipline-skill implementation"
require_skill_text "$WRITING_SKILLS_SKILL" "(rationalization capture|capture rationalization|rationaliz.*capture|capture.*rationaliz)" \
  "writing-skills requires rationalization capture"
require_skill_text "$WRITING_SKILLS_SKILL" "(re-test|retest|test again|run.*again).*(discipline skills|discipline skill|TDD|debugging|verification)|(?s)(discipline skills|discipline skill|TDD|debugging|verification).*(re-test|retest|test again|run.*again)" \
  "writing-skills requires re-test after discipline-skill changes"

require_skill_not_text "$MODEL_ASSIGNMENT_SKILL" "local[- ]review|local review checklists|inline review checklist|review it locally" \
  "model-assignment omits local-review fallback phrases"
require_skill_text "$MODEL_ASSIGNMENT_SKILL" "Worker Subagent Assignment" \
  "model-assignment includes Worker Subagent assignment language"
require_skill_text "$MODEL_ASSIGNMENT_SKILL" "Reviewer Subagent Assignment" \
  "model-assignment includes Reviewer Subagent assignment language"
require_skill_text "$MODEL_ASSIGNMENT_SKILL" "final line must be exactly .*Verdict: APPROVE.*Verdict: REJECT" \
  "model-assignment requires exact Verdict: APPROVE or Verdict: REJECT reviewer verdicts"

require_skill_text "$VERIFICATION_SKILL" "Team-Driven Completion Gate" \
  "verification-before-completion includes Team-Driven Completion Gate"
require_skill_text "$VERIFICATION_SKILL" "separate reviewer subagent verdict.*APPROVE.*every worker task" \
  "verification-before-completion requires reviewer APPROVE evidence"
require_skill_text "$VERIFICATION_SKILL" "REJECT.*send_input.*reworked.*reviewed again.*APPROVE" \
  "verification-before-completion requires rejected work to be reworked and re-reviewed"
require_skill_text "$VERIFICATION_SKILL" "final main-session inspection.*integrated diff.*test or verification output" \
  "verification-before-completion requires final main verification evidence"
require_skill_text "$VERIFICATION_SKILL" "final verdict line must be exactly .*Verdict: APPROVE.*Verdict: REJECT" \
  "verification-before-completion requires exact Verdict: APPROVE or Verdict: REJECT reviewer verdicts"
require_skill_text "$VERIFICATION_SKILL" "resume_agent.*(replacement worker|spawn a replacement worker).*prior diff.*reviewer findings" \
  "verification-before-completion includes closed-worker fallback with prior diff and reviewer findings"

require_skill_text "$DISPATCHING_SKILL" "(?s)(actual .*diff|file patch).*Verdict: APPROVE.*Verdict: REJECT" \
  "dispatching-parallel-agents requires actual diff or patch handoff and exact reviewer verdicts"
require_skill_text "$DISPATCHING_SKILL" "resume_agent.*(replacement worker|spawn a replacement worker).*previous diff.*reviewer findings" \
  "dispatching-parallel-agents handles closed workers with resume_agent or replacement workers"

require_skill_text "$SUBAGENT_SKILL" "(?s)Reviewer handoff must include:.*(actual .*diff|file patch).*Verification.*Verdict: APPROVE.*Verdict: REJECT" \
  "subagent-driven-development passes actual diff or patch plus verification evidence to reviewers"
require_skill_text "$SUBAGENT_SKILL" "(?s)resume_agent.*replacement worker.*(previous worker report|actual diff|reviewer findings|ownership)" \
  "subagent-driven-development handles closed workers with resume_agent or replacement workers"

require_skill_text "$REQUESTING_REVIEW_SKILL" "(?s)(git diff|file patch).*Verdict: APPROVE.*Verdict: REJECT" \
  "requesting-code-review passes concrete patch context and exact reviewer verdict format"
require_skill_text "$AUDIT_VERIFICATION_SKILL" "(?s)(Actual .*diff|actual .*diff|file patch).*Verdict: APPROVE.*Verdict: REJECT" \
  "audit-verification passes concrete patch context and exact reviewer verdict format"
require_skill_text "$AUDIT_VERIFICATION_SKILL" "(?s)In team mode.{0,240}(must|MUST|required|requires).{0,240}separate reviewer subagent" \
  "audit-verification requires a separate reviewer subagent in team mode"
require_skill_not_text "$AUDIT_VERIFICATION_SKILL" "In team mode, an audit reviewer can be a separate subagent" \
  "audit-verification does not make team audit reviewer optional"

require_team_skill_text "(?s)(broad|risky|multi-owner|multi owner).{0,240}(pause|ask|confirm).{0,240}(explicit|authorize|authorization).{0,160}(team-mode|team mode)|(?s)(pause|ask|confirm).{0,240}(explicit|authorize|authorization).{0,160}(team-mode|team mode).{0,240}(broad|risky|multi-owner|multi owner)" \
  "team-driven-development pauses for explicit team-mode authorization before broad, risky, or multi-owner inline execution"

require_order "$REVIEWER_TEMPLATE" '^### Findings' '^### Strengths' \
  "reviewer template lists findings before strengths"

require_skill_text "$BRAINSTORMING_SKILL" "(?s)(brief self-review checklist|self-review checklist|Spec Self-Review).{0,240}(before planning|before.*writing-plans|before.*implementation plan|prior to planning)" \
  "brainstorming requires a brief self-review checklist before planning"

require_skill_text "$WIKI_MANAGEMENT_SKILL" "(?s)(main session|main Codex session).{0,260}(must not|MUST NOT|Do not|do not).{0,180}(edit|write|modify|update|create|delete).{0,180}docs/wiki|docs/wiki.{0,180}(must not|MUST NOT|Do not|do not).{0,180}(edit|write|modify|update|create|delete).{0,260}(main session|main Codex session)" \
  "wiki-management forbids main-session direct docs/wiki writes"
require_skill_text "$WIKI_MANAGEMENT_SKILL" "(?s)(Wiki Writer|wiki writer).{0,180}(unavailable|not authorized|cannot be dispatched|not permitted).{0,260}(must not|MUST NOT|do not|Do not).{0,180}(edit|write|modify|update|create|delete)|(?s)(must not|MUST NOT|do not|Do not).{0,180}(edit|write|modify|update|create|delete).{0,260}(Wiki Writer|wiki writer).{0,180}(unavailable|not authorized|cannot be dispatched|not permitted)" \
  "wiki-management fails closed when Wiki Writer delegation is unavailable"
require_skill_not_text "$WIKI_MANAGEMENT_SKILL" "(may|can|allowed|allows|permits|fallback|If the current task permits).{0,140}(update|edit|write|modify|create).{0,100}docs/wiki/\\*\\*.{0,100}directly|directly.{0,100}(update|edit|write|modify|create).{0,100}docs/wiki/\\*\\*.{0,140}(may|can|allowed|allows|permits|fallback)" \
  "wiki-management does not allow direct docs/wiki writes"
