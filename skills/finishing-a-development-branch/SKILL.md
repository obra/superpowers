---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Rebase onto base branch → Detect drift → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Read base info from the spec header

Find the most recent spec in `docs/superpowers/specs/`:

```bash
# Files are named YYYY-MM-DD-<topic>-design.md; sort by filename date
most_recent_spec=$(ls -1 docs/superpowers/specs/*.md 2>/dev/null | sort -r | head -1)
```

Parse the `**Base revision:**` line in that spec:

```
**Base revision:** `<hash>` on branch `<branch>` (as of <timestamp>)
```

Or, if the spec has been updated:

```
**Base revision:** `<original-hash>` on branch `<branch>`, later updated to reflect `<new-hash>` (as of <timestamp>)
```

Extract:
- `BASE_BRANCH` — the branch name from "on branch `<branch>`"
- `BASE_REVISION` — the "later updated to reflect" value if present; otherwise the first hash

**If the spec has no `**Base revision:**` header** (e.g., it was written by an older brainstorming session that predates drift detection), skip Step 2.5 entirely and continue to Step 3. This is the backward-compatibility path: old specs get the old behavior (no drift detection), exactly as they would have under earlier versions of this skill.

**If no spec exists at all** (rare; your human partner ran finishing on a branch without going through brainstorming), skip Step 2.5 and continue to Step 3, also as the old behavior.

### Step 2.5: Rebase and drift detection

**Run this step whenever a base revision was found in Step 2.** A clean rebase is not proof that the merge is safe, and a missing rebase is not proof that the drift is cosmetic. Both must be checked.

**Do not skip this step because tests pass or your human partner already reviewed the code.**

#### A. Pre-check the rebase (read-only)

Determine whether rebasing the feature branch onto `<BASE_BRANCH>` would succeed cleanly, without actually mutating any branch state:

```bash
# Simulate a merge of BASE_BRANCH into HEAD using git merge-tree.
# Output contains conflict markers if the rebase would fail.
conflict_output=$(git merge-tree --write-tree "$BASE_REVISION" HEAD "$BASE_BRANCH" 2>&1)
```

If `git merge-tree` is not available on the host's git version, fall back to the portable approach:

```bash
# Create a throwaway worktree of the feature branch, try the rebase there,
# capture the result, then remove the worktree. Never touches the main checkout.
tmp_wt=$(mktemp -d)
git worktree add -q --detach "$tmp_wt" HEAD
(cd "$tmp_wt" && git rebase "$BASE_BRANCH" >/dev/null 2>&1) && rebase_clean=1 || rebase_clean=0
git worktree remove -f "$tmp_wt"
```

Three outcomes are possible:

1. **Rebase is clean and `git diff "$BASE_REVISION".."$BASE_BRANCH"` is empty** → the base branch hasn't moved since we branched, nothing to analyze. Continue to Step 3 without further drift work.

2. **Rebase is clean and the diff is non-empty** → the base branch has moved but without textual conflicts. Proceed to (B) "Actually rebase" and then (C) "Dispatch reviewer with clean-rebase input."

3. **Rebase would conflict** → the base branch and feature branch touch overlapping regions. Do NOT rebase. Record the list of conflicting files and a snippet of each conflict region. Skip (B) and go directly to (C) "Dispatch reviewer with conflict input."

#### B. Actually rebase (clean case only)

```bash
git rebase "$BASE_BRANCH"
```

The feature branch is now linearly on top of `<BASE_BRANCH>`. Any subsequent merge (Step 4 Option 1) will be a clean fast-forward.

#### C. Dispatch the drift reviewer subagent

Use the Task tool with the **most capable available model** (drift evaluation is judgment, not mechanics — a cheap model will mechanically approve merges that no longer make sense). Do not evaluate drift inline.

The reviewer needs:
- The diff: `git diff "$BASE_REVISION".."$BASE_BRANCH"` (or, after rebasing in B, `git diff "$BASE_REVISION"..HEAD` — equivalent because the branch is now rebased)
- The spec document(s) under `docs/superpowers/specs/`
- The plan document(s) under `docs/superpowers/plans/`
- A list of files this branch added or modified
- **If rebase had conflicts** (case 3 above): the list of conflicting files and the conflict regions. Label this explicitly as "Rebase conflict" in the reviewer's input.

Reviewer prompt template at `./drift-reviewer.md`.

#### D. Act on the reviewer's report

The reviewer reports `NO_DRIFT` or `DRIFT_FOUND` with issues and a `RECOMMENDED_ACTION`.

**On NO_DRIFT:**

- If we were in case 2 (clean rebase, non-empty diff): continue to Step 3. The branch is rebased and safe.
- If we were in case 3 (rebase conflict): this shouldn't happen — a reviewer presented with rebase conflicts should not return NO_DRIFT. If it does, the reviewer's report is defective; re-dispatch with explicit instruction to treat the conflict as drift.

**On DRIFT_FOUND:**

