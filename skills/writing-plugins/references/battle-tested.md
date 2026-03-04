# Battle-Tested Patterns

Patterns and gotchas from building and maintaining 17 production Claude Code plugins.

## Hub Marketplace Architecture

A hub marketplace (`workbench/marketplace.json`) indexes plugins via URL sources to individual repos. Each plugin is independently versioned and tracked.

```
workbench/
└── marketplace.json    # URL sources to 17+ plugin repos
```

**Workflow:**
```bash
# Edit plugin source in its own repo
cd ~/Projects/my-plugin
# ... make changes ...
git commit && git push

# Update the hub index
unset CLAUDECODE
claude plugin marketplace update workbench

# Reload
# /reload-plugins in TUI
```

**Key rule:** Push the plugin repo before updating the marketplace. The update command clones from remote.

## Plugin Identity and Narrative Routing

Skills route to plugins based on **narrative/identity**, not functional taxonomy.

| Plugin | Identity | Example Skills |
|--------|----------|---------------|
| essentials | Rhythm of your day | good-morning, coffee-break, good-evening |
| dev-toolkit | Tools for building | logging, release pipelines, dependency audit |
| rules | Code standards | language rules, security, git workflow |
| codex | Working with Claude | session hygiene, communication, constraints |

**Principle:** `tidy-your-workspace` touches git but lives in essentials because it's part of the desk rhythm narrative, not dev-toolkit. Route by story, not by function.

## Cache Gotchas

### Cache key derivation (three-layer fallback)

```
plugin.json.version → marketplace.json.version → gitCommitSha → "1.0.0"
```

For personal plugins: **omit version from both layers** so the git SHA becomes the cache key. Every push gets a fresh entry.

### Cache never garbage-collects

Old version directories in `~/.claude/plugins/cache/` persist forever. Stale versions can shadow the active one.

**Mitigation:** Include cache cleanup in setup scripts:

```bash
# Nuclear option: remove all cached versions (re-downloads on next load)
rm -rf ~/.claude/plugins/cache/<marketplace>/<plugin>/
```

### Removing a marketplace wipes enabledPlugins

`claude plugin marketplace remove <name>` deletes ALL `enabledPlugins` entries for that marketplace from settings.json. No confirmation, no recovery.

**Always backup settings.json before removing a marketplace.**

## Ghost Hooks

Uninstalling a plugin doesn't clean up its hooks from `settings.json`. References persist to deleted cache paths.

**Fix:** After removing a plugin, audit `settings.json` for orphaned hook entries.

## Thin Wrapper Pattern

Force command namespacing by creating a command that delegates to a skill:

```
my-plugin/
├── commands/init.md       ← thin wrapper (forces /plugin:init namespace)
└── skills/init/SKILL.md   ← actual logic
```

Command file (`commands/init.md`):

```markdown
---
description: Initialize the tool
allowed-tools: Read, Write, Edit, Bash
---

Run the init skill. Read skills/init/SKILL.md and follow it exactly.
```

**Why:** The `/plugin:command` colon-qualified form only appears when a command name collides with another plugin's command or skill. Thin wrappers force the collision intentionally.

## Fork-Sync Methodology

For maintaining forked plugins while consuming upstream changes:

```bash
# Consume upstream history without taking changes
git merge -s ours upstream/main

# Cherry-pick or manually apply what fits
git cherry-pick <commit>
```

**`merge -s ours`** advances the merge base so next sync only shows genuinely new commits. GitHub shows "0 commits behind" without polluting the working tree.

**Evaluation framework:** For each upstream change, ask "does it fit?" not just "does it conflict?" Consider:
- Platform scope (Claude Code only vs. multi-platform)
- Conventions (your patterns vs. upstream's)
- Dead code (skills/tests that don't apply)

## URL-Source Startup Cost

Every URL-source plugin does a full `git clone` to a temp directory on startup, even when the cache already has the correct SHA.

**Impact:** 15 plugins = ~10.6 seconds of redundant cloning on cold start.

**Mitigation:** Use directory source (`"source": "directory"`) for plugins under active development. Reserve URL sources for stable plugins.

## Development Tips

### Nested CLI requires unset CLAUDECODE

Running `claude` commands inside a Claude Code session fails due to nesting detection:

```bash
unset CLAUDECODE && claude plugin marketplace update workbench
```

### Install before enable

`claude plugin enable` fails silently if the plugin hasn't been installed. Always:

```bash
claude plugin install my-plugin@marketplace
claude plugin enable my-plugin@marketplace
```

### Forked repos default to upstream tracking

After cloning a fork, `main` may track `upstream/main` instead of `origin/main`:

```bash
git push -u origin main  # Fix tracking after clone
```

### No standalone marketplace.json in hub plugins

Plugins distributed via a hub marketplace don't need their own `marketplace.json`. It creates version field conflicts and is vestigial.

### Scripts must be executable

Hook and utility scripts need the execute bit. Easy to forget:

```bash
chmod +x scripts/*.sh
```

## Anti-Patterns

| Pattern | Problem | Better |
|---------|---------|--------|
| Version in both plugin.json and marketplace.json | Manifest wins silently, confusion | Set in one place only |
| Absolute paths in hooks/MCP | Break after cache copy | `${CLAUDE_PLUGIN_ROOT}` |
| Components inside `.claude-plugin/` | Not discovered | Components at plugin root |
| `commands/` for new work | Legacy format | `skills/name/SKILL.md` |
| Global URL plugins for dev iteration | 10s+ startup, clones every time | Directory source for dev |
| Large SKILL.md (500+ lines) | Context waste | Progressive disclosure to `references/` |
