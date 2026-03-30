# Codex Native Subagents for Superpowers

Move Superpowers' Codex integration from a `worker`-plus-inline-prompt workaround to first-class Codex agent roles installed through `.codex/agents`, while keeping a compatibility fallback for partial or older installs.

## Motivation

The repository already has a strong subagent story at the skill level:

- `subagent-driven-development` expects specialized reviewer roles
- `requesting-code-review` assumes a reusable code-review agent
- document-review flows assume stable reviewer behavior

The current Codex support does not match that architecture. It still documents Codex as if it only had built-in roles and no native agent registry. As a result:

- Codex instructions collapse most specialized reviewer work into `spawn_agent(agent_type="worker", message=...)`
- installation only wires `skills/`, not `agents/`
- the Codex docs still present `features.multi_agent = true` as a practical prerequisite
- Codex tests validate the old fallback model rather than the native role model that current Codex supports

This creates three problems:

1. the repository documentation no longer matches current Codex behavior
2. Codex users do not get the role-level consistency that Superpowers expects
3. the fallback path is treated as the main design, which makes the integration less native and harder to evolve

The goal is to make Codex a first-class target for Superpowers subagent workflows by installing real Codex roles and treating them as the primary path.

## Empirical Findings

This design is based on the current open-source Codex codebase, the current official Subagents documentation, and a live local Codex installation.

### Current Codex capabilities

- `codex exec` is available in the local installation and supports non-interactive execution with `--json`, `-C`, `--skip-git-repo-check`, `--add-dir`, and explicit sandbox selection
- the local installation is `codex-cli 0.118.0-alpha.3`
- the local config currently has no `~/.codex/agents/` directory yet, so custom roles are not installed today

### Built-in role model

Codex currently treats `default`, `explorer`, and `worker` as built-in roles for `spawn_agent`:

- `default` is the fallback when `agent_type` is omitted
- `explorer` is the built-in for focused codebase questions
- `worker` is the built-in for execution and production work

`awaiter` exists in source as an embedded artifact but is currently commented out as an active built-in, so it should not be treated as part of the supported role surface.

### Custom role model

Codex supports custom roles as first-class runtime entities:

- `spawn_agent.agent_type` is a free-form string validated against loaded roles
- unknown role names fail at runtime with `unknown agent_type`
- user-defined roles are loaded from config declarations and from `agents/**/*.toml`
- user-defined roles appear in the generated `spawn_agent` role list alongside built-ins
- user-defined roles can override built-ins of the same name

This means Superpowers does not need to pretend Codex lacks native agent roles. It can install and use them directly.

### Role file validation constraints

Codex's role loader imposes meaningful constraints:

- every role must define a description
- auto-discovered standalone role files must define `developer_instructions`
- malformed role files are ignored with startup warnings rather than silently half-loading
- role files may also define locked model and reasoning settings

These constraints are useful because they force Superpowers' Codex roles to be explicit and self-describing.

### Role visibility in UI and history

Codex surfaces role names through its collaboration metadata and TUI labels. A spawned subagent can visibly appear as a named agent with a role such as `[explorer]`. That makes stable, readable role names worth designing carefully.

### Policy constraints around spawning

Codex's tool guidance is explicit that subagents should only be used when the user has actually asked for subagents, delegation, or parallel agent work. Superpowers must not encode a design that tries to bypass that policy. This proposal changes how specialized subagents are represented once they are used; it does not expand when they may be used.

## Design Goals

- Make Codex roles a first-class installation artifact for Superpowers, not a hidden workaround
- Preserve the existing Superpowers role semantics for reviewer-style subagents
- Avoid overriding Codex built-ins such as `worker` or `explorer`
- Keep compatibility for installs that only have the skills symlink
- Update docs and tests so they describe and verify the real behavior of current Codex

## Non-Goals

- Replacing Codex built-ins wholesale
- Changing the policy boundary for when subagents may be spawned
- Rewriting every Superpowers skill in this phase
- Eliminating the compatibility fallback entirely

## Architecture

Superpowers should add a native Codex agent catalog under:

- `.codex/agents/`

Real Codex verification on March 30, 2026 found an important loader constraint: current role discovery walks `agents/` but does not recurse into symlinked subdirectories. Because of that, these files should be installed into the user's Codex config as direct TOML files under:

- `~/.codex/agents/`

This mirrors the current skill installation model:

- `~/.agents/skills/superpowers -> ~/.codex/superpowers/skills`

The result is a two-part Codex installation:

1. skills remain the orchestration layer
2. agent role TOMLs become the native reusable role layer

The skills stay responsible for:

- deciding which specialized subagent is appropriate
- preparing task-specific context
- dispatching the subagent
- handling review loops and controller logic

The role TOMLs become responsible for:

- stable reviewer behavior
- reusable role descriptions in the `spawn_agent` tool help
- persistent Codex-native role identity
- any role-specific locked reasoning or model behavior if needed later

