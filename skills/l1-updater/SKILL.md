---
name: l1-updater
description: ARCHIVE subtask — run after PR merge. Applies L2 spec §5 L1 Impact to capability specs, updates ref_count + last_referenced for §K cited knowledge notes, transitions spec status merged→archived. Use after every merged L2 spec.
---

# L1 Updater

Post-merge ARCHIVE subtask. Run after the PR is merged on main.

## Pre-conditions

- PR is merged to main
- You are on main branch (or the merge commit)
- Spec status = `merged` (verify below)

## Step 1: Find the spec

```bash
find docs/superpowers/specs -name "*.md" \
  | xargs grep -l "^status: merged" 2>/dev/null
```

If multiple specs with `status: merged` → ask the user which one to archive. Process one at a time.

Set variables:
```bash
SPEC_PATH="<path from above>"
CHANGE_ID="$(basename $SPEC_PATH .md)"
TODAY="$(date +%Y-%m-%d)"
```

Verify status is indeed `merged`:
```bash
node scripts/spec-status.mjs read $SPEC_PATH
```

Expected: `merged`. If not → stop and report current status.

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

Then plant the sentinel in code (done during implementation, but verify it exists):
```bash
grep -r "@capability: <capability-id>" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py"
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

> **M2 scope note:** spec §6.6 assigns full ref_count CI automation to M3. M2 l1-updater does a simplified manual update only if the spec has §K links. Full CI-based ref_count + maturity promotion is M3 work.

```bash
cat $SPEC_PATH
```

Parse the §K Knowledge References section. Find all markdown links to `docs/reference/` files:
```
[K-decisions-001](./decisions/some-decision.md) — ...
```

For each linked Knowledge note file, update its §C.4 frontmatter (NOT capability spec frontmatter):

```bash
NOTE_PATH="docs/reference/decisions/some-decision.md"

# Read current values
REF_COUNT=$(grep "^ref_count:" "$NOTE_PATH" | awk '{print $2}')
MATURITY=$(grep "^maturity:" "$NOTE_PATH" | awk '{print $2}')
NEW_COUNT=$((REF_COUNT + 1))

# Update ref_count and last_referenced (macOS sed)
sed -i '' "s/^ref_count: .*/ref_count: $NEW_COUNT/" "$NOTE_PATH"
sed -i '' "s/^last_referenced: .*/last_referenced: $TODAY/" "$NOTE_PATH"

# Maturity auto-promotion
if [ "$MATURITY" = "draft" ] && [ "$NEW_COUNT" -ge 1 ]; then
  sed -i '' "s/^maturity: draft/maturity: verified/" "$NOTE_PATH"
  echo "Promoted $NOTE_PATH: draft → verified (ref_count=$NEW_COUNT)"
fi
if [ "$MATURITY" = "verified" ] && [ "$NEW_COUNT" -ge 2 ]; then
  sed -i '' "s/^maturity: verified/maturity: proven/" "$NOTE_PATH"
  echo "Promoted $NOTE_PATH: verified → proven (ref_count=$NEW_COUNT)"
fi
```

Repeat for every Knowledge note linked in §K. If §K section is absent or empty → skip this step.

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
