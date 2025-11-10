# Superpowers - Skills Library for AI Coding Assistants

## Project Overview

Superpowers is a comprehensive skills library that provides proven techniques, patterns, and workflows for AI coding assistants (primarily Claude Code). It implements a mandatory skills system that enforces best practices through structured workflows.

**Core Philosophy:**
- Test-Driven Development (write tests first, always)
- Systematic over ad-hoc (process over guessing)
- Complexity reduction (simplicity as primary goal)
- Evidence over claims (verify before declaring success)
- Domain over implementation (work at problem level, not solution level)

## Architecture

### Directory Structure

```
superpowers/
├── skills/                    # Core skills library (20+ skills)
│   ├── testing/              # TDD, async testing, anti-patterns
│   ├── debugging/            # Systematic debugging, root cause tracing
│   ├── collaboration/        # Brainstorming, planning, code review
│   ├── meta/                 # Creating and sharing skills
│   └── commands/             # Slash command definitions
├── commands/                  # Top-level slash commands (thin wrappers)
├── lib/                      # Initialization scripts
│   └── initialize-skills.sh  # Git-based skills management
├── hooks/                    # Session lifecycle hooks
└── .claude-plugin/           # Plugin manifest (if present)
```

### Skills System

**Skill Structure:**
Each skill is a `SKILL.md` file with YAML frontmatter:

```yaml
---
name: skill-name
description: When to use this skill - triggers automatic activation
---
# Skill content in markdown
```

**Key Skills Categories:**

1. **Testing Skills** (`skills/testing/`)
   - `test-driven-development` - RED-GREEN-REFACTOR cycle (mandatory)
   - `condition-based-waiting` - Async test patterns
   - `testing-anti-patterns` - Common pitfalls to avoid

2. **Debugging Skills** (`skills/debugging/`)
   - `systematic-debugging` - 4-phase root cause process
   - `root-cause-tracing` - Backward tracing technique
   - `verification-before-completion` - Ensure fixes work
   - `defense-in-depth` - Multiple validation layers

3. **Collaboration Skills** (`skills/collaboration/`)
   - `brainstorming` - Socratic design refinement (before coding)
   - `writing-plans` - Detailed implementation plans
   - `executing-plans` - Batch execution with checkpoints
   - `dispatching-parallel-agents` - Concurrent subagent workflows
   - `requesting-code-review` - Pre-review checklist
   - `receiving-code-review` - Responding to feedback
   - `using-git-worktrees` - Parallel development branches
   - `finishing-a-development-branch` - Merge/PR decision workflow
   - `subagent-driven-development` - Fast iteration with quality gates

4. **Meta Skills** (`skills/meta/`)
   - `using-superpowers` - Introduction and mandatory protocols
   - `writing-skills` - Create new skills following best practices
   - `sharing-skills` - Contribute skills back via branch and PR
   - `testing-skills-with-subagents` - Validate skill quality

### Activation System

**Automatic Discovery:**
Skills activate automatically based on their `description` field matching the current task context. The AI assistant checks for relevant skills before every task.

**Mandatory Protocol (from `using-superpowers`):**
Before ANY user message response:
1. List available skills mentally
2. Ask: "Does ANY skill match this request?"
3. If yes → Use Skill tool to read and run the skill
4. Announce which skill you're using
5. Follow the skill exactly

**Critical: If a skill exists for a task, using it is MANDATORY, not optional.**

## Key Design Patterns

### Test-Driven Development (TDD)

**Iron Law:** NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST

**RED-GREEN-REFACTOR Cycle:**
1. **RED** - Write one minimal test showing expected behavior
2. **Verify RED** - Run test, watch it fail correctly
3. **GREEN** - Write simplest code to pass the test
4. **Verify GREEN** - Run test, watch it pass
5. **REFACTOR** - Clean up while staying green
6. **Repeat** - Next test for next feature

**Non-Negotiable Rules:**
- Write code before test? Delete it. Start over.
- Test passes immediately? It's testing existing behavior, not the new feature.
- Can't watch test fail? You don't know if it tests the right thing.

### Systematic Debugging

**Iron Law:** NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST

**Four Phases (must complete each before next):**

1. **Root Cause Investigation**
   - Read error messages carefully
   - Reproduce consistently
   - Check recent changes
   - Gather evidence in multi-component systems
   - Trace data flow (use `root-cause-tracing` sub-skill)

2. **Pattern Analysis**
   - Find working examples
   - Compare against references (read completely)
   - Identify differences
   - Understand dependencies

3. **Hypothesis and Testing**
   - Form single hypothesis
   - Test minimally (one variable at a time)
   - Verify before continuing

4. **Implementation**
   - Create failing test case (use TDD)
   - Implement single fix
   - Verify fix works
   - **If 3+ fixes failed:** STOP and question architecture

### Brainstorming

**Use before writing code or implementation plans**

**Process:**
1. Understand current project context
2. Ask questions one at a time (prefer multiple choice)
3. Explore 2-3 approaches with trade-offs
4. Present design in 200-300 word sections
5. Validate incrementally
6. Write design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
7. If continuing to implementation:
   - Use `using-git-worktrees` for isolated workspace
   - Use `writing-plans` for detailed plan

**Key Principles:**
- One question at a time
- YAGNI ruthlessly
- Explore alternatives
- Incremental validation

## Integration Points

### Slash Commands

