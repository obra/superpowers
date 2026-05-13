# Codex Native Hooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Codex CLI users native Superpowers startup behavior through trusted Codex plugin hooks, keep the current Codex plugin/skills path as a fallback while `plugin_hooks` is gated, and prepare Codex App user-facing parity behind a visible `/hooks` UI smoke test.

**Architecture:** Add a Codex-specific hook manifest that points Codex at the existing shared `hooks/session-start` implementation through the existing cross-platform `hooks/run-hook.cmd` wrapper. Package the hook files into the official Codex plugin sync output. Keep Claude Code's existing `hooks/hooks.json`, Cursor's `hooks/hooks-cursor.json`, and Copilot/unknown-platform output behavior unchanged.

**Tech Stack:** Bash hook scripts, JSON plugin manifests, shell regression tests, Node.js only for JSON parsing in tests, Codex CLI/app-server smoke verification. No new runtime dependencies.

---

## Source Map

- Spec: `docs/superpowers/specs/2026-05-12-codex-native-hooks-design.md`
- Codex plugin manifest: `.codex-plugin/plugin.json`
- Claude hook manifest: `hooks/hooks.json`
- Cursor hook manifest: `hooks/hooks-cursor.json`
- New Codex hook manifest: `hooks/hooks-codex.json`
- Shared hook wrapper: `hooks/run-hook.cmd`
- Shared hook implementation: `hooks/session-start`
- Codex plugin sync script: `scripts/sync-to-codex-plugin.sh`
- Codex sync regression test: `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`
- New hook output regression test: `tests/hooks/test-session-start.sh`
- User docs: `README.md`
- Windows hook docs: `docs/windows/polyglot-hooks.md`

## Locked Decisions

- Use `hooks/hooks-codex.json` for Codex instead of changing the shared Claude `hooks/hooks.json`.
- Do not add `resume` to the Claude matcher until Claude Code is explicitly verified to accept it.
- Use Codex's verified `${PLUGIN_ROOT}` placeholder in the Codex manifest command.
- Do not use or document `CODEX_PLUGIN_ROOT`; Codex plugin hooks provide `PLUGIN_ROOT`, `CLAUDE_PLUGIN_ROOT`, `PLUGIN_DATA`, and `CLAUDE_PLUGIN_DATA`.
- Do not auto-trust hooks from Superpowers. Users trust executable hooks through Codex's `/hooks` UI.
- Keep fallback behavior: Codex users without enabled/trusted plugin hooks still get installed skills, but not automatic startup bootstrap.
- Treat App runtime support as verified through the bundled app-server, but only claim App user-facing parity after a visible App `/hooks` UI smoke test.

## Task 1: Baseline And Contract Check

- [ ] Run:

  ```bash
  git status --short --branch
  codex --version
  codex features list
  /Applications/Codex.app/Contents/Resources/codex --version
  ```

- [ ] Expected observations:
  - Worktree status is understood before edits.
  - Local Codex is at least `0.130.0`.
  - `plugin_hooks` exists and is still under development/default-off, or any drift is recorded in the implementation notes.
  - App-bundled Codex can be invoked, or the App smoke task is marked blocked with the exact command error.

- [ ] Read the files in the Source Map before editing.

## Task 2: Add SessionStart Output Regression Tests

- [ ] Create `tests/hooks/test-session-start.sh`.

- [ ] The test file must:
  - Run from any current working directory.
  - Use a temporary `HOME` for each scenario.
  - Invoke the real `hooks/session-start`.
  - Parse JSON with Node.js from stdin; do not add npm dependencies.
  - Fail on invalid JSON, empty injected context, or platform output shape drift.

