# Superpowers Team Template — Working in this repo

This repo is a team-onboarding template built on Superpowers (obra/Jesse Vincent, MIT).

## Ground rules for agents

- The skills/ and hooks/ are the upstream engine — NEVER edit them. They are synced from https://github.com/obra/superpowers via `scripts/sync-engine.sh`. Editing them breaks clean sync.
- All team-specific work lives under `team/`. Personal skills go to `~/.claude/skills/`.
- Author skills with the `superpowers:writing-skills` skill. Author plans/specs under `docs/team-template/`.
- Keep shipped plugin content zero-dependency. Dev scripts may use `python3`, not `jq`.
- Preserve attribution to Superpowers everywhere.

## Layout

- `skills/`, `hooks/` — engine (do not touch)
- `team/` — the team plugin: `intake/`, `skills/`, `docs/`, `generators/`, `CLAUDE.md`
- `scripts/sync-engine.sh` — pull upstream engine + bump version
- `docs/team-template/` — this project's specs and plans
