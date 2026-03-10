# Worktree Lifecycle Management

Superpowers automatically manages the lifecycle of git worktrees, ensuring they're cleaned up when no longer needed.

## How It Works

### 1. Registration

When `using-git-worktrees` creates a worktree, it registers it in `~/.config/superpowers/worktree-registry.json`:

```json
{
  "id": "wt_1234567890_feature_auth",
  "path": "/tmp/worktrees/feature-auth",
  "branch": "feature/auth-system",
  "project_root": "/Users/jason/myapp",
  "created_at": "2026-03-10T10:00:00Z",
  "status": "active"
}
```

### 2. Status Tracking

Worktrees progress through these states:

- **active** - Currently in development
- **pr_opened** - Pull request has been opened
- **merged** - Branch has been merged to main
- **abandoned** - Branch was deleted without merging
- **cleanup_pending** - Scheduled for garbage collection

### 3. Automatic Detection

The garbage collection daemon (or manual detection) checks:

- Does the branch still exist?
- Is there an open PR for this branch?
- Has the PR been merged?

### 4. Safe Cleanup

Cleanup only happens when:

1. Status is `cleanup_pending`
2. Worktree has no uncommitted changes
3. Delay period has passed (default: 1 hour for merged, immediate for abandoned)

## Installation

### Enable GC Daemon (Recommended)

```bash
# Start daemon on login
ln -s ~/.config/superpowers/lib/worktree-gc-daemon ~/Library/LaunchAgents/  # macOS
# OR
echo "@reboot ~/.config/superpowers/lib/worktree-gc-daemon" | crontab -  # Linux
```

### Install Git Hooks

For automatic cleanup after merge:

```bash
# In your repository
cp ~/.config/superpowers/lib/hooks/post-merge .git/hooks/
chmod +x .git/hooks/post-merge
```

## Manual Commands

```bash
# List worktrees for current project
~/.config/superpowers/lib/worktree-manager list

# Check for status changes
~/.config/superpowers/lib/worktree-manager detect

# Run garbage collection manually
~/.config/superpowers/lib/worktree-manager gc

# Force cleanup of specific worktree
~/.config/superpowers/lib/worktree-manager unregister <id>
```

## Configuration

Edit `~/.config/superpowers/worktree-registry.json`:

```json
{
  "metadata": {
    "gc_policy": {
      "enabled": true,
      "interval_hours": 1,
      "cleanup_delay_hours": 24,
      "max_age_days": 30
    }
  }
}
```

- **enabled**: Turn GC on/off
- **interval_hours**: How often to check for cleanup
- **cleanup_delay_hours**: Grace period after merge
- **max_age_days**: Auto-cleanup worktrees older than this

## Safety Guarantees

1. **Never deletes worktrees with uncommitted changes**
2. **Never deletes active worktrees**
3. **Always provides grace period for merged branches**
4. **Logs all cleanup actions** to `~/.config/superpowers/worktree-gc.log`

## Integration with Finishing Branch

When you use the `finishing-a-development-branch` skill:

1. If merging locally, post-merge hook triggers cleanup
2. If creating PR, worktree status updates to `pr_opened`
3. When PR is merged, GitHub webhook (future) or GC daemon detects and schedules cleanup

## Troubleshooting

### Worktree not cleaned up

```bash
# Check status
~/.config/superpowers/lib/worktree-manager find <branch>

# Manually mark for cleanup
~/.config/superpowers/lib/worktree-manager update <id> cleanup_pending

# Run GC
~/.config/superpowers/lib/worktree-manager gc
```

### Accidentally cleaned up

Check logs:
```bash
cat ~/.config/superpowers/worktree-gc.log
```

The registry maintains history of all worktrees created.