- [ ] Cover these scenarios:
  - Claude Code: `CLAUDE_PLUGIN_ROOT="$REPO_ROOT"` emits `hookSpecificOutput.hookEventName = "SessionStart"` and a non-empty `hookSpecificOutput.additionalContext`.
  - Codex plugin hooks: `PLUGIN_DATA="$tmp/data" CLAUDE_PLUGIN_DATA="$tmp/data" PLUGIN_ROOT="$REPO_ROOT" CLAUDE_PLUGIN_ROOT="$REPO_ROOT"` emits the same nested `hookSpecificOutput.additionalContext` shape.
  - Cursor: `CURSOR_PLUGIN_ROOT="$REPO_ROOT" CLAUDE_PLUGIN_ROOT="$REPO_ROOT"` emits top-level `additional_context` and does not also emit `hookSpecificOutput`.
  - Copilot CLI: `COPILOT_CLI=1 CLAUDE_PLUGIN_ROOT="$REPO_ROOT"` emits top-level `additionalContext` and does not also emit `hookSpecificOutput`.
  - Claude legacy warning: with `$HOME/.config/superpowers/skills` present and `CLAUDE_PLUGIN_ROOT="$REPO_ROOT"`, the injected context still contains the existing Claude migration guidance to `~/.claude/skills`.
  - Codex legacy warning: with `$HOME/.config/superpowers/skills` present and the Codex plugin-hook environment, the injected context does not mention `~/.claude/skills` or "Claude Code's skills system" and instead uses harness-neutral custom-skill wording.

- [ ] Run the test before changing `hooks/session-start`:

  ```bash
  bash tests/hooks/test-session-start.sh
  ```

- [ ] Expected result before implementation: the Codex legacy warning scenario fails because the current shared hook sees `CLAUDE_PLUGIN_ROOT` and emits Claude-specific migration text.

## Task 3: Make Legacy Warning Text Harness-Aware

- [ ] Edit `hooks/session-start`.

- [ ] Preserve these existing behaviors:
  - The script derives the plugin root from its own location.
  - The script reads `skills/using-superpowers/SKILL.md`.
  - Cursor receives only top-level `additional_context`.
  - Claude receives only nested `hookSpecificOutput.additionalContext`.
  - Codex receives the same nested shape as Claude, because the verified Codex parser accepts it and Codex sets `CLAUDE_PLUGIN_ROOT`.
  - Copilot and unknown platforms receive only top-level `additionalContext`.

- [ ] Add Codex detection before building the legacy warning. Use Codex data env vars, not the locally derived `PLUGIN_ROOT` variable:

  ```bash
  is_codex_hook=0
  if [ -n "${PLUGIN_DATA:-}" ] || [ -n "${CLAUDE_PLUGIN_DATA:-}" ]; then
      is_codex_hook=1
  fi
  ```

- [ ] Keep the current Claude legacy warning text for non-Codex Claude.

- [ ] For Codex hook runs, use this neutral warning content when `$HOME/.config/superpowers/skills` exists:

  ```text
  WARNING: Superpowers now uses your coding agent's native skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to a skills location supported by your coding agent. To make this message go away, remove ~/.config/superpowers/skills
  ```

- [ ] Re-run:

  ```bash
  bash tests/hooks/test-session-start.sh
  ```

- [ ] Expected result after implementation: all session-start scenarios pass.

## Task 4: Add Codex Hook Manifest

- [ ] Add `hooks/hooks-codex.json`:

  ```json
  {
    "hooks": {
      "SessionStart": [
        {
          "matcher": "startup|resume|clear",
          "hooks": [
            {
              "type": "command",
              "command": "\"${PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
              "async": false
            }
          ]
        }
      ]
    }
  }
  ```

- [ ] Edit `.codex-plugin/plugin.json` and add:

  ```json
  "hooks": "./hooks/hooks-codex.json"
  ```

- [ ] Keep `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`, `hooks/hooks.json`, and `hooks/hooks-cursor.json` unchanged unless a test proves they must change.

- [ ] Validate JSON:

  ```bash
  node -e 'for (const f of [".codex-plugin/plugin.json","hooks/hooks-codex.json","hooks/hooks.json","hooks/hooks-cursor.json"]) JSON.parse(require("fs").readFileSync(f,"utf8"));'
  ```

## Task 5: Package Hooks In Codex Plugin Sync

- [ ] Edit `scripts/sync-to-codex-plugin.sh`.

