/**
 * Superpowers plugin for OpenCode.ai
 *
 * Injects superpowers bootstrap context via system prompt transform.
 * Registers model-aware agents for subagent-driven development.
 * Skills are discovered via OpenCode's native skill tool from symlinked directory.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple frontmatter extraction (avoid dependency on skills-core for bootstrap)
const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};

  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: body };
};

// Normalize a path: trim whitespace, expand ~, resolve to absolute
const normalizePath = (p, homeDir) => {
  if (!p || typeof p !== 'string') return null;
  let normalized = p.trim();
  if (!normalized) return null;
  if (normalized.startsWith('~/')) {
    normalized = path.join(homeDir, normalized.slice(2));
  } else if (normalized === '~') {
    normalized = homeDir;
  }
  return path.resolve(normalized);
};

const stripJsonComments = (content) => content
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const deepMerge = (base, override) => {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override;
  }

  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = deepMerge(merged[key], value);
      continue;
    }
    merged[key] = value;
  }
  return merged;
};

// Agent prompt definitions for subagent-driven development workflow.
// These are the system prompts that each agent receives.
// The controller (orchestrator) still provides task-specific context via @mention.
const AGENT_PROMPTS = {
  'implementer-sp': `You are an implementation agent for the superpowers subagent-driven development workflow.

Your job is to implement a task from a plan. The controller will provide:
- Full task description (from the plan)
- Context (where this fits, dependencies, architecture)

## Before You Begin

If you have questions about the requirements, approach, dependencies, or anything unclear — ask them now. Raise concerns before starting work.

## Your Job

Once you're clear on requirements:
1. Implement exactly what the task specifies
2. Write tests (following TDD if task says to)
3. Verify implementation works
4. Commit your work
5. Self-review (see below)
6. Report back

**While you work:** If you encounter something unexpected or unclear, ask questions. Don't guess or make assumptions.

## Before Reporting Back: Self-Review

Review your work with fresh eyes:

**Completeness:** Did I implement everything in the spec? Miss any requirements? Edge cases?
**Quality:** Is this my best work? Are names clear? Is code clean and maintainable?
**Discipline:** Did I avoid overbuilding (YAGNI)? Only build what was requested? Follow existing patterns?
**Testing:** Do tests verify behavior (not mocks)? Did I follow TDD if required? Are tests comprehensive?

If you find issues during self-review, fix them before reporting.

## Report Format

When done, report:
- What you implemented
- What you tested and test results
- Files changed
- Self-review findings (if any)
- Any issues or concerns`,

  'spec-reviewer-sp': `You are a spec compliance reviewer for the superpowers subagent-driven development workflow.

Your job is to verify that an implementation matches its specification — nothing more, nothing less.

The controller will provide:
- Full task requirements (from the plan)
- Implementer's report of what they claim they built

## CRITICAL: Do Not Trust the Report

The implementer's report may be incomplete, inaccurate, or optimistic. You MUST verify everything independently.

**DO NOT:** Take their word for what they implemented. Trust their claims about completeness. Accept their interpretation of requirements.

**DO:** Read the actual code they wrote. Compare actual implementation to requirements line by line. Check for missing pieces. Look for extra features they didn't mention.

## Your Job

Read the implementation code and verify:

**Missing requirements:** Did they implement everything requested? Are there requirements they skipped? Did they claim something works but didn't actually implement it?

**Extra/unneeded work:** Did they build things that weren't requested? Did they over-engineer? Did they add "nice to haves" not in spec?

**Misunderstandings:** Did they interpret requirements differently than intended? Did they solve the wrong problem?

**Verify by reading code, not by trusting report.**

## Report Format

- ✅ Spec compliant (if everything matches after code inspection)
- ❌ Issues found: [list specifically what's missing or extra, with file:line references]`,

  'code-reviewer-sp': `You are a senior code reviewer for the superpowers subagent-driven development workflow.

You review code changes for production readiness. Only dispatched after spec compliance passes.

The controller will provide:
- What was implemented (from implementer's report)
- Plan/requirements reference
- Git SHA range to review

## Review Checklist

**Code Quality:** Clean separation of concerns? Proper error handling? Type safety? DRY? Edge cases handled?
**Architecture:** Sound design decisions? Scalability? Performance implications? Security concerns?
**Testing:** Tests actually test logic (not mocks)? Edge cases covered? Integration tests where needed? All tests passing?
**Requirements:** All plan requirements met? No scope creep? Breaking changes documented?
**Production Readiness:** Migration strategy? Backward compatibility? No obvious bugs?

## Output Format

### Strengths
[What's well done? Be specific with file:line references.]

### Issues

#### Critical (Must Fix)
[Bugs, security issues, data loss risks]

#### Important (Should Fix)
[Architecture problems, missing features, poor error handling, test gaps]

#### Minor (Nice to Have)
[Code style, optimization, documentation]

**For each issue:** file:line reference, what's wrong, why it matters, how to fix.

### Assessment
**Ready to merge?** [Yes/No/With fixes]
**Reasoning:** [1-2 sentences]

## Rules
- Categorize by actual severity (not everything is Critical)
- Be specific (file:line, not vague)
- Explain WHY issues matter
- Acknowledge strengths
- Give clear verdict`
};

// Default agent configurations
const AGENT_DEFAULTS = {
  'implementer-sp': {
    description: 'Superpowers: implements tasks from plan following TDD. Writes code, tests, commits.',
    model: 'anthropic/claude-sonnet-4-6',
    mode: 'subagent',
    tools: { bash: true, read: true, write: true, edit: true, glob: true, grep: true, list: true, todoread: true, todowrite: true },
    permission: { edit: 'allow', bash: { '*': 'allow' } }
  },
  'spec-reviewer-sp': {
    description: 'Superpowers: reviews implementation against spec. Verifies completeness, catches missing/extra work.',
    model: 'anthropic/claude-sonnet-4-6',
    mode: 'subagent',
    tools: { read: true, glob: true, grep: true, list: true, bash: true },
    permission: { bash: { '*': 'allow' } }
  },
  'code-reviewer-sp': {
    description: 'Superpowers: deep code review — architecture, quality, security, maintainability.',
    model: 'anthropic/claude-opus-4-6',
    mode: 'subagent',
    tools: { read: true, glob: true, grep: true, list: true, bash: true },
    permission: { bash: { '*': 'allow' } }
  }
};

const DEFAULT_SUPERPOWERS_CONFIG = `{
  // Superpowers-specific OpenCode overrides.
  // Edit models here instead of creating agent entries manually in opencode.json.
  "agent": {
    "implementer-sp": {
      "model": "anthropic/claude-sonnet-4-6"
    },
    "spec-reviewer-sp": {
      "model": "anthropic/claude-sonnet-4-6"
    },
    "code-reviewer-sp": {
      "model": "anthropic/claude-opus-4-6"
    }
  }
}
`;

export const SuperpowersPlugin = async ({ client, directory }) => {
  const homeDir = os.homedir();
  const superpowersSkillsDir = path.resolve(__dirname, '../../skills');
  const envConfigDir = normalizePath(process.env.OPENCODE_CONFIG_DIR, homeDir);
  const configDir = envConfigDir || path.join(homeDir, '.config/opencode');
  const superpowersConfigPath = path.join(configDir, 'superpowers.jsonc');

  const ensureSuperpowersConfig = () => {
    if (fs.existsSync(superpowersConfigPath)) return;
    fs.mkdirSync(path.dirname(superpowersConfigPath), { recursive: true });
    fs.writeFileSync(superpowersConfigPath, DEFAULT_SUPERPOWERS_CONFIG, 'utf8');
  };

  const loadSuperpowersConfig = () => {
    ensureSuperpowersConfig();

    try {
      const rawContent = fs.readFileSync(superpowersConfigPath, 'utf8');
      const parsed = JSON.parse(stripJsonComments(rawContent));
      return isPlainObject(parsed) ? parsed : {};
    } catch (error) {
      console.warn(`[superpowers] Failed to parse ${superpowersConfigPath}: ${error.message}`);
      return {};
    }
  };

  // Helper to generate bootstrap content
  const getBootstrapContent = () => {
    // Try to load using-superpowers skill
    const skillPath = path.join(superpowersSkillsDir, 'using-superpowers', 'SKILL.md');
    if (!fs.existsSync(skillPath)) return null;

    const fullContent = fs.readFileSync(skillPath, 'utf8');
    const { content } = extractAndStripFrontmatter(fullContent);

    const toolMapping = `**Tool Mapping for OpenCode:**
When skills reference tools you don't have, substitute OpenCode equivalents:
- \`TodoWrite\` → \`update_plan\`
- \`Task\` tool with subagents → Use OpenCode's subagent system (@mention)
- \`Skill\` tool → OpenCode's native \`skill\` tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Your native tools

**Skills location:**
Superpowers skills are in \`${configDir}/skills/superpowers/\`
Use OpenCode's native \`skill\` tool to list and load skills.`;

    return `<EXTREMELY_IMPORTANT>
You have superpowers.

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-superpowers" again - that would be redundant.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
  };

  return {
    // Use system prompt transform to inject bootstrap (fixes #226 agent reset bug)
    'experimental.chat.system.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (bootstrap) {
        (output.system ||= []).push(bootstrap);
      }
    },

    // Register model-aware agents for subagent-driven development.
    // User-defined superpowers config is loaded from superpowers.jsonc.
    // Plugin-managed agent prompts/tools are still enforced here.
    config: async (config) => {
      const superpowersConfig = loadSuperpowersConfig();
      const mergedConfig = deepMerge(config, superpowersConfig);
      const agents = mergedConfig.agent || {};

      for (const [name, defaults] of Object.entries(AGENT_DEFAULTS)) {
        // Plugin defaults provide prompts/tools; superpowers.jsonc can override models and other fields.
        agents[name] = {
          ...defaults,
          prompt: AGENT_PROMPTS[name],
          ...(agents[name] || {})
        };
      }

      Object.assign(config, mergedConfig, { agent: agents });
    }
  };
};
