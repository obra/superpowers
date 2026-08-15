# Compatibility matrix

> Which runtimes has `superpowers` been tested on, and to what depth. Honest about what we know and what we don't.

## Status legend

- ✅ **Tested**: end-to-end install + load verified on this host
- 🟡 **Manifest validated**: manifest JSON is correct for this runtime, but no actual install/load test on this host
- ⚠️ **Partial**: something works, something doesn't (see notes)
- ❌ **Not installed**: this runtime is not installed on the test host
- 🚫 **Not supported**: deliberately not supported (see notes)

## Runtimes

| Runtime | Install | Load | Plugin manifest | Notes |
|---|---|---|---|---|
| **Claude Code** | ✅ | ✅ | ✅ | Primary runtime. Full test path. The bootstrap is loaded by a `SessionStart` hook. The `safety-check` skill (fork-only) auto-loads. |
| **Gemini CLI** | ✅ | ✅ | ✅ | `gemini skills link` over the 14 upstream skills. |
| **Codex CLI** | ✅ | ✅ | ✅ | Codex CLI install path requires OpenAI's plugin publish flow. |
| **Cursor** | ✅ | ✅ | ✅ | Plugin auto-discovered via `.cursor-plugin/plugin.json`. |
| **Devin CLI** | ✅ | ✅ | ✅ | Plugin auto-discovered via `.devin-plugin/plugin.json`. No tool-mapping scaffold needed — Devin already documents its own tools. |
| **Kimi Code** | ✅ | ✅ | ✅ | `skillInstructions` references the `using-superpowers` skill. Plugin install is TUI-only. |
| **OpenCode** | ✅ | ✅ | ✅ | Plugin format lives in `package.json` (Pi-compatible). |
| **Pi** | ✅ | ✅ | ✅ | Same package.json layout as OpenCode. |
| **GitHub Copilot CLI** | ✅ | ✅ | ✅ | Cross-harness packaging mirrors Claude Code's. |
| **Factory Droid** | ✅ | ✅ | ✅ | Droid CLI install path documented and exercised. |
| **Antigravity** | ✅ | ✅ | ✅ | `agy plugin install` documented and exercised. |
| **Hermes** | ✅ | ✅ | ✅ | `.hermes-plugin/plugin.yaml` validated and installed. |
| **DeepSeek Harness (`dsh`)** | 🟡 | 🟡 | ✅ | Manifest `.dsh-plugin/plugin.json` ships in this repo. Skill discovery via `customSkillDirs` is the lowest-friction install (one line in a `cordis.yml` overlay). No actual dsh install has been run on this test host yet. See [`docs/README.deepseek-harness.md`](README.deepseek-harness.md) for the install paths. |
| **Augment / Continue / Cline / Aider** | 🚫 | 🚫 | 🚫 | Not supported. These runtimes don't have a plugin discovery mechanism compatible with this manifest family. Use at your own risk. |

## How "tested" is determined

For each ✅ cell above, we ran the full path:
1. **Install**: the runtime's standard install command for the plugin
2. **Load**: started a new session in the runtime
3. **Skill invocation**: confirmed the `using-superpowers` skill auto-triggers the model-visible catalog

For 🟡 cells, only the manifest was validated — the JSON file passes linting, has the right `name`, `version`, `keywords`, and the skills directory is referenced correctly. The runtime is not installed on the test host, so steps 1-3 cannot be verified.

## Adding a new row

When you test a new runtime on a host where it actually installs:

1. Install per the runtime's docs
2. Verify the manifest is loadable
3. Start a session, check that the `<available_skills>` block (or its native equivalent) is in the system prompt
4. Send the canonical acceptance prompt (`Let's make a react todo list`); confirm the `brainstorming` skill loads
5. Add a row above with the new runtime

If the runtime uses a different manifest format (not in the 12 upstream-supported families), the plugin will not work — see [`docs/porting-to-a-new-harness.md`](porting-to-a-new-harness.md) for adding support.

## See also

- [`docs/porting-to-a-new-harness.md`](porting-to-a-new-harness.md) — the 12-runtime spec
- [`docs/README.kimi.md`](README.kimi.md), [`docs/README.opencode.md`](README.opencode.md) — runtime-specific install notes
