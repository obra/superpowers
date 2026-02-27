# Superpowers Examples for Gemini CLI

These examples show how Superpowers skills activate and guide your work.

## Example 1: Debugging with Systematic Debugging

**Situation:** You have a null pointer exception and don't know where it comes from.

**Your request:**
```
I'm getting: "TypeError: Cannot read property 'name' of undefined" on line 42.
How do I debug this?
```

**What happens:**
1. `systematic-debugging` skill activates automatically
2. You get 4-phase methodology:
   - **Phase 1: Gather Symptoms** - Examine the error, check logs
   - **Phase 2: Form Hypothesis** - Null value suggests...
   - **Phase 3: Test Hypothesis** - Add debug output, reproduce
   - **Phase 4: Fix & Verify** - Implement fix, test thoroughly

**Result:** Methodical debugging instead of random trial-and-error.

---

## Example 2: TDD for a Calculator Function

**Situation:** You need to implement a calculator with add, subtract, multiply, divide.

**Your request:**
```
Let me implement a calculator following TDD. Start with add and multiply.
```

**What happens:**
1. `test-driven-development` skill activates
2. You follow RED-GREEN-REFACTOR:

**RED:** Write failing test
```javascript
describe('Calculator', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
  it('should multiply two numbers', () => {
    expect(multiply(2, 3)).toBe(6);
  });
});
```

Watch it fail (RED) ❌

**GREEN:** Write minimal code
```javascript
const add = (a, b) => a + b;
const multiply = (a, b) => a * b;
```

Watch it pass (GREEN) ✅

**REFACTOR:** Clean up, add error handling
```javascript
const add = (a, b) => {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Arguments must be numbers');
  }
  return a + b;
};
```

**Result:** Well-tested, maintainable code from the start.

---

## Example 3: Planning a Feature

**Situation:** User wants to add authentication to the app.

**Your request:**
```
Help me plan implementing user authentication for my app.
```

**What happens:**
1. `brainstorming` skill activates
2. Socratic refinement through questions:
   - What type of auth? (JWT, OAuth, Session-based?)
   - Database schema needed?
   - UI components required?
   - How to handle tokens?
   - Refresh token strategy?

3. After questions, `writing-plans` skill activates
4. You get detailed task breakdown:

```
Task 1: Create authentication schema
  - Add users table with password field
  - Add tokens table for session management
  - Files: migrations/001_auth_schema.sql
  - Verify: Run migrations, inspect schema

Task 2: Implement login endpoint
  - Validate credentials against users table
  - Generate JWT token
  - Return token to client
  - Files: src/auth/login.ts
  - Verify: Test with curl, check token in response

Task 3: Add authentication middleware
  - Validate token on protected routes
  - Reject invalid/expired tokens
  - Files: src/middleware/auth.ts
  - Verify: Test with and without token

[... more tasks ...]
```

Each task is 2-5 minutes with exact file paths and verification steps.

**Result:** Clear roadmap instead of vague requirements.

---

## Example 4: Code Review Workflow

**Situation:** You've completed a feature and want feedback before merging.

**Your request:**
```
I'm done with the authentication implementation.
Let me review it against the plan before merging.
```

**What happens:**
1. `requesting-code-review` skill activates
2. You get pre-review checklist:
   - Does it match the plan?
   - Are tests passing?
   - Is error handling adequate?
   - Are there edge cases?
   - Is documentation complete?

3. After pre-review, `receiving-code-review` skill activates
4. If issues found, you get guidance on:
   - Whether they're blocking
   - How to fix them
   - Verification steps

**Result:** Confident merges, fewer bugs in production.

---

## Example 5: Creating a Project-Specific Skill

**Situation:** Your project uses specific conventions you want to enforce.

**Your request:**
```
Help me create a skill for our project's authentication patterns.
```

**What happens:**
1. `writing-skills` skill activates (the meta-skill)
2. You follow TDD for documentation:
   - RED: Write a pressure test (show agent violating the rule)
   - GREEN: Write the SKILL.md that fixes it
   - REFACTOR: Tighten language, close loopholes

3. Create the skill:
```bash
mkdir -p .gemini/skills/auth-patterns
cat > .gemini/skills/auth-patterns/SKILL.md << 'EOF'
---
name: auth-patterns
description: Use when implementing authentication to follow our patterns
---

# Authentication Patterns

Our project uses JWT tokens with refresh tokens...
[Your pattern guidelines]
EOF
```

4. Restart and test:
```bash
gemini restart
gemini skills list          # Shows your new skill
gemini skills load auth-patterns
```

**Result:** Consistent patterns across the team.

---

## Example 6: Parallel Task Execution

**Situation:** You have 5 independent tasks to implement.

**Your request:**
```
I have 5 authentication-related tasks:
1. Create users table
2. Implement login endpoint
3. Implement logout endpoint
4. Add password reset
5. Add two-factor auth

Let's work on these in parallel.
```

**What happens:**
1. `subagent-driven-development` skill activates
2. For each task, a subagent:
   - Receives complete task description
   - Implements the feature
   - Self-reviews against the spec
   - Runs quality review
   - Reports completion
3. Main agent:
   - Tracks all tasks
   - Ensures no conflicts
   - Verifies final integration
   - Tests everything together

**Result:** 5 features completed efficiently with quality assurance.

---

## Common Workflow Patterns

### Pattern 1: Design → Plan → Implement → Review

```
You: "I need to add file upload"
     ↓
[brainstorming skill activates]
You: Refine requirements through Socratic questions
     ↓
[writing-plans skill activates]
You: Get detailed task breakdown
     ↓
[test-driven-development activates]
You: Implement each task with tests
     ↓
[requesting-code-review activates]
You: Review against plan before merging
```

### Pattern 2: Bug Fix Workflow

```
You: "I found a bug - users can't change their password"
     ↓
[systematic-debugging activates]
You: Follow 4-phase methodology to find root cause
     ↓
[test-driven-development activates]
You: Write test that reproduces bug (RED)
     ↓
Write fix (GREEN)
     ↓
[verification-before-completion activates]
You: Verify the fix works in all scenarios
```

### Pattern 3: Learning & Documentation

```
You: "Explain the test-driven-development skill"
     ↓
[test-driven-development skill loads]
You: Read full methodology
     ↓
You: "Show me an example"
     ↓
[Systematic examples provided]
     ↓
You: Try it yourself
```

---

## Tips for Best Results

1. **Be specific** about your task
2. **Ask for the skill** if you want it immediately
3. **Follow the guidance** completely (don't skip steps)
4. **Verify each step** before moving to the next
5. **Ask questions** if anything is unclear

## Next Steps

- Read [GEMINI.md](GEMINI.md) for skill overview
- Try each skill in a test project
- Create project-specific skills using `writing-skills`
- Check https://github.com/obra/superpowers for full documentation

Happy coding with superpowers! 🦸
