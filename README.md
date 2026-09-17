# Superpowers (personal fork)

This is [Callum Marks'](https://github.com/CallumMarksClik/superpowers) personal fork of [Superpowers](https://github.com/obra/superpowers), a software development methodology for Claude Code built on composable skills. This fork keeps the skill library but deliberately leans the workflow toward direct, primary-agent execution instead of heavy subagent orchestration, and adds a durable-storage system that can write specs/plans to an ObsidianRAG vault instead of (or as well as) the filesystem.

**Everything in this README describes this fork's behaviour.** Upstream `obra/superpowers` is a different, independently-evolving codebase and may work differently.

## Table of Contents

- [What This Fork Is](#what-this-fork-is)
- [Installation](#installation)
- [Verify Installation](#verify-installation)
- [Core Workflow](#core-workflow)
- [Custom Skills](#custom-skills)
- [Durable Storage](#durable-storage)
- [Local Configuration](#local-configuration)
- [Configuring ObsidianRAG](#configuring-obsidianrag)
- [ObsidianRAG Storage Structure](#obsidianrag-storage-structure)
- [Project Naming](#project-naming)
- [Filename Convention](#filename-convention)
- [Specs and Plans](#specs-and-plans)
- [Default vs ObsidianRAG](#default-vs-obsidianrag)
- [Internal `.superpowers` State](#internal-superpowers-state)
- [ObsidianRAG Integration Details](#obsidianrag-integration-details)
- [Usage Examples](#usage-examples)
- [Updating](#updating)
- [Uninstalling](#uninstalling)
- [Development / Contributing](#development--contributing)
- [License](#license)

## What This Fork Is

Upstream Superpowers already walks you from a rough idea through a spec, a plan, and implementation. This fork keeps that shape but changes *who does the work and how much ceremony surrounds it*. The principles actually implemented here:

- **Primary-agent execution by default** — tasks are implemented directly in the primary agent's own context; subagents are opt-in, not a per-task default (`subagent-driven-development`).
- **Avoiding unnecessary subagent orchestration** — dispatching a subagent (for review, for genuinely parallel work) is a deliberate choice made because it adds concrete value, never a mandatory pipeline step.
- **No automatic Git commits** — no skill in this fork runs `git commit`. That's always the user's call.
- **No automatic Git staging** — same for `git add`. Skills report what changed; the user decides what to stage.
- **No unnecessary Git history mutation** — skills that touch the working tree (comment-hygiene passes, checkpoint reviews) are explicitly forbidden from `git reset`, `restore`, `checkout --`, `rebase`, `merge`, `cherry-pick`, `stash`, `push`, or creating/deleting branches or worktrees.
- **Independent review is optional and should provide concrete value** — `requesting-code-review` is reached for when a second perspective would materially improve confidence (security-sensitive, architecturally complex, explicitly requested), not as a gate after every task.
- **Proportional verification rather than blindly running everything** — `verification-strategy` picks what to check based on what actually changed and what could regress, instead of defaulting to the full test suite or skipping checks because "it's small."
- **Scope-drift checking** — `scope-drift-check` classifies accumulated work as Required, Supporting, Incidental, or Unrelated at checkpoints, so a task doesn't quietly grow beyond what was authorized.
- **Comment hygiene** — `comment-hygiene` keeps comments introduced during a task focused on durable, non-obvious information rather than narrating what just happened.
- **Token/context efficiency** — the workflow was redesigned around one continuous primary-agent context instead of a default per-task subagent fan-out, so routine work doesn't pay the cost of spinning up and re-explaining context to fresh agents.
- **Preserving the user's existing working-tree changes** — every skill's Git Safety section defers staging/history decisions to the user; nothing here resets or discards uncommitted work.

This section is a summary of philosophy, not a replacement for the individual skills — see [Custom Skills](#custom-skills) below and the `skills/` directory for the actual behaviour-shaping content.

## Installation

**Prerequisites:** Claude Code CLI installed (`claude --version` works).

This fork ships its own self-contained plugin marketplace at `.claude-plugin/marketplace.json` (marketplace name `superpowers-dev`, one plugin, `superpowers`, sourced from the repo root). That's a different marketplace from either of upstream's — installing from this fork is not the same as running the official-marketplace or `obra/superpowers-marketplace` install commands in upstream's docs.

Clone the fork, then register it as a local marketplace and install the plugin from it:

```bash
git clone https://github.com/CallumMarksClik/superpowers.git
```

```
/plugin marketplace add /path/to/your/clone/of/superpowers
/plugin install superpowers@superpowers-dev
```

(Once your changes are pushed, `/plugin marketplace add CallumMarksClik/superpowers` works the same way directly from GitHub, without a local clone.)

This is a user-level install, same as any other Claude Code plugin — Claude Code caches installed plugin content under `~/.claude/plugins/cache/superpowers-dev/superpowers/<version>/`, the same pattern used for `~/.claude/plugins/cache/claude-plugins-official/superpowers/<version>/`. Skills are auto-discovered from the plugin's `skills/*/SKILL.md` files; a `SessionStart` hook (`hooks/hooks.json`) additionally injects the `using-superpowers` skill directly into every new session so skill-checking behaviour doesn't depend on the model deciding to look it up.

**Installing this fork vs. upstream:** `superpowers@claude-plugins-official` (Anthropic's official marketplace) and `superpowers@superpowers-marketplace` (`obra/superpowers-marketplace`) both install Jesse Vincent's unmodified upstream Superpowers — a different codebase from this fork. All three register a plugin literally named `superpowers`, so only enable one at a time; running two `superpowers` plugins together will produce duplicate/conflicting skill definitions.

## Verify Installation

There's no dedicated verification script in this repo — installation is a Claude Code plugin operation, so verify it the same way you'd verify any plugin:

- Run `/plugin list` (or `claude plugin list` from a shell) and confirm `superpowers` is listed as installed from the `superpowers-dev` marketplace (not `claude-plugins-official`).
- Ask Claude what skills it has available, or explicitly reference `superpowers:durable-storage`, `superpowers:comment-hygiene`, `superpowers:scope-drift-check`, or `superpowers:verification-strategy` — these four don't exist in upstream Superpowers, so their presence confirms this fork (not upstream) is what's active.
- Confirm the cached copy exists on disk: `~/.claude/plugins/cache/superpowers-dev/superpowers/<version>/skills/durable-storage/SKILL.md`.

## Core Workflow

1. **brainstorming** — activates before writing code for anything non-trivial. Refines a rough idea through questions, presents the design in reviewable sections, and (via `durable-storage`) writes the approved spec to its configured destination.
2. **writing-plans** — turns an approved spec into a task-by-task implementation plan, saved via the same `durable-storage` destination logic.
3. **subagent-driven-development** — implements the plan directly in the primary agent, one task at a time: focused verification (per `verification-strategy`) and self-review after each task. At meaningful milestones (a coherent feature done, several related tasks accumulated, a risky change just landed) it runs a **checkpoint review**: `scope-drift-check`, `comment-hygiene`, and optionally an independent review — not after every single task.
4. **Final verification** — before hand-off: full relevant test suite, working-tree inspection (`git status`/`git diff`, untracked files), comparison against the plan, a final comment-hygiene pass, a final scope-drift check, and an explicit statement of what was and wasn't verified.
5. **finishing-a-development-branch** — reports what it finds in the working tree and stops. Staging, committing, pushing, merging, and branch/worktree cleanup are entirely the user's call.

The workflow is proportional, not a forced ceremony: a small, unambiguous change can skip straight to implementation and a quick self-review; a large or risky one earns the full brainstorm → plan → checkpoint-reviewed implementation path. See `skills/using-superpowers/SKILL.md` for how skill-checking itself is triggered.

## Custom Skills

Skills that exist only in this fork (not upstream Superpowers):

### Comment Hygiene (`skills/comment-hygiene`)
Runs during checkpoint reviews and before final hand-off. Keeps comments focused on durable, non-obvious information — constraints, invariants, workarounds, surprising-but-necessary reasoning — and removes or shortens comments that just narrate what changed, restate obvious code, or read as a changelog embedded in source. Judgement-based, not a linter; only touches comments introduced or modified during the current task.

### Scope Drift Check (`skills/scope-drift-check`)
Runs at checkpoints and final verification. Classifies accumulated work into four buckets — **Required**, **Supporting** (necessary but not the literal ask — the reason must be stated), **Incidental** (useful but not required — named as follow-up, not folded in silently), **Unrelated** (removed or split out). Checks against the *current* authorized intent, which can legitimately expand mid-conversation — it flags silent self-directed expansion, not user-authorized expansion.

### Verification Strategy (`skills/verification-strategy`)
Decides *what* to verify before a change is claimed complete, based on what actually changed and what could realistically regress — not a fixed "run the full suite" or "it's small, skip it" default. Distinguishes four states: verified, appropriate-but-not-yet-done, unavailable, and unnecessary — and requires saying explicitly which applies rather than implying blanket certainty.

### Durable Storage (`skills/durable-storage`)
The single place that decides where a spec or plan gets written and what it's named, for both `brainstorming` and `writing-plans` — so neither skill duplicates that logic. Supports a filesystem default and an optional ObsidianRAG-backed provider, configured per user in `.superpowers/config.json`. See [Durable Storage](#durable-storage) below for the full picture.

### Modified Subagent-Driven Development (`skills/subagent-driven-development`)
Still direct, primary-agent execution by default — the fork's core change already existed here. What's new: **Checkpoint Reviews**, run at meaningful milestones (not every task) on the accumulated work rather than a single task. A checkpoint reviews requirements/integration/architecture/scope/tests, runs `scope-drift-check` and `comment-hygiene`, and optionally an independent reviewer if the accumulated change genuinely warrants it. This sits as a middle tier between per-task self-review and the final pre-hand-off verification, which now also explicitly runs a comment-hygiene pass, a scope-drift check, and a `verification-strategy` confirmation before reporting completion.

`brainstorming`, `writing-plans`, and `requesting-code-review` were also updated: the first two now get their save destination/filename from `durable-storage` instead of hardcoding a date-prefixed path, and `requesting-code-review` recognizes a checkpoint (not just a single task) as a valid reason to request independent review.

## Durable Storage

Specs and plans are durable artifacts. This fork supports two ways to store them:

1. **Default durable storage** — the filesystem, always available, no external dependency.
2. **Optional configured durable storage** — an ObsidianRAG vault, used only if you explicitly configure it.

**The default requires no ObsidianRAG setup at all.** With no configuration present, storage is:

```text
docs/superpowers/specs/<filename>.md
docs/superpowers/plans/<filename>.md
```

Switching to the `obsidian-rag` provider is opt-in — see [Configuring ObsidianRAG](#configuring-obsidianrag).

## Local Configuration

Configuration lives at:

```text
.superpowers/config.json
```

This is **local, personal configuration** — `.superpowers/` is already gitignored at the repo root (see `.gitignore`). Concretely:

- It should never be committed.
- It can contain personal details (your ObsidianRAG vault name).
- Every user/machine can have their own `.superpowers/config.json` independently — nobody else's config is affected.
- If the file, or the `durableStorage` key, is missing or unreadable, behaviour is exactly the `"default"` provider — there's no broken/undefined state.
- It's local to your Superpowers environment, not part of the repo's tracked content.
- Pulling updates to this fork, or reinstalling the plugin, never touches or requires committing your personal storage configuration.

The implemented schema (`skills/durable-storage/SKILL.md`):

```json
{
  "durableStorage": {
    "provider": "default"
  }
}
```

or, configured for ObsidianRAG:

```json
{
  "durableStorage": {
    "provider": "obsidian-rag",
    "obsidianRag": {
      "vault": "Memories_ClikWork",
      "root": "Superpowers"
    }
  }
}
```

- `provider` — `"default"` (filesystem) or `"obsidian-rag"`.
- `obsidianRag.vault` — required when `provider` is `"obsidian-rag"`. The vault's logical **name** exactly as your ObsidianRAG MCP server configures it (check its `help` tool) — never a filesystem path.
- `obsidianRag.root` — folder under the vault root that holds all Superpowers artifacts. Defaults to `Superpowers` if omitted.

## Configuring ObsidianRAG

There's no dedicated slash command for this — `durable-storage`'s frontmatter description ("Use when configuring durable-storage behaviour...") lets it auto-trigger when you ask Claude to configure durable storage or set up ObsidianRAG, or you can invoke it explicitly (`superpowers:durable-storage`).

What the skill actually does when configuring:

1. Asks which provider you want (default, or ObsidianRAG with a vault name).
2. If ObsidianRAG: checks that its MCP tools are actually reachable in this environment (e.g. its `help` tool responds) *before* switching the provider. If they're not reachable, it says so plainly and does not write the config.
3. If reachable, calls `help` and checks the requested vault name appears in the configured vaults. If it doesn't, it tells you (likely a typo, or the vault isn't set up yet) and lets you confirm before proceeding.
4. Writes `.superpowers/config.json` with the requested settings.
5. Reports exactly what changed — previous provider → new provider, and vault/root if applicable.
6. Does not stage or commit `.superpowers/config.json` — same Git-safety rule as every other skill here.

**The physical Obsidian vault filesystem path is never required.** Superpowers only ever talks to Obsidian through the ObsidianRAG MCP interface — it doesn't know or need to know where the vault actually lives on disk.

## ObsidianRAG Storage Structure

Inside the configured vault, artifacts live under the configured `root` (default `Superpowers`), with one folder per project directly underneath it — **there is no `Projects/` directory anywhere in the path**:

```text
<root>/
└── <ProjectName>/
    ├── Specs/
    └── Plans/
```

Concretely, with the default root and two projects (`ObsidianRAG` and this fork's own `Superpowers`):

```text
Superpowers/
├── ObsidianRAG/
│   ├── Specs/
│   └── Plans/
│
└── Superpowers/
    ├── Specs/
    └── Plans/
```

`Specs/` and `Plans/` sit directly under `<root>/<ProjectName>/` — the project is a direct child of the configured root, nothing sits between them.

## Project Naming

`<ProjectName>` is derived from the repository being worked on:

1. Inside a Git repository: the top-level directory's name (`basename "$(git rev-parse --show-toplevel)"`).
2. Otherwise: the current working directory's name.
3. If neither is reliable, `durable-storage` doesn't invent one — it asks the user for the project name.

The name is used as-is for the path segment (not slugified or renamed beyond what's required to be a valid path component). Jira has no bearing on the project name — it only ever affects the *filename* (below).

## Filename Convention

Applies identically to specs and plans, on both the default and ObsidianRAG providers.

**Branch has a Jira key.** Looking for a generic Jira-style pattern (project prefix of ≥2 letters, a hyphen, digits — e.g. `CLIK-1234`, `PROJ-42`; matched case-insensitively but no project prefix is hardcoded) in the current Git branch name:

- Exactly one distinct key found → `<KEY>-<kebab-case-description>.md`, e.g. `CLIK-1234-prompt-compiler.md`. The key's original case is preserved; the description is a lowercase kebab-case summary of the actual work, not a raw copy of the branch name.
- More than one distinct key found, with no reliable way to pick the primary one → don't guess, ask the user.

**No Jira key found.** A concise, human-friendly kebab-case description of the work, e.g. `prompt-compiler.md`, `superpowers-storage-configuration.md`, `project-aware-multi-vault-support.md`.

**Filename stability.** The filename is decided once, when the spec/plan is first created, and is never renamed afterward — not because the plan was revised, not because the team's understanding of the task evolved. Work that turns into something genuinely different gets a new artifact with its own filename, not a rename of the existing one.

## Specs and Plans

Two artifact types, stored in parallel `Specs/`/`Plans/` locations (filesystem or ObsidianRAG):

- **Spec** — what's being built and why; the desired behaviour, produced by `brainstorming`.
- **Plan** — how the work will actually be implemented, task by task, produced by `writing-plans`.

Example (ObsidianRAG provider, root `Superpowers`, project `ObsidianRAG`):

```text
Superpowers/ObsidianRAG/Specs/CLIK-1234-multi-vault-support.md
Superpowers/ObsidianRAG/Plans/CLIK-1234-multi-vault-support.md
```

There is no separate Decisions artifact type — just Specs and Plans.

## Default vs ObsidianRAG

| Provider | Storage | Requires ObsidianRAG |
|---|---|---|
| `default` | `docs/superpowers/specs/` and `docs/superpowers/plans/` in the current repo | No |
| `obsidian-rag` | `<root>/<ProjectName>/Specs/` and `Plans/` in the configured vault | Yes |

The filename convention above is shared identically across both providers — switching providers changes *where* the file goes, never how it's named.

## Internal `.superpowers` State

`.superpowers/` is **not** the durable artifact store and is **not** the Obsidian vault — don't confuse the two:

- `.superpowers/config.json` — your local durable-storage provider configuration (see [Local Configuration](#local-configuration)).
- Other `.superpowers/` contents (e.g. the brainstorming visual-companion's session directories) are pre-existing local/internal Superpowers execution state — ephemeral or persist-for-review-only. `durable-storage` explicitly does not govern or redirect this into ObsidianRAG.

Both live under the same gitignored `.superpowers/` directory, but they're different concerns: one is durable-storage *configuration*, the other is unrelated internal state that predates this feature.

## ObsidianRAG Integration Details

What's actually implemented, nothing more:

- Uses the vault configured in `.superpowers/config.json` explicitly — never auto-discovers or guesses a vault.
- Writes/rewrites notes through the ObsidianRAG MCP's `write_note` tool. Overwriting an existing spec/plan mid-session (e.g. incorporating review feedback before user approval) is expected — specs/plans are whole documents, regenerated in full, not appended to.
- Constructs the path as `<root>/<ProjectName>/Specs|Plans/<filename>.md`.
- Passes `vault` explicitly from config — deliberately does **not** use ObsidianRAG's own `project` parameter for this, since that routes across a separate, pre-curated set of vaults tied to named projects, a different concept from the `<ProjectName>` path segment here.
- Never references a physical Obsidian vault filesystem path.
- Leaves indexing/search over what gets written to ObsidianRAG itself (e.g. its own `index_notes` tool) — this skill's job ends at writing the note.
- If the provider is `obsidian-rag` but its MCP tools are unreachable when a write is actually attempted, it stops and says so — it never silently falls back to the filesystem default or reports a write that didn't happen.

## Usage Examples

**Normal task** (no forced ceremony for something small and unambiguous):
> "Fix the login redirect bug — it's sending users to `/dashboard` instead of the page they came from."

**Creating a spec:**
> "Let's design multi-vault support for ObsidianRAG."

Triggers `brainstorming`, which asks clarifying questions, presents the design in sections, and — via `durable-storage` — saves it. With no config: `docs/superpowers/specs/project-aware-multi-vault-support.md`. On branch `CLIK-1234-multi-vault`: `docs/superpowers/specs/CLIK-1234-multi-vault-support.md`.

**Creating a plan** (after the spec is approved):
> "Write the implementation plan for this."

Triggers `writing-plans`, saved alongside the spec's naming, e.g. `docs/superpowers/plans/CLIK-1234-multi-vault-support.md`.

**Configuring ObsidianRAG durable storage:**
> "Configure durable storage to use my ObsidianRAG vault Memories_ClikWork."

Triggers `durable-storage`'s setup flow (confirms the MCP is reachable, confirms the vault exists, writes `.superpowers/config.json`).

**Resulting ObsidianRAG path** for the plan above, once configured with `root: "Superpowers"`:
```text
Superpowers/<ProjectName>/Plans/CLIK-1234-multi-vault-support.md
```

**Filename examples:** `CLIK-1234-prompt-compiler.md` (Jira branch) vs. `prompt-compiler.md` (no Jira key).

## Updating

This fork has no build step — skills are plain Markdown read directly from the plugin's `skills/` directory, so there's nothing to compile. To update:

```bash
cd /path/to/your/clone/of/superpowers
git pull
```

Then, so Claude Code actually picks up the change:

```
/plugin update superpowers@superpowers-dev
```

(a restart is required for the update to apply). If that ever doesn't pick up local edits, `/plugin uninstall superpowers@superpowers-dev` followed by `/plugin install superpowers@superpowers-dev` forces a clean re-read.

Updating never touches, requires, or overwrites `.superpowers/config.json` in any of your project repos — it's local and gitignored, so it survives pulls and reinstalls untouched.

## Uninstalling

This repo has no custom uninstall script (`scripts/` only contains `bump-version.sh` and `lint-shell.sh`). Uninstalling is a standard Claude Code plugin operation:

```
/plugin uninstall superpowers@superpowers-dev
/plugin marketplace remove superpowers-dev
```

This only removes the installed plugin and its marketplace registration — it does not touch `.superpowers/config.json` or `docs/superpowers/` in any project you were using it with; those are ordinary files in that project's own repo.

## Development / Contributing

See `CLAUDE.md` for the actual contributor guidelines (Claude Code-only scope, PR requirements, skill-change evaluation process). In short:

- Skill-behaviour tests: `tests/claude-code/run-skill-tests.sh` (see `tests/claude-code/README.md`).
- Shell lint / version-drift checks: `scripts/lint-shell.sh`, `scripts/bump-version.sh --check`.
- Nothing in this workflow stages or commits automatically — review your own working tree (`git status` / `git diff`) before deciding what to stage, same as any other change here.

## License

MIT License — see `LICENSE` for details.
