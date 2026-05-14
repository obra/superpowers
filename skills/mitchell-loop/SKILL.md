---
name: mitchell-loop
description: Ambient skill triggered by GitHub Actions post-merge detection (workflow is detection-only per M4a F5; AI session runs this skill) when PR review iteration ≥2 (review-2.md+ exists) OR escalation (review-escalation.md exists). Reads review failure patterns, drafts a guideline note (`docs/reference/guidelines/<slug>.md`) per spec §C.4 schema (next K-guidelines-NNN in 001-799 production namespace), commits + opens a draft PR. Lark broadcast happens via GitHub→Lark webhook on the draft PR open — does NOT call `notify_spec_event` (M4a F2 — guideline notes lack `status:` frontmatter required by that tool). NEVER chains to main 重路径 skills.
---

# Mitchell Loop

Ambient skill. Runs as part of `.github/workflows/mitchell-loop.yml` (or invoked
manually for local probe). **Not** part of the main 重路径 chain — never invoked
by spec-author / writing-plans / expert-reviewer / l1-updater / role-* / promote.

## Inputs

- `CHANGE_DIR` env var — `.harness/changes/<change_id>/` path (workflow sets this)
- Required files in `$CHANGE_DIR/`:
  - At least one of `review-2.md`, `review-3.md`, ..., or `review-escalation.md`
  - `pr.md` (PR meta; M2b State B contract) — optional but improves Lark routing
- `docs/reference/guidelines/` (target dir; created via init)
- `scripts/rebuild-catalog.sh` (M3 deliverable; reused for schema validate)

## Trigger Condition (Inline — Self-Contained for Subagent Isolation)

> **DRY-violation reasoning**: ambient skills (mitchell-loop, freshness-anchor-check)
> are dispatched as fresh CI jobs or subagents; shell helpers don't cross-inherit. Inline
> trigger logic is required for standalone execution (M2b BUG-2 precedent).

```bash
# Trigger condition: at least one of these files must exist
TRIGGER_REVIEW_N=$(find "$CHANGE_DIR" -maxdepth 1 -name "review-[0-9]*.md" 2>/dev/null \
  | awk -F'review-' '{print $2}' | awk -F'.md' '{print $1}' \
  | awk '$1+0 >= 2 { found=1 } END { exit !found }' \
  && echo "yes" || echo "no")
TRIGGER_ESCALATION=$([ -e "$CHANGE_DIR/review-escalation.md" ] && echo "yes" || echo "no")

if [ "$TRIGGER_REVIEW_N" != "yes" ] && [ "$TRIGGER_ESCALATION" != "yes" ]; then
  echo "ℹ mitchell-loop skipped: no review-N.md (N≥2) and no review-escalation.md in $CHANGE_DIR"
  exit 0
fi

echo "✓ mitchell-loop triggered: review_n=$TRIGGER_REVIEW_N escalation=$TRIGGER_ESCALATION"
```

## Step 1: Gather failure pattern raw material

```bash
PATTERN_FILES=""
[ "$TRIGGER_REVIEW_N" = "yes" ] && PATTERN_FILES=$(find "$CHANGE_DIR" -maxdepth 1 -name "review-[2-9]*.md" -o -name "review-1[0-9]*.md" 2>/dev/null)
[ "$TRIGGER_ESCALATION" = "yes" ] && PATTERN_FILES="$PATTERN_FILES $CHANGE_DIR/review-escalation.md"

# Extract MUST FIX / SHOULD sections (markdown headings convention from expert-reviewer M2/M2b output)
for F in $PATTERN_FILES; do
  echo "--- $F ---"
  awk '/^## (MUST FIX|SHOULD|Failure Pattern)/,/^## /' "$F" 2>/dev/null
done > /tmp/mitchell-loop-raw.txt

if [ ! -s /tmp/mitchell-loop-raw.txt ]; then
  echo "⚠ no MUST FIX / SHOULD / Failure Pattern sections found; mitchell-loop has nothing to extract"
  exit 0
fi
```

## Step 2: Choose next K-id in production namespace (001-799)

```bash
GUIDELINES_DIR="docs/reference/guidelines"
# Note: regex requires 3 digits to exclude `K-guidelines-NNN` placeholder in
# guidelines/README.md template (surfaced during M4a Task 9 fixture probe).
NEXT_ID=$(grep -hE "^id: K-guidelines-[0-9]{3}" "$GUIDELINES_DIR"/*.md 2>/dev/null \
  | sed -E 's/^id: K-guidelines-0*([0-9]+).*/\1/' \
  | sort -n | tail -1)
NEXT_ID=$((${NEXT_ID:-0} + 1))

# Reject fixture namespace 800+ (M3 K-id namespace convention)
if [ "$NEXT_ID" -ge 800 ]; then
  echo "✗ K-guidelines next-id would exceed production namespace (≥800 = fixture); halt for human review"
  exit 1
fi

KID=$(printf "K-guidelines-%03d" "$NEXT_ID")
echo "ℹ Assigned K-id: $KID"
```

