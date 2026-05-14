---
name: freshness-anchor-check
description: Ambient CI skill — scans L1 capability spec `anchors:` frontmatter against `@capability:` sentinel comments in source code. Reports broken anchors (sentinel missing) and stale anchors (sentinel commit newer than L1 last_updated). Tier-aware fail/warn matrix per spec §6.5. Use in CI on pull_request affecting `docs/reference/capabilities/**` or source paths.
---

# Freshness Anchor Check

Ambient CI skill. Runs as part of `.github/workflows/freshness-anchor-check.yml` (or
invoked manually for local probe). **Not** part of the main 重路径 chain — never
invoked by spec-author / writing-plans / expert-reviewer / l1-updater.

## Inputs

- L1 capability specs in `docs/reference/capabilities/*.md` (frontmatter `anchors:`)
- Source code (default: `src/ scripts/`; override via spec `sentinel_paths:` frontmatter — same convention as expert-reviewer / harness-evaluator / l1-updater per M2b BUG-2)
- `TIER` env var (Micro|Normal|Large) — controls fail/warn matrix; default Normal

## Sentinel Grep Range (Inline — Self-Contained)

> **DRY-violation reasoning**: This block is duplicated in `expert-reviewer/SKILL.md`,
> `expert-reviewer/harness-evaluator.md`, and `l1-updater/SKILL.md` (M2b BUG-2 pattern).
> Each skill / template runs as a fresh subagent or CI shell — shell helpers cannot
> cross-inherit. So inline copy is required for subagent-safe standalone execution.

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

## Step 1: Resolve Tier (max-strictness if multiple specs in scope)

```bash
TIER="${TIER:-}"

# Caller may set TIER explicitly (CI sets it; manual probe may omit).
# When unset and CHANGED_SPECS env var lists multiple specs, pick max strictness
# (Large > Normal > Micro). Otherwise default Normal.
if [ -z "$TIER" ]; then
  if [ -n "${CHANGED_SPECS:-}" ]; then
    MAX_RANK=0
    BEST="Normal"
    tier_rank() { case "$1" in Micro) echo 1 ;; Normal) echo 2 ;; Large) echo 3 ;; *) echo 2 ;; esac; }
    for SPEC in $CHANGED_SPECS; do
      T=$(grep -E "^tier:" "$SPEC" 2>/dev/null | head -1 | awk '{print $2}')
      case "$T" in Micro|Normal|Large) ;; *) T="Normal" ;; esac
      R=$(tier_rank "$T")
      if [ "$R" -gt "$MAX_RANK" ]; then MAX_RANK=$R; BEST=$T; fi
    done
    TIER="$BEST"
  else
    TIER="Normal"
  fi
fi

case "$TIER" in
  Micro|Normal|Large) ;;
  *) echo "✗ invalid TIER: $TIER (must be Micro|Normal|Large)"; exit 1 ;;
esac
echo "ℹ Freshness check tier: $TIER (codex Round 1 SHOULD #2: max-strictness when multi-spec)"
```

## Step 2: Enumerate L1 capability specs

```bash
CAPABILITY_FILES=$(find docs/reference/capabilities -name "*.md" -not -name "README.md" 2>/dev/null)
if [ -z "$CAPABILITY_FILES" ]; then
  echo "ℹ no capability specs found; nothing to check"
  exit 0
fi
```

## Step 3: For each capability, scan anchors

