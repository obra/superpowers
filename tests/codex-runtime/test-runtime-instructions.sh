#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

require_pattern() {
  local file="$1"
  local pattern="$2"
  if ! rg -n -F -- "$pattern" "$file" >/dev/null; then
    echo "Missing runtime instruction pattern '$pattern' in $file"
    exit 1
  fi
}

SKILL_DIRS=(
  "brainstorming"
  "document-release"
  "dispatching-parallel-agents"
  "executing-plans"
  "finishing-a-development-branch"
  "plan-ceo-review"
  "plan-eng-review"
  "qa-only"
  "receiving-code-review"
  "requesting-code-review"
  "subagent-driven-development"
  "systematic-debugging"
  "test-driven-development"
  "using-git-worktrees"
  "using-superpowers"
  "verification-before-completion"
  "writing-plans"
  "writing-skills"
)

FILES=(
  "README.md"
  ".codex/INSTALL.md"
  ".codex/agents/code-reviewer.toml"
  ".copilot/INSTALL.md"
  "RELEASE-NOTES.md"
  "docs/testing.md"
  "agents/code-reviewer.instructions.md"
  "agents/code-reviewer.md"
  "scripts/gen-agent-docs.mjs"
  "docs/README.codex.md"
  "docs/README.copilot.md"
  "skills/brainstorming/visual-companion.md"
  "skills/brainstorming/scripts/start-server.ps1"
  "skills/brainstorming/scripts/stop-server.ps1"
  "skills/brainstorming/scripts/frame-template.html"
  "skills/brainstorming/scripts/server.js"
  "skills/subagent-driven-development/code-quality-reviewer-prompt.md"
  "skills/subagent-driven-development/implementer-prompt.md"
  "skills/subagent-driven-development/spec-reviewer-prompt.md"
  "skills/using-superpowers/references/codex-tools.md"
  "skills/writing-skills/persuasion-principles.md"
  "skills/writing-skills/testing-skills-with-subagents.md"
  "skills/writing-skills/examples/AGENTS_MD_TESTING.md"
  "skills/writing-skills/codex-best-practices.md"
  "skills/writing-skills/copilot-best-practices.md"
  "VERSION"
  "bin/superpowers-config"
  "bin/superpowers-config.ps1"
  "bin/superpowers-migrate-install"
  "bin/superpowers-migrate-install.ps1"
  "bin/superpowers-pwsh-common.ps1"
  "bin/superpowers-session-entry"
  "bin/superpowers-session-entry.ps1"
  "bin/superpowers-plan-execution"
  "bin/superpowers-plan-execution.ps1"
  "bin/superpowers-update-check"
  "bin/superpowers-update-check.ps1"
  "bin/superpowers-workflow"
  "bin/superpowers-workflow.ps1"
  "bin/superpowers-workflow-status"
  "bin/superpowers-workflow-status.ps1"
  "review/review-accelerator-packet-contract.md"
  "review/TODOS-format.md"
  "review/checklist.md"
  "qa/references/issue-taxonomy.md"
  "qa/templates/qa-report-template.md"
  "skills/plan-ceo-review/accelerated-reviewer-prompt.md"
  "skills/plan-eng-review/accelerated-reviewer-prompt.md"
  "superpowers-upgrade/SKILL.md"
  "tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh"
  "tests/codex-runtime/test-superpowers-session-entry.sh"
  "tests/codex-runtime/test-superpowers-session-entry-gate.sh"
  "tests/codex-runtime/test-superpowers-migrate-install.sh"
  "tests/codex-runtime/test-superpowers-plan-execution.sh"
  "tests/codex-runtime/test-superpowers-workflow.sh"
  "tests/codex-runtime/test-superpowers-upgrade-skill.sh"
  "tests/codex-runtime/test-superpowers-workflow-status.sh"
  "tests/codex-runtime/test-workflow-enhancements.sh"
  "tests/codex-runtime/test-workflow-sequencing.sh"
  "tests/brainstorm-server/test-launch-wrappers.sh"
)

for skill in "${SKILL_DIRS[@]}"; do
  FILES+=("skills/$skill/SKILL.md")
  FILES+=("skills/$skill/SKILL.md.tmpl")
done

ACTIVE_DOC_FILES=(
  "README.md"
  ".codex/INSTALL.md"
  ".copilot/INSTALL.md"
  "docs/README.codex.md"
  "docs/README.copilot.md"
  "skills/plan-ceo-review/SKILL.md"
  "skills/plan-eng-review/SKILL.md"
  "skills/using-superpowers/SKILL.md"
  "skills/using-git-worktrees/SKILL.md"
  "skills/subagent-driven-development/SKILL.md"
  "skills/dispatching-parallel-agents/SKILL.md"
  "skills/using-superpowers/references/codex-tools.md"
)

WORKFLOW_FILES=(
  "README.md"
  "docs/README.codex.md"
  "docs/README.copilot.md"
  "skills/brainstorming/SKILL.md"
  "skills/writing-plans/SKILL.md"
  "skills/plan-ceo-review/SKILL.md"
  "skills/plan-eng-review/SKILL.md"
)

BANNED_PATTERN='claude|cursor|opencode|anthropic|CLAUDE\.md|GEMINI\.md|gemini|Skill tool|Task tool|TodoWrite|\.claude/'

missing=0
for file in "${FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing runtime file in validation set: $file"
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

if [[ -e "gemini-extension.json" || -e "GEMINI.md" ]]; then
  echo "Gemini support files should not exist in the dual-platform runtime package."
  exit 1
fi

retired_files=(
  ".claude-plugin"
  ".cursor-plugin"
  ".opencode/INSTALL.md"
  "docs/README.opencode.md"
  "docs/plans/2025-11-22-opencode-support-design.md"
  "docs/plans/2025-11-22-opencode-support-implementation.md"
  "docs/windows/polyglot-hooks.md"
  "hooks"
  "skills/brainstorming/spec-document-reviewer-prompt.md"
  "skills/writing-plans/plan-document-reviewer-prompt.md"
  "tests/explicit-skill-requests"
  "tests/skill-triggering"
  "tests/claude-code"
  "tests/opencode"
  "tests/subagent-driven-dev"
)

for file in "${retired_files[@]}"; do
  if [[ -e "$file" ]]; then
    echo "Retired prompt-template review asset should not exist: $file"
    exit 1
  fi
done

