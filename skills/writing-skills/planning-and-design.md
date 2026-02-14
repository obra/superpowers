# Planning and Design

> From Anthropic's [Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)

## Start with use cases

Before writing any code, identify 2-3 concrete use cases your skill should enable.

**Good use case definition:**
```
Use Case: Project Sprint Planning
Trigger: User says "help me plan this sprint" or "create sprint tasks"
Steps:
1. Fetch current project status from Linear (via MCP)
2. Analyze team velocity and capacity
3. Suggest task prioritization
4. Create tasks in Linear with proper labels and estimates
Result: Fully planned sprint with tasks created
```

Ask yourself:
* What does a user want to accomplish?
* What multi-step workflows does this require?
* Which tools are needed (built-in or MCP)?
* What domain knowledge or best practices should be embedded?

## Common skill use case categories

At Anthropic, three common categories have been observed:

### Category 1: Document & Asset Creation

Creating consistent, high-quality output including documents, presentations, apps, designs, code, etc.

**Key techniques:** Embedded style guides and brand standards, template structures for consistent output, quality checklists before finalizing, no external tools required — uses Claude's built-in capabilities.

### Category 2: Workflow Automation

Multi-step processes that benefit from consistent methodology, including coordination across multiple MCP servers.

**Key techniques:** Step-by-step workflow with validation gates, templates for common structures, built-in review and improvement suggestions, iterative refinement loops.

### Category 3: MCP Enhancement

Workflow guidance to enhance the tool access an MCP server provides.

**Key techniques:** Coordinates multiple MCP calls in sequence, embeds domain expertise, provides context users would otherwise need to specify, error handling for common MCP issues.

## Define success criteria

These are aspirational targets — rough benchmarks rather than precise thresholds. Aim for rigor but accept that there will be an element of vibes-based assessment.

### Quantitative metrics

* **Skill triggers on 90% of relevant queries** — Run 10-20 test queries that should trigger your skill. Track how many times it loads automatically vs. requires explicit invocation.
* **Completes workflow in X tool calls** — Compare the same task with and without the skill enabled. Count tool calls and total tokens consumed.
* **0 failed API calls per workflow** — Monitor MCP server logs during test runs. Track retry rates and error codes.

### Qualitative metrics

* **Users don't need to prompt Claude about next steps** — During testing, note how often you need to redirect or clarify. Ask beta users for feedback.
* **Workflows complete without user correction** — Run the same request 3-5 times. Compare outputs for structural consistency and quality.
* **Consistent results across sessions** — Can a new user accomplish the task on first try with minimal guidance?

## Testing approach

**Pro Tip:** Iterate on a single task before expanding. The most effective skill creators iterate on a single challenging task until Claude succeeds, then extract the winning approach into a skill.

Skills can be tested at varying levels of rigor:
* **Manual testing in Claude.ai** — Run queries directly and observe behavior. Fast iteration, no setup required.
* **Scripted testing in Claude Code** — Automate test cases for repeatable validation across changes.
* **Programmatic testing via skills API** — Build evaluation suites that run systematically against defined test sets.

### Three areas to test

**1. Triggering tests** — Ensure your skill loads at the right times:
* ✅ Triggers on obvious tasks
* ✅ Triggers on paraphrased requests
* ❌ Doesn't trigger on unrelated topics

**2. Functional tests** — Verify the skill produces correct outputs:
* Valid outputs generated
* API calls succeed
* Error handling works
* Edge cases covered

**3. Performance comparison** — Prove the skill improves results vs. baseline. Compare with and without the skill for the same task.

## Using the skill-creator tool

The `skill-creator` skill — available in Claude.ai via plugin directory or download for Claude Code — helps you build and iterate on skills:

**Creating skills:** Generate from natural language descriptions, produce properly formatted SKILL.md with frontmatter, suggest trigger phrases and structure.

**Reviewing skills:** Flag common issues (vague descriptions, missing triggers, structural problems), identify potential over/under-triggering risks, suggest test cases based on the skill's stated purpose.

**Iterative improvement:** After using your skill and encountering edge cases or failures, bring those examples back to skill-creator. Example: "Use the issues & solution identified in this chat to improve how the skill handles [specific edge case]"

To use: "Use the skill-creator skill to help me build a skill for [your use case]"

## Distribution and sharing

### Current distribution model

**How individual users get skills:**
1. Download the skill folder
2. Zip the folder (if needed)
3. Upload to Claude.ai via Settings > Capabilities > Skills
4. Or place in Claude Code skills directory

**Organization-level skills:** Admins can deploy skills workspace-wide with automatic updates and centralized management.

### Using skills via API

For programmatic use cases — building applications, agents, or automated workflows — the API provides direct control:
* `/v1/skills` endpoint for listing and managing skills
* Add skills to Messages API requests via the `container.skills` parameter
* Version control and management through the Claude Console
* Works with the Claude Agent SDK for building custom agents

### Positioning your skill

Focus on outcomes, not features:
* ✅ "Enables teams to set up complete project workspaces in seconds — including pages, databases, and templates — instead of spending 30 minutes on manual setup."
* ❌ "A folder containing YAML frontmatter and Markdown instructions that calls MCP server tools."

### Skills as an open standard

Skills are designed to be portable across tools and platforms — the same skill should work whether you're using Claude or other AI platforms. Authors can note platform-specific capabilities in the `compatibility` field.
