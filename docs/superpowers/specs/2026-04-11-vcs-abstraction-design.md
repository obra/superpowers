# VCS Abstraction Design — git/jj Support

## Goal

Let superpowers users choose their version control system (git or jj) as a user-level preference. Skills describe *what* to do; a reference doc maps operations to concrete commands per VCS.

## Motivation

Superpowers skills currently hardcode git commands throughout. Users of jj (Jujutsu) — which can operate on git repos transparently — cannot use superpowers idiomatically. Different contributors to the same project may use different VCS tools, so this must be a user-level choice, not a project-level setting.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | User-level preference | Different people on same project may use different VCS |
| Config location | `~/.config/superpowers/config.json` | User-scoped, survives plugin updates, path already referenced in codebase |
| Default | `git` | Zero breakage for existing users |
| Injection mechanism | Session-start hook | Already runs every session, context visible to all skills before they fire |
| Command mapping | Single reference doc | Skills stay readable, single source of truth, easy to extend |
| Skill naming | VCS-neutral renames | `using-workspaces`, `finishing-development-work` |
| jj workspace isolation | `jj workspace add` | Native jj equivalent to git worktrees |

## Architecture

### 1. User Configuration

File: `~/.config/superpowers/config.json`

```json
{
  "vcs": "jj"
}
```

- Default: `"git"` if file missing or key absent
- Accepted values: `"git"`, `"jj"`. Anything else falls back to `"git"` with a warning in context.

### 2. Session-Start Hook Changes

File: `hooks/session-start`

The hook reads the config file and injects the VCS preference into the session context alongside the existing superpowers bootstrap.

```bash
VCS="git"  # default
CONFIG_FILE="${HOME}/.config/superpowers/config.json"
if [ -f "$CONFIG_FILE" ]; then
    detected=$(grep -o '"vcs"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | grep -o '"[^"]*"$' | tr -d '"')
    if [ -n "$detected" ]; then
        VCS="$detected"
    fi
fi
```

Appended to `session_context`:

```
VCS: ${VCS}

Your user uses ${VCS} for version control. When skills reference VCS operations, use the ${VCS} column from references/vcs-operations.md for concrete commands.
```

No new dependencies. Pure bash, grep-based JSON parsing. Matches hook's zero-dependency approach.

Validation: only `git` or `jj` accepted. Anything else falls back to `git` with warning.

### 3. VCS Operations Reference Doc

New file: `skills/using-superpowers/references/vcs-operations.md`

Sits alongside existing `codex-tools.md` — same pattern (reference doc mapping), different axis (VCS instead of harness).

#### Operation Mapping

| Operation | git | jj |
|-----------|-----|-----|
| **Workspace isolation** | | |
| Detect project root | `git rev-parse --show-toplevel` | `jj root` |
| Create isolated workspace | `git worktree add "$path" -b "$BRANCH"` | `jj workspace add "$path"` |
| Remove workspace | `git worktree remove "$path"` | `jj workspace forget "$name"` + rm |
| List workspaces | `git worktree list` | `jj workspace list` |
| Check if in workspace | `GIT_DIR != GIT_COMMON` | `jj workspace list` shows multiple |
| **Branching & bookmarks** | | |
| Create named ref | `git checkout -b "$name"` | `jj bookmark create "$name"` |
| Current ref name | `git branch --show-current` | `jj bookmark list` (active) |
| Determine base | `git merge-base HEAD main` | `jj log -r 'trunk()'` |
| **History & review** | | |
| Show diff | `git diff A..B` | `jj diff -r "$rev"` |
| Diff stats | `git diff --stat A..B` | `jj diff --stat -r "$rev"` |
| Log | `git log --oneline` | `jj log --no-graph` |
| Current revision | `git rev-parse HEAD` | `jj log -r @ --no-graph -T 'change_id'` |
| **Committing** | | |
| Stage + commit | `git add . && git commit -m "msg"` | `jj describe -m "msg" && jj new` |
| **Integration** | | |
| Merge to base | `git checkout base && git merge feat` | `jj new trunk() feat-rev` |
| Push | `git push -u origin "$branch"` | `jj git push -b "$bookmark"` |
| **Safety** | | |
| Check ignore | `git check-ignore -q "$dir"` | Check `.gitignore` (jj respects it) |
| Discard workspace | `git branch -D "$name"` | `jj abandon "$rev"` |

#### Key Conceptual Differences

