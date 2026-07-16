#!/usr/bin/env bash
# Integration Test: rails-reviewer template dispatch
# Verifies the Rails conventions reviewer — dispatched as a general-purpose
# subagent via skills/subagent-driven-development/rails-reviewer-prompt.md
# (the post-v5.1.0 pattern that replaced the dedicated rails-reviewer agent the
# plugin previously shipped) — still loads the convention skills and catches planted Rails
# convention violations.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

TEMPLATE="$PLUGIN_DIR/skills/subagent-driven-development/rails-reviewer-prompt.md"

echo "========================================"
echo " Integration Test: rails-reviewer"
echo "========================================"
echo ""
echo "This test verifies the Rails conventions reviewer by:"
echo "  1. Setting up a tiny Rails-shaped project with a baseline commit"
echo "  2. Adding a second commit that plants real convention violations"
echo "  3. Dispatching the reviewer via the rails-reviewer-prompt.md template"
echo "     as a general-purpose subagent"
echo "  4. Verifying the reviewer flags the planted violations at"
echo "     Critical/Important severity"
echo ""

if [ ! -f "$TEMPLATE" ]; then
    echo "ERROR: reviewer template not found at $TEMPLATE"
    exit 1
fi

TEST_PROJECT=$(create_test_project)
echo "Test project: $TEST_PROJECT"
trap "cleanup_test_project $TEST_PROJECT" EXIT

cd "$TEST_PROJECT"

# Baseline: a clean, convention-following controller + spec.
mkdir -p app/controllers app/models spec/requests spec/policies
cat > app/controllers/projects_controller.rb <<'EOF'
class ProjectsController < ApplicationController
  def index
    authorize Project
    @projects = current_user.active_projects
  end
end
EOF

cat > app/models/project.rb <<'EOF'
class Project < ApplicationRecord
  belongs_to :user

  def self.active
    where(archived: false)
  end
end
EOF

cat > spec/requests/projects_spec.rb <<'EOF'
require "rails_helper"

RSpec.describe "Projects", type: :request do
  it "lists the current user's active projects" do
    user = create(:user)
    project = create(:project, user: user, archived: false)
    sign_in user

    get projects_path

    expect(response.body).to include(project.name)
  end
end
EOF

git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git add .
git commit -m "Initial: conventional ProjectsController + request spec" --quiet
BASE_SHA=$(git rev-parse HEAD)

# Second commit: plant three real Rails convention violations.
#  1. New controller action with NO authorize call (Critical)
#  2. Association reaching from the controller — .where on an association
#     instead of asking the model (Important: message-passing OOP)
#  3. A request spec that tests mocked behavior instead of real logic (Critical)
cat > app/controllers/projects_controller.rb <<'EOF'
class ProjectsController < ApplicationController
  def index
    authorize Project
    @projects = current_user.active_projects
  end

  # Planted: no authorize call, and reaches into the association with .where
  # instead of asking the model for its archived projects.
  def archived
    @projects = current_user.projects.where(archived: true).order(:name)
  end
end
EOF

cat > spec/requests/projects_spec.rb <<'EOF'
require "rails_helper"

RSpec.describe "Projects", type: :request do
  it "lists the current user's active projects" do
    user = create(:user)
    project = create(:project, user: user, archived: false)
    sign_in user

    get projects_path

    expect(response.body).to include(project.name)
  end

  # Planted: tests mocked behavior instead of real logic — stubs the very
  # method under test and asserts on the stub.
  it "lists archived projects" do
    user = create(:user)
    relation = double("relation", order: [])
    allow(user).to receive(:projects).and_return(relation)
    allow(relation).to receive(:where).and_return(relation)
    sign_in user

    get archived_projects_path

    expect(relation).to have_received(:where).with(archived: true)
  end
end
EOF

git add .
git commit -m "Add archived projects listing" --quiet
HEAD_SHA=$(git rev-parse HEAD)

echo ""
echo "Planted convention violations in $BASE_SHA..$HEAD_SHA:"
echo "  - Controller action #archived missing authorize call (Critical)"
echo "  - Association reaching: current_user.projects.where(...) in controller (Important)"
echo "  - Request spec tests mocked behavior instead of real logic (Critical)"
echo ""

OUTPUT_FILE="$TEST_PROJECT/claude-output.txt"

