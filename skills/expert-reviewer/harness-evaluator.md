# Harness Evaluator Prompt Template

Dispatch this template via Task tool from `expert-reviewer` skill.
Read this file, fill the 6 placeholders, then pass the filled prompt to Task tool (general-purpose agent).

**Placeholders to fill:**
- `{SPEC_PATH}` — e.g. `docs/superpowers/specs/2026-05-14-add-fast-forward.md`
- `{CHANGE_ID}` — spec filename without `.md`
- `{BASE_SHA}` — output of `git merge-base HEAD main`
- `{HEAD_SHA}` — output of `git rev-parse HEAD`
- `{TIER}` — `Micro` | `Normal` | `Large`
- `{ITERATION}` — current review iteration number (1-based)

---

```
Task tool (general-purpose):
  description: "Harness evaluator — 11-item Harness-specific code review"
  prompt: |
    You are a Harness Evaluator for the Vattention team. Review this PR against its
    L2 spec for Harness-specific consistency that upstream code-review does not cover.

    Items to run:
    - Micro tier: items 14, 15, 17 only
    - Normal tier: all 11 items (14-18, 21-26)
    - Large tier: all 11 items (14-18, 21-26)

    ## Context

    Spec path: {SPEC_PATH}
    Change ID: {CHANGE_ID}
    Git range: {BASE_SHA}..{HEAD_SHA}
    Tier: {TIER}
    Iteration: {ITERATION}

    ## Setup (Inline — Self-Contained for Subagent Dispatch)

    This template is dispatched as a Task tool subagent prompt. It cannot inherit shell state
    from the dispatching skill (expert-reviewer). All variables and logic below are
    self-contained.

    Run these first:
    ```bash
    git diff --stat {BASE_SHA}..{HEAD_SHA}
    cat {SPEC_PATH}
    ```

    Bind `SPEC_PATH` from the template placeholder (so SENTINEL_PATHS override branch works):
    ```bash
    SPEC_PATH="{SPEC_PATH}"
    ```

    **Sentinel grep range (subagent-safe inline block — no shared shell helpers)**:
    ```bash
    # 默认 grep 范围（覆盖典型项目布局：业务代码 src/ + 工程脚本 scripts/）
    SENTINEL_PATHS_DEFAULT="src/ scripts/"

    # Override: spec frontmatter sentinel_paths 可覆盖默认（YAML 数组形式）
    SENTINEL_PATHS_OVERRIDE=""
    if [ -n "$SPEC_PATH" ]; then
      SENTINEL_PATHS_OVERRIDE=$(grep -A 10 "^sentinel_paths:" "$SPEC_PATH" 2>/dev/null \
        | grep -E "^[[:space:]]+-[[:space:]]" \
        | sed -E "s/^[[:space:]]+-[[:space:]]+//" | tr '\n' ' ')
    fi
    SENTINEL_PATHS="${SENTINEL_PATHS_OVERRIDE:-$SENTINEL_PATHS_DEFAULT}"
    ```

    Parse ANCHOR_IDS from spec §5.x Anchor IDs subsection (per A2 amendment):
    ```bash
    ANCHOR_IDS=$(sed -n '/§5.x Anchor IDs/,/^## /p' "$SPEC_PATH" 2>/dev/null \
      | grep -E "^[[:space:]]+-[[:space:]]" \
      | sed -E "s/^[[:space:]]+-[[:space:]]+//")
    ```

    ---

    ## Item 14 · AC Coverage

    Read spec §1 (product perspective — `Given / When / Then` rows in scenarios table).
    List every Acceptance Criterion (AC).

    For each AC, verify an **automated test** exists in the diff.

    **"Automated test" 定义（v2 / codex finding #5 文档化）**:
    - ✅ Acceptable: unit test / integration test / e2e test in any of the following frameworks:
      - Node.js: `node:test` built-in（since Node 18）/ `vitest` / `jest` / `mocha` / `ava`
      - Python: `pytest` / `unittest`
      - Browser: `playwright` / `cypress` / `vitest --browser`
      - Other: any framework with deterministic exit code + machine-readable output
    - ❌ NOT acceptable as Item 14 evidence:
      - 手动 CLI behavior probe (`node script.mjs && verify stdout`)
      - manual screenshot diff
      - `git status --porcelain` 状态检查
      - **理由**: M2 chain 要求 review iteration 可机器复跑；CLI smoke 缺 deterministic exit + machine output
      - **轻例外**：unit smoke 已包含在自动化测试框架内（例如 `node:test` 调 CLI）

    **Test discovery heuristic**:
    - Look for `tests/`, `test/`, `__tests__/`, `*.test.{ts,tsx,js,jsx,mjs,cjs,py,vue}`, `*_test.py`, `spec/`
    - Verify diff 含 (a) test 新增 / (b) test 修改 / 至少其一 — 单纯改 implementation 不补 test = FAIL

    ```bash
    git diff --name-only {BASE_SHA}..{HEAD_SHA} \
      | grep -E "(^|/)(tests?|__tests__|spec)/|\.test\.|\.spec\.|_test\.py$"
    ```
    Cross-reference test filenames/descriptions against each AC description.

    **Pass criteria**:
    - 每条 AC（§1 Given/When/Then row）能 trace 到 ≥1 测试 case 名（grep by AC keywords）
    - 测试 case in diff 或在 base branch 已存在但被 implementation 修改路径覆盖到

    **Output:**
    - MUST FIX if any AC has no automated test in the above-acceptable set
    - PASS if all ACs are covered (or spec has no ACs — check §1 explicitly)

    **FAIL response**: 标 MUST FIX；reviewer 在 review-N.md "## MUST FIX" 段列出"AC #N 无 automated test"。

    ---

    ## Item 15 · §5 L1 Impact Implementation

    Read spec §5 L1 Impact. For each entry:

    **ADDED capability** — verify:
    1. Implementation exists in diff
    2. Sentinel comment present (uses `SENTINEL_PATHS` from Setup section):
    ```bash
    for ANCHOR_ID in $ANCHOR_IDS; do
      grep -r "@capability: $ANCHOR_ID" $SENTINEL_PATHS \
        --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
        --include="*.mjs" --include="*.cjs" --include="*.py" --include="*.vue" \
        2>/dev/null
    done
    ```

    **MODIFIED capability** — verify the described change is present in the diff.

    **REMOVED capability** — verify old code is removed.

    **Output:**
    - MUST FIX if ADDED capability lacks sentinel or implementation
    - MUST FIX if MODIFIED/REMOVED change is absent
    - SHOULD if sentinel present but in a secondary file (not entry point)
    - PASS if §5 = "None"

    ---

    ## Item 16 · Three-Perspective Consistency  *(Normal + Large only)*

    Read spec §1 (product), §2 (design), §3 (engineering). For each perspective,
    check the diff satisfies the stated constraints.

    Common mismatches:
    - §2 specifies a component name but diff uses a different name
    - §3 specifies an algorithm/approach but a different one was implemented
    - §1 AC requires "within Xms" but no performance test is present

    **Output:**
    - MUST FIX if implementation directly contradicts a spec constraint
    - SHOULD if implementation only partially satisfies a perspective
    - PASS if all three perspectives are satisfied

    ---

    ## Item 17 · Role-Binding Soft Warn

    Read spec frontmatter `role:` field.
    ```bash
    git diff --name-only {BASE_SHA}..{HEAD_SHA}
    ```

    If role = `frontend-dev` and >30% changed files are under `api/`, `server/`, `backend/` → warn.
    If role = `backend-dev` and >30% changed files are under `components/`, `pages/`, `styles/` → warn.
    If role is absent → skip.

    **Output: always INFO (never MUST FIX or SHOULD)**
    - INFO: describe the mismatch
    - PASS: paths align with declared role

    ---

    ## Item 18 · Anchor Consistency  *(Normal + Large only)*

    Read spec §5 L1 Impact `§5.x Anchor IDs` subsection (per spec amendment A2).
    For each anchor (uses `$ANCHOR_IDS` + `$SENTINEL_PATHS` from Setup section):
    ```bash
    for ANCHOR_ID in $ANCHOR_IDS; do
      grep -r "@capability: $ANCHOR_ID" $SENTINEL_PATHS \
        --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
        --include="*.mjs" --include="*.cjs" --include="*.py" --include="*.vue" \
        2>/dev/null
    done
    ```

    **Output:**
    - MUST FIX if anchor listed in §5 but sentinel not found anywhere (broken anchor)
    - SHOULD if sentinel found but in a non-obvious location (secondary file, not entry point)
    - PASS if all anchors have corresponding sentinels

    ---

    ## Item 21 · §7 Doc Impact Fulfilled
    *(Absorbs d976064 "Check maintenance docs" — facio-superpowers commit d976064)*

    Read spec §7 Doc Impact. It lists which docs should be updated in this PR.

    ```bash
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | grep -E "^docs/|README|CLAUDE\.md|ARCHITECTURE"
    ```

    Compare declared list vs. actually changed doc files.

    **Output:**
    - MUST FIX if §7 names a specific doc file but that file is absent from the diff
    - PASS if all declared docs are present, or §7 = "None"

    ---

    ## Item 22 · Implicit Doc Gaps
    *(Absorbs d976064 "Check module documentation" — component/API list sync + architecture.md)*

    **Module README sync:**
    Identify changed source directories (filter by `SENTINEL_PATHS` so non-src/ projects work):
    ```bash
    SENTINEL_REGEX="^($(echo $SENTINEL_PATHS | tr ' ' '|' | sed 's/|$//'))"
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | grep -E "$SENTINEL_REGEX" \
      | sed 's|/[^/]*$||' | sort -u
    ```

    For each changed directory that has a `docs/modules/<module>/README.md`:
    - New `.tsx`/`.ts`/`.py` files exported → check if README "核心组件" or "API" section lists them
    - If README not updated after new exports added → flag

    **Architecture doc:**
    ```bash
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | grep -E "$SENTINEL_REGEX" | head -5
    # If new top-level directory created:
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | awk -F/ '{print $1"/"$2}' | sort -u
    ```
    If module structure changed (new directory, moved packages) and `docs/reference/architecture.md` not in diff → flag.

    **Output:**
    - SHOULD for each implicit doc gap found
    - PASS if no implicit gaps (or no module READMEs exist in this project)

    ---

    ## Item 23 · ADR Triggered
    *(Absorbs d976064 "Check if ADR needed" — new library / architecture pattern / technical selection)*

    Check if this change warrants an Architecture Decision Record:

    ```bash
    # New dependencies added?
    git diff {BASE_SHA}..{HEAD_SHA} -- package.json requirements.txt Cargo.toml go.mod \
      | grep "^+" | grep -v "^+++"

    # ADR already written?
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | grep "docs/reference/decisions/"
    ```

    ADR required if any:
    - New library/framework introduced (appears in package.json/requirements.txt diff)
    - Architecture pattern fundamentally changed (new service layer, new data flow, new protocol)
    - Technical selection documented in comment but not in ADR file

    **Output:**
    - MUST FIX if new library added and no ADR present in diff
    - SHOULD if architecture pattern changed and no ADR present
    - PASS if ADR present or no architectural decisions made

    ---

    ## Item 24 · In-Code Documentation  *(Normal + Large only)*
    *(Absorbs d976064 "API list sync" — new public exports missing JSDoc/docstring)*

    Find new public exports in the diff:
    ```bash
    git diff {BASE_SHA}..{HEAD_SHA} | grep "^+export " | grep -v "^+++"
    ```

    For each new export, check if a documentation comment exists immediately above it:
    ```bash
    git diff {BASE_SHA}..{HEAD_SHA} | grep -B5 "^+export " | grep -E "^\+\s*/\*\*|^\+\s*#\s+|^\+\s*\*"
    ```

    **Output:**
    - SHOULD if a new public export lacks a JSDoc block (`/** ... */`) or docstring (`"""..."""`)
    - PASS if all new exports have documentation or no new exports exist

    ---

    ## Item 25 · README Sync  *(Normal + Large only)*
    *(Absorbs d976064 "Check maintenance docs" — CLAUDE.md / README update for new config/features)*

    Check for new user-facing surface without README documentation:

    ```bash
    # New env vars?
    git diff {BASE_SHA}..{HEAD_SHA} | grep -E "^+.*process\.env\.|^+.*os\.environ\[|^+.*getenv\(" \
      | grep -v "^+++"

    # New CLI flags or npm scripts?
    git diff {BASE_SHA}..{HEAD_SHA} -- package.json | grep "^+.*\"scripts\"" -A20 | grep "^+" \
      | grep -v "^+++"

    # README changed?
    git diff --name-only {BASE_SHA}..{HEAD_SHA} | grep -iE "readme|CLAUDE\.md"
    ```

    If new env vars / CLI flags / npm scripts appear but no README/CLAUDE.md update:

    **Output:**
    - SHOULD if new user-facing configuration lacks README documentation
    - PASS if README updated or no user-facing configuration added

    ---

    ## Item 26 · Catalog Consistency  *(Normal + Large only)*
    *(M2a independent reviewer deferred to M3 with concurrence — restored here)*

    Per spec §6.3 catalog 维护机制：`docs/reference/catalog.md` 必须与
    `docs/reference/{decisions,guidelines,pitfalls}/*.md` 的 frontmatter 一致。
    `scripts/rebuild-catalog.sh` 应可机械重建 catalog；若 PR 改了 notes 但忘了重建 catalog
    → 用户最终看到的 doc map 与真实 notes 不一致（progressive disclosure 入口失效）。

    **Check**:

    ```bash
    # Run rebuild-catalog.sh against a temp output, then diff against committed catalog
    # (ignore "Last rebuild:" trailing timestamp — last 2 lines)
    test -x scripts/rebuild-catalog.sh || { echo "✗ rebuild-catalog.sh missing"; exit 1; }

    ./scripts/rebuild-catalog.sh --out /tmp/m3-item26-regen.md
    diff <(head -n -2 docs/reference/catalog.md) <(head -n -2 /tmp/m3-item26-regen.md)
    DIFF_RC=$?
    rm -f /tmp/m3-item26-regen.md
    ```

    **Output**:
    - **MUST FIX** if `DIFF_RC` ≠ 0 (catalog out of sync with notes — PR author must run
      `./scripts/rebuild-catalog.sh` and commit before merging)
    - **MUST FIX** if `scripts/rebuild-catalog.sh` is missing or not executable
    - **PASS** if `DIFF_RC` = 0

    > **Note**: `.github/workflows/catalog-sync.yml` runs the same diff in CI. Item 26 mirrors
    > that check at review time so the reviewer surfaces the issue (with file/line precision)
    > before CI runs — same logic, different ergonomic.

    ---

    ## Final Output Format

    After evaluating all applicable items, output exactly:

    ```
    ## Harness Evaluator Results — {CHANGE_ID} · Iteration {ITERATION}

    Tier: {TIER}
    Items evaluated: [list numbers]

    ### MUST FIX
    - Item NN: [description] — [file:line or specific AC name]
    (or "None")

    ### SHOULD
    - Item NN: [description]
    (or "None")

    ### INFO
    - Item 17: [role mismatch note]
    (or "None")

    ### Item-by-Item Summary
    | Item | Title | Result | Note |
    |------|-------|--------|------|
    | 14 | AC Coverage | PASS/MUST FIX | ... |
    | 15 | §5 L1 Impact | PASS/MUST FIX | ... |
    | 16 | Three-Perspective | PASS/MUST FIX/SKIPPED | ... |
    | 17 | Role-Binding | INFO/PASS/SKIPPED | ... |
    | 18 | Anchor Consistency | PASS/MUST FIX/SKIPPED | ... |
    | 21 | §7 Doc Impact | PASS/MUST FIX | ... |
    | 22 | Implicit Doc Gaps | PASS/SHOULD | ... |
    | 23 | ADR Triggered | PASS/MUST FIX/SHOULD | ... |
    | 24 | In-Code Docs | PASS/SHOULD/SKIPPED | ... |
    | 25 | README Sync | PASS/SHOULD/SKIPPED | ... |
    | 26 | Catalog Consistency | PASS/MUST FIX/SKIPPED | ... |
    ```
```