```bash
BROKEN_COUNT=0
STALE_COUNT=0
BROKEN_LOG=""
STALE_LOG=""

for CAP_FILE in $CAPABILITY_FILES; do
  CAP_ID=$(awk '/^---$/ { in_fm = !in_fm; next } in_fm && $0 ~ /^id:/ { sub(/^id:[[:space:]]*/, ""); print; exit }' "$CAP_FILE")
  CAP_LAST_UPDATED=$(awk '/^---$/ { in_fm = !in_fm; next } in_fm && $0 ~ /^last_updated:/ { sub(/^last_updated:[[:space:]]*/, ""); print; exit }' "$CAP_FILE")

  # Parse anchors list (YAML array)
  ANCHORS=$(awk '
    /^---$/ { in_fm = !in_fm; next }
    in_fm && /^anchors:/ { in_anchors = 1; next }
    in_fm && in_anchors && /^[a-zA-Z]/ { in_anchors = 0 }
    in_fm && in_anchors && /^[[:space:]]+-[[:space:]]/ { sub(/^[[:space:]]+-[[:space:]]+/, ""); print }
  ' "$CAP_FILE")

  for ANCHOR_ID in $ANCHORS; do
    # Find sentinel matches
    SENTINEL_FILES=$(grep -rl "@capability: $ANCHOR_ID" $SENTINEL_PATHS \
      --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
      --include="*.mjs" --include="*.cjs" --include="*.py" --include="*.vue" \
      2>/dev/null)

    if [ -z "$SENTINEL_FILES" ]; then
      BROKEN_COUNT=$((BROKEN_COUNT + 1))
      BROKEN_LOG="${BROKEN_LOG}- ${CAP_ID} :: ${ANCHOR_ID} → no sentinel found in: ${SENTINEL_PATHS}"$'\n'
      continue
    fi

    # Stale check: sentinel-bearing file's last commit > L1 last_updated
    for F in $SENTINEL_FILES; do
      SENTINEL_LAST_COMMIT=$(git log -1 --format=%cs -- "$F" 2>/dev/null)
      if [ -n "$SENTINEL_LAST_COMMIT" ] && [ -n "$CAP_LAST_UPDATED" ]; then
        # YYYY-MM-DD string compare is valid for ISO dates
        if [ "$SENTINEL_LAST_COMMIT" \> "$CAP_LAST_UPDATED" ]; then
          STALE_COUNT=$((STALE_COUNT + 1))
          STALE_LOG="${STALE_LOG}- ${CAP_ID} :: ${ANCHOR_ID} → sentinel in ${F} last commit ${SENTINEL_LAST_COMMIT} > L1 last_updated ${CAP_LAST_UPDATED}"$'\n'
        fi
      fi
    done
  done
done

echo "Broken anchors: $BROKEN_COUNT"
echo "Stale anchors:  $STALE_COUNT"
```

## Step 4: Tier-aware verdict

```bash
case "$TIER" in
  Micro)
    [ "$BROKEN_COUNT" -gt 0 ] && echo "⚠ broken anchors (Micro: warn only)"$'\n'"$BROKEN_LOG"
    [ "$STALE_COUNT" -gt 0 ]  && echo "⚠ stale anchors (Micro: skipped per spec §6.5 tier-aware)"
    exit 0
    ;;
  Normal)
    if [ "$BROKEN_COUNT" -gt 0 ]; then
      echo "✗ broken anchors (Normal: fail)"$'\n'"$BROKEN_LOG"
      exit 1
    fi
    [ "$STALE_COUNT" -gt 0 ] && echo "⚠ stale anchors (Normal: warn)"$'\n'"$STALE_LOG"
    exit 0
    ;;
  Large)
    if [ "$BROKEN_COUNT" -gt 0 ]; then
      echo "✗ broken anchors (Large: fail)"$'\n'"$BROKEN_LOG"
      exit 1
    fi
    if [ "$STALE_COUNT" -gt 0 ]; then
      echo "✗ stale anchors (Large: fail)"$'\n'"$STALE_LOG"
      exit 1
    fi
    exit 0
    ;;
esac
```

## When to invoke

- **CI default**: GitHub Actions workflow `.github/workflows/freshness-anchor-check.yml`
  (pull_request paths trigger; TIER read from the L2 spec being merged — if no L2 spec,
  default `Normal`)
- **Manual local probe**: `cd <repo> && TIER=Normal bash <path>/skills/freshness-anchor-check/SKILL.md`
  (only the shell sections execute — markdown ignored — for ad-hoc verification before push)
- **NOT chained from any other skill**. Per spec §6.5 ambient design, this is CI-triggered,
  not part of the 重路径 chain.

## After execution · Hint Chain

```
✓ freshness-anchor-check complete
  Tier: $TIER
  Broken anchors: $BROKEN_COUNT
  Stale anchors:  $STALE_COUNT

  Verdict: <pass | warn-only | fail>
```

This is an **ambient terminal skill**. Do NOT chain to any other skill.

<HARD-GATE>
freshness-anchor-check is ambient. After execution:
- Do NOT invoke spec-author / writing-plans / expert-reviewer / l1-updater
- If broken/stale found → comment on PR or write `.harness/freshness-report.md` for the
  team to read; do not auto-fix (sentinel placement requires architectural judgment)
- If user wants to fix stale anchor → they start a new L2 spec via spec-author
</HARD-GATE>