## Role Catalog

The first native Codex role set should focus on the places where stable specialization matters most: reviewer and document-review roles.

### Recommended roles

- `superpowers_reviewer`
- `superpowers_spec_reviewer`
- `superpowers_plan_reviewer`
- `superpowers_doc_reviewer`

### Why namespaced names

These roles should not be named `reviewer`, `explorer`, or `worker`:

- Codex lets custom roles override built-ins of the same name
- users may already have personal roles with generic names
- TUI labels and collaboration metadata should make the Superpowers origin obvious

`superpowers_*` names make the source and intent explicit and avoid accidental precedence collisions.

### Why not create `superpowers_implementer` yet

Implementation work already maps naturally to Codex's built-in `worker` role. Reviewer behavior benefits much more from stable native role definitions because:

- review prompts are repetitive and high-value
- consistent skepticism and output discipline matter more than broad execution flexibility
- these roles are reused across several Superpowers workflows

Keeping the implementer on `worker` also avoids over-expanding the initial role surface.

## Role File Shape

Each role should be represented as a standalone TOML file under `.codex/agents/`, with at least:

- `name`
- `description`
- `developer_instructions`

Optional future fields can include:

- `model`
- `model_reasoning_effort`
- `nickname_candidates`

The role files should keep `developer_instructions` stable and generic. Task-specific context stays in the controller's `spawn_agent` message.

That split is important:

- role TOML defines what kind of agent this is
- spawn message defines what this specific invocation should review or implement

## Dispatch Model

### Primary path

When Superpowers on Codex needs a specialized reviewer role, the primary dispatch path becomes:

- `spawn_agent(agent_type="superpowers_spec_reviewer", ...)`
- `spawn_agent(agent_type="superpowers_reviewer", ...)`
- `spawn_agent(agent_type="superpowers_plan_reviewer", ...)`
- `spawn_agent(agent_type="superpowers_doc_reviewer", ...)`

`worker` remains the primary implementation role.

`explorer` remains the primary role for focused codebase exploration.

### Compatibility fallback

If the native Superpowers role is not available in the current Codex installation, the skill should fall back to the existing degraded path:

- use `worker` or `default`
- inject the reviewer prompt inline through the spawn message

This fallback remains important because:

- some users may update the repo before re-running installation
- some tests or ephemeral environments may intentionally install only skills
- older or constrained environments may not yet have the copied agent TOMLs

### Preferred detection model

The skills reference should tell Codex to prefer the native `superpowers_*` role when it appears in the available role list of `spawn_agent`.

The skills do not need a separate filesystem probe if the model can already see the available roles in the tool description. The runtime truth is the loaded role list.

## Installation Changes

### `.codex/INSTALL.md`

The Codex install doc should change from a skills-only installation to a combined skills-and-agents installation:

1. clone `~/.codex/superpowers`
2. symlink `skills/` into `~/.agents/skills/superpowers`
3. copy `.codex/agents/*.toml` into `~/.codex/agents/`
4. restart Codex

The verify section should include both checks:

- `ls -la ~/.agents/skills/superpowers`
- `find ~/.codex/agents -maxdepth 1 -name 'superpowers_*.toml'`

### `docs/README.codex.md`

The Codex README should mirror the same installation steps and explain that:

- skills drive orchestration
- agents provide native Codex subagent roles

### Remove stale `multi_agent` requirement framing

The docs should stop instructing users to add:

```toml
[features]
multi_agent = true
```

as the normal prerequisite for subagent skills.

That setting may still be relevant in older Codex contexts, but it should no longer be presented as the default required step for current Codex installs. The docs should instead describe the current behavior plainly and only mention feature toggles as compatibility notes if necessary.

## Skill Reference Changes

`skills/using-superpowers/references/codex-tools.md` should be rewritten around the native role model.

### Current problem

It currently says:

- Codex has no named agent registry
- named agents should be translated into `worker` plus inline instructions

That is now stale and should no longer be the main guidance.

### New contract

The updated reference should say:

- Codex supports custom roles loaded from `~/.codex/agents` and project `.codex/agents`
- Superpowers installs native `superpowers_*` roles for Codex
- when a skill requests a specialized Superpowers agent, use the corresponding `superpowers_*` role if present
- if the role is unavailable, fall back to `worker` or `default` with inline instructions

The fallback stays documented, but explicitly as fallback.

## Workflow-Specific Mapping

### `requesting-code-review`

Current expectation:

- dispatch `superpowers:code-reviewer`

Codex-native mapping should become:

- primary: `superpowers_reviewer`
- fallback: `worker` with the current code-reviewer prompt content

### `subagent-driven-development`

Current reviewer phases:

- spec compliance review
- code quality review
- final code review

Codex-native mapping should become:

- spec compliance review -> `superpowers_spec_reviewer`
- code quality review -> `superpowers_reviewer`
- final code review -> `superpowers_reviewer`
- implementer -> built-in `worker`

