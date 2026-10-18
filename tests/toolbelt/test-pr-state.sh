#!/usr/bin/env bash
# Runs pr-monitor's pr-state against a stubbed gh on PATH.
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
script="$repo_root/skills/pr-monitor/scripts/pr-state"
fixtures="$repo_root/tests/toolbelt/fixtures/pr-state"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
failures=0

fail() { echo "not ok - $1" >&2; failures=$((failures + 1)); }
ok() { echo "ok - $1"; }

# The stub answers each GraphQL list from <list>-<cursor>.json, "start" for the
# first page. A <list>-<cursor>.fail file makes that page fail. Any REST call
# for comments returns comments.json, so a script that read comments would see
# the provider's "Running" notice.
mkdir -p "$tmp/bin"
cat >"$tmp/bin/gh" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
dir=${GH_STUB_DIR:?}
if [ "$1 ${2-}" = "auth status" ]; then
  exit "${GH_STUB_AUTH:-0}"
fi
args="$*"
case $args in
  *reviewThreads*) list=threads ;;
  *statusCheckRollup*) list=checks ;;
  *reviews*) list=reviews ;;
  *comments*) cat "$dir/comments.json"; exit 0 ;;
  *) echo "stub gh: unexpected call: $args" >&2; exit 1 ;;
esac
cursor=start
while [ $# -gt 0 ]; do
  case $1 in after=*) cursor=${1#after=} ;; esac
  shift
done
if [ -e "$dir/$list-$cursor.fail" ]; then
  echo "HTTP 502" >&2
  exit 1
fi
cat "$dir/$list-$cursor.json"
STUB
chmod +x "$tmp/bin/gh"

stub_path="$tmp/bin:$PATH"

# A PR with one failing check, one review on an old commit, and two
# unresolved threads across two pages (plus one resolved thread).
if out=$(GH_STUB_DIR="$fixtures" PATH="$stub_path" bash "$script" 42) &&
  [ "$(printf '%s' "$out" | jq -S .)" = "$(jq -S . "$fixtures/expected.json")" ]; then
  ok "prints head, checks, reviews, and every unresolved thread across pages"
else
  fail "pr-state output differs from expected.json: ${out-}"
fi

if printf '%s' "${out-}" | grep -q Running; then
  fail "a plain Running comment is reported"
else
  ok "a plain Running comment is not a finding"
fi

# (guard) No gh on PATH: exit 2.
mkdir -p "$tmp/nogh"
for tool in bash jq git env cat dirname mktemp rm; do
  ln -sf "$(command -v "$tool")" "$tmp/nogh/$tool"
done
set +e
PATH="$tmp/nogh" bash "$script" 42 >"$tmp/nogh.out" 2>/dev/null
code=$?
set -e
if [ "$code" -eq 2 ] && [ ! -s "$tmp/nogh.out" ]; then
  ok "exits 2 without gh"
else
  fail "should exit 2 without gh, got $code"
fi

# (guard) Unauthenticated gh: exit 2.
set +e
GH_STUB_AUTH=1 GH_STUB_DIR="$fixtures" PATH="$stub_path" bash "$script" 42 >"$tmp/noauth.out" 2>/dev/null
code=$?
set -e
if [ "$code" -eq 2 ] && [ ! -s "$tmp/noauth.out" ]; then
  ok "exits 2 when gh is unauthenticated"
else
  fail "should exit 2 when gh is unauthenticated, got $code"
fi

# (guard) The thread query fails on its second page: exit 3, print nothing.
cp "$fixtures"/*.json "$tmp/"
touch "$tmp/threads-t2.fail"
set +e
GH_STUB_DIR="$tmp" PATH="$stub_path" bash "$script" 42 >"$tmp/partial.out" 2>/dev/null
code=$?
set -e
if [ "$code" -eq 3 ] && [ ! -s "$tmp/partial.out" ]; then
  ok "exits 3 and prints nothing when a later page fails"
else
  fail "should exit 3 with no output when page two fails, got $code: $(cat "$tmp/partial.out")"
fi

# (guard) Incomplete first pages are errors, not empty lists.
incomplete_case() {
  local name=$1 list=$2 body=$3 dir="$tmp/$1"
  mkdir -p "$dir"
  cp "$fixtures"/*.json "$dir/"
  printf '%s\n' "$body" >"$dir/$list-start.json"
  set +e
  GH_STUB_DIR="$dir" PATH="$stub_path" bash "$script" 42 >"$dir/out" 2>/dev/null
  code=$?
  set -e
  if [ "$code" -eq 3 ] && [ ! -s "$dir/out" ]; then
    ok "exits 3 and prints nothing: $name"
  else
    fail "should exit 3 with no output: $name, got $code: $(cat "$dir/out")"
  fi
}
incomplete_case "thread connection omitted" threads '{"data":{"repository":{"pullRequest":{}}}}'
incomplete_case "thread page without pageInfo" threads '{"data":{"repository":{"pullRequest":{"reviewThreads":{"nodes":[]}}}}}'
incomplete_case "review connection omitted" reviews '{"data":{"repository":{"pullRequest":{}}}}'
incomplete_case "head commit omitted" checks '{"data":{"repository":{"pullRequest":{"headRefOid":"b2","commits":{"nodes":[]}}}}}'

# A head commit with no check rollup reports checks as unavailable.
mkdir -p "$tmp/nochecks"
cp "$fixtures"/*.json "$tmp/nochecks/"
printf '%s\n' '{"data":{"repository":{"pullRequest":{"headRefOid":"b2","commits":{"nodes":[{"commit":{"statusCheckRollup":null}}]}}}}}' >"$tmp/nochecks/checks-start.json"
if out=$(GH_STUB_DIR="$tmp/nochecks" PATH="$stub_path" bash "$script" 42) &&
  [ "$(printf '%s' "$out" | jq -r .checks.state)" = unavailable ]; then
  ok "no check rollup reports checks unavailable"
else
  fail "no check rollup should report checks unavailable: ${out-}"
fi

if [ "$failures" -gt 0 ]; then
  exit 1
fi
echo "PASS"
