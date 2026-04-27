# sspower

A complete software development workflow for Claude Code. Fork of [Superpowers](https://github.com/obra/superpowers) v5.0.5, customized with native Codex integration and macOS-first design.

**22 composable skills** that automatically trigger during your workflow — mandatory workflows, not suggestions. The agent checks for relevant skills before every task.

## What's new in 1.1

- **Diet mode** — terse-output mode for token efficiency. SessionStart hook activates `full` by default; `/diet lite|full|ultra|off` toggles intensity. Per-turn reinforcement keeps it from drifting. Three sub-skills: `/diet-commit`, `/diet-review`, `/compress-memory`.
- **Project wiki** — PreCompact + SessionEnd hooks archive each session as a structured JSON sidecar plus human-readable markdown summary into `<cwd>/.claude/wiki/sessions/`. Auto-seeds `decisions.md` + `gotchas.md` and appends a one-row index entry per session. Symlinked into `~/.claude/sessions/` for compatibility with cross-project tooling (e.g. daily-rollup skills).
- **Wired skills** — `brainstorming`, `writing-plans`, and `systematic-debugging` now read the project wiki before proposing work, so prior decisions and gotchas inform every new design and bug investigation.
- **Codex defaults** — `codex-bridge.mjs` defaults to `gpt-5.5` model with `xhigh` reasoning effort. Override per-call with `--model` / `--effort`.

## Installation

```bash
# Add the marketplace
/plugin marketplace add sskys18/sspower

# Install the plugin
/plugin install sspower@sspower
```

### Codex Integration (Optional)

sspower calls the Codex CLI directly for independent review and implementation — no external Claude Code plugin needed.

```bash
npm install -g @openai/codex
codex login
```

Without Codex, all skills work except `second-opinion`, Codex engine in SDD, and `codex-enrich`.

---

## The Complete Flow

```
                          USER REQUEST
                               |
                               v
                    +--------------------+
                    |   using-sspower    |  <-- meta router
                    |  "1% chance =      |      fires on every message
                    |   invoke skill"    |
                    +--------------------+
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
     +--------------+  +--------------+  +--------------+
     | brainstorming|  | systematic-  |  |    codex-    |
     |              |  |  debugging   |  |   enrich     |
     | ideas -->    |  | 4-phase      |  | validate     |
     | designs      |  | investigation|  | prompts via  |
     +--------------+  |      |       |  | Codex        |
              |        | Phase 4:     |  +--------------+
              v        | invoke TDD   |
     +--------------+  |      |       |
     | writing-     |  +------+-------+
     |   plans      |         |
     |              |         v
     | specs -->    |  +--------------+
     | task plans   |  | test-driven- |  <-- TDD fires here:
     +--------------+  | development  |      inside debugging (phase 4),
              |        | RED-GREEN-   |      inside SDD implementer,
              v        | REFACTOR     |      or standalone before
     +--------------------+ +--------+      any implementation
     | using-git-worktrees|
     |                    |
     | isolated branch    |
     +--------------------+
              |
              v
+----------------------------------+
|  EXECUTION (pick one)            |
|                                  |
|  +----------------------------+  |
|  | subagent-driven-development|  |   <-- recommended
|  |                            |  |
|  | Per task:                  |  |
|  |   Pick engine:             |  |
|  |   +--------+  +---------+ |  |
|  |   | Claude |  |  Codex  | |  |
|  |   |subagent|  |(bridge) | |  |
|  |   +--------+  +---------+ |  |
|  |        |           |      |  |
|  |        +-----+-----+     |  |
|  |              |            |  |
|  |              v            |  |
|  |     +----------------+   |  |
|  |     |  TDD embedded  |   |  |   <-- implementer follows
|  |     |  write test    |   |  |       RED-GREEN-REFACTOR
|  |     |  watch fail    |   |  |       when building code
|  |     |  make pass     |   |  |
|  |     +----------------+   |  |
|  |              |            |  |
|  |              v            |  |
|  |        Spec Review        |  |
|  |     (compliant? --->)     |  |
|  |              |            |  |
|  |              v            |  |
|  |      Quality Review       |  |
|  |     (approve? --->)       |  |
|  |              |            |  |
|  |        Next Task          |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  |     executing-plans        |  |   <-- simpler alternative
|  |  inline / subagent / Codex |  |
|  +----------------------------+  |
+----------------------------------+
              |
              v
+----------------------------------+
|  REVIEW CHAIN                    |
|                                  |
|  verification-before-completion  |
|  --> evidence before claims      |
|                                  |
|  requesting-code-review          |
|  --> Claude reviewer subagent    |
|                                  |
|  second-opinion  [HARD GATE]     |
|  --> independent Codex review    |
|                                  |
|  finishing-a-development-branch  |
|  --> merge / PR / keep / discard |
+----------------------------------+
```

---

## How SDD Works with Codex

Subagent-Driven Development dispatches a fresh agent per task. Two engines share the same structured JSON contracts:

```
Controller reads plan --> extracts tasks

  For each task:

  IMPLEMENT
  +------------------+     +-------------------+
  | Claude subagent  | OR  | Codex (bridge)    |
  | interactive Q&A  |     | --output-schema   |
  | native JSON      |     | --worktree        |
  +------------------+     | --auto-commit     |
         |                 +-------------------+
         |                        |
         +----------+-------------+
                    |
                    v
            { status: "DONE",
              files_changed: [...],
              tests: { passed: 5 },
              _commit: "abc123",
              _branch: "codex/task-1",
              _meta: { session_id, duration_ms,
                       tool_calls, edits, tokens } }
                    |
  SPEC REVIEW       v
  +----------------------------------+
  | "Does it match the spec?"        |
  | Reads actual code, not report    |
  | Returns: compliant / non-compliant
  | --> fix loop via resume if needed|
  +----------------------------------+
                    |
  QUALITY REVIEW    v
  +----------------------------------+
  | "Is it well-built?"              |
  | Architecture, tests, security    |
  | Returns: approve / needs-attention
  | --> fix loop via resume if needed|
  +----------------------------------+
                    |
                    v
              Next task
```

### Engine Selection

| Task | Engine | Why |
|------|--------|-----|
| Simple, 1-2 files | Claude subagent | Fast, can ask questions mid-task |
| Complex, unfamiliar code | Codex | Different model, full repo scan |
| Needs mid-task Q&A | Claude subagent | Interactive dialogue |
| User requests Codex | Codex | Respect preference |

### Fix Loops

When a review fails, the controller resumes the implementer's Codex session — Codex remembers everything it built:

```
implement --> session A (persisted)
spec-review --> session B (ephemeral)
  non-compliant!
resume --session-id A --> Codex fixes with full context
spec-review --> compliant
```

---

## 5 Review Gates Before Merge

| # | Gate | Who | When |
|---|------|-----|------|
| 1 | Self-review | Implementer | Per task |
| 2 | Spec compliance | Claude or Codex | Per task |
| 3 | Code quality | Claude or Codex | Per task |
| 4 | Final review | Claude code-reviewer | All tasks |
| 5 | Second opinion | Codex (independent) | Before merge |

---

## All 22 Skills

| Skill | Category | What it does |
|-------|----------|-------------|
| `using-sspower` | Meta | Routes to relevant skills (1% rule) |
| `brainstorming` | Design | Ideas through collaborative design |
| `writing-plans` | Planning | Specs into implementation plans |
| `subagent-driven-development` | Execution | Per-task subagents with dual-engine (Claude + Codex) |
| `executing-plans` | Execution | Simpler inline/subagent/Codex execution |
| `test-driven-development` | Testing | RED-GREEN-REFACTOR cycle |
| `systematic-debugging` | Debugging | 4-phase root cause investigation |
| `dispatching-parallel-agents` | Collaboration | Concurrent independent work |
| `requesting-code-review` | Review | Dispatch reviewer subagent |
| `receiving-code-review` | Review | Handle feedback with technical rigor |
| `second-opinion` | Review | Independent Codex review (hard gate) |
| `verification-before-completion` | QA | Evidence before claims |
| `using-git-worktrees` | Workflow | Isolated workspace setup |
| `finishing-a-development-branch` | Workflow | Merge/PR/keep/discard + cleanup |
| `codex-enrich` | Codex | Validate prompts via Codex repo scan |
| `codex-diagnostics` | Codex | Examine bridge log, propose patches for recurring errors |
| `writing-skills` | Meta | TDD for skill development |
| `diet` | Output | Terse-mode toggle (`/diet lite\|full\|ultra\|off`) |
| `diet-commit` | Output | One-shot terse commit-message generator |
| `diet-review` | Output | One-shot terse PR-review comments |
| `compress-memory` | Output | Compress CLAUDE.md / preferences into terse format |
| `codex-enrich-workspace` | Codex | Codex-assisted workspace enrichment |

---

## Codex Observability

The bridge + hook write errors and warnings to a single log file:

```
~/.claude/sspower-codex.log
```

One line per event, append-only, rotated at 1000 lines (keeps last 500).

**Format**:
```
2026-04-23T14:22:01Z [error] bridge.enrich kind="schema_parse_fail" session="..." raw_preview="..."
2026-04-23T14:22:33Z [warn]  hook.enrich kind=timeout dur=31s cwd=/Users/...
2026-04-23T14:22:50Z [info]  hook.enrich kind=enriched dur=18s cwd=/...
```

**Sources**:
- `bridge.die` — fatal bridge errors (missing flag, codex CLI not found, trust issues)
- `bridge.<subcommand>` — runtime errors from implement/review/enrich/rescue/resume
- `bridge.auto_commit` — worktree commit failures
- `hook.enrich` — hook-side outcomes (`enriched` / `timeout` / `bridge_failed` / `passthrough_empty`)

**Live event stream** (during runs, stderr):
- `[codex:session]` / `[codex:agent]` / `[codex:think]` / `[codex:tool]` / `[codex:result]` / `[codex:exec]` / `[codex:edit]` / `[codex:token]` / `[codex:error]` / `[codex:alive]` (30s heartbeat) / `[codex:done]` / `[codex:event]` (unknown/schema-drift)
- Requires `codex exec --json`; bridge passes this automatically on CLI v0.124+. Output-delta streams render but don't inflate counters; `patch_apply_end (failed)` renders for visibility but doesn't count as an applied edit.

**Final envelope** (structured JSON, `_meta`):
```json
{
  "status": "DONE",
  "files_changed": [...],
  "tests": {...},
  "_commit": "abc123",
  "_branch": "codex/task-1",
  "_meta": {
    "session_id": "...",
    "duration_ms": 47823,
    "tool_calls": 12,
    "edits": 3,
    "errors": 0,
    "tokens": { "input": 45230, "output": 8910, "total": 54140 }
  }
}
```

**Diagnose**: say "examine codex log" or invoke the `codex-diagnostics` skill — it groups errors, matches known patterns, and proposes patches.

**Enrichment knobs** (read by `hooks/prompt-submit`):
- `SSPOWER_ENRICH=0` — disable per-prompt enrichment entirely
- `SSPOWER_ENRICH_TIMEOUT=<seconds>` — default `180`; large repos (≈200k input tokens) run ~120-150s under `--effort minimal`
- `SSPOWER_ENRICH_MAX_CHARS=<n>` — default `2000`; prompts longer than this skip enrichment (assumed already context-rich)
- Opt out one prompt: prefix with `raw:` or `noenrich:`
- Non-numeric or octal-looking values (`abc`, `08`) fall back to defaults — hook never breaks prompt submission

---

## Architecture

```
sspower/
  scripts/codex-bridge.mjs    -- Direct Codex CLI bridge
  schemas/                     -- Structured output contracts
    implementation-output.json
    spec-review-output.json
    quality-review-output.json
  agents/
    code-reviewer.md           -- Claude review subagent
    codex-rescue.md            -- Codex delegation subagent
  hooks/
    session-start              -- Injects using-sspower context
    prompt-submit              -- Skill reminder + Codex enrichment (gated)
  skills/                      -- 16 skill directories
    */SKILL.md                 -- Lean entry point (<100 lines)
    */references/              -- Detailed docs (loaded on demand)
```

### Token-Efficient Progressive Disclosure

| Skill | Upstream | sspower SKILL.md | sspower references/ |
|-------|----------|------------------|---------------------|
| writing-skills | 647 lines | ~50 lines | 3 files (344 lines) |
| test-driven-development | 313 lines | ~50 lines | 1 file (74 lines) |
| systematic-debugging | 263 lines | ~50 lines | 2 files (227 lines) |
| subagent-driven-development | 279 lines | ~160 lines | 3 files (250 lines) |

---

## Credits

Original [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://blog.fsck.com) and [Prime Radiant](https://primeradiant.com).

## License

MIT — see LICENSE file