Thin wrappers that activate corresponding skills:

- `/superpowers:brainstorm` → `brainstorming` skill
- `/superpowers:write-plan` → `writing-plans` skill
- `/superpowers:execute-plan` → `executing-plans` skill

Located in `commands/` directory as markdown files with YAML frontmatter.

### SessionStart Hook

Loads the `using-superpowers` skill at session start, establishing mandatory workflows for the entire session.

### Git Worktrees

The `using-git-worktrees` skill enables parallel development:
- Create isolated workspaces for features
- Switch between multiple branches without stashing
- Ideal for working on multiple features simultaneously

### TodoWrite Integration

**Critical Rule:** If a skill has a checklist, create TodoWrite todos for EACH item.

Benefits:
- Prevents skipped steps
- Tracks progress
- Ensures accountability
- Tiny overhead vs. cost of missing steps

## Implementation Notes

### Initialization Script (`lib/initialize-skills.sh`)

**Purpose:** Git-based skills repository management

**Behavior:**
- Checks for skills directory at `~/.config/superpowers/skills`
- If exists and is git repo:
  - Fetches from tracking remote
  - Attempts fast-forward merge if behind
  - Reports update status
- If doesn't exist:
  - Clones from `https://github.com/obra/superpowers-skills.git`
  - Sets up upstream remote
  - Offers to fork if `gh` CLI available

**Migration Handling:**
- Backs up old installation to `.bak` directories
- Preserves user's custom skills

### Skills Discovery Mechanism

Skills are discovered through:
1. File system scanning (`skills/*/SKILL.md`)
2. YAML frontmatter parsing
3. Description field matching against current task context
4. Automatic activation when description matches

### Mandatory Workflow Enforcement

The `using-superpowers` skill establishes a strict protocol:

**Common Rationalizations (that mean you're about to fail):**
- "This is just a simple question"
- "I can check git/files quickly"
- "Let me gather information first"
- "This doesn't need a formal skill"
- "I remember this skill"
- "This doesn't count as a task"
- "The skill is overkill for this"
- "I'll just do this one thing first"

**Reality:** If a skill exists for a task, using it is MANDATORY.

## Code Quality Standards

### From TDD Skill

**Good Test Characteristics:**
- Minimal (one thing, "and" in name = split it)
- Clear name describing behavior
- Shows intent (demonstrates desired API)
- Uses real code (mocks only if unavoidable)
- Tests behavior, not implementation

**Test-First Benefits:**
- Finds bugs before commit (faster than debugging after)
- Prevents regressions
- Documents behavior
- Enables fearless refactoring

### From Systematic Debugging Skill

**Red Flags (STOP and follow process):**
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- Each fix reveals new problem (architectural issue)

**Human Partner Signals:**
- "Is that not happening?" - You assumed without verifying
- "Will it show us...?" - You should have added evidence gathering
- "Stop guessing" - Proposing fixes without understanding
- "Ultrathink this" - Question fundamentals
- "We're stuck?" - Your approach isn't working

## Extension and Contribution

### Creating New Skills

Follow the `writing-skills` skill:
1. Use YAML frontmatter with `name` and `description`
2. Write clear, actionable content
3. Include examples (Good vs Bad)
4. Specify when to use / when not to use
5. Add checklists for systematic processes
6. Test with `testing-skills-with-subagents`

### Sharing Skills

Follow the `sharing-skills` skill:
1. Fork the repository
2. Create a branch for your skill
3. Follow skill creation guidelines
4. Validate quality with testing skill
5. Submit PR to upstream

### Plugin Installation

**Via Plugin Marketplace:**
```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

**Verify:**
```bash
/help
# Should show:
# /superpowers:brainstorm - Interactive design refinement
# /superpowers:write-plan - Create implementation plan
# /superpowers:execute-plan - Execute plan in batches
```

**Update:**
```bash
/plugin update superpowers
```

## Critical Success Factors

1. **Mandatory Skill Usage** - If skill exists, you MUST use it
2. **TDD is Non-Negotiable** - RED-GREEN-REFACTOR always
3. **Systematic Debugging** - 4 phases, no skipping
4. **Brainstorm Before Coding** - Design first, implement second
5. **TodoWrite for Checklists** - Track every checklist item
6. **Announce Skill Usage** - Transparency with human partner
7. **Follow Exactly** - Don't adapt away the discipline

## Common Failure Modes

1. **Rationalization** - "This is different because..."
2. **Skipping Steps** - "I'll test after" / "Quick fix for now"
3. **False Completion** - Marking done without verification
4. **Process Adaptation** - "Spirit not ritual" / "Being pragmatic"
5. **Checklist Mental Processing** - Not using TodoWrite
6. **Guessing vs. Investigating** - Proposing fixes before root cause

## Success Metrics

From real-world usage:
- **Systematic debugging:** 15-30 min vs 2-3 hours of thrashing
- **First-time fix rate:** 95% vs 40%
- **New bugs introduced:** Near zero vs common
- **Test coverage:** Comprehensive vs spotty
- **Rework rate:** Minimal vs frequent

## License

MIT License - See LICENSE file for details

## Support and Resources

- **Issues:** https://github.com/obra/superpowers/issues
- **Marketplace:** https://github.com/obra/superpowers-marketplace
- **Blog Post:** https://blog.fsck.com/2025/10/09/superpowers/
- **Total Skills:** 20+ and growing
