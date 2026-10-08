# Antigravity Marketplace plugin

## Goal

List Superpowers in the Google Antigravity plugin Marketplace, as part of a
partnership with Google. That requires a native Antigravity plugin manifest with
the Marketplace presentation fields, a logo, and a session bootstrap that works
on the native plugin path.

Source: "Antigravity Plugin Marketplace Publishing Guide" (PDF from Google), plus
probes against `agy` 1.3.1 recorded below.

## Current state (agy 1.3.1)

- `agy plugin install https://github.com/obra/superpowers` succeeds, but only
  through agy's Gemini-extension fallback: `agy plugin list` reports
  `"source": "gemini-cli"`. The bootstrap rides `GEMINI.md`'s `@` lines, which
  the model treats as hints and follows with `view_file`. The acceptance test
  passes on this path.
- agy copies our Claude-format `hooks/hooks.json` to the install root as
  `hooks.json` and fails to parse it on every session:
  `invalid hook "hooks": command hook must specify 'command'`.
- `agy plugin validate .` on the repo fails: `missing plugin.json`.

## Probe findings (agy 1.3.1)

Each probe installed a throwaway plugin, ran `agy -p`, and uninstalled it.

1. agy's hook events are `PreToolUse`, `PostToolUse`, `PreInvocation`,
   `PostInvocation`, and `Stop`. There is no `SessionStart`. agy's embedded docs
   use named top-level hooks (`{"<name>": {"PreToolUse": [...]}}`), which differs
   from the PDF's `{"hooks": {...}}` example.
2. `rules/AGENTS.md` in a plugin loads as an always-on rule on every session.
3. In a rule, an `@` path relative to the rule file is rewritten to an absolute
   install path (`@../skills/x/SKILL.md` becomes
   `@/Users/<u>/.gemini/config/plugins/<plugin>/skills/x/SKILL.md`). Its content
   is not inlined. `${PLUGIN_ROOT}` is not substituted in rules. A path that does
   not resolve relative to the rule file is left as written.
4. With `.antigravity-plugin/plugin.json` present, agy installs the plugin as
   `"source": "antigravity"`, finds all 15 skills, and skips hooks (no root
   `hooks.json`), so the parse warning goes away.
5. A staged copy of the repo with the native manifest and a one-line
   `rules/AGENTS.md` (`@../skills/using-superpowers/SKILL.md`) passed the
   acceptance test: the model read `using-superpowers`, then
   `antigravity-tools.md`, then `brainstorming`, and replied
   "Using superpowers:brainstorming…" with a clarifying question. No code.
6. The repo-root `AGENTS.md` (contributor guidelines) is copied into the install
   but is not loaded as a rule. Only `rules/AGENTS.md` is.

## Design

### 1. Native manifest: `.antigravity-plugin/plugin.json`

The guide allows the manifest at `.antigravity-plugin/plugin.json`, which
matches our other harness dotdirs. Fields:

