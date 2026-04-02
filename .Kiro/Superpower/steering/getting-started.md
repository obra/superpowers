---
name: getting-started
description: Introduction to using Superpowers workflow system
inclusion: manual
---

# Getting Started with Superpowers

## What is Superpowers?

Superpowers transforms your AI coding assistant into a systematic development partner that follows professional workflows automatically. Instead of jumping straight into code, it guides you through a proven process.

## The Automatic Workflow

When you describe what you want to build, Superpowers automatically:

1. **Brainstorming** - Asks clarifying questions to understand requirements
2. **Design Validation** - Presents design in reviewable sections
3. **Git Worktrees** - Creates isolated workspace for development
4. **Implementation Planning** - Breaks work into bite-sized, testable tasks
5. **Subagent Execution** - Uses fresh subagents for each task with quality reviews
6. **Test-Driven Development** - Enforces RED-GREEN-REFACTOR throughout
7. **Code Review** - Systematic review between tasks
8. **Branch Completion** - Handles merge/PR decisions

## Example: Building a Feature

```
You: "I need a user authentication system for my web app"

Agent: [brainstorming activates automatically]
"Let me understand what you're building. What type of authentication do you need? 
- Email/password login
- Social login (Google, GitHub, etc.)  
- Multi-factor authentication
- Or something else?"

You: "Email/password with optional 2FA"

Agent: "Got it. Should this integrate with an existing user database, or create its own?"
[continues asking focused questions]

Agent: [presents design in sections]
"Here's the authentication system design:

**Core Components:**
- User registration with email verification
- Secure password hashing (bcrypt)
- JWT token-based sessions
- Optional TOTP-based 2FA
- Password reset flow

Does this approach look right so far?"

You: "Yes, but add rate limiting for login attempts"

Agent: [git-worktrees activates]
"Creating isolated workspace for development..."
[creates feature branch and worktree]

Agent: [writing-plans activates]  
"Creating detailed implementation plan..."
[saves plan to docs/plans/2025-01-26-auth-system-implementation.md]

Agent: [subagent-driven-development activates]
"Executing plan with subagents..."
[dispatches implementer for each task]
[runs spec compliance and code quality reviews]
[continues autonomously following TDD]
```

## Key Principles

**Test-Driven Development (TDD):**
- Write failing test first
- Watch it fail
- Write minimal code to pass
- Refactor while keeping tests green

**YAGNI (You Aren't Gonna Need It):**
- Build only what's specified
- No extra features "just in case"
- Simplicity over complexity

**DRY (Don't Repeat Yourself):**
- Eliminate code duplication
- Extract common patterns
- Reuse existing solutions

## Skills Work Together

Each skill hands off to the next:
- **brainstorming** → **git-worktrees** → **writing-plans** → **subagent-driven-development**
- **test-driven-development** runs throughout implementation
- **code-review** happens between tasks
- **systematic-debugging** activates when issues arise

## Getting the Most from Superpowers

**Be specific about requirements:**
- "I need user auth" → Agent asks clarifying questions
- "I need email/password auth with 2FA and rate limiting" → Agent can design immediately

**Trust the process:**
- Let brainstorming refine your idea fully before coding
- Don't skip the planning phase
- Follow TDD even when it feels slow initially

**Provide feedback:**
- Review design sections carefully
- Answer clarifying questions thoroughly
- Approve plans before implementation starts

## What Makes This Different

**Traditional AI coding:**
- Jumps straight to implementation
- Writes code without tests
- No systematic review process
- Hard to maintain or extend

**Superpowers approach:**
- Understands requirements first
- Plans before implementing
- Tests drive development
- Multiple quality gates
- Professional workflows

The result: Higher quality code that's maintainable, tested, and built to specification.

## Next Steps

Just start describing what you want to build. The skills will activate automatically and guide you through the process. No commands to remember, no manual workflow management - just professional development practices applied systematically.