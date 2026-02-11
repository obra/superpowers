# Model Provider Mapping

Superpowers skills are provider-agnostic. This document maps model tiers to specific providers so skills work across Claude Code, OpenCode/Gemini, and future environments.

## Tier Mapping

| Tier | Intent | Claude Code (`model` param) | OpenCode/Gemini (`/model` cmd) |
|------|--------|-----------------------------|-------------------------------|
| **Fast** | Mechanical tasks, clear spec, 1-2 files | `haiku` | `google/gemini-3-flash-preview` |
| **Balanced** | Multi-file, debugging, reasoning | `sonnet` | `google/gemini-3-pro-preview` |
| **Deep** | Architecture, security, broad judgment | `opus` | `google/gemini-3-pro-preview` |

## How Each Environment Consumes This

### Claude Code

The Task tool's `model` parameter accepts: `haiku`, `sonnet`, `opus`.

```
Task(subagent_type="bug-hunter", model="sonnet", description="...", prompt="...")
```

Skills reference Claude model names in dispatch examples and Model Selection tables. The `recommended_model` YAML field is not consumed by Claude Code.

### OpenCode / Gemini

OpenCode uses `/model` commands and `@mention` for subagents:

```
/model google/gemini-3-flash-preview
```

The `recommended_model` YAML field in skill headers (`flash`, `pro`) maps to Gemini models. The OpenCode plugin injects model recommendations via system prompt transform.

### YAML `recommended_model` Field

| YAML Value | Provider | Tier |
|------------|----------|------|
| `flash` | Gemini | Fast |
| `pro` | Gemini | Balanced |

This field is consumed by OpenCode only. Claude Code ignores it and uses its own Model Selection tables within each skill.

## Agent-to-Tier Mapping

| Agent | Tier | Claude | Gemini | Rationale |
|-------|------|--------|--------|-----------|
| `modular-builder` (simple) | Fast | `haiku` | Flash | Mechanical with clear spec |
| `modular-builder` (multi-file) | Balanced | `sonnet` | Pro | Integration reasoning needed |
| `bug-hunter` | Balanced | `sonnet` | Pro | Root cause analysis |
| `database-architect` | Balanced | `sonnet` | Pro | Schema design judgment |
| `test-coverage` (spec review) | Fast | `haiku` | Flash | Checklist comparison |
| `zen-architect` (quality review) | Balanced | `sonnet` | Pro | Architecture judgment |
| `security-guardian` | Deep | `opus` | Pro | Deepest analysis needed |
| `post-task-cleanup` | Fast | `haiku` | Flash | Mechanical cleanup |
| `integration-specialist` | Balanced | `sonnet` | Pro | External system expertise |
| `performance-optimizer` | Balanced | `sonnet` | Pro | Measure-first approach |
| `component-designer` | Balanced | `sonnet` | Pro | Visual consistency judgment |
| `api-contract-designer` | Balanced | `sonnet` | Pro | Contract validation |

## Adding a New Provider

To add support for a new provider (e.g., OpenAI):

1. Add a column to the Tier Mapping table above
2. Map each tier to the provider's model names
3. Create the environment-specific dispatch mechanism (plugin, hook, etc.)
4. Skills remain unchanged — they reference tiers through the existing Model Selection tables
