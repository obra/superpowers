# Kiro CLI v3 Integration Design

**Date:** 2026-07-29
**Status:** Implemented and locally verified on Kiro CLI 2.16.2; pull request creation deferred
**Scope:** Local implementation and validation only

Sections below marked ~~struck~~ record decisions superseded during implementation and local acceptance testing. The surrounding text is the shipped design.

## Context

Upstream Superpowers has no Kiro support of any kind. This design introduces it.

The starting point was a personal, unofficial configuration maintained by the contributor: a Kiro v2 JSON agent, never part of upstream. It proved that the general approach works — an agent that loads `using-superpowers` and a Kiro tool mapping at session startup, registers all Superpowers skills through native `skill://` resources, and invokes matching skills through Kiro's native **Load skill** tool. Nothing of it is carried over. The v3 Markdown agent described here is new work, and the JSON form is treated as prior art rather than a baseline to preserve compatibility with.

Because the integration is new, there is also no Kiro installation or update path to extend. Kiro Powers cannot currently package native custom agents and Agent Skills as one CLI-installable artifact, and Kiro CLI has no supported plugin installation command equivalent to the mature harness integrations.

This design therefore adds a deliberately thin transitional installer while preserving a repository-local profile for development and acceptance testing. The installer is intended to be removed when Kiro provides a native package mechanism.

## Goals

- Provide a Kiro CLI v3 integration that automatically loads the Superpowers bootstrap at session start.
- Use native Kiro skill discovery and activation rather than manual `SKILL.md` reads.
- Provide a simple global install and update path that does not require Git.
- Install only new, namespaced artifacts and never patch existing personal configuration.
- Keep the Kiro-specific installer small enough for upstream maintainers to review and remove easily.
- Support repository-local development and the upstream clean-session acceptance test.
- Preserve normal Kiro permission behavior for consequential tools.
- Give Superpowers skill templates a neutral general-purpose subagent to dispatch to.

## Non-goals

- Kiro CLI v2 compatibility. v2 is on its way out: it is no longer being extended, Kiro itself prompts users to migrate with `/upgrade-agent`, and new capabilities land in v3 only. Supporting both would mean maintaining two agent formats for a surface that is being retired, so the integration targets v3 exclusively — including deliberately not carrying forward the contributor's prior v2 JSON agent.
- Native Windows support in the first version. The supported installer environments are macOS, Linux, and WSL.
- A Kiro Power, package manager, version manager, update daemon, doctor command, or rollback history.
- Cryptographic signing or a new Superpowers release-asset pipeline.
- Classic or non-interactive Kiro execution while v3 requires its TUI.
- Pull request creation or submission before local branch testing is complete.

## Chosen Approach

Use a thin mutable global installation plus a repository-local development profile.

The installer downloads a selected stable release into one fixed namespaced directory and creates global Kiro agents that reference that directory. Running the installer again replaces the managed payload. It does not retain old versions or reproduce functionality expected from a future native Kiro package manager.

Repository-local installation is not the canonical user path. Existing harnesses use native plugin, extension, marketplace, or package installation; Pi's checkout-based mode is explicitly a local-development path. The repository profile serves the same development and acceptance role for Kiro.

For the porting guide's taxonomy this is a new shape: an **agent-profile** integration, where selecting a named agent is what loads the bootstrap. There is no shell hook, no code plugin, and no always-read instructions file.

## Package Layout

The upstream repository adds or updates these paths:

- `.kiro/agents/superpowers.md` — repository-local Kiro v3 profile.
- `.kiro/agents/superpowers-worker-default-model.md`, `.kiro/agents/superpowers-worker-lite-model.md` — neutral workers for skill-template dispatch.
- `skills/using-superpowers/references/kiro-tools.md` — canonical Kiro action-to-tool mapping.
- `scripts/install-kiro.sh` — minimal POSIX installer and updater.
- `docs/README.kiro.md` — detailed installation, runtime, limitation, and troubleshooting documentation.
- `README.md` — concise Kiro installation entry linking to the detailed document.
- `docs/porting-to-a-new-harness.md`, `docs/testing.md` — register the new shape and the test directory.
- `scripts/sync-to-codex-plugin.sh` — exclude `/.kiro/` alongside the other harness dotdirs.
- `tests/kiro/` — profile, mapping, installer, and generated-resource tests.