The reference doc must call out these differences so the agent understands the mental model, not just the command mapping:

- **No staging area in jj.** `jj describe` + `jj new` replaces add/commit. The working copy is automatically tracked.
- **Bookmarks, not branches.** jj "bookmarks" map to git branches on push, but they're optional — jj works with anonymous revisions by default.
- **Change IDs, not SHAs.** jj identifies revisions by change ID. Review commands use revision expressions (`@`, `trunk()`, change IDs) rather than SHA ranges.
- **Workspaces don't auto-create named refs.** Unlike git worktrees (which require a branch), jj workspaces just create a new working copy at a revision. The skill should prompt to create a bookmark if the user wants a named ref.

### 4. Skill Renames

| Current name | New name |
|-------------|----------|
| `using-git-worktrees` | `using-workspaces` |
| `finishing-a-development-branch` | `finishing-development-work` |

Renamed because: "worktrees" and "branch" are git-specific concepts. jj users think in workspaces, revisions, and bookmarks.

### 5. Skill Content Changes

#### `using-workspaces` (heavy rewrite)

- All git commands replaced with abstract descriptions: "create isolated workspace", "verify directory is ignored", "detect project root"
- Each operation references `references/vcs-operations.md` for concrete commands
- Workflow stays identical: directory selection → safety verification → creation → setup → test baseline
- One jj-specific callout: jj workspaces don't auto-create a named ref, so the skill prompts to create a bookmark if the user wants one

#### `finishing-development-work` (moderate rewrite)

- "Determine Base Branch" becomes "Determine Base" — git: `merge-base`, jj: `trunk()`
- Option 1 "Merge locally" — abstract merge operation
- Option 2 "Push and create PR" — abstract push, `gh pr create` stays identical (both VCS push to git remotes)
- Option 4 "Discard" — `abandon` vs `branch -D`
- Worktree cleanup becomes workspace cleanup

#### `requesting-code-review` + `code-reviewer.md` (light rewrite)

- SHA extraction becomes "get current revision identifier"
- `git diff` becomes "show diff for revision range"
- Template placeholders renamed: `{BASE_SHA}` → `{BASE_REV}`, `{HEAD_SHA}` → `{HEAD_REV}` (generic term covering both git SHAs and jj change IDs)
- Commands reference vcs-operations doc

#### `writing-plans` (light touch)

- Commit step example shows abstract "stage and commit" with reference to vcs-operations
- Rest of skill is VCS-agnostic already

#### `subagent-driven-development` + `executing-plans` (minimal)

- Replace `using-git-worktrees` references with `using-workspaces`
- Replace `finishing-a-development-branch` with `finishing-development-work`
- Integration sections updated

#### `codex-tools.md` (moderate)

- Environment detection section gets VCS-conditional logic
- jj equivalent: `jj root` instead of `git rev-parse --show-toplevel`, `jj workspace list` instead of GIT_DIR/GIT_COMMON comparison

#### Test scaffolds (`tests/`)

- Keep as git. Test scaffolds create throwaway repos to exercise superpowers skill behavior — they're test infrastructure, not user-facing workflow. Adding VCS-conditional logic here adds complexity with no user benefit. If jj-specific test scaffolds are needed later, add them then.

### 6. What Doesn't Change

- **Skill workflow logic** — directory selection priority, safety verification, test baseline, review stages, 4-option finish menu. Identical.
- **brainstorming, test-driven-development, systematic-debugging, verification-before-completion, dispatching-parallel-agents, writing-skills, receiving-code-review** — no VCS references, untouched.
- **Installation docs** — `git clone` for installing superpowers itself stays git. That's the plugin distribution mechanism, not the user's project VCS.
- **`gh pr create`** — both git and jj users push to git remotes for PRs. PR creation step is identical.
- **Plugin manifest** — skill renames require updating any skill references in manifest / plugin.json.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| jj command mapping wrong or incomplete | Validate against jj docs during implementation; keep reference doc easy to update |
| Skills lose clarity from abstraction | Each skill still describes the workflow in full; only the concrete commands move to reference doc |
| Existing users confused by renames | Default is `git`, renames use intuitive generic terms, old names mentioned in commit messages |
| Agent ignores VCS context | Injected at session start before any skill fires, same mechanism that already works for superpowers bootstrap |
| jj workspace model divergence | Callout boxes in skills where workflow genuinely differs (e.g., bookmark creation) |
