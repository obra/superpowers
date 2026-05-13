# Codex Native Hooks: Claude Parity Bootstrap

**Date:** 2026-05-12
**Status:** Draft
**Ticket:** SUP-248

Use Codex native plugin hooks to give Codex users the same automatic Superpowers startup behavior Claude Code users already get, while keeping the current Codex plugin/skills path as a fallback during the `plugin_hooks` gated phase.

## Problem

Superpowers works best when the agent receives the `using-superpowers` bootstrap before it starts normal work. Claude Code gets that behavior through the Superpowers `SessionStart` hook: the hook injects the full `using-superpowers` skill content into session context, which causes agents to use skills automatically.

Codex currently installs Superpowers as a plugin and exposes the skills, but the Codex plugin package does not ship or declare the Superpowers startup hook. That means Codex users can install the skills, but they do not get the same reliable "you have Superpowers" startup bootstrap. They are still closer to the current workaround path: rely on the plugin/skills surface and prompt behavior instead of a trusted lifecycle hook.

Codex 0.130.0 now has the pieces needed for parity:

- `hooks` is stable and enabled by default.
- `plugins` is stable and enabled by default.
- `plugin_hooks` exists, is under development, and defaults to false.
- Installed plugins can bundle lifecycle hooks through manifest `hooks` entries or a default `hooks/hooks.json`.
- Codex provides a `/hooks` review/trust UI, with trusted hook hashes stored under `hooks.state`.

## Goals

1. Give Codex CLI users Claude Code parity for the Superpowers startup bootstrap.
2. Give Codex App users the same behavior when the app supports `plugin_hooks`.
3. Keep the current Codex plugin/skills support path working as a fallback.
4. Preserve Codex's explicit hook review and trust model.
5. Reuse the existing Superpowers hook implementation where practical.

## Non-Goals

