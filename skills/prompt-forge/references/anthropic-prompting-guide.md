# Anthropic Prompting Best Practices — Quick Reference for Prompt Forge

This reference distills Anthropic's official prompting documentation into actionable patterns for Claude Code prompt construction. Read this when you need deeper guidance beyond what's in the main SKILL.md.

## Table of Contents
1. Core Principles
2. Structuring with XML Tags
3. Few-Shot Examples
4. Chain of Thought
5. Long Context Handling
6. Agentic/Claude Code-Specific Patterns
7. Grounding: The Anti-Hallucination Layer
8. Common Anti-Patterns
9. CLAUDE.md Best Practices

---

## 1. Core Principles

**Clarity wins.** Claude responds to clear, explicit instructions. Vagueness produces vague results. The golden rule from Anthropic: show your prompt to a colleague with minimal context. If they'd be confused, Claude will be too.

**Context improves everything.** Providing motivation or background behind an instruction helps Claude make better judgment calls. Instead of "validate the input," say "validate the input — we've had injection attacks on this endpoint before, so be thorough with sanitization."

**Specificity over length.** A short, specific prompt outperforms a long, vague one. "Refactor `processOrder()` in `src/orders/handler.ts` to use async/await instead of callbacks. Preserve the error handling behavior." beats "Clean up the order processing code."

---

## 2. Structuring with XML Tags

For complex prompts, XML tags help Claude parse different sections unambiguously. This is especially useful when mixing instructions, context, and constraints.

**Pattern:**
```
<context>
We're building a REST API in Express + TypeScript. The auth layer uses JWT tokens stored in HTTP-only cookies.
</context>

<task>
Add rate limiting to the /api/login endpoint. Limit to 5 attempts per IP per 15-minute window.
</task>

<constraints>
- Use the existing Redis connection in src/lib/redis.ts
- Don't add new dependencies — use redis directly
- Preserve the existing error response format
</constraints>

<verification>
Run `npm test -- --grep "rate limit"` after implementation.
Write a new test if none exists for this endpoint.
</verification>
```

Use consistent, descriptive tag names. Nest when there's a natural hierarchy.

---

## 3. Few-Shot Examples

When you want Claude Code to follow a specific pattern, include examples. Anthropic recommends 3-5 examples for best results.

**When to suggest examples in prompts:**
- Commit message formatting
- Code style / naming conventions
- API response structures
- Error handling patterns

**Pattern:**
```
Follow the existing error handling pattern in this codebase:

<example>
Input: Database connection fails
Output: Throw an AppError with code DB_CONNECTION_FAILED, log the original error with context, return 503 to client
</example>

<example>
Input: User input validation fails
Output: Throw a ValidationError with field-level details, no logging needed, return 422 with error details
</example>
```

---

## 4. Chain of Thought

For complex decisions, ask Claude to think through its approach before coding. This is especially valuable for architecture decisions and debugging.

**Pattern for prompts:**
- "Before making changes, explain your approach and which files you'll modify."
- "Think through the edge cases first, then implement."
- "Analyze the current implementation, identify the bug, explain what's wrong, then fix it."

This naturally aligns with Claude Code's plan mode (Shift+Tab to toggle).

---

## 5. Long Context Handling

When providing large files or multiple documents as context:

- **Put longform data at the top** of the prompt, above your instructions. Anthropic's testing shows this can improve response quality by up to 30%.
- **Queries at the end** perform best with complex, multi-document inputs.
- **Reference specific locations** rather than relying on Claude to find things: "In the `handleAuth` function starting around line 45 of `auth.ts`" is better than "somewhere in the auth code."

---

## 6. Agentic / Claude Code-Specific Patterns

These are patterns from Anthropic's own engineering teams and the Claude Code documentation:

### Give Claude a feedback loop
The single highest-impact pattern. Tell Claude to verify its own work:
- "Run the existing test suite after making changes. Fix any failures before calling it done."
- "Run `npm run lint` after changes and fix any issues."
- "After implementing, check that the TypeScript compiler reports no errors."

Anthropic's team reports 2-3x quality improvement from this alone.

### Use @ references and explicit paths
- `@src/middleware/auth.ts` instead of "the auth middleware"
- Paste screenshots/images directly for UI work
- Give URLs for API documentation

