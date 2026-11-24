#!/usr/bin/env bash
# Deterministic mechanics and contract checks for worktree creation and
# branch-finishing skills using real temporary git repositories.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
USING_SKILL="$REPO_ROOT/skills/using-git-worktrees/SKILL.md"
FINISHING_SKILL="$REPO_ROOT/skills/finishing-a-development-branch/SKILL.md"
SDD_SKILL="$REPO_ROOT/skills/subagent-driven-development/SKILL.md"
SDD_FINAL_REVIEW="$REPO_ROOT/skills/subagent-driven-development/references/final-review.md"
SDD_RESUMING="$REPO_ROOT/skills/subagent-driven-development/references/resuming.md"
EP_SKILL="$REPO_ROOT/skills/executing-plans/SKILL.md"
SDD_INTEGRATION_TEST="$REPO_ROOT/tests/claude-code/test-subagent-driven-development-integration.sh"

FAILURES=0
TEST_ROOT="$(mktemp -d)"

cleanup() {
  if [[ -n "$TEST_ROOT" && -d "$TEST_ROOT" ]]; then
    rm -rf "$TEST_ROOT"
  fi
}
trap cleanup EXIT

pass() {
  echo "  [PASS] $1"
}

fail() {
  echo "  [FAIL] $1"
  FAILURES=$((FAILURES + 1))
}

assert_contains_text() {
  local haystack="$1"
  local needle="$2"
  local label="$3"

  if printf '%s\n' "$haystack" | grep -Fq -- "$needle"; then
    pass "$label"
  else
    fail "$label"
    echo "    expected to find: $needle"
  fi
}

assert_not_contains_text() {
  local haystack="$1"
  local needle="$2"
  local label="$3"

  if printf '%s\n' "$haystack" | grep -Fq -- "$needle"; then
    fail "$label"
    echo "    did not expect to find: $needle"
  else
    pass "$label"
  fi
}

assert_order_text() {
  local haystack="$1"
  local first="$2"
  local second="$3"
  local label="$4"
  local line_first line_second

  line_first="$(printf '%s\n' "$haystack" | grep -Fn -- "$first" | head -n 1 | cut -d: -f1 || true)"
  line_second="$(printf '%s\n' "$haystack" | grep -Fn -- "$second" | head -n 1 | cut -d: -f1 || true)"

  if [[ -z "$line_first" || -z "$line_second" ]]; then
    fail "$label"
    echo "    missing pattern(s): first='$first' (${line_first:-missing}), second='$second' (${line_second:-missing})"
  elif [[ "$line_first" -lt "$line_second" ]]; then
    pass "$label"
  else
    fail "$label"
    echo "    expected '$first' (line $line_first) before '$second' (line $line_second)"
  fi
}

section_text() {
  local file="$1"
  local heading="$2"
  awk -v h="$heading" '
    $0 == h { in_sec=1; next }
    in_sec && /^## / { exit }
    in_sec { print }
  ' "$file"
}

subsection_text() {
  local file="$1"
  local heading="$2"
  awk -v h="$heading" '
    $0 == h { in_sec=1; next }
    in_sec && /^###? / { exit }
    in_sec { print }
  ' "$file"
}

assert_contains_multiline() {
  local haystack="$1"
  local needle="$2"
  local label="$3"

  if [[ "$haystack" == *"$needle"* ]]; then
    pass "$label"
  else
    fail "$label"
    echo "    expected exact block not found"
  fi
}

extract_section_first_bash() {
  local file="$1"
  local heading="$2"
  awk -v h="$heading" '
    $0 == h { in_sec=1; next }
    in_sec && /^## / { exit }
    in_sec && /^```bash$/ { in_code=1; next }
    in_sec && in_code && /^```$/ { exit }
    in_sec && in_code { print }
  ' "$file"
}

assert_exact_line() {
  local haystack="$1"
  local expected_line="$2"
  local label="$3"

  if printf '%s\n' "$haystack" | grep -Fqx -- "$expected_line"; then
    pass "$label"
  else
    fail "$label"
    echo "    expected exact line: $expected_line"
  fi
}

extract_subsection_nth_bash() {
  local file="$1"
  local heading="$2"
  local target_idx="$3"
  awk -v h="$heading" -v n="$target_idx" '
    $0 == h { in_sec=1; next }
    in_sec && /^###? / { exit }
    in_sec && /^[[:space:]]*```bash$/ {
      idx++
      if (idx == n) {
        in_code=1
        match($0, /^[[:space:]]*/)
        indent=RLENGTH
      }
      next
    }
    in_sec && in_code && /^[[:space:]]*```$/ { exit }
    in_sec && in_code {
      if (indent > 0 && length($0) > indent) {
        print substr($0, indent + 1)
      } else {
        print
      }
    }
  ' "$file"
}

extract_subsection_first_bash() {
  local file="$1"
  local heading="$2"
  awk -v h="$heading" '
    $0 == h { in_sec=1; next }
    in_sec && /^###? / { exit }
    in_sec && /^```bash$/ { in_code=1; next }
    in_sec && in_code && /^```$/ { exit }
    in_sec && in_code { print }
  ' "$file"
}

init_repo_with_commit() {
  local dir="$1"
  git init -q -b main "$dir"
  git -C "$dir" config user.name "Test Bot"
  git -C "$dir" config user.email "test@example.com"
  git -C "$dir" config commit.gpgsign false
  printf 'hello\n' > "$dir/README.md"
  git -C "$dir" add README.md
  git -C "$dir" commit -q -m "initial"
}

test_using_git_worktrees_contracts() {
  echo "=== using-git-worktrees static contracts ==="

  local full_skill step0 step1a step1b step2 quick_ref rationalizations
  full_skill="$(cat "$USING_SKILL")"
  step0="$(section_text "$USING_SKILL" "## Step 0: Detect Existing Isolation")"
  step1a="$(subsection_text "$USING_SKILL" "### 1a. Native Worktree Tools (preferred)")"
  step1b="$(subsection_text "$USING_SKILL" "### 1b. Git Worktree Fallback")"
  step2="$(section_text "$USING_SKILL" "## Step 2: Project Setup")"
  quick_ref="$(section_text "$USING_SKILL" "## Quick Reference")"
  rationalizations="$(section_text "$USING_SKILL" "## Common Rationalizations")"

  # Step 0 checks
  assert_contains_text "$step0" "git rev-parse --verify HEAD" "Step 0 checks git rev-parse --verify HEAD"
  assert_contains_text "$step0" "unborn" "Step 0 handles unborn 0-commit repos"
  assert_not_contains_text "$full_skill" '`GIT_DIR != GIT_COMMON` is also true inside git submodules' "Step 0 removes false submodule claim"
  assert_contains_text "$step0" "git rev-parse --show-superproject-working-tree" "Step 0 keeps superproject submodule check"
  assert_contains_text "$step0" 'Would you like me to set up an isolated worktree? It protects your current branch from changes.' "Step 0 preserves consent prompt"
  assert_contains_text "$step0" "Honor any existing declared preference without asking. If the user declines consent, work in place and skip to Step 2." "Step 0 preserves consent decline prose"

  # Step 1a & Common Rationalizations checks
  assert_contains_text "$step1a" "EnterWorktree" "Step 1a names EnterWorktree"
  assert_contains_text "$step1a" "create_worktree" "Step 1a names create_worktree"
  assert_contains_text "$step1a" "/worktree" "Step 1a names /worktree"
  assert_contains_text "$step1a" "--worktree" "Step 1a names --worktree"
  assert_not_contains_text "$full_skill" "WorktreeCreate" "using-git-worktrees drops WorktreeCreate hook event"
  assert_not_contains_text "$step1a" "skip to Step 2" "Step 1a no longer skips base-commit verification"
  assert_contains_text "$step1a" "verify the base commit before Step 2" "Step 1a verifies base commit before Step 2"
  assert_contains_text "$step1a" "<START_HEAD>" "Step 1a references <START_HEAD>"
  assert_contains_text "$step1a" "git merge-base --is-ancestor" "Step 1a checks git merge-base --is-ancestor"
  assert_contains_text "$step1a" "git merge --ff-only" "Step 1a fast-forwards clean trunk with git merge --ff-only"
  assert_contains_text "$step1a" "ask your human partner" "Step 1a stops and asks human partner on mismatch"
  assert_contains_text "$step1a" "git switch -C" "Step 1a includes git switch -C option for partner choice"
  assert_contains_text "$rationalizations" "<START_HEAD>" "Common Rationalizations mentions <START_HEAD> base check"
  assert_contains_text "$rationalizations" "verify the base commit" "Common Rationalizations notes Step 1a base verification"

  # Step 1b checks
  assert_contains_text "$step1b" 'default to `.worktrees/` at the project root' "Step 1b preserves default .worktrees/ phrase"
  assert_contains_text "$step1b" "git rev-parse --show-toplevel" "Step 1b scopes Safety Verification to --show-toplevel"
  assert_contains_text "$step1b" 'git check-ignore -q "<chosen-dir>/"' "Step 1b checks git check-ignore -q with trailing slash"
  assert_contains_text "$step1b" '{ [ -e "<chosen-dir>/.gitignore" ] || printf' "Step 1b groups .gitignore creation guard"
  assert_contains_text "$step1b" 'git check-ignore -q "<chosen-dir>/<branch-name>"' "Step 1b re-verifies target worktree path with git check-ignore"
  assert_contains_text "$step1b" "still does not ignore" "Step 1b stops and asks when existing .gitignore leaves target unignored"
  assert_contains_text "$step1b" '<chosen-dir>/.gitignore' "Step 1b uses self-ignoring <chosen-dir>/.gitignore"
  assert_not_contains_text "$step1b" "Add to .gitignore" "Step 1b does not tell agent to edit/commit root .gitignore"
  assert_not_contains_text "$step1b" "commit the change" "Step 1b does not make an unrequested .gitignore commit"
  assert_not_contains_text "$full_skill" '$LOCATION' "using-git-worktrees does not use unassigned \$LOCATION"
  assert_not_contains_text "$full_skill" '$BRANCH_NAME' "using-git-worktrees does not use unassigned \$BRANCH_NAME"
  assert_contains_text "$step1b" 'git worktree add --no-track "<chosen-dir>/<branch-name>" -b "<branch-name>" HEAD' "Step 1b uses --no-track and HEAD with literal placeholders"
  assert_contains_text "$step1b" "ask your human partner" "Step 1b reports sandbox denial and asks human partner"

  # Step 2 & Quick Reference checks
  assert_not_contains_text "$step2" "if [ -f pyproject.toml ]; then poetry install; fi" "Step 2 drops unconditional poetry install"
  assert_not_contains_text "$step2" "if [ -f package.json ]; then npm install; fi" "Step 2 drops hardcoded npm install block"
  assert_order_text "$quick_ref" "Instruction" 'Default `.worktrees/`' "Quick Reference puts instruction-file preference before .worktrees/ default"
  assert_order_text "$quick_ref" "Instruction" '`.worktrees/` exists' "Quick Reference puts instruction-file preference before existing .worktrees/"
  assert_not_contains_text "$quick_ref" "Add to .gitignore + commit" "Quick Reference drops root .gitignore commit row"
  assert_contains_text "$quick_ref" '<chosen-dir>/.gitignore' "Quick Reference uses self-ignoring <chosen-dir>/.gitignore"
  assert_contains_text "$quick_ref" "Report denial + ask" "Quick Reference reports denial + ask on permission error"
  assert_not_contains_text "$quick_ref" "Sandbox fallback, work in place" "Quick Reference drops silent work-in-place fallback"
}