PROMPT="This is a Rails project. I just finished a change between commits $BASE_SHA and $HEAD_SHA on the current branch.

Dispatch a Rails conventions reviewer as a general-purpose subagent (Task tool) using the template at $TEMPLATE. Fill the template's placeholders: FILES_CHANGED is the files in the diff, BASE_SHA is $BASE_SHA, HEAD_SHA is $HEAD_SHA. The subagent MUST load the Rails convention skills the template lists before reviewing.

Print the subagent reviewer's full output."

echo "Running Claude (plugin-dir: $PLUGIN_DIR, cwd: $TEST_PROJECT)..."
echo "================================================================================"
cd "$TEST_PROJECT" && timeout 600 claude -p "$PROMPT" \
    --plugin-dir "$PLUGIN_DIR" \
    --permission-mode bypassPermissions 2>&1 | tee "$OUTPUT_FILE" || {
    echo ""
    echo "================================================================================"
    echo "EXECUTION FAILED (exit code: $?)"
    exit 1
}
echo "================================================================================"

echo ""
echo "Analyzing reviewer output..."
echo ""

# Locate the session transcript (same approach as upstream's former
# test-requesting-code-review.sh, since lifted into the evals/ drill
# code-review-catches-planted-bugs).
TEST_PROJECT_REAL=$(cd "$TEST_PROJECT" && pwd -P)
SESSION_DIR="$HOME/.claude/projects/$(echo "$TEST_PROJECT_REAL" | sed 's|[^a-zA-Z0-9]|-|g')"
SESSION_FILE=$(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null | head -1 || true)

FAILED=0

echo "=== Verification Tests ==="
echo ""

# Test 1: A subagent was actually dispatched (the whole point of the refactor —
# the review runs in a general-purpose subagent, not inline).
#
# Note: unlike upstream's former test-requesting-code-review.sh (now an
# evals/ drill) we do NOT assert a
# skill invocation here — the rails reviewer is dispatched from a prompt
# template (rails-reviewer-prompt.md), not a Skill, so there is no
# "skill":"..." marker to match. "name":"Agent" is the available dispatch
# signal. (Don't "fix" this by adding a skill assertion; there is no skill.)
echo "Test 1: reviewer subagent dispatched..."
if [ -z "$SESSION_FILE" ] || [ ! -f "$SESSION_FILE" ]; then
    echo "  [FAIL] Could not locate session transcript in $SESSION_DIR"
    FAILED=$((FAILED + 1))
elif ! grep -q '"name":"Agent"' "$SESSION_FILE"; then
    echo "  [FAIL] No subagent was dispatched"
    echo "         Session: $SESSION_FILE"
    FAILED=$((FAILED + 1))
else
    echo "  [PASS] Subagent dispatched"
fi
echo ""

# Test 2: The reviewer template's content reached the subagent — i.e. the
# dispatched general-purpose agent's prompt carries the "Load ALL Convention
# Skills" directive and the convention skill names. This proves the main agent
# read rails-reviewer-prompt.md and embedded its checklist + skill-loading
# directive into a real subagent dispatch.
#
# (We deliberately do NOT assert on what the subagent did internally: in
# headless `claude -p` the subagent's own transcript is not surfaced — there
# are no sidechain entries or Skill tool-uses in the main session JSONL — so
# subagent-internal skill loading is not observable. Upstream's
# former test-requesting-code-review.sh made the same scoping choice.)
echo "Test 2: reviewer template content (skill-loading directive) reached the subagent..."
if [ -z "$SESSION_FILE" ] || [ ! -f "$SESSION_FILE" ]; then
    echo "  [FAIL] Could not locate session transcript in $SESSION_DIR"
    FAILED=$((FAILED + 1))
elif grep -q 'Load ALL Convention Skills' "$SESSION_FILE" \
   && grep -qE 'superpowers-rails:rails-[a-z]+-conventions' "$SESSION_FILE"; then
    echo "  [PASS] Dispatched subagent prompt carries the convention-loading directive"
else
    echo "  [FAIL] Convention-loading directive / skill names not carried into the dispatch"
    echo "         Session: $SESSION_FILE"
    FAILED=$((FAILED + 1))
fi
echo ""

