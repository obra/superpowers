# OpenCode Model Routing Design

## Goal

Enable this fork of Superpowers to delegate OpenCode V2 work to named model
profiles while keeping the controller workflow and every non-OpenCode harness
unchanged.

## Scope

This feature targets OpenCode V2 (2.0.4 or later). The existing OpenCode V1
plugin remains compatible and keeps its current tool mapping. The feature does
not add providers, credentials, or model definitions: OpenCode must already
make the four supplied `provider/model` identifiers available.

The supported roles are:

| OpenCode agent ID | Role | Model | Delegation use |
| --- | --- | --- | --- |
| `superpowers-expert` | EXPERT | `zai-org/GLM-5.3` | Architecture, high-risk debugging, security-sensitive analysis, and final reviews. |
| `superpowers-main` | MAIN | `z-ai/glm-5.3-flash` | Normal implementation and multi-step task execution. |
| `superpowers-economic` | ECONOMIC | `xiaomi/mimo-v2.5` | Repository exploration, routine research, and low-risk mechanical work. |
| `superpowers-economic-fast` | ECONOMIC_FAST | `deepseek/deepseek-v4-flash` | Short classification, focused lookups, and inexpensive validation. |

## Architecture

OpenCode discovers custom agents from a user's global
`~/.config/opencode/agents/` directory or from a project's `.opencode/agents/`
directory. The V2 plugin agent transform can update or remove catalog entries,
but cannot add a new one. Therefore the fork will ship four Markdown agent
profiles and an explicit, idempotent installer that copies them into a caller
selected OpenCode configuration directory.

The installer is deliberately opt-in. It takes `--config-dir <path>`, creates
`agents/` when necessary, copies a profile only when its destination does not
exist, and returns a non-zero result naming every conflicting destination. It
must never overwrite, delete, or parse a user's `opencode.jsonc` file. This
keeps existing providers, permissions, and agent customizations intact.

The existing V2 bootstrap will retain its OpenCode tool mapping and gain a
small routing section. When a Superpowers workflow delegates a child task, it
will select one of the four `superpowers-*` agents according to the table
above. If the controller cannot see the requested profile, it must fall back
to the built-in `general` agent and state that routing needs installation; it
must not invoke an unknown agent ID. The routing section applies only to V2,
whose native `subagent` tool accepts an `agent` ID. V1 keeps the current
`task`/`subagent_type: "general"` mapping unchanged.

`superpowers-main` is usable as a primary or subagent profile. Since OpenCode
stores a selected session model independently of the primary agent ID, the
installation documentation will show how to start a new main-model session
with `opencode run --model z-ai/glm-5.3-flash ...` or set the root `model`
field in the user's own config. Switching an already-created session agent is
not claimed to change that session's model.

## Components

1. `opencode/model-routing/agents/*.md` contains one V2-valid Markdown agent
   profile per role. Each profile has a unique `superpowers-*` ID, a precise
   description, `mode: all`, the exact model identifier, and no broader
   permissions than OpenCode's normal inherited behavior.
2. `scripts/install-opencode-model-routing.mjs` validates the single required
   argument, resolves it to an absolute directory, and installs the profiles
   without overwriting user files. It prints installed and skipped/conflicting
   paths so the operator can act deliberately.
3. `.opencode/plugins/superpowers.js` adds the V2-only routing guidance to the
   injected bootstrap while preserving the present V1 and V2 tool mappings,
   cache behavior, and child-session exclusion.
4. `.opencode/INSTALL.md` and `docs/README.opencode.md` document prerequisites,
   exact installation commands for PowerShell and POSIX shells, model
   verification with `opencode models`, role selection, fallback behavior, and
   how to remove the copied profiles manually.
5. `tests/opencode/test-model-routing.mjs` exercises the installer against a
   temporary directory, asserts all four generated profiles' frontmatter and
   model IDs, verifies a collision leaves the user's file unchanged, and
   verifies the V2 bootstrap contains every role and the `general` fallback.
   `tests/opencode/run-tests.sh` will include this test in the non-integration
   suite.

## Data Flow

1. The user configures OpenCode providers and validates the four models with
   `opencode models`.
2. The user runs the supplied installer once against their OpenCode config
   directory.
3. OpenCode discovers the resulting global agent profiles on its next start.
4. The Superpowers V2 bootstrap tells the controller which named agent to use
   for each delegated task type.
5. The controller calls `subagent` with the selected agent ID; OpenCode applies
   that profile's model. If the profile was not installed, the controller uses
   `general` and identifies the missing setup rather than failing the task.

## Error Handling and Safety

- Missing, unreadable, or non-directory `--config-dir` values fail before any
  copy is attempted.
- Missing bundled profile files fail the installer without partial silent
  success; profiles copied before a later failure are listed so they can be
  inspected or removed.
- Existing destination files are never replaced. The command reports each
  collision and exits non-zero.
- The installer does not modify provider credentials, model catalogs,
  `opencode.json`, or `opencode.jsonc`.
- The plugin never attempts to choose a named role under OpenCode V1.

## Verification

The implementation will use RED-GREEN-REFACTOR. The routing test first fails
because the installer and profiles do not exist, then verifies successful
installation, exact profile metadata, non-overwrite collision handling, and
the V2-only bootstrap guidance. The full non-integration OpenCode suite runs
through `bash tests/opencode/run-tests.sh`; integration tests are reported
separately because they require an installed and authenticated OpenCode
runtime with all four models enabled.
