# Session Handoff
> Generated: 2026-04-25 00:40 KST

## Task
Port caveman plugin (token-compression) + session_archive (rich session logger) into sspower under new names. Drop rtk entirely. Branch: `feat/diet-and-wiki`.

Renamed concepts:
- `caveman` → `diet` (token-terseness mode)
- `session_archive` → `project-wiki` (per-project `<cwd>/.claude/wiki/sessions/`)

## Status

### Completed (Phases 1-3 + codex review fixes)

**Phase 1 — Diet mode core:**
- `hooks/_diet-config.js` — shared flag r/w (symlink-safe, O_NOFOLLOW, size-capped)
- `hooks/diet-activate.js` — SessionStart, reads `skills/diet/SKILL.md`, filters to active intensity
- `hooks/diet-track.js` — UserPromptSubmit, parses `/diet [lite|full|ultra|off]`, per-turn reinforcement
- `hooks/package.json` — `{"type":"commonjs"}` (sspower root is ESM, hooks need CJS)
- `skills/diet/SKILL.md` — source of truth ruleset (intensity table, rules, examples)
- `hooks/hooks.json` — diet handlers appended to SessionStart + UserPromptSubmit arrays

**Phase 2 — Diet sub-skills:**
- `skills/diet-commit/SKILL.md`, `skills/diet-review/SKILL.md`, `skills/compress-memory/SKILL.md`
- `commands/diet.toml`, `diet-commit.toml`, `diet-review.toml`
- Compress is skill-instructions only — dropped upstream's 24KB Python CLI, Claude does it inline

**Phase 3 — Project wiki:**
- `hooks/wiki-archive.py` — port of `~/.claude/hooks/session_archive.py` (~430 LoC)
  - `resolve_out_dir(cwd)` → `<cwd>/.claude/wiki/sessions/` with writability probe
  - Fallback: `~/.claude/wiki/<basename>-<sha256[:8]>/sessions/`
  - Adds markdown summary writer (top files, git ops, user prompts, errors)
- `hooks/wiki-archive.sh` — `${CLAUDE_PLUGIN_ROOT}`-based, no `$HOME` hardcode
- `hooks.json` — `PreCompact` + `SessionEnd` handlers (async)

**Codex review (pass 1) — 6 fixes applied:**
1. `hooks.json` matcher: `startup|clear|compact` → `startup|resume|clear|compact`
2. `diet-activate.js` mode=off → silent exit (no `OK` stdout)
3. `diet-track.js` one-shot commands (`/diet-commit|review|compress`) no longer clobber flag
4. `diet-track.js` removed INDEPENDENT_MODES gate on reinforcement (not needed now)
5. `wiki-archive.py` `replace("~", home, 1)` → `Path(transcript_path).expanduser()`
6. `wiki-archive.py` dropped hardcoded KST → `datetime.now().astimezone()`; also threshold `<3 tool uses` → `not events` (archive short real sessions)

All functional tests pass: `/diet ultra` writes flag, `/diet-commit` leaves flag alone, mode=off silent, 1-tool session archives.

### In Progress
- **Phase 4 not started** — wiki index.md auto-append + seed `decisions.md` / `gotchas.md` templates

### Not Started
- Phase 5: wire existing sspower skills (`brainstorming`, `writing-plans`, `systematic-debugging`) to read `<cwd>/.claude/wiki/{decisions,gotchas}.md` + last N sessions
- Phase 6: migrate `~/.claude/settings.json` — remove `PreCompact`/`SessionEnd` (old session_archive) + `PreToolUse:Bash` (rtk-rewrite); disable `caveman@caveman` in enabledPlugins
- Phase 7: README/CLAUDE.md docs + bump `plugin.json` 1.0.0 → 1.1.0 + push

## Resume Here

1. **Phase 4 — wiki index.md:** Extend `hooks/wiki-archive.py` `main()` to append a line to `<out_dir>/../index.md` after each session: timestamp, duration, tool count, cost, top-3 files. Seed empty `<out_dir>/../decisions.md` and `../gotchas.md` with heading templates if missing. Verify with same test harness as Phase 3.

2. **Phase 5 — skill wiring:** Edit 3 SKILL.md files:
   - `skills/brainstorming/SKILL.md` — prepend "Before proposing, read `<cwd>/.claude/wiki/decisions.md` + last 3 session `.md` files."
   - `skills/writing-plans/SKILL.md` — same.
   - `skills/systematic-debugging/SKILL.md` — prepend "Read `<cwd>/.claude/wiki/gotchas.md` first. Match current bug to known gotcha before new investigation."

3. **Phase 6 — migration:** Use `update-config` skill or edit `~/.claude/settings.json` directly to remove old hooks + disable caveman plugin. Confirm no duplicate SessionEnd fires.

4. **Phase 7 — release:** Update `README.md`, `CLAUDE.md`, bump `.claude-plugin/plugin.json` to 1.1.0, commit in logical groups, push to origin.

## Decisions

- **Name = `diet`** (not `caveman`/`lean`/`terse`). User picked.
- **Drop rtk entirely** — user said "erase rtk, only diet". Bash command-rewriter not ported.
- **Wiki layout = A (per-project)** — `<cwd>/.claude/wiki/sessions/`, not `~/.claude/wiki/<slug>/`. User requested "without env things".
- **Diet default mode = `full`** — always-on, matches caveman default. Override via `SSPOWER_DIET_DEFAULT=off` or `/diet off`.
- **Compress skill has no Python backend** — simpler than caveman; Claude applies rules inline.
- **Flag path `~/.claude/.sspower-diet`** — deliberately different from `.caveman-active` to avoid collision during migration.
- **One-shot commands don't mutate flag** — codex finding #2. `/diet-commit` runs its skill without touching intensity level.

## Gotchas

- **sspower root `package.json` has `"type": "module"`** — all `.js` default to ESM. `hooks/package.json` `{"type":"commonjs"}` scopes hook files back to CJS. Don't delete it.
- **Both old + new wiki archivers fire until Phase 6 migration** — `~/.claude/settings.json` still has `PreCompact`/`SessionEnd` for old `session_archive.sh`. Sessions will be written to BOTH `~/.claude/sessions/` (flat) AND `<cwd>/.claude/wiki/sessions/`. Acceptable transition state.
- **Caveman plugin still enabled** in `~/.claude/settings.json` `enabledPlugins`. Its SessionStart/UserPromptSubmit hooks fire alongside sspower's diet hooks. Diet uses `.sspower-diet` flag so no state collision, but SessionStart context is emitted twice. Disable in Phase 6.
- **`hooks/__pycache__/`** currently untracked. Ignore before committing.
- **Codex review was standard (not adversarial)** — security-critical symlink logic was ported verbatim from caveman, hardened upstream. Codex spot-checked + passed.

## Context
- **Branch:** `feat/diet-and-wiki` (local only, not pushed)
- **Diff:** 14 files, +1251 lines vs main
- **Tests:** Manual functional tests passed (syntax + flag-state + archive roundtrip). No CI yet.
- **Codex session id:** `019dc01b-5abc-7620-9d36-b3ac56008f02` (Phase 1-3 review, 6 fixes applied)
