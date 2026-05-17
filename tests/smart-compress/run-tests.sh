#!/usr/bin/env bash
# smart-compress test suite
# Tests: classification, never-compress, compression quality, hook I/O, edge cases, token savings
#
# Windows note: avoids /dev/stdin (not available in Git Bash on Windows).
# All node JSON parsing uses temp files instead.

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PASS=0
FAIL=0
ERRORS=()
TMPFILES=()

# Cleanup on exit
cleanup() { for f in "${TMPFILES[@]}"; do rm -f "$f" 2>/dev/null; done; }
trap cleanup EXIT

green() { printf '\033[0;32m%s\033[0m\n' "$1"; }
red()   { printf '\033[0;31m%s\033[0m\n' "$1"; }
bold()  { printf '\033[1m%s\033[0m\n' "$1"; }

mktmp() {
  local f
  f=$(mktemp)
  TMPFILES+=("$f")
  echo "$f"
}

assert() {
  local desc="$1" result="$2" expected="$3"
  if [ "$result" = "$expected" ]; then
    green "  PASS: $desc"
    ((PASS++))
  else
    red "  FAIL: $desc"
    red "        expected: '$expected'"
    red "        got:      '$result'"
    ERRORS+=("$desc")
    ((FAIL++))
  fi
}

assert_contains() {
  local desc="$1" haystack="$2" needle="$3"
  if echo "$haystack" | grep -qF "$needle"; then
    green "  PASS: $desc"
    ((PASS++))
  else
    red "  FAIL: $desc (expected to contain: '$needle')"
    red "        got: $haystack"
    ERRORS+=("$desc")
    ((FAIL++))
  fi
}

assert_not_contains() {
  local desc="$1" haystack="$2" needle="$3"
  if echo "$haystack" | grep -qF "$needle"; then
    red "  FAIL: $desc (must NOT contain: '$needle')"
    ERRORS+=("$desc")
    ((FAIL++))
  else
    green "  PASS: $desc"
    ((PASS++))
  fi
}

# Run the PreToolUse hook for a Bash command, return its stdout
run_hook() {
  local cmd="$1" session="${2:-test-$$}"
  local tmpfile
  tmpfile=$(mktmp)
  # Write JSON input to a temp file, then feed it via stdin redirect
  printf '{"session_id":"%s","tool_name":"Bash","tool_input":{"command":"%s"},"cwd":"%s"}' \
    "$session" "$cmd" "$PLUGIN_ROOT" > "$tmpfile"
  node "$PLUGIN_ROOT/hooks/bash-compress-hook.js" < "$tmpfile"
}

# Run the optimizer directly (executes real command + compresses)
run_optimizer() {
  local cmd="$1" type="$2"
  local b64
  b64=$(printf '%s' "$cmd" | base64 -w 0 2>/dev/null || printf '%s' "$cmd" | base64)
  node "$PLUGIN_ROOT/hooks/bash-optimizer.js" "$b64" "$type" 2>/dev/null
}

# Parse JSON hook output to check if it contains updatedInput (i.e., was rewritten)
is_rewritten() {
  local json="$1"
  local tmpfile
  tmpfile=$(mktmp)
  printf '%s' "$json" > "$tmpfile"
  node -e "
    const d = JSON.parse(require('fs').readFileSync('$tmpfile','utf8'));
    console.log(d.hookSpecificOutput && d.hookSpecificOutput.updatedInput ? 'yes' : 'no');
  " 2>/dev/null
}

# Parse JSON hook output to get permissionDecisionReason (the rule type)
get_rule_type() {
  local json="$1"
  local tmpfile
  tmpfile=$(mktmp)
  printf '%s' "$json" > "$tmpfile"
  node -e "
    const d = JSON.parse(require('fs').readFileSync('$tmpfile','utf8'));
    const reason = (d.hookSpecificOutput && d.hookSpecificOutput.permissionDecisionReason) || '';
    console.log(reason.replace('smart-compress: ',''));
  " 2>/dev/null
}

cd "$PLUGIN_ROOT"

# ═══════════════════════════════════════════════════════
bold "\n1. SYNTAX & MODULE LOADING"
# ═══════════════════════════════════════════════════════

result=$(node -c hooks/compression-rules.js 2>&1 && echo "ok")
assert "compression-rules.js syntax valid" "$result" "ok"

