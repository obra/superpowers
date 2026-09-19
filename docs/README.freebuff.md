# Superpowers for Freebuff

Complete guide for using Superpowers with [Freebuff](https://github.com/CodebuffAI/freebuff) — the free, ad-supported coding agent.

## Installation

Freebuff natively scans `~/.agents/skills/` for skill files. No plugin system needed — skills are plain Markdown.

### Step 1: Install skills globally

```bash
npx skills add obra/superpowers --agent universal --skill * --yes --copy
```

This copies all skill files to `~/.agents/skills/` where Freebuff finds them automatically.

### Step 2: Add the bootstrap to your project

Create or edit `CLAUDE.md` in your project root:

```markdown
@~/workspace/CLAUDE-superpowers.md
```

Or paste the bootstrap content directly. The bootstrap enforces the skill-first rule: invoke relevant skills before any response or action.

### Step 3: Verify

Start Freebuff and ask:

```
What skills do you have?
```

Freebuff should list the installed superpowers skills.

## How It Works

Freebuff (v0.0.150+) reads `.agents/skills/` at session start. The `skill()` tool
loads `~/.agents/skills/<name>/SKILL.md` and injects its instructions into context.

The bootstrap file makes skill-triggering automatic — no manual `/command` needed.
When you say "Let's build X", brainstorming fires before any code is written.

## Acceptance Transcript

Tested on Freebuff v0.0.150 (clean session):

```
User: Let's make a react todo list

Model:
  [First action: skill(name="brainstorming")]
  Using brainstorming to explore requirements before implementation.

  Before we start coding, let me ask a few questions about scope...
```

**Key:** `skill(name="brainstorming")` was the model's first action — before any
file reads or clarifying questions. The bootstrap enforces skill-first behavior.

## Skills Installed

| Skill | When to use |
|-------|-------------|
| `brainstorming` | Before any creative work (features, components) |
| `writing-plans` | When you have specs for multi-step tasks |
| `test-driven-development` | Before writing implementation code |
| `systematic-debugging` | When encountering bugs or test failures |
| `verification-before-completion` | Before claiming work is done |
| `using-git-worktrees` | When starting feature work needing isolation |
| `subagent-driven-development` | When executing implementation plans |
| `executing-plans` | When running plans with review checkpoints |
| `requesting-code-review` | When completing tasks or before merging |
| `receiving-code-review` | When getting review feedback |
| `finishing-a-development-branch` | When implementation is complete |
| `dispatching-parallel-agents` | When facing 2+ independent tasks |
| `writing-skills` | When creating or editing skills |

## Notes

- Freebuff uses region-dependent models (DeepSeek V4 / MiMo 2.5 / GLM 5.2)
- Skills work identically across all supported models
- The `npx skills add` command targets `universal` agent type, compatible with
  Freebuff's AGENTS.md-based skill loading
- No `/install-skill` command exists in Freebuff — `npx skills add` is the
  endorsed installer (recommended by Freebuff's system prompt)

## Troubleshooting

**Skills not loading?**
- Verify: `ls ~/.agents/skills/brainstorming/SKILL.md`
- Ensure CLAUDE.md has the bootstrap pointer
- Restart Freebuff session (skills load at session start)

**Wrong skill firing?**
- Process skills (brainstorming, debugging) come first by design
- User instructions always override skills

---

*Tested on: Freebuff v0.0.150, August 2025*
*Related issue: [#2168](https://github.com/CodebuffAI/freebuff/issues/2168)*