### Document review flows

When a skill asks for a spec or plan reviewer:

- brainstorming-time spec document review -> `superpowers_doc_reviewer`
- implementation-time spec compliance review inside `subagent-driven-development` -> `superpowers_spec_reviewer`
- plan document review -> `superpowers_plan_reviewer`

This keeps the split explicit:

- `superpowers_doc_reviewer` checks whether a design/spec document is complete and planning-ready
- `superpowers_spec_reviewer` checks whether code matches an already-approved implementation spec
- `superpowers_plan_reviewer` checks whether a plan is implementation-ready

## Test Changes

The Codex test harness currently installs only skills into the isolated environment. That must change for the native-role design to be testable.

### `tests/codex/test-helpers.sh`

Update the isolated test environment so it also installs agents:

- create `$CODEX_HOME/agents`
- copy the repository's `.codex/agents/*.toml` files into `$CODEX_HOME/agents/`

The helper should also stop writing a default test config whose only purpose is forcing:

```toml
[features]
multi_agent = true
```

That setting should only be injected in a dedicated compatibility test if one is later added. It should not remain the default assumption baked into the main Codex test harness.

This keeps tests hermetic while exercising the real native role path.

### Fast Codex tests

The fast Codex tests should be updated to reflect the new truth:

- native roles exist and are preferred
- `multi_agent = true` is not the central installation step anymore
- fallback still exists, but is not the primary design

Add or adjust assertions so the skills/reference docs are evaluated against this updated behavior.

### Real integration test

`tests/codex/test-subagent-driven-development-integration.sh` should keep asserting real subagent usage, and where structured evidence allows, it should additionally assert that the native Superpowers reviewer role was used rather than only checking that some `spawn_agent` event happened.

The strongest acceptable evidence is:

- `spawn_agent` event with role details when available, or
- persisted session/collaboration metadata showing the spawned role

The test should not become brittle around exact transcript wording. It should stay evidence-based.

### Document review integration test

The document review integration test should continue to verify the review behavior itself, but the test harness should run in an environment where the native reviewer role is installable and available.

## Backward Compatibility

This design must preserve three states:

### Fresh full install

Expected behavior:

- native roles installed
- skills prefer `superpowers_*` roles
- fallback never needed during normal use

### Skills-only install from an older setup

Expected behavior:

- skills still work
- Codex falls back to `worker` or `default` plus inline reviewer instructions
- docs guide the user to update installation if they want the native role path

### Partial or isolated test environment

Expected behavior:

- the environment can deliberately install both skills and agents for full-path testing
- or only skills when explicitly testing fallback behavior

## Risks

### Risk: role proliferation

Too many native roles will make the Codex role list noisy and make maintenance harder.

Mitigation:

- start with a small reviewer-focused catalog
- avoid an implementer role in the first phase
- only add new roles when behavior meaningfully differs

### Risk: conflicting names with built-ins or user roles

Codex lets user-defined roles override built-ins of the same name.

Mitigation:

- use `superpowers_*` names
- do not redefine `worker` or `explorer`

### Risk: docs and install drift again

If role installation and docs are updated separately, users may end up with confusing mixed states.

Mitigation:

- land `.codex/agents/`, install docs, and Codex role reference together
- update tests in the same change set

### Risk: role behavior becomes too rigid

Locked model or reasoning settings in TOML can be helpful, but they can also become stale.

Mitigation:

- do not lock model or reasoning settings in the first version unless testing demonstrates a clear need
- keep the initial role files instruction-focused

## Rollout Plan

### Phase 1: Add native role artifacts and installation support

- add `.codex/agents/*.toml`
- update `.codex/INSTALL.md`
- update `docs/README.codex.md`
- update `skills/using-superpowers/references/codex-tools.md`

### Phase 2: Migrate skills and tests to prefer native roles

- update Codex-specific role mapping guidance in the relevant skills
- update `tests/codex/test-helpers.sh` to install agents
- update Codex tests to validate the new native path

### Phase 3: Verify end-to-end behavior

- run fast Codex tests
- run integration Codex tests
- verify that a real `codex exec` session can discover and use `superpowers_*` roles

## Success Criteria

- a standard Superpowers Codex install creates the skills symlink and copies the agent TOMLs directly into `~/.codex/agents/`
- Codex exposes `superpowers_*` roles in the `spawn_agent` role list
- Superpowers' Codex guidance treats those native roles as the primary dispatch path
- Codex tests install and validate the native role path
- compatibility fallback still works when the native roles are absent
- the repository no longer documents stale Codex assumptions as the primary model

## Scope Summary

This design does not try to rebuild Superpowers around Codex-specific mechanics. It keeps the existing skill architecture and upgrades the Codex integration to match what Codex already supports: native reusable subagent roles installed from `.codex/agents`.

The key change is conceptual as much as technical:

- `worker` plus inline reviewer prompts becomes the fallback
- native `superpowers_*` Codex roles become the intended path