## Step 3: Draft guideline note per §C.4 schema (7 REQUIRED + 2 OPTIONAL)

> **AI must produce note body content based on /tmp/mitchell-loop-raw.txt — abstract
> the failure pattern into a generalizable guideline. Skip if the pattern is too
> change-specific to generalize.**

Body must include:
- A 1-line title summarizing the pattern
- "Why" section (what failure mode this avoids)
- "How to apply" section (concrete rule for future PRs)
- Reference back to `$CHANGE_DIR` (the source review).

Frontmatter:

```yaml
---
id: <KID>
type: guideline
title: <Human-readable; AI-drafted from pattern>
maturity: draft
ref_count: 0
created: <YYYY-MM-DD from $(date -u +%Y-%m-%d)>
source: mitchell-loop-<change_id>
tags: [<optional; AI-suggested>]
---
```

Optional `last_referenced:` — leave empty (per §C.4 OPTIONAL + M3 R3 patch: empty form `last_referenced:` is canonical when never referenced).

## Step 4: Validate schema via reused rebuild-catalog.sh

> **F3 codex P2 patched**: M3's `scripts/rebuild-catalog.sh` accepts only `--root <dir>`
> and `--out <file>` (no `--validate-only` / `--dry-run`). However, `validate_all_notes`
> runs unconditionally during every rebuild and exits 1 on any schema failure BEFORE
> writing the output. So "validate without committing to production catalog.md" =
> run rebuild with `--out` pointed at a scratch file (e.g., `/tmp/...` or `/dev/null`).

```bash
# rebuild-catalog.sh (M3 deliverable) validates §C.4 schema in validate_all_notes()
# before writing output. We point --out at a scratch path so production catalog.md
# is not modified by this validation pass; the new draft note is included in the
# scan because it's already on disk in docs/reference/guidelines/.

TMP_NOTE="$GUIDELINES_DIR/$KID-draft-$(date +%s).md"
mv /tmp/mitchell-loop-draft.md "$TMP_NOTE"

SCRATCH_CATALOG="/tmp/mitchell-loop-validate-$(date +%s).md"
if ! bash scripts/rebuild-catalog.sh --out "$SCRATCH_CATALOG" 2>&1 | tee /tmp/mitchell-validate.log; then
  echo "✗ draft note failed §C.4 schema validate; see /tmp/mitchell-validate.log"
  rm "$TMP_NOTE" "$SCRATCH_CATALOG" 2>/dev/null || true
  exit 1
fi

# Confirm the new note is enumerated in the scratch catalog (sanity check)
if ! grep -q "$KID" "$SCRATCH_CATALOG"; then
  echo "✗ draft note $KID validated but not enumerated in catalog rebuild — schema issue?"
  rm "$TMP_NOTE" "$SCRATCH_CATALOG" 2>/dev/null || true
  exit 1
fi
rm "$SCRATCH_CATALOG"
echo "✓ schema validate passed; $KID enumerated"
```

## Step 5: Commit draft on a new branch + open PR

```bash
# F4 codex P2 patched: derive change_id from CHANGE_DIR (was undefined, expanded empty).
# CHANGE_DIR convention: .harness/changes/<change_id>/  →  basename = change_id.
change_id=$(basename "$CHANGE_DIR")
if [ -z "$change_id" ] || [ "$change_id" = "." ] || [ "$change_id" = "/" ]; then
  echo "✗ could not derive change_id from CHANGE_DIR=$CHANGE_DIR"
  rm "$TMP_NOTE" 2>/dev/null || true
  exit 1
fi

SLUG=$(echo "$change_id" | tr '/' '-')
BRANCH="mitchell-loop/$KID-$SLUG"
git checkout -b "$BRANCH"
git add "$TMP_NOTE"
git commit -m "draft(guidelines): $KID — auto-extracted from review failure in $change_id

Source: mitchell-loop ambient hook
Trigger: $([ "$TRIGGER_REVIEW_N" = "yes" ] && echo "review-N.md (N≥2)") $([ "$TRIGGER_ESCALATION" = "yes" ] && echo "+ review-escalation.md")
Change: $CHANGE_DIR

Body content is AI-drafted; maturity=draft pending human review.
"
git push -u origin "$BRANCH"
DRAFT_PR_URL=$(gh pr create --base main \
  --title "draft(guidelines): $KID — mitchell-loop auto-draft" \
  --body "Auto-drafted by mitchell-loop ambient skill from review failure in \`$change_id\`. Maturity = draft; pending human review.")
echo "✓ draft PR opened: $DRAFT_PR_URL"
```

