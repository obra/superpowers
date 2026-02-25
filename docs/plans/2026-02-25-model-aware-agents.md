# Model-Aware Agents for Subagent-Driven Development

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Register dedicated subagents (sp-implementer, sp-spec-reviewer, sp-code-reviewer) with appropriate model tiers via the plugin config hook, and update the subagent-driven-development skill to dispatch to these agents instead of generic subagents.

**Architecture:** Extend the existing `superpowers.js` OpenCode plugin with a `config` hook that injects agent definitions into `config.agent`. Agent prompts are embedded from the existing prompt templates. The skill markdown is updated to reference named agents. User config takes priority over plugin defaults.

**Tech Stack:** JavaScript (ES modules), OpenCode plugin API (`@opencode-ai/plugin`), Markdown (skills)

---

### Task 1: Extend superpowers.js with config hook and agent definitions

**Files:**
- Modify: `superpowers/.opencode/plugins/superpowers.js`

**Step 1: Read existing prompt templates and embed them as constants**

The three prompt templates live at:
- `skills/subagent-driven-development/implementer-prompt.md`
- `skills/subagent-driven-development/spec-reviewer-prompt.md`
- `skills/subagent-driven-development/code-quality-reviewer-prompt.md`

At plugin load time, read these files and extract the prompt text (the content inside the code fence in each template). These become the `prompt` field for each agent.

**Step 2: Add the config hook**

After the existing `experimental.chat.system.transform` hook, add a `config` hook:

```javascript
config: async (config) => {
  // Only set defaults — don't overwrite user-defined agents
  const agents = config.agent || {};

  if (!agents['sp-implementer']) {
    agents['sp-implementer'] = {
      description: 'Superpowers: implements tasks from plan following TDD. Writes code, tests, commits.',
      model: 'anthropic/claude-sonnet-4-6',
      mode: 'subagent',
      tools: { bash: true, read: true, write: true, edit: true, glob: true, grep: true, list: true, todoread: true, todowrite: true },
      prompt: implementerPrompt,
      permission: { edit: 'allow', bash: { '*': 'allow' } }
    };
  }

  if (!agents['sp-spec-reviewer']) {
    agents['sp-spec-reviewer'] = {
      description: 'Superpowers: reviews implementation against spec. Verifies completeness, catches missing/extra work.',
      model: 'anthropic/claude-sonnet-4-6',
      mode: 'subagent',
      tools: { read: true, glob: true, grep: true, list: true, bash: true },
      prompt: specReviewerPrompt,
      permission: { bash: { '*': 'allow' } }
    };
  }

  if (!agents['sp-code-reviewer']) {
    agents['sp-code-reviewer'] = {
      description: 'Superpowers: deep code review — architecture, quality, security, maintainability.',
      model: 'anthropic/claude-opus-4-6',
      mode: 'subagent',
      tools: { read: true, glob: true, grep: true, list: true, bash: true },
      prompt: codeReviewerPrompt,
      permission: { bash: { '*': 'allow' } }
    };
  }

  config.agent = agents;
}
```

**Step 3: Verify the plugin loads without errors**

Run: `cd /home/alex/Projects/opencode && opencode run "list all agents" --agent build`
Expected: should see sp-implementer, sp-spec-reviewer, sp-code-reviewer in agent list alongside built-ins.

**Step 4: Commit**

```bash
cd /home/alex/Projects/opencode/superpowers
git add .opencode/plugins/superpowers.js
git commit -m "feat: register model-aware agents via config hook"
```

---

### Task 2: Update subagent-driven-development skill to use named agents

**Files:**
- Modify: `superpowers/skills/subagent-driven-development/SKILL.md`

**Step 1: Replace generic dispatch references with named agents**

In the Process flowchart and text, replace:
- `"Dispatch implementer subagent (./implementer-prompt.md)"` → `"Dispatch @sp-implementer with task text and context"`
- `"Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)"` → `"Dispatch @sp-spec-reviewer with requirements and report"`
- `"Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)"` → `"Dispatch @sp-code-reviewer with SHAs and description"`

**Step 2: Update the Prompt Templates section**

Replace:
```markdown
## Prompt Templates

- `./implementer-prompt.md` - Dispatch implementer subagent
- `./spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `./code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent
```

With:
```markdown
## Agents (OpenCode)

When running in OpenCode, use the dedicated agents registered by the superpowers plugin:

| Agent | Role | Default Model |
|-------|------|---------------|
| `@sp-implementer` | Writes code, tests, commits | sonnet |
| `@sp-spec-reviewer` | Verifies implementation matches spec | sonnet |
| `@sp-code-reviewer` | Deep code review | opus |

Users can override models in their `opencode.json`:
```json
{ "agent": { "sp-implementer": { "model": "anthropic/claude-haiku-4-5" } } }
```

## Prompt Templates (Claude Code / Codex fallback)

If named agents are not available (e.g. in Claude Code or Codex), use the prompt templates:
- `./implementer-prompt.md` - Dispatch implementer subagent
- `./spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `./code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent
```

**Step 3: Update the Example Workflow section**

Replace generic "[Dispatch implementation subagent with full task text + context]" with "[Dispatch @sp-implementer with full task text + context]" etc.

**Step 4: Commit**

```bash
cd /home/alex/Projects/opencode/superpowers
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat: update subagent-driven-development to use named agents"
```

---

### Task 3: Add model-routing note to brainstorming skill

**Files:**
- Modify: `superpowers/skills/brainstorming/SKILL.md`

**Step 1: Add note in "After the Design → Implementation" section**

After the line `- Invoke the writing-plans skill to create a detailed implementation plan`, add:

```markdown
- **Model routing:** When using OpenCode, the superpowers plugin registers dedicated agents (`@sp-implementer`, `@sp-spec-reviewer`, `@sp-code-reviewer`) with appropriate model tiers. Brainstorming and planning run on the current (typically stronger) model; implementation is automatically dispatched to cost-effective models. No manual model switching needed.
```

**Step 2: Commit**

```bash
cd /home/alex/Projects/opencode/superpowers
git add skills/brainstorming/SKILL.md
git commit -m "feat: add model-routing note to brainstorming skill"
```

---

### Task 4: Set up local test environment and verify

**Files:**
- Modify: `/home/alex/Projects/opencode/opencode.json`

**Step 1: Update local opencode.json to use local superpowers plugin**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "./superpowers/.opencode/plugins/superpowers.js"
  ],
  "permission": {
    "*": {
      "*": "allow"
    }
  }
}
```

**Step 2: Symlink skills for local testing**

```bash
mkdir -p /home/alex/Projects/opencode/.opencode
ln -s /home/alex/Projects/opencode/superpowers/skills /home/alex/Projects/opencode/.opencode/skills
```

**Step 3: Verify agents are registered**

Run: `cd /home/alex/Projects/opencode && opencode agent list`
Expected: sp-implementer, sp-spec-reviewer, sp-code-reviewer appear with correct models.

**Step 4: Verify agent invocation works**

Run: `cd /home/alex/Projects/opencode && opencode run "@sp-implementer say hello and list your tools"`
Expected: Response comes from sonnet (not opus), agent has access to bash/read/write/edit tools.

**Step 5: Verify user override works**

Temporarily add to opencode.json:
```json
"agent": { "sp-implementer": { "model": "anthropic/claude-haiku-4-5" } }
```

Run: `cd /home/alex/Projects/opencode && opencode run "@sp-implementer what model are you?"`
Expected: Response comes from haiku.

Remove the override after testing.

**Step 6: Commit test setup (don't commit opencode.json changes — they're local only)**

No commit needed for this task — it's verification only.
