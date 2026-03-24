# Superpowers for Codex

Guide for using Superpowers with OpenAI Codex via native skill discovery and the shared Superpowers runtime checkout.

## Quick Install

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/dmulcahey/superpowers/refs/heads/main/.codex/INSTALL.md
```

## Manual Installation

### Prerequisites

- OpenAI Codex CLI
- Git

### Steps

1. Clone the repo into the shared runtime location:
   ```bash
   git clone https://github.com/dmulcahey/superpowers.git ~/.superpowers/install
   ```

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.superpowers/install/skills ~/.agents/skills/superpowers
   ```

3. Install the `code-reviewer` custom agent:
   ```bash
   mkdir -p ~/.codex/agents
   ln -s ~/.superpowers/install/.codex/agents/code-reviewer.toml ~/.codex/agents/code-reviewer.toml
   ```

4. Restart Codex.

### Windows

Use a junction instead of a symlink (works without Developer Mode):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.superpowers\install\skills"

New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\agents"
Copy-Item "$env:USERPROFILE\.superpowers\install\.codex\agents\code-reviewer.toml" "$env:USERPROFILE\.codex\agents\code-reviewer.toml" -Force
```

## Migrating Existing Installs

If you already have `~/.codex/superpowers` or `~/.copilot/superpowers`, migrate them into the shared checkout with:

```bash
tmpdir=$(mktemp -d)
git clone --depth 1 https://github.com/dmulcahey/superpowers.git "$tmpdir/superpowers"
"$tmpdir/superpowers/bin/superpowers" install migrate
rm -rf "$tmpdir"
```

If `~/.superpowers/install` already exists, run `~/.superpowers/install/bin/superpowers install migrate` instead.

**Windows (PowerShell):**
```powershell
if (Test-Path "$env:USERPROFILE\.superpowers\install") {
  & "$env:USERPROFILE\.superpowers\install\bin\superpowers.exe" install migrate
} else {
  $tmpRoot = Join-Path $env:TEMP "superpowers-migrate"
  $tmpDir = Join-Path $tmpRoot ([guid]::NewGuid().ToString())
  git clone --depth 1 https://github.com/dmulcahey/superpowers.git (Join-Path $tmpDir "superpowers")
  & (Join-Path $tmpDir "superpowers\bin\superpowers.exe") install migrate
  Remove-Item -Recurse -Force $tmpDir
}
```

Migration only consolidates the checkout. After migrating, continue with steps 2 and 3 to create or refresh `~/.agents/skills/superpowers` and `~/.codex/agents/code-reviewer.toml`, then restart Codex.

## How It Works

Codex has native skill discovery — it scans `~/.agents/skills/` at startup, parses SKILL.md frontmatter, and loads skills on demand. Superpowers skills are made visible through a single symlink:

```
~/.agents/skills/superpowers/ → ~/.superpowers/install/skills/
Unix-like: ~/.codex/agents/code-reviewer.toml → ~/.superpowers/install/.codex/agents/code-reviewer.toml
Windows: copy ~/.superpowers/install/.codex/agents/code-reviewer.toml to ~/.codex/agents/code-reviewer.toml
```

The runtime-owned `superpowers session-entry` helper resolves the first-turn session decision before `using-superpowers` takes over as the human-readable entry router — no additional configuration needed.

The `code-reviewer` custom agent is available after installation.

## Codex Subagents

Current Codex releases enable subagent workflows by default, so Superpowers does not require a separate `multi_agent` feature flag.

Codex ships built-in `default`, `worker`, and `explorer` agents:

- Use `worker` for implementation and fix tasks.
- Use `explorer` for read-heavy debugging, review, and codebase exploration.
- Use `default` when the task needs broader judgment instead of a narrow execution or exploration role.

Superpowers also installs its `code-reviewer` custom agent to `~/.codex/agents/code-reviewer.toml`.

If you want custom project-scoped agents, add TOML files under `.codex/agents/`. Personal custom agents live under `~/.codex/agents/`. Each custom agent file defines `name`, `description`, and `developer_instructions`; optional settings such as `nickname_candidates`, `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, and `skills.config` inherit from the parent session when omitted.