- [ ] Remove the `/hooks/` entry from `EXCLUDES`.

- [ ] Do not broaden the sync script beyond this packaging change.

- [ ] Edit `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh` fixtures:
  - In `write_upstream_fixture`, create:
    - `hooks/hooks-codex.json`
    - `hooks/session-start`
    - `hooks/run-hook.cmd`
  - Add those files to the upstream fixture commit.
  - In `write_synced_destination_fixture`, create and commit the same hook files under `plugins/superpowers/hooks/` so the clean no-op apply scenario stays clean.

- [ ] Add preview assertions:
  - Preview includes `hooks/hooks-codex.json`.
  - Preview includes `hooks/session-start`.
  - Preview includes `hooks/run-hook.cmd`.

- [ ] Add clean no-op assertion:
  - Clean no-op local apply reports no changes when hook files are already synced.

- [ ] Run:

  ```bash
  bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
  ```

- [ ] Expected result: all existing sync assertions still pass, and the new hook packaging assertions pass.

## Task 6: Update README Codex Docs

- [ ] Edit `README.md`.

- [ ] In `### Codex CLI`, keep the existing marketplace install steps and add a short optional preview subsection after install:

  ````markdown
  #### Automatic startup bootstrap

  Codex plugin hooks are still gated behind Codex's `plugin_hooks` feature. To opt in:

  ```bash
  codex features enable plugin_hooks
  ```

  Restart Codex, open `/hooks`, review the Superpowers `SessionStart` hook, and trust it. Codex will ask you to re-review the hook after Superpowers updates if the hook definition changes.

  If `plugin_hooks` is disabled, unavailable, or untrusted, Superpowers still installs as a normal Codex plugin and the skills remain available. The automatic startup bootstrap is the part that waits for the trusted hook.
  ````

- [ ] In `### Codex App`, keep the existing install steps.

- [ ] If the visible App `/hooks` UI smoke in Task 9 passes during implementation, add the same automatic startup bootstrap subsection to `### Codex App`, with the enablement step described as the persisted Codex config path:

  ```bash
  codex features enable plugin_hooks
  ```

- [ ] If the visible App `/hooks` UI smoke is blocked or fails, do not claim automatic App startup bootstrap in the README. Record the App smoke status in the implementation summary instead.

- [ ] README wording must not imply automatic startup for Codex users who have not enabled and trusted plugin hooks.

## Task 7: Update Windows Hook Docs

- [ ] Edit `docs/windows/polyglot-hooks.md`.

- [ ] Update stale references:
  - Replace `session-start.cmd` with `run-hook.cmd`.
  - Replace `session-start.sh` with extensionless `session-start`.
  - Show `hooks/hooks-codex.json` as the Codex-specific manifest.
  - Keep `hooks/hooks.json` as the Claude Code manifest.
  - Mention Codex uses `${PLUGIN_ROOT}` and `startup|resume|clear`.

- [ ] The docs must describe the current file structure:

  ```text
  hooks/
  |-- hooks.json
  |-- hooks-codex.json
  |-- hooks-cursor.json
  |-- run-hook.cmd
  `-- session-start
  ```

- [ ] Update the Windows simulation command to:

  ```powershell
  $env:CLAUDE_PLUGIN_ROOT = "C:\path\to\plugin"
  cmd /c "C:\path\to\plugin\hooks\run-hook.cmd session-start"
  ```

- [ ] Do not add Windows-specific runtime dependencies.

## Task 8: Run Codex CLI Native Hook Smoke

- [ ] Build a temporary isolated Codex home and staged plugin from the working tree:

  ```bash
  SMOKE_HOME="$(mktemp -d)"
  SMOKE_PLUGIN="$SMOKE_HOME/plugins/cache/debug/superpowers/local"
  mkdir -p "$SMOKE_PLUGIN"
  rsync -a --exclude .git ./ "$SMOKE_PLUGIN/"
  ```

- [ ] Use persisted feature config, not undocumented root CLI feature flags:

  ```bash
  cat > "$SMOKE_HOME/config.toml" <<'EOF'
  [features]
  plugins = true
  hooks = true
  plugin_hooks = true

  [plugins."superpowers@debug"]
  enabled = true
  EOF
  ```

- [ ] Run Codex `app-server --listen stdio://` against the temp home and call `hooks/list`:

  ```bash
  CODEX_HOME="$SMOKE_HOME" codex app-server --listen stdio://
  ```

