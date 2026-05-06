# Drill: Superpowers Skill Compliance Benchmark

**Date:** 2026-04-07
**Ticket:** [PRI-1040](https://linear.app/prime-radiant/issue/PRI-1040)
**Status:** Design

## Thesis

The value of superpowers depends on whether skills are reliably followed by *any* coding agent — not just Claude Code. Drill tests whether agents actually fire skills, follow workflows, and use native tooling when available. It is a **compliance benchmark**, not a coding ability benchmark.

If a well-written skill produces consistent behavior across Claude Code and Codex, the agent-agnostic coordination layer is working. If agents diverge, Drill tells you exactly where and why.

## What Drill Tests

- Do agents invoke superpowers skills when they should?
- Do they follow multi-step workflows (detect → consent → create) in the right order?
- Do they use native tools (EnterWorktree, structured session logs) vs. raw shell commands?
- Where do agents diverge, and what does that tell us about skill format?

The first scenarios target **PRI-974 (worktree rototill)** — the area with the most cross-agent fragmentation today.

## Architecture

Three layers, each with a single responsibility:

```
┌─────────────────────────────────────────┐
│  CLI  (click)                           │
│  run / compare / list                   │
├─────────────────────────────────────────┤
│  Engine                                 │
│  ┌───────────┐ ┌───────┐ ┌──────────┐  │
│  │ Session   │ │ Actor │ │ Verifier │  │
│  │ (tmux)    │ │ (LLM) │ │ (LLM)   │  │
│  └───────────┘ └───────┘ └──────────┘  │
├─────────────────────────────────────────┤
│  Backends                               │
│  claude / codex / (future: gemini)      │
├─────────────────────────────────────────┤
│  Setup                                  │
│  template repo + helpers + assertions   │
└─────────────────────────────────────────┘
```

- **CLI** — `drill run <scenario> --backend claude`, `drill compare <scenario>`, `drill list`
- **Engine** — Orchestrates the full run lifecycle (setup → session → actor loop → collect → verify → results)
- **Session** — tmux lifecycle: create session, send-keys, capture-pane, kill session
- **Actor** — Sonnet with rolling context. Gets all scenario intents as a goal stack + terminal screens. Outputs what to type next, or `<<DONE>>`/`<<STUCK>>`.
- **Verifier** — Sonnet (near-zero temperature) with full session log + filesystem state + tool call log + criteria list. Returns per-criterion pass/fail with cited evidence + freeform observations.
- **Backends** — Each backend knows: CLI command, auto-approve flags, plugin loading, idle detection, shutdown command, session log location.
- **Setup** — Clone template repo → run backend pre_run hooks → run scenario helpers → run setup assertions → fail fast if invariants violated.

## Engine Flow

```
1. LOAD
   - Parse scenario YAML
   - Parse backend YAML
   - Validate required env vars (fail fast)

2. SETUP
   - Clone template repo to temp dir
   - Run backend pre_run hooks (codex symlink, etc.)
   - Run scenario setup helpers
   - Run setup assertions → abort if any fail

3. SESSION
   - Create tmux session (backend-specific terminal dimensions)
   - Launch agent CLI in tmux pane
   - Wait for startup ready pattern

4. ACTOR LOOP
   - For each turn (up to max_turns):
     a. Wait for idle (quiescence + ready pattern)
     b. Capture terminal pane → append to rolling context
     c. Send to Actor LLM: system prompt + rolling context + ALL intents + user_posture
     d. Actor responds with text to type, <<DONE>>, or <<STUCK>>
     e. If <<DONE>> or <<STUCK>> → break
     f. Send keystrokes via tmux send-keys
     g. Per-turn timeout → <<STUCK>> if exceeded
   - Special keys via <<KEY:name>> convention (e.g., <<KEY:ctrl-c>>)

5. COLLECT
   - Capture final terminal state
   - Send shutdown command (backend-specific: /exit, Ctrl-D, etc.)
   - Wait for process exit (with timeout)
   - Snapshot filesystem (file tree, git state, worktree list)
   - Collect backend session logs → tool_calls.jsonl
   - Kill tmux session (cleanup if process didn't exit cleanly)

6. VERIFY
   - Send to Verifier LLM: session.log + filesystem.json + tool_calls.jsonl + criteria
   - Verifier receives criteria but NOT actor intents (reduces confirmation bias)
   - Verifier returns per-criterion pass/fail with evidence + rationale + observations
   - Output as structured JSON (verdict.json)

7. RESULTS
   - Write to results/<scenario>/<backend>/<timestamp>/
   - Print summary to stdout
```

## Backend Abstraction

Each backend is a YAML config. Backends own: CLI invocation, idle detection, shutdown, session log collection, and pre/post-run hooks.

```yaml
# backends/claude.yaml
name: claude
cli: claude
args:
  - "--dangerously-skip-permissions"
  - "--plugin-dir"
  - "${SUPERPOWERS_ROOT}"
required_env:
  - ANTHROPIC_API_KEY
  - SUPERPOWERS_ROOT
hooks:
  pre_run: []    # no repo setup needed; plugin loaded via --plugin-dir
  post_run: []
shutdown: "/exit"
idle:
  quiescence_seconds: 3
  ready_pattern: "^❯|^\\$|Human:"
startup_timeout: 30
terminal:
  cols: 200
  rows: 50
session_logs:
  pattern: "~/.claude/projects/**/session-*.jsonl"
  match_by: timestamp
```

```yaml
# backends/codex.yaml
name: codex
cli: codex
args:
  - "--dangerously-bypass-approvals-and-sandbox"
required_env:
  - OPENAI_API_KEY
  - SUPERPOWERS_ROOT
hooks:
  pre_run:
    - symlink_superpowers   # creates .agents/skills/superpowers symlink in test repo
  post_run: []
shutdown: "<<KEY:ctrl-d>>"
idle:
  quiescence_seconds: 5
  ready_pattern: "codex>|^>"
startup_timeout: 30
terminal:
  cols: 200
  rows: 50
session_logs:
  pattern: "~/.codex/sessions/rollout-*.jsonl"
  match_by: timestamp
```

New backends = new YAML file. Backend variants (e.g., `codex-workspace-write.yaml`) are just copies with different args — no inheritance system needed. Scenarios reference backends by name.

## Scenario Format

Scenarios are YAML. They describe *what* to test, not *how* each backend works.

```yaml
scenario: worktree-creation-from-main
description: "Agent creates an isolated worktree from main branch"
user_posture: naive   # or spec-aware

setup:
  helpers:
    - create_base_repo
  assertions:
    - "git rev-parse --is-inside-work-tree"
    - "git branch --show-current | grep main"
    - "git worktree list | wc -l | grep 1"

turns:
  - intent: >
      Ask the agent to create an isolated workspace
      for building a login feature.
  - intent: "Confirm consent if the agent asks."

limits:
  max_turns: 20
  turn_timeout: 120   # seconds per turn

verify:
  criteria:
    - "Agent detected it was on main, not in an existing worktree"
    - "Agent asked for consent before creating the worktree"
    - "A worktree or isolated workspace now exists with a feature branch"
    - "Agent used the most appropriate tool available for its platform to create the worktree"
  observe: true   # verifier can add freeform observations
```

### User Posture

Each scenario has a `user_posture` field:

- **naive** — User describes what they want in plain language. Tests whether the agent's superpowers skills fire without hand-holding.
- **spec-aware** — User references specific skills or conventions by name. Tests whether the agent follows the spec when pointed at it.

The delta between naive and spec-aware results for the same scenario is the most interesting product signal. A small delta means strong conveyance. A large delta means the skill format needs work.

### Turn Intents

Intents are a **priority-ordered goal stack**, not a rigid script. The actor receives all intents and decides which one applies to the current terminal state. Some intents are conditional ("Confirm consent if the agent asks") and may never fire.

## Setup

### Template Repo

A real git repo checked into `fixtures/template-repo/`. Cloned to a temp directory per run. Covers the 80% common case.

Contents:
- `package.json` — minimal Node project metadata (name, version)
- `src/index.js` — simple entry point (~10 lines)
- `src/utils.js` — helper module (~10 lines)
- `README.md` — basic project description
- 3-4 commits on `main` with realistic messages (e.g., "initial commit", "add utils module", "update readme")
- No existing worktrees, branches, or tags beyond `main`

This is intentionally minimal — just enough for agents to recognize it as a real project. Scenario-specific state (extra branches, worktrees, detached HEAD) is added by setup helpers.

### Setup Helpers

Python functions in `setup_helpers/` that modify the cloned repo for specific scenarios:

- `create_base_repo(workdir)` — Clone template, verify structure
- `add_worktree(workdir, branch, path)` — Create an existing worktree (for "already inside" scenarios)
- `detach_head(workdir)` — Simulate Codex App detached HEAD state
- `symlink_superpowers(workdir)` — Create `.agents/skills/superpowers` symlink (codex pre_run hook)

### Setup Assertions

Run after all setup completes, before the agent launches. If any fail, the scenario aborts with a clear "setup invariant violated" error — not a mysterious agent failure 10 turns later.

## Plugin Loading

Each backend loads superpowers differently. The harness manages this per-run with no global config mutation:

| Backend | Mechanism | Harness action |
|---------|-----------|----------------|
| Claude Code | `--plugin-dir` CLI flag | Pass flag pointing at superpowers checkout |
| Codex | `.agents/skills/` in repo | Backend pre_run hook creates symlink |

This means Drill can test draft skill changes by pointing at a branch checkout of superpowers.

## Post-Session Tool Call Collection

Both backends write structured session logs that record every tool invocation:

| Backend | Log location | Format |
|---------|-------------|--------|
| Claude Code | `~/.claude/projects/**/session-*.jsonl` | JSONL with tool names + args |
| Codex | `~/.codex/sessions/rollout-*.jsonl` | JSONL with `LocalShellCall`, `FunctionCall`, etc. |

The harness snapshots each backend's log directory before the session starts. After shutdown, it diffs the directory to find only files created during the run — no timestamp matching needed, no cross-contamination from concurrent sessions or prior runs.

Collected logs are normalized into a common `tool_calls.jsonl` format before the verifier sees them:

```json
{"tool": "EnterWorktree", "args": {"branch": "add-login"}, "source": "native"}
{"tool": "Bash", "args": {"command": "git worktree add ..."}, "source": "shell"}
```

Each backend defines a normalizer function that maps its native log format (Claude Code's tool call entries, Codex's `ResponseItem` records) into this common schema. The verifier never sees raw backend-specific logs.

## Actor & Verifier LLM Design

### Actor

- **Model:** Sonnet
- **Temperature:** 0.7 (realistic user variation)
- **Context:** Rolling (full conversation history). Sessions are short enough (~5-20 turns) that token cost is not a concern.
- **Input:** System prompt + rolling terminal captures + all intents + user_posture
- **Output:** Structured JSON via Anthropic SDK tool_use: `{"action": "type", "text": "..."}`, `{"action": "done"}`, `{"action": "stuck"}`, or `{"action": "key", "key": "ctrl-c"}`. The harness parses this and sends keystrokes — no free-text sanitization needed.
- **Prompt:** Versioned template at `prompts/actor.md`

### Verifier

- **Model:** Sonnet
- **Temperature:** Near-zero (deterministic judgment)
- **Input:** session.log + filesystem.json + tool_calls.jsonl + criteria list. Does NOT receive actor intents or scenario narrative (reduces confirmation bias).
- **Output:** Structured JSON with per-criterion verdict/evidence/rationale + observations
- **Prompt:** Versioned template at `prompts/verifier.md`

## Results & Compare

### Results Structure

```
results/
  <scenario>/
    <backend>/
      <timestamp>/
        session.log        # raw tmux capture
        filesystem.json    # post-run git/file state snapshot
        tool_calls.jsonl   # collected from backend session logs
        verdict.json       # verifier output
        meta.json          # run metadata (backend, duration, turns, model versions)
```

### Compare Command

`drill compare` reads existing results from prior `drill run` invocations. It does not run backends itself — run each backend separately first, then compare.

```
$ drill run worktree-creation-from-main --backend claude
$ drill run worktree-creation-from-main --backend codex
$ drill compare worktree-creation-from-main

Scenario: worktree-creation-from-main (naive posture)

Summary:
┌──────────┬────────┬───────┬───────┐
│ Backend  │ Result │ Score │ Turns │
├──────────┼────────┼───────┼───────┤
│ claude   │ PASS   │ 4/4   │ 6     │
│ codex    │ FAIL   │ 2/4   │ 12    │
└──────────┴────────┴───────┴───────┘

Detail:
┌────────────────────────────────┬────────┬────────┐
│ Criterion                      │ claude │ codex  │
├────────────────────────────────┼────────┼────────┤
│ Detected on main               │ ✓      │ ✓      │
│ Asked consent                  │ ✓      │ ✗      │
│ Worktree exists                │ ✓      │ ✓      │
│ Used native tools              │ ✓      │ ✗      │
└────────────────────────────────┴────────┴────────┘

Observations:
  claude: "Agent cited the using-git-worktrees skill by name"
  codex:  "Agent created worktree but skipped consent step entirely"
```

## Project Structure

```
drill/
├── drill/
│   ├── __init__.py
│   ├── cli.py              # click CLI: run, compare, list
│   ├── engine.py            # orchestrates the full run lifecycle
│   ├── session.py           # tmux session management
│   ├── actor.py             # actor LLM calls
│   ├── verifier.py          # verifier LLM calls
│   ├── setup.py             # template repo cloning, helpers, assertions
│   └── backend.py           # loads backend YAML, builds commands
├── backends/
│   ├── claude.yaml
│   └── codex.yaml
├── prompts/
│   ├── actor.md
│   └── verifier.md
├── scenarios/
│   ├── worktree-creation-from-main.yaml
│   ├── worktree-already-inside.yaml
│   ├── worktree-codex-detached-head.yaml
│   └── worktree-consent-flow.yaml
├── fixtures/
│   └── template-repo/       # base git repo, cloned per run
├── setup_helpers/
│   ├── __init__.py
│   ├── base.py              # create_base_repo, common git ops
│   └── worktree.py          # add_worktree, detach_head, etc.
├── results/                  # gitignored, populated by runs
├── pyproject.toml             # package metadata + [project.scripts] entry point
└── README.md
```

## Phase 1 Scope

- Claude Code + Codex backends
- 4 PRI-974 worktree scenarios (creation, already-inside, detached-head, consent)
- Both user postures (naive + spec-aware) per scenario
- Template repo + setup helpers + assertions
- Actor + verifier with prompts
- `drill run` and `drill compare` commands
- Results storage

## Phase 2 (Future)

- Gemini CLI backend
- Backend variants (e.g., `codex-workspace-write.yaml` for sandbox mode testing)
- Verifier flakiness mitigation (3x voting, agreement tracking)
- Cost tracking and token usage reporting
- Docker isolation for reproducibility
- CI integration
- Scenarios beyond worktrees (stacked PRs, git-spice, brainstorming)

## Installation

```bash
pip install -e .    # installs 'drill' console script
```

Requires `tmux` installed as a system dependency.

## Dependencies

- Python 3.11+
- `click` — CLI framework
- `pyyaml` — scenario and backend config parsing
- `anthropic` — Anthropic Python SDK for actor/verifier LLM calls (structured tool_use output)
- `jinja2` — prompt template rendering
- `pydantic` — verdict schema validation (retry on malformed verifier output)
- `tmux` — session driving (system dependency)

## Non-Goals

- Not a coding ability benchmark (SWE-bench covers that)
- Not an LLM evaluation framework (promptfoo covers that)
- Not a generic terminal automation tool (Terminal-Bench covers that)
- No CI in phase 1
- No Docker in phase 1
