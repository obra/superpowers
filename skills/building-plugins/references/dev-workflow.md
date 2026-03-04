# Plugin Development Workflow

## Local Development (Fastest)

Test your plugin without installing it:

```bash
claude --plugin-dir ./my-plugin
```

Load multiple plugins:

```bash
claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two
```

Changes to skills and commands are picked up on next invocation. Hook and MCP changes require restarting the session.

## Directory Source (Persistent Local)

For plugins you always want loaded during development, register as a directory source in project-level settings:

```json
// .claude/settings.local.json
{
  "extraKnownMarketplaces": {
    "local-dev": {
      "source": {
        "source": "directory",
        "path": "/absolute/path/to/my-plugin"
      }
    }
  },
  "enabledPlugins": {
    "my-plugin@local-dev": true
  }
}
```

**Advantages:** No cache copy, changes are live, no push/update cycle.
**Limitation:** Absolute paths — not portable across machines. Use `--plugin-dir` for quick testing, directory source for ongoing development.

## Marketplace Workflow

Once your plugin is ready for distribution:

```
edit source → git commit → git push → marketplace update → /reload-plugins
```

The full command sequence:

```bash
# 1. Commit and push plugin source
cd /path/to/my-plugin
git add -A && git commit -m "feat(scope): description"
git push

# 2. Update the marketplace (fetches from REMOTE, not local)
unset CLAUDECODE  # Required when running inside a Claude Code session
claude plugin marketplace update <marketplace-name>

# 3. Reload in your session
# Type /reload-plugins in the Claude Code TUI
```

**Critical:** Push before update. The marketplace update command clones from the remote, not your local working directory.

## Debugging

### Plugin loading issues

```bash
claude --debug
```

Shows which plugins load, component registration, and initialization errors.

### Component-level debugging

| Problem | Check |
|---------|-------|
| Skill not appearing | `/plugin` menu → check Errors tab |
| Hook not firing | Is script executable? (`chmod +x`) Does matcher regex match? |
| MCP server not starting | Does command exist? Are paths using `${CLAUDE_PLUGIN_ROOT}`? |
| Agent not in `/agents` | Restart session — agents load at startup |
| Stale version loaded | Check `~/.claude/plugins/cache/` for old version directories |

### Validation

```bash
# Validate plugin structure
claude plugin validate .

# Or from within Claude Code TUI
# /plugin validate .
```

The `plugin-dev:plugin-validator` agent provides deeper analysis including best practice checks.

## Cache Behavior

Claude Code copies marketplace plugins to `~/.claude/plugins/cache/`. Understanding the cache is critical:

### Version resolution (three-layer fallback)

```
plugin.json version → marketplace.json version → git commit SHA → "1.0.0"
```

If you change code but don't bump the version, existing installs won't see changes.

### Cache never garbage-collects

Old version directories persist indefinitely. Stale versions can shadow active ones.

**Workaround:** Periodically clean the cache:

```bash
# Remove all cached versions of a plugin (it will re-download on next load)
rm -rf ~/.claude/plugins/cache/<marketplace-name>/<plugin-name>/
```

### For personal plugins: skip the version field

If distributed via a hub marketplace with URL sources, omit `version` from both `plugin.json` and `marketplace.json`. The cache key falls through to the git commit SHA, so every push gets a fresh cache entry.

## Testing Checklist

Before distributing, verify:

- [ ] `claude --plugin-dir ./my-plugin` loads without errors
- [ ] Each skill appears in `/` autocomplete (or Claude invokes it contextually)
- [ ] Each hook fires on its target event
- [ ] Each agent appears in `/agents`
- [ ] MCP server tools appear in Claude's toolkit
- [ ] Scripts are executable (`chmod +x`)
- [ ] All paths use `${CLAUDE_PLUGIN_ROOT}` (not absolute paths)
- [ ] `claude plugin validate .` passes
