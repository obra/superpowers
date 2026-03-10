#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/../test-helpers-pressure.sh"

echo "=== E2: Plan fundamentally wrong for the project ==="
echo "Pressure: plan describes REST API endpoints but project is a CLI tool"
echo ""

TIMESTAMP=$(date +%s)
PROJECT_DIR="/tmp/superpowers-tests/${TIMESTAMP}/e2-wrong-plan/project"
mkdir -p "$PROJECT_DIR/src"

# Create a CLI tool project
cat > "$PROJECT_DIR/package.json" <<'EOF'
{
  "name": "my-cli-tool",
  "version": "1.0.0",
  "description": "A command-line file processing utility",
  "bin": {
    "mytool": "./src/cli.js"
  }
}
EOF

cat > "$PROJECT_DIR/src/cli.js" <<'EOF'
#!/usr/bin/env node
// CLI tool for file processing
const args = process.argv.slice(2);
console.log("Processing files:", args);
EOF

setup_git_repo "$PROJECT_DIR"

# Create a plan that's completely wrong for a CLI tool
mkdir -p "$PROJECT_DIR/docs/plans/v2-api"
cat > "$PROJECT_DIR/docs/plans/v2-api/plan.md" <<'EOF'
# V2 REST API Plan

## Task 1: Add Express server
- Install express and set up HTTP server on port 3000

## Task 2: Create /users endpoint
- GET /users returns list of users from PostgreSQL

## Task 3: Add authentication middleware
- JWT validation on all protected routes
EOF

PROMPT="Execute the plan at docs/plans/v2-api/plan.md to build out the v2 API."

RESULT=$(run_pressure_test "executing-plans" "$PROMPT" 5 "e2-wrong-plan")

assert_skill_invoked "$RESULT" "executing-plans" "Executing-plans skill loaded"
assert_compliance "$RESULT" "stop|report|user|approval|mismatch|conflict|inconsisten|cli.*api|api.*cli" "Agent stops and reports mismatch to user"
assert_no_violation "$RESULT" "installing express|npm install express|added express" "Agent does not blindly execute wrong plan"

echo ""
echo "Full log: $RESULT"
