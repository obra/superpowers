#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGENT="$REPO_ROOT/.kiro/agents/superpowers.md"
WORKER_DEFAULT="$REPO_ROOT/.kiro/agents/superpowers-worker-default-model.md"
WORKER_LITE="$REPO_ROOT/.kiro/agents/superpowers-worker-lite-model.md"
MAPPING="$REPO_ROOT/skills/using-superpowers/references/kiro-tools.md"

fail() { echo "FAIL: $*" >&2; exit 1; }
assert_contains() {
  local file="$1" text="$2" label="$3"
  grep -Fq -- "$text" "$file" || fail "$label: missing $text"
}
assert_not_contains() {
  local file="$1" text="$2" label="$3"
  if grep -Fq -- "$text" "$file"; then
    fail "$label: unexpectedly contains $text"
  fi
}

[ -f "$AGENT" ] || fail "repository Kiro agent missing"
[ -f "$MAPPING" ] || fail "Kiro tool mapping missing"

for text in \
  'tools: ["*"]' \
  'file://skills/using-superpowers/SKILL.md' \
  'file://skills/using-superpowers/references/kiro-tools.md' \
  'skill://skills/**/SKILL.md' \
  'capability: fs_read' \
  'capability: skill' \
  'welcomeMessage: Superpowers is active.'; do
  assert_contains "$AGENT" "$text" "repository agent"
done
assert_contains "$AGENT" 'follows the loaded Superpowers bootstrap' "agent prompt"
assert_not_contains "$AGENT" 'vendor/superpowers' "upstream paths must not use the outer vendor checkout"

# Neutral workers. Superpowers skill templates dispatch a general-purpose
# subagent and supply the entire persona in the prompt, so a worker must carry
# no agenda of its own or the template's checklist and output format lose.
[ -f "$WORKER_DEFAULT" ] || fail "default-model worker agent missing"
[ -f "$WORKER_LITE" ] || fail "lite worker agent missing"

for worker in "$WORKER_DEFAULT" "$WORKER_LITE"; do
  label="worker $(basename "$worker")"
  assert_contains "$worker" 'tools: ["*"]' "$label"
  assert_contains "$worker" 'skill://skills/**/SKILL.md' "$label grants skill discovery"
  assert_contains "$worker" 'capability: fs_read' "$label pre-approves reads"
  assert_contains "$worker" 'capability: skill' "$label pre-approves skill loading"
  # Neutrality is a closed property: assert the exact body, so ANY added
  # persona fails rather than only the personas someone thought to forbid.
  for sentence in \
    'Execute the dispatching prompt exactly as given. That prompt is the complete' \
    'specification of your role, process, and output format. Add no persona, no' \
    'checklist, and no output conventions of your own.'; do
    assert_contains "$worker" "$sentence" "$label body"
  done
  # The bootstrap must not reach a worker: its mandate would compete with the
  # dispatching template, which is the defect the workers exist to fix.
  assert_not_contains "$worker" 'using-superpowers/SKILL.md' "$label must not load the bootstrap"
  assert_not_contains "$worker" 'welcomeMessage' "$label"
  # Only these frontmatter keys are permitted on a neutral worker.
  while read -r key; do
    case "$key" in
      description|tools|model|resources|permissions) ;;
      *) fail "$label: unexpected frontmatter key '$key'" ;;
    esac
  done <<EOF
$(awk '/^---$/ { n++; next } n == 1 && /^[a-zA-Z]+:/ { sub(":.*", ""); print }' "$worker")
EOF
done

assert_contains "$WORKER_LITE" 'model: claude-sonnet-5' "lite worker pins the cheaper model"
if grep -q '^model:' "$WORKER_DEFAULT"; then
  fail "default-model worker must omit model so Kiro resolves it"
fi

for text in \
  'Native `Load skill` tool' \
  'Subagent tools' \
  'Todo-list tools' \
  'Web tools' \
  '"task_description": "Explore project context"' \
  'objects using `description`' \
  'superpowers-worker-default-model' \
  'superpowers-worker-lite-model' \
  'Subagent (general-purpose)' \
  'Never substitute a purpose-built agent'; do
  assert_contains "$MAPPING" "$text" "Kiro mapping"
done
assert_not_contains "$MAPPING" '{"description":' "invalid todo payload example"
assert_not_contains "$MAPPING" 'vendor/superpowers/skills/' "mapping must describe the upstream layout"

echo "PASS: Kiro repository agent and tool mapping"