- No `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, permission, or enforcement hooks in this phase.
- No silent auto-trust or installer-side trust writes to `~/.codex/config.toml`.
- No new product-specific behavior beyond the existing Superpowers bootstrap.
- No removal of the existing Codex install path while `plugin_hooks` remains under development.
- No broad plugin sync rewrite beyond what is needed to ship hooks.

## Current Claude Code Behavior

The Claude Code plugin currently ships:

- `.claude-plugin/plugin.json` and marketplace metadata.
- The 14 Superpowers skills under `skills/`.
- `hooks/hooks.json`, which declares one `SessionStart` hook matching `startup|clear|compact`.
- `hooks/run-hook.cmd`, a cross-platform wrapper for macOS, Linux, and Windows Git Bash.
- `hooks/session-start`, which reads `skills/using-superpowers/SKILL.md`, wraps it in the Superpowers bootstrap message, and emits `hookSpecificOutput.additionalContext` for Claude Code.

The Claude hook is bootstrap-only. It does not block tools, rewrite commands, or enforce policy. Its job is to make the agent aware of Superpowers at session start.

## Product Behavior

Codex users should get the same startup bootstrap after installing and trusting the hook:

1. User installs Superpowers from the Codex plugin marketplace.
2. User enables plugin hooks while the feature is gated:
   - CLI: `codex features enable plugin_hooks`.
   - App: use the same persisted feature configuration, or an App-native feature setting if one is verified.
3. User starts Codex.
4. Codex discovers the Superpowers plugin `SessionStart` hook.
5. Codex asks the user to review and trust it through `/hooks`.
6. Once trusted, new Codex sessions receive the `using-superpowers` bootstrap automatically.

While `plugin_hooks` is under development and default-off, this is an optional preview automatic startup path, not the default quickstart. If `plugin_hooks` is unavailable, disabled, or untrusted, Superpowers still works through the current Codex plugin and skills path: skills are installed and callable, but the automatic startup bootstrap does not run.

Do not document `codex app --enable plugin_hooks` as the App enablement path unless implementation re-verifies that it affects the App process. Codex source review indicates the `app` subcommand does not currently inherit root CLI `--enable` feature overrides, so persisted config is the safer documented path.

## Design

### 0. Contract Discovery Spike

Completed 2026-05-12 against:

- Official `openai/codex` source checkout `ac466c0` (`2026-05-12T16:50:45-07:00`).
- Installed CLI: `codex-cli 0.130.0`.
- App-bundled runtime: `/Applications/Codex.app/Contents/Resources/codex`, `codex-cli 0.130.0-alpha.5`.

Observed contract:

- Manifest `hooks: "./hooks/manifest-hooks.json"` resolves and appears in `hooks/list`.
- Omitted manifest `hooks` discovers default `hooks/hooks.json`.
- Manifest hook paths replace default discovery; a plugin with both `hooks: "./hooks/manifest-hooks.json"` and `hooks/hooks.json` listed only the manifest hook.
- Manifest hook paths must start with `./` and stay within the plugin root.
- Plugin hook commands expand `${PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_ROOT}` to the plugin root, and `${PLUGIN_DATA}` and `${CLAUDE_PLUGIN_DATA}` to the plugin data root.
- Hook process environment includes the same plugin root/data variables.
- `SessionStart` source values are `startup`, `resume`, and `clear`.
- `hooks/list` reports plugin hook keys in the form `plugin-id:relative-hook-source:event:index:index`, with `currentHash` and `trustStatus`.
- Untrusted plugin hooks list as enabled but do not run until trusted.
- Writing `hooks.state.<key>.trusted_hash` through `config/batchWrite` changes `trustStatus` to `trusted`.
- Changing the hook command after trust changes `trustStatus` to `modified`.
- A trusted plugin `SessionStart` hook runs on the first turn, emits `hook/started` and `hook/completed`, and injects `hookSpecificOutput.additionalContext`.
- Modified plugin hooks do not run.
- The App-bundled app-server runtime lists the same plugin hooks and trust states as the CLI runtime.

Unproven:

- The desktop App's visible `/hooks` review/trust UI path was not manually exercised. App runtime support is present, but docs should not claim user-facing App parity until that UI smoke passes.
- Claude Code acceptance of a `startup|clear|resume|compact` superset matcher still needs verification before changing the shared Claude hook declaration.

### 1. Ship Hooks In The Codex Plugin

The Codex plugin package should include:

- `hooks/hooks.json`
- `hooks/session-start`
- `hooks/run-hook.cmd`

The sync script currently excludes `/hooks/` from the Codex plugin package. Remove that exclusion or replace it with a narrower rule if future hook assets need filtering.

The sync tests should assert that the generated Codex plugin contains all hook files, and should use fixture coverage that fails if future sync changes accidentally drop hooks from the Codex package or PR/update preview output.

### 2. Declare The Hook In The Codex Manifest

Update `.codex-plugin/plugin.json` to declare the bundled hook:

```json
{
  "hooks": "./hooks/hooks.json"
}
```

Codex can also discover default `hooks/hooks.json` when the manifest omits `hooks`, but declaring it makes the contract explicit and easier to test.

Codex manifest hook rules to preserve in tests and implementation:

- `hooks` may be a manifest path string, a manifest path string array, an inline hook object, or an inline hook object array.
- Manifest hook paths must use plugin-relative `./...` paths.
- If manifest `hooks` is present, it replaces default `hooks/hooks.json` discovery; tests should not expect both to load.

### 3. Choose The Hook Declaration And Matcher

Claude Code currently uses `hooks/hooks.json` with a `SessionStart` matcher of `startup|clear|compact`.

Codex source review and local testing should treat Codex `SessionStart` source values as `startup`, `resume`, and `clear`. `compact` is not a Codex `SessionStart` source today. The implementation must cover resumed Codex sessions; otherwise a resumed session can miss the bootstrap.

Preferred outcome:

- Keep one shared `hooks/hooks.json` if both harnesses accept a superset matcher.
- Use matcher `startup|clear|resume|compact` in the shared declaration if verified safe for Claude Code and Codex.
- Use a command variable that both harnesses expand. Codex plugin hooks provide `PLUGIN_ROOT` and `CLAUDE_PLUGIN_ROOT`; they do not require or provide `CODEX_PLUGIN_ROOT`.

If a shared declaration is not safe, introduce `hooks/hooks-codex.json` and point `.codex-plugin/plugin.json` at it. The Codex-specific declaration should use `startup|resume|clear` and a Codex-verified command variable, preferably `PLUGIN_ROOT`.

Shared declaration candidate:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|resume|compact",
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

If Claude Code does not expand `PLUGIN_ROOT`, the shared declaration can continue using `CLAUDE_PLUGIN_ROOT` because Codex also provides that variable for plugin hooks. Do not design around `CODEX_PLUGIN_ROOT`.

### 4. Keep One Session-Start Script

`hooks/session-start` should remain the shared implementation. It already derives `PLUGIN_ROOT` from its own location, reads `skills/using-superpowers/SKILL.md`, escapes the bootstrap text for JSON, and emits the Claude-compatible nested output.

Update it only as needed to make Codex explicit:

- Simulate Codex with `PLUGIN_ROOT` and `CLAUDE_PLUGIN_ROOT`, not `CODEX_PLUGIN_ROOT`.
- Emit nested `hookSpecificOutput.additionalContext` for Codex `SessionStart`.
- Avoid the current unknown-platform top-level `additionalContext` fallback when running under Codex, because Codex's `SessionStart` parser expects `hookSpecificOutput.additionalContext`.
- Preserve existing Claude Code, Cursor, and Copilot behavior.
- Preserve Cursor's top-level `additional_context` behavior from `hooks/hooks-cursor.json`.
- Preserve Copilot's top-level `additionalContext` behavior.
- Make the legacy custom-skills warning platform-aware. The current warning tells users to move skills to `~/.claude/skills`; Codex users should not see Claude-specific migration advice unless it is also correct for their harness.
- Keep failure behavior quiet: if the script cannot read the skill file or a platform does not run hooks, basic plugin install still works.

The injected bootstrap content should match Claude Code parity: same `using-superpowers` content, same "You have superpowers" wrapper, and no Codex-specific policy beyond platform tool mappings already present in the skill references.

### 5. Preserve The Fallback Path

Do not remove or downplay current Codex plugin support. Update docs to describe two paths:

**Optional preview automatic startup path:** Codex 0.130.0+ with `plugin_hooks` enabled and the Superpowers hook trusted.

**Fallback path:** install the Superpowers plugin and use the available skills without native hook bootstrap. This remains necessary for users on older Codex builds, users who do not enable under-development features, and users who choose not to trust executable hooks.

## Documentation Changes

Update the README Codex CLI section:

- Keep the existing marketplace install steps.
- Add a short "Optional preview: enable automatic startup hook" subsection:
  - `codex features enable plugin_hooks`
  - install or update Superpowers
  - start Codex
  - open `/hooks`
  - review and trust the Superpowers `SessionStart` hook
- Explain that the trust prompt is expected because hooks execute local commands.
- Say that if users skip hook enablement/trust, the plugin skills remain installed but the automatic startup bootstrap may not run.
- Say that after updating Superpowers, users may need to open `/hooks` and re-review the hook if Codex marks it modified since last trust.

Update the Codex App section only as far as evidence supports:

- If App smoke passes, document the same persisted feature configuration and `/hooks` review path.
- If App smoke does not pass, say App automatic startup hook parity is pending verified App support while normal plugin skills remain available.

Update any Codex plugin install docs or sync docs that describe the shipped file set so they include `hooks/`.

Update `docs/windows/polyglot-hooks.md` if it still describes older hook filenames. The current wrapper path is `hooks/run-hook.cmd` dispatching to extensionless `hooks/session-start`, and docs should match the implementation before Codex hook support ships.

## Safety And Trust

Superpowers should not bypass Codex's hook trust model.

The production install path must rely on Codex's own review UI. Headless trust through `hooks/list` plus `config/batchWrite` is useful for local development or smoke tests, but it should not be documented as a normal user install path and should not be baked into the plugin.

This is especially important because a plugin `SessionStart` hook runs a local command. Even though Superpowers only injects bootstrap context, the trust boundary belongs to Codex and the user.

## Verification Plan

### Automated

1. Contract spike: use the recorded discovery results above; re-run the spike if the target Codex version changes materially before implementation.
2. Sync script test: generated Codex plugin includes `hooks/hooks.json`, `hooks/session-start`, and `hooks/run-hook.cmd`.
3. Sync fixture test: sync previews and marketplace/update outputs mention the hook file set when relevant.
4. Manifest test: `.codex-plugin/plugin.json` declares the hook path and uses a valid `./...` manifest-relative path.
5. Hook JSON test: the Codex hook declaration remains valid JSON and contains exactly one `SessionStart` hook.
6. Hook matcher test: Codex declaration covers `startup`, `resume`, and `clear`; shared declaration may also include `compact` only if verified safe.
7. Hook output test: running `hooks/session-start` with a simulated Codex plugin environment emits valid JSON with `hookSpecificOutput.hookEventName = "SessionStart"` and non-empty `additionalContext`.
8. Regression test: simulated Claude Code environment still emits the existing Claude-compatible nested output.
9. Regression test: simulated Cursor environment still emits top-level `additional_context`.
10. Regression test: simulated Copilot environment still emits top-level `additionalContext`.
11. Warning test: when a legacy `~/.config/superpowers/skills` directory exists, Codex output does not show Claude-specific migration advice.
12. Documentation test or grep check: README Codex CLI section mentions `plugin_hooks`, `/hooks`, trust, update re-review, and fallback.

### Manual Codex CLI Smoke

1. Install or stage the Superpowers Codex plugin.
2. Enable plugin hooks: `codex features enable plugin_hooks`.
3. Start Codex 0.130.0+.
4. Open `/hooks`.
5. Confirm Superpowers `SessionStart` appears as a plugin hook needing review.
6. Trust the hook.
7. Start a fresh session.
8. Send exactly: `Let's make a react todo list`.
9. Confirm the agent auto-triggers `superpowers:brainstorming` before writing code.
10. Resume a session and confirm the bootstrap still runs or remains available under the `resume` source.
11. Clear a session and confirm the bootstrap still runs under the `clear` source.