### Session management
- Start fresh sessions for distinct tasks (`/clear`)
- Sessions degrade because accumulated context drowns current instructions
- If corrections exceed two attempts, restart with a clearer prompt

### Plan mode for complex work
- Use for multi-file changes, unfamiliar code, and architectural decisions
- Skip for small, single-file tasks
- Toggle with Shift+Tab

### Subagents for parallel work
- Include "use subagents" in the prompt for tasks that can be parallelized
- Make subagents feature-specific ("frontend component agent") not generic ("QA agent")

---

## 7. Grounding: The Anti-Hallucination Layer

Grounding is what separates a mediocre prompt from a bulletproof one. An ungrounded prompt says "refactor the auth middleware." A grounded prompt says "refactor the `authenticateRequest()` middleware in `@src/middleware/auth.ts` — it currently takes `(req, res, next)` and calls `jwt.verify()` with the secret from `process.env.JWT_SECRET`."

### Why grounding matters

Claude Code is powerful but trusting. If your prompt says "modify the `handlePayment()` function in `payments.ts`" and the function is actually called `processPayment()` in `payment-handler.ts`, Claude will either:
- Create a new function called `handlePayment()` (now you have dead code)
- Modify the wrong file
- Get confused and waste time searching

Grounding eliminates this entire category of failure.

### Code grounding checklist

Before the prompt references ANY code artifact, verify:
- [ ] File path exists and is spelled correctly
- [ ] Function/method name matches the actual declaration
- [ ] Parameter names and types match the signature
- [ ] Import paths match what the codebase uses
- [ ] The pattern you're referencing as an example actually works that way
- [ ] Test commands you include actually exist in package.json / Makefile / etc.

### Research grounding checklist

Before the prompt recommends ANY external approach, verify:
- [ ] The API/method is not deprecated in the project's version
- [ ] The recommended package is compatible with the project's runtime
- [ ] The pattern works with the project's existing architecture
- [ ] Security recommendations are current (not from an old advisory)

### Common grounding failures

| Failure | What happens | Fix |
|---------|-------------|-----|
| Wrong function name | Claude creates duplicate or edits wrong function | Read the actual file |
| Wrong file path | Claude searches, wastes tokens, might create new file | Check directory structure |
| Outdated API reference | Claude uses deprecated method, code breaks at runtime | Search current docs |
| Wrong test command | Feedback loop fails, Claude can't verify its work | Check package.json scripts |
| Assumed patterns | Claude follows imagined convention, code looks foreign | Read 2-3 existing examples |

---

## 8. Common Anti-Patterns (What Makes Prompts Fail)

**Vague scope:** "Fix the bugs" → Claude doesn't know which bugs, what priority, or when to stop.

**Missing success criteria:** "Add caching" → Cached where? What eviction strategy? How to verify it works?

**No constraints:** "Refactor the API" → Claude might rewrite everything including things you wanted preserved.

**Compound tasks without structure:** "Add auth, write tests, update the docs, and deploy" → Break into steps or use plan mode.

**Assuming Claude knows your codebase:** Even with CLAUDE.md, be explicit about which files, which patterns, which conventions for the current task.

**Over-prompting simple tasks:** "Please fix the typo on line 12 of README.md" doesn't need five sections of context. Match prompt complexity to task complexity.

---

## 9. CLAUDE.md Best Practices

From Anthropic's documentation and internal team usage:

**What belongs in CLAUDE.md:**
- Build, test, and lint commands
- Code style and naming conventions
- Architecture overview and key patterns
- Framework-specific decisions ("we use server components, not client-side rendering")
- Branch and PR conventions
- Common gotchas in the codebase

**What does NOT belong in CLAUDE.md:**
- Task-specific instructions (put these in your prompts)
- Anything Claude can infer from reading the code
- Overly rigid rules that don't explain why

**Sizing guidance:**
- Keep CLAUDE.md under 150 lines of meaningful instructions
- Claude Code's system prompt uses ~50 of the available ~200 instruction slots
- If you have many rules, split into `.claude/rules/` files that load on demand
- Use `<critical>` tags for rules that must never be ignored

**From Anthropic's Data Infrastructure team:**
"The better you document your workflows, tools, and expectations in CLAUDE.md files, the better Claude Code performs. This made Claude Code excel at routine tasks like setting up new data pipelines when you have existing patterns."
