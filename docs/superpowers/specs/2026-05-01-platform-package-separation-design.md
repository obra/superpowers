# Platform Package Separation Design

Date: 2026-05-01

## Goal

Separate Sonbbal Superpowers into two first-class platform packages in the same repository:

- `claude-code/` for Claude Code.
- `codex/` for Codex.

The repository root should stop acting as the Claude Code package. It should become the project overview, release, marketplace, and documentation entry point. Each platform package should contain the runtime files, installation guide, and platform-specific usage language needed by that harness.

## Current State

The repository already has a partial split:

- Claude Code package files currently live at the repository root:
  - `.claude-plugin/plugin.json`
  - `skills/`
  - `agents/`
  - `commands/`
  - `hooks/`
- Codex package files already live under `codex/`:
  - `codex/.codex-plugin/plugin.json`
  - `codex/skills/`
  - `codex/README.md`
- Root marketplace metadata exists for both platforms:
  - `.claude-plugin/marketplace.json`
  - `.agents/plugins/marketplace.json`
- Root documentation still describes Claude Code as the root package and Codex as the separated package.

This creates an asymmetric layout. Codex is already package-scoped, while Claude Code still owns the root. That makes installation docs harder to explain and increases the chance that future platform-specific changes leak into the wrong harness.

## Recommended Approach

Use a single repository with two independent package directories:

```text
.
|-- README.md
|-- RELEASE-NOTES.md
|-- LICENSE
|-- .claude-plugin/
|   `-- marketplace.json
|-- .agents/
|   `-- plugins/marketplace.json
|-- claude-code/
|   |-- README.md
|   |-- INSTALL.md
|   |-- .claude-plugin/plugin.json
|   |-- skills/
|   |-- agents/
|   |-- commands/
|   `-- hooks/
|-- codex/
|   |-- README.md
|   |-- INSTALL.md
|   |-- .codex-plugin/plugin.json
|   |-- skills/
|   `-- assets/
|-- docs/
|   |-- installation.md
|   |-- prompts.md
|   `-- ...
`-- tests/
    |-- claude-code/
    `-- codex/
```

The root remains the canonical repository, but no runtime package should assume root-relative Claude Code files. Claude Code and Codex should each be installable and understandable from their own package directory.

## Non-Goals

- Do not split this into two GitHub repositories.
- Do not introduce a shared source generation system for skills.
- Do not rewrite all historical design documents that mention old paths.
- Do not port Claude-only agents, commands, or hooks into Codex unless there is a separate Codex-native design.
- Do not change skill behavior as part of this package-layout migration unless path changes require it.

## Package Boundaries

### Claude Code Package

Move these root paths into `claude-code/`:

- `.claude-plugin/plugin.json` -> `claude-code/.claude-plugin/plugin.json`
- `skills/` -> `claude-code/skills/`
- `agents/` -> `claude-code/agents/`
- `commands/` -> `claude-code/commands/`
- `hooks/` -> `claude-code/hooks/`

Keep root `.claude-plugin/marketplace.json` at the repository root so Claude Code can discover the local marketplace from the cloned repository. Update its plugin source from `./` to `./claude-code`.

The Claude Code package README should explain:

- What the package contains.
- How it differs from the Codex package.
- How to install through the Claude Code marketplace flow.
- How to update.
- How to verify skills, commands, agents, and hooks.
- How to migrate from the old root package layout.

### Codex Package

Keep the existing `codex/` package as the Codex runtime package:

- `codex/.codex-plugin/plugin.json`
- `codex/skills/`
- `codex/assets/`
- `codex/README.md`

Add `codex/INSTALL.md` and make it the canonical Codex installation document. Replace the existing root `.codex/INSTALL.md` with a short compatibility pointer to `codex/INSTALL.md` for one release cycle.

The Codex package README should no longer describe the Claude Code package as the root package. It should describe it as `claude-code/`.

### Repository Root

The root README should become a platform selector and high-level overview:

- Short description of Sonbbal Superpowers.
- Clear package table:
  - Claude Code: `claude-code/`
  - Codex: `codex/`
  - OpenCode: existing support docs, unchanged by this migration.
- Quick install sections for Claude Code and Codex.
- Paste-ready installation prompts for Claude Code and Codex.
- Links to detailed platform guides.
- Current workflow and skill list summary.

Root should not claim that Claude Code skills live in root `skills/`.

## Installation Prompt Design

Add paste-ready prompts that users can give directly to Claude Code or Codex. These prompts should be stored in `docs/prompts.md` and referenced from the root README and platform README files.

### Claude Code Prompt

The Claude Code prompt should ask Claude Code to install or update the package for the current project context. It should instruct the agent to:

1. Treat the current working directory as the user's project root.
2. Verify Git is available.
3. Add the Sonbbal marketplace when it is not already registered:
   - `/plugin marketplace add Sonbbal/superpowers`
4. Install or update the Claude Code package:
   - `/plugin install sonbbal-superpowers@sonbbal-marketplace`
   - or `/plugin update sonbbal-superpowers` if already installed.
5. Confirm that the installed package points at the `claude-code/` package, not the repository root.
6. Ask the user to restart or start a new Claude Code session after install or update.
7. Verify expected skills and commands are visible after restart.

Because Claude Code slash commands often need direct user execution, the prompt should tell the agent to output exact commands when it cannot run them itself.

### Codex Prompt

The Codex prompt should ask Codex to install or update the Codex package for the current environment. It should instruct the agent to:

1. Treat the current working directory as the user's project root.
2. Clone or update `https://github.com/Sonbbal/superpowers.git` at `~/.codex/superpowers`.
3. Prefer Codex plugin metadata when the environment supports it.
4. Otherwise create or refresh the native skill discovery symlink:
   - `~/.agents/skills/sonbbal-superpowers-codex` -> `~/.codex/superpowers/codex/skills`