matches="$(rg -n -i "$BANNED_PATTERN" "${ACTIVE_DOC_FILES[@]}" || true)"
filtered_matches="$(printf '%s\n' "$matches" | rg -v "Legacy Claude, Cursor, and OpenCode-specific loading flows are intentionally unsupported in this runtime package\.|Legacy prompt docs such as \`CLAUDE\.md\` are intentionally unsupported in this runtime workflow\." || true)"

if [[ -n "$filtered_matches" ]]; then
  printf '%s\n' "$filtered_matches"
  echo
  echo "Found banned platform-specific terms in runtime-facing dual-platform files."
  exit 1
fi

echo "Runtime-facing dual-platform files are free of banned platform-specific terms."

legacy_review_matches="$(rg -n "spec-document-reviewer|plan-document-reviewer|User reviews spec\\?|Spec Review Loop|Plan Review Loop" "${WORKFLOW_FILES[@]}" || true)"
if [[ -n "$legacy_review_matches" ]]; then
  printf '%s\n' "$legacy_review_matches"
  echo
  echo "Found retired prompt-template review loop language in active workflow files."
  exit 1
fi

echo "Active workflow files no longer reference the retired prompt-template review loop."

windows_helper_matches="$(rg -nP 'bin\\\\superpowers-(migrate-install|config|update-check)(?!\\.ps1)' README.md .codex/INSTALL.md .copilot/INSTALL.md docs/README.codex.md docs/README.copilot.md || true)"
if [[ -n "$windows_helper_matches" ]]; then
  printf '%s\n' "$windows_helper_matches"
  echo
  echo "Windows-facing docs must invoke PowerShell helper wrappers, not the bash scripts directly."
  exit 1
fi

echo "Windows-facing docs only reference PowerShell helper wrappers for direct helper execution."

latest_release_version="$(sed -n 's/^## v\([0-9][0-9.]*\) (.*/\1/p' RELEASE-NOTES.md | head -n1)"
runtime_version="$(tr -d '[:space:]' < VERSION)"

if [[ -z "$latest_release_version" ]]; then
  echo "Could not determine the newest release version from RELEASE-NOTES.md"
  exit 1
fi

if [[ "$runtime_version" != "$latest_release_version" ]]; then
  echo "VERSION ($runtime_version) does not match the newest release-notes entry ($latest_release_version)."
  exit 1
fi

echo "VERSION matches the newest release-notes entry."

node scripts/gen-skill-docs.mjs --check
echo "Generated skill docs pass freshness validation."

node scripts/gen-agent-docs.mjs --check
echo "Generated reviewer agent artifacts pass freshness validation."

require_pattern review/review-accelerator-packet-contract.md "required packet fields"
require_pattern review/review-accelerator-packet-contract.md "fail-closed validation rule"
require_pattern review/review-accelerator-packet-contract.md "main-agent-only write authority"
require_pattern review/review-accelerator-packet-contract.md "source artifact fingerprint"
require_pattern review/review-accelerator-packet-contract.md "approved-and-applied"
require_pattern review/review-accelerator-packet-contract.md "bounded retention"

require_pattern skills/plan-ceo-review/accelerated-reviewer-prompt.md "Return a structured section packet only."
require_pattern skills/plan-ceo-review/accelerated-reviewer-prompt.md "Do not approve anything."
require_pattern skills/plan-ceo-review/accelerated-reviewer-prompt.md "Do not write files."

require_pattern skills/plan-eng-review/accelerated-reviewer-prompt.md "Respect BIG CHANGE vs SMALL CHANGE."
require_pattern skills/plan-eng-review/accelerated-reviewer-prompt.md "For SMALL CHANGE, return at most one primary issue per canonical ENG section."
require_pattern skills/plan-eng-review/accelerated-reviewer-prompt.md "Return a structured section packet only."
require_pattern skills/plan-eng-review/accelerated-reviewer-prompt.md "Do not write files or approve execution."
require_pattern skills/plan-eng-review/accelerated-reviewer-prompt.md "Escalate any high-judgment issue individually."
require_pattern docs/README.codex.md 'Accelerated review is an opt-in branch inside `plan-ceo-review` and `plan-eng-review`, not a separate workflow stage.'
require_pattern README.md 'superpowers-session-entry'
require_pattern README.md 'superpowers-repo-safety'
require_pattern README.md 'protected branches'
require_pattern README.md 'bash tests/codex-runtime/test-superpowers-session-entry.sh'
require_pattern docs/README.codex.md 'superpowers-session-entry'
require_pattern docs/README.codex.md 'superpowers-repo-safety'
require_pattern docs/README.codex.md 'protected branches'
require_pattern docs/README.copilot.md 'superpowers-session-entry'
require_pattern docs/README.copilot.md 'superpowers-repo-safety'
require_pattern docs/README.copilot.md 'protected branches'
require_pattern docs/testing.md 'bash tests/codex-runtime/test-superpowers-session-entry-gate.sh'
require_pattern docs/testing.md 'bash tests/codex-runtime/test-superpowers-session-entry.sh'
require_pattern docs/testing.md 'bash tests/codex-runtime/test-superpowers-repo-safety.sh'
require_pattern docs/testing.md 'npm ci --prefix tests/brainstorm-server'
require_pattern docs/testing.md 'protected-branch repo-write guarantees'
require_pattern docs/testing.md 'The routing gate above is complementary coverage'
require_pattern docs/testing.md 'decision resolution, explicit re-entry detection, clause/negation handling, deterministic decision paths, and invalid command input'
require_pattern docs/README.codex.md "Only the user can initiate accelerated review, and section approval plus final approval remain human-owned even when the review uses reviewer subagents and persisted section packets."
require_pattern docs/README.codex.md 'requires the `document-release` handoff before workflow-routed branch completion'
require_pattern docs/README.codex.md 'conditional `qa-only` handoff, requires it when browser interaction or test-plan context warrants it'
require_pattern docs/README.copilot.md 'Accelerated review is an opt-in branch inside `plan-ceo-review` and `plan-eng-review`, not a separate workflow stage.'
require_pattern docs/README.copilot.md "Only the user can initiate accelerated review, and section approval plus final approval remain human-owned even when the review uses reviewer subagents and persisted section packets."
require_pattern docs/README.copilot.md 'requires the `document-release` handoff before workflow-routed branch completion'
require_pattern docs/README.copilot.md 'conditional `qa-only` handoff, requires it when browser interaction or test-plan context warrants it'

if rg -n -F 'requires a required `document-release` handoff' docs/README.codex.md docs/README.copilot.md >/dev/null; then
  echo "Platform workflow docs should not duplicate the document-release requirement wording."
  exit 1
fi

if rg -n -F 'conditional `qa-only` handoff for browser-facing work' docs/README.codex.md docs/README.copilot.md >/dev/null; then
  echo "Platform workflow docs should describe the broader conditional QA gate, not only browser-facing work."
  exit 1
fi

if rg -n -F '[ "$(basename "$_REPO_ROOT")" = "superpowers" ]' skills/*/SKILL.md >/dev/null; then
  echo "Generated skills should detect the current Superpowers checkout by runtime markers, not repo basename."
  exit 1
fi

if rg -n -F 'when working inside `superpowers`' skills/*/SKILL.md >/dev/null; then
  echo "Generated upgrade guidance should not rely on the repo basename."
  exit 1
fi

if ! rg -n -F '_IS_SUPERPOWERS_RUNTIME_ROOT()' skills/using-superpowers/SKILL.md >/dev/null; then
  echo "Generated skills should include the shared runtime-root marker predicate."
  exit 1
fi

if ! rg -n -F '[[ -x "$dir/bin/superpowers-config" ]]' bin/superpowers-migrate-install >/dev/null; then
  echo "Migration helper should require superpowers-config as part of the valid install contract."
  exit 1
fi

for pattern in \
  '[[ -f "$dir/agents/code-reviewer.md" ]]' \
  '[[ -f "$dir/.codex/agents/code-reviewer.toml" ]]'; do
  if ! rg -n -F "$pattern" bin/superpowers-migrate-install >/dev/null; then
    echo "Migration helper should require reviewer agent artifacts as part of the valid install contract."
    exit 1
  fi
done

echo "Generated skills use marker-based current-repo detection."

if [[ ! -x "bin/superpowers-slug" ]]; then
  echo "Expected bin/superpowers-slug to exist and be executable."
  exit 1
fi

if rg -n -F 'multi_agent = true' \
  .codex/INSTALL.md \
  docs/README.codex.md \
  skills/using-superpowers/references/codex-tools.md \
  skills/subagent-driven-development/SKILL.md \
  skills/dispatching-parallel-agents/SKILL.md >/dev/null; then
  echo "Active Codex docs and subagent skills should not require the retired multi_agent feature flag."
  exit 1
fi

echo "Active Codex docs and subagent skills no longer require the retired multi_agent feature flag."

required_patterns=(
  "README.md:### Codex"
  "README.md:### GitHub Copilot Local Installs"
  "README.md:.codex/INSTALL.md"
  "README.md:.copilot/INSTALL.md"
  "README.md:~/.superpowers/install"
  "README.md:brainstorming -> plan-ceo-review -> writing-plans -> plan-eng-review -> implementation"
  "README.md:**plan-ceo-review** - CEO/founder-mode spec review before implementation planning"
  "README.md:**plan-eng-review** - Engineering review of the written plan before implementation"
  'README.md:Runtime state lives in `~/.superpowers/`.'
  "README.md:single shared checkout"
  "README.md:bin/superpowers-config set superpowers_contributor true"
  "README.md:bin/superpowers-migrate-install"
  "README.md:superpowers-migrate-install.ps1"
  "README.md:superpowers-config.ps1"
  'README.md:$env:TEMP'
  'README.md:Join-Path $env:TEMP "superpowers-migrate"'
  "README.md:After migrating, finish the normal platform setup:"
  'README.md:Codex: create or refresh `~/.agents/skills/superpowers`'
  'README.md:Codex: create or refresh `~/.codex/agents/code-reviewer.toml`'
  'README.md:GitHub Copilot: create or refresh `~/.copilot/skills/superpowers`'
  'README.md:GitHub Copilot: create or refresh `~/.copilot/agents/code-reviewer.agent.md`'
  "README.md:On Unix-like installs, the Codex reviewer agent is symlinked to the shared checkout."
  "README.md:On Windows, the Codex reviewer agent is copied from the shared checkout and must be refreshed after updates."
  "README.md:On Unix-like installs, the Copilot agent is symlinked to the shared checkout."
  "README.md:On Windows, the Copilot agent is copied from the shared checkout and must be refreshed after updates."
  "README.md:update_check true"
  "README.md:node scripts/gen-skill-docs.mjs --check"
  "README.md:bash tests/codex-runtime/test-runtime-instructions.sh"
  "README.md:bash tests/codex-runtime/test-workflow-sequencing.sh"
  "docs/testing.md:tests/codex-runtime/"
  "docs/testing.md:tests/brainstorm-server/"
  "docs/testing.md:bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh"
  "docs/testing.md:bash tests/codex-runtime/test-superpowers-workflow.sh"
  "docs/testing.md:bash tests/brainstorm-server/test-launch-wrappers.sh"
  "README.md:bin/superpowers-workflow"
  "README.md:bin/superpowers-workflow.ps1"
  'README.md:Use `status`, `next`, `artifacts`, `explain`, or `help`'
  "README.md:read-only workflow inspection surfaces"
  "docs/README.codex.md:bin/superpowers-workflow"
  "docs/README.codex.md:bin/superpowers-workflow.ps1"
  "docs/README.codex.md:These commands stay read-only"
  "docs/README.copilot.md:bin/superpowers-workflow"
  "docs/README.copilot.md:bin/superpowers-workflow.ps1"
  "docs/README.copilot.md:These commands stay read-only"
  "RELEASE-NOTES.md:bin/superpowers-workflow"
  "RELEASE-NOTES.md:read-only workflow inspection CLI"
  "docs/README.codex.md:brainstorming -> plan-ceo-review -> writing-plans -> plan-eng-review -> implementation"
  'docs/README.codex.md:Workspace preparation is the user'"'"'s responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management.'
  "docs/README.codex.md:Current Codex releases enable subagent workflows by default"
  "docs/README.codex.md:~/.codex/agents/code-reviewer.toml"
  "docs/README.codex.md:~/.superpowers/install/.codex/agents/code-reviewer.toml"
  'docs/README.codex.md:The `code-reviewer` custom agent is available after installation.'
  "docs/README.codex.md:.codex/agents/"
  "docs/README.codex.md:~/.codex/agents/"
  "docs/README.codex.md:[agents]"
  "docs/README.codex.md:max_threads"
  "docs/README.codex.md:max_depth"
  "docs/README.codex.md:job_max_runtime_seconds"
  'docs/README.codex.md:`default`, `worker`, and `explorer` agents'
  "docs/README.copilot.md:brainstorming -> plan-ceo-review -> writing-plans -> plan-eng-review -> implementation"
  'docs/README.copilot.md:Workspace preparation is the user'"'"'s responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management.'
  "skills/brainstorming/SKILL.md:## Preamble (run first)"
  'skills/brainstorming/SKILL.md:8. **Automatic spec review handoff** — invoke `superpowers:plan-ceo-review` after writing the spec'
  'skills/brainstorming/SKILL.md:**Workflow State:** Draft'
  "skills/brainstorming/SKILL.md:**The terminal state is invoking plan-ceo-review.**"
  "skills/writing-plans/SKILL.md:## Preamble (run first)"
  "skills/writing-plans/SKILL.md:Use when you have a CEO-approved Superpowers spec for a multi-step task and need to write the implementation plan before touching code"
  "skills/writing-plans/SKILL.md:## Plan Review Handoff"
  'skills/writing-plans/SKILL.md:If the spec is missing these lines, or if `**Workflow State:**` is not `CEO Approved`, stop and direct the agent to `superpowers:plan-ceo-review`.'
  'skills/writing-plans/SKILL.md:Invoke `superpowers:plan-eng-review` after saving the full plan.'
  "skills/writing-plans/SKILL.md:**The terminal state is invoking plan-eng-review.**"
  "skills/plan-ceo-review/SKILL.md:docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md"
  'skills/plan-ceo-review/SKILL.md:**Workflow State:** Draft | CEO Approved'
  "skills/plan-ceo-review/SKILL.md:_TODOS_FORMAT"
  'skills/plan-ceo-review/SKILL.md:If no current spec exists, stop and direct the agent back to `superpowers:brainstorming`.'
  'skills/plan-ceo-review/SKILL.md:When the review is resolved and the written spec is approved, invoke `superpowers:writing-plans`.'
  'skills/plan-ceo-review/SKILL.md:Do not draft a plan or offer implementation options from `plan-ceo-review`.'
  'skills/plan-ceo-review/SKILL.md:**The terminal state is invoking writing-plans.**'
  'skills/plan-ceo-review/SKILL.md:AGENTS.override.md'
  "skills/plan-ceo-review/SKILL.md:.github/copilot-instructions.md"
  "skills/plan-ceo-review/SKILL.md:.github/instructions/*.instructions.md"
  "skills/plan-eng-review/SKILL.md:docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md"
  "skills/plan-eng-review/SKILL.md:Use when a written Superpowers implementation plan from a CEO-approved spec needs engineering review before execution"
  'skills/plan-eng-review/SKILL.md:**Workflow State:** Draft | Engineering Approved'
  "skills/plan-eng-review/SKILL.md:_TODOS_FORMAT"
  'skills/plan-eng-review/SKILL.md:If no current plan exists, stop and direct the agent back to `superpowers:writing-plans`.'
  "skills/plan-eng-review/SKILL.md:When the review is resolved and the written plan is approved, present the normal execution handoff."
  'skills/plan-eng-review/SKILL.md:Do not start implementation inside `plan-eng-review`.'
  'skills/plan-eng-review/SKILL.md:**The terminal state is presenting the execution handoff with the approved plan path.**'
  "skills/plan-eng-review/SKILL.md:AGENTS.override.md"
  "skills/plan-eng-review/SKILL.md:.github/copilot-instructions.md"
  "skills/plan-eng-review/SKILL.md:.github/instructions/*.instructions.md"
  "skills/using-superpowers/SKILL.md:GitHub Copilot local installs"
  "skills/using-superpowers/SKILL.md:## Preamble (run first)"
  "skills/using-superpowers/SKILL.md:_IS_SUPERPOWERS_RUNTIME_ROOT()"
  "skills/using-superpowers/SKILL.md:\$HOME/.superpowers/install"
  "skills/using-superpowers/SKILL.md:ask one interactive question before any normal Superpowers work happens"
  "skills/using-superpowers/SKILL.md:~/.superpowers/session-flags/using-superpowers/\$PPID"
  'skills/using-superpowers/SKILL.md:do not compute `_SESSIONS`'
  "skills/using-superpowers/SKILL.md:If the session decision file exists but contains malformed content:"
  "skills/using-superpowers/SKILL.md:if the user explicitly requests Superpowers or explicitly names a Superpowers skill, rewrite the session decision to \`enabled\` and continue on the same turn"
  "skills/using-superpowers/SKILL.md:If the user explicitly requests re-entry but the bootstrap cannot rewrite the session decision to \`enabled\`:"
  'skills/using-superpowers/SKILL.md:## Normal Superpowers Stack'
  'skills/using-superpowers/SKILL.md:If the bypass gate resolves to `enabled` for this turn, run the normal shared Superpowers stack before any further Superpowers behavior:'
  'skills/using-superpowers/SKILL.md:_UPD=""'
  'skills/using-superpowers/SKILL.md:_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d '\'' '\'')'
  'skills/using-superpowers/SKILL.md:_CONTRIB=""'
  "skills/using-superpowers/SKILL.md:then follow the artifact-state workflow: plan-ceo-review -> writing-plans -> plan-eng-review -> execution."
  "skills/using-superpowers/SKILL.md:## Superpowers Workflow Router"
  "skills/using-superpowers/SKILL.md:Do NOT jump from brainstorming straight to implementation. For workflow-routed work, every stage owns the handoff into the next one."
  "skills/using-superpowers/SKILL.md:Legacy Claude, Cursor, and OpenCode-specific loading flows are intentionally unsupported in this runtime package."
  "skills/using-superpowers/references/codex-tools.md:~/.copilot/skills/"
  "skills/using-git-worktrees/SKILL.md:## Preamble (run first)"
  "skills/using-git-worktrees/SKILL.md:.github/copilot-instructions.md"
  'skills/using-git-worktrees/SKILL.md:Legacy prompt docs such as `CLAUDE.md` are intentionally unsupported in this runtime workflow.'
  "skills/writing-skills/SKILL.md:## Preamble (run first)"
  "skills/writing-skills/SKILL.md:~/.copilot/skills/"
  ".copilot/INSTALL.md:~/.copilot/skills/superpowers"
  ".copilot/INSTALL.md:~/.copilot/agents/code-reviewer.agent.md"
  ".copilot/INSTALL.md:~/.superpowers/install/skills"
  ".copilot/INSTALL.md:~/.superpowers/install/agents/code-reviewer.md"
  '.copilot/INSTALL.md:Runtime helper state lives in `~/.superpowers/`'
  ".copilot/INSTALL.md:bin/superpowers-migrate-install"
  ".copilot/INSTALL.md:superpowers-migrate-install.ps1"
  ".copilot/INSTALL.md:superpowers-config.ps1"
  '.copilot/INSTALL.md:$env:TEMP'
  '.copilot/INSTALL.md:Join-Path $env:TEMP "superpowers-migrate"'
  ".copilot/INSTALL.md:Migration only consolidates the checkout."
  ".copilot/INSTALL.md:After migrating, continue with steps 2 and 3"
  ".copilot/INSTALL.md:Use a junction for the skills directory and copy the agent file into Copilot's agent directory:"
  '.copilot/INSTALL.md:Copy-Item "$env:USERPROFILE\.superpowers\install\agents\code-reviewer.md" "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md" -Force'
  ".copilot/INSTALL.md:If you copied the agent file on Windows, copy ~/.superpowers/install/agents/code-reviewer.md into ~/.copilot/agents/code-reviewer.agent.md again after updating."
  '.copilot/INSTALL.md:Get-Item "$env:USERPROFILE\.copilot\skills\superpowers"'
  '.copilot/INSTALL.md:Get-Item "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md"'
  '.copilot/INSTALL.md:Remove-Item "$env:USERPROFILE\.copilot\skills\superpowers"'
  '.copilot/INSTALL.md:Remove-Item "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md"'
  '.copilot/INSTALL.md:Remove-Item -Recurse -Force "$env:USERPROFILE\.superpowers\install"'
  ".copilot/INSTALL.md:bin/superpowers-config set superpowers_contributor true"
  ".copilot/INSTALL.md:update_check true"
  "docs/README.copilot.md:~/.copilot/skills/superpowers"
  "docs/README.copilot.md:~/.copilot/agents/code-reviewer.agent.md"
  "docs/README.copilot.md:~/.superpowers/install/skills"
  "docs/README.copilot.md:~/.superpowers/install/agents/code-reviewer.md"
  "docs/README.copilot.md:superpowers-migrate-install.ps1"
  "docs/README.copilot.md:superpowers-config.ps1"
  "docs/README.copilot.md:Migration only consolidates the checkout."
  "docs/README.copilot.md:After migrating, continue with steps 2 and 3"
  'docs/README.copilot.md:Get-Item "$env:USERPROFILE\.copilot\skills\superpowers"'
  'docs/README.copilot.md:Get-Item "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md"'
  'docs/README.copilot.md:copy ~/.superpowers/install/agents/code-reviewer.md to ~/.copilot/agents/code-reviewer.agent.md'
  "docs/README.copilot.md:On Unix-like installs, the Copilot agent is symlinked to the shared checkout."
  "docs/README.copilot.md:On Windows, the Copilot agent is copied from the shared checkout and must be refreshed after updates."
  ".codex/INSTALL.md:~/.superpowers/install/skills"
  ".codex/INSTALL.md:~/.codex/agents/code-reviewer.toml"
  ".codex/INSTALL.md:~/.superpowers/install/.codex/agents/code-reviewer.toml"
  '.codex/INSTALL.md:The `code-reviewer` custom agent is installed alongside the skills.'
  ".codex/INSTALL.md:Current Codex releases enable subagent workflows by default."
  '.codex/INSTALL.md:`default`, `worker`, and `explorer` agents'
  ".codex/INSTALL.md:.codex/agents/"
  ".codex/INSTALL.md:~/.codex/agents/"
  ".codex/INSTALL.md:[agents]"
  ".codex/INSTALL.md:max_threads"
  ".codex/INSTALL.md:max_depth"
  ".codex/INSTALL.md:job_max_runtime_seconds"
  '.codex/INSTALL.md:Runtime helper state lives in `~/.superpowers/`'
  ".codex/INSTALL.md:bin/superpowers-migrate-install"
  ".codex/INSTALL.md:superpowers-migrate-install.ps1"
  ".codex/INSTALL.md:superpowers-config.ps1"
  '.codex/INSTALL.md:$env:TEMP'
  '.codex/INSTALL.md:Join-Path $env:TEMP "superpowers-migrate"'
  ".codex/INSTALL.md:Migration only consolidates the checkout."
  ".codex/INSTALL.md:After migrating, continue with steps 2 and 3"
  '.codex/INSTALL.md:Get-Item "$env:USERPROFILE\.agents\skills\superpowers"'
  '.codex/INSTALL.md:Get-Item "$env:USERPROFILE\.codex\agents\code-reviewer.toml"'
  '.codex/INSTALL.md:Remove-Item "$env:USERPROFILE\.agents\skills\superpowers"'
  '.codex/INSTALL.md:Remove-Item "$env:USERPROFILE\.codex\agents\code-reviewer.toml"'
  '.codex/INSTALL.md:Remove-Item -Recurse -Force "$env:USERPROFILE\.superpowers\install"'
  ".codex/INSTALL.md:bin/superpowers-config set superpowers_contributor true"
  ".codex/INSTALL.md:update_check true"
  "docs/README.codex.md:~/.superpowers/install/skills"
  "docs/README.codex.md:superpowers-migrate-install.ps1"
  "docs/README.codex.md:superpowers-config.ps1"
  'docs/README.codex.md:$env:TEMP'
  'docs/README.codex.md:Join-Path $env:TEMP "superpowers-migrate"'
  "docs/README.codex.md:Migration only consolidates the checkout."
  "docs/README.codex.md:After migrating, continue with steps 2 and 3"
  'docs/README.codex.md:Get-Item "$env:USERPROFILE\.agents\skills\superpowers"'
  'docs/README.codex.md:Get-Item "$env:USERPROFILE\.codex\agents\code-reviewer.toml"'
  "docs/README.codex.md:rm ~/.codex/agents/code-reviewer.toml"
  'docs/README.codex.md:Remove-Item "$env:USERPROFILE\.codex\agents\code-reviewer.toml"'
  'docs/README.copilot.md:$env:TEMP'
  'docs/README.copilot.md:Join-Path $env:TEMP "superpowers-migrate"'
  "skills/subagent-driven-development/SKILL.md:Current Codex releases enable subagent workflows by default"
  'skills/subagent-driven-development/SKILL.md:built-in `worker` agent'
  'skills/subagent-driven-development/SKILL.md:built-in `explorer` agent'
  'skills/subagent-driven-development/SKILL.md:Superpowers installs a `code-reviewer` custom agent for Codex review passes.'
  "skills/subagent-driven-development/SKILL.md:.codex/agents/*.toml"
  "skills/subagent-driven-development/SKILL.md:**Codex role mapping:**"
  'skills/requesting-code-review/SKILL.md:In Codex, Superpowers installs the `code-reviewer` custom agent alongside the shared skills checkout.'
  "skills/dispatching-parallel-agents/SKILL.md:Current Codex releases enable subagent workflows by default."
  'skills/dispatching-parallel-agents/SKILL.md:built-in `explorer` agent'
  'skills/dispatching-parallel-agents/SKILL.md:built-in `worker` agent'
  "skills/dispatching-parallel-agents/SKILL.md:.codex/agents/*.toml"
  "skills/using-superpowers/references/codex-tools.md:Current Codex releases enable subagent workflows by default."
  'skills/using-superpowers/references/codex-tools.md:`default` - General-purpose fallback'
  'skills/using-superpowers/references/codex-tools.md:`worker` - Execution-focused implementation and fix work'
  'skills/using-superpowers/references/codex-tools.md:`explorer` - Read-heavy codebase exploration and review work'
  "skills/using-superpowers/references/codex-tools.md:.codex/agents/*.toml"
  "skills/using-superpowers/references/codex-tools.md:~/.codex/agents/*.toml"
  "skills/using-superpowers/references/codex-tools.md:[agents]"
  "skills/using-superpowers/references/codex-tools.md:max_threads"
  "skills/using-superpowers/references/codex-tools.md:max_depth"
  "skills/using-superpowers/references/codex-tools.md:job_max_runtime_seconds"
  'skills/using-superpowers/references/codex-tools.md:Superpowers installs its `code-reviewer` custom agent to `~/.codex/agents/code-reviewer.toml`.'
  "skills/brainstorming/visual-companion.md:start-server.ps1"
  "skills/brainstorming/visual-companion.md:stop-server.ps1"
  "skills/brainstorming/visual-companion.md:PowerShell"
  'skills/brainstorming/visual-companion.md:restart it with `scripts/start-server.sh` on Unix-like shells or `scripts/start-server.ps1` from PowerShell before continuing.'
  "RELEASE-NOTES.md:## v5.1.0 (2026-03-16)"
  "RELEASE-NOTES.md:Generated skill preambles for all 16 Superpowers skills"
  "RELEASE-NOTES.md:superpowers-config"
  "RELEASE-NOTES.md:superpowers-migrate-install"
  "RELEASE-NOTES.md:superpowers-update-check"
  "README.md:agents/code-reviewer.instructions.md"
  "README.md:.codex/agents/code-reviewer.toml"
  "README.md:agents/code-reviewer.md"
)

for entry in "${required_patterns[@]}"; do
  file="${entry%%:*}"
  pattern="${entry#*:}"
  if ! rg -n -F "$pattern" "$file" >/dev/null; then
    echo "Missing required dual-platform pattern '$pattern' in $file"
    exit 1
  fi
done

if rg -n -i 'claude|opencode|plugin-dir|Skill tool|Task tool|TodoWrite' docs/testing.md >/dev/null; then
  echo "docs/testing.md still references unsupported legacy runtime instructions."
  exit 1
fi

echo "docs/testing.md only references supported validation surfaces."

echo "Dual-platform runtime, install docs, and release notes contain the required runtime-contract references."

extract_bash_block() {
  local heading="$1"
  local file="$2"
  awk -v heading="$heading" '
    $0 == heading { in_heading = 1; next }
    in_heading && /^```bash$/ { in_block = 1; next }
    in_block && /^```$/ { exit }
    in_block { print }
  ' "$file"
}

make_runtime_root() {
  local dir="$1"
  mkdir -p "$dir/bin"
  printf '#!/usr/bin/env bash\nexit 0\n' > "$dir/bin/superpowers-update-check"
  chmod +x "$dir/bin/superpowers-update-check"
  printf '#!/usr/bin/env bash\nif [[ "${1:-}" == "get" ]]; then\n  exit 0\nfi\nexit 0\n' > "$dir/bin/superpowers-config"
  chmod +x "$dir/bin/superpowers-config"
  printf '5.1.0\n' > "$dir/VERSION"
}

make_runtime_repo() {
  local dir="$1"
  git init "$dir" >/dev/null 2>&1
  make_runtime_root "$dir"
}

run_generated_preamble() {
  local cwd="$1"
  local home_dir="$2"
  local preamble
  preamble="$(extract_bash_block '## Preamble (run first)' 'skills/using-superpowers/SKILL.md')"
  (
    cd "$cwd"
    HOME="$home_dir" \
    bash -euo pipefail -c "$preamble"$'\n''printf "SUPERPOWERS_ROOT=%s\n" "$_SUPERPOWERS_ROOT"'
  )
}

tmp_root="$(mktemp -d)"
trap 'rm -rf "$tmp_root"' EXIT

shared_home="$tmp_root/shared-home"
mkdir -p "$shared_home/.superpowers"
make_runtime_root "$shared_home/.superpowers/install"
renamed_repo="$tmp_root/runtime-dev-checkout"
make_runtime_repo "$renamed_repo"
renamed_repo_resolved="$(cd "$renamed_repo" && pwd -P)"
shared_output="$(run_generated_preamble "$renamed_repo" "$shared_home")"
if [[ "$shared_output" != *"SUPERPOWERS_ROOT=$renamed_repo_resolved"* ]]; then
  echo "Expected a valid current repo with a non-superpowers basename to beat the shared install."
  printf '%s\n' "$shared_output"
  exit 1
fi

invalid_home="$tmp_root/invalid-home"
mkdir -p "$invalid_home/.superpowers"
make_runtime_root "$invalid_home/.superpowers/install"
invalid_repo="$tmp_root/not-a-runtime"
git init "$invalid_repo" >/dev/null 2>&1
invalid_output="$(run_generated_preamble "$invalid_repo" "$invalid_home")"
shared_install_resolved="$invalid_home/.superpowers/install"
if [[ "$invalid_output" != *"SUPERPOWERS_ROOT=$shared_install_resolved"* ]]; then
  echo "Expected an invalid current repo to fall back to the shared install root."
  printf '%s\n' "$invalid_output"
  exit 1
fi

legacy_home="$tmp_root/legacy-home"
mkdir -p "$legacy_home/.superpowers" "$legacy_home/.codex" "$legacy_home/.copilot"
make_runtime_root "$legacy_home/.superpowers/install"
make_runtime_root "$legacy_home/.codex/superpowers"
make_runtime_root "$legacy_home/.copilot/superpowers"
legacy_repo="$tmp_root/renamed-active-runtime"
make_runtime_repo "$legacy_repo"
legacy_repo_resolved="$(cd "$legacy_repo" && pwd -P)"
legacy_output="$(run_generated_preamble "$legacy_repo" "$legacy_home")"
if [[ "$legacy_output" != *"SUPERPOWERS_ROOT=$legacy_repo_resolved"* ]]; then
  echo "Expected a valid current repo to beat shared and legacy fallback installs."
  printf '%s\n' "$legacy_output"
  exit 1
fi

echo "Generated preamble root-detection regression checks passed."

template_patterns=(
  "skills/requesting-code-review/SKILL.md:code-reviewer.md"
  "skills/requesting-code-review/SKILL.md:See template at: code-reviewer.md"
  "skills/subagent-driven-development/code-quality-reviewer-prompt.md:../requesting-code-review/code-reviewer.md"
)

for entry in "${template_patterns[@]}"; do
  file="${entry%%:*}"
  pattern="${entry#*:}"
  if ! rg -n -F "$pattern" "$file" >/dev/null; then
    echo "Missing code-review template pattern '$pattern' in $file"
    exit 1
  fi
done

if ! rg -n -F '{PLAN_OR_REQUIREMENTS}' skills/requesting-code-review/code-reviewer.md >/dev/null; then
  echo "The code-review template should use the PLAN_OR_REQUIREMENTS placeholder."
  exit 1
fi

if rg -n -F '{PLAN_REFERENCE}' skills/requesting-code-review/code-reviewer.md >/dev/null; then
  echo "The code-review template should not reference the legacy PLAN_REFERENCE placeholder."
  exit 1
fi

if rg -n -F 'skills/requesting-code-review/code-reviewer.md' skills/subagent-driven-development/code-quality-reviewer-prompt.md >/dev/null; then
  echo "SDD review prompts should use a skill-relative path to the code-review template, not a repo-root path."
  exit 1
fi

if rg -n -F '`skills/brainstorming/visual-companion.md`' skills/brainstorming/SKILL.md >/dev/null; then
  echo "Brainstorming should reference visual-companion.md relative to the skill, not via a repo-root path."
  exit 1
fi

echo "Code-review workflows reference the placeholder review template, not the custom-agent manifest."

if ! rg -n -F 'Then: Keep the branch and worktree for follow-up until the PR is merged.' skills/finishing-a-development-branch/SKILL.md >/dev/null; then
  echo "finishing-a-development-branch should keep the worktree for PR follow-up in Option B."
  exit 1
fi

if rg -n -F '#### Option B: Push and Create PR' -A 20 skills/finishing-a-development-branch/SKILL.md | rg -n -F 'Then: Cleanup worktree (Step 5)' >/dev/null; then
  echo "finishing-a-development-branch should not clean up the worktree immediately after creating a PR."
  exit 1
fi

for pattern in \
  'skills/finishing-a-development-branch/SKILL.md:**For Options A and D:**' \
  'skills/finishing-a-development-branch/SKILL.md:| B. Create PR | - | ✓ | ✓ | - |' \
  'skills/finishing-a-development-branch/SKILL.md:- **Fix:** Only cleanup for Options A and D' \
  'skills/finishing-a-development-branch/SKILL.md:- Clean up worktree for Options A & D only'; do
  file="${pattern%%:*}"
  needle="${pattern#*:}"
  if ! rg -n -F -- "$needle" "$file" >/dev/null; then
    echo "Missing finishing-a-development-branch worktree contract pattern '$needle' in $file"
    exit 1
  fi
done

for pattern in \
  'skills/executing-plans/SKILL.md:Use when you have an engineering-approved Superpowers implementation plan and need to execute it in a separate session' \
  'skills/executing-plans/SKILL.md:Use this skill when implementation should happen in a separate session.' \
  'skills/executing-plans/SKILL.md:**REQUIRED SUB-SKILL:** Use `superpowers:requesting-code-review`' \
  'skills/executing-plans/SKILL.md:After the final review is resolved:' \
  'skills/finishing-a-development-branch/SKILL.md:- **subagent-driven-development** - After the final review passes and all tasks are complete' \
  'skills/finishing-a-development-branch/SKILL.md:- **executing-plans** - After the final review is resolved and all tasks are complete' \
  'skills/subagent-driven-development/SKILL.md:Use when executing an engineering-approved Superpowers implementation plan with mostly independent tasks in the current session' \
  'skills/subagent-driven-development/SKILL.md:**vs. Executing Plans (parallel session):**' \
  'skills/subagent-driven-development/SKILL.md:- **superpowers:executing-plans** - Use for parallel session instead of same-session execution' \
  'skills/subagent-driven-development/SKILL.md:[Invoke superpowers:finishing-a-development-branch]' \
  'README.md:Implementation starts from an engineering-approved current plan and the exact approved plan path. `plan-eng-review` presents that handoff, and `superpowers-plan-execution recommend --plan <approved-plan-path>` chooses between *subagent-driven-development* and *executing-plans*. In both cases, execution runs a workspace-readiness preflight, executes the plan task by task, reviews before completion, and hands off through the normal branch-finishing flow.' \
  'docs/README.codex.md:During implementation, either `subagent-driven-development` or `executing-plans` starts from an engineering-approved current plan, runs a workspace-readiness preflight, and then drives task execution.' \
  'docs/README.copilot.md:During implementation, either `subagent-driven-development` or `executing-plans` starts from an engineering-approved current plan, runs a workspace-readiness preflight, and then drives task execution.' \
  'README.md:- **requesting-code-review** - Code-review dispatch and triage'; do
  file="${pattern%%:*}"
  needle="${pattern#*:}"
  if ! rg -n -F -- "$needle" "$file" >/dev/null; then
    echo "Missing executing-plans cross-skill contract pattern '$needle' in $file"
    exit 1
  fi
done

for pattern in \
  'skills/finishing-a-development-branch/SKILL.md:Ask one interactive user question using the required format.' \
  'skills/finishing-a-development-branch/SKILL.md:If the merge-base result is ambiguous, ask one interactive user question using the required format:' \
  'skills/finishing-a-development-branch/SKILL.md:A) Merge back to <base-branch> locally' \
  'skills/finishing-a-development-branch/SKILL.md:Recommend `B)` when a normal PR flow is available and the user has not signaled a different preference' \
  'skills/using-git-worktrees/SKILL.md:ask one interactive user question using the required format.' \
  'skills/using-git-worktrees/SKILL.md:Recommend `A)` `.worktrees/` by default because it keeps the worktree close to the project and matches the preferred local layout' \
  'skills/using-git-worktrees/SKILL.md:- `A)` `.worktrees/` (project-local, hidden)' \
  'skills/using-git-worktrees/SKILL.md:- `B)` `~/.config/superpowers/worktrees/<project-name>/` (global location)'; do
  file="${pattern%%:*}"
  needle="${pattern#*:}"
  if ! rg -n -F -- "$needle" "$file" >/dev/null; then
    echo "Missing interactive-question contract pattern '$needle' in $file"
    exit 1
  fi
done

review_line=$(rg -n -F '**REQUIRED SUB-SKILL:** Use `superpowers:requesting-code-review`' skills/executing-plans/SKILL.md | cut -d: -f1 | head -n1)
finish_line=$(rg -n -F '**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch' skills/executing-plans/SKILL.md | cut -d: -f1 | head -n1)
if [[ -z "$review_line" || -z "$finish_line" || "$review_line" -ge "$finish_line" ]]; then
  echo "executing-plans should require requesting-code-review before finishing-a-development-branch."
  exit 1
fi

for stale in \
  'Review after each batch (3 tasks)' \
  'Batch execution with checkpoints' \
  'executing-plans** (Step 5)' \
  'subagent-driven-development** (Step 7)' \
  'with review checkpoints' \
  'with checkpoints' \
  "Don't add explanation" \
  'Which option?' \
  'This branch split from main - is that correct?' \
  'No worktree directory found. Where should I create worktrees?' \
  'launches a *subagent-driven-development* process' \
  'Pre-review checklist' \
  'created by brainstorming skill' \
  'During implementation, `using-git-worktrees` prepares the isolated workspace' \
  '- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting' \
  '1. .worktrees/ (project-local, hidden)' \
  '2. ~/.config/superpowers/worktrees/<project-name>/ (global location)'; do
  if rg -n -F -- "$stale" README.md skills/executing-plans/SKILL.md skills/executing-plans/SKILL.md.tmpl skills/requesting-code-review/SKILL.md skills/requesting-code-review/SKILL.md.tmpl skills/finishing-a-development-branch/SKILL.md skills/finishing-a-development-branch/SKILL.md.tmpl skills/using-git-worktrees/SKILL.md skills/using-git-worktrees/SKILL.md.tmpl >/dev/null; then
    echo "Found stale executing-plans workflow text '$stale' in active runtime surfaces."
    exit 1
  fi
done

if rg -n -F 'Done!' skills/subagent-driven-development/SKILL.md >/dev/null; then
  echo "subagent-driven-development example should hand off to finishing-a-development-branch instead of ending at reviewer approval."
  exit 1
fi

if rg -n -F '**brainstorming** (Phase 4) - REQUIRED when design is approved and implementation follows' skills/using-git-worktrees/SKILL.md >/dev/null; then
  echo "using-git-worktrees should not claim direct invocation from brainstorming."
  exit 1
fi

if ! rg -n -F 'name = "code-reviewer"' .codex/agents/code-reviewer.toml >/dev/null; then
  echo "Codex reviewer agent manifest should define the public agent name code-reviewer."
  exit 1
fi

if ! rg -n -F 'developer_instructions = """' .codex/agents/code-reviewer.toml >/dev/null; then
  echo "Codex reviewer agent manifest should define developer_instructions."
  exit 1
fi

for reviewer_file in agents/code-reviewer.instructions.md agents/code-reviewer.md .codex/agents/code-reviewer.toml; do
  if ! rg -n -F 'Critical (must fix), Important (should fix), or Minor (nice to have)' "$reviewer_file" >/dev/null; then
    echo "Reviewer instruction file $reviewer_file should use the Critical/Important/Minor severity taxonomy."
    exit 1
  fi
  if ! rg -n -F '1-2 targeted checks' "$reviewer_file" >/dev/null; then
    echo "Reviewer instruction file $reviewer_file should bound Search-Before-Building checks."
    exit 1
  fi
  if ! rg -n -F 'official documentation' "$reviewer_file" >/dev/null; then
    echo "Reviewer instruction file $reviewer_file should mention official documentation."
    exit 1
  fi
  if ! rg -n -F 'issue trackers or maintainer guidance' "$reviewer_file" >/dev/null; then
    echo "Reviewer instruction file $reviewer_file should mention issue trackers or maintainer guidance."
    exit 1
  fi
  if ! rg -n -F 'primary-source technical references' "$reviewer_file" >/dev/null; then
    echo "Reviewer instruction file $reviewer_file should prioritize primary-source technical references."
    exit 1
  fi
  if ! rg -n -F 'anchored in the actual diff' "$reviewer_file" >/dev/null; then
    echo "Reviewer instruction file $reviewer_file should keep findings grounded in the diff."
    exit 1
  fi
  if ! rg -n -F 'file:line' "$reviewer_file" >/dev/null; then
    echo "Reviewer instruction file $reviewer_file should require file:line evidence."
    exit 1
  fi
done

if rg -n -F 'Suggestions (nice to have)' agents/code-reviewer.instructions.md agents/code-reviewer.md .codex/agents/code-reviewer.toml >/dev/null; then
  echo "Reviewer instruction files should not use the old Suggestions severity label."
  exit 1
fi

if rg -n -F 'rerun step 3 after updating' .copilot/INSTALL.md docs/README.copilot.md README.md >/dev/null; then
  echo "Windows Copilot update guidance should explicitly describe refreshing the copied agent file, not a step-number reference."
  exit 1
fi

echo "Cross-platform reviewer agent artifacts and copied-agent wording are correct."

if ! rg -n -F 'bash tests/codex-runtime/test-superpowers-plan-execution.sh' docs/testing.md >/dev/null; then
  echo "docs/testing.md should include the plan-execution helper regression in the recommended validation order."
  exit 1
fi

if ! rg -n -F 'bash tests/codex-runtime/test-superpowers-slug.sh' docs/testing.md >/dev/null; then
  echo "docs/testing.md should include the slug helper regression in the recommended validation order."
  exit 1
fi

if ! rg -n -F 'bash tests/codex-runtime/test-using-superpowers-bypass.sh' docs/testing.md >/dev/null; then
  echo "docs/testing.md should include the using-superpowers bypass regression in the recommended validation order."
  exit 1
fi

if ! rg -n -F 'deterministic wording gate for the pre-routing session-entry contract and decision-path surface' docs/testing.md >/dev/null; then
  echo "docs/testing.md should describe test-using-superpowers-bypass.sh as the deterministic wording gate for the pre-routing session-entry contract and decision-path surface."
  exit 1
fi

if ! rg -n -F 'cover most sequencing-contract cases, while a small number of assertions still intentionally pin checked-in repo docs' docs/testing.md >/dev/null; then
  echo "docs/testing.md should be explicit that sequencing coverage still includes a small number of checked-in repo-doc assertions."
  exit 1
fi

if ! rg -n -F 'including repo-root workflow diagrams and platform workflow summaries' docs/testing.md >/dev/null; then
  echo "docs/testing.md should describe test-runtime-instructions.sh as covering repo-root workflow diagrams and platform workflow summaries too."
  exit 1
fi

if ! rg -n -F 'imported review, QA, document-release, and branch-completion workflow contracts' docs/testing.md >/dev/null; then
  echo "docs/testing.md should describe test-workflow-enhancements.sh as covering the broader branch-completion workflow contracts."
  exit 1
fi

if ! rg -n -F 'same-revision stale source-spec path rejection' docs/testing.md >/dev/null; then
  echo "docs/testing.md should describe test-superpowers-plan-execution.sh as covering same-revision stale source-spec path rejection."
  exit 1
fi

if ! rg -n -F 'same-revision stale source-spec path detection' docs/testing.md >/dev/null; then
  echo "docs/testing.md should describe test-superpowers-workflow-status.sh as covering same-revision stale source-spec path detection."
  exit 1
fi

if ! rg -n -F 'fixture-backed stage gates' docs/testing.md >/dev/null; then
  echo "docs/testing.md should describe test-workflow-sequencing.sh as fixture-backed stage-gate coverage, not behavioral stale-path detection."
  exit 1
fi

if ! rg -n -F 'node --test tests/brainstorm-server/server.test.js tests/brainstorm-server/ws-protocol.test.js' docs/testing.md >/dev/null; then
  echo "docs/testing.md should document the full brainstorm-server node test command, not only npm test."
  exit 1
fi

if ! rg -n -F 'three primary automated validation surfaces plus opt-in or change-specific eval gates' docs/testing.md >/dev/null; then
  echo "docs/testing.md should distinguish the primary deterministic suites from the opt-in or change-specific eval gates."
  exit 1
fi

if ! rg -n -F 'This gate is agent-executed and does not run through `node --test` or the Node OpenAI-judge helper path.' docs/testing.md >/dev/null; then
  echo "docs/testing.md should distinguish the agent-executed routing gate from the Node eval helper path."
  exit 1
fi

if ! rg -n -F 'It is not part of the default deterministic validation order, but it is a required change-specific gate for Item 1 routing-safety work.' docs/testing.md >/dev/null; then
  echo "docs/testing.md should describe the routing gate as change-specific required coverage, not a generic optional eval."
  exit 1
fi

if ! rg -n -F 'the `using-superpowers` routing gate, which remains a required change-specific gate for Item 1 routing-safety work' tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should distinguish the required routing gate from the opt-in Node-based evals."
  exit 1
fi

if ! rg -n -F 'BYPASS_GATE["superpowers-session-entry runtime bootstrap' README.md >/dev/null; then
  echo "README.md should show the runtime-owned superpowers-session-entry bootstrap before the normal Superpowers stack."
  exit 1
fi

if ! rg -n -F 'BYPASS_GATE -->|enabled| PREAMBLE["Generated skill preamble' README.md >/dev/null; then
  echo "README.md should route into the generated preamble only after the bypass gate resolves to enabled."
  exit 1
fi

if ! rg -n -F 'Set these environment variables when you want the Node-based `.eval.mjs` tests to execute instead of skip:' tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should explain that the Node-based eval env vars control whether the evals execute instead of skip."
  exit 1
fi

if ! rg -n -F 'Optional environment for the Node-based `.eval.mjs` tests:' tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should scope the optional env vars to the Node-based evals."
  exit 1
fi

if ! rg -n -F 'the routing gate does not use `tests/evals/helpers/openai-judge.mjs`' tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should state that the routing gate is not driven by the Node OpenAI judge helper."
  exit 1
fi

if ! rg -n -F 'Search-Before-Building eval note:' tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should give Search-Before-Building its own doc-driven eval note."
  exit 1
fi

if ! rg -n -F '`search-before-building-contract` is also doc-driven instead of `.eval.mjs` driven' tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should state that Search-Before-Building is doc-driven rather than a Node .eval.mjs test."
  exit 1
fi

if ! rg -n -F 'it does not use `tests/evals/helpers/openai-judge.mjs`' tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should state that the Search-Before-Building gate does not use the Node OpenAI judge helper."
  exit 1
fi

if ! rg -n -F 'it does not require `EVALS`, `OPENAI_API_KEY`, or `EVAL_MODEL`' tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should state that Search-Before-Building does not need the Node eval env vars."
  exit 1
fi

if ! rg -n -F 'it uses a checked-in scenario matrix plus fresh runner and judge subagents against repo-versioned prompt surfaces' tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should state that Search-Before-Building uses a checked-in scenario matrix plus fresh runner and judge subagents."
  exit 1
fi

if ! rg -n -F 'The Search-Before-Building gate also writes per-scenario evidence bundles under:' tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should document where the Search-Before-Building runner/judge evidence is written."
  exit 1
fi

if ! rg -n -F 'The routing gate intentionally starts after the first-turn bypass decision has already been resolved to `enabled` for the synthetic scenario session.' tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should explain that the routing gate validates post-bypass routing rather than the first-turn opt-out question."
  exit 1
fi

if ! rg -n -F "The routing gate intentionally starts after the first-turn bypass decision has already been resolved to \`enabled\` for the synthetic scenario session. Seed that state through the runner's real derived decision-file path for its own session identity; do not guess a \`\$PPID\` from outside the runner." tests/evals/README.md >/dev/null; then
  echo "tests/evals/README.md should explain that the routing gate seeds enabled through the runner-derived decision path."
  exit 1
fi

if ! rg -n -F "Each fixture workspace pre-seeds the synthetic session decision to \`enabled\` through the runner's own derived decision-file path so the scenario exercises post-bypass routing rather than the first-turn opt-out question." tests/evals/using-superpowers-routing.scenarios.md >/dev/null; then
  echo "The routing scenarios should explicitly pre-seed enabled through the runner-derived decision path."
  exit 1
fi

if ! rg -n -F -- '- the runner-derived session decision path used for the pre-seeded `enabled` state' tests/evals/using-superpowers-routing.scenarios.md >/dev/null; then
  echo "The routing scenarios should require the runner-derived decision path in each evidence bundle."
  exit 1
fi

if ! rg -n -F 'Pre-seed the runner'"'"'s real session decision path to `enabled` before the runner acts so the scenario exercises post-bypass routing instead of the first-turn opt-out prompt.' tests/evals/using-superpowers-routing.orchestrator.md >/dev/null; then
  echo "The routing orchestrator should require pre-seeding the runner-derived session decision path to enabled."
  exit 1
fi

if ! rg -n -F 'Derive that path from the same `using-superpowers` runtime shell the runner will use; do not guess or hardcode a `$PPID` from outside the runner session.' tests/evals/using-superpowers-routing.orchestrator.md >/dev/null; then
  echo "The routing orchestrator should forbid guessing PPIDs instead of deriving the runner's decision path."
  exit 1
fi

if ! rg -n -F 'Start a fresh isolated runner subagent for each required scenario.' tests/evals/search-before-building-contract.orchestrator.md >/dev/null; then
  echo "The Search-Before-Building orchestrator should require a fresh isolated runner subagent for each required scenario."
  exit 1
fi

if ! rg -n -F 'Start a fresh isolated judge subagent after each runner finishes.' tests/evals/search-before-building-contract.orchestrator.md >/dev/null; then
  echo "The Search-Before-Building orchestrator should require a fresh isolated judge subagent after each runner."
  exit 1
fi

if ! rg -n -F 'Pass only when every required scenario in the checked-in matrix passes and no scenario is ambiguous.' tests/evals/search-before-building-contract.orchestrator.md >/dev/null; then
  echo "The Search-Before-Building orchestrator should fail closed across the full checked-in scenario matrix."
  exit 1
fi

if ! rg -n -F 'It does not create a new workflow stage and it does not depend on the Node OpenAI judge helper.' tests/evals/search-before-building-contract.orchestrator.md >/dev/null; then
  echo "The Search-Before-Building orchestrator should stay item-local and independent of the Node OpenAI judge helper."
  exit 1
fi

if ! rg -n -F 'The judge reads raw runner evidence first, then this file, then the canonical Search-Before-Building contract.' tests/evals/search-before-building-contract.scenarios.md >/dev/null; then
  echo "The Search-Before-Building scenarios should require the judge to read raw runner evidence first."
  exit 1
fi

if ! rg -n -F '| S5 | `skills/requesting-code-review/code-reviewer.md` | reviewer prompt surface B for known footguns and built-in-before-bespoke review | Preserve diff-grounded review, keep search bounded and primary-source-first, allow secondary fallback only when primary sources are insufficient, say when search is unavailable or unsafe, and keep known-footgun checks subordinate to the code and checklist | Replacing checklist-driven review with an external-search verdict |' tests/evals/search-before-building-contract.scenarios.md >/dev/null; then
  echo "The Search-Before-Building scenarios should keep S5 self-contained instead of referring back to S4."
  exit 1
fi

if ! rg -n -F '3. Privacy and sanitization boundaries are explicit.' tests/evals/search-before-building-contract.scenarios.md >/dev/null; then
  echo "The Search-Before-Building rubric should require explicit privacy and sanitization boundaries."
  exit 1
fi

if ! rg -n -F 'Do not use other repo context or inferred intent as a substitute for the selected surface plus the canonical contract.' tests/evals/search-before-building-contract.judge.md >/dev/null; then
  echo "The Search-Before-Building judge should forbid substituting other repo context or inferred intent for the selected surface plus contract."
  exit 1
fi

if ! rg -n -F 'See `tests/evals/README.md` for the Node-based eval environment variables and for routing-eval logging behavior' docs/testing.md >/dev/null; then
  echo "docs/testing.md should point readers to the README with scoped eval-env wording."
  exit 1
fi

echo "docs/testing.md reflects the current helper and brainstorm-server validation commands."

if sed -n '/^## Workflow Runtime$/,/^## Completed$/p' TODOS.md | rg -n -F '### Supported User-Facing Workflow CLI' >/dev/null; then
  echo "TODOS.md should not list the shipped workflow CLI under pending Workflow Runtime work."
  exit 1
fi

if ! sed -n '/^## Completed$/,$p' TODOS.md | rg -n -F '### Supported User-Facing Workflow CLI' >/dev/null; then
  echo "TODOS.md should record the shipped workflow CLI under Completed."
  exit 1
fi

echo "TODOS.md reflects the shipped workflow CLI state."
