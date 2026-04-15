# VCS Operations Reference

Skills describe VCS operations abstractly. Use the column matching your VCS (injected as `VCS: git` or `VCS: jj` in session context) for concrete commands.

## Key Conceptual Differences

Before using the command table, understand how the two VCS models differ:

- **No staging area in jj.** The working copy is automatically tracked. `jj describe` sets the commit message for the current change; `jj new` starts a new change. This replaces git's add/commit workflow.
- **Bookmarks, not branches.** jj "bookmarks" map to git branches on push, but they're optional — jj works with anonymous revisions by default. You only need a bookmark when pushing to a remote.
- **Change IDs, not SHAs.** jj identifies revisions by change ID (a stable identifier that survives rewrites). Review commands use revision expressions (`@` for current, `trunk()` for main branch, change IDs) rather than SHA ranges.
- **Workspaces don't auto-create named refs.** Unlike git worktrees (which require a branch), jj workspaces create a new working copy at a revision. Create a bookmark explicitly if you want a named ref.

## Operation Mapping

| Operation | git | jj |
|-----------|-----|-----|
| **Workspace isolation** | | |
| Detect project root | `git rev-parse --show-toplevel` | `jj root` |
| Create isolated workspace | `git worktree add "$path" -b "$BRANCH"` | `jj workspace add "$path"` |
| Remove workspace | `git worktree remove "$path"` | `jj workspace forget "$workspace_name" && rm -rf "$path"` |
| List workspaces | `git worktree list` | `jj workspace list` |
| Check if in linked workspace | `GIT_DIR=$(cd "$(git rev-parse --git-dir)" && pwd -P)` / `GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)` / compare: `GIT_DIR != GIT_COMMON` | `jj workspace list` — if current directory's workspace name is not `default`, you are in a linked workspace |
| **Branching & bookmarks** | | |
| Create named ref | `git checkout -b "$name"` | `jj bookmark create "$name"` |
| Current ref name | `git branch --show-current` | `jj bookmark list` (look for bookmark at current revision) |
| Determine base | `git merge-base HEAD main` | `jj log -r 'trunk()' --no-graph -T 'change_id ++ "\n"' \| head -1` |
| **History & review** | | |
| Show diff for range | `git diff $BASE..$HEAD` | `jj diff -r "$rev"` |
| Diff stats for range | `git diff --stat $BASE..$HEAD` | `jj diff --stat -r "$rev"` |
| Log recent history | `git log --oneline` | `jj log --no-graph` |
| Current revision identifier | `git rev-parse HEAD` | `jj log -r @ --no-graph -T 'change_id ++ "\n"' \| head -1` |
| **Committing** | | |
| Stage and commit | `git add <files> && git commit -m "msg"` | `jj describe -m "msg" && jj new` |
| **Integration** | | |
| Merge to base | `git checkout $base && git merge $feature` | `jj new $base_rev $feature_rev` (creates merge commit) |
| Push to remote | `git push -u origin "$branch"` | `jj git push -b "$bookmark"` |
| **Safety** | | |
| Check if directory is ignored | `git check-ignore -q "$dir"` | `git check-ignore -q "$dir"` (jj uses .gitignore) |
| Discard feature work | `git branch -D "$name"` | `jj abandon "$rev"` |