### Manual Codex App Smoke

1. Enable plugin hooks with persisted Codex feature config: `codex features enable plugin_hooks`.
2. Install or stage the Superpowers plugin in the App-managed plugin surface.
3. Restart the Codex App.
4. Confirm the App exposes the hook review/trust path.
5. Trust the Superpowers `SessionStart` hook.
6. Start a fresh App session.
7. Send exactly: `Let's make a react todo list`.
8. Confirm the agent auto-triggers `superpowers:brainstorming` before writing code.

If the App cannot expose the hook review path yet, the implementation is still useful for CLI but the release notes and docs must say App hook parity is pending verified App support.

### Manual Windows/Path Smoke

1. Stage the plugin at a path containing spaces.
2. Run the hook through `hooks/run-hook.cmd` to verify the Windows/Git Bash dispatch chain still finds extensionless `hooks/session-start`.
3. Confirm no shell quoting regression from the hook command variable change.

### Marketplace Rollout Smoke

1. Bump plugin metadata version as required by the existing release flow.
2. Run the sync script and verify the Codex plugin output includes hooks and manifest hook metadata.
3. Verify any marketplace PR or publication artifact includes hooks.
4. After marketplace publication, run `codex plugin marketplace upgrade` or reinstall/update through the supported path.
5. Restart Codex.
6. Open `/hooks`; if the hook is untrusted or modified since last trust, review and trust it again.
7. Run the CLI acceptance transcript.

