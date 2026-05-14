---
name: l1-updater
description: ARCHIVE subtask — run after PR merge. Applies L2 spec §5 L1 Impact to capability specs, updates ref_count + last_referenced for §K cited knowledge notes, transitions spec status merged→archived. Use after every merged L2 spec.
---

# L1 Updater

Post-merge ARCHIVE subtask. Run after the PR is merged on main.

## Pre-conditions

l1-updater MUST be invoked in **one of** these legal states (verified at runtime; not assumed).

**Pre-condition Step 0 (self-contained spec resolution — Round-3 MUST FIX #3)**:

```bash
# Resolve SPEC_PATH + CHANGE_ID first so State A/B verification can use them.
# Honor explicit env override (synthetic/probe scenarios) before defaulting to discovery.
if [ -n "$SPEC_PATH" ]; then
  test -f "$SPEC_PATH" || { echo "✗ SPEC_PATH override invalid: $SPEC_PATH"; exit 1; }
else
  SPEC_PATH=$(find docs/superpowers/specs -name "*.md" \
    | xargs grep -l "^status: merged" 2>/dev/null | head -1)
  if [ -z "$SPEC_PATH" ]; then
    echo "✗ no merged spec found; cannot resolve Pre-conditions"
    exit 1
  fi
fi

# CHANGE_ID prefers frontmatter (synthetic probes set explicit change_id),
# falls back to basename.
CHANGE_ID=$(grep -E '^change_id:' "$SPEC_PATH" 2>/dev/null | head -1 | awk '{print $2}')
[ -z "$CHANGE_ID" ] && CHANGE_ID=$(basename "$SPEC_PATH" .md)

[ -n "$CHANGE_ID" ] || { echo "✗ CHANGE_ID resolution failed for $SPEC_PATH"; exit 1; }
echo "ℹ Resolved: SPEC_PATH=$SPEC_PATH; CHANGE_ID=$CHANGE_ID"
```

**State A · on main, post-merge** (default M1 + simple-merge case):
- `git branch --show-current` = `main`
- The spec's PR has been merged to main (verified via `gh pr view --json state`)
- Spec status = `merged` (frontmatter)

**State B · on follow-up branch with PR-merged evidence** (Round-2 MUST FIX #7; post-merge follow-up PR pattern per spec §10/Flow HARD-GATE finding #10):
- `git branch --show-current` ≠ `main` (a working branch)
- `.harness/changes/$CHANGE_ID/pr.md` exists with `state: MERGED` + `merge_commit_sha:` populated (persisted by spec's main PR; spec.md content already on main)
- Spec status = `merged` (frontmatter)
- This branch will produce a follow-up PR carrying the l1-updater output (capability spec changes + spec status → archived); not direct-pushed to main

**Verification block (runs after Step 0 above; both states require non-empty merge_commit_sha; Round-4 SHOULD #3)**:

```bash
BRANCH=$(git branch --show-current)
PR_META=".harness/changes/$CHANGE_ID/pr.md"

# Helper: pr.md must have state=MERGED + non-empty merge_commit_sha
pr_meta_valid() {
  [ -f "$PR_META" ] || return 1
  grep -qE "^state:[[:space:]]*MERGED" "$PR_META" || return 1
  MERGE_SHA_VAL=$(grep -E "^merge_commit_sha:" "$PR_META" | awk '{print $2}')
  [ -n "$MERGE_SHA_VAL" ] && [ "$MERGE_SHA_VAL" != "null" ] || return 1
  return 0
}

if [ "$BRANCH" = "main" ]; then
  # State A: on main — still require PR merged evidence (don't trust branch alone)
  if pr_meta_valid; then
    echo "✓ State A · on main branch + $PR_META state=MERGED + merge_commit_sha non-empty"
  else
    # Fallback: try live gh query (allows running before pr.md was persisted)
    echo "ℹ pr.md not yet valid; querying GitHub live..."
    LIVE_STATE=$(gh pr list --repo vattention/$(basename "$PWD") --state merged \
      --search "$CHANGE_ID" --json state --jq '.[0].state // empty' 2>/dev/null)
    if [ "$LIVE_STATE" = "MERGED" ]; then
      echo "✓ State A · on main, GitHub confirms PR merged for $CHANGE_ID (consider persisting pr.md)"
    else
      echo "✗ State A failed: no $PR_META + no merged PR found via gh search"
      exit 1
    fi
  fi
elif pr_meta_valid; then
  echo "✓ State B · follow-up branch '$BRANCH' + $PR_META state=MERGED + merge_commit_sha=$MERGE_SHA_VAL"
else
  echo "✗ Neither State A nor State B met. l1-updater requires either:"
  echo "    (A) on main with PR merged evidence (pr.md or gh confirmation), OR"
  echo "    (B) on a follow-up branch with $PR_META state=MERGED + merge_commit_sha non-empty"
  exit 1
fi
```

- All `verification-before-completion` upstream checks have passed for the merge

## Sentinel Grep Range (Inline — Self-Contained)

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

# Inline grep (self-contained; l1-updater runs as its own skill — no shared helper)
grep -r "@capability: $CAPABILITY_ID" $SENTINEL_PATHS \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.mjs" --include="*.cjs" --include="*.py" --include="*.vue" \
  2>/dev/null
```

## Step 1: Find the spec

Bind `$SPEC_PATH` honoring optional env-var override (synthetic/probe scenarios may
set this externally). When `$SPEC_PATH` is already bound from Pre-condition Step 0,
this is idempotent:

```bash
if [ -n "$SPEC_PATH" ]; then
  test -f "$SPEC_PATH" || { echo "✗ SPEC_PATH override invalid: $SPEC_PATH"; exit 1; }
else
  SPEC_PATH=$(find docs/superpowers/specs -name "*.md" \
    | xargs grep -l "^status: merged" 2>/dev/null | head -1)
fi

if [ -z "$SPEC_PATH" ]; then
  echo "✗ no merged spec found"
  exit 1
fi

CHANGE_ID="$(basename "$SPEC_PATH" .md)"
TODAY="$(date +%Y-%m-%d)"

# Verify status is indeed merged
node scripts/spec-status.mjs read "$SPEC_PATH"
```

Expected: `merged`. If not → stop, surface to user.

## Step 2: Read §5 L1 Impact

```bash
cat $SPEC_PATH
```

Parse §5 L1 Impact section. Extract three lists:
- **ADDED** — new capability IDs, their anchors, and requirement text
- **MODIFIED** — existing capability IDs + description of change
- **REMOVED** — capability IDs being deprecated

Also parse the §5.x Anchor IDs subsection (per spec amendment A2) — this lists the `@capability:` sentinel IDs for the change.

If §5 says "None" for all three → skip to Step 4.

## Step 3: Apply §5 L1 Impact to capability specs

For each capability, find its file:
```bash
find docs/reference/capabilities -name "*.md" \
  | xargs grep -l "^id: CAPABILITY_ID" 2>/dev/null
```
(Replace CAPABILITY_ID with the actual ID from §5)

### ADDED — create capability file if absent

If file does not exist, create `docs/reference/capabilities/<capability-id>.md`.

**Strict §C.1 schema — only these 6 fields, no Knowledge note fields:**

```yaml
---
id: <capability-id>
title: <title from §5>
owners:
  - <engineer from L2 spec frontmatter owners.engineer; ≥1 required>
maturity: draft
anchors:
  - <sentinel-id from §5 Anchor IDs subsection>
last_updated: TODAY_PLACEHOLDER
---

# <title>

## Purpose

<from §5 ADDED description>

## Requirements

<AC text from §5>
```

> **Do NOT add** `ref_count`, `last_referenced`, or `source` to this file — those are §C.4 Knowledge note fields. L1 capability spec and Knowledge note schemas are separate.

Then plant the sentinel in code (done during implementation, but verify it exists). Uses `SENTINEL_PATHS` from Sentinel Grep Range section above:
```bash
CAPABILITY_ID="<capability-id>"
grep -r "@capability: $CAPABILITY_ID" $SENTINEL_PATHS \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.mjs" --include="*.cjs" --include="*.py" --include="*.vue" \
  2>/dev/null
```
If missing → write a follow-up note (do not block archival; implementation should have planted it).

### MODIFIED — update existing capability file

Read the existing file. Apply the described change:
- Update the Requirements section per §5 description
- If anchors changed, update `anchors:` list
- Set `last_updated: $TODAY` in frontmatter

Do NOT rewrite the whole file — targeted edit of the specific Requirement.

### REMOVED — deprecate (do not delete)

Add to frontmatter: `status: deprecated`

Add at top of body:
```markdown
> **Deprecated** — removed in spec `CHANGE_ID_PLACEHOLDER` ($TODAY). See linked spec for rationale.
```

Keep the file (historical record).

## Step 4: Update §K ref_count and last_referenced

Parse the §K Knowledge References section. Find all markdown links to `docs/reference/` files:

```
[K-decisions-001](./decisions/some-decision.md) — context sentence
```

For each linked Knowledge note file, verify §C.4 schema completeness, then update ref_count + last_referenced + maturity promotion.

### §C.4 schema validation (REQUIRED before any write)

Per spec §C.4, each Knowledge note frontmatter has **7 REQUIRED + 2 OPTIONAL** fields:

| Field | Required? | Format |
|-------|-----------|--------|
| `id` | ✅ REQUIRED | `^K-(decisions\|guidelines\|pitfalls\|model\|process)-[0-9]{3}$` (3-digit zero-padded NNN per `docs/reference/<type>/README.md`) |
| `type` | ✅ REQUIRED | enum: decision \| guideline \| pitfall \| model \| process |
| `title` | ✅ REQUIRED | string |
| `maturity` | ✅ REQUIRED | enum: draft \| verified \| proven |
| `ref_count` | ✅ REQUIRED | integer ≥ 0 |
| `created` | ✅ REQUIRED | YYYY-MM-DD |
| `source` | ✅ REQUIRED | spec change_id or `"manual"` |
| `tags` | ⚠️ OPTIONAL | array, may be empty/absent |
| `last_referenced` | ⚠️ OPTIONAL | YYYY-MM-DD or absent (CI-managed) |

> **Codex review Round 1 MUST FIX #2 correction**: prior plan版本 标"9 required fields"——错。Spec §C.4 明示 tags / last_referenced 是 OPTIONAL。Validator 不 require 它们 present；但若 present 必须格式正确。

Validation block:

```bash
validate_note_schema() {
  local note="$1"
  local missing=""

  # REQUIRED fields (7)
  for field in id type title maturity ref_count created source; do
    grep -qE "^${field}:" "$note" || missing="${missing} ${field}"
  done
  if [ -n "$missing" ]; then
    echo "✗ note schema invalid: $note missing REQUIRED fields:$missing"
    return 1
  fi

  # ID format (REQUIRED + regex)
  local id_val
  id_val=$(awk '/^id:/ { sub(/^id:[[:space:]]*/, ""); print; exit }' "$note")
  if ! [[ "$id_val" =~ ^K-(decisions|guidelines|pitfalls|model|process)-[0-9]{3}$ ]]; then
    echo "✗ note $note id violates K-<type>-<NNN> 3-digit zero-padded format: $id_val"
    return 1
  fi

  # Enum: maturity
  local maturity_val
  maturity_val=$(awk '/^maturity:/ { sub(/^maturity:[[:space:]]*/, ""); print; exit }' "$note")
  case "$maturity_val" in
    draft|verified|proven) ;;
    *) echo "✗ note $note maturity must be draft|verified|proven (got: $maturity_val)"; return 1 ;;
  esac

  # Enum: type (also cross-check vs id prefix)
  local type_val
  type_val=$(awk '/^type:/ { sub(/^type:[[:space:]]*/, ""); print; exit }' "$note")
  case "$type_val" in
    decision|guideline|pitfall|model|process) ;;
    *) echo "✗ note $note type invalid: $type_val"; return 1 ;;
  esac
  # id prefix must align with type (decisions↔decision, guidelines↔guideline, pitfalls↔pitfall)
  local id_type_prefix
  id_type_prefix=$(echo "$id_val" | awk -F- '{print $2}')
  case "$type_val:$id_type_prefix" in
    decision:decisions|guideline:guidelines|pitfall:pitfalls|model:model|process:process) ;;
    *) echo "✗ note $note id prefix ($id_type_prefix) does not match type ($type_val)"; return 1 ;;
  esac

  # ref_count must be integer
  local rc_val
  rc_val=$(awk '/^ref_count:/ { sub(/^ref_count:[[:space:]]*/, ""); print; exit }' "$note")
  if ! [[ "$rc_val" =~ ^[0-9]+$ ]]; then
    echo "✗ note $note ref_count not integer: $rc_val"
    return 1
  fi

  # OPTIONAL fields: if present, validate format
  if grep -qE "^last_referenced:" "$note"; then
    local lr_val
    lr_val=$(awk '/^last_referenced:/ { sub(/^last_referenced:[[:space:]]*/, ""); print; exit }' "$note")
    # Empty value OK; else must be YYYY-MM-DD
    if [ -n "$lr_val" ] && ! [[ "$lr_val" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
      echo "✗ note $note last_referenced not YYYY-MM-DD: $lr_val"
      return 1
    fi
  fi

  return 0
}
```

### Per-link update loop

```bash
mkdir -p .harness/audit
AUDIT_FILE=".harness/audit/maturity-transitions.jsonl"

# Parse §K body links.
# R3 MUST FIX B + R4 MUST FIX: spec §6.4:843 describes target form 是
# `docs/reference/(decisions|guidelines|pitfalls)/*.md`；spec §4.2:503 example 用 `../../reference/...`.
# Parser MUST accept ONLY the 2 supported local forms; reject anything else (URLs / absolute /
# bare filename / arbitrary paths).
#
# Supported forms:
#   1) Short: `./decisions/foo.md` | `./guidelines/foo.md` | `./pitfalls/foo.md` | `./model/foo.md` | `./process/foo.md`
#   2) Long:  `(../)+reference/decisions/foo.md` | ...
#
# Tight regex enforces this; broad-permissive `[^)]+\.md` (R3 form) was R4-flagged as
# accepting URLs / absolute paths / bare filenames.

K_TYPE_ALT='(decisions|guidelines|pitfalls|model|process)'
K_LINKS_RAW=$(awk '/^## §K/, /^## /' "$SPEC_PATH" \
  | grep -oE "\((\./|(\.\./)+reference/)${K_TYPE_ALT}/[^)]+\.md\)" \
  | sed -E 's/^\(//;s/\)$//')

# Detect "§K has .md link(s) but none matched our supported forms" → fail loudly
RAW_LINK_COUNT=$(awk '/^## §K/, /^## /' "$SPEC_PATH" | grep -cE "\([^)]+\.md\)" || true)
MATCHED_COUNT=$(printf "%s\n" "$K_LINKS_RAW" | grep -c . || true)
if [ "$RAW_LINK_COUNT" -gt "$MATCHED_COUNT" ]; then
  echo "✗ §K has $RAW_LINK_COUNT .md link(s) but only $MATCHED_COUNT match supported forms"
  echo "  Supported: ./<type>/<file>.md  OR  (../)+reference/<type>/<file>.md"
  echo "  <type> ∈ {decisions, guidelines, pitfalls, model, process}"
  echo "  Offending links (raw):"
  awk '/^## §K/, /^## /' "$SPEC_PATH" | grep -oE "\([^)]+\.md\)"
  exit 1
fi

if [ -z "$K_LINKS_RAW" ]; then
  echo "ℹ §K is empty or absent — skip ref_count update"
else
  for LINK in $K_LINKS_RAW; do
    # Normalize: take portion after `reference/` if long form, else strip leading `./`.
    # Both branches yield `<type>/<file>.md` relative to docs/reference/.
    if [[ "$LINK" == */reference/* ]]; then
      REL_AFTER="${LINK#*/reference/}"      # e.g., "decisions/foo.md"
    elif [[ "$LINK" == ./* ]]; then
      REL_AFTER="${LINK#./}"                 # e.g., "decisions/foo.md"
    else
      # Defense in depth: regex above enforces leading ./ or (../)+reference/. Should never hit.
      echo "✗ §K link form unexpected (parser bug — should have been filtered by grep): $LINK"
      exit 1
    fi
    NOTE_PATH="docs/reference/${REL_AFTER}"
    [ -f "$NOTE_PATH" ] || { echo "✗ §K link target missing: $NOTE_PATH"; exit 1; }

    validate_note_schema "$NOTE_PATH" || exit 1

    REF_COUNT=$(awk '/^ref_count:/ { sub(/^ref_count:[[:space:]]*/, ""); print; exit }' "$NOTE_PATH")
    MATURITY=$(awk '/^maturity:/ { sub(/^maturity:[[:space:]]*/, ""); print; exit }' "$NOTE_PATH")
    NOTE_ID=$(awk '/^id:/ { sub(/^id:[[:space:]]*/, ""); print; exit }' "$NOTE_PATH")
    NEW_COUNT=$((REF_COUNT + 1))

    sed -i '' "s/^ref_count: .*/ref_count: $NEW_COUNT/" "$NOTE_PATH"

    # R2 MUST FIX B + R3 MUST FIX A: last_referenced is OPTIONAL (§C.4)；
    # 既有 sed-replace 在字段缺失时 no-op；并且 README schema 用空值形式 `last_referenced:`
    # (无 trailing space) — R3 codex 指出 `^last_referenced: .*` regex 不匹配 empty form.
    # Solution: regex 不要求 trailing space；branch test + replace 都用 `^last_referenced:.*` 形式.
    if grep -qE "^last_referenced:" "$NOTE_PATH"; then
      # Matches both `last_referenced:` (empty) and `last_referenced: 2026-..` (populated)
      sed -i '' "s/^last_referenced:.*/last_referenced: $TODAY/" "$NOTE_PATH"
    else
      # Field truly absent: insert after ref_count line (within frontmatter; macOS BSD sed)
      sed -i '' "/^ref_count: /a\\
last_referenced: $TODAY
" "$NOTE_PATH"
    fi

    NEW_MATURITY="$MATURITY"
    if [ "$MATURITY" = "draft" ] && [ "$NEW_COUNT" -ge 1 ]; then
      sed -i '' "s/^maturity: draft/maturity: verified/" "$NOTE_PATH"
      NEW_MATURITY="verified"
    fi
    if [ "$MATURITY" = "verified" ] && [ "$NEW_COUNT" -ge 2 ]; then
      sed -i '' "s/^maturity: verified/maturity: proven/" "$NOTE_PATH"
      NEW_MATURITY="proven"
    fi

    # Append audit entry (one JSON per line)
    printf '{"ts":"%s","change_id":"%s","note_id":"%s","note_path":"%s","ref_count":{"from":%d,"to":%d},"maturity":{"from":"%s","to":"%s"}}\n' \
      "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$CHANGE_ID" "$NOTE_ID" "$NOTE_PATH" \
      "$REF_COUNT" "$NEW_COUNT" "$MATURITY" "$NEW_MATURITY" >> "$AUDIT_FILE"

    echo "✓ $NOTE_ID: ref_count $REF_COUNT→$NEW_COUNT, maturity $MATURITY→$NEW_MATURITY"
  done
fi
```

### Maturity promotion boundaries (per spec §6.2)

- `draft → verified`: `ref_count ≥ 1` (≥1 后续 spec 引用)
- `verified → proven`: `ref_count ≥ 2` (≥2 引用)
- Decay (6 months no reference → manual lint downgrade) is OUT OF SCOPE for M3 (spec §6.2 explicitly defers automation)

## Step 5: Transition spec status merged → archived + notify

```bash
node scripts/spec-status.mjs write $SPEC_PATH archived
```

Expected output: `$SPEC_PATH: status → archived`

If error "Illegal transition" → check current status:
```bash
node scripts/spec-status.mjs read $SPEC_PATH
```
The spec must be in `merged` status before this step. If it's in another state, manually set frontmatter to `merged` first, explain in commit message.

After successful write, call Flow MCP `notify_spec_event` (spec §4.5 line 575: "调完 + commit 后 call Flow MCP notify_spec_event"):

```
Call Flow MCP tool: notify_spec_event
  spec_path: $SPEC_PATH
  event: archived
```

In Claude Code session: use the `mcp__facio-flow__notify_spec_event` tool with `spec_path=$SPEC_PATH` and `event="archived"`. This triggers audit/Lark broadcast/metrics (M1 built this tool; skipping it is a regression).

## Step 6: Commit all changes

```bash
git add "$SPEC_PATH"
[ -d docs/reference/capabilities ] && git add docs/reference/capabilities/
for dir in docs/reference/decisions docs/reference/guidelines docs/reference/pitfalls; do
  [ -d "$dir" ] && git add "$dir/"
done
git status  # confirm no accidental files staged

git commit -m "chore(l1-updater): archive $CHANGE_ID — apply §5 L1 Impact + update ref_count"
```

## Step 7: Verify archive

```bash
node scripts/spec-status.mjs read $SPEC_PATH
# Expected: archived

grep "last_updated:" docs/reference/capabilities/<affected>.md
# Expected: $TODAY
```

## After Step 7 · Hint Chain

```
✓ Chain complete: $CHANGE_ID
  draft → ratified → implementing → merged → archived

  Audit trail (~/.facio-flow/audit.jsonl):
    Lifecycle events: 5
      - review_requested (spec-ratifier Step 3, NOT spec-author — codex finding #7)
      - ratified (spec-ratifier Step 7)
      - implementing_started (Flow HARD-GATE R2)
      - merged (Flow HARD-GATE R4)
      - archived (this skill, Step 5)
    Status transitions: 4
      - draft → ratified, ratified → implementing, implementing → merged, merged → archived

  L1 capability spec(s) updated: <list of files touched>
  §K Knowledge note ref_count: <count of notes incremented (0 if §K=None)>
```

This is the **terminal node** of 重路径 chain. Do not chain to any further skill.

<HARD-GATE>
Do NOT invoke any other skill after archive. spec status `archived` is terminal:
- spec-author / spec-ratifier / writing-plans / executing-plans / expert-reviewer 是
  上游 stages — chain 不能 loop backward
- mitchell-loop / freshness-anchor-check 是 ambient (CI-triggered, not chained)
- promote_context_to_spec 是轻路径 → 重路径桥（不是 post-archive）

如 user 想重访该 capability，需 start NEW L2 spec (新 <slug>.md status: draft) 从
spec-author 重新入链。
</HARD-GATE>

## If l1-updater fails mid-run

**Do not block post-merge work.** Write a failure log and continue:

```bash
mkdir -p .harness/changes/$CHANGE_ID
cat > .harness/changes/$CHANGE_ID/l1-updater-failure.md <<'EOF'
# L1 Updater Failure
change_id: CHANGE_ID_PLACEHOLDER
timestamp: ISO_PLACEHOLDER
error: ERROR_MESSAGE_PLACEHOLDER
action_required: Manually apply §5 L1 Impact and archive spec.
EOF
git add .harness/changes/$CHANGE_ID/l1-updater-failure.md
git commit -m "chore: log l1-updater failure for $CHANGE_ID (follow-up required)"
```