- [ ] Expected `hooks/list` result:
  - One Superpowers `SessionStart` plugin hook appears from `hooks/hooks-codex.json`.
  - The hook matcher is `startup|resume|clear`.
  - The expanded command points at `hooks/run-hook.cmd session-start`.
  - Initial `trustStatus` is `untrusted` unless the temp config already contains a trusted hash.

- [ ] Trust the hook only inside the temp home using `hooks/list` `currentHash` plus `config/batchWrite`.

- [ ] Start a clean Codex thread and trigger a turn.

- [ ] Expected event/result:
  - `hook/started` and `hook/completed` events are emitted for the Superpowers `SessionStart` hook.
  - The resulting context includes the Superpowers startup text from `using-superpowers`.

- [ ] Keep this as a development smoke only. Do not document headless trust as normal user setup.

## Task 9: Run Codex App Visible UI Smoke

- [ ] Confirm the App-bundled Codex runtime version:

  ```bash
  /Applications/Codex.app/Contents/Resources/codex --version
  ```

- [ ] With `plugin_hooks` enabled in persisted Codex config, launch the Codex App.

- [ ] Install or use the staged Superpowers plugin in the App.

- [ ] Open a clean App thread and observe the startup warning, if any.

- [ ] Open `/hooks`.

- [ ] Expected UI result:
  - The Superpowers `SessionStart` hook is listed.
  - The UI shows the hook command/source for review.
  - Trusting the hook is possible from the UI.
  - Toggling enabled after trust makes the hook runnable.

- [ ] Run the acceptance prompt in a clean App thread:

  ```text
  Let's make a react todo list
  ```

- [ ] Passing App result:
  - The agent sees the Superpowers startup context automatically.
  - `superpowers:brainstorming` triggers before code is written.

- [ ] If the App UI smoke passes, update README App docs in Task 6 and record the transcript or concise evidence in the PR body.

- [ ] If the App UI smoke is blocked or fails, leave README App docs limited to plugin installation and report the exact blocker.

## Task 10: Final Verification

- [ ] Run:

  ```bash
  bash tests/hooks/test-session-start.sh
  bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
  node -e 'for (const f of [".codex-plugin/plugin.json","hooks/hooks-codex.json","hooks/hooks.json","hooks/hooks-cursor.json"]) JSON.parse(require("fs").readFileSync(f,"utf8"));'
  git diff --check
  ```

- [ ] Run the Codex CLI smoke from Task 8.

- [ ] Run the App UI smoke from Task 9, or record why it could not be completed.

- [ ] Review the diff:

  ```bash
  git diff -- .codex-plugin/plugin.json hooks scripts tests README.md docs/windows/polyglot-hooks.md
  ```

- [ ] Confirm no unrelated files changed.

- [ ] If opening a PR, follow `.github/PULL_REQUEST_TEMPLATE.md`, search open and closed PRs for overlapping Codex hook work, include the relevant smoke evidence, and call out whether App UI smoke passed.

## Completion Criteria

- `hooks/hooks-codex.json` exists and is referenced by `.codex-plugin/plugin.json`.
- Codex plugin sync includes the `hooks/` directory and tests prevent future accidental exclusion.
- `hooks/session-start` still emits valid JSON for Claude, Codex, Cursor, Copilot, and unknown platform paths.
- Codex docs explain enablement, `/hooks` trust, re-review after updates, and fallback behavior without overclaiming default automatic startup.
- App docs claim automatic startup only if the visible App `/hooks` UI smoke passes.
- No new dependencies are introduced.
- Claude Code, Cursor, and Copilot behavior is not changed except for any neutral warning text that tests explicitly cover.