Use `[agents]` in your Codex config for global subagent controls such as `max_threads`, `max_depth`, and `job_max_runtime_seconds`. Most installs can leave `[agents]` unset; Codex defaults to six open agent threads and a max depth of one direct child layer.

## Usage

Skills are discovered automatically. Codex activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The runtime-owned `superpowers session-entry` gate resolves the first-turn session decision, then `using-superpowers` routes the enabled turn by workflow state

## Default Workflow

Superpowers' default planning pipeline is:

`brainstorming -> plan-ceo-review -> writing-plans -> plan-eng-review -> implementation`

Accelerated review is an opt-in branch inside `plan-ceo-review` and `plan-eng-review`, not a separate workflow stage.

Only the user can initiate accelerated review, and section approval plus final approval remain human-owned even when the review uses reviewer subagents and persisted section packets.

During implementation, either `subagent-driven-development` or `executing-plans` starts from an engineering-approved current plan, runs a workspace-readiness preflight, and then drives task execution. Those execution and review stages now consume helper-built task packets derived from the approved markdown contract. Workspace preparation is the user's responsibility; invoke `using-git-worktrees` manually when you want isolated workspace management. The completion flow runs `requesting-code-review`, uses the current-branch test-plan artifact to decide whether `qa-only` is required, requires that current-branch test-plan artifact for helper-backed finish readiness, requires the `document-release` handoff for workflow-routed branch completion, and requires a passing `gate-finish` before final branch cleanup or PR handoff.

## Search Before Building

Generated non-router skills include a shared `Search Before Building` preamble. It applies in places like `brainstorming`, CEO and ENG review, debugging, review reception and dispatch, and optional QA issue lookup. It does not run in `using-superpowers`, which stays focused on routing first.

The check uses three lenses:

- `Layer 1`: built-ins, official guidance, and existing repo-native solutions
- `Layer 2`: current external practice and known footguns
- `Layer 3`: first-principles reasoning for this repo, this user, and this problem

External search is optional, not mandatory. If network access is unavailable, unnecessary, disallowed, or unsafe, the workflow continues with repo-local evidence and existing model knowledge. `Layer 2` is input, not authority, so outside search never outranks repo truth, approved artifacts, or explicit user instructions.

Privacy rules are part of the contract:

- never search secrets, customer data, unsanitized stack traces, private URLs, internal hostnames, internal codenames, raw SQL or log payloads, or private file paths or infrastructure identifiers
- product ideation uses generalized category terms only
- debugging searches must sanitize down to a generic error type plus framework or library context
- if safe sanitization is not possible, skip external search
- only `brainstorming` asks one explicit permission question first when the work is sensitive or stealthy

The canonical reference is [references/search-before-building.md](../references/search-before-building.md).

## Runtime Commands

Runtime helper state lives in `~/.superpowers/`. Generated skill preambles use this directory for session markers, contributor logs, update-check cache files, and project-scoped artifacts under `~/.superpowers/projects/`.

Superpowers installs one runtime binary at `~/.superpowers/install/bin/superpowers` on Unix-like systems and `~/.superpowers/install/bin/superpowers.exe` on Windows. The supported command families are:

- `superpowers session-entry`
- `superpowers repo-safety`
- `superpowers plan contract`
- `superpowers plan execution`
- `superpowers workflow`
- `superpowers config`
- `superpowers update-check`
- `superpowers install migrate`
- `superpowers repo slug`

Supported entry paths use `superpowers session-entry` to resolve `enabled`, `bypassed`, or `needs_user_choice` before the normal `using-superpowers` stack starts. Missing or malformed decision state fails closed to `needs_user_choice`; `using-superpowers` documents that contract but does not own it by itself.

Generated repo-writing workflow skills use `superpowers repo-safety` to block repo writes on protected branches by default. Spec writes, plan writes, approval-header edits, release-doc updates, execution task slices, and branch-finishing commands must either run on a non-protected branch or carry an explicit task-scoped approval that passes the re-check.

Generated planning, execution, and review skills use `superpowers plan contract` to run authoritative `analyze-plan --format json` checks and to build task-packet context. Repo markdown remains authoritative; the runtime only enforces and compiles the approved markdown into exact execution and review inputs.