# IMPORTANT — assertion design (why these are anchored to finding-language):
# The template instructs the reviewer to run `git diff`, so the planted source
# tokens (`authorize`, `.where`, `double`/`stub`) can appear in the transcript
# regardless of review quality. The baseline #index even keeps a correct
# `authorize Project`, so a bare `grep authoriz` matches even if the reviewer
# never notices #archived's omission. Bare-token greps therefore gate "a diff
# was printed", not "the violation was caught". Each per-violation test below
# anchors to language a reviewer uses when FLAGGING the issue (a negative /
# analysis phrasing), and Test 6 adds an ungameable verdict gate that code-echo
# cannot satisfy. (Mirrors the negative-verdict assertion upstream's former
# test-requesting-code-review.sh carried at line 182, now in the evals/ drill.)

# Test 3: Missing authorize call FLAGGED — require negative/finding context near
# "authoriz" so a correct mention of #index's authorize doesn't pass.
echo "Test 3: Missing authorize call flagged..."
if grep -qiE "(missing|no |without|lacks?|absent|fails? to|does ?n.?t|not (called|present|added|invoked)|every action|each action)[^.]{0,60}authoriz|authoriz[^.]{0,60}(missing|absent|every action|each action|not (called|present|added|invoked))" "$OUTPUT_FILE"; then
    echo "  [PASS] Reviewer flagged the missing authorize call"
else
    echo "  [FAIL] Reviewer missed the missing authorize call (or only mentioned it without flagging)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Association reaching FLAGGED — anchor to reviewer analysis vocabulary,
# not the bare `.where` token that appears in the echoed diff.
echo "Test 4: Association reaching flagged..."
if grep -qiE "message.?passing|reach(es|ing|ed)? into|association reach|ask(ing|s)? the model|delegate[^.]{0,30}model|(push|move)[^.]{0,30}(in)?to[^.]{0,15}model|belongs in the model|leak(s|ing)? .*(query|implementation)" "$OUTPUT_FILE"; then
    echo "  [PASS] Reviewer flagged the association reaching"
else
    echo "  [FAIL] Reviewer missed the association reaching (message-passing OOP)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 5: Mocked-behavior test FLAGGED — anchor to the reviewer describing the
# problem, not the bare `mock`/`stub`/`double` tokens present in the diff.
echo "Test 5: Mocked-behavior test flagged..."
if grep -qiE "tests? (the )?(mock|stub|double)|mock(s|ed|ing)?[^.]{0,40}(instead|not (the )?real|behavior|rather than)|stub(s|bed|bing)?[^.]{0,40}(the )?(method|model|under test|itself)|not[^.]{0,25}(testing )?real (logic|behavior|code)|asserts? on (the |a )?(mock|stub|double)|doesn.?t test (real|the actual)" "$OUTPUT_FILE"; then
    echo "  [PASS] Reviewer flagged the mocked-behavior test"
else
    echo "  [FAIL] Reviewer missed the mocked-behavior test"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 6: Verdict gate (UNGAMEABLE by code-echo). A correct review of this diff
# MUST conclude with violations found — the template's output format emits
# "❌ Rails convention violations: N critical, ..." — and must NOT emit the
# clean "✅ Rails conventions followed" verdict. A broken/sycophantic reviewer,
# or a main agent merely echoing the diff, cannot produce this.
echo "Test 6: Reviewer verdict (violations found, not approved)..."
if grep -qE "❌|convention violations?:" "$OUTPUT_FILE" \
   && grep -qiE "critical" "$OUTPUT_FILE" \
   && ! grep -qE "✅ Rails conventions followed" "$OUTPUT_FILE"; then
    echo "  [PASS] Reviewer returned a violations verdict (not a clean pass)"
else
    echo "  [FAIL] Reviewer did not return a violations verdict (echo/clean-pass not acceptable)"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "========================================"
echo " Test Summary"
echo "========================================"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "STATUS: PASSED"
    echo "The Rails reviewer (general-purpose template dispatch) correctly:"
    echo "  ✓ Ran in a dispatched general-purpose subagent"
    echo "  ✓ Carried the convention-loading directive into the dispatch"
    echo "  ✓ Flagged the missing authorize call"
    echo "  ✓ Flagged the association reaching"
    echo "  ✓ Flagged the mocked-behavior test"
    echo "  ✓ Returned a violations verdict (not a clean pass)"
    exit 0
else
    echo "STATUS: FAILED"
    echo "Failed $FAILED verification tests"
    echo ""
    echo "Output saved to: $OUTPUT_FILE"
    exit 1
fi
