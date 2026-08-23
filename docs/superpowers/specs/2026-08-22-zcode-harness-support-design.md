# ZCode Harness Support Design

**Date:** 2026-08-22
**Status:** Approved (Approach B — first-class integration)
**Harness:** ZCode Desktop 3.8.1 (Z.ai, Electron; Linux x86_64 verified locally)

## Problem

Superpowers supports 14 harnesses but not ZCode, so ZCode users get no
session-start bootstrap: the skills sit on disk and never trigger. We add
ZCode as a supported harness following `docs/porting-to-a-new-harness.md`,
mirroring the Cursor row (Shape A shell-hook, Claude-compatible tool surface).

Success criterion: merged upstream PR against `dev`, with the acceptance-test
transcript (`Let's make a react todo list` auto-triggers brainstorming).

## Empirical contract (verified from installed ZCode 3.8.1 binaries)

Derived by extracting `/opt/ZCode/resources/app.asar` and grepping the agent
runtime (`resources/glm/zcode.cjs`) — the authoritative source per the porting
guide ("when this guide and the code disagree, the code wins"):

1. **Manifest discovery order:** `.zcode-plugin/plugin.json` →
   `.claude-plugin/plugin.json` → `.codex-plugin/plugin.json`. A first-class
   `.zcode-plugin/` directory exists.
2. **Official manifest fields** (document-skills plugin): `name`, `version`,
   `description`, `description_i18n`, `author`, `license`,
   `"skills": "skills"` (bare relative dir, no `./` prefix).
3. **Hook events:** `SessionStart`, `UserPromptSubmit`, `PreToolUse`,
   `PermissionRequest`, `PostToolUse`, `PostToolUseFailure`, `Stop`.
4. **Plugin hook config schema is NOT Claude-compatible.** Top-level key is
   `events:` (strict), entries are `{matcher?, hooks:[...]}`; hook types are
   `command` (`command`, `shell: true|string`, `async`, `timeout`) and
   `process` (`command`, `args[]`). Claude's `{hooks:{...}}` shape fails this
   strict schema — the shared `hooks/hooks.json` cannot ride standard-path
   autoload; ZCode needs its own declared hooks file.
5. **Env vars:** hook/custom-command processes receive BOTH
   `ZCODE_PLUGIN_ROOT` and `CLAUDE_PLUGIN_ROOT` (same value), plus
   `*_PLUGIN_DATA`, `*_PROJECT_DIR`, session IDs. `${CLAUDE_PLUGIN_ROOT}` /
   `${ZCODE_PLUGIN_ROOT}` in command strings are expanded by ZCode itself.
6. **stdin:** Claude Code-compatible JSON (`hook_event_name`, `session_id`,
   `transcript_path`, `tool_name`…).
7. **stdout:** parsed once as JSON; ALL of these are consumed for
   SessionStart: top-level `additionalContext`, top-level
   `additional_context`, and nested
   `hookSpecificOutput.{hookEventName,additionalContext}` — the nested form is
   validated (`hookEventName` must equal the firing event) then merged. Our
   existing Claude branch output therefore parses on ZCode today, but via the
   compat path only.
8. **Subagents:** built-in agent types include literally `general-purpose`
   and `Explore`. Skills system: native (`skillsService`; personal dir
   `~/.zcode/skills/`, plugin-contributed `skills/` dirs).

## Design

Shape A shell-hook port. Skills discovery via manifest; bootstrap via
plugin-declared ZCode-format hook file running the existing polyglot chain;
one new env-var branch in `hooks/session-start` emitting ZCode's native
top-level shape, ordered **before** the Claude branch (shadowing rule: ZCode
sets `CLAUDE_PLUGIN_ROOT` too).

### Data flow

```
ZCode new session (SessionStart)
  → runs plugin hook (declared in .zcode-plugin/plugin.json)
    → hooks/hooks-zcode.json entry → run-hook.cmd polyglot → bash hooks/session-start
      → detects ZCODE_PLUGIN_ROOT → prints {"hookEventName":"SessionStart","additionalContext":"<bootstrap>"}
  → ZCode merges additionalContext into model context
  → model knows it has superpowers; skills auto-trigger by description
```

### Files

