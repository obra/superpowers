---
description: "Cancel active research and get a progress report"
argument-hint: ""
allowed-tools: [Bash, Read, Think]
disable-model-invocation: true
---

# Cancel Research

This command cancels research started with `/research` (see `superpowers:research` skill).

## Current Research State

!`ls -la research/*/state.json 2>/dev/null || echo "No active research directories found"`

## Steps

1. **Find active research state:**

```bash
# Look for research directories with active state
ls -la research/*/state.json 2>/dev/null
```

2. **For each active research (phase != "DONE"):**

   a. Read the state.json to get current progress
   b. Read findings.json to count sources gathered
   c. Create a `.cancelled` marker file in the research directory:

   ```bash
   touch research/{slug}/.cancelled
   ```

3. **Report to user:**

   Show them what was in progress:
   - Topic being researched
   - Sources gathered vs target
   - Searches run
   - Iterations completed
   - Findings collected so far

4. **Inform about partial data:**

   Let them know:
   - The research directory still contains all gathered data
   - `findings.json` has all findings collected so far
   - They can resume by running `/research {topic}` again (it will detect existing state)
   - Or they can delete the directory to start fresh

## Example Output

```
Research cancelled: "AI Safety Governance"

Progress:
  Searches:     24
  Sources:      18/30 target (60%)
  Subagents:    8
  Iterations:   2
  Duration:     3m 45s
  Findings:     31

Partial data saved in: research/ai-safety-governance/

To resume: /research AI Safety Governance
To start fresh: rm -rf research/ai-safety-governance && /research AI Safety Governance
```

## If No Active Research

If there's no active research (no state.json files or all are phase="DONE"), inform the user:

```
No active research to cancel.

Recent completed research:
- research/ai-in-healthcare/report.md (completed)
- research/quantum-computing/report.md (completed)
```
