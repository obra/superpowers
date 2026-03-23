# Superpowers for GitHub Copilot Local Installs

Guide for using Superpowers with GitHub Copilot local installs via native skill and custom-agent discovery backed by the shared Superpowers runtime checkout.

## Quick Install

Tell GitHub Copilot:

```
Fetch and follow instructions from https://raw.githubusercontent.com/dmulcahey/superpowers/refs/heads/main/.copilot/INSTALL.md
```

## Manual Installation

### Prerequisites

- GitHub Copilot CLI or another local GitHub Copilot install that supports local skills and custom agents
- Git

### Steps

1. Clone the repo into the shared runtime location:
   ```bash
   git clone https://github.com/dmulcahey/superpowers.git ~/.superpowers/install
   ```

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.copilot/skills
   ln -s ~/.superpowers/install/skills ~/.copilot/skills/superpowers
   ```

3. Install the code-reviewer custom agent from the canonical agents directory:
   ```bash
   mkdir -p ~/.copilot/agents
   ln -s ~/.superpowers/install/agents/code-reviewer.md ~/.copilot/agents/code-reviewer.agent.md
   ```

4. Restart GitHub Copilot so it discovers the new skills and agent.

### Windows

Use a junction for skills and copy the agent file:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.copilot\skills"
cmd /c mklink /J "$env:USERPROFILE\.copilot\skills\superpowers" "$env:USERPROFILE\.superpowers\install\skills"

New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.copilot\agents"
Copy-Item "$env:USERPROFILE\.superpowers\install\agents\code-reviewer.md" "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md" -Force
```

## Migrating Existing Installs

If you already have `~/.codex/superpowers` or `~/.copilot/superpowers`, migrate them into the shared checkout with:

```bash
tmpdir=$(mktemp -d)
git clone --depth 1 https://github.com/dmulcahey/superpowers.git "$tmpdir/superpowers"
"$tmpdir/superpowers/bin/superpowers-migrate-install"
rm -rf "$tmpdir"
```

If `~/.superpowers/install` already exists, run `~/.superpowers/install/bin/superpowers-migrate-install` instead.

**Windows (PowerShell):**
```powershell
if (Test-Path "$env:USERPROFILE\.superpowers\install") {
  & "$env:USERPROFILE\.superpowers\install\bin\superpowers-migrate-install.ps1"
} else {
  $tmpRoot = Join-Path $env:TEMP "superpowers-migrate"
  $tmpDir = Join-Path $tmpRoot ([guid]::NewGuid().ToString())
  git clone --depth 1 https://github.com/dmulcahey/superpowers.git (Join-Path $tmpDir "superpowers")
  & (Join-Path $tmpDir "superpowers\bin\superpowers-migrate-install.ps1")
  Remove-Item -Recurse -Force $tmpDir
}
```

Migration only consolidates the checkout. After migrating, continue with steps 2 and 3 to create or refresh `~/.copilot/skills/superpowers` and `~/.copilot/agents/code-reviewer.agent.md`, then restart GitHub Copilot.

## How It Works

GitHub Copilot local installs discover skills from `~/.copilot/skills/` and custom agents from `~/.copilot/agents/`. Superpowers keeps `skills/` and `agents/` canonical in the repo and installs them into those discovery locations.

```
~/.copilot/skills/superpowers/ → ~/.superpowers/install/skills/
Unix-like: ~/.copilot/agents/code-reviewer.agent.md → ~/.superpowers/install/agents/code-reviewer.md
Windows: copy ~/.superpowers/install/agents/code-reviewer.md to ~/.copilot/agents/code-reviewer.agent.md
```

On Unix-like installs, the Copilot agent is symlinked to the shared checkout.

On Windows, the Copilot agent is copied from the shared checkout and must be refreshed after updates.

## Usage

Skills are discovered automatically when:
- you mention a skill by name
- the task matches a skill's description
- the runtime-owned `superpowers-session-entry` gate resolves the first-turn session decision, then `using-superpowers` routes the enabled turn by workflow state

The `code-reviewer` agent is available through Copilot's local custom-agent support after installation.

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

## Runtime Helpers

Runtime helper state lives in `~/.superpowers/`. Generated skill preambles use this directory for session markers, contributor logs, update-check cache files, and project-scoped artifacts under `~/.superpowers/projects/`.

Superpowers ships session-entry runtime helpers:
- `bin/superpowers-session-entry` (Bash)
- `bin/superpowers-session-entry.ps1` (PowerShell wrapper)

Supported entry paths use this helper to resolve `enabled`, `bypassed`, or `needs_user_choice` before the normal `using-superpowers` stack starts. Missing or malformed decision state fails closed to `needs_user_choice`; `using-superpowers` documents that contract but does not own it by itself.

Superpowers ships protected-branch repo-safety helpers:
- `bin/superpowers-repo-safety` (Bash)
- `bin/superpowers-repo-safety.ps1` (PowerShell wrapper)