STOP. Present the reviewer's findings to your human partner verbatim, then present the routing menu below with the reviewer's `RECOMMENDED_ACTION` highlighted. Do not merge, do not route, and do not take any other action until your human partner chooses from the menu.

### Routing menu

Present the routing menu. The available options depend on whether rebase was clean or conflicted:

**Case: clean rebase.** Present all 5 options:

```
Drift found. The reviewer recommends: <recommendation>.

How would you like to proceed?

1. Create a delta implementation plan addressing these issues
2. Update the spec to reflect the new state, then re-plan
3. Restart the brainstorming process from scratch
4. Override and merge anyway
5. Keep the branch as-is (I'll handle it later)
```

**Case: rebase conflict.** Present only options 2, 3, and 5:

```
Drift found (with rebase conflict). The reviewer recommends: <recommendation>.

How would you like to proceed?

2. Update the spec to reflect the new state, then re-plan
3. Restart the brainstorming process from scratch
5. Keep the branch as-is (I'll handle it later)

(Options 1 and 4 are not available when the rebase would conflict — a delta
plan can only be derived from a spec, and override-merge cannot safely
merge an unrebasable branch.)
```

Where `<recommendation>` is derived from the reviewer's `RECOMMENDED_ACTION:` field:

- `delta_plan` → "option 1 (delta implementation plan)"
- `spec_update` → "option 2 (update the spec and re-plan)"
- `restart_brainstorming` → "option 3 (restart brainstorming)"

**Do not add your own recommendation.** Use only the reviewer's `RECOMMENDED_ACTION:` value. If the reviewer did not include a `RECOMMENDED_ACTION:` line, the reviewer's report is incomplete — re-dispatch the reviewer asking for the structured recommendation before presenting the menu.

### Acting on your human partner's choice

**Option 1 — delta implementation plan** (only available with clean rebase):
Invoke `superpowers:writing-plans`. Provide it with:
- The current spec path(s)
- The drift findings verbatim
- `base_branch` (from the spec header)
- `base_revision` = `git rev-parse "$BASE_BRANCH"` (the current HEAD of the base branch, which is also the new branch point after rebase)
- Context: this is a delta plan addressing known drift issues on the base branch, not a fresh feature plan. The feature branch has been rebased onto the current base.

**Option 2 — update the spec and re-plan:**
Invoke `superpowers:brainstorming` focused on updating the existing spec. Provide it with:
- The current spec path(s)
- The drift findings verbatim
- `base_branch` (unchanged; inherited)
- `base_revision` = `git rev-parse "$BASE_BRANCH"` (the current HEAD at the moment of routing — drift up to this point will be absorbed by the updated spec, so the new base revision is "now")
- **If rebase had conflicts:** the conflict files and regions as additional context, plus this instruction: "The rebase from this feature branch onto `<base_branch>` fails because of conflicts in `<files>`. Your updated spec must describe how each conflict should be resolved (which side should win, or how the two sides should be combined). Where the resolution is ambiguous, ask your human partner clarifying questions. The implementation plan derived from your spec will include rebase + conflict resolution as early tasks."
- Standard instruction: "The spec is partially invalidated by drift on the base branch. Review the findings against the current codebase and update the spec accordingly. Where the drift creates ambiguity about what to build — multiple plausible ways to accommodate the new base branch state — ask your human partner clarifying questions using the same approach as initial brainstorming (one question at a time, prefer multiple choice, focus on purpose and constraints). Do not unilaterally choose among ambiguous options."
- Context: after the spec is updated, route to `superpowers:writing-plans` for a fresh implementation plan. The plan is derived from the spec — the spec itself must fully describe any needed rebase and conflict resolution work.

Brainstorming will use the provided `base_branch` and `base_revision` values verbatim and skip its own detection logic. When updating the spec header, it will preserve the original "created at" revision and add/update the "later updated to reflect" clause with the new `base_revision`.

**Option 3 — restart brainstorming:**
Invoke `superpowers:brainstorming` from the beginning. Provide:
- `base_branch` (inherited)
- `base_revision` = `git rev-parse "$BASE_BRANCH"` (current HEAD)
- **If rebase had conflicts:** the conflict files and regions, plus the same conflict-resolution instruction as Option 2
- Context: "The base branch has drifted significantly since this session started. The previous spec and plan should be reviewed but not assumed valid. Start from scratch."
- The drift findings as reference material

Brainstorming will write a new spec file with a fresh `**Base revision:**` header using the provided values.

**Option 4 — override and merge anyway** (only available with clean rebase):
Continue to Step 3 (Present Options) and proceed as if NO_DRIFT had been reported. Your human partner has seen the findings and made an informed choice; do not ask for extra confirmation. The branch has already been rebased (in Step 2.5.B), so the merge in Step 4 will be clean.

**Option 5 — keep as-is:**
Report: "Keeping branch as-is with drift unresolved. Resume by invoking finishing-a-development-branch after addressing the drift." Do not clean up. Exit the skill.

