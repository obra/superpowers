#!/usr/bin/env bash
# Integration Test: requesting-code-review skill
# Verifies the code reviewer dispatched via the skill catches a planted bug
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================"
echo " Integration Test: requesting-code-review"
echo "========================================"
echo ""
echo "This test verifies the code reviewer subagent by:"
echo "  1. Setting up a tiny project with a baseline commit"
echo "  2. Adding a second commit that plants an obvious bug"
echo "  3. Dispatching the code reviewer via the requesting-code-review skill"
echo "  4. Verifying the reviewer flags the planted bug as Critical/Important"
echo ""

TEST_PROJECT=$(create_test_project)
echo "Test project: $TEST_PROJECT"
trap "cleanup_test_project $TEST_PROJECT" EXIT

cd "$TEST_PROJECT"

# Baseline: a small "safe" implementation
mkdir -p src
cat > src/db.js <<'EOF'
import { Database } from "./database-driver.js";

const db = new Database();

export async function findUserByEmail(email) {
  if (typeof email !== "string" || !email) {
    throw new Error("email required");
  }
  return db.query(
    "SELECT id, email, created_at FROM users WHERE email = ?",
    [email],
  );
}
EOF

cat > package.json <<'EOF'
{ "name": "test-codereview", "version": "1.0.0", "type": "module" }
EOF

git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git add .
git commit -m "Initial: parameterized findUserByEmail" --quiet
BASE_SHA=$(git rev-parse HEAD)

# Second commit: plant two real bugs
# 1. SQL injection — switch from parameterized to string concatenation
# 2. Logs the user's password hash on every successful login
cat > src/db.js <<'EOF'
import { Database } from "./database-driver.js";

const db = new Database();

export async function findUserByEmail(email) {
  return db.query(
    "SELECT id, email, password_hash, created_at FROM users WHERE email = '" + email + "'",
  );
}

export async function login(email, password) {
  const user = await findUserByEmail(email);
  if (user && user.password_hash === hash(password)) {
    console.log("login success", { email, password_hash: user.password_hash });
    return user;
  }
  return null;
}

function hash(s) { return s; }
EOF

git add .
git commit -m "Refactor user lookup, add login" --quiet
HEAD_SHA=$(git rev-parse HEAD)

echo ""
echo "Planted bugs in $BASE_SHA..$HEAD_SHA:"
echo "  - SQL injection (string concat instead of parameterized query)"
echo "  - Password hash logged in plaintext on every successful login"
echo "  - hash() is the identity function (passwords stored & compared in plaintext)"
echo ""

OUTPUT_FILE="$TEST_PROJECT/claude-output.txt"

PROMPT="I just finished a refactor. The change is between commits $BASE_SHA and $HEAD_SHA on the current branch.

Use the superpowers:requesting-code-review skill to review these changes before I merge. Follow the skill exactly: dispatch the code reviewer subagent with the template, give the subagent the SHA range, and report back what it found.

Print the reviewer's full output."

# Run claude from inside the test project so its session JSONL lands in a
# project-specific directory under ~/.claude/projects/, isolated from any
# other concurrent claude sessions.
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

# Find the session transcript. Because we ran claude from $TEST_PROJECT (a
# unique tmp dir), its sessions live in their own ~/.claude/projects/ folder.
# Resolve the real path (macOS mktemp returns /var/... but claude normalizes
# it to /private/var/...) and replicate claude's normalization (every
# non-alphanumeric char becomes `-`).
TEST_PROJECT_REAL=$(cd "$TEST_PROJECT" && pwd -P)
SESSION_DIR="$HOME/.claude/projects/$(echo "$TEST_PROJECT_REAL" | sed 's|[^a-zA-Z0-9]|-|g')"
# `|| true` prevents pipefail killing the script if ls gets SIGPIPE'd by head.
SESSION_FILE=$(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null | head -1 || true)

FAILED=0

echo "=== Verification Tests ==="
echo ""

# Test 1: Skill was actually invoked, and a subagent was actually dispatched
echo "Test 1: requesting-code-review skill invoked + reviewer subagent dispatched..."
if [ -z "$SESSION_FILE" ] || [ ! -f "$SESSION_FILE" ]; then
    echo "  [FAIL] Could not locate session transcript in $SESSION_DIR"
    FAILED=$((FAILED + 1))
elif ! grep -q '"skill":"superpowers:requesting-code-review"' "$SESSION_FILE"; then
    echo "  [FAIL] requesting-code-review skill was not invoked"
    echo "         Session: $SESSION_FILE"
    FAILED=$((FAILED + 1))
elif ! grep -q '"name":"Agent"' "$SESSION_FILE"; then
    echo "  [FAIL] Skill ran but no subagent was dispatched"
    FAILED=$((FAILED + 1))
else
    echo "  [PASS] Skill invoked and subagent dispatched"
fi
echo ""

# Test 2: Reviewer caught the SQL injection
echo "Test 2: SQL injection flagged..."
if grep -qiE "sql injection|injection|string concat|parameterize|prepared statement|sanitiz" "$OUTPUT_FILE"; then
    echo "  [PASS] Reviewer flagged the SQL injection vector"
else
    echo "  [FAIL] Reviewer missed the SQL injection — most obvious planted bug"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 3: Reviewer caught the credential / password issue (either logging or no real hashing)
echo "Test 3: Credential handling issue flagged..."
if grep -qiE "password|credential|secret|plaintext|log.*hash|hash.*log|sensitive" "$OUTPUT_FILE"; then
    echo "  [PASS] Reviewer flagged a credential / password handling issue"
else
    echo "  [FAIL] Reviewer missed the password/credential issues"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Reviewer marked at least one issue as Critical or Important (not just Minor)
echo "Test 4: Severity classification..."
if grep -qiE "critical|important|severe|high.*risk|security" "$OUTPUT_FILE"; then
    echo "  [PASS] Reviewer classified findings at Critical/Important severity"
else
    echo "  [FAIL] Reviewer did not classify findings as Critical or Important"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 5: Reviewer did NOT approve the diff for merge
echo "Test 5: Reviewer verdict..."
# A correct reviewer says No or "With fixes". A broken/sycophantic reviewer says Yes/Ready.
if grep -qiE "ready to merge.*yes|approved.*for merge|^\s*yes\s*$|safe to merge" "$OUTPUT_FILE" \
   && ! grep -qiE "ready to merge.*no|with fixes|do not merge|not ready|block.*merge" "$OUTPUT_FILE"; then
    echo "  [FAIL] Reviewer approved a diff with planted Critical bugs"
    FAILED=$((FAILED + 1))
else
    echo "  [PASS] Reviewer did not approve the diff"
fi
echo ""

echo "========================================"
echo " Test Summary"
echo "========================================"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "STATUS: PASSED"
    echo "The code reviewer correctly:"
    echo "  ✓ Was dispatched via the requesting-code-review skill"
    echo "  ✓ Flagged the SQL injection"
    echo "  ✓ Flagged the credential handling issues"
    echo "  ✓ Classified findings at Critical/Important severity"
    echo "  ✓ Did not approve the diff for merge"
    exit 0
else
    echo "STATUS: FAILED"
    echo "Failed $FAILED verification tests"
    echo ""
    echo "Output saved to: $OUTPUT_FILE"
    exit 1
fi
