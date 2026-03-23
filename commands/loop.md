# Loop: Process GitHub Projects

Run the loop orchestrator to process issues through their GitHub Project stages non-blocking.

## Usage

```
/loop
/loop <flow>
```

**Arguments:**
- `<flow>` (optional) — Which flow to process: `bug`, `feature`, or `all` (default: all)

## Behavior

Reads `project-flows.json` from the consuming repo and processes all items in their respective GitHub Projects.

**Non-blocking:** All communication happens via GitHub issue comments. Never waits for terminal input. If an item needs human input, posts a question and moves to the next item.

**Reverse stage order:** Processes stages from the end backwards (Done first, Triage last) to free resources and complete downstream work first.

**Idempotent:** Checks for existing markers before dispatching. If a stage is already complete (marker exists), skips it.

## Process

1. **Validate configuration**
   - Verify `project-flows.json` exists
   - Verify GitHub auth is set up
   - Confirm projects exist and are accessible

2. **Query projects**
   - Fetch items from each configured GitHub Project
   - Group items by current stage
   - Organize by flow (bug and/or feature)

3. **Process stages in reverse order**
   - Start with Done (cleanup, PR creation)
   - Work backward through stages
   - For each item needing work: dispatch the stage's skill
   - Post result markers to GitHub issue

4. **Handle responses**
   - Success: post `exit_marker`
   - Needs input: post `question_marker`, move to next item
   - Failure: post `fail_marker`, move to next item
   - Resource limits: note in terminal summary, don't post to GitHub

5. **Output summary**
   - Terminal output with processing details
   - Counts: processed, ready, questioned, failed per stage
   - Any resource deferrals or blockers

## Examples

**Process all flows:**
```
/loop
```

**Process only bug fixes:**
```
/loop bug
```

**Process only features:**
```
/loop feature
```

## Output

**Terminal:**
```
Loop iteration complete:

Bug Fixes Project (project #11):
  Triage: 3 items (1 processing, 2 ready)
  Fix: 1 item (ready)
  Test: 2 items (2 passing)
  UserTest: 1 item (1 awaiting confirmation)
  Done: 0 items

Feature Development Project (project #12):
  Brainstorm: 1 item (1 question posted)
  Design Review: 1 item (ready)
  Plan: 1 item (ready)
  Implement: 0 items
  Review: 0 items
  Done: 0 items

Summary:
- Items processed this iteration: 10
- Items awaiting handler input: 1
- Items awaiting promotion: 5
- Failed items: 0

Next: Handler responds to questions, promotes items to next stage. Re-run /loop to continue.
```

**GitHub Issues:**
Each item gets comments posted with markers:
- `[TRIAGE_READY]` when triage completes
- `[DESIGN_QUESTION]` when brainstorming needs input
- `[TEST_PASS]` when gates pass
- `[UAT_ACCEPTED]` when UAT is confirmed
- `[PR_CREATED]` when done
- Etc.

## Prerequisites

- `project-flows.json` exists in `.claude/` directory
- GitHub CLI (`gh`) is installed and authenticated
- Projects exist in GitHub (created by `/setup`)
- Handler has created issues and added them to projects

## Integration

**Invokes:**
- **superpowers:loop-orchestrator** skill — does all the work

**Configuration:**
- Reads `project-flows.json` for flow definitions, stages, and project numbers

**Communication:**
- Posts all results to GitHub issue comments (see `handler-authority`)
- Handler responds via issue comments

## Error Handling

**Configuration errors:**
- `project-flows.json` missing → Stop, report error, suggest `/setup`
- GitHub auth failed → Stop, suggest `gh auth login`
- Project doesn't exist → Stop, report which project number is invalid

**Processing errors:**
- Item has no linked issue → Skip item, note in summary
- `gh` command fails → Log error, continue with other items
- Skill dispatch fails → Post fail marker, move to next item

**Resource limits:**
- Token budget exceeded → Finish current item, note in terminal summary (not on GitHub)
- Session time limit → Finish current item, note in terminal summary
- Too many concurrent items → Process subset, note deferrals in terminal summary

## Tips

**Run regularly:**
- Schedule with `/loop` command on a cron job or timer
- Or run manually after creating issues: `/loop`

**Monitor progress:**
- Check terminal output for processing counts
- Check GitHub issues for status markers

**Unblock stuck items:**
- Look for items with `[TRIAGE_QUESTION]`, `[PLAN_QUESTION]`, `[DESIGN_QUESTION]` markers
- Handler responds as a comment on the issue
- Re-run `/loop` to process the response

**Debug a specific item:**
- Run `/loop bug` or `/loop feature` to process just that flow
- Check the loop summary for which item was processed

## Performance

- First run processes all projects and items: ~5-10 items per minute depending on complexity
- Subsequent runs only process new/changed items (idempotency check)
- Parallel hypothesis testing during triage can process multiple hypotheses concurrently

## Next Steps After Loop Runs

1. **Handler reviews** issue comments for `[TRIAGE_QUESTION]`, `[DESIGN_QUESTION]`, etc.
2. **Handler responds** as a comment on the issue with the requested information
3. **Handler promotes** items to the next stage in the GitHub Project by changing the Status field
4. **Handler runs** `/loop` again to process promoted items
5. Repeat until all issues reach Done

The loop is asynchronous and non-blocking — it never waits for handler input, it just posts questions and moves on.