test_using_git_worktrees_mechanics() {
  echo "=== using-git-worktrees git mechanics ==="

  local step0_code unborn_repo out normal_repo head_sha wt_repo sub_repo
  step0_code="$(extract_section_first_bash "$USING_SKILL" "## Step 0: Detect Existing Isolation")"

  # 1. Step 0 snippet in unborn 0-commit repo
  unborn_repo="$TEST_ROOT/unborn"
  git init -q -b main "$unborn_repo"
  if out="$(cd "$unborn_repo" && bash -euo pipefail -c "$step0_code" 2>&1)"; then
    assert_exact_line "$out" "START_HEAD=unborn" "Step 0 snippet handles unborn 0-commit repo cleanly and prints START_HEAD=unborn"
  else
    fail "Step 0 snippet failed in unborn 0-commit repo"
    echo "    output: $out"
  fi

  # 2. Step 0 snippet in normal repo, linked worktree, and submodule
  normal_repo="$TEST_ROOT/normal"
  init_repo_with_commit "$normal_repo"
  head_sha="$(git -C "$normal_repo" rev-parse HEAD)"
  out="$(cd "$normal_repo" && bash -euo pipefail -c "$step0_code")"
  assert_exact_line "$out" "START_HEAD=$head_sha" "Step 0 snippet prints HEAD commit SHA"
  assert_exact_line "$out" "BRANCH=main" "Step 0 snippet prints BRANCH=main"

  wt_repo="$TEST_ROOT/normal-wt"
  git -C "$normal_repo" worktree add --no-track -q "$wt_repo" -b feat/wt HEAD
  out="$(cd "$wt_repo" && bash -euo pipefail -c "$step0_code")"
  local wt_git_dir wt_git_common
  wt_git_dir="$(printf '%s\n' "$out" | sed -n 's/^GIT_DIR=//p')"
  wt_git_common="$(printf '%s\n' "$out" | sed -n 's/^GIT_COMMON=//p')"
  if [[ -n "$wt_git_dir" && -n "$wt_git_common" && "$wt_git_dir" != "$wt_git_common" ]]; then
    pass "Step 0 detects linked worktree via GIT_DIR != GIT_COMMON"
  else
    fail "Step 0 detects linked worktree via GIT_DIR != GIT_COMMON ($wt_git_dir vs $wt_git_common)"
  fi

  sub_repo="$TEST_ROOT/sub-target"
  init_repo_with_commit "$sub_repo"
  git -C "$normal_repo" -c protocol.file.allow=always submodule add -q "$sub_repo" libs/sub
  git -C "$normal_repo" commit -q -m "add submodule"
  out="$(cd "$normal_repo/libs/sub" && bash -euo pipefail -c "$step0_code")"
  local sub_git_dir sub_git_common super_root
  sub_git_dir="$(printf '%s\n' "$out" | sed -n 's/^GIT_DIR=//p')"
  sub_git_common="$(printf '%s\n' "$out" | sed -n 's/^GIT_COMMON=//p')"
  super_root="$(cd "$normal_repo/libs/sub" && git rev-parse --show-superproject-working-tree 2>/dev/null || true)"
  if [[ -n "$sub_git_dir" && "$sub_git_dir" == "$sub_git_common" && -n "$super_root" ]]; then
    pass "Normal submodule has GIT_DIR == GIT_COMMON and non-empty superproject root"
  else
    fail "Normal submodule check failed (dir=$sub_git_dir common=$sub_git_common super=$super_root)"
  fi

  # 3. Step 1a base-commit ff-only vs stop-and-ask mechanics
  local upstream_bare clone_repo start_head_main native_wt
  upstream_bare="$TEST_ROOT/upstream.git"
  git init -q --bare -b main "$upstream_bare"
  clone_repo="$TEST_ROOT/clone"
  init_repo_with_commit "$clone_repo"
  git -C "$clone_repo" remote add origin "$upstream_bare"
  git -C "$clone_repo" push -q -u origin main

  # Advance local main ahead of origin/main
  printf 'local-ahead\n' > "$clone_repo/ahead.txt"
  git -C "$clone_repo" add ahead.txt
  git -C "$clone_repo" commit -q -m "local ahead commit"
  start_head_main="$(git -C "$clone_repo" rev-parse HEAD)"

  # Simulate native worktree branching from origin/main instead of local main
  native_wt="$TEST_ROOT/native-wt-main"
  git -C "$clone_repo" worktree add --no-track -q "$native_wt" -b worktree-native origin/main
  if [[ "$(git -C "$native_wt" rev-parse HEAD)" != "$start_head_main" ]] \
    && [[ -z "$(git -C "$native_wt" status --porcelain)" ]] \
    && git -C "$native_wt" merge-base --is-ancestor HEAD "$start_head_main"; then
    git -C "$native_wt" merge --ff-only -q "$start_head_main"
  fi
  if [[ "$(git -C "$native_wt" rev-parse HEAD)" == "$start_head_main" ]]; then
    pass "Step 1a base verification fast-forwards clean trunk native worktree to <START_HEAD>"
  else
    fail "Step 1a base verification failed to fast-forward clean trunk native worktree"
  fi

  # Simulate starting on a feature branch ahead of origin/main
  git -C "$clone_repo" checkout -q -b feature/base
  printf 'feature\n' > "$clone_repo/feat.txt"
  git -C "$clone_repo" add feat.txt
  git -C "$clone_repo" commit -q -m "feature commit"
  local start_head_feat native_wt_feat native_base_before
  start_head_feat="$(git -C "$clone_repo" rev-parse HEAD)"
  native_wt_feat="$TEST_ROOT/native-wt-feat"
  git -C "$clone_repo" worktree add --no-track -q "$native_wt_feat" -b worktree-feat origin/main
  native_base_before="$(git -C "$native_wt_feat" rev-parse HEAD)"
  local start_branch="feature/base"
  if [[ "$start_branch" == "main" || "$start_branch" == "master" || "$start_branch" == "dev" ]] \
    && [[ -z "$(git -C "$native_wt_feat" status --porcelain)" ]] \
    && git -C "$native_wt_feat" merge-base --is-ancestor HEAD "$start_head_feat"; then
    git -C "$native_wt_feat" merge --ff-only -q "$start_head_feat"
  fi
  if [[ "$(git -C "$native_wt_feat" rev-parse HEAD)" == "$native_base_before" ]]; then
    pass "Step 1a stops without auto-merging when started from non-trunk feature branch"
  else
    fail "Step 1a unexpectedly modified HEAD on non-trunk feature branch"
  fi

  # Simulate dirty native worktree on main: must stop and ask rather than merge
  local native_wt_dirty native_dirty_before
  native_wt_dirty="$TEST_ROOT/native-wt-dirty"
  git -C "$clone_repo" worktree add --no-track -q "$native_wt_dirty" -b worktree-dirty origin/main
  native_dirty_before="$(git -C "$native_wt_dirty" rev-parse HEAD)"
  printf 'dirty\n' > "$native_wt_dirty/uncommitted.txt"
  if [[ -z "$(git -C "$native_wt_dirty" status --porcelain)" ]] \
    && git -C "$native_wt_dirty" merge-base --is-ancestor HEAD "$start_head_main"; then
    git -C "$native_wt_dirty" merge --ff-only -q "$start_head_main"
  fi
  if [[ "$(git -C "$native_wt_dirty" rev-parse HEAD)" == "$native_dirty_before" ]]; then
    pass "Step 1a stops without auto-merging when worktree is dirty"
  else
    fail "Step 1a unexpectedly merged into dirty worktree"
  fi

  # Verify git switch -C moves native worktree branch to <START_HEAD> when partner chooses it
  git -C "$native_wt_feat" switch -q -C worktree-feat "$start_head_feat"
  if [[ "$(git -C "$native_wt_feat" rev-parse HEAD)" == "$start_head_feat" ]]; then
    pass "Step 1a git switch -C retargets native worktree branch when chosen"
  else
    fail "Step 1a git switch -C failed to retarget branch"
  fi

  # 4. Step 1b self-ignoring .gitignore + zero commits added to main
  local self_ignore_repo main_count_before main_count_after status_out
  self_ignore_repo="$TEST_ROOT/self-ignore"
  init_repo_with_commit "$self_ignore_repo"
  main_count_before="$(git -C "$self_ignore_repo" rev-list --count HEAD)"
  if ! git -C "$self_ignore_repo" check-ignore -q ".worktrees/"; then
    mkdir -p "$self_ignore_repo/.worktrees"
    [[ -e "$self_ignore_repo/.worktrees/.gitignore" ]] || printf '*\n' > "$self_ignore_repo/.worktrees/.gitignore"
  fi
  git -C "$self_ignore_repo" worktree add --no-track -q "$self_ignore_repo/.worktrees/feat-a" -b feat-a HEAD
  main_count_after="$(git -C "$self_ignore_repo" rev-list --count main)"
  status_out="$(git -C "$self_ignore_repo" status --porcelain -uall)"
  if [[ -z "$status_out" ]] \
    && git -C "$self_ignore_repo" check-ignore -q ".worktrees/" \
    && [[ "$main_count_before" -eq "$main_count_after" ]]; then
    pass "Step 1b self-ignoring .worktrees/.gitignore leaves status clean, check-ignore 0, and 0 commits added"
  else
    fail "Step 1b self-ignoring .gitignore check failed (status='$status_out', count=$main_count_before->$main_count_after)"
  fi

  # Existing .worktrees/.gitignore is preserved (create-only guard)
  printf '!keep\n*\n' > "$self_ignore_repo/.worktrees/.gitignore"
  [[ -e "$self_ignore_repo/.worktrees/.gitignore" ]] || printf '*\n' > "$self_ignore_repo/.worktrees/.gitignore"
  if [[ "$(cat "$self_ignore_repo/.worktrees/.gitignore")" == $'!keep\n*' ]]; then
    pass "Step 1b create-only guard preserves existing .worktrees/.gitignore"
  else
    fail "Step 1b overwrote existing .worktrees/.gitignore"
  fi

  # Pre-existing .worktrees/.gitignore with unrelated rules (*.log) leaves worktree unignored -> re-verify catches it
  local log_ignore_repo
  log_ignore_repo="$TEST_ROOT/log-ignore"
  init_repo_with_commit "$log_ignore_repo"
  mkdir -p "$log_ignore_repo/.worktrees"
  printf '*.log\n' > "$log_ignore_repo/.worktrees/.gitignore"
  mkdir -p "$log_ignore_repo/.worktrees" && { [[ -e "$log_ignore_repo/.worktrees/.gitignore" ]] || printf '*\n' > "$log_ignore_repo/.worktrees/.gitignore"; }
  if [[ "$(cat "$log_ignore_repo/.worktrees/.gitignore")" == "*.log" ]] \
    && ! git -C "$log_ignore_repo" check-ignore -q ".worktrees/feat-logcheck"; then
    pass "Step 1b preserves *.log .gitignore and re-verify catches unignored .worktrees/<branch-name>"
  else
    fail "Step 1b failed to preserve *.log .gitignore or catch unignored .worktrees/<branch-name>"
  fi

  # 5. Step 1b --no-track leaves upstream unset even with branch.autoSetupMerge=inherit
  local prod_bare track_repo upstream_ref=""
  prod_bare="$TEST_ROOT/prod.git"
  git init -q --bare -b production "$prod_bare"
  track_repo="$TEST_ROOT/track-repo"
  init_repo_with_commit "$track_repo"
  git -C "$track_repo" remote add origin "$prod_bare"
  git -C "$track_repo" push -q origin main:production
  git -C "$track_repo" fetch -q origin
  git -C "$track_repo" checkout -q -b local-main --track origin/production
  git -C "$track_repo" config branch.autoSetupMerge inherit
  git -C "$track_repo" worktree add --no-track -q "$track_repo/.worktrees/feat-notrack" -b feat-notrack HEAD
  upstream_ref="$(git -C "$track_repo/.worktrees/feat-notrack" rev-parse --abbrev-ref '@{u}' 2>/dev/null || true)"
  if [[ -z "$upstream_ref" ]]; then
    pass "Step 1b --no-track leaves upstream unset under branch.autoSetupMerge=inherit"
  else
    fail "Step 1b --no-track unexpectedly set upstream to '$upstream_ref'"
  fi
}