## Acceptance Criteria

- The Codex contract spike is recorded in this spec and summarized in the implementation notes or PR body.
- Codex plugin packages include the Superpowers hook files.
- Codex manifest declares the hook path.
- The final hook declaration covers Codex `startup`, `resume`, and `clear` sources.
- Codex CLI can discover, review, trust, and run the Superpowers `SessionStart` hook.
- Codex CLI acceptance transcript shows `Let's make a react todo list` auto-triggering `superpowers:brainstorming` before code is written.
- Codex App support is verified manually with the same acceptance transcript or explicitly marked as pending in docs.
- Claude Code hook behavior is unchanged.
- Cursor and Copilot hook output shapes are unchanged.
- Current Codex plugin/skills fallback remains documented and functional.
- README does not imply automatic startup for Codex users who have not enabled and trusted plugin hooks.
- No enforcement hooks are added.
- No normal user install path writes trusted hook hashes directly.
- Hook updates require the normal Codex re-review/re-trust path.

## Alternatives Considered

### Codex-Specific Hook Copy

Create `hooks/hooks-codex.json` and possibly `hooks/session-start-codex`.

This lowers the risk of breaking Claude Code, but it duplicates behavior and makes future drift likely. Use this only if Codex's source matcher or command variable contract makes a shared hook file impractical.

### Docs-Only Hook Guidance

Document how users can configure hooks manually without shipping hooks in the Codex plugin.

This does not solve the product problem. It keeps Codex on the workaround path instead of giving users the same automatic startup behavior Claude Code users get.

### Auto-Trust During Install

Use `hooks/list` and `config/batchWrite` to write `hooks.state.<key>.trusted_hash`.

This is technically possible for development automation, but it is the wrong product boundary. Trusting executable plugin hooks should remain an explicit Codex/user action.

## Open Risks

- Codex App may lag Codex CLI in hook review UI exposure even though the app bundle includes a 0.130.x Codex binary.
- Claude Code may not expand `PLUGIN_ROOT`, requiring the shared declaration to keep using `CLAUDE_PLUGIN_ROOT` or the Codex package to use a separate declaration.
- A shared matcher of `startup|clear|resume|compact` must be verified in both harnesses before release. If either harness rejects unknown sources, split the declaration files.
- `plugin_hooks` is under development and default-off, so docs must avoid implying this is stable-by-default behavior.
- App support should not be claimed until the App review/trust path and clean-session transcript are proven.

## Rollout

1. Use the recorded contract discovery results; re-run only if Codex changes materially before implementation.
2. Choose shared `hooks/hooks.json` or Codex-specific `hooks/hooks-codex.json` based on the recorded evidence plus Claude Code matcher verification.
3. Land hook packaging, tests, and README updates while keeping fallback instructions.
4. Verify Codex CLI with the exact acceptance transcript.
5. Verify Codex App, or mark App automatic startup as pending.
6. Publish/update the Codex plugin package through the existing marketplace flow.
7. Re-test from the marketplace-installed plugin and re-trust the hook if Codex marks it modified.
8. Revisit fallback wording once `plugin_hooks` becomes stable and default-enabled in Codex.