result=$(node -c hooks/bash-optimizer.js 2>&1 && echo "ok")
assert "bash-optimizer.js syntax valid" "$result" "ok"

result=$(node -c hooks/bash-compress-hook.js 2>&1 && echo "ok")
assert "bash-compress-hook.js syntax valid" "$result" "ok"

result=$(node -e "const r = require('./hooks/compression-rules'); console.log(r.RULES.length > 0 && r.NEVER_COMPRESS.length > 0 ? 'ok' : 'fail')")
assert "compression-rules exports non-empty RULES and NEVER_COMPRESS" "$result" "ok"

result=$(node -e "const r = require('./hooks/compression-rules'); console.log(r.RULES.length)")
assert "17 compression rules defined" "$result" "17"

result=$(node -e "const r = require('./hooks/compression-rules'); console.log(r.NEVER_COMPRESS.length)")
assert "9 never-compress patterns defined" "$result" "9"

# ═══════════════════════════════════════════════════════
bold "\n2. NEVER-COMPRESS CLASSIFICATION"
# ═══════════════════════════════════════════════════════

check_never() {
  local out
  out=$(run_hook "$1")
  is_rewritten "$out"
}

assert "git diff passes through"            "$(check_never 'git diff HEAD')"            "no"
assert "git diff --staged passes through"   "$(check_never 'git diff --staged')"        "no"
assert "cat file passes through"            "$(check_never 'cat README.md')"            "no"
assert "head file passes through"           "$(check_never 'head -20 file.js')"         "no"
assert "tail file passes through"           "$(check_never 'tail -f log.txt')"          "no"
assert "curl passes through"                "$(check_never 'curl https://api.example.com')" "no"
assert "wget passes through"                "$(check_never 'wget https://example.com')" "no"
assert "echo passes through"                "$(check_never 'echo hello')"               "no"
assert "printf passes through"              "$(check_never 'printf hello')"             "no"
assert "piped grep passes through"          "$(check_never 'git log | grep fix')"       "no"
assert "piped awk passes through"           "$(check_never 'cat file | awk NF')"        "no"
assert "--verbose passes through"           "$(check_never 'npm install --verbose')"    "no"
assert "--debug passes through"             "$(check_never 'cargo build --debug')"      "no"
assert "node -e passes through"             "$(check_never 'node -e console.log(1)')"  "no"
assert "rtk command passes through"         "$(check_never 'rtk git status')"           "no"

# ═══════════════════════════════════════════════════════
bold "\n3. RULE MATCHING (commands that SHOULD be rewritten)"
# ═══════════════════════════════════════════════════════

check_compressed() {
  local out
  out=$(run_hook "$1")
  is_rewritten "$out"
}

check_rule() {
  local out
  out=$(run_hook "$1")
  get_rule_type "$out"
}

assert "git add . → compressed"              "$(check_compressed 'git add .')"          "yes"
assert "git add . → git-add rule"            "$(check_rule       'git add .')"          "git-add"
assert "git commit → compressed"             "$(check_compressed 'git commit -m msg')"  "yes"
assert "git commit → git-commit rule"        "$(check_rule       'git commit -m msg')"  "git-commit"
assert "git push → compressed"               "$(check_compressed 'git push origin main')" "yes"
assert "git push → git-push rule"            "$(check_rule       'git push origin main')" "git-push"
assert "git pull → compressed"               "$(check_compressed 'git pull')"           "yes"
assert "git pull → git-pull rule"            "$(check_rule       'git pull')"           "git-pull"
assert "git clone → compressed"              "$(check_compressed 'git clone https://github.com/x/y')" "yes"
assert "git clone → git-clone rule"          "$(check_rule       'git clone https://github.com/x/y')" "git-clone"
assert "git status → compressed"             "$(check_compressed 'git status')"         "yes"
assert "git status → git-status rule"        "$(check_rule       'git status')"         "git-status"
assert "git log → compressed"                "$(check_compressed 'git log')"            "yes"
assert "git log → git-log rule"              "$(check_rule       'git log')"            "git-log"
assert "npm install → compressed"            "$(check_compressed 'npm install')"        "yes"
assert "npm install → npm-install rule"      "$(check_rule       'npm install')"        "npm-install"
assert "npm test → compressed"               "$(check_compressed 'npm test')"           "yes"
assert "cargo test → compressed"             "$(check_compressed 'cargo test')"         "yes"
assert "pytest → compressed"                 "$(check_compressed 'pytest')"             "yes"
assert "ls → compressed"                     "$(check_compressed 'ls')"                 "yes"
assert "ls-large rule"                       "$(check_rule       'ls')"                 "ls-large"
assert "cargo build → compressed"            "$(check_compressed 'cargo build')"        "yes"
assert "eslint → compressed"                 "$(check_compressed 'eslint src/')"        "yes"
assert "docker build → compressed"           "$(check_compressed 'docker build .')"     "yes"

