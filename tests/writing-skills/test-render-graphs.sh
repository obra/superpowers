#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRIPT_UNDER_TEST="$REPO_ROOT/skills/writing-skills/render-graphs.js"
# Resolve the real binary: version-manager shims (mise, asdf) can't find node
# under the empty PATH used for the missing-Graphviz case.
NODE_BIN="$(node -p 'process.execPath')"

node_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -m "$1"
  else
    printf '%s\n' "$1"
  fi
}

PASSES=0
FAILURES=0
TEST_ROOT="$(mktemp -d)"

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

pass() {
  echo "  [PASS] $1"
  PASSES=$((PASSES + 1))
}

fail() {
  echo "  [FAIL] $1"
  FAILURES=$((FAILURES + 1))
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local description="$3"

  if printf '%s' "$haystack" | grep -Fq -- "$needle"; then
    pass "$description"
  else
    fail "$description"
    echo "    expected to find: $needle"
  fi
}

assert_not_contains() {
  local haystack="$1"
  local needle="$2"
  local description="$3"

  if printf '%s' "$haystack" | grep -Fq -- "$needle"; then
    fail "$description"
    echo "    did not expect to find: $needle"
  else
    pass "$description"
  fi
}

fixture="$TEST_ROOT/fixture-skill"
mkdir -p "$fixture" "$TEST_ROOT/empty-path"
cat >"$fixture/SKILL.md" <<'EOF'
---
name: fixture-skill
---

# Fixture Skill

```dot
digraph fixture_graph {
  start -> end;
}
```
EOF

echo "Writing-skills render-graphs tests"

missing_dot_output="$(PATH="$TEST_ROOT/empty-path" "$NODE_BIN" "$(node_path "$SCRIPT_UNDER_TEST")" "$(node_path "$fixture")" 2>&1)"
missing_dot_status=$?

if [[ "$missing_dot_status" -ne 0 ]]; then
  pass "missing Graphviz exits non-zero"
else
  fail "missing Graphviz exits non-zero"
fi
assert_contains "$missing_dot_output" "Error: graphviz (dot) not found." "missing Graphviz reports install guidance"
assert_not_contains "$missing_dot_output" "ReferenceError: require is not defined" "script runs as an ES module"

# Test exit code on render failure and CRLF line endings (issue #2519)
fake_dot_bin="$TEST_ROOT/fake-dot/bin"
mkdir -p "$fake_dot_bin"
cat >"$fake_dot_bin/dot" <<'EOF'
#!/usr/bin/env bash
if [[ "${1:-}" == "-V" ]]; then
  exit 0
fi
if [[ "${1:-}" == "-Tsvg" ]]; then
  input="$(cat)"
  if [[ "$input" == *"broken_graph"* || "$input" == *"invalid"* ]]; then
    echo "Error: syntax error in dot" >&2
    exit 1
  fi
  printf '<svg viewBox="0 0 100 100"><text>mock</text></svg>\n'
  exit 0
fi
exit 0
EOF
chmod +x "$fake_dot_bin/dot"

if command -v cygpath >/dev/null 2>&1 && command -v gcc >/dev/null 2>&1; then
  gcc -O2 -x c - -o "$(cygpath -m "$fake_dot_bin/dot.exe")" <<'EOF'
#include <stdio.h>
#include <string.h>
int main(int argc, char *argv[]) {
  if (argc > 1 && strcmp(argv[1], "-V") == 0) return 0;
  char buf[1024];
  while (fgets(buf, sizeof(buf), stdin)) {
    if (strstr(buf, "broken_graph") || strstr(buf, "invalid")) {
      fprintf(stderr, "Error: syntax error in dot\n");
      return 1;
    }
  }
  printf("<svg viewBox=\"0 0 100 100\"><text>mock</text></svg>\n");
  return 0;
}
EOF
fi

# Test CRLF line endings in SKILL.md (issue #2519)
fixture_crlf="$TEST_ROOT/fixture-crlf"
mkdir -p "$fixture_crlf"
printf '# Skill\r\n```dot\r\ndigraph crlf_graph {\r\n  start -> end;\r\n}\r\n```\r\n' >"$fixture_crlf/SKILL.md"

crlf_output="$(PATH="$fake_dot_bin:$PATH" "$NODE_BIN" "$(node_path "$SCRIPT_UNDER_TEST")" "$(node_path "$fixture_crlf")" 2>&1)"
assert_contains "$crlf_output" "Found 1 diagram(s)" "extracts dot blocks with CRLF line endings"
assert_contains "$crlf_output" "Rendered: crlf_graph.svg" "renders CRLF diagram to SVG"

fixture_fail="$TEST_ROOT/fixture-fail"
mkdir -p "$fixture_fail"
cat >"$fixture_fail/SKILL.md" <<'EOF'
# Skill

```dot
digraph broken_graph {
  invalid
}
```
EOF

fail_render_output="$(PATH="$fake_dot_bin:$PATH" "$NODE_BIN" "$(node_path "$SCRIPT_UNDER_TEST")" "$(node_path "$fixture_fail")" 2>&1)"
fail_render_status=$?

if [[ "$fail_render_status" -ne 0 ]]; then
  pass "render failure exits non-zero"
else
  fail "render failure exits non-zero"
fi
assert_contains "$fail_render_output" "Failed: broken_graph" "reports diagram render failure"

# Test --combine render failure exits non-zero (issue #2519)
fail_combine_output="$(PATH="$fake_dot_bin:$PATH" "$NODE_BIN" "$(node_path "$SCRIPT_UNDER_TEST")" "$(node_path "$fixture_fail")" --combine 2>&1)"
fail_combine_status=$?

if [[ "$fail_combine_status" -ne 0 ]]; then
  pass "combine render failure exits non-zero"
else
  fail "combine render failure exits non-zero"
fi
assert_contains "$fail_combine_output" "Failed to render combined diagram" "reports combined diagram render failure"

render_output="$(PATH="$fake_dot_bin:$PATH" "$NODE_BIN" "$(node_path "$SCRIPT_UNDER_TEST")" "$(node_path "$fixture")" 2>&1)"
render_status=$?

if [[ "$render_status" -eq 0 ]]; then
  pass "fixture diagram renders"
else
  fail "fixture diagram renders"
  printf '%s\n' "$render_output"
fi

assert_contains "$render_output" "Found 1 diagram(s)" "reports discovered diagram"
assert_contains "$render_output" "Rendered: fixture_graph.svg" "reports rendered SVG"

if [[ -f "$fixture/diagrams/fixture_graph.svg" ]]; then
  pass "writes SVG output"
else
  fail "writes SVG output"
fi

if [[ -f "$fixture/diagrams/fixture_graph.svg" ]] && grep -Fq "<svg" "$fixture/diagrams/fixture_graph.svg"; then
  pass "SVG output has SVG markup"
else
  fail "SVG output has SVG markup"
fi

echo
echo "Results: $PASSES passed, $FAILURES failed"

if [[ "$FAILURES" -gt 0 ]]; then
  exit 1
fi