classify_unique_inventory() {
  local wt="$1"
  local status_out ls_untracked ls_ignored line list path dir plan_dir
  local -a candidates=()

  status_out="$(git -C "$wt" status --porcelain -uall --ignored=matching)"
  ls_untracked="$(git -C "$wt" ls-files --others --exclude-standard -- .superpowers)"
  ls_ignored="$(git -C "$wt" ls-files --others --ignored --exclude-standard -- .superpowers)"

  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    path="${line#???}"
    # Skip collapsed .superpowers entries here because ls-files inspects them in full
    case "$path" in
      .superpowers | .superpowers/*)
        continue
        ;;
    esac
    candidates+=("$path")
  done <<EOF
$status_out
EOF

  for list in "$ls_untracked" "$ls_ignored"; do
    while IFS= read -r path; do
      [[ -n "$path" ]] || continue
      candidates+=("$path")
    done <<EOF
$list
EOF
  done

  if [[ "${#candidates[@]}" -eq 0 ]]; then
    return 0
  fi

  for path in "${candidates[@]}"; do
    case "$path" in
      .superpowers/sdd/.gitignore | .superpowers/brainstorm/.last-port | .superpowers/brainstorm/.last-token)
        continue
        ;;
      .DS_Store | */.DS_Store | Thumbs.db | */Thumbs.db)
        continue
        ;;
      node_modules | node_modules/* | .venv | .venv/* | venv | venv/* | target | target/* | dist | dist/* | build | build/* | __pycache__ | __pycache__/* | .pytest_cache | .pytest_cache/* | .ruff_cache | .ruff_cache/* | .mypy_cache | .mypy_cache/* | .next | .next/* | .turbo | .turbo/*)
        continue
        ;;
      .superpowers/sdd/*)
        plan_dir="${path#.superpowers/sdd/}"
        plan_dir="${plan_dir%%/*}"
        dir="$wt/.superpowers/sdd/$plan_dir"
        if [[ -f "$dir/progress.md" ]] && [[ "$(tail -n 1 "$dir/progress.md" | tr -d '\r')" == "finish" ]]; then
          continue
        fi
        ;;
    esac
    printf '%s\n' "$path"
  done
}

test_finishing_contracts() {
  echo "=== finishing-a-development-branch static contracts ==="

  local full_skill step2 step5 opt1 discard_sec step6 rationalizations
  local menu_3 menu_2
  full_skill="$(cat "$FINISHING_SKILL")"
  step2="$(section_text "$FINISHING_SKILL" "## Step 2: Detect Environment")"
  step5="$(section_text "$FINISHING_SKILL" "## Step 5: Execute Choice")"
  opt1="$(subsection_text "$FINISHING_SKILL" "### Option 1: Merge Locally")"
  discard_sec="$(subsection_text "$FINISHING_SKILL" "### If your human partner asks to discard the work")"
  step6="$(section_text "$FINISHING_SKILL" "## Step 6: Cleanup Workspace")"
  rationalizations="$(section_text "$FINISHING_SKILL" "## Common Rationalizations")"

  # Zero "the user" (case-insensitive)
  if printf '%s\n' "$full_skill" | grep -qi "the user"; then
    fail "finishing-a-development-branch contains zero occurrences of 'the user'"
  else
    pass "finishing-a-development-branch contains zero occurrences of 'the user'"
  fi

  # Both fenced option menus verbatim
  menu_3=$'```\nImplementation complete. What would you like to do?\n\n1. Merge back to <base-branch> locally\n2. Push and create a Pull Request\n3. Keep the branch as-is (I\'ll handle it later)\n\nWhich option?\n```'
  menu_2=$'```\nImplementation complete. You\'re on a detached HEAD (externally managed workspace).\n\n1. Push as new branch and create a Pull Request\n2. Keep as-is (I\'ll handle it later)\n\nWhich option?\n```'
  assert_contains_multiline "$full_skill" "$menu_3" "Step 4 preserves 3-option menu verbatim"
  assert_contains_multiline "$full_skill" "$menu_2" "Step 4 preserves 2-option detached HEAD menu verbatim"
  assert_contains_text "$full_skill" '`.worktrees/` or `worktrees/`' "finishing-a-development-branch preserves .worktrees/ or worktrees/ substring"

  # Step 2 contracts
  assert_contains_text "$step2" "BRANCH=\$(git branch --show-current)" "Step 2 captures BRANCH"
  assert_contains_text "$step2" "WORKTREE_PATH=\$(git rev-parse --show-toplevel)" "Step 2 captures WORKTREE_PATH"
  assert_contains_text "$step2" 'test -n "$WORKTREE_PATH"' "Step 2 confirms WORKTREE_PATH is non-empty"

  # Primary checkout resolution contracts
  assert_not_contains_text "$full_skill" '$(git rev-parse --git-common-dir)/..' "finishing-a-development-branch drops broken git-common-dir/.. calculation"
  assert_contains_text "$step5" "git -c core.quotePath=false worktree list --porcelain | sed -n '1s/^worktree //p'" "Step 5 resolves first_wt via 2-line porcelain sed"
  assert_contains_text "$step5" "rev-parse --show-toplevel" "Step 5 resolves MAIN_ROOT via rev-parse --show-toplevel"
  assert_contains_text "$step5" "no local checkout of \`<base-branch>\`" "Option 1 handles bare repo without local checkout"
  assert_contains_text "$discard_sec" 'git --git-dir="$GIT_COMMON"' "Bare-hub Discard uses --git-dir=\$GIT_COMMON"

  # Unique-File Check contracts
  assert_contains_text "$step5" 'git -C "$WORKTREE_PATH" status --porcelain -uall --ignored=matching' "Step 5 runs status --porcelain -uall --ignored=matching"
  assert_contains_text "$step5" 'git -C "$WORKTREE_PATH" ls-files --others --exclude-standard -- .superpowers' "Step 5 runs ls-files untracked on .superpowers"
  assert_contains_text "$step5" 'git -C "$WORKTREE_PATH" ls-files --others --ignored --exclude-standard -- .superpowers' "Step 5 runs ls-files ignored on .superpowers"
  assert_contains_text "$step5" ".superpowers/sdd/.gitignore" "Skip list includes .superpowers/sdd/.gitignore"
  assert_contains_text "$step5" "ends with exact line \`finish\`" "Skip list checks progress.md terminal exact line finish"
  assert_contains_text "$step5" "unfinished" "Missing progress.md or missing finish is treated as unfinished"
  assert_contains_text "$step5" ".superpowers/brainstorm/.last-port" "Skip list includes .last-port"
  assert_contains_text "$step5" ".superpowers/brainstorm/.last-token" "Skip list includes .last-token"

  # Option 1 unique-file & merge execution contracts
  assert_contains_text "$opt1" "These files have changes or untracked/ignored content that exist only in this worktree" "Option 1 uses accurate unique-file prompt wording"
  assert_contains_text "$opt1" 'never `git add -f`' "Option 1 forbids git add -f on ignored files"
  assert_contains_text "$opt1" "without overwriting any existing \`<MAIN_ROOT>\` file unless your human partner confirms" "Option 1 prevents silent overwrite on Move/copy"
  assert_contains_text "$opt1" 'ExitWorktree(action="keep")' "Option 1 calls ExitWorktree(action=\"keep\") for .claude/worktrees/"
  assert_contains_text "$opt1" 'cd "$MAIN_ROOT"' "Option 1 changes directory to MAIN_ROOT after ExitWorktree"
  assert_contains_text "$opt1" 'git rev-parse --abbrev-ref' "Option 1 gates upstream fast-forward on @{u}"
  assert_contains_text "$opt1" 'git fetch && git merge --ff-only --no-overwrite-ignore' "Option 1 fetches and fast-forwards with --no-overwrite-ignore"
  assert_contains_text "$opt1" 'git checkout --no-overwrite-ignore <base-branch>' "Option 1 switches with --no-overwrite-ignore"
  assert_contains_text "$opt1" 'git merge --no-overwrite-ignore <feature-branch>' "Option 1 merges feature with --no-overwrite-ignore"
  assert_contains_text "$opt1" 'never pass `-f`/`--force` to `git checkout`' "Option 1 forbids checkout -f/--force"
  if printf '%s\n' "$full_skill" | grep -Eq '^[[:space:]]*git pull[[:space:]]*$'; then
    fail "finishing-a-development-branch has no unconditional bare git pull"
  else
    pass "finishing-a-development-branch has no unconditional bare git pull"
  fi
  assert_contains_text "$opt1" "GIT_DIR == GIT_COMMON" "Option 1 handles in-place normal-checkout SDD cleanup"
  assert_contains_text "$opt1" 'find "$MAIN_ROOT/.superpowers/sdd" -mindepth 1 -maxdepth 1 -type d' "Option 1 SDD cleanup uses zsh-safe find loop"
  assert_not_contains_text "$opt1" '/.superpowers/sdd/*/' "Option 1 SDD cleanup drops NOMATCH glob"
  assert_contains_text "$opt1" "unless **Keep** was chosen" "Option 1 .claude/worktrees/ handoff honors Keep choice"

  # Discard contracts
  assert_contains_text "$discard_sec" "- Unique files in worktree:" "Discard confirmation lists unique files in worktree"
  assert_contains_text "$discard_sec" "never offer to commit to \`<branch>\`" "Discard never offers to commit to <branch>"
  assert_not_contains_text "$discard_sec" "Commit to" "Discard never offers Commit to <branch>"
  assert_not_contains_text "$discard_sec" "Commit them to" "Discard never offers Commit them to <branch>"
  assert_not_contains_text "$step6" "Commit them to <branch>" "Step 6 drops old Commit them to <branch> menu"
  assert_contains_text "$discard_sec" "git checkout --no-overwrite-ignore <base-branch>" "Discard switches with --no-overwrite-ignore"

  # Step 6 & Common Rationalizations contracts
  assert_contains_text "$step6" "submodule status" "Step 6 checks submodule status before single --force"
  assert_contains_text "$step6" '^[^-]' "Step 6 checks initialized submodules (^[^-]) before single --force"
  assert_contains_text "$step6" ".claude/worktrees/" "Step 6 owns .claude/worktrees/ cleanup"
  assert_contains_text "$step6" "declared in instructions" "Step 6 owns declared worktree directory cleanup"
  assert_contains_text "$step6" "git stash" "Step 6 bans git stash bypass"
  assert_contains_text "$step6" 'ExitWorktree(action="remove")' "Step 6 bans ExitWorktree(action=\"remove\") without typed discard"
  assert_contains_text "$step6" "never use -f -f" "Step 6 bans double-force -f -f"
  assert_contains_text "$step6" "do not** run \`git branch -d\`" "Step 6 skips git branch -d when removal is refused"
  assert_contains_text "$rationalizations" "Clean up only THIS branch's worktree" "Common Rationalizations updates stale-worktree row"
  assert_contains_text "$rationalizations" ".claude/worktrees/" "Common Rationalizations includes .claude/worktrees/"
  assert_contains_text "$rationalizations" "declared worktree directory" "Common Rationalizations includes declared worktree directory"
}