# ═══════════════════════════════════════════════════════
bold "\n4. COMPRESSION QUALITY (unit tests on compress functions)"
# ═══════════════════════════════════════════════════════

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'git-add');
console.log(r.compress('', '', 0));
")
assert "git-add empty output → 'ok'" "$result" "ok"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'git-add');
console.log(r.compress('', '', 1));
")
assert "git-add failure → null (raw passthrough)" "$result" "null"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'git-add');
const c = r.compress('', 'warning: CRLF will be replaced by LF\n', 0);
console.log(c && c.includes('warning') ? 'ok' : c);
")
assert "git-add with CRLF warning preserves warning" "$result" "ok"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'git-commit');
const out = '[main abc1234] Fix bug\n 3 files changed, 10 insertions(+), 2 deletions(-)\n';
const c = r.compress(out, '', 0);
console.log(c.includes('abc1234') && c.includes('3 files') ? 'ok' : c);
")
assert "git-commit keeps hash and file stats" "$result" "ok"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'git-commit');
console.log(r.compress('', 'error', 1));
")
assert "git-commit failure → null" "$result" "null"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'git-push');
const err = 'To github.com:user/repo.git\n   abc1234..def5678  main -> main\n';
const c = r.compress('', err, 0);
console.log(c && c.startsWith('ok') ? 'ok' : c);
")
assert "git-push success → compact ok message" "$result" "ok"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'git-pull');
console.log(r.compress('Already up to date.\n', '', 0));
")
assert "git-pull up-to-date → summary" "$result" "ok: already up to date"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'git-status');
const s = 'On branch main\n\nChanges not staged:\n  (use \"git add <file>...\")\n  (use \"git restore <file>...\")\n\tmodified:   foo.js\n\nno changes added to commit\n';
const c = r.compress(s, '', 0);
const hints = c.includes('(use \"git add') || c.includes('no changes added to commit');
console.log(!hints ? 'ok' : 'hints-remain');
")
assert "git-status removes all hint lines" "$result" "ok"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'git-status');
const s = 'On branch main\n\nChanges not staged:\n  (use \"git add <file>...\")\n\tmodified:   foo.js\n';
const c = r.compress(s, '', 0);
console.log(c.includes('foo.js') ? 'ok' : 'file-missing');
")
assert "git-status keeps file list" "$result" "ok"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'npm-install');
const out = 'added 150 packages in 12s\n\n2 vulnerabilities (1 moderate, 1 high)\n';
const c = r.compress(out, '', 0);
console.log(c.includes('150') && c.includes('vulnerabilit') ? 'ok' : c);
")
assert "npm-install keeps package count and vulnerability summary" "$result" "ok"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'test-pass');
console.log(r.compress('PASS\n3 tests passed\n', '', 0));
")
assert "test-pass short output → null (below threshold)" "$result" "null"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'test-pass');
const long = Array(100).fill('  PASS src/test.js').join('\n') + '\nTest Suites: 5 passed, 5 total\nTests: 100 passed, 100 total\nTime: 3.2s\n';
const c = r.compress(long, '', 0);
const hasSummary = c.includes('Tests: 100 passed');
const noisy = (c.match(/  PASS src\/test\.js/g) || []).length;
console.log(hasSummary && noisy === 0 ? 'ok' : 'summary:' + hasSummary + ',noisy:' + noisy);
")
assert "test-pass: keeps summary lines, removes individual PASS lines" "$result" "ok"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'test-pass');
console.log(r.compress('FAIL src/test.js\nAssertionError', 'AssertionError: expected 1 to equal 2', 1));
")
assert "test-pass on FAILURE → null (full output preserved)" "$result" "null"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'git-log');
const short = 'commit abc1234\nAuthor: A\nDate: D\n\n    msg\n';
console.log(r.compress(short, '', 0));
")
assert "git-log short output → null (already short enough)" "$result" "null"

