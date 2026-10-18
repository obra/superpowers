# Adopting Toolbelt in a Project

The plugin is global. There is nothing to install per project, and a project with no
configuration at all works — it gets the bundled defaults. Everything below is optional
and read only when present.

## Optional per-project files

| File | Purpose |
|---|---|
| `.toolbelt/routing/claude.md`, `.toolbelt/routing/codex.md` | Plain-English agent routing for sessions orchestrated from that harness. Read from the main checkout, so one edit reaches every worktree. Bundled defaults in `skills/agent-routing/routing/`. Codex needs `scripts/setup-codex-routing` once per machine. |
| `.toolbelt/pr-policy.md` | Which review providers to await, complexity lanes, timeouts. May name the project's own PR-state command in place of `pr-state`, and may forbid moving low-severity findings to a `## Follow-ups` list. |
| `.toolbelt/worktree-policy.md` | Port ranges and how to claim a non-conflicting set, sidecar containers and their naming, per-worktree data directories, teardown at finish, and the limit on concurrent implementers (default three). Read by `using-git-worktrees` before it creates anything. |
| `.toolbelt/ux-policy.md` | How `ux-gate` captures this app. Sections, each optional: **Launch** — the command that serves the app and the URL. **Auth** — how to obtain `storageState`, or the login steps. **Theme** — the `theme` object for the capture matrix. **Data** — seed or fixture commands and the actors to use. **Viewports and themes** — the supported set, overriding the defaults. **Allowed exceptions** — the `allowOverflow`, `allowOverlap`, and `allowLight` selectors. **Design reference** — the design-system doc, the catalog route, and any token or palette check command. The reviewer reads the doc and runs nothing. **Reference screens** — two routes. **Harness notes** — capture gotchas learned in this project. Absent, the gate infers Launch, Auth, and Theme and records each inference. |
| `docs/REVIEW-GUIDANCE.md` | Review conventions for this codebase, handed to reviewer subagents. |
| `AGENTS.md` | Entry-point summary. Copy from [AGENTS-SNIPPET.md](AGENTS-SNIPPET.md). |

`.toolbelt/` is also where scratch lands — `sdd/`, `quick/`, `brainstorm/`. Add it to
`.gitignore`; the contents are regenerated.

## Checking what a session will see

```bash
<toolbelt-checkout>/hooks/load-routing claude
```

Prints the `<AGENT-ROUTING>` block a session in the current directory receives, or
nothing when the project has no routing file for that harness (the bundled default
then applies).

## Verifying the install in a project

Start a clean session and send exactly:

> Let's make a react todo list

`brainstorming` must auto-trigger before any code is written. If it doesn't, the
session-start bootstrap isn't loading and nothing else is worth debugging yet. The hook
registers on session load, so a mid-session install won't take effect until you restart.

## Migrating a project that used the pre-rename names

Skills were once prefixed. If a project's `AGENTS.md`, `CLAUDE.md`, or docs still
reference the old names, replace them (old on the left):

| Old | New |
|---|---|
| `superpowers:` | `toolbelt:` |
| `superpowers:using-superpowers` | `toolbelt:using-toolbelt` |
| `workstack-delivery` | `delivery` |
| `workstack-quick-task` | `quick-task` |
| `workstack-agent-routing` | `agent-routing` |
| `workstack-pr-monitor` | `pr-monitor` |
| `workstack-ux-gate` | `ux-gate` |

Config and scratch moved under one dot-dir: `.workstack/` and `.superpowers/` are now
`.toolbelt/`. Agent routing now lives in `.toolbelt/routing/<harness>.md`; the old
`agents.json` is no longer read. Name the `errand` role (formerly `operator`) and the
reviewer specialties `code`, `spec`, `plan`, `ux`, and `gate` there.
