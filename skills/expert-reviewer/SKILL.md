---
name: expert-reviewer
description: Tier-aware dispatch of code review after implementation. Use when implementation is complete and ready for review before PR submission. Wraps upstream requesting-code-review + dispatches harness-evaluator and ui-evaluator templates via Task tool. Micro = inline; Normal = 2 evaluators parallel; Large = up to 3 evaluators parallel.
---

# Expert Reviewer

Dispatch code review after implementation completes. Tier determines dispatch depth.

**This skill wraps upstream `requesting-code-review`** — never modify that skill.

## Pre-conditions

Before running this skill:
- All writing-plans tasks are complete
- Code committed to feature branch
- `verification-before-completion` upstream skill already run

## Sentinel Grep Range (inline; do NOT extract into shared shell helper — see harness-evaluator.md / l1-updater/SKILL.md 各自有独立副本)

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

# Inline grep (use directly, do NOT extract into a shell function — this block lives
# in 3 separate files: expert-reviewer/SKILL.md, harness-evaluator.md, l1-updater/SKILL.md,
# and harness-evaluator.md is dispatched to a fresh subagent that cannot inherit shell fns.)
grep -r "@capability: $CAPABILITY_ID" $SENTINEL_PATHS \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.mjs" --include="*.cjs" --include="*.py" --include="*.vue" \
  2>/dev/null
```

## Step 1: Locate spec and detect context

Bind `$SPEC_PATH` for use by Step 3 dispatch + Sentinel Grep helper. Honor explicit
override (for synthetic probes / fixture pilots that live outside docs/superpowers/specs/):

```bash
if [ -n "$SPEC_PATH" ]; then
  # Explicit override (e.g. probe under .harness/changes/_m2b-fixtures/synth/<probe>/spec.md)
  test -f "$SPEC_PATH" || { echo "✗ SPEC_PATH override invalid: $SPEC_PATH"; exit 1; }
else
  # Default: discover in conventional path
  SPEC_PATH=$(find docs/superpowers/specs -name "*.md" \
    | xargs grep -l "^status: implementing" 2>/dev/null | head -1)
fi

if [ -z "$SPEC_PATH" ]; then
  echo "ℹ No implementing-status L2 spec found → treat as Micro (context-only change); inline review per Step 3 Micro path"
  SPEC_PATH=""   # downstream Step 3 Micro path tolerates empty
fi
```

Parse from `$SPEC_PATH` (when non-empty); **prefer frontmatter `change_id`** to allow
synthetic probes outside `docs/superpowers/specs/` to declare canonical change IDs:

```bash
CHANGE_ID=$(grep -E '^change_id:' "$SPEC_PATH" 2>/dev/null | head -1 | awk '{print $2}')
[ -z "$CHANGE_ID" ] && CHANGE_ID=$(basename "$SPEC_PATH" .md)
SPEC_TIER=$(grep -E '^tier:' "$SPEC_PATH" | head -1 | awk '{print $2}')
# Fallback: read tier from §6 body if frontmatter absent
[ -z "$SPEC_TIER" ] && SPEC_TIER=$(sed -n '/## §6 Pipeline Tier/,/^## /p' "$SPEC_PATH" \
  | grep -oE "Micro|Normal|Large" | head -1)
```

## Step 2: Check iteration counter vs max

```bash
ITERATION=$(ls .harness/changes/$CHANGE_ID/review-*.md 2>/dev/null | wc -l | tr -d ' ')
NEXT_N=$((ITERATION + 1))
```

Tier iteration max:
- Micro: 1
- Normal: 2–3
- Large: 3–5

If `ITERATION >= max`:
```bash
mkdir -p .harness/changes/$CHANGE_ID
cat >> .harness/changes/$CHANGE_ID/review-escalation.md <<'EOF'
# Review Escalation
change_id: CHANGE_ID_PLACEHOLDER
iterations_exhausted: true
timestamp: ISO_PLACEHOLDER
action_required: Human decision needed — max review iterations reached.
EOF
git add .harness/changes/$CHANGE_ID/review-escalation.md
git commit -m "chore: log review escalation for $CHANGE_ID"
```
Then STOP and inform the user. Do not proceed to Step 3.

## Step 3: Dispatch by Tier

Compute git range:
```bash
BASE_SHA=$(git merge-base HEAD main)
HEAD_SHA=$(git rev-parse HEAD)
```

### Micro — inline review (no subagent)

Run abbreviated harness check inline (items 14, 15, 17 only):

**Item 14 — AC Coverage (abbreviated):** Read spec §1 ACs. Run:
```bash
git diff --name-only $BASE_SHA $HEAD_SHA | grep -E "test|spec\."
```
Confirm each AC has at least one related test file in the diff.

**Item 15 — §5 L1 Impact sentinel:** Read spec §5. For each ADDED capability, verify (use `SENTINEL_PATHS` defined in Sentinel Grep Range section above):
```bash
grep -r "@capability: $CAPABILITY_ID" $SENTINEL_PATHS \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.mjs" --include="*.cjs" --include="*.py" --include="*.vue" \
  2>/dev/null