5. Use a Windows junction instead of a symlink on Windows.
6. Verify that `using-superpowers` and the other Codex-compatible skills are present under `codex/skills`.
7. Tell the user to restart Codex so native skill discovery reloads the package.

The prompt should be written so Codex can execute the shell steps directly when permissions allow, while still giving manual commands if it cannot.

## Documentation Plan

Update or create these current-user-facing documents:

- `README.md`: rewrite as the cross-platform landing page.
- `claude-code/README.md`: new Claude Code package guide.
- `claude-code/INSTALL.md`: new Claude Code install/update/migration guide.
- `codex/README.md`: update references to the new `claude-code/` package.
- `codex/INSTALL.md`: new canonical Codex install/update guide.
- `docs/installation.md`: detailed platform install, update, uninstall, migration, and verification reference.
- `docs/prompts.md`: paste-ready install/update prompts for Claude Code and Codex.
- `RELEASE-NOTES.md`: add a breaking-change note explaining that the Claude Code package moved from root to `claude-code/`.

Historical design documents under `docs/plans/` can keep their original paths because they document earlier work. Only current installation and usage documentation should be updated.

## Test Plan

Add or update tests so the package split is enforced:

- Claude Code package test:
  - Root `.claude-plugin/marketplace.json` exists.
  - Marketplace plugin source is `./claude-code`.
  - `claude-code/.claude-plugin/plugin.json` exists.
  - `claude-code/skills/using-superpowers/SKILL.md` exists.
  - `claude-code/hooks/session-start.sh` exists.
  - `claude-code/commands/brainstorm.md` exists.
  - Root `skills/`, `agents/`, `commands/`, and `hooks/` no longer exist as runtime package directories.
- Codex package test:
  - Root `.agents/plugins/marketplace.json` still points to `./codex`.
  - `codex/.codex-plugin/plugin.json` points skills at `./skills`.
  - `codex/INSTALL.md` exists.
  - Codex install docs reference `codex/skills` and `~/.agents/skills/sonbbal-superpowers-codex`.
- Documentation test:
  - Current docs do not describe root `skills/` as the Claude Code package path.
  - Current docs mention `claude-code/` and `codex/` as platform package roots.

Existing historical plan files should be excluded from strict path-reference checks.

## Migration Steps

1. Create `claude-code/`.
2. Move Claude Code runtime package files into `claude-code/` with `git mv`.
3. Update root `.claude-plugin/marketplace.json` to use `source: "./claude-code"`.
4. Add `claude-code/README.md` and `claude-code/INSTALL.md`.
5. Add `codex/INSTALL.md`.
6. Update `codex/README.md` to reference `claude-code/` instead of the root Claude Code package.
7. Rewrite root `README.md`.
8. Add `docs/installation.md` and `docs/prompts.md`.
9. Update tests for the new package layout.
10. Run package compatibility tests:
    - `bash tests/codex/run-tests.sh`
    - Claude Code package-layout test once added.
11. Review all current-user-facing documentation for stale root package references.

## Risks And Mitigations

### Breaking Existing Claude Code Installs

Existing users may have installed the root package. Moving the source to `./claude-code` is a breaking layout change for local development marketplace users.

Mitigation:

- Keep root `.claude-plugin/marketplace.json` stable.
- Add migration instructions to `README.md`, `claude-code/INSTALL.md`, and `RELEASE-NOTES.md`.
- Tell users to run `/plugin update sonbbal-superpowers` or reinstall if update does not pick up the source change.

### Stale Documentation

Many historical docs mention root `skills/`. Updating every historical reference would create noisy churn and distort past design records.

Mitigation:

- Update current installation and usage docs.
- Exclude historical `docs/plans/` from strict stale-reference checks.
- Add a short note in `docs/installation.md` that older design docs may mention pre-split paths.

### Hook Path Assumptions

Claude Code hooks currently derive the plugin root from the hook script path and read `skills/using-superpowers/SKILL.md` relative to that root. This should continue to work after moving hooks and skills together under `claude-code/`.

Mitigation:

- Verify `claude-code/hooks/session-start.sh` reads `claude-code/skills/using-superpowers/SKILL.md`.
- Add a package-layout test for this path relationship.

### Marketplace Compatibility

The exact behavior of marketplace source paths depends on the harness. The repository root marketplace file should use a relative source path and should not require users to clone a different repository.

Mitigation:

- Preserve root marketplace metadata.
- Only change the plugin source path from `./` to `./claude-code`.
- Document the package path explicitly.

## Success Criteria

- The root is no longer a Claude Code runtime package.
- Claude Code runtime files live under `claude-code/`.
- Codex runtime files remain under `codex/`.
- Both packages have their own README and install guide.
- Root README clearly explains which package to use for each platform.
- Paste-ready install/update prompts exist for Claude Code and Codex.
- Tests enforce the new package boundaries.
- Codex compatibility tests still pass.
- Claude Code package-layout tests pass.
