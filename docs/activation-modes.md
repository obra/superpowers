# Activation Modes

Superpowers supports multiple activation modes to fit your workflow.

## Modes

### `always` (Default)
Superpowers activates on every session. Maximum automation.

```yaml
# .superpowers/config.yaml
activation:
  mode: always
```

### `opt-in`
Superpowers only activates when explicitly enabled.

```yaml
activation:
  mode: opt-in
```

Then create the enable marker:
```bash
touch .superpowers/enabled
```

### `opt-out`
Superpowers activates unless explicitly disabled.

```yaml
activation:
  mode: opt-out
```

To disable for a specific project:
```bash
touch .superpowers/disabled
```

### `never`
Superpowers never activates (but remains installed).

```yaml
activation:
  mode: never
```

## Activation Levels

Control how much of Superpowers loads:

### `full` (Default)
Complete workflow: brainstorming, TDD, subagent-driven-development, etc.

```yaml
activation:
  level: full
```

### `lightweight`
Only core skills: brainstorming, using-superpowers.

```yaml
activation:
  level: lightweight
```

### `minimal`
Only using-superpowers skill.

```yaml
activation:
  level: minimal
```

## Context-Aware Activation

Superpowers can adapt based on git context:

```yaml
activation:
  context_aware:
    # Don't activate when on main/master branch
    disable_on_main_branch: true
    
    # Use lightweight mode in detached HEAD
    lightweight_on_detached_head: true
    
    # Only activate in git repositories
    require_git_repo: true
```

## Per-Skill Control

Fine-grained control over individual skills:

```yaml
skills:
  brainstorming:
    enabled: true
    auto_trigger: true
    
  test-driven-development:
    enabled: true
    enforce_red_green_refactor: true
    
  dispatching-parallel-agents:
    enabled: false  # Disable advanced feature
```

## Environment Variable Override

Quick toggle without editing config:

```bash
# Disable for this session
export SUPERPOWERS_MODE=disabled

# Force enable
export SUPERPOWERS_MODE=enabled
```

## Commands

In Claude Code, use these commands:

- `/superpowers on` - Enable for this project
- `/superpowers off` - Disable for this project
- `/superpowers level full|lightweight|minimal` - Change activation level
- `/superpowers status` - Show current configuration

## Migration from Older Versions

If you have custom skills in `~/.config/superpowers/skills`, move them:

```bash
mkdir -p ~/.claude/skills
mv ~/.config/superpowers/skills/* ~/.claude/skills/
rmdir ~/.config/superpowers/skills
```

This removes the migration warning from startup.
