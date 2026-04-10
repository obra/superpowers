# Codex Integration for SDD

## Overview

SDD can use Codex (OpenAI) as an implementation and review engine alongside Claude subagents. The controller picks the best engine per task — they share the same structured contracts so the SDD pipeline works identically regardless of which engine executed the work.

## The Bridge

`scripts/codex-bridge.mjs` calls `codex exec` directly with `--output-schema` to enforce structured JSON responses. No dependency on the separate `openai-codex` Claude Code plugin.

### Subcommands

| Command | Schema enforced | Sandbox | Use for |
|---------|----------------|---------|---------|
| `implement` | `implementation-output.json` | `workspace-write` | Task implementation |
| `spec-review` | `spec-review-output.json` | `read-only` | Spec compliance verification |
| `review` | `quality-review-output.json` | `read-only` | Code quality review |
| `rescue` | none (free-form) | configurable | Open-ended investigation |
| `resume` | none (free-form) | configurable | Continue last Codex thread |
| `setup` | n/a | n/a | Verify Codex CLI + auth |

### Prompt delivery

Prompts can be passed as literal text or via file (`@/path/to/prompt.md`). For SDD, always use file-based prompts — they're too long for command-line arguments.

```bash
# Write prompt to temp file
echo "prompt content" > /tmp/sdd-task-3.md

# Dispatch
node "${PLUGIN_ROOT}/scripts/codex-bridge.mjs" implement \
  --write --cd /path/to/project \
  --prompt @/tmp/sdd-task-3.md
```

## Engine Selection Guide

| Task characteristic | Recommended engine | Rationale |
|---|---|---|
| Simple, 1-2 files, complete spec | Claude subagent (fast model) | Quick, cheap, can ask questions |
| Multi-file, well-specified | Claude subagent (standard) | Good balance, interactive |
| Complex / unfamiliar codebase | Codex | Different model perspective, full repo scan |
| Needs mid-task Q&A | Claude subagent | Codex is one-shot, can't ask questions |
| Architecture / design decisions | Claude (most capable) | Reasoning strength |
| User explicitly requests Codex | Codex | Respect user preference |

### Key differences between engines

| Aspect | Claude subagent | Codex |
|---|---|---|
| Mid-task questions | Yes (interactive) | No (one-shot, must front-load context) |
| Structured output | Native tool result | Enforced via `--output-schema` |
| Speed | Fast | Slower (CLI + API round-trip) |
| Model perspective | Same as controller (Claude) | Different (GPT-5.4) |
| Context per task | ~200K tokens | Full repo access |
| Resume for fixes | New subagent (fresh context) | `resume --session-id` (same thread, full context) |

## Thread Management & Fix Loops

### Session ID tracking

The bridge prints `[codex:session] <id>` to stderr during `implement` and `rescue --write` runs. **The controller must capture this ID** — it's needed to resume the correct thread after reviews.

Why: after implementation, the SDD flow runs spec review and quality review. These create their own Codex sessions. If you use `--last`, you'd resume the reviewer, not the implementer.

### Claude flow (existing)
```
Dispatch new subagent → review fails → dispatch NEW subagent with fix prompt
(Fresh context each time — controller provides all context)
```

### Codex flow (new)
```
codex-bridge.mjs implement → captures [codex:session] abc-123
  → spec review (separate session)
  → review fails
  → codex-bridge.mjs resume --session-id abc-123 --prompt "Fix: {issues}"
(Same implementer thread — Codex remembers what it built)
```

Codex's `resume` is a significant advantage for fix loops: the model retains full context of what it implemented, what files it touched, and what tests it ran. No need to re-provide all that context.

### Session persistence

- `implement` and `rescue --write` run **without** `--ephemeral` so sessions persist to disk for resume
- `spec-review`, `review`, and read-only `rescue` run **with** `--ephemeral` since they don't need resume
- This means only implementation sessions accumulate on disk — clean up via `codex` CLI if needed

### When resume fails

If `resume` errors (e.g. session expired, ID invalid), fall back to a fresh `implement` dispatch with the fix instructions appended to the original task prompt. The controller should include the original task text + review findings in the new prompt.

## Mixing Engines Per Task

The controller picks engine independently for each task. This is valid:

```
Task 1: Claude subagent (simple utility function)
Task 2: Codex (complex integration with unfamiliar API)
Task 3: Claude subagent (test additions)
Task 4: Codex (performance-critical algorithm)
```

Reviews can also mix: a Claude subagent's work can be reviewed by Codex, or vice versa. The structured contracts are identical.

## Parsing Codex Output

The bridge handles JSON parsing with fallbacks:
1. Direct JSON parse of the output file
2. Extract from markdown fenced code block (```json ... ```)
3. Extract first `{ ... }` from prose

If all parsing fails for a structured command (implement, spec-review, review), the bridge exits with code 1 and a JSON error object including the raw output. For free-form commands (rescue, resume), unparsed text is returned as-is.

## Error Handling

| Error | Controller action |
|---|---|
| Codex CLI not found | Run `codex-bridge.mjs setup`, suggest `npm install -g @openai/codex` |
| Auth failure | Run `codex login` |
| Schema validation error | Check schema against OpenAI requirements (all props required, no nullable types) |
| Timeout | Re-dispatch with `--effort medium` or break task into smaller pieces |
| Non-zero exit code | Bridge exits 1 with JSON error object — check `message` field for details |
| Parse failure (structured) | Bridge exits 1 with JSON error including raw output — fall back to fresh implement |
| Resume session not found | Session may have expired — fall back to fresh implement with combined task + fix prompt |

## Prerequisites

- `codex` CLI installed globally (`npm install -g @openai/codex`)
- Authenticated (`codex login`)
- Node.js 18+ (for ES modules in bridge script)
