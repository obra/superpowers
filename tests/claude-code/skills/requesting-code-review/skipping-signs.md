# Signs of Skipping: requesting-code-review

## Red Flags (Critical Violations)

### Incomplete Reviewer Dispatch
- Fewer than 4 reviewers dispatched
- Only security or only performance reviewed
- "I'll just do a quick review" without all 4 agents
- Manual review instead of dispatching agents

### Missing Context Gate
- No BASE_SHA captured
- No HEAD_SHA captured
- No git diff generated
- "I can see the changes" without git commands

### Poor Handoff Consumption
- Synthesis doesn't cite all 4 reviewer outputs
- Findings summarized without quotes from reviewers
- "The reviewers found some issues..." without specifics
- Any reviewer's findings silently dropped
- Severity not traced to which reviewer flagged it

### Missing Synthesis Structure
- Findings not grouped by severity (Critical/Warning/Suggestion)
- No unified checklist presented
- Flat list without prioritization
- No attribution to source reviewer

### Skipped Review Steps
- No docs/solutions/ check for known fixes
- Review findings not presented to user
- Skipped waiting for all agents to complete

## Rationalization Patterns to Watch

| Pattern | What They Say | What They Should Do |
|---------|---------------|---------------------|
| "Quick review" | "Let me just do a quick review" | Dispatch all 4 specialized agents |
| "Obvious code" | "This is simple, no need for full review" | Still dispatch all 4 agents |
| "Similar findings" | "Reviewers found similar things" | Quote each reviewer separately |
| "Main issues" | "The main issues are..." | Include ALL findings from ALL reviewers |
| "I'll summarize" | "Let me summarize what they found" | Quote specific findings, don't summarize |

## Evidence Requirements

For a PASS verdict, the session MUST show:
1. Git commands executed for BASE_SHA and HEAD_SHA
2. Git diff generated
3. 4 parallel Task tool calls (one per reviewer)
4. Each reviewer's output quoted in synthesis
5. Findings grouped as Critical/Warning/Suggestion
