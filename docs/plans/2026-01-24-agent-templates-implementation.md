# Agent Template Rendering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce a template + renderer workflow so all agent-specific references (Claude/Codex/OpenCode, CLAUDE.md/AGENTS.md) are generated, not hand-edited.

**Architecture:** Add a template tree (`templates/`), per‑agent config (`agents/*.json`), a targets map (`templates/targets.json`), and a renderer script (`scripts/render-agent.js`). Use a test script to validate all templates render cleanly for each agent, then generate the concrete files in-place.

**Tech Stack:** Node.js (no deps), Bash, existing repo scripts/tests.

---

### Task 1: Add renderer configuration and failing render test

**Files:**
- Create: `agents/claude.json`
- Create: `agents/codex.json`
- Create: `agents/opencode.json`
- Create: `templates/targets.json`
- Create: `tests/render-templates.sh`

**Step 1: Write the failing test**

Create `tests/render-templates.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Template Render Check ==="

agents=(claude codex opencode)

for agent in "${agents[@]}"; do
  echo "--- $agent ---"
  node "$ROOT_DIR/scripts/render-agent.js" --agent "$agent" --check
done

echo "All agents rendered successfully."
```

**Step 2: Run test to verify it fails**

Run: `bash tests/render-templates.sh`  
Expected: FAIL (renderer script doesn’t exist yet).

**Step 3: Add initial agent configs and targets map**

Create `agents/claude.json`:

```json
{
  "AGENT_ID": "claude",
  "AGENT_NAME": "Claude Code",
  "AGENTS_MD": "CLAUDE.md",
  "CLI_NAME": "claude",
  "CLI_CMD": "claude",
  "AGENT_HOME": "~/.claude",
  "SKILLS_DIR": "~/.claude/skills",
  "CONFIG_DIR": "~/.claude",
  "PLUGIN_DIR": "~/.claude/plugins",
  "SUPERPOWERS_DIR": "~/.claude/superpowers"
}
```

Create `agents/codex.json`:

```json
{
  "AGENT_ID": "codex",
  "AGENT_NAME": "Codex",
  "AGENTS_MD": "AGENTS.md",
  "CLI_NAME": "codex",
  "CLI_CMD": "codex",
  "AGENT_HOME": "~/.codex",
  "SKILLS_DIR": "~/.codex/skills",
  "CONFIG_DIR": "~/.codex",
  "PLUGIN_DIR": "",
  "SUPERPOWERS_DIR": "~/.codex/superpowers"
}
```

Create `agents/opencode.json`:

```json
{
  "AGENT_ID": "opencode",
  "AGENT_NAME": "OpenCode",
  "AGENTS_MD": "AGENTS.md",
  "CLI_NAME": "opencode",
  "CLI_CMD": "opencode",
  "AGENT_HOME": "~/.config/opencode",
  "SKILLS_DIR": "~/.config/opencode/skills",
  "CONFIG_DIR": "~/.config/opencode",
  "PLUGIN_DIR": "~/.config/opencode/plugins",
  "SUPERPOWERS_DIR": "~/.config/opencode/superpowers"
}
```

Create `templates/targets.json`:

```json
{
  "claude": [
    { "template": "README.md", "out": "README.md" },
    { "template": "docs/README.codex.md", "out": "docs/README.codex.md" },
    { "template": "docs/README.opencode.md", "out": "docs/README.opencode.md" },
    { "template": ".codex/INSTALL.md", "out": ".codex/INSTALL.md" },
    { "template": ".opencode/INSTALL.md", "out": ".opencode/INSTALL.md" }
  ],
  "codex": [
    { "template": "README.md", "out": "README.md" },
    { "template": "docs/README.codex.md", "out": "docs/README.codex.md" },
    { "template": "docs/README.opencode.md", "out": "docs/README.opencode.md" },
    { "template": ".codex/INSTALL.md", "out": ".codex/INSTALL.md" },
    { "template": ".opencode/INSTALL.md", "out": ".opencode/INSTALL.md" }
  ],
  "opencode": [
    { "template": "README.md", "out": "README.md" },
    { "template": "docs/README.codex.md", "out": "docs/README.codex.md" },
    { "template": "docs/README.opencode.md", "out": "docs/README.opencode.md" },
    { "template": ".codex/INSTALL.md", "out": ".codex/INSTALL.md" },
    { "template": ".opencode/INSTALL.md", "out": ".opencode/INSTALL.md" }
  ]
}
```

