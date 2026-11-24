#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRIPT_UNDER_TEST="$REPO_ROOT/skills/writing-skills/render-graphs.js"
# Resolve the real binary: version-manager shims (mise, asdf) can't find node
# under the empty PATH used for the missing-Graphviz case.
NODE_BIN="$(node -p 'process.execPath')"

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

missing_dot_output="$(PATH="$TEST_ROOT/empty-path" "$NODE_BIN" "$SCRIPT_UNDER_TEST" "$fixture" 2>&1)"
missing_dot_status=$?

if [[ "$missing_dot_status" -ne 0 ]]; then
  pass "missing Graphviz exits non-zero"
else
  fail "missing Graphviz exits non-zero"
fi
assert_contains "$missing_dot_output" "Error: graphviz (dot) not found." "missing Graphviz reports install guidance"
assert_not_contains "$missing_dot_output" "ReferenceError: require is not defined" "script runs as an ES module"

render_output="$("$NODE_BIN" "$SCRIPT_UNDER_TEST" "$fixture" 2>&1)"
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

# Stub dot binaries for deterministic CRLF and render-failure checks (work even without system dot)
mkdir -p "$TEST_ROOT/fake-dot" "$TEST_ROOT/fail-dot"
cat >"$TEST_ROOT/fake-dot/dot" <<'EOF'
#!/usr/bin/env bash
case "${1:-}" in
  -V)
    exit 0
    ;;
  -Tsvg)
    input="$(cat)"
    case "$input" in
      *$'\r'*)
        echo "syntax error: unexpected carriage return" >&2
        exit 1
        ;;
    esac
    printf '<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>\n'
    exit 0
    ;;
  *)
    exit 1
    ;;
esac
EOF
chmod +x "$TEST_ROOT/fake-dot/dot"

cat >"$TEST_ROOT/fail-dot/dot" <<'EOF'
#!/usr/bin/env bash
case "${1:-}" in
  -V)
    exit 0
    ;;
  -Tsvg)
    echo "Error: <stdin>: syntax error" >&2
    exit 1
    ;;
  *)
    exit 1
    ;;
esac
EOF
chmod +x "$TEST_ROOT/fail-dot/dot"

# 1. CRLF SKILL.md extraction and normalization
crlf_fixture="$TEST_ROOT/crlf-skill"
mkdir -p "$crlf_fixture"
printf -- '---\r\nname: crlf-skill\r\n---\r\n\r\n# CRLF Skill\r\n\r\n```dot\r\ndigraph crlf_graph {\r\n  start -> end;\r\n}\r\n```\r\n' >"$crlf_fixture/SKILL.md"

crlf_output="$(PATH="$TEST_ROOT/fake-dot:$PATH" "$NODE_BIN" "$SCRIPT_UNDER_TEST" "$crlf_fixture" 2>&1)"
crlf_status=$?

if [[ "$crlf_status" -eq 0 ]]; then
  pass "CRLF SKILL.md exits zero"
else
  fail "CRLF SKILL.md exits zero"
  printf '%s\n' "$crlf_output"
fi
assert_contains "$crlf_output" "Found 1 diagram(s)" "CRLF SKILL.md extracts diagram"

if [[ -f "$crlf_fixture/diagrams/crlf_graph.svg" ]] && grep -Fq "<svg" "$crlf_fixture/diagrams/crlf_graph.svg"; then
  pass "CRLF SKILL.md writes valid SVG"
else
  fail "CRLF SKILL.md writes valid SVG"
fi

# 2. Invalid DOT / render failure exits non-zero in normal and --combine modes
broken_fixture="$TEST_ROOT/broken-skill"
mkdir -p "$broken_fixture"
cat >"$broken_fixture/SKILL.md" <<'EOF'
---
name: broken-skill
---

# Broken Skill

```dot
digraph broken { -> ; }
```
EOF

broken_dot_path="$TEST_ROOT/fail-dot:$PATH"
if command -v dot >/dev/null 2>&1; then
  broken_dot_path="$PATH"
fi

broken_output="$(PATH="$broken_dot_path" "$NODE_BIN" "$SCRIPT_UNDER_TEST" "$broken_fixture" 2>&1)"
broken_status=$?

if [[ "$broken_status" -ne 0 ]]; then
  pass "broken DOT exits non-zero in normal mode"
else
  fail "broken DOT exits non-zero in normal mode"
  printf '%s\n' "$broken_output"
fi

broken_combine_output="$(PATH="$broken_dot_path" "$NODE_BIN" "$SCRIPT_UNDER_TEST" "$broken_fixture" --combine 2>&1)"
broken_combine_status=$?

if [[ "$broken_combine_status" -ne 0 ]]; then
  pass "broken DOT exits non-zero in --combine mode"
else
  fail "broken DOT exits non-zero in --combine mode"
  printf '%s\n' "$broken_combine_output"
fi

# 3. --out-dir before positional skill directory
out_fixture="$TEST_ROOT/out-dir-skill"
mkdir -p "$out_fixture"
cat >"$out_fixture/SKILL.md" <<'EOF'
---
name: out-dir-skill
---

# Out Dir Skill

```dot
digraph fixture_graph {
  start -> end;
}
```
EOF

out_dir_target="$TEST_ROOT/nested/out"
out_dir_dot_path="$TEST_ROOT/fake-dot:$PATH"
if command -v dot >/dev/null 2>&1; then
  out_dir_dot_path="$PATH"
fi

out_dir_output="$(PATH="$out_dir_dot_path" "$NODE_BIN" "$SCRIPT_UNDER_TEST" --out-dir "$out_dir_target" "$out_fixture" 2>&1)"
out_dir_status=$?

if [[ "$out_dir_status" -eq 0 ]]; then
  pass "--out-dir before skill dir exits zero"
else
  fail "--out-dir before skill dir exits zero"
  printf '%s\n' "$out_dir_output"
fi

if [[ -f "$out_dir_target/fixture_graph.svg" ]] && grep -Fq "<svg" "$out_dir_target/fixture_graph.svg"; then
  pass "--out-dir writes SVG to nested custom directory"
else
  fail "--out-dir writes SVG to nested custom directory"
fi

if [[ ! -e "$out_fixture/diagrams" ]]; then
  pass "--out-dir does not create default diagrams directory"
else
  fail "--out-dir does not create default diagrams directory"
fi

# 4. Missing --out-dir value exits 1 with clear error
missing_outdir_end_output="$("$NODE_BIN" "$SCRIPT_UNDER_TEST" "$out_fixture" --out-dir 2>&1)"
missing_outdir_end_status=$?

if [[ "$missing_outdir_end_status" -eq 1 ]]; then
  pass "--out-dir at end of argv exits 1"
else
  fail "--out-dir at end of argv exits 1"
  printf '%s\n' "$missing_outdir_end_output"
fi
assert_contains "$missing_outdir_end_output" "--out-dir" "--out-dir at end of argv reports clear error"

missing_outdir_flag_output="$("$NODE_BIN" "$SCRIPT_UNDER_TEST" --out-dir --combine "$out_fixture" 2>&1)"
missing_outdir_flag_status=$?

if [[ "$missing_outdir_flag_status" -eq 1 ]]; then
  pass "--out-dir followed by flag exits 1"
else
  fail "--out-dir followed by flag exits 1"
  printf '%s\n' "$missing_outdir_flag_output"
fi
assert_contains "$missing_outdir_flag_output" "--out-dir" "--out-dir followed by flag reports clear error"

echo
echo "Results: $PASSES passed, $FAILURES failed"

if [[ "$FAILURES" -gt 0 ]]; then
  exit 1
fi