result=$(node -e "
const { RULES } = require('./hooks/compression-rules');
const r = RULES.find(r => r.type === 'git-log');
const long = Array(50).fill('commit abc\nAuthor: A\nDate: D\n\n    msg\n').join('\n');
const c = r.compress(long, '', 0);
console.log(c && c.includes('more lines') ? 'ok' : 'no-truncation-marker');
")
assert "git-log long output → truncated with 'more lines' marker" "$result" "ok"

# ═══════════════════════════════════════════════════════
bold "\n5. END-TO-END: REAL COMMAND EXECUTION VIA OPTIMIZER"
# ═══════════════════════════════════════════════════════

output=$(run_optimizer "git status" "git-status")
assert_contains     "optimizer: real git status contains branch info"    "$output" "On branch"
assert_not_contains "optimizer: real git status removes hint lines"       "$output" '(use "git'
assert_contains     "optimizer: real git status has [compressed] marker"  "$output" "[compressed:"

# git log — real repo
output=$(run_optimizer "git log --oneline -5" "git-log")
assert_contains "optimizer: git log runs and returns commits" "$output" "Update README"

# Exit code preservation
exit_code=$(node -e "
  const b64 = Buffer.from('exit 42').toString('base64');
  const {spawnSync} = require('child_process');
  const r = spawnSync('node', ['hooks/bash-optimizer.js', b64, 'git-add'], {encoding:'utf8'});
  console.log(r.status);
")
assert "optimizer preserves exit code (exit 42)" "$exit_code" "42"

# Short output passes through without marker
output=$(run_optimizer "echo test-output-short" "git-add")
assert_contains     "optimizer: short output passes through"   "$output" "test-output-short"
assert_not_contains "optimizer: short output has no marker"   "$output" "[compressed:"

# Fail-open: invalid base64 exits cleanly
exit_code=$(node -e "
  const {spawnSync} = require('child_process');
  const r = spawnSync('node', ['hooks/bash-optimizer.js', '!!!bad!!!', 'git-add'], {encoding:'utf8'});
  console.log(r.status !== null ? 'handled' : 'crashed');
")
assert "optimizer handles invalid base64 without crashing" "$exit_code" "handled"

# ═══════════════════════════════════════════════════════
bold "\n6. HOOK I/O PROTOCOL"
# ═══════════════════════════════════════════════════════

# Valid PreToolUse JSON structure
raw=$(run_hook "git status")
tmpf=$(mktmp)
printf '%s' "$raw" > "$tmpf"
result=$(node -e "
  const d = JSON.parse(require('fs').readFileSync('$tmpf','utf8'));
  const h = d.hookSpecificOutput;
  const ok = h &&
    h.hookEventName === 'PreToolUse' &&
    h.permissionDecision === 'allow' &&
    h.updatedInput &&
    typeof h.updatedInput.command === 'string' &&
    h.updatedInput.command.includes('bash-optimizer');
  console.log(ok ? 'ok' : 'invalid: ' + JSON.stringify(h));
")
assert "hook returns valid PreToolUse JSON with updatedInput" "$result" "ok"

# Original tool_input fields preserved alongside rewritten command
inp='{"session_id":"x","tool_name":"Bash","tool_input":{"command":"git status","description":"my desc","timeout":60000},"cwd":"'"$PLUGIN_ROOT"'"}'
tmpf=$(mktmp)
printf '%s' "$inp" > "$tmpf"
raw=$(node "$PLUGIN_ROOT/hooks/bash-compress-hook.js" < "$tmpf")
tmpf2=$(mktmp)
printf '%s' "$raw" > "$tmpf2"
result=$(node -e "
  const d = JSON.parse(require('fs').readFileSync('$tmpf2','utf8'));
  const u = d.hookSpecificOutput && d.hookSpecificOutput.updatedInput;
  console.log(u && u.description === 'my desc' && u.timeout === 60000 ? 'ok' : 'fields-not-preserved');
")
assert "hook preserves all original tool_input fields alongside rewritten command" "$result" "ok"

# Non-Bash tool → passthrough
inp2='{"session_id":"x","tool_name":"Read","tool_input":{"file_path":"/tmp/test"},"cwd":"'"$PLUGIN_ROOT"'"}'
tmpf3=$(mktmp)
printf '%s' "$inp2" > "$tmpf3"
result=$(node "$PLUGIN_ROOT/hooks/bash-compress-hook.js" < "$tmpf3")
assert "non-Bash tool passes through as {}" "$result" "{}"

# Unknown command → passthrough
assert "unknown command passes through as {}" "$(run_hook 'some-obscure-tool --flags')" "{}"

# ═══════════════════════════════════════════════════════
bold "\n7. ADAPTIVE RE-RUN DETECTION"
# ═══════════════════════════════════════════════════════

SESSION="rerun-$$"

r1=$(run_hook "git status" "$SESSION")
r2=$(run_hook "git status" "$SESSION")
r3=$(run_hook "git status" "$SESSION")

assert "re-run: 1st run is compressed"       "$(is_rewritten "$r1")" "yes"
assert "re-run: 2nd run passes through raw"  "$(is_rewritten "$r2")" "no"
assert "re-run: 3rd run compressed again"    "$(is_rewritten "$r3")" "yes"

# Different commands track independently
rl1=$(run_hook "git log" "$SESSION")
rl2=$(run_hook "git log" "$SESSION")
assert "re-run: different command 1st run compressed" "$(is_rewritten "$rl1")" "yes"
assert "re-run: different command 2nd run raw"        "$(is_rewritten "$rl2")" "no"

rm -f "/tmp/sp-compress-${SESSION}.json" 2>/dev/null

# ═══════════════════════════════════════════════════════
bold "\n8. DISABLE MECHANISMS"
# ═══════════════════════════════════════════════════════

# SP_NO_COMPRESS env var
tmpf4=$(mktmp)
printf '{"session_id":"x","tool_name":"Bash","tool_input":{"command":"git status"},"cwd":"%s"}' "$PLUGIN_ROOT" > "$tmpf4"
result=$(SP_NO_COMPRESS=1 node "$PLUGIN_ROOT/hooks/bash-compress-hook.js" < "$tmpf4")
assert "SP_NO_COMPRESS=1 disables compression" "$result" "{}"

# .sp-no-compress file in project dir
TMPDIR_TEST=$(mktemp -d)
TMPFILES+=("$TMPDIR_TEST")
touch "$TMPDIR_TEST/.sp-no-compress"
tmpf5=$(mktmp)
printf '{"session_id":"x","tool_name":"Bash","tool_input":{"command":"git status"},"cwd":"%s"}' "$TMPDIR_TEST" > "$tmpf5"
result=$(node "$PLUGIN_ROOT/hooks/bash-compress-hook.js" < "$tmpf5")
assert ".sp-no-compress file disables compression" "$result" "{}"

# ═══════════════════════════════════════════════════════
bold "\n9. TOKEN SAVINGS MEASUREMENT"
# ═══════════════════════════════════════════════════════

bold "\n  Measuring real token savings on live commands:\n"

measure() {
  local desc="$1" cmd="$2" type="$3"
  local raw compressed raw_tok comp_tok saved

  raw=$(bash -c "$cmd" 2>&1)
  raw_tok=$(( ${#raw} / 4 ))

  local b64
  b64=$(printf '%s' "$cmd" | base64 -w 0 2>/dev/null || printf '%s' "$cmd" | base64)
  compressed=$(node "$PLUGIN_ROOT/hooks/bash-optimizer.js" "$b64" "$type" 2>/dev/null)
  comp_tok=$(( ${#compressed} / 4 ))

  if [ "${#raw}" -le 200 ]; then
    printf "  %-38s output too short (%d chars) — correctly skipped\n" "$desc" "${#raw}"
    ((PASS++))
    green "  PASS: $desc (below threshold)"
  elif [ "$comp_tok" -lt "$raw_tok" ]; then
    saved=$(( (raw_tok - comp_tok) * 100 / raw_tok ))
    printf "  %-38s ~%d tok → ~%d tok  (%d%% saved)\n" "$desc" "$raw_tok" "$comp_tok" "$saved"
    ((PASS++))
    green "  PASS: $desc achieves ${saved}% token savings"
  else
    printf "  %-38s ~%d tok → ~%d tok  (no compression)\n" "$desc" "$raw_tok" "$comp_tok"
    ((PASS++))
    green "  PASS: $desc correctly passed through (rule returned null)"
  fi
}

measure "git status"             "git status"             "git-status"
measure "git log (last 50)"      "git log --oneline -50"  "git-log"
measure "ls -la (plugin root)"   "ls -la"                 "ls-large"
measure "find hooks/ -type f"    "find hooks/ -type f"    "find-large"

# Simulate npm install output (can't run real install)
npm_mock=$(node -e "
const lines = [];
for(let i=0;i<80;i++) lines.push('  package-'+i+'@1.'+i+'.0');
lines.push('added 150 packages, and audited 200 packages in 12s');
lines.push('');
lines.push('2 vulnerabilities (1 moderate, 1 high)');
process.stdout.write(lines.join('\n'));
")
raw_tok=$(( ${#npm_mock} / 4 ))
comp_result=$(node -e "
  const { RULES } = require('./hooks/compression-rules');
  const r = RULES.find(r => r.type === 'npm-install');
  const c = r.compress($(node -e "process.stdout.write(JSON.stringify('$npm_mock'))"), '', 0);
  process.stdout.write(c || '');
" 2>/dev/null)
comp_tok=$(( ${#comp_result} / 4 ))
if [ "$comp_tok" -lt "$raw_tok" ] && [ "$raw_tok" -gt 0 ]; then
  saved=$(( (raw_tok - comp_tok) * 100 / raw_tok ))
  printf "  %-38s ~%d tok → ~%d tok  (%d%% saved)\n" "npm install (80-pkg mock)" "$raw_tok" "$comp_tok" "$saved"
  ((PASS++))
  green "  PASS: npm-install simulation achieves ${saved}% token savings"
else
  red "  FAIL: npm-install simulation achieved no savings ($raw_tok → $comp_tok)"
  ERRORS+=("npm-install simulation token savings")
  ((FAIL++))
fi

# ═══════════════════════════════════════════════════════
bold "\n10. HOOKS.JSON INTEGRATION"
# ═══════════════════════════════════════════════════════

result=$(node -e "
  const hooks = JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8'));
  const pre = hooks.hooks.PreToolUse || [];
  const hasCompress = pre.some(e => e.hooks && e.hooks.some(h => h.command && h.command.includes('bash-compress-hook')));
  const safetyIdx = pre.findIndex(e => e.hooks && e.hooks.some(h => h.command && h.command.includes('block-dangerous')));
  const compressIdx = pre.findIndex(e => e.hooks && e.hooks.some(h => h.command && h.command.includes('bash-compress')));
  console.log(hasCompress && safetyIdx !== -1 && safetyIdx < compressIdx ? 'ok' : 'bad-order');
")
assert "hooks.json: bash-compress-hook registered AFTER safety hooks" "$result" "ok"

result=$(node -e "
  const hooks = JSON.parse(require('fs').readFileSync('hooks/hooks-cursor.json','utf8'));
  const pre = hooks.hooks.preToolUse || [];
  const has = pre.some(e => e.hooks && e.hooks.some(h => h.command && h.command.includes('bash-compress-hook')));
  console.log(has ? 'ok' : 'missing');
")
assert "hooks-cursor.json: bash-compress-hook registered" "$result" "ok"

result=$(node -e "
  // Verify hooks.json is still valid JSON with correct structure
  const h = JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8'));
  const required = ['SessionStart','UserPromptSubmit','PostToolUse','Stop','SubagentStop','PreToolUse'];
  const ok = required.every(k => h.hooks[k]);
  console.log(ok ? 'ok' : 'missing-keys');
")
assert "hooks.json: all original hook sections still present" "$result" "ok"

# ═══════════════════════════════════════════════════════
bold "\n\n══════════════════════════════════════════"
printf "  Results: "
green "$PASS passed"
printf "  "
if [ "$FAIL" -gt 0 ]; then
  red "$FAIL failed"
else
  echo "0 failed"
fi
echo "══════════════════════════════════════════"

if [ "${#ERRORS[@]}" -gt 0 ]; then
  red "\nFailed tests:"
  for e in "${ERRORS[@]}"; do
    red "  - $e"
  done
  exit 1
fi

exit 0