**Step 4: Run test to verify it still fails**

Run: `bash tests/render-templates.sh`  
Expected: FAIL (renderer script still missing).

**Step 5: Commit**

```bash
git add agents/*.json templates/targets.json tests/render-templates.sh
git commit -m "chore: add agent config and render test"
```

---

### Task 2: Implement renderer to pass render test

**Files:**
- Create: `scripts/render-agent.js`

**Step 1: Implement renderer**

Create `scripts/render-agent.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const arg = (name) => {
  const idx = args.indexOf(name);
  return idx === -1 ? null : args[idx + 1];
};

const agent = arg('--agent');
const outDir = arg('--out');
const checkOnly = args.includes('--check');
const writeInPlace = args.includes('--write');

if (!agent) {
  console.error('Usage: node scripts/render-agent.js --agent <name> [--out <dir>] [--check] [--write]');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..');
const templatesDir = path.join(repoRoot, 'templates');
const targetsPath = path.join(templatesDir, 'targets.json');
const agentPath = path.join(repoRoot, 'agents', `${agent}.json`);

if (!fs.existsSync(targetsPath)) {
  throw new Error(`Missing targets: ${targetsPath}`);
}
if (!fs.existsSync(agentPath)) {
  throw new Error(`Missing agent config: ${agentPath}`);
}

const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
const agentConfig = JSON.parse(fs.readFileSync(agentPath, 'utf8'));
const agentTargets = targets[agent];

if (!agentTargets) {
  throw new Error(`Unknown agent "${agent}". Valid: ${Object.keys(targets).join(', ')}`);
}

const partialsDir = path.join(templatesDir, '_partials');
const unresolved = [];

function loadPartial(name, ext) {
  const candidateAgent = path.join(partialsDir, `${name}.${agent}.${ext}`);
  const candidateDefault = path.join(partialsDir, `${name}.${ext}`);
  if (fs.existsSync(candidateAgent)) return fs.readFileSync(candidateAgent, 'utf8');
  if (fs.existsSync(candidateDefault)) return fs.readFileSync(candidateDefault, 'utf8');
  throw new Error(`Missing partial "${name}" for agent "${agent}" (looked for ${candidateAgent} or ${candidateDefault})`);
}

function renderTemplate(content) {
  // includes
  content = content.replace(/\{\{\>\s*([a-zA-Z0-9._-]+)\s*\}\}/g, (_, name) => {
    const ext = name.split('.').pop();
    return loadPartial(name, ext);
  });

  // placeholders
  content = content.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (!(key in agentConfig)) return match;
    return agentConfig[key];
  });

  return content;
}

for (const target of agentTargets) {
  const templatePath = path.join(templatesDir, target.template);
  const outPath = writeInPlace
    ? path.join(repoRoot, target.out)
    : path.join(outDir || path.join(repoRoot, 'generated', agent), target.out);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing template: ${templatePath}`);
  }

  const content = fs.readFileSync(templatePath, 'utf8');
  const rendered = renderTemplate(content);

  const leftovers = rendered.match(/\{\{\s*[A-Z0-9_]+\s*\}\}/g);
  if (leftovers) {
    unresolved.push({ file: target.template, placeholders: leftovers });
  }

  if (!checkOnly) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rendered);
  }
}

if (unresolved.length) {
  console.error('Unresolved placeholders:');
  for (const entry of unresolved) {
    console.error(`- ${entry.file}: ${entry.placeholders.join(', ')}`);
  }
  process.exit(1);
}

console.log(`Rendered ${agentTargets.length} files for ${agent}${checkOnly ? ' (check only)' : ''}.`);
```

**Step 2: Run test to verify it passes**

Run: `bash tests/render-templates.sh`  
Expected: PASS (still no templates, but renderer should run; if it fails on missing templates, update targets after templates exist in Task 3).

**Step 3: Commit**

```bash
git add scripts/render-agent.js
git commit -m "feat: add agent template renderer"
```

---

### Task 3: Convert core docs/install files to templates and render

**Files:**
- Create: `templates/README.md`
- Create: `templates/docs/README.codex.md`
- Create: `templates/docs/README.opencode.md`
- Create: `templates/.codex/INSTALL.md`
- Create: `templates/.opencode/INSTALL.md`
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.opencode.md`
- Modify: `.codex/INSTALL.md`
- Modify: `.opencode/INSTALL.md`

