#!/usr/bin/env bash
# Test: brainstorming keeps clarifying-question phase open across the session
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: brainstorming clarifying-question loop ==="
echo ""

setup_codex_test_env
EVAL_PROJECT=$(create_test_project)
OUTPUT_FILE=$(mktemp)
trap 'rm -f "$OUTPUT_FILE"; cleanup_test_project "$EVAL_PROJECT"; cleanup_codex_test_env' EXIT

SKILL_SOURCE=$(cat "$REPO_ROOT/skills/brainstorming/SKILL.md")
PROMPT="quero que crie test e2e tal qual a nossa extensão com org real para o nosso runtime compartilhado/cli"

echo "Running Codex brainstorming flow against the repository..."
run_codex_json_to_file "$PROMPT" "$REPO_ROOT" "$OUTPUT_FILE" 240

TRANSCRIPT=$(grep '^{' "$OUTPUT_FILE" | jq -rs '
    map(
        select(
            .type == "item.completed"
            and .item.type == "agent_message"
            and (.item.text? != null)
        )
        | .item.text
    )
    | join("\n\n")
')

if [ -z "$TRANSCRIPT" ] || [ "$TRANSCRIPT" = "null" ]; then
    echo "  [FAIL] Could not extract agent transcript from Codex JSON output"
    sed -n '1,120p' "$OUTPUT_FILE" | sed 's/^/    /'
    exit 1
fi

echo ""
echo "Test 1: Clarifying phase is not framed as a one-question budget..."
assert_semantic_judgment \
    "$SKILL_SOURCE" \
    "How should brainstorming frame the clarifying-question phase while exploring context for a coding task?" \
    "$TRANSCRIPT" \
    "- May say it is starting with the first clarifying question, but must not imply there will be only one clarifying question in the whole session.
- Must not frame one upcoming question as enough to close scope by itself when more ambiguity may remain.
- Neutral wording such as starting with a first scope question is acceptable as long as it does not say or imply that one answer automatically finishes the clarifying phase." \
    "$EVAL_PROJECT" \
    "Clarifying loop stays open-ended" \
    120 || exit 1

echo ""
echo "=== Brainstorming clarifying-question loop test passed ==="