test_finishing_mechanics() {
  echo "=== finishing-a-development-branch git mechanics ==="

  local step2_code resolve_code
  step2_code="$(extract_section_first_bash "$FINISHING_SKILL" "## Step 2: Detect Environment")"
  resolve_code="$(extract_subsection_first_bash "$FINISHING_SKILL" "### Resolve Primary Checkout (Option 1 and Discard)")"

  # 1. Step 2 snippet in normal repo, linked worktree, and detached HEAD
  local norm_repo out wt_linked wt_detached
  norm_repo="$TEST_ROOT/fin-normal"
  init_repo_with_commit "$norm_repo"
  if [[ -n "$step2_code" ]] && out="$(cd "$norm_repo" && bash -euo pipefail -c "$step2_code" 2>&1)"; then
    local gd gc br wp
    gd="$(printf '%s\n' "$out" | sed -n 's/^GIT_DIR=//p')"
    gc="$(printf '%s\n' "$out" | sed -n 's/^GIT_COMMON=//p')"
    br="$(printf '%s\n' "$out" | sed -n 's/^BRANCH=//p')"
    wp="$(printf '%s\n' "$out" | sed -n 's/^WORKTREE_PATH=//p')"
    if [[ -n "$gd" && "$gd" == "$gc" && "$br" == "main" && -n "$wp" ]]; then
      pass "Step 2 snippet detects normal repo (GIT_DIR == GIT_COMMON, BRANCH=main)"
    else
      fail "Step 2 snippet normal repo check failed (gd=$gd gc=$gc br=$br wp=$wp)"
    fi
  else
    fail "Step 2 snippet failed in normal repo"
  fi

  wt_linked="$TEST_ROOT/fin-normal/.worktrees/feat-a"
  git -C "$norm_repo" worktree add --no-track -q "$wt_linked" -b feat-a HEAD
  if [[ -n "$step2_code" ]] && out="$(cd "$wt_linked" && bash -euo pipefail -c "$step2_code" 2>&1)"; then
    local gd gc br wp
    gd="$(printf '%s\n' "$out" | sed -n 's/^GIT_DIR=//p')"
    gc="$(printf '%s\n' "$out" | sed -n 's/^GIT_COMMON=//p')"
    br="$(printf '%s\n' "$out" | sed -n 's/^BRANCH=//p')"
    wp="$(printf '%s\n' "$out" | sed -n 's/^WORKTREE_PATH=//p')"
    if [[ -n "$gd" && "$gd" != "$gc" && "$br" == "feat-a" && "$wp" == "$(cd "$wt_linked" && pwd -P)" ]]; then
      pass "Step 2 snippet detects linked worktree (GIT_DIR != GIT_COMMON, BRANCH=feat-a)"
    else
      fail "Step 2 snippet linked worktree check failed (gd=$gd gc=$gc br=$br wp=$wp)"
    fi
  else
    fail "Step 2 snippet failed in linked worktree"
  fi

  wt_detached="$TEST_ROOT/fin-normal/.worktrees/detached"
  git -C "$norm_repo" worktree add -q --detach "$wt_detached" HEAD
  if [[ -n "$step2_code" ]] && out="$(cd "$wt_detached" && bash -euo pipefail -c "$step2_code" 2>&1)"; then
    if printf '%s\n' "$out" | grep -qx 'BRANCH=' && printf '%s\n' "$out" | grep -q '^WORKTREE_PATH=.'; then
      pass "Step 2 snippet handles detached HEAD cleanly with empty BRANCH"
    else
      fail "Step 2 snippet detached HEAD expected BRANCH= and non-empty WORKTREE_PATH, got: $out"
    fi
  else
    fail "Step 2 snippet failed in detached HEAD worktree"
  fi

  # 2. Spaces + linked worktree + absorbed submodule + bare-metal path + bare hub
  local space_repo space_wt sub_src sub_wt bare_metal_repo bare_metal_wt
  local expected_space expected_sub expected_bm
  space_repo="$TEST_ROOT/my repo"
  init_repo_with_commit "$space_repo"
  expected_space="$(cd "$space_repo" && pwd -P)"
  space_wt="$space_repo/.worktrees/feat space"
  git -C "$space_repo" worktree add --no-track -q "$space_wt" -b feat-space HEAD

  sub_src="$TEST_ROOT/sub-src"
  init_repo_with_commit "$sub_src"
  git -C "$space_repo" -c protocol.file.allow=always submodule add -q "$sub_src" libs/sub
  git -C "$space_repo" commit -q -m "add submodule"
  expected_sub="$(cd "$space_repo/libs/sub" && pwd -P)"
  sub_wt="$TEST_ROOT/sub-wt"
  git -C "$space_repo/libs/sub" worktree add --no-track -q "$sub_wt" -b feat-sub HEAD

  bare_metal_repo="$TEST_ROOT/bare-metal"
  init_repo_with_commit "$bare_metal_repo"
  expected_bm="$(cd "$bare_metal_repo" && pwd -P)"
  bare_metal_wt="$bare_metal_repo/.worktrees/feat-bm"
  git -C "$bare_metal_repo" worktree add --no-track -q "$bare_metal_wt" -b feat-bm HEAD

  if [[ -n "$resolve_code" ]]; then
    out="$(cd "$space_wt" && bash -euo pipefail -c "$resolve_code"$'\nprintf "MAIN_ROOT=%s\n" "$MAIN_ROOT"')"
    if [[ "$out" == "MAIN_ROOT=$expected_space" ]]; then
      pass "MAIN_ROOT resolves repo path containing spaces from linked worktree"
    else
      fail "MAIN_ROOT spaces resolution failed: $out (expected $expected_space)"
    fi

    out="$(cd "$sub_wt" && bash -euo pipefail -c "$resolve_code"$'\nprintf "MAIN_ROOT=%s\n" "$MAIN_ROOT"')"
    if [[ "$out" == "MAIN_ROOT=$expected_sub" ]]; then
      pass "MAIN_ROOT resolves absorbed submodule working tree from submodule linked worktree"
    else
      fail "MAIN_ROOT submodule resolution failed: $out (expected $expected_sub)"
    fi

    out="$(cd "$bare_metal_wt" && bash -euo pipefail -c "$resolve_code"$'\nprintf "MAIN_ROOT=%s\n" "$MAIN_ROOT"')"
    if [[ "$out" == "MAIN_ROOT=$expected_bm" ]]; then
      pass "Path containing 'bare-metal' is NOT misclassified as bare hub"
    else
      fail "bare-metal path misclassified: $out"
    fi
  else
    fail "Resolve Primary Checkout snippet missing from SKILL.md"
  fi

  # Real bare hub: MAIN_ROOT="", plus Discard via --git-dir
  local bare_hub hub_seed hub_feat hub_common
  bare_hub="$TEST_ROOT/hub.git"
  git init -q --bare -b main "$bare_hub"
  hub_seed="$TEST_ROOT/hub-seed"
  init_repo_with_commit "$hub_seed"
  git -C "$hub_seed" push -q "$bare_hub" main:main
  hub_feat="$TEST_ROOT/hub-feat"
  git -C "$bare_hub" worktree add --no-track -q "$hub_feat" -b feat-hub main
  hub_common="$(cd "$bare_hub" && pwd -P)"

  if [[ -n "$resolve_code" ]]; then
    out="$(cd "$hub_feat" && bash -euo pipefail -c "$resolve_code"$'\nprintf "MAIN_ROOT=%s\n" "$MAIN_ROOT"')"
    if [[ "$out" == "MAIN_ROOT=" ]]; then
      pass "Bare hub exits 0 and reports empty MAIN_ROOT"
    else
      fail "Bare hub check failed: $out"
    fi
  fi

  (
    cd "$hub_common"
    git --git-dir="$hub_common" worktree remove "$hub_feat"
    git --git-dir="$hub_common" worktree prune
    git --git-dir="$hub_common" branch -D -q feat-hub
  )
  if [[ ! -d "$hub_feat" ]] && ! git --git-dir="$hub_common" show-ref --verify --quiet refs/heads/feat-hub; then
    pass "Bare-hub Discard removes worktree and branch via --git-dir=\$GIT_COMMON"
  else
    fail "Bare-hub Discard cleanup failed"
  fi

  # 3. Both .superpowers/ ignore layouts + aborted vs finished SDD + in-place cleanup
  local layout_a layout_b inv_a inv_b status_b
  layout_a="$TEST_ROOT/layout-a"
  init_repo_with_commit "$layout_a"
  printf 'node_modules/\n.env.local\n' > "$layout_a/.gitignore"
  git -C "$layout_a" add .gitignore
  git -C "$layout_a" commit -q -m "add gitignore"
  mkdir -p \
    "$layout_a/node_modules/pkg" \
    "$layout_a/docs/superpowers/plans" \
    "$layout_a/.superpowers/brainstorm/s1/content" \
    "$layout_a/.superpowers/sdd/aborted-no-ledger" \
    "$layout_a/.superpowers/sdd/aborted-partial" \
    "$layout_a/.superpowers/sdd/aborted-false-finish" \
    "$layout_a/.superpowers/sdd/done-plan"
  printf 'module\n' > "$layout_a/node_modules/pkg/index.js"
  printf 'SECRET=1\n' > "$layout_a/.env.local"
  printf '# untracked\n' > "$layout_a/docs/superpowers/plans/untracked.md"
  printf '<h1>hi</h1>\n' > "$layout_a/.superpowers/brainstorm/s1/content/m.html"
  printf '4321\n' > "$layout_a/.superpowers/brainstorm/.last-port"
  printf 'tok\n' > "$layout_a/.superpowers/brainstorm/.last-token"
  printf '*\n' > "$layout_a/.superpowers/sdd/.gitignore"
  printf 'report\n' > "$layout_a/.superpowers/sdd/aborted-no-ledger/task-1-report.md"
  printf 'Task 1: complete\n' > "$layout_a/.superpowers/sdd/aborted-partial/progress.md"
  printf 'Task 1: finish\nunfinished\n' > "$layout_a/.superpowers/sdd/aborted-false-finish/progress.md"
  printf 'Task 1: complete\nfinish\n' > "$layout_a/.superpowers/sdd/done-plan/progress.md"
  printf 'ds\n' > "$layout_a/.DS_Store"

  inv_a="$(classify_unique_inventory "$layout_a")"
  assert_contains_text "$inv_a" ".env.local" "Layout A surfaces .env.local"
  assert_contains_text "$inv_a" "docs/superpowers/plans/untracked.md" "Layout A expands untracked nested dir via -uall"
  assert_contains_text "$inv_a" ".superpowers/brainstorm/s1/content/m.html" "Layout A surfaces brainstorm mockup"
  assert_contains_text "$inv_a" ".superpowers/sdd/aborted-no-ledger/task-1-report.md" "Layout A protects aborted SDD without progress.md"
  assert_contains_text "$inv_a" ".superpowers/sdd/aborted-partial/progress.md" "Layout A protects aborted SDD without finish line"
  assert_contains_text "$inv_a" ".superpowers/sdd/aborted-false-finish/progress.md" "Layout A protects SDD with non-exact finish line"
  assert_not_contains_text "$inv_a" ".superpowers/sdd/.gitignore" "Layout A skips .superpowers/sdd/.gitignore"
  assert_not_contains_text "$inv_a" ".superpowers/sdd/done-plan/progress.md" "Layout A skips finished SDD workspace"
  assert_not_contains_text "$inv_a" ".superpowers/brainstorm/.last-port" "Layout A skips .last-port"
  assert_not_contains_text "$inv_a" ".superpowers/brainstorm/.last-token" "Layout A skips .last-token"
  assert_not_contains_text "$inv_a" "node_modules" "Layout A skips node_modules/"
  assert_not_contains_text "$inv_a" ".DS_Store" "Layout A skips .DS_Store"

  layout_b="$TEST_ROOT/layout-b"
  cp -R "$layout_a" "$layout_b"
  printf '.superpowers/\n' >> "$layout_b/.gitignore"
  git -C "$layout_b" add .gitignore
  git -C "$layout_b" commit -q -m "ignore .superpowers"
  status_b="$(git -C "$layout_b" status --porcelain -uall --ignored=matching)"
  assert_contains_text "$status_b" "!! .superpowers/" "Layout B status collapses .superpowers/ to !! .superpowers/"
  inv_b="$(classify_unique_inventory "$layout_b")"
  assert_contains_text "$inv_b" ".superpowers/sdd/aborted-partial/progress.md" "Layout B ls-files still surfaces aborted-partial/progress.md"
  assert_contains_text "$inv_b" ".superpowers/sdd/aborted-no-ledger/task-1-report.md" "Layout B ls-files still surfaces aborted-no-ledger"
  assert_contains_text "$inv_b" ".superpowers/brainstorm/s1/content/m.html" "Layout B ls-files still surfaces brainstorm/s1/content/m.html"
  assert_not_contains_text "$inv_b" ".superpowers/sdd/.gitignore" "Layout B skips .superpowers/sdd/.gitignore"
  assert_not_contains_text "$inv_b" ".superpowers/sdd/done-plan/progress.md" "Layout B skips finished done-plan/progress.md"
  assert_not_contains_text "$inv_b" ".superpowers/brainstorm/.last-port" "Layout B skips .last-port"

  # In-place normal-checkout finished .superpowers/sdd/<plan>/ cleanup (zsh-safe find loop)
  if [[ -d "$layout_a/.superpowers/sdd" ]]; then
    find "$layout_a/.superpowers/sdd" -mindepth 1 -maxdepth 1 -type d | while IFS= read -r plan_dir; do
      if [[ -f "$plan_dir/progress.md" ]] && [[ "$(tail -n 1 "$plan_dir/progress.md" | tr -d '\r')" == "finish" ]]; then
        rm -rf "$plan_dir"
      fi
    done
  fi
  if [[ ! -d "$layout_a/.superpowers/sdd/done-plan" ]] \
    && [[ -d "$layout_a/.superpowers/sdd/aborted-no-ledger" ]] \
    && [[ -d "$layout_a/.superpowers/sdd/aborted-partial" ]] \
    && [[ -d "$layout_a/.superpowers/sdd/aborted-false-finish" ]] \
    && [[ -f "$layout_a/.superpowers/sdd/.gitignore" ]]; then
    pass "Normal-checkout SDD cleanup deletes only finished plans and preserves aborted plans"
  else
    fail "Normal-checkout SDD cleanup misclassified plans"
  fi

  # Verify extracted Option 1 step 5 cleanup snippet under zsh when .superpowers/sdd is absent, gitignore-only, and mixed
  local opt1_cleanup_code
  opt1_cleanup_code="$(extract_subsection_nth_bash "$FINISHING_SKILL" "### Option 1: Merge Locally" 2)"
  if command -v zsh >/dev/null 2>&1; then
    if [[ -n "$opt1_cleanup_code" ]]; then
      local zsh_repo zsh_cmd
      zsh_repo="$TEST_ROOT/zsh-sdd"
      init_repo_with_commit "$zsh_repo"

      # Case 1: .superpowers/sdd absent
      git -C "$zsh_repo" branch feat-absent
      zsh_cmd="${opt1_cleanup_code//<feature-branch>/feat-absent}"
      if (cd "$zsh_repo" && MAIN_ROOT="$zsh_repo" zsh -euo pipefail -c "$zsh_cmd" 2>/dev/null) \
        && ! git -C "$zsh_repo" show-ref --verify --quiet refs/heads/feat-absent; then
        pass "zsh runs extracted Option 1 SDD cleanup + git branch -d cleanly when .superpowers/sdd is absent"
      else
        fail "zsh failed extracted Option 1 SDD cleanup when .superpowers/sdd is absent"
      fi

      # Case 2: .superpowers/sdd contains only .gitignore
      mkdir -p "$zsh_repo/.superpowers/sdd"
      printf '*\n' > "$zsh_repo/.superpowers/sdd/.gitignore"
      git -C "$zsh_repo" branch feat-empty
      zsh_cmd="${opt1_cleanup_code//<feature-branch>/feat-empty}"
      if (cd "$zsh_repo" && MAIN_ROOT="$zsh_repo" zsh -euo pipefail -c "$zsh_cmd" 2>/dev/null) \
        && [[ -f "$zsh_repo/.superpowers/sdd/.gitignore" ]] \
        && ! git -C "$zsh_repo" show-ref --verify --quiet refs/heads/feat-empty; then
        pass "zsh runs extracted Option 1 SDD cleanup + git branch -d cleanly when .superpowers/sdd has only .gitignore"
      else
        fail "zsh failed extracted Option 1 SDD cleanup when .superpowers/sdd has only .gitignore"
      fi

      # Case 3: .superpowers/sdd has finished + aborted plans
      mkdir -p "$zsh_repo/.superpowers/sdd/done-plan" "$zsh_repo/.superpowers/sdd/aborted-partial"
      printf 'Task 1: complete\nfinish\n' > "$zsh_repo/.superpowers/sdd/done-plan/progress.md"
      printf 'Task 1: complete\n' > "$zsh_repo/.superpowers/sdd/aborted-partial/progress.md"
      git -C "$zsh_repo" branch feat-mixed
      zsh_cmd="${opt1_cleanup_code//<feature-branch>/feat-mixed}"
      if (cd "$zsh_repo" && MAIN_ROOT="$zsh_repo" zsh -euo pipefail -c "$zsh_cmd" 2>/dev/null) \
        && [[ ! -d "$zsh_repo/.superpowers/sdd/done-plan" ]] \
        && [[ -d "$zsh_repo/.superpowers/sdd/aborted-partial" ]] \
        && ! git -C "$zsh_repo" show-ref --verify --quiet refs/heads/feat-mixed; then
        pass "zsh Option 1 SDD cleanup removes only finished plans and deletes branch"
      else
        fail "zsh Option 1 SDD cleanup failed on mixed finished/aborted plans"
      fi
    else
      fail "Option 1 step 5 SDD cleanup bash snippet missing from SKILL.md"
    fi
  fi

  # 4. Dirty untracked removal with single --force vs locked worktree refusal & upstream-gated pull
  local lock_repo dirty_wt locked_wt
  lock_repo="$TEST_ROOT/lock-repo"
  init_repo_with_commit "$lock_repo"
  dirty_wt="$lock_repo/.worktrees/dirty-wt"
  locked_wt="$lock_repo/.worktrees/locked-wt"
  git -C "$lock_repo" worktree add --no-track -q "$dirty_wt" -b feat-dirty HEAD
  git -C "$lock_repo" worktree add --no-track -q "$locked_wt" -b feat-locked HEAD
  printf 'untracked\n' > "$dirty_wt/notes.txt"
  printf 'active\n' > "$locked_wt/notes.txt"
  git -C "$lock_repo" worktree lock "$locked_wt"

  if ! git -C "$lock_repo" worktree remove "$dirty_wt" 2>/dev/null; then
    pass "Plain git worktree remove refuses dirty untracked worktree"
  else
    fail "Plain git worktree remove unexpectedly removed dirty worktree"
  fi

  if git -C "$lock_repo" worktree remove --force "$dirty_wt" 2>/dev/null; then
    pass "Single --force removes confirmed dirty untracked worktree"
  else
    fail "Single --force failed on unlocked dirty worktree"
  fi

  if ! git -C "$lock_repo" worktree remove --force "$locked_wt" 2>/dev/null; then
    pass "Single --force still refuses locked worktree (live session protected)"
  else
    fail "Single --force bypassed git worktree lock"
  fi

  if ! git -C "$lock_repo" branch -d feat-locked 2>/dev/null; then
    pass "git branch -d refuses while locked worktree still checks out branch"
  else
    fail "git branch -d unexpectedly succeeded while checked out in locked worktree"
  fi
  git -C "$lock_repo" worktree unlock "$locked_wt"

  # Extracted Option 1 merge mechanics: no-upstream, upstream-ahead, diverged upstream, and native --no-overwrite-ignore protection
  local opt1_merge_code
  opt1_merge_code="$(extract_subsection_nth_bash "$FINISHING_SKILL" "### Option 1: Merge Locally" 1)"

  local local_only_repo bare_rem rem_clone
  local_only_repo="$TEST_ROOT/no-upstream"
  init_repo_with_commit "$local_only_repo"
  git -C "$local_only_repo" checkout -q -b feat-local
  printf 'feat\n' > "$local_only_repo/feat.txt"
  git -C "$local_only_repo" add feat.txt
  git -C "$local_only_repo" commit -q -m "feat local"
  git -C "$local_only_repo" checkout -q main
  local run_no_up="${opt1_merge_code//<base-branch>/main}"
  run_no_up="${run_no_up//<feature-branch>/feat-local}"
  run_no_up="${run_no_up//<test command>/touch \"\$MAIN_ROOT/ran-tests\"}"
  if (MAIN_ROOT="$local_only_repo" bash -euo pipefail -c "$run_no_up" >/dev/null 2>&1) \
    && [[ -f "$local_only_repo/feat.txt" && -f "$local_only_repo/ran-tests" ]]; then
    pass "Extracted Option 1 merge snippet succeeds cleanly when @{u} is unset"
  else
    fail "Extracted Option 1 merge snippet failed without upstream"
  fi

  bare_rem="$TEST_ROOT/rem.git"
  git init -q --bare -b main "$bare_rem"
  rem_clone="$TEST_ROOT/rem-clone"
  init_repo_with_commit "$rem_clone"
  git -C "$rem_clone" remote add origin "$bare_rem"
  git -C "$rem_clone" push -q -u origin main
  git -C "$rem_clone" checkout -q -b feat-rem
  printf 'feat-rem\n' > "$rem_clone/feat-rem.txt"
  git -C "$rem_clone" add feat-rem.txt
  git -C "$rem_clone" commit -q -m "feat rem"
  git -C "$rem_clone" checkout -q main
  local other_push
  other_push="$TEST_ROOT/rem-pusher"
  git clone -q "$bare_rem" "$other_push"
  git -C "$other_push" config user.name "Test Bot"
  git -C "$other_push" config user.email "test@example.com"
  git -C "$other_push" config commit.gpgsign false
  printf 'remote-advance\n' > "$other_push/rem.txt"
  git -C "$other_push" add rem.txt
  git -C "$other_push" commit -q -m "remote advance"
  git -C "$other_push" push -q origin main

  local run_up_ahead="${opt1_merge_code//<base-branch>/main}"
  run_up_ahead="${run_up_ahead//<feature-branch>/feat-rem}"
  run_up_ahead="${run_up_ahead//<test command>/touch \"\$MAIN_ROOT/ran-ahead-tests\"}"
  if (MAIN_ROOT="$rem_clone" bash -euo pipefail -c "$run_up_ahead" >/dev/null 2>&1) \
    && [[ -f "$rem_clone/rem.txt" && -f "$rem_clone/feat-rem.txt" && -f "$rem_clone/ran-ahead-tests" ]]; then
    pass "Extracted Option 1 merge snippet fast-forwards @{u}, merges feature, and runs tests"
  else
    fail "Extracted Option 1 merge snippet failed when @{u} is ahead"
  fi

  # Diverged upstream stops before merge and tests
  local div_clone="$TEST_ROOT/div-clone"
  git clone -q "$bare_rem" "$div_clone"
  git -C "$div_clone" config user.name "Test Bot"
  git -C "$div_clone" config user.email "test@example.com"
  git -C "$div_clone" config commit.gpgsign false
  git -C "$div_clone" checkout -q -b feat-div
  printf 'feat-div\n' > "$div_clone/feat-div.txt"
  git -C "$div_clone" add feat-div.txt
  git -C "$div_clone" commit -q -m "feat div"
  git -C "$div_clone" checkout -q main
  printf 'local-div\n' > "$div_clone/local-div.txt"
  git -C "$div_clone" add local-div.txt
  git -C "$div_clone" commit -q -m "local diverge"
  printf 'remote-div\n' > "$other_push/remote-div.txt"
  git -C "$other_push" add remote-div.txt
  git -C "$other_push" commit -q -m "remote diverge"
  git -C "$other_push" push -q origin main
  local run_div="${opt1_merge_code//<base-branch>/main}"
  run_div="${run_div//<feature-branch>/feat-div}"
  run_div="${run_div//<test command>/touch \"\$MAIN_ROOT/ran-div-tests\"}"
  if ! (MAIN_ROOT="$div_clone" bash -euo pipefail -c "$run_div" >/dev/null 2>&1) \
    && [[ ! -f "$div_clone/feat-div.txt" && ! -f "$div_clone/ran-div-tests" ]]; then
    pass "Extracted Option 1 merge snippet aborts on diverged upstream before merging or running tests"
  else
    fail "Extracted Option 1 merge snippet did not abort cleanly on diverged upstream"
  fi

  # Upstream starts tracking an ignored local file: --no-overwrite-ignore aborts before overwriting
  local up_col_clone="$TEST_ROOT/up-col-clone"
  git clone -q "$bare_rem" "$up_col_clone"
  git -C "$up_col_clone" config user.name "Test Bot"
  git -C "$up_col_clone" config user.email "test@example.com"
  git -C "$up_col_clone" config commit.gpgsign false
  printf '*.local\n' > "$up_col_clone/.gitignore"
  git -C "$up_col_clone" add .gitignore
  git -C "$up_col_clone" commit -q -m "ignore *.local"
  git -C "$up_col_clone" push -q origin main
  git -C "$up_col_clone" checkout -q -b feat-up-col
  printf 'feat-clean\n' > "$up_col_clone/feat-clean.txt"
  git -C "$up_col_clone" add feat-clean.txt
  git -C "$up_col_clone" commit -q -m "feat clean"
  git -C "$up_col_clone" checkout -q main
  printf 'precious-local-secret\n' > "$up_col_clone/app.local"
  git -C "$other_push" pull -q --ff-only
  printf 'upstream-tracked\n' > "$other_push/app.local"
  git -C "$other_push" add -f app.local
  git -C "$other_push" commit -q -m "upstream tracks app.local"
  git -C "$other_push" push -q origin main
  local run_up_col="${opt1_merge_code//<base-branch>/main}"
  run_up_col="${run_up_col//<feature-branch>/feat-up-col}"
  run_up_col="${run_up_col//<test command>/touch \"\$MAIN_ROOT/ran-up-col-tests\"}"
  if ! (MAIN_ROOT="$up_col_clone" bash -euo pipefail -c "$run_up_col" >/dev/null 2>&1) \
    && [[ "$(cat "$up_col_clone/app.local")" == "precious-local-secret" && ! -f "$up_col_clone/ran-up-col-tests" ]]; then
    pass "Extracted Option 1 merge snippet blocks upstream ff-only merge from overwriting local git-ignored app.local"
  else
    fail "Extracted Option 1 merge snippet allowed upstream ff-only merge to overwrite local git-ignored app.local"
  fi

  # Feature branch force-tracking local git-ignored app.local aborts on --no-overwrite-ignore
  local feat_col_repo="$TEST_ROOT/feat-col-repo"
  init_repo_with_commit "$feat_col_repo"
  printf '*.local\n' > "$feat_col_repo/.gitignore"
  git -C "$feat_col_repo" add .gitignore
  git -C "$feat_col_repo" commit -q -m "ignore *.local"
  git -C "$feat_col_repo" checkout -q -b feat-tracks-local
  printf 'feature-tracked\n' > "$feat_col_repo/app.local"
  git -C "$feat_col_repo" add -f app.local
  git -C "$feat_col_repo" commit -q -m "feature tracks app.local"
  git -C "$feat_col_repo" checkout -q main
  printf 'keep-local-secret\n' > "$feat_col_repo/app.local"
  local run_feat_col="${opt1_merge_code//<base-branch>/main}"
  run_feat_col="${run_feat_col//<feature-branch>/feat-tracks-local}"
  run_feat_col="${run_feat_col//<test command>/touch \"\$MAIN_ROOT/ran-feat-col-tests\"}"
  if ! (MAIN_ROOT="$feat_col_repo" bash -euo pipefail -c "$run_feat_col" >/dev/null 2>&1) \
    && [[ "$(cat "$feat_col_repo/app.local")" == "keep-local-secret" && ! -f "$feat_col_repo/ran-feat-col-tests" ]]; then
    pass "Extracted Option 1 merge snippet blocks feature merge from overwriting local git-ignored app.local"
  else
    fail "Extracted Option 1 merge snippet allowed feature merge to overwrite local git-ignored app.local"
  fi

  # 5. Initialized submodule guard (^[^-]) before single --force + checkout --no-overwrite-ignore
  local sm_parent sm_child sm_wt
  sm_parent="$TEST_ROOT/sm-parent"
  sm_child="$TEST_ROOT/sm-child"
  init_repo_with_commit "$sm_parent"
  init_repo_with_commit "$sm_child"
  git -C "$sm_parent" -c protocol.file.allow=always submodule add -q "$sm_child" deps/child
  git -C "$sm_parent" commit -q -m "add child submodule"
  sm_wt="$sm_parent/.worktrees/feat-sm"
  git -C "$sm_parent" worktree add --no-track -q "$sm_wt" -b feat-sm HEAD
  git -C "$sm_wt" -c protocol.file.allow=always submodule update --init -q
  printf '*.local\n' > "$sm_wt/deps/child/.gitignore"
  printf 'sub-secret\n' > "$sm_wt/deps/child/secret.local"
  if git -C "$sm_wt" submodule status | grep -q '^[^-]' \
    && ! git -C "$sm_wt" status --porcelain -uall --ignored=matching | grep -Fq "secret.local" \
    && ! git -C "$sm_parent" worktree remove "$sm_wt" 2>/dev/null; then
    pass "Initialized submodule matches ^[^-], hides ignored submodule files from parent status, and refuses plain removal"
  else
    fail "Initialized submodule detection or parent status check failed"
  fi

  local col_repo
  col_repo="$TEST_ROOT/col-repo"
  init_repo_with_commit "$col_repo"
  printf 'from-main\n' > "$col_repo/app.local"
  git -C "$col_repo" add app.local
  git -C "$col_repo" commit -q -m "track app.local on main"
  git -C "$col_repo" checkout -q -b feat-col HEAD~1
  printf '*.local\n' > "$col_repo/.gitignore"
  git -C "$col_repo" add .gitignore
  git -C "$col_repo" commit -q -m "ignore *.local on feat"
  printf 'keep-local\n' > "$col_repo/app.local"
  if ! git -C "$col_repo" checkout --no-overwrite-ignore main 2>/dev/null \
    && [[ "$(cat "$col_repo/app.local")" == "keep-local" ]]; then
    pass "git checkout --no-overwrite-ignore protects local git-ignored app.local"
  else
    fail "git checkout --no-overwrite-ignore failed to protect local git-ignored app.local"
  fi

}

