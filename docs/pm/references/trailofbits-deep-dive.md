# Trail of Bits Claude Code Ecosystem: Deep Dive Reference

> Compiled: 2026-02-19
> Sources: trailofbits/claude-code-config (1,139 stars), trailofbits/skills (2,807 stars), trailofbits/skills-curated, and 15+ linked repositories and resources.

---

## Table of Contents

1. [Repository Overview](#1-repository-overview)
2. [CLAUDE.md Patterns](#2-claudemd-patterns)
3. [Settings and Permissions Patterns](#3-settings-and-permissions-patterns)
4. [Hook Patterns](#4-hook-patterns)
5. [Skill Patterns](#5-skill-patterns)
6. [Agent and Subagent Patterns](#6-agent-and-subagent-patterns)
7. [Workflow Patterns](#7-workflow-patterns)
8. [Command Patterns (Autonomous Pipelines)](#8-command-patterns-autonomous-pipelines)
9. [Progressive Disclosure Patterns](#9-progressive-disclosure-patterns)
10. [Model Routing and Local Models](#10-model-routing-and-local-models)
11. [MCP Server Configuration](#11-mcp-server-configuration)
12. [Sandboxing and Security](#12-sandboxing-and-security)
13. [Testing and Verification Patterns](#13-testing-and-verification-patterns)
14. [Plugin Architecture and Marketplace](#14-plugin-architecture-and-marketplace)
15. [External Ecosystem and Curated Skills](#15-external-ecosystem-and-curated-skills)
16. [Trail of Bits Skills Catalog](#16-trail-of-bits-skills-catalog)
17. [Referenced Blog Posts and Best Practices](#17-referenced-blog-posts-and-best-practices)
18. [Key Takeaways for Our Plugin](#18-key-takeaways-for-our-plugin)

---

## 1. Repository Overview

### trailofbits/claude-code-config
- **Stars:** 1,139 | **Forks:** 79 | **Last Updated:** 2026-02-20
- **Purpose:** Opinionated defaults, documentation, and workflows for Claude Code at Trail of Bits
- **Topics:** claude, claude-code, claude-code-cli, developer-tool
- **Structure:**
  ```
  .claude/commands/trailofbits/config.md   # Self-installing setup command
  commands/fix-issue.md                     # Autonomous issue resolution
  commands/review-pr.md                     # Multi-agent PR review
  commands/merge-dependabot.md              # Batch dependabot merge
  hooks/enforce-package-manager.sh          # pnpm enforcement
  hooks/log-gam.sh                          # Google Apps Manager audit log
  scripts/statusline.sh                     # Two-line status bar
  settings.json                             # Permissions, hooks, deny rules
  claude-md-template.md                     # Global CLAUDE.md template
  mcp-template.json                         # MCP server config
  ```

### trailofbits/skills
- **Stars:** 2,807 | **Forks:** 223 | **Last Updated:** 2026-02-20
- **Purpose:** Public security auditing, smart contract analysis, reverse engineering, code review, development workflow skills
- **License:** CC-BY-SA-4.0
- **Contributors:** 22
- **Languages:** Python 63.2%, Shell 20%, YARA 4.2%, CodeQL 2.2%

### trailofbits/claude-code-devcontainer
- **Purpose:** Sandboxed Docker environment for safely running Claude Code with bypassPermissions
- **Use cases:** Security audits, exploring untrusted repos, experimental code modifications
- **Base:** Ubuntu 24.04, Node.js 22, Python 3.13 via uv, zsh
- **Key feature:** `devc` CLI wrapper abstracting devcontainer operations

### trailofbits/dropkit
- **Purpose:** DigitalOcean droplet management with cost-saving hibernation (snapshot then destroy then restore)
- **Stack:** Python 3.11+, Typer, Rich, Pydantic, Jinja2
- **Pattern:** Progressive disclosure via `init` command, tag-based resource isolation

### trailofbits/skills-curated
- **Purpose:** Reviewed and approved third-party Claude Code plugin collection
- **Philosophy:** "We don't want people installing random plugins from GitHub repos we haven't reviewed."

---

## 2. CLAUDE.md Patterns

The Trail of Bits global CLAUDE.md template (`claude-md-template.md`) establishes patterns worth studying.

### Core Philosophy Rules
1. **No speculative features** -- no premature abstraction, no phantom features
2. **Replace, don't deprecate** -- "When a new implementation replaces an old one, remove the old one entirely. No backward-compatible shims, dual config formats, or migration paths."
3. **Verify at every level** -- automated guardrails
4. **Bias toward action** -- for easily reversed decisions

### Code Quality Hard Limits
These are enforced as non-negotiable constraints, not suggestions:
- Functions: <=100 lines, cyclomatic complexity <=8
- Parameters: <=5 positional parameters
- Line length: 100 characters maximum
- Import style: Absolute imports only (no relative paths)
- Documentation: Google-style docstrings for non-trivial public APIs
- Zero warnings policy: fix every linter, type checker, and compiler warning
- No commented-out code

### Language-Specific Toolchains
| Language | Runtime | Linter/Formatter | Type Checker | Testing |
|----------|---------|-------------------|--------------|---------|
| Python | 3.13 (uv venv) | ruff | ty | pytest |
| Node/TS | Node 22 LTS, ESM only | oxlint/oxfmt | strict tsconfig | vitest |
| Rust | Latest stable | clippy (deny-level) | built-in | cargo test |
| Bash | N/A | shellcheck, shfmt | N/A | N/A |

### Key Pattern: Prescriptive CLI Tool Preferences
The CLAUDE.md explicitly mandates modern alternatives:
- ripgrep over grep
- fd over find
- ast-grep for code structure search
- shellcheck for scripts
- prek for git hooks

### Workflow Standards
- Always re-read changes before committing
- Run tests and linters before committing
- Feature branches with PRs (never push directly to main)
- Imperative mood, <=72 character commit subjects

---

## 3. Settings and Permissions Patterns

The `settings.json` demonstrates a defense-in-depth approach:

### Complete Settings Structure
```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "cleanupPeriodDays": 365,
  "env": {
    "DISABLE_TELEMETRY": "1",
    "DISABLE_ERROR_REPORTING": "1",
    "CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY": "1",
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "enableAllProjectMcpServers": false,
  "alwaysThinkingEnabled": true,
  "permissions": {
    "deny": [
      "Bash(rm -rf *)", "Bash(rm -fr *)",
      "Bash(sudo *)", "Bash(mkfs *)", "Bash(dd *)",
      "Bash(curl *|bash*)", "Bash(wget *|bash*)",
      "Bash(git push --force*)", "Bash(git push *--force*)",
      "Bash(git reset --hard*)",
      "Edit(~/.bashrc)", "Edit(~/.zshrc)", "Edit(~/.ssh/**)",
      "Read(~/.ssh/**)", "Read(~/.gnupg/**)",
      "Read(~/.aws/**)", "Read(~/.azure/**)",
      "Read(~/.config/gh/**)", "Read(~/.git-credentials)",
      "Read(~/.docker/config.json)", "Read(~/.kube/**)",
      "Read(~/.npmrc)", "Read(~/.npm/**)",
      "Read(~/.pypirc)", "Read(~/.gem/credentials)",
      "Read(~/Library/Keychains/**)",
      "Read(~/Library/Application Support/**/metamask*/**)",
      "Read(~/Library/Application Support/**/electrum*/**)",
      "Read(~/Library/Application Support/**/exodus*/**)",
      "Read(~/Library/Application Support/**/phantom*/**)",
      "Read(~/Library/Application Support/**/solflare*/**)"
    ]
  },
  "hooks": { ... },
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh"
  }
}
```

### Key Patterns
1. **Layered deny rules** -- destructive bash commands, credential file reads, shell config edits, and crypto wallet access all blocked
2. **Environment-level privacy** -- telemetry, error reporting, and surveys disabled
3. **MCP security** -- `enableAllProjectMcpServers: false` prevents malicious repo-shipped MCP servers
4. **Extended thinking** -- `alwaysThinkingEnabled: true` for better reasoning
5. **Long history** -- `cleanupPeriodDays: 365` for pattern learning
6. **Experimental features** -- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` enables multi-agent coordination

---

## 4. Hook Patterns

Hooks are shell commands or prompts that fire at specific lifecycle points. They intercept tool calls, inject context, block patterns, and steer behavior. Trail of Bits describes them as "structured prompt injection at opportune times, not security boundaries."

### Hook Event Types
| Event | When | Can Block |
|-------|------|-----------|
| PreToolUse | Before tool call executes | Yes |
| PostToolUse | After tool call succeeds | No |
| UserPromptSubmit | When user submits prompt | Yes |
| Stop | When Claude finishes | Yes (forces continue) |
| SessionStart | When session begins/resumes | No |
| SubagentStart/Stop | When subagent spawns/finishes | Start: no, Stop: yes |
| TaskCompleted | When task marked complete | Yes |
| TeammateIdle | Before teammate idles | Yes |

### Exit Code Semantics
- **0**: Action allowed (stdout parsed for JSON control)
- **1**: Error, non-blocking
- **2**: Blocking error (fed back to Claude as context)

### Hook Example: Package Manager Enforcement
```bash
#!/bin/bash
set -euo pipefail
CMD=$(jq -r '.tool_input.command // empty')
[[ -z "$CMD" ]] && exit 0
[[ ! -f "${CLAUDE_PROJECT_DIR}/pnpm-lock.yaml" ]] && exit 0
if echo "$CMD" | grep -qE '^npm\s'; then
  echo "BLOCKED: This project uses pnpm, not npm. Use pnpm instead." >&2
  exit 2
fi
exit 0
```
**Pattern:** Fast-fail early for non-matching commands. Use `$CLAUDE_PROJECT_DIR` for project context. Exit 2 to block with a helpful message.

### Hook Example: GAM Audit Logging (PostToolUse)
- Extracts command from JSON input via jq
- Skips read-only operations (print, show, info, get, list, report)
- Identifies write verbs (create, add, update, delete, remove, suspend, etc.)
- Appends JSON record to `.changelog-raw.jsonl` with timestamp, action, command, status
- Pattern: Audit trail for compliance and operational transparency

### Hook Example: Anti-Rationalization Gate (Stop)
This is a **prompt-type hook** (not a command hook) that runs when Claude wants to stop:
- Catches incomplete work rationalizations
- Forces continuation if the agent tries to declare work "done" prematurely
- Key pattern: The hook examines the transcript for signs of rationalization and blocks the stop event (exit 2), feeding instructions back to Claude to continue working

### Hook Example: Inline PreToolUse Hooks (in settings.json)
```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "CMD=$(jq -r '.tool_input.command'); if echo \"$CMD\" | grep -qE 'rm[[:space:]]+-[^[:space:]]*r[^[:space:]]*f'; then echo 'BLOCKED: Use trash instead of rm -rf' >&2; exit 2; fi"
    },
    {
      "type": "command",
      "command": "CMD=$(jq -r '.tool_input.command'); if echo \"$CMD\" | grep -qE 'git[[:space:]]+push.*(main|master)'; then echo 'BLOCKED: Use feature branches, not direct push to main' >&2; exit 2; fi"
    }
  ]
}
```

### Hook Performance Guidance
- PreToolUse hooks run on **every** Bash command -- optimize aggressively
- Prefer shell + jq over Python
- Fast-fail early for non-matching commands
- Favor regex over AST parsing

### Hookify Plugin (Anthropic Official)
A meta-plugin that auto-generates hooks from natural language:
```
/hookify Don't use console.log in TypeScript files
/hookify Warn me when I use rm -rf commands
```

**Rule file format** (`.claude/hookify.*.local.md`):
```yaml
---
name: block-dangerous-rm
enabled: true
event: bash
pattern: rm\s+-rf
action: block        # "warn" or "block"
---
Warning message shown to the agent...
```

**Event types:** bash, file, stop, prompt, all
**Operators:** regex_match, contains, equals, not_contains, starts_with, ends_with
**Fields by event:** command (bash), file_path/new_text/old_text (file), user_prompt (prompt), transcript (stop)

Advanced rules support multiple conditions (all must match):
```yaml
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.env$|credentials|secrets
  - field: new_text
    operator: contains
    pattern: KEY
```

---

## 5. Skill Patterns

### Skill Architecture (from CLAUDE.md in trailofbits/skills)

**Plugin Directory Structure:**
```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json
├── commands/
├── agents/
├── skills/
│   └── <skill-name>/
│       ├── SKILL.md
│       ├── references/
│       ├── workflows/
│       └── scripts/
├── hooks/
└── README.md
```

**Critical:** Component directories must be at plugin root, NOT inside `.claude-plugin/`.

### SKILL.md Frontmatter Template
```yaml
---
name: skill-name
description: "Third-person description of purpose and usage triggers"
allowed-tools:
  - Read
  - Grep
---
```

### Naming Conventions
- **kebab-case** (max 64 characters)
- **Gerund forms preferred:** "analyzing-contracts" over "contract-analyzer"
- **Avoid vague names:** helper, utils, tools, misc
- **Avoid reserved words:** anthropic, claude

### Skill Frontmatter Fields
| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Display name (defaults to directory name) |
| `description` | Recommended | Controls when Claude activates the skill |
| `allowed-tools` | No | Tools Claude can use without asking |
| `disable-model-invocation` | No | Only user can invoke (not Claude) |
| `user-invocable` | No | Set false to hide from / menu (Claude can still invoke) |
| `context` | No | Set `fork` to run in isolated subagent context |
| `agent` | No | Subagent type when context: fork (e.g., Explore, Plan) |
| `model` | No | Switch model when skill is active |
| `argument-hint` | No | Hint shown during autocomplete |
| `hooks` | No | Lifecycle-scoped hooks for this skill |

### The Description Field Is Everything
> "The `description` field is the only thing that controls when a skill activates. The body of SKILL.md -- including 'When to Use' and 'When NOT to Use' sections -- is only read AFTER the skill is already active."

Good description format:
- Start with triggering conditions ("Use when...")
- Use third-person voice ("Analyzes X" not "I analyze X")
- Include specific trigger keywords
- Include exclusions ("NOT for simple pattern matching")

### Required SKILL.md Sections
```markdown
## When to Use
[Specific application scenarios]

## When NOT to Use
[Better alternatives -- name specific alternatives]

## Rationalizations to Reject
[Common shortcuts to avoid -- REQUIRED FOR SECURITY SKILLS ONLY]
```

### String Substitutions in Skills
Three types:
1. **Argument variables** -- `$ARGUMENTS` for all args, `$ARGUMENTS[N]` or `$N` for positional args
2. **Session variable** -- `${CLAUDE_SESSION_ID}`
3. **Shell preprocessing** -- `!` followed by backtick-enclosed command (runs before Claude sees content)

### Reference Skills by Complexity
| Level | Example | Demonstrates |
|-------|---------|--------------|
| Basic | ask-questions-if-underspecified | Minimal frontmatter, simple guidance |
| Intermediate | constant-time-analysis | Python package, references/, language-specific docs |
| Advanced | culture-index | Scripts, workflows/, templates/, PDF extraction, multiple entry points |

### Path Handling
- Use `{baseDir}` placeholder (never hardcode absolute paths)
- Use forward slashes even on Windows

### Python Scripts with Dependencies (PEP 723)
```python
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests>=2.28", "pydantic>=2.0"]
# ///
```
Execute with `uv run {baseDir}/scripts/process.py`.

### Value-Add Philosophy
- Provide behavioral guidance, not reference dumps
- Explain WHY and trade-offs, not just WHAT
- Document anti-patterns with explanations
- Teach how to look things up contextually

---

## 6. Agent and Subagent Patterns

### Skills vs Agents vs Subagents vs Commands vs Hooks
| Component | What it is | When to use | How triggered |
|-----------|-----------|-------------|---------------|
| **Skill** | Knowledge/guidance | Teaching patterns, domain expertise | Auto-activated by description match |
| **Agent** | Autonomous executor | Tasks needing independent structured output | Spawned via Task tool with subagent_type |
| **Subagent** | Agent spawned by agent | Delegating subtasks within workflow | Parent uses Task tool |
| **Command** | User-invoked action | Explicit operations user triggers | User types /command-name |
| **Hook** | Event-driven interceptor | Validating/transforming tool calls | System events |

**Decision rule:** If the user should invoke it explicitly, make it a command. If it should trigger automatically based on context, make it a skill. If it runs autonomously to produce output, make it an agent.

### Agent Frontmatter
Agents use `tools:` (not `allowed-tools:`):
```yaml
---
name: my-agent
description: "What it does"
tools: Read, Grep, Glob, TodoRead, TodoWrite
---
```

### Subagent Context Passing
When spawning a subagent via Task tool, include:
1. **What to analyze** -- specific file paths, function names, or patterns
2. **What to look for** -- explicit criteria, not vague "analyze this"
3. **What format to return** -- markdown structure, JSON schema, or checklist
4. **What tools to use** -- specify the subagent_type for appropriate tool access

### PR Review Toolkit Agents (Anthropic Official)
The `pr-review-toolkit` plugin defines 6 specialized agents that demonstrate multi-agent review:

| Agent | Focus |
|-------|-------|
| code-reviewer | CLAUDE.md compliance, style violations, bug detection |
| silent-failure-hunter | Error handling, silent failures, inadequate catch blocks |
| pr-test-analyzer | Test coverage quality, edge cases, behavioral vs line coverage |
| type-design-analyzer | Type encapsulation, invariant expression (rated 1-10) |
| comment-analyzer | Comment accuracy vs code, documentation completeness |
| code-simplifier | Unnecessary complexity, redundant abstractions |

**Pattern:** Each agent has specific trigger phrases and produces structured output with confidence scoring and severity ranking.

### Feature Dev Plugin Agents (Anthropic Official)
Three agents in a 7-phase workflow:

| Agent | Phase | Focus |
|-------|-------|-------|
| code-explorer | Phase 2: Codebase Exploration | Entry points, call chains, data flow, architecture |
| code-architect | Phase 4: Architecture Design | Pattern analysis, architecture decisions, component design |
| code-reviewer | Phase 6: Quality Review | Project guideline compliance, bug detection (>=80% confidence threshold) |

**Key pattern:** Launches 2-3 agents in parallel with different focuses (e.g., minimal changes vs clean architecture vs pragmatic balance).

### Tool Assignment Matrix
| Operation | Correct Tool | NOT This |
|-----------|-------------|----------|
| Find files by name/pattern | Glob | find via Bash |
| Search file contents | Grep | grep/rg via Bash |
| Read a file | Read | cat/head/tail via Bash |
| Write a new file | Write | echo/cat EOF via Bash |
| Edit existing file | Edit | sed/awk via Bash |
| Run shell command | Bash | N/A |
| Run Python script | Bash (uv run) | N/A |
| Get user confirmation | AskUserQuestion | Printing and hoping |
| Delegate analysis | Task (subagent) | Doing everything inline |

---

## 7. Workflow Patterns

The `workflow-skill-design` plugin in trailofbits/skills teaches five fundamental workflow patterns.

### Pattern 1: Routing Pattern
**When:** Multiple independent tasks sharing common setup but diverging into separate paths.
```markdown
<intake>
Step 1: What data do you have?
Step 2: What would you like to do?
</intake>
<routing>
| Response | Workflow |
|----------|----------|
| 1, "keyword" | `workflows/task-one.md` |
| 2, "keyword" | `workflows/task-two.md` |
**After reading the workflow, follow it exactly.**
</routing>
```
- Intake validates prerequisites before routing
- Routing table uses numeric options AND keyword synonyms
- Each workflow file is self-contained
- "Follow it exactly" instruction prevents LLM improvisation

### Pattern 2: Sequential Pipeline
**When:** Dependent steps where each step's output feeds the next.
- Steps must execute in order
- Entry/exit criteria on every step
- Auto-detection logic for resuming from partial progress
- Task tracking (TaskCreate/TaskUpdate) coordinates execution

### Pattern 3: Linear Progression
**When:** Single start-to-finish process with no branching.
```markdown
### Phase 1: Setup
**Entry:** User has provided [input]
**Actions:**
1. Validate input
2. Check prerequisites
**Exit:** [Specific artifact] exists and is valid
```
- Every phase numbered with entry/exit criteria
- No conditional branching
- Verification at the end

### Pattern 4: Safety Gate
**When:** Destructive or irreversible actions requiring user confirmation.
- **Two gates, not one:** Review the plan, then approve exact commands
- Analysis completes fully before any gate
- Individual execution (one failure does not block the rest)
- Report phase shows what changed and what was left untouched

### Pattern 5: Task-Driven
**When:** Complex dependencies, partial failure tolerance, progress tracking.
```markdown
- TaskCreate: "Step A" (no dependencies)
- TaskCreate: "Step B" (blockedBy: Step A)
- TaskCreate: "Step C" (blockedBy: Step A)
- TaskCreate: "Step D" (blockedBy: Step B, Step C)
```
- Dependencies declared upfront, not discovered during execution
- Independent tasks can execute in parallel
- Failed tasks block dependents but not unrelated tasks

### Cross-Pattern: Feedback Loops
```
Execute step -> Validate -> Pass? -> Next step
                         -> Fail? -> Fix -> Re-validate
```
- Define maximum loop count (e.g., 3 attempts then escalate)
- Each iteration makes the validation command explicit
- Distinguish "fix and retry" (automated) from "escalate" (human) exits

### Essential Principles for All Workflow Skills
1. **Description is the trigger** -- the only thing controlling activation
2. **Numbered phases** with entry and exit criteria
3. **Tools match the executor** -- skills use `allowed-tools:`, agents use `tools:`
4. **Progressive disclosure is structural** -- SKILL.md under 500 lines
5. **Scalable tool patterns** -- apply the "10,000-file test"
6. **Degrees of freedom match task fragility** -- low freedom for crypto/destructive ops, high freedom for exploration

---

## 8. Command Patterns (Autonomous Pipelines)

### /fix-issue -- End-to-End Issue Resolution
A comprehensive autonomous pipeline:
1. **Research** (optional) -- web search for unfamiliar APIs, protocols, libraries
2. **Planning** -- document requirements, files to modify, design approach, risks in `plan-issue-$ISSUE_NUMBER.md`
3. **Branching** -- create branches with prefixes (`fix/`, `feat/`, `refactor/`, `docs/`) based on upstream's main branch
4. **Implementation** -- follow project standards (CLAUDE.md), keep changes focused, integrate tests
5. **Quality Pipeline** -- discover actual CI checks from `.github/workflows/`, run build -> test -> lint/format -> extended checks -> codegen sync -> docs build
6. **Self-Review** -- deep review using PR review toolkit agents; docs changes require manual link verification
7. **Fix Findings** -- address all severity-ranked findings (P1 blocks merge, P2 important, P3 nice-to-have)
8. **Finalize** -- delete plan file, commit with conventional messages, push, create PR linking issue, post summary comment

**Key pattern:** CI configuration is the source of truth for quality checks, with language-specific fallbacks.

### /review-pr -- Multi-Agent PR Review
Two parallel passes:
- **Pass A:** Three pr-review-toolkit agents (code-reviewer, silent-failure-hunter, pr-test-analyzer)
- **Pass B:** External reviewers -- Codex (gpt-5.3-codex model) and Gemini (gemini-3-pro-preview) analyzing diffs

Results merge with deduplication, ranked P1 through P4. Fix findings, verify with CI-discovered checks, commit, and post structured PR summary.

**Key pattern:** Multi-model review (Claude + Codex + Gemini) for diverse perspectives.

### /merge-dependabot -- Batch Dependency Merge
Five phases:
1. **Dependabot Config Audit** -- validates `.github/dependabot.yml`
2. **Discovery & Baseline** -- fetch open PRs, categorize, verify main branch builds
3. **Dependency Graph Analysis** -- parse lockfiles, build transitive dependency map, group overlapping PRs into batches, sort topologically
4. **Parallel Evaluation** -- up to 5 subagents simultaneously evaluate work units
5. **Sequential Merge** -- merge in dependency order, re-test after each merge

**Turn budget management:**
- At 75% of turns: stop launching new evaluations, merge already-evaluated
- At 90% of turns: print summary and stop immediately

**Key pattern:** Topological sorting of dependency graph, bounded subagent spawning, graceful degradation under turn limits.

### /trailofbits:config -- Self-Installing Setup
The config command itself demonstrates a meta-pattern:
1. Inventory existing files
2. Ask user what to install (multi-select)
3. Fetch selected files from GitHub via WebFetch
4. Install with merge logic (preserve existing customizations, never silently overwrite CLAUDE.md)
5. Self-install the command itself to `~/.claude/commands/trailofbits/config.md`
6. Post-install summary with reminders (API keys, customization)

---

## 9. Progressive Disclosure Patterns

### The 500-Line Rule
> "SKILL.md must stay under 500 lines. This is not arbitrary -- it's the threshold where LLM attention degrades."

### What Goes Where
| Location | Content | Test |
|----------|---------|------|
| SKILL.md | Essential principles, routing, quick reference, success criteria | Would removing it cause wrong output on ANY invocation? |
| references/ | Detailed patterns, API refs, domain knowledge | Only needed for SOME invocations? |
| workflows/ | Step-by-step procedures, checklists | A series of ordered steps for a specific task? |

### The One-Level-Deep Rule
SKILL.md links to reference and workflow files. Those files do NOT link to other reference files.
```
ALLOWED:   SKILL.md -> references/patterns.md
NOT ALLOWED: references/patterns.md -> references/details.md
```
Reason: Each hop degrades context. By the second hop, the LLM has lost track of origin.

**Exception:** Directory nesting for organization is fine. The restriction is on reference chains, not directory depth.

### Sizing Guidelines
| File type | Target | Maximum |
|-----------|--------|---------|
| SKILL.md | 200-400 lines | 500 lines |
| Reference file | 100-300 lines | 400 lines |
| Workflow file | 80-200 lines | 300 lines |
| Agent definition | 80-200 lines | 300 lines |

### SKILL.md Structure Funnel
```
## Essential Principles     <- Always read (5-7 bullet points)
## When to Use / NOT        <- Scopes behavior
## Decision Tree            <- Routes to the right pattern
## Quick Reference Table    <- Compact summary (10-15 rows)
## Reference Index          <- Links to detailed files
## Success Criteria         <- Final checklist
```

Front-load what matters. Push details into files read on demand.

### Degrees of Freedom
Match instruction specificity to task fragility:
- **Low freedom** (exact commands): Fragile operations -- database migrations, crypto, destructive actions
- **Medium freedom** (pseudocode with parameters): Preferred patterns where variation is acceptable
- **High freedom** (heuristics and judgment): Variable tasks -- code review, exploration, documentation

A skill can mix freedom levels within its phases.

---

## 10. Model Routing and Local Models

### Local Model Setup (LM Studio)
Trail of Bits recommends Qwen3-Coder-Next (February 2026):
- 80B mixture-of-experts, 3B active parameters
- Designed for agentic coding with tool use
- MLX 4-bit quantization: ~45GB, needs 64GB+ unified memory

```bash
lms get Qwen3-Coder-Next@MLX-4bit -y
lms load qwen/qwen3-coder-next --context-length 32768 --gpu max -y
lms server start
```

### Connecting Claude Code to Local Models
```bash
ANTHROPIC_BASE_URL=http://localhost:1234 \
ANTHROPIC_AUTH_TOKEN=lmstudio \
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
claude --model qwen/qwen3-coder-next "$@"
```

### Shell Alias Pattern
```bash
alias claude-yolo="claude --dangerously-skip-permissions"

claude-local() {
  ANTHROPIC_BASE_URL=http://localhost:1234 \
  ANTHROPIC_AUTH_TOKEN=lmstudio \
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
  claude --model qwen/qwen3-coder-next "$@"
}
```

### Skill-Level Model Routing
Skills can switch the active model:
```yaml
---
name: my-skill
model: [model-name]
---
```
This enables routing simpler tasks to cheaper/faster models while keeping complex tasks on Claude.

### Multi-Model Review (review-pr command)
The review-pr command runs three different models in parallel:
- Claude (via pr-review-toolkit agents)
- OpenAI Codex (gpt-5.3-codex via codex CLI)
- Google Gemini (gemini-3-pro-preview via gemini CLI)

Second-opinion skill also provides this via:
- `codex_ask`, `codex_exec`, `codex_review` MCP tools
- External Gemini CLI invocation

---

## 11. MCP Server Configuration

### Recommended MCP Servers
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": { "EXA_API_KEY": "your-exa-api-key-here" }
    }
  }
}
```

### Configuration Locations
- `~/.mcp.json` -- global servers (every session)
- `.mcp.json` in project root -- project-specific servers
- Merged together automatically

### Security Note
Set `enableAllProjectMcpServers: false` in settings.json to prevent malicious repo-shipped MCP servers from auto-loading.

---

## 12. Sandboxing and Security

### Dual-Boundary Isolation Model
Anthropic's sandboxing uses two complementary containment mechanisms:
1. **Filesystem Isolation** -- restricts Claude to specific directories
2. **Network Isolation** -- allows only approved server connections through a proxy

### OS-Level Implementation
- **Linux:** bubblewrap for container-like restrictions
- **macOS:** seatbelt for capability-based security
- Coverage extends to spawned subprocesses

### Key Design Insight
> "Effective sandboxing requires BOTH filesystem and network isolation."

Internal testing shows sandboxing "safely reduces permission prompts by 84%," addressing approval fatigue.

### Three Layers of Sandbox
1. **Built-in `/sandbox`** -- Seatbelt/bubblewrap with deny rules in settings.json
2. **Devcontainer** -- Full Docker isolation, only project files mounted
3. **Remote Droplets** -- Disposable cloud instances via dropkit for complete host isolation

### Cloud Deployment Pattern
Credentials kept outside the sandbox -- separation-of-duties approach prevents compromised code from accessing git credentials or signing keys.

---

## 13. Testing and Verification Patterns

### From CLAUDE.md Template
- Test behavior, not implementation
- Cover edges and errors, not just happy paths
- Mock only slow or external services
- Verify tests fail when code breaks (mutation testing when possible)

### From Superpowers Plugin (obra/superpowers)
- **TDD enforcement:** System deletes code written before tests
- **RED-GREEN-REFACTOR** cycle enforced, not suggested
- **Verification-before-completion** skill: confirms fixes before declaring success

### From Workflow Patterns
- Every workflow should have a verification step
- Feedback loops: Execute -> Validate -> Pass/Fail -> Fix -> Re-validate
- Maximum loop count to prevent infinite retry spirals

### From fix-issue Command
Quality pipeline discovers actual CI checks from `.github/workflows/`:
1. build
2. test
3. lint/format
4. extended checks
5. codegen sync
6. docs build

CI-discovered commands override language-specific fallback defaults.

### From review-pr Command
- Multi-agent parallel review (3 internal agents + 2 external models)
- Severity-ranked findings: P1 blocks merge, P2 important, P3 nice-to-have, P4 informational
- Findings are either fixed or dismissed with documented reasoning

---

## 14. Plugin Architecture and Marketplace

### Plugin Structure (Agent Skills Open Format)
```
plugin-name/
├── .claude-plugin/
│   └── plugin.json      # Plugin metadata (required)
├── .mcp.json             # MCP server configuration (optional)
├── commands/              # Slash commands (optional)
├── agents/                # Agent definitions (optional)
├── skills/                # Skill definitions (optional)
└── README.md              # Documentation
```

### Marketplace Model
Plugins are distributed via GitHub repositories functioning as marketplaces:
```bash
claude plugin marketplace add trailofbits/skills        # Add marketplace
claude plugin install my-plugin@marketplace-name        # Install specific plugin
```

### Registration Requirements
- Valid YAML frontmatter with name and description
- kebab-case name <=64 characters
- All referenced files exist
- No hardcoded paths
- README.md included
- Added to root README.md table
- Registered in root `.claude-plugin/marketplace.json`
- Added to CODEOWNERS

### Agent Skills Open Format (agentskills.io)
The Agent Skills format is an open standard originally developed by Anthropic, now adopted by 27+ agent products including Claude Code, Cursor, OpenAI Codex, Gemini CLI, GitHub Copilot, VS Code, Goose, Roo Code, and many others.

---

## 15. External Ecosystem and Curated Skills

### Approved Third-Party Marketplaces
1. **trailofbits/skills** -- public security and development skills
2. **anthropics/claude-plugins-official** -- 29 official Anthropic plugins
3. **anthropics/knowledge-work-plugins** -- knowledge work plugins
4. **obra/superpowers** -- TDD-enforced development methodology (55.5k stars)
5. **EveryInc/compound-engineering-plugin** -- compound engineering workflow
6. **coreyhaines31/marketingskills** -- marketing skills
7. **ghostsecurity/skills** -- application security (SAST, SCA, DAST, secrets)
8. **openai/skills** -- OpenAI's portable agent skills
9. **getsentry/skills** -- Sentry's internal development skills

### Anthropic Official Plugins (29 total)
Key plugins: agent-sdk-dev, code-review, code-simplifier, commit-commands, feature-dev, hookify, playground, plugin-dev, pr-review-toolkit, security-guidance, skill-creator, plus 10 LSP integrations.

### Obra Superpowers (55.5k stars)
Full TDD-enforced development methodology:
- 15+ composable skills (test-driven-development, systematic-debugging, brainstorming, writing-plans, executing-plans, dispatching-parallel-agents, subagent-driven-development, etc.)
- Mandatory 7-stage pipeline: Design -> Setup -> Planning -> Execution -> Testing -> Review -> Integration
- Plans designed for "enthusiastic junior engineer with poor taste, no judgment"
- TDD enforcement deletes code written before tests

### Compound Engineering Plugin (EveryInc)
Philosophy: "Each unit of engineering work should make subsequent units easier."
- Four commands: `/workflows:plan`, `/workflows:work`, `/workflows:review`, `/workflows:compound`
- 80% planning and review, 20% execution
- Knowledge compounding: plans inform future plans, reviews capture patterns
- Cross-platform transpiler pattern (Claude Code -> OpenCode, Codex, Gemini, Copilot, etc.)

### Sentry Skills (getsentry/skills)
13 skills with routing and progressive disclosure:
- Hierarchical organization: Global (org-wide) -> Domain-specific (team) -> Repo-specific
- Automatic activation based on context
- Selective installation via plugin marketplace model

### Ghost Security Skills
7 complementary AppSec skills covering the full lifecycle:
- ghost-repo-context -> ghost-scan-code -> ghost-scan-deps -> ghost-scan-secrets -> ghost-report -> ghost-validate -> ghost-proxy

---

## 16. Trail of Bits Skills Catalog

### Smart Contract Security (2 plugins)
| Plugin | Description |
|--------|-------------|
| building-secure-contracts | Smart contract security toolkit with vulnerability scanners for 6 blockchains |
| entry-point-analyzer | Identify state-changing entry points for security auditing |

### Code Auditing (10 plugins)
| Plugin | Description |
|--------|-------------|
| audit-context-building | Build deep architectural context through ultra-granular analysis |
| burpsuite-project-parser | Search/extract data from Burp Suite project files |
| differential-review | Security-focused differential review with git history analysis |
| insecure-defaults | Detect insecure defaults, hardcoded credentials, fail-open patterns |
| semgrep-rule-creator | Create and refine Semgrep rules for custom vulnerability detection |
| semgrep-rule-variant-creator | Port Semgrep rules to new languages with test-driven validation |
| sharp-edges | Identify error-prone APIs, dangerous configs, footgun designs |
| static-analysis | Static analysis with CodeQL, Semgrep, SARIF parsing |
| testing-handbook-skills | Fuzzers, static analysis, sanitizers, coverage |
| variant-analysis | Find similar vulnerabilities using pattern-based analysis |

### Malware Analysis (1 plugin)
| Plugin | Description |
|--------|-------------|
| yara-authoring | YARA detection rule authoring with linting and best practices |

### Verification (3 plugins)
| Plugin | Description |
|--------|-------------|
| constant-time-analysis | Detect compiler-induced timing side-channels in crypto code |
| property-based-testing | Property-based testing for multiple languages and smart contracts |
| spec-to-code-compliance | Specification-to-code compliance checker for blockchain audits |

### Reverse Engineering (1 plugin)
| Plugin | Description |
|--------|-------------|
| dwarf-expert | Interact with and understand the DWARF debugging format |

### Mobile Security (1 plugin)
| Plugin | Description |
|--------|-------------|
| firebase-apk-scanner | Scan Android APKs for Firebase security misconfigurations |

### Development (7 plugins)
| Plugin | Description |
|--------|-------------|
| ask-questions-if-underspecified | Clarify requirements before implementing (1-5 must-have questions) |
| devcontainer-setup | Create pre-configured devcontainers with Claude Code |
| gh-cli | Intercept GitHub URL fetches, redirect to authenticated gh CLI |
| git-cleanup | Safely clean up git worktrees and branches with gated confirmation |
| modern-python | Modern Python with uv, ruff, pytest |
| second-opinion | Code reviews using external LLM CLIs (Codex, Gemini) |
| workflow-skill-design | Design patterns for workflow-based skills with review agent |

### Team Management (1 plugin)
| Plugin | Description |
|--------|-------------|
| culture-index | Interpret Culture Index survey results |

### Curated Third-Party Skills (in skills-curated)
| Category | Skills |
|----------|--------|
| Development | planning-with-files, python-code-simplifier, react-pdf, skill-extractor |
| Security | ffuf-web-fuzzing, ghidra-headless, scv-scan, security-awareness, wooyun-legacy |
| Research | last30days, x-research |
| Writing | humanizer |
| OpenAI Conversions | 18 skills auto-converted from openai/skills |

---

## 17. Referenced Blog Posts and Best Practices

### Simon Willison: Using LLMs for Code (2025)
- LLMs are "an over-confident pair programming assistant"
- Provide **authoritarian instructions**: detailed specifications, function signatures, explicit requirements
- Training data cutoff awareness: use stable, well-documented libraries
- **Iterative refinement**: treat imperfect results as starting points
- LLMs amplify existing expertise rather than replace it

### Nilenso: AI-Assisted Coding for Teams (2025)
- **"AI is a multiplier"** -- high-quality fundamentals translate to better AI outcomes
- Break features into smaller tasks with commits between each
- Create RULES.md encoding coding standards, tech stack details, common mistakes
- AI performs significantly better in codebases with good test coverage, automation, clear docs, and consistent patterns
- **"Tests are non-negotiable"** -- assertions require human review

### Fly.io: The Case for LLM-Assisted Coding (2025)
- Modern agents "poke around your codebase on their own," compile, test, iterate
- Hallucination is "more or less a solved problem" with compilation and linting feedback loops
- Use LLMs as force multipliers on systematic, predictable tasks
- Reserve human expertise for architecture, direction, and judgment

### Key Synthesis
All three sources converge on:
1. LLMs amplify skill, they don't replace it
2. Tests and automated verification are non-negotiable
3. Break work into small, verifiable chunks
4. Provide explicit, detailed instructions (not vague prompts)
5. The development environment matters -- good infrastructure makes AI better

---

## 18. Key Takeaways for Our Plugin

### Patterns to Adopt

**CLAUDE.md Patterns:**
- Prescriptive hard limits (function length, complexity, line width)
- Language-specific toolchain mandates
- Workflow standards section (branching, commits, testing)
- Zero warnings policy

**Skill Architecture:**
- Use `description` as the primary activation trigger
- Progressive disclosure: SKILL.md (core) -> references/ (details) -> workflows/ (procedures)
- Keep SKILL.md under 500 lines
- One-level-deep reference linking
- Include "When to Use" and "When NOT to Use" sections

**Hook Patterns:**
- Anti-rationalization Stop hook to prevent premature completion
- Package manager enforcement via PreToolUse
- Audit logging via PostToolUse
- Fast-fail early pattern for performance

**Agent Patterns:**
- Specialized agents with narrow focus (one job per agent)
- Parallel agent spawning with different perspectives
- Confidence scoring in agent output
- Severity ranking (P1 through P4) for findings

**Workflow Patterns:**
- Choose from 5 patterns based on decision structure
- Numbered phases with entry/exit criteria
- Safety gates for destructive actions (two confirmation gates)
- Feedback loops with bounded retry counts
- Auto-detection for resuming partial progress

**Command Patterns (Autonomous Pipelines):**
- The fix-issue command is a template for any autonomous resolution pipeline
- Discover CI configuration as source of truth for quality checks
- Create plan files, work the plan, delete the plan on success
- Multi-model review for diverse perspectives (Claude + Codex + Gemini)

**Testing Patterns:**
- Test behavior not implementation
- TDD enforcement (not suggestion)
- Verification-before-completion gates
- CI-discovered quality pipelines

**Security Patterns:**
- Layered deny rules for credentials, destructive commands, shell configs
- Disable telemetry and error reporting
- Block project MCP servers by default
- Three-layer sandboxing (built-in, devcontainer, remote droplet)

### Anti-Patterns to Avoid
| Code | Anti-Pattern | Fix |
|------|-------------|-----|
| AP-1 | Vague description, missing scope | Specific trigger keywords + When to Use/NOT |
| AP-2 | Monolithic SKILL.md (>500 lines) | Split into references/ and workflows/ |
| AP-3 | Reference chains (A->B->C) | One level deep from SKILL.md |
| AP-4 | Hardcoded paths | Use {baseDir} |
| AP-6 | Unnumbered phases | Number every phase with entry/exit |
| AP-7 | Missing exit criteria | Define "done" for every phase |
| AP-8 | No verification step | Validate at the end of every workflow |
| AP-9 | Vague routing keywords | Distinctive keywords per workflow route |
| AP-11 | Wrong tool (Bash for Read/Grep) | Use dedicated tools |
| AP-13 | Vague subagent prompts | Specify what to analyze, look for, and return |
| AP-15 | Reference dumps | Teach judgment, not raw docs |
| AP-18 | Cartesian product tool calls | Combine into single regex |
| AP-19 | Unbounded subagent spawning | Batch items, one subagent per batch |
| AP-20 | Description summarizes workflow | Description = triggering conditions only |

### Immediate Action Items for pm-artifacts
1. **Adopt the 500-line SKILL.md limit** with progressive disclosure to references/
2. **Add anti-rationalization Stop hook** to prevent premature phase completion
3. **Refine SKILL.md description** with specific trigger keywords and exclusions
4. **Add "When NOT to Use" section** with named alternatives
5. **Number all workflow phases** with explicit entry/exit criteria
6. **Consider multi-agent review** for artifact quality (PM reviewer + UX reviewer + technical reviewer)
7. **Add {baseDir} path handling** for portability
8. **Implement the Safety Gate pattern** for any destructive PM operations (overwriting existing artifacts)
9. **Add skill-level model routing** to use faster models for simpler artifact generation
10. **Study the fix-issue command pattern** for autonomous PM discovery pipeline design

---

## Appendix A: Complete Link Index

### Trail of Bits Repositories
- https://github.com/trailofbits/claude-code-config (1,139 stars)
- https://github.com/trailofbits/skills (2,807 stars)
- https://github.com/trailofbits/skills-curated
- https://github.com/trailofbits/skills-internal (private)
- https://github.com/trailofbits/claude-code-devcontainer
- https://github.com/trailofbits/dropkit

### Anthropic Resources
- https://code.claude.com/docs/en/best-practices
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/hooks-guide
- https://code.claude.com/docs/en/sandboxing
- https://www.anthropic.com/engineering/claude-code-sandboxing
- https://github.com/anthropics/claude-plugins-official
- https://github.com/anthropics/knowledge-work-plugins
- https://agentskills.io

### Third-Party Skill Repositories
- https://github.com/obra/superpowers (55.5k stars)
- https://github.com/EveryInc/compound-engineering-plugin
- https://github.com/getsentry/skills
- https://github.com/ghostsecurity/skills
- https://github.com/openai/skills
- https://github.com/coreyhaines31/marketingskills

### Blog Posts and Articles
- https://simonwillison.net/2025/Mar/11/using-llms-for-code/
- https://blog.nilenso.com/blog/2025/05/29/ai-assisted-coding/
- https://fly.io/blog/youre-all-nuts/
- https://openai.com/index/harness-engineering/

### Tools and Services
- https://ghostty.org (GPU-accelerated terminal)
- https://lmstudio.ai (local model hosting)
- https://lmstudio.ai/models/qwen3-coder-next (recommended local model)
- https://exa.ai (web and code search API)

---

## Appendix B: Statusline Script Pattern

The statusline script (`scripts/statusline.sh`) demonstrates a useful operational pattern:

**Line 1:** Model name | Current folder | Git branch
**Line 2:** Context usage bar (color-coded) | Context % | Cost in USD | Session duration | Cache hit %

Key implementation details:
- Reads JSON from stdin, extracts via jq
- Color-coded progress bar: green (<50%), yellow (50-79%), red (80%+)
- 12-character width progress bar using block characters
- Fallback mechanism if initial jq parse fails
- ANSI escape codes for colored output
- Prioritizes pre-calculated percentages over manual calculations
