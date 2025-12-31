---
description: "Show superpowers skill usage statistics with frequency table and flow graph"
allowed-tools: [Bash]
---

# Skill Usage Statistics

Analyze skill usage data from `~/.claude/superpowers-analytics/events.jsonl`.

Use the jq patterns below as templates. Format output as readable ASCII tables matching the example output.

## Event Structure

Each line in `events.jsonl` is a JSON object:
```json
{"ts":"2025-12-31T10:30:00Z","session":"abc123","skill":"research","seq":1,"type":"skill"}
```

Fields:
- `ts` - ISO 8601 timestamp
- `session` - Session ID
- `skill` - Skill or subagent name
- `seq` - Sequence number within session
- `type` - "skill" or "subagent"

## Data Location

!`ls -la ~/.claude/superpowers-analytics/events.jsonl 2>/dev/null || echo "No analytics data found yet. Use some skills first!"`

## Analysis Steps

### 1. Check Dependencies and Data

```bash
# Verify jq is installed
command -v jq >/dev/null || { echo "Error: jq is required. Install with: brew install jq"; exit 1; }

# Check for analytics file
if [[ ! -f ~/.claude/superpowers-analytics/events.jsonl ]]; then
  echo "No analytics data found. Skills usage will be tracked after you use /skill commands."
  exit 0
fi

# Validate file has content
if [[ ! -s ~/.claude/superpowers-analytics/events.jsonl ]]; then
  echo "Analytics file is empty. Use some skills first!"
  exit 0
fi
```

### 2. Generate Frequency Table

Show skills ranked by total invocations with session count and recency:

```bash
jq -s '
  group_by(.skill) |
  map({
    skill: .[0].skill,
    count: length,
    sessions: ([.[].session] | unique | length),
    last_used: (sort_by(.ts) | last.ts)
  }) |
  sort_by(-.count)
' ~/.claude/superpowers-analytics/events.jsonl
```

**Time formatting**: Convert `last_used` timestamps to relative time:
- Less than 1 hour ago: "Xm ago"
- Less than 24 hours ago: "Xh ago"
- Less than 7 days ago: "Xd ago"
- Less than 4 weeks ago: "Xw ago"
- Otherwise: "YYYY-MM-DD"

Format as ASCII table:

```
Skill Usage (All Time)
───────────────────────────────────────────────────
Skill              Uses    Sessions    Last Used
───────────────────────────────────────────────────
research            47        12        2h ago
debugging           38        15        1d ago
tdd                 22         8        3d ago
brainstorming       15         6        1w ago
git-worktrees        3         2        2w ago
───────────────────────────────────────────────────
```

### 3. Generate Flow Graph

Calculate skill transitions (what skill follows what):

```bash
jq -s '
  # Sort by session then sequence
  sort_by([.session, .seq]) |
  # Create pairs of consecutive events in same session
  [range(length - 1) as $i |
    if .[$i].session == .[$i+1].session
    then {from: .[$i].skill, to: .[$i+1].skill}
    else empty end
  ] |
  # Group and count transitions
  group_by([.from, .to]) |
  map({from: .[0].from, to: .[0].to, count: length}) |
  sort_by(-.count)
' ~/.claude/superpowers-analytics/events.jsonl
```

Render as ASCII flow diagram showing the most common paths:

```
╭─────────────────────────────────────────────────────────────╮
│              Aggregate Skill Flow                           │
╰─────────────────────────────────────────────────────────────╯

  ╔═══════════╗
  ║  START    ║
  ╚═══════════╝
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  research   │────▶│  debugging  │
└─────────────┘     └─────────────┘
      (15)               │
                    (12) │
                         ▼
                  ┌─────────────┐
                  │    tdd      │
                  └─────────────┘

Legend: (N) = transition count
```

### 4. Summary Statistics

Calculate overall stats:

```bash
jq -s '
  {
    total_events: length,
    unique_skills: ([.[].skill] | unique | length),
    total_sessions: ([.[].session] | unique | length),
    skill_events: [.[] | select(.type == "skill")] | length,
    subagent_events: [.[] | select(.type == "subagent")] | length,
    date_range: {
      first: (sort_by(.ts) | first.ts),
      last: (sort_by(.ts) | last.ts)
    }
  }
' ~/.claude/superpowers-analytics/events.jsonl
```

### 5. Identify Unused Skills

List available superpowers skills that have never been invoked.

Compare the list of available skills (from the plugin's skills/ directory) against skills found in the analytics data. Report any skills with zero invocations.

```bash
# Get skills that appear in analytics
jq -rs '[.[].skill] | unique | .[]' ~/.claude/superpowers-analytics/events.jsonl
```

Cross-reference with available skills and report those never used.

## Example Output Format

```
╭────────────────────────────────────────────────────╮
│           Superpowers Skill Analytics              │
╰────────────────────────────────────────────────────╯

FREQUENCY TABLE
───────────────────────────────────────────────────
Skill              Uses    Sessions    Last Used
───────────────────────────────────────────────────
research            47        12        2h ago
debugging           38        15        1d ago
tdd                 22         8        3d ago
brainstorming       15         6        1w ago
───────────────────────────────────────────────────
Total: 122 skill invocations across 23 sessions

FLOW GRAPH (Top Transitions)
───────────────────────────────────────────────────
research ──(18)──▶ debugging
debugging ──(12)──▶ tdd
brainstorming ──(8)──▶ research
tdd ──(5)──▶ debugging
───────────────────────────────────────────────────

UNUSED SKILLS
───────────────────────────────────────────────────
  - code-review (never used)
  - test-planning (never used)
───────────────────────────────────────────────────
```
