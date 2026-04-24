# Session Handoff
> Generated: 2026-04-23

## Task
Codex bridge observability + per-prompt enrichment — phase 1 & 2 shipped.

## Status
### Completed (pushed through `21e90be` on `main`)
- `scripts/codex-bridge.mjs`:
  - `renderEvent()` covers all Codex JSONL event types → tagged stderr (`[codex:agent|think|tool|result|edit|exec|token|error|session|alive|done]`)
  - Line-buffered JSONL parser emits `[codex:session] <id>` at first sight
  - Trace counters (`tool_calls`, `edits`, `execs`, `errors`, `tokens`, `duration_ms`)
  - 30s-silence heartbeat ticker (`setInterval`, cleared on close/error)
  - `_meta` envelope on stdout JSON; `_commit`/`_branch`/`_worktree` kept top-level for SDD eval back-compat
  - New `enrich` subcommand: read-only repo scan, wraps prompt, extracts `<ENRICHED>…</ENRICHED>`, fail-open
- `hooks/prompt-submit`:
  - Reads stdin JSON (`prompt`, `cwd`) via jq → python3 → sed cascade
  - Gate: skips `SSPOWER_ENRICH=0`, <20 chars, slash cmds, `raw:`/`noenrich:` prefixes, pure-read verbs, prompts lacking coding-intent keywords
  - Portable timeout (gtimeout → timeout → perl alarm), 30s cap, `--effort minimal`
  - bash 3.2 compat (`tr` for lowercase, no `${VAR,,}`) — macOS default bash
  - Appends enriched block to existing skill-routing reminder
- Live-verified: setup, review (18.7s), enrich (140s default, produced real file paths + line numbers), heartbeat firing at 30/60/90/120s

### Post-handoff additions
- `fe8f352` added diagnostics log (`~/.claude/sspower-codex.log`) w/ error+warn+info events from bridge & hook
- New skill `skills/codex-diagnostics/SKILL.md` — reads log, groups patterns, proposes patches
- README: added "Codex Observability" section, bumped skill count to 17
- **Event-stream gap fixed** (addresses Resume item 4):
  - `scripts/codex-bridge.mjs`: pass `--json` to both `codex exec` and `codex exec resume` (CLI v0.124.0 requires the flag to emit JSONL to stdout)
  - Updated `renderEvent()` for v0.124.0 shape: `thread.started` (thread_id), `item.started|completed` (unwraps nested `item.type`: `agent_message`, `reasoning`, `command_execution` (with exit_code + aggregated_output), `file_change`/`patch_apply`, `error`), `turn.completed` (usage w/ `input_tokens`/`output_tokens`/`cached_input_tokens`)
  - Session-id capture now recognizes `event.thread_id` in both the streaming parser and `extractSessionId()` fallback
  - Token counter in `_spawnAndCapture` handles `input_tokens`/`output_tokens` schema
  - Live smoke: real tokens populated (`in=12163 out=60 total=12223 cached=2432`), `_meta.session_id` now set, duration ~6s on trivial review

### In Progress
None. Clean tree. Untracked worktree dirs (`skills/codex-enrich-workspace/`, `subagent-driven-development-workspace/`) unrelated to this commit.

## Resume Here
1. **Restart Claude Code session** — UserPromptSubmit hook loads at session start, current session still runs old hook
2. Try real coding-intent prompt ("fix auth bug in X") → confirm enrichment block appears in context, latency acceptable
3. If latency painful: consider caching enrichment per-cwd for N seconds, or lower `--effort` further, or skip enrichment when prompt already >N tokens
4. ~~Investigate event-stream gap~~ — **done** (see Post-handoff additions). Streaming now live on v0.124.0. If Codex bumps schema again, `codex-diagnostics` skill + `[codex:event] item.<unknown>` fallback will surface drift.

## Decisions
- **No log folder** (`.codex-runs/` rejected): user dislikes extra dirs. Rely on stderr streaming only. If background mode ever needed → revisit w/ `~/.claude/codex-runs/`.
- **Dual-write `_commit`/`_branch`/`_worktree`**: top-level + `_meta.*`. Back-compat for `skills/subagent-driven-development/evals/evals.json` which still checks top-level.
- **Fail-open everywhere**: hook never blocks prompt; bridge error → raw passthrough + stderr warning.
- **Gate enrichment, don't enrich every prompt**: trivia/slash-cmd/meta prompts skipped. Coding-intent keyword required.
- **Phase 2 scope cut**: skipped `--background` mode, `status`/`watch` subcommands, persistent log. YAGNI until real need.

## Gotchas
- **macOS lacks `timeout`**: hook cascades to `gtimeout` (brew coreutils) → `timeout` → `perl alarm`. If none work enrichment silently fails → pass-through.
- **Heartbeat can show `last: start` for whole run**: Codex CLI v0.123.0 apparently buffers stdout events, emitting only final payload. Streaming tags work when Codex emits; this version emits rarely.
- **Hook doesn't activate mid-session**: UserPromptSubmit hooks load once at session start.
- **Enrichment adds 20-140s latency per coding prompt**: monitor real-world use, may need aggressive gating or cache.
- **Token counts land as `null`**: Codex event shape for usage may differ from parser assumptions. No crash, just missing metric.

## Context
- **Branch**: `main`, pushed to `origin/main`
- **HEAD**: `fe8f352 feat: codex bridge diagnostics log + codex-diagnostics skill`
- **Prior**:
  - `21e90be fix: bash 3.2 compat in prompt-submit hook`
  - `6b59374 feat: codex bridge observability + prompt enrichment hook`
- **Tests**: none run (no bridge test suite exists); smoke verified live
- **Plugin root**: `/Users/sskys/.claude/plugins/marketplaces/sskys18/plugins/sspower`
