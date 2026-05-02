# `.spx/` — scratch dir for ephemeral specs and plans

This directory is created in user repos for **Medium tier** work (per `task-tier`).

## What goes here

- `.spx/specs/<topic>.md` — Medium-tier design specs from the `brainstorming` skill
- `.spx/plans/<topic>.md` — Medium-tier implementation plans (rare; usually inline TodoWrite is enough)

## What does NOT go here

- **Large tier** specs and plans — those live in `docs/superpowers/specs/` and `docs/superpowers/plans/` and ARE committed to git
- Trivial / Small work — no spec or plan file at all

## Why gitignored

Medium tier work is real but doesn't need permanent project documentation. Keeping these scratch files out of version control prevents:

- git churn from spec+plan commits per medium feature
- stale "draft" specs lingering in `docs/`
- merge conflicts on per-author scratch notes

## Promoting to permanent docs

If a Medium task escalates to Large, or you decide a spec is worth keeping:

```bash
git mv .spx/specs/<topic>.md docs/superpowers/specs/$(date +%Y-%m-%d)-<topic>-design.md
```

## Setup in a user repo

Add `.spx/` to the repo's `.gitignore`. The skill will create subdirs as needed.

```gitignore
.spx/
```