| Field | Value |
|---|---|
| `name` | `superpowers` |
| `displayName` | `Superpowers` |
| `version` | current release version, maintained by `.version-bump.json` |
| `description` | `Make your coding agent a better engineer` (Jesse's copy; shorter than the guide's recommended 120–160, at most 160) |
| `logo` | `assets/antigravity-logo.png` |
| `suggestedPrompts` | `I've got an idea for something I'd like to build`, `Let's figure out why this broke` (Jesse's copy) |
| `category` | `Developer Tools` |
| `keywords` | lowercase, matching `.claude-plugin/plugin.json` keywords |
| `author` | `{ "name": "Jesse Vincent", "email": "jesse@fsck.com" }`, matching `.claude-plugin/plugin.json` |
| `homepage`, `repository` | `https://github.com/obra/superpowers` |
| `license` | `MIT` |

No `skills` or `mcpServers` fields: the defaults (`skills/`, no MCP config) are
what we want, and probe 4 confirmed default discovery finds all skills.


### 2. Bootstrap: skill discovery, no extra files

agy lists each installed skill's description, and `using-superpowers`'
"Use when starting any conversation" gets the model to load it. The plugin
ships no `rules/` and no `hooks.json`.

This replaced a first design, a one-line `rules/AGENTS.md` pointer, after the
final review found that Cursor also loads any `rules/*.md` a plugin ships from
the same repo root. Alternatives probed on agy 1.3.1 and rejected:

- A `PreInvocation` hook. It runs before every model call and `hooks.json`
  must sit at the plugin root. An `ephemeralMessage` is dropped on the next
  call; a `userMessage` persists, and gating it on `invocationNum == 0` and
  `initialNumSteps == 1` injects exactly once per conversation, but agy still
  starts the hook process on every call.
- No manifest field relocates `hooks.json` or `rules/`.

Verified with no bootstrap file, 12/12 runs: "Let's make a react todo list"
(3) and "add a settings page" (3) load brainstorming before any code; "this
test is failing, can you fix it?" (3) loads systematic-debugging before any
edit; a react-todo second turn after an unrelated first turn (3) loads
brainstorming. Model: Gemini 3.8 Flash. The risk is that triggering depends on
the model honoring a skill description; the once-per-conversation hook is the
fallback if it slips.

### 3. Logo: `assets/antigravity-logo.png`

512×512 PNG, transparent background. A white rounded square (inset 31px,
corner radius 100) holds the `assets/superpowers-small.svg` mark in `#1a1a1a`,
scaled to about 70% of the square's width and centered. No border; on a light
theme it reads as a bare mark on white, which is acceptable.

`scripts/render-antigravity-logo.sh` composes the SVG from
`superpowers-small.svg` and rasterizes it with `rsvg-convert`. It is the only way
the PNG gets regenerated; it has help text and fails clearly when
`rsvg-convert` is missing.

### 4. Version bumps

Add `{ "path": ".antigravity-plugin/plugin.json", "field": "version" }` to
`.version-bump.json`.

### 5. Codex sync

Add `/.antigravity-plugin/` and `/assets/antigravity-logo.png` to
`EXCLUDES` in `scripts/sync-to-codex-plugin.sh`, and cover them in
`tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`.

### 6. README

The Antigravity install command stays
`agy plugin install https://github.com/obra/superpowers`. The prose changes from
"runs the plugin's session-start hook" to describing skill discovery. Add the
Marketplace route once it exists; until then, no claim about it.

### 7. Tests: `tests/antigravity/`

- `test-plugin-manifest.sh` (CI-safe, mirrors `tests/kimi/test-plugin-manifest.sh`):
  - manifest parses; `name` matches the kebab-case pattern and equals
    `superpowers`;
  - every Marketplace-required field is present and non-empty: `name`,
    `description`, `displayName`, `logo`, `suggestedPrompts` (1–3 non-empty
    strings), `version`, `author`;
  - `description` is at most 160 characters;
  - `version` equals `.claude-plugin/plugin.json`'s version;
  - `logo` file exists, is a PNG, and is square and at least 128×128;
  - `.version-bump.json` lists the manifest;
  - `using-superpowers`' description still says "Use when starting any
    conversation", which the bootstrap relies on;
  - no root `plugin.json`, `hooks.json`, or `rules/` exists.
- When `agy` is on `PATH`, also run `agy plugin validate` on the repo and
  require `[ok]` with skills processed.
- Update the header comment of `test-antigravity-tools.sh`, which still says agy
  runs the SessionStart hook.

Live acceptance (not in CI): install the branch's tree into agy, run
"Let's make a react todo list" at least three times in clean workspaces, and
require that brainstorming triggers before any code each time. Uninstall
afterward.

### 8. Porting guide: separate commit

`docs/porting-to-a-new-harness.md` describes `.antigravity-plugin/install.sh`
and a generated `ANTIGRAVITY.md` that do not exist. Fix it in its own commit:

- Routing table row: Antigravity uses the surfaced skill index.
- The "no `Skill` tool" section: replace the `contextFileName` advice for
  Antigravity with the skill-index bootstrap, and record the hook and rule
  findings (no session-start event, `PreInvocation` per call, no
  `${PLUGIN_ROOT}` in hooks, shared plugin roots leak `rules/` into Cursor).
- The distribution table: Antigravity installs from a git URL (`agy plugin
  install <url>`) and lists in its Marketplace.
- The installer-stripping section: drop the `install.sh` / `ANTIGRAVITY.md`
  example.
- The harness index table has no Antigravity row; add one (manifest,
  bootstrap, tool mapping, tests, install).

## Out of scope

- Marketplace submission mechanics. The guide does not describe how to submit;
  that goes through Jesse's Google contact.
- Antigravity 2.0 and the IDE. Not installed here, so not verified. The README
  makes no claims about them.
- Open PR #2350, which copies `using-superpowers` into a generated rule. Jesse
  decides how to respond after this lands; I draft the reply.
- `.hermes-plugin/` and `.muse-plugin/` are missing from the Codex sync
  excludes. Unrelated; noted for a separate fix.
