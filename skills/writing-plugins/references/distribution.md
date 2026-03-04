# Plugin Distribution

## Distribution Strategies

| Audience | Strategy | Scope |
|----------|----------|-------|
| Just me | `--plugin-dir` or directory source | Session / local |
| My team | `extraKnownMarketplaces` in project `.claude/settings.json` | Project |
| Public (small) | Git repo + marketplace.json | User (manual install) |
| Public (broad) | Official marketplace submission | Global |

## Marketplace Types

### Hub Marketplace (URL Sources)

A single `marketplace.json` that points to individual plugin repos via URL:

```json
{
  "name": "my-marketplace",
  "owner": { "name": "Your Name" },
  "plugins": [
    {
      "name": "my-plugin",
      "source": {
        "source": "url",
        "url": "https://github.com/user/my-plugin.git"
      },
      "description": "What it does"
    }
  ]
}
```

**Advantages:** Each plugin has its own repo, independent versioning, independent git history.

### Monorepo Marketplace (Relative Paths)

All plugins in one repo with relative path sources:

```json
{
  "name": "team-plugins",
  "owner": { "name": "Team" },
  "metadata": {
    "pluginRoot": "./plugins"
  },
  "plugins": [
    {
      "name": "formatter",
      "source": "formatter",
      "description": "Code formatter"
    }
  ]
}
```

**Advantages:** Single repo, atomic cross-plugin changes. **Limitation:** All plugins share the same version/release cycle.

### npm/pip Sources

For plugins distributed as packages:

```json
{
  "name": "my-plugin",
  "source": {
    "source": "npm",
    "package": "@scope/claude-plugin-x",
    "version": "^1.0.0"
  }
}
```

## Version Management

### Where to set the version

Set version in **one place only**. If both `plugin.json` and `marketplace.json` have a version, `plugin.json` wins silently.

| Distribution | Set version in |
|-------------|---------------|
| Relative-path marketplace | `marketplace.json` plugin entry |
| URL/git source | `plugin.json` |
| npm/pip | Package manager (package.json / pyproject.toml) |
| Personal plugins (SHA caching) | Neither — let git SHA be the cache key |

### Bumping versions

Follow semver: `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes (renamed skills, removed hooks)
- **MINOR:** New components, new features
- **PATCH:** Bug fixes, documentation

If you change code without bumping version, existing users won't see changes.

## Project-Scoped Distribution

Share a plugin with your team via project settings:

```json
// .claude/settings.json (committed to repo)
{
  "extraKnownMarketplaces": {
    "team-tools": {
      "source": {
        "source": "url",
        "url": "https://github.com/team/claude-plugins.git"
      }
    }
  },
  "enabledPlugins": {
    "our-plugin@team-tools": true
  }
}
```

Team members see a trust prompt when opening the project for the first time.

## Official Marketplace Submission

Submit at [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit) or [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit).

Requirements:
- Public git repository
- Valid `plugin.json` with name, description, author
- LICENSE file
- Passes `claude plugin validate .`

## CLI Reference

```bash
# Register a marketplace
claude plugin marketplace add <name> --url <git-url>
claude plugin marketplace add <name> --path <local-path>

# Update marketplace index
claude plugin marketplace update <name>

# Install and enable
claude plugin install <plugin>@<marketplace>
claude plugin enable <plugin>@<marketplace>

# Manage
claude plugin disable <plugin>@<marketplace>
claude plugin uninstall <plugin>@<marketplace>
claude plugin update <plugin>@<marketplace>
```

**Install before enable** — enable fails silently if not installed first.

## Auto-Updates

- Official marketplaces: auto-update enabled by default
- Third-party: disabled by default, toggle per marketplace in UI
- Private repos: require `GITHUB_TOKEN`/`GH_TOKEN` in environment (credential helpers can't prompt at startup)
- Override: `DISABLE_AUTOUPDATER=true` disables all updates; `FORCE_AUTOUPDATE_PLUGINS=true` keeps plugin updates while disabling Claude Code updates