test_executor_contracts() {
  echo "=== executor (SDD & executing-plans) static contracts ==="

  local sdd_full sdd_dot sdd_setup sdd_final sdd_finish sdd_resuming sdd_bytes
  local ep_full ep_dot ep_setup ep_finish integration_src test3_block
  sdd_full="$(cat "$SDD_SKILL")"
  sdd_dot="$(section_text "$SDD_SKILL" "## The Process")"
  sdd_setup="$(section_text "$SDD_SKILL" "## Setup")"
  sdd_final="$(cat "$SDD_FINAL_REVIEW")"
  sdd_finish="$(subsection_text "$SDD_FINAL_REVIEW" "### Finish")"
  sdd_resuming="$(cat "$SDD_RESUMING")"
  ep_full="$(cat "$EP_SKILL")"
  ep_dot="$(section_text "$EP_SKILL" "## The Process")"
  ep_setup="$(section_text "$EP_SKILL" "## Setup")"
  ep_finish="$(section_text "$EP_SKILL" "## Finish")"
  integration_src="$(cat "$SDD_INTEGRATION_TEST")"

  # Byte ceiling on subagent-driven-development/SKILL.md (< 20,000 bytes)
  sdd_bytes="$(wc -c < "$SDD_SKILL" | tr -d ' ')"
  if [[ "$sdd_bytes" -lt 20000 ]]; then
    pass "subagent-driven-development/SKILL.md is under 20,000 bytes ($sdd_bytes)"
  else
    fail "subagent-driven-development/SKILL.md exceeds 20,000 bytes ($sdd_bytes)"
  fi

  # Zero "the user" across edited executor skills & references
  local f
  for f in "$SDD_SKILL" "$SDD_FINAL_REVIEW" "$SDD_RESUMING" "$EP_SKILL"; do
    if grep -qi "the user" "$f"; then
      fail "${f#"$REPO_ROOT"/} contains 'the user'"
    else
      pass "${f#"$REPO_ROOT"/} contains zero occurrences of 'the user'"
    fi
  done

  # No workspace deletion or false git-log-is-record claims at Finish
  assert_not_contains_text "$sdd_final" "rm -rf" "final-review.md does not contain rm -rf"
  assert_not_contains_text "$sdd_final" "delete this plan's workspace" "final-review.md does not delete plan workspace"
  assert_not_contains_text "$sdd_final" "the git history is the record now" "final-review.md drops false git-history-is-record claim"
  assert_not_contains_text "$ep_full" "rm -rf" "executing-plans/SKILL.md does not contain rm -rf"
  assert_not_contains_text "$ep_full" "delete this plan's workspace" "executing-plans/SKILL.md does not delete plan workspace"
  assert_not_contains_text "$ep_full" "the git history is the record now" "executing-plans/SKILL.md drops false git-history-is-record claim"

  # DOT graph updates: drop workspace-delete node and mark-todo-complete labels
  assert_not_contains_text "$sdd_dot" "Final review clean: delete this plan's workspace" "SDD DOT graph drops workspace-delete node"
  assert_not_contains_text "$sdd_dot" "mark todo complete" "SDD DOT graph drops mark-todo-complete label"
  assert_contains_text "$sdd_dot" '"Final review and finish: read references/final-review.md" -> "Use superpowers:finishing-a-development-branch"' "SDD DOT graph wires Final review directly to finishing-a-development-branch"
  assert_not_contains_text "$ep_dot" "Final review clean: delete this plan's workspace" "executing-plans DOT graph drops workspace-delete node"
  assert_not_contains_text "$ep_dot" "mark todo complete" "executing-plans DOT graph drops mark-todo-complete label"
  assert_contains_text "$ep_dot" '-> "Use superpowers:finishing-a-development-branch"' "executing-plans DOT graph wires final review pass to finishing-a-development-branch"

  # Todo instructions removed in both executors and integration test relaxed
  if printf '%s\n' "$sdd_full" | grep -qiE '\btodos?\b'; then
    fail "subagent-driven-development/SKILL.md drops all todo instructions"
  else
    pass "subagent-driven-development/SKILL.md drops all todo instructions"
  fi
  if printf '%s\n' "$ep_full" | grep -qiE '\btodos?\b'; then
    fail "executing-plans/SKILL.md drops all todo instructions"
  else
    pass "executing-plans/SKILL.md drops all todo instructions"
  fi
  test3_block="$(awk '/^# Test 3:/,/^echo ""$/' "$SDD_INTEGRATION_TEST")"
  assert_not_contains_text "$test3_block" "FAILED=" "integration test does not fail when zero todo tools are called"
  assert_not_contains_text "$test3_block" '|| echo "0"' "integration test Test 3 avoids grep -c || echo 0 double-line bug"
  assert_not_contains_text "$integration_src" "Claude Code task-tracking tool usage" "integration test header removes required todo-tool claim"

  # Three exhaustive Finish sections + terminal finish line appended after lists
  assert_contains_text "$sdd_finish" '"Rulings I made"' "SDD Finish includes Rulings I made heading"
  assert_contains_text "$sdd_finish" '"Parked findings"' "SDD Finish includes Parked findings heading"
  assert_contains_text "$sdd_finish" '"Deferred minors"' "SDD Finish includes Deferred minors heading"
  assert_contains_text "$sdd_finish" "non-parked" "SDD Finish scopes Rulings I made to non-parked rulings"
  assert_contains_text "$sdd_finish" "minor (deferred)" "SDD Finish collects minor (deferred) lines"
  assert_contains_text "$sdd_finish" "<workspace>/progress.md" "SDD Finish names <workspace>/progress.md"
  assert_order_text "$sdd_finish" '"Rulings I made"' '"Parked findings"' "SDD Finish orders Rulings I made before Parked findings"
  assert_order_text "$sdd_finish" '"Parked findings"' '"Deferred minors"' "SDD Finish orders Parked findings before Deferred minors"
  assert_order_text "$sdd_finish" '"Deferred minors"' 'exact line `finish`' "SDD Finish appends exact line finish after building lists"
  assert_order_text "$sdd_finish" 'exact line `finish`' "superpowers:finishing-a-development-branch" "SDD Finish invokes finishing-a-development-branch after appending finish"

  assert_contains_text "$ep_finish" '"Rulings I made"' "executing-plans Finish includes Rulings I made heading"
  assert_contains_text "$ep_finish" '"Parked findings"' "executing-plans Finish includes Parked findings heading"
  assert_contains_text "$ep_finish" '"Deferred minors"' "executing-plans Finish includes Deferred minors heading"
  assert_contains_text "$ep_finish" "non-parked" "executing-plans Finish scopes Rulings I made to non-parked rulings"
  assert_contains_text "$ep_finish" "minor (deferred)" "executing-plans Finish collects minor (deferred) lines"
  assert_contains_text "$ep_finish" "<workspace>/progress.md" "executing-plans Finish names <workspace>/progress.md"
  assert_order_text "$ep_finish" '"Rulings I made"' '"Parked findings"' "executing-plans Finish orders Rulings I made before Parked findings"
  assert_order_text "$ep_finish" '"Parked findings"' '"Deferred minors"' "executing-plans Finish orders Parked findings before Deferred minors"
  assert_order_text "$ep_finish" '"Deferred minors"' 'exact line `finish`' "executing-plans Finish appends exact line finish after building lists"
  assert_order_text "$ep_finish" 'exact line `finish`' "superpowers:finishing-a-development-branch" "executing-plans Finish invokes finishing-a-development-branch after appending finish"

  # Resume check: ledger ending in exact line finish is a completed prior run -> start fresh
  assert_contains_text "$sdd_resuming" 'exact line `finish`' "resuming.md checks for exact line finish"
  assert_contains_text "$sdd_resuming" "completed prior run" "resuming.md treats terminal finish as completed prior run"
  assert_contains_text "$sdd_resuming" "overwrite" "resuming.md overwrites completed ledger"
  assert_contains_text "$sdd_resuming" "# SDD ledger — plan:" "resuming.md writes fresh # SDD ledger header"
  assert_order_text "$sdd_resuming" "different plan file" "completed prior run" "resuming.md validates plan identity before resetting on finish"
  assert_order_text "$sdd_resuming" "completed prior run" "Task <N>: complete" "resuming.md checks terminal finish before skipping completed tasks"

  assert_contains_text "$ep_setup" 'exact line `finish`' "executing-plans Setup checks for exact line finish"
  assert_contains_text "$ep_setup" "completed prior run" "executing-plans Setup treats terminal finish as completed prior run"
  assert_contains_text "$ep_setup" "overwrite" "executing-plans Setup overwrites completed ledger"
  assert_contains_text "$ep_setup" "# SDD ledger — plan:" "executing-plans Setup writes fresh # SDD ledger header"
  assert_order_text "$ep_setup" "different plan file" "completed prior run" "executing-plans Setup validates plan identity before resetting on finish"
  assert_order_text "$ep_setup" "completed prior run" "Task <N>: complete" "executing-plans Setup checks terminal finish before skipping completed tasks"

  # Honest git log recovery + no --oneline at SDD:264
  assert_not_contains_text "$sdd_setup" 'recover from `git log`' "SDD Setup drops false git log recovery claim"
  assert_not_contains_text "$ep_setup" 'recover from `git log`' "executing-plans Setup drops false git log recovery claim"
  assert_contains_text "$sdd_setup" "only committed tasks" "SDD Setup states git log shows only committed tasks"
  assert_contains_text "$sdd_setup" "lost" "SDD Setup states workspace artifacts are lost on git clean -fdx"
  assert_contains_text "$ep_setup" "only committed tasks" "executing-plans Setup states git log shows only committed tasks"
  assert_contains_text "$ep_setup" "lost" "executing-plans Setup states workspace artifacts are lost on git clean -fdx"
  assert_contains_text "$sdd_finish" "only committed tasks" "SDD Finish states git log shows only committed tasks"
  assert_contains_text "$ep_finish" "only committed tasks" "executing-plans Finish states git log shows only committed tasks"
  assert_not_contains_text "$sdd_full" "git log --oneline" "SDD Review drops --oneline from fallback git log"

  # Post-consent branch guard sequenced after using-git-worktrees
  assert_contains_text "$sdd_setup" "without your human partner's explicit consent" "SDD Setup preserves explicit consent requirement"
  assert_contains_text "$sdd_setup" "git switch -c" "SDD Setup includes post-consent git switch -c guard"
  assert_order_text "$sdd_setup" "superpowers:using-git-worktrees" "git switch -c" "SDD Setup sequences git switch -c after using-git-worktrees"
  assert_contains_text "$ep_setup" "without your human partner's explicit consent" "executing-plans Setup preserves explicit consent requirement"
  assert_contains_text "$ep_setup" "git switch -c" "executing-plans Setup includes post-consent git switch -c guard"
  assert_order_text "$ep_setup" "superpowers:using-git-worktrees" "git switch -c" "executing-plans Setup sequences git switch -c after using-git-worktrees"

  # Common Rationalizations tables preserved intact
  assert_contains_text "$sdd_full" "## Common Rationalizations" "SDD keeps Common Rationalizations table"
  assert_contains_text "$sdd_full" "Ledger bookkeeping is overhead" "SDD preserves Common Rationalizations rows"
  assert_contains_text "$ep_full" "## Common Rationalizations" "executing-plans keeps Common Rationalizations table"
  assert_contains_text "$ep_full" "I'll fix the minors too while I'm in there" "executing-plans preserves Common Rationalizations rows"
}

main() {
  test_using_git_worktrees_contracts
  test_using_git_worktrees_mechanics
  test_finishing_contracts
  test_finishing_mechanics
  test_executor_contracts

  echo ""
  if [[ "$FAILURES" -gt 0 ]]; then
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
  fi
  echo "STATUS: PASSED"
}

main "$@"