```

**Item 17 — Role-binding (soft warn only):** Read `role:` from spec frontmatter. Compare changed paths. Note mismatch as INFO, never block.

Write summary inline and proceed to Step 4.

### Normal — parallel dispatch (2 evaluators)

In a **single message**, dispatch both via Task tool in parallel:

**Task A — Code review:**
Invoke `Skill(requesting-code-review)` with:
- BASE_SHA: $BASE_SHA
- HEAD_SHA: $HEAD_SHA
- Brief description of what was implemented (read from spec §1 goal)

**Task B — Harness evaluation:**
Read the template file at `skills/expert-reviewer/harness-evaluator.md` (relative to the skill base directory, globally installed at `~/.claude/skills/expert-reviewer/harness-evaluator.md`).

Fill these placeholders in the template:
- `{SPEC_PATH}` → path to L2 spec.md
- `{CHANGE_ID}` → $CHANGE_ID
- `{BASE_SHA}` → $BASE_SHA
- `{HEAD_SHA}` → $HEAD_SHA
- `{TIER}` → Normal
- `{ITERATION}` → $NEXT_N

Dispatch as Task tool with `general-purpose` agent using the filled template as prompt.

Wait for **both** tasks to complete before Step 4.

### Large — parallel dispatch (up to 3 evaluators)

**UI file detection (default heuristic + frontmatter override)**:

```bash
# Default: heuristic file globs from git diff
UI_FILE_COUNT=$(git diff --name-only "$BASE_SHA".."$HEAD_SHA" \
  | grep -E "\.tsx$|\.vue$|\.jsx$|\.css$|\.scss$|\.html$|/components/|/pages/|/styles/|/views/|/templates/" \
  | wc -l | tr -d ' ')

# Override: spec frontmatter `ui_change: true` forces dispatch even if file globs miss
# (for non-webapp repos / fixture testing / WIP UI in non-conventional path)
UI_FRONTMATTER_FORCE=0
if [ -n "$SPEC_PATH" ]; then
  UI_FRONTMATTER_FORCE=$(grep -E "^ui_change:[[:space:]]*true" "$SPEC_PATH" | wc -l | tr -d ' ')
fi

if [ "$UI_FILE_COUNT" -gt 0 ] || [ "$UI_FRONTMATTER_FORCE" -gt 0 ]; then
  UI_DISPATCH_REASON="UI_FILE_COUNT=$UI_FILE_COUNT, frontmatter_override=$UI_FRONTMATTER_FORCE"
else
  UI_DISPATCH_REASON="skipped: UI_FILE_COUNT=0 AND no ui_change: true frontmatter"
fi
```

**Frontmatter contract**:
- `ui_change: true` in L2 spec frontmatter → force ui-evaluator dispatch (regardless of file globs)
- `ui_change: false` (default if absent) → fall back to git diff file detection
- 适用场景：fixture pilot in non-webapp repo / WIP UI in non-conventional dir / 维护期需 ui-evaluator 复审但当前 PR 无 UI diff

In a **single message**, dispatch in parallel via 3 Task tool calls:

**Task A — Code review:** Same as Normal (invoke `Skill(requesting-code-review)`).

**Task B — Harness evaluation:** Same as Normal but `{TIER}` → Large (read template
at `~/.claude/skills/expert-reviewer/harness-evaluator.md`, substitute placeholders,
dispatch via Task tool with `general-purpose` agent).

**Task C — UI evaluation** (only if `UI_DISPATCH_REASON` does NOT start with `skipped`):

1. **Read template**: load `~/.claude/skills/expert-reviewer/ui-evaluator.md`
2. **Substitute placeholders** in the template body:
   - `{SPEC_PATH}` ← `$SPEC_PATH`
   - `{CHANGE_ID}` ← `$CHANGE_ID`
   - `{BASE_SHA}` ← `$BASE_SHA`
   - `{HEAD_SHA}` ← `$HEAD_SHA`
   - `{TIER}` ← `$SPEC_TIER`
   - `{ITERATION}` ← `$NEXT_N`
3. **Dispatch via Task tool**: invoke a `general-purpose` subagent with the substituted
   template body as its prompt; description ~10-15 words; **send in parallel** with
   Tasks A + B — same message, 3 Task tool calls in one block
4. **Capture output**: when subagent returns, save its full text response as `$UI_OUTPUT`
   (used in Step 4 aggregation `## UI Evaluator Notes` paste-here block)

If `UI_DISPATCH_REASON` starts with `skipped`:

```bash
UI_OUTPUT="(ui-evaluator skipped — $UI_DISPATCH_REASON)"
```