**Step 1: Create templates by copying current files**

Copy each file into `templates/` preserving path. Replace:
- `CLAUDE.md` → `{{AGENTS_MD}}`
- `~/.claude` → `{{AGENT_HOME}}`
- `~/.codex` → `{{AGENT_HOME}}` (when in Codex‑specific sections)
- `~/.config/opencode` → `{{CONFIG_DIR}}`
- “Claude Code” → `{{AGENT_NAME}}` where agent‑specific
- `claude` CLI → `{{CLI_CMD}}` where agent‑specific
- `~/.claude/skills` → `{{SKILLS_DIR}}`

Add a header line to generated files (e.g., `<!-- GENERATED: do not edit -->`) near the top of each template.

**Step 2: Render in-place**

Run:
```bash
node scripts/render-agent.js --agent claude --write
node scripts/render-agent.js --agent codex --write
node scripts/render-agent.js --agent opencode --write
```

**Step 3: Run render test**

Run: `bash tests/render-templates.sh`  
Expected: PASS.

**Step 4: Commit**

```bash
git add templates/ README.md docs/README.codex.md docs/README.opencode.md .codex/INSTALL.md .opencode/INSTALL.md
git commit -m "docs: template core install and README files"
```

---

### Task 4: Template agent-specific tests and examples

**Files:**
- Create: `templates/tests/claude-code/**` (mirrors current files)
- Create: `templates/tests/explicit-skill-requests/**`
- Create: `templates/tests/subagent-driven-dev/**`
- Create: `templates/tests/skill-triggering/**` (if agent references exist)
- Modify: files in the same paths under `tests/`

**Step 1: Convert files to templates**

For each file with hardcoded agent references:
- Replace `claude` CLI invocations with `{{CLI_CMD}}` where appropriate.
- Replace `CLAUDE.md` with `{{AGENTS_MD}}`.
- Replace `~/.claude` with `{{AGENT_HOME}}` for paths.

**Step 2: Render in-place**

Run:
```bash
node scripts/render-agent.js --agent claude --write
node scripts/render-agent.js --agent codex --write
node scripts/render-agent.js --agent opencode --write
```

**Step 3: Run render test**

Run: `bash tests/render-templates.sh`  
Expected: PASS.

**Step 4: Commit**

```bash
git add templates/tests tests
git commit -m "test: template agent-specific test assets"
```

---

### Task 5: Template skill docs and examples with agent references

**Files:**
- Create: `templates/skills/writing-skills/**`
- Create: `templates/skills/using-git-worktrees/SKILL.md`
- Modify: corresponding files under `skills/`

**Step 1: Convert to templates**

Replace:
- `CLAUDE.md` → `{{AGENTS_MD}}`
- `~/.claude/skills` → `{{SKILLS_DIR}}`
- “Claude” or “Claude Code” where it refers to the current agent → `{{AGENT_NAME}}`

**Step 2: Render in-place**

Run:
```bash
node scripts/render-agent.js --agent claude --write
node scripts/render-agent.js --agent codex --write
node scripts/render-agent.js --agent opencode --write
```

**Step 3: Run render test**

Run: `bash tests/render-templates.sh`  
Expected: PASS.

**Step 4: Commit**

```bash
git add templates/skills skills
git commit -m "docs: template skill docs for agent placeholders"
```

---

### Task 6: Document the template workflow and validate

**Files:**
- Modify: `README.md`
- Modify: `docs/README.codex.md`
- Modify: `docs/README.opencode.md`

**Step 1: Add “Templates & Rendering” section**

Include:
```markdown
### Templates & Rendering

Source files live in `templates/`. Regenerate agent‑specific outputs with:

```
node scripts/render-agent.js --agent codex --write
node scripts/render-agent.js --agent claude --write
node scripts/render-agent.js --agent opencode --write
```

Validate all templates:

```
bash tests/render-templates.sh
```
```

**Step 2: Run tests**

Run:
```bash
bash tests/render-templates.sh
tests/opencode/run-tests.sh
```

Expected: PASS.

**Step 3: Commit**

```bash
git add README.md docs/README.codex.md docs/README.opencode.md
git commit -m "docs: document template render workflow"
```

---

## Execution Notes

- Keep templates as the single source of truth.
- Render in-place before final verification.
- Avoid hand-editing generated files.