## Step 6: PR-based notification (F2 codex P1 patched — NO notify_spec_event call)

> ⚠️ **Why NOT notify_spec_event** (codex Round 1 P1 finding F2): `notify_spec_event`
> reads target file as L2 spec and at facio-flow/src/mcp-server/tools/spec-tools.ts:228-238
> **requires** `status:` frontmatter field. Guideline notes per §C.4 schema do NOT have
> a `status` field (they have `maturity:` instead). So `notify_spec_event(spec_path=<note>, ...)`
> always returns `isError: true` with "spec frontmatter missing 'status' field".
> Forging a `status` field on the note would pollute §C.4 schema (rejected by
> rebuild-catalog.sh validator). Therefore mitchell-loop MUST NOT call notify_spec_event.

**Notification path** (PR-only):

1. Step 5 already opened a draft PR via `gh pr create` — this is the primary notification.
2. Comment on the source merged PR (the one whose `review-N.md` triggered this run)
   linking the draft:

   ```bash
   SOURCE_PR_NUM=$(awk -F': *' '/^number:/ {print $2}' "$CHANGE_DIR/pr.md" 2>/dev/null)
   if [ -n "$SOURCE_PR_NUM" ]; then
     gh pr comment "$SOURCE_PR_NUM" \
       --body "🪞 mitchell-loop drafted **$KID** from this PR's review failures.
   Draft note: \`$TMP_NOTE\`
   Draft PR: ${DRAFT_PR_URL}
   Reviewers welcome — maturity stays \`draft\` until ≥1 spec §K reference." \
       || echo "⚠ comment on source PR failed (PR may be in different repo); draft PR notification still in place"
   fi
   ```

3. **Lark broadcast satisfies spec §A.3 "发 Lark 邀请人审" via existing GitHub→Lark
   webhook integration** — Lark monitors `pull_request opened` events on the org's
   repos. When mitchell-loop opens its draft PR in Step 5, Lark fires automatically.
   No mitchell-loop code path emits Lark directly.

**Failure tolerance**: comment failure on source PR does NOT abort. The draft PR
opened in Step 5 is the canonical deliverable. Lark broadcast happens via webhook
on PR open; mitchell-loop is decoupled from Lark wire protocol.

## When to invoke

- **Primary entry (M4a)**: human runs `Skill(mitchell-loop)` in a Claude Code session
  after seeing the GitHub Actions workflow's trigger-marker comment on a merged PR.
  AI session is needed because Step 3 (drafting the note body) is an LLM task — the
  workflow alone is **detection-only** (F5 codex P2 patched; M4a scope).
- **CI default (detection-only)**: GitHub Actions workflow `.github/workflows/mitchell-loop.yml`
  (pull_request closed + merged + paths `.harness/changes/**`) detects qualifying
  conditions and comments a trigger marker on the merged PR. It does NOT autonomously
  create the draft PR — that step requires the AI session above.
- **Manual local probe**: `cd <repo> && CHANGE_DIR=.harness/changes/<id> bash <path>/skills/mitchell-loop/SKILL.md`
  (shell sections only; markdown Step 3 body is AI-drafted in session)
- **NOT chained from any other skill**. Per spec §A.3 ambient design, this is post-merge
  triggered, not part of the 重路径 chain.

## After execution · Hint Chain

```
✓ mitchell-loop complete
  Source change: $change_id
  Trigger: review_n=$TRIGGER_REVIEW_N escalation=$TRIGGER_ESCALATION
  K-id assigned: $KID
  Draft PR: <URL>
  Lark notify: <status>

  Maturity: draft — awaiting human reviewer ratification
```

This is an **ambient terminal skill**. Do NOT chain to any other skill.

<HARD-GATE>
mitchell-loop is ambient. After execution:
- Do NOT invoke spec-author / writing-plans / expert-reviewer / l1-updater / role-* / promote_context_to_spec
- The output (draft PR + Lark notify) goes to the team; human reviewers decide whether
  to ratify the draft (manual maturity: draft → verified after ≥1 spec §K reference)
- If trigger condition not met (no review-N.md N≥2 and no review-escalation.md) →
  exit 0 silently; no draft, no PR, no notify
- If K-id namespace overflow (≥800) → halt for human review; do NOT touch fixture namespace
</HARD-GATE>
