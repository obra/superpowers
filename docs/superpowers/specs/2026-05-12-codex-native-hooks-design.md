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
   - CLI: `codex features enable plugin_hooks`, or launch with `--enable plugin_hooks`.
   - App: launch with `codex app --enable plugin_hooks`, or use the equivalent app configuration when available.
3. User starts Codex.
4. Codex discovers the Superpowers plugin `SessionStart` hook.
5. Codex asks the user to review and trust it through `/hooks`.
6. Once trusted, new Codex sessions receive the `using-superpowers` bootstrap automatically.

If `plugin_hooks` is unavailable, disabled, or untrusted, Superpowers still works through the current Codex plugin and skills path. The native hook path is preferred, but not required yet.

## Design

### 1. Ship Hooks In The Codex Plugin

The Codex plugin package should include:

- `hooks/hooks.json`
- `hooks/session-start`
- `hooks/run-hook.cmd`

The sync script currently excludes `/hooks/` from the Codex plugin package. Remove that exclusion or replace it with a narrower rule if future hook assets need filtering.

The sync test should assert that the generated Codex plugin contains the hook files.

### 2. Declare The Hook In The Codex Manifest

Update `.codex-plugin/plugin.json` to declare the bundled hook:

```json
{
  "hooks": "./hooks/hooks.json"
}
```

Codex can also discover default `hooks/hooks.json` when the manifest omits `hooks`, but declaring it makes the contract explicit and easier to test.

### 3. Reuse The Existing Hook Configuration

