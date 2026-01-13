# Superpowers-NG (Next Generation)

**Superpowers-NG** is an enhanced fork of [obra/superpowers](https://github.com/obra/superpowers) with integrated **Manus-style persistent planning** for complex, long-running tasks.

## What's New in NG

### Manus Planning: Persistent Memory Across Context Resets

The flagship feature is `manus-planning`, a file-based planning system that survives context resets and enables multi-session work.

**Native vs Manus Planning:**

| Aspect | Native (Original) | Manus (New) |
|--------|-------------------|-------------|
| **Skills** | writing-plans + executing-plans | manus-planning |
| **Memory** | In-memory (TodoWrite) | Persistent files (`docs/manus/`) |
| **Best for** | Short tasks (<30 min), interactive development | Long autonomous runs, multi-session projects, >50 tool calls |
| **Progress tracking** | Lost on context reset | Survives context resets |
| **Research storage** | Embedded in conversation | Persistent `findings.md` |

**The 3 Files:**
- `task_plan.md` - Goal, 5 phases, decisions, errors
- `findings.md` - Requirements, research, resources (CRITICAL for visual/browser content)
- `progress.md` - Session log, test results, 5-question reboot check

**When to use Manus:**
- Tasks requiring >50 tool calls
- Multi-session projects spanning days
- Complex research with web searches/images
- When context might reset mid-task

**How it works:**
1. Create marker file `docs/manus/.active` to enable PreToolUse hooks
2. Hooks automatically show plan preview before Write/Edit/Bash operations
3. 2-Action Rule: Update `findings.md` after every 2 search/view operations
4. On completion: Remove marker, invoke `finishing-a-development-branch`

**Brainstorming integration:**
After design completion, brainstorming now offers both planning options. For Manus, design content is automatically copied into `findings.md`.

## How It Works (Original Superpowers)

Superpowers is a complete software development workflow for your coding agents, built on composable "skills" that trigger automatically.

When you start building something, your agent:
1. **Asks questions** to understand what you're really trying to do
2. **Shows the design** in digestible chunks for your approval
3. **Creates an implementation plan** clear enough for a junior engineer to follow
4. **Executes autonomously** through subagent-driven development

The core philosophy: **Test-Driven Development**, **YAGNI**, **DRY**, and **systematic over ad-hoc**.

## Installation

**Note:** Installation instructions will be updated once the marketplace is configured.

### Claude Code (Planned)

```bash
# Will be available via marketplace:
/plugin marketplace add OniReimu/superpowers-ng-marketplace
/plugin install superpowers-ng@superpowers-ng-marketplace
```

### Manual Installation (Current)

```bash
# Clone the repository
git clone https://github.com/OniReimu/superpowers.git
cd superpowers

# Install as a local plugin
# (Instructions TBD based on Claude Code local plugin support)
```

### Verify Installation

Check that commands appear:

```bash
/help
```

You should see:
```
/superpowers-ng:brainstorm - Interactive design refinement
/superpowers-ng:write-plan - Create implementation plan
/superpowers-ng:execute-plan - Execute plan in batches
/superpowers-ng:manus-plan - Start Manus-style persistent planning
```

## The Enhanced Workflow

1. **brainstorming** - Refines rough ideas, presents design in sections. Saves design document.

2. **using-git-worktrees** - Creates isolated workspace on new branch.

3. **Choose your planning system:**
   - **Native:** `writing-plans` → `executing-plans` for short tasks
   - **Manus:** `manus-planning` for complex/long-running tasks

4. **subagent-driven-development** or **executing-plans** - Implements with two-stage review or batch execution.

5. **test-driven-development** - Enforces RED-GREEN-REFACTOR cycle.

6. **requesting-code-review** - Reviews against plan between tasks.

7. **finishing-a-development-branch** - Verifies tests, presents merge options.

## What's Inside

### Planning Skills

**Native Planning (Original)**
- **writing-plans** - Bite-sized implementation plans
- **executing-plans** - Batch execution with checkpoints

**Manus Planning (New)**
- **manus-planning** - 5-phase workflow with persistent files
  - Phase 1: Requirements & Discovery
  - Phase 2: Planning & Structure
  - Phase 3: Implementation
  - Phase 4: Testing & Verification
  - Phase 5: Delivery

### Testing

- **test-driven-development** - RED-GREEN-REFACTOR cycle (includes testing anti-patterns reference)

### Debugging

- **systematic-debugging** - 4-phase root cause process (includes root-cause-tracing, defense-in-depth, condition-based-waiting techniques)
- **verification-before-completion** - Ensure it's actually fixed

### Collaboration

- **brainstorming** - Socratic design refinement (enhanced with planning choice)
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review

### Meta

- **writing-skills** - Create new skills following best practices
- **using-superpowers** - Introduction to the skills system (updated with planning guidance)

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success
- **Persistent memory** (New) - Filesystem as external memory for long tasks

## Integration with Ralph

Superpowers-NG works seamlessly with [Ralph](https://github.com/frankbria/ralph-claude-code), the autonomous loop framework for Claude Code.

**Ralph provides**: Loop orchestration, session management, exit detection, rate limiting

**Superpowers-NG provides**: Development methodologies, TDD discipline, debugging workflows, persistent planning

**Key features for Ralph users**:
- **brainstorming** now auto-detects existing designs and skips in subsequent loops
- **manus-planning** designed for multi-loop persistence with auto-resume
- **verification-before-completion** ensures evidence-based exit signals
- Skills are autonomous-mode aware (no waiting for user input)

**Get started**:
```bash
# Copy enhanced PROMPT.md template to your Ralph project
cp docs/ralph-integration/PROMPT.template.md /path/to/ralph-project/PROMPT.md
```

See `docs/ralph-integration/README.md` for complete integration guide.

## Contributing

Skills live directly in this repository. To contribute:

1. Fork the repository
2. Create a branch for your skill
3. Follow the `writing-skills` skill for creating and testing new skills
4. Submit a PR

See `skills/writing-skills/SKILL.md` for the complete guide.

## Credits

### Original Authors

- **Jesse Vincent (obra)** - [obra/superpowers](https://github.com/obra/superpowers)
  - Original Superpowers framework and skills system

- **Ahmad Othman Ammar Adi (OthmanAdi)** - [planning-with-files](https://github.com/OthmanAdi/planning-with-files)
  - Manus-style 3-file planning pattern

### Superpowers-NG

- **OniReimu** - Integration and enhancement

### Inspiration

- Manus AI (acquired by Meta) - Context engineering principles
- [Superpowers blog post](https://blog.fsck.com/2025/10/09/superpowers/)

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/OniReimu/superpowers/issues
- **Original Superpowers**: https://github.com/obra/superpowers
- **Planning-with-files**: https://github.com/OthmanAdi/planning-with-files
