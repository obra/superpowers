# Lifecycle Extensions for Superpowers

## Problem

Superpowers keeps its core minimal by design, which means domain-specific skills, specialized reviews, and workflow customizations don't belong in the core repo. But there's no supported way for users to extend the superpowers lifecycle with their own skills. Users who want to add a step after plan execution or inject a specialized review have two bad options: submit a PR that will likely be rejected, or maintain a fork.

This creates unnecessary pressure on the core repo (94% PR rejection rate, many for domain-specific additions) and limits what users can do with superpowers without modifying it.

## Solution

Add a lifecycle extension system that lets users hook custom skills into specific moments in the superpowers workflow. Extensions are declared in a dedicated manifest file, not in skill frontmatter, keeping skills compliant with the agentskills.io specification and making the superpowers-specific wiring explicit.

## Design

### Lifecycle Events

Seven named events at key moments in the superpowers workflow. Events are named after lifecycle moments, not after specific skills — `post-execution` fires whether the user ran `executing-plans` or `subagent-driven-development`.

| Event | Fires when | Which core skills trigger it |
|-------|-----------|------------------------------|
| `post-brainstorm` | Design approved, before invoking writing-plans | brainstorming |
| `post-plan` | Plan written and approved, before execution begins | writing-plans |
| `pre-task` | Before each individual task starts | executing-plans, subagent-driven-development |
| `post-task` | After each task completes and passes review | executing-plans, subagent-driven-development |
| `post-execution` | All tasks done, before finishing-a-development-branch | executing-plans, subagent-driven-development |
| `post-review` | After any code review cycle completes | requesting-code-review |
| `pre-finish` | Before the merge/PR/discard decision | finishing-a-development-branch |

### Extensions Manifest

A YAML file that maps lifecycle events to skills. Two levels with defined precedence:

- **Personal:** `~/.superpowers/extensions.yaml`
- **Project:** `.superpowers/extensions.yaml` (in project root)

Project-level extensions merge on top of personal. For events defined in both, project entries append after personal entries (no replacement — both run).

```yaml
extensions:
  post-execution:
    - compound-learning
    - integration-smoke-test
  post-review:
    - security-audit
  pre-finish:
    - changelog-generator
```

**Rules:**
- Extension names reference skills by their `name` field (must be discoverable in standard skill directories)
- Extensions at the same event run in listed order (top to bottom, personal then project)
- Extensions don't block the lifecycle — the agent reports issues and continues
- Extensions can't hook into other extensions (no nesting)

### Session-Start Hook Changes

The existing `hooks/session-start` script is extended to:

1. Check for `~/.superpowers/extensions.yaml` (personal)
2. Check for `.superpowers/extensions.yaml` (project)
3. Parse and merge both (project appends to personal per-event)
4. Inject the resolved extensions registry into the session context alongside the existing `using-superpowers` content

The injected context is a simple list the agent can reference: "At `post-execution`, invoke: compound-learning, integration-smoke-test."

Note: The session-start hook is a bash script. The manifest format is intentionally simple (flat event-to-list mapping) so it can be parsed with basic string processing rather than requiring a YAML library. The implementation should use line-by-line parsing, not a full YAML parser.

### Core Skill Changes

Each core skill that triggers a lifecycle event gets a one-line addition at the relevant point. For example, in `executing-plans`:

```markdown
### Step 3: Complete Development

After all tasks complete and verified:
- **Check extensions registry** for any `post-execution` extensions and invoke each in order
- Then use superpowers:finishing-a-development-branch
```

The additions are minimal — the agent already has the registry in context from session start, so it knows what to invoke.

### Changes to `using-superpowers`

The `using-superpowers` skill is updated to teach the agent:

- What the extensions registry is (a mapping of lifecycle events to skills)
- That at each lifecycle event point, the agent must check the registry and invoke any registered extensions before proceeding
- That extensions are regular skills invoked via the Skill tool
- That extensions run in order and don't block the core workflow

### Extension Skill Authoring

Extension skills are standard skills with standard frontmatter (`name` and `description` only). Nothing special about the skill file — the manifest is what connects it to the lifecycle. Users write them the same way they'd write any personal or project skill.

Example:

```
~/.claude/skills/compound-learning/SKILL.md
```

```yaml
---
name: compound-learning
description: Use when a plan execution completes to document deviations and capture learnings for improving the development harness
---

# Compound Learning
...
```

The skill is wired to the lifecycle via the manifest, not via anything in the skill file itself.

## Files Changed

| File | Change |
|------|--------|
| `hooks/session-start` | Parse extensions manifests, inject registry into context |
| `skills/using-superpowers/SKILL.md` | Add extensions registry awareness and invocation instructions |
| `skills/brainstorming/SKILL.md` | Add `post-brainstorm` extension check |
| `skills/writing-plans/SKILL.md` | Add `post-plan` extension check |
| `skills/executing-plans/SKILL.md` | Add `pre-task`, `post-task`, `post-execution` extension checks |
| `skills/subagent-driven-development/SKILL.md` | Add `pre-task`, `post-task`, `post-execution` extension checks |
| `skills/requesting-code-review/SKILL.md` | Add `post-review` extension check |
| `skills/finishing-a-development-branch/SKILL.md` | Add `pre-finish` extension check |

## What's NOT In Scope

- **Gating / blocking extensions** — extensions run but don't block the lifecycle
- **Auto-install from plugins** — users explicitly wire extensions in the manifest
- **Extension marketplace or registry** — sharing is manual ("copy this skill and add a line to your yaml")
- **Extension-to-extension hooks** — extensions only hook into core lifecycle events
- **New frontmatter fields** — skills stay compliant with agentskills.io spec

## Prior Art in the Repo

No existing PR or issue proposes a lifecycle extension/hook system. Related efforts:

- **Issue #230** — Requests compound learning at end of work (exactly the use case this enables). No general mechanism proposed.
- **Issue #1128 / PR #1129** — Context provider convention for injecting domain context into subagents via MCP tool naming convention. Different mechanism (MCP tools, not lifecycle events) but similar motivation.
- **PR #943** — Post-execution iteration skill proposed as core addition. Validates the thesis — this is the type of feature that could be an extension rather than a core PR.
- **PR #1107** — Plugin architecture with `plugins/` directory for technology-specific skills. Different scope (organization, not lifecycle), but shares the goal of keeping domain content out of core.
- **PR #540** (closed) — Community Extensions section in README. Documentation only, no mechanism.

## Contribution Process

Per the superpowers contributing guide:

1. Fork the repository
2. Branch from `dev` (not `main`)
3. Create a feature branch for this work
4. Use `superpowers:writing-skills` for all skill changes — each modified skill must be pressure-tested with subagents before and after the change
5. Submit PR against `dev` using the full PR template at `.github/PULL_REQUEST_TEMPLATE.md`

## Testing Strategy

Each modified core skill needs before/after evaluation:

- **Baseline (RED):** Run a session through the lifecycle without extensions configured. Verify the agent does NOT check for extensions (no concept of it yet).
- **With extensions (GREEN):** Configure test extensions at each lifecycle event. Run a full lifecycle and verify each extension fires at the correct moment in the correct order.
- **Edge cases:** Missing manifest files (graceful no-op), invalid skill references in manifest (agent reports and continues), both personal and project manifests present (verify merge behavior).

The `using-superpowers` changes need adversarial testing — scenarios where the agent might skip extension checks ("this is simple, no need to check extensions") to verify the instructions are robust.
