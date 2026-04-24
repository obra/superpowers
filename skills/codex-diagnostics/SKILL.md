---
name: codex-diagnostics
description: Examine the sspower Codex bridge log at ~/.claude/sspower-codex.log to diagnose bridge/hook failures, spot recurring patterns, and propose targeted patches. Trigger when user says "examine codex log", "codex diagnostics", "why is codex failing", "why did enrich not work", "debug bridge", "check codex log", "codex errors", or invokes /codex-diagnostics.
user_invocable: true
allowed-tools: Bash, Read, Edit, Grep, AskUserQuestion
---

# Codex Diagnostics

The bridge + hook append errors/warnings to `~/.claude/sspower-codex.log`. This skill reads that log, groups patterns, and proposes concrete patches to `scripts/codex-bridge.mjs` or `hooks/prompt-submit`.

## Log format

One line per event:
```
2026-04-23T14:22:01Z [error] bridge.enrich kind="schema_parse_fail" session="..." raw_preview="..."
2026-04-23T14:22:33Z [warn]  hook.enrich kind=timeout dur=31s cwd=/Users/...
2026-04-23T14:22:50Z [info]  hook.enrich kind=enriched dur=18s cwd=/...
```

Fields after source are space-separated `key="value"` pairs. Sources seen:
- `bridge.die` — fatal bridge errors (die() path)
- `bridge.<subcommand>` — runtime errors from implement/review/enrich/etc.
- `bridge.auto_commit` — auto-commit failures
- `hook.enrich` — hook-side enrichment outcomes (enriched/timeout/bridge_failed/passthrough_empty)

## Procedure

### 1. Read + summarize

```bash
LOG="$HOME/.claude/sspower-codex.log"
[ -f "$LOG" ] || { echo "no log yet — no errors seen"; exit 0; }

# total counts by kind
grep -oE '\[(error|warn|info)\]' "$LOG" | sort | uniq -c

# last 50 lines for recency
tail -50 "$LOG"

# top recurring kinds
grep -oE 'kind="?[a-z_]+' "$LOG" | sort | uniq -c | sort -rn | head -10
```

### 2. Match known patterns

| Pattern | Likely cause | Patch |
|---------|-------------|-------|
| `kind=timeout` repeated | Enrich slower than the cap (default 180s) | Raise `SSPOWER_ENRICH_TIMEOUT`, bump `SSPOWER_ENRICH_MAX_CHARS` so more prompts skip, or set `SSPOWER_ENRICH=0` for that repo |
| `kind=schema_parse_fail` | Codex returned non-JSON despite schema | Check Codex CLI version; schema-to-model mismatch; add fallback extraction |
| `kind=bridge_failed rc=1` | Codex CLI error (auth, trust) | Run `node scripts/codex-bridge.mjs setup` — check auth + trusted dir |
| `kind=empty_output_fallback` | Enrich prompt too weak, Codex returned nothing | Tighten `cmdEnrich` wrap, bump effort |
| `kind=missing_enriched_markers` | Codex ignored the `<ENRICHED>` marker instruction | Strengthen instruction or extract differently |
| `kind=passthrough_empty` (hook) | Bridge returned but output was empty or same as input | Same as above; often chain of `missing_enriched_markers` |
| `bridge.die msg="codex CLI not found"` | CLI missing | `npm install -g @openai/codex` |
| `bridge.die msg="Not inside a trusted directory"` | cwd outside git repo | Skill caller must pass `--cd <repo>` |
| `bridge.auto_commit kind="commit_failed"` | Worktree state issue, pre-commit hook failure | Inspect repo; fix pre-commit |

### 3. Propose patch

Before editing, confirm:
1. Show user the pattern + count
2. Show the proposed file + line change
3. Ask via `AskUserQuestion` if unsure which tradeoff (e.g. raise timeout vs lower effort)

### 4. Apply + verify

After edit:
```bash
node --check scripts/codex-bridge.mjs
bash -n hooks/prompt-submit
```

Then clear relevant log entries so next run shows fresh data:
```bash
# Keep archive, start fresh
cp "$LOG" "$LOG.bak.$(date +%s)"
: > "$LOG"
```

### 5. Report

Give terse summary:
- N errors + M warnings seen (by kind)
- Top pattern → proposed fix → applied Y/N
- Next step: user restart session to reload hook, or re-run SDD to re-verify

## Invocation examples

- "examine codex log" → run full procedure
- "why is enrich slow?" → filter `grep timeout "$LOG"` + show duration distribution
- "show last codex errors" → `tail -20 "$LOG" | grep error`
- "clear codex log" → backup + truncate after confirmation

## Safety

- Never delete log without backup.
- Patches to bridge/hook require user approval before commit.
- If log doesn't exist yet, report "no events logged" — don't fabricate.
- Log entries >30 days old likely stale; prefer recent 100 lines for pattern analysis.