Prefer reusing `hooks/hooks.json` as the shared hook declaration for Claude Code and Codex:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
            "async": false
          }
        ]
      }
    ]
  }
}
```

Implementation must verify whether Codex expands `CLAUDE_PLUGIN_ROOT`, `CODEX_PLUGIN_ROOT`, both, or neither for plugin-bundled hooks. If Codex only expands `CODEX_PLUGIN_ROOT`, either:

- make the command use a Codex-compatible variable in a shared-safe way, or
- introduce `hooks/hooks-codex.json` only if a shared declaration cannot work.

The preferred end state is one shared hook declaration. A Codex-specific hook file is acceptable only if the platform variable contract forces it.

### 4. Keep One Session-Start Script

`hooks/session-start` should remain the shared implementation. It already derives `PLUGIN_ROOT` from its own location, reads `skills/using-superpowers/SKILL.md`, escapes the bootstrap text for JSON, and emits the Claude-compatible nested output.

Update it only as needed to make Codex explicit:

- Detect Codex via `CODEX_PLUGIN_ROOT`, Codex-specific environment, or a reliable fallback discovered during implementation.
- Emit nested `hookSpecificOutput.additionalContext` for Codex `SessionStart`.
- Avoid the current unknown-platform top-level `additionalContext` fallback when running under Codex, because Codex's `SessionStart` parser expects `hookSpecificOutput.additionalContext`.
- Preserve existing Claude Code, Cursor, and Copilot behavior.
- Keep failure behavior quiet: if the script cannot read the skill file or a platform does not run hooks, basic plugin install still works.

The injected bootstrap content should match Claude Code parity: same `using-superpowers` content, same "You have superpowers" wrapper, and no Codex-specific policy beyond platform tool mappings already present in the skill references.

### 5. Preserve The Fallback Path

Do not remove or downplay current Codex plugin support. Update docs to describe two paths:

**Recommended automatic startup path:** Codex 0.130.0+ with `plugin_hooks` enabled and the Superpowers hook trusted.

**Fallback path:** install the Superpowers plugin and use the available skills without native hook bootstrap. This remains necessary for users on older Codex builds, users who do not enable under-development features, and users who choose not to trust executable hooks.

## Documentation Changes

Update the README Codex CLI and Codex App sections:

- Keep the existing marketplace install steps.
- Add a short "Enable automatic startup hook" subsection:
  - `codex features enable plugin_hooks`
  - install or update Superpowers
  - start Codex
  - open `/hooks`
  - review and trust the Superpowers `SessionStart` hook
- Explain that the trust prompt is expected because hooks execute local commands.
- Say that if users skip hook enablement/trust, the plugin skills remain installed but the automatic startup bootstrap may not run.

Update any Codex plugin install docs or sync docs that describe the shipped file set so they include `hooks/`.

## Safety And Trust

Superpowers should not bypass Codex's hook trust model.

The production install path must rely on Codex's own review UI. Headless trust through `hooks/list` plus `config/batchWrite` is useful for local development or smoke tests, but it should not be documented as a normal user install path and should not be baked into the plugin.

This is especially important because a plugin `SessionStart` hook runs a local command. Even though Superpowers only injects bootstrap context, the trust boundary belongs to Codex and the user.

## Verification Plan

### Automated

1. Sync script test: generated Codex plugin includes `hooks/hooks.json`, `hooks/session-start`, and `hooks/run-hook.cmd`.
2. Manifest test: `.codex-plugin/plugin.json` declares the hook path.
3. Hook JSON test: `hooks/hooks.json` remains valid JSON and contains exactly one `SessionStart` hook.
4. Hook output test: running `hooks/session-start` with a simulated Codex environment emits valid JSON with `hookSpecificOutput.hookEventName = "SessionStart"` and non-empty `additionalContext`.
5. Regression test: simulated Claude Code environment still emits the existing Claude-compatible nested output.
6. Documentation test or grep check: README Codex sections mention `plugin_hooks`, `/hooks`, trust, and fallback.

### Manual Codex CLI Smoke

1. Install or stage the Superpowers Codex plugin.
2. Enable plugin hooks: `codex features enable plugin_hooks`.
3. Start Codex 0.130.0+.
4. Open `/hooks`.
5. Confirm Superpowers `SessionStart` appears as a plugin hook needing review.
6. Trust the hook.
7. Start a fresh session.
8. Ask for a simple build task and confirm the agent begins with Superpowers skill discipline without manual bootstrap prompting.

### Manual Codex App Smoke

1. Launch Codex App with plugin hooks enabled: `codex app --enable plugin_hooks`.
2. Install or stage the Superpowers plugin in the App-managed plugin surface.
3. Confirm the App exposes the hook review/trust path.
4. Trust the Superpowers `SessionStart` hook.
5. Start a fresh App session.
6. Confirm the `using-superpowers` bootstrap is injected automatically.

If the App cannot expose the hook review path yet, the implementation is still useful for CLI but the release notes and docs must say App hook parity is pending verified App support.

## Acceptance Criteria

- Codex plugin packages include the Superpowers hook files.
- Codex manifest declares the hook path.
- Codex CLI can discover, review, trust, and run the Superpowers `SessionStart` hook.
- Codex App support is verified manually or explicitly marked as pending in docs.
- Claude Code hook behavior is unchanged.
- Current Codex plugin/skills fallback remains documented and functional.
- No enforcement hooks are added.
- No normal user install path writes trusted hook hashes directly.

## Alternatives Considered

### Codex-Specific Hook Copy

Create `hooks/hooks-codex.json` and possibly `hooks/session-start-codex`.

This lowers the risk of breaking Claude Code, but it duplicates behavior and makes future drift likely. Use this only if Codex's hook command variable contract makes a shared hook file impractical.

### Docs-Only Hook Guidance

Document how users can configure hooks manually without shipping hooks in the Codex plugin.

This does not solve the product problem. It keeps Codex on the workaround path instead of giving users the same automatic startup behavior Claude Code users get.

### Auto-Trust During Install

Use `hooks/list` and `config/batchWrite` to write `hooks.state.<key>.trusted_hash`.

This is technically possible for development automation, but it is the wrong product boundary. Trusting executable plugin hooks should remain an explicit Codex/user action.

## Open Risks

- Codex App may lag Codex CLI in hook review UI exposure even though the app bundle includes a 0.130.x Codex binary.
- Codex may not expand `CLAUDE_PLUGIN_ROOT`, requiring a Codex-compatible command variable or a Codex-specific hook declaration.
- The `startup|clear|compact` matcher should be verified against Codex's `SessionStart` source values before release.
- `plugin_hooks` is under development and default-off, so docs must avoid implying this is stable-by-default behavior.

## Rollout

1. Land the shared hook packaging and docs while keeping fallback instructions.
2. Verify Codex CLI.
3. Verify Codex App.
4. Publish/update the Codex plugin package.
5. Revisit the fallback wording once `plugin_hooks` becomes stable and default-enabled in Codex.
