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

## Step 1: Locate spec and detect context

Find the active L2 spec on this branch:

```bash
find docs/superpowers/specs -name "*.md" | xargs grep -l "^status: implementing" 2>/dev/null | head -1
```

If no spec found → treat as Micro (context-only change); run inline review per Step 3 Micro path.

Parse from the found spec:
- `CHANGE_ID`: spec filename without `.md` (e.g. `2026-05-14-add-fast-forward`)
- `SPEC_TIER`: value from §6 Pipeline Tier section (`Large` / `Normal` / `Micro`)

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

**Item 15 — §5 L1 Impact sentinel:** Read spec §5. For each ADDED capability, verify:
```bash
grep -r "@capability: CAPABILITY_ID" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py"
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

Detect UI changes:
```bash
UI_FILE_COUNT=$(git diff --name-only $BASE_SHA $HEAD_SHA \
  | grep -E "\.tsx$|\.vue$|\.css$|\.scss$|/components/|/pages/|/styles/" \
  | wc -l | tr -d ' ')
```

In a **single message**, dispatch in parallel:

**Task A — Code review:** Same as Normal.

**Task B — Harness evaluation:** Same as Normal but `{TIER}` → Large.

**Task C — UI evaluation** (only if `UI_FILE_COUNT > 0`):
Read template at `skills/expert-reviewer/ui-evaluator.md` (globally: `~/.claude/skills/expert-reviewer/ui-evaluator.md`).

Fill placeholders:
- `{SPEC_PATH}` → path to L2 spec.md
- `{CHANGE_ID}` → $CHANGE_ID
- `{BASE_SHA}` → $BASE_SHA
- `{HEAD_SHA}` → $HEAD_SHA

Dispatch as Task tool with `general-purpose` agent.

If `UI_FILE_COUNT = 0` → skip Task C; note in summary "ui-evaluator skipped: no UI files in diff".

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

## Step 5: Hint next step

**If result = PASS (no MUST FIX):**
> "Review iteration $NEXT_N complete — no blocking issues.
> Next: create PR via `gh pr create --repo vattention/<repo> --base main`
> After merge: run `l1-updater` skill to apply §5 L1 Impact and archive spec."

**If result = MUST_FIX:**
> "Review iteration $NEXT_N found MUST FIX items (listed above).
> Fix the issues, then re-run `expert-reviewer` (will be iteration $((NEXT_N+1))).
> Max for $SPEC_TIER: Micro=1 / Normal=2-3 / Large=3-5."

**If NEXT_N >= max:**
> "Max iterations reached for $SPEC_TIER tier.
> Escalate to human — see `.harness/changes/$CHANGE_ID/review-escalation.md`."