No Superpowers skill body is changed. No Kiro Power is added.

## Runtime Architecture

### Repository-local profile

The profile uses workspace-relative resources:

```yaml
tools: ["*"]
resources:
  - file://skills/using-superpowers/SKILL.md
  - file://skills/using-superpowers/references/kiro-tools.md
  - skill://skills/**/SKILL.md
permissions:
  rules:
    - capability: fs_read
      effect: allow
    - capability: skill
      effect: allow
```

The relative paths resolve from the Kiro session's working directory. This profile is run from the Superpowers checkout with:

```bash
kiro-cli chat --agent superpowers --agent-engine v3
```

### Installed profile

The global profile has the same tools, resource roles, permissions, prompt, and welcome message. Its resource URIs are absolute because users invoke it from arbitrary project directories. The installer produces each global agent by transforming the matching tracked `.kiro/agents/*.md` from the payload — substituting the `{{SUPERPOWERS_SKILLS_DIR}}` placeholder with the absolute skills directory (so the agent reads a skill's own reference files, such as `code-reviewer.md`, straight from the payload rather than globbing the workspace), inserting the install root into every resource URI, and adding the ownership marker — so the tracked files remain the single source of truth and cannot drift from what is installed. Conceptually, it contains:

```yaml
resources:
  - file:///absolute/install/root/skills/using-superpowers/SKILL.md
  - file:///absolute/install/root/skills/using-superpowers/references/kiro-tools.md
  - skill:///absolute/install/root/skills/**/SKILL.md
```

~~Absolute `skill://` glob behavior has not yet been verified. Proving it from a project outside the Superpowers checkout is the first runtime implementation gate. If Kiro does not support the absolute skill resource, implementation stops and the installation design is revised.~~ **Verified:** an installed-profile session started from an unrelated project resolved both absolute `file://` resources and the absolute `skill://` glob, and invoked `brainstorming` before implementation. The gate passed, so the fallback of copying skills into Kiro's global skills directory was never needed and remains prohibited.

### Neutral worker agents

Superpowers skill templates dispatch `Subagent (general-purpose):` and supply the persona, checklist, and output format entirely in the prompt — the template *is* the worker's role. Kiro exposes only purpose-built agents, so a `requesting-code-review` dispatch had no neutral target and substituted a named reviewer, silently replacing the template's checklist, severity calibration, read-only constraint, and output format with that agent's own contract. This was found in local testing, not in the original design.

The integration therefore ships two neutral workers, in the repository profile and from the installer:

- `superpowers-worker-default-model` — omits `model`, so Kiro resolves it.
- `superpowers-worker-lite-model` — pins `claude-sonnet-5` for mechanical, fully specified work.

Both grant `tools: ["*"]`, pre-approve `fs_read` and `skill` for the same reason the main profile does, and register `skill://` discovery so a template may name a skill. Their body instructs them to treat the dispatching prompt as the complete specification, and they carry no role, checklist, or output conventions.

They deliberately do not *declare* the bootstrap resources. That is defense in depth rather than a guarantee: on at least one surface a dispatching session propagates its own startup resources into the subagent regardless, and what actually protects the template is the bootstrap's own `<SUBAGENT-STOP>` clause. The assertion in `tests/kiro/test-agent-config.sh` tests the declaration, not the runtime context.

Model tiering is expressed by choosing a worker, not by passing a model per dispatch, because a per-stage model value is not honored on every surface and can be dropped silently. Omitting `model` does not necessarily inherit the parent session's model.

**Rejected:** one worker per skill role, which multiplies configs without adding capability; a per-dispatch model argument, which is not reliably honored; and a third read-only worker for review dispatches, which would enforce the review template's read-only promise at config level but exceeds the agreed two workers, and one worker must serve implementers that legitimately write. The read-only constraint stays prose in the template, as upstream intends.

**Accepted costs:** the installer manages three agent files instead of one. It generates all three by transforming the tracked profiles rather than embedding copies, which keeps it around 95 non-comment lines.

### Startup and skill activation

At startup, Kiro:

1. Loads `using-superpowers` through the first `file://` resource.
2. Loads the Kiro tool mapping through the second `file://` resource.
3. Discovers metadata for all matching `SKILL.md` files through the `skill://` glob.
4. Loads full skill content on demand through native **Load skill** invocation.

The bootstrap mapping states that `using-superpowers` is already loaded and must not be loaded a second time.

### Permissions

The profile exposes the normal Kiro tool set through `tools: ["*"]`. Only workspace reads and native skill activation are pre-approved. Shell commands, writes, network access, and other consequential operations retain Kiro's normal permission behavior. The integration does not alter global permission settings.

## Kiro Tool Mapping

The canonical mapping translates platform-neutral Superpowers actions into Kiro capabilities. It covers native skill loading; file reads, writes, and searches; shell commands; code intelligence; subagent dispatch; todo-list tracking; web search and retrieval; and fallback behavior when subagent or todo tools are unavailable.

For subagent dispatch it names the worker in the step that performs the dispatch, rather than stating the rule elsewhere on the page, and forbids substituting a purpose-built agent — requiring the agent to stop and say so instead. If a dispatch fails because a pinned model is rejected, the fallback is the default-model worker, never a purpose-built agent, with the rejected identifier reported.

The mapping also documents a Kiro tool-schema compatibility issue: `todo_list.tasks` may be exposed with an underspecified type. Creation calls must pass an array of objects containing `task_description`:

```json
{
  "command": "create",
  "task_list_description": "Design the integration",
  "tasks": [
    {"task_description": "Explore project context"},
    {"task_description": "Present the design"}
  ]
}
```

Arrays of strings and objects using `description` are explicitly identified as invalid.

## Installer Design

### Interface

The script supports only two installation forms:

```bash
./scripts/install-kiro.sh             # latest stable release
./scripts/install-kiro.sh v1.2.3      # selected stable release
```

The latest form resolves the latest GitHub release tag; a failure to resolve it reports that specifically rather than blaming a version argument the user did not pass. The selected form downloads the matching tagged source archive. The script requires standard POSIX tools, `curl`, and `tar`; it does not require Git, Node.js, Python, or `jq`.

The implementation should remain roughly 100 lines of straightforward POSIX shell, excluding comments. This is a review goal, not a test-enforced line limit. The shipped script is 116 lines; the overshoot is the two worker configs and the shadowing guard, both added after the original design.

### Destinations

- Payload: `${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro`
- Agents: `$HOME/.kiro/agents/superpowers.md` and the two worker profiles

~~The installer creates only the payload and `superpowers.md`.~~ **Superseded:** it creates four paths, the payload plus three agents. The fixed payload path keeps the generated agents stable across updates. A relative `XDG_DATA_HOME` is refused, because it would install into the current working directory and emit relative resource URIs while still reporting success.

### Installation flow

1. Validate required commands, arguments, and that the payload path is absolute.
2. Refuse any managed agent path that lacks the Superpowers installer ownership marker.
3. Refuse when a same-named `.json` config sits beside a managed Markdown agent.
4. Refuse an existing payload directory that lacks the ownership marker.
5. Download and extract the release into a temporary directory over HTTPS only.
6. Validate the required agent, worker, bootstrap, mapping, and skill files.
7. Confirm that the archive's declared version matches the selected tag after normalizing the tag's `v` prefix.
8. Add the ownership/version marker to the staged payload.
9. Replace the single managed payload directory.
10. Generate the three global agents by transforming the tracked `.kiro/agents/*.md` shipped in the payload — substituting the `{{SUPERPOWERS_SKILLS_DIR}}` placeholder with the absolute skills directory, inserting the install root into each resource URI, and adding the ownership marker — rather than embedding copies. Each is written to a temporary file renamed into place.
11. Print the command that starts the Superpowers agent.

All refusals precede tag resolution and the download, so a refused run leaves the filesystem untouched. Staging ensures that download or extraction failures do not damage an existing installation. Because the staged payload already contains its ownership marker, an interruption after payload replacement remains recognizable as managed state and a rerun can repair the installation. The script does not implement multi-destination transaction coordination or retained rollback state.

**Accepted without change:** there is no rollback across the three agent writes. A failure leaves a partial install, recovered by rerunning; the ownership guard makes a rerun safe, and rollback logic would cost more than the failure it prevents.

### Shadowing guard

A Kiro agent may be defined by either `<name>.md` or `<name>.json`, and the JSON form takes precedence. The original ownership guard inspected only the Markdown paths, so an existing `superpowers.json` — from a manual setup, or from an install predating this Markdown installer — was invisible: the installer reported success while writing an agent that never loads. This was hit in practice during local acceptance testing.

The guard therefore also refuses when a same-named `.json` config exists next to any managed Markdown path, naming both files. It never deletes or rewrites the JSON config; the user moves it aside. **Rejected:** silently preferring the Markdown agent, or writing JSON instead — both guess at intent for a file the installer does not own.

**Open question:** the guard checks exactly `${managed%.md}.json`. Only `.md` and `.json` are known to be honored; if Kiro v3 loads agent configs from another extension, the same silent-shadowing bug recurs with that suffix.

### Updating, removal, and archive integrity

Running the same command again replaces the managed payload with the latest or selected release. There is no separate updater and no automatic update check.

The script has no uninstall mode. Documentation provides the manual removals and instructs users to inspect the ownership marker on every managed path — not just one — before deleting anything, so a hand-written worker config cannot be destroyed by following the recipe.

The installer downloads GitHub-generated release archives over HTTPS, refusing redirects to other protocols, and validates their required structure and declared version. It does not claim cryptographic checksum or signature verification because Superpowers does not currently publish corresponding release assets. Adding signed artifacts is a separate release-system project.

### Explicitly omitted complexity

Version history and rollback; status, doctor, repair, or migration commands; lock management; background or automatic updates; built-in uninstallation; checksums or signatures; a general-purpose installation framework; a Power wrapper.

## Documentation

`README.md` contains a short Kiro entry and links to `docs/README.kiro.md`. The detailed document covers Kiro CLI v3 prerequisites; latest and pinned installation; a download-inspect-run alternative to piping remote shell code; updating by rerunning the installer; manual removal with ownership-marker checks on every managed path; global and repository-local invocation; the worker agents and how tiers are chosen; native skill activation and permissions; TUI and non-interactive limitations; collision, shadowing, and resource-loading troubleshooting; why Kiro Powers are not used initially; and the installer's transitional status pending native Kiro package installation.

Known limitations are stated rather than implied: model identifiers are not validated when a config is written, so a wrong one surfaces only at dispatch; the agent list is fixed at session start, so a restart is required after installing; and install paths containing spaces are untested, because the generated URIs embed the payload path without percent-encoding.

The concise install form is:

```bash
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/scripts/install-kiro.sh | sh
```

A pinned release is passed as the script's positional argument.

## Testing

### Automated tests

`tests/kiro/` covers the repository profile's resources, tools, permissions, prompt, and welcome message; worker neutrality as a closed property, asserting the permitted frontmatter keys and exact body so any added persona fails; required entries and the valid todo payload in the canonical mapping; the documentation contract; successful installation into a temporary `HOME` using local archive fixtures and a stubbed `curl` on `PATH`; generated absolute startup and skill resource paths; a second installation replacing the first managed version; refusal to overwrite an unmanaged agent, an unmanaged worker, or an unmanaged payload; refusal to install beside a shadowing `.json` config; refusal of a relative `XDG_DATA_HOME`; an accurate error when the latest release cannot be resolved; rejection of an archive missing required files; preservation of unmanaged content on every tested failure, plus the absence of any other artifact after a refusal; and semantic parity between repository-local and generated profiles.

Tests do not make live network requests, depend on GitHub availability, test shell implementation details, or enforce an exact installer line count.

### Manual runtime acceptance

Kiro v3 currently requires its TUI, so runtime acceptance is manual rather than automated through brittle terminal control. Both paths passed and are a hard completion gate.

Repository-local: start a clean session with the repository profile, send exactly `Let's make a react todo list`, and confirm `Load skill: brainstorming` occurs before any implementation action.

Installed-profile: install into a temporary home, start Kiro from a project outside the Superpowers checkout, send the same prompt, and confirm the absolute resources resolve and native `brainstorming` precedes implementation.

Worker acceptance, on Kiro CLI 2.16.2:

- **Markdown workers are dispatchable.** A `requesting-code-review` run dispatched `Subagent superpowers-worker-default-model` and delivered the `code-reviewer.md` template verbatim, with no substitution.
- **The per-agent model pin is honored.** The default-model worker recorded `claude-opus-5` in its sub-execution transcript. The lite worker records no model, because it emits no reasoning payloads for an identifier to attach to, so a probe agent pinned to a deliberately invalid identifier was dispatched instead: that dispatch failed with a rejected-model error. A rejected pin fails loudly, so an accepted pin is applied — `claude-sonnet-5` is valid on the tested account and the two workers run different models. The same probe incidentally exercised the rejected-model fallback rule.

A subagent cannot read its own agent name from its context, so worker attribution comes from Kiro's `sub_agent_start` records rather than from self-report.

## Release and Maintenance

The integration introduces no release assets, package registry, checksums, or new release workflow. Existing Superpowers release archives naturally include the Kiro files. The Kiro profile has no embedded version field, so `.version-bump.json` does not need an entry unless implementation reveals an upstream registration requirement.

The installer is intentionally disposable. When Kiro supplies a supported native plugin or package mechanism, the agent profiles, tool mapping, and tests should be reused while the shell installer and transitional documentation are removed. Kiro Powers are not that mechanism yet: as of Kiro CLI 2.16.2 and IDE 1.0.288 a Power bundles skills and MCP servers but cannot deliver an agent, which this integration requires.

## Upstream Contribution Strategy

Pull request creation is deferred until the local branch passes automated tests, both TUI acceptance paths, and human diff review.

A later PR will target `dev`; contain only Kiro harness support; include the clean-session transcripts and tested Kiro/model versions; explain that the installer creates new namespaced artifacts and never patches settings, startup files, or existing agents; identify the installer as the only policy-sensitive component; explain why repository-local use alone is not presented as complete end-user installation; record that ShellCheck was unavailable locally so that gate is unrun rather than claimed; and invite replacement by Kiro's future native package mechanism.

If maintainers interpret the harness-owned-installation rule as requiring a Kiro-provided install command, the integration should wait for that capability rather than claim repository-local setup as complete support.

## Success Criteria

All met at the time of writing:

- The repository-local agent auto-loads the bootstrap and mapping.
- Native Kiro skill discovery exposes all upstream Superpowers skills.
- The thin installer installs and replaces a stable release without Git.
- Managed-artifact collision checks protect existing user files, including against a shadowing `.json` config.
- A global agent launched from an unrelated project resolves absolute resources.
- Both acceptance runs invoke `brainstorming` before implementation.
- Skill templates dispatch to a neutral worker rather than a purpose-built agent.
- Automated Kiro tests pass without network access.
- Documentation accurately states supported platforms, permissions, and limitations.
- No PR is created until the user separately approves submission after local testing.
