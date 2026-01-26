---
name: superpowers
displayName: Superpowers
version: 1.0.0
description: Complete software development workflow system with systematic TDD, planning, and quality gates
keywords: [development, workflow, tdd, testing, planning, code-review, debugging, git, systematic]
author: Adapted from obra/superpowers
license: MIT
---

# Superpowers for Kiro

A complete software development workflow system that transforms your coding agent into a systematic, test-driven development powerhouse.

## What is Superpowers?

Superpowers is a collection of development skills that guide your AI agent through professional software development workflows. Instead of jumping straight into code, it enforces a systematic approach:

1. **Brainstorming** - Refines ideas through questions and design validation
2. **Planning** - Creates detailed, bite-sized implementation plans
3. **Test-Driven Development** - Enforces RED-GREEN-REFACTOR cycles
4. **Subagent-Driven Development** - Uses fresh subagents for each task with quality reviews
5. **Code Review** - Systematic review processes between tasks
6. **Git Workflows** - Proper branching and worktree management

## Key Benefits

- **Systematic Development**: No more ad-hoc coding - every feature follows a proven workflow
- **Test-First Approach**: Enforces TDD with no exceptions
- **Quality Gates**: Built-in code review and spec compliance checks
- **Autonomous Execution**: Agents can work for hours following the established plan
- **Professional Workflows**: Git branching, proper documentation, incremental commits

## Core Skills Included

### Development Workflow
- **brainstorming** - Interactive design refinement before coding
- **writing-plans** - Detailed implementation plans with exact steps
- **executing-plans** - Batch execution with human checkpoints
- **subagent-driven-development** - Fresh subagents per task with reviews

### Quality Assurance
- **test-driven-development** - Strict RED-GREEN-REFACTOR enforcement
- **requesting-code-review** - Pre-review checklists and systematic reviews
- **receiving-code-review** - Structured feedback response
- **verification-before-completion** - Ensure fixes actually work

### Debugging & Problem Solving
- **systematic-debugging** - 4-phase root cause analysis
- **root-cause-tracing** - Deep investigation techniques
- **defense-in-depth** - Robust error handling patterns

### Project Management
- **using-git-worktrees** - Parallel development branches
- **finishing-a-development-branch** - Merge/PR decision workflows
- **dispatching-parallel-agents** - Concurrent subagent workflows

## How It Works

1. **Automatic Skill Triggering**: Skills activate based on context - no manual commands needed
2. **Systematic Progression**: Each skill hands off to the next in the workflow
3. **Quality Enforcement**: Multiple review stages ensure high-quality output
4. **Documentation**: Every step is documented and committed to git

## Philosophy

- **Test-Driven Development**: Write tests first, always
- **Systematic over ad-hoc**: Process over guessing  
- **Complexity reduction**: Simplicity as primary goal
- **Evidence over claims**: Verify before declaring success
- **YAGNI**: You Aren't Gonna Need It - build only what's required
- **DRY**: Don't Repeat Yourself - eliminate duplication

## Getting Started

Once installed, Superpowers works automatically. Just start describing what you want to build:

```
"I want to build a user authentication system"
```

The agent will automatically:
1. Use **brainstorming** to refine requirements
2. Use **writing-plans** to create implementation steps  
3. Use **subagent-driven-development** to execute with quality reviews
4. Follow **test-driven-development** throughout
5. Use **finishing-a-development-branch** when complete

## Example Workflow

```
User: "I need a REST API for managing tasks"

Agent: [brainstorming skill activates]
"Let me understand what you're building. What kind of tasks will this manage? 
Personal todos, project tasks, or something else?"

User: "Project tasks for a team"

Agent: "Got it. Should this integrate with existing auth, or handle its own users?"
[continues refining through questions]

Agent: [presents design in sections]
"Here's the API design so far:
- Task CRUD operations (create, read, update, delete)
- Team membership and permissions
- Task assignment and status tracking
Does this look right?"

User: "Yes, but add due dates and priorities"

Agent: [writing-plans skill activates]
"I'm creating the implementation plan..."
[saves detailed plan to docs/plans/2025-01-26-task-api-implementation.md]

Agent: [subagent-driven-development activates]
"Executing plan with subagents..."
[dispatches implementer subagent for each task]
[runs spec compliance and code quality reviews]
[continues autonomously for hours]
```

## Advanced Features

- **Condition-based waiting** for async operations
- **Root cause tracing** for complex bugs
- **Defense in depth** error handling
- **Parallel agent dispatching** for independent work
- **Git worktree management** for feature isolation

This power transforms your AI agent from a code generator into a professional development partner that follows industry best practices automatically.