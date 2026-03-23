# Loop Implementation Guide

This file provides the detailed logic for implementing `/loop`. The command is a thin wrapper that invokes the loop-orchestrator skill and collects results.

## Implementation Approach

The `/loop` command:

1. Parses optional flow argument (`bug`, `feature`, `all`)
2. Announces the start
3. Invokes the `loop-orchestrator` skill with the selected flow(s)
4. The skill does all the work (reading projects, dispatching skills, posting markers)
5. Command collects the skill's output and presents a summary

## Step-by-Step Implementation

### Initialization

1. Announce: "Starting loop orchestrator..."
2. Parse arguments:
   - `/loop` → `flows: ["bug", "feature"]`
   - `/loop bug` → `flows: ["bug"]`
   - `/loop feature` → `flows: ["feature"]`
   - `/loop all` → `flows: ["bug", "feature"]`
3. Validate argument (reject unrecognized values)

### Validation

Before invoking loop-orchestrator:

```bash
# Check project-flows.json exists
ls -la .claude/project-flows.json

# Check GitHub auth
gh auth status

# Quick project check (will fail gracefully if projects don't exist)
gh project list --owner <owner> --json number,title
```

If validation fails:
- Report specific error
- Suggest remediation (`/setup`, `gh auth login`, etc.)
- Stop, don't invoke skill

### Invoke Loop-Orchestrator Skill

Call the skill with:
- Flow selection (`bug`, `feature`, or both)
- Current repo context
- Path to `project-flows.json`

The skill returns:
- List of processed items (per flow, per stage)
- Status for each item (processed, questioned, failed, skipped, ready)
- Marker comments posted to GitHub issues
- Resource deferrals (tokens, time, etc.)

### Collect Results

Organize the skill's output into:

**Per flow, per stage:**
- Count of items processed
- Count of items awaiting input
- Count of items ready for next stage
- Count of failures

**Deferrals:**
- Items not processed due to resource limits
- Items not processed due to dependencies

**Markers posted:**
- URLs of issues that got comments
- Which markers were posted to each

### Present Summary

Output to terminal:

```
Loop Processing Summary
═══════════════════════════════════════════════════════════

Bug Fixes (Project #11)
  Triage:    3 items (1 processing, 2 ready)
  Fix:       1 item  (1 ready)
  Test:      2 items (2 PASS)
  UserTest:  1 item  (1 awaiting confirmation)
  Done:      0 items

Feature Development (Project #12)
  Brainstorm:      1 item (1 question posted)
  Design Review:   1 item (1 ready)
  Plan:            1 item (1 ready)
  Implement:       0 items
  Review:          0 items
  Done:            0 items

Summary
───────
Items processed this iteration:    10
Items with new markers posted:     3
Items awaiting handler input:      1
Items ready for next stage:        5
Failed items:                      0

Next steps:
1. Handler reviews GitHub issues for [QUESTION] markers
2. Handler responds as issue comments
3. Handler promotes items in the GitHub Project Status
4. Re-run /loop to process promoted items

Resource notes (terminal only):
- <None, if no deferrals>
- <Or: "Deferred 2 items due to token limit, will resume next iteration">
```

### Error Handling During Processing

If the skill encounters errors:

- **Recoverable errors** (API rate limit, single item issue): logged, continue
- **Configuration errors** (missing field, invalid project): report and stop
- **Skill dispatch failures** (skill crashes): post fail marker, continue

Command should present these as warnings in the summary, not halt.

### State Tracking

The command does NOT track state itself. The skill uses GitHub issue comments (markers) as the source of truth:
- `exit_marker` = stage complete
- `question_marker` = awaiting input
- `fail_marker` = failure

On subsequent runs, the skill checks these markers and skips already-completed items (idempotency).

## Pseudo-Code

```
function runLoop(flowArg) {
  // Parse
  flows = parseFlows(flowArg)  // -> ["bug"], ["feature"], or ["bug", "feature"]

  // Validate
  if not fileExists(".claude/project-flows.json"):
    error("project-flows.json not found. Run /setup first.")

  if not ghAuth():
    error("GitHub not authenticated. Run: gh auth login")

  // Load config
  config = loadJSON(".claude/project-flows.json")

  // Invoke skill
  result = invokeSkill(
    "loop-orchestrator",
    flows: flows,
    config: config,
    mode: "async"  // GitHub comments, no terminal input
  )

  // Collect results
  summary = {
    by_flow: {},
    by_stage: {},
    total_processed: 0,
    total_questioned: 0,
    total_failed: 0,
    total_ready: 0,
    deferrals: [],
    markers_posted: []
  }

  for flow in flows:
    for stage in config.flows[flow].stages:
      items = result[flow][stage]
      summary.by_flow[flow][stage] = {
        processed: count(items where status="PROCESSED"),
        ready: count(items where status="READY"),
        questioned: count(items where status="QUESTION_POSTED"),
        failed: count(items where status="FAILED"),
        skipped: count(items where status="SKIPPED")
      }

  // Compile deferrals
  if result.deferrals:
    summary.deferrals = result.deferrals

  // Present
  presentSummary(summary)

  return summary
}
```

## Integration Points

### Before Loop
- Handler creates issues in GitHub
- Handler adds issues to the bug or feature project
- Handler optionally assigns issues or adds labels

### During Loop
- Skill reads projects and dispatches stage skills
- Skills post markers and questions to GitHub issues
- Skills communicate with handler via issue comments

### After Loop
- Handler reads GitHub issues for `[QUESTION]` markers
- Handler responds as issue comments
- Handler promotes items in GitHub Project (changes Status field)
- Handler runs `/loop` again

## Performance Considerations

- First run: 5-10 items per minute (depends on complexity and resource limits)
- Parallel hypothesis testing: multiple items can be investigated concurrently
- Idempotency: subsequent runs only process new/changed items
- Resource limits: token budget and session time deferred to next iteration

## Logging

Terminal output includes:
- `[INFO]` Processing started, flows selected, items found
- `[PROGRESS]` Items processed, markers posted
- `[WARNING]` Recoverable errors, resource deferrals
- `[ERROR]` Fatal errors, stop

GitHub issue comments:
- Markers (e.g., `[TRIAGE_READY]`, `[TEST_PASS]`)
- Questions (e.g., `[TRIAGE_QUESTION] What's the reproduction path?`)
- Summaries (skill-specific output)

## Future Enhancements

- Schedule loop with a cron job: `/loop --schedule "0 * * * *"` (every hour)
- Process specific issues: `/loop bug --issue 123`
- Dry-run mode: `/loop --dry-run` (show what would be processed, don't post)
- Concurrent processing: `/loop --parallel 3` (process 3 items in parallel)