| # | File | Change | Why |
|---|------|--------|-----|
| 1 | `.zcode-plugin/plugin.json` | NEW | First-class manifest: identity fields + `"skills": "skills"` + `"hooks": "./hooks/hooks-zcode.json"`. Declaring hooks explicitly is mandatory here (see finding 4): standard-path autoload would feed our Claude-format `hooks.json` into ZCode's strict `events:` schema and fail |
| 2 | `hooks/hooks-zcode.json` | NEW | ZCode schema: `{"events":{"SessionStart":[{"hooks":[{"type":"command","command":"\"${ZCODE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start","shell":"bash","async":false}]}]}}` |
| 3 | `hooks/session-start` | EDIT | New `elif [ -n "${ZCODE_PLUGIN_ROOT:-}" ]` branch placed BEFORE the `CLAUDE_PLUGIN_ROOT` branch, emitting the native top-level shape. Native-first beats compat-path reliance (survives compat-var removal; independently testable) |
| 4 | Tool mapping | NONE (expected) | Subagent types are literally `general-purpose`/`Explore`; skill system is native; file/shell tools assumed Claude-like — verify live during acceptance run. Ship `references/zcode-tools.md` only if probes show deltas (then also one Platform Adaptation pointer line — the only permitted SKILL.md edit) |
| 5 | `tests/zcode/` | NEW | `run-tests.sh` + manifest validity test (fields, version-bump registration, no stale references) + hook-shape test (with `ZCODE_PLUGIN_ROOT` set: valid JSON, top-level `hookEventName=="SessionStart"`, non-empty `additionalContext` containing the bootstrap, NO `additional_context`, NO nested `hookSpecificOutput`) |
| 6 | `.version-bump.json` | EDIT | Register `.zcode-plugin/plugin.json` → `version` (unregistered manifests ship stale) |
| 7 | `scripts/sync-to-codex-plugin.sh` | EDIT | Add `"/.zcode-plugin/"` to EXCLUDES so the dotdir doesn't leak into the Codex distribution |
| 8 | `README.md` | EDIT | ZCode install section matching existing per-harness sections |
| 9 | `docs/README.zcode.md` | NEW | Install/troubleshooting details |

### Error handling

- **No bash (Windows without Git Bash):** `run-hook.cmd` exits 0 silently —
  same degradation as Claude Code/Cursor today; `$`-style invocation of
  discovered skills still works, bootstrap injection doesn't.
- **Wrong event name:** impossible for the new branch (literal
  `SessionStart`); ZCode hard-fails mismatches loudly rather than silently.
- **Compaction:** ZCode fires `SessionStart` per its own lifecycle; no
  compaction-specific handling needed beyond what the shared script already
  does (stateless re-runs).
- **Double injection:** impossible — the branch emits exactly one field set;
  tests assert absence of the other shapes.

## Verification ladder

1. `tests/zcode/run-tests.sh` green; existing `tests/hooks/`,
   `tests/kimi/` unaffected; `scripts/bump-version.sh --check` clean.
2. Local install into ZCode from the checkout (marketplace/local-dir path;
   confirm which the UI offers).
3. Smoke: new session → *"What are your superpowers?"* → describes skills.
4. **Acceptance test:** clean workspace, exact prompt
   `Let's make a react todo list` → brainstorming triggers before any code;
   capture transcript ×2–3 (this is the PR's required evidence).
5. Capability probe: ask the model to enumerate its tools; compare against
   Claude Code vocabulary → decide zcode-tools.md yes/no.
6. Regression: `tests/hooks/test-session-start.sh` still green (Claude/
   Cursor/Copilot shapes unchanged).

## Risks

| Risk | Mitigation |
|------|-----------|
| `"shell": "bash"` unavailable on some Windows installs | Same silent-exit fallback as every other Shape A harness; documented |
| Manifest `skills` path format drifts between ZCode versions | Copied verbatim from official bundled plugin; acceptance test catches regressions |
| Marketplace git-URL install flow differs from assumption | Verified hands-on during verification step 2 before writing docs claims |
| Maintainer wants minimal diff (rely on compat var, zero hook change) | Fallback is deleting the new branch — additive, trivially negotiable in review |

## Contribution process (PR gates from CLAUDE.md / PR template)

Target `dev`. Fill every template section: disclosure table (model/harness/
plugins), problem statement, alternatives, environment-tested table,
acceptance transcript in `<details>`, eval section, human-reviewed-diff
checkbox (the human partner reviews the complete diff before submission).
One PR, no bundled unrelated changes.