`superpowers workflow` is the supported read-only workflow inspection surface. Use `status`, `next`, `artifacts`, `explain`, or `help` for the baseline inspection surfaces. The same public CLI also exposes `phase`, `doctor`, `handoff`, `preflight`, `gate review`, and `gate finish` when you need deeper operator inspection directly from the terminal. These commands stay read-only: they do not create, repair, or rewrite branch-scoped manifests. `phase`, `doctor`, `handoff`, `preflight`, `gate review`, and `gate finish` support `--json` for operator tooling. Before execution starts, `next` still stops at the execution preflight boundary for the approved plan instead of calling `superpowers plan execution recommend`. Once execution has already started for that plan revision, both `next` and `handoff` return the current execution state instead of a fresh recommendation.

Generated workflow skills call `$_SUPERPOWERS_ROOT/bin/superpowers workflow status --refresh` first to resolve the conservative next stage, including before spec/plan docs exist. Default `status` output is JSON for machine consumers; `status --summary` is a human-oriented one-line view. `reason_codes` plus `diagnostics` are the structured diagnostic contract, the branch-scoped manifest remains rebuildable, and repo docs remain authoritative for approval state.

Optional: enable contributor mode for future sessions with:

```bash
~/.superpowers/install/bin/superpowers config set superpowers_contributor true
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.superpowers\install\bin\superpowers.exe" config set superpowers_contributor true
```

If you disable update notices, re-enable them with:

```bash
~/.superpowers/install/bin/superpowers config set update_check true
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.superpowers\install\bin\superpowers.exe" config set update_check true
```

### Personal Skills

Create your own skills in `~/.agents/skills/`:

```bash
mkdir -p ~/.agents/skills/my-skill
```

Create `~/.agents/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Codex decides when to activate a skill automatically — write it as a clear trigger condition.

## Updating

```bash
cd ~/.superpowers/install && git pull
```

Skills update instantly through the symlink.

If you copied the Codex agent file on Windows, copy `~/.superpowers/install/.codex/agents/code-reviewer.toml` into `~/.codex/agents/code-reviewer.toml` again after updating.

If you migrated from `~/.codex/superpowers` or `~/.copilot/superpowers`, rerun `~/.superpowers/install/bin/superpowers install migrate` after updating if you need to restore the compatibility links. In PowerShell, use `& "$env:USERPROFILE\.superpowers\install\bin\superpowers.exe" install migrate`.

Generated skill preambles run `~/.superpowers/install/bin/superpowers update-check` automatically when that install root is active, so new sessions can surface `UPGRADE_AVAILABLE` or `JUST_UPGRADED` without extra setup.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
rm ~/.codex/agents/code-reviewer.toml
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\superpowers"
Remove-Item "$env:USERPROFILE\.codex\agents\code-reviewer.toml"
```

Optionally delete the shared clone if no other platform uses it: `rm -rf ~/.superpowers/install` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.superpowers\install"`).

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.agents/skills/superpowers`
2. Verify the agent file: `ls -la ~/.codex/agents/code-reviewer.toml`
3. Check skills exist: `ls ~/.superpowers/install/skills`
4. Check the source agent exists: `ls ~/.superpowers/install/.codex/agents/code-reviewer.toml`
5. Restart Codex — skills and agents are discovered at startup

**Windows (PowerShell):**
1. Verify the junction: `Get-Item "$env:USERPROFILE\.agents\skills\superpowers"`
2. Verify the copied agent file: `Get-Item "$env:USERPROFILE\.codex\agents\code-reviewer.toml"`
3. Check skills exist: `Get-ChildItem "$env:USERPROFILE\.superpowers\install\skills"`
4. Check the source agent exists: `Get-Item "$env:USERPROFILE\.superpowers\install\.codex\agents\code-reviewer.toml"`
5. If you updated Superpowers, recopy `code-reviewer.toml` into `~/.codex/agents/`
6. Restart Codex — skills and agents are discovered at startup

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/dmulcahey/superpowers/issues
- Main documentation: https://github.com/dmulcahey/superpowers
