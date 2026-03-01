# Task 12: Add worktree env guidance + fix hooks (L3 env files, L3 hook fixes)

**Depends on:** None
**Produces:** Environment file guidance in worktree skill and bug fixes in session-start hook

## Goal

Add post-creation guidance for copying environment files (.env, database configs, MCP dirs) to new worktrees (from issues #521, #220, #241). Fix three bash compatibility bugs in session-start hook (from PRs #572, #584/#585, #553).

## Acceptance Criteria

- [ ] `using-git-worktrees/SKILL.md` has a section about copying environment files after worktree creation
- [ ] `hooks/session-start` is compatible with bash 5.3 (no heredoc hang)
- [ ] `hooks/session-start` handles Linux variable expansion correctly
- [ ] `hooks/session-start` is POSIX-compatible for Ubuntu/dash

## Files

- Modify: `skills/using-git-worktrees/SKILL.md` — add env file section to "After Creation"
- Modify: `hooks/session-start` — fix bash compatibility issues

## Implementation Notes

**Worktree env files (issues #521, #220, #241):** Add as step 1.5 (after CLAUDE.md check, before project setup) in the "After Creation" section:
```markdown
### 1.5. Copy Environment Files

Worktrees share the git repository but NOT untracked files. Copy these if they exist:

```bash
# From the repo root (worktree.repo_root in state.yml):
REPO_ROOT="$(git rev-parse --show-superproject-working-tree 2>/dev/null || git worktree list --porcelain | head -1 | sed 's/worktree //')"

# Environment files
[ -f "$REPO_ROOT/.env" ] && cp "$REPO_ROOT/.env" .
[ -f "$REPO_ROOT/.env.local" ] && cp "$REPO_ROOT/.env.local" .

# Database configs
[ -f "$REPO_ROOT/database.yml" ] && cp "$REPO_ROOT/database.yml" .

# MCP configuration
[ -d "$REPO_ROOT/.mcp" ] && cp -r "$REPO_ROOT/.mcp" .

# Check CLAUDE.md for project-specific files to copy
```

**If the user's project has unusual env files, ask which ones to copy.**
```

**Hook fixes:** The current `hooks/session-start` script (read above) has three potential issues:

1. **Bash 5.3 heredoc hang (PR #572):** The `cat <<EOF` at line 41 can hang on bash 5.3 when the JSON contains escaped characters that interact with heredoc expansion. Fix: use `cat <<'EOF'` (single-quoted delimiter) to prevent variable expansion in the heredoc, since the variables are already interpolated into `session_context`.

2. **Linux variable expansion (PRs #584/#585):** The `$'\n'` and `$'\r'` syntax in the `escape_for_json` function uses ANSI-C quoting which may not work in all POSIX shells. For bash-specific scripts this is fine (shebang is `#!/usr/bin/env bash`), but verify the shebang is present and correct.

3. **Ubuntu/dash compatibility (PR #553):** The `${BASH_SOURCE[0]:-$0}` pattern and `set -euo pipefail` are bash-specific. Since the shebang specifies bash, this is acceptable, but add a comment noting the bash requirement.

**Primary fix:** Change line 41 from `cat <<EOF` to `cat <<'EOF'` to prevent the heredoc hang on bash 5.3. The variables `session_context` is already fully constructed before the heredoc, so no expansion is needed inside it.

**Secondary fix:** Add a comment at the top noting bash requirement:
```bash
# Requires bash (not sh/dash) — uses ANSI-C quoting and arrays
```

## Verification

```bash
grep -c "env" skills/using-git-worktrees/SKILL.md       # should be >= 2 (env file section)
grep -c "cat <<'EOF'" hooks/session-start                 # should be 1 (quoted heredoc)
head -3 hooks/session-start                                # should show bash shebang + comment
```

## Commit

`fix: add worktree env file guidance and fix hook bash compatibility (#521, #572, #584)`