### Step 3: Present Options

Present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 4: Execute Choice

#### Option 1: Merge Locally

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <feature-branch>
```

Then: Cleanup worktree (Step 5)

#### Option 2: Push and Create PR

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Cleanup worktree (Step 5)

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 5)

### Step 5: Cleanup Worktree

**For Options 1, 2, 4:**

Check if in worktree:
```bash
git worktree list | grep $(git branch --show-current)
```

If yes:
```bash
git worktree remove <worktree-path>
```

**For Option 3:** Keep worktree.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | ✓ | - | - | ✓ |
| 2. Create PR | - | ✓ | ✓ | - |
| 3. Keep as-is | - | - | ✓ | - |
| 4. Discard | - | - | - | ✓ (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Skipping drift detection because tests pass**
- **Problem:** A clean compile and a clean rebase do not prove the merge is meaningful. The base branch may have changed in ways that invalidate the spec, duplicate the work, or reference deleted files. Tests pass, the merge looks fine, the result is wrong.
- **Fix:** Always run Step 2.5 when a base revision is found in the spec header. Always dispatch the drift reviewer when the rebase produces changes or conflicts. Do not evaluate drift inline.

**Running drift evaluation on the current session model**
- **Problem:** Drift evaluation is a judgment task. The current session may be running on a fast/cheap model that cannot reliably catch semantic drift. Inline evaluation produces false confidence.
- **Fix:** Dispatch the reviewer subagent with the most capable available model. Do not skip the dispatch.

**Reviewer returning NO_DRIFT after minimal investigation**
- **Problem:** A reviewer that returns `NO_DRIFT` after a single tool call and a one-sentence rationale on a non-trivial diff has not actually done the check. Quick judgment calls miss documentation drift, stale references, and semantic invalidations that don't break the build.
- **Fix:** If the reviewer's report is suspiciously brief relative to the diff size, do not act on it. Re-dispatch the reviewer with explicit instruction to walk through each file referenced by the spec and verify it against the base branch.

**Presenting drift findings without routing options**
- **Problem:** Presenting drift findings followed by an open-ended "How would you like to proceed?" leaves the human with a list of problems and no path forward. The human has to figure out which other superpowers skills apply to each kind of drift — even though the skill has exactly that information available.
- **Fix:** Always present the routing menu after drift findings. Highlight the reviewer's `RECOMMENDED_ACTION` but let the human choose.

**Skipping rebase because drift detection passed**
- **Problem:** The drift reviewer says the spec is content-consistent with the current base branch state, but the feature branch's git ancestry still diverges from the base. A subsequent merge will fail or silently revert base-branch changes.
- **Fix:** Always perform the actual rebase in Step 2.5.B when the pre-check reports a clean rebase. Do not rely on content equivalence to stand in for ancestry alignment.

**Presenting option 1 or 4 when the rebase would conflict**
- **Problem:** A delta plan can only be derived from a spec (writing-plans doesn't do side-channel rebases), and override-merge cannot cleanly merge an unrebasable branch. Offering these options in the conflict case produces incoherent outcomes.
- **Fix:** In the rebase-conflict case, suppress options 1 and 4 from the routing menu. Only options 2, 3, and 5 are available.

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Automatic worktree cleanup**
- **Problem:** Remove worktree when might need it (Option 2, 3)
- **Fix:** Only cleanup for Options 1 and 4

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- **Skip Step 2.5 (drift detection) because tests pass or the rebase is clean**
- **Evaluate drift inline instead of dispatching the reviewer subagent**
- **Use a fast/cheap model for the drift reviewer dispatch**
- **Merge while the drift reviewer reports DRIFT_FOUND and your human partner has not confirmed how to proceed**
- **Present drift findings without the routing menu — the human needs concrete options, not an open-ended question**
- **Add your own action recommendation — use only the reviewer's `RECOMMENDED_ACTION:` field**
- **Skip the actual rebase in Step 2.5.B when the pre-check reports clean**
- **Offer options 1 (delta plan) or 4 (override merge) when the rebase would conflict**
- **Rebase the feature branch when the pre-check reports conflicts — let the routed fix flow handle resolution via spec design**
- Delete work without confirmation
- Force-push without explicit request

**Always:**
- Verify tests before offering options
- Run Step 2.5 before presenting options, whenever the spec has a base revision header
- Read the base branch and revision from the spec header, not from guessed commands
- Pre-check the rebase before actually rebasing or dispatching the reviewer
- Dispatch the drift reviewer with the most capable available model
- Present drift findings to your human partner verbatim and wait for their decision
- Advance the base revision to current base HEAD when routing to brainstorming or writing-plans (drift up to routing time is absorbed by the updated spec/plan)
- Present exactly 4 options
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **brainstorming** - Writes the `**Base revision:**` spec header that Step 2 reads
- **writing-plans** - Derives implementation plans from specs, including any rebase/conflict-resolution tasks the spec describes
- **using-git-worktrees** - Cleans up worktree created by that skill