Set this directly without dispatch; record reason in Step 4 review-N.md `## UI Evaluator Notes` section.

Wait for all dispatched tasks before Step 4.

## Step 4: Aggregate outputs and write review summary

Classify all findings from evaluators:
- **MUST FIX** — blocks merge: failing test, missing AC coverage, broken sentinel, missing ADR for new library, §7 Doc Impact undeclared gap
- **SHOULD** — fix before merge, negotiable: implicit doc gap, missing JSDoc on new export
- **INFO** — log only: role mismatch note, style suggestion

Write `.harness/changes/$CHANGE_ID/review-$NEXT_N.md`:

```bash
mkdir -p .harness/changes/$CHANGE_ID
cat > .harness/changes/$CHANGE_ID/review-$NEXT_N.md <<'EOF'
---
change_id: CHANGE_ID_PLACEHOLDER
iteration: NEXT_N_PLACEHOLDER
tier: TIER_PLACEHOLDER
timestamp: ISO_PLACEHOLDER
evaluators_run: [requesting-code-review, harness-evaluator]
result: PASS_OR_MUST_FIX_PLACEHOLDER
---

## MUST FIX
MUST_FIX_ITEMS_OR_NONE

## SHOULD
SHOULD_ITEMS_OR_NONE

## INFO
INFO_ITEMS_OR_NONE

## Harness Evaluator Item-by-Item
PASTE_HARNESS_EVALUATOR_TABLE_HERE

## Code Reviewer Notes
PASTE_CODE_REVIEWER_OUTPUT_HERE

## UI Evaluator Notes
PASTE_UI_EVALUATOR_OUTPUT_OR_SKIPPED
EOF
git add .harness/changes/$CHANGE_ID/review-$NEXT_N.md
git commit -m "chore(review): iteration $NEXT_N for $CHANGE_ID"
```

## Step 5: Emit review result

**If result = PASS (no MUST FIX):**

```
✓ Review iteration $NEXT_N complete — no MUST FIX issues.
  - .harness/changes/$CHANGE_ID/review-$NEXT_N.md written
  - Tier: $SPEC_TIER (UI dispatch reason: $UI_DISPATCH_REASON)
  - SHOULD items: $SHOULD_COUNT (optional follow-up)
  - INFO items: $INFO_COUNT (advisory only)

Flow HARD-GATE R4 will pick up after PR merge:
  - Persist PR meta to .harness/changes/$CHANGE_ID/pr.md (number + URL + merge_commit_sha)
  - spec-status.mjs write implementing → merged (in post-merge follow-up PR, NOT direct main)
  - notify_spec_event(merged)
  - invoke l1-updater
```

**If result = MUST_FIX AND iteration $NEXT_N < max for tier:**

```
✗ Review iteration $NEXT_N found MUST FIX items:
  - .harness/changes/$CHANGE_ID/review-$NEXT_N.md (see "## MUST FIX" section)
  - Iteration $NEXT_N of max for $SPEC_TIER tier (Micro=1 / Normal=2-3 / Large=3-5)

Flow HARD-GATE R3b will pick up:
  - Invoke superpowers:subagent-driven-development in resume mode
  - Goal: "fix the MUST FIX items listed in review-$NEXT_N.md"
  - After fix + commit, R3 re-fires → expert-reviewer iter $((NEXT_N+1))
```

**If MUST_FIX AND $NEXT_N >= max iteration for tier:**

```
✗ Max iterations reached for $SPEC_TIER tier ($NEXT_N / max).
  - .harness/changes/$CHANGE_ID/review-escalation.md written
  - Flow HARD-GATE R4-fail halts chain — no auto-invoke of executing-plans or l1-updater

Human decision required (Flow R4-fail message):
  (a) Human reviewer override MUST FIX → manually continue to PR
  (b) Spec amendment / rescope → may require implementing → draft regression (spec §A.3)
```

## After Step 5 · Hint Chain

```
Outcome routed by Flow Skill HARD-GATE:
  - PASS + PR merged → R4 (l1-updater archives spec + applies §5 L1 Impact)
  - MUST FIX + iter < max → R3b (executing-plans resume; counter++; auto re-invoke)
  - MUST FIX + iter ≥ max → R4-fail (halt; human decision)
```

<HARD-GATE>
Do NOT invoke `l1-updater` yourself. Flow Skill HARD-GATE R4 owns post-merge transition.
Do NOT invoke `subagent-driven-development` or `executing-plans` yourself for MUST FIX
loop. Flow Skill HARD-GATE R3b owns the resume routing.
Do NOT call `spec-status.mjs write` yourself. expert-reviewer is read-only on spec
frontmatter — it only writes `.harness/changes/<change_id>/review-<N>.md` and
`review-escalation.md`.
Do NOT create the PR yourself — that's a human checkpoint (CODEOWNERS review).
</HARD-GATE>
