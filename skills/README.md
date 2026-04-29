# Skills Dependencies

This directory contains the skill library for Superpowers. Some skills depend on external pi packages to function.

## Required External Packages

### pi-subagents

**Required by:** `pi-review`, `pi-refine`

The `pi-subagents` package provides the `subagent()` tool and builtin agents (including `reviewer`) that these skills use to perform external code and document review.

**Installation:**

```bash
npm install -g pi-subagents
```

Or follow the installation instructions for your specific pi distribution.

**Verification:**

After installation, verify it's working:

```typescript
subagent({ action: "list" });
```

This should list available builtin agents including `reviewer`, `scout`, `planner`, `worker`, and `oracle`.

If you encounter issues:

```typescript
subagent({ action: "doctor" });
```

**Model Overrides:**

The `reviewer` agent defaults to `openai-codex/gpt-5.5`. You can override this globally in `.pi/settings.json`:

```json
{
  "subagents": {
    "agentOverrides": {
      "reviewer": {
        "model": "deepseek/deepseek-v4-pro",
        "thinking": "high"
      }
    }
  }
}
```

Or per-call:

```typescript
subagent({
  agent: "reviewer",
  model: "anthropic/claude-sonnet-4",
  task: "...",
});
```

## Optional External Packages

### pi-intercom

**Used by:** Any skill that launches async or forked subagents

Provides inter-agent communication for coordination between parent and child agents. Not strictly required for `pi-review` or `pi-refine` since they use synchronous subagent calls, but useful for more complex multi-agent workflows.

## Skills Index

### Core Development

- **brainstorming** - Socratic design refinement before coding
- **writing-plans** - Detailed implementation planning
- **executing-plans** - Batch execution with checkpoints
- **subagent-driven-development** - Fast iteration with two-stage review

### Testing & Quality

- **test-driven-development** - RED-GREEN-REFACTOR enforcement
- **systematic-debugging** - 4-phase root cause analysis
- **verification-before-completion** - Confirm fixes actually work

### Review & Refinement

- **pi-review** - One-off code/design review via `reviewer` subagent _(requires pi-subagents)_
- **pi-refine** - Iterative document refinement via `reviewer` subagent _(requires pi-subagents)_
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Handling feedback

### Collaboration & Workflow

- **dispatching-parallel-agents** - Concurrent subagent workflows
- **using-git-worktrees** - Isolated development branches
- **finishing-a-development-branch** - Merge/PR decisions

### Meta

- **using-superpowers** - Introduction to the skills system
- **writing-skills** - Create and test new skills