Generated repo-writing workflow skills use this helper to block repo writes on protected branches by default. Spec writes, plan writes, approval-header edits, release-doc updates, execution task slices, and branch-finishing commands must either run on a non-protected branch or carry an explicit task-scoped approval that passes the helper's re-check.

Superpowers ships task-fidelity contract helpers:
- `bin/superpowers-plan-contract` (Bash)
- `bin/superpowers-plan-contract.ps1` (PowerShell wrapper)

Generated planning, execution, and review skills use this helper to run authoritative `analyze-plan --format json` contract checks and to build task-packet context. Repo markdown remains authoritative; the helper only enforces and compiles the approved markdown into exact execution and review inputs.

Superpowers ships a supported public workflow inspection surface:
- `bin/superpowers-workflow` (Bash)
- `bin/superpowers-workflow.ps1` (PowerShell wrapper)

Use `status`, `next`, `artifacts`, `explain`, or `help` for the baseline read-only workflow inspection surfaces. The same public CLI also exposes `phase`, `doctor`, `handoff`, `preflight`, `gate review`, and `gate finish` when you need deeper operator inspection directly from the terminal. These commands stay read-only: they do not create, repair, or rewrite branch-scoped manifests. `phase`, `doctor`, `handoff`, `preflight`, `gate review`, and `gate finish` support `--json` for operator tooling. Before execution starts, `next` still stops at the execution preflight boundary for the approved plan instead of calling `superpowers-plan-execution recommend`. Once execution has already started for that plan revision, both `next` and `handoff` return the current execution state instead of a fresh recommendation.

Superpowers also ships workflow-status runtime helpers:
- `bin/superpowers-workflow-status` (Bash)
- `bin/superpowers-workflow-status.ps1` (PowerShell wrapper)

Generated workflow skills call `$_SUPERPOWERS_ROOT/bin/superpowers-workflow-status status --refresh` first to resolve the conservative next stage, including before spec/plan docs exist. This helper is an internal runtime surface, not a supported public workflow CLI. Default `status` output is JSON for machine consumers; `status --summary` is a human-oriented one-line view. `reason_codes` plus `diagnostics` are the structured diagnostic contract; legacy `reason` and `note` remain compatibility aliases for one release cycle. It keeps branch-scoped manifests at `~/.superpowers/projects/<repo-slug>/<user>-<safe-branch>-workflow-state.json`; that local manifest is rebuildable, and repo docs remain authoritative for approval state.

Optional: enable contributor mode for future sessions with:

```bash
~/.superpowers/install/bin/superpowers-config set superpowers_contributor true
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.superpowers\install\bin\superpowers-config.ps1" set superpowers_contributor true
```

If you disable update notices, re-enable them with:

```bash
~/.superpowers/install/bin/superpowers-config set update_check true
```

**Windows (PowerShell):**
```powershell
& "$env:USERPROFILE\.superpowers\install\bin\superpowers-config.ps1" set update_check true
```

## Personal Skills and Agents

Create your own skills in `~/.copilot/skills/` and your own agents in `~/.copilot/agents/`.

## Updating

```bash
cd ~/.superpowers/install && git pull
```

If you copied the agent file on Windows, copy ~/.superpowers/install/agents/code-reviewer.md into ~/.copilot/agents/code-reviewer.agent.md again after updating.

If you migrated from `~/.codex/superpowers` or `~/.copilot/superpowers`, rerun `~/.superpowers/install/bin/superpowers-migrate-install` after updating if you need to restore the compatibility links. In PowerShell, use `& "$env:USERPROFILE\.superpowers\install\bin\superpowers-migrate-install.ps1"`.

Generated skill preambles run `~/.superpowers/install/bin/superpowers-update-check` automatically when that install root is active, so new sessions can surface `UPGRADE_AVAILABLE` or `JUST_UPGRADED` without extra setup.

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.copilot/skills/superpowers`
2. Check skills exist: `ls ~/.superpowers/install/skills`
3. Restart GitHub Copilot

**Windows (PowerShell):**
1. Verify the junction: `Get-Item "$env:USERPROFILE\.copilot\skills\superpowers"`
2. Check skills exist: `Get-ChildItem "$env:USERPROFILE\.superpowers\install\skills"`
3. Restart GitHub Copilot

### Agent not showing up

1. Verify the agent file: `ls -la ~/.copilot/agents/code-reviewer.agent.md`
2. Check the source exists: `ls ~/.superpowers/install/agents/code-reviewer.md`
3. Restart GitHub Copilot

**Windows (PowerShell):**
1. Verify the copied agent file: `Get-Item "$env:USERPROFILE\.copilot\agents\code-reviewer.agent.md"`
2. Check the source exists: `Get-Item "$env:USERPROFILE\.superpowers\install\agents\code-reviewer.md"`
3. If you updated Superpowers, rerun the Windows install step that copies `code-reviewer.md` into Copilot's agent directory
4. Restart GitHub Copilot

## Getting Help

- Report issues: https://github.com/dmulcahey/superpowers/issues
- Main documentation: https://github.com/dmulcahey/superpowers
